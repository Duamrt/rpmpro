// RPM Pro — Assistente da Landing (chatbot programado + captação de leads)
const ASSISTENTE = {
  _aberto: false,
  _msgs: [],
  _etapa: 'inicio',
  _lead: {},

  // Base de conhecimento do RPM Pro
  _respostas: {
    preco: 'Temos 3 planos:\n\n• <strong>Essencial</strong> — R$ 189/mês (OS, clientes, estoque)\n• <strong>Profissional</strong> — R$ 324/mês (+ financeiro, CRM, agendamentos)\n• <strong>Rede</strong> — R$ 494/mês (multi-unidade)\n\nTodos com <strong>14 dias grátis</strong> pra testar sem compromisso.',
    trial: 'O teste é <strong>grátis por 14 dias</strong>, sem precisar de cartão. Você tem acesso a todas as funcionalidades do plano Profissional. Se gostar, escolhe o plano. Se não, sem compromisso nenhum.',
    funcionalidades: 'O RPM Pro tem tudo que uma oficina precisa:\n\n• <strong>Pátio visual</strong> — veja cada carro e o status em tempo real\n• <strong>OS completa</strong> — serviços, peças, checklist, PDF\n• <strong>Agendamentos</strong> — calendário com lotação por dia\n• <strong>Estoque</strong> — controle de peças com alerta de mínimo\n• <strong>Financeiro</strong> — caixa, contas a pagar/receber\n• <strong>Equipe</strong> — perfis com permissão por função\n• <strong>CRM</strong> — reativação de clientes inativos\n• <strong>Pesquisa de satisfação</strong> automática',
    patio: 'O Pátio é o coração do sistema. É um <strong>quadro visual</strong> (tipo Kanban) onde cada coluna é uma fase:\n\nAvaliação → Diagnóstico → Aprovação → Peça → Execução → Pronto\n\nVocê arrasta o carro conforme o trabalho avança. Bate o olho e sabe tudo.',
    calendario: 'O calendário de agendamentos mostra a <strong>lotação de cada dia</strong> com cores:\n\n🟢 Verde = tem vaga\n🟡 Amarelo = enchendo\n🔴 Vermelho = lotado\n\nClica no dia e vê quem confirmou, quem tá pendente e quem atrasou.',
    estoque: 'Controle completo de peças:\n\n• Cadastro com código, marca e compatibilidade\n• <strong>Alerta automático</strong> quando estoque tá baixo\n• Filtro por negativo/baixo/ok\n• <strong>Exporta Excel</strong> pra inventário físico (imprime e conta)',
    os: 'A Ordem de Serviço tem tudo:\n\n• Busca por placa (autocomplete)\n• Serviços do catálogo ou manual\n• Peças do estoque com baixa automática\n• Checklist de entrada e saída\n• PDF profissional com logo da oficina\n• WhatsApp pro cliente em cada etapa',
    equipe: 'Cada membro tem um perfil com <strong>permissão diferente</strong>:\n\n• <strong>Dono</strong> — vê tudo\n• <strong>Gerente</strong> — quase tudo\n• <strong>Atendente</strong> — OS, clientes, contas\n• <strong>Mecânico</strong> — só o pátio\n\nO dono cria o login de cada um direto pelo sistema.',
    celular: 'Sim! O sistema é <strong>100% responsivo</strong> — funciona no celular, tablet e computador. O mecânico pode atualizar o status do carro direto pelo celular na oficina.',
    diferencial: 'O RPM Pro foi construído <strong>junto com donos de oficina reais</strong>. Não é sistema genérico adaptado.\n\nDestaques:\n• Pátio visual que nenhum concorrente tem\n• Calendário com lotação por dia\n• Checklist de entrada/saída\n• WhatsApp automático pro cliente\n• Funciona no celular\n• Sem instalação — abre no navegador',
    suporte: 'O suporte é direto pelo <strong>WhatsApp</strong> com a equipe que construiu o sistema. Sem robô, sem fila. Você fala com quem entende.',
    migrar: 'Se você já usa outro sistema, a gente te ajuda a <strong>importar os dados</strong> (clientes, veículos, peças). É parte do onboarding, sem custo extra.',
    contrato: 'Sem contrato de fidelidade. Você paga mês a mês e pode cancelar quando quiser. Simples assim.',
    seguranca: 'Seus dados ficam em servidores seguros com <strong>criptografia</strong> e backup diário. Cada oficina só vê os próprios dados — isolamento total.',
  },

  // Palavras-chave → resposta
  _detectar(msg) {
    const m = msg.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    if (/preco|praca|valor|custa|quanto|plano|mensal|pag/.test(m)) return 'preco';
    if (/gratis|trial|teste|experimentar|sem compromisso/.test(m)) return 'trial';
    if (/funciona|faz|modulo|recurso|tem o que/.test(m)) return 'funcionalidades';
    if (/patio|kanban|quadro|status|fase/.test(m)) return 'patio';
    if (/calendar|agend|lotac|vaga|dia/.test(m)) return 'calendario';
    if (/estoque|peca|inventar/.test(m)) return 'estoque';
    if (/ordem|os |servico/.test(m)) return 'os';
    if (/equipe|func|mecanico|atend|permiss/.test(m)) return 'equipe';
    if (/celular|mobile|telefone|responsiv/.test(m)) return 'celular';
    if (/diferent|melhor|vantag|por ?que/.test(m)) return 'diferencial';
    if (/suporte|ajuda|atend/.test(m)) return 'suporte';
    if (/migr|import|outro sistema|troc/.test(m)) return 'migrar';
    if (/contrat|fidel|cancel/.test(m)) return 'contrato';
    if (/segur|dado|backup|lgpd/.test(m)) return 'seguranca';
    return null;
  },

  toggle() {
    this._aberto = !this._aberto;
    const el = document.getElementById('assistente-container');
    if (!el) return;
    el.style.display = this._aberto ? 'flex' : 'none';
    if (this._aberto && !this._msgs.length) {
      this._addBot('Oi! Eu sou a assistente do <strong>RPM Pro</strong> 👋\n\nPosso te ajudar a entender como o sistema funciona, tirar dúvidas sobre preços e funcionalidades.\n\nSobre o que você quer saber?');
      this._addOpcoes(['Preços e planos', 'O que o sistema faz?', 'Quero testar grátis', 'Falar com alguém']);
    }
  },

  _addBot(texto) {
    this._msgs.push({ tipo: 'bot', texto });
    this._renderMsgs();
  },

  _addUser(texto) {
    this._msgs.push({ tipo: 'user', texto });
    this._renderMsgs();
  },

  _addOpcoes(opcoes) {
    this._msgs.push({ tipo: 'opcoes', opcoes });
    this._renderMsgs();
  },

  _renderMsgs() {
    const container = document.getElementById('assistente-msgs');
    if (!container) return;
    container.innerHTML = this._msgs.map(m => {
      if (m.tipo === 'bot') return `<div style="background:#1e2430;padding:12px 14px;border-radius:12px 12px 12px 2px;font-size:13px;line-height:1.6;max-width:85%;color:#e6edf3;">${m.texto.replace(/\n/g, '<br>')}</div>`;
      if (m.tipo === 'user') return `<div style="background:#FF4500;padding:10px 14px;border-radius:12px 12px 2px 12px;font-size:13px;max-width:80%;align-self:flex-end;color:#fff;">${esc(m.texto)}</div>`;
      if (m.tipo === 'opcoes') return `<div style="display:flex;flex-wrap:wrap;gap:6px;">${m.opcoes.map(o => `<button onclick="ASSISTENTE.clicarOpcao('${esc(o)}')" style="background:transparent;border:1px solid #FF4500;color:#FF4500;padding:6px 14px;border-radius:20px;font-size:12px;font-weight:600;cursor:pointer;font-family:inherit;transition:all 0.2s;" onmouseover="this.style.background='#FF4500';this.style.color='#fff'" onmouseout="this.style.background='transparent';this.style.color='#FF4500'">${o}</button>`).join('')}</div>`;
      return '';
    }).join('');
    container.scrollTop = container.scrollHeight;
  },

  clicarOpcao(opcao) {
    this._addUser(opcao);
    // Remove botões de opção anteriores
    this._msgs = this._msgs.filter(m => m.tipo !== 'opcoes');

    const o = opcao.toLowerCase();
    if (/prec|plano/.test(o)) {
      this._addBot(this._respostas.preco);
      this._addOpcoes(['Quero testar grátis', 'O que o sistema faz?', 'Tem contrato?']);
    } else if (/faz|funciona|sistema/.test(o)) {
      this._addBot(this._respostas.funcionalidades);
      this._addOpcoes(['Ver o Pátio visual', 'Ver o Calendário', 'Preços e planos', 'Quero testar']);
    } else if (/testar|gratis|quero/.test(o)) {
      this._addBot('Massa! Pra liberar seu teste grátis de 14 dias, preciso de algumas informações rápidas. Qual o <strong>nome da sua oficina</strong>?');
      this._etapa = 'lead_oficina';
    } else if (/falar|alguem|humano|whats/.test(o)) {
      this._addBot('Sem problema! Fala direto com a gente pelo WhatsApp 👇');
      this._addBot('<a href="https://wa.me/5587981456565?text=Oi%2C%20quero%20saber%20mais%20sobre%20o%20RPM%20Pro" target="_blank" style="color:#25D366;font-weight:700;text-decoration:none;">📱 Chamar no WhatsApp</a>');
      this._etapa = 'lead_nome';
      setTimeout(() => {
        this._addBot('Antes de ir, posso anotar seu contato pra gente te retornar? Qual seu <strong>nome</strong>?');
      }, 1500);
    } else if (/patio|visual/.test(o)) {
      this._addBot(this._respostas.patio);
      this._addOpcoes(['Ver o Calendário', 'Preços', 'Quero testar grátis']);
    } else if (/calend/.test(o)) {
      this._addBot(this._respostas.calendario);
      this._addOpcoes(['Preços e planos', 'Quero testar grátis', 'Funciona no celular?']);
    } else if (/celular|mobile/.test(o)) {
      this._addBot(this._respostas.celular);
      this._addOpcoes(['Preços', 'Quero testar grátis']);
    } else if (/contrat/.test(o)) {
      this._addBot(this._respostas.contrato);
      this._addOpcoes(['Preços e planos', 'Quero testar grátis']);
    } else if (/equipe|permiss/.test(o)) {
      this._addBot(this._respostas.equipe);
      this._addOpcoes(['Preços', 'Quero testar grátis']);
    } else {
      this._addBot('Posso te ajudar com isso! Escolhe uma opção:');
      this._addOpcoes(['Preços e planos', 'O que o sistema faz?', 'Quero testar grátis', 'Falar com alguém']);
    }
  },

  enviarMsg() {
    const input = document.getElementById('assistente-input');
    if (!input) return;
    const msg = input.value.trim();
    if (!msg) return;
    input.value = '';

    this._addUser(msg);
    this._msgs = this._msgs.filter(m => m.tipo !== 'opcoes');

    // Fluxo de captação de lead
    if (this._etapa === 'lead_oficina') {
      this._lead.oficina_nome = msg;
      this._addBot(`<strong>${esc(msg)}</strong> — anotado! Agora seu <strong>nome</strong>?`);
      this._etapa = 'lead_nome';
      return;
    }
    if (this._etapa === 'lead_nome') {
      this._lead.nome = msg;
      this._addBot(`Prazer, ${esc(msg)}! Qual seu <strong>WhatsApp</strong>? (com DDD)`);
      this._etapa = 'lead_whatsapp';
      return;
    }
    if (this._etapa === 'lead_whatsapp') {
      this._lead.whatsapp = msg;
      this._addBot('Qual a <strong>cidade</strong> da oficina?');
      this._etapa = 'lead_cidade';
      return;
    }
    if (this._etapa === 'lead_cidade') {
      this._lead.cidade = msg;
      this._salvarLead();
      this._addBot('Pronto! Suas informações foram salvas ✅\n\nVocê pode <strong>testar agora mesmo</strong> clicando abaixo, ou a gente te chama no WhatsApp em breve!');
      this._addOpcoes(['Criar minha conta agora', 'Chamar no WhatsApp']);
      this._etapa = 'finalizado';
      return;
    }
    if (this._etapa === 'finalizado') {
      if (/conta|criar|cadastr|testar/.test(msg.toLowerCase())) {
        window.location.href = 'login.html#cadastro';
        return;
      }
    }

    // Detecção automática de pergunta
    const chave = this._detectar(msg);
    if (chave) {
      this._addBot(this._respostas[chave]);
      this._addOpcoes(['Quero testar grátis', 'Falar com alguém']);
    } else {
      this._addBot('Boa pergunta! Posso te ajudar melhor por uma dessas opções:');
      this._addOpcoes(['Preços e planos', 'O que o sistema faz?', 'Quero testar grátis', 'Falar com alguém']);
    }
  },

  async _salvarLead() {
    try {
      await db.from('leads').insert({
        nome: this._lead.nome || null,
        whatsapp: this._lead.whatsapp || null,
        oficina_nome: this._lead.oficina_nome || null,
        cidade: this._lead.cidade || null,
        interesse: 'trial',
        mensagens: this._msgs.filter(m => m.tipo !== 'opcoes'),
        origem: 'assistente_landing'
      });
    } catch (e) { /* silencioso */ }
  },

  init() {
    // Injeta o widget na página
    const html = `
    <div id="assistente-container" style="display:none;position:fixed;bottom:90px;right:24px;width:380px;max-width:calc(100vw - 48px);height:520px;max-height:calc(100vh - 120px);background:#0d1117;border:1px solid #21262d;border-radius:16px;z-index:998;flex-direction:column;overflow:hidden;box-shadow:0 8px 32px rgba(0,0,0,0.5);">
      <div style="background:linear-gradient(135deg,#FF4500,#e03d00);padding:16px 20px;display:flex;align-items:center;gap:12px;">
        <div style="width:36px;height:36px;border-radius:50%;background:#fff;display:flex;align-items:center;justify-content:center;font-size:18px;font-weight:900;color:#FF4500;">R</div>
        <div>
          <div style="font-weight:700;font-size:14px;color:#fff;">Assistente RPM Pro</div>
          <div style="font-size:11px;color:#ffcdb8;">Online agora</div>
        </div>
        <div style="flex:1;"></div>
        <button onclick="ASSISTENTE.toggle()" style="background:none;border:none;color:#fff;font-size:20px;cursor:pointer;padding:4px;">✕</button>
      </div>
      <div id="assistente-msgs" style="flex:1;overflow-y:auto;padding:16px;display:flex;flex-direction:column;gap:10px;"></div>
      <div style="padding:12px;border-top:1px solid #21262d;display:flex;gap:8px;">
        <input type="text" id="assistente-input" placeholder="Digite sua pergunta..." style="flex:1;background:#161b22;border:1px solid #21262d;border-radius:8px;padding:10px 14px;color:#e6edf3;font-size:13px;font-family:inherit;outline:none;" onkeydown="if(event.key==='Enter')ASSISTENTE.enviarMsg()">
        <button onclick="ASSISTENTE.enviarMsg()" style="background:#FF4500;border:none;color:#fff;padding:10px 16px;border-radius:8px;font-weight:700;cursor:pointer;font-family:inherit;font-size:13px;">Enviar</button>
      </div>
    </div>
    <button id="assistente-btn" onclick="ASSISTENTE.toggle()" style="position:fixed;bottom:90px;right:24px;width:56px;height:56px;border-radius:50%;background:linear-gradient(135deg,#FF4500,#e03d00);border:none;color:#fff;font-size:24px;cursor:pointer;z-index:997;box-shadow:0 4px 16px rgba(255,69,0,0.4);display:flex;align-items:center;justify-content:center;transition:transform 0.2s;" onmouseover="this.style.transform='scale(1.1)'" onmouseout="this.style.transform='scale(1)'">💬</button>`;

    document.body.insertAdjacentHTML('beforeend', html);

    // Esconde/mostra botão quando chat abre/fecha
    const observer = new MutationObserver(() => {
      const container = document.getElementById('assistente-container');
      const btn = document.getElementById('assistente-btn');
      if (container && btn) btn.style.display = container.style.display === 'flex' ? 'none' : 'flex';
    });
    const container = document.getElementById('assistente-container');
    if (container) observer.observe(container, { attributes: true, attributeFilter: ['style'] });
  }
};

// Auto-init quando carrega a landing
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => ASSISTENTE.init());
} else {
  ASSISTENTE.init();
}
