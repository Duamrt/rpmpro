# RPM Pro — Relatorio UX (Lindinaldo)
> Analise de fluxos, navegacao e experiencia do usuario

---

## 1. MAPEAMENTO DOS FLUXOS PRINCIPAIS

### 1.1 Fluxo Atendimento (Cliente chega na oficina)

```
ATENDENTE/DONO
  |
  v
[1] Clica "+ Nova OS" (disponivel no Kanban, Dashboard e tela OS)
  |
  v
[2] Digita a PLACA
  |--- Placa encontrada --> autocomplete mostra veiculo + cliente
  |--- Placa nova --------> formulario inline: nome cliente + whatsapp + dados veiculo
  |
  v
[3] Seleciona MECANICO responsavel (ou deixa sem)
  |
  v
[4] Seleciona SERVICOS do catalogo (com valor pre-preenchido)
  |   + pode adicionar servico manual
  |   + pode alterar valor de cada servico
  |
  v
[5] Define STATUS INICIAL (Entrada / Diagnostico / Orcamento)
  |
  v
[6] Salva --> OS aparece no KANBAN na coluna correspondente
```

**Pontos positivos:**
- Cadastro de cliente+veiculo inline na OS, sem sair do fluxo
- Autocomplete de placa evita cadastro duplicado
- Catalogo de servicos com valores padrao agiliza orcamento

**Quebra de fluxo identificada:**
- Ao cadastrar cliente novo pela OS, nao tem campo de CPF/CNPJ nem endereco. Se precisar emitir nota depois, vai ter que ir em Clientes > Editar pra completar.

---

### 1.2 Fluxo Execucao (Mecanico trabalhando)

```
MECANICO
  |
  v
[1] Abre o KANBAN --> ve so os carros atribuidos a ele
  |
  v
[2] ARRASTA o card de coluna pra coluna (ex: Diagnostico --> Orcamento)
  |--- Se mover pra "Orcamento": sugere enviar WhatsApp pro cliente
  |--- Se mover pra "Pronto": sugere avisar que ta pronto
  |--- Se mover pra "Aguardando Peca": sugere avisar sobre espera
  |
  v
[3] Clica no card pra abrir DETALHES da OS
  |
  v
[4] Pode: alterar status, adicionar pecas (estoque ou avulso), ver totais
  |
  v
[5] Quando termina: arrasta pra "Pronto"
```

**Pontos positivos:**
- Drag-and-drop intuitivo no Kanban
- WhatsApp automatico nos marcos importantes
- Cards com indicacao visual de tempo parado (amarelo > 24h, vermelho > 72h)

**Quebra de fluxo identificada:**
- Mecanico nao tem como registrar O QUE FEZ em cada etapa (tipo um log/historico da OS). Ele ve servicos, mas nao tem campo de "relatorio do mecanico" ou checklist do que foi feito
- Mecanico nao consegue adicionar servico extra depois que a OS foi criada (so peca). Se descobrir mais coisa durante o diagnostico, precisa que alguem edite a OS

---

### 1.3 Fluxo Financeiro (Pagamento e entrega)

```
ATENDENTE/DONO
  |
  v
[1] Abre detalhes da OS (pelo Kanban ou lista de OS)
  |
  v
[2] Confere TOTAIS: servicos + pecas - desconto = total
  |
  v
[3] Seleciona FORMA DE PAGAMENTO (pendente/dinheiro/pix/debito/credito)
  |--- Marcar pagamento ja atualiza "pago = true"
  |
  v
[4] Muda status pra "Entregue"
  |
  v
[5] Pode enviar WhatsApp de aviso ao cliente
```

**Quebra de fluxo identificada:**
- Nao tem pagamento PARCIAL (cliente paga metade agora, metade depois)
- Nao tem RECIBO ou comprovante pra mostrar/imprimir pro cliente
- O fluxo de "fechar a OS" nao tem uma acao clara de "finalizar" — e' so mudar 2 selects separados (status + pagamento)
- Nao tem visao consolidada de "contas a receber" (OS prontas com pagamento pendente)

