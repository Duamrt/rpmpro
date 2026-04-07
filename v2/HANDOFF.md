# Handoff — RPM Pro
**Data:** 2026-04-07
**Sessão:** Implementação de sistema de permissões granulares por módulo e seção (estilo EDR)

## O que foi feito
- Criado `js/infra.js` — guardião central de permissões com `INFRA.checkPermissions(perfil)` e `INFRA.podeVer(key)`
- SQL `migration-permissions-profiles.sql` rodado: coluna `permissions JSONB DEFAULT NULL` adicionada em `profiles`
- `<script src="js/infra.js">` + chamada `INFRA.checkPermissions(PERFIL)` adicionados nas 17 páginas `-v2.html`
- **Módulos de permissão definidos:**
  - `folha` → bloqueia `folha-v2.html` inteira
  - `comissao` → bloqueia `comissao-v2.html` inteira
  - `fin_resumo` → esconde KPIs Faturado/Lucro no Dashboard + filtra abas do Financeiro (só deixa "Despesas")
  - `config` → bloqueia `config-v2.html` inteira
  - `crm` → bloqueia `crm-v2.html` + `satisfacao-v2.html`
- `config-v2.html` ganhou aba **"🛡️ Permissões"** (só visível para `dono`)
  - Lista todos da equipe (exceto dono)
  - Checkboxes por módulo, salva em `profiles.permissions` via `salvarPermissoes(uid)`
- `financeiro-v2.html`: se `fin_resumo=false`, força `ABA='despesas'` e filtra tabs do `carregar()`
- `dashboard-v2.html`: KPIs Faturado Mês e Lucro Mês condicionais a `INFRA.podeVer('fin_resumo')`
- Gerentes agora aparecem na lista de permissões (Rafael é gerente na oficina do Marcondes)
- Deploy atual: `v04071840`

## O que funcionou
- Abordagem URL-matching em `infra.js` (sem precisar de `data-module` em cada link da sidebar)
- `INFRA.podeVer(key)` como helper global que páginas consultam diretamente no JS dinâmico
- Gerente sem `permissions` definido → isento (mantém acesso total)
- Gerente com `permissions` definido → restrições aplicadas

## O que não funcionou / bloqueios
- `.not('role', 'in', '("dono","gerente")')` — sintaxe inválida no Supabase; substituído por `.neq()`
- Filtro `.eq('ativo', true)` excluía usuários sem esse campo preenchido — removido
- `.neq('role','gerente')` excluía Rafael (gerente) da lista de permissões — removido
- Inserção via perl do `INFRA.checkPermissions` gerou chamada duplicada em 3 arquivos inline (crm, execucao-os, satisfacao) — corrigidos manualmente

## Próximos passos
- **Testar com o Rafael logado:** confirmar que ele não vê Comissão, Folha, totais do Dashboard e só vê aba Despesas no Financeiro
- **Configurar permissões do Rafael no Marcondes:** Config → Permissões → Rafael → desmarcar fin_resumo, comissao, folha
- **Avaliar:** o "Resumo de Hoje" no Dashboard ainda mostra dados operacionais (OS do dia, métodos de pagamento) — verificar se deve ser parcialmente oculto para Rafael
- **Avaliar:** aba "A Receber" no Financeiro — Rafael precisa ver? Atualmente bloqueada junto com fin_resumo
- Atualizar memória do projeto com estado atual das permissões
- **⚠️ Investigar "Randolph":** apareceu na aba Permissões — usuário desconhecido, verificar se é conta de teste, fantasma ou cadastro indevido na oficina do Marcondes (`profiles` WHERE `oficina_id = Marcondes`)

## Arquivos modificados
- `v2/js/infra.js` — criado do zero, guardião de permissões
- `v2/config-v2.html` — aba Permissões, funções `renderPermissoes()`, `salvarPermissoes()`, `togglePermissao()`
- `v2/financeiro-v2.html` — filtro de abas + redirect ABA inicial
- `v2/dashboard-v2.html` — KPIs fin_resumo condicionais
- Todas as 17 páginas `-v2.html` — adicionado `<script src="js/infra.js">` + `INFRA.checkPermissions(PERFIL)`
- `~/Downloads/migration-permissions-profiles.sql` — já rodou no Supabase

## Contexto importante
- `INFRA._perms = null` → usuário isento (dono ou gerente sem permissions configurado) — `podeVer()` retorna `true`
- `profiles.permissions` é `NULL` por padrão → comportamento igual ao anterior para todos usuários existentes
- Rafael é `role='gerente'` na oficina do Marcondes — ficava de fora dos filtros anteriores por isso
- Padrões quando `permissions` está definido: `{ folha:false, comissao:false, fin_resumo:false, config:false, crm:false }`
- Pátio, OS, Clientes, Veículos, Agendamentos, Catálogo, Equipe, Produtividade → sempre visíveis (sem chave no mapa)
