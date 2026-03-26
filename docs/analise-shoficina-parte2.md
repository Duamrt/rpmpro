# Analise Concorrente: SHOficina (Parte 2) - Modulos Complementares

> Analise feita em 26/03/2026 a partir de 35 screenshots do sistema SHOficina v6.84D
> Sistema desktop (Windows) composto por modulos separados que se integram

---

## VISAO GERAL DA SUITE SH

O SHOficina nao e um sistema unico — e uma **suite de modulos desktop independentes** que se comunicam:

| Modulo | Versao | Funcao |
|--------|--------|--------|
| **SHOficina** | v6.84D | Sistema principal (OS, clientes, veiculos) |
| **SHEstoque** | v6.84D | Controle completo de estoque/pecas |
| **SHCompras** | v6.84D | Pedidos de compra a fornecedores |
| **SHContas** | v4.99P | Contas a pagar/receber + fluxo de caixa |
| **Controle de Vendas e Orcamentos** | v6.84D | Vendas balcao e orcamentos |
| **Notas Fiscais** | - | Emissao de NF-e e NFC-e |

---

## SCREENSHOT 29 — SHEstoque: Tela Principal

**Modulo:** SHEstoque v6.84D - 2025
**Tela:** Grade principal de itens do estoque

### Barra lateral (sidebar) com icones:
1. **Novo Item** — cadastrar peca/produto
2. **Localizar** — busca de itens
3. **Entrada de Item** — registrar compra/entrada
4. **Saida de Item** — registrar saida/uso
5. **Reajustes** — reajuste de precos
6. **Kits/Montagem** — montar kits de pecas
7. **Etiquetas** — imprimir codigos de barras
8. **Relatorios** — relatorios do estoque
9. **Compras** — abre modulo SHCompras

### Filtros superiores:
- **Curva:** Todas (dropdown)
- **Fornecidos por:** Todos (dropdown)
- **Fabricante:** Todos (dropdown)
- **Tipo:** Itens (dropdown)
- **Grupo:** Todos (dropdown)
- **SubGrupo:** Todos (dropdown)
- **Ordem:** Codigo (dropdown)

### Filtros rapidos:
- Filtro rapido **por nome**
- Filtro rapido **por codigos**
- Filtro rapido **por Utilizacao**
- Filtro rapido **N. Original**

### Colunas da grade:
Codigo | N. Fabric. | Descricao | Marca | Grupo | Un | Disponivel | Minimo | Ideal | Venda | Custo | Lucro | Localizacao | Gaveta | Utilizacao | NCM

### Indicadores visuais (rodape):
- **NO MINIMO** (checkbox, cor vermelha)
- **ZERADO** (checkbox, cor verde)
- **IDEAL** (checkbox, cor amarela)
- **KITS** (checkbox, cor azul)

### Barra de status:
- 0 iten(s) | Soma: 0,00 | 26/03/2026 | v6.84D | Suporte:

### Opcao especial:
- "Exibir somente ate o 1000. item (mais veloz)" — checkbox para performance
- Botao "Lista Atual"

---

## SCREENSHOT 30 — SHEstoque: Menu Arquivo + Configurar Grade

**Modulo:** SHEstoque
**Tela:** Menu Arquivo aberto + lista de colunas configuraveis

### Menu Arquivo:
- Exportar para MS Excel...
- Configurar Grade (submenu aberto)
- Perguntar cotacao Dolar ao iniciar
- Preferencias
- Sair

### Colunas configuraveis (com check ativo/inativo):
- [x] N. Fabricante
- [x] Descricao
- [x] Marca
- [x] Grupo
- [ ] Tipo
- [ ] Nro Original
- [ ] Ult. Venda
- [x] Un
- [x] Disponivel
- [x] Minimo
- [x] Ideal
- [x] Venda
- [x] Custo
- [x] Lucro
- [ ] Em US$
- [x] Localizacao
- [x] Gaveta
- [x] Utilizacao
- [x] NCM
- [ ] Vlr Revendas
- [ ] Vlr Outros
- [ ] Ult. Compra

### Opcoes extras:
- Restaurar configuracao padrao
- Ao iniciar, mostrar apenas itens com saldo positivo

---

## SCREENSHOT 31 — SHEstoque: Menu Cadastros

**Modulo:** SHEstoque
**Tela:** Menu Cadastros aberto

### Opcoes:
- Fornecedores
- Funcionarios...
- Indice de catalogos/esquemas...

**Fornecedor visivel:** SHARMAQ COMERCIO E REPR. LTDA

