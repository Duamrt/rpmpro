// RPM Pro — Kanban de Pátio
const KANBAN = {
  colunas: [
    { status: 'entrada', label: 'Aguardando Avaliação', icon: '🔍', cor: '#2563eb' },
    { status: 'diagnostico', label: 'Em Diagnóstico', icon: '🔧', cor: '#eab308' },
    { status: 'orcamento', label: 'Aguardando Aprovação', icon: '💰', cor: '#dc2626' },
    { status: 'aguardando_peca', label: 'Aguardando Peça', icon: '📦', cor: '#999' },
    { status: 'execucao', label: 'Em Execução', icon: '⚙️', cor: '#16a34a' },
    { status: 'pronto', label: 'Pronto', icon: '✅', cor: '#ccc' },
    { status: 'entregue', label: 'Entregue', icon: '🚗', cor: '#8b949e' },
  ],

  _draggedCard: null,

  _mobileTab: 'todos',
  _cachedGrupos: null,
  _cachedIsDono: false,

  _isMobile() {
    return window.innerWidth <= 768;
  },

  async carregar() {
    const container = document.getElementById('kanban-board');
    if (!container) return;

    const isDono = ['dono', 'gerente'].includes(APP.profile.role);
    this._cachedIsDono = isDono;

    // Busca OS ativas (não entregue/cancelada) + entregues dos últimos 7 dias
    const seteDiasAtras = new Date(Date.now() - 7 * 86400000).toISOString();

    const [ativasRes, entreguesRes] = await Promise.all([
      db.from('ordens_servico')
        .select('*, veiculos(placa, marca, modelo, cor), clientes(nome, whatsapp), profiles!ordens_servico_mecanico_id_fkey(nome)')
        .eq('oficina_id', APP.profile.oficina_id)
        .not('status', 'in', '("entregue","cancelada")')
        .order('created_at', { ascending: true }),
      db.from('ordens_servico')
        .select('*, veiculos(placa, marca, modelo, cor), clientes(nome, whatsapp), profiles!ordens_servico_mecanico_id_fkey(nome)')
        .eq('oficina_id', APP.profile.oficina_id)
        .eq('status', 'entregue')
        .gte('data_entrega', seteDiasAtras)
        .order('data_entrega', { ascending: false })
    ]);

    const lista = [...(ativasRes.data || []), ...(entreguesRes.data || [])];

    // Filtro por mecânico (se não for dono/gerente)
    const filtradas = isDono ? lista : lista.filter(os => os.mecanico_id === APP.profile.id);

    // Agrupa por status
    const grupos = {};
    this.colunas.forEach(c => grupos[c.status] = []);
    filtradas.forEach(os => {
      if (grupos[os.status]) grupos[os.status].push(os);
    });
    this._cachedGrupos = grupos;

    // Busca mecânicos pra filtro
    const { data: mecanicos } = await db
      .from('profiles')
      .select('id, nome')
      .eq('oficina_id', APP.profile.oficina_id)
      .in('role', ['mecanico', 'aux_mecanico', 'dono', 'gerente'])
      .eq('ativo', true)
      .order('nome');

    container.innerHTML = `
      <!-- Filtro -->
      ${isDono ? `
      <div style="display:flex;gap:12px;align-items:center;margin-bottom:16px;">
        <select class="form-control" id="kanban-filtro-mecanico" onchange="KANBAN.filtrar()" style="max-width:220px;">
          <option value="">Todos os mecanicos</option>
          ${(mecanicos || []).map(m => `<option value="${esc(m.id)}">${esc(m.nome)}</option>`).join('')}
        </select>
        <span style="font-size:13px;color:var(--text-secondary);" id="kanban-total">${filtradas.length} veiculos no patio</span>
      </div>` : ''}

      <!-- MOBILE: Tabs + Lista -->
      <div class="kanban-mobile-tabs" id="kanban-mobile-tabs">
        <button class="kanban-tab${this._mobileTab === 'todos' ? ' active' : ''}" onclick="KANBAN.setTab('todos')">Todos <span class="tab-count">${filtradas.length}</span></button>
        ${this.colunas.map(col => {
          const cnt = (grupos[col.status] || []).length;
          return `<button class="kanban-tab${this._mobileTab === col.status ? ' active' : ''}" onclick="KANBAN.setTab('${col.status}')">${col.icon} ${esc(col.label)} <span class="tab-count">${cnt}</span></button>`;
        }).join('')}
      </div>
      <div class="kanban-mobile-list" id="kanban-mobile-list">
        ${this._renderMobileList(grupos, isDono)}
      </div>

      <!-- DESKTOP: Board horizontal -->
      <div style="display:flex;gap:12px;overflow-x:auto;padding-bottom:16px;min-height:calc(100vh - 180px);" id="kanban-colunas">
        ${this.colunas.map(col => {
          const cards = grupos[col.status] || [];
          const mostrarEntregue = col.status === 'entregue';
          return `
          <div class="kanban-col" data-status="${col.status}"
               ondragover="event.preventDefault(); this.style.background='rgba(255,69,0,0.05)'"
               ondragleave="this.style.background=''"
               ondrop="KANBAN.drop(event, '${col.status}')"
               style="min-width:220px;max-width:220px;flex-shrink:0;background:var(--bg-card);border:1px solid var(--border);border-top:3px solid ${col.cor};border-radius:var(--radius-lg);display:flex;flex-direction:column;${mostrarEntregue ? 'opacity:0.6;' : ''}">
            <div style="padding:12px 14px;border-bottom:1px solid var(--border);display:flex;justify-content:space-between;align-items:center;">
              <span style="font-size:13px;font-weight:700;color:${col.cor};">${col.icon} ${esc(col.label)}</span>
              <span data-count style="background:${col.cor}18;padding:2px 8px;border-radius:12px;font-size:12px;font-weight:700;color:${col.cor};">${cards.length}</span>
            </div>
            <div style="padding:8px;flex:1;overflow-y:auto;display:flex;flex-direction:column;gap:8px;" data-status="${col.status}">
              ${cards.map(os => this._renderCard(os, isDono)).join('')}
              ${!cards.length ? '<div style="text-align:center;padding:20px 8px;font-size:12px;color:var(--text-muted);">Vazio</div>' : ''}
            </div>
          </div>`;
        }).join('')}
      </div>
    `;
  },

  // Mobile: troca tab e re-renderiza lista
  setTab(status) {
    this._mobileTab = status;
    // Atualiza tabs ativas
    document.querySelectorAll('.kanban-tab').forEach(btn => {
      const tabStatus = btn.getAttribute('onclick').match(/'([^']+)'/)?.[1];
      btn.classList.toggle('active', tabStatus === status);
    });
    // Re-renderiza lista
    const listEl = document.getElementById('kanban-mobile-list');
    if (listEl && this._cachedGrupos) {
      listEl.innerHTML = this._renderMobileList(this._cachedGrupos, this._cachedIsDono);
    }
  },

  _renderMobileList(grupos, isDono) {
    const tab = this._mobileTab;
    let cards = [];

    if (tab === 'todos') {
      this.colunas.forEach(col => {
        (grupos[col.status] || []).forEach(os => cards.push(os));
      });
    } else {
      cards = grupos[tab] || [];
    }

    if (!cards.length) {
      return '<div style="text-align:center;padding:30px 16px;font-size:13px;color:var(--text-muted);">Nenhum veiculo neste status</div>';
    }

    return cards.map(os => this._renderMobileCard(os, isDono, tab === 'todos')).join('');
  },

  _renderMobileCard(os, isDono, showBadge) {
    const agora = Date.now();
    const entrada = new Date(os.data_entrada).getTime();
    const diffMs = agora - entrada;
    const horas = Math.floor(diffMs / 3600000);
    const dias = Math.floor(horas / 24);
    const tempoTexto = dias > 0 ? dias + 'd' : horas + 'h';

    let cardBorder = 'var(--border)';
    let cardBg = 'var(--bg-card)';
    if (os.status === 'pronto') {
      cardBorder = 'var(--success)';
      cardBg = 'rgba(63,185,80,0.06)';
    } else if (horas >= 72) {
      cardBorder = 'var(--danger)';
      cardBg = 'rgba(248,81,73,0.06)';
    } else if (horas >= 24) {
      cardBorder = 'var(--warning)';
      cardBg = 'rgba(240,136,62,0.06)';
    }

    const col = this.colunas.find(c => c.status === os.status);
    const badgeHtml = showBadge ? `<span class="card-status-badge badge-${esc(os.status)}">${col ? col.icon + ' ' + esc(col.label) : esc(os.status)}</span>` : '';

    return `
      <div class="kanban-card" onclick="OS.abrirDetalhes('${os.id}')"
           data-os-id="${os.id}" data-mecanico-id="${os.mecanico_id || ''}" data-status="${esc(os.status)}"
           style="background:${cardBg};border:1px solid ${cardBorder};border-radius:var(--radius);padding:12px 14px;">
        ${badgeHtml}
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
          <span style="font-weight:800;font-size:17px;color:var(--primary);">${esc(os.veiculos?.placa)}</span>
          <span style="font-size:12px;color:${horas >= 72 ? 'var(--danger)' : horas >= 24 ? 'var(--warning)' : 'var(--text-secondary)'};font-weight:600;">${horas >= 24 ? '⚠ ' : ''}${tempoTexto}</span>
        </div>
        <div style="font-size:13px;color:var(--text);margin-bottom:4px;">${esc(os.veiculos?.marca)} ${esc(os.veiculos?.modelo)}${os.veiculos?.cor ? ' — ' + esc(os.veiculos.cor) : ''}</div>
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
          <span style="font-size:12px;color:var(--text-secondary);">👤 ${esc(os.clientes?.nome)}</span>
          <span style="font-size:12px;color:var(--text-muted);">🔧 ${esc(os.profiles?.nome) || 'Sem mecanico'}</span>
        </div>
        ${isDono && os.valor_total ? `<div style="font-size:13px;font-weight:700;color:var(--success);margin-bottom:8px;">R$ ${(os.valor_total || 0).toFixed(0)}</div>` : ''}
        <div style="display:flex;gap:6px;border-top:1px solid var(--border);padding-top:8px;">
          ${this._btnVoltar(os.status, os.id)}
          ${this._btnAvancar(os.status, os.id)}
        </div>
      </div>`;
  },

  _renderCard(os, isDono) {
    const agora = Date.now();
    const entrada = new Date(os.data_entrada).getTime();
    const diffMs = agora - entrada;
    const horas = Math.floor(diffMs / 3600000);
    const dias = Math.floor(horas / 24);
    const tempoTexto = dias > 0 ? dias + 'd' : horas + 'h';

    // Regras visuais
    let cardBorder = 'var(--border)';
    let cardBg = 'var(--bg)';
    if (os.status === 'pronto') {
      cardBorder = 'var(--success)';
      cardBg = 'rgba(63,185,80,0.06)';
    } else if (horas >= 72) {
      // Vermelho: mais de 3 dias
      cardBorder = 'var(--danger)';
      cardBg = 'rgba(248,81,73,0.06)';
    } else if (horas >= 24) {
      // Amarelo: mais de 24h sem mover
      cardBorder = 'var(--warning)';
      cardBg = 'rgba(240,136,62,0.06)';
    }

    return `
      <div class="kanban-card" draggable="true"
           ondragstart="KANBAN.dragStart(event, '${os.id}')"
           onclick="OS.abrirDetalhes('${os.id}')"
           data-os-id="${os.id}"
           data-mecanico-id="${os.mecanico_id || ''}"
           style="background:${cardBg};border:1px solid ${cardBorder};border-radius:var(--radius);padding:10px 12px;cursor:grab;transition:transform 0.1s;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
          <span style="font-weight:800;font-size:15px;color:var(--primary);">${esc(os.veiculos?.placa || '-')}</span>
          <span style="font-size:11px;color:${horas >= 72 ? 'var(--danger)' : horas >= 24 ? 'var(--warning)' : 'var(--text-secondary)'};font-weight:600;">${horas >= 24 ? '⚠ ' : ''}${tempoTexto}</span>
        </div>
        <div style="font-size:12px;color:var(--text);margin-bottom:4px;">${esc(os.veiculos?.marca || '')} ${esc(os.veiculos?.modelo || '')}${os.veiculos?.cor ? ' — ' + esc(os.veiculos.cor) : ''}</div>
        <div style="font-size:11px;color:var(--text-secondary);margin-bottom:4px;">👤 ${esc(os.clientes?.nome || '-')}</div>
        <div style="display:flex;justify-content:space-between;align-items:center;">
          <span style="font-size:11px;color:var(--text-muted);">🔧 ${esc(os.profiles?.nome || 'Sem mecânico')}</span>
          ${isDono && os.valor_total ? `<span style="font-size:11px;font-weight:700;color:var(--success);">R$ ${(os.valor_total || 0).toFixed(0)}</span>` : ''}
        </div>
        <div class="kanban-card-actions" style="display:flex;gap:4px;margin-top:8px;border-top:1px solid var(--border);padding-top:8px;">
          ${this._btnVoltar(os.status, os.id)}
          ${this._btnAvancar(os.status, os.id)}
        </div>
      </div>`;
  },

  _statusOrdem: ['entrada','diagnostico','orcamento','aguardando_peca','execucao','pronto','entregue'],

  _btnAvancar(statusAtual, osId) {
    const idx = this._statusOrdem.indexOf(statusAtual);
    if (idx < 0 || idx >= this._statusOrdem.length - 1) return '';
    const prox = this._statusOrdem[idx + 1];
    const label = this.colunas.find(c => c.status === prox)?.label || prox;
    return `<button class="btn btn-primary btn-sm" style="flex:1;font-size:11px;padding:4px 6px;" onclick="event.stopPropagation(); KANBAN.moverCard('${osId}','${prox}')">${label} →</button>`;
  },

  _btnVoltar(statusAtual, osId) {
    const idx = this._statusOrdem.indexOf(statusAtual);
    if (idx <= 0) return '';
    const ant = this._statusOrdem[idx - 1];
    return `<button class="btn btn-secondary btn-sm" style="font-size:11px;padding:4px 6px;" onclick="event.stopPropagation(); KANBAN.moverCard('${osId}','${ant}')">←</button>`;
  },

  async moverCard(osId, novoStatus) {
    // Busca dados pra WhatsApp
    const { data: os } = await db
      .from('ordens_servico')
      .select('id, status, clientes(nome, whatsapp), veiculos(placa, marca, modelo)')
      .eq('id', osId).single();

    if (!os || os.status === novoStatus) return;

    // Bloqueio: sair de "entrada" sem checklist de entrada
    if (os.status === 'entrada' && novoStatus !== 'entrada' && novoStatus !== 'cancelada') {
      const temEntrada = await OS._temChecklistEntrada(osId);
      if (!temEntrada) {
        APP.toast('Preencha o checklist de entrada antes de mover a OS', 'error');
        return;
      }
    }

    // Bloqueio: ir pra "execucao" sem ter passado por "aprovada"
    if (novoStatus === 'execucao' && os.status !== 'orcamento' && os.status !== 'aguardando_peca') {
      APP.toast('A OS precisa passar por Aprovacao ou Aguardando Peca antes da Execucao', 'error');
      return;
    }

    // Bloqueio: ir pra "pronto" sem checklist de saida
    if (novoStatus === 'pronto') {
      const temSaida = await OS._temChecklistSaida(osId);
      if (!temSaida) {
        APP.toast('Preencha o checklist de saida antes de marcar como Pronto', 'error');
        return;
      }
    }

    // Bloqueio: ir pra "entregue" sem checklist de saida
    if (novoStatus === 'entregue') {
      const temSaida = await OS._temChecklistSaida(osId);
      if (!temSaida) {
        APP.toast('Preencha o checklist de saida antes de entregar', 'error');
        return;
      }
      // Verifica se tem valor
      const { data: osCheck } = await db.from('ordens_servico').select('valor_total').eq('id', osId).single();
      if (!osCheck || !osCheck.valor_total || osCheck.valor_total <= 0) {
        APP.toast('OS sem valor. Adicione servicos ou pecas antes de entregar.', 'error');
        return;
      }
    }

    const update = { status: novoStatus, updated_at: new Date().toISOString() };
    if (novoStatus === 'pronto') update.data_conclusao = new Date().toISOString();
    if (novoStatus === 'entregue') update.data_entrega = new Date().toISOString();

    await db.from('ordens_servico').update(update).eq('id', osId);

    // WhatsApp automático por status
    this._enviarWhatsAuto(os, novoStatus);

    // Lança no caixa se entregue
    if (novoStatus === 'entregue' && typeof OS._lancarNoCaixa === 'function') {
      await OS._lancarNoCaixa(osId);
    }

    APP.toast('Status: ' + novoStatus);
    this.carregar();
  },

  dragStart(e, osId) {
    this._draggedCard = osId;
    e.dataTransfer.effectAllowed = 'move';
    e.target.style.opacity = '0.5';
    setTimeout(() => { if (e.target) e.target.style.opacity = '1'; }, 200);
  },

  async drop(e, novoStatus) {
    e.preventDefault();
    e.currentTarget.style.background = '';
    if (!this._draggedCard) return;

    const osId = this._draggedCard;
    this._draggedCard = null;

    // Busca OS pra pegar status atual e dados do cliente
    const { data: os } = await db
      .from('ordens_servico')
      .select('id, status, clientes(nome, whatsapp), veiculos(placa, marca, modelo)')
      .eq('id', osId)
      .single();

    if (!os || os.status === novoStatus) return;

    // Bloqueio: sair de "entrada" sem checklist de entrada
    if (os.status === 'entrada' && novoStatus !== 'entrada' && novoStatus !== 'cancelada') {
      const temEntrada = await OS._temChecklistEntrada(osId);
      if (!temEntrada) {
        APP.toast('Preencha o checklist de entrada antes de mover a OS', 'error');
        return;
      }
    }

    // Bloqueio: ir pra "execucao" sem ter passado por "aprovada"
    if (novoStatus === 'execucao' && os.status !== 'orcamento' && os.status !== 'aguardando_peca') {
      APP.toast('A OS precisa passar por Aprovacao ou Aguardando Peca antes da Execucao', 'error');
      return;
    }

    // Bloqueio: ir pra "pronto" sem checklist de saida
    if (novoStatus === 'pronto') {
      const temSaida = await OS._temChecklistSaida(osId);
      if (!temSaida) {
        APP.toast('Preencha o checklist de saida antes de marcar como Pronto', 'error');
        return;
      }
    }

    // Bloqueio: ir pra "entregue" sem checklist de saida e sem valor
    if (novoStatus === 'entregue') {
      const temSaida = await OS._temChecklistSaida(osId);
      if (!temSaida) {
        APP.toast('Preencha o checklist de saida antes de entregar', 'error');
        return;
      }
      const { data: osCheck } = await db.from('ordens_servico').select('valor_total').eq('id', osId).single();
      if (!osCheck || !osCheck.valor_total || osCheck.valor_total <= 0) {
        APP.toast('OS sem valor. Adicione servicos ou pecas antes de entregar.', 'error');
        return;
      }
    }

    // Atualiza status
    const update = { status: novoStatus, updated_at: new Date().toISOString() };
    if (novoStatus === 'pronto') update.data_conclusao = new Date().toISOString();
    if (novoStatus === 'entregue') update.data_entrega = new Date().toISOString();

    await db.from('ordens_servico').update(update).eq('id', osId);

    // WhatsApp automático por status
    this._enviarWhatsAuto(os, novoStatus);

    // Lança no caixa se entregue
    if (novoStatus === 'entregue' && typeof OS._lancarNoCaixa === 'function') {
      await OS._lancarNoCaixa(osId);
    }

    APP.toast('Status atualizado: ' + novoStatus);
    this.carregar();
  },

  // Filtro por mecânico
  filtrar() {
    const mecId = document.getElementById('kanban-filtro-mecanico')?.value || '';
    const cards = document.querySelectorAll('.kanban-card');
    let visivel = 0;

    cards.forEach(card => {
      if (!mecId || card.dataset.mecanicoId === mecId) {
        card.style.display = '';
        visivel++;
      } else {
        card.style.display = 'none';
      }
    });

    // Atualiza contadores
    document.querySelectorAll('.kanban-col').forEach(col => {
      const count = col.querySelectorAll('.kanban-card:not([style*="display: none"])').length;
      const countEl = col.querySelector('[data-count]');
      if (countEl) countEl.textContent = count;
    });

    document.getElementById('kanban-total').textContent = visivel + ' veiculos no patio';
  },

  async _enviarWhatsAuto(os, novoStatus) {
    const whats = os.clientes?.whatsapp;
    if (!whats) return;

    const placa = os.veiculos?.placa || '';
    const veiculo = [os.veiculos?.marca, os.veiculos?.modelo].filter(Boolean).join(' ');
    const nomeVeiculo = veiculo ? `${veiculo} placa ${placa}` : placa;
    const oficina = APP.oficina?.nome || 'a oficina';
    const num = whats.replace(/\D/g, '');
    const fone = num.startsWith('55') ? num : '55' + num;

    let msg = '';

    if (novoStatus === 'entregue') {
      msg = await this._montarMsgEntrega(os, nomeVeiculo, placa, oficina);
    } else {
      const mensagens = {
        diagnostico: `Olá! Aqui é da ${oficina}. Seu ${nomeVeiculo} entrou em diagnóstico. Em breve teremos novidades.`,
        orcamento: `Olá! Aqui é da ${oficina}. O orçamento do seu ${nomeVeiculo} está pronto. Posso enviar os detalhes?`,
        aprovada: `Olá! Orçamento do ${nomeVeiculo} aprovado! Já vamos iniciar o serviço. Qualquer novidade te aviso.`,
        aguardando_peca: `Olá! Aqui é da ${oficina}. Seu ${nomeVeiculo} está aguardando uma peça. Te aviso assim que chegar.`,
        execucao: `Olá! Seu ${nomeVeiculo} já está em execução aqui na ${oficina}. Te aviso quando estiver pronto!`,
        pronto: `Olá! Seu ${nomeVeiculo} está pronto pra retirada aqui na ${oficina}! Quando pode vir buscar?`
      };
      msg = mensagens[novoStatus];
    }

    if (!msg) return;

    if (confirm(`Enviar WhatsApp pro cliente?\n\n"${msg}"`)) {
      window.open(`https://wa.me/${fone}?text=${encodeURIComponent(msg)}`, '_blank');
    }
  },

  async _montarMsgEntrega(os, nomeVeiculo, placa, oficina) {
    const { data: osData } = await db.from('ordens_servico')
      .select('id, numero, valor_total, forma_pagamento')
      .eq('id', os.id || '')
      .single();

    const placaLimpa = placa.replace(/[^A-Z0-9]/gi, '');
    const link = 'https://rpmpro.com.br/v?p=' + placaLimpa;

    if (!osData) {
      return `Olá! Seu ${nomeVeiculo} foi entregue pela ${oficina}.\n\nHistórico completo:\n${link}\n\nObrigado pela confiança!`;
    }

    const { data: itens } = await db.from('itens_os')
      .select('descricao, tipo')
      .eq('os_id', osData.id);

    const servicos = (itens || []).filter(i => i.tipo === 'servico').map(i => i.descricao);
    const pagLabels = { dinheiro: 'Dinheiro', pix: 'Pix', debito: 'Débito', credito: 'Crédito', boleto: 'Boleto', pendente: 'Pendente' };
    const pagamento = pagLabels[osData.forma_pagamento] || 'Pendente';
    const total = (osData.valor_total || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

    let msg = `Olá! Seu ${nomeVeiculo} foi entregue pela ${oficina}.\n\n`;

    if (servicos.length) {
      msg += `Serviço: ${servicos.join(', ')}\n`;
    }
    msg += `Total: ${total}\n`;
    msg += `Pagamento: ${pagamento}\n`;
    msg += `\nHistórico completo do veículo:\n${link}\n`;
    msg += `\nObrigado pela confiança!`;

    const whatsOficina = APP.oficina?.whatsapp;
    if (whatsOficina) {
      const numOficina = whatsOficina.replace(/\D/g, '');
      const foneOficina = numOficina.startsWith('55') ? numOficina : '55' + numOficina;
      msg += `\n\nQuando precisar da próxima revisão, é só chamar!\n👉 https://wa.me/${foneOficina}?text=Olá! Gostaria de agendar uma revisão para meu ${nomeVeiculo}`;
    } else {
      msg += `\n\nQuando precisar da próxima revisão, é só chamar! Podemos já agendar um horário pra você.`;
    }

    return msg;
  },

  // ========== REALTIME ==========
  _realtimeChannel: null,

  iniciarRealtime() {
    // Evita duplicar
    if (this._realtimeChannel) return;

    const oficina_id = APP.profile.oficina_id;
    if (!oficina_id) return;

    this._realtimeChannel = db
      .channel('kanban-os-' + oficina_id)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'ordens_servico',
        filter: 'oficina_id=eq.' + oficina_id
      }, (payload) => {
        // Só recarrega se tá na página do kanban
        const paginaAtual = localStorage.getItem('rpmpro-page');
        if (paginaAtual === 'kanban' || paginaAtual === 'dashboard') {
          // Debounce pra não recarregar 10x seguidas
          clearTimeout(this._realtimeTimer);
          this._realtimeTimer = setTimeout(() => {
            // Mostra indicador discreto
            this._mostrarIndicadorSync();
            if (paginaAtual === 'kanban') this.carregar();
            if (paginaAtual === 'dashboard') DASHBOARD.carregar();
          }, 500);
        }
      })
      .subscribe();
  },

  pararRealtime() {
    if (this._realtimeChannel) {
      db.removeChannel(this._realtimeChannel);
      this._realtimeChannel = null;
    }
  },

  _mostrarIndicadorSync() {
    // Flash discreto no header do kanban
    const header = document.querySelector('#page-kanban .page-header h2');
    if (!header) return;
    const original = header.style.color;
    header.style.color = 'var(--success)';
    header.textContent = 'Patio da Oficina ·';
    setTimeout(() => {
      header.style.color = original || '';
      header.textContent = 'Patio da Oficina';
    }, 1500);
  }
};

document.addEventListener('pageLoad', (e) => {
  if (e.detail.page === 'kanban') {
    KANBAN.carregar();
    KANBAN.iniciarRealtime();
  }
});
