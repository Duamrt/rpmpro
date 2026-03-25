# RPM Pro -- Relatorio Mobile e Acessibilidade
**Analista:** ADEILTON (Especialista Mobile/Acessibilidade)
**Data:** 2026-03-25

---

## 1. Kanban em tela de celular (320px-414px)

**PROBLEMA CRITICO.** O board tem 7 colunas com `min-width:220px` cada = 1.540px de conteudo horizontal. No celular (320-414px), o usuario precisa fazer scroll lateral de quase 4 telas inteiras pra ver todas as colunas.

Na pratica: o mecanico ve 1 coluna e meia. Pra mover um carro de "Entrada" pra "Pronto" ele precisa arrastar 5 colunas pra direita. Com mao suja e tela pequena, isso e inutilizavel.

**Recomendacoes:**
- No mobile, trocar o board horizontal por **lista vertical com filtro de status** (tabs ou dropdown). Cada coluna vira uma lista. O mecanico seleciona "Em Execucao" e ve so os carros dele.
- Alternativa: **swipe entre colunas** (uma coluna por vez, tipo carrossel). Indicator de bolinhas embaixo mostrando qual coluna esta visivel.
- Esconder colunas vazias no mobile pra reduzir scroll.
- Coluna "Entregue" nao precisa aparecer no mobile do mecanico -- so no PC do dono.

---

## 2. Drag and drop no touch -- NAO FUNCIONA

**PROBLEMA CRITICO.** O kanban usa `draggable="true"` com `ondragstart`, `ondragover` e `ondrop` -- que e a API nativa HTML5 Drag and Drop. Essa API **nao funciona em dispositivos touch** (iOS Safari, Chrome Android). O mecanico nao consegue arrastar nenhum card no celular.

O evento `touchstart`/`touchmove`/`touchend` nao dispara os eventos drag nativos. O card simplesmente nao se move.

**Recomendacoes:**
- Implementar **botoes de acao no card** em vez de drag. Ex: no card do carro, botoes "Iniciar", "Pronto", "Proximo status". Um toque resolve.
- Se quiser manter drag no desktop, usar uma lib como **SortableJS** (7kb gzip) que suporta touch nativamente.
- A melhor solucao pro mecanico e um **botao grande "Avancar status"** no card. Ele nao precisa escolher entre 7 colunas -- normalmente o fluxo e linear (Entrada > Diagnostico > Orcamento > Execucao > Pronto).

---

## 3. Touch targets -- tamanho dos alvos de toque

**PROBLEMA MEDIO.** O padrao minimo e 44x44px (Apple HIG) ou 48x48dp (Material Design). Problemas encontrados:

| Elemento | Tamanho atual | Minimo | Status |
|----------|--------------|--------|--------|
| Bottom nav links | ~20px icon + 10px texto, padding 6px | 44px | INSUFICIENTE |
| Botao `.btn-sm` | padding 5px 10px | 44px | INSUFICIENTE |
| Badge de status | padding 3px 10px | -- | Nao clicavel, OK |
| Kanban card | padding 10px 12px | 44px | OK (conteudo expande) |
| Modal close (X) | sem padding definido | 44px | INSUFICIENTE |
| Links sidebar mobile | padding 10px 20px | 44px | BORDERLINE |

**Recomendacoes:**
- Bottom nav: aumentar padding pra pelo menos `12px 8px`, icon pra 24px. Area total do link precisa ter no minimo 44px de altura.
- Botoes `.btn-sm` no mobile: padding minimo 10px 16px.
- Botao X do modal: dar area de toque de pelo menos 44x44px (padding 12px).
- Todos os itens de lista clicaveis (sugestoes de placa, cards): padding minimo 12px vertical.

---

## 4. Font-size dos inputs -- zoom no iOS

**PROBLEMA MEDIO.** Os inputs usam `font-size: 14px`. No iOS Safari, qualquer input com font-size menor que 16px causa **zoom automatico da pagina** ao focar. O usuario precisa dar pinch pra voltar ao zoom normal. Muito irritante.