---

## SCREENSHOT 32 — SHEstoque: Menu Itens

**Modulo:** SHEstoque
**Tela:** Menu Itens aberto com submenu Localizar

### Opcoes principais:
- Inserir item...
- Alterar item...
- Excluir...
- Clonar item...
- **Localizar** (submenu):
  - Pelo nome... (F6)
  - Pelo nome (avancado)... (Ctrl+F)
  - Por codigo de barras... (F7)
  - Por codigo do Fabricante... (F8)
  - Nome Parcial... (F4)
  - Prateleira...
  - Utilizacao/Aplicacao...
  - Numero de serie
- Importar itens (submenu)
- Reajustes de preco (submenu)
- Arquivamento de itens...

---

## SCREENSHOT 33 — SHEstoque: Menu Itens > Importar

**Modulo:** SHEstoque
**Tela:** Submenu Importar Itens

### Opcoes:
- Importar itens
- Importar copiando e colando...

---

## SCREENSHOT 34 — SHEstoque: Menu Itens > Reajustes de Preco

**Modulo:** SHEstoque
**Tela:** Submenu Reajustes de Preco

### Opcoes:
- **Percentual** (submenu):
  - Valor de venda...
  - Custo de compra...
- Pelo dolar/dia
- Reajuste manual de precos
- Reajuste via tabela (copiar/colar)...

---

## SCREENSHOT 35 — SHEstoque: Menu Estoque

**Modulo:** SHEstoque
**Tela:** Menu Estoque aberto com submenu Ajuste coletivo info fiscais

### Opcoes:
- Incluir entrada... (F11)
- Entradas de materiais/itens...
- Incluir saida... (F9)
- Saidas de materiais/itens
- Coletores de dados...
- Ajuste/Correcao coletiva de Grupos/Sub-grupos ou Unidade...
- Ajuste manual do estoque disponivel...
- **Ajuste coletivo das informacoes fiscais...** (submenu):
  - Via filtro/selecao...
  - Copiando e colando...
- Ajuste coletivo de MVA para ST...
- Ajuste coletivo do caminho das fotos dos itens...
- Ajuste coletivo % tributario (De olho no imposto)...
- Pre-cadastro da RTC pelo NCM
- Codigo de barras...

---

## SCREENSHOT 36 — SHEstoque: Menu Relatorios (parte 1)

**Modulo:** SHEstoque
**Tela:** Menu Relatorios com submenu Tabelas de preco

### Opcoes:
- Listar Itens...
- Itens sem movimentacao (Compra/Venda)...
- Itens Arquivados/desativados...
- Itens por fornecedor...
- **Tabelas de preco** (submenu):
  - Tabela de precos...
  - Tabela de precos multipla...
  - Tabela de precos por fabricante...
  - Tabela com Aplicacao e Localizacao...
  - Tabela de precos em HTML...
- Estoque Limite...
- Saidas de itens...
- Imobilizado (submenu)
- Inventario...
- Movimentacao de itens por periodo...
- Produtos por CFOP...
- Produtos por CST/CSOSN
- Produtos por NCM...
- Produtos com validade proxima...
- Produtos com dados fiscais incompletos...
- Planilha para balanco...
- Curva ABC...

---

## SCREENSHOT 37 — SHEstoque: Menu Relatorios > Imobilizado

**Modulo:** SHEstoque
**Tela:** Submenu Imobilizado

### Opcoes:
- Por valor de custo
- Por Valor de venda...

---

## SCREENSHOT 38 — SHEstoque: Cadastro de Item (Informacoes Principais)

**Modulo:** SHEstoque
**Tela:** Cadastro de Itens — aba "Informacoes principais"

### Campos do cabecalho:
- Numero/Cod. Barras
- Numero do fabricante
- Numero Original/Similar
- Tipo: Comprado / Kit/Conjunto (radio)
- Codigo de barras (imagem gerada)
- Descricao/Nome do item
- Nome Curto/Apelido (25 caracteres)
- Grupo (dropdown)
- SubGrupo (dropdown)

### Abas disponiveis:
1. **Informacoes principais** (ativa)
2. Fiscal/Impostos
3. Fornecedor/Fabricante
4. Foto
5. Seriais/Lotes
6. Reforma Trib.

### Secao "Valores e custos":
- Custo compra
- % Lucro
- Vlr em US$

### Secao "Tabelas de precos de venda":
- a consumidor
- a Revendas
- a outros

### Secao "Quantidades":
- Disponivel
- Lote ideal
- Qtd minima
- Unidade
- Curva (dropdown)
- Ultima venda (link)

