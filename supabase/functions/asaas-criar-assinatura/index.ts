// ============================================================================
// asaas-criar-assinatura
// Cria/atualiza customer no Asaas + cria subscription recorrente
// Input: { oficina_id, plano, valor, ciclo?, forma_pagamento?, cartao?, titular? }
// Output: { assinatura, invoice_url, subscription_id }
// ============================================================================

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

const ASAAS_BASE = Deno.env.get("ASAAS_BASE_URL") ?? "https://sandbox.asaas.com/api/v3";
const ASAAS_KEY = Deno.env.get("ASAAS_API_KEY") ?? "";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "content-type": "application/json" },
  });
}

async function asaas(path: string, init: RequestInit = {}) {
  const res = await fetch(`${ASAAS_BASE}${path}`, {
    ...init,
    headers: {
      ...(init.headers || {}),
      "access_token": ASAAS_KEY,
      "content-type": "application/json",
      "User-Agent": "RPM-Pro/1.0",
    },
  });
  const text = await res.text();
  const data = text ? JSON.parse(text) : {};
  if (!res.ok) {
    throw new Error(`Asaas ${res.status}: ${text}`);
  }
  return data;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);

  // Auth: usuário precisa estar logado
  const authHeader = req.headers.get("authorization") ?? "";
  const jwt = authHeader.replace("Bearer ", "");
  if (!jwt) return json({ error: "unauthorized" }, 401);

  const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
  const { data: userData, error: userErr } = await sb.auth.getUser(jwt);
  if (userErr || !userData?.user) return json({ error: "unauthorized" }, 401);

  const body = await req.json().catch(() => ({}));
  const { oficina_id, plano, valor, ciclo = "MONTHLY", forma_pagamento = "UNDEFINED" } = body;

  if (!oficina_id || !plano || !valor) {
    return json({ error: "missing_fields", campos: "oficina_id, plano, valor" }, 400);
  }

  // Verifica se o user pertence à oficina OU é platform admin
  const { data: perfil } = await sb
    .from("profiles")
    .select("oficina_id, role")
    .eq("user_id", userData.user.id)
    .single();

  const isPlatformAdmin = perfil?.oficina_id === "aaaa0001-0000-0000-0000-000000000001"
    && perfil?.role === "dono";
  if (!isPlatformAdmin && perfil?.oficina_id !== oficina_id) {
    return json({ error: "forbidden" }, 403);
  }

  // Busca oficina
  const { data: oficina, error: ofErr } = await sb
    .from("oficinas")
    .select("id, nome, cnpj, email, telefone, whatsapp, asaas_customer_id")
    .eq("id", oficina_id)
    .single();
  if (ofErr || !oficina) return json({ error: "oficina_not_found" }, 404);

  try {
    // 0. Deduplicação: se já existe assinatura ativa/atrasada/suspensa, devolve a cobrança pendente
    const { data: existente } = await sb
      .from("assinaturas")
      .select("*")
      .eq("oficina_id", oficina_id)
      .in("status", ["pendente", "ativa", "atrasada", "suspensa"])
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (existente && existente.plano === plano) {
      let invoiceUrl: string | null = null;
      try {
        const payments = await asaas(`/payments?subscription=${existente.asaas_subscription_id}&status=PENDING&limit=1`);
        if (payments?.data?.[0]) {
          invoiceUrl = payments.data[0].invoiceUrl ?? payments.data[0].bankSlipUrl ?? null;
        }
      } catch (_) {}
      return json({ ok: true, assinatura: existente, subscription_id: existente.asaas_subscription_id, invoice_url: invoiceUrl, duplicado: true });
    }

    // 1. Garante customer no Asaas
    let customerId = oficina.asaas_customer_id;
    if (!customerId) {
      const customer = await asaas("/customers", {
        method: "POST",
        body: JSON.stringify({
          name: oficina.nome,
          cpfCnpj: (oficina.cnpj ?? "").replace(/\D/g, "") || undefined,
          email: oficina.email ?? undefined,
          mobilePhone: (oficina.whatsapp ?? oficina.telefone ?? "").replace(/\D/g, "") || undefined,
          externalReference: oficina.id,
        }),
      });
      customerId = customer.id;
      await sb.from("oficinas").update({ asaas_customer_id: customerId }).eq("id", oficina.id);
    }

    // 2. Cria subscription (vencimento = hoje + 7 dias)
    const nextDue = new Date();
    nextDue.setDate(nextDue.getDate() + 7);
    const nextDueISO = nextDue.toISOString().slice(0, 10);

    const subscription = await asaas("/subscriptions", {
      method: "POST",
      body: JSON.stringify({
        customer: customerId,
        billingType: forma_pagamento,      // CREDIT_CARD, PIX, BOLETO, UNDEFINED (cliente escolhe)
        value: Number(valor),
        nextDueDate: nextDueISO,
        cycle: ciclo,                      // MONTHLY / YEARLY
        description: `RPM Pro - Plano ${plano}`,
        externalReference: `rpm:${oficina.id}`,
      }),
    });

    // 3. Salva assinatura como PENDENTE. Webhook PAYMENT_CONFIRMED/RECEIVED ativa a oficina depois.
    const { data: assinatura, error: assErr } = await sb
      .from("assinaturas")
      .insert({
        oficina_id: oficina.id,
        asaas_customer_id: customerId,
        asaas_subscription_id: subscription.id,
        plano,
        valor: Number(valor),
        ciclo,
        forma_pagamento,
        status: "pendente",
        proximo_vencimento: nextDueISO,
      })
      .select()
      .single();
    if (assErr) throw assErr;

    // 4. NÃO tocar na oficina — trial continua valendo até o pagamento ser confirmado pelo webhook.

    // 5. Busca primeira cobrança (link de pagamento)
    let invoiceUrl: string | null = null;
    try {
      const payments = await asaas(`/payments?subscription=${subscription.id}&limit=1`);
      if (payments?.data?.[0]) {
        invoiceUrl = payments.data[0].invoiceUrl ?? payments.data[0].bankSlipUrl ?? null;
      }
    } catch (_) { /* sem cobrança ainda - ok */ }

    return json({ ok: true, assinatura, subscription_id: subscription.id, invoice_url: invoiceUrl });
  } catch (e) {
    console.error("[asaas-criar-assinatura]", e);
    return json({ error: "asaas_error", message: String(e instanceof Error ? e.message : e) }, 500);
  }
});
