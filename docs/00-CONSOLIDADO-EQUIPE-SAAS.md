# RPM Pro — Relatório Consolidado da Equipe SaaS
**Data:** 2026-03-25 | **8 especialistas** | **Veredicto: MVP a 3h de distância**

---

## VISAO GERAL

O RPM Pro tem base sólida: Kanban de pátio (diferencial real), OS completa com catálogo, multi-tenant com RLS, dark mode. Mas tem buracos que impedem o beta.

---

## BLOCKERS (não pode ir pro ar sem resolver)

| # | Problema | Quem achou | Esforço |
|---|----------|-----------|---------|
| B1 | **pecas.js não existe** — tela Peças/Estoque dá erro ao clicar | Elyda, Heleno, Anderson | 1h |
| B2 | **Status `aguardando_peca` não existe no CHECK** do banco — Kanban quebra ao arrastar | Heleno, Rosinaldo | 1min (SQL) |
| B3 | **Drag and drop não funciona em mobile** — API HTML5 Drag não tem touch | Adeilton, Anderson | 2h |
| B4 | **Signup não é atômico** — pode criar user sem oficina/profile | Nego, Rosinaldo, Heleno | 1h (RPC) |

---

## CRÍTICOS (causa dor real no uso diário)

| # | Problema | Quem achou | Esforço |
|---|----------|-----------|---------|
| C1 | **XSS em todos os renders** — innerHTML sem escape em todo sistema | Nego, Anderson | 2h |
| C2 | **Financeiro é fantasma** — sidebar mostra, mas não tem nada | Elyda, Lindinaldo, Heleno | esconder: 5min |
| C3 | **Fechar OS exige 2 ações separadas** — status + pagamento sem conexão | Lindinaldo | 1h (botão Finalizar) |
| C4 | **Sem impressão de OS / PDF** — oficina grampeia papel no carro | Josimar | 2h |
| C5 | **Sem histórico do veículo** — "o que fez da última vez?" | Josimar | 1h |
| C6 | **Placa duplicada permitida** — sem UNIQUE no banco | Heleno | 5min (SQL) |
| C7 | **RPC `criar_membro_equipe` não tá no SQL versionado** | Rosinaldo, Heleno | 10min |
| C8 | **Colunas `valor_hora` e `comissao_padrao` podem não existir** no banco | Rosinaldo | 5min (SQL) |
| C9 | **RLS com buracos** — falta DELETE em profiles, INSERT oficinas sem controle, estoque_movimentos sem UPDATE/DELETE | Nego, Rosinaldo | 30min |

---

## IMPORTANTES (melhoram muito antes do beta)

| # | Problema | Quem achou | Esforço |
|---|----------|-----------|---------|
| I1 | **Kanban 7 colunas não cabe no mobile** — trocar por lista vertical + tabs | Adeilton, Lindinaldo | 2h |
| I2 | **Bottom nav igual pra todos** — mecânico vê Equipe/Config que não usa | Lindinaldo, Adeilton | 1h |
| I3 | **Sem paginação/busca na lista de OS** — some depois de 50 | Heleno | 1h |
| I4 | **Scripts sem `defer`** — bloqueiam renderização | Anderson | 10min |
| I5 | **Race condition no estoque** — 2 mecânicos baixando mesma peça | Rosinaldo, Heleno | 1h (RPC) |
| I6 | **Modal não fecha com ESC, não trava scroll** | Anderson | 30min |
| I7 | **Zero tratamento offline** — sem Service Worker, sem cache | Adeilton | fase 2 |
| I8 | **Relatório de comissão do mecânico** — essencial pro dono | Josimar | 2h |

---

## O QUE TÁ BOM (não mexer)

- Kanban de pátio — diferencial matador vs SHOficina
- OS com catálogo de serviços + preços
- Autocomplete de placa na OS
- Baixa automática de estoque
- WhatsApp automático por status
- Multi-tenant com RLS desde dia 1
- Dark mode + CSS variables
- Catálogo de 27 marcas + modelos
- Validação de placa (antigo + Mercosul)
- Configurações por oficina (valor/hora, comissão)

---

## PLANO DE AÇÃO RECOMENDADO

### Sprint 1 — BLOCKERS (hoje, ~4h)
1. Criar `pecas.js` (CRUD estoque)
2. Rodar SQL: CHECK constraint com `aguardando_peca`, UNIQUE placa, colunas faltantes
3. Criar RPC atômica de signup (`criar_oficina_e_dono`)
4. Adicionar botões "Avançar/Voltar status" nos cards do Kanban (fix mobile)
5. Criar função `esc()` e aplicar em todos os innerHTML

### Sprint 2 — CRÍTICOS (amanhã, ~4h)
1. Botão "Finalizar OS" guiado (status + pagamento + desconto numa tela)
2. PDF da OS (pdfmake — mesmo padrão EDR)
3. Histórico do veículo (consulta por placa, todas as OS anteriores)
4. Esconder Financeiro da sidebar (ou criar versão mínima)
5. Fechar buracos de RLS

### Sprint 3 — POLIMENTO PRE-BETA (~4h)
1. Kanban mobile: lista vertical com filtro por status
2. Bottom nav por perfil (mecânico vs dono)
3. Paginação + busca na lista de OS
4. Modal: ESC pra fechar, scroll lock
5. Scripts com defer

### FASE 2 (após beta rodar)
- Financeiro completo (caixa diário, recebimentos, relatórios)
- Relatório de comissão
- Service Worker + offline
- Agendamentos
- Fornecedores
- CRM + lembrete de revisão

---

## 5 PERGUNTAS PRO CARBON ANTES DO BETA (Josimar)

1. Quantas OS abre por dia? (dimensionar performance)
2. Imprime ordem de serviço em papel? (PDF é blocker?)
3. Mecânicos usam celular ou PC? (prioridade mobile)
4. Controla estoque de peças hoje? (nível de detalhe)
5. O que mais te irrita no SHOficina? (feature killer)

---

## RELATÓRIOS INDIVIDUAIS

Cada especialista deixou relatório detalhado em `rpmpro/docs/`:
1. `01-elyda-product-manager.md` — Escopo e MVP
2. `02-josimar-ux-researcher.md` — Mercado e dores
3. `03-lindinaldo-ux-designer.md` — Fluxos e UX
4. `04-rosinaldo-backend.md` — Schema e banco
5. `05-anderson-frontend.md` — Código e performance
6. `06-nego-security.md` — Segurança e RLS
7. `07-heleno-qa.md` — Bugs e testes
8. `08-adeilton-mobile.md` — Mobile e acessibilidade