### Secao "Localizacao e Observacoes":
- Marca/Fabricante
- Localizacao
- Gaveta/Prateleira
- Observacoes/Utilizacao

### Botoes:
- Imprimir
- Gravar
- Cancelar

### Fornecedor visivel:
SHARMAQ COMERCIO E REPR. LTDA

---

## SCREENSHOT 39 — SHEstoque: Cadastro de Item (Fiscal/Impostos)

**Modulo:** SHEstoque
**Tela:** Cadastro de Itens — aba "Fiscal/Impostos"

### Campos:
- Classificacao quanto a origem (0-Nacional, exceto codigos 3, 4, 5 e 8)
- Codigo da Situacao Tributaria (CST / CSOSN): 101 - Tributado pelo Simples Nacional com permissao de credito
- Peso bruto
- NCM/SH - Mercosul
- Peso liquido
- GTIN/EAN
- CFOP Padrao: Vendas dentro da UF / Vendas para outra UF
- Mod. BC ST: 0 - Preco tabelado ou maximo sugerido
- PIS CST
- 99 - Outras operacoes
- COFINS CST
- 99 - Outras operacoes
- IPI CST
- GTIN IPSENTO/SP
- % ICMS saida
- Red. B. Calc
- Codigo ANP
- Cod. Beneficio Fiscal: 100
- CEST - Codigo Especificador da ST (em %)

---

## SCREENSHOT 40 — SHEstoque: Cadastro de Item (Fornecedor/Fabricante)

**Modulo:** SHEstoque
**Tela:** Cadastro de Itens — aba "Fornecedor/Fabricante"

### Campos:
- Fornecedor (ultimo a fornecer): SHARMAQ COMERCIO E REPR. LTDA
- Ultima compra
- **Empresas que tambem fornecem este item:**
  - Fornecedor alternativo | Ultima compra | Custo
  - Botao: Incluir fornecedor alternativo / Excluir
- **Correlacao de codigos de outros fornecedores** (tabela)
- **Indicador de Escala Relevante:**
  - [x] Este produto e fabricado em escala Relevante
  - CNPJ do fabricante de escala nao relevante
  - Aviso sobre Convenio ICMS 52/2017

---

## SCREENSHOT 41 — SHEstoque: Cadastro de Item (Foto)

**Modulo:** SHEstoque
**Tela:** Cadastro de Itens — aba "Foto"

### Campos:
- Caminho para foto (campo texto)
- Botoes: Colar | Localizar | Excluir
- Link: "Imagem p/ venda/orca"
- Aviso: imagens pequenas e leves (JPG ou GIF), salvas em pasta comum na rede

---

## SCREENSHOT 42 — SHEstoque: Cadastro de Item (Seriais/Lotes)

**Modulo:** SHEstoque
**Tela:** Cadastro de Itens — aba "Seriais/Lotes"

### Campos:
- [_] Ativar controle de seriais para este item
- [_] Solicitar numero de lote ao vender este item
- Validade: __/__
- Tabela: Serial | NF Entrada | NF Saida | Info

### Descricao:
"O controle de Seriais permite identificar com precisao de qual fornecedor e em qual data um item foi comprado e para qual cliente ele foi vendido. Ao ativar este recurso, sera solicitado em cada operacao de entrada/saida o serial do respectivo item. Este mesmo controle pode ser usado para lotes."

---

## SCREENSHOT 43 — SHEstoque: Cadastro de Item (Reforma Trib.)

**Modulo:** SHEstoque
**Tela:** Cadastro de Itens — aba "Reforma Trib."

### Campos:
- **Regras fiscais padrao:** configurar regras fiscais aplicaveis a emissao de NF-e e NFC-e
- **Regra fiscal PDV/NFCe:** regra exclusiva para NFC-e
- **Produtos com beneficio fiscal/incentivados:** classificacao fiscal especifica

---

## SCREENSHOT 44 — SHEstoque: Menu Localizar (sidebar)

**Modulo:** SHEstoque
**Tela:** Menu de contexto do botao Localizar

### Opcoes de busca:
- Pelo nome... (F6)
- Pelo nome (avancado)... (Ctrl+F)
- Por codigo de barras... (F7)
- Por codigo do Fabricante... (F8)
- Nome Parcial... (F4)
- Prateleira...
- Utilizacao/Aplicacao...
- Numero de serie

---

## SCREENSHOT 45 — SHEstoque: Entrada de Item no Estoque

