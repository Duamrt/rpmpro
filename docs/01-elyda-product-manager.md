# RPM Pro -- Relatorio de Produto (Elyda, PM)
**Data:** 2026-03-25
**Objetivo:** Definir MVP real para o Carbon Car Service comecar a usar no dia a dia.

---

## 1. O QUE FOI CONSTRUIDO (auditoria honesta)

### Pronto e funcional
| Modulo | Status | Observacao |
|--------|--------|------------|
| Login/Cadastro | OK | Supabase Auth, cria oficina + profile automaticamente |
| Kanban de Patio | OK | 7 colunas, drag&drop, WhatsApp automatico, indicador visual de tempo, filtro por mecanico |
| Dashboard | OK | 4 KPIs + fila do dia com tabela clicavel |
| OS -- criar | OK | Busca por placa com autocomplete, cria cliente+veiculo inline se nao existe |
| OS -- detalhes | OK | Servicos com catalogo, pecas do estoque ou avulso, baixa automatica, desconto, totais, WhatsApp |
| OS -- lista | OK | Tabela com 50 ultimas, clicavel |
| Clientes | OK | CRUD completo, veiculos inline, validacao placa (antigo + Mercosul), checagem duplicata |
| Veiculos | OK | CRUD completo, catalogo 27 marcas brasileiras + motos, editar/excluir |
| Equipe | OK | Cadastro com role, comissao, ativo/inativo, RPC pra criar sem auth |
| Configuracoes | OK | Dados da oficina, CNPJ, valor/hora, comissao padrao, plano/trial |
| Catalogo de servicos | OK | 130+ servicos em 11 categorias com valor padrao de mao de obra |
| Catalogo de veiculos | OK | 27 marcas, ~300 modelos do mercado brasileiro |
| Schema SQL | OK | 8 tabelas, indices otimizados, RLS completo em todas |
| Multi-tenant | OK | oficina_id em tudo, RLS desde o dia 1, funcao auth_oficina_id() |
| Dark mode | OK | Nativo, cores profissionais (tema escuro tipo GitHub) |
| Mobile | PARCIAL | Sidebar toggle, bottom nav com 5 itens, kanban scroll horizontal |

### NAO existe (referenciado no HTML mas sem codigo)
| Modulo | Situacao |
|--------|----------|
| Pecas/Estoque (tela) | Botao "PECAS.abrirModal()" no HTML, mas js/pecas.js NAO EXISTE. Erro no console. |
| Financeiro (tela) | Section no HTML, mas ZERO implementacao. Nao tem JS. |

---

## 2. DECISAO DE MVP -- O que entra e o que sai

### A PERGUNTA CERTA: O que o Carbon precisa pra funcionar na segunda-feira?

Uma oficina mecanica precisa, no dia a dia:
1. Receber carro, abrir OS, atribuir mecanico
2. Orcar, aprovar, executar, avisar cliente, entregar
3. Cobrar e saber quanto faturou
4. Controlar pecas basicas (o que tem, o que saiu)

### FICA NO MVP (obrigatorio pro Carbon operar)

| # | Modulo | Status | Acao necessaria |
|---|--------|--------|-----------------|
| 1 | Login/Cadastro | PRONTO | Nenhuma |
| 2 | Kanban de Patio | PRONTO | Nenhuma -- ja e a tela principal, perfeito pra dia a dia |
| 3 | OS completa | PRONTO | Nenhuma -- criar, detalhar, servicos, pecas, desconto, status, pagamento |
| 4 | Clientes + Veiculos | PRONTO | Nenhuma |
| 5 | Equipe | PRONTO | Nenhuma |
| 6 | Configuracoes | PRONTO | Nenhuma |
| 7 | **Pecas/Estoque (tela)** | **FALTA** | **CRITICO -- precisa criar js/pecas.js. Ja tem schema, ja tem busca no os.js, so falta a tela de CRUD.** |
| 8 | Dashboard | PRONTO | Nenhuma |

### SAI DO MVP (fase 2+)

| Modulo | Motivo | Fase |
|--------|--------|------|
| Financeiro | Oficina pequena controla no caderno. KPI de faturamento no dashboard ja resolve o basico. Carbon nao vai precisar disso no dia 1. | Fase 2 (mes 2) |
| Relatorio/PDF de OS | Importante mas nao bloqueia uso diario. WhatsApp ja resolve comunicacao. | Fase 2 |
| Agenda/Agendamento online | Luxo. Carbon atende por ordem de chegada + WhatsApp. | Fase 3 |
| Historico do veiculo | Util mas nao essencial. OS ja fica no banco. | Fase 2 |
| Comissao detalhada (relatorio) | Tem o campo mas nao tem tela de relatorio. Carbon paga fixo hoje. | Fase 3 |
| Nota fiscal / integracao contabil | Nem pensar agora. | Fase 4 |
| App nativo / PWA | Mobile web ja funciona. | Fase 3 |
| Landing page / marketing | Dominio comprado. Foco agora e produto, nao venda. | Fase 2 |

---

## 3. O QUE FALTA CONSTRUIR PRO MVP

### BLOQUEADOR -- sem isso o Carbon nao usa

