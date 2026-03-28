// RPM Pro — Financeiro (Caixa da Oficina)
const FINANCEIRO = {
  _periodo: 'hoje',

  async carregar() {
    const container = document.getElementById('financeiro-content');
    if (!container) return;

    const oficina_id = APP.profile.oficina_id;
    const agora = new Date();

    // Períodos
    const hoje = agora.toISOString().split('T')[0];
    const inicioSemana = new Date(agora);
    inicioSemana.setDate(agora.getDate() - agora.getDay());
    const inicioMes = new Date(agora.getFullYear(), agora.getMonth(), 1);

    // Define filtro de data pelo período selecionado
    let dataInicio;
    if (this._periodo === 'hoje') dataInicio = hoje;
    else if (this._periodo === 'semana') dataInicio = inicioSemana.toISOString().split('T')[0];
    else if (this._periodo === 'mes') dataInicio = inicioMes.toISOString().split('T')[0];
    else dataInicio = inicioMes.toISOString().split('T')[0];

    // Busca movimentações e OS pagas do período
    const [caixaRes, osRes] = await Promise.all([
      db.from('caixa')
        .select('*')
        .eq('oficina_id', oficina_id)
        .gte('created_at', dataInicio)
        .order('created_at', { ascending: false }),
      db.from('ordens_servico')
        .select('id, numero, valor_total, forma_pagamento, data_entrega, descricao, veiculos(placa), clientes(nome)')
        .eq('oficina_id', oficina_id)
        .eq('pago', true)
        .gte('data_entrega', dataInicio)
        .order('data_entrega', { ascending: false })
    ]);

    const movimentacoes = caixaRes.data || [];
    const osPagas = osRes.data || [];

    // Calcula totais
    const totalEntradas = movimentacoes.filter(m => m.tipo === 'entrada').reduce((s, m) => s + (m.valor || 0), 0);
    const totalSaidas = movimentacoes.filter(m => m.tipo === 'saida').reduce((s, m) => s + (m.valor || 0), 0);
    const totalOS = osPagas.reduce((s, o) => s + (o.valor_total || 0), 0);
    const saldo = totalEntradas + totalOS - totalSaidas;

    // Agrupa por forma de pagamento
    const porForma = {};
    osPagas.forEach(o => {
      const f = o.forma_pagamento || 'outros';
      porForma[f] = (porForma[f] || 0) + (o.valor_total || 0);
    });
    movimentacoes.filter(m => m.tipo === 'entrada').forEach(m => {
      const f = m.forma_pagamento || 'outros';
      porForma[f] = (porForma[f] || 0) + (m.valor || 0);
    });

    const formaLabel = { dinheiro: 'Dinheiro', pix: 'Pix', debito: 'Débito', credito: 'Crédito', boleto: 'Boleto', transferencia: 'Transferência', outros: 'Outros' };

    const periodoLabel = { hoje: 'Hoje', semana: 'Esta semana', mes: 'Este mês' };

    container.innerHTML = `
      <!-- Filtro de período -->
      <div style="display:flex;gap:8px;margin-bottom:20px;">
        ${['hoje','semana','mes'].map(p => `
          <button class="btn ${this._periodo === p ? 'btn-primary' : 'btn-secondary'} btn-sm" onclick="FINANCEIRO._periodo='${p}'; FINANCEIRO.carregar();">${periodoLabel[p]}</button>
        `).join('')}
        <div style="flex:1;"></div>
        <button class="btn btn-primary btn-sm" onclick="FINANCEIRO.novaMovimentacao('entrada')">+ Entrada</button>
        <button class="btn btn-danger btn-sm" onclick="FINANCEIRO.novaMovimentacao('saida')">+ Saida</button>
      </div>

      <!-- KPIs -->
      <div class="kpi-grid" style="margin-bottom:20px;">
        <div class="kpi-card">
          <div class="label">Entradas (OS + Caixa)</div>
          <div class="value success">${APP.formatMoney(totalEntradas + totalOS)}</div>
        </div>
        <div class="kpi-card">
          <div class="label">Saidas</div>
          <div class="value" style="color:var(--danger);">${APP.formatMoney(totalSaidas)}</div>
        </div>
        <div class="kpi-card">
          <div class="label">Saldo</div>
          <div class="value ${saldo >= 0 ? 'success' : ''}" style="${saldo < 0 ? 'color:var(--danger);' : ''}">${APP.formatMoney(saldo)}</div>
        </div>
        <div class="kpi-card">
          <div class="label">OS Pagas</div>
          <div class="value primary">${osPagas.length}</div>
        </div>
      </div>

      <!-- Recebimentos por forma de pagamento -->
      ${Object.keys(porForma).length ? `
      <div style="background:var(--bg-card);border:1px solid var(--border);border-radius:var(--radius-lg);padding:16px 20px;margin-bottom:20px;">
        <h3 style="font-size:14px;margin-bottom:12px;color:var(--text-secondary);">Recebimentos por forma de pagamento</h3>
        <div style="display:flex;flex-wrap:wrap;gap:12px;">
          ${Object.entries(porForma).map(([f, v]) => `
            <div style="background:var(--bg-input);padding:10px 16px;border-radius:var(--radius);min-width:120px;">
              <div style="font-size:12px;color:var(--text-secondary);">${esc(formaLabel[f] || f)}</div>
              <div style="font-size:16px;font-weight:700;color:var(--success);">${APP.formatMoney(v)}</div>
            </div>
          `).join('')}
        </div>
      </div>` : ''}

      <!-- OS Pagas -->
      <div style="background:var(--bg-card);border:1px solid var(--border);border-radius:var(--radius-lg);overflow:hidden;margin-bottom:20px;">
        <div style="padding:14px 20px;border-bottom:1px solid var(--border);display:flex;justify-content:space-between;align-items:center;">
          <h3 style="font-size:14px;">OS Pagas — ${esc(periodoLabel[this._periodo])}</h3>
          <span style="font-size:13px;color:var(--success);font-weight:700;">${APP.formatMoney(totalOS)}</span>
        </div>
        ${osPagas.length ? (window.innerWidth <= 768 ? `
        <div class="mobile-card-list" style="padding:10px;">
          ${osPagas.map(o => `
            <div class="mobile-card" onclick="OS.abrirDetalhes('${o.id}')">
              <div class="mobile-card-header">
                <div>
                  <div class="mobile-card-title">#${esc(o.numero || '-')} · ${esc(o.veiculos?.placa || '-')}</div>
                  <div class="mobile-card-subtitle">${esc(o.clientes?.nome || '-')}</div>
                </div>
                <span style="font-weight:700;color:var(--success);">${APP.formatMoney(o.valor_total)}</span>
              </div>
              <div class="mobile-card-row"><span>${esc(formaLabel[o.forma_pagamento] || o.forma_pagamento || '-')}</span></div>
            </div>
          `).join('')}
        </div>` : `
        <table class="data-table">
          <thead>
            <tr><th>OS</th><th>Veiculo</th><th>Cliente</th><th>Pagamento</th><th>Valor</th></tr>
          </thead>
          <tbody>
            ${osPagas.map(o => `
              <tr style="cursor:pointer;" onclick="OS.abrirDetalhes('${o.id}')">
                <td><strong>#${esc(o.numero || '-')}</strong></td>
                <td>${esc(o.veiculos?.placa || '-')}</td>
                <td>${esc(o.clientes?.nome || '-')}</td>
                <td><span class="badge badge-pronto">${esc(formaLabel[o.forma_pagamento] || o.forma_pagamento || '-')}</span></td>
                <td style="font-weight:700;color:var(--success);">${APP.formatMoney(o.valor_total)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>`) : '<div style="padding:30px;text-align:center;color:var(--text-muted);font-size:13px;">Nenhuma OS paga nesse periodo</div>'}
      </div>

      <!-- Movimentações do caixa -->
      <div style="background:var(--bg-card);border:1px solid var(--border);border-radius:var(--radius-lg);overflow:hidden;">
        <div style="padding:14px 20px;border-bottom:1px solid var(--border);display:flex;justify-content:space-between;align-items:center;">
          <h3 style="font-size:14px;">Movimentacoes do Caixa</h3>
          <span style="font-size:13px;color:var(--text-secondary);">${movimentacoes.length} lancamentos</span>
        </div>
        ${movimentacoes.length ? (window.innerWidth <= 768 ? `
        <div class="mobile-card-list" style="padding:10px;">
          ${movimentacoes.map(m => `
            <div class="mobile-card">
              <div class="mobile-card-header">
                <div>
                  <div class="mobile-card-title">${esc(m.descricao)}</div>
                  <div class="mobile-card-subtitle">${esc(FINANCEIRO._catLabel(m.categoria))} · ${APP.formatDate(m.created_at)}</div>
                </div>
                <span style="font-weight:700;color:${m.tipo === 'entrada' ? 'var(--success)' : 'var(--danger)'};">${m.tipo === 'saida' ? '-' : ''}${APP.formatMoney(m.valor)}</span>
              </div>
              <div class="mobile-card-row">
                <span class="badge badge-${m.tipo === 'entrada' ? 'pronto' : 'cancelada'}">${m.tipo === 'entrada' ? 'Entrada' : 'Saída'}</span>
                <button class="btn btn-danger btn-sm" style="flex:0;" onclick="FINANCEIRO.excluir('${m.id}')">X</button>
              </div>
            </div>
          `).join('')}
        </div>` : `
        <table class="data-table">
          <thead>
            <tr><th>Data</th><th>Tipo</th><th>Categoria</th><th>Descricao</th><th>Valor</th><th></th></tr>
          </thead>
          <tbody>
            ${movimentacoes.map(m => `
              <tr>
                <td style="font-size:12px;color:var(--text-secondary);">${APP.formatDateTime(m.created_at)}</td>
                <td><span class="badge badge-${m.tipo === 'entrada' ? 'pronto' : 'cancelada'}">${m.tipo === 'entrada' ? 'Entrada' : 'Saida'}</span></td>
                <td style="font-size:13px;">${esc(FINANCEIRO._catLabel(m.categoria))}</td>
                <td style="font-size:13px;">${esc(m.descricao)}</td>
                <td style="font-weight:700;color:${m.tipo === 'entrada' ? 'var(--success)' : 'var(--danger)'};">${m.tipo === 'saida' ? '-' : ''}${APP.formatMoney(m.valor)}</td>
                <td><button class="btn btn-danger btn-sm" onclick="FINANCEIRO.excluir('${m.id}')">X</button></td>
              </tr>
            `).join('')}
          </tbody>
        </table>`) : '<div style="padding:30px;text-align:center;color:var(--text-muted);font-size:13px;">Nenhuma movimentacao registrada</div>'}
      </div>

      <!-- Botão PDF -->
      <div style="margin-top:16px;display:flex;gap:8px;">
        <button class="btn btn-secondary" onclick="FINANCEIRO.gerarPDF()">Gerar Relatorio PDF</button>
      </div>
    `;
  },

  _catLabel(cat) {
    const labels = { servico: 'Servico', peca: 'Peca', despesa: 'Despesa', retirada: 'Retirada', aporte: 'Aporte', outro: 'Outro' };
    return labels[cat] || cat;
  },

  novaMovimentacao(tipo) {
    const categorias = tipo === 'entrada'
      ? [['aporte', 'Aporte de capital'], ['outro', 'Outra entrada']]
      : [['despesa', 'Despesa operacional'], ['retirada', 'Retirada / Pro-labore'], ['outro', 'Outra saida']];

    openModal(`
      <div class="modal-header">
        <h3>${tipo === 'entrada' ? 'Nova Entrada' : 'Nova Saida'}</h3>
        <button class="modal-close" onclick="closeModal()">&times;</button>
      </div>
      <div class="modal-body">
        <form onsubmit="FINANCEIRO.salvar(event, '${tipo}')">
          <div class="form-group">
            <label>Categoria</label>
            <select class="form-control" id="fin-categoria" required>
              ${categorias.map(([v, l]) => `<option value="${v}">${l}</option>`).join('')}
            </select>
          </div>
          <div class="form-group">
            <label>Descricao *</label>
            <input type="text" class="form-control" id="fin-descricao" required placeholder="Ex: Aluguel, Conta de luz, Compra de material...">
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
            <div class="form-group">
              <label>Valor (R$) *</label>
              <input type="number" class="form-control" id="fin-valor" required min="0.01" step="0.01" placeholder="0,00">
            </div>
            <div class="form-group">
              <label>Forma de pagamento</label>
              <select class="form-control" id="fin-forma">
                <option value="dinheiro">Dinheiro</option>
                <option value="pix">Pix</option>
                <option value="debito">Debito</option>
                <option value="credito">Credito</option>
                <option value="boleto">Boleto</option>
                <option value="transferencia">Transferencia</option>
              </select>
            </div>
          </div>
          <div class="modal-footer" style="padding:16px 0 0;border:0;">
            <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancelar</button>
            <button type="submit" class="btn ${tipo === 'entrada' ? 'btn-success' : 'btn-danger'}">Registrar</button>
          </div>
        </form>
      </div>
    `);
  },

  async salvar(e, tipo) {
    e.preventDefault();
    const { error } = await db.from('caixa').insert({
      oficina_id: APP.profile.oficina_id,
      tipo,
      categoria: document.getElementById('fin-categoria').value,
      descricao: document.getElementById('fin-descricao').value.trim(),
      valor: parseFloat(document.getElementById('fin-valor').value) || 0,
      forma_pagamento: document.getElementById('fin-forma').value,
      created_by: APP.profile.id
    });

    if (error) { APP.toast('Erro: ' + error.message, 'error'); return; }
    closeModal();
    APP.toast('Lancamento registrado');
    this.carregar();
  },

  async excluir(id) {
    if (!confirm('Excluir este lancamento?')) return;
    const { error } = await db.from('caixa').delete().eq('id', id).eq('oficina_id', APP.profile.oficina_id);
    if (error) { APP.toast('Erro: ' + error.message, 'error'); return; }
    APP.toast('Lancamento excluido');
    this.carregar();
  },

  async gerarPDF() {
    try {
    await PDF_OS._carregarLogo();
    const oficina = APP.oficina || {};
    const oficina_id = APP.profile.oficina_id;
    const periodoLabel = { hoje: 'Hoje', semana: 'Esta semana', mes: 'Este mês' };
    const formaLabel = { dinheiro: 'Dinheiro', pix: 'Pix', debito: 'Débito', credito: 'Crédito', boleto: 'Boleto', transferencia: 'Transferência', outros: 'Outros' };
    const agora = new Date();
    const hoje = agora.toISOString().split('T')[0];
    const inicioSemana = new Date(agora); inicioSemana.setDate(agora.getDate() - agora.getDay());
    const inicioMes = new Date(agora.getFullYear(), agora.getMonth(), 1);

    let dataInicio;
    if (this._periodo === 'hoje') dataInicio = hoje;
    else if (this._periodo === 'semana') dataInicio = inicioSemana.toISOString().split('T')[0];
    else dataInicio = inicioMes.toISOString().split('T')[0];

    const [caixaRes, osRes] = await Promise.all([
      db.from('caixa').select('*').eq('oficina_id', oficina_id).gte('created_at', dataInicio).order('created_at'),
      db.from('ordens_servico').select('numero, valor_total, forma_pagamento, data_entrega, veiculos(placa), clientes(nome)')
        .eq('oficina_id', oficina_id).eq('pago', true).gte('data_entrega', dataInicio).order('data_entrega')
    ]);

    const movs = caixaRes.data || [];
    const oss = osRes.data || [];
    const totalOS = oss.reduce((s, o) => s + (o.valor_total || 0), 0);
    const totalEntradas = movs.filter(m => m.tipo === 'entrada').reduce((s, m) => s + (m.valor || 0), 0);
    const totalSaidas = movs.filter(m => m.tipo === 'saida').reduce((s, m) => s + (m.valor || 0), 0);
    const saldo = totalEntradas + totalOS - totalSaidas;

    // Recebimentos por forma de pagamento
    const porForma = {};
    oss.forEach(o => { const f = o.forma_pagamento || 'outros'; porForma[f] = (porForma[f] || 0) + (o.valor_total || 0); });
    movs.filter(m => m.tipo === 'entrada').forEach(m => { const f = m.forma_pagamento || 'outros'; porForma[f] = (porForma[f] || 0) + (m.valor || 0); });

    const header = PDF_OS._montarHeader(oficina, 'RELATÓRIO FINANCEIRO');
    const fmt = v => (v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

    const doc = {
      pageSize: 'A4',
      pageMargins: [40, 30, 40, 50],
      content: [
        ...header.filter(h => h && (h.text || h.columns || h.canvas)),

        // Período
        { text: periodoLabel[this._periodo] || 'Período', fontSize: 11, color: '#666', margin: [0, 0, 0, 14] },

        // KPIs resumo
        {
          table: {
            widths: ['*', '*', '*', '*'],
            body: [[
              { stack: [{ text: 'ENTRADAS', fontSize: 8, color: '#666' }, { text: fmt(totalEntradas + totalOS), fontSize: 14, bold: true, color: '#3fb950' }], alignment: 'center' },
              { stack: [{ text: 'SAÍDAS', fontSize: 8, color: '#666' }, { text: fmt(totalSaidas), fontSize: 14, bold: true, color: '#f85149' }], alignment: 'center' },
              { stack: [{ text: 'SALDO', fontSize: 8, color: '#666' }, { text: fmt(saldo), fontSize: 14, bold: true, color: saldo >= 0 ? '#3fb950' : '#f85149' }], alignment: 'center' },
              { stack: [{ text: 'OS PAGAS', fontSize: 8, color: '#666' }, { text: String(oss.length), fontSize: 14, bold: true, color: '#FF4500' }], alignment: 'center' }
            ]]
          },
          layout: { hLineWidth: () => 0, vLineWidth: () => 0.3, vLineColor: () => '#ddd', paddingTop: () => 10, paddingBottom: () => 10, paddingLeft: () => 8, paddingRight: () => 8 },
          margin: [0, 0, 0, 20]
        },

        // Recebimentos por forma de pagamento
        ...(Object.keys(porForma).length ? [
          { text: 'RECEBIMENTOS POR FORMA DE PAGAMENTO', fontSize: 10, bold: true, color: '#333', margin: [0, 0, 0, 8] },
          {
            table: {
              widths: ['*', 100],
              body: Object.entries(porForma).sort((a, b) => b[1] - a[1]).map(([f, v]) => [
                { text: formaLabel[f] || f, fontSize: 10 },
                { text: fmt(v), fontSize: 10, bold: true, color: '#3fb950', alignment: 'right' }
              ])
            },
            layout: { hLineWidth: (i) => i === 0 ? 0 : 0.3, vLineWidth: () => 0, hLineColor: () => '#eee', paddingTop: () => 4, paddingBottom: () => 4, paddingLeft: () => 4, paddingRight: () => 4 },
            margin: [0, 0, 0, 20]
          }
        ] : []),

        // OS Pagas
        { text: `OS PAGAS (${oss.length})`, fontSize: 10, bold: true, color: '#333', fillColor: '#f0f0f0', margin: [0, 0, 0, 6] },
        oss.length ? {
          table: {
            headerRows: 1,
            widths: [35, '*', '*', 65, 70],
            body: [
              [
                { text: 'OS', fontSize: 9, bold: true, color: '#666' },
                { text: 'Veículo', fontSize: 9, bold: true, color: '#666' },
                { text: 'Cliente', fontSize: 9, bold: true, color: '#666' },
                { text: 'Pagamento', fontSize: 9, bold: true, color: '#666' },
                { text: 'Valor', fontSize: 9, bold: true, color: '#666', alignment: 'right' }
              ],
              ...oss.map(o => [
                { text: '#' + (o.numero || '-'), fontSize: 9 },
                { text: o.veiculos?.placa || '-', fontSize: 9, bold: true },
                { text: o.clientes?.nome || '-', fontSize: 9 },
                { text: formaLabel[o.forma_pagamento] || o.forma_pagamento || '-', fontSize: 9 },
                { text: fmt(o.valor_total), fontSize: 9, bold: true, color: '#3fb950', alignment: 'right' }
              ]),
              [
                { text: 'TOTAL', fontSize: 9, bold: true, colSpan: 4 }, {}, {}, {},
                { text: fmt(totalOS), fontSize: 10, bold: true, color: '#3fb950', alignment: 'right' }
              ]
            ]
          },
          layout: {
            hLineWidth: (i, node) => (i === 0 || i === 1 || i === node.table.body.length) ? 0.5 : 0.3,
            vLineWidth: () => 0.3, hLineColor: () => '#ccc', vLineColor: () => '#eee',
            paddingLeft: () => 6, paddingRight: () => 6, paddingTop: () => 4, paddingBottom: () => 4
          },
          margin: [0, 0, 0, 20]
        } : { text: 'Nenhuma OS paga no período', fontSize: 10, italics: true, color: '#999', margin: [0, 0, 0, 20] },

        // Movimentações do caixa
        { text: `MOVIMENTAÇÕES DO CAIXA (${movs.length})`, fontSize: 10, bold: true, color: '#333', margin: [0, 0, 0, 6] },
        movs.length ? {
          table: {
            headerRows: 1,
            widths: [50, 70, '*', 70],
            body: [
              [
                { text: 'Tipo', fontSize: 9, bold: true, color: '#666' },
                { text: 'Categoria', fontSize: 9, bold: true, color: '#666' },
                { text: 'Descrição', fontSize: 9, bold: true, color: '#666' },
                { text: 'Valor', fontSize: 9, bold: true, color: '#666', alignment: 'right' }
              ],
              ...movs.map(m => [
                { text: m.tipo === 'entrada' ? 'Entrada' : 'Saída', fontSize: 9, color: m.tipo === 'entrada' ? '#3fb950' : '#f85149', bold: true },
                { text: FINANCEIRO._catLabel(m.categoria), fontSize: 9 },
                { text: m.descricao || '-', fontSize: 9 },
                { text: (m.tipo === 'saida' ? '- ' : '') + fmt(m.valor), fontSize: 9, bold: true, color: m.tipo === 'entrada' ? '#3fb950' : '#f85149', alignment: 'right' }
              ])
            ]
          },
          layout: {
            hLineWidth: (i, node) => (i === 0 || i === 1 || i === node.table.body.length) ? 0.5 : 0.3,
            vLineWidth: () => 0.3, hLineColor: () => '#ccc', vLineColor: () => '#eee',
            paddingLeft: () => 6, paddingRight: () => 6, paddingTop: () => 4, paddingBottom: () => 4
          },
          margin: [0, 0, 0, 14]
        } : { text: 'Nenhuma movimentação no período', fontSize: 10, italics: true, color: '#999' },
      ],
      footer: PDF_OS._footer(),
      styles: PDF_OS._styles()
    };

    const pdf = pdfMake.createPdf(doc);
    pdf.getBlob((blob) => {
      const url = URL.createObjectURL(blob);
      if (window.innerWidth <= 768) {
        const a = document.createElement('a'); a.href = url; a.download = 'financeiro-' + this._periodo + '.pdf'; a.click(); URL.revokeObjectURL(url);
      } else { window.open(url, '_blank'); }
    });
    } catch(e) { APP.toast('Erro ao gerar PDF: ' + e.message, 'error'); console.error(e); }
  }
};

document.addEventListener('pageLoad', (e) => {
  if (e.detail.page === 'financeiro') FINANCEIRO.carregar();
});
