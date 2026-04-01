# Financeiro -- Auditoria de UI

**Data:** 2026-04-01
**Base:** Analise de codigo (sem servidor rodando, sem screenshots)
**Arquivo principal:** js/financeiro.js (~1250 linhas)

---

## Pontuacao por Pilar

| Pilar | Nota | Resumo |
|-------|------|--------|
| 1. Textos e Copy | 3/4 | Labels claros, mas faltam acentos em varios lugares |
| 2. Hierarquia Visual | 2/4 | Tudo no mesmo nivel -- KPIs, filtros, tabelas competem pela atencao |
| 3. Cores | 3/4 | Usa bem as variaveis do tema, mas excesso de verde/vermelho sem respiro |
| 4. Tipografia | 2/4 | 7 tamanhos de fonte inline (10px a 28px), sem escala consistente |
| 5. Espacamento | 2/4 | Inline styles com valores avulsos (6px, 8px, 10px, 12px, 14px, 16px, 20px) |
| 6. Experiencia de Uso | 2/4 | Sem loading states, abas recarregam tudo, excluir sem undo |

**Total: 14/24**

---

## Top 3 Problemas Prioritarios

### 1. Layout do Caixa -- informacao demais sem separacao visual
**Impacto:** O Marcondes disse "muito confuso pra leitura". Motivo: na aba Caixa, o usuario ve navegacao de mes + filtros de periodo + 4 KPIs + recebimentos por forma + pecas movimentadas + tabela OS + tabela movimentacoes -- tudo empilhado com gaps de 20px iguais.

**Correcao concreta:**
- Agrupar em 2 blocos visuais claros: "Resumo" (KPIs + formas de pagamento) e "Detalhes" (tabelas)
- Colocar um separador visual (section-title com stripe, que ja existe no CSS) entre os blocos
- Colapsar "Pecas movimentadas" por padrao com um toggle -- so abre se o dono quiser ver
- As tabelas de OS e Movimentacoes podem ser abas internas (sub-tabs) em vez de empilhadas

### 2. Inline styles massivos -- impossivel manter consistencia
**Impacto:** O arquivo inteiro usa `style="..."` direto no HTML gerado. Sao ~120 ocorrencias de inline style so no financeiro. Qualquer mudanca de layout exige editar JS, nao CSS.

**Correcao concreta:**
- Mover os padroes repetidos pra classes CSS no style.css:
  - `.fin-section` = bg-card + border + radius + padding 16px 20px + margin-bottom 20px
  - `.fin-section-title` = font-size 14px + color text-secondary + margin-bottom 12px
  - `.fin-metric` = font-size 11px label + 18px valor
  - `.fin-highlight` = font-size 24px + weight 800 (pro Lucro Liquido, Total Despesas)
- Trocar grid inline por classes utilitarias: `.grid-2`, `.grid-3`, `.grid-4`

### 3. 5 abas de nivel igual sem indicacao de contexto
**Impacto:** As 5 abas (Fechamento, Caixa, Despesas, Lucro Pecas, A Receber) estao todas no mesmo nivel visual. O dono entra e nao sabe qual olhar primeiro. "Fechamento do Dia" e a mais importante mas nada destaca isso.

**Correcao concreta:**
- Manter "Fechamento do Dia" como tela principal, sem ser aba
- Agrupar as outras 4 em abas abaixo do fechamento
- Ou: destacar "Fechamento" com icone + texto maior, e as outras como tabs secundarias com tamanho menor
- Adicionar badge com contagem nas abas relevantes (ex: "A Receber (3)" -- ja tem o padrao `.tab-count` no CSS)

---

## Detalhes por Pilar

### Pilar 1: Textos e Copy (3/4)

**Bom:**
- Labels financeiros claros: "Faturamento Bruto", "Lucro Liquido", "Taxas Maquineta"
- Empty states com orientacao: "Quando entregar uma OS como Faturado, ela aparece aqui"
- Categorias de despesa com nomes do dia-a-dia do dono

**Problemas:**
- Acentos faltando em todo o arquivo: "Pecas", "Saidas", "Descricao", "Manutencao", "Credito", "Debito" (linhas 22, 145, 157, 346-347, 471, etc.)
- Botao de excluir e so "X" sem tooltip -- nao fica claro o que faz no mobile
- "Gerar Relatorio PDF" e "Gerar PDF do Fechamento" -- poderia ser so "Baixar PDF"
- Confirmacao de exclusao usa `confirm()` nativo -- fora do padrao visual