**Modulo:** SHEstoque
**Tela:** Modal "Entrada de item no estoque..."

### Campos:
- Busca por: Numero da peca/Cod. Barras (radio) OU N. Fabricante (radio)
- Campo de busca (amarelo): 0000000000000
- Botao: Localizar
- Botao: **Historico de Entradas**

### Secao "Dados da compra":
- Qtd. adquirida
- N. da Nota fiscal
- Valor Total

### Secao "Dados do item":
- Custo
- Venda
- Lucro (%)
- Venda em US$
- Custo medio: 0,00

### Outros campos:
- Fornecedor: O PROPRIO (dropdown)
- Data: 26/03/2026 (dropdown)
- Funcionario responsavel: Indiferente (dropdown)
- Observacoes (textarea)
- [_] Manter esta tela aberta para um novo cadastro

### Botoes:
- Gravar
- Cancelar

---

## SCREENSHOT 46 — SHEstoque: Saida de Item do Estoque

**Modulo:** SHEstoque
**Tela:** Modal "Saida de item no estoque..."

### Campos:
- Busca por: Numero da peca/Cod. Barras OU N. Fabricante
- Campo de busca (amarelo): 0000000000000
- Botao: Localizar

### Dados da saida:
- Qtd. Disponivel
- Data saida: 26/03/2026
- Valor Unitario
- Qtd. retirada
- Valor Total (calculado automaticamente: Vlr Unit x Qtd = Total)
- **Ord. Servico** — vincula a uma OS
- **Ord. Producao**
- **Venda n.**
- **NF n.**
- Observacoes
- Funcionario responsavel: Indiferente (dropdown)
- [_] Manter esta tela aberta para um novo cadastro

### Botoes:
- Gravar
- Cancelar

---

## SCREENSHOT 47 — SHEstoque: Menu Reajustes

**Modulo:** SHEstoque
**Tela:** Menu de contexto do botao Reajustes

### Opcoes:
- **Percentual** (submenu):
  - Valor de venda...
  - Custo de compra...
- Pelo dolar/dia
- Reajuste manual de precos
- Reajuste via tabela (copiar/colar)...

---

## SCREENSHOT 48 — SHEstoque: Emissao de Etiquetas (Itens a imprimir)

**Modulo:** SHEstoque
**Tela:** Emissao de codigos de barra para itens do estoque — aba "Itens que serao impressos"

### Filtros:
- Exibir itens do grupo: Todos (dropdown)
- Exibir itens do sub-grupo: Todos (dropdown)
- Exibir itens do Fabricante: Todos (dropdown)
- Filtro: Cod. Barras / N. Fabric. (radio)
- [_] Exibir somente itens com estoque disponivel

### Listas:
- Itens cadastrados (Codigo | Descricao)
- Etiquetas a imprimir (Codigo | Descricao | Qtd)
- Botoes: > | >> | < | <<
- Quantidade de etiquetas do mesmo item: 01

### Opcoes de impressao:
- **Tipo:** Impressora comum / Impressora PPLA (Argox OS214) / Codificacao direta (Avancado)
- **Opcoes para codigos de barras:** EAN 13 / 128
- [_] Etiqueta com nome
- [_] Inserir Localizacao/Utilizacao
- Altura do codigo: 3 | Fonte: 8
- Tabela de preco: Consumidor

### Botoes:
- Imprimir
- Fechar

---

## SCREENSHOT 49 — SHEstoque: Emissao de Etiquetas (Dimensoes)

**Modulo:** SHEstoque
**Tela:** Emissao de codigos de barra — aba "Dimensoes da etiqueta"

### Modelos:
- Personalizado IV (dropdown com modelos cadastrados)

### Valores em Milimetros (10mm = 1cm):
- Margem Lateral: 4,8
- Margem Superior: 12,7
- Distancia Vertical: 25,4
- Distancia Horizontal: 69,8
- Largura: 66,7
- Altura: 25,4
- Etiqu. p/ linha: 3
- Linha p/ pag.: 10

### Posicao inicial:
- Linha inicial: 1
- Coluna inicial: 1

### Diagrama visual:
- Ilustracao das dimensoes com setas e legendas

---

## SCREENSHOT 50 — SHEstoque: Menu Relatorios (completo)

**Modulo:** SHEstoque
**Tela:** Menu Relatorios (repetido com mais opcoes visiveis)

