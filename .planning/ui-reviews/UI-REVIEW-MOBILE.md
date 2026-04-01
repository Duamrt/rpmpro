# RPM Pro - Auditoria Mobile (<=768px)

**Data:** 2026-04-01
**Metodo:** Analise de codigo (sem dev server)

---

## Pontuacao por Modulo (0-10)

| Modulo | Nota | Observacao |
|--------|------|-----------|
| **Kanban/Patio** | 9/10 | Tabs mobile dedicadas, lista de cards, desktop escondido. Excelente. |
| **OS (lista)** | 9/10 | Cards mobile com mobile-card-list. Bem feito. |
| **OS (detalhes)** | 8/10 | Abas mobile (Info/Servicos/Pecas/Checklist/Acoes), grids adaptados. Muito bom. |
| **Financeiro** | 9/10 | `_mob` em todas as 5 sub-abas, cards mobile, grids responsivos. O melhor modulo. |
| **Clientes** | 8/10 | Cards mobile, historico acessivel por toque. |
| **Veiculos** | 8/10 | Cards mobile com acoes. |
| **Pecas/Estoque** | 8/10 | Cards mobile, busca funciona em ambos layouts. |
| **Equipe** | 7/10 | Cards mobile basicos. Sem edicao inline adaptada. |
| **Diagnostico** | 8/10 | Grid 2 colunas de setores, checkboxes 22px (touch-friendly), tudo em modal. |
| **Fila de Espera** | 7/10 | Cards com flex-wrap, mas SEM verificacao `innerWidth`. Layout unico responsivo via CSS. |
| **Agendamentos** | 7/10 | Tem vista mobile dedicada + resize listener. Calendario escondido no mobile. |
| **Contas a Pagar** | 7/10 | Cards mobile na lista de resumo. Lista principal com `isMobile` check. |
| **Folha Pagamento** | 6/10 | Usa `_mob` so pra grid 2x5 colunas. Tabela principal sem tratamento mobile. |
| **Comissao** | 4/10 | Tabela `data-table` SEM cards mobile. Colunas apertadas no celular. |
| **CRM** | 3/10 | Tabela `data-table` com 5 colunas (Cliente, WhatsApp, OS, Ultima, Acoes). Impossivel usar no celular. |
| **Dashboard** | 7/10 | KPIs 2 colunas via CSS. Fila do dia sem tratamento especifico. |
| **Config** | - | Nao auditado (formularios simples) |

**Media geral: 7.1/10**

---

## Top 5 Problemas Criticos

### 1. CRM usa tabela crua sem layout mobile
**Arquivo:** `js/crm.js:109-131`
**Impacto:** Tabela com 5 colunas (Cliente, WhatsApp, OS feitas, Ultima OS, Acoes) fica ilegivel no celular. Botoes WhatsApp e Agendar ficam espremidos.
**Correcao:** Adicionar check `window.innerWidth <= 768` e renderizar `mobile-card-list` como nos outros modulos. Cada card mostra nome, dias inativos, botoes de acao empilhados.

### 2. Comissao usa tabela crua sem layout mobile
**Arquivo:** `js/comissao.js:71-106`
**Impacto:** Tabela com 5 colunas (Mecanico, Qtd, Valor, %, Comissao). No celular, colunas de valor ficam cortadas ou forcam scroll horizontal.
**Correcao:** Adicionar `_mob` check e renderizar cards com nome do mecanico como titulo, valores em `mobile-card-row`.

### 3. Bottom nav nao tem acesso a Financeiro, CRM, Config, Agendamentos
**Arquivo:** `index.html:365-381`
**Impacto:** Bottom nav so tem 5 itens (Patio, OS, Clientes, Estoque, Equipe). Financeiro, CRM, Contas, Config, Agendamentos, Comissao, Folha, Servicos so sao acessiveis pelo menu hamburger. Dono da oficina (Marcondes) precisa de 2 toques extras pra acessar o caixa.
**Correcao:** Trocar "Equipe" por "Mais" no bottom nav (ja existe `.bottom-nav-more` no CSS) e colocar os itens restantes no menu overflow. Ou colocar Financeiro direto no bottom nav (e mais importante que Equipe pro dono).

