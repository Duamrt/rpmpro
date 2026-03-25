# RPM Pro — Relatorio de QA (HELENO)

**Data:** 2026-03-25
**Versao analisada:** Codigo atual (pre-beta)
**Metodo:** Analise estatica de codigo (leitura completa de todos os JS, HTML e SQL)

---

## RESUMO EXECUTIVO

O sistema tem uma base solida: RLS desde o dia 1, multi-tenant por oficina_id, fluxo principal (placa -> OS -> kanban -> entrega) bem desenhado. Porem, existem **2 bugs BLOCKER** que impedem o beta, **8 problemas MAJOR** que vao causar dor de cabeca no dia-a-dia, e **12 issues MINOR** de polimento.

---

## BUGS BLOCKER (impedem o beta)

### B01 — Modulo PECAS/ESTOQUE nao existe [BLOCKER]
O `index.html` (linha 158) chama `PECAS.abrirModal()` no botao "+ Nova Peca", mas **nao existe nenhum arquivo JS com `const PECAS`**. Nao tem `pecas.js` nem nenhum modulo que defina esse objeto. Clicar em "Pecas / Estoque" na sidebar vai dar **erro no console** e nao carregar nada. Sem estoque, nao da pra adicionar pecas do estoque na OS.

**Impacto:** Pagina inteira quebrada. Dono da oficina nao consegue cadastrar pecas.

### B02 — Status `aguardando_peca` nao existe no CHECK do banco [BLOCKER]
O kanban (linha 8) e a OS (linha 470) usam o status `aguardando_peca`, mas o CHECK constraint na tabela `ordens_servico` do SQL so aceita: `entrada, diagnostico, orcamento, aprovada, execucao, pronto, entregue, cancelada`. Mover um card pro "Aguardando Peca" no kanban vai dar **erro de constraint violation** no Supabase.

**Impacto:** Kanban quebra ao arrastar card. Fluxo central do sistema.

---

## BUGS MAJOR (causam problemas serios no uso real)

### M01 — Modulo FINANCEIRO nao existe [MAJOR]
O `index.html` tem a pagina `page-financeiro` na sidebar e no HTML, mas nao existe nenhum JS que carregue conteudo nessa pagina. Vai ficar travado em "Carregando..." eternamente.

**Impacto:** Dono da oficina espera ver financeiro e nao ve nada.

### M02 — Cadastro cria oficina sem RLS de INSERT na tabela oficinas [MAJOR]
O `auth.js` (linha 29) faz INSERT direto na tabela `oficinas`, mas no schema so existem policies de SELECT e UPDATE pra oficinas — **nao tem INSERT policy**. O INSERT vai falhar com erro de RLS.

O mesmo vale pra `profiles` INSERT na linha 41-49: o `auth_oficina_id()` retorna NULL porque o profile ainda nao existe quando ta sendo criado (paradoxo da galinha e do ovo). A policy `profiles_insert` exige `oficina_id = auth_oficina_id()`, mas `auth_oficina_id()` faz SELECT em profiles... que ainda nao tem o registro.

**Impacto:** Ninguem consegue criar conta. Fluxo de onboarding 100% quebrado.

### M03 — RPC `criar_membro_equipe` referenciada mas nao definida [MAJOR]
O `equipe.js` (linha 129) chama `db.rpc('criar_membro_equipe', {...})`, mas essa funcao nao existe no schema SQL. Provavelmente precisa de uma funcao no Supabase que gere um UUID fake pra profiles.id (ja que profiles tem FK pra auth.users, e um membro da equipe nao necessariamente tem conta).

**Impacto:** Nao da pra adicionar mecanico novo. Equipe so tem o dono.

### M04 — Placa duplicada nao e validada no banco [MAJOR]
Nao existe constraint UNIQUE na placa por oficina (`UNIQUE(oficina_id, placa)` na tabela veiculos). O JS valida formato, mas nao impede cadastrar a mesma placa 2 vezes. Isso vai gerar confusao enorme — 2 fichas do mesmo carro.

**Impacto:** Dados duplicados, OS vinculada ao veiculo errado.

### M05 — Sem paginacao na lista de OS [MAJOR]
O `os.js` (linha 9) faz `.limit(50)`. Oficina com volume medio (5 OS/dia) vai estourar 50 em 10 dias uteis. Depois disso, OS antigas somem da lista sem aviso.

**Impacto:** Dono pensa que perdeu OS. Nao tem busca, nao tem filtro, nao tem "carregar mais".

### M06 — Concorrencia no estoque: race condition [MAJOR]
Quando dois mecanicos adicionam a mesma peca do estoque ao mesmo tempo (linhas 700-750 do os.js), o fluxo e:
1. Le quantidade atual
2. Calcula nova quantidade no JS
3. Faz UPDATE com valor calculado

Se dois requests le "10 em estoque" simultaneamente e cada um tira 1, os dois calculam 9 e gravam 9. Resultado: baixou 2, mas estoque mostra 9 em vez de 8.

**Impacto:** Estoque diverge da realidade. Quanto mais movimento, pior fica.

