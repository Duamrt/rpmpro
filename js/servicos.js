// RPM Pro — Cadastro de Serviços (catálogo da oficina)
const SERVICOS = {
  _dados: null,

  async carregar() {
    const container = document.getElementById('servicos-lista');
    if (!container) return;

    const { data, error } = await db
      .from('servicos_catalogo')
      .select('*')
      .eq('oficina_id', APP.profile.oficina_id)
      .order('categoria')
      .order('nome');

    if (error) { APP.toast('Erro ao carregar servicos', 'error'); return; }
    this._dados = data || [];
    this.render(this._dados);
  },

  render(lista) {
    const container = document.getElementById('servicos-lista');

    if (!lista.length) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="icon">🔧</div>
          <h3>Nenhum servico cadastrado</h3>
          <p>Cadastre os servicos da sua oficina com os precos que voce pratica.</p>
          <button class="btn btn-primary" style="margin-top:12px;" onclick="SERVICOS.importarCatalogoPadrao()">Importar catalogo padrao</button>
        </div>`;
      return;
    }

    // Agrupa por categoria
    const grupos = {};
    lista.forEach(s => {
      if (!grupos[s.categoria]) grupos[s.categoria] = [];
      grupos[s.categoria].push(s);
    });

    container.innerHTML = `
      <div style="margin-bottom:12px;">
        <input type="text" class="form-control" id="servicos-busca" placeholder="Buscar servico..." oninput="SERVICOS.filtrar(this.value)" style="max-width:400px;">
      </div>
      <div id="servicos-grid">
        ${Object.entries(grupos).map(([cat, servicos]) => `
          <div style="background:var(--bg-card);border:1px solid var(--border);border-radius:var(--radius-lg);overflow:hidden;margin-bottom:16px;" data-cat="${esc(cat.toLowerCase())}">
            <div style="padding:12px 20px;border-bottom:1px solid var(--border);display:flex;justify-content:space-between;align-items:center;">
              <h3 style="font-size:14px;">${esc(cat)}</h3>
              <span style="font-size:12px;color:var(--text-secondary);">${servicos.length} servicos</span>
            </div>
            ${window.innerWidth <= 768 ? `
            <div style="padding:8px;">
              ${servicos.map(s => `
                <div class="mobile-card" data-busca="${esc(s.nome.toLowerCase())} ${esc(cat.toLowerCase())}" style="margin-bottom:8px;">
                  <div class="mobile-card-header">
                    <div>
                      <div class="mobile-card-title">${esc(s.nome)}</div>
                      <div class="mobile-card-subtitle">${s.tempo_estimado ? s.tempo_estimado + ' min' : ''}</div>
                    </div>
                    <div style="text-align:right;">
                      <div class="mobile-card-value">R$ ${(s.valor_padrao || 0).toFixed(2)}</div>
                      <span class="badge badge-${s.ativo ? 'pronto' : 'entregue'}" style="font-size:10px;">${s.ativo ? 'Ativo' : 'Inativo'}</span>
                    </div>
                  </div>
                  <div class="mobile-card-actions">
                    <button class="btn btn-secondary btn-sm" onclick="SERVICOS.editar('${s.id}')">Editar</button>
                    <button class="btn btn-danger btn-sm" onclick="SERVICOS.excluir('${s.id}','${esc(s.nome)}')">X</button>
                  </div>
                </div>
              `).join('')}
            </div>` : `
            <table class="data-table">
              <thead>
                <tr>
                  <th>Servico</th>
                  <th>Valor</th>
                  <th>Tempo est.</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                ${servicos.map(s => `
                  <tr data-busca="${esc(s.nome.toLowerCase())} ${esc(cat.toLowerCase())}">
                    <td><strong>${esc(s.nome)}</strong></td>
                    <td style="font-weight:700;color:var(--success);">R$ ${(s.valor_padrao || 0).toFixed(2)}</td>
                    <td style="font-size:13px;color:var(--text-secondary);">${s.tempo_estimado ? s.tempo_estimado + ' min' : '-'}</td>
                    <td><span class="badge badge-${s.ativo ? 'pronto' : 'entregue'}">${s.ativo ? 'Ativo' : 'Inativo'}</span></td>
                    <td style="display:flex;gap:4px;">
                      <button class="btn btn-secondary btn-sm" onclick="SERVICOS.editar('${s.id}')">Editar</button>
                      <button class="btn btn-danger btn-sm" onclick="SERVICOS.excluir('${s.id}','${esc(s.nome)}')">X</button>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>`}
          </div>
        `).join('')}
      </div>
      <div style="font-size:13px;color:var(--text-secondary);margin-top:8px;">
        ${lista.length} servicos cadastrados | ${lista.filter(s => s.ativo).length} ativos
      </div>`;
  },

  filtrar(termo) {
    const t = termo.toLowerCase();
    document.querySelectorAll('#servicos-grid tr[data-busca], #servicos-grid .mobile-card[data-busca]').forEach(el => {
      el.style.display = el.dataset.busca.includes(t) ? '' : 'none';
    });
    // Esconde categorias inteiras se todos os itens ficaram ocultos
    document.querySelectorAll('#servicos-grid [data-cat]').forEach(grupo => {
      const visiveis = grupo.querySelectorAll('tr[data-busca]:not([style*="display: none"]), .mobile-card[data-busca]:not([style*="display: none"])');
      grupo.style.display = visiveis.length ? '' : 'none';
    });
  },

  abrirModal(dados = {}) {
    // Categorias existentes pra sugestão
    const categorias = [...new Set((this._dados || []).map(s => s.categoria))].sort();

    openModal(`
      <div class="modal-header">
        <h3>${dados.id ? 'Editar Servico' : 'Novo Servico'}</h3>
        <button class="modal-close" onclick="closeModal()">&times;</button>
      </div>
      <div class="modal-body">
        <form onsubmit="SERVICOS.salvar(event, '${dados.id || ''}')">
          <div class="form-group">
            <label>Categoria *</label>
            <input type="text" class="form-control" id="svc-categoria" required value="${esc(dados.categoria || '')}" list="svc-categorias-list" placeholder="Ex: Motor, Freios, Suspensao...">
            <datalist id="svc-categorias-list">
              ${categorias.map(c => `<option value="${esc(c)}">`).join('')}
            </datalist>
          </div>
          <div class="form-group">
            <label>Nome do servico *</label>
            <input type="text" class="form-control" id="svc-nome" required value="${esc(dados.nome || '')}" placeholder="Ex: Troca de oleo e filtro">
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
            <div class="form-group">
              <label>Valor padrao (R$)</label>
              <input type="number" class="form-control" id="svc-valor" value="${dados.valor_padrao || 0}" min="0" step="0.01">
            </div>
            <div class="form-group">
              <label>Tempo estimado (min)</label>
              <input type="number" class="form-control" id="svc-tempo" value="${dados.tempo_estimado || ''}" min="0" placeholder="Ex: 60">
            </div>
          </div>
          <div class="form-group">
            <label>Status</label>
            <select class="form-control" id="svc-ativo">
              <option value="true" ${dados.ativo !== false ? 'selected' : ''}>Ativo</option>
              <option value="false" ${dados.ativo === false ? 'selected' : ''}>Inativo</option>
            </select>
          </div>
          <div class="modal-footer" style="padding:16px 0 0;border:0;">
            <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancelar</button>
            <button type="submit" class="btn btn-primary">Salvar</button>
          </div>
        </form>
      </div>
    `);
  },

  async salvar(e, id) {
    e.preventDefault();
    const dados = {
      oficina_id: APP.profile.oficina_id,
      categoria: document.getElementById('svc-categoria').value.trim(),
      nome: document.getElementById('svc-nome').value.trim(),
      valor_padrao: parseFloat(document.getElementById('svc-valor').value) || 0,
      tempo_estimado: parseInt(document.getElementById('svc-tempo').value) || 0,
      ativo: document.getElementById('svc-ativo').value === 'true'
    };

    let error;
    if (id) {
      ({ error } = await db.from('servicos_catalogo').update(dados).eq('id', id).eq('oficina_id', APP.profile.oficina_id));
    } else {
      ({ error } = await db.from('servicos_catalogo').insert(dados));
    }

    if (error) { APP.toast('Erro: ' + error.message, 'error'); return; }
    closeModal();
    APP.toast(id ? 'Servico atualizado' : 'Servico cadastrado');
    this.carregar();
  },

  async editar(id) {
    const { data } = await db.from('servicos_catalogo').select('*').eq('id', id).eq('oficina_id', APP.profile.oficina_id).single();
    if (data) this.abrirModal(data);
  },

  async excluir(id, nome) {
    if (!confirm(`Excluir o servico "${nome}"?`)) return;
    const { error } = await db.from('servicos_catalogo').delete().eq('id', id).eq('oficina_id', APP.profile.oficina_id);
    if (error) { APP.toast('Erro: ' + error.message, 'error'); return; }
    APP.toast('Servico excluido');
    this.carregar();
  },

  // Importa catálogo padrão (do catalogo-servicos.js) pra oficina
  abrirImportacao() {
    // Serviços já cadastrados (pra evitar duplicata)
    const existentes = new Set((this._dados || []).map(s => s.nome.toLowerCase()));
    const categorias = Object.entries(CATALOGO_SERVICOS);
    const totalNovos = categorias.reduce((s, [, svcs]) => s + svcs.filter(sv => !existentes.has(sv.nome.toLowerCase())).length, 0);

    openModal(`
      <div class="modal-header">
        <h3>Importar Catálogo Padrão</h3>
        <button class="modal-close" onclick="closeModal()">&times;</button>
      </div>
      <div class="modal-body">
        <p style="font-size:13px;color:var(--text-secondary);margin-bottom:16px;">Selecione as categorias que deseja importar. Serviços já cadastrados não serão duplicados. Você pode editar os preços depois.</p>
        <div style="margin-bottom:12px;">
          <label style="display:flex;align-items:center;gap:8px;margin-bottom:8px;cursor:pointer;">
            <input type="checkbox" id="imp-todos" checked onchange="document.querySelectorAll('.imp-cat').forEach(c=>c.checked=this.checked)">
            <strong>Selecionar todas (${totalNovos} novos)</strong>
          </label>
        </div>
        <div style="display:flex;flex-direction:column;gap:8px;max-height:400px;overflow-y:auto;">
          ${categorias.map(([cat, svcs]) => {
            const novos = svcs.filter(s => !existentes.has(s.nome.toLowerCase()));
            return `<label style="display:flex;align-items:center;gap:8px;padding:10px 12px;background:var(--bg-input);border-radius:8px;cursor:pointer;">
              <input type="checkbox" class="imp-cat" value="${esc(cat)}" ${novos.length ? 'checked' : 'disabled'}>
              <div style="flex:1;">
                <div style="font-weight:600;font-size:13px;">${esc(cat)}</div>
                <div style="font-size:11px;color:var(--text-secondary);">${svcs.length} serviços${novos.length < svcs.length ? ` (${svcs.length - novos.length} já cadastrados)` : ''}</div>
              </div>
              <span style="font-size:12px;font-weight:700;color:${novos.length ? 'var(--success)' : 'var(--text-muted)'};">${novos.length ? '+' + novos.length + ' novos' : 'completo'}</span>
            </label>`;
          }).join('')}
        </div>
        <div class="modal-footer" style="padding:16px 0 0;border:0;">
          <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancelar</button>
          <button type="button" class="btn btn-primary" onclick="SERVICOS.executarImportacao()">Importar selecionados</button>
        </div>
      </div>
    `);
  },

  async executarImportacao() {
    const cats = [...document.querySelectorAll('.imp-cat:checked')].map(c => c.value);
    if (!cats.length) { APP.toast('Selecione pelo menos uma categoria'); return; }

    const existentes = new Set((this._dados || []).map(s => s.nome.toLowerCase()));
    const oficina_id = APP.profile.oficina_id;
    const itens = [];

    cats.forEach(cat => {
      (CATALOGO_SERVICOS[cat] || []).forEach(s => {
        if (!existentes.has(s.nome.toLowerCase())) {
          itens.push({ oficina_id, categoria: cat, nome: s.nome, valor_padrao: s.valor, ativo: true });
        }
      });
    });

    if (!itens.length) { APP.toast('Todos os serviços das categorias selecionadas já estão cadastrados'); closeModal(); return; }

    const { error } = await db.from('servicos_catalogo').insert(itens);
    if (error) { APP.toast('Erro: ' + error.message, 'error'); return; }

    closeModal();
    APP.toast(itens.length + ' serviços importados!');
    this.carregar();
  },

  async importarCatalogoPadrao() {
    this.abrirImportacao();
  },

  // Retorna serviços ativos da oficina (pra usar na OS)
  async getServicosOficina() {
    if (this._dados && this._dados.length) return this._dados.filter(s => s.ativo);

    const { data } = await db
      .from('servicos_catalogo')
      .select('*')
      .eq('oficina_id', APP.profile.oficina_id)
      .eq('ativo', true)
      .order('categoria')
      .order('nome');

    return data || [];
  },

  // Gera options pra select (usado na OS)
  async optionsServicosOficina() {
    const servicos = await this.getServicosOficina();

    // Se oficina não tem catálogo próprio, usa o padrão
    if (!servicos.length) return optionsServicos();

    let html = '<option value="">Selecione o servico</option>';
    const grupos = {};
    servicos.forEach(s => {
      if (!grupos[s.categoria]) grupos[s.categoria] = [];
      grupos[s.categoria].push(s);
    });

    for (const [cat, lista] of Object.entries(grupos)) {
      html += `<optgroup label="${esc(cat)}">`;
      lista.forEach(s => {
        html += `<option value="${esc(s.nome)}" data-valor="${s.valor_padrao}">${esc(s.nome)} — R$ ${(s.valor_padrao || 0).toFixed(2)}</option>`;
      });
      html += '</optgroup>';
    }
    html += '<option value="__outro">Outro servico</option>';
    return html;
  },

  // Busca valor de um serviço da oficina
  getValorServico(nome) {
    if (!this._dados) return getValorServico(nome); // fallback pro catálogo fixo
    const s = this._dados.find(x => x.nome === nome);
    return s ? s.valor_padrao : getValorServico(nome);
  }
};

document.addEventListener('pageLoad', (e) => {
  if (e.detail.page === 'servicos') SERVICOS.carregar();
});
