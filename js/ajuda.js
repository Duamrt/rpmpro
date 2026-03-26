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
        { titulo: 'Visao geral', info: 'Resumo da oficina: OS abertas, aguardando orcamento, prontas e faturamento do mes.' },
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

  abrir() {
    const pagina = localStorage.getItem('rpmpro-page') || 'kanban';
    const ajuda = this.conteudo[pagina];
    if (!ajuda) { APP.toast('Sem ajuda pra essa tela', 'warning'); return; }

    // Remove painel existente
    const existing = document.getElementById('ajuda-painel');
    if (existing) { existing.remove(); return; }

    const role = APP.profile?.role || 'dono';
    const conteudo = this._renderSecoes(ajuda.secoes, role);

    const painel = document.createElement('div');
    painel.id = 'ajuda-painel';
    painel.innerHTML = `
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;">
        <div style="font-weight:700;font-size:14px;color:var(--primary);letter-spacing:1px;">AJUDA</div>
        <button onclick="AJUDA.fechar()" style="background:none;border:none;color:var(--text-secondary);font-size:22px;cursor:pointer;padding:4px 8px;line-height:1;">&times;</button>
      </div>
      <div style="font-weight:800;font-size:16px;color:var(--text);margin-bottom:16px;padding-bottom:10px;border-bottom:1px solid var(--border);">${esc(ajuda.titulo)}</div>
      ${conteudo}
      <div style="margin-top:20px;padding-top:12px;border-top:1px solid var(--border);text-align:center;">
        <span style="font-size:11px;color:var(--text-muted);">RPM Pro — rpmpro.com.br</span>
      </div>
    `;
    document.body.appendChild(painel);

    // Fechar ao clicar fora
    setTimeout(() => {
      document.addEventListener('click', this._fecharFora);
    }, 100);
  },

  fechar() {
    const p = document.getElementById('ajuda-painel');
    if (p) p.remove();
    document.removeEventListener('click', AJUDA._fecharFora);
  },

  _fecharFora(e) {
    const painel = document.getElementById('ajuda-painel');
    if (!painel) return;
    if (!painel.contains(e.target) && !e.target.closest('[onclick*="AJUDA.abrir"]')) {
      AJUDA.fechar();
    }
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
    @keyframes ajudaSlideIn { from { transform:translateX(100%);opacity:0; } to { transform:translateX(0);opacity:1; } }
    #ajuda-painel { position:fixed;top:0;right:0;width:340px;max-width:90vw;height:100vh;background:var(--bg-card);border-left:1px solid var(--border);z-index:9999;overflow-y:auto;padding:20px;animation:ajudaSlideIn .2s ease;box-shadow:-4px 0 24px rgba(0,0,0,0.4); }
    @media(max-width:768px) { #ajuda-painel { width:100vw !important;max-width:100vw !important; } }
  `;
  document.head.appendChild(style);
})();

// Fechar com ESC
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && document.getElementById('ajuda-painel')) {
    AJUDA.fechar();
    e.stopPropagation();
  }
}, true);
