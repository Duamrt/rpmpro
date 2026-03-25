// RPM Pro — Clientes
const CLIENTES = {
  async carregar() {
    const { data, error } = await supabase
      .from('clientes')
      .select('*, veiculos(count)')
      .eq('oficina_id', APP.profile.oficina_id)
      .order('nome');

    if (error) { APP.toast('Erro ao carregar clientes', 'error'); return; }
    this.render(data || []);
  },

  render(lista) {
    const container = document.getElementById('clientes-lista');
    if (!lista.length) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="icon">👤</div>
          <h3>Nenhum cliente cadastrado</h3>
          <p>Clique em "+ Novo Cliente" para comecar</p>
        </div>`;
      return;
    }

    container.innerHTML = `
      <table class="data-table">
        <thead>
          <tr>
            <th>Nome</th>
            <th>WhatsApp</th>
            <th>Veiculos</th>
            <th>Status</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          ${lista.map(c => `
            <tr>
              <td><strong>${c.nome}</strong></td>
              <td>${c.whatsapp || c.telefone || '-'}</td>
              <td>${c.veiculos?.[0]?.count || 0}</td>
              <td><span class="badge badge-${c.score === 'ativo' ? 'pronto' : c.score === 'risco' ? 'orcamento' : 'entregue'}">${c.score}</span></td>
              <td>
                <button class="btn btn-secondary btn-sm" onclick="CLIENTES.editar('${c.id}')">Editar</button>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>`;
  },

  abrirModal(dados = {}) {
    openModal(`
      <div class="modal-header">
        <h3>${dados.id ? 'Editar Cliente' : 'Novo Cliente'}</h3>
        <button class="modal-close" onclick="closeModal()">&times;</button>
      </div>
      <div class="modal-body">
        <form id="form-cliente" onsubmit="CLIENTES.salvar(event, '${dados.id || ''}')">
          <div class="form-group">
            <label>Nome *</label>
            <input type="text" class="form-control" id="cli-nome" required value="${dados.nome || ''}">
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
            <div class="form-group">
              <label>WhatsApp</label>
              <input type="text" class="form-control" id="cli-whatsapp" value="${dados.whatsapp || ''}" placeholder="(00) 00000-0000">
            </div>
            <div class="form-group">
              <label>CPF/CNPJ</label>
              <input type="text" class="form-control" id="cli-cpf" value="${dados.cpf_cnpj || ''}">
            </div>
          </div>
          <div class="form-group">
            <label>Email</label>
            <input type="email" class="form-control" id="cli-email" value="${dados.email || ''}">
          </div>
          <div class="form-group">
            <label>Endereco</label>
            <input type="text" class="form-control" id="cli-endereco" value="${dados.endereco || ''}">
          </div>
          <div class="form-group">
            <label>Observacoes</label>
            <textarea class="form-control" id="cli-obs">${dados.observacoes || ''}</textarea>
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
      nome: document.getElementById('cli-nome').value.trim(),
      whatsapp: document.getElementById('cli-whatsapp').value.trim(),
      cpf_cnpj: document.getElementById('cli-cpf').value.trim(),
      email: document.getElementById('cli-email').value.trim(),
      endereco: document.getElementById('cli-endereco').value.trim(),
      observacoes: document.getElementById('cli-obs').value.trim()
    };

    let error;
    if (id) {
      ({ error } = await supabase.from('clientes').update(dados).eq('id', id));
    } else {
      ({ error } = await supabase.from('clientes').insert(dados));
    }

    if (error) { APP.toast('Erro: ' + error.message, 'error'); return; }

    closeModal();
    APP.toast(id ? 'Cliente atualizado' : 'Cliente cadastrado');
    this.carregar();
  },

  async editar(id) {
    const { data } = await supabase.from('clientes').select('*').eq('id', id).single();
    if (data) this.abrirModal(data);
  }
};

document.addEventListener('pageLoad', (e) => {
  if (e.detail.page === 'clientes') CLIENTES.carregar();
});
