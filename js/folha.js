// RPM Pro — Folha de Pagamento (automática)
const FOLHA = {
  _mes: null,
  _ano: null,

  async carregar() {
    const agora = new Date();
    if (!this._mes) this._mes = agora.getMonth() + 1;
    if (!this._ano) this._ano = agora.getFullYear();

    const container = document.getElementById('folha-content');
    const oficina_id = APP.oficinaId;

    const inicio = `${this._ano}-${String(this._mes).padStart(2, '0')}-01`;
    const ultimoDia = new Date(this._ano, this._mes, 0).getDate();
    const fim = `${this._ano}-${String(this._mes).padStart(2, '0')}-${ultimoDia}`;

    // Busca tudo em paralelo
    const [membrosRes, osRes, valesRes] = await Promise.all([
      db.from('profiles')
        .select('id, nome, role, salario_base, comissao_percent, vale_refeicao')
        .eq('oficina_id', oficina_id)
        .eq('ativo', true)
        .in('role', ['mecanico', 'aux_mecanico', 'gerente', 'atendente', 'aux_admin'])
        .order('nome'),
      db.from('ordens_servico')
        .select('id, valor_total, mecanico_id')
        .eq('oficina_id', oficina_id)
        .eq('status', 'entregue')
        .gte('data_entrega', inicio)
        .lte('data_entrega', fim),
      db.from('caixa')
        .select('id, membro_id, valor, descricao, created_at')
        .eq('oficina_id', oficina_id)
        .eq('tipo', 'saida')
        .eq('categoria', 'vale')
        .gte('created_at', inicio)
        .lte('created_at', fim + 'T23:59:59')
    ]);

    const membros = membrosRes.data || [];
    const ordens = osRes.data || [];
    const vales = valesRes.data || [];

    // Faturamento por mecânico
    const faturadoPor = {};
    ordens.forEach(os => {
      if (os.mecanico_id) faturadoPor[os.mecanico_id] = (faturadoPor[os.mecanico_id] || 0) + (os.valor_total || 0);
    });

    // Vales por membro
    const valesPor = {};
    vales.forEach(v => {
      if (v.membro_id) {
        if (!valesPor[v.membro_id]) valesPor[v.membro_id] = [];
        valesPor[v.membro_id].push(v);
      }
    });

    const meses = ['Janeiro','Fevereiro','Marco','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
    const roleLabel = { mecanico: 'Mecânico', aux_mecanico: 'Aux. Mecânico', gerente: 'Gerente', atendente: 'Atendente', aux_admin: 'Aux. Admin' };

    // Monta dados
    let totalSalarios = 0, totalComissoes = 0, totalVales = 0, totalVR = 0, totalLiquido = 0;

    const linhas = membros.map(m => {
      const salario = m.salario_base || 0;
      const vr = m.vale_refeicao || 0;
      const faturado = faturadoPor[m.id] || 0;
      const comissao = faturado * (m.comissao_percent || 0) / 100;
      const mVales = valesPor[m.id] || [];
      const totalVale = mVales.reduce((s, v) => s + (v.valor || 0), 0);
      const liquido = salario + vr + comissao - totalVale;

      totalSalarios += salario;
      totalVR += vr;
      totalComissoes += comissao;
      totalVales += totalVale;
      totalLiquido += liquido;

      return { m, salario, vr, faturado, comissao, vales: mVales, totalVale, liquido };
    });

    const _mob = window.innerWidth <= 768;

    container.innerHTML = `
      <!-- Filtro mês -->
      <div style="display:flex;gap:12px;align-items:center;margin-bottom:20px;flex-wrap:wrap;">
        <select class="form-control" onchange="FOLHA._mes=parseInt(this.value);FOLHA.carregar()" style="max-width:160px;">
          ${meses.map((m, i) => `<option value="${i + 1}" ${i + 1 === this._mes ? 'selected' : ''}>${m}</option>`).join('')}
        </select>
        <select class="form-control" onchange="FOLHA._ano=parseInt(this.value);FOLHA.carregar()" style="max-width:100px;">
          ${[this._ano - 1, this._ano, this._ano + 1].map(a => `<option value="${a}" ${a === this._ano ? 'selected' : ''}>${a}</option>`).join('')}
        </select>
        <span style="font-size:13px;color:var(--text-secondary);">${membros.length} funcionarios · ${ordens.length} OS entregues</span>
      </div>

      <!-- Resumo -->
      <div class="kpi-grid" style="margin-bottom:24px;">
        <div class="kpi-card">
          <div class="label">Salarios</div>
          <div class="value primary">${APP.formatMoney(totalSalarios)}</div>
        </div>
        <div class="kpi-card">
          <div class="label">Vale Refeicao</div>
          <div class="value" style="color:var(--text-secondary);">${APP.formatMoney(totalVR)}</div>
        </div>
        <div class="kpi-card">
          <div class="label">Comissoes</div>
          <div class="value success">${APP.formatMoney(totalComissoes)}</div>
        </div>
        <div class="kpi-card">
          <div class="label">Vales/Adiant.</div>
          <div class="value" style="color:var(--danger);">${APP.formatMoney(totalVales)}</div>
        </div>
        <div class="kpi-card">
          <div class="label">Liquido a Pagar</div>
          <div class="value" style="color:var(--warning);font-size:22px;">${APP.formatMoney(totalLiquido)}</div>
        </div>
      </div>

      ${!linhas.length ? `
        <div class="empty-state">
          <div class="icon">📄</div>
          <h3>Nenhum funcionario ativo</h3>
          <p>Cadastre membros na aba Equipe</p>
        </div>
      ` : `
      <!-- Cards por funcionário -->
      <div style="display:flex;flex-direction:column;gap:16px;">
        ${linhas.map(l => `
          <div style="background:var(--bg-card);border:1px solid var(--border);border-radius:var(--radius-lg);padding:20px;">
            <!-- Cabeçalho -->
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
              <div>
                <div style="font-weight:700;font-size:16px;">${esc(l.m.nome)}</div>
                <span style="font-size:12px;color:var(--text-secondary);">${esc(roleLabel[l.m.role] || l.m.role)}</span>
              </div>
              <div style="text-align:right;">
                <div style="font-size:11px;color:var(--text-secondary);">A pagar</div>
                <div style="font-size:24px;font-weight:800;color:${l.liquido >= 0 ? 'var(--success)' : 'var(--danger)'};">${APP.formatMoney(l.liquido)}</div>
              </div>
            </div>

            <!-- Linha de valores -->
            <div style="display:grid;grid-template-columns:${_mob ? '1fr 1fr' : 'repeat(5, 1fr)'};gap:12px;padding:12px;background:var(--bg-input);border-radius:var(--radius);">
              <div>
                <div style="font-size:11px;color:var(--text-secondary);">Salario fixo</div>
                <div style="font-size:15px;font-weight:600;">${APP.formatMoney(l.salario)}</div>
              </div>
              <div>
                <div style="font-size:11px;color:var(--text-secondary);">Vale Refeicao</div>
                <div style="font-size:15px;font-weight:600;">${l.vr > 0 ? '+' + APP.formatMoney(l.vr) : '-'}</div>
              </div>
              <div>
                <div style="font-size:11px;color:var(--text-secondary);">Comissao (${l.m.comissao_percent || 0}%)</div>
                <div style="font-size:15px;font-weight:600;color:var(--success);">+${APP.formatMoney(l.comissao)}</div>
                ${l.faturado > 0 ? `<div style="font-size:10px;color:var(--text-muted);">de ${APP.formatMoney(l.faturado)} faturado</div>` : ''}
              </div>
              <div>
                <div style="font-size:11px;color:var(--text-secondary);">Vales/Adiant.</div>
                <div style="font-size:15px;font-weight:600;color:${l.totalVale > 0 ? 'var(--danger)' : 'var(--text-muted)'};">${l.totalVale > 0 ? '-' : ''}${APP.formatMoney(l.totalVale)}</div>
              </div>
              <div>
                <div style="font-size:11px;color:var(--text-secondary);">= Liquido</div>
                <div style="font-size:15px;font-weight:700;color:${l.liquido >= 0 ? 'var(--success)' : 'var(--danger)'};">${APP.formatMoney(l.liquido)}</div>
              </div>
            </div>

            ${l.vales.length ? `
            <!-- Detalhes dos vales -->
            <div style="margin-top:10px;padding:8px 12px;background:var(--bg-input);border-radius:var(--radius);border-left:3px solid var(--danger);">
              <div style="font-size:11px;color:var(--text-secondary);margin-bottom:4px;">Vales no mês:</div>
              ${l.vales.map(v => `
                <div style="display:flex;justify-content:space-between;font-size:12px;padding:2px 0;">
                  <span>${APP.formatDate(v.created_at)} — ${esc(v.descricao || 'Vale')}</span>
                  <span style="color:var(--danger);font-weight:600;">-${APP.formatMoney(v.valor)}</span>
                </div>
              `).join('')}
            </div>` : ''}
          </div>
        `).join('')}
      </div>

      <div style="margin-top:20px;display:flex;gap:8px;">
        <button class="btn btn-secondary" onclick="FOLHA.gerarPDF()">Gerar PDF Folha</button>
        <button class="btn btn-primary" onclick="FINANCEIRO._aba='despesas';APP.loadPage('financeiro')">Registrar Vale</button>
      </div>
      `}
    `;
  },

  async gerarPDF() {
    try {
      await PDF_OS._carregarLogo();
      const oficina = APP.oficina || {};
      const meses = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
      const fmt = v => (v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

      const inicio = `${this._ano}-${String(this._mes).padStart(2, '0')}-01`;
      const ultimoDia = new Date(this._ano, this._mes, 0).getDate();
      const fim = `${this._ano}-${String(this._mes).padStart(2, '0')}-${ultimoDia}`;

      const [membrosRes, osRes, valesRes] = await Promise.all([
        db.from('profiles').select('id, nome, role, salario_base, comissao_percent, vale_refeicao')
          .eq('oficina_id', APP.oficinaId).eq('ativo', true)
          .in('role', ['mecanico','aux_mecanico','gerente','atendente','aux_admin']).order('nome'),
        db.from('ordens_servico').select('valor_total, mecanico_id')
          .eq('oficina_id', APP.oficinaId).eq('status', 'entregue')
          .gte('data_entrega', inicio).lte('data_entrega', fim),
        db.from('caixa').select('membro_id, valor')
          .eq('oficina_id', APP.oficinaId).eq('tipo', 'saida').eq('categoria', 'vale')
          .gte('created_at', inicio).lte('created_at', fim + 'T23:59:59')
      ]);

      const membros = membrosRes.data || [];
      const ordens = osRes.data || [];
      const vales = valesRes.data || [];

      if (!membros.length) { APP.toast('Nenhum funcionario', 'error'); return; }

      const faturadoPor = {};
      ordens.forEach(os => { if (os.mecanico_id) faturadoPor[os.mecanico_id] = (faturadoPor[os.mecanico_id] || 0) + (os.valor_total || 0); });
      const valePor = {};
      vales.forEach(v => { if (v.membro_id) valePor[v.membro_id] = (valePor[v.membro_id] || 0) + (v.valor || 0); });

      const roleLabel = { mecanico: 'Mec.', aux_mecanico: 'Aux.', gerente: 'Ger.', atendente: 'Atend.', aux_admin: 'Adm.' };
      let totalLiq = 0;

      const rows = membros.map(m => {
        const sal = m.salario_base || 0;
        const vr = m.vale_refeicao || 0;
        const fat = faturadoPor[m.id] || 0;
        const com = fat * (m.comissao_percent || 0) / 100;
        const vale = valePor[m.id] || 0;
        const liq = sal + vr + com - vale;
        totalLiq += liq;
        return [
          { text: m.nome + ' (' + (roleLabel[m.role] || m.role) + ')', fontSize: 9 },
          { text: fmt(sal), fontSize: 9, alignment: 'right' },
          { text: vr > 0 ? fmt(vr) : '-', fontSize: 9, alignment: 'right' },
          { text: fmt(com), fontSize: 9, alignment: 'right', color: '#3fb950' },
          { text: vale > 0 ? '-' + fmt(vale) : '-', fontSize: 9, alignment: 'right', color: '#f85149' },
          { text: fmt(liq), fontSize: 10, bold: true, alignment: 'right' }
        ];
      });

      const header = PDF_OS._montarHeader(oficina, 'FOLHA DE PAGAMENTO');
      const doc = {
        pageSize: 'A4', pageMargins: [40, 30, 40, 50],
        content: [
          ...header.filter(h => h && (h.text || h.columns || h.canvas)),
          { text: `${meses[this._mes - 1]} ${this._ano}`, fontSize: 12, alignment: 'center', color: '#666', margin: [0, 0, 0, 16] },
          {
            table: {
              headerRows: 1,
              widths: ['*', 60, 50, 60, 60, 70],
              body: [
                ['Funcionario', 'Salario', 'VR', 'Comissao', 'Vales', 'Liquido'].map(t => ({ text: t, fontSize: 9, bold: true, color: '#666', fillColor: '#f5f5f5' })),
                ...rows,
                [
                  { text: 'TOTAL A PAGAR', bold: true, fontSize: 10, fillColor: '#f5f5f5' },
                  { text: '', fillColor: '#f5f5f5' },
                  { text: '', fillColor: '#f5f5f5' },
                  { text: '', fillColor: '#f5f5f5' },
                  { text: '', fillColor: '#f5f5f5' },
                  { text: fmt(totalLiq), bold: true, fontSize: 12, alignment: 'right', fillColor: '#f5f5f5', color: '#D97706' }
                ]
              ]
            },
            layout: {
              hLineWidth: (i, node) => (i <= 1 || i === node.table.body.length) ? 0.5 : 0.3,
              vLineWidth: () => 0.3, hLineColor: () => '#ccc', vLineColor: () => '#eee',
              paddingLeft: () => 6, paddingRight: () => 6, paddingTop: () => 4, paddingBottom: () => 4
            }
          }
        ],
        footer: PDF_OS._footer(),
        styles: PDF_OS._styles()
      };

      pdfMake.createPdf(doc).open();
    } catch (e) { APP.toast('Erro: ' + e.message, 'error'); console.error(e); }
  }
};

document.addEventListener('pageLoad', (e) => {
  if (e.detail.page === 'folha') FOLHA.carregar();
});