**1. Tela de Pecas/Estoque (js/pecas.js)**
- CRUD: cadastrar peca, editar, excluir
- Lista com busca, filtro por nome/codigo
- Mostrar: nome, codigo, marca, quantidade, estoque minimo, custo, preco venda, localizacao
- Alerta visual quando quantidade <= estoque_minimo
- Schema ja existe (tabela `pecas`), baixa automatica ja funciona no os.js
- Estimativa: 2-3 horas

### IMPORTANTE -- melhora muito a experiencia

**2. Impressao/compartilhamento de OS**
- Botao "Compartilhar" no detalhe da OS
- Gera texto formatado pro WhatsApp (servicos + pecas + total)
- O dono do Carbon vai querer mandar orcamento pro cliente. Hoje so tem msg generica.
- Estimativa: 1 hora

**3. Busca/filtro na lista de OS**
- Hoje mostra so as 50 ultimas, sem filtro
- Precisa: buscar por placa, por status, por periodo
- Estimativa: 1-2 horas

**4. Remover secao Financeiro do menu**
- Ta la, clica, e vazio. Impressao de inacabado.
- Ou esconde do menu, ou coloca uma mensagem "Em breve"
- Estimativa: 5 minutos

---

## 4. BUGS E PROBLEMAS ENCONTRADOS

| # | Problema | Severidade | Onde |
|---|----------|-----------|------|
| 1 | **PECAS.abrirModal() nao existe** -- erro no console ao clicar "+ Nova Peca" | CRITICO | index.html linha 158, js/pecas.js nao existe |
| 2 | **PECAS.carregar() nao existe** -- erro ao navegar pra tela de Pecas | CRITICO | Mesmo problema |
| 3 | Financeiro vazio -- clica e ve "Carregando..." eternamente | MEDIO | Nenhum JS carrega essa tela |
| 4 | OS.abrirDetalhes nao tem estado "aguardando_peca" no label de criacao | BAIXO | os.js statusLabel da lista nao inclui |
| 5 | Equipe: criar membro depende de RPC `criar_membro_equipe` -- precisa confirmar se existe no Supabase | MEDIO | equipe.js linha 129 |
| 6 | Kanban: seletor de contadores usa querySelector fragil `[style*="border-radius:12px"]` | BAIXO | kanban.js linha 205 |

---

## 5. PRIORIDADE DE EXECUCAO (ordem do que fazer)

```
SPRINT 1 -- Desbloquear MVP (1 dia)
  [1] Criar js/pecas.js (CRUD completo)
  [2] Corrigir/esconder Financeiro do menu (ou "Em breve")
  [3] Confirmar RPC criar_membro_equipe no Supabase
  [4] Testar fluxo completo: cadastro -> login -> cliente -> veiculo -> OS -> kanban -> entrega

SPRINT 2 -- Polimento pre-beta (2-3 dias)
  [5] Orcamento formatado pro WhatsApp (texto detalhado)
  [6] Filtro/busca na lista de OS
  [7] Corrigir bugs menores (items 4 e 6)
  [8] Testar mobile no celular real
  [9] Onboarding Carbon: criar conta, dados da oficina, equipe, primeiras pecas

SPRINT 3 -- Feedback loop (apos Carbon usar 1 semana)
  [10] Financeiro basico (entradas/saidas do mes, lucro)
  [11] Historico do veiculo (todas as OS daquela placa)
  [12] PDF da OS (pdfmake, igual EDR System)
```

---

## 6. AVALIACAO GERAL

**Nota: 8/10 -- Surpreendentemente solido pra uma primeira versao.**

O que esta bom:
- A OS e completa de verdade: servicos com catalogo, pecas do estoque com baixa automatica, peças avulsas, desconto, recalculo de totais. Isso nao e MVP raso.
- Kanban de patio e a melhor escolha pra tela principal. O dono da oficina olha e sabe o estado de tudo. Arrasta e atualiza. WhatsApp sai automatico.
- RLS desde o dia 1 e multi-tenant correto. Nao vai dar dor de cabeca depois.
- Busca por placa com autocomplete na criacao de OS e inteligente. Se o carro ja existe, puxa tudo. Se nao, cria na hora. Isso poupa tempo real.
- Catalogo de servicos com 130+ itens e precos padrao. Nao precisa digitar tudo do zero.

O que precisa de atencao:
- **A tela de Pecas/Estoque NAO EXISTE.** Isso e o unico bloqueador real. Sem ela, o cara cadastra peca aonde? So pela OS? Nao faz sentido.
- Financeiro vazio da impressao de sistema inacabado. Melhor esconder do que mostrar vazio.

**Veredicto: faltam literalmente 3 horas de trabalho pra isso virar um MVP usavel. A tela de pecas e o unico gargalo. O resto esta pronto.**

---

## 7. RECOMENDACAO FINAL

Fazer a tela de pecas, esconder o financeiro, e ligar pro primo do Duam.

O Carbon Car Service pode comecar a usar na semana que vem. Nao existe motivo tecnico pra atrasar.

O concorrente (SHOficina) cobra caro e tem interface de 2005. RPM Pro ja e visualmente superior e tem o diferencial do Kanban + WhatsApp automatico. O que vai ganhar o Carbon nao e feature -- e velocidade de resposta ao feedback dele.

Prioridade zero: colocar na mao do usuario. Tudo que vier depois vai ser guiado pelo uso real.

---

*Relatorio gerado por Elyda (PM) em 2026-03-25.*
*Proxima revisao: apos Sprint 1 (1 dia de desenvolvimento).*
