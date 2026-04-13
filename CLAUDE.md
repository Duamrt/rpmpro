# RPM Pro — SaaS para Oficinas Mecânicas

Sempre responda em português brasileiro.

## Projeto
- **Stack:** HTML + CSS + JS vanilla + Supabase (PostgreSQL)
- **Deploy:** `./deploy.sh "mensagem"` → rpmpro.com.br (GitHub Pages, branch main)
- **Branches:** dev → main
- **Servidor local:** `npx serve -s .`
- **Supabase:** roeeyypssutzfzzkypsq.supabase.co

## CRÍTICO — Estrutura
- **SEMPRE editar `~/rpmpro/v2/`** — nunca a raiz (V1 legado, não usar)
- `rpmpro-v2/` (sem git) NÃO existe — só `~/rpmpro/v2/`
- `v2/index.html` é redirect puro → `kanban-v2.html`
- **kanban-v2.html é standalone** — tem suas próprias funções pdfOS, pdfRecibo, pdfMecanico. Não usa os.js/pdf-os.js

## Multi-tenant
- Tenant = `oficina_id` na tabela `oficinas`
- Helper RLS: `auth_oficina_id()` — NUNCA subquery em profiles dentro de policy
- Permissões granulares: `profiles.permissions` (JSONB), 13 módulos

## Painel Master Admin
- URL: `rpmpro.com.br/v2/admin.html`
- Login: admin@rpmpro.com.br / admin123
- Verifica `is_platform_admin()` — role=dono + oficina_id=aaaa0001-...
- DM Stack (oficina aaaa0001-...) = conta master, filtrada da lista de clientes

## Gotchas CRÍTICOS
- **RLS profiles:** NUNCA subquery em profiles dentro de policy — usar `auth_oficina_id()`
- **sed + emoji no Windows:** NUNCA — usar Python para substituições com emoji em HTML
- **kanban-v2 init:** seta `OFICINA_ID = perfil.oficina_id` próprio — acessar oficina via localStorage `rpmpro-admin-oficina`
- **modal admin.html:** CSS usa `.modal-overlay.show` (não `.active`) — `classList.add('show')`
- **FK profiles:** `profiles!mecanico_id(nome)` — não usar nome da FK completo
- **maquininhas SELECT:** SEMPRE incluir `taxa_parcelado_6,taxa_parcelado_12` — existem no banco (colunas adicionadas via SQL em 2026-04-13). Cálculo: 1x→taxa_credito, 2-6x→taxa_parcelado_6, 7-12x→taxa_parcelado_12. Marcondes tem 2 maquininhas com taxas diferentes.
- **config-v2 sair():** DEVE ser async
- **tv.html:** existe em raiz E em v2/ — editar o certo
- **moverCard:** SELECT deve incluir todos campos obrigatórios
- **autocomplete HTML:** NUNCA JSON.stringify dentro de atributo onmousedown — usar índice numérico + array global

## Clientes ativos
- Marcondes: R$350/mês (fixo)
- Novas oficinas: R$399/mês

## Deploy
- Sempre `./deploy.sh "mensagem"` — deploy atual: ver MEMORY.md
- Deploy reseta verify_jwt de Edge Functions — rodar curl PATCH após deploy de Edge Function

## Módulos V2
kanban · financeiro · fornecedores · notas-fiscais · historico-nf · config · tv · admin
