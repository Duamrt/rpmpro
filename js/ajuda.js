// RPM Pro — Sistema de Ajuda (padrão EDR System)
const AJUDA = {
  conteudo: {
    kanban: {
      titulo: 'Patio da Oficina',
      perfis: ['dono','gerente','mecanico','atendente'],
      secoes: [
        { titulo: 'Visao geral', info: 'Painel visual com todos os veiculos na oficina. Cada card mostra placa, cliente, mecanico e tempo em aberto.' },
        { perfil: 'dono', dica: 'Na primeira vez, o sistema mostra um wizard pra configurar oficina, mecanico e cliente. Se precisar rodar de novo, limpe o cache do navegador.' },
        { titulo: 'Movimentar veiculo', passos: [
          'Use os botoes Avancar e Voltar em cada card',
          'O fluxo e: Entrada → Diagnostico → Orcamento → Aprovada → Execucao → Pronto → Entregue',
          'A OS nao vai pra Execucao sem ser Aprovada primeiro',
          'A OS nao sai de Entrada sem o Checklist de Entrada',
          'A OS nao vai pra Pronto sem o Checklist de Saida'
        ]},
        { titulo: 'Cores dos cards', passos: [
          'Normal = sem destaque',
          'Amarelo = mais de 24h sem movimentar',
          'Vermelho = mais de 3 dias parado'
        ]},
        { titulo: 'WhatsApp automatico', passos: [
          'Ao mover pra Orcamento, oferece enviar orcamento pro cliente',
          'Ao mover pra Pronto, oferece avisar que o carro ta pronto'
        ]},
        { perfil: 'mecanico', dica: 'No celular, use as abas no topo pra filtrar por status.' },
        { dica: 'Clique no card pra abrir os detalhes completos da OS.' }
      ]
    },

    os: {
      titulo: 'Ordens de Servico',
      perfis: ['dono','gerente','mecanico','atendente'],
      secoes: [
        { titulo: 'Criar nova OS', passos: [
          'Clique em + Nova OS',
          'Digite a placa — o sistema busca o veiculo automaticamente',
          'Se nao encontrar, cadastra veiculo e cliente na hora',
          'Adicione servicos pelo autocomplete — valor ja vem preenchido',
          'Voce pode adicionar varios servicos na mesma OS'
        ]},
        { titulo: 'Buscar e filtrar', passos: [
          'Use a busca no topo pra encontrar por placa, cliente, numero ou descricao',
          'Use o filtro por status pra ver so abertas, entregues, etc.'
        ]},
        { titulo: 'Detalhes da OS', passos: [
          'Clique numa OS pra ver tudo: servicos, pecas, valores',
          'Adicione pecas e servicos mesmo depois de aberta',
          'Mude status, gere PDF ou recibo'
        ]},
        { dica: 'Pecas compativeis com o veiculo aparecem primeiro, com badge verde.' }
      ]
    },

    clientes: {
      titulo: 'Clientes',
      perfis: ['dono','gerente','atendente'],
      secoes: [
        { titulo: 'Cadastrar cliente', passos: [
          'Clique em + Novo Cliente',
          'Preencha nome, WhatsApp, CPF/CNPJ e endereco',
          'Ja pode adicionar veiculos direto no mesmo formulario'
        ]},
        { titulo: 'Buscar cliente', passos: [
          'Use a barra de busca pra encontrar por nome, WhatsApp ou CPF'
        ]},
        { alerta: 'Se tentar cadastrar nome repetido, o sistema avisa antes.' },
        { dica: 'A placa aceita formato antigo (ABC-1234) e Mercosul (ABC1D23).' }
      ]
    },

    veiculos: {
      titulo: 'Veiculos',
      perfis: ['dono','gerente','atendente'],
      secoes: [
        { titulo: 'Visao geral', info: 'Lista todos os veiculos cadastrados com placa, marca/modelo, dono e KM.' },
        { titulo: 'Ver historico', passos: [
          'Clique em Historico pra ver todas as OS daquele veiculo',
          'Mostra servicos, valores e datas'
        ]},
        { titulo: 'Catalogo de marcas', info: '27 marcas pre-cadastradas com modelos. Se nao encontrar, selecione "Outro" e digite.' },
        { alerta: 'Nao e possivel cadastrar a mesma placa duas vezes na mesma oficina.' }
      ]
    },

    servicos: {
      titulo: 'Servicos',
      perfis: ['dono','gerente'],
      secoes: [
        { titulo: 'Visao geral', info: 'Cadastre os servicos que sua oficina oferece com seus precos. Na OS, o autocomplete puxa daqui.' },
        { titulo: 'Importar catalogo padrao', passos: [
          'Se ainda nao tem nenhum, clique em Importar catalogo padrao',
          'Carrega 100+ servicos com precos sugeridos',
          'Depois edite os precos conforme sua realidade'
        ]},
        { titulo: 'Organizar', passos: [
          'Organize por categoria: Motor, Freios, Suspensao, etc.',
          'Servicos inativos nao aparecem no autocomplete da OS'
        ]},
        { dica: 'O autocomplete na OS busca pelo nome do servico — quanto mais claro o nome, mais facil de encontrar.' }
      ]
    },

    pecas: {
      titulo: 'Pecas / Estoque',
      perfis: ['dono','gerente'],
      secoes: [
        { titulo: 'Cadastrar peca', passos: [
          'Clique em + Nova Peca',
          'Preencha nome, codigo, marca, custo e margem',
          'A margem calcula o preco de venda automaticamente (ex: custo R$100 + 30% = R$130)'
        ]},
        { titulo: 'Controle de estoque', passos: [
          'Defina estoque minimo — abaixo fica amarelo, zerado fica vermelho',
          'Use Ajustar pra entrada (compra), saida (uso/perda) ou inventario',
          'Ao usar peca numa OS, a baixa e automatica'
        ]},
        { titulo: 'Peca avulsa na OS', passos: [
          'Ao adicionar peca na OS que nao existe no estoque',
          'Marque "Salvar no estoque" pra ela entrar no catalogo automaticamente',
          'A compatibilidade com o veiculo e preenchida automaticamente'
        ]},
        { titulo: 'Compatibilidade', info: 'Marque veiculos compativeis na peca. Na OS, pecas compativeis aparecem primeiro com badge verde.' },
        { dica: 'Todo movimento de estoque fica registrado pra auditoria.' }
      ]
    },

    equipe: {
      titulo: 'Equipe',
      perfis: ['dono','gerente'],
      secoes: [
        { titulo: 'Cadastrar membro', passos: [
          'Clique em + Novo Membro',
          'Defina funcao (mecanico, atendente, gerente) e comissao %',
          'A comissao padrao vem das Configuracoes'
        ]},
        { alerta: 'Somente dono e gerente podem editar dados da equipe.' },
        { dica: 'Membros inativos nao aparecem na lista de mecanicos ao abrir OS.' }
      ]
    },

    financeiro: {
      titulo: 'Financeiro',
      perfis: ['dono','gerente'],
      secoes: [
        { titulo: 'Visao geral', info: 'Caixa da oficina: entradas, saidas e saldo. OS entregues e pagas entram automaticamente — nao precisa lancar manual.' },
        { titulo: 'Registrar movimentacao', passos: [
          'Use + Entrada pra aportes e outras receitas',
          'Use + Saida pra despesas (aluguel, luz, material) e retiradas'
        ]},
        { titulo: 'Filtrar e analisar', passos: [
          'Filtre por Hoje, Semana ou Mes',
          'Veja recebimentos por forma de pagamento (Pix, dinheiro, credito)',
          'Clique numa OS na lista pra ver os detalhes'
        ]},
        { titulo: 'Gerar relatorio', passos: [
          'Clique em Gerar Relatorio PDF',
          'O PDF mostra resumo, OS pagas e movimentacoes do periodo'
        ]},
        { dica: 'OS entregues + pagas lancam no caixa automaticamente. Nao lance manual pra evitar duplicata.' }
      ]
    },

    contas: {
      titulo: 'Contas a Pagar / Receber',
      perfis: ['dono','gerente'],
      secoes: [
        { titulo: 'Visao geral', info: 'Controle contas com vencimento. Veja o saldo previsto do mes: total a pagar vs total a receber.' },
        { titulo: 'Cadastrar conta', passos: [
          'Clique em + A receber ou + A pagar',
          'Preencha descricao, valor, vencimento e categoria',
          'Marque como recorrente se for conta mensal fixa'
        ]},
        { titulo: 'Gerenciar contas', passos: [
          'Filtre por tipo (pagar/receber) e status (pendente/vencido/pago)',
          'Clique em Pagar pra marcar como paga (registra data automatica)',
          'Clique em Editar pra alterar dados'
        ]},
        { alerta: 'Contas vencidas ficam em vermelho. As que vencem hoje ficam em amarelo.' },
        { dica: 'Categorias disponiveis: aluguel, energia, agua, internet, fornecedor, funcionario, imposto.' }
      ]
    },

    fila: {
      titulo: 'Fila de Espera',
      perfis: ['dono','gerente','atendente'],
      secoes: [
        { titulo: 'Visao geral', info: 'Registre contatos de clientes que ligaram ou mandaram WhatsApp. Organize a fila antes de agendar.' },
        { titulo: 'Adicionar na fila', passos: [
          'Clique em + Novo',
          'Preencha: nome, WhatsApp, placa (se souber), o que o cliente disse',
          'Defina a urgencia: Normal, Urgente ou Pode esperar',
          'Clique em Adicionar na fila'
        ]},
        { titulo: 'Atender da fila', passos: [
          'Clique em WhatsApp pra contatar o cliente (mensagem pronta)',
          'Quando confirmar disponibilidade, clique em Agendar',
          'Se o cliente ja esta cadastrado com placa, o agendamento e pre-preenchido',
          'Se nao, cadastre cliente e veiculo antes'
        ]},
        { alerta: 'Itens urgentes ficam com borda vermelha pra chamar atencao.' },
        { dica: 'Use a fila pra nao perder nenhum contato. Mesmo que nao consiga atender agora, registre.' }
      ]
    },
    crm: {
      titulo: 'CRM de Reativacao',
      perfis: ['dono','gerente'],
      secoes: [
        { titulo: 'Visao geral', info: 'Identifica clientes inativos e ajuda a trazê-los de volta. Agrupados por tempo sem vir à oficina.' },
        { titulo: 'Faixas de inatividade', passos: [
          'Atencao (30-60 dias) — hora de lembrar que voce existe',
          'Risco (60-90 dias) — cliente esfriando',
          'Inativos (90-180 dias) — ofereca check-up ou desconto',
          'Perdidos (180+ dias) — pode ter ido pra outra oficina',
          'Sem OS — cadastrados mas nunca trouxeram o carro'
        ]},
        { titulo: 'Reativar cliente', passos: [
          'Clique em WhatsApp — a mensagem ja vem pronta e personalizada',
          'A mensagem muda conforme o tempo de inatividade',
          'Clique em Agendar pra criar um agendamento de retorno'
        ]},
        { dica: 'Clientes que fizeram OS nos ultimos 30 dias sao ativos e nao aparecem aqui.' }
      ]
    },

    agendamentos: {
      titulo: 'Agendamentos',
      perfis: ['dono','gerente','atendente'],
      secoes: [
        { titulo: 'Visao geral', info: 'Agende manutencoes preventivas vinculadas a veiculo e cliente. O sistema avisa quando ta chegando a hora.' },
        { titulo: 'Criar agendamento', passos: [
          'Clique em + Novo Agendamento',
          'Selecione cliente e veiculo',
          'Escolha o tipo: revisao, troca de oleo, pneus, filtros, correia, freios, alinhamento, bateria',
          'Defina a data prevista e KM previsto (opcional)',
          'Clique em Agendar'
        ]},
        { titulo: 'Fluxo do agendamento', passos: [
          'Pendente — agendamento criado, aguardando',
          'Notificado — voce enviou WhatsApp pro cliente',
          'Confirmado — cliente confirmou que vem',
          'Realizado — servico feito',
          'Cancelado — nao vai mais acontecer'
        ]},
        { titulo: 'Notificar cliente', passos: [
          'Clique em WhatsApp — envia mensagem lembrando da data',
          'O sistema marca automaticamente como Notificado'
        ]},
        { titulo: 'Editar agendamento', passos: [
          'Clique em Editar pra mudar tipo, data, KM ou observacoes',
          'Cliente e veiculo nao podem ser alterados depois de criado'
        ]},
        { alerta: 'Agendamentos vencidos ficam em vermelho. Fique atento!' },
        { dica: 'Voce tambem pode criar agendamentos direto do CRM, clicando em Agendar no cliente inativo.' }
      ]
    },

    pesquisa: {
      titulo: 'Pesquisa de Satisfacao',
      perfis: ['dono','gerente'],
      secoes: [
        { titulo: 'Visao geral', info: 'Ao entregar uma OS, envie um link de avaliacao pelo WhatsApp. O cliente avalia de 1 a 5 sem precisar de login.' },
        { titulo: 'Como funciona', passos: [
          'Ao entregar a OS, o sistema oferece enviar pesquisa via WhatsApp',
          'O cliente recebe um link unico (rpmpro.com.br/pesquisa.html?t=token)',
          'Ele avalia de 1 a 5 com emoji + comentario opcional',
          'A resposta aparece aqui automaticamente'
        ]},
        { titulo: 'Analisar resultados', passos: [
          'Veja a nota media, taxa de resposta e distribuicao de notas',
          'Notas baixas (1-2) indicam problemas a resolver',
          'Leia os comentarios pra entender o que melhorar'
        ]},
        { titulo: 'Reenviar pesquisa', passos: [
          'Se o cliente nao respondeu, clique em Reenviar',
          'Manda uma mensagem diferente pedindo de novo'
        ]},
        { dica: 'Use as avaliacoes positivas como depoimento nas redes sociais (com autorizacao do cliente).' }
      ]
    },

    comissao: {
      titulo: 'Comissao',
      perfis: ['dono','gerente'],
      secoes: [
        { titulo: 'Visao geral', info: 'Relatorio de comissao dos mecanicos por periodo. A comissao % vem do cadastro do mecanico na aba Equipe.' },
        { titulo: 'Gerar relatorio', passos: [
          'Selecione o mes e ano',
          'Veja: mecanico, quantidade de OS, valor total e comissao'
        ]},
        { titulo: 'Exportar', passos: [
          'Clique em Gerar PDF pra imprimir a folha de comissao'
        ]}
      ]
    },

    config: {
      titulo: 'Configuracoes',
      perfis: ['dono','gerente'],
      secoes: [
        { titulo: 'Dados da oficina', info: 'Nome, CNPJ, telefone, WhatsApp, endereco — aparecem no PDF das OS.' },
        { titulo: 'Parametros', passos: [
          'Valor da hora — referencia no calculo de mao de obra',
          'Comissao padrao — ja vem preenchido ao cadastrar mecanico',
          'Margem padrao — ja vem preenchida ao cadastrar peca (ex: 30%)'
        ]},
        { dica: 'Plano e validade do trial aparecem aqui tambem.' }
      ]
    },

    dashboard: {
      titulo: 'Dashboard',
      perfis: ['dono','gerente'],
      secoes: [
        { titulo: 'Visao geral', info: 'Resumo da oficina: OS abertas, aguardando orcamento, prontas, faturamento, ticket medio, tempo medio de permanencia e ranking de mecanicos.' },
        { titulo: 'Metricas avancadas', passos: [
          'Ticket medio: valor medio das OS entregues no mes',
          'Tempo medio: quanto tempo o veiculo fica na oficina',
          'Ranking mecanicos: quem mais entregou no mes (so pra dono/gerente)'
        ]},
        { titulo: 'Fila de hoje', passos: [
          'Mostra veiculos em andamento com status e mecanico',
          'Clique num veiculo pra abrir os detalhes da OS'
        ]}
      ]
    },

    admin: {
      titulo: 'Painel Super Admin',
      perfis: ['dono'],
      secoes: [
        { titulo: 'Dashboard', info: 'Visao geral da plataforma com KPIs: oficinas ativas, usuarios, MRR estimado, leads novos, OS no mes e taxa de conversao. Pipeline visual de leads e atividade recente.' },
        { titulo: 'Leads', passos: [
          'Todos os leads captados pela landing aparecem aqui',
          'Filtre por status: novo, contato, negociando, convertido, perdido',
          'Mude o status direto no dropdown do card',
          'Botao WhatsApp abre conversa com o lead',
          'Badge vermelho na sidebar mostra leads novos'
        ]},
        { titulo: 'Oficinas', passos: [
          'Lista todas as oficinas com busca por nome, cidade, CNPJ ou plano',
          'Cada card mostra usuarios, OS, faturamento e plano',
          'Acessar: entra no contexto da oficina como dono',
          'Usuarios: lista membros da oficina, reseta senha',
          'Plano: troca plano e validade'
        ]},
        { titulo: 'Acessar oficina', passos: [
          'Ao acessar, a sidebar muda pra navegacao da oficina',
          'O botao "Voltar ao Admin" aparece no topo da sidebar',
          'Clique nele pra retornar ao painel admin'
        ]},
        { dica: 'Voce (super admin) nunca e bloqueado, mesmo que a oficina esteja em trial expirado.' }
      ]
    }
  },

  _msgs: [],

  abrir() {
    const existing = document.getElementById('ajuda-painel');
    if (existing) { existing.remove(); return; }

    const pagina = localStorage.getItem('rpmpro-page') || 'kanban';
    const ajuda = this.conteudo[pagina];
    this._msgs = [];

    const painel = document.createElement('div');
    painel.id = 'ajuda-painel';
    painel.innerHTML = `
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;">
        <div style="display:flex;align-items:center;gap:8px;">
          <div style="width:32px;height:32px;background:var(--primary);border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:16px;font-weight:900;color:#fff;">R</div>
          <div>
            <div style="font-weight:700;font-size:14px;">Assistente RPM Pro</div>
            <div style="font-size:11px;color:var(--success);">Online</div>
          </div>
        </div>
        <button onclick="AJUDA.fechar()" style="background:none;border:none;color:var(--text-secondary);font-size:22px;cursor:pointer;padding:4px 8px;line-height:1;">&times;</button>
      </div>
      <div id="ajuda-chat" style="flex:1;overflow-y:auto;padding:8px 0;display:flex;flex-direction:column;gap:10px;"></div>
      <div style="display:flex;gap:8px;padding-top:10px;border-top:1px solid var(--border);">
        <input type="text" class="form-control" id="ajuda-input" placeholder="Digite sua duvida..." style="font-size:13px;" onkeydown="if(event.key==='Enter'){AJUDA.enviar();event.preventDefault();}">
        <button class="btn btn-primary btn-sm" onclick="AJUDA.enviar()" style="padding:8px 14px;">Enviar</button>
      </div>
    `;
    document.body.appendChild(painel);

    // Mensagem inicial com sugestões baseadas na tela
    const saudacao = `Ola, ${(APP.profile?.nome || '').split(' ')[0] || 'tudo bem'}! Sou o assistente do RPM Pro. Como posso te ajudar?`;
    this._addMsg('bot', saudacao);

    if (ajuda) {
      const sugestoes = ajuda.secoes.filter(s => s.titulo && !s.perfil).slice(0, 4).map(s => s.titulo);
      if (sugestoes.length) {
        const btns = sugestoes.map(s => `<button class="btn btn-secondary btn-sm" style="font-size:11px;margin:2px;" onclick="AJUDA._perguntaRapida('${escAttr(s)}')">${escAttr(s)}</button>`).join('');
        this._addMsg('bot', `Voce ta na tela <strong>${esc(ajuda.titulo)}</strong>. Algumas duvidas comuns:<br><div style="margin-top:6px;">${btns}</div>`);
      }
    }

    setTimeout(() => document.getElementById('ajuda-input')?.focus(), 200);
  },

  fechar() {
    const p = document.getElementById('ajuda-painel');
    if (p) p.remove();
  },

  _addMsg(tipo, texto) {
    const chat = document.getElementById('ajuda-chat');
    if (!chat) return;
    const isBot = tipo === 'bot';
    const div = document.createElement('div');
    div.style.cssText = `max-width:85%;padding:10px 14px;border-radius:12px;font-size:13px;line-height:1.5;${isBot ? 'background:var(--bg-input);color:var(--text);align-self:flex-start;border-bottom-left-radius:4px;' : 'background:var(--primary);color:#fff;align-self:flex-end;border-bottom-right-radius:4px;'}`;
    div.innerHTML = texto;
    chat.appendChild(div);
    chat.scrollTop = chat.scrollHeight;
  },

  _perguntaRapida(titulo) {
    const input = document.getElementById('ajuda-input');
    if (input) input.value = titulo;
    this.enviar();
  },

  enviar() {
    const input = document.getElementById('ajuda-input');
    if (!input) return;
    const pergunta = input.value.trim();
    if (!pergunta) return;
    input.value = '';

    this._addMsg('user', esc(pergunta));

    // Busca resposta
    const resposta = this._buscarResposta(pergunta);
    setTimeout(() => this._addMsg('bot', resposta), 300);
  },

  _buscarResposta(pergunta) {
    const p = pergunta.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const pagina = localStorage.getItem('rpmpro-page') || 'kanban';

    // Base de respostas por palavra-chave
    const respostas = [
      { keys: ['os', 'ordem', 'servico', 'abrir os', 'criar os', 'nova os'], resp: 'Pra abrir uma OS, va no <strong>Patio</strong> e clique em <strong>"+ Nova OS"</strong>. Selecione o cliente, veiculo, e descreva o problema. A OS vai aparecer no Kanban como "Entrada".' },
      { keys: ['mover', 'avancar', 'status', 'mudar status'], resp: 'No Patio (Kanban), use os botoes <strong>Avancar</strong> e <strong>Voltar</strong> em cada card. O fluxo e: Entrada → Diagnostico → Orcamento → Aprovada → Execucao → Pronto → Entregue.' },
      { keys: ['checklist', 'entrada', 'saida', 'vistoria'], resp: 'O <strong>checklist de entrada</strong> deve ser preenchido antes de mover o veiculo pra diagnostico. O <strong>checklist de saida</strong> antes de marcar como Pronto. Ambos estao nos detalhes da OS.' },
      { keys: ['whatsapp', 'mensagem', 'avisar cliente', 'notificar'], resp: 'O sistema envia WhatsApp automatico pro cliente a cada mudanca de status. A mensagem vai com nome do cliente, veiculo e nome da oficina. Voce pode enviar manualmente pelo botao "Avisar cliente" nos detalhes da OS.' },
      { keys: ['pdf', 'imprimir', 'recibo', 'impressao'], resp: 'Nos detalhes da OS tem dois botoes: <strong>Imprimir OS</strong> (documento completo) e <strong>Gerar Recibo</strong> (pra entregar pro cliente). Os dois saem em PDF com logo da oficina e dados completos.' },
      { keys: ['pix', 'qr code', 'pagamento', 'cobranca'], resp: 'Configure sua chave Pix em <strong>Configuracoes</strong>. Depois disso, o recibo (PDF) vai sair com QR Code Pix pro cliente pagar na hora pelo celular.' },
      { keys: ['cliente', 'cadastrar cliente', 'novo cliente'], resp: 'Va em <strong>Clientes</strong> e clique em <strong>"+ Novo Cliente"</strong>. Preencha nome, WhatsApp e adicione pelo menos um veiculo. Tambem e possivel cadastrar direto pela Fila de Espera ou Agendamento.' },
      { keys: ['veiculo', 'carro', 'placa', 'cadastrar veiculo'], resp: 'Veiculos sao cadastrados junto com o cliente. Edite o cliente e clique em <strong>"+ Veiculo"</strong>. Cada veiculo precisa de placa unica.' },
      { keys: ['agendamento', 'agendar', 'agenda', 'calendario', 'marcar'], resp: 'Va em <strong>Agendamentos</strong> e clique em <strong>"+ Novo Agendamento"</strong>. Selecione cliente, veiculo, tipo e data. O painel mostra vagas disponiveis por dia.' },
      { keys: ['fila', 'espera', 'fila de espera', 'telefone', 'ligou'], resp: 'A <strong>Fila de Espera</strong> e pra quando o cliente liga ou manda WhatsApp pedindo atendimento. Registre nome, veiculo e o que ele disse. Depois voce pode mover pra Agendamento.' },
      { keys: ['equipe', 'mecanico', 'funcionario', 'membro'], resp: 'Va em <strong>Equipe</strong> e clique em <strong>"+ Novo Membro"</strong>. Defina funcao (mecanico, atendente, gerente) e comissao. Pra criar login, clique no botao "Criar login" no card do membro.' },
      { keys: ['comissao', 'quanto ganho', 'porcentagem'], resp: 'A comissao e calculada sobre as OS entregues. O percentual e definido no cadastro de cada membro. Veja o relatorio em <strong>Comissao</strong>.' },
      { keys: ['estoque', 'peca', 'pecas', 'inventario'], resp: 'Va em <strong>Pecas / Estoque</strong> pra gerenciar. Voce pode filtrar por nivel de estoque, exportar inventario pro Excel, e o sistema alerta quando uma peca ta abaixo do minimo.' },
      { keys: ['financeiro', 'caixa', 'faturamento', 'dinheiro'], resp: 'O <strong>Caixa</strong> mostra entradas e saidas do dia. As <strong>Contas a Pagar</strong> controlam despesas. O <strong>Dashboard</strong> mostra faturamento do mes, ticket medio e ranking de mecanicos.' },
      { keys: ['config', 'configuracao', 'logo', 'dados oficina'], resp: 'Em <strong>Configuracoes</strong> voce define: dados da oficina, CNPJ, endereco, logo, chave Pix, valor da hora, margem sobre pecas e capacidade diaria.' },
      { keys: ['historico', 'manutencao', 'consultar'], resp: 'Cada veiculo tem um link publico de historico. Nos detalhes da OS, clique em <strong>"Enviar historico do veiculo"</strong> pra mandar pro cliente por WhatsApp.' },
      { keys: ['crm', 'reativacao', 'cliente sumiu', 'retorno'], resp: 'O <strong>CRM</strong> mostra clientes inativos — quem nao volta ha muito tempo. Voce pode enviar WhatsApp de reativacao direto de la.' },
      { keys: ['satisfacao', 'pesquisa', 'avaliacao', 'nota'], resp: 'A <strong>Pesquisa de Satisfacao</strong> envia um link pro cliente avaliar o servico apos a entrega. As respostas aparecem no painel.' },
      { keys: ['plano', 'trial', 'preco', 'valor', 'assinatura'], resp: 'O trial dura 14 dias. Os planos sao: Essencial R$ 189, Profissional R$ 324 e Rede R$ 494. Pra ativar, fale pelo WhatsApp (87) 98145-6565.' },
      { keys: ['kanban', 'patio', 'quadro'], resp: 'O <strong>Patio</strong> e o quadro Kanban — mostra todos os veiculos na oficina organizados por status. Ele atualiza em tempo real quando alguem muda o status de uma OS.' },
      { keys: ['dashboard', 'metricas', 'indicadores', 'relatorio'], resp: 'O <strong>Dashboard</strong> mostra: OS abertas, faturamento, ticket medio, tempo medio de permanencia e ranking de mecanicos do mes.' },
      { keys: ['foto', 'camera', 'imagem'], resp: 'Voce pode tirar fotos do veiculo no <strong>checklist de entrada</strong>. As fotos ficam salvas na OS pra registro e protecao da oficina.' },
      { keys: ['login', 'senha', 'acesso', 'entrar'], resp: 'Pra criar login pra um membro da equipe, va em <strong>Equipe</strong>, clique no membro e depois em <strong>"Criar login"</strong>. Defina email e senha.' },
    ];

    // Busca melhor match
    let melhorResp = null;
    let melhorScore = 0;

    for (const r of respostas) {
      let score = 0;
      for (const key of r.keys) {
        if (p.includes(key)) score += key.length;
      }
      if (score > melhorScore) {
        melhorScore = score;
        melhorResp = r.resp;
      }
    }

    if (melhorResp) return melhorResp;

    // Resposta da tela atual se não encontrou match
    const ajuda = this.conteudo[pagina];
    if (ajuda) {
      const info = ajuda.secoes.find(s => s.info);
      if (info) return info.info + '<br><br>Tente perguntar algo mais especifico, como "como abrir OS" ou "como agendar".';
    }

    return 'Nao entendi sua duvida. Tente perguntar sobre: <strong>OS, agendamento, cliente, peca, financeiro, config, checklist, WhatsApp</strong>, ou qualquer funcao do sistema.';
  },

  _renderSecoes(secoes, role) {
    let html = '';
    secoes.forEach(s => {
      // Filtro por perfil
      if (s.perfil && s.perfil !== role && role !== 'dono') return;

      // Bloco info (azul)
      if (s.info) {
        html += `<div style="background:var(--info-bg);border:1px solid rgba(56,139,253,0.3);border-radius:8px;padding:10px 12px;margin:10px 0;font-size:13px;color:var(--info);">
          ${s.titulo ? `<div style="font-weight:700;margin-bottom:4px;">${esc(s.titulo)}</div>` : ''}${s.info}</div>`;
      }

      // Passos numerados
      if (s.passos) {
        html += `<div style="margin:12px 0;">
          <div style="font-weight:700;color:var(--primary);font-size:12px;margin-bottom:8px;text-transform:uppercase;letter-spacing:.5px;">${esc(s.titulo)}${s.perfil ? ' <span style="font-size:9px;background:var(--warning-bg);color:var(--warning);padding:1px 6px;border-radius:3px;margin-left:6px;">' + s.perfil.toUpperCase() + '</span>' : ''}</div>`;
        s.passos.forEach((p, i) => {
          html += `<div style="display:flex;gap:8px;align-items:flex-start;margin-bottom:6px;">
            <span style="min-width:20px;height:20px;background:var(--primary);color:#fff;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:700;flex-shrink:0;">${i + 1}</span>
            <span style="font-size:13px;color:var(--text-secondary);line-height:1.5;">${p}</span>
          </div>`;
        });
        html += '</div>';
      }

      // Dica (amarelo)
      if (s.dica) {
        html += `<div style="background:var(--warning-bg);border:1px solid rgba(240,136,62,0.3);border-radius:8px;padding:8px 12px;margin:8px 0;font-size:12px;color:var(--warning);">💡 ${s.dica}</div>`;
      }

      // Alerta (vermelho)
      if (s.alerta) {
        html += `<div style="background:var(--danger-bg);border:1px solid rgba(248,81,73,0.3);border-radius:8px;padding:8px 12px;margin:8px 0;font-size:12px;color:var(--danger);">⚠ ${s.alerta}</div>`;
      }
    });
    return html;
  }
};

