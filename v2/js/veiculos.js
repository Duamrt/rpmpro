// RPM Pro — Veiculos
const VEICULOS = {
  async carregar() {
    const { data, error } = await db
      .from('veiculos')
      .select('*, clientes(nome)')
      .eq('oficina_id', APP.oficinaId)
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

    container.innerHTML = window.innerWidth <= 768 ? `
      <div class="mobile-card-list">
        ${lista.map(v => `
          <div class="mobile-card" onclick="VEICULOS.abrirHistorico('${v.id}','${escAttr(v.placa)}')">
            <div class="mobile-card-header">
              <div>
                <div class="mobile-card-title">${esc(v.placa)}</div>
                <div class="mobile-card-subtitle">${esc(v.marca || '')} ${esc(v.modelo || '')} ${v.ano || ''}</div>
              </div>
              <span style="font-size:12px;color:var(--text-secondary);">${v.km_atual ? v.km_atual.toLocaleString('pt-BR') + ' km' : ''}</span>
            </div>
            <div class="mobile-card-body">
              <div class="mobile-card-row"><span>Dono</span><strong>${esc(v.clientes?.nome || '-')}</strong></div>
            </div>
            <div class="mobile-card-actions">
              <button class="btn btn-secondary btn-sm" onclick="event.stopPropagation();VEICULOS.editar('${v.id}')">Editar</button>
            </div>
          </div>
        `).join('')}
      </div>` : `
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
              <td><strong>${esc(v.placa)}</strong></td>
              <td>${esc(v.marca || '')} ${esc(v.modelo || '')} ${v.ano || ''}</td>
              <td>${esc(v.clientes?.nome || '-')}</td>
              <td>${v.km_atual ? v.km_atual.toLocaleString('pt-BR') + ' km' : '-'}</td>
              <td style="display:flex;gap:4px;flex-wrap:wrap;">
                <button class="btn btn-secondary btn-sm" onclick="VEICULOS.abrirHistorico('${v.id}','${escAttr(v.placa)}')">Historico</button>
                <button class="btn btn-secondary btn-sm" onclick="VEICULOS.editar('${v.id}')">Editar</button>
                <button class="btn btn-danger btn-sm" onclick="VEICULOS.excluir('${v.id}','${v.placa}')">Excluir</button>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>`;
  },

  async abrirModal(dados = {}) {
    // Busca clientes pra dropdown
    const { data: clientes } = await db
      .from('clientes')
      .select('id, nome')
      .eq('oficina_id', APP.oficinaId)
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
              ${(clientes || []).map(c => `<option value="${c.id}" ${c.id === dados.cliente_id ? 'selected' : ''}>${esc(c.nome)}</option>`).join('')}
            </select>
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
            <div class="form-group">
              <label>Placa *</label>
              <input type="text" class="form-control" id="vei-placa" required value="${esc(dados.placa || '')}" placeholder="ABC-1234 ou ABC1D23" maxlength="8" style="text-transform:uppercase" oninput="CLIENTES.formatarPlaca(this)">
            </div>
            <div class="form-group">
              <label>Ano</label>
              <input type="number" class="form-control" id="vei-ano" value="${dados.ano || ''}" placeholder="2020">
            </div>
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
            <div class="form-group">
              <label>Marca</label>
              ${dados.marca && !getMarcas().includes(dados.marca)
                ? `<input type="text" class="form-control" id="vei-marca" value="${esc(dados.marca)}" placeholder="Digite a marca">`
                : `<select class="form-control" id="vei-marca" onchange="VEICULOS._onChangeMarca()">
                ${optionsMarcas(dados.marca)}
              </select>`}
            </div>
            <div class="form-group">
              <label>Modelo</label>
              ${dados.marca && !getMarcas().includes(dados.marca)
                ? `<input type="text" class="form-control" id="vei-modelo" value="${esc(dados.modelo || '')}" placeholder="Digite o modelo">`
                : `<select class="form-control" id="vei-modelo">
                ${dados.marca ? optionsModelos(dados.marca, dados.modelo) : '<option value="">Selecione a marca primeiro</option>'}
              </select>`}
            </div>
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
            <div class="form-group">
              <label>Cor</label>
              <input type="text" class="form-control" id="vei-cor" value="${esc(dados.cor || '')}">
            </div>
            <div class="form-group">
              <label>KM Atual</label>
              <input type="number" class="form-control" id="vei-km" value="${dados.km_atual || ''}">
            </div>
          </div>
          <div class="form-group">
            <label>Observacoes</label>
            <textarea class="form-control" id="vei-obs">${esc(dados.observacoes || '')}</textarea>
          </div>
          <div class="modal-footer" style="padding:16px 0 0;border:0;">
            <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancelar</button>
            <button type="submit" class="btn btn-primary">Salvar</button>
          </div>
        </form>
      </div>
    `);
  },

  _onChangeMarca() {
    const sel = document.getElementById('vei-marca');
    if (sel.value === '__outro') {
      const input = document.createElement('input');
      input.type = 'text';
      input.className = 'form-control';
      input.id = 'vei-marca';
      input.placeholder = 'Digite a marca';
      sel.replaceWith(input);
      input.focus();
      // Modelo vira input livre também
      const selModelo = document.getElementById('vei-modelo');
      const inputModelo = document.createElement('input');
      inputModelo.type = 'text';
      inputModelo.className = 'form-control';
      inputModelo.id = 'vei-modelo';
      inputModelo.placeholder = 'Digite o modelo';
      selModelo.replaceWith(inputModelo);
    } else {
      this._atualizarModelos();
    }
  },

  _atualizarModelos() {
    const marca = document.getElementById('vei-marca').value;
    const sel = document.getElementById('vei-modelo');
    sel.innerHTML = optionsModelos(marca);
    sel.onchange = function() {
      if (this.value === '__outro') {
        const input = document.createElement('input');
        input.type = 'text';
        input.className = 'form-control';
        input.id = 'vei-modelo';
        input.placeholder = 'Digite o modelo';
        this.replaceWith(input);
        input.focus();
      }
    };
  },

  async salvar(e, id) {
    e.preventDefault();
    const placaVal = document.getElementById('vei-placa').value.trim().toUpperCase();
    if (!CLIENTES.validarPlaca(placaVal)) {
      APP.toast('Placa invalida. Use formato ABC-1234 ou ABC1D23', 'error');
      return;
    }
    const dados = {
      oficina_id: APP.oficinaId,
      cliente_id: document.getElementById('vei-cliente').value,
      placa: placaVal,
      marca: document.getElementById('vei-marca').value.trim(),
      modelo: document.getElementById('vei-modelo').value.trim(),
      ano: document.getElementById('vei-ano').value ? parseInt(document.getElementById('vei-ano').value) : null,
      cor: document.getElementById('vei-cor').value.trim(),
      km_atual: document.getElementById('vei-km').value ? parseInt(document.getElementById('vei-km').value) : null,
      observacoes: document.getElementById('vei-obs').value.trim()
    };

    let error;
    if (id) {
      ({ error } = await db.from('veiculos').update(dados).eq('id', id).eq('oficina_id', APP.oficinaId));
    } else {
      ({ error } = await db.from('veiculos').insert(dados));
    }

    if (error) { APP.toast('Erro: ' + error.message, 'error'); return; }

    closeModal();
    APP.toast(id ? 'Veiculo atualizado' : 'Veiculo cadastrado');
    this.carregar();
  },

  async editar(id) {
    const { data } = await db.from('veiculos').select('*').eq('id', id).eq('oficina_id', APP.oficinaId).single();
    if (data) this.abrirModal(data);
  },

  async excluir(id, placa) {
    if (!confirm(`Excluir o veiculo ${placa}? Isso vai remover o historico de OS vinculado.`)) return;
    const { error } = await db.from('veiculos').delete().eq('id', id).eq('oficina_id', APP.oficinaId);
    if (error) { APP.toast('Erro: ' + error.message, 'error'); return; }
    APP.toast('Veiculo excluido');
    this.carregar();
  },

  // Historico de OS do veiculo
  async abrirHistorico(veiculoId, placa) {
    const { data: osList, error } = await db
      .from('ordens_servico')
      .select('*, profiles!ordens_servico_mecanico_id_fkey(nome)')
      .eq('oficina_id', APP.oficinaId)
      .eq('veiculo_id', veiculoId)
      .order('data_entrada', { ascending: false });

    if (error) { APP.toast('Erro ao carregar historico', 'error'); return; }

    const statusLabel = {
      entrada: 'Entrada', diagnostico: 'Diagnostico', orcamento: 'Orcamento',
      aprovada: 'Aprovada', aguardando_peca: 'Aguardando Peca', execucao: 'Em execucao',
      pronto: 'Pronto', entregue: 'Entregue', cancelada: 'Cancelada'
    };

    const lista = osList || [];
    const conteudo = lista.length
      ? lista.map(os => `
        <div style="background:var(--bg-input);border-radius:var(--radius);padding:12px;margin-bottom:8px;cursor:pointer;" onclick="closeModal();setTimeout(()=>OS.abrirDetalhes('${os.id}'),200)">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
            <strong style="color:var(--primary);">OS #${esc(os.numero || '-')}</strong>
            <span class="badge badge-${os.status}">${statusLabel[os.status] || os.status}</span>
          </div>
          <div style="font-size:13px;color:var(--text-secondary);margin-bottom:4px;">${APP.formatDate(os.data_entrada)}</div>
          <div style="font-size:13px;">${esc(os.descricao || 'Sem descricao')}</div>
          <div style="display:flex;justify-content:space-between;margin-top:6px;font-size:13px;">
            <span style="color:var(--text-secondary);">Mecanico: ${esc(os.profiles?.nome || 'Nao definido')}</span>
            <span style="font-weight:700;color:var(--success);">${APP.formatMoney(os.valor_total)}</span>
          </div>
        </div>
      `).join('')
      : '<div style="text-align:center;padding:40px 20px;color:var(--text-secondary);"><div style="font-size:36px;margin-bottom:12px;">🔧</div><p>Nenhum servico registrado para este veiculo</p></div>';

    const totalGasto = lista.reduce((s, os) => s + (os.valor_total || 0), 0);

    openModal(`
      <div class="modal-header">
        <h3>Historico — ${esc(placa)}</h3>
        <button class="modal-close" onclick="closeModal()">&times;</button>
      </div>
      <div class="modal-body">
        ${lista.length ? `<div style="display:flex;justify-content:space-between;margin-bottom:12px;padding:10px 14px;background:var(--bg-input);border-radius:var(--radius);">
          <span style="font-size:13px;color:var(--text-secondary);">${lista.length} OS registrada${lista.length > 1 ? 's' : ''}</span>
          <span style="font-size:13px;font-weight:700;color:var(--success);">Total: ${APP.formatMoney(totalGasto)}</span>
        </div>` : ''}
        ${conteudo}
      </div>
    `);
  },

  // Busca veiculo por placa (usado na OS)
  async buscarPorPlaca(placa) {
    const { data } = await db
      .from('veiculos')
      .select('*, clientes(id, nome, whatsapp)')
      .eq('oficina_id', APP.oficinaId)
      .eq('placa', placa.toUpperCase())
      .single();
    return data;
  }
};

document.addEventListener('pageLoad', (e) => {
  if (e.detail.page === 'veiculos') VEICULOS.carregar();
});
