# RPM Pro — Relatorio UX Research
### Agente: JOSIMAR (UX Researcher)
### Data: 2026-03-25

---

## 1. Analise do Concorrente Principal: SHOficina / SHARMAQ

**O que ele tem (e funciona):**
- 170 mil licencas vendidas — prova social brutal
- OS completa com impressao (oficina ama imprimir)
- Estoque com custo medio e margem
- Financeiro integrado (contas a pagar/receber)
- Orcamento detalhado com aprovacao por assinatura
- Historico do veiculo completo
- Nota fiscal (NF-e) integrada
- Relatorios: faturamento, comissao, estoque, clientes inativos

**Onde ele DORME (oportunidade RPM Pro):**
- Interface Windows 2005 — assusta quem tem menos de 40 anos
- Preso no PC da oficina — dono nao ve nada fora dali
- Zero mobile — mecanico nao consulta nada no box
- Sem Kanban — nao tem visao do patio
- Sem WhatsApp — toda comunicacao eh manual
- Sem alerta de tempo parado — carro esquecido no patio dias
- Comissao: so em relatorio, mecanico nao acompanha em tempo real
- Sem CRM — cliente que saiu nunca mais eh contatado
- Licenca unica por PC — escala zero

**Modelo de negocio SHOficina:**
- Licenca perpetua (~R$ 1.500-2.500) + suporte anual
- Modelo antigo, sem receita recorrente
- RPM Pro com R$ 99/mes recorrente eh mais sustentavel

---

## 2. Referencia de SaaS similar: InBarber (analise do NaRegua)

O que aprender do InBarber pro RPM Pro:
- **Prova social importa**: 64k downloads, 4.8 estrelas, 2M agendamentos
- **Preco por profissional** (R$ 32,90/mec) pode ser melhor que preco fixo
- **Trial longo** (45 dias) reduz barreira — RPM Pro tem 14 dias, pode ser curto pra oficina
- **App nativo vs Web**: oficina nao precisa de app nativo, web PWA resolve (mecanico nao baixa app)
- **Suporte humanizado no WhatsApp** eh obrigatorio — oficina nao usa email

---

## 3. Dores REAIS do Dono de Oficina Mecanica

### Dores do dia a dia (ordem de prioridade real):

1. **"Onde ta cada carro?"** — Patio lotado, nao sabe o status de cada um. Cliente liga e ele precisa gritar pro mecanico.
2. **"Quanto eu faturei esse mes?"** — Nao tem visao financeira. Sabe que trabalhou muito mas nao sabe se deu lucro.
3. **"O carro do cliente ta parado ha 5 dias esperando peca"** — Ninguem avisou o cliente, que fica furioso.
4. **"Perdi a comanda/OS"** — Papel some, servico nao eh cobrado, dinheiro evaporou.
5. **"Nao sei se meu mecanico ta produzindo"** — Comissao eh no achismo, sem controle de produtividade.
6. **"Orcamento aprovado por WhatsApp, mas nao tenho registro"** — Tudo informal, sem rastro.
7. **"Cliente nunca mais voltou e eu nem lembrei de chamar"** — Zero follow-up, zero CRM.
8. **"Peca que eu precisava acabou e eu so descobri agora"** — Estoque no olhometro.
9. **"Final do mes preciso pagar comissao e nao sei quanto cada um fez"** — Planilha no papel, erro certo.
10. **"Quero ver como ta a oficina e to fora"** — Precisa estar fisicamente la pra ter controle.

### Dores do MECANICO (usuario secundario):

- "Nao sei qual carro eh prioridade" — Sem fila organizada
- "Dono me cobra mas nem eu sei o que fiz esse mes" — Sem historico proprio
- "Preciso pedir peca e nao tem como registrar" — Comunicacao verbal

---

## 4. O que o Carbon Car Service PROVAVELMENTE precisa vs o que foi construido

### O que ELE PRECISA (dia 1 do beta):

| Necessidade | Tem no RPM Pro? | Status |
|---|---|---|
| Abrir OS rapido pela placa | SIM | Excelente — busca por placa com autocomplete |
| Ver patio visual (Kanban) | SIM | Excelente — drag & drop, cores por tempo |
| Saber status de cada carro | SIM | Excelente — 7 colunas no Kanban |
| WhatsApp automatico ao mudar status | SIM | Funcional — abre wa.me com mensagem pronta |
| Cadastrar cliente + veiculo junto | SIM | Bem feito — cria na hora se nao existir |
| Comissao por mecanico | PARCIAL | Tem % na equipe, mas nao tem relatorio de comissao |
| Fechar OS com forma de pagamento | PARCIAL | Tem campo pago/forma, mas sem tela de fechamento clara |
| Imprimir OS / Orcamento | NAO | Critico — oficina PRECISA imprimir |
| Historico do veiculo | NAO | Critico — "esse carro ja veio aqui, o que foi feito?" |
| Dashboard financeiro real | PARCIAL | Tem faturamento do mes, falta DRE/lucro |
| Estoque funcional | PARCIAL | Schema pronto, tela existe mas sem fluxo completo |
| Lembrete de revisao | NAO | Importante pro CRM |
| Orcamento formal pro cliente | NAO | Oficina manda orcamento no WhatsApp — precisa gerar PDF |

### O que FOI CONSTRUIDO e esta bom:

