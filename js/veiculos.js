// RPM Pro — Veiculos
const VEICULOS = {
  async carregar() {
    const { data, error } = await supabase
      .from('veiculos')
      .select('*, clientes(nome)')
      .eq('oficina_id', APP.profile.oficina_id)
      .order('created_at', { ascending: false });

    if (error) { APP.toast('Erro ao carregar veiculos', 'error'); return; }
    this.render(data || []);
  },

  render(lista) {
    const container = document.getElementById('veiculos-lista');
    if (!lista.length) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="icon">🚗</div>
          <h3>Nenhum veiculo cadastrado</h3>
          <p>Clique em "+ Novo Veiculo" para comecar</p>
        </div>`;
      return;
    }

    container.innerHTML = `
      <table class="data-table">
        <thead>
          <tr>
            <th>Placa</th>
            <th>Veiculo</th>
            <th>Dono</th>
            <th>KM</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          ${lista.map(v => `
            <tr>
              <td><strong>${v.placa}</strong></td>
              <td>${v.marca || ''} ${v.modelo || ''} ${v.ano || ''}</td>
              <td>${v.clientes?.nome || '-'}</td>
              <td>${v.km_atual ? v.km_atual.toLocaleString('pt-BR') + ' km' : '-'}</td>
              <td>
                <button class="btn btn-secondary btn-sm" onclick="VEICULOS.editar('${v.id}')">Editar</button>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>`;
  },

  async abrirModal(dados = {}) {
    // Busca clientes pra dropdown
    const { data: clientes } = await supabase
      .from('clientes')
      .select('id, nome')
      .eq('oficina_id', APP.profile.oficina_id)
      .order('nome');

    openModal(`
      <div class="modal-header">
        <h3>${dados.id ? 'Editar Veiculo' : 'Novo Veiculo'}</h3>
        <button class="modal-close" onclick="closeModal()">&times;</button>
      </div>
      <div class="modal-body">
        <form id="form-veiculo" onsubmit="VEICULOS.salvar(event, '${dados.id || ''}')">
          <div class="form-group">
            <label>Cliente *</label>
            <select class="form-control" id="vei-cliente" required>
              <option value="">Selecione o cliente</option>
              ${(clientes || []).map(c => `<option value="${c.id}" ${c.id === dados.cliente_id ? 'selected' : ''}>${c.nome}</option>`).join('')}
            </select>
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
            <div class="form-group">
              <label>Placa *</label>
              <input type="text" class="form-control" id="vei-placa" required value="${dados.placa || ''}" placeholder="ABC-1D23" style="text-transform:uppercase">
            </div>
            <div class="form-group">
              <label>Ano</label>
              <input type="number" class="form-control" id="vei-ano" value="${dados.ano || ''}" placeholder="2020">
            </div>
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
            <div class="form-group">
              <label>Marca</label>
              <input type="text" class="form-control" id="vei-marca" value="${dados.marca || ''}" placeholder="Fiat, VW, Hyundai...">
            </div>
            <div class="form-group">
              <label>Modelo</label>
              <input type="text" class="form-control" id="vei-modelo" value="${dados.modelo || ''}" placeholder="Gol, HB20, Civic...">
            </div>
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
            <div class="form-group">
              <label>Cor</label>
              <input type="text" class="form-control" id="vei-cor" value="${dados.cor || ''}">
            </div>
            <div class="form-group">
              <label>KM Atual</label>
              <input type="number" class="form-control" id="vei-km" value="${dados.km_atual || ''}">
            </div>
          </div>
          <div class="form-group">
            <label>Observacoes</label>
            <textarea class="form-control" id="vei-obs">${dados.observacoes || ''}</textarea>
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
      cliente_id: document.getElementById('vei-cliente').value,
      placa: document.getElementById('vei-placa').value.trim().toUpperCase(),
      marca: document.getElementById('vei-marca').value.trim(),
      modelo: document.getElementById('vei-modelo').value.trim(),
      ano: document.getElementById('vei-ano').value ? parseInt(document.getElementById('vei-ano').value) : null,
      cor: document.getElementById('vei-cor').value.trim(),
      km_atual: document.getElementById('vei-km').value ? parseInt(document.getElementById('vei-km').value) : null,
      observacoes: document.getElementById('vei-obs').value.trim()
    };

    let error;
    if (id) {
      ({ error } = await supabase.from('veiculos').update(dados).eq('id', id));
    } else {
      ({ error } = await supabase.from('veiculos').insert(dados));
    }

    if (error) { APP.toast('Erro: ' + error.message, 'error'); return; }

    closeModal();
    APP.toast(id ? 'Veiculo atualizado' : 'Veiculo cadastrado');
    this.carregar();
  },

  async editar(id) {
    const { data } = await supabase.from('veiculos').select('*').eq('id', id).single();
    if (data) this.abrirModal(data);
  },

  // Busca veiculo por placa (usado na OS)
  async buscarPorPlaca(placa) {
    const { data } = await supabase
      .from('veiculos')
      .select('*, clientes(id, nome, whatsapp)')
      .eq('oficina_id', APP.profile.oficina_id)
      .eq('placa', placa.toUpperCase())
      .single();
    return data;
  }
};

document.addEventListener('pageLoad', (e) => {
  if (e.detail.page === 'veiculos') VEICULOS.carregar();
});
