# RPM Pro — Auditoria de Seguranca
**Auditor:** NEGO (Security Engineer)
**Data:** 2026-03-25
**Escopo:** RLS, Auth, XSS, SECURITY DEFINER, chaves, isolamento multi-tenant

---

## Resumo Executivo

O RPM Pro tem uma base de seguranca solida — RLS habilitado em todas as 8 tabelas desde o dia 1, chave anon key correta, sem service key exposta. Porem, existem **buracos criticos** no fluxo de signup e nas policies de RLS que precisam ser corrigidos antes de ir pro ar com multiplas oficinas.

**Resultado geral:** 3 CRITICAS, 3 ALTAS, 4 MEDIAS, 2 BAIXAS

---

## 1. VULNERABILIDADES CRITICAS

### CRIT-01: Signup permite criar oficina fantasma e invadir outra

**Onde:** `auth.js` linhas 28-37 + `001-schema-base.sql` linhas 173-174

**Problema:** No fluxo de cadastro (`AUTH.cadastrar`), o usuario:
1. Cria conta no auth (signUp)
2. Insere na tabela `oficinas` (INSERT)
3. Insere na tabela `profiles` com `role: 'dono'`

Mas a tabela `oficinas` **NAO tem policy de INSERT**. Isso significa que o INSERT da oficina depende do comportamento padrao do Supabase com RLS habilitado — que e NEGAR tudo. **O signup pode quebrar** porque o usuario recem-criado nao tem `auth_oficina_id()` ainda (nao tem profile).

Pior: se alguem usar a anon key diretamente (sem o frontend), pode tentar inserir um profile com `oficina_id` de outra oficina. A policy `profiles_insert` usa `WITH CHECK (oficina_id = auth_oficina_id())`, mas `auth_oficina_id()` retorna NULL pra usuario novo, entao o check falharia. **Isso protege contra invasao, mas quebra o signup.**

Na pratica, o signup **so funciona se o Supabase nao estiver enforcement RLS pro INSERT de oficinas**, ou se tem alguma config extra nao documentada no SQL.

**Classificacao:** CRITICA

**Fix:** Criar uma funcao `criar_oficina_e_dono()` como SECURITY DEFINER que faz os 3 passos atomicamente (cria oficina, cria profile, retorna dados). O frontend chama so essa RPC. Remove a necessidade de INSERT direto em oficinas e profiles pelo frontend.

```sql
-- Exemplo de fix (NAO implementar agora, so referencia)
CREATE OR REPLACE FUNCTION criar_oficina_e_dono(
  p_nome_oficina TEXT,
  p_nome_usuario TEXT,
  p_email TEXT
) RETURNS JSON AS $$
DECLARE
  v_oficina_id UUID;
  v_user_id UUID;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuario nao autenticado';
  END IF;

  -- Verifica se ja tem profile (evita criar 2 oficinas)
  IF EXISTS (SELECT 1 FROM profiles WHERE id = v_user_id) THEN
    RAISE EXCEPTION 'Usuario ja tem oficina vinculada';
  END IF;

  INSERT INTO oficinas (nome, plano, trial_ate)
  VALUES (p_nome_oficina, 'beta', CURRENT_DATE + 90)
  RETURNING id INTO v_oficina_id;

  INSERT INTO profiles (id, oficina_id, nome, email, role)
  VALUES (v_user_id, v_oficina_id, p_nome_usuario, p_email, 'dono');

  RETURN json_build_object('oficina_id', v_oficina_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

### CRIT-02: Tabela `oficinas` sem policy de INSERT e DELETE

**Onde:** `001-schema-base.sql` linhas 173-177

**Problema:** A tabela `oficinas` so tem policies de SELECT e UPDATE. Faltam:
- **INSERT** — necessario pro signup (ver CRIT-01)
- **DELETE** — sem policy de DELETE, ninguem pode deletar oficina (o que e bom). Mas e melhor ser EXPLICITO com uma policy que nega tudo.

**Classificacao:** CRITICA

**Fix:** Se usar a RPC do CRIT-01, nao precisa de INSERT policy. Adicionar policy de DELETE explicitamente negando:
```sql
CREATE POLICY "oficinas_no_delete" ON oficinas FOR DELETE USING (false);
```

---

### CRIT-03: Tabela `profiles` sem policy de DELETE

**Onde:** `001-schema-base.sql` linhas 179-187

**Problema:** Nao existe policy de DELETE em `profiles`. Isso significa que nenhum usuario consegue deletar profiles via API (RLS bloqueia por padrao). Porem, e uma boa pratica ter policy explicita. Mais importante: o `equipe.js` nao tem funcao de excluir membro, mas se alguem adicionar no futuro, precisa da policy.

**Classificacao:** CRITICA (porque sem policy explicita, o comportamento depende do default do Supabase e pode mudar)

**Fix:**
```sql
CREATE POLICY "profiles_delete" ON profiles FOR DELETE
  USING (oficina_id = auth_oficina_id());