---

### 1.4 Fluxo do Dono (Visao geral)

```
DONO
  |
  v
[1] DASHBOARD: ve KPIs (OS abertas, aguardando, prontas, faturamento mes)
  |   + Fila do dia com as 20 ultimas OS ativas
  |
  v
[2] KANBAN: ve TODOS os carros de todos mecanicos + filtro por mecanico
  |
  v
[3] FINANCEIRO: (tela existe mas esta vazia — sem implementacao)
  |
  v
[4] EQUIPE: cadastro de membros, funcao, comissao
  |
  v
[5] CONFIG: dados da oficina, valor hora, comissao padrao, plano
```

**Quebra de fluxo identificada:**
- Tela FINANCEIRO esta vazia — dono nao tem visao de faturamento detalhado, comissoes, recebimentos
- Dashboard mostra faturamento do mes mas nao da pra comparar com meses anteriores
- Nao tem relatorio de produtividade por mecanico (quantas OS fez, tempo medio)

---

## 2. QUEBRAS DE FLUXO CRITICAS

### 2.1 Tela Financeiro vazia
A sidebar tem "Financeiro" mas a tela nao carrega nada. O dono ve o botao, clica, e encontra "Carregando..." eternamente. Isso quebra confianca no sistema.

**Recomendacao:** Ou implementa um resumo basico (faturamento por periodo, OS pagas vs pendentes) ou remove da sidebar ate estar pronto.

### 2.2 Nao existe "fechar OS" como acao unica
Pra fechar uma OS, o usuario precisa:
1. Mudar status pra "Entregue" (select 1)
2. Mudar pagamento pra forma escolhida (select 2)

Sao 2 acoes separadas sem conexao. O ideal seria um botao "Finalizar OS" que abre um mini-fluxo: confirma valor, seleciona pagamento, marca como entregue, tudo numa acao.

### 2.3 Mecanico nao registra o que fez
Hoje o mecanico so arrasta cards. Nao tem onde escrever "troquei a correia, alinhei, regula de valvula ok". Isso e' critico pra historico do veiculo e pra resolver disputa com cliente.

### 2.4 Ida-e-volta entre Clientes e Veiculos
- Na tela de Clientes, ao editar, o botao "Editar" do veiculo fecha o modal do cliente e abre o modal do veiculo. Depois de editar o veiculo, o usuario fica perdido (nao volta pro cliente)
- Na tela de Veiculos, pra criar um veiculo novo precisa selecionar o cliente num dropdown. Mas se o cliente nao existe, tem que ir criar em Clientes primeiro e depois voltar

### 2.5 Bottom nav mobile incompleto
O bottom nav mobile tem: Patio, OS, Clientes, Estoque, Equipe (5 itens).
Falta: Dashboard, Financeiro, Config.
O menu hamburger (botao "Menu" no topo) abre a sidebar completa, mas requer 2 toques pra acessar essas telas.

---

## 3. REDUNDANCIAS IDENTIFICADAS

### 3.1 Kanban vs Lista de OS
O Kanban e a lista de OS mostram as mesmas ordens de servico, mas com visualizacoes diferentes. Isso e' CORRETO — nao e' redundancia, sao views complementares. Kanban pra operacao do dia, lista pra busca e historico.

### 3.2 Cadastro de veiculo em 3 lugares
Veiculos podem ser cadastrados em:
1. Tela Veiculos > + Novo Veiculo
2. Tela Clientes > Editar Cliente > + Veiculo
3. Modal Nova OS > placa nao encontrada > preenche dados

O item 3 e' correto (inline no fluxo). Mas os itens 1 e 2 sao redundantes — o veiculo SEMPRE pertence a um cliente. A tela de Veiculos separada so faz sentido pra busca rapida por placa, nao pra cadastro.

**Recomendacao:** Manter a tela Veiculos como consulta/busca, mas o cadastro de veiculo novo deve ser sempre pelo Cliente (ou pela OS).

