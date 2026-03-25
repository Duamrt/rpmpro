// RPM Pro — Peças / Estoque
const PECAS = {
  async carregar() {
    const { data, error } = await db
      .from('pecas')
      .select('*')
      .eq('oficina_id', APP.profile.oficina_id)
      .order('nome');

    if (error) { APP.toast('Erro ao carregar peças', 'error'); return; }
    this.render(data || []);
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

    container.innerHTML = `
      <div style="margin-bottom:12px;">
        <input type="text" class="form-control" id="pecas-busca" placeholder="Buscar peca por nome, codigo ou marca..." oninput="PECAS.filtrar(this.value)" style="max-width:400px;">
      </div>
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
            <tr data-busca="${esc(p.nome).toLowerCase()} ${esc(p.codigo || '').toLowerCase()} ${esc(p.marca || '').toLowerCase()}">
              <td><strong>${esc(p.nome)}</strong>${p.localizacao ? '<br><span style="font-size:11px;color:var(--text-secondary);">' + esc(p.localizacao) + '</span>' : ''}</td>
              <td style="font-size:13px;">${esc(p.codigo) || '-'}</td>
              <td style="font-size:13px;">${esc(p.marca) || '-'}</td>
              <td style="${estoqueClass}">${p.quantidade}${p.estoque_minimo ? ' <span style="font-size:11px;color:var(--text-muted);">(min: ' + p.estoque_minimo + ')</span>' : ''}</td>
              <td style="font-size:13px;">R$ ${(p.custo || 0).toFixed(2)}</td>
              <td style="font-size:13px;font-weight:600;">R$ ${(p.preco_venda || 0).toFixed(2)}</td>
              <td style="display:flex;gap:4px;">
                <button class="btn btn-secondary btn-sm" onclick="PECAS.editar('${p.id}')">Editar</button>
                <button class="btn btn-secondary btn-sm" onclick="PECAS.ajustarEstoque('${p.id}', '${esc(p.nome)}', ${p.quantidade})">Ajustar</button>
                <button class="btn btn-danger btn-sm" onclick="PECAS.excluir('${p.id}', '${esc(p.nome)}')">X</button>
              </td>
            </tr>`;
          }).join('')}
        </tbody>
      </table>
      <div style="margin-top:12px;font-size:13px;color:var(--text-secondary);">
        ${lista.length} pecas cadastradas |
        <span style="color:var(--danger);">${lista.filter(p => p.quantidade <= 0).length} sem estoque</span> |
        <span style="color:var(--warning);">${lista.filter(p => p.quantidade > 0 && p.quantidade <= p.estoque_minimo).length} estoque baixo</span>
      </div>`;
  },

  filtrar(termo) {
    const t = termo.toLowerCase();
    document.querySelectorAll('#pecas-tabela tbody tr').forEach(tr => {
      tr.style.display = tr.dataset.busca.includes(t) ? '' : 'none';
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
          <div class="modal-footer" style="padding:16px 0 0;border:0;">
            <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancelar</button>
            <button type="submit" class="btn btn-primary">Salvar</button>
          </div>
        </form>
      </div>
    `);
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
      oficina_id: APP.profile.oficina_id,
      nome: document.getElementById('peca-nome').value.trim(),
      codigo: document.getElementById('peca-codigo').value.trim(),
      marca: document.getElementById('peca-marca').value.trim(),
      quantidade: parseFloat(document.getElementById('peca-qtd').value) || 0,
      estoque_minimo: parseFloat(document.getElementById('peca-min').value) || 0,
      custo: parseFloat(document.getElementById('peca-custo').value) || 0,
      preco_venda: parseFloat(document.getElementById('peca-venda').value) || 0,
      localizacao: document.getElementById('peca-local').value.trim()
    };

    let error;
    if (id) {
      ({ error } = await db.from('pecas').update(dados).eq('id', id).eq('oficina_id', APP.profile.oficina_id));
    } else {
      ({ error } = await db.from('pecas').insert(dados));
    }

    if (error) { APP.toast('Erro: ' + error.message, 'error'); return; }
    closeModal();
    APP.toast(id ? 'Peca atualizada' : 'Peca cadastrada');
    this.carregar();
  },

  async editar(id) {
    const { data } = await db.from('pecas').select('*').eq('id', id).eq('oficina_id', APP.profile.oficina_id).single();
    if (data) this.abrirModal(data);
  },

  async excluir(id, nome) {
    if (!confirm(`Excluir a peca "${nome}"?`)) return;
    const { error } = await db.from('pecas').delete().eq('id', id).eq('oficina_id', APP.profile.oficina_id);
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
    await db.from('pecas').update({ quantidade: novaQtd }).eq('id', pecaId).eq('oficina_id', APP.profile.oficina_id);

    // Registra movimento
    await db.from('estoque_movimentos').insert({
      oficina_id: APP.profile.oficina_id,
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
