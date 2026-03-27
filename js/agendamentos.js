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

    this._dados = (data || []).filter(a => a.status !== 'cancelado');

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

    // Capacidade diaria da oficina
    const capacidade = APP.oficina?.capacidade_diaria || 5;

    // Conta tambem OS ativas (em andamento) por dia de entrada
    const { data: osAtivas } = await db
      .from('ordens_servico')
      .select('created_at')
      .eq('oficina_id', oficina_id)
      .not('status', 'in', '("entregue","cancelada")');

    // Mapa de OS por dia (pra somar com agendamentos)
    const osPorDia = {};
    (osAtivas || []).forEach(os => {
      const d = os.created_at?.split('T')[0];
      if (d) osPorDia[d] = (osPorDia[d] || 0) + 1;
    });

    // Gera calendario
    const calHtml = this._renderCalendario(porDia, hojStr, statusCor, capacidade);

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
            <div style="display:flex;justify-content:space-between;align-items:center;">
              <span style="font-size:12px;color:var(--text-muted);">${diaAgendamentos.length} agendamento${diaAgendamentos.length !== 1 ? 's' : ''}</span>
              <span style="font-size:13px;font-weight:700;color:${diaAgendamentos.filter(a => a.status !== 'cancelado' && a.status !== 'realizado').length >= capacidade ? 'var(--danger)' : diaAgendamentos.filter(a => a.status !== 'cancelado' && a.status !== 'realizado').length >= capacidade * 0.8 ? 'var(--warning)' : 'var(--success)'};">${diaAgendamentos.filter(a => a.status !== 'cancelado' && a.status !== 'realizado').length}/${capacidade} vagas</span>
            </div>
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
                ${a.status !== 'realizado' && a.status !== 'cancelado' ? `<button class="btn btn-danger btn-sm" onclick="AGENDAMENTOS.excluir('${a.id}')">X</button>` : ''}
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

  _renderCalendario(porDia, hojStr, statusCor, capacidade) {
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

      // Ocupacao
      const ativos = agendDia.filter(a => a.status !== 'cancelado' && a.status !== 'realizado').length;
      if (ativos > 0 || capacidade) {
        const pct = Math.min(ativos / capacidade, 1);
        const corOcup = pct >= 1 ? '#f85149' : pct >= 0.8 ? '#f0883e' : '#3fb950';
        html += `<div style="font-size:9px;font-weight:700;color:${corOcup};margin-top:2px;">${ativos}/${capacidade}</div>`;
      }

      // Mini eventos
      const maxShow = 2;
      agendDia.slice(0, maxShow).forEach(a => {
        const vencido = a.status === 'pendente' && dateStr < hojStr;
        const cor = vencido ? '#f85149' : statusCor[a.status];
        html += `<div style="font-size:8px;padding:1px 3px;border-radius:3px;margin-top:1px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;background:${cor}22;color:${cor};border-left:2px solid ${cor};${vencido ? 'font-weight:700;' : ''}">${esc(a.clientes?.nome?.split(' ')[0] || '?')}${vencido ? ' !' : ''}</div>`;
      });
      if (agendDia.length > maxShow) {
        html += `<div style="font-size:8px;color:var(--primary);font-weight:700;">+${agendDia.length - maxShow}</div>`;
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

    const clientePrefill = prefill.cliente_id ? this._clientes.find(c => c.id === prefill.cliente_id) : null;
    const veiculoPrefill = prefill.veiculo_id ? this._veiculos.find(v => v.id === prefill.veiculo_id) : null;

    openModal(`
      <div class="modal-header">
        <h3>${isEdit ? 'Editar Agendamento' : 'Novo Agendamento'}</h3>
        <button class="modal-close" onclick="closeModal()">&times;</button>
      </div>
      <div class="modal-body">
        <form onsubmit="AGENDAMENTOS.salvar(event, '${prefill.id || ''}')">
          <div class="form-group" style="position:relative;">
            <label>Cliente *</label>
            <input type="text" class="form-control" id="ag-cliente-busca" placeholder="Digite o nome do cliente..." autocomplete="off" value="${clientePrefill ? esc(clientePrefill.nome) : ''}" oninput="AGENDAMENTOS._buscarCliente(this.value)" onfocus="AGENDAMENTOS._buscarCliente(this.value)" ${isEdit ? 'disabled' : ''}>
            <input type="hidden" id="ag-cliente" value="${prefill.cliente_id || ''}">
            <div id="ag-cliente-lista" style="position:absolute;top:100%;left:0;right:0;z-index:100;background:var(--bg-card);border:1px solid var(--border);border-radius:0 0 var(--radius) var(--radius);max-height:200px;overflow-y:auto;display:none;box-shadow:0 4px 12px rgba(0,0,0,0.3);"></div>
          </div>
          <div class="form-group" style="position:relative;">
            <label>Veiculo *</label>
            <input type="text" class="form-control" id="ag-veiculo-busca" placeholder="Selecione o cliente primeiro" autocomplete="off" value="${veiculoPrefill ? esc(veiculoPrefill.placa + ' — ' + (veiculoPrefill.marca || '') + ' ' + (veiculoPrefill.modelo || '')) : ''}" oninput="AGENDAMENTOS._buscarVeiculo(this.value)" onfocus="AGENDAMENTOS._buscarVeiculo(this.value)" ${isEdit ? 'disabled' : ''}>
            <input type="hidden" id="ag-veiculo" value="${prefill.veiculo_id || ''}">
            <div id="ag-veiculo-lista" style="position:absolute;top:100%;left:0;right:0;z-index:100;background:var(--bg-card);border:1px solid var(--border);border-radius:0 0 var(--radius) var(--radius);max-height:200px;overflow-y:auto;display:none;box-shadow:0 4px 12px rgba(0,0,0,0.3);"></div>
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
              <input type="date" class="form-control" id="ag-data" required value="${dataPadrao}" onchange="AGENDAMENTOS._atualizarVagas()">
              <div id="ag-vagas" style="margin-top:6px;font-size:12px;color:var(--text-muted);"></div>
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
          <!-- Painel de vagas -->
          <div id="ag-painel-vagas" style="background:var(--bg-input);border-radius:var(--radius);padding:12px;margin-bottom:12px;">
            <div style="font-size:11px;font-weight:700;color:var(--text-secondary);margin-bottom:8px;">VAGAS POR DIA (clique pra selecionar)</div>
            <div id="ag-dias-vagas" style="display:flex;gap:6px;flex-wrap:wrap;"></div>
          </div>

          <div class="modal-footer" style="padding:16px 0 0;border:0;">
            <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancelar</button>
            <button type="submit" class="btn btn-primary">${isEdit ? 'Salvar' : 'Agendar'}</button>
          </div>
        </form>
      </div>
    `);

    // Carrega vagas
    this._carregarVagas(dataPadrao);

    // Fecha dropdown ao clicar fora
    document.addEventListener('click', function _closeDrop(e) {
      if (!e.target.closest('#ag-cliente-busca, #ag-cliente-lista')) {
        const l = document.getElementById('ag-cliente-lista');
        if (l) l.style.display = 'none';
      }
      if (!e.target.closest('#ag-veiculo-busca, #ag-veiculo-lista')) {
        const l = document.getElementById('ag-veiculo-lista');
        if (l) l.style.display = 'none';
      }
    });
  },

  _buscarCliente(termo) {
    const lista = document.getElementById('ag-cliente-lista');
    if (!lista) return;
    const t = termo.toLowerCase();
    const filtrados = t ? this._clientes.filter(c => c.nome.toLowerCase().includes(t)) : this._clientes;

    if (!filtrados.length && t.length >= 2) {
      lista.style.display = 'block';
      lista.innerHTML = `<div style="padding:12px 14px;cursor:pointer;font-size:13px;color:var(--primary);font-weight:600;" onmousedown="AGENDAMENTOS._cadastrarClienteRapido('${esc(termo.trim())}')">+ Cadastrar "${esc(termo.trim())}" como novo cliente</div>`;
      return;
    }
    if (!filtrados.length) { lista.style.display = 'none'; return; }

    lista.style.display = 'block';
    let html = filtrados.slice(0, 15).map(c =>
      `<div style="padding:10px 14px;cursor:pointer;font-size:13px;border-bottom:1px solid var(--border);" onmousedown="AGENDAMENTOS._selecionarCliente('${c.id}','${esc(c.nome)}')" onmouseover="this.style.background='var(--bg-input)'" onmouseout="this.style.background=''">${esc(c.nome)}</div>`
    ).join('');
    if (t.length >= 2) {
      html += `<div style="padding:10px 14px;cursor:pointer;font-size:12px;color:var(--primary);border-top:1px solid var(--border);" onmousedown="AGENDAMENTOS._cadastrarClienteRapido('${esc(termo.trim())}')">+ Cadastrar novo cliente</div>`;
    }
    lista.innerHTML = html;
  },

  async _carregarVagas(dataSelecionada) {
    const container = document.getElementById('ag-dias-vagas');
    if (!container) return;

    const capacidade = APP.oficina?.capacidade_diaria || 5;
    const oficina_id = APP.profile.oficina_id;

    // Busca agendamentos dos próximos 14 dias
    const hoje = new Date();
    const inicio = new Date(hoje);
    inicio.setDate(inicio.getDate());
    const fim = new Date(hoje);
    fim.setDate(fim.getDate() + 13);

    const { data: agends } = await db.from('agendamentos')
      .select('data_prevista')
      .eq('oficina_id', oficina_id)
      .gte('data_prevista', inicio.toISOString().split('T')[0])
      .lte('data_prevista', fim.toISOString().split('T')[0])
      .not('status', 'in', '("cancelado","realizado")');

    // Conta por dia
    const contagem = {};
    (agends || []).forEach(a => {
      contagem[a.data_prevista] = (contagem[a.data_prevista] || 0) + 1;
    });

    const diasSemana = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab'];
    let html = '';

    for (let i = 0; i < 14; i++) {
      const d = new Date(hoje);
      d.setDate(d.getDate() + i);
      const dataStr = d.toISOString().split('T')[0];
      const dow = d.getDay();

      // Pula domingos
      if (dow === 0) continue;

      const qtd = contagem[dataStr] || 0;
      const vagas = capacidade - qtd;
      const lotado = vagas <= 0;
      const selecionado = dataStr === dataSelecionada;

      const cor = lotado ? 'var(--danger)' : vagas <= 2 ? 'var(--warning)' : 'var(--success)';

      html += `<div onclick="${lotado ? '' : `document.getElementById('ag-data').value='${dataStr}';AGENDAMENTOS._marcarDiaSelecionado('${dataStr}')`}"
        style="text-align:center;padding:8px 6px;border-radius:var(--radius);min-width:58px;cursor:${lotado ? 'not-allowed' : 'pointer'};
        background:${selecionado ? 'var(--primary)' : 'var(--bg-card)'};
        border:1px solid ${selecionado ? 'var(--primary)' : 'var(--border)'};
        opacity:${lotado ? '0.5' : '1'};">
        <div style="font-size:10px;color:${selecionado ? '#fff' : 'var(--text-muted)'};font-weight:600;">${diasSemana[dow]}</div>
        <div style="font-size:14px;font-weight:700;color:${selecionado ? '#fff' : 'var(--text)'};">${d.getDate()}</div>
        <div style="font-size:10px;font-weight:700;color:${selecionado ? '#fff' : cor};">${lotado ? 'LOTADO' : vagas + '/' + capacidade}</div>
      </div>`;
    }

    container.innerHTML = html;

    // Atualiza indicador abaixo do campo data
    this._atualizarVagas();
  },

  _atualizarVagas() {
    const el = document.getElementById('ag-vagas');
    const dataInput = document.getElementById('ag-data');
    if (!el || !dataInput) return;
    const data = dataInput.value;
    if (!data) { el.textContent = ''; return; }

    const d = new Date(data + 'T12:00:00');
    const diasSemana = ['Domingo', 'Segunda', 'Terca', 'Quarta', 'Quinta', 'Sexta', 'Sabado'];
    el.textContent = diasSemana[d.getDay()] + ', ' + d.getDate() + '/' + String(d.getMonth() + 1).padStart(2, '0');
  },

  _marcarDiaSelecionado(dataStr) {
    this._carregarVagas(dataStr);
    this._atualizarVagas();
  },

  _cadastrarClienteRapido(nome) {
    document.getElementById('ag-cliente-lista').style.display = 'none';
    // Salva estado do agendamento pra restaurar depois
    this._agPrefill = {
      nome: nome,
      tipo: document.getElementById('ag-tipo')?.value || '',
      data: document.getElementById('ag-data')?.value || '',
      km: document.getElementById('ag-km')?.value || '',
      desc: document.getElementById('ag-desc')?.value || ''
    };
    // Abre modal de cadastro de cliente com nome preenchido
    CLIENTES.abrirModal({}, nome, () => {
      this._recarregarEReabrir();
    });
  },

  async _recarregarEReabrir() {
    const oficina_id = APP.profile.oficina_id;
    const { data } = await db.from('clientes').select('id, nome').eq('oficina_id', oficina_id).order('nome');
    this._clientes = data || [];
    const { data: veic } = await db.from('veiculos').select('id, placa, marca, modelo, cliente_id').eq('oficina_id', oficina_id).order('placa');
    this._veiculos = veic || [];

    const pf = this._agPrefill || {};
    // Busca o cliente recém cadastrado pelo nome
    const clienteNovo = pf.nome ? this._clientes.find(c => c.nome.toLowerCase() === pf.nome.toLowerCase()) : null;

    this.abrirModal({
      tipo: pf.tipo,
      data_prevista: pf.data,
      km_previsto: pf.km,
      descricao: pf.desc,
      cliente_id: clienteNovo?.id || ''
    });
  },

  _selecionarCliente(id, nome) {
    document.getElementById('ag-cliente').value = id;
    document.getElementById('ag-cliente-busca').value = nome;
    document.getElementById('ag-cliente-lista').style.display = 'none';
    // Limpa e habilita veiculo
    document.getElementById('ag-veiculo').value = '';
    document.getElementById('ag-veiculo-busca').value = '';
    document.getElementById('ag-veiculo-busca').placeholder = 'Digite placa ou modelo...';
    this._buscarVeiculo('');
  },

  _buscarVeiculo(termo) {
    const clienteId = document.getElementById('ag-cliente').value;
    if (!clienteId) return;
    const lista = document.getElementById('ag-veiculo-lista');
    if (!lista) return;
    const t = termo.toLowerCase();
    const veiculosCliente = this._veiculos.filter(v => v.cliente_id === clienteId);
    const filtrados = t ? veiculosCliente.filter(v => (v.placa + ' ' + (v.marca || '') + ' ' + (v.modelo || '')).toLowerCase().includes(t)) : veiculosCliente;
    if (!filtrados.length) { lista.style.display = 'none'; return; }
    lista.style.display = 'block';
    lista.innerHTML = filtrados.slice(0, 15).map(v => {
      const label = `${v.placa} — ${v.marca || ''} ${v.modelo || ''}`;
      return `<div style="padding:10px 14px;cursor:pointer;font-size:13px;border-bottom:1px solid var(--border);" onmousedown="AGENDAMENTOS._selecionarVeiculo('${v.id}','${esc(label)}')" onmouseover="this.style.background='var(--bg-input)'" onmouseout="this.style.background=''">${esc(label)}</div>`;
    }).join('');
  },

  _selecionarVeiculo(id, label) {
    document.getElementById('ag-veiculo').value = id;
    document.getElementById('ag-veiculo-busca').value = label;
    document.getElementById('ag-veiculo-lista').style.display = 'none';
  },

  _filtrarVeiculos() {
    // Mantido por compatibilidade
    const clienteId = document.getElementById('ag-cliente').value;
    if (clienteId) this._buscarVeiculo('');
  },

  async salvar(e, id) {
    e.preventDefault();
    const oficina_id = APP.profile.oficina_id;
    const dataSel = document.getElementById('ag-data').value;

    if (!id) {
      if (!document.getElementById('ag-cliente').value) { APP.toast('Selecione o cliente', 'error'); return; }
      if (!document.getElementById('ag-veiculo').value) { APP.toast('Selecione o veiculo', 'error'); return; }
    }

    // Verifica capacidade do dia (só pra novos ou se mudou a data)
    const capacidade = APP.oficina?.capacidade_diaria || 5;
    const { data: agendDia } = await db
      .from('agendamentos')
      .select('id')
      .eq('oficina_id', oficina_id)
      .eq('data_prevista', dataSel)
      .not('status', 'in', '("cancelado","realizado")');

    const qtdDia = (agendDia || []).filter(a => a.id !== id).length;
    if (qtdDia >= capacidade) {
      APP.toast(`Dia lotado! Ja tem ${qtdDia}/${capacidade} agendamentos. Escolha outra data.`, 'error');
      return;
    }

    const obj = {
      tipo: document.getElementById('ag-tipo').value,
      data_prevista: dataSel,
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

      if (!obj.cliente_id || !obj.veiculo_id) {
        APP.toast('Selecione cliente e veículo', 'error');
        return;
      }

      const res = await db.from('agendamentos').insert(obj).select();
      error = res.error;
      if (!error && (!res.data || !res.data.length)) {
        APP.toast('Agendamento não foi salvo. Verifique os dados.', 'error');
        return;
      }
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

  async excluir(id) {
    if (!confirm('Excluir este agendamento?')) return;
    try {
      const { error } = await db.from('agendamentos').update({ status: 'cancelado' }).eq('id', id);
      if (error) { APP.toast('Erro: ' + error.message, 'error'); return; }
      APP.toast('Excluído');
      await this.carregar();
    } catch(e) {
      console.error('Erro ao excluir agendamento:', e);
      APP.toast('Erro de conexão. Tente novamente.', 'error');
    }
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