### Opcoes:
- Listar Itens...
- Itens sem movimentacao (Compra/Venda)...
- Itens Arquivados/desativados...
- Itens por fornecedor...
- Tabelas de preco (submenu com 5 opcoes)
- Estoque Limite...
- Saidas de itens...
- Imobilizado (submenu)
- Inventario...
- Movimentacao de itens por periodo...
- Produtos por CFOP...
- Produtos por CST/CSOSN
- Produtos por NCM...
- Produtos com validade proxima...
- Produtos com dados fiscais incompletos...
- Planilha para balanco...
- Curva ABC...

### Indicadores rodape:
- NO MINIMO (vermelho)
- ZERADO (verde)
- IDEAL (amarelo)
- KITS (azul)

---

## SCREENSHOT 51 — SHEstoque: Menu Relatorios > Imobilizado

**Modulo:** SHEstoque
**Tela:** Submenu Imobilizado

### Opcoes:
- Por valor de custo
- Por Valor de venda...

---

## SCREENSHOT 52 — SHCompras: Tela Principal

**Modulo:** SHCompras - Controle de Compras v6.84D - 2026
**Tela:** Grade principal de pedidos de compra

### Barra lateral:
1. **Geral** — visao geral
2. **Imprimir**
3. **Fornecedor** — cadastro
4. **Estoque** — abre modulo estoque
5. **Novo Pedido** — criar pedido de compra
6. **Abrir pedido n.** — abrir existente
7. **Processar pedido** — processar/finalizar
8. **Auto Pedido** — pedido automatico
9. **Cancelar pedido**
10. **Importar XML** — importar NF-e

### Filtros superiores:
- Fornecedor: Todos (dropdown com lupa)
- Situacao: Em negociacao (dropdown)
- Data Inicial: 01/jan/00
- Data Final: 25/mar/30
- Botao: Listar

### Colunas grade superior:
N. Pedido | Fornecedor | Data Emissao | Entrega | Valor | Situacao | NF n.

### Colunas grade inferior (Itens que Compoem o Pedido):
Codigo | Cod. Fab | Descricao | Un | QTD | Vlr Un | %IPI | %ICMS | Vlr Tot

### Barra de status:
Total R$ 0,00 | 26/03/2026 | v6.84t

---

## SCREENSHOT 53 — SHCompras: Menu Pedidos

**Modulo:** SHCompras
**Tela:** Menu Pedidos aberto

### Opcoes:
- Abrir pedido n....
- Novo pedido...
- Clonar pedido existente...
- Excluir pedido
- **AutoPedido de estoque urgente...**
- Processar pedido...
- Cancelar/devolver um pedido entregue...

---

## SCREENSHOT 54 — SHContas: Tela Principal

**Modulo:** SHContas - Controle de Contas v4.99P
**Tela:** Contas a Receber (aba ativa)

### Abas principais:
1. **Contas a Receber** (ativa, verde)
2. **Contas a Pagar** (cinza)
3. **Fluxo de Caixa** (azul)

### Toolbar:
- Nova | Excluir | Localizar | Recebidos >>
- Recibo | Relatorio | Aviso! | Unir contas

### Filtros:
- Ver apenas: Periodo (checkbox)
- Tipo: Todas (dropdown)
- Filtro: Vencto / Docto / Pagto (radio)
- De: 26/mar/2026 ate 26/mar/2025
- Plano de contas: Mostrar tudo (dropdown)
- Tipo cobranca: Todas as cobrancas / Cobr. Banco / Cobr. Cartao / Cobr. Carteira

### Colunas:
N. Fatura | Cliente | Telefone | Pl. Contas | Cobranca | Dt. Vencto | Valor | Pg? | Observacoes | Juros | Total

### Indicadores rodape:
- **Vencendo hoje** (verde)
- **Vencidas** (vermelho)
- **Pagas** (azul)

### Buscas rapidas:
- "Digite aqui para buscar Clientes"
- "Digite aqui para buscar Observacoes"

### Status:
"Nenhuma conta encontrada." | 26/03/2026

---

## SCREENSHOT 55 — Controle de Vendas e Orcamentos: Tela Principal

**Modulo:** Controle de Vendas e Orcamentos v6.84D - 2026
**Tela:** Sidebar principal

### Sidebar:
1. **Nova Venda** — venda completa
2. **Nova venda direta** — venda rapida
3. **Novo Orca** — novo orcamento
4. **Abrir orca N.** — abrir orcamento
5. **Consultar Precos** — consulta simples
6. **Consultar precos** (segundo icone, diferente)
7. **Localizar Orcamento**
8. **Personalizar**
9. **Relatorios**

### Menu superior:
- Cadastro | Vendas e Orcas | Relatorios | Suporte tecnico