O CSS atual:
```
.form-control { font-size: 14px; }
```

**Recomendacao:**
- Adicionar no media query mobile: `.form-control { font-size: 16px; }`. Isso resolve o zoom sem afetar o desktop.
- Ou usar `@supports` com `-webkit-text-size-adjust` pra ser mais cirurgico.

---

## 5. Modais em tela pequena

**PROBLEMA MEDIO.** O modal usa `width: 95%; max-width: 560px; max-height: 90vh; overflow-y: auto`. Isso e razoavel, mas tem problemas:

- O formulario da Nova OS e **muito longo** (placa, cliente, marca, modelo, ano, cor, km, mecanico, servico, descricao, km entrada, status). No celular 320px sao muitos campos pra rolar dentro de um modal.
- O modal-footer com botoes fica preso la embaixo -- o usuario precisa rolar ate o fim pra salvar.
- Grid `grid-template-columns: 1fr 1fr` e `1fr 1fr 1fr` dentro do modal: em 320px, cada coluna fica com ~140px ou ~95px. Os campos Ano/Cor/KM ficam espremidos demais em 3 colunas.

**Recomendacoes:**
- No mobile, o modal de Nova OS deveria virar **tela cheia** (`width:100%; height:100%; border-radius:0; max-height:100vh`).
- Ou melhor: no mobile, trocar modal por **pagina separada** com navegacao de volta.
- Grids de 3 colunas: no mobile colapsar pra 1 ou 2 colunas.
- Modal-footer: fixar no bottom com `position: sticky; bottom: 0` pra o botao Salvar estar sempre visivel.
- Formulario longo: dividir em etapas (wizard). Passo 1: Placa/Veiculo. Passo 2: Servico. Passo 3: Confirma.

---

## 6. Bottom nav -- completude

**PROBLEMA LEVE.** A bottom nav tem 5 itens:
1. Patio (kanban)
2. OS
3. Clientes
4. Estoque
5. Equipe

**Faltam:**
- **Dashboard** -- o dono precisa ver KPIs rapido no celular
- **Financeiro** -- o dono quer ver faturamento do mes no celular

**Sobram (pra mecanico):**
- Clientes, Estoque e Equipe sao telas que o mecanico quase nunca acessa

**Recomendacoes:**
- Bottom nav **diferente por perfil**:
  - **Mecanico:** Patio | Minhas OS | + Nova OS (botao central destaque) | Notificacoes
  - **Dono/Gerente:** Dashboard | Patio | + Nova OS | OS | Mais (menu)
  - **Atendente:** Patio | + Nova OS | Clientes | OS | Mais
- O botao "+ Nova OS" merece destaque central na bottom nav -- e a acao mais frequente.
- Maximo 5 itens na bottom nav (ja esta certo). Usar "Mais" pra acessar o resto.

---

## 7. Modo offline / conexao instavel

**PROBLEMA CRITICO.** Nao existe nenhum tratamento offline. O sistema depende 100% do Supabase pra tudo. Se o mecanico perde sinal no meio do galpao:

- Ao abrir o app: tela branca com "Carregando..." infinito
- Ao tentar mover um card: nada acontece, sem feedback
- Ao salvar uma OS: perde os dados digitados
- Nao tem Service Worker, nao tem cache local, nao tem fila de sync

A oficina tipica no Brasil tem wifi instavel e o mecanico usa 4G/3G. Ficar sem internet por 30 segundos e normal.

**Recomendacoes (por prioridade):**
1. **Cache da ultima leitura**: ao carregar o kanban/OS, salvar no localStorage. Se a proxima chamada falhar, mostra os dados do cache com um banner "Dados offline -- ultima atualizacao Xmin atras".
2. **Fila de acoes**: se o mecanico muda status offline, salvar na fila local. Quando a internet volta, sincroniza automaticamente.
3. **Service Worker basico**: cachear os arquivos HTML/CSS/JS pra o app pelo menos abrir offline.
4. **Feedback visual**: mostrar indicador de conexao (bolinha verde/vermelha). Quando offline, desabilitar acoes que precisam de internet e mostrar aviso claro.
5. **Formularios**: salvar rascunho no localStorage a cada campo preenchido. Se o app fecha ou a internet cai, os dados nao se perdem.

