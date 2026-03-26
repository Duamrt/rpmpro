// RPM Pro — Fila de Espera
const FILA = {
  _filtro: 'aguardando',

  async carregar() {
    const container = document.getElementById('fila-content');
    if (!container) return;
    const oficina_id = APP.profile.oficina_id;

    let query = db.from('fila_espera').select('*').eq('oficina_id', oficina_id).order('created_at', { ascending: false });

    if (this._filtro !== 'todos') query = query.eq('status', this._filtro);

    const { data } = await query;
    const lista = data || [];

    // Contadores
    const aguardando = lista.filter(f => f.status === 'aguardando').length;
    const urgentes = lista.filter(f => f.urgencia === 'urgente' && f.status === 'aguardando').length;

    const urgenciaCor = { baixa: 'var(--text-muted)', normal: 'var(--info)', urgente: 'var(--danger)' };
    const urgenciaLabel = { baixa: 'Pode esperar', normal: 'Normal', urgente: 'Urgente' };
    const statusBadge = { aguardando: 'orcamento', contatado: 'aprovada', agendado: 'pronto', cancelado: 'cancelada' };

    container.innerHTML = `
      <!-- KPIs -->
      <div class="kpi-grid" style="margin-bottom:20px;">
        <div class="kpi-card">
          <div class="label">Na fila</div>
          <div class="value primary">${this._filtro === 'todos' ? lista.length : aguardando}</div>
        </div>
        <div class="kpi-card">
          <div class="label">Urgentes</div>
          <div class="value" style="color:var(--danger);">${urgentes}</div>
        </div>
      </div>

      <!-- Filtros -->
      <div style="display:flex;gap:8px;margin-bottom:16px;flex-wrap:wrap;">
        ${['aguardando','contatado','agendado','todos'].map(f => `
          <button class="btn ${this._filtro === f ? 'btn-primary' : 'btn-secondary'} btn-sm" onclick="FILA._filtro='${f}'; FILA.carregar();">${f.charAt(0).toUpperCase() + f.slice(1)}</button>
        `).join('')}
      </div>

      ${lista.length ? `
      <div style="display:flex;flex-direction:column;gap:12px;">
        ${lista.map(f => `
          <div style="background:var(--bg-card);border:1px solid ${f.urgencia === 'urgente' && f.status === 'aguardando' ? 'var(--danger)' : 'var(--border)'};border-radius:var(--radius-lg);padding:16px;${f.urgencia === 'urgente' && f.status === 'aguardando' ? 'border-left:4px solid var(--danger);' : ''}">
            <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:8px;">
              <div>
                <strong style="font-size:15px;">${esc(f.nome)}</strong>
                ${f.placa ? `<span style="margin-left:8px;font-size:13px;color:var(--primary);font-weight:700;">${esc(f.placa)}</span>` : ''}
                ${f.veiculo_info ? `<span style="margin-left:4px;font-size:12px;color:var(--text-secondary);">${esc(f.veiculo_info)}</span>` : ''}
              </div>
              <div style="display:flex;gap:6px;align-items:center;">
                <span style="font-size:11px;font-weight:700;color:${urgenciaCor[f.urgencia]};">${esc(urgenciaLabel[f.urgencia])}</span>
                <span class="badge badge-${statusBadge[f.status] || 'orcamento'}">${esc(f.status)}</span>
              </div>
            </div>
            <div style="background:var(--bg-input);padding:10px 12px;border-radius:var(--radius);margin-bottom:10px;font-size:14px;line-height:1.5;">
              "${esc(f.sintoma)}"
            </div>
            <div style="display:flex;justify-content:space-between;align-items:center;">
              <div style="font-size:12px;color:var(--text-muted);">
                ${APP.formatDateTime(f.created_at)}
                ${f.whatsapp ? ` · ${esc(f.whatsapp)}` : ''}
              </div>
              <div style="display:flex;gap:6px;">
                ${f.whatsapp && f.status === 'aguardando' ? `<button class="btn btn-success btn-sm" onclick="FILA.contatar('${f.id}','${esc(f.whatsapp)}','${esc(f.nome)}')">WhatsApp</button>` : ''}
                ${f.status === 'aguardando' || f.status === 'contatado' ? `<button class="btn btn-primary btn-sm" onclick="FILA.agendar('${f.id}','${esc(f.nome)}','${esc(f.placa || '')}','${esc(f.sintoma)}')">Agendar</button>` : ''}
                ${f.status === 'aguardando' ? `<button class="btn btn-secondary btn-sm" onclick="FILA.mudarStatus('${f.id}','contatado')">Contatado</button>` : ''}
                ${f.status !== 'cancelado' && f.status !== 'agendado' ? `<button class="btn btn-danger btn-sm" onclick="FILA.mudarStatus('${f.id}','cancelado')">X</button>` : ''}
              </div>
            </div>
            ${f.observacoes ? `<div style="font-size:12px;color:var(--text-secondary);margin-top:8px;padding-top:8px;border-top:1px solid var(--border);">${esc(f.observacoes)}</div>` : ''}
          </div>
        `).join('')}
      </div>` : `
      <div class="empty-state">
        <div class="icon">📞</div>
        <h3>Fila vazia</h3>
        <p>Quando um cliente ligar ou mandar WhatsApp, registre aqui pra nao perder</p>
      </div>`}
    `;
  },

  abrirModal() {
    openModal(`
      <div class="modal-header">
        <h3>Novo na fila</h3>
        <button class="modal-close" onclick="closeModal()">&times;</button>
      </div>
      <div class="modal-body">
        <form onsubmit="FILA.salvar(event)">
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
            <div class="form-group">
              <label>Nome do cliente *</label>
              <input type="text" class="form-control" id="fila-nome" required placeholder="Como ele se identificou">
            </div>
            <div class="form-group">
              <label>WhatsApp</label>
              <input type="text" class="form-control" id="fila-whatsapp" placeholder="(00) 00000-0000">
            </div>
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
            <div class="form-group">
              <label>Placa</label>
              <input type="text" class="form-control" id="fila-placa" placeholder="Se souber" style="text-transform:uppercase" maxlength="8">
            </div>
            <div class="form-group">
              <label>Veiculo</label>
              <input type="text" class="form-control" id="fila-veiculo" placeholder="Ex: Gol prata, HB20 branco">
            </div>
          </div>
          <div class="form-group">
            <label>O que o cliente disse? *</label>
            <textarea class="form-control" id="fila-sintoma" required rows="3" placeholder="Resuma o que ele falou. Ex: barulho na roda dianteira quando freia, ar nao gela, luz do painel acesa..."></textarea>
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
            <div class="form-group">
              <label>Urgencia</label>
              <select class="form-control" id="fila-urgencia">
                <option value="normal">Normal</option>
                <option value="urgente">Urgente</option>
                <option value="baixa">Pode esperar</option>
              </select>
            </div>
          </div>
          <div class="form-group">
            <label>Observacoes internas</label>
            <textarea class="form-control" id="fila-obs" rows="2" placeholder="Anotacoes pra equipe (cliente nao ve)"></textarea>
          </div>
          <div class="modal-footer" style="padding:16px 0 0;border:0;">
            <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancelar</button>
            <button type="submit" class="btn btn-primary">Adicionar na fila</button>
          </div>
        </form>
      </div>
    `);
  },

  async salvar(e) {
    e.preventDefault();
    const { error } = await db.from('fila_espera').insert({
      oficina_id: APP.profile.oficina_id,
      nome: document.getElementById('fila-nome').value.trim(),
      whatsapp: document.getElementById('fila-whatsapp').value.trim() || null,
      placa: document.getElementById('fila-placa').value.trim().toUpperCase() || null,
      veiculo_info: document.getElementById('fila-veiculo').value.trim() || null,
      sintoma: document.getElementById('fila-sintoma').value.trim(),
      urgencia: document.getElementById('fila-urgencia').value,
      observacoes: document.getElementById('fila-obs').value.trim() || null,
      created_by: APP.profile.id
    });

    if (error) { APP.toast('Erro: ' + error.message, 'error'); return; }
    closeModal();
    APP.toast('Adicionado na fila');
    this.carregar();
  },

  contatar(id, fone, nome) {
    const num = fone.replace(/\D/g, '');
    const numFull = num.length <= 11 ? '55' + num : num;
    const msg = `Oi ${nome}! Aqui e da ${APP.oficina?.nome || ''}. Recebemos seu contato e vamos verificar a disponibilidade. Ja te retorno com a data!`;
    window.open(`https://wa.me/${numFull}?text=${encodeURIComponent(msg)}`, '_blank');
    this.mudarStatus(id, 'contatado');
  },

  async agendar(filaId, nome, placa, sintoma) {
    // Busca cliente pela placa ou nome
    let clienteId = null;
    let veiculoId = null;
    const oficina_id = APP.profile.oficina_id;

    if (placa) {
      const { data: vei } = await db.from('veiculos').select('id, cliente_id').eq('oficina_id', oficina_id).eq('placa', placa).maybeSingle();
      if (vei) { veiculoId = vei.id; clienteId = vei.cliente_id; }
    }

    if (!clienteId) {
      const { data: cli } = await db.from('clientes').select('id').eq('oficina_id', oficina_id).ilike('nome', nome).maybeSingle();
      if (cli) clienteId = cli.id;
    }

    if (!clienteId || !veiculoId) {
      APP.toast('Cliente ou veiculo nao encontrado. Cadastre primeiro e depois agende.', 'warning');
      APP.loadPage('agendamentos');
      setTimeout(() => AGENDAMENTOS.abrirModal(), 300);
      return;
    }

    // Abre modal de agendamento pre-preenchido
    APP.loadPage('agendamentos');
    setTimeout(() => {
      AGENDAMENTOS.abrirModal({
        cliente_id: clienteId,
        veiculo_id: veiculoId,
        descricao: sintoma,
        tipo: 'outro'
      });
    }, 300);

    // Marca como agendado na fila
    this.mudarStatus(filaId, 'agendado');
  },

  async mudarStatus(id, novoStatus) {
    const { error } = await db.from('fila_espera').update({ status: novoStatus }).eq('id', id).eq('oficina_id', APP.profile.oficina_id);
    if (error) { APP.toast('Erro: ' + error.message, 'error'); return; }
    APP.toast('Status atualizado');
    this.carregar();
  }
};

document.addEventListener('pageLoad', (e) => {
  if (e.detail.page === 'fila') FILA.carregar();
});