### M07 — Desconto pode ser maior que o total [MAJOR]
O `os.js` (linha 819) aceita qualquer valor de desconto. Nao verifica se desconto > total. Resultado: valor_total pode ficar negativo. Dashboard vai mostrar faturamento distorcido.

**Impacto:** Valores negativos nas OS, relatorio financeiro errado.

### M08 — Excluir veiculo nao verifica OS vinculadas [MAJOR]
O `veiculos.js` (linha 178-184) exclui veiculo diretamente. A tabela `ordens_servico` tem `veiculo_id REFERENCES veiculos(id) NOT NULL` sem ON DELETE CASCADE. Se o veiculo tem OS vinculada, o DELETE vai falhar com FK violation — mas a mensagem de erro sera generica e confusa.

**Impacto:** Erro confuso pro usuario. Se tivesse CASCADE, pior ainda — apagaria OS.

---

## ISSUES MINOR (polimento e UX)

### N01 — `showTab` usa `event` global em vez de parametro [MINOR]
No `login.html` (linha 95), `event.target.classList.add('active')` usa o `event` implicito do window. Funciona em Chrome, mas pode falhar em outros browsers. Deveria receber `event` como parametro.

### N02 — Sem mascara de telefone/WhatsApp [MINOR]
Os campos de WhatsApp e telefone nao tem mascara. O usuario pode digitar qualquer coisa: "87 98171-3987", "(87) 98171-3987", "8798171-3987". O WhatsApp API precisa de formato limpo, entao funciona no envio (faz `.replace(/\D/g, '')`), mas a exibicao fica bagunçada.

### N03 — Avatar fixo "D" [MINOR]
O `index.html` (linha 51) tem `id="user-avatar"` com valor fixo "D". Deveria pegar a primeira letra do nome do usuario.

### N04 — Bottom-nav mobile nao tem Dashboard, Financeiro e Config [MINOR]
O bottom-nav (linhas 199-215) so tem 5 itens: Patio, OS, Clientes, Estoque, Equipe. Dashboard, Financeiro e Configuracoes so sao acessiveis pelo sidebar desktop.

### N05 — Kanban filtro de mecanico nao persiste [MINOR]
Ao trocar de pagina e voltar pro kanban, o filtro reseta. Nao usa localStorage.

### N06 — OS lista nao tem busca por placa [MINOR]
Na pagina de OS, nao tem campo de busca. Dono com 50+ OS nao consegue achar uma especifica sem scroll.

### N07 — Sem confirmacao ao mudar status da OS no detalhe [MINOR]
O select de status (linha 514 do os.js) faz update imediato no `onchange`. Se o dono selecionar "Cancelada" sem querer, cancela na hora sem confirmar.

### N08 — Toast nao e acessivel em mobile [MINOR]
O toast e criado com `document.body.appendChild`. Se o layout tiver scroll, pode aparecer fora da area visivel.

### N09 — Sem loading state nos botoes de salvar [MINOR]
Diferente do login (que mostra "Entrando..."), os modais de cliente, veiculo, equipe e OS nao desabilitam o botao durante o salvamento. Duplo clique = registro duplicado.

### N10 — Formato do numero da OS [MINOR]
O `numero` e SERIAL no banco (1, 2, 3...) mas e exibido sem padding. Na tela mostra "OS #1" em vez de "OS #0001". Minor, mas oficina profissional espera formato padronizado.

### N11 — XSS potencial em campos de texto [MINOR]
Varios campos sao renderizados com template literals diretos (ex: `${c.nome}`, `${os.descricao}`). Se alguem digitar `<script>alert(1)</script>` no nome do cliente, o HTML vai interpretar. Baixo risco porque o dado e da propria oficina, mas e ma pratica.

### N12 — Campo `valor_hora` da oficina nao e usado em nenhum lugar [MINOR]
O config-oficina.js salva `valor_hora` (linha 69), mas nenhum calculo usa esse valor. Os servicos usam valores fixos do catalogo.

---

## EDGE CASES ANALISADOS

### E se o mecanico nao tem internet?
**Sem tratamento.** Nao existe modo offline, service worker, ou cache local. Se perder conexao no meio de um drag no kanban, o status nao atualiza e o usuario nao recebe feedback claro. As chamadas ao Supabase vao falhar silenciosamente (sem try/catch no `KANBAN.drop`, linha 159).

### E se dois mecanicos abrem a mesma OS ao mesmo tempo?
**Last write wins.** Nao tem locking, versioning, nem deteccao de conflito. Se um muda o status pra "execucao" e outro muda pra "pronto" no mesmo segundo, o ultimo a salvar ganha. Isso e aceitavel pro MVP, mas precisa de um aviso ou timestamp check no futuro.

### E se o estoque fica negativo?
**Permite com confirmacao.** O `os.js` (linha 708) mostra confirm se `qtd > estoqueDisp`, mas deixa prosseguir. O campo `quantidade` na tabela `pecas` e NUMERIC sem CHECK >= 0, entao aceita negativo no banco. Aceitavel pro beta, mas precisa de alerta visual quando estoque ta negativo.

