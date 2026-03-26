// RPM Pro — Contas a Pagar / Receber
const CONTAS = {
  _filtro: 'pagar',

  async carregar() {
    const container = document.getElementById('contas-content');
    if (!container) return;
    const oficina_id = APP.profile.oficina_id;
    const hoje = new Date().toISOString().split('T')[0];

    let query = db.from('contas').select('*').eq('oficina_id', oficina_id).order('vencimento');

    if (this._filtro === 'pagar') query = query.eq('tipo', 'pagar').eq('status', 'pendente');
    else if (this._filtro === 'receber') query = query.eq('tipo', 'receber').eq('status', 'pendente');
    else if (this._filtro === 'vencidas') query = query.eq('status', 'pendente').lt('vencimento', hoje);
    else if (this._filtro === 'pagas') query = query.eq('status', 'pago');

    const { data } = await query;
    const lista = data || [];

    // Busca totais gerais do mês
    const inicioMes = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
    const fimMes = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().split('T')[0];

    const { data: todasMes } = await db.from('contas').select('tipo, valor, status, vencimento')
      .eq('oficina_id', oficina_id)
      .gte('vencimento', inicioMes)
      .lte('vencimento', fimMes);

    const mesLista = todasMes || [];
    const totalPagar = mesLista.filter(c => c.tipo === 'pagar' && c.status === 'pendente').reduce((s, c) => s + Number(c.valor), 0);
    const totalReceber = mesLista.filter(c => c.tipo === 'receber' && c.status === 'pendente').reduce((s, c) => s + Number(c.valor), 0);
    const vencidas = lista.filter(c => c.status === 'pendente' && c.vencimento < hoje).length;
    const venceHoje = lista.filter(c => c.status === 'pendente' && c.vencimento === hoje).length;

    const catLabel = { aluguel: 'Aluguel', energia: 'Energia', agua: 'Agua', internet: 'Internet', fornecedor: 'Fornecedor', funcionario: 'Funcionario', imposto: 'Imposto', cliente: 'Cliente', servico: 'Servico', outro: 'Outro' };

    container.innerHTML = `
      <!-- KPIs -->
      <div class="kpi-grid" style="margin-bottom:20px;">
        <div class="kpi-card">
          <div class="label">A pagar (mes)</div>
          <div class="value" style="color:var(--danger);">${APP.formatMoney(totalPagar)}</div>
        </div>
        <div class="kpi-card">
          <div class="label">A receber (mes)</div>
          <div class="value success">${APP.formatMoney(totalReceber)}</div>
        </div>
        <div class="kpi-card">
          <div class="label">Vencidas</div>
          <div class="value" style="color:var(--danger);">${vencidas}${venceHoje ? ` <span style="font-size:12px;">(${venceHoje} hoje)</span>` : ''}</div>
        </div>
        <div class="kpi-card">
          <div class="label">Saldo previsto</div>
          <div class="value ${totalReceber - totalPagar >= 0 ? 'success' : ''}" style="${totalReceber - totalPagar < 0 ? 'color:var(--danger);' : ''}">${APP.formatMoney(totalReceber - totalPagar)}</div>
        </div>
      </div>

      <!-- Filtros -->
      <div style="display:flex;gap:8px;margin-bottom:16px;flex-wrap:wrap;align-items:center;">
        ${[
          ['pagar', 'A pagar'],
          ['receber', 'A receber'],
          ['vencidas', 'Vencidas'],
          ['pagas', 'Pagas'],
          ['todas', 'Todas']
        ].map(([f, label]) => `
          <button class="btn ${this._filtro === f ? 'btn-primary' : 'btn-secondary'} btn-sm" onclick="CONTAS._filtro='${f}'; CONTAS.carregar();">${label}</button>
        `).join('')}
        <div style="flex:1;"></div>
        <button class="btn btn-primary btn-sm" onclick="CONTAS.abrirModal('receber')">+ A receber</button>
        <button class="btn btn-danger btn-sm" onclick="CONTAS.abrirModal('pagar')">+ A pagar</button>
      </div>

      ${lista.length ? `
      <div style="background:var(--bg-card);border:1px solid var(--border);border-radius:var(--radius-lg);overflow:hidden;">
        <table class="data-table">
          <thead>
            <tr><th>Vencimento</th><th>Tipo</th><th>Categoria</th><th>Descricao</th><th>Valor</th><th>Status</th><th></th></tr>
          </thead>
          <tbody>
            ${lista.map(c => {
              const vencido = c.status === 'pendente' && c.vencimento < hoje;
              const venceHj = c.status === 'pendente' && c.vencimento === hoje;
              return `
              <tr style="${vencido ? 'background:var(--danger-bg);' : venceHj ? 'background:var(--warning-bg);' : ''}">
                <td><strong>${APP.formatDate(c.vencimento)}</strong>${vencido ? ' <span style="color:var(--danger);font-size:11px;">VENCIDA</span>' : venceHj ? ' <span style="color:var(--warning);font-size:11px;">HOJE</span>' : ''}</td>
                <td><span class="badge badge-${c.tipo === 'pagar' ? 'cancelada' : 'pronto'}">${c.tipo === 'pagar' ? 'Pagar' : 'Receber'}</span></td>
                <td style="font-size:13px;">${esc(catLabel[c.categoria] || c.categoria || '-')}</td>
                <td style="font-size:13px;">${esc(c.descricao)}${c.recorrente ? ' <span style="font-size:10px;color:var(--info);">🔄</span>' : ''}</td>
                <td style="font-weight:700;color:${c.tipo === 'pagar' ? 'var(--danger)' : 'var(--success)'};">${APP.formatMoney(c.valor)}</td>
                <td><span class="badge badge-${c.status === 'pago' ? 'entregue' : c.status === 'cancelado' ? 'cancelada' : 'orcamento'}">${c.status}</span></td>
                <td style="display:flex;gap:4px;flex-wrap:nowrap;">
                  ${c.status === 'pendente' ? `<button class="btn btn-success btn-sm" onclick="CONTAS.marcarPago('${c.id}')">Pagar</button>` : ''}
                  ${c.status === 'pendente' ? `<button class="btn btn-secondary btn-sm" onclick="CONTAS.editar('${c.id}')">Editar</button>` : ''}
                  <button class="btn btn-danger btn-sm" onclick="CONTAS.excluir('${c.id}')">X</button>
                </td>
              </tr>`;
            }).join('')}
          </tbody>
        </table>
      </div>` : `
      <div class="empty-state">
        <div class="icon">💳</div>
        <h3>Nenhuma conta encontrada</h3>
        <p>Use os botoes acima para registrar contas a pagar ou receber</p>
      </div>`}
    `;
  },

  abrirModal(tipo, dados = {}) {
    const catsPagar = [['aluguel','Aluguel'],['energia','Energia'],['agua','Agua'],['internet','Internet'],['fornecedor','Fornecedor'],['funcionario','Funcionario'],['imposto','Imposto'],['outro','Outro']];
    const catsReceber = [['cliente','Cliente'],['servico','Servico'],['outro','Outro']];
    const cats = tipo === 'pagar' ? catsPagar : catsReceber;

    openModal(`
      <div class="modal-header">
        <h3>${dados.id ? 'Editar' : 'Nova'} conta a ${tipo}</h3>
        <button class="modal-close" onclick="closeModal()">&times;</button>
      </div>
      <div class="modal-body">
        <form onsubmit="CONTAS.salvar(event, '${tipo}', '${dados.id || ''}')">
          <div class="form-group">
            <label>Descricao *</label>
            <input type="text" class="form-control" id="ct-descricao" required value="${esc(dados.descricao || '')}" placeholder="Ex: Aluguel galpao, Peca fornecedor...">
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
            <div class="form-group">
              <label>Valor (R$) *</label>
              <input type="number" class="form-control" id="ct-valor" required min="0.01" step="0.01" value="${dados.valor || ''}" placeholder="0,00">
            </div>
            <div class="form-group">
              <label>Vencimento *</label>
              <input type="date" class="form-control" id="ct-vencimento" required value="${dados.vencimento || ''}">
            </div>
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
            <div class="form-group">
              <label>Categoria</label>
              <select class="form-control" id="ct-categoria">
                ${cats.map(([v, l]) => `<option value="${v}" ${dados.categoria === v ? 'selected' : ''}>${l}</option>`).join('')}
              </select>
            </div>
            <div class="form-group">
              <label>Forma de pagamento</label>
              <select class="form-control" id="ct-forma">
                <option value="">-</option>
                <option value="pix" ${dados.forma_pagamento === 'pix' ? 'selected' : ''}>Pix</option>
                <option value="boleto" ${dados.forma_pagamento === 'boleto' ? 'selected' : ''}>Boleto</option>
                <option value="dinheiro" ${dados.forma_pagamento === 'dinheiro' ? 'selected' : ''}>Dinheiro</option>
                <option value="debito" ${dados.forma_pagamento === 'debito' ? 'selected' : ''}>Debito</option>
                <option value="credito" ${dados.forma_pagamento === 'credito' ? 'selected' : ''}>Credito</option>
                <option value="transferencia" ${dados.forma_pagamento === 'transferencia' ? 'selected' : ''}>Transferencia</option>
              </select>
            </div>
          </div>
          <div class="form-group">
            <label style="display:flex;align-items:center;gap:8px;">
              <input type="checkbox" id="ct-recorrente" ${dados.recorrente ? 'checked' : ''}> Conta recorrente (mensal)
            </label>
          </div>
          <div class="form-group">
            <label>Observacoes</label>
            <textarea class="form-control" id="ct-obs">${esc(dados.observacoes || '')}</textarea>
          </div>
          <div class="modal-footer" style="padding:16px 0 0;border:0;">
            <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancelar</button>
            <button type="submit" class="btn ${tipo === 'pagar' ? 'btn-danger' : 'btn-primary'}">Salvar</button>
          </div>
        </form>
      </div>
    `);
  },

  async salvar(e, tipo, id) {
    e.preventDefault();
    const obj = {
      oficina_id: APP.profile.oficina_id,
      tipo,
      descricao: document.getElementById('ct-descricao').value.trim(),
      valor: parseFloat(document.getElementById('ct-valor').value) || 0,
      vencimento: document.getElementById('ct-vencimento').value,
      categoria: document.getElementById('ct-categoria').value,
      forma_pagamento: document.getElementById('ct-forma').value || null,
      recorrente: document.getElementById('ct-recorrente').checked,
      observacoes: document.getElementById('ct-obs').value.trim(),
      created_by: APP.profile.id
    };

    let error;
    if (id) {
      ({ error } = await db.from('contas').update(obj).eq('id', id).eq('oficina_id', APP.profile.oficina_id));
    } else {
      ({ error } = await db.from('contas').insert(obj));
    }

    if (error) { APP.toast('Erro: ' + error.message, 'error'); return; }
    closeModal();
    APP.toast(id ? 'Conta atualizada' : 'Conta registrada');
    this.carregar();
  },

  async marcarPago(id) {
    const { error } = await db.from('contas').update({ status: 'pago', pago_em: new Date().toISOString() }).eq('id', id).eq('oficina_id', APP.profile.oficina_id);
    if (error) { APP.toast('Erro: ' + error.message, 'error'); return; }
    APP.toast('Conta marcada como paga');
    this.carregar();
  },

  async editar(id) {
    const { data } = await db.from('contas').select('*').eq('id', id).single();
    if (data) this.abrirModal(data.tipo, data);
  },

  async excluir(id) {
    if (!confirm('Excluir esta conta?')) return;
    const { error } = await db.from('contas').delete().eq('id', id).eq('oficina_id', APP.profile.oficina_id);
    if (error) { APP.toast('Erro: ' + error.message, 'error'); return; }
    APP.toast('Conta excluida');
    this.carregar();
  }
};

document.addEventListener('pageLoad', (e) => {
  if (e.detail.page === 'contas') CONTAS.carregar();
});