### Pilar 2: Hierarquia Visual (2/4)

**Problema central:** Tudo compete pela atencao. Numa tela de Fechamento do dia:
- 4 KPIs grandes (font 30px via .kpi-card .value)
- Logo abaixo, 4 metricas menores (18px) no mesmo card
- Logo abaixo, 5 metricas de pecas (16px)
- Logo abaixo, 4 cards de forma de pagamento (18px)
- Logo abaixo, alertas (20px)

O usuario nao sabe onde olhar primeiro porque tudo grita ao mesmo tempo.

**Na aba Caixa e pior:** sao 7 secoes empilhadas:
1. Navegacao mes
2. Filtro periodo
3. KPIs (4 cards)
4. Recebimentos por forma
5. Pecas movimentadas
6. Tabela OS pagas
7. Tabela Movimentacoes

**Sugestao:** Criar hierarquia de 3 niveis:
- **Nivel 1** (hero): Lucro Liquido do dia, grande, centralizado
- **Nivel 2** (contexto): KPIs menores em grid
- **Nivel 3** (detalhes): tabelas e breakdowns em accordions ou sub-abas

### Pilar 3: Cores (3/4)

**Bom:**
- Usa variaveis CSS consistentes (--success, --danger, --warning, --text-secondary)
- Sem cores hardcoded no JS (tudo via var())
- Verde pra entradas, vermelho pra saidas -- padrao intuitivo

**Problemas:**
- Na secao de metricas (linhas 154-173), sao 4 valores coloridos lado a lado: vermelho, vermelho, verde, verde/vermelho. Vira um semaforo.
- Cards de forma de pagamento: todos os valores sao verde (--success) mesmo quando zerados (ficam com opacity 0.5, mas a cor verde em cima de opacity baixa no dark mode fica confuso)
- O "LUCRO LIQUIDO" usa font-size 24px vs 18px dos vizinhos -- bom, mas o destaque e so por tamanho. Falta um background diferenciado ou borda.

### Pilar 4: Tipografia (2/4)

Tamanhos encontrados no inline style do financeiro:
- 10px (taxa %)
- 11px (labels secundarios)
- 12px (categorias, datas)
- 13px (subtextos, contadores)
- 14px (titulos de secao, tabs)
- 16px (metricas pecas)
- 18px (metricas, navegacao mes)
- 20px (alertas fiado/canceladas)
- 22px (lucro liquido pecas)
- 24px (lucro liquido, totais)
- 28px (total despesas)
- 30px (via classe .kpi-card .value)

Sao 12 tamanhos diferentes. Deveria ter no maximo 5-6 numa escala definida.

Font weights usados: 600, 700, 800 -- ok, sao 3 niveis.

### Pilar 5: Espacamento (2/4)

Paddings e gaps encontrados inline:
- gap: 6px, 8px, 10px, 12px, 16px
- padding: 6px 10px, 6px 12px, 10px, 10px 16px, 12px 16px, 14px 20px, 16px 20px, 20px
- margin-bottom: 4px, 6px, 8px, 12px, 16px, 20px

Nao ha escala definida. O CSS do projeto usa `--radius: 6px` e `--radius-lg: 8px` mas nao define tokens de spacing.

**Sugestao:** Definir escala de 4px: 4, 8, 12, 16, 24, 32. Aplicar via classes CSS.

### Pilar 6: Experiencia de Uso (2/4)

**Bom:**
- Responsivo: detecta mobile e troca tabela por cards
- PDF disponivel em todas as abas relevantes
- Formularios com validacao basica
- Contas a Receber com agrupamento por cliente

**Problemas:**
- **Sem loading state:** `carregar()` faz await de queries mas nao mostra skeleton/spinner durante
- **Abas recarregam tudo:** trocar de "Caixa" pra "Despesas" e voltar re-faz todas as queries
- **Excluir sem undo:** `confirm()` nativo + delete direto, sem possibilidade de desfazer
- **Sem busca/filtro nas tabelas:** se tiver 50 OS no mes, nao tem como filtrar
- **Botao "X" pra excluir:** minusculo, facil de clicar sem querer no mobile
- **`window.innerWidth` avaliado uma vez:** se o usuario girar o celular, o layout nao adapta (precisaria re-renderizar)

---

## Arquivos Auditados

- `js/financeiro.js` (inteiro, ~1250 linhas)
- `css/style.css` (variaveis, KPI grid, kanban tabs, responsive)
- `index.html` (secao financeiro, linhas 274-281)