### E se o cliente nao tem WhatsApp?
**Tratado parcialmente.** O botao de WhatsApp so aparece se `os.clientes?.whatsapp` existe (linha 594 do os.js). No kanban, o `KANBAN.drop` checa `if (whats)` antes de sugerir envio. Funciona, mas nao sugere cadastrar o WhatsApp quando ta vazio.

### E se digitar placa com espaco?
**Tratado.** O `formatarPlaca` (linha 133 do clientes.js) faz `replace(/[^A-Za-z0-9]/g, '')` que remove espacos, tracos e caracteres especiais. Funciona bem.

---

## SEGURANCA

### S01 — Chave anon exposta no JS [INFO]
A `SUPABASE_ANON_KEY` esta no `config.js`. Isso e padrao pra SPA + Supabase (a chave anon e publica por design), mas a seguranca depende 100% das RLS policies. O RLS parece solido — 8 tabelas com policies restritivas.

### S02 — Sem rate limiting no cadastro [MINOR]
Alguem pode criar dezenas de oficinas automaticamente. O Supabase tem rate limit no auth por padrao, mas nao na criacao de oficinas.

### S03 — Profiles INSERT tem paradoxo de RLS [MAJOR]
(Ja documentado em M02)

---

## CHECKLIST DE TESTES PRE-BETA

### Fluxo Critico (testar primeiro)
- [ ] Criar conta nova → logar → ver tela principal
- [ ] Configurar dados da oficina (nome, CNPJ, endereco)
- [ ] Adicionar mecanico na equipe
- [ ] Cadastrar cliente com veiculo
- [ ] Abrir OS digitando placa existente (autocomplete)
- [ ] Abrir OS com placa nova (cria cliente + veiculo inline)
- [ ] Adicionar servico do catalogo na OS
- [ ] Adicionar peca do estoque na OS
- [ ] Adicionar item avulso na OS
- [ ] Mover card no kanban (todos os status)
- [ ] Mudar status pra "pronto" → verificar mensagem WhatsApp
- [ ] Marcar pagamento e fechar OS

### Estoque
- [ ] Cadastrar peca no estoque (PRECISA DO MODULO PECAS — B01)
- [ ] Usar peca na OS → verificar baixa do estoque
- [ ] Remover peca da OS → verificar devolucao
- [ ] Tentar usar mais pecas do que tem → confirm de estoque negativo

### Edge Cases
- [ ] Desconectar internet e tentar salvar → mensagem de erro?
- [ ] Duplo clique rapido no "Salvar" de qualquer modal
- [ ] Placa com espaco, minuscula, formato Mercosul (ABC1D23)
- [ ] Cliente sem WhatsApp → botao nao aparece
- [ ] Desconto maior que o total → valor negativo?
- [ ] Excluir veiculo que tem OS

### Multi-usuario
- [ ] Dois usuarios na mesma oficina → veem os mesmos dados
- [ ] Mecanico ve so OS dele no kanban
- [ ] Dono ve todas as OS
- [ ] Oficina A nao ve dados da oficina B

### Mobile
- [ ] Bottom-nav funciona
- [ ] Kanban com scroll horizontal
- [ ] Modais respondem bem
- [ ] Toggle do sidebar

---

## PRIORIDADE DE CORRECAO

| # | Issue | Severidade | Esforco |
|---|-------|-----------|---------|
| B01 | Modulo PECAS nao existe | BLOCKER | Alto (modulo inteiro) |
| B02 | Status aguardando_peca no CHECK | BLOCKER | Baixo (ALTER TABLE) |
| M02 | RLS impede cadastro (galinha/ovo) | MAJOR | Medio (policies + SECURITY DEFINER) |
| M03 | RPC criar_membro_equipe nao existe | MAJOR | Medio (funcao SQL) |
| M01 | Modulo FINANCEIRO nao existe | MAJOR | Alto (modulo inteiro) |
| M04 | Placa duplicada sem UNIQUE | MAJOR | Baixo (ALTER TABLE) |
| M06 | Race condition estoque | MAJOR | Medio (usar RPC com transacao) |
| M07 | Desconto > total | MAJOR | Baixo (validacao JS) |
| M08 | Excluir veiculo com OS | MAJOR | Baixo (verificar antes) |
| M05 | Sem paginacao na OS | MAJOR | Medio |
| N09 | Duplo clique = duplicata | MINOR | Baixo |
| N07 | Sem confirm em status Cancelada | MINOR | Baixo |
| N11 | XSS potencial | MINOR | Medio (sanitizar) |

---

## VEREDITO

**O sistema NAO esta pronto pro beta.** Os dois BLOCKER (modulo de pecas e status do banco) precisam ser resolvidos antes. O problema de RLS no cadastro (M02/M03) tambem impede qualquer usuario novo de entrar.

Depois de resolver B01, B02, M02 e M03, o sistema fica funcional pra beta com ressalvas. Os outros MAJOR sao importantes mas nao impedem o uso inicial com 1 oficina testando.

**Estimativa pra ficar beta-ready:** 1 sessao de trabalho (B01 + B02 + M02 + M03 + M04).