### 3.3 Botao "+ Nova OS" em 3 telas
Aparece no Kanban, Dashboard e lista de OS. Isso e' BOM — acao principal acessivel de qualquer ponto. Manter.

---

## 4. NAVEGACAO IDEAL

### 4.1 Sidebar Desktop (ordem de prioridade)

```
+---------------------------+
|   RPM PRO                 |
|   [Nome da Oficina]       |
+---------------------------+
|                           |
|   Patio (Kanban)     [1]  |  <-- Tela principal, operacao do dia
|   Ordens de Servico  [2]  |  <-- Historico e busca
|   Clientes           [3]  |  <-- Cadastro e consulta
|   Estoque            [4]  |  <-- Pecas e materiais
|                           |
|   --- GESTAO ---          |
|   Dashboard          [5]  |  <-- KPIs e resumo
|   Financeiro         [6]  |  <-- Faturamento, recebimentos
|   Equipe             [7]  |  <-- Mecanicos e comissoes
|                           |
|   --- SISTEMA ---         |
|   Configuracoes      [8]  |
|                           |
+---------------------------+
|   [Avatar] Nome           |
|   Funcao                  |
|   [Sair]                  |
+---------------------------+
```

**Mudancas em relacao ao atual:**
- Removida a tela "Veiculos" da sidebar (acessivel dentro de Clientes)
- Agrupamento visual: OPERACAO / GESTAO / SISTEMA
- Financeiro ganha destaque (quando implementado)

### 4.2 Bottom Nav Mobile (5 itens max)

```
+-------+-------+-------+-------+-------+
| Patio | + OS  |  OS   | $$    | Menu  |
| (ativo)|      | Lista |Financ.|       |
+-------+-------+-------+-------+-------+
```

**Explicacao:**
- **Patio:** Kanban, tela principal
- **+ OS:** Acao rapida, abre direto o modal de nova OS (nao e' uma tela, e' um atalho)
- **OS:** Lista de ordens pra busca
- **Financeiro:** Visao rapida de caixa do dia (quando implementado, enquanto nao, pode ser Dashboard)
- **Menu:** Abre sidebar com todas as opcoes (Clientes, Estoque, Equipe, Config)

**Por que mudar:**
- O bottom nav atual tem Clientes e Equipe, que o mecanico quase nunca usa no celular
- O que o mecanico mais faz no celular: ver o patio, abrir OS, consultar OS
- O que o dono mais quer ver rapido: financeiro/caixa do dia
- Acao "+ OS" no centro e' padrao de apps de produtividade (botao flutuante / center action)

### 4.3 Navegacao por perfil (mecanico no mobile)

Para o mecanico, o bottom nav ideal seria:
```
+--------+--------+--------+--------+--------+
| Meus   |   OS   |  + OS  | Perfil |  Menu  |
| Carros | Detalhes|       |        |        |
+--------+--------+--------+--------+--------+
```

Onde "Meus Carros" e' o Kanban filtrado automaticamente pro mecanico logado.

---

## 5. VISIBILIDADE POR PERFIL

### 5.1 DONO / GERENTE — Acesso total

| Tela | Acesso | Notas |
|------|--------|-------|
| Patio (Kanban) | Total | Ve todos os mecanicos, filtro |
| OS | Total | Ve todas, pode editar |
| Clientes | Total | CRUD completo |
| Veiculos | Total | Via Clientes ou busca |
| Estoque | Total | Entrada, saida, precos |
| Dashboard | Total | KPIs completos |
| Financeiro | Total | Faturamento, comissoes, recebimentos |
| Equipe | Total | CRUD de membros |
| Config | Total | Dados da oficina |

### 5.2 ATENDENTE — Operacional sem financeiro

| Tela | Acesso | Notas |
|------|--------|-------|
| Patio (Kanban) | Total | Ve todos, pode mover cards |
| OS | Total | Cria, edita, fecha OS |
| Clientes | Total | CRUD completo |
| Veiculos | Total | Via Clientes |
| Estoque | Consulta | Ve pecas, mas nao edita precos de custo |
| Dashboard | Parcial | Ve KPIs de OS, sem faturamento |
| Financeiro | Oculto | Nao deve ver comissoes nem margem |
| Equipe | Oculto | Nao gerencia equipe |
| Config | Oculto | Nao altera config |

