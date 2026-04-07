// RPM Pro — Peças / Estoque
const PECAS = {
  async carregar() {
    // Pagina em lotes de 1000 (limite do Supabase)
    let todas = [], from = 0;
    while (true) {
      const { data, error } = await db.from('pecas').select('*')
        .eq('oficina_id', APP.oficinaId).order('nome')
        .range(from, from + 999);
      if (error) { APP.toast('Erro ao carregar peças', 'error'); return; }
      todas = todas.concat(data || []);
      if (!data || data.length < 1000) break;
      from += 1000;
    }
    this.render(todas);
  },

  render(lista) {
    const container = document.getElementById('pecas-lista');
    if (!lista.length) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="icon">📦</div>
          <h3>Nenhuma peca cadastrada</h3>
          <p>Clique em "+ Nova Peca" para comecar</p>
        </div>`;
      return;
    }

    this._lista = lista;
    container.innerHTML = `
      <div style="display:flex;gap:12px;margin-bottom:12px;flex-wrap:wrap;align-items:center;">
        <input type="text" class="form-control" id="pecas-busca" placeholder="Buscar peca por nome, codigo ou marca..." oninput="PECAS.filtrar()" style="max-width:400px;flex:1;">
        <select class="form-control" id="pecas-filtro-estoque" onchange="PECAS.filtrar()" style="width:auto;min-width:160px;">
          <option value="todos">Todos</option>
          <option value="negativo">Sem estoque / Negativo</option>
          <option value="baixo">Estoque baixo</option>
          <option value="ok">Estoque OK</option>
        </select>
        <button class="btn btn-secondary btn-sm" onclick="PECAS.exportarExcel()" style="white-space:nowrap;">Exportar Excel</button>
      </div>
      ${window.innerWidth <= 768 ? `
      <div class="mobile-card-list" id="pecas-tabela">
        ${lista.map(p => {
          const estoqueColor = p.quantidade <= 0 ? 'var(--danger)' : p.quantidade <= p.estoque_minimo ? 'var(--warning)' : 'var(--success)';
          return `
          <div class="mobile-card" data-busca="${esc(p.nome).toLowerCase()} ${esc(p.codigo || '').toLowerCase()} ${esc(p.marca || '').toLowerCase()}" data-qtd="${p.quantidade}" data-min="${p.estoque_minimo || 0}">
            <div class="mobile-card-header">
              <div>
                <div class="mobile-card-title">${esc(p.nome)}</div>
                <div class="mobile-card-subtitle">${esc(p.codigo || '')}${p.marca ? ' · ' + esc(p.marca) : ''}${p.localizacao ? ' · ' + esc(p.localizacao) : ''}</div>
              </div>
              <div style="text-align:right;">
                <div style="font-size:18px;font-weight:800;color:${estoqueColor};">${p.quantidade}</div>
                <div style="font-size:10px;color:var(--text-secondary);">estoque</div>
              </div>
            </div>
            <div class="mobile-card-body">
              <div class="mobile-card-row"><span>Venda</span><strong>R$ ${(p.preco_venda || 0).toFixed(2)}</strong></div>
            </div>
            <div class="mobile-card-actions">
              <button class="btn btn-secondary btn-sm" onclick="PECAS.ajustarEstoque('${p.id}', '${escAttr(p.nome)}', ${p.quantidade})">Ajustar</button>
              <button class="btn btn-secondary btn-sm" onclick="PECAS.editar('${p.id}')">Editar</button>
            </div>
          </div>`;
        }).join('')}
      </div>` : `
      <table class="data-table" id="pecas-tabela">
        <thead>
          <tr>
            <th>Peca</th>
            <th>Codigo</th>
            <th>Marca</th>
            <th>Estoque</th>
            <th>Custo</th>
            <th>Venda</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          ${lista.map(p => {
            const estoqueClass = p.quantidade <= 0 ? 'color:var(--danger);font-weight:700;' :
              p.quantidade <= p.estoque_minimo ? 'color:var(--warning);font-weight:700;' : '';
            return `
            <tr data-busca="${esc(p.nome).toLowerCase()} ${esc(p.codigo || '').toLowerCase()} ${esc(p.marca || '').toLowerCase()}" data-qtd="${p.quantidade}" data-min="${p.estoque_minimo || 0}">
              <td><strong>${esc(p.nome)}</strong>${p.compatibilidade && p.compatibilidade.length ? '<br><span style="font-size:10px;color:var(--info);">' + p.compatibilidade.map(c => esc(c.marca) + (c.modelos?.length ? ' (' + c.modelos.map(m => esc(m)).join(', ') + ')' : '')).join(' | ') + '</span>' : ''}${p.localizacao ? '<br><span style="font-size:11px;color:var(--text-secondary);">' + esc(p.localizacao) + '</span>' : ''}</td>
              <td style="font-size:13px;">${esc(p.codigo) || '-'}</td>
              <td style="font-size:13px;">${esc(p.marca) || '-'}</td>
              <td style="${estoqueClass}">${p.quantidade}${p.estoque_minimo ? ' <span style="font-size:11px;color:var(--text-muted);">(min: ' + p.estoque_minimo + ')</span>' : ''}</td>
              <td style="font-size:13px;">R$ ${(p.custo || 0).toFixed(2)}</td>
              <td style="font-size:13px;font-weight:600;">R$ ${(p.preco_venda || 0).toFixed(2)}</td>
              <td style="display:flex;gap:4px;">
                <button class="btn btn-secondary btn-sm" onclick="PECAS.editar('${p.id}')">Editar</button>
                <button class="btn btn-secondary btn-sm" onclick="PECAS.ajustarEstoque('${p.id}', '${escAttr(p.nome)}', ${p.quantidade})">Ajustar</button>
                <button class="btn btn-danger btn-sm" onclick="PECAS.excluir('${p.id}', '${escAttr(p.nome)}')">X</button>
              </td>
            </tr>`;
          }).join('')}
        </tbody>
      </table>`}
      <div style="margin-top:12px;font-size:13px;color:var(--text-secondary);">
        ${lista.length} pecas cadastradas |
        <span style="color:var(--danger);">${lista.filter(p => p.quantidade <= 0).length} sem estoque</span> |
        <span style="color:var(--warning);">${lista.filter(p => p.quantidade > 0 && p.quantidade <= p.estoque_minimo).length} estoque baixo</span>
      </div>`;
  },

  filtrar() {
    const t = (document.getElementById('pecas-busca')?.value || '').toLowerCase();
    const filtro = document.getElementById('pecas-filtro-estoque')?.value || 'todos';
    // Funciona tanto com tabela (tr) quanto com cards mobile (div)
    const items = document.querySelectorAll('#pecas-tabela tr[data-busca], #pecas-tabela .mobile-card[data-busca]');
    items.forEach(el => {
      const buscaOk = !t || el.dataset.busca.includes(t);
      const qtd = parseFloat(el.dataset.qtd);
      const min = parseFloat(el.dataset.min);
      let estoqueOk = true;
      if (filtro === 'negativo') estoqueOk = qtd <= 0;
      else if (filtro === 'baixo') estoqueOk = qtd > 0 && qtd <= min;
      else if (filtro === 'ok') estoqueOk = qtd > min || (min === 0 && qtd > 0);
      el.style.display = buscaOk && estoqueOk ? '' : 'none';
    });
  },

  abrirModal(dados = {}) {
    openModal(`
      <div class="modal-header">
        <h3>${dados.id ? 'Editar Peca' : 'Nova Peca'}</h3>
        <button class="modal-close" onclick="closeModal()">&times;</button>
      </div>
      <div class="modal-body">
        <form id="form-peca" onsubmit="PECAS.salvar(event, '${dados.id || ''}')">
          <div class="form-group">
            <label>Nome da peca *</label>
            <input type="text" class="form-control" id="peca-nome" required value="${esc(dados.nome) || ''}" placeholder="Ex: Filtro de oleo">
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
            <div class="form-group">
              <label>Codigo / Ref</label>
              <input type="text" class="form-control" id="peca-codigo" value="${esc(dados.codigo) || ''}" placeholder="Ex: W71251">
            </div>
            <div class="form-group">
              <label>Marca</label>
              <input type="text" class="form-control" id="peca-marca" value="${esc(dados.marca) || ''}" placeholder="Ex: Mann, Fram, Tecfil">
            </div>
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;">
            <div class="form-group">
              <label>Quantidade</label>
              <input type="number" class="form-control" id="peca-qtd" value="${dados.quantidade || 0}" min="0" step="1">
            </div>
            <div class="form-group">
              <label>Estoque minimo</label>
              <input type="number" class="form-control" id="peca-min" value="${dados.estoque_minimo || 0}" min="0" step="1">
            </div>
            <div class="form-group">
              <label>Localizacao</label>
              <input type="text" class="form-control" id="peca-local" value="${esc(dados.localizacao) || ''}" placeholder="Prateleira A3">
            </div>
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;">
            <div class="form-group">
              <label>Custo (R$)</label>
              <input type="number" class="form-control" id="peca-custo" value="${dados.custo || 0}" min="0" step="0.01" oninput="PECAS._calcularVenda()">
            </div>
            <div class="form-group">
              <label>Margem (%)</label>
              <input type="number" class="form-control" id="peca-margem" value="${dados.custo && dados.preco_venda ? Math.round((dados.preco_venda / dados.custo - 1) * 100) : (APP.oficina?.margem_padrao || 30)}" min="0" step="1" oninput="PECAS._calcularVenda()">
            </div>
            <div class="form-group">
              <label>Venda (R$)</label>
              <input type="number" class="form-control" id="peca-venda" value="${dados.preco_venda || 0}" min="0" step="0.01" oninput="PECAS._calcularMargem()" style="font-weight:700;color:var(--success);">
            </div>
          </div>
          <div id="peca-lucro-info" style="font-size:12px;color:var(--text-secondary);margin-top:-8px;margin-bottom:12px;"></div>

          <!-- COMPATIBILIDADE -->
          <div style="border-top:1px solid var(--border);margin-top:8px;padding-top:16px;">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
              <label style="font-size:13px;font-weight:700;margin:0;">Veiculos compativeis</label>
              <button type="button" class="btn btn-secondary btn-sm" onclick="PECAS._addCompatibilidade()">+ Adicionar</button>
            </div>
            <div id="peca-compat-lista"></div>
            <div id="peca-compat-add" class="hidden" style="margin-top:8px;background:var(--bg);padding:12px;border-radius:var(--radius);">
              <div style="display:grid;grid-template-columns:1fr 1fr auto;gap:8px;align-items:end;">
                <div class="form-group" style="margin:0;">
                  <label style="font-size:11px;">Marca</label>
                  <select class="form-control" id="peca-compat-marca" onchange="PECAS._carregarModelosCompat()">
                    ${optionsMarcas()}
                  </select>
                </div>
                <div class="form-group" style="margin:0;">
                  <label style="font-size:11px;">Modelo</label>
                  <select class="form-control" id="peca-compat-modelo">
                    <option value="">Todos os modelos</option>
                  </select>
                </div>
                <button type="button" class="btn btn-primary btn-sm" onclick="PECAS._confirmarCompat()">Add</button>
              </div>
            </div>
          </div>

          <div class="modal-footer" style="padding:16px 0 0;border:0;">
            <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancelar</button>
            <button type="submit" class="btn btn-primary">Salvar</button>
          </div>
        </form>
      </div>
    `);
    this._initCompat(dados);
  },

  _compatTemp: [],

  _initCompat(dados) {
    this._compatTemp = dados.compatibilidade ? JSON.parse(JSON.stringify(dados.compatibilidade)) : [];
    this._renderCompat();
  },

  _renderCompat() {
    const container = document.getElementById('peca-compat-lista');
    if (!container) return;
    if (!this._compatTemp.length) {
      container.innerHTML = '<div style="font-size:12px;color:var(--text-muted);padding:4px 0;">Compativel com todos os veiculos (sem filtro)</div>';
      return;
    }
    container.innerHTML = this._compatTemp.map((c, i) => `
      <div style="display:inline-flex;align-items:center;gap:6px;background:var(--bg);padding:4px 10px;border-radius:16px;margin:2px 4px 2px 0;font-size:12px;">
        <strong style="color:var(--primary);">${esc(c.marca)}</strong>
        ${c.modelos && c.modelos.length ? '<span style="color:var(--text-secondary);">' + c.modelos.map(m => esc(m)).join(', ') + '</span>' : '<span style="color:var(--text-muted);">Todos</span>'}
        <button type="button" onclick="PECAS._removerCompat(${i})" style="background:none;border:none;color:var(--danger);cursor:pointer;font-size:14px;padding:0;">&times;</button>
      </div>
    `).join('');
  },

  _addCompatibilidade() {
    document.getElementById('peca-compat-add').classList.remove('hidden');
  },

  _carregarModelosCompat() {
    const marca = document.getElementById('peca-compat-marca').value;
    const sel = document.getElementById('peca-compat-modelo');
    const modelos = getModelos(marca);
    sel.innerHTML = '<option value="">Todos os modelos</option>' + modelos.map(m => `<option value="${m}">${m}</option>`).join('');
  },

  _confirmarCompat() {
    const marca = document.getElementById('peca-compat-marca').value;
    if (!marca) { APP.toast('Selecione a marca', 'error'); return; }
    const modelo = document.getElementById('peca-compat-modelo').value;

    // Verifica se já tem essa marca
    let entry = this._compatTemp.find(c => c.marca === marca);
    if (entry) {
      if (modelo && !entry.modelos.includes(modelo)) {
        entry.modelos.push(modelo);
      }
    } else {
      this._compatTemp.push({ marca, modelos: modelo ? [modelo] : [] });
    }

    this._renderCompat();
    document.getElementById('peca-compat-marca').value = '';
    document.getElementById('peca-compat-modelo').innerHTML = '<option value="">Todos os modelos</option>';
  },

  _removerCompat(i) {
    this._compatTemp.splice(i, 1);
    this._renderCompat();
  },

  _calcularVenda() {
    const custo = parseFloat(document.getElementById('peca-custo').value) || 0;
    const margem = parseFloat(document.getElementById('peca-margem').value) || 0;
    const venda = custo * (1 + margem / 100);
    document.getElementById('peca-venda').value = venda.toFixed(2);
    this._mostrarLucro(custo, venda);
  },

  _calcularMargem() {
    const custo = parseFloat(document.getElementById('peca-custo').value) || 0;
    const venda = parseFloat(document.getElementById('peca-venda').value) || 0;
    if (custo > 0) {
      const margem = ((venda / custo) - 1) * 100;
      document.getElementById('peca-margem').value = Math.round(margem);
    }
    this._mostrarLucro(custo, venda);
  },

  _mostrarLucro(custo, venda) {
    const info = document.getElementById('peca-lucro-info');
    if (!info) return;
    const lucro = venda - custo;
    if (custo > 0 && venda > 0) {
      info.innerHTML = `Lucro por unidade: <strong style="color:var(--success);">R$ ${lucro.toFixed(2)}</strong>`;
    } else {
      info.textContent = '';
    }
  },

  async salvar(e, id) {
    e.preventDefault();
    const dados = {
      oficina_id: APP.oficinaId,
      nome: document.getElementById('peca-nome').value.trim(),
      codigo: document.getElementById('peca-codigo').value.trim(),
      marca: document.getElementById('peca-marca').value.trim(),
      quantidade: parseFloat(document.getElementById('peca-qtd').value) || 0,
      estoque_minimo: parseFloat(document.getElementById('peca-min').value) || 0,
      custo: parseFloat(document.getElementById('peca-custo').value) || 0,
      preco_venda: parseFloat(document.getElementById('peca-venda').value) || 0,
      localizacao: document.getElementById('peca-local').value.trim(),
      compatibilidade: this._compatTemp.length ? this._compatTemp : []
    };

    // Bloqueia duplicata (mesmo nome na mesma oficina)
    if (!id) {
      const { data: existe } = await db.from('pecas').select('id, nome')
        .eq('oficina_id', APP.oficinaId)
        .ilike('nome', dados.nome).limit(1);
      if (existe && existe.length) {
        APP.toast('Ja existe uma peca com esse nome: ' + existe[0].nome, 'error');
        return;
      }
    }

    let res;
    if (id) {
      res = await db.from('pecas').update(dados).eq('id', id).eq('oficina_id', APP.oficinaId).select();
    } else {
      dados.created_by = APP.profile?.id || null;
      res = await db.from('pecas').insert(dados).select();
    }

    if (res.error) { APP.toast('Erro: ' + res.error.message, 'error'); return; }
    if (!res.data || !res.data.length) { APP.toast('Erro: produto nao foi salvo (verifique permissoes)', 'error'); return; }
    closeModal();
    APP.toast(id ? 'Peca atualizada' : 'Peca cadastrada');
    this.carregar();
    if (!id && typeof OS !== 'undefined' && OS._onPostSalvarPeca) {
      const cb = OS._onPostSalvarPeca;
      OS._onPostSalvarPeca = null;
      cb(res.data[0]);
    }
  },

  async editar(id) {
    const { data } = await db.from('pecas').select('*').eq('id', id).eq('oficina_id', APP.oficinaId).single();
    if (data) this.abrirModal(data);
  },

  async excluir(id, nome) {
    if (!confirm(`Excluir a peca "${nome}"?`)) return;
    const { error } = await db.from('pecas').delete().eq('id', id).eq('oficina_id', APP.oficinaId);
    if (error) { APP.toast('Erro: ' + error.message, 'error'); return; }
    APP.toast('Peca excluida');
    this.carregar();
  },

  ajustarEstoque(id, nome, qtdAtual) {
    openModal(`
      <div class="modal-header">
        <h3>Ajustar Estoque — ${esc(nome)}</h3>
        <button class="modal-close" onclick="closeModal()">&times;</button>
      </div>
      <div class="modal-body">
        <div style="text-align:center;margin-bottom:16px;">
          <div style="font-size:13px;color:var(--text-secondary);">Quantidade atual</div>
          <div style="font-size:32px;font-weight:800;">${qtdAtual}</div>
        </div>
        <form onsubmit="PECAS.salvarAjuste(event, '${id}', ${qtdAtual})">
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
            <div class="form-group">
              <label>Tipo</label>
              <select class="form-control" id="ajuste-tipo">
                <option value="entrada">Entrada (compra)</option>
                <option value="saida">Saida (uso/perda)</option>
                <option value="ajuste">Ajuste (inventario)</option>
              </select>
            </div>
            <div class="form-group">
              <label>Quantidade</label>
              <input type="number" class="form-control" id="ajuste-qtd" required min="1" value="1">
            </div>
          </div>
          <div class="form-group">
            <label>Observacao</label>
            <input type="text" class="form-control" id="ajuste-obs" placeholder="Ex: Compra fornecedor X, Ajuste inventario...">
          </div>
          <div class="modal-footer" style="padding:16px 0 0;border:0;">
            <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancelar</button>
            <button type="submit" class="btn btn-primary">Confirmar</button>
          </div>
        </form>
      </div>
    `);
  },

  async exportarExcel() {
    if (!this._lista || !this._lista.length) { APP.toast('Nenhuma peca para exportar', 'error'); return; }
    APP.toast('Gerando planilha...');

    // Carregar ExcelJS
    if (!window.ExcelJS) {
      await new Promise((resolve, reject) => {
        const s = document.createElement('script');
        s.src = 'https://cdn.jsdelivr.net/npm/exceljs@4.4.0/dist/exceljs.min.js';
        s.onload = resolve; s.onerror = reject;
        document.head.appendChild(s);
      });
    }
    if (!window.ExcelJS) { APP.toast('Erro ao carregar exportacao', 'error'); return; }

    const wb = new ExcelJS.Workbook();
    wb.creator = 'RPM Pro';
    const ws = wb.addWorksheet('Estoque', { properties: { defaultColWidth: 18 } });
    const oficinaNome = APP.oficina?.nome || 'Oficina';
    const hoje = new Date();

    // Cores RPM Pro (paleta do sistema)
    const LARANJA = 'FF4500';
    const CINZA_ESCURO = '1A1D23';
    const BRANCO = 'FFFFFF';

    // Largura das colunas
    ws.columns = [
      { width: 7 },   // #
      { width: 18 },  // Codigo
      { width: 45 },  // Peca
      { width: 14 },  // Marca
      { width: 12 },  // Custo
      { width: 12 },  // Venda
      { width: 14 },  // Saldo Sistema
      { width: 14 },  // Contagem Real
      { width: 14 },  // Diferenca
    ];

    // Header
    ws.getRow(1).height = 45;
    ws.mergeCells('A1:I1');
    const h1 = ws.getCell('A1');
    h1.value = oficinaNome.toUpperCase();
    h1.font = { name: 'Arial', size: 20, bold: true, color: { argb: BRANCO } };
    h1.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: CINZA_ESCURO } };
    h1.alignment = { horizontal: 'center', vertical: 'middle' };
    for (let c = 2; c <= 9; c++) ws.getRow(1).getCell(c).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: CINZA_ESCURO } };

    // Subtitulo
    ws.getRow(2).height = 26;
    ws.mergeCells('A2:I2');
    const h2 = ws.getCell('A2');
    h2.value = 'INVENTARIO DE ESTOQUE — CONTAGEM FISICA';
    h2.font = { name: 'Arial', size: 11, bold: true, color: { argb: BRANCO } };
    h2.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: LARANJA } };
    h2.alignment = { horizontal: 'center', vertical: 'middle' };
    for (let c = 2; c <= 9; c++) ws.getRow(2).getCell(c).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: LARANJA } };

    // Info
    ws.getRow(3).height = 22;
    ws.mergeCells('A3:I3');
    const h3 = ws.getCell('A3');
    h3.value = `Data: ${hoje.toLocaleDateString('pt-BR')}  •  Gerado por RPM Pro — rpmpro.com.br`;
    h3.font = { name: 'Arial', size: 9, italic: true, color: { argb: '666666' } };
    h3.alignment = { horizontal: 'center', vertical: 'middle' };

    ws.addRow([]);

    // Cabecalho colunas
    const bordaFina = { style: 'thin', color: { argb: 'CCCCCC' } };
    const bordas = { top: bordaFina, left: bordaFina, bottom: bordaFina, right: bordaFina };

    const colRow = ws.addRow(['#', 'CODIGO', 'PECA', 'MARCA', 'CUSTO', 'VENDA', 'SALDO SISTEMA', 'CONTAGEM REAL', 'DIFERENCA']);
    colRow.height = 24;
    colRow.eachCell(c => {
      c.font = { name: 'Arial', size: 9, bold: true, color: { argb: '333333' } };
      c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'E8E8E8' } };
      c.alignment = { horizontal: 'center', vertical: 'middle' };
      c.border = bordas;
    });

    // Dados
    const sorted = [...this._lista].sort((a, b) => a.nome.localeCompare(b.nome));
    sorted.forEach((p, i) => {
      const row = ws.addRow([
        i + 1,
        p.codigo || '—',
        p.nome,
        p.marca || '—',
        p.custo || 0,
        p.preco_venda || 0,
        p.quantidade,
        '',
        ''
      ]);
      row.height = 20;

      row.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };
      row.getCell(1).font = { name: 'Arial', size: 9, color: { argb: '999999' } };
      row.getCell(2).font = { name: 'Arial', size: 9, color: { argb: '666666' } };
      row.getCell(2).alignment = { horizontal: 'center', vertical: 'middle' };
      row.getCell(3).font = { name: 'Arial', size: 10 };
      row.getCell(3).alignment = { vertical: 'middle', indent: 1 };
      row.getCell(4).font = { name: 'Arial', size: 9 };
      row.getCell(4).alignment = { horizontal: 'center', vertical: 'middle' };
      row.getCell(5).font = { name: 'Arial', size: 9 };
      row.getCell(5).alignment = { horizontal: 'center', vertical: 'middle' };
      row.getCell(5).numFmt = '#,##0.00';
      row.getCell(6).font = { name: 'Arial', size: 9, bold: true };
      row.getCell(6).alignment = { horizontal: 'center', vertical: 'middle' };
      row.getCell(6).numFmt = '#,##0.00';
      row.getCell(7).font = { name: 'Arial', size: 10, bold: true };
      row.getCell(7).alignment = { horizontal: 'center', vertical: 'middle' };

      // Contagem real — fundo amarelo (preencher na mao)
      row.getCell(8).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFDE7' } };
      row.getCell(8).alignment = { horizontal: 'center', vertical: 'middle' };
      row.getCell(8).font = { name: 'Arial', size: 10 };

      // Formula diferenca
      const r = row.number;
      row.getCell(9).value = { formula: `IF(H${r}="","",H${r}-G${r})` };
      row.getCell(9).alignment = { horizontal: 'center', vertical: 'middle' };
      row.getCell(9).font = { name: 'Arial', size: 10 };

      // Destaque negativo/baixo
      if (p.quantidade <= 0) {
        row.getCell(7).font = { name: 'Arial', size: 10, bold: true, color: { argb: 'CC0000' } };
      } else if (p.quantidade <= (p.estoque_minimo || 0)) {
        row.getCell(7).font = { name: 'Arial', size: 10, bold: true, color: { argb: 'CC8800' } };
      }

      row.eachCell(c => { c.border = bordas; });

      // Zebra
      if (i % 2 === 1) {
        [1,2,3,4,5,6,7,9].forEach(ci => {
          row.getCell(ci).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'F9F9F9' } };
        });
      }
    });

    // Rodape
    ws.addRow([]);
    const totRow = ws.addRow(['', '', `TOTAL DE PECAS: ${sorted.length}`, '', '', '', '', '', '']);
    totRow.getCell(3).font = { name: 'Arial', size: 10, bold: true, color: { argb: LARANJA } };

    const negRow = ws.addRow(['', '', `SEM ESTOQUE: ${sorted.filter(p => p.quantidade <= 0).length}  |  ESTOQUE BAIXO: ${sorted.filter(p => p.quantidade > 0 && p.quantidade <= (p.estoque_minimo || 0)).length}`, '', '', '', '', '', '']);
    negRow.getCell(3).font = { name: 'Arial', size: 9, color: { argb: 'CC0000' } };

    ws.addRow([]);
    const respRow = ws.addRow(['', '', 'Responsavel pela contagem: _______________________________', '', '', '', '', '', '']);
    respRow.getCell(3).font = { name: 'Arial', size: 9, color: { argb: '666666' } };
    const assinRow = ws.addRow(['', '', 'Assinatura: _______________________________  Data: ___/___/______', '', '', '', '', '', '']);
    assinRow.getCell(3).font = { name: 'Arial', size: 9, color: { argb: '666666' } };

    // Configurar impressao
    ws.pageSetup = { orientation: 'landscape', fitToPage: true, fitToWidth: 1, fitToHeight: 0, paperSize: 9 };
    ws.headerFooter = { oddFooter: oficinaNome + ' — Inventario de Estoque — Pagina &P de &N' };

    // Gerar e baixar
    const buffer = await wb.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `estoque-${oficinaNome.toLowerCase().replace(/\s+/g, '-')}-${hoje.toISOString().slice(0,10)}.xlsx`;
    a.click();
    URL.revokeObjectURL(url);
    APP.toast('Planilha exportada!');
  },

  async salvarAjuste(e, pecaId, qtdAtual) {
    e.preventDefault();
    const tipo = document.getElementById('ajuste-tipo').value;
    const qtd = parseFloat(document.getElementById('ajuste-qtd').value) || 0;
    const obs = document.getElementById('ajuste-obs').value.trim();

    let novaQtd;
    if (tipo === 'entrada') novaQtd = qtdAtual + qtd;
    else if (tipo === 'saida') novaQtd = qtdAtual - qtd;
    else novaQtd = qtd; // ajuste = define valor exato

    // Atualiza quantidade
    await db.from('pecas').update({ quantidade: novaQtd }).eq('id', pecaId).eq('oficina_id', APP.oficinaId);

    // Registra movimento
    await db.from('estoque_movimentos').insert({
      oficina_id: APP.oficinaId,
      peca_id: pecaId,
      tipo,
      quantidade: tipo === 'ajuste' ? novaQtd - qtdAtual : qtd,
      observacao: obs || tipo.charAt(0).toUpperCase() + tipo.slice(1),
      created_by: APP.profile.id
    });

    closeModal();
    APP.toast('Estoque atualizado: ' + qtdAtual + ' → ' + novaQtd);
    this.carregar();
  }
};

document.addEventListener('pageLoad', (e) => {
  if (e.detail.page === 'pecas') PECAS.carregar();
});
