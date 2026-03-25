# RPM Pro — Auditoria Backend
**Autor:** ROSINALDO (Dev Backend)
**Data:** 2026-03-25

---

## 1. AUDITORIA DO SCHEMA SQL

### 1.1 Colunas faltando na tabela `oficinas`
O JS (`config-oficina.js`) referencia `oficina.valor_hora` e `oficina.comissao_padrao`, mas essas colunas **NAO existem** no schema SQL. O `CONFIG.salvarValores()` faz update nesses campos e o `EQUIPE.abrirModal()` le `APP.oficina?.comissao_padrao`.

**Acao:** Adicionar ao schema:
```
ALTER TABLE oficinas ADD COLUMN valor_hora NUMERIC(12,2) DEFAULT 0;
ALTER TABLE oficinas ADD COLUMN comissao_padrao NUMERIC(5,2) DEFAULT 0;
```

### 1.2 Status `aguardando_peca` falta no CHECK constraint
O Kanban (`kanban.js` linha 7) define a coluna "Aguardando Peca" com status `aguardando_peca`, e o modal de detalhes da OS (`os.js` linha 470) lista esse status nas opcoes. Porem o CHECK constraint da tabela `ordens_servico` **NAO inclui** `aguardando_peca`:

```sql
-- Atual (ERRADO):
CHECK (status IN ('entrada','diagnostico','orcamento','aprovada','execucao','pronto','entregue','cancelada'))

-- Correto:
CHECK (status IN ('entrada','diagnostico','orcamento','aprovada','aguardando_peca','execucao','pronto','entregue','cancelada'))
```

Isso significa que qualquer drag-and-drop pro status "Aguardando Peca" no Kanban **vai dar erro 500**.