### Rodape:
- Botao "Modulos"

---

## SCREENSHOT 56 — SHOficina: Agenda de Compromissos

**Modulo:** SHOficina
**Tela:** Agenda de compromissos pessoais

### Sidebar visivel:
- Vendas | Agenda | Contato | Comissao | Contas | Compras | Chamado Tecnico | Notas Fiscais | Arquivos Contador

### Agenda:
- Calendario visual com 4 meses visiveis: dezembro 2025, janeiro 2026, fevereiro 2026, marco 2026
- Data selecionada: 27 de marco (circulado)
- Filtro: Agenda de Todos (dropdown)

### Visao semanal (23-29 marco 2026):
- segunda-feira, 23 de marco de 2026
- terca-feira, 24 de marco de 2026
- quarta-feira, 25 de marco de 2026
- quinta-feira, 26 de marco de 2026
- sexta-feira, 27 de marco de 2026
- sabado, 28 de marco de 2026
- domingo, 22 de marco de 2026

### Campos por dia:
Horario | Compromisso | Avisar?

### Botoes:
- Agendar... | Excluir | Imprimir

### Abas laterais:
- Diaria | Semanal (aba semanal ativa)

---

## SCREENSHOT 57 — SHOficina: Comissoes por Funcionario

**Modulo:** SHOficina
**Tela:** Modal "Comissoes por Funcionario"

### Campos:
- Funcionario: 1 - Funcionario de exemplo (dropdown)
- [_] Mostra demitidos
- Data de entrega entre: De 24/02/2026 ate 26/03/2026
- Referencia: data entrega (radio) / data pronto (radio)

### Opcoes gerais:
- [x] Calcular somente OS's Aprovadas e ja encerradas
- [_] Ignora comissao de OS's em garantia interna
- [_] Ignora comissao de servicos de OS ligadas a contrato
- [_] Inserir assinatura
- [_] Mostra cliente da OS
- [_] Exibe equipamento

### Comissao a aplicar (Em %):
- Para pecas: **10**
- Para servicos: **10**
- Para outros: **10**

### Botoes:
- Visualizar
- Fechar

---

## SCREENSHOT 58 — SHCompras: Tela Principal (repetida, mais detalhada)

**Modulo:** SHCompras v6.84D - 2026
**Tela:** Visao completa da sidebar

### Sidebar completa:
1. Geral
2. Imprimir
3. Fornecedor
4. Estoque
5. Novo Pedido
6. Abrir pedido n.
7. Processar pedido
8. Auto Pedido
9. Cancelar pedido
10. Importar XML

---

## SCREENSHOT 59 — Notas Fiscais: Tela Principal

**Modulo:** Listagem de notas fiscais/NF-e's emitidas
**Tela:** Notas Fiscais

### Toolbar:
- Nova nota | Excluir nota
- Configurar NF | Impostos da NF | Relatorios

### Filtros:
- Data de emissao entre: 01/jan/1900 ate 27/mar/2026
- N. da nota de: 0 ate 9999999
- Tipos: Todas as notas / Notas de Saida / Notas Entrada / Notas canceladas (radio)
- Filtro CFOP (campo)
- Botao: Gerar arquivos fiscais

### Colunas:
Numero | Tipo | Destinatario | CNP/CPF | CFOP | Natureza | Emissao | Valor | Cancel? | Impr... | Enviada

---

## SCREENSHOT 60 — SHOficina: Arquivos Contador

**Modulo:** SHOficina (tela principal)
**Tela:** Modal "Gerar Arquivos de interesse do Fisco"

### Sidebar principal visivel:
- Estoque | Contas | Vendas | Agenda | Contato | Comissao | Compras | **Chamado Tecnico** | **Notas Fiscais** | **Arquivos Contador**

### Menu superior:
- Arquivo | Cadastros | Modulos | Ordem de Servico | Personalizacao | Suporte Tecnico

### Submenus visiveis:
- Cadastros
- Modulos

### Modal "Gerar Arquivos de interesse do Fisco":
- Gerar Zip contendo XML's para contabilidade
- [_] Incluir notas recebidas/compras
- [x] Incluir PDF's
- [x] Incluir eventos (CCe, inutilizacoes, etc)
- Competencia: marco / 2026

### Abas do modal:
1. Lista de documentos fiscais
2. Configuracoes Fiscais
3. Envio Automatico Mensal

### Colunas:
Tipo | Emissao | Num. doc. | CPF/CNPJ Dest. | CFOP | UF | Total

