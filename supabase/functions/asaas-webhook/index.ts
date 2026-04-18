// ============================================================================
// asaas-webhook
// Recebe eventos do Asaas e atualiza assinaturas + oficinas.status_pagamento
// verify_jwt = false (Asaas não manda JWT)
// Segurança: valida header asaas-access-token (configurado no painel)
// ============================================================================

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const WEBHOOK_TOKEN = Deno.env.get("ASAAS_WEBHOOK_TOKEN") ?? "";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "content-type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);

  // Validação do token (Asaas envia o header configurado no painel)
  if (WEBHOOK_TOKEN) {
    const recv = req.headers.get("asaas-access-token") ?? "";
    if (recv !== WEBHOOK_TOKEN) return json({ error: "invalid_token" }, 401);
  }

  const payload = await req.json().catch(() => null);
  if (!payload) return json({ error: "invalid_payload" }, 400);

  const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  const evento = payload.event as string;
  const payment = payload.payment ?? {};
  const subscriptionId = payment.subscription ?? payload.subscription?.id ?? null;
  const customerId = payment.customer ?? payload.customer ?? null;
  const eventoId = payload.id ?? `${evento}:${payment.id ?? ""}:${payment.status ?? ""}:${payment.paymentDate ?? payment.dueDate ?? ""}`;

  // Log/idempotência
  const { data: existente } = await sb
    .from("asaas_eventos")
    .select("id, processado")
    .eq("asaas_event_id", eventoId)
    .maybeSingle();

  if (existente?.processado) return json({ ok: true, duplicado: true });

  const { data: logRow } = await sb
    .from("asaas_eventos")
    .insert({
      asaas_event_id: eventoId,
      tipo: evento,
      payment_id: payment.id ?? null,
      subscription_id: subscriptionId,
      customer_id: customerId,
      payload,
    })
    .select("id")
    .single();

  try {
    // Busca assinatura pelo subscription_id
    let assinatura: any = null;
    if (subscriptionId) {
      const { data } = await sb
        .from("assinaturas")
        .select("*, oficinas(id)")
        .eq("asaas_subscription_id", subscriptionId)
        .maybeSingle();
      assinatura = data;
    }

    if (!assinatura) {
      // evento sem assinatura conhecida (ex: cobrança avulsa) - só loga e ignora
      await sb.from("asaas_eventos").update({ processado: true, erro: "sem_assinatura" }).eq("id", logRow!.id);
      return json({ ok: true, ignorado: true });
    }

    const oficinaId = assinatura.oficina_id;

    // Roteamento de eventos
    switch (evento) {
      case "PAYMENT_CONFIRMED":
      case "PAYMENT_RECEIVED":
      case "PAYMENT_RECEIVED_IN_CASH": {
        // Pagamento confirmado -> assinatura ativa, oficina ativa, zera atraso
        const creditCard = payment.creditCard ?? {};
        await sb.from("assinaturas").update({
          status: "ativa",
          forma_pagamento: payment.billingType ?? assinatura.forma_pagamento,
          ultimo_pagamento_em: new Date().toISOString(),
          proximo_vencimento: payment.nextDueDate ?? assinatura.proximo_vencimento,
          cartao_ultimos_digitos: creditCard.creditCardNumber ?? assinatura.cartao_ultimos_digitos,
          cartao_bandeira: creditCard.creditCardBrand ?? assinatura.cartao_bandeira,
        }).eq("id", assinatura.id);

        await sb.from("oficinas").update({
          status_pagamento: "ativo",
          plano: assinatura.plano,
          trial_ate: null,
          ativo: true,
          dias_atraso: 0,
          bloqueado_em: null,
        }).eq("id", oficinaId);
        break;
      }

      case "PAYMENT_OVERDUE": {
        await sb.from("assinaturas").update({ status: "atrasada" }).eq("id", assinatura.id);
        // dias_atraso será atualizado pelo job diário
        await sb.from("oficinas").update({
          status_pagamento: "atrasado",
          dias_atraso: 1,
        }).eq("id", oficinaId);
        break;
      }

      case "PAYMENT_DELETED":
      case "PAYMENT_REFUNDED":
      case "PAYMENT_CHARGEBACK_REQUESTED":
      case "PAYMENT_CHARGEBACK_DISPUTE": {
        // Cobrança problemática - suspende
        await sb.from("assinaturas").update({ status: "suspensa" }).eq("id", assinatura.id);
        await sb.from("oficinas").update({
          status_pagamento: "atrasado",
        }).eq("id", oficinaId);
        break;
      }

      case "SUBSCRIPTION_DELETED":
      case "SUBSCRIPTION_INACTIVATED": {
        await sb.from("assinaturas").update({ status: "cancelada" }).eq("id", assinatura.id);
        await sb.from("oficinas").update({
          status_pagamento: "cancelado",
          ativo: false,
          bloqueado_em: new Date().toISOString(),
        }).eq("id", oficinaId);
        break;
      }

      case "SUBSCRIPTION_UPDATED": {
        // cliente trocou cartão/forma - só atualiza forma_pagamento se vier
        const sub = payload.subscription ?? {};
        if (sub.billingType) {
          await sb.from("assinaturas").update({
            forma_pagamento: sub.billingType,
            valor: sub.value ?? assinatura.valor,
            proximo_vencimento: sub.nextDueDate ?? assinatura.proximo_vencimento,
          }).eq("id", assinatura.id);
        }
        break;
      }

      default:
        // evento desconhecido - loga mas não falha
        break;
    }

    await sb.from("asaas_eventos").update({ processado: true }).eq("id", logRow!.id);
    return json({ ok: true });
  } catch (e) {
    const msg = String(e instanceof Error ? e.message : e);
    console.error("[asaas-webhook]", msg);
    await sb.from("asaas_eventos").update({ erro: msg }).eq("id", logRow!.id);
    return json({ error: "processing_error", message: msg }, 500);
  }
});
