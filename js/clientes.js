// RPM Pro — Clientes
const CLIENTES = {
  _veiculoCount: 0,

  async carregar() {
    const { data, error } = await db
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

  async abrirModal(dados = {}) {
    // Se editando, busca veiculos existentes
    let veiculosExistentes = [];
    if (dados.id) {
      const { data } = await db.from('veiculos').select('*').eq('cliente_id', dados.id).order('created_at');
      veiculosExistentes = data || [];
    }

    this._veiculoCount = 0;

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

          <!-- VEICULOS -->
          <div style="border-top:1px solid var(--border);margin-top:20px;padding-top:16px;">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
              <label style="font-size:14px;font-weight:700;margin:0;">Veiculos</label>
              <button type="button" class="btn btn-secondary btn-sm" onclick="CLIENTES.addVeiculoCampo()">+ Veiculo</button>
            </div>
            ${veiculosExistentes.map(v => `
              <div style="background:var(--bg-input);padding:12px;border-radius:var(--radius);margin-bottom:8px;display:flex;align-items:center;justify-content:space-between;">
                <div>
                  <strong>${v.placa}</strong>
                  <span style="color:var(--text-secondary);font-size:13px;margin-left:8px;">${v.marca || ''} ${v.modelo || ''} ${v.ano || ''}</span>
                </div>
                <div style="display:flex;gap:4px;">
                  <button type="button" class="btn btn-secondary btn-sm" onclick="closeModal(); VEICULOS.editar('${v.id}')">Editar</button>
                  <button type="button" class="btn btn-danger btn-sm" onclick="CLIENTES.excluirVeiculo('${v.id}','${v.placa}','${dados.id}')">Excluir</button>
                </div>
              </div>
            `).join('')}
            <div id="cli-veiculos-novos"></div>
          </div>

          <div class="form-group" style="margin-top:16px;">
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

    // Se novo cliente, ja mostra 1 campo de veiculo
    if (!dados.id) this.addVeiculoCampo();
  },

  formatarPlaca(input) {
    let v = input.value.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
    // Formato antigo: ABC-1234 (3 letras + 4 numeros)
    // Formato Mercosul: ABC1D23 (3 letras + 1 num + 1 letra + 2 num)
    if (v.length > 3 && /^[A-Z]{3}[0-9]/.test(v)) {
      if (/^[A-Z]{3}[0-9]{1,4}$/.test(v)) {
        v = v.slice(0, 3) + '-' + v.slice(3);
      }
    }
    if (v.length > 8) v = v.slice(0, 8);
    input.value = v;

    // Validação visual
    const limpo = v.replace('-', '');
    if (limpo.length >= 7) {
      const valido = CLIENTES.validarPlaca(v);
      input.style.borderColor = valido ? 'var(--success)' : 'var(--danger)';
    } else {
      input.style.borderColor = '';
    }
  },

  validarPlaca(placa) {
    const limpo = placa.replace('-', '').toUpperCase();
    // Antigo: ABC1234 (3 letras + 4 numeros)
    const antigo = /^[A-Z]{3}[0-9]{4}$/.test(limpo);
    // Mercosul: ABC1D23 (3 letras + 1 num + 1 letra + 2 num)
    const mercosul = /^[A-Z]{3}[0-9][A-Z][0-9]{2}$/.test(limpo);
    return antigo || mercosul;
  },

  atualizarModelos(i) {
    const marca = document.getElementById('vei-marca-' + i).value;
    const selModelo = document.getElementById('vei-modelo-' + i);
    selModelo.innerHTML = optionsModelos(marca);
    // Se escolher "Outro", troca pra input text
    selModelo.onchange = function() {
      if (this.value === '__outro') {
        const input = document.createElement('input');
        input.type = 'text';
        input.className = 'form-control';
        input.id = 'vei-modelo-' + i;
        input.placeholder = 'Digite o modelo';
        input.style.fontSize = '13px';
        this.replaceWith(input);
        input.focus();
      }
    };
  },

  addVeiculoCampo() {
    const i = this._veiculoCount++;
    const container = document.getElementById('cli-veiculos-novos');
    const div = document.createElement('div');
    div.style.cssText = 'background:var(--bg-input);padding:12px;border-radius:var(--radius);margin-bottom:8px;';
    div.innerHTML = `
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;">
        <div class="form-group" style="margin:0;">
          <label style="font-size:11px;">Placa *</label>
          <input type="text" class="form-control" id="vei-placa-${i}" placeholder="ABC-1234 ou ABC1D23" maxlength="8" style="text-transform:uppercase" oninput="CLIENTES.formatarPlaca(this)">
        </div>
        <div class="form-group" style="margin:0;">
          <label style="font-size:11px;">Marca</label>
          <select class="form-control" id="vei-marca-${i}" onchange="CLIENTES.atualizarModelos(${i})">
            ${optionsMarcas()}
          </select>
        </div>
        <div class="form-group" style="margin:0;">
          <label style="font-size:11px;">Modelo</label>
          <select class="form-control" id="vei-modelo-${i}">
            <option value="">Selecione a marca primeiro</option>
          </select>
        </div>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-top:8px;">
        <div class="form-group" style="margin:0;">
          <label style="font-size:11px;">Ano</label>
          <input type="number" class="form-control" id="vei-ano-${i}" placeholder="2020">
        </div>
        <div class="form-group" style="margin:0;">
          <label style="font-size:11px;">Cor</label>
          <input type="text" class="form-control" id="vei-cor-${i}" placeholder="Branco, Prata...">
        </div>
        <div class="form-group" style="margin:0;">
          <label style="font-size:11px;">KM Atual</label>
          <input type="number" class="form-control" id="vei-km-${i}" placeholder="50000">
        </div>
      </div>
    `;
    container.appendChild(div);
  },

  async salvar(e, id) {
    e.preventDefault();
    const oficina_id = APP.profile.oficina_id;
    const dadosCliente = {
      oficina_id,
      nome: document.getElementById('cli-nome').value.trim(),
      whatsapp: document.getElementById('cli-whatsapp').value.trim(),
      cpf_cnpj: document.getElementById('cli-cpf').value.trim(),
      email: document.getElementById('cli-email').value.trim(),
      endereco: document.getElementById('cli-endereco').value.trim(),
      observacoes: document.getElementById('cli-obs').value.trim()
    };

    let clienteId = id;
    let error;

    if (id) {
      ({ error } = await db.from('clientes').update(dadosCliente).eq('id', id));
    } else {
      // Checa duplicata por nome na mesma oficina
      const { data: existe } = await db.from('clientes')
        .select('id')
        .eq('oficina_id', oficina_id)
        .ilike('nome', dadosCliente.nome)
        .maybeSingle();

      if (existe) {
        if (!confirm(`Ja existe um cliente "${dadosCliente.nome}". Criar mesmo assim?`)) return;
      }

      const res = await db.from('clientes').insert(dadosCliente).select().single();
      error = res.error;
      if (res.data) clienteId = res.data.id;
    }

    if (error) { APP.toast('Erro: ' + error.message, 'error'); return; }

    // Salva veiculos novos
    const veiculos = [];
    for (let i = 0; i < this._veiculoCount; i++) {
      const placa = (document.getElementById('vei-placa-' + i)?.value || '').trim().toUpperCase();
      if (!placa) continue;
      if (!CLIENTES.validarPlaca(placa)) {
        APP.toast('Placa "' + placa + '" invalida. Use formato ABC-1234 ou ABC1D23', 'error');
        return;
      }
      veiculos.push({
        oficina_id,
        cliente_id: clienteId,
        placa,
        marca: (document.getElementById('vei-marca-' + i)?.value || '').trim(),
        modelo: (document.getElementById('vei-modelo-' + i)?.value || '').trim(),
        ano: document.getElementById('vei-ano-' + i)?.value ? parseInt(document.getElementById('vei-ano-' + i).value) : null,
        cor: (document.getElementById('vei-cor-' + i)?.value || '').trim(),
        km_atual: document.getElementById('vei-km-' + i)?.value ? parseInt(document.getElementById('vei-km-' + i).value) : null
      });
    }

    if (veiculos.length) {
      const { error: vErr } = await db.from('veiculos').insert(veiculos);
      if (vErr) { APP.toast('Cliente salvo, mas erro no veiculo: ' + vErr.message, 'error'); }
    }

    closeModal();
    APP.toast(id ? 'Cliente atualizado' : 'Cliente cadastrado');
    this.carregar();
  },

  async excluirVeiculo(veiculoId, placa, clienteId) {
    if (!confirm(`Excluir o veiculo ${placa}?`)) return;
    const { error } = await db.from('veiculos').delete().eq('id', veiculoId);
    if (error) { APP.toast('Erro: ' + error.message, 'error'); return; }
    APP.toast('Veiculo excluido');
    // Reabre o modal do cliente pra atualizar a lista
    closeModal();
    this.editar(clienteId);
  },

  async editar(id) {
    const { data } = await db.from('clientes').select('*').eq('id', id).single();
    if (data) this.abrirModal(data);
  }
};

document.addEventListener('pageLoad', (e) => {
  if (e.detail.page === 'clientes') CLIENTES.carregar();
});