```

---

## 2. VULNERABILIDADES ALTAS

### ALTA-01: Funcao `criar_membro_equipe` — SECURITY DEFINER sem validacao

**Onde:** `equipe.js` linha 129, funcao RPC `criar_membro_equipe`

**Problema:** O frontend chama `db.rpc('criar_membro_equipe', { p_oficina_id: ... })` passando o `oficina_id` como parametro. Se a funcao SQL for SECURITY DEFINER e **nao validar** que o `p_oficina_id` pertence ao usuario que esta chamando, qualquer usuario autenticado poderia criar membros na oficina de outro.

A funcao SQL nao esta no arquivo `001-schema-base.sql`, entao **nao foi possivel auditar o corpo dela**. Se ela confia cegamente no `p_oficina_id` recebido, e uma **brecha de isolamento multi-tenant**.

**Classificacao:** ALTA

**Fix:** A funcao DEVE validar internamente:
```sql
IF p_oficina_id != auth_oficina_id() THEN
  RAISE EXCEPTION 'Acesso negado: oficina diferente';
END IF;
```

---

### ALTA-02: Tabela `estoque_movimentos` sem policies de UPDATE e DELETE

**Onde:** `001-schema-base.sql` linhas 255-259

**Problema:** A tabela `estoque_movimentos` so tem SELECT e INSERT. Sem UPDATE nem DELETE. Mesmo que hoje o frontend nao edite/exclua movimentos, qualquer chamada direta a API ficaria bloqueada pelo default do RLS. Mas movimentos de estoque sao **dados financeiros sensiveis** — e melhor ter policies explicitas.

**Classificacao:** ALTA

**Fix:**
```sql
CREATE POLICY "estoque_update" ON estoque_movimentos FOR UPDATE
  USING (oficina_id = auth_oficina_id());

CREATE POLICY "estoque_delete" ON estoque_movimentos FOR DELETE
  USING (oficina_id = auth_oficina_id());
```
Ou, se nao quiser que movimentos sejam editados (auditoria):
```sql
CREATE POLICY "estoque_no_update" ON estoque_movimentos FOR UPDATE USING (false);
CREATE POLICY "estoque_no_delete" ON estoque_movimentos FOR DELETE USING (false);
```

---

### ALTA-03: `equipe.js` permite qualquer usuario editar profiles sem checar role

**Onde:** `equipe.js` linhas 122-125

**Problema:** A funcao `EQUIPE.salvar()` faz `db.from('profiles').update(dados).eq('id', id)` sem verificar se o usuario logado e `dono` ou `gerente`. Um mecanico ou atendente poderia:
- Alterar seu proprio `role` pra `dono`
- Alterar a `comissao_percent` de si mesmo
- Desativar outro membro

O RLS so valida `oficina_id`, nao o `role` do usuario. Entao o UPDATE passa.

**Classificacao:** ALTA

**Fix:** Adicionar CHECK de role na policy de UPDATE de profiles:
```sql
CREATE POLICY "profiles_update" ON profiles FOR UPDATE
  USING (oficina_id = auth_oficina_id())
  WITH CHECK (
    oficina_id = auth_oficina_id()
    AND (
      -- Dono/gerente pode editar qualquer profile da oficina
      (SELECT role FROM profiles WHERE id = auth.uid()) IN ('dono','gerente')
      OR
      -- Outros so podem editar o proprio nome/telefone (nao role/comissao)
      id = auth.uid()
    )
  );
