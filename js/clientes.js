// RPM Pro — Clientes
const CLIENTES = {
  _veiculoCount: 0,
  _busca: '',
  _offset: 0,
  _limit: 100,
  _lista: [],
  _temMais: false,

  async carregar(append = false) {
    if (!append) {
      this._offset = 0;
      this._lista = [];
    }

    let query = db
      .from('clientes')
      .select('*, veiculos(count)')
      .eq('oficina_id', APP.profile.oficina_id)
      .order('nome')
      .range(this._offset, this._offset + this._limit - 1);

    const busca = this._busca.trim();
    if (busca) {
      query = query.or(`nome.ilike.%${busca}%,whatsapp.ilike.%${busca}%,cpf_cnpj.ilike.%${busca}%`);
    }

    const { data, error } = await query;

    if (error) { APP.toast('Erro ao carregar clientes', 'error'); return; }

    const novos = data || [];
    this._lista = append ? [...this._lista, ...novos] : novos;
    this._temMais = novos.length === this._limit;
    this._offset += novos.length;
    this.render(this._lista);
  },

  _onBusca(valor) {
    this._busca = valor;
    clearTimeout(this._buscaTimer);
    this._buscaTimer = setTimeout(() => this.carregar(), 300);
  },

  render(lista) {
    const container = document.getElementById('clientes-lista');

    const buscaHtml = `
      <div style="margin-bottom:14px;">
        <input type="text" class="form-control" placeholder="Buscar por nome, whatsapp ou CPF/CNPJ..." value="${esc(this._busca)}" oninput="CLIENTES._onBusca(this.value)" style="max-width:400px;">
      </div>`;

    if (!lista.length) {
      container.innerHTML = buscaHtml + `
        <div class="empty-state">
          <div class="icon">👤</div>
          <h3>${this._busca ? 'Nenhum cliente encontrado' : 'Nenhum cliente cadastrado'}</h3>
          <p>${this._busca ? 'Tente outro termo de busca' : 'Clique em "+ Novo Cliente" para comecar'}</p>
        </div>`;
      return;
    }

    container.innerHTML = buscaHtml + `
      <div style="font-size:12px;color:var(--text-secondary);margin-bottom:10px;">Mostrando ${lista.length} clientes${this._busca ? ' (filtrado)' : ''}</div>
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
              <td><strong>${esc(c.nome)}</strong></td>
              <td>${esc(c.whatsapp || c.telefone || '-')}</td>
              <td>${c.veiculos?.[0]?.count || 0}</td>
              <td><span class="badge badge-${c.score === 'ativo' ? 'pronto' : c.score === 'risco' ? 'orcamento' : 'entregue'}">${c.score}</span></td>
              <td style="display:flex;gap:4px;">
                <button class="btn btn-primary btn-sm" onclick="CLIENTES.historico('${c.id}','${esc(c.nome)}')">Historico</button>
                <button class="btn btn-secondary btn-sm" onclick="CLIENTES.editar('${c.id}')">Editar</button>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      ${this._temMais ? `<div style="text-align:center;margin-top:16px;"><button class="btn btn-secondary" onclick="CLIENTES.carregar(true)">Carregar mais</button></div>` : ''}`;
  },

  _onSaveCallback: null,

  async abrirModal(dados = {}, nomePrefill = '', callback = null) {
    if (nomePrefill && !dados) dados = {};
    if (nomePrefill) dados.nome = nomePrefill;
    this._onSaveCallback = callback;
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
            <input type="text" class="form-control" id="cli-nome" required value="${esc(dados.nome || '')}">
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
            <div class="form-group">
              <label>WhatsApp</label>
              <input type="text" class="form-control" id="cli-whatsapp" value="${esc(dados.whatsapp || '')}" placeholder="(00) 00000-0000" maxlength="15" oninput="CLIENTES._maskFone(this)">
            </div>
            <div class="form-group">
              <label>CPF/CNPJ</label>
              <input type="text" class="form-control" id="cli-cpf" value="${esc(dados.cpf_cnpj || '')}" placeholder="000.000.000-00" maxlength="18" oninput="CLIENTES._maskCpfCnpj(this)">
            </div>
          </div>
          <div class="form-group">
            <label>Email</label>
            <input type="email" class="form-control" id="cli-email" value="${esc(dados.email || '')}">
          </div>
          <div class="form-group">
            <label>Endereco</label>
            <input type="text" class="form-control" id="cli-endereco" value="${esc(dados.endereco || '')}">
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
                  <strong>${esc(v.placa)}</strong>
                  <span style="color:var(--text-secondary);font-size:13px;margin-left:8px;">${esc(v.marca || '')} ${esc(v.modelo || '')} ${v.ano || ''}</span>
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
            <textarea class="form-control" id="cli-obs">${esc(dados.observacoes || '')}</textarea>
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
      ({ error } = await db.from('clientes').update(dadosCliente).eq('id', id).eq('oficina_id', oficina_id));
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

    // Callback (ex: voltar pro agendamento)
    if (this._onSaveCallback) {
      const cb = this._onSaveCallback;
      this._onSaveCallback = null;
      cb();
    } else {
      this.carregar();
    }
  },

  async excluirVeiculo(veiculoId, placa, clienteId) {
    if (!confirm(`Excluir o veiculo ${placa}?`)) return;
    const { error } = await db.from('veiculos').delete().eq('id', veiculoId).eq('oficina_id', APP.profile.oficina_id);
    if (error) { APP.toast('Erro: ' + error.message, 'error'); return; }
    APP.toast('Veiculo excluido');
    // Reabre o modal do cliente pra atualizar a lista
    closeModal();
    this.editar(clienteId);
  },

  async editar(id) {
    const { data } = await db.from('clientes').select('*').eq('id', id).single();
    if (data) this.abrirModal(data);
  },

  async historico(clienteId, nome) {
    // Busca OS, veículos e agendamentos do cliente
    const [osRes, veiRes, agRes] = await Promise.all([
      db.from('ordens_servico')
        .select('*, veiculos(placa, marca, modelo), itens_os(tipo, descricao, valor), profiles!ordens_servico_mecanico_id_fkey(nome)')
        .eq('cliente_id', clienteId)
        .eq('oficina_id', APP.profile.oficina_id)
        .order('created_at', { ascending: false }),
      db.from('veiculos')
        .select('*')
        .eq('cliente_id', clienteId)
        .eq('oficina_id', APP.profile.oficina_id)
        .order('placa'),
      db.from('agendamentos')
        .select('*, veiculos(placa)')
        .eq('cliente_id', clienteId)
        .eq('oficina_id', APP.profile.oficina_id)
        .order('data_prevista', { ascending: false })
        .limit(10)
    ]);

    const osList = osRes.data || [];
    const veiculos = veiRes.data || [];
    const agendamentos = agRes.data || [];

    const totalGasto = osList.filter(o => o.status === 'entregue').reduce((s, o) => s + (o.valor_total || 0), 0);
    const totalOS = osList.length;
    const ultimaOS = osList.length ? osList[0] : null;

    const statusCor = { entrada: '#2563eb', diagnostico: '#eab308', orcamento: '#dc2626', aguardando_peca: '#999', execucao: '#16a34a', pronto: '#ccc', entregue: '#8b949e', cancelada: '#f85149' };
    const statusLabel = { entrada: 'Avaliacao', diagnostico: 'Diagnostico', orcamento: 'Aprovacao', aguardando_peca: 'Ag. Peca', execucao: 'Execucao', pronto: 'Pronto', entregue: 'Entregue', cancelada: 'Cancelada' };

    openModal(`
      <div class="modal-header">
        <h3>Historico — ${esc(nome)}</h3>
        <button class="modal-close" onclick="closeModal()">&times;</button>
      </div>
      <div class="modal-body" style="max-height:80vh;overflow-y:auto;">
        <!-- KPIs -->
        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:20px;">
          <div style="background:var(--bg-input);padding:14px;border-radius:var(--radius);text-align:center;">
            <div style="font-size:11px;color:var(--text-muted);">Total OS</div>
            <div style="font-size:24px;font-weight:800;">${totalOS}</div>
          </div>
          <div style="background:var(--bg-input);padding:14px;border-radius:var(--radius);text-align:center;">
            <div style="font-size:11px;color:var(--text-muted);">Total gasto</div>
            <div style="font-size:24px;font-weight:800;color:var(--success);">${APP.formatMoney(totalGasto)}</div>
          </div>
          <div style="background:var(--bg-input);padding:14px;border-radius:var(--radius);text-align:center;">
            <div style="font-size:11px;color:var(--text-muted);">Ultimo atendimento</div>
            <div style="font-size:16px;font-weight:700;">${ultimaOS ? APP.formatDate(ultimaOS.created_at) : '-'}</div>
          </div>
        </div>

        <!-- Filtro por veículo -->
        <div style="margin-bottom:20px;">
          <div style="font-size:13px;font-weight:700;margin-bottom:8px;color:var(--text-secondary);">FILTRAR POR VEICULO</div>
          <div style="display:flex;gap:8px;flex-wrap:wrap;" id="hist-filtro-veiculos">
            <button class="btn btn-primary btn-sm hist-vei-btn" data-vei="" onclick="CLIENTES._filtrarHistorico('')" style="font-size:12px;">Todos (${osList.length})</button>
            ${veiculos.map(v => {
              const qtd = osList.filter(o => o.veiculo_id === v.id).length;
              return `<button class="btn btn-secondary btn-sm hist-vei-btn" data-vei="${v.id}" onclick="CLIENTES._filtrarHistorico('${v.id}')" style="font-size:12px;">
                ${esc(v.placa)} <span style="color:var(--text-muted);">${esc(v.marca || '')} ${esc(v.modelo || '')}</span> (${qtd})
              </button>`;
            }).join('')}
          </div>
        </div>

        <!-- Histórico de OS -->
        <div style="font-size:13px;font-weight:700;margin-bottom:8px;color:var(--text-secondary);">HISTORICO DE MANUTENCOES</div>
        ${osList.length ? osList.map(os => {
          const servicos = (os.itens_os || []).filter(i => i.tipo === 'servico');
          const pecas = (os.itens_os || []).filter(i => i.tipo === 'peca');
          return `
          <div class="hist-os-card" data-veiculo-id="${os.veiculo_id || ''}" style="background:var(--bg-input);border-left:4px solid ${statusCor[os.status] || '#666'};border-radius:var(--radius);padding:14px;margin-bottom:10px;">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
              <div>
                <strong style="font-size:14px;">OS #${os.numero || '-'}</strong>
                <span style="font-size:11px;color:var(--text-muted);margin-left:8px;">${APP.formatDate(os.created_at)}</span>
              </div>
              <div style="display:flex;align-items:center;gap:8px;">
                <span style="font-size:12px;font-weight:700;color:${statusCor[os.status]};">${statusLabel[os.status] || os.status}</span>
                ${os.valor_total ? `<span style="font-size:13px;font-weight:700;">${APP.formatMoney(os.valor_total)}</span>` : ''}
              </div>
            </div>
            <div style="font-size:12px;color:var(--text-secondary);margin-bottom:4px;">
              ${esc(os.veiculos?.placa || '')} ${esc(os.veiculos?.marca || '')} ${esc(os.veiculos?.modelo || '')}
              ${os.km ? ` — ${os.km.toLocaleString('pt-BR')} km` : ''}
              ${os.profiles?.nome ? ` — Mec: ${esc(os.profiles.nome)}` : ''}
            </div>
            ${servicos.length ? `<div style="font-size:12px;margin-top:6px;"><strong style="color:var(--primary);">Servicos:</strong> ${servicos.map(s => esc(s.descricao)).join(', ')}</div>` : ''}
            ${pecas.length ? `<div style="font-size:12px;margin-top:2px;"><strong style="color:var(--info);">Pecas:</strong> ${pecas.map(p => esc(p.descricao)).join(', ')}</div>` : ''}
            ${os.descricao ? `<div style="font-size:11px;color:var(--text-muted);margin-top:4px;">${esc(os.descricao)}</div>` : ''}
          </div>`;
        }).join('') : '<div style="text-align:center;padding:20px;color:var(--text-muted);">Nenhuma OS registrada</div>'}

        <!-- Próximos agendamentos -->
        ${agendamentos.length ? `
        <div style="font-size:13px;font-weight:700;margin:16px 0 8px;color:var(--text-secondary);">AGENDAMENTOS</div>
        ${agendamentos.map(a => `
          <div style="background:var(--bg-input);padding:10px 14px;border-radius:var(--radius);margin-bottom:6px;font-size:12px;display:flex;justify-content:space-between;align-items:center;">
            <div>${APP.formatDate(a.data_prevista)} — ${esc(a.tipo)} ${a.veiculos?.placa ? '(' + esc(a.veiculos.placa) + ')' : ''}</div>
            <span style="font-weight:700;color:${a.status === 'realizado' ? 'var(--success)' : a.status === 'cancelado' ? 'var(--danger)' : 'var(--warning)'};">${a.status}</span>
          </div>
        `).join('')}` : ''}
      </div>
    `);
  },

  _filtrarHistorico(veiculoId) {
    // Atualiza botões
    document.querySelectorAll('.hist-vei-btn').forEach(btn => {
      const isActive = btn.dataset.vei === veiculoId;
      btn.className = `btn btn-${isActive ? 'primary' : 'secondary'} btn-sm hist-vei-btn`;
    });
    // Filtra cards
    document.querySelectorAll('.hist-os-card').forEach(card => {
      card.style.display = (!veiculoId || card.dataset.veiculoId === veiculoId) ? '' : 'none';
    });
  },

  _maskFone(el) {
    let v = el.value.replace(/\D/g, '').slice(0, 11);
    if (v.length > 10) v = v.replace(/^(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    else if (v.length > 6) v = v.replace(/^(\d{2})(\d{4,5})(\d{0,4})/, '($1) $2-$3');
    else if (v.length > 2) v = v.replace(/^(\d{2})(\d{0,5})/, '($1) $2');
    el.value = v;
  },

  _maskCpfCnpj(el) {
    let v = el.value.replace(/\D/g, '');
    if (v.length <= 11) {
      v = v.slice(0, 11);
      if (v.length > 9) v = v.replace(/^(\d{3})(\d{3})(\d{3})(\d{1,2})/, '$1.$2.$3-$4');
      else if (v.length > 6) v = v.replace(/^(\d{3})(\d{3})(\d{1,3})/, '$1.$2.$3');
      else if (v.length > 3) v = v.replace(/^(\d{3})(\d{1,3})/, '$1.$2');
    } else {
      v = v.slice(0, 14);
      if (v.length > 12) v = v.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{1,2})/, '$1.$2.$3/$4-$5');
      else if (v.length > 8) v = v.replace(/^(\d{2})(\d{3})(\d{3})(\d{1,4})/, '$1.$2.$3/$4');
      else if (v.length > 5) v = v.replace(/^(\d{2})(\d{3})(\d{1,3})/, '$1.$2.$3');
      else if (v.length > 2) v = v.replace(/^(\d{2})(\d{1,3})/, '$1.$2');
    }
    el.value = v;
  }
};

document.addEventListener('pageLoad', (e) => {
  if (e.detail.page === 'clientes') CLIENTES.carregar();
});
