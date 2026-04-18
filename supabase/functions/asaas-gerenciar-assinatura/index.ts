// asaas-gerenciar-assinatura (RPM Pro)
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
function json(b: unknown, s = 200) {
  return new Response(JSON.stringify(b), { status: s, headers: { ...corsHeaders, "content-type": "application/json" } });
}
async function asaas(path: string, init: RequestInit = {}) {
  const res = await fetch(`${ASAAS_BASE}${path}`, {
    ...init,
    headers: { ...(init.headers || {}), "access_token": ASAAS_KEY, "content-type": "application/json", "User-Agent": "RPM-Pro/1.0" },
  });
  const text = await res.text();
  const data = text ? JSON.parse(text) : {};
  if (!res.ok) throw new Error(`Asaas ${res.status}: ${text}`);
  return data;
}
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);
  const jwt = (req.headers.get("authorization") ?? "").replace("Bearer ", "");
  if (!jwt) return json({ error: "unauthorized" }, 401);
  const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
  const { data: u, error: ue } = await sb.auth.getUser(jwt);
  if (ue || !u?.user) return json({ error: "unauthorized" }, 401);
  const body = await req.json().catch(() => ({}));
  const { action, assinatura_id } = body;
  if (!action || !assinatura_id) return json({ error: "missing_fields", campos: "action, assinatura_id" }, 400);
  const { data: a } = await sb.from("assinaturas").select("*").eq("id", assinatura_id).single();
  if (!a) return json({ error: "assinatura_not_found" }, 404);
  const { data: perfil } = await sb.from("profiles").select("oficina_id,role").eq("user_id", u.user.id).single();
  const isPlatformAdmin = perfil?.oficina_id === "aaaa0001-0000-0000-0000-000000000001" && perfil?.role === "dono";
  if (!isPlatformAdmin) {
    if (perfil?.oficina_id !== a.oficina_id) return json({ error: "forbidden" }, 403);
    if (perfil?.role !== "dono") return json({ error: "forbidden_role" }, 403);
  }
  try {
    if (action === "cancelar") {
      await asaas(`/subscriptions/${a.asaas_subscription_id}`, { method: "DELETE" });
      await sb.from("assinaturas").update({ status: "cancelada" }).eq("id", a.id);
      await sb.from("oficinas").update({ status_pagamento: "cancelado", bloqueado_em: new Date().toISOString() }).eq("id", a.oficina_id);
      return json({ ok: true, cancelada: true });
    }
    if (action === "proxima_cobranca") {
      const ps = await asaas(`/payments?subscription=${a.asaas_subscription_id}&status=PENDING&limit=1`);
      const p = ps?.data?.[0];
      if (!p) return json({ error: "sem_cobranca_pendente", message: "Não há cobrança pendente no momento." }, 404);
      return json({ ok: true, invoice_url: p.invoiceUrl ?? p.bankSlipUrl, due_date: p.dueDate, value: p.value });
    }
    return json({ error: "action_invalida" }, 400);
  } catch (e) {
    console.error("[rpm-gerenciar]", e);
    return json({ error: "asaas_error", message: String(e instanceof Error ? e.message : e) }, 500);
  }
});