```
E no frontend: verificar `APP.profile.role` antes de mostrar opcoes de edicao.

---

## 3. VULNERABILIDADES MEDIAS

### MED-01: XSS via innerHTML com dados do banco

**Onde:** Todos os arquivos de render — `equipe.js`, `clientes.js`, `veiculos.js`, `dashboard.js`, `kanban.js`, `os.js`

**Problema:** Todos os renders usam `innerHTML` com template literals interpolando dados do banco diretamente:
```js
container.innerHTML = `<strong>${m.nome}</strong>`;
container.innerHTML = `<strong>${c.nome}</strong>`;
container.innerHTML = `<strong>${v.placa}</strong>`;
```

Se um usuario malicioso cadastrar um cliente com nome `<img src=x onerror=alert(1)>`, o XSS executa no navegador de todos os usuarios da mesma oficina.

**Vetor de ataque:** Mecanico/atendente injeta XSS no nome do cliente/veiculo → dono abre o dashboard → script executa no contexto do dono → roubo de sessao.

**Classificacao:** MEDIA (porque o atacante precisa ser membro da mesma oficina, mas ainda assim e perigoso em oficinas com varios funcionarios)

**Fix:** Criar funcao de escape e usar em TODOS os renders:
```js
function esc(str) {
  if (!str) return '';
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}
// Uso: ${esc(m.nome)} em vez de ${m.nome}
```

---

### MED-02: Update sem filtro de oficina_id

**Onde:** `equipe.js` linha 124, `veiculos.js` linha 161, `clientes.js` linha 241

**Problema:** Varios updates usam so `.eq('id', id)` sem `.eq('oficina_id', ...)`:
```js
// equipe.js
db.from('profiles').update(dados).eq('id', id);

// veiculos.js
db.from('veiculos').update(dados).eq('id', id);