- **Kanban de patio** — diferencial matador vs SHOficina
- **OS com busca por placa** — fluxo rapido, menos de 2 minutos
- **Catalogo de servicos** — 100+ servicos com valor padrao de mao de obra
- **Catalogo de veiculos** — marcas e modelos brasileiros
- **Multi-tenant com RLS** — seguranca desde o dia 1
- **WhatsApp integrado no Kanban** — orcamento, pronto, aguardando peca
- **Alerta visual de tempo** — amarelo 24h, vermelho 72h
- **Filtro por mecanico no Kanban** — dono ve tudo, mecanico ve o dele
- **Dark mode** — visual profissional e moderno
- **Config da oficina** — valor hora, comissao padrao, dados completos
- **Mobile responsivo** — bottom nav, funciona no celular

---

## 5. GAPS CRITICOS — O que falta pro beta funcionar de verdade

### Prioridade ALTA (sem isso o beta falha):

1. **Impressao de OS** — Oficina imprime e grampeia no painel do carro. Sem isso, o cara vai manter o papel paralelo e abandonar o sistema.

2. **Orcamento em PDF/WhatsApp** — Cliente pede orcamento, oficina manda no WhatsApp. Precisa gerar um PDF ou pelo menos uma mensagem formatada com servicos + valores.

3. **Tela de FECHAMENTO da OS** — Hoje a OS tem "pago" e "forma_pagamento" no banco, mas nao tem uma tela clara de "fechar OS". Precisa: valor pecas + mao de obra + desconto = total, forma de pagamento, imprimir recibo.

4. **Historico do veiculo** — Ao abrir uma OS, mostrar "ultima vez aqui: 15/01, fez troca de oleo". Isso eh basico pra qualquer oficina.

5. **Relatorio de comissao** — O campo comissao_percent existe na equipe, mas nao tem calculo automatico. Mecanico precisa ver "esse mes voce fez R$ X, sua comissao eh R$ Y".

### Prioridade MEDIA (primeiras semanas do beta):

6. **Estoque vinculado a OS** — A tabela itens_os e pecas existem, mas nao tem fluxo no front. Ao adicionar peca na OS, deveria baixar do estoque.

7. **Financeiro real** — Contas a pagar (fornecedor de pecas), DRE simples (receita - custo peca - comissao = lucro).

8. **Busca global** — Buscar por nome de cliente, placa, numero de OS. Hoje nao tem busca.

### Prioridade BAIXA (pode esperar):

9. CRM com lembrete de revisao (3 meses, 6 meses)
10. NF-e (complexo, pode ser fase 3)
11. Relatorios avancados

---

## 6. O que FOI construido mas NAO eh prioridade real

| Feature | Veredicto |
|---|---|
| Catalogo de 100+ servicos com valores | BOM ter, mas oficina vai customizar tudo — nao eh diferencial |
| Score de cliente (ativo/risco/inativo) | Legal, mas so faz sentido com CRM ativo — hoje eh campo morto |
| Coluna "Entregue" no Kanban (com opacidade) | Desnecessario — carro entregue sai do patio, nao precisa ver |
| Config de valor/hora | Pouquissimas oficinas usam isso — maioria cobra por servico |
| Coluna "Aguardando Peca" no Kanban | BOA ideia, mas so funciona se o estoque estiver vinculado |

**Nada grave.** O que foi construido faz sentido. O problema nao eh excesso — eh falta dos itens criticos acima.

---

## 7. Cinco Perguntas que Duam DEVE Fazer ao Primo Antes do Beta

### 1. "Como voce abre uma OS hoje? Me mostra o passo a passo no SHOficina."
**Por que:** Entender o fluxo atual revela o que ele NAO pode perder. Se ele imprime OS e grampeia no carro, impressao eh obrigatoria dia 1.

### 2. "Quando o carro fica pronto, como voce avisa o cliente? E quando demora mais que o combinado?"
**Por que:** Valida se o WhatsApp automatico do Kanban resolve ou se ele precisa de algo diferente (ex: SMS, ligacao).

### 3. "Como voce calcula a comissao dos mecanicos hoje? Papel, planilha, de cabeca?"
**Por que:** Se for de cabeca, qualquer coisa eh melhor. Se for planilha, precisa ser pelo menos tao bom quanto.

### 4. "Quantas OS voce abre por dia em media? E quantos carros ficam no patio ao mesmo tempo?"
**Por que:** Define se o Kanban vai ter 5 ou 50 cards. Muda UX, performance e se precisa de filtros mais fortes.

### 5. "Se voce pudesse resolver UMA coisa que te irrita no SHOficina, qual seria?"
**Por que:** A resposta define a prioridade #1 do beta. Pode ser algo que a gente nem pensou. O dor dele eh a feature killer.

---

## 8. Resumo Executivo

### O RPM Pro ja esta forte em:
- Visao operacional (Kanban) — nenhum concorrente tem isso
- Fluxo de abertura de OS — rapido e inteligente
- WhatsApp integrado — automacao que SHOficina nao sonha
- Mobile — dono ve a oficina de qualquer lugar
- Arquitetura — multi-tenant, RLS, pronto pra escalar

### Pra entrar no beta com confianca, falta:
1. Impressao de OS (PDF)
2. Orcamento formatado (PDF/WhatsApp)
3. Tela de fechamento/pagamento
4. Historico do veiculo
5. Relatorio de comissao

### Risco principal:
O primo usa SHOficina. Se o RPM Pro nao cobrir o basico que ele ja tem la (imprimir, fechar OS, historico), ele vai achar que "eh bonito mas nao funciona pra mim" e voltar pro sistema feio que funciona.

### Recomendacao:
Antes de ativar o beta, fazer uma sessao de 1 hora com o primo vendo ele trabalhar no SHOficina. Gravar tela. Cada clique dele la eh uma feature obrigatoria aqui.

---

*Relatorio gerado por JOSIMAR (UX Researcher) — RPM Pro*