---

## 8. Adaptacoes por perfil de usuario

### MECANICO (celular, maos sujas, sol, pressa)
- **Tela principal**: lista dos SEUS carros, ordenados por urgencia (mais antigo primeiro)
- **Acao principal**: botao grandao "Proximo status" em cada card (sem drag)
- **Touch targets**: TUDO com no minimo 48px. Botoes grandes, espaçados
- **Contraste**: o tema escuro e bom pra sol, mas os textos cinza-claro (`--text-secondary: #8b949e`) sobre fundo escuro podem ter contraste insuficiente. Testar ratio WCAG AA (minimo 4.5:1)
- **Modo luva**: opcao de aumentar todos os alvos de toque em 50% (pra quem usa com luva ou mao molhada)
- **Notificacao de novo carro**: push ou som quando entra uma OS nova atribuida a ele
- **Camera**: botao pra tirar foto do problema direto do card (evidencia pro orcamento)
- **Voz**: reconhecimento de voz pra ditar observacoes (igual ja foi feito no EDR System com diarias)

### DONO / GERENTE (PC ou tablet, visao gerencial)
- **Tela principal**: Dashboard com KPIs, nao o kanban
- **Kanban completo**: ve todos os mecanicos, filtro funciona bem
- **Financeiro rapido**: valor total do dia/semana/mes sempre visivel
- **Alertas**: carros parados ha mais de 48h (ja tem indicador visual, bom)
- **Relatorios**: PDF de OS pra enviar pro cliente
- **Multi-tela**: tablet em modo landscape -- aproveitar o espaco com split view (kanban + detalhes)

### ATENDENTE (PC ou tablet no balcao, contato com cliente)
- **Tela principal**: + Nova OS (e a acao mais frequente)
- **Busca rapida de placa**: o autocomplete ja existe e esta bom. Falta busca por nome do cliente tambem
- **WhatsApp integrado**: os links de WhatsApp automaticos estao otimos. Adicionar tambem ao listar clientes
- **Historico do veiculo**: ao buscar a placa, mostrar rapidamente as ultimas OS daquele carro
- **Impressao**: botao de imprimir comprovante de entrada (recibo pro cliente)

---

## Resumo de prioridades

| # | Item | Severidade | Impacto |
|---|------|-----------|---------|
| 1 | Drag and drop nao funciona em touch | CRITICO | Kanban inutilizavel no celular |
| 2 | Kanban 7 colunas em 320px | CRITICO | Scroll horizontal impossivel |
| 3 | Zero tratamento offline | CRITICO | App trava sem internet |
| 4 | Inputs 14px causam zoom no iOS | MEDIO | Experiencia ruim em iPhone |
| 5 | Touch targets pequenos | MEDIO | Dificil acertar com mao suja |
| 6 | Modal de OS muito longo | MEDIO | Formulario dificil no celular |
| 7 | Bottom nav generica (sem perfil) | LEVE | Mecanico ve telas inuteis |
| 8 | Falta Dashboard na bottom nav | LEVE | Dono precisa de mais cliques |

---

## Conclusao

O sistema tem uma base solida: tema escuro (bom pra oficina), layout responsivo basico, bottom nav presente, e funcionalidades core bem pensadas (autocomplete de placa, WhatsApp automatico, badges visuais de urgencia).

Porem, os 3 problemas criticos (drag sem touch, kanban horizontal no mobile, zero offline) fazem o app ser **praticamente inutilizavel no celular do mecanico** -- que e justamente o usuario mais frequente.

A recomendacao principal: **trocar drag por botoes de acao no mobile** e **trocar kanban horizontal por lista vertical com filtro de status**. Essas duas mudancas sozinhas transformam a experiencia mobile.
