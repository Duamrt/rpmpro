// RPM Pro — Folha de Pagamento
const FOLHA = {
  _mes: null,
  _ano: null,
  _quinzena: 1, // 1 ou 2

  async carregar() {
    const agora = new Date();
    if (!this._mes) this._mes = agora.getMonth() + 1;
    if (!this._ano) this._ano = agora.getFullYear();

    const container = document.getElementById('folha-content');
    const oficina_id = APP.oficinaId;

    // Periodo da quinzena
    const periodo = this._getPeriodo();

    // Busca membros e folha existente em paralelo
    const [membrosRes, folhaRes, osRes] = await Promise.all([
      db.from('profiles')
        .select('id, nome, role, salario_base, comissao_percent, ativo')
        .eq('oficina_id', oficina_id)
        .in('role', ['mecanico', 'aux_mecanico', 'gerente', 'atendente', 'aux_admin'])
        .eq('ativo', true)
        .order('nome'),
      db.from('folha_pagamento')
        .select('*')
        .eq('oficina_id', oficina_id)
        .eq('periodo', periodo),
      // OS entregues no mês (pra calcular comissão)
      db.from('ordens_servico')
        .select('id, valor_total, mecanico_id, data_entrega')
        .eq('oficina_id', oficina_id)
        .eq('status', 'entregue')
        .gte('data_entrega', `${this._ano}-${String(this._mes).padStart(2, '0')}-01`)
        .lte('data_entrega', `${this._ano}-${String(this._mes).padStart(2, '0')}-${new Date(this._ano, this._mes, 0).getDate()}`)
    ]);

    const membros = membrosRes.data || [];
    const folhaExistente = folhaRes.data || [];
    const ordens = osRes.data || [];

    // Mapa de comissões por mecânico
    const comissaoPorMec = {};
    ordens.forEach(os => {
      if (os.mecanico_id) {
        comissaoPorMec[os.mecanico_id] = (comissaoPorMec[os.mecanico_id] || 0) + (os.valor_total || 0);
      }
    });

    // Monta dados: merge folha existente com membros
    const folhaMapa = {};
    folhaExistente.forEach(f => { folhaMapa[f.membro_id] = f; });

    const meses = ['Janeiro','Fevereiro','Marco','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
    const roleLabel = { mecanico: 'Mecânico', aux_mecanico: 'Aux. Mecânico', gerente: 'Gerente', atendente: 'Atendente', aux_admin: 'Aux. Admin' };

    // Totais
    let totalBruto = 0, totalDescontos = 0, totalLiquido = 0;
    const linhas = membros.map(m => {
      const f = folhaMapa[m.id];
      const salario = f ? f.salario : (m.salario_base || 0);
      const faturadoMec = comissaoPorMec[m.id] || 0;
      const comissao = f ? f.comissao : (faturadoMec * (m.comissao_percent || 0) / 100);
      const horas_extra = f ? f.horas_extra : 0;
      const vale_transporte = f ? f.vale_transporte : 0;
      const vale_alimentacao = f ? f.vale_alimentacao : 0;
      const adiantamento = f ? f.adiantamento : 0;
      const outros_descontos = f ? f.outros_descontos : 0;
      const bruto = salario + comissao + horas_extra;
      const descontos = vale_transporte + vale_alimentacao + adiantamento + outros_descontos;
      const liquido = bruto - descontos;

      totalBruto += bruto;
      totalDescontos += descontos;
      totalLiquido += liquido;

      return { membro: m, f, salario, comissao, horas_extra, vale_transporte, vale_alimentacao, adiantamento, outros_descontos, bruto, descontos, liquido, faturadoMec };
    });

    const _mob = window.innerWidth <= 768;

    container.innerHTML = `
      <!-- Filtro -->
      <div style="display:flex;gap:12px;align-items:center;margin-bottom:20px;flex-wrap:wrap;">
        <select class="form-control" id="folha-mes" onchange="FOLHA._mes=parseInt(this.value);FOLHA.carregar()" style="max-width:160px;">
          ${meses.map((m, i) => `<option value="${i + 1}" ${i + 1 === this._mes ? 'selected' : ''}>${m}</option>`).join('')}
        </select>
        <select class="form-control" id="folha-ano" onchange="FOLHA._ano=parseInt(this.value);FOLHA.carregar()" style="max-width:100px;">
          ${[this._ano - 1, this._ano, this._ano + 1].map(a => `<option value="${a}" ${a === this._ano ? 'selected' : ''}>${a}</option>`).join('')}
        </select>
        <div style="display:flex;gap:6px;">
          <button class="btn ${this._quinzena === 1 ? 'btn-primary' : 'btn-secondary'} btn-sm" onclick="FOLHA._quinzena=1;FOLHA.carregar()">1a Quinzena</button>
          <button class="btn ${this._quinzena === 2 ? 'btn-primary' : 'btn-secondary'} btn-sm" onclick="FOLHA._quinzena=2;FOLHA.carregar()">2a Quinzena</button>
        </div>
        <span style="font-size:13px;color:var(--text-secondary);">${membros.length} membros</span>
      </div>

      <!-- KPIs -->
      <div class="kpi-grid" style="margin-bottom:20px;">
        <div class="kpi-card">
          <div class="label">Total Bruto</div>
          <div class="value primary">${APP.formatMoney(totalBruto)}</div>
        </div>
        <div class="kpi-card">
          <div class="label">Descontos</div>
          <div class="value" style="color:var(--danger);">${APP.formatMoney(totalDescontos)}</div>
        </div>
        <div class="kpi-card">
          <div class="label">Liquido a Pagar</div>
          <div class="value success">${APP.formatMoney(totalLiquido)}</div>
        </div>
        <div class="kpi-card">
          <div class="label">Funcionarios</div>
          <div class="value primary">${membros.length}</div>
        </div>
      </div>

      <!-- Lista de membros -->
      ${!linhas.length ? `
        <div class="empty-state">
          <div class="icon">📄</div>
          <h3>Nenhum funcionario ativo</h3>
          <p>Cadastre membros na aba Equipe primeiro</p>
        </div>
      ` : `
      <div style="display:flex;flex-direction:column;gap:12px;">
        ${linhas.map(l => `
          <div style="background:var(--bg-card);border:1px solid var(--border);border-radius:var(--radius-lg);padding:16px 20px;">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
              <div>
                <div style="font-weight:700;font-size:15px;">${esc(l.membro.nome)}</div>
                <span class="badge badge-orcamento" style="font-size:11px;">${esc(roleLabel[l.membro.role] || l.membro.role)}</span>
              </div>
              <div style="text-align:right;">
                <div style="font-size:11px;color:var(--text-secondary);">Liquido</div>
                <div style="font-size:20px;font-weight:800;color:var(--success);">${APP.formatMoney(l.liquido)}</div>
              </div>
            </div>
            <div style="display:grid;grid-template-columns:${_mob ? '1fr 1fr' : 'repeat(4, 1fr)'};gap:8px;font-size:13px;">
              <div>
                <span style="color:var(--text-secondary);">Salario:</span>
                <strong>${APP.formatMoney(l.salario)}</strong>
              </div>
              <div>
                <span style="color:var(--text-secondary);">Comissao:</span>
                <strong style="color:var(--success);">${APP.formatMoney(l.comissao)}</strong>
                ${l.faturadoMec > 0 ? `<span style="font-size:11px;color:var(--text-muted);">(${l.membro.comissao_percent || 0}% de ${APP.formatMoney(l.faturadoMec)})</span>` : ''}
              </div>
              <div>
                <span style="color:var(--text-secondary);">H.Extra:</span>
                <strong>${APP.formatMoney(l.horas_extra)}</strong>
              </div>
              <div>
                <span style="color:var(--text-secondary);">Descontos:</span>
                <strong style="color:var(--danger);">${APP.formatMoney(l.descontos)}</strong>
              </div>
            </div>
            <div style="margin-top:10px;display:flex;gap:8px;">
              <button class="btn btn-primary btn-sm" onclick="FOLHA.editar('${l.membro.id}', '${escAttr(l.membro.nome)}')">Editar</button>
              ${l.f ? '<span style="font-size:11px;color:var(--success);align-self:center;">✅ Salvo</span>' : '<span style="font-size:11px;color:var(--warning);align-self:center;">Pendente</span>'}
            </div>
          </div>
        `).join('')}
      </div>

      <div style="margin-top:16px;display:flex;gap:8px;">
        <button class="btn btn-secondary" onclick="FOLHA.gerarPDF()">Gerar PDF Folha</button>
      </div>
      `}
    `;
  },

  _getPeriodo() {
    const dia = this._quinzena === 1 ? '01' : '16';
    return `${this._ano}-${String(this._mes).padStart(2, '0')}-${dia}`;
  },

  async editar(membroId, nome) {
    const periodo = this._getPeriodo();
    const oficina_id = APP.oficinaId;

    // Busca folha existente ou membro pra defaults
    const [folhaRes, membroRes] = await Promise.all([
      db.from('folha_pagamento')
        .select('*')
        .eq('oficina_id', oficina_id)
        .eq('membro_id', membroId)
        .eq('periodo', periodo)
        .maybeSingle(),
      db.from('profiles')
        .select('salario_base, comissao_percent')
        .eq('id', membroId)
        .single()
    ]);

    const f = folhaRes.data;
    const m = membroRes.data || {};

    // Calcula comissão do mês
    const inicio = `${this._ano}-${String(this._mes).padStart(2, '0')}-01`;
    const fim = `${this._ano}-${String(this._mes).padStart(2, '0')}-${new Date(this._ano, this._mes, 0).getDate()}`;
    const { data: oss } = await db.from('ordens_servico')
      .select('valor_total')
      .eq('oficina_id', oficina_id)
      .eq('status', 'entregue')
      .eq('mecanico_id', membroId)
      .gte('data_entrega', inicio)
      .lte('data_entrega', fim);

    const faturado = (oss || []).reduce((s, o) => s + (o.valor_total || 0), 0);
    const comissaoCalc = faturado * (m.comissao_percent || 0) / 100;

    openModal(`
      <div class="modal-header">
        <h3>Folha — ${esc(nome)}</h3>
        <button class="modal-close" onclick="closeModal()">&times;</button>
      </div>
      <div class="modal-body">
        <form onsubmit="FOLHA.salvar(event, '${membroId}')">
          <div style="background:var(--bg-input);padding:10px 14px;border-radius:var(--radius);margin-bottom:16px;font-size:13px;color:var(--text-secondary);">
            Faturou <strong style="color:var(--success);">${APP.formatMoney(faturado)}</strong> no mes · Comissao sugerida (${m.comissao_percent || 0}%): <strong>${APP.formatMoney(comissaoCalc)}</strong>
          </div>

          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
            <div class="form-group">
              <label>Salario base (R$)</label>
              <input type="number" class="form-control" id="folha-salario" value="${f ? f.salario : (m.salario_base || 0)}" min="0" step="0.01">
            </div>
            <div class="form-group">
              <label>Comissao (R$)</label>
              <input type="number" class="form-control" id="folha-comissao" value="${f ? f.comissao : comissaoCalc.toFixed(2)}" min="0" step="0.01">
            </div>
            <div class="form-group">
              <label>Horas extra (R$)</label>
              <input type="number" class="form-control" id="folha-horas" value="${f ? f.horas_extra : 0}" min="0" step="0.01">
            </div>
            <div class="form-group">
              <label>Vale transporte (R$)</label>
              <input type="number" class="form-control" id="folha-vt" value="${f ? f.vale_transporte : 0}" min="0" step="0.01">
            </div>
            <div class="form-group">
              <label>Vale alimentacao (R$)</label>
              <input type="number" class="form-control" id="folha-va" value="${f ? f.vale_alimentacao : 0}" min="0" step="0.01">
            </div>
            <div class="form-group">
              <label>Adiantamento (R$)</label>
              <input type="number" class="form-control" id="folha-adiant" value="${f ? f.adiantamento : 0}" min="0" step="0.01">
            </div>
            <div class="form-group">
              <label>Outros descontos (R$)</label>
              <input type="number" class="form-control" id="folha-outros" value="${f ? f.outros_descontos : 0}" min="0" step="0.01">
            </div>
            <div class="form-group">
              <label>Descricao do desconto</label>
              <input type="text" class="form-control" id="folha-outros-desc" value="${esc(f?.outros_desc_descricao || '')}" placeholder="Ex: Ferramenta quebrada">
            </div>
          </div>

          <div class="form-group">
            <label>Observacoes</label>
            <textarea class="form-control" id="folha-obs" rows="2">${esc(f?.observacoes || '')}</textarea>
          </div>

          <div id="folha-preview" style="margin-top:12px;padding:12px;background:var(--bg-input);border-radius:var(--radius);"></div>

          <div class="modal-footer" style="padding:16px 0 0;border:0;">
            <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancelar</button>
            <button type="submit" class="btn btn-primary">Salvar</button>
          </div>
        </form>
      </div>
    `);

    // Preview dinâmico
    const calcPreview = () => {
      const s = parseFloat(document.getElementById('folha-salario').value) || 0;
      const c = parseFloat(document.getElementById('folha-comissao').value) || 0;
      const h = parseFloat(document.getElementById('folha-horas').value) || 0;
      const vt = parseFloat(document.getElementById('folha-vt').value) || 0;
      const va = parseFloat(document.getElementById('folha-va').value) || 0;
      const ad = parseFloat(document.getElementById('folha-adiant').value) || 0;
      const ou = parseFloat(document.getElementById('folha-outros').value) || 0;
      const bruto = s + c + h;
      const desc = vt + va + ad + ou;
      const liq = bruto - desc;
      document.getElementById('folha-preview').innerHTML = `
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;text-align:center;">
          <div><div style="font-size:11px;color:var(--text-secondary);">Bruto</div><div style="font-size:18px;font-weight:700;">${APP.formatMoney(bruto)}</div></div>
          <div><div style="font-size:11px;color:var(--text-secondary);">Descontos</div><div style="font-size:18px;font-weight:700;color:var(--danger);">${APP.formatMoney(desc)}</div></div>
          <div><div style="font-size:11px;color:var(--text-secondary);">Liquido</div><div style="font-size:18px;font-weight:800;color:var(--success);">${APP.formatMoney(liq)}</div></div>
        </div>
      `;
    };

    ['folha-salario','folha-comissao','folha-horas','folha-vt','folha-va','folha-adiant','folha-outros'].forEach(id => {
      document.getElementById(id)?.addEventListener('input', calcPreview);
    });
    calcPreview();
  },

  async salvar(e, membroId) {
    e.preventDefault();
    const periodo = this._getPeriodo();
    const oficina_id = APP.oficinaId;

    const salario = parseFloat(document.getElementById('folha-salario').value) || 0;
    const comissao = parseFloat(document.getElementById('folha-comissao').value) || 0;
    const horas_extra = parseFloat(document.getElementById('folha-horas').value) || 0;
    const vale_transporte = parseFloat(document.getElementById('folha-vt').value) || 0;
    const vale_alimentacao = parseFloat(document.getElementById('folha-va').value) || 0;
    const adiantamento = parseFloat(document.getElementById('folha-adiant').value) || 0;
    const outros_descontos = parseFloat(document.getElementById('folha-outros').value) || 0;
    const outros_desc_descricao = document.getElementById('folha-outros-desc').value.trim();
    const observacoes = document.getElementById('folha-obs').value.trim();

    const total_bruto = salario + comissao + horas_extra;
    const total_descontos = vale_transporte + vale_alimentacao + adiantamento + outros_descontos;
    const total_liquido = total_bruto - total_descontos;

    const dados = {
      oficina_id, membro_id: membroId, periodo,
      salario, comissao, horas_extra,
      vale_transporte, vale_alimentacao, adiantamento,
      outros_descontos, outros_desc_descricao,
      total_bruto, total_descontos, total_liquido,
      observacoes, updated_at: new Date().toISOString()
    };

    // Verifica se já existe
    const { data: existente } = await db.from('folha_pagamento')
      .select('id')
      .eq('oficina_id', oficina_id)
      .eq('membro_id', membroId)
      .eq('periodo', periodo)
      .maybeSingle();

    if (existente) {
      const { error } = await db.from('folha_pagamento').update(dados).eq('id', existente.id);
      if (error) { APP.toast('Erro: ' + error.message, 'error'); return; }
    } else {
      const { error } = await db.from('folha_pagamento').insert(dados);
      if (error) { APP.toast('Erro: ' + error.message, 'error'); return; }
    }

    // Atualiza salario_base no perfil
    await db.from('profiles').update({ salario_base: salario }).eq('id', membroId);

    closeModal();
    APP.toast('Folha salva');
    this.carregar();
  },

  async gerarPDF() {
    try {
      await PDF_OS._carregarLogo();
      const oficina = APP.oficina || {};
      const periodo = this._getPeriodo();
      const meses = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];

      const { data: folhas } = await db.from('folha_pagamento')
        .select('*, profiles(nome, role)')
        .eq('oficina_id', APP.oficinaId)
        .eq('periodo', periodo)
        .order('created_at');

      const lista = folhas || [];
      if (!lista.length) { APP.toast('Nenhuma folha salva nesta quinzena', 'error'); return; }

      const totalLiq = lista.reduce((s, f) => s + (f.total_liquido || 0), 0);
      const totalBruto = lista.reduce((s, f) => s + (f.total_bruto || 0), 0);
      const roleLabel = { mecanico: 'Mecânico', aux_mecanico: 'Aux.Mec', gerente: 'Gerente', atendente: 'Atendente', aux_admin: 'Aux.Admin' };
      const fmt = v => (v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
      const header = PDF_OS._montarHeader(oficina, 'FOLHA DE PAGAMENTO');

      const doc = {
        pageSize: 'A4',
        pageMargins: [40, 30, 40, 50],
        content: [
          ...header.filter(h => h && (h.text || h.columns || h.canvas)),
          { text: `${meses[this._mes - 1]} ${this._ano} — ${this._quinzena}ª Quinzena`, fontSize: 12, alignment: 'center', color: '#666', margin: [0, 0, 0, 16] },
          {
            table: {
              headerRows: 1,
              widths: ['*', 55, 55, 45, 45, 60],
              body: [
                ['Funcionário', 'Salário', 'Comissão', 'H.Extra', 'Descontos', 'Líquido'].map(t => ({ text: t, fontSize: 9, bold: true, color: '#666', fillColor: '#f5f5f5' })),
                ...lista.map(f => [
                  { text: (f.profiles?.nome || '-') + '\n' + (roleLabel[f.profiles?.role] || ''), fontSize: 9 },
                  { text: fmt(f.salario), fontSize: 9 },
                  { text: fmt(f.comissao), fontSize: 9, color: '#3fb950' },
                  { text: fmt(f.horas_extra), fontSize: 9 },
                  { text: fmt(f.total_descontos), fontSize: 9, color: '#f85149' },
                  { text: fmt(f.total_liquido), fontSize: 10, bold: true }
                ]),
                [
                  { text: 'TOTAL', bold: true, fontSize: 10, fillColor: '#f5f5f5' },
                  { text: '', fillColor: '#f5f5f5' },
                  { text: '', fillColor: '#f5f5f5' },
                  { text: '', fillColor: '#f5f5f5' },
                  { text: '', fillColor: '#f5f5f5' },
                  { text: fmt(totalLiq), bold: true, fontSize: 11, fillColor: '#f5f5f5', color: '#2e7d32' }
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