// CSS do painel lateral
(function() {
  if (document.getElementById('ajuda-css')) return;
  const style = document.createElement('style');
  style.id = 'ajuda-css';
  style.textContent = `
    @keyframes ajudaSlideUp { from { transform:translateY(20px);opacity:0; } to { transform:translateY(0);opacity:1; } }
    #ajuda-painel { position:fixed;bottom:80px;right:24px;width:360px;max-width:calc(100vw - 48px);height:50vh;max-height:480px;background:var(--bg-card);border:1px solid var(--border);border-radius:16px;z-index:9999;padding:16px;animation:ajudaSlideUp .2s ease;box-shadow:0 8px 32px rgba(0,0,0,0.5);display:flex;flex-direction:column; }
    @media(max-width:768px) { #ajuda-painel { bottom:70px;right:8px;left:8px;width:auto;max-width:none;height:55vh; } }
  `;
  document.head.appendChild(style);
})();

// Atualiza chat ao mudar de tela
document.addEventListener('pageLoad', (e) => {
  const painel = document.getElementById('ajuda-painel');
  if (!painel) return;
  const pagina = e.detail.page;
  const ajuda = AJUDA.conteudo[pagina];
  if (ajuda) {
    AJUDA._addMsg('bot', `Voce mudou pra <strong>${esc(ajuda.titulo)}</strong>. Tem alguma duvida sobre essa tela?`);
  }
});

// Fechar com ESC
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && document.getElementById('ajuda-painel')) {
    AJUDA.fechar();
    e.stopPropagation();
  }
}, true);