### Botoes:
- Salvar arquivo
- Enviar por email

---

## SCREENSHOT 61 — SHOficina: Menu Ordem de Servico

**Modulo:** SHOficina
**Tela:** Menu lateral "Ordem de Servico"

### Opcoes:
1. **Abrir Nova O.S.** — criar ordem de servico
2. **Alterar O.S.** — editar existente
3. **Encerrar O.S.** — finalizar
4. **Localizar O.S's** — busca
5. **Orcamento de O.S.** — gerar orcamento
6. **Historico de O.S's** — historico completo
7. **Relatorios de O.S's** — relatorios
8. **Imprimir...**
9. **O.S's na Internet** — publicar OS online
10. **Reabrir OS** — reabrir encerrada

---

## SCREENSHOT 62 — SHOficina: Menu Configuracoes

**Modulo:** SHOficina
**Tela:** Menu lateral "Configuracoes"

### Opcoes:
1. **Personalizar OS's** — customizar campos/layout
2. **Backup** — fazer backup
3. **Restauracao** — restaurar backup
4. **Senhas** — controle de acesso
5. **Banco de dados** — configurar BD
6. **Vincular Celular** — sincronizar com app mobile

---

## SCREENSHOT 63 — SHOficina: Suporte Tecnico

**Modulo:** SHOficina
**Tela:** Menu lateral "Suporte tecnico"

### Opcoes:
1. **Falar com o Suporte** — chat/contato
2. **Manual do sistema** — documentacao
3. **Suporte remoto** — acesso remoto
4. **Mais opcoes...**
5. **Atualizar pela internet** — update online
6. **Canal YouTube** — tutoriais em video
7. **Perfil Instagram** — rede social

---

## RESUMO: O QUE O RPM PRO PODE APRENDER

### 1. Estoque (SHEstoque) — MUITA COISA BOA

| Feature SHOficina | Prioridade RPM Pro | Observacao |
|---|---|---|
| Indicadores visuais (NO MINIMO, ZERADO, IDEAL, KITS) | ALTA | Cores no rodape mostrando status do estoque |
| Filtro por Curva ABC | MEDIA | Classificacao de pecas por giro |
| Multiplos precos (consumidor, revendas, outros) | ALTA | 3 tabelas de preco por item |
| Custo medio automatico | ALTA | Calcula ao registrar entrada |
| Localizacao + Gaveta/Prateleira | MEDIA | Posicao fisica da peca |
| Nome Curto/Apelido (25 chars) | BAIXA | Para etiquetas e buscas rapidas |
| Controle de Seriais/Lotes | BAIXA | Rastreio de pecas especificas |
| Saida vinculada a OS | ALTA | Ao dar saida, vincular a qual OS a peca foi |
| Reajuste de precos em massa | MEDIA | Percentual, por dolar, copiar/colar |
| Exportar para Excel | ALTA | Simples e util |
| Grade configuravel (colunas on/off) | MEDIA | Usuario escolhe quais colunas ver |
| Historico de entradas | ALTA | Ver quando e quanto comprou |
| Fornecedores alternativos por peca | MEDIA | Saber quem mais fornece |
| Etiquetas cod. barras | BAIXA | Impressao com dimensoes personalizaveis |

### 2. Compras (SHCompras)

| Feature | Prioridade | Observacao |
|---|---|---|
| Pedido de compra formal | MEDIA | Rastrear pedidos a fornecedores |
| AutoPedido de estoque urgente | ALTA | Gerar pedido automatico baseado no estoque minimo |
| Clonar pedido existente | MEDIA | Recompra facil |
| Processar pedido (dar entrada) | ALTA | Converter pedido em entrada de estoque |
| Importar XML de NF-e | ALTA | Dar entrada via XML da nota fiscal |
| Situacao do pedido (Em negociacao, etc) | MEDIA | Fluxo de status |

### 3. Financeiro (SHContas)

| Feature | Prioridade | Observacao |
|---|---|---|
| Contas a Receber + Contas a Pagar | ALTA | Modulo financeiro basico |
| Fluxo de Caixa | ALTA | Visao de entradas/saidas no tempo |
| Indicadores: vencendo hoje, vencidas, pagas | ALTA | Visual por cor |
| Tipo cobranca: banco, cartao, carteira | MEDIA | Separar formas de pagamento |
| Juros automatico | MEDIA | Calcular juros em atraso |
| Unir contas | BAIXA | Juntar parcelas |
| Recibos | MEDIA | Gerar comprovante |
| Plano de contas | MEDIA | Categorizar receitas/despesas |

