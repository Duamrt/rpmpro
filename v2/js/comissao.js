// RPM Pro — Relatorio de Comissao
const COMISSAO = {
  _mes: null,
  _ano: null,

  async carregar() {
    const agora = new Date();
    if (!this._mes) this._mes = agora.getMonth() + 1;
    if (!this._ano) this._ano = agora.getFullYear();

    const container = document.getElementById('comissao-content');
    const oficina_id = APP.oficinaId;

    // Periodo
    const inicio = new Date(this._ano, this._mes - 1, 1).toISOString();
    const fim = new Date(this._ano, this._mes, 0, 23, 59, 59).toISOString();

    // Busca OS entregues no periodo
    const { data: ordens, error } = await db
      .from('ordens_servico')
      .select('id, numero, valor_total, valor_mao_obra, mecanico_id, data_entrega, profiles!ordens_servico_mecanico_id_fkey(nome, comissao_percent)')
      .eq('oficina_id', oficina_id)
      .eq('status', 'entregue')
      .gte('data_entrega', inicio)
      .lte('data_entrega', fim)
      .order('data_entrega');

    if (error) { APP.toast('Erro ao carregar comissoes', 'error'); return; }

    const lista = ordens || [];

    // Agrupa por mecanico
    const porMecanico = {};
    lista.forEach(os => {
      const mecId = os.mecanico_id || '_sem';
      if (!porMecanico[mecId]) {
        porMecanico[mecId] = {
          nome: os.profiles?.nome || 'Sem mecanico',
          comissao_percent: os.profiles?.comissao_percent || 0,
          ordens: []
        };
      }
      porMecanico[mecId].ordens.push(os);
    });

    const mecanicos = Object.values(porMecanico);
    let totalGeralOS = 0;
    let totalGeralComissao = 0;

    const meses = ['Janeiro','Fevereiro','Marco','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];

    container.innerHTML = `
      <div style="display:flex;gap:12px;align-items:center;margin-bottom:20px;flex-wrap:wrap;">
        <select class="form-control" id="com-mes" onchange="COMISSAO._mes=parseInt(this.value);COMISSAO.carregar()" style="max-width:160px;">
          ${meses.map((m, i) => `<option value="${i + 1}" ${i + 1 === this._mes ? 'selected' : ''}>${m}</option>`).join('')}
        </select>
        <select class="form-control" id="com-ano" onchange="COMISSAO._ano=parseInt(this.value);COMISSAO.carregar()" style="max-width:100px;">
          ${[this._ano - 1, this._ano, this._ano + 1].map(a => `<option value="${a}" ${a === this._ano ? 'selected' : ''}>${a}</option>`).join('')}
        </select>
        <span style="font-size:13px;color:var(--text-secondary);">${lista.length} OS entregues no periodo</span>
        <button class="btn btn-secondary btn-sm" onclick="COMISSAO.gerarPDF()" style="margin-left:auto;">Gerar PDF</button>
      </div>

      ${!mecanicos.length ? `
        <div class="empty-state">
          <div class="icon">💰</div>
          <h3>Nenhuma OS entregue nesse periodo</h3>
          <p>Selecione outro mes ou aguarde as entregas</p>
        </div>
      ` : (window.innerWidth <= 768 ? `
      <!-- Mobile: cards -->
      ${(() => { mecanicos.forEach(m => { const vt = m.ordens.reduce((s,o) => s + (o.valor_total||0), 0); const vc = vt * (m.comissao_percent/100); totalGeralOS += vt; totalGeralComissao += vc; m._vt = vt; m._vc = vc; }); return ''; })()}
      <div style="background:var(--bg-card);border:1px solid var(--border);border-radius:var(--radius-lg);padding:14px;margin-bottom:16px;display:flex;justify-content:space-between;align-items:center;">
        <div>
          <div style="font-size:12px;color:var(--text-muted);">Total OS</div>
          <div style="font-size:18px;font-weight:700;">${APP.formatMoney(totalGeralOS)}</div>
        </div>
        <div style="text-align:right;">
          <div style="font-size:11px;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.5px;">Total Comissao</div>
          <div style="font-size:22px;font-weight:800;font-family:var(--heading);color:var(--success);">${APP.formatMoney(totalGeralComissao)}</div>
        </div>
      </div>
      <div class="mobile-card-list">
        ${mecanicos.map(m => `
          <div class="mobile-card">
            <div class="mobile-card-header">
              <div>
                <div class="mobile-card-title">${esc(m.nome)}</div>
                <div class="mobile-card-subtitle">${m.ordens.length} OS · ${m.comissao_percent}% comissao</div>
              </div>
              <div style="text-align:right;">
                <div style="font-size:11px;color:var(--text-muted);">Comissao</div>
                <div style="font-size:16px;font-weight:700;color:var(--success);">${APP.formatMoney(m._vc)}</div>
              </div>
            </div>
            <div class="mobile-card-row">
              <span style="font-size:12px;color:var(--text-muted);">Total OS: ${APP.formatMoney(m._vt)}</span>
            </div>
          </div>
        `).join('')}
      </div>
      ` : `
      <!-- Desktop: tabela -->
      <table class="data-table">
        <thead>
          <tr>
            <th>Mecanico</th>
            <th style="text-align:center;">Qtd OS</th>
            <th style="text-align:right;">Valor Total OS</th>
            <th style="text-align:center;">Comissao %</th>
            <th style="text-align:right;">Valor Comissao</th>
          </tr>
        </thead>
        <tbody>
          ${mecanicos.map(m => {
            const valorTotal = m.ordens.reduce((s, o) => s + (o.valor_total || 0), 0);
            const valorComissao = valorTotal * (m.comissao_percent / 100);
            totalGeralOS += valorTotal;
            totalGeralComissao += valorComissao;
            return `
              <tr>
                <td><strong>${esc(m.nome)}</strong></td>
                <td style="text-align:center;">${m.ordens.length}</td>
                <td style="text-align:right;">${APP.formatMoney(valorTotal)}</td>
                <td style="text-align:center;">${m.comissao_percent}%</td>
                <td style="text-align:right;font-weight:700;color:var(--success);">${APP.formatMoney(valorComissao)}</td>
              </tr>`;
          }).join('')}
        </tbody>
        <tfoot>
          <tr style="border-top:2px solid var(--border);font-weight:700;">
            <td>TOTAL</td>
            <td style="text-align:center;">${lista.length}</td>
            <td style="text-align:right;">${APP.formatMoney(totalGeralOS)}</td>
            <td></td>
            <td style="text-align:right;color:var(--success);font-size:16px;">${APP.formatMoney(totalGeralComissao)}</td>
          </tr>
        </tfoot>
      </table>
      `)}
    `;

    // Guarda pra PDF
    this._dadosPDF = { mecanicos, totalGeralOS, totalGeralComissao, lista, mesNome: meses[this._mes - 1], ano: this._ano };
  },

  async gerarPDF() {
    if (!this._dadosPDF || !this._dadosPDF.mecanicos.length) {
      APP.toast('Nenhum dado pra gerar PDF', 'error');
      return;
    }

    const { mecanicos, totalGeralOS, totalGeralComissao, lista, mesNome, ano } = this._dadosPDF;
    const oficina = APP.oficina;

    const rows = mecanicos.map(m => {
      const valorTotal = m.ordens.reduce((s, o) => s + (o.valor_total || 0), 0);
      const valorComissao = valorTotal * (m.comissao_percent / 100);
      return [
        { text: m.nome, style: 'tableCell' },
        { text: String(m.ordens.length), style: 'tableCell', alignment: 'center' },
        { text: 'R$ ' + valorTotal.toFixed(2), style: 'tableCellRight' },
        { text: m.comissao_percent + '%', style: 'tableCell', alignment: 'center' },
        { text: 'R$ ' + valorComissao.toFixed(2), style: 'tableCellRight', bold: true }
      ];
    });

    const docDef = {
      pageSize: 'A4',
      pageMargins: [40, 30, 40, 50],
      content: [
        {
          columns: [
            { text: [{ text: 'RPM ', bold: true, color: '#D97706', fontSize: 22 }, { text: 'PRO', bold: true, fontSize: 22 }], width: 'auto' },
            {
              stack: [
                { text: oficina.nome || 'Oficina', fontSize: 14, bold: true, alignment: 'right' },
                oficina.cnpj ? { text: 'CNPJ: ' + oficina.cnpj, fontSize: 9, color: '#666666', alignment: 'right' } : {}
              ],
              alignment: 'right'
            }
          ],
          margin: [0, 0, 0, 8]
        },
        { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 1, lineColor: '#D97706' }], margin: [0, 0, 0, 15] },
        { text: 'RELATORIO DE COMISSAO', fontSize: 16, bold: true, alignment: 'center', margin: [0, 0, 0, 5] },
        { text: mesNome + ' / ' + ano, fontSize: 12, alignment: 'center', color: '#666666', margin: [0, 0, 0, 15] },
        { text: lista.length + ' OS entregues no periodo', fontSize: 10, color: '#999999', margin: [0, 0, 0, 12] },
        {
          table: {
            headerRows: 1,
            widths: ['*', 50, 85, 60, 85],
            body: [
              [
                { text: 'Mecanico', style: 'tableHeader' },
                { text: 'Qtd OS', style: 'tableHeader', alignment: 'center' },
                { text: 'Valor Total', style: 'tableHeader', alignment: 'right' },
                { text: 'Comissao', style: 'tableHeader', alignment: 'center' },
                { text: 'Valor Comissao', style: 'tableHeader', alignment: 'right' }
              ],
              ...rows,
              [
                { text: 'TOTAL', bold: true, fontSize: 11, fillColor: '#f5f5f5' },
                { text: String(lista.length), bold: true, fontSize: 11, alignment: 'center', fillColor: '#f5f5f5' },
                { text: 'R$ ' + totalGeralOS.toFixed(2), bold: true, fontSize: 11, alignment: 'right', fillColor: '#f5f5f5' },
                { text: '', fillColor: '#f5f5f5' },
                { text: 'R$ ' + totalGeralComissao.toFixed(2), bold: true, fontSize: 12, alignment: 'right', color: '#2e7d32', fillColor: '#f5f5f5' }
              ]
            ]
          },
          layout: {
            hLineWidth: (i, node) => (i === 0 || i === 1 || i === node.table.body.length) ? 0.5 : 0.3,
            vLineWidth: () => 0.5,
            hLineColor: () => '#cccccc',
            vLineColor: () => '#cccccc',
            paddingLeft: () => 6,
            paddingRight: () => 6,
            paddingTop: () => 4,
            paddingBottom: () => 4
          }
        }
      ],
      footer: {
        text: 'Documento gerado pelo RPM Pro — rpmpro.com.br',
        alignment: 'center',
        fontSize: 8,
        color: '#999999',
        margin: [40, 10, 40, 0]
      },
      styles: {
        tableHeader: { fontSize: 10, bold: true, color: '#333333', fillColor: '#f5f5f5' },
        tableCell: { fontSize: 10, color: '#333333' },
        tableCellRight: { fontSize: 10, color: '#333333', alignment: 'right' }
      }
    };

    pdfMake.createPdf(docDef).open();
  }
};

document.addEventListener('pageLoad', (e) => {
  if (e.detail.page === 'comissao') COMISSAO.carregar();
});
