// RPM Pro — Agendamentos (Calendario estilo Elyda)
const AGENDAMENTOS = {
  _filtro: 'pendentes',
  _clientes: [],
  _veiculos: [],
  _mesAtual: new Date().getMonth(),
  _anoAtual: new Date().getFullYear(),
  _diaSelecionado: null,
  _dados: [],

  async carregar() {
    const container = document.getElementById('agendamentos-content');
    if (!container) return;
    const oficina_id = APP.profile.oficina_id;

    // Busca todos os agendamentos do mes visivel (+/- 1 mes pra dias do mes anterior/proximo)
    const inicio = new Date(this._anoAtual, this._mesAtual - 1, 1).toISOString().split('T')[0];
    const fim = new Date(this._anoAtual, this._mesAtual + 2, 0).toISOString().split('T')[0];

    const { data } = await db
      .from('agendamentos')
      .select('*, clientes(nome, whatsapp), veiculos(placa, marca, modelo)')
      .eq('oficina_id', oficina_id)
      .gte('data_prevista', inicio)
      .lte('data_prevista', fim)
      .order('data_prevista');

    this._dados = data || [];

    // Busca fila de espera agendada (pra mostrar no calendario tb)
    const { data: filaData } = await db
      .from('fila_espera')
      .select('*')
      .eq('oficina_id', oficina_id)
      .eq('status', 'aguardando')
      .order('created_at');

    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const hojStr = hoje.toISOString().split('T')[0];
    if (!this._diaSelecionado) this._diaSelecionado = hojStr;

    const tipoLabel = { revisao: 'Revisao', troca_oleo: 'Troca oleo', pneus: 'Pneus', filtros: 'Filtros', correia: 'Correia', freios: 'Freios', alinhamento: 'Alinhamento', bateria: 'Bateria', outro: 'Outro' };
    const statusCor = { pendente: '#f0883e', notificado: '#388bfd', confirmado: '#3fb950', realizado: '#8b949e', cancelado: '#f85149' };

    // Monta mapa de agendamentos por dia
    const porDia = {};
    this._dados.forEach(a => {
      const d = a.data_prevista;
      if (!porDia[d]) porDia[d] = [];
      porDia[d].push(a);
    });

    // Contadores
    const pendentes = this._dados.filter(a => a.status === 'pendente').length;
    const vencidos = this._dados.filter(a => a.status === 'pendente' && a.data_prevista < hojStr).length;
    const confirmados = this._dados.filter(a => a.status === 'confirmado').length;
    const filaCount = (filaData || []).length;

    // Gera calendario
    const calHtml = this._renderCalendario(porDia, hojStr, statusCor);

    // Gera lista do dia selecionado
    const diaAgendamentos = porDia[this._diaSelecionado] || [];
    const diaSel = new Date(this._diaSelecionado + 'T12:00:00');
    const diaLabel = diaSel.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });

    container.innerHTML = `
      <!-- KPIs -->
      <div class="kpi-grid" style="margin-bottom:20px;">
        <div class="kpi-card">
          <div class="label">Pendentes</div>
          <div class="value" style="color:var(--warning);">${pendentes}</div>
        </div>
        <div class="kpi-card">
          <div class="label">Confirmados</div>
          <div class="value success">${confirmados}</div>
        </div>
        <div class="kpi-card">
          <div class="label">Vencidos</div>
          <div class="value" style="color:var(--danger);">${vencidos}</div>
        </div>
        <div class="kpi-card">
          <div class="label">Na fila</div>
          <div class="value" style="color:var(--info);">${filaCount}</div>
        </div>
      </div>

      <!-- LAYOUT: Calendario + Painel do dia -->
      <div style="display:grid;grid-template-columns:1fr 380px;gap:20px;" id="agenda-desktop">
        <!-- CALENDARIO -->
        <div style="background:var(--bg-card);border:1px solid var(--border);border-radius:var(--radius-lg);padding:16px;">
          <!-- Nav mes -->
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;">
            <button class="btn btn-secondary btn-sm" onclick="AGENDAMENTOS._mesAnterior()">◀</button>
            <h3 style="font-size:16px;font-weight:700;text-transform:capitalize;">${new Date(this._anoAtual, this._mesAtual).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}</h3>
            <button class="btn btn-secondary btn-sm" onclick="AGENDAMENTOS._mesProximo()">▶</button>
          </div>
          <!-- Dias da semana -->
          <div style="display:grid;grid-template-columns:repeat(7,1fr);gap:2px;margin-bottom:4px;">
            ${['Dom','Seg','Ter','Qua','Qui','Sex','Sab'].map(d => `<div style="text-align:center;font-size:11px;font-weight:700;color:var(--text-muted);padding:4px;">${d}</div>`).join('')}
          </div>
          <!-- Grid -->
          ${calHtml}
        </div>

        <!-- PAINEL DO DIA -->
        <div style="display:flex;flex-direction:column;gap:12px;">
          <div style="background:var(--bg-card);border:1px solid var(--border);border-radius:var(--radius-lg);padding:16px;">
            <h3 style="font-size:14px;font-weight:700;margin-bottom:4px;text-transform:capitalize;">${diaLabel}</h3>
            <span style="font-size:12px;color:var(--text-muted);">${diaAgendamentos.length} agendamento${diaAgendamentos.length !== 1 ? 's' : ''}</span>
          </div>

          ${diaAgendamentos.length ? diaAgendamentos.map(a => {
            const vencido = a.status === 'pendente' && a.data_prevista < hojStr;
            return `
            <div style="background:var(--bg-card);border:1px solid ${vencido ? 'var(--danger)' : 'var(--border)'};border-left:4px solid ${statusCor[a.status] || 'var(--border)'};border-radius:var(--radius);padding:14px;">
              <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
                <strong style="font-size:14px;">${esc(a.clientes?.nome || '-')}</strong>
                <span style="font-size:11px;font-weight:700;color:${statusCor[a.status]};">${a.status}${vencido ? ' (vencido)' : ''}</span>
              </div>
              <div style="font-size:13px;color:var(--text-secondary);margin-bottom:4px;">
                ${esc(a.veiculos?.placa || '')} ${esc(a.veiculos?.marca || '')} ${esc(a.veiculos?.modelo || '')}
              </div>
              <div style="font-size:13px;color:var(--primary);margin-bottom:8px;">${esc(tipoLabel[a.tipo] || a.tipo)}</div>
              ${a.descricao ? `<div style="font-size:12px;color:var(--text-muted);margin-bottom:8px;">${esc(a.descricao)}</div>` : ''}
              <div style="display:flex;gap:6px;flex-wrap:wrap;">
                ${a.clientes?.whatsapp && a.status !== 'realizado' ? `<button class="btn btn-success btn-sm" onclick="AGENDAMENTOS.notificar('${a.id}','${esc(a.clientes.whatsapp)}','${esc(a.clientes.nome)}','${esc(tipoLabel[a.tipo] || a.tipo)}','${a.data_prevista}')">WhatsApp</button>` : ''}
                ${a.status === 'pendente' || a.status === 'notificado' ? `<button class="btn btn-primary btn-sm" onclick="AGENDAMENTOS.mudarStatus('${a.id}','confirmado')">Confirmar</button>` : ''}
                ${a.status === 'confirmado' ? `<button class="btn btn-primary btn-sm" onclick="AGENDAMENTOS.mudarStatus('${a.id}','realizado')">Realizado</button>` : ''}
                ${a.status !== 'realizado' && a.status !== 'cancelado' ? `<button class="btn btn-secondary btn-sm" onclick="AGENDAMENTOS.editar('${a.id}')">Editar</button>` : ''}
                ${a.status !== 'realizado' && a.status !== 'cancelado' ? `<button class="btn btn-danger btn-sm" onclick="AGENDAMENTOS.mudarStatus('${a.id}','cancelado')">X</button>` : ''}
              </div>
            </div>`;
          }).join('') : `
          <div style="background:var(--bg-card);border:1px solid var(--border);border-radius:var(--radius);padding:30px;text-align:center;">
            <div style="font-size:28px;margin-bottom:8px;">📅</div>
            <div style="font-size:13px;color:var(--text-muted);">Nenhum agendamento neste dia</div>
            <button class="btn btn-primary btn-sm" style="margin-top:12px;" onclick="AGENDAMENTOS.abrirModal({data_prevista:'${this._diaSelecionado}'})">+ Agendar pra este dia</button>
          </div>`}
        </div>
      </div>

      <!-- MOBILE: lista simples -->
      <div id="agenda-mobile" style="display:none;">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;">
          <button class="btn btn-secondary btn-sm" onclick="AGENDAMENTOS._diaMobile(-1)">◀</button>
          <div style="text-align:center;">
            <div style="font-weight:700;text-transform:capitalize;">${diaLabel}</div>
            <div style="font-size:12px;color:var(--text-muted);">${diaAgendamentos.length} agendamento${diaAgendamentos.length !== 1 ? 's' : ''}</div>
          </div>
          <button class="btn btn-secondary btn-sm" onclick="AGENDAMENTOS._diaMobile(1)">▶</button>
        </div>
        ${diaAgendamentos.length ? diaAgendamentos.map(a => {
          const vencido = a.status === 'pendente' && a.data_prevista < hojStr;
          return `
          <div style="background:var(--bg-card);border:1px solid ${vencido ? 'var(--danger)' : 'var(--border)'};border-left:4px solid ${statusCor[a.status] || 'var(--border)'};border-radius:var(--radius);padding:14px;margin-bottom:10px;">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
              <strong>${esc(a.clientes?.nome || '-')}</strong>
              <span style="font-size:11px;font-weight:700;color:${statusCor[a.status]};">${a.status}</span>
            </div>
            <div style="font-size:13px;color:var(--text-secondary);">${esc(a.veiculos?.placa || '')} — ${esc(tipoLabel[a.tipo] || a.tipo)}</div>
            <div style="display:flex;gap:6px;margin-top:8px;flex-wrap:wrap;">
              ${a.clientes?.whatsapp && a.status !== 'realizado' ? `<button class="btn btn-success btn-sm" onclick="AGENDAMENTOS.notificar('${a.id}','${esc(a.clientes.whatsapp)}','${esc(a.clientes.nome)}','${esc(tipoLabel[a.tipo] || a.tipo)}','${a.data_prevista}')">WhatsApp</button>` : ''}
              ${a.status === 'pendente' || a.status === 'notificado' ? `<button class="btn btn-primary btn-sm" onclick="AGENDAMENTOS.mudarStatus('${a.id}','confirmado')">Confirmar</button>` : ''}
              ${a.status === 'confirmado' ? `<button class="btn btn-primary btn-sm" onclick="AGENDAMENTOS.mudarStatus('${a.id}','realizado')">Realizado</button>` : ''}
            </div>
          </div>`;
        }).join('') : `
        <div style="text-align:center;padding:30px;color:var(--text-muted);">Nenhum agendamento neste dia</div>`}
      </div>
    `;

    // Responsive: mostra calendario ou lista mobile
    this._checkResponsive();
  },

  _renderCalendario(porDia, hojStr, statusCor) {
    const primeiroDia = new Date(this._anoAtual, this._mesAtual, 1);
    const ultimoDia = new Date(this._anoAtual, this._mesAtual + 1, 0);
    const startDay = primeiroDia.getDay(); // 0=dom
    const totalDias = ultimoDia.getDate();

    let html = '<div style="display:grid;grid-template-columns:repeat(7,1fr);gap:2px;">';

    // Dias do mes anterior (espaços vazios)
    for (let i = 0; i < startDay; i++) {
      html += '<div style="min-height:70px;"></div>';
    }

    // Dias do mes
    for (let d = 1; d <= totalDias; d++) {
      const dateStr = `${this._anoAtual}-${String(this._mesAtual + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const agendDia = porDia[dateStr] || [];
      const isHoje = dateStr === hojStr;
      const isSel = dateStr === this._diaSelecionado;

      let bgStyle = '';
      let borderStyle = '2px solid transparent';
      if (isSel) { bgStyle = 'background:rgba(255,69,0,0.1);'; borderStyle = '2px solid var(--primary)'; }
      else if (isHoje) { bgStyle = 'background:rgba(63,185,80,0.08);'; borderStyle = '2px solid var(--success)'; }

      html += `<div onclick="AGENDAMENTOS._selecionarDia('${dateStr}')" style="min-height:70px;border-radius:8px;padding:4px 6px;cursor:pointer;border:${borderStyle};${bgStyle}transition:all 0.15s;">`;

      // Numero do dia
      if (isHoje) {
        html += `<div style="background:var(--success);color:#fff;width:22px;height:22px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;">${d}</div>`;
      } else {
        html += `<div style="font-size:11px;font-weight:600;color:var(--text-secondary);margin-bottom:2px;">${d}</div>`;
      }

      // Mini eventos
      const maxShow = 3;
      agendDia.slice(0, maxShow).forEach(a => {
        html += `<div style="font-size:9px;padding:1px 4px;border-radius:3px;margin-top:1px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;background:${statusCor[a.status]}22;color:${statusCor[a.status]};border-left:2px solid ${statusCor[a.status]};">${esc(a.clientes?.nome?.split(' ')[0] || '?')}</div>`;
      });
      if (agendDia.length > maxShow) {
        html += `<div style="font-size:9px;color:var(--primary);font-weight:700;">+${agendDia.length - maxShow}</div>`;
      }

      html += '</div>';
    }

    html += '</div>';
    return html;
  },

  _selecionarDia(dateStr) {
    this._diaSelecionado = dateStr;
    this.carregar();
  },

  _mesAnterior() {
    this._mesAtual--;
    if (this._mesAtual < 0) { this._mesAtual = 11; this._anoAtual--; }
    this._diaSelecionado = null;
    this.carregar();
  },

  _mesProximo() {
    this._mesAtual++;
    if (this._mesAtual > 11) { this._mesAtual = 0; this._anoAtual++; }
    this._diaSelecionado = null;
    this.carregar();
  },

  _diaMobile(delta) {
    const d = new Date(this._diaSelecionado + 'T12:00:00');
    d.setDate(d.getDate() + delta);
    this._diaSelecionado = d.toISOString().split('T')[0];
    this._mesAtual = d.getMonth();
    this._anoAtual = d.getFullYear();
    this.carregar();
  },

  _checkResponsive() {
    const desktop = document.getElementById('agenda-desktop');
    const mobile = document.getElementById('agenda-mobile');
    if (!desktop || !mobile) return;
    if (window.innerWidth <= 768) {
      desktop.style.display = 'none';
      mobile.style.display = 'block';
    } else {
      desktop.style.display = 'grid';
      mobile.style.display = 'none';
    }
  },

  async abrirModal(prefill = {}) {
    const oficina_id = APP.profile.oficina_id;

    const [cliRes, veiRes] = await Promise.all([
      db.from('clientes').select('id, nome').eq('oficina_id', oficina_id).order('nome'),
      db.from('veiculos').select('id, placa, marca, modelo, cliente_id').eq('oficina_id', oficina_id).order('placa')
    ]);
    this._clientes = cliRes.data || [];
    this._veiculos = veiRes.data || [];

    const tipos = [
      ['revisao', 'Revisao geral'], ['troca_oleo', 'Troca de oleo'], ['pneus', 'Pneus'],
      ['filtros', 'Filtros'], ['correia', 'Correia dentada'], ['freios', 'Freios'],
      ['alinhamento', 'Alinhamento/Balanceamento'], ['bateria', 'Bateria'], ['outro', 'Outro']
    ];

    const dataPadrao = prefill.data_prevista || (() => { const d = new Date(); d.setDate(d.getDate() + 7); return d.toISOString().split('T')[0]; })();
    const isEdit = !!prefill.id;

    openModal(`
      <div class="modal-header">
        <h3>${isEdit ? 'Editar Agendamento' : 'Novo Agendamento'}</h3>
        <button class="modal-close" onclick="closeModal()">&times;</button>
      </div>
      <div class="modal-body">
        <form onsubmit="AGENDAMENTOS.salvar(event, '${prefill.id || ''}')">
          <div class="form-group">
            <label>Cliente *</label>
            <select class="form-control" id="ag-cliente" required onchange="AGENDAMENTOS._filtrarVeiculos()" ${isEdit ? 'disabled' : ''}>
              <option value="">Selecione...</option>
              ${this._clientes.map(c => `<option value="${c.id}" ${c.id === prefill.cliente_id ? 'selected' : ''}>${esc(c.nome)}</option>`).join('')}
            </select>
          </div>
          <div class="form-group">
            <label>Veiculo *</label>
            <select class="form-control" id="ag-veiculo" required ${isEdit ? 'disabled' : ''}>
              <option value="">Selecione o cliente primeiro</option>
            </select>
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
            <div class="form-group">
              <label>Tipo *</label>
              <select class="form-control" id="ag-tipo" required>
                ${tipos.map(([v, l]) => `<option value="${v}" ${prefill.tipo === v ? 'selected' : ''}>${l}</option>`).join('')}
              </select>
            </div>
            <div class="form-group">
              <label>Data *</label>
              <input type="date" class="form-control" id="ag-data" required value="${dataPadrao}">
            </div>
          </div>
          <div class="form-group">
            <label>KM previsto</label>
            <input type="number" class="form-control" id="ag-km" placeholder="Ex: 60000" value="${prefill.km_previsto || ''}">
          </div>
          <div class="form-group">
            <label>Observacoes</label>
            <textarea class="form-control" id="ag-desc" placeholder="Detalhes...">${esc(prefill.descricao || '')}</textarea>
          </div>
          <div class="modal-footer" style="padding:16px 0 0;border:0;">
            <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancelar</button>
            <button type="submit" class="btn btn-primary">${isEdit ? 'Salvar' : 'Agendar'}</button>
          </div>
        </form>
      </div>
    `);

    if (prefill.cliente_id) {
      this._filtrarVeiculos();
      if (prefill.veiculo_id) {
        setTimeout(() => {
          const sel = document.getElementById('ag-veiculo');
          if (sel) sel.value = prefill.veiculo_id;
        }, 50);
      }
    }
  },

  _filtrarVeiculos() {
    const clienteId = document.getElementById('ag-cliente').value;
    const sel = document.getElementById('ag-veiculo');
    const veiculos = this._veiculos.filter(v => v.cliente_id === clienteId);
    sel.innerHTML = veiculos.length
      ? veiculos.map(v => `<option value="${v.id}">${esc(v.placa)} — ${esc(v.marca || '')} ${esc(v.modelo || '')}</option>`).join('')
      : '<option value="">Nenhum veiculo deste cliente</option>';
  },

  async salvar(e, id) {
    e.preventDefault();
    const oficina_id = APP.profile.oficina_id;
    const obj = {
      tipo: document.getElementById('ag-tipo').value,
      data_prevista: document.getElementById('ag-data').value,
      km_previsto: document.getElementById('ag-km').value ? parseInt(document.getElementById('ag-km').value) : null,
      descricao: document.getElementById('ag-desc').value.trim()
    };

    let error;
    if (id) {
      ({ error } = await db.from('agendamentos').update(obj).eq('id', id).eq('oficina_id', oficina_id));
    } else {
      obj.oficina_id = oficina_id;
      obj.cliente_id = document.getElementById('ag-cliente').value;
      obj.veiculo_id = document.getElementById('ag-veiculo').value;
      obj.created_by = APP.profile.id;
      ({ error } = await db.from('agendamentos').insert(obj));
    }

    if (error) { APP.toast('Erro: ' + error.message, 'error'); return; }
    closeModal();
    APP.toast(id ? 'Agendamento atualizado' : 'Agendamento criado');
    this.carregar();
  },

  async editar(id) {
    const { data } = await db.from('agendamentos').select('*').eq('id', id).single();
    if (data) this.abrirModal(data);
  },

  async mudarStatus(id, novoStatus) {
    const update = { status: novoStatus };
    if (novoStatus === 'notificado') update.notificado_em = new Date().toISOString();

    const { error } = await db.from('agendamentos').update(update).eq('id', id).eq('oficina_id', APP.profile.oficina_id);
    if (error) { APP.toast('Erro: ' + error.message, 'error'); return; }
    APP.toast('Status atualizado');
    this.carregar();
  },

  notificar(id, fone, nome, tipo, data) {
    const num = fone.replace(/\D/g, '');
    const numFull = num.length <= 11 ? '55' + num : num;
    const dataFmt = APP.formatDate(data);
    const msg = `Oi ${nome}! Aqui e da ${APP.oficina?.nome || ''}. Voce tem uma ${tipo.toLowerCase()} agendada pra ${dataFmt}. Confirma o horario? Estamos te esperando!`;
    window.open(`https://wa.me/${numFull}?text=${encodeURIComponent(msg)}`, '_blank');
    this.mudarStatus(id, 'notificado');
  }
};

// Responsive listener
window.addEventListener('resize', () => {
  if (typeof AGENDAMENTOS._checkResponsive === 'function') AGENDAMENTOS._checkResponsive();
});

document.addEventListener('pageLoad', (e) => {
  if (e.detail.page === 'agendamentos') AGENDAMENTOS.carregar();
});