### 4. Vendas/Orcamentos

| Feature | Prioridade | Observacao |
|---|---|---|
| Venda completa vs Venda direta | ALTA | Modo rapido para balcao |
| Orcamento separado da venda | ALTA | Cliente aprova antes de virar venda |
| Consulta de precos | MEDIA | Tela so pra consultar |
| Personalizar | BAIXA | Customizar layout |

### 5. OS (Ordem de Servico)

| Feature | Prioridade | Observacao |
|---|---|---|
| OS na Internet | ALTA | Cliente acompanha OS online |
| Reabrir OS | MEDIA | Voltar uma OS encerrada |
| Orcamento de OS | ALTA | Gerar orcamento antes de executar |
| Historico completo de OS | ALTA | Todas as OS do cliente/veiculo |

### 6. Comissoes

| Feature | Prioridade | Observacao |
|---|---|---|
| Comissao por funcionario | ALTA | Separado por pecas, servicos e outros |
| % diferente por tipo | ALTA | 10% pecas, 10% servicos, 10% outros (configuravel) |
| Filtro por periodo e tipo data | MEDIA | Entrega ou data pronto |
| Ignorar garantia interna | MEDIA | Nao pagar comissao de garantia |
| Ignorar OS de contrato | BAIXA | Contratos nao geram comissao |

### 7. Fiscal/Contabilidade

| Feature | Prioridade | Observacao |
|---|---|---|
| Gerar XML pro contador | MEDIA | Zip mensal com XMLs |
| Envio automatico mensal | MEDIA | Automatizar entrega ao contador |
| Notas Fiscais (NF-e/NFC-e) | BAIXA (v2) | Complexo, deixar pra depois |

### 8. Configuracoes/Infra

| Feature | Prioridade | Observacao |
|---|---|---|
| Vincular Celular | ALTA | SHOficina tem app mobile |
| Backup/Restauracao | MEDIA | RPM Pro usa Supabase (automatico) |
| Senhas/Controle de acesso | ALTA | Ja planejado no RPM Pro |
| Agenda de compromissos | BAIXA | Ja existe no EDR, pode adaptar |

---

## PONTOS FRACOS DO SHOficina (OPORTUNIDADE RPM PRO)

1. **Interface desktop antiga** — visual Windows 2000, nao e web
2. **Modulos separados** — usuario precisa navegar entre 6 programas diferentes
3. **Sem acesso mobile real** — "Vincular Celular" e limitado
4. **Sem dashboard** — nao tem visao consolidada de indicadores
5. **Sem integracao com WhatsApp** — comunicacao manual
6. **Sem agendamento online** — cliente nao agenda pela internet
7. **Visual confuso** — muitos menus, submenus, opcoes fiscais que assustam oficina pequena
8. **Licenca desktop** — precisa instalar, nao e cloud
9. **Fiscal excessivo** — muita coisa fiscal que oficina pequena nao usa
10. **Sem foto do veiculo** — so foto da peca, nao do carro/servico

---

## TOP 10 FEATURES PRA COPIAR NO RPM PRO (PRIORIDADE)

1. **Estoque com indicadores visuais** (minimo, zerado, ideal) — cores e alertas
2. **Saida de peca vinculada a OS** — rastreio completo
3. **Comissao por mecanico** — % separado por tipo (peca/servico)
4. **Contas a pagar/receber** — financeiro basico
5. **Orcamento antes da OS** — aprovar com cliente
6. **OS online** — cliente acompanha pelo celular
7. **AutoPedido** — sugerir compra quando estoque baixo
8. **Multiplos precos** — consumidor vs revenda
9. **Historico completo** — toda movimentacao da peca
10. **Fluxo de caixa** — visao financeira no tempo

---

## DIFERENCIAL RPM PRO vs SHOficina

| Aspecto | SHOficina | RPM Pro |
|---|---|---|
| Plataforma | Desktop Windows | Web (qualquer dispositivo) |
| Interface | Datada, anos 2000 | Moderna, mobile-first |
| Modulos | 6 programas separados | Tudo integrado |
| Acesso | So no PC da oficina | Qualquer lugar |
| WhatsApp | Nao tem | Integrado |
| Agendamento | Manual | Online pelo cliente |
| Dashboard | Nao tem | Indicadores em tempo real |
| Fiscal | Muito pesado | Simplificado (foco na oficina) |
| Preco | Licenca unica (caro) | Assinatura acessivel |
| Suporte | Remoto/telefone | Chat + WhatsApp |