### 5.3 MECANICO — So o essencial

| Tela | Acesso | Notas |
|------|--------|-------|
| Patio (Kanban) | Filtrado | So ve SEUS carros (ja funciona assim) |
| OS | Filtrado | Deveria ver so as dele (HOJE ve todas) |
| Clientes | Oculto | Nao precisa |
| Veiculos | Oculto | Nao precisa |
| Estoque | Consulta | Pode buscar peca pra saber se tem |
| Dashboard | Oculto | Nao precisa |
| Financeiro | Oculto | Nao deve ver valores |
| Equipe | Oculto | Nao precisa |
| Config | Oculto | Nao precisa |

**Problema atual:** Hoje o mecanico ve TUDO no sidebar e no bottom nav. Nao tem nenhum filtro de permissao por role. Isso e' confuso (muitas opcoes que ele nao usa) e inseguro (pode ver dados financeiros, editar equipe, mudar config).

---

## 6. MELHORIAS DE FLUXO (sem features novas)

### 6.1 Botao "Finalizar OS" na tela de detalhes
Quando a OS esta em "Pronto", mostrar um botao grande e claro: **"Finalizar e Entregar"**.
Ao clicar, abre um mini-passo:
1. Confirma o valor total
2. Seleciona forma de pagamento
3. Marca como entregue
4. Oferece enviar WhatsApp

Isso substitui os 2 selects separados por uma acao guiada.

```
+---------------------------------------------+
|  FINALIZAR OS #0042 — ABC-1234              |
|---------------------------------------------|
|                                             |
|  Total: R$ 850,00                           |
|                                             |
|  Como o cliente vai pagar?                  |
|  [Dinheiro] [Pix] [Debito] [Credito]       |
|                                             |
|  [ ] Enviar aviso por WhatsApp              |
|                                             |
|  [Cancelar]        [Confirmar Entrega]      |
+---------------------------------------------+
```

### 6.2 Reorganizar modal de detalhes da OS
O modal de detalhes hoje mistura informacoes e acoes. Sugestao de organizacao em blocos visuais:

```
+---------------------------------------------+
|  OS #0042 — ABC-1234                    [X] |
|---------------------------------------------|
|  VEICULO: Gol G6 2019 — Joao Silva         |
|  MECANICO: Carlos    ENTRADA: 25/03 08h     |
|---------------------------------------------|
|  STATUS: [====select====]                   |
|---------------------------------------------|
|                                             |
|  SERVICOS                        R$ 350,00  |
|  - Troca de oleo              R$ 80,00      |
|  - Alinhamento + balanc.      R$ 120,00     |
|  - Troca pastilhas diant.     R$ 150,00     |
|                                             |
|  PECAS                           R$ 380,00  |
|  - Pastilha Bosch (estoque)   R$ 180,00     |
|  - Oleo Mobil 5W30 (avulso)   R$ 200,00    |
|  [+ Do estoque] [+ Item avulso]             |
|                                             |
|---------------------------------------------|
|  Servicos:  R$ 350     Pecas: R$ 380        |
|  Desconto:  R$ 30                           |
|  TOTAL:     R$ 700,00                       |
|---------------------------------------------|
|  [WhatsApp]        [Finalizar e Entregar]   |
+---------------------------------------------+
```

### 6.3 Kanban mobile: scroll horizontal com snap
No celular, as 7 colunas do Kanban nao cabem. Hoje ja tem overflow-x:auto, mas sem snap points. Adicionar CSS scroll-snap pra que cada coluna "encaixe" na tela ao arrastar.

Alem disso, considerar uma visualizacao alternativa pra mobile: lista vertical agrupada por status, em vez de colunas horizontais. Arrastar cards no celular e' dificil.

