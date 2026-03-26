// RPM Pro — Agendamentos de Manutenção Preventiva
const AGENDAMENTOS = {
  _filtro: 'pendentes',
  _clientes: [],
  _veiculos: [],

  async carregar() {
    const container = document.getElementById('agendamentos-content');
    if (!container) return;
    const oficina_id = APP.profile.oficina_id;

    const hoje = new Date().toISOString().split('T')[0];

    let query = db
      .from('agendamentos')
      .select('*, clientes(nome, whatsapp), veiculos(placa, marca, modelo)')
      .eq('oficina_id', oficina_id)
      .order('data_prevista');

    if (this._filtro === 'pendentes') {
      query = query.in('status', ['pendente', 'notificado', 'confirmado']);
    } else if (this._filtro === 'realizados') {
      query = query.eq('status', 'realizado');
    } else if (this._filtro === 'vencidos') {
      query = query.in('status', ['pendente', 'notificado']).lt('data_prevista', hoje);
    }

    const { data } = await query;
    const lista = data || [];

    // Conta vencidos
    const vencidos = lista.filter(a => a.status === 'pendente' && a.data_prevista < hoje).length;
    const proximos7d = lista.filter(a => {
      if (a.status !== 'pendente' && a.status !== 'notificado') return false;
      const diff = Math.floor((new Date(a.data_prevista) - new Date()) / 86400000);
      return diff >= 0 && diff <= 7;
    }).length;

    const tipoLabel = { revisao: 'Revisao', troca_oleo: 'Troca de oleo', pneus: 'Pneus', filtros: 'Filtros', correia: 'Correia dentada', freios: 'Freios', alinhamento: 'Alinhamento/Balanceamento', bateria: 'Bateria', outro: 'Outro' };

    const statusBadge = { pendente: 'orcamento', notificado: 'aprovada', confirmado: 'pronto', realizado: 'entregue', cancelado: 'cancelada' };

    container.innerHTML = `
      <!-- KPIs -->
      <div class="kpi-grid" style="margin-bottom:20px;">
        <div class="kpi-card">
          <div class="label">Agendados</div>
          <div class="value primary">${lista.length}</div>
        </div>
        <div class="kpi-card">
          <div class="label">Proximos 7 dias</div>
          <div class="value" style="color:var(--info);">${proximos7d}</div>
        </div>
        <div class="kpi-card">
          <div class="label">Vencidos</div>
          <div class="value" style="color:var(--danger);">${vencidos}</div>
        </div>
      </div>

      <!-- Filtros -->
      <div style="display:flex;gap:8px;margin-bottom:16px;flex-wrap:wrap;">
        ${['pendentes','vencidos','realizados','todos'].map(f => `
          <button class="btn ${this._filtro === f ? 'btn-primary' : 'btn-secondary'} btn-sm" onclick="AGENDAMENTOS._filtro='${f}'; AGENDAMENTOS.carregar();">${f.charAt(0).toUpperCase() + f.slice(1)}</button>
        `).join('')}
      </div>

      ${lista.length ? `
      <table class="data-table">
        <thead>
          <tr><th>Data</th><th>Tipo</th><th>Veiculo</th><th>Cliente</th><th>Status</th><th></th></tr>
        </thead>
        <tbody>
          ${lista.map(a => {
            const vencido = (a.status === 'pendente' || a.status === 'notificado') && a.data_prevista < hoje;
            return `
            <tr style="${vencido ? 'background:var(--danger-bg);' : ''}">
              <td><strong>${APP.formatDate(a.data_prevista)}</strong>${vencido ? ' <span style="color:var(--danger);font-size:11px;">VENCIDO</span>' : ''}</td>
              <td>${esc(tipoLabel[a.tipo] || a.tipo)}</td>
              <td>${esc(a.veiculos?.placa || '-')} <span style="font-size:12px;color:var(--text-secondary);">${esc(a.veiculos?.marca || '')} ${esc(a.veiculos?.modelo || '')}</span></td>
              <td>${esc(a.clientes?.nome || '-')}</td>
              <td><span class="badge badge-${statusBadge[a.status] || 'entregue'}">${a.status}</span></td>
              <td style="display:flex;gap:4px;flex-wrap:nowrap;">
                ${a.clientes?.whatsapp && a.status !== 'realizado' ? `<button class="btn btn-success btn-sm" onclick="AGENDAMENTOS.notificar('${a.id}','${esc(a.clientes.whatsapp)}','${esc(a.clientes.nome)}','${esc(tipoLabel[a.tipo] || a.tipo)}','${a.data_prevista}')">WhatsApp</button>` : ''}
                ${a.status === 'pendente' || a.status === 'notificado' ? `<button class="btn btn-primary btn-sm" onclick="AGENDAMENTOS.mudarStatus('${a.id}','confirmado')">Confirmar</button>` : ''}
                ${a.status === 'confirmado' ? `<button class="btn btn-primary btn-sm" onclick="AGENDAMENTOS.mudarStatus('${a.id}','realizado')">Realizado</button>` : ''}
                ${a.status !== 'realizado' && a.status !== 'cancelado' ? `<button class="btn btn-secondary btn-sm" onclick="AGENDAMENTOS.editar('${a.id}')">Editar</button>` : ''}
                ${a.status !== 'realizado' && a.status !== 'cancelado' ? `<button class="btn btn-danger btn-sm" onclick="AGENDAMENTOS.mudarStatus('${a.id}','cancelado')">X</button>` : ''}
              </td>
            </tr>`;
          }).join('')}
        </tbody>
      </table>` : `
      <div class="empty-state">
        <div class="icon">📅</div>
        <h3>Nenhum agendamento</h3>
        <p>Clique em "+ Novo Agendamento" para agendar uma manutencao preventiva</p>
      </div>`}
    `;
  },

  async abrirModal(prefill = {}) {
    const oficina_id = APP.profile.oficina_id;

    // Carrega clientes e veículos
    const [cliRes, veiRes] = await Promise.all([
      db.from('clientes').select('id, nome').eq('oficina_id', oficina_id).order('nome'),
      db.from('veiculos').select('id, placa, marca, modelo, cliente_id').eq('oficina_id', oficina_id).order('placa')
    ]);
    this._clientes = cliRes.data || [];
    this._veiculos = veiRes.data || [];

    const tipos = [
      ['revisao', 'Revisao geral'],
      ['troca_oleo', 'Troca de oleo'],
      ['pneus', 'Pneus'],
      ['filtros', 'Filtros'],
      ['correia', 'Correia dentada'],
      ['freios', 'Freios'],
      ['alinhamento', 'Alinhamento/Balanceamento'],
      ['bateria', 'Bateria'],
      ['outro', 'Outro']
    ];

    // Data padrão: daqui 30 dias
    const d30 = new Date(); d30.setDate(d30.getDate() + 30);
    const dataPadrao = d30.toISOString().split('T')[0];

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
              ${this._clientes.map(c => `<option value="${c.id}" ${c.id === (prefill.cliente_id) ? 'selected' : ''}>${esc(c.nome)}</option>`).join('')}
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
              <label>Tipo de servico *</label>
              <select class="form-control" id="ag-tipo" required>
                ${tipos.map(([v, l]) => `<option value="${v}" ${prefill.tipo === v ? 'selected' : ''}>${l}</option>`).join('')}
              </select>
            </div>
            <div class="form-group">
              <label>Data prevista *</label>
              <input type="date" class="form-control" id="ag-data" required value="${prefill.data_prevista || dataPadrao}">
            </div>
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
            <div class="form-group">
              <label>KM previsto</label>
              <input type="number" class="form-control" id="ag-km" placeholder="Ex: 60000" value="${prefill.km_previsto || ''}">
            </div>
          </div>
          <div class="form-group">
            <label>Observacoes</label>
            <textarea class="form-control" id="ag-desc" placeholder="Detalhes do servico previsto...">${esc(prefill.descricao || '')}</textarea>
          </div>
          <div class="modal-footer" style="padding:16px 0 0;border:0;">
            <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancelar</button>
            <button type="submit" class="btn btn-primary">${isEdit ? 'Salvar' : 'Agendar'}</button>
          </div>
        </form>
      </div>
    `);

    // Filtra veículos do cliente selecionado
    if (prefill.cliente_id) {
      this._filtrarVeiculos();
      // Se editando, seleciona o veículo correto
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
    if (novoStatus === 'realizado') update.pago_em = new Date().toISOString();

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

    // Marca como notificado
    this.mudarStatus(id, 'notificado');
  }
};

document.addEventListener('pageLoad', (e) => {
  if (e.detail.page === 'agendamentos') AGENDAMENTOS.carregar();
});
