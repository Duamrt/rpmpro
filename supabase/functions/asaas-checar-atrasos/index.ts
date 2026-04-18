// ============================================================================
// asaas-checar-atrasos
// Job diário (pg_cron 8h): calcula dias_atraso, bloqueia inadimplentes > 7 dias,
// dispara WhatsApp nos dias 1, 3 e 6 de atraso.
// ============================================================================

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const WA_TOKEN = Deno.env.get("WHATSAPP_API_TOKEN") ?? "";
const WA_PHONE_ID = Deno.env.get("WHATSAPP_PHONE_ID") ?? "";

const GRACE_DAYS = 7;
const AVISO_DIAS = [1, 3, 6];
const WA_SUPORTE = "5587981456565";

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

async function enviarWhatsApp(telefone: string, mensagem: string) {
  if (!WA_TOKEN || !WA_PHONE_ID) {
    console.log(`[WA mock] ${telefone}: ${mensagem}`);
    return { ok: true, mock: true };
  }
  const url = `https://graph.facebook.com/v18.0/${WA_PHONE_ID}/messages`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "authorization": `Bearer ${WA_TOKEN}`, "content-type": "application/json" },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to: telefone.replace(/\D/g, ""),
      type: "text",
      text: { body: mensagem },
    }),
  });
  return { ok: res.ok, status: res.status };
}

const CRON_SECRET = Deno.env.get("CRON_SECRET") ?? "";

Deno.serve(async (req) => {
  if (req.method !== "POST" && req.method !== "GET") return json({ error: "method_not_allowed" }, 405);

  // Proteção: exige header x-cron-secret
  if (CRON_SECRET) {
    const recv = req.headers.get("x-cron-secret") ?? "";
    if (recv !== CRON_SECRET) return json({ error: "unauthorized" }, 401);
  }

  const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  // 1. Busca oficinas com assinatura em atraso OU suspensa
  const { data: assinaturas, error } = await sb
    .from("assinaturas")
    .select("id, oficina_id, plano, valor, proximo_vencimento, status, oficinas(id, nome, whatsapp, telefone, status_pagamento, dias_atraso)")
    .in("status", ["atrasada", "suspensa"]);

  if (error) return json({ error: "fetch_failed", message: error.message }, 500);

  const resultados: any[] = [];

  for (const a of assinaturas || []) {
    const of: any = (a as any).oficinas;
    if (!of) continue;

    const venc = a.proximo_vencimento ? new Date(a.proximo_vencimento + "T00:00:00") : null;
    if (!venc) continue;

    const diff = Math.floor((hoje.getTime() - venc.getTime()) / 86400000);
    const diasAtraso = Math.max(0, diff);

    // Atualiza dias_atraso na oficina
    const updates: any = { dias_atraso: diasAtraso };

    if (diasAtraso > GRACE_DAYS) {
      // Bloqueia
      updates.status_pagamento = "bloqueado";
      updates.ativo = false;
      updates.bloqueado_em = new Date().toISOString();
    } else if (diasAtraso > 0) {
      updates.status_pagamento = "atrasado";
    }

    if (Object.keys(updates).length > 0) {
      await sb.from("oficinas").update(updates).eq("id", of.id);
    }

    // Dispara WhatsApp nos dias 1, 3, 6
    if (AVISO_DIAS.includes(diasAtraso) && of.whatsapp) {
      const msg = `Olá, ${of.nome}!\n\nSua assinatura do RPM Pro está com ${diasAtraso} dia(s) de atraso (${a.plano} - R$ ${Number(a.valor).toFixed(2)}).\n\nRegularize em: https://rpmpro.com.br/v2/meu-plano-v2.html\n\nAcesso será bloqueado após ${GRACE_DAYS} dias de atraso. Dúvidas: wa.me/${WA_SUPORTE}`;
      const r = await enviarWhatsApp(of.whatsapp, msg);
      resultados.push({ oficina: of.nome, dias: diasAtraso, aviso: true, wa: r });
    } else {
      resultados.push({ oficina: of.nome, dias: diasAtraso, aviso: false, bloqueado: diasAtraso > GRACE_DAYS });
    }
  }

  return json({ ok: true, processadas: resultados.length, resultados });
});
