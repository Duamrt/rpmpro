// RPM Pro — Sistema de Ajuda (?)
const AJUDA = {
  conteudo: {
    kanban: {
      titulo: 'Patio da Oficina',
      itens: [
        'Cada card e um veiculo na oficina. Mostra placa, cliente, mecanico e tempo em aberto.',
        'Use os botoes <strong>← Voltar</strong> e <strong>Avancar →</strong> pra mover o veiculo entre etapas.',
        'O fluxo correto e: <strong>Entrada → Diagnostico → Orcamento → Aprovada → Execucao → Pronto → Entregue</strong>.',
        'A OS nao pode ir pra Execucao sem ser Aprovada primeiro.',
        'A OS nao pode sair de Entrada sem o <strong>Checklist de Entrada</strong> preenchido.',
        'A OS nao pode ir pra Pronto sem o <strong>Checklist de Saida</strong> preenchido.',
        'Card <strong style="color:var(--warning);">amarelo</strong> = mais de 24h sem mover. Card <strong style="color:var(--danger);">vermelho</strong> = mais de 3 dias.',
        'Ao mover pra "Orcamento" ou "Pronto", o sistema oferece enviar <strong>WhatsApp automatico</strong> pro cliente.',
        'No celular, use as <strong>abas</strong> no topo pra filtrar por status.',
        'Clique no card pra abrir os detalhes completos da OS.',
      ]
    },
    os: {
      titulo: 'Ordens de Servico',
      itens: [
        'Clique em <strong>"+ Nova OS"</strong> pra abrir uma ordem de servico.',
        'Digite a <strong>placa</strong> e o sistema busca o veiculo automaticamente. Se nao encontrar, cadastra na hora.',
        'Adicione servicos pelo <strong>autocomplete</strong> — digite o nome e selecione. O valor ja vem preenchido.',
        'Voce pode adicionar <strong>varios servicos</strong> na mesma OS.',
        'Use a <strong>busca</strong> no topo pra encontrar OS por placa, cliente, numero ou descricao.',
        'Use o <strong>filtro por status</strong> pra ver so as abertas, entregues, etc.',
        'Clique numa OS pra ver detalhes, adicionar pecas e servicos, mudar status e gerar PDF.',
      ]
    },
    clientes: {
      titulo: 'Clientes',
      itens: [
        'Cadastre clientes com nome, WhatsApp, CPF/CNPJ e endereco.',
        'Ao cadastrar cliente, ja pode <strong>adicionar veiculos</strong> direto no mesmo formulario.',
        'A placa aceita formato <strong>antigo (ABC-1234)</strong> e <strong>Mercosul (ABC1D23)</strong>.',
        'Se tentar cadastrar um cliente com nome repetido, o sistema avisa antes.',
        'Use a <strong>busca</strong> pra encontrar por nome, WhatsApp ou CPF.',
      ]
    },
    veiculos: {
      titulo: 'Veiculos',
      itens: [
        'Lista todos os veiculos cadastrados com placa, marca/modelo, dono e KM.',
        'Clique em <strong>"Historico"</strong> pra ver todas as OS daquele veiculo — servicos, valores e datas.',
        'Marca e modelo vem de um <strong>catalogo com 27 marcas</strong> pre-cadastradas.',
        'A validacao de placa <strong>bloqueia</strong> formatos invalidos.',
        'Nao e possivel cadastrar a mesma placa duas vezes na mesma oficina.',
      ]
    },
    servicos: {
      titulo: 'Servicos',
      itens: [
        'Aqui voce cadastra os <strong>servicos que sua oficina oferece</strong> com os precos que voce pratica.',
        'Se ainda nao tem nenhum, clique em <strong>"Importar catalogo padrao"</strong> pra carregar 100+ servicos com precos sugeridos.',
        'Depois de importar, <strong>edite os precos</strong> conforme a sua realidade.',
        'Organize por <strong>categoria</strong> (Motor, Freios, Suspensao, etc).',
        'Servicos inativos nao aparecem na hora de abrir OS.',
        'Na OS, o autocomplete puxa daqui automaticamente.',
      ]
    },
    pecas: {
      titulo: 'Pecas / Estoque',
      itens: [
        'Cadastre pecas com nome, codigo, marca, custo, margem e preco de venda.',
        'A <strong>margem</strong> calcula o preco de venda automaticamente. Ex: custo R$100 + margem 30% = venda R$130.',
        'Defina <strong>estoque minimo</strong> — pecas abaixo ficam em amarelo, zeradas ficam em vermelho.',
        'Use <strong>"Ajustar"</strong> pra dar entrada (compra), saida (uso/perda) ou ajuste de inventario.',
        'Ao usar peca numa OS, a <strong>baixa do estoque e automatica</strong>.',
        'Se adicionar peca avulsa na OS com "Salvar no estoque" marcado, ela entra no catalogo automaticamente.',
        'Marque <strong>veiculos compativeis</strong> na peca — na OS, pecas compativeis aparecem primeiro com badge verde.',
        'Todo movimento de estoque fica registrado pra auditoria.',
      ]
    },
    equipe: {
      titulo: 'Equipe',
      itens: [
        'Cadastre os mecanicos, atendentes e gerentes da oficina.',
        'Defina a <strong>funcao</strong> (mecanico, atendente, gerente) e a <strong>comissao %</strong>.',
        'A comissao padrao vem das <strong>Configuracoes</strong> da oficina.',
        'Membros inativos nao aparecem na lista de mecanicos ao abrir OS.',
        'Somente <strong>dono e gerente</strong> podem editar dados da equipe.',
      ]
    },
    financeiro: {
      titulo: 'Financeiro',
      itens: [
        'Mostra <strong>entradas e saidas</strong> do caixa da oficina.',
        'Filtre por <strong>Hoje, Semana ou Mes</strong>.',
        'As OS entregues e pagas <strong>entram no caixa automaticamente</strong> — nao precisa lancar manual.',
        'Use <strong>"+ Entrada"</strong> pra aportes e outras receitas.',
        'Use <strong>"+ Saida"</strong> pra despesas (aluguel, luz, material) e retiradas.',
        'Veja os recebimentos por <strong>forma de pagamento</strong> (Pix, dinheiro, credito, etc).',
        'Clique em <strong>"Gerar Relatorio PDF"</strong> pra imprimir ou enviar.',
        'Clique numa OS na lista pra ver os detalhes.',
      ]
    },
    comissao: {
      titulo: 'Comissao',
      itens: [
        'Relatorio de comissao dos mecanicos por periodo.',
        'Selecione o <strong>mes e ano</strong> pra ver.',
        'Mostra: mecanico, quantidade de OS, valor total e valor da comissao.',
        'A comissao % vem do <strong>cadastro do mecanico</strong> na aba Equipe.',
        'Clique em <strong>"Gerar PDF"</strong> pra imprimir a folha de comissao.',
      ]
    },
    config: {
      titulo: 'Configuracoes',
      itens: [
        '<strong>Dados da oficina:</strong> nome, CNPJ, telefone, WhatsApp, endereco — aparecem no PDF das OS.',
        '<strong>Valor da hora:</strong> usado como referencia no calculo de mao de obra.',
        '<strong>Comissao padrao:</strong> ja vem preenchido ao cadastrar novo mecanico.',
        '<strong>Margem padrao:</strong> ja vem preenchida ao cadastrar nova peca (ex: 30%).',
        '<strong>Plano:</strong> mostra seu plano atual e validade do trial.',
      ]
    },
    dashboard: {
      titulo: 'Dashboard',
      itens: [
        'Visao geral da oficina: OS abertas, aguardando orcamento, prontas e faturamento do mes.',
        'A <strong>fila de hoje</strong> mostra os veiculos em andamento com status e mecanico.',
        'Clique num veiculo na fila pra abrir os detalhes da OS.',
      ]
    },
    crm: {
      titulo: 'CRM de Reativacao',
      itens: [
        'Mostra <strong>clientes inativos</strong> agrupados por tempo sem vir a oficina.',
        'Faixas: <strong>Atencao</strong> (30-60 dias), <strong>Risco</strong> (60-90), <strong>Inativos</strong> (90-180), <strong>Perdidos</strong> (180+).',
        'Clique em <strong>"WhatsApp"</strong> pra enviar mensagem personalizada pro cliente. O texto ja vem pronto.',
        'A mensagem muda conforme o tempo de inatividade — mais urgente pra quem ta sumido ha mais tempo.',
        'Clique em <strong>"Agendar"</strong> pra criar um agendamento de retorno direto.',
        'Clientes que fizeram OS nos ultimos 30 dias sao considerados <strong>ativos</strong> e nao aparecem aqui.',
      ]
    },
    agendamentos: {
      titulo: 'Agendamentos',
      itens: [
        'Agende <strong>manutencoes preventivas</strong> vinculadas a um veiculo e cliente.',
        'Tipos disponiveis: revisao, troca de oleo, pneus, filtros, correia, freios, alinhamento, bateria.',
        'Filtre por <strong>Pendentes, Vencidos, Realizados</strong> ou veja todos.',
        'Agendamentos vencidos ficam <strong>destacados em vermelho</strong>.',
        'Clique em <strong>"WhatsApp"</strong> pra notificar o cliente que esta chegando a hora.',
        'Fluxo: Pendente → Notificado (enviou WhatsApp) → Confirmado → Realizado.',
      ]
    },
    contas: {
      titulo: 'Contas a Pagar / Receber',
      itens: [
        'Registre contas <strong>a pagar</strong> (despesas) e <strong>a receber</strong> (receitas futuras).',
        'Veja o resumo do mes: total a pagar, a receber e saldo previsto.',
        'Contas <strong>vencidas</strong> ficam em vermelho, as que vencem <strong>hoje</strong> ficam em amarelo.',
        'Clique em <strong>"Pagar"</strong> pra marcar como paga.',
        'Marque como <strong>recorrente</strong> pra identificar contas mensais fixas.',
        'Categorias: aluguel, energia, agua, internet, fornecedor, funcionario, imposto.',
      ]
    },
    pesquisa: {
      titulo: 'Pesquisa de Satisfacao',
      itens: [
        'Ao entregar uma OS, o sistema pode enviar um <strong>link de avaliacao pelo WhatsApp</strong>.',
        'O cliente avalia de <strong>1 a 5 estrelas</strong> + comentario — sem precisar de login.',
        'Veja a <strong>nota media</strong>, taxa de resposta e distribuicao de notas.',
        'Clique em <strong>"Reenviar"</strong> pra mandar de novo pra quem nao respondeu.',
        'Use esse feedback pra <strong>melhorar o servico</strong> e fidelizar clientes.',
      ]
    },
    admin: {
      titulo: 'Super Admin',
      itens: [
        'Painel exclusivo pra administradores da plataforma.',
        'Veja todas as oficinas cadastradas, usuarios e OS.',
        'Clique em <strong>"Acessar"</strong> pra entrar no contexto de uma oficina e ver/editar como se fosse o dono.',
        'O <strong>badge laranja</strong> no canto mostra qual oficina voce esta acessando. Clique nele pra voltar.',
      ]
    }
  },

  abrir() {
    const pagina = localStorage.getItem('rpmpro-page') || 'kanban';
    const ajuda = this.conteudo[pagina];

    if (!ajuda) {
      APP.toast('Sem ajuda pra essa tela', 'warning');
      return;
    }

    openModal(`
      <div class="modal-header">
        <h3>? ${esc(ajuda.titulo)}</h3>
        <button class="modal-close" onclick="closeModal()">&times;</button>
      </div>
      <div class="modal-body">
        <div style="display:flex;flex-direction:column;gap:10px;">
          ${ajuda.itens.map(item => `
            <div style="display:flex;gap:10px;align-items:flex-start;">
              <span style="color:var(--primary);font-weight:700;flex-shrink:0;">•</span>
              <span style="font-size:14px;line-height:1.5;">${item}</span>
            </div>
          `).join('')}
        </div>
        <div style="margin-top:20px;padding-top:16px;border-top:1px solid var(--border);text-align:center;">
          <span style="font-size:12px;color:var(--text-muted);">RPM Pro — rpmpro.com.br</span>
        </div>
      </div>
    `);
  }
};