### 1.3 Campo `numero` como SERIAL dentro de UUID table
O campo `numero SERIAL` em `ordens_servico` gera uma sequence global. Em multi-tenant, o numero vai ter buracos entre oficinas (oficina A ve OS #1, #3, #5 e oficina B ve #2, #4, #6). Nao eh um bug bloqueante, mas confunde o usuario.

**Acao futura:** Criar um trigger ou RPC que gere numero sequencial POR oficina.

### 1.4 Sem `updated_at` em varias tabelas
Somente `ordens_servico` tem `updated_at`. Tabelas como `clientes`, `veiculos`, `pecas` e `profiles` nao tem. Isso dificulta auditoria e sync futuro.

### 1.5 Sem soft delete
Nenhuma tabela tem `deleted_at`. Deletes sao fisicos. Em SaaS, isso eh arriscado — uma OS excluida some pra sempre. Recomendo pelo menos em `ordens_servico` e `clientes`.

---

## 2. AUDITORIA DE RLS

### 2.1 Buracos criticos

#### OFICINAS — INSERT sem policy
Nao existe policy de INSERT na tabela `oficinas`. O fluxo de cadastro (`auth.js` linha 29) faz `insert` direto. Isso so funciona porque o Supabase com anon key provavelmente tem permissao via grants, **mas eh inseguro**. Qualquer usuario anonimo poderia criar oficinas.

**Acao:** Criar policy de INSERT que permita somente usuarios autenticados sem oficina, ou usar uma RPC SECURITY DEFINER pro onboarding.

#### PROFILES — INSERT race condition
A policy `profiles_insert` exige `oficina_id = auth_oficina_id()`. Mas no cadastro (`auth.js` linha 41), o profile ainda nao existe, entao `auth_oficina_id()` retorna NULL. Isso deveria impedir o INSERT.

**Explicacao provavel:** O INSERT da oficina (passo 2) cria a oficina, e o INSERT do profile (passo 3) usa o oficina_id retornado. Mas como `auth_oficina_id()` busca na tabela `profiles` onde o id do usuario esta, e o profile ainda nao foi criado, a funcao retorna NULL. Portanto `oficina_id = NULL` no WITH CHECK — **o INSERT vai falhar**.

**Isso eh um BUG CRITICO.** O signup so funciona se RLS estiver desabilitado na tabela profiles ou se existir um bypass que nao esta no SQL.

**Acao:** Criar uma RPC `criar_oficina_e_profile()` SECURITY DEFINER que faz o onboarding atomicamente, contornando RLS.

#### ESTOQUE_MOVIMENTOS — Sem UPDATE e DELETE
Faltam policies de UPDATE e DELETE. Correto pra movimentos (devem ser imutaveis), mas se alguma logica futura precisar corrigir, nao vai conseguir. Documente que movimentos sao append-only.

#### OFICINAS — Sem DELETE
Nenhuma policy de DELETE em oficinas. Ok pra seguranca, mas impossibilita exclusao de conta (LGPD).

#### PROFILES — Sem DELETE
Mesma situacao. Nao da pra excluir membros da equipe via RLS.

### 2.2 Funcao `auth_oficina_id()` — SECURITY DEFINER
A funcao eh `SECURITY DEFINER`, o que significa que roda com privilegio do criador (normalmente `postgres`). Isso eh necessario pra funcionar com RLS, mas precisa de atencao:
- Ela faz `SELECT oficina_id FROM profiles WHERE id = auth.uid()` — correto e seguro.
- Nao tem vulnerabilidade de injection.
- **Porem:** se um usuario tiver dois profiles (bug), retorna resultado imprevisivel. Adicione `LIMIT 1` por seguranca.

### 2.3 Resumo de policies por tabela

| Tabela | SELECT | INSERT | UPDATE | DELETE |
|--------|--------|--------|--------|--------|
| oficinas | OK | **FALTA** | OK | **FALTA** |
| profiles | OK | OK* | OK | **FALTA** |
| clientes | OK | OK | OK | OK |
| veiculos | OK | OK | OK | OK |
| ordens_servico | OK | OK | OK | OK |
| itens_os | OK | OK | OK | OK |
| pecas | OK | OK | OK | OK |
| estoque_movimentos | OK | OK | **FALTA** | **FALTA** |

*profiles_insert tem o bug do onboarding descrito acima.

---

## 3. AUDITORIA DE AUTH

### 3.1 Signup NAO eh atomico
O `AUTH.cadastrar()` em `auth.js` executa 3 passos sequenciais no cliente:
1. `auth.signUp()` — cria usuario no Supabase Auth
2. `insert oficinas` — cria oficina
3. `insert profiles` — cria profile

Se o passo 2 falha (ex: rede caiu), o usuario Auth existe mas sem oficina/profile. Resultado: login funciona mas `getProfile()` retorna null, e o sistema faz logout infinito.

Se o passo 3 falha, existe oficina orfao sem dono.

**Nao tem rollback.** Se der erro no passo 3, o passo 2 nao eh desfeito.

**Acao:** Mover todo o onboarding pra uma Edge Function ou RPC SECURITY DEFINER que faz tudo numa transacao.

### 3.2 Login apos signup — logica fragil
Linhas 19-24 de `auth.js`: se `signUp` nao retorna sessao (confirmacao de email ativa), tenta fazer login imediato. Mas se a confirmacao de email estiver ativa de verdade, o login vai falhar porque o email nao foi confirmado. Isso cria mensagem de erro confusa.

### 3.3 Sem protecao de role
O `equipe.js` permite que qualquer usuario da oficina edite roles e comissoes — incluindo se promover a `dono`. Nao existe validacao server-side (RLS nao verifica role).

**Acao:** Policies de UPDATE em profiles deveriam verificar que somente `dono` ou `gerente` podem alterar role de outros.

### 3.4 RPC `criar_membro_equipe` — nao existe no schema
O `equipe.js` linha 129 chama `db.rpc('criar_membro_equipe', {...})` mas essa funcao **NAO existe** no arquivo SQL. Ou ela foi criada manualmente no Supabase, ou vai dar erro ao tentar cadastrar novo membro.

---

## 4. QUERIES PROBLEMATICAS

### 4.1 Kanban carrega TUDO
`kanban.js` linha 23: busca todas as OS ativas **sem limit**. Uma oficina com 500+ OS acumuladas (historico de "entregue" aparece no kanban) vai carregar tudo. O filtro `not('status', 'eq', 'cancelada')` deixa "entregue" passando — e a coluna "Entregue" no kanban mostra TODAS ja entregues.

**Acao:** Filtrar `entregue` somente dos ultimos 7 dias, ou excluir do Kanban.

### 4.2 Dashboard — faturamento carrega todos os registros
`dashboard.js` linha 27: busca `select('valor_total')` de todas as OS pagas do mes pra somar no JS. Deveria usar `.select('valor_total.sum()')` ou uma RPC `SELECT SUM(valor_total)`. Com volume, isso transfere dados desnecessarios.

### 4.3 Busca de placa — ilike sem indice
`os.js` linha 294: `ilike('placa', placa + '%')` faz busca case-insensitive. O indice `idx_veiculos_placa` eh `(oficina_id, placa)` que funciona pra igualdade, mas `ILIKE` com pattern nao usa o indice B-tree padrao.

**Acao:** Criar indice `CREATE INDEX idx_veiculos_placa_pattern ON veiculos(oficina_id, upper(placa) text_pattern_ops);` ou normalizar placas sempre uppercase no INSERT.

### 4.4 Detalhes da OS — 3 queries paralelas (OK, mas...)
`os.js` linha 447: busca OS + itens + TODAS as pecas da oficina em paralelo. A busca de pecas nao tem filtro por relevancia. Oficina com 5000 pecas vai transferir tudo pro cliente so pra popular o autocomplete.

**Acao:** Remover a busca de pecas do `abrirDetalhes()` e buscar sob demanda no autocomplete (como ja faz `_buscarPecaEstoque` filtrando localmente).

### 4.5 OS.carregar() — limit 50 fixo, sem paginacao
`os.js` linha 9: `limit(50)`. Oficina com historico grande so ve as 50 mais recentes. Nao tem paginacao, filtro por data, ou busca.

### 4.6 Clientes sem limit
`clientes.js` linha 8: `select('*, veiculos(count)')` sem limit. 2000 clientes = query pesada.

### 4.7 Indices faltando
- `ordens_servico(oficina_id, pago, data_entrega)` — usado pelo dashboard pra faturamento
- `ordens_servico(oficina_id, created_at DESC)` — usado por OS.carregar()
- `veiculos(oficina_id, cliente_id)` — usado em cascata de clientes

---

## 5. DADOS HARDCODED QUE DEVIAM ESTAR NO BANCO

### 5.1 Catalogo de veiculos (`catalogo-veiculos.js`)
30+ marcas e 350+ modelos hardcoded no JS. Pra MVP, eh aceitavel. Mas pra SaaS:
- Oficina nao pode adicionar marcas/modelos sem deploy
- Futuro: integrar com tabela FIPE (API publica) ou tabela propria

**Prioridade:** BAIXA para MVP. Funciona bem.

### 5.2 Catalogo de servicos (`catalogo-servicos.js`)
120+ servicos com valores padrao hardcoded. Esse eh o mais problematico:
- Cada oficina tem precos diferentes
- Oficina especializada (ex: so ar condicionado) quer catalogo diferente
- Valores nao se atualizam sem deploy

**Acao pra V2:** Criar tabela `servicos_catalogo` (oficina_id, categoria, nome, valor_padrao) com seed global + customizacao por oficina.

### 5.3 Labels de status
Os labels de status (ex: `entrada: 'Entrada'`, `diagnostico: 'Diagnostico'`) estao duplicados em `os.js`, `dashboard.js` e `kanban.js`. Deveria estar num unico lugar.

### 5.4 Mensagens de WhatsApp
Templates de mensagem em `kanban.js` e `os.js` hardcoded. Deveria ser configuravel por oficina.

---

## 6. SCHEMA COMPLETO IDEAL PARA MVP

### 6.1 O que EXISTE e esta OK
- `oficinas` — OK (faltam 2 colunas, ver 1.1)
- `profiles` — OK
- `clientes` — OK
- `veiculos` — OK
- `ordens_servico` — OK (fix CHECK constraint, ver 1.2)
- `itens_os` — OK
- `pecas` — OK
- `estoque_movimentos` — OK

### 6.2 O que FALTA criar

#### `servicos_catalogo` — Catalogo customizavel por oficina
```
servicos_catalogo (
  id UUID PK,
  oficina_id UUID FK oficinas (NULL = global),
  categoria TEXT NOT NULL,
  nome TEXT NOT NULL,
  valor_padrao NUMERIC(12,2) DEFAULT 0,
  ativo BOOLEAN DEFAULT true,
  ordem INTEGER DEFAULT 0
)
```

#### `historico_status_os` — Auditoria de mudancas de status
```
historico_status_os (
  id UUID PK,
  oficina_id UUID FK,
  os_id UUID FK ordens_servico,
  status_anterior TEXT,
  status_novo TEXT NOT NULL,
  alterado_por UUID FK profiles,
  created_at TIMESTAMPTZ DEFAULT now()
)
```
Essencial pra: "quem mudou pra pronto?", "quanto tempo ficou em cada etapa?", metricas de produtividade.

#### `caixa` — Registro financeiro
```
caixa (
  id UUID PK,
  oficina_id UUID FK,
  os_id UUID FK ordens_servico (nullable),
  tipo TEXT CHECK ('entrada','saida'),
  categoria TEXT, -- 'servico','peca','despesa','retirada'
  valor NUMERIC(12,2) NOT NULL,
  forma_pagamento TEXT,
  descricao TEXT,
  created_by UUID FK profiles,
  created_at TIMESTAMPTZ DEFAULT now()
)
```
Hoje o financeiro depende totalmente das OS. Despesas operacionais (aluguel, luz, compras avulsas) nao tem onde registrar.

#### `agendamentos` — Retornos e agendamentos
```
agendamentos (
  id UUID PK,
  oficina_id UUID FK,
  cliente_id UUID FK,
  veiculo_id UUID FK,
  data_agendada TIMESTAMPTZ NOT NULL,
  servico TEXT,
  observacoes TEXT,
  status TEXT DEFAULT 'pendente' CHECK ('pendente','confirmado','cancelado','realizado'),
  lembrete_enviado BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
)
```
Essencial pra: retorno de clientes, lembrete de revisao, reducao de no-show.

#### `fornecedores` — Cadastro de fornecedores
```
fornecedores (
  id UUID PK,
  oficina_id UUID FK,
  nome TEXT NOT NULL,
  cnpj TEXT,
  telefone TEXT,
  whatsapp TEXT,
  email TEXT,
  observacoes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
)
```
Hoje pecas nao tem rastreabilidade de fornecedor.

### 6.3 RPCs faltando

#### `criar_oficina_e_profile(email, senha, nome_oficina, nome_usuario)`
SECURITY DEFINER. Faz signup atomico: cria auth user + oficina + profile numa transacao.

#### `criar_membro_equipe(p_oficina_id, p_nome, p_email, p_telefone, p_role, p_comissao, p_ativo)`
SECURITY DEFINER. Cria um profile sem vinculo com auth.users (membro que nao faz login). Precisa gerar UUID fake ou permitir NULL na FK.

#### `numero_proxima_os(p_oficina_id)`
Retorna proximo numero sequencial de OS por oficina.

---

## 7. ESTOQUE_MOVIMENTOS — ANALISE DE USO

### 7.1 Onde eh usado corretamente
- **Saida por OS** (`os.js` linha 734): ao adicionar peca do estoque na OS, registra movimento de `saida` com os_id, quantidade, custo e created_by. **Correto.**
- **Devolucao** (`os.js` linha 784): ao remover item de peca da OS, registra `entrada` de devolucao. **Correto.**

### 7.2 Onde NAO eh usado (e deveria)
- **Entrada de estoque:** Nao existe tela/fluxo pra registrar compra de pecas. O campo `quantidade` em `pecas` pode ser editado diretamente, mas sem gerar movimento. Resultado: historico incompleto.
- **Ajuste de inventario:** Nao existe fluxo de ajuste. Se o estoque fisico diverge, nao tem como corrigir com rastreabilidade.
- **Relatorios:** Nenhuma tela consome `estoque_movimentos`. Os dados estao la mas ninguem le.

### 7.3 Problema de concorrencia
`os.js` linha 729: a baixa de estoque faz `UPDATE pecas SET quantidade = estoqueDisp - qtd`. O valor `estoqueDisp` foi lido antes (linha 706 via `this._pecaSelecionadaQtd`). Se dois usuarios adicionam a mesma peca simultaneamente, ambos leem `quantidade = 10`, ambos gravam `quantidade = 9`, e o estoque fica errado.

**Acao:** Usar `quantidade = quantidade - qtd` no UPDATE, ou criar RPC com lock.

### 7.4 Devolucao pega quantidade atual
`os.js` linha 781: ao devolver peca, busca quantidade atual e soma. Mesmo problema de concorrencia.

**Acao:** Usar `quantidade = quantidade + qtd` no UPDATE.

---

## RESUMO DE PRIORIDADES

### CRITICO (fix antes de beta)
1. **CHECK constraint** de `ordens_servico.status` — adicionar `aguardando_peca`
2. **Colunas faltando** em `oficinas` — `valor_hora` e `comissao_padrao`
3. **Signup atomico** — o fluxo atual pode falhar silenciosamente e deixar dados orfaos
4. **RPC `criar_membro_equipe`** — nao existe no schema, equipe.js vai dar erro
5. **Policy INSERT em oficinas** — qualquer anon pode criar oficina
6. **Concorrencia de estoque** — usar `quantidade = quantidade - qtd`

### IMPORTANTE (fix pro beta funcionar bem)
7. Kanban sem limit em "entregue" — pode ficar lento rapido
8. Paginacao em OS e clientes
9. Protecao de role (impedir mecanico de se promover a dono)
10. Policies DELETE em profiles (pra poder desativar/remover membros)
11. Indice pra busca de placa com ILIKE

### V2 (pos-beta)
12. Tabela `servicos_catalogo` customizavel por oficina
13. Tabela `historico_status_os` pra metricas
14. Tabela `caixa` pra financeiro completo
15. Tabela `agendamentos` pra retorno de clientes
16. Tabela `fornecedores`
17. Numero sequencial de OS por oficina
18. Soft delete em tabelas criticas
19. `updated_at` em todas as tabelas
20. Templates de WhatsApp configuraveis
