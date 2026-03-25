// RPM Pro — Equipe
const EQUIPE = {
  async carregar() {
    const { data, error } = await db
      .from('profiles')
      .select('*')
      .eq('oficina_id', APP.profile.oficina_id)
      .order('nome');

    if (error) { APP.toast('Erro ao carregar equipe', 'error'); return; }
    this.render(data || []);
  },

  render(lista) {
    const container = document.getElementById('equipe-lista');
    if (!lista.length) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="icon">👥</div>
          <h3>Nenhum membro na equipe</h3>
          <p>Clique em "+ Novo Membro" para comecar</p>
        </div>`;
      return;
    }

    const roleLabel = { dono: 'Dono', gerente: 'Gerente', mecanico: 'Mecanico', atendente: 'Atendente' };

    container.innerHTML = `
      <table class="data-table">
        <thead>
          <tr>
            <th>Nome</th>
            <th>Funcao</th>
            <th>Comissao</th>
            <th>Status</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          ${lista.map(m => `
            <tr>
              <td>
                <strong>${esc(m.nome)}</strong>
                <br><span style="font-size:12px;color:var(--text-secondary)">${esc(m.email || '')}</span>
              </td>
              <td>${roleLabel[m.role] || m.role}</td>
              <td>${m.comissao_percent ? m.comissao_percent + '%' : '-'}</td>
              <td><span class="badge badge-${m.ativo ? 'pronto' : 'entregue'}">${m.ativo ? 'Ativo' : 'Inativo'}</span></td>
              <td>
                ${['dono','gerente'].includes(APP.profile.role) ? `<button class="btn btn-secondary btn-sm" onclick="EQUIPE.editar('${m.id}')">Editar</button>` : ''}
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>`;
  },

  abrirModal(dados = {}) {
    openModal(`
      <div class="modal-header">
        <h3>${dados.id ? 'Editar Membro' : 'Novo Membro'}</h3>
        <button class="modal-close" onclick="closeModal()">&times;</button>
      </div>
      <div class="modal-body">
        <form id="form-equipe" onsubmit="EQUIPE.salvar(event, '${dados.id || ''}')">
          <div class="form-group">
            <label>Nome *</label>
            <input type="text" class="form-control" id="eq-nome" required value="${esc(dados.nome || '')}">
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
            <div class="form-group">
              <label>Email</label>
              <input type="email" class="form-control" id="eq-email" value="${esc(dados.email || '')}">
            </div>
            <div class="form-group">
              <label>Telefone</label>
              <input type="text" class="form-control" id="eq-telefone" value="${esc(dados.telefone || '')}">
            </div>
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
            <div class="form-group">
              <label>Funcao</label>
              <select class="form-control" id="eq-role">
                <option value="mecanico" ${dados.role === 'mecanico' || !dados.role ? 'selected' : ''}>Mecanico</option>
                <option value="atendente" ${dados.role === 'atendente' ? 'selected' : ''}>Atendente</option>
                <option value="gerente" ${dados.role === 'gerente' ? 'selected' : ''}>Gerente</option>
                <option value="dono" ${dados.role === 'dono' ? 'selected' : ''}>Dono</option>
              </select>
            </div>
            <div class="form-group">
              <label>Comissao (%)</label>
              <input type="number" class="form-control" id="eq-comissao" value="${dados.comissao_percent || APP.oficina?.comissao_padrao || 0}" min="0" max="100" step="0.5">
            </div>
          </div>
          <div class="form-group">
            <label>Status</label>
            <select class="form-control" id="eq-ativo">
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
      nome: document.getElementById('eq-nome').value.trim(),
      email: document.getElementById('eq-email').value.trim(),
      telefone: document.getElementById('eq-telefone').value.trim(),
      role: document.getElementById('eq-role').value,
      comissao_percent: parseFloat(document.getElementById('eq-comissao').value) || 0,
      ativo: document.getElementById('eq-ativo').value === 'true'
    };

    if (id) {
      // Edita membro existente
      const { error } = await db.from('profiles').update(dados).eq('id', id).eq('oficina_id', APP.profile.oficina_id);
      if (error) { APP.toast('Erro: ' + error.message, 'error'); return; }
    } else {
      // Novo membro — usa RPC pra criar sem FK do auth
      dados.oficina_id = APP.profile.oficina_id;
      const { error } = await db.rpc('criar_membro_equipe', {
        p_oficina_id: dados.oficina_id,
        p_nome: dados.nome,
        p_email: dados.email || null,
        p_telefone: dados.telefone || null,
        p_role: dados.role,
        p_comissao: dados.comissao_percent,
        p_ativo: dados.ativo
      });
      if (error) { APP.toast('Erro: ' + error.message, 'error'); return; }
    }

    closeModal();
    APP.toast(id ? 'Membro atualizado' : 'Membro cadastrado');
    this.carregar();
  },

  async editar(id) {
    const { data } = await db.from('profiles').select('*').eq('id', id).single();
    if (data) this.abrirModal(data);
  }
};

document.addEventListener('pageLoad', (e) => {
  if (e.detail.page === 'equipe') EQUIPE.carregar();
});
