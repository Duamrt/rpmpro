// RPM Pro — Kanban de Pátio
const KANBAN = {
  colunas: [
    { status: 'entrada', label: 'Aguardando Avaliação', icon: '🔍' },
    { status: 'diagnostico', label: 'Em Diagnóstico', icon: '🔧' },
    { status: 'orcamento', label: 'Aguardando Aprovação', icon: '💰' },
    { status: 'aguardando_peca', label: 'Aguardando Peça', icon: '📦' },
    { status: 'execucao', label: 'Em Execução', icon: '⚙️' },
    { status: 'pronto', label: 'Pronto', icon: '✅' },
    { status: 'entregue', label: 'Entregue', icon: '🚗' },
  ],

  _draggedCard: null,

  async carregar() {
    const container = document.getElementById('kanban-board');
    if (!container) return;

    const isDono = ['dono', 'gerente'].includes(APP.profile.role);

    // Busca todas OS ativas
    const { data: ordens } = await db
      .from('ordens_servico')
      .select('*, veiculos(placa, marca, modelo, cor), clientes(nome, whatsapp), profiles!ordens_servico_mecanico_id_fkey(nome)')
      .eq('oficina_id', APP.profile.oficina_id)
      .not('status', 'eq', 'cancelada')
      .order('created_at', { ascending: true });

    const lista = ordens || [];

    // Filtro por mecânico (se não for dono/gerente)
    const filtradas = isDono ? lista : lista.filter(os => os.mecanico_id === APP.profile.id);

    // Agrupa por status
    const grupos = {};
    this.colunas.forEach(c => grupos[c.status] = []);
    filtradas.forEach(os => {
      if (grupos[os.status]) grupos[os.status].push(os);
    });

    // Busca mecânicos pra filtro
    const { data: mecanicos } = await db
      .from('profiles')
      .select('id, nome')
      .eq('oficina_id', APP.profile.oficina_id)
      .in('role', ['mecanico', 'dono', 'gerente'])
      .eq('ativo', true)
      .order('nome');

    container.innerHTML = `
      <!-- Filtro -->
      ${isDono ? `
      <div style="display:flex;gap:12px;align-items:center;margin-bottom:16px;">
        <select class="form-control" id="kanban-filtro-mecanico" onchange="KANBAN.filtrar()" style="max-width:220px;">
          <option value="">Todos os mecanicos</option>
          ${(mecanicos || []).map(m => `<option value="${m.id}">${m.nome}</option>`).join('')}
        </select>
        <span style="font-size:13px;color:var(--text-secondary);" id="kanban-total">${filtradas.length} veiculos no patio</span>
      </div>` : ''}

      <!-- Board -->
      <div style="display:flex;gap:12px;overflow-x:auto;padding-bottom:16px;min-height:calc(100vh - 180px);" id="kanban-colunas">
        ${this.colunas.map(col => {
          const cards = grupos[col.status] || [];
          const mostrarEntregue = col.status === 'entregue';
          return `
          <div class="kanban-col" data-status="${col.status}"
               ondragover="event.preventDefault(); this.style.background='rgba(255,69,0,0.05)'"
               ondragleave="this.style.background=''"
               ondrop="KANBAN.drop(event, '${col.status}')"
               style="min-width:220px;max-width:220px;flex-shrink:0;background:var(--bg-card);border:1px solid var(--border);border-radius:var(--radius-lg);display:flex;flex-direction:column;${mostrarEntregue ? 'opacity:0.6;' : ''}">
            <div style="padding:12px 14px;border-bottom:1px solid var(--border);display:flex;justify-content:space-between;align-items:center;">
              <span style="font-size:13px;font-weight:700;">${col.icon} ${col.label}</span>
              <span style="background:var(--bg-input);padding:2px 8px;border-radius:12px;font-size:12px;font-weight:700;color:var(--text-secondary);">${cards.length}</span>
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
          <span style="font-weight:800;font-size:15px;color:var(--primary);">${os.veiculos?.placa || '-'}</span>
          <span style="font-size:11px;color:${horas >= 72 ? 'var(--danger)' : horas >= 24 ? 'var(--warning)' : 'var(--text-secondary)'};font-weight:600;">${horas >= 24 ? '⚠ ' : ''}${tempoTexto}</span>
        </div>
        <div style="font-size:12px;color:var(--text);margin-bottom:4px;">${os.veiculos?.marca || ''} ${os.veiculos?.modelo || ''}${os.veiculos?.cor ? ' — ' + os.veiculos.cor : ''}</div>
        <div style="font-size:11px;color:var(--text-secondary);margin-bottom:4px;">👤 ${os.clientes?.nome || '-'}</div>
        <div style="display:flex;justify-content:space-between;align-items:center;">
          <span style="font-size:11px;color:var(--text-muted);">🔧 ${os.profiles?.nome || 'Sem mecânico'}</span>
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
      .select('status, clientes(nome, whatsapp), veiculos(placa)')
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
    if (novoStatus === 'execucao' && os.status !== 'aprovada' && os.status !== 'aguardando_peca') {
      APP.toast('A OS precisa estar aprovada antes de ir pra execucao', 'error');
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

    const update = { status: novoStatus, updated_at: new Date().toISOString() };
    if (novoStatus === 'pronto') update.data_conclusao = new Date().toISOString();
    if (novoStatus === 'entregue') update.data_entrega = new Date().toISOString();

    await db.from('ordens_servico').update(update).eq('id', osId);

    // WhatsApp automático
    const whats = os.clientes?.whatsapp;
    const placa = os.veiculos?.placa || '';
    if (whats) {
      const num = whats.replace(/\D/g, '');
      const fone = num.startsWith('55') ? num : '55' + num;
      let msg = null;

      if (novoStatus === 'orcamento') msg = `Olá! O orçamento do seu veículo ${placa} está pronto. Posso enviar os detalhes?`;
      else if (novoStatus === 'pronto') msg = `Olá! Seu veículo ${placa} está pronto para retirada!`;
      else if (novoStatus === 'aguardando_peca') msg = `Olá! Seu veículo ${placa} está aguardando uma peça. Te aviso assim que chegar.`;

      if (msg && confirm(`Enviar WhatsApp pro cliente?\n\n"${msg}"`)) {
        window.open(`https://wa.me/${fone}?text=${encodeURIComponent(msg)}`, '_blank');
      }
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
      .select('status, clientes(nome, whatsapp), veiculos(placa)')
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
    if (novoStatus === 'execucao' && os.status !== 'aprovada' && os.status !== 'aguardando_peca') {
      APP.toast('A OS precisa estar aprovada antes de ir pra execucao', 'error');
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

    // Atualiza status
    const update = { status: novoStatus, updated_at: new Date().toISOString() };
    if (novoStatus === 'pronto') update.data_conclusao = new Date().toISOString();
    if (novoStatus === 'entregue') update.data_entrega = new Date().toISOString();

    await db.from('ordens_servico').update(update).eq('id', osId);

    // WhatsApp automático em colunas-chave
    const whats = os.clientes?.whatsapp;
    const placa = os.veiculos?.placa || '';
    if (whats) {
      const num = whats.replace(/\D/g, '');
      const fone = num.startsWith('55') ? num : '55' + num;
      let msg = null;

      if (novoStatus === 'orcamento') {
        msg = `Olá! O orçamento do seu veículo ${placa} está pronto. Posso enviar os detalhes?`;
      } else if (novoStatus === 'pronto') {
        msg = `Olá! Seu veículo ${placa} está pronto para retirada! Quando pode vir buscar?`;
      } else if (novoStatus === 'aguardando_peca') {
        msg = `Olá! Seu veículo ${placa} está aguardando uma peça. Te aviso assim que chegar.`;
      }

      if (msg) {
        const enviar = confirm(`Enviar WhatsApp pro cliente?\n\n"${msg}"`);
        if (enviar) window.open(`https://wa.me/${fone}?text=${encodeURIComponent(msg)}`, '_blank');
      }
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
      col.querySelector('[style*="border-radius:12px"]').textContent = count;
    });

    document.getElementById('kanban-total').textContent = visivel + ' veiculos no patio';
  }
};

document.addEventListener('pageLoad', (e) => {
  if (e.detail.page === 'kanban') KANBAN.carregar();
});