### 4. Nao tem listener de resize na maioria dos modulos
**Arquivo:** Todos os JS exceto `agendamentos.js`
**Impacto:** Se o usuario rotacionar o celular (portrait -> landscape), o layout nao recalcula. O `_mob` e checado so no momento do render. Se abrir em landscape e rotacionar pra portrait, fica com layout desktop no celular.
**Correcao:** Nao e critico porque modulos re-renderizam ao navegar. Mas seria bom adicionar um debounced resize que chama `APP.navegarPara(APP._paginaAtual)` ao cruzar o breakpoint 768px.

### 5. Modais fullscreen sem botao voltar nativo
**Arquivo:** `css/style.css:813`
**Impacto:** Modal no mobile ocupa 100% da tela (correto), mas o "X" de fechar fica no canto superior direito, longe do polegar. Em modais longos (OS detalhes, diagnostico), precisa rolar ate o topo pra fechar.
**Correcao:** Adicionar botao "Voltar" fixo no topo do modal mobile, ou tornar o header sticky (`position: sticky; top: 0; z-index: 10; background: var(--bg-card);`).

---

## Quick Wins (facil de corrigir)

1. **Modal header sticky** - Adicionar em `style.css` dentro do `@media (max-width: 768px)`:
   ```css
   .modal-header { position: sticky; top: 0; z-index: 10; background: var(--bg-card); }
   ```

2. **Bottom nav "Mais"** - Ja tem CSS `.bottom-nav-more` pronto no style.css (linhas 721-750). So falta o HTML no index.html e o JS pra toggle.

3. **Folha grid** - `js/folha.js:146` ja usa `_mob` pro grid. Falta a tabela detalhada de cada mecanico ter tratamento mobile.

4. **Touch targets** - Ja ta bom nos btn-sm (min-height: 44px na linha 811). Checkboxes do diagnostico tambem (22px, linha 309). OK.

5. **Safe area** - Bottom nav ja tem `env(safe-area-inset-bottom)` (linha 623). OK.

---

## Rework Maior (precisa de mais tempo)

### CRM Mobile (estimativa: 30 min)
Reescrever `CRM._renderGrupo()` pra detectar mobile e renderizar cards em vez de tabela. Cada card teria: nome + dias inativo + botoes WhatsApp/Agendar. Campo de WhatsApp inline pra quem nao tem.

### Comissao Mobile (estimativa: 20 min)
Adicionar branch `_mob` no render de `COMISSAO.carregar()`. Cards por mecanico: nome, qtd OS, valor total, % comissao, valor comissao.

### Bottom Nav com menu "Mais" (estimativa: 15 min)
Implementar o toggle do menu overflow que ja tem CSS pronto. Incluir: Financeiro, Agendamentos, CRM, Config, Contas, Comissao, Folha, Servicos.

### Resize-aware rendering (estimativa: 20 min)
Um unico listener global que, ao cruzar 768px, re-renderiza a pagina ativa. Evita layout quebrado apos rotacao.

---

## Resumo

O RPM Pro ta **muito bem** no mobile pra maioria dos modulos. O padrao `_mob = window.innerWidth <= 768` com cards mobile e consistente e bem aplicado no financeiro, OS, clientes, pecas, veiculos e kanban. Os pontos fracos sao concentrados em 2 modulos (CRM e Comissao) que ainda usam `data-table` sem alternativa mobile, e o bottom nav que nao da acesso direto ao financeiro.

Para o uso real do Marcondes no dia-a-dia da oficina (que provavelmente abre no celular), os modulos mais usados (Patio, OS, Financeiro) estao excelentes. CRM e Comissao sao consultas menos frequentes mas precisam do fix.