```
MOBILE — ALTERNATIVA LISTA
+---------------------------------------------+
|  Em Diagnostico (3)                    [-]  |
|---------------------------------------------|
|  ABC-1234  Gol 2019      Carlos    2h  >   |
|  DEF-5678  Onix 2021     Pedro    45min >   |
|  GHI-9012  Celta 2015    Carlos    3d  >   |
|---------------------------------------------|
|  Aguardando Aprovacao (1)              [-]  |
|---------------------------------------------|
|  JKL-3456  Civic 2020    -        1d   >   |
|---------------------------------------------|
|  Em Execucao (2)                       [-]  |
|  ...                                        |
+---------------------------------------------+
```

Com botoes de acao rapida ao arrastar o card pro lado (swipe):
- Swipe direita: avancar status
- Swipe esquerda: voltar status
- Tap: abre detalhes

### 6.4 Busca global
Hoje nao tem busca. O mecanico quer encontrar uma OS pela placa. Precisa ir na lista de OS e rolar. Um campo de busca global no topo (ou na barra do mobile) que busca por placa, nome do cliente ou numero da OS resolveria.

### 6.5 Breadcrumb de volta no modal de veiculo
Quando o usuario abre Clientes > Editar Cliente > Editar Veiculo, ao fechar o modal do veiculo ele deveria voltar pro modal do cliente automaticamente. Hoje ele volta pra tela de clientes e perde o contexto.

### 6.6 Tela inicial por perfil
- **Dono/Gerente:** Abre no Dashboard (visao geral)
- **Atendente:** Abre no Kanban (operacao)
- **Mecanico:** Abre no Kanban filtrado (seus carros)

Hoje todos abrem no Kanban, o que e' ok pro mecanico e atendente, mas o dono quer ver numeros primeiro.

---

## 7. WIREFRAME TEXTUAL — TELA DO MECANICO (MOBILE)

O mecanico e' o usuario mais importante no mobile. Ele esta com a mao suja, tela pequena, precisa ser rapido.

```
+---------------------------------------------+
|  RPM PRO              Carlos (Mecanico)     |
|---------------------------------------------|
|                                             |
|  MEUS CARROS HOJE (4)                       |
|                                             |
|  [!] ABC-1234  Gol 2019                     |
|      Troca de oleo + alinhamento            |
|      Ha 3 dias  <<<< ATRASADO               |
|      [Atualizar status v]                   |
|                                             |
|  DEF-5678  Onix Plus 2021                   |
|      Diagnostico eletrico                   |
|      Ha 2 horas                             |
|      [Atualizar status v]                   |
|                                             |
|  GHI-9012  Creta 2023                       |
|      Troca de pastilhas                     |
|      Ha 45 min                              |
|      [Marcar como pronto]                   |
|                                             |
|  JKL-3456  HB20 2020                        |
|      Revisao completa                       |
|      Aguardando peca                        |
|                                             |
+---------------------------------------------+
| [Meus Carros]  [+ OS]  [Buscar]  [Menu]    |
+---------------------------------------------+
```

Cada card tem acao direta: um select de status ou botao de atalho (ex: "Marcar como pronto" quando o status anterior e' execucao).

---

## 8. RESUMO DAS PRIORIDADES

| # | Melhoria | Impacto | Esforco |
|---|----------|---------|---------|
| 1 | Permissao por perfil (ocultar telas) | ALTO | Medio |
| 2 | Botao "Finalizar OS" guiado | ALTO | Baixo |
| 3 | Bottom nav mobile diferenciado por perfil | ALTO | Medio |
| 4 | Kanban mobile em lista vertical | ALTO | Medio |
| 5 | Busca global por placa/cliente | MEDIO | Baixo |
| 6 | Tela Financeiro basica (ou remover da sidebar) | MEDIO | Depende |
| 7 | Breadcrumb de volta (modal veiculo > cliente) | BAIXO | Baixo |
| 8 | Tela inicial por perfil | BAIXO | Baixo |

---

*Relatorio gerado por Lindinaldo (UX Designer) — RPM Pro*
*Data: 2026-03-25*
