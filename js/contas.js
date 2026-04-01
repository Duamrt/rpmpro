// RPM Pro — Contas a Pagar / Receber
const CONTAS = {
  _filtro: 'pagar',
  _view: 'calendario',
  _calAno: new Date().getFullYear(),
  _calMes: new Date().getMonth(),
  _calDiaSel: null,
  _todasContas: [],

  async carregar() {
    const container = document.getElementById('contas-content');
    if (!container) return;
    const oficina_id = APP.oficinaId;
    const hoje = new Date().toISOString().split('T')[0];

    // Busca TODAS as contas do mês do calendário
    const inicioMes = new Date(this._calAno, this._calMes, 1).toISOString().split('T')[0];
    const fimMes = new Date(this._calAno, this._calMes + 1, 0).toISOString().split('T')[0];

    const { data: todasMes } = await db.from('contas').select('*')
      .eq('oficina_id', oficina_id)
      .gte('vencimento', inicioMes)
      .lte('vencimento', fimMes)
      .order('vencimento');
    this._todasContas = todasMes || [];

    // Busca lista filtrada pra aba "Lista"
    let query = db.from('contas').select('*').eq('oficina_id', oficina_id).order('vencimento');
    if (this._filtro === 'pagar') query = query.eq('tipo', 'pagar').eq('status', 'pendente');
    else if (this._filtro === 'receber') query = query.eq('tipo', 'receber').eq('status', 'pendente');
    else if (this._filtro === 'vencidas') query = query.eq('status', 'pendente').lt('vencimento', hoje);
    else if (this._filtro === 'pagas') query = query.eq('status', 'pago');
    const { data } = await query;
    const lista = data || [];

    const mesLista = this._todasContas;
    const totalPagar = mesLista.filter(c => c.tipo === 'pagar' && c.status === 'pendente').reduce((s, c) => s + Number(c.valor), 0);
    const totalReceber = mesLista.filter(c => c.tipo === 'receber' && c.status === 'pendente').reduce((s, c) => s + Number(c.valor), 0);
    const vencidas = mesLista.filter(c => c.status === 'pendente' && c.vencimento < hoje).length;
    const venceHoje = mesLista.filter(c => c.status === 'pendente' && c.vencimento === hoje).length;

    const catLabel = { aluguel: 'Aluguel', energia: 'Energia', agua: 'Agua', internet: 'Internet/Telefone', fornecedor: 'Fornecedor', funcionario: 'Funcionario', imposto: 'Imposto', contador: 'Contador', manutencao: 'Manutencao', seguro: 'Seguro', combustivel: 'Combustivel', material: 'Material/Insumo', cliente: 'Cliente', servico: 'Servico', outro: 'Outro' };
    const nomeMes = ['Janeiro','Fevereiro','Marco','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];

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

      <!-- Abas Calendário / Lista -->
      <div style="display:flex;gap:8px;margin-bottom:16px;align-items:center;flex-wrap:wrap;">
        <button class="btn ${this._view === 'calendario' ? 'btn-primary' : 'btn-secondary'} btn-sm" onclick="CONTAS._view='calendario';CONTAS.carregar()">📅 Calendário</button>
        <button class="btn ${this._view === 'lista' ? 'btn-primary' : 'btn-secondary'} btn-sm" onclick="CONTAS._view='lista';CONTAS.carregar()">📋 Lista</button>
        <div style="flex:1;"></div>
        <button class="btn btn-primary btn-sm" onclick="CONTAS.abrirModal('receber')">+ A receber</button>
        <button class="btn btn-danger btn-sm" onclick="CONTAS.abrirModal('pagar')">+ A pagar</button>
      </div>

      ${this._view === 'calendario' ? this._renderCalendario(hoje, catLabel, nomeMes) : this._renderLista(lista, hoje, catLabel)}
    `;
  },

  _renderCalendario(hoje, catLabel, nomeMes) {
    const ano = this._calAno, mes = this._calMes;
    const primeiroDia = new Date(ano, mes, 1).getDay();
    const diasNoMes = new Date(ano, mes + 1, 0).getDate();
    const pendentes = this._todasContas.filter(c => c.status === 'pendente');

    // Agrupar por dia
    const porDia = {};
    pendentes.forEach(c => {
      const d = c.vencimento?.substring(8, 10).replace(/^0/, '');
      if (!porDia[d]) porDia[d] = { pagar: 0, receber: 0, contas: [] };
      porDia[d].contas.push(c);
      if (c.tipo === 'pagar') porDia[d].pagar += Number(c.valor);
      else porDia[d].receber += Number(c.valor);
    });

    // Montar grid do calendário
    let dias = '';
    const diasSem = ['Dom','Seg','Ter','Qua','Qui','Sex','Sab'];
    const headerSem = diasSem.map(d => `<div style="text-align:center;font-size:11px;font-weight:700;color:var(--text-secondary);padding:8px 0;">${d}</div>`).join('');

    // Dias vazios antes do mês
    for (let i = 0; i < primeiroDia; i++) dias += '<div></div>';

    const hojeNum = hoje.substring(0, 7) === `${ano}-${String(mes+1).padStart(2,'0')}` ? parseInt(hoje.substring(8, 10)) : -1;

    for (let d = 1; d <= diasNoMes; d++) {
      const info = porDia[d];
      const isHoje = d === hojeNum;
      const isSel = d === this._calDiaSel;
      const temPagar = info && info.pagar > 0;
      const temReceber = info && info.receber > 0;
      const borderColor = isSel ? 'var(--primary)' : isHoje ? 'var(--warning)' : 'var(--border)';
      const bg = isSel ? 'rgba(255,69,0,0.1)' : isHoje ? 'rgba(255,193,7,0.08)' : 'var(--bg-card)';

      dias += `<div onclick="CONTAS._calDiaSel=${d};CONTAS._renderDiaDetalhe()" style="background:${bg};border:1px solid ${borderColor};border-radius:8px;padding:6px;cursor:pointer;min-height:60px;transition:border-color .15s;">
        <div style="font-size:13px;font-weight:${isHoje ? '800' : '600'};color:${isHoje ? 'var(--warning)' : 'var(--text)'};margin-bottom:4px;">${d}</div>
        ${temPagar ? `<div style="font-size:10px;color:var(--danger);font-weight:700;line-height:1.4;">-${APP.formatMoney(info.pagar)}</div>` : ''}
        ${temReceber ? `<div style="font-size:10px;color:var(--success);font-weight:700;line-height:1.4;">+${APP.formatMoney(info.receber)}</div>` : ''}
      </div>`;
    }

    return `
      <div style="background:var(--bg-card);border:1px solid var(--border);border-radius:var(--radius-lg);padding:16px;margin-bottom:16px;">
        <!-- Navegação mês -->
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
          <button class="btn btn-secondary btn-sm" onclick="CONTAS._calMes--;if(CONTAS._calMes<0){CONTAS._calMes=11;CONTAS._calAno--;}CONTAS._calDiaSel=null;CONTAS.carregar()">◀</button>
          <span style="font-size:16px;font-weight:800;letter-spacing:1px;">${nomeMes[mes]} ${ano}</span>
          <button class="btn btn-secondary btn-sm" onclick="CONTAS._calMes++;if(CONTAS._calMes>11){CONTAS._calMes=0;CONTAS._calAno++;}CONTAS._calDiaSel=null;CONTAS.carregar()">▶</button>
        </div>
        <!-- Grid -->
        <div style="display:grid;grid-template-columns:repeat(7,1fr);gap:4px;">
          ${headerSem}
          ${dias}
        </div>
      </div>
      <!-- Detalhe do dia selecionado -->
      <div id="contas-dia-detalhe"></div>
    `;
  },

  _renderDiaDetalhe() {
    const container = document.getElementById('contas-dia-detalhe');
    if (!container || !this._calDiaSel) { if (container) container.innerHTML = ''; return; }
    const diaStr = `${this._calAno}-${String(this._calMes+1).padStart(2,'0')}-${String(this._calDiaSel).padStart(2,'0')}`;
    const hoje = new Date().toISOString().split('T')[0];
    const contas = this._todasContas.filter(c => c.vencimento === diaStr && c.status === 'pendente');
    const catLabel = { aluguel: 'Aluguel', energia: 'Energia', agua: 'Agua', internet: 'Internet/Telefone', fornecedor: 'Fornecedor', funcionario: 'Funcionario', imposto: 'Imposto', contador: 'Contador', manutencao: 'Manutencao', seguro: 'Seguro', combustivel: 'Combustivel', material: 'Material/Insumo', cliente: 'Cliente', servico: 'Servico', outro: 'Outro' };
    const total = contas.reduce((s, c) => s + (c.tipo === 'pagar' ? -Number(c.valor) : Number(c.valor)), 0);

    if (!contas.length) {
      container.innerHTML = `<div style="text-align:center;padding:20px;color:var(--text-secondary);font-size:13px;">Nenhuma conta pendente em ${this._calDiaSel}/${this._calMes+1}</div>`;
      return;
    }

    container.innerHTML = `
      <div style="background:var(--bg-card);border:1px solid var(--border);border-radius:var(--radius-lg);padding:16px;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
          <span style="font-weight:700;font-size:14px;">📅 ${this._calDiaSel}/${this._calMes+1}/${this._calAno}</span>
          <span style="font-weight:800;font-size:16px;color:${total >= 0 ? 'var(--success)' : 'var(--danger)'};">${APP.formatMoney(Math.abs(total))}</span>
        </div>
        <div class="mobile-card-list" style="display:flex;flex-direction:column;gap:8px;">
          ${contas.map(c => {
            const vencido = c.vencimento < hoje;
            return `
            <div style="display:flex;justify-content:space-between;align-items:center;padding:12px;background:var(--bg-input);border-radius:8px;border-left:3px solid ${c.tipo === 'pagar' ? 'var(--danger)' : 'var(--success)'};">
              <div>
                <div style="font-weight:600;font-size:13px;">${esc(c.descricao)}${c.recorrente ? ' 🔄' : ''}</div>
                <div style="font-size:11px;color:var(--text-secondary);">${esc(catLabel[c.categoria] || c.categoria || '')}${vencido ? ' · <span style="color:var(--danger);">VENCIDA</span>' : ''}</div>
              </div>
              <div style="display:flex;align-items:center;gap:8px;">
                <span style="font-weight:700;font-size:14px;color:${c.tipo === 'pagar' ? 'var(--danger)' : 'var(--success)'};">${APP.formatMoney(c.valor)}</span>
                ${c.status === 'pendente' ? `<button class="btn btn-success btn-sm" style="min-height:36px;padding:6px 10px;" onclick="CONTAS.marcarPago('${c.id}')">Pagar</button>` : ''}
              </div>
            </div>`;
          }).join('')}
        </div>
      </div>
    `;
  },

  _renderLista(lista, hoje, catLabel) {
    const isMobile = window.innerWidth <= 768;
    if (!lista.length) return `<div class="empty-state"><div class="icon">💳</div><h3>Nenhuma conta encontrada</h3><p>Use os botoes acima para registrar contas a pagar ou receber</p></div>`;

    // Filtros da lista
    const filtros = `<div style="display:flex;gap:8px;margin-bottom:12px;flex-wrap:wrap;">
      ${[['pagar','A pagar'],['receber','A receber'],['vencidas','Vencidas'],['pagas','Pagas'],['todas','Todas']].map(([f, label]) =>
        `<button class="btn ${this._filtro === f ? 'btn-primary' : 'btn-secondary'} btn-sm" onclick="CONTAS._filtro='${f}';CONTAS.carregar();">${label}</button>`
      ).join('')}
    </div>`;

    if (isMobile) {
      return filtros + `<div class="mobile-card-list">${lista.map(c => {
        const vencido = c.status === 'pendente' && c.vencimento < hoje;
        return `<div class="mobile-card" style="${vencido ? 'border-left:3px solid var(--danger);' : ''}">
          <div class="mobile-card-header">
            <div>
              <div class="mobile-card-title">${esc(c.descricao)}${c.recorrente ? ' 🔄' : ''}</div>
              <div class="mobile-card-subtitle">${esc(catLabel[c.categoria] || '-')} · ${APP.formatDate(c.vencimento)}${vencido ? ' · VENCIDA' : ''}</div>
            </div>
            <span style="font-weight:700;color:${c.tipo === 'pagar' ? 'var(--danger)' : 'var(--success)'};">${APP.formatMoney(c.valor)}</span>
          </div>
          ${c.status === 'pendente' ? `<div class="mobile-card-actions">
            <button class="btn btn-success btn-sm" onclick="CONTAS.marcarPago('${c.id}')">Pagar</button>
            <button class="btn btn-secondary btn-sm" onclick="CONTAS.editar('${c.id}')">Editar</button>
          </div>` : ''}
        </div>`;
      }).join('')}</div>`;
    }

    return filtros + `<div style="background:var(--bg-card);border:1px solid var(--border);border-radius:var(--radius-lg);overflow:hidden;">
      <table class="data-table">
        <thead><tr><th>Vencimento</th><th>Tipo</th><th>Categoria</th><th>Descricao</th><th>Valor</th><th>Status</th><th></th></tr></thead>
        <tbody>${lista.map(c => {
          const vencido = c.status === 'pendente' && c.vencimento < hoje;
          const venceHj = c.status === 'pendente' && c.vencimento === hoje;
          return `<tr style="${vencido ? 'background:var(--danger-bg);' : venceHj ? 'background:var(--warning-bg);' : ''}">
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
        }).join('')}</tbody>
      </table>
    </div>`;
  },

  abrirModal(tipo, dados = {}) {
    const catsPagar = [['aluguel','Aluguel'],['energia','Energia'],['agua','Agua'],['internet','Internet/Telefone'],['fornecedor','Fornecedor'],['funcionario','Funcionario'],['contador','Contador'],['imposto','Imposto'],['manutencao','Manutencao'],['seguro','Seguro'],['combustivel','Combustivel'],['material','Material/Insumo'],['outro','Outro']];
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
      oficina_id: APP.oficinaId,
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
      ({ error } = await db.from('contas').update(obj).eq('id', id).eq('oficina_id', APP.oficinaId));
    } else {
      ({ error } = await db.from('contas').insert(obj));
    }

    if (error) { APP.toast('Erro: ' + error.message, 'error'); return; }
    closeModal();
    APP.toast(id ? 'Conta atualizada' : 'Conta registrada');
    this.carregar();
  },

  async marcarPago(id) {
    const { error } = await db.from('contas').update({ status: 'pago', pago_em: new Date().toISOString() }).eq('id', id).eq('oficina_id', APP.oficinaId);
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
    const { error } = await db.from('contas').delete().eq('id', id).eq('oficina_id', APP.oficinaId);
    if (error) { APP.toast('Erro: ' + error.message, 'error'); return; }
    APP.toast('Conta excluida');
    this.carregar();
  }
};

document.addEventListener('pageLoad', (e) => {
  if (e.detail.page === 'contas') CONTAS.carregar();
});