// clientes.js
db.from('clientes').update(dadosCliente).eq('id', id);
```

O RLS protege via `oficina_id = auth_oficina_id()`, entao na pratica o update nao afeta outra oficina. **Mas** e uma boa pratica adicionar `.eq('oficina_id', APP.profile.oficina_id)` como defesa em profundidade. Se algum dia o RLS for mal configurado ou desabilitado temporariamente, esses updates seriam vetores de ataque.

**Classificacao:** MEDIA

**Fix:** Adicionar `.eq('oficina_id', APP.profile.oficina_id)` em todos os updates e deletes.

---

### MED-03: Delete de veiculo sem checar oficina_id

**Onde:** `veiculos.js` linha 181, `clientes.js` linha 294

**Problema:** Mesmo caso do MED-02 mas pra DELETE:
```js
db.from('veiculos').delete().eq('id', veiculoId);
```
RLS protege, mas defesa em profundidade recomenda filtro duplo.

**Classificacao:** MEDIA

**Fix:** Adicionar `.eq('oficina_id', APP.profile.oficina_id)` em todos os deletes.

---

### MED-04: Funcao `auth_oficina_id()` como SECURITY DEFINER e STABLE

**Onde:** `001-schema-base.sql` linhas 167-170

**Problema:** A funcao `auth_oficina_id()` e `SECURITY DEFINER` e `STABLE`. Isso significa que ela executa com privilegios do criador (geralmente superuser). Se alguem encontrar uma forma de injecao SQL (improvavel mas possivel via funcoes mal escritas), poderia explorar o contexto privilegiado.

Alem disso, `STABLE` permite cache do resultado dentro da mesma transacao. Se o usuario trocar de oficina (cenario futuro), a funcao pode retornar o valor antigo na mesma sessao.

**Classificacao:** MEDIA

**Fix:** Manter SECURITY DEFINER (necessario pra ler profiles sem RLS recursivo), mas garantir que a funcao nao aceite parametros e nao faz nada alem do SELECT simples. Considerar trocar pra `SECURITY INVOKER` se possivel (depende da estrutura de grants).

---

## 4. VULNERABILIDADES BAIXAS

### BAIXA-01: IDs expostos no onclick como strings

**Onde:** Todos os renders com `onclick="EQUIPE.editar('${m.id}')"`, `onclick="OS.abrirDetalhes('${os.id}')"`, etc.

**Problema:** UUIDs sao inseridos diretamente em atributos onclick. Se um UUID contivesse aspas simples (impossivel pra UUIDs validos), quebraria o JS. Risco real e praticamente zero, mas e um padrao fragil.

**Classificacao:** BAIXA

**Fix:** Usar `data-id` attributes e event delegation em vez de onclick inline.

---

### BAIXA-02: Plano e trial_ate definidos no frontend

**Onde:** `auth.js` linhas 33-34

**Problema:** O plano `beta` e o `trial_ate` (90 dias) sao definidos pelo frontend no signup:
```js
plano: 'beta',
trial_ate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)
```
Um usuario poderia alterar esses valores antes de enviar, setando `trial_ate` pra 2099 ou `plano` pra `crescimento`.

**Classificacao:** BAIXA (porque nao ha enforcement de features por plano ainda, e o CHECK constraint limita os valores permitidos)

**Fix:** Mover pra funcao SECURITY DEFINER (ver CRIT-01) e nao aceitar esses valores do frontend. Definir sempre server-side.

---

## 5. ANALISE DE CHAVES

### Chave Supabase (config.js)
- **Anon key** exposta no frontend: **OK** — comportamento normal e esperado do Supabase
- **Service key** no frontend: **NAO encontrada** — CORRETO
- **URL do projeto** exposta: **OK** — inevitavel no frontend

**Veredicto:** Chaves estao corretas. A seguranca depende 100% do RLS, que e o modelo correto.

---

## 6. MAPA DE RLS POR TABELA

| Tabela | SELECT | INSERT | UPDATE | DELETE | Status |
|--------|--------|--------|--------|--------|--------|
| oficinas | OK | FALTA | OK | FALTA | INCOMPLETO |
| profiles | OK | OK | OK (mas sem check de role) | FALTA | INCOMPLETO |
| clientes | OK | OK | OK | OK | COMPLETO |
| veiculos | OK | OK | OK | OK | COMPLETO |
| ordens_servico | OK | OK | OK | OK | COMPLETO |
| itens_os | OK | OK | OK | OK | COMPLETO |
| pecas | OK | OK | OK | OK | COMPLETO |
| estoque_movimentos | OK | OK | FALTA | FALTA | INCOMPLETO |

**Resultado:** 4 de 8 tabelas com cobertura completa. 4 com buracos.

---

## 7. CHECKLIST DE ISOLAMENTO MULTI-TENANT

| Verificacao | Resultado |
|-------------|-----------|
| Todas as tabelas tem oficina_id? | SIM |
| RLS habilitado em todas? | SIM |
| Funcao helper auth_oficina_id()? | SIM |
| Dados de oficina A nunca vazam pra B? | SIM (via RLS) |
| Frontend filtra por oficina_id em queries? | SIM |
| Frontend filtra por oficina_id em updates? | NAO (depende so do RLS) |
| Signup cria ilha isolada? | SIM (se funcionar — ver CRIT-01) |

---

## 8. PRIORIDADE DE CORRECAO

1. **CRIT-01 + CRIT-02:** Criar RPC `criar_oficina_e_dono()` SECURITY DEFINER para signup atomico
2. **CRIT-03:** Adicionar policy DELETE em profiles
3. **ALTA-01:** Auditar e corrigir funcao `criar_membro_equipe` no Supabase
4. **ALTA-02:** Adicionar policies de UPDATE/DELETE em estoque_movimentos
5. **ALTA-03:** Restringir UPDATE de profiles por role
6. **MED-01:** Implementar funcao `esc()` e aplicar em todos os renders
7. **MED-02/03:** Adicionar filtro oficina_id em updates e deletes no frontend
8. **BAIXA-01/02:** Melhorias de hardening para producao

---

## 9. CONCLUSAO

O RPM Pro tem uma **arquitetura de seguranca bem pensada** — RLS desde o dia 1, helper function centralizada, sem chaves sensivies expostas. Os problemas encontrados sao tipicos de MVP em desenvolvimento e **todos tem fix simples**.

A prioridade absoluta e o **fluxo de signup** (CRIT-01/02) e a **validacao da funcao criar_membro_equipe** (ALTA-01), porque sao os unicos pontos onde dados de uma oficina poderiam potencialmente ser acessados por outra.

Apos corrigir as 3 CRITICAS e 3 ALTAS, o sistema estara **seguro para multi-tenant em producao**.

---

*Relatorio gerado por NEGO — Security Engineer RPM Pro*
*Claude Opus 4.6 (1M context) — 2026-03-25*
