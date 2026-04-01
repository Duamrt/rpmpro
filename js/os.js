// RPM Pro — Ordens de Servico
const OS = {
  _pagina: 0,
  _porPagina: 20,
  _totalOS: 0,
  _listaCompleta: [],
  _busca: '',
  _filtroStatus: '',

  async carregar() {
    this._pagina = 0;

    // Busca total e dados
    let query = db
      .from('ordens_servico')
      .select('*, veiculos(placa, marca, modelo), clientes(nome), profiles!ordens_servico_mecanico_id_fkey(nome)', { count: 'exact' })
      .eq('oficina_id', APP.oficinaId)
      .order('created_at', { ascending: false });

    if (this._filtroStatus) {
      query = query.eq('status', this._filtroStatus);
    }

    const { data, error, count } = await query;
    if (error) { APP.toast('Erro ao carregar OS', 'error'); return; }

    this._totalOS = count || 0;
    this._listaCompleta = data || [];
    this.render();
  },

  _filtrar() {
    let lista = this._listaCompleta;
    const busca = this._busca.toLowerCase().trim();
    if (busca) {
      lista = lista.filter(os => {
        const placa = (os.veiculos?.placa || '').toLowerCase();
        const cliente = (os.clientes?.nome || '').toLowerCase();
        const numero = String(os.numero || '').toLowerCase();
        const desc = (os.descricao || '').toLowerCase();
        return placa.includes(busca) || cliente.includes(busca) || numero.includes(busca) || desc.includes(busca);
      });
    }
    return lista;
  },

  render() {
    const container = document.getElementById('os-lista');
    const listaFiltrada = this._filtrar();
    const inicio = 0;
    const fim = (this._pagina + 1) * this._porPagina;
    const paginada = listaFiltrada.slice(inicio, fim);
    const temMais = fim < listaFiltrada.length;

    if (!this._listaCompleta.length && !this._busca && !this._filtroStatus) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="icon">🔧</div>
          <h3>Nenhuma OS registrada</h3>
          <p>Clique em "+ Nova OS" para criar a primeira</p>
        </div>`;
      return;
    }

    const statusLabel = {
      entrada: 'Entrada', diagnostico: 'Diagnostico', orcamento: 'Orcamento',
      aprovada: 'Aprovada', aguardando_peca: 'Aguardando Peca', execucao: 'Em execucao', pronto: 'Pronto',
      entregue: 'Entregue', cancelada: 'Cancelada'
    };

    container.innerHTML = `
      <!-- Busca e filtros -->
      <div style="display:flex;gap:10px;margin-bottom:14px;flex-wrap:wrap;align-items:center;">
        <input type="text" class="form-control" id="os-busca" placeholder="Buscar por placa, cliente, numero, descricao..." value="${esc(this._busca)}" oninput="OS._busca=this.value;OS._pagina=0;OS.render()" style="flex:1;min-width:200px;">
        <select class="form-control" id="os-filtro-status" onchange="OS._filtroStatus=this.value;OS.carregar()" style="max-width:200px;">
          <option value="">Todos os status</option>
          ${Object.entries(statusLabel).map(([k,v]) => `<option value="${k}" ${k === this._filtroStatus ? 'selected' : ''}>${v}</option>`).join('')}
        </select>
      </div>
      <div style="font-size:12px;color:var(--text-secondary);margin-bottom:10px;">Mostrando ${paginada.length} de ${listaFiltrada.length} ordens${this._busca ? ' (filtrado)' : ''}</div>

      ${paginada.length ? (window.innerWidth <= 768 ? `
      <div class="mobile-card-list">
        ${paginada.map(os => `
          <div class="mobile-card" onclick="OS.abrirDetalhes('${os.id}')">
            <div class="mobile-card-header">
              <div>
                <div class="mobile-card-title">${esc(os.veiculos?.placa || '-')} <span style="font-size:12px;color:var(--text-secondary);font-weight:400;">#${esc(os.numero || '-')}</span></div>
                <div class="mobile-card-subtitle">${esc(os.veiculos?.marca || '')} ${esc(os.veiculos?.modelo || '')} · ${esc(os.clientes?.nome || '-')}</div>
              </div>
              <span class="mobile-card-value">${APP.formatMoney(os.valor_total)}</span>
            </div>
            <div class="mobile-card-body">
              <div class="mobile-card-row"><span>${esc(os.profiles?.nome || 'Sem mecânico')}</span> <span class="badge badge-${os.status}">${statusLabel[os.status] || esc(os.status)}</span></div>
              <div class="mobile-card-row"><span style="font-size:11px;">${APP.formatDate(os.data_entrada)}</span></div>
            </div>
          </div>
        `).join('')}
      </div>` : `
      <table class="data-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Veiculo</th>
            <th>Cliente</th>
            <th>Mecanico</th>
            <th>Valor</th>
            <th>Status</th>
            <th>Data</th>
          </tr>
        </thead>
        <tbody>
          ${paginada.map(os => `
            <tr style="cursor:pointer" onclick="OS.abrirDetalhes('${os.id}')">
              <td><strong>${esc(os.numero || '-')}</strong></td>
              <td>
                <strong>${esc(os.veiculos?.placa || '-')}</strong><br>
                <span style="font-size:12px;color:var(--text-secondary)">${esc(os.veiculos?.marca || '')} ${esc(os.veiculos?.modelo || '')}</span>
              </td>
              <td>${esc(os.clientes?.nome || '-')}</td>
              <td>${esc(os.profiles?.nome || '-')}</td>
              <td>${APP.formatMoney(os.valor_total)}</td>
              <td><span class="badge badge-${os.status}">${statusLabel[os.status] || esc(os.status)}</span></td>
              <td style="font-size:12px;color:var(--text-secondary)">${APP.formatDate(os.data_entrada)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>`) +
      (temMais ? `<div style="text-align:center;margin-top:14px;"><button class="btn btn-secondary" onclick="OS._pagina++;OS.render()">Carregar mais (${listaFiltrada.length - fim} restantes)</button></div>` : '')
      : `<div class="empty-state"><div class="icon">🔍</div><h3>Nenhuma OS encontrada</h3><p>Tente alterar os filtros de busca</p></div>`}
    `;
  },

  async abrirModal() {
    this._servicosSelecionados = [];
    // Busca mecanicos
    const { data: mecanicos } = await db
      .from('profiles')
      .select('id, nome')
      .eq('oficina_id', APP.oficinaId)
      .in('role', ['mecanico', 'aux_mecanico', 'dono', 'gerente'])
      .eq('ativo', true)
      .order('nome');

    openModal(`
      <div class="modal-header">
        <h3>Nova Ordem de Servico</h3>
        <button class="modal-close" onclick="closeModal()">&times;</button>
      </div>
      <div class="modal-body">
        <form id="form-os" onsubmit="OS.salvar(event)">
          <div class="form-group">
            <label>Placa do veiculo *</label>
            <input type="text" class="form-control" id="os-placa" required placeholder="ABC-1234 ou ABC1D23" maxlength="8" style="text-transform:uppercase" oninput="CLIENTES.formatarPlaca(this); OS.buscarPlaca(this.value)">
            <div id="os-placa-info" style="font-size:12px;color:var(--text-secondary);margin-top:4px;"></div>
          </div>

          <input type="hidden" id="os-veiculo-id">
          <input type="hidden" id="os-cliente-id">

          <!-- Campos de novo cliente/veiculo (aparecem se placa nao encontrada) -->
          <div id="os-novo-registro" class="hidden">
            <div style="background:var(--warning-bg);padding:10px 14px;border-radius:var(--radius);margin-bottom:16px;font-size:13px;color:var(--warning);">
              Veiculo nao encontrado. Preencha os dados abaixo:
            </div>
            <div class="form-group">
              <label>Nome do cliente *</label>
              <input type="text" class="form-control" id="os-novo-cliente">
            </div>
            <div class="form-group">
              <label>WhatsApp do cliente</label>
              <input type="text" class="form-control" id="os-novo-whatsapp" placeholder="(00) 00000-0000">
            </div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
              <div class="form-group">
                <label>Marca</label>
                <select class="form-control" id="os-novo-marca" onchange="OS._atualizarModelos()">
                  ${optionsMarcas()}
                </select>
              </div>
              <div class="form-group">
                <label>Modelo</label>
                <select class="form-control" id="os-novo-modelo">
                  <option value="">Selecione a marca primeiro</option>
                </select>
              </div>
            </div>
            <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;">
              <div class="form-group">
                <label>Ano</label>
                <input type="number" class="form-control" id="os-novo-ano" placeholder="2020">
              </div>
              <div class="form-group">
                <label>Cor</label>
                <input type="text" class="form-control" id="os-novo-cor" placeholder="Branco, Prata...">
              </div>
              <div class="form-group">
                <label>KM Atual</label>
                <input type="number" class="form-control" id="os-novo-km-atual" placeholder="50000">
              </div>
            </div>
          </div>

          <div class="form-group">
            <label>Mecanico responsavel</label>
            <select class="form-control" id="os-mecanico">
              <option value="">Sem mecanico (definir depois)</option>
              ${(mecanicos || []).map(m => `<option value="${m.id}">${esc(m.nome)}</option>`).join('')}
            </select>
          </div>

          <div class="form-group" style="position:relative;">
            <label>Tipo de servico</label>
            <input type="text" class="form-control" id="os-servico-busca" placeholder="Digite pra buscar servico..." autocomplete="off" oninput="OS._buscarServico(this.value, 'os-servico-sugestoes', 'abertura')">
            <div id="os-servico-sugestoes" class="hidden" style="position:absolute;left:0;right:0;top:100%;background:var(--bg-card);border:1px solid var(--border);border-radius:var(--radius);max-height:200px;overflow-y:auto;z-index:10;"></div>
          </div>

          <div class="form-group">
            <label>Descricao / detalhes</label>
            <textarea class="form-control" id="os-descricao" placeholder="Detalhes adicionais, observacoes do cliente, etc."></textarea>
          </div>

          <div id="os-servicos-lista" style="margin-bottom:12px;"></div>
          <div id="os-servico-manual" class="hidden" style="display:none;gap:8px;align-items:center;margin-bottom:16px;">
            <input type="text" class="form-control" id="os-servico-manual-input" placeholder="Digite o servico" style="flex:1;">
            <button type="button" class="btn btn-primary btn-sm" onclick="OS._confirmarServicoManual()">Add</button>
            <button type="button" class="btn btn-secondary btn-sm" onclick="OS._fecharServicoManual()">X</button>
          </div>
          <button type="button" class="btn btn-secondary btn-sm" id="os-btn-add-servico" onclick="OS._abrirServicoManual()" style="margin-bottom:16px;">+ Adicionar outro servico</button>

          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
            <div class="form-group">
              <label>KM de entrada</label>
              <input type="number" class="form-control" id="os-km">
            </div>
            <div class="form-group">
              <label>Status inicial</label>
              <select class="form-control" id="os-status">
                <option value="entrada">Entrada</option>
                <option value="diagnostico">Diagnostico</option>
                <option value="orcamento">Orcamento</option>
              </select>
            </div>
          </div>

          <div class="modal-footer" style="padding:16px 0 0;border:0;">
            <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancelar</button>
            <button type="submit" class="btn btn-primary">Abrir OS</button>
          </div>
        </form>
      </div>
    `);
  },

  _servicosSelecionados: [], // [{nome, valor}]

  _servicosCache: null,

  async _carregarServicosCache() {
    if (this._servicosCache) return this._servicosCache;
    // Prioriza catálogo da oficina
    if (typeof SERVICOS !== 'undefined') {
      const oficina = await SERVICOS.getServicosOficina();
      if (oficina.length) {
        this._servicosCache = oficina.map(s => ({ nome: s.nome, valor: s.valor_padrao, categoria: s.categoria }));
        return this._servicosCache;
      }
    }
    // Fallback: catálogo fixo
    const lista = [];
    for (const [cat, servicos] of Object.entries(CATALOGO_SERVICOS)) {
      servicos.forEach(s => lista.push({ nome: s.nome, valor: s.valor, categoria: cat }));
    }
    this._servicosCache = lista;
    return lista;
  },

  async _buscarServico(val, sugId, contexto) {
    const termo = val.trim().toLowerCase();
    const sugEl = document.getElementById(sugId);
    if (termo.length < 2) { sugEl.classList.add('hidden'); return; }

    const todos = await this._carregarServicosCache();
    const resultados = todos.filter(s =>
      s.nome.toLowerCase().includes(termo) || s.categoria.toLowerCase().includes(termo)
    ).slice(0, 12);

    if (!resultados.length) {
      sugEl.innerHTML = '<div style="padding:8px 12px;font-size:13px;color:var(--text-secondary);">Nenhum servico encontrado</div>';
      sugEl.classList.remove('hidden');
      return;
    }

    sugEl.innerHTML = resultados.map(s => `
      <div style="padding:8px 12px;cursor:pointer;border-bottom:1px solid var(--border);font-size:13px;"
           onmouseover="this.style.background='rgba(255,69,0,0.1)'" onmouseout="this.style.background=''"
           onclick="OS._selecionarServicoBusca('${escAttr(s.nome).replace(/'/g, "\\'")}', ${s.valor}, '${sugId}', '${contexto}')">
        <strong>${esc(s.nome)}</strong>
        <span style="color:var(--text-secondary);font-size:11px;margin-left:8px;">${esc(s.categoria)}</span>
        <span style="float:right;color:var(--success);font-weight:700;">R$ ${(s.valor || 0).toFixed(2)}</span>
      </div>
    `).join('');
    sugEl.classList.remove('hidden');
  },

  _selecionarServicoBusca(nome, valor, sugId, contexto) {
    document.getElementById(sugId).classList.add('hidden');

    if (contexto === 'abertura') {
      // Modal de abertura de OS
      if (this._servicosSelecionados.find(s => s.nome === nome)) {
        APP.toast('Servico ja adicionado', 'warning');
        return;
      }
      this._servicosSelecionados.push({ nome, valor });
      this._renderServicos();
      document.getElementById('os-servico-busca').value = '';
    } else {
      // Detalhe da OS — preenche campo
      document.getElementById('det-servico-busca').value = nome;
      document.getElementById('det-servico-nome-selecionado').value = nome;
      document.getElementById('det-servico-valor').value = valor.toFixed(2);
    }
  },

  _selecionarServico(nome) {
    if (!nome || nome === '__outro') return;
    if (this._servicosSelecionados.find(s => s.nome === nome)) {
      APP.toast('Servico ja adicionado', 'warning');
      return;
    }
    const valor = getValorServico(nome);
    this._servicosSelecionados.push({ nome, valor });
    this._renderServicos();
  },

  _abrirServicoManual() {
    const div = document.getElementById('os-servico-manual');
    div.classList.remove('hidden');
    div.style.display = 'flex';
    document.getElementById('os-btn-add-servico').classList.add('hidden');
    document.getElementById('os-servico-manual-input').focus();
  },

  _fecharServicoManual() {
    document.getElementById('os-servico-manual').style.display = 'none';
    document.getElementById('os-btn-add-servico').classList.remove('hidden');
    document.getElementById('os-servico-manual-input').value = '';
  },

  _confirmarServicoManual() {
    const input = document.getElementById('os-servico-manual-input');
    const val = input.value.trim();
    if (!val) return;
    this._servicosSelecionados.push({ nome: val, valor: 0 });
    this._renderServicos();
    input.value = '';
    input.focus();
  },

  _renderServicos() {
    const container = document.getElementById('os-servicos-lista');
    if (!this._servicosSelecionados.length) {
      container.innerHTML = '';
      return;
    }
    const total = this._servicosSelecionados.reduce((s, x) => s + x.valor, 0);
    container.innerHTML = this._servicosSelecionados.map((s, i) => `
      <div style="display:flex;align-items:center;justify-content:space-between;background:var(--bg-input);padding:8px 12px;border-radius:var(--radius);margin-bottom:4px;">
        <span style="font-size:13px;flex:1;">${esc(s.nome)}</span>
        <input type="number" value="${s.valor}" min="0" step="0.01" style="width:90px;background:var(--bg);border:1px solid var(--border);border-radius:var(--radius);color:var(--text);padding:4px 8px;font-size:13px;text-align:right;font-family:inherit;" onchange="OS._atualizarValorServico(${i}, this.value)">
        <button type="button" style="background:none;border:none;color:var(--danger);cursor:pointer;font-size:16px;padding:0 4px;margin-left:4px;" onclick="OS._removerServico(${i})">&times;</button>
      </div>
    `).join('') + `
      <div style="text-align:right;padding:8px 12px;font-size:14px;font-weight:700;color:var(--success);">
        Mão de obra: R$ ${total.toFixed(2)}
      </div>`;
  },

  _atualizarValorServico(i, val) {
    this._servicosSelecionados[i].valor = parseFloat(val) || 0;
    this._renderServicos();
  },

  _removerServico(i) {
    this._servicosSelecionados.splice(i, 1);
    this._renderServicos();
  },

  _atualizarModelos() {
    const marca = document.getElementById('os-novo-marca').value;
    const sel = document.getElementById('os-novo-modelo');
    sel.innerHTML = optionsModelos(marca);
    sel.onchange = function() {
      if (this.value === '__outro') {
        const input = document.createElement('input');
        input.type = 'text';
        input.className = 'form-control';
        input.id = 'os-novo-modelo';
        input.placeholder = 'Digite o modelo';
        this.replaceWith(input);
        input.focus();
      }
    };
  },

  // Busca automatica ao digitar placa (autocomplete)
  _buscarTimeout: null,
  buscarPlaca(val) {
    clearTimeout(this._buscarTimeout);
    const placa = val.trim().toUpperCase();
    const infoEl = document.getElementById('os-placa-info');
    const novoEl = document.getElementById('os-novo-registro');
    const sugEl = document.getElementById('os-sugestoes') || this._criarSugestoes();

    if (placa.length < 2) {
      infoEl.textContent = '';
      novoEl.classList.add('hidden');
      sugEl.classList.add('hidden');
      return;
    }

    this._buscarTimeout = setTimeout(async () => {
      // Busca veiculos que começam com o que digitou
      const { data: veiculos } = await db
        .from('veiculos')
        .select('*, clientes(id, nome, whatsapp)')
        .eq('oficina_id', APP.oficinaId)
        .ilike('placa', placa + '%')
        .order('placa')
        .limit(8);

      if (veiculos && veiculos.length) {
        sugEl.innerHTML = veiculos.map(v => `
          <div style="padding:10px 14px;cursor:pointer;display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid var(--border);"
               onmouseover="this.style.background='rgba(255,69,0,0.1)'" onmouseout="this.style.background=''"
               onclick="OS.selecionarVeiculo('${v.id}','${v.clientes?.id || ''}','${(v.placa || '').replace(/'/g,'')}','${(v.marca || '').replace(/'/g,'')}','${(v.modelo || '').replace(/'/g,'')}','${(v.clientes?.nome || '').replace(/'/g,'')}')">
            <div>
              <strong style="color:var(--primary);">${esc(v.placa)}</strong>
              <span style="color:var(--text-secondary);font-size:13px;margin-left:8px;">${esc(v.marca || '')} ${esc(v.modelo || '')} ${v.ano || ''} ${v.cor ? '— ' + esc(v.cor) : ''}</span>
            </div>
            <span style="font-size:12px;color:var(--text-secondary);">${esc(v.clientes?.nome || '')}</span>
          </div>
        `).join('');
        sugEl.classList.remove('hidden');
        novoEl.classList.add('hidden');
        infoEl.textContent = '';
      } else if (placa.length >= 7) {
        // Placa completa e nao achou
        sugEl.classList.add('hidden');
        document.getElementById('os-veiculo-id').value = '';
        document.getElementById('os-cliente-id').value = '';
        infoEl.textContent = '';
        novoEl.classList.remove('hidden');
      } else {
        sugEl.innerHTML = '<div style="padding:10px 14px;color:var(--text-secondary);font-size:13px;">Nenhum veiculo encontrado com "' + esc(placa) + '"</div>';
        sugEl.classList.remove('hidden');
      }
    }, 300);
  },

  _criarSugestoes() {
    const input = document.getElementById('os-placa');
    const div = document.createElement('div');
    div.id = 'os-sugestoes';
    div.className = 'hidden';
    div.style.cssText = 'background:var(--bg-card);border:1px solid var(--border);border-radius:var(--radius);max-height:200px;overflow-y:auto;margin-top:4px;';
    input.parentElement.appendChild(div);
    return div;
  },

  selecionarVeiculo(veiculoId, clienteId, placa, marca, modelo, clienteNome) {
    document.getElementById('os-placa').value = placa;
    document.getElementById('os-veiculo-id').value = veiculoId;
    document.getElementById('os-cliente-id').value = clienteId;
    document.getElementById('os-placa-info').innerHTML = `<span style="color:var(--success)">✓ ${esc(marca)} ${esc(modelo)} — ${esc(clienteNome)}</span>`;
    document.getElementById('os-novo-registro').classList.add('hidden');
    const sugEl = document.getElementById('os-sugestoes');
    if (sugEl) sugEl.classList.add('hidden');
  },

  async salvar(e) {
    e.preventDefault();
    const placaOS = document.getElementById('os-placa').value.trim().toUpperCase();
    if (!CLIENTES.validarPlaca(placaOS)) {
      APP.toast('Placa invalida. Use formato ABC-1234 ou ABC1D23', 'error');
      return;
    }

    const oficina_id = APP.oficinaId;
    let veiculo_id = document.getElementById('os-veiculo-id').value;
    let cliente_id = document.getElementById('os-cliente-id').value;

    // Se veiculo novo, cria cliente + veiculo
    if (!veiculo_id) {
      const nomeCliente = document.getElementById('os-novo-cliente').value.trim();
      if (!nomeCliente) { APP.toast('Preencha o nome do cliente', 'error'); return; }

      // Cria cliente
      const { data: cli, error: cliErr } = await db
        .from('clientes')
        .insert({
          oficina_id,
          nome: nomeCliente,
          whatsapp: document.getElementById('os-novo-whatsapp').value.trim()
        })
        .select()
        .single();
      if (cliErr) { APP.toast('Erro ao criar cliente: ' + cliErr.message, 'error'); return; }
      cliente_id = cli.id;

      // Cria veiculo
      const { data: vei, error: veiErr } = await db
        .from('veiculos')
        .insert({
          oficina_id,
          cliente_id: cli.id,
          placa: document.getElementById('os-placa').value.trim().toUpperCase(),
          marca: document.getElementById('os-novo-marca').value.trim(),
          modelo: document.getElementById('os-novo-modelo').value.trim(),
          ano: document.getElementById('os-novo-ano').value ? parseInt(document.getElementById('os-novo-ano').value) : null,
          cor: (document.getElementById('os-novo-cor').value || '').trim(),
          km_atual: document.getElementById('os-novo-km-atual').value ? parseInt(document.getElementById('os-novo-km-atual').value) : null
        })
        .select()
        .single();
      if (veiErr) { APP.toast('Erro ao criar veiculo: ' + veiErr.message, 'error'); return; }
      veiculo_id = vei.id;
    }

    // Monta descrição e valores
    const servicos = this._servicosSelecionados.map(s => s.nome);
    const descLivre = document.getElementById('os-descricao').value.trim();
    if (descLivre) servicos.push(descLivre);
    const descricaoFinal = servicos.join(' | ');
    const totalMaoObra = this._servicosSelecionados.reduce((s, x) => s + x.valor, 0);

    if (!descricaoFinal) { APP.toast('Selecione ou descreva pelo menos um servico', 'error'); return; }

    // Cria OS
    const mecanico = document.getElementById('os-mecanico').value;
    const { data: osData, error } = await db
      .from('ordens_servico')
      .insert({
        oficina_id,
        veiculo_id,
        cliente_id,
        mecanico_id: mecanico || null,
        descricao: descricaoFinal,
        valor_mao_obra: totalMaoObra,
        valor_total: totalMaoObra,
        km_entrada: document.getElementById('os-km').value ? parseInt(document.getElementById('os-km').value) : null,
        status: document.getElementById('os-status').value
      })
      .select()
      .single();

    if (error) { APP.toast('Erro ao criar OS: ' + error.message, 'error'); return; }

    // Salva itens de serviço na tabela itens_os
    if (this._servicosSelecionados.length && osData) {
      const itens = this._servicosSelecionados.map(s => ({
        oficina_id,
        os_id: osData.id,
        tipo: 'servico',
        descricao: s.nome,
        quantidade: 1,
        valor_unitario: s.valor,
        valor_total: s.valor
      }));
      await db.from('itens_os').insert(itens);
    }

    closeModal();
    APP.toast('OS aberta com sucesso');
    this.carregar();
    DASHBOARD.carregar();
  },

  async abrirDetalhes(id) {
    // Busca OS + itens + peças + checklists em paralelo
    const [osRes, itensRes, chkEntradaRes, chkSaidaRes] = await Promise.all([
      db.from('ordens_servico')
        .select('*, veiculos(placa, marca, modelo, km_atual), clientes(nome, whatsapp), profiles!ordens_servico_mecanico_id_fkey(nome)')
        .eq('id', id).single(),
      db.from('itens_os')
        .select('*, pecas(nome)')
        .eq('os_id', id)
        .order('tipo', { ascending: false })
        .order('created_at'),
      db.from('checklists_entrada')
        .select('*')
        .eq('os_id', id)
        .maybeSingle(),
      db.from('checklists_saida')
        .select('*')
        .eq('os_id', id)
        .maybeSingle()
    ]);

    const os = osRes.data;
    if (!os) return;
    const itens = itensRes.data || [];
    // Peças do estoque carregadas sob demanda em mostrarAddPeca()
    this._pecasEstoque = null; // limpa cache ao abrir outra OS
    const pecasEstoque = [];
    const chkEntrada = chkEntradaRes.data || null;
    const chkSaida = chkSaidaRes.data || null;

    this._osAtualId = id;
    this._osAtualOficinaId = os.oficina_id;
    this._osVeiculoMarca = os.veiculos?.marca || '';
    this._osVeiculoModelo = os.veiculos?.modelo || '';
    this._pecasEstoque = null; // limpa cache pra recarregar com compatibilidade

    const statusOptions = ['entrada','diagnostico','orcamento','aprovada','aguardando_peca','execucao','pronto','entregue','cancelada'];
    const statusLabel = {
      entrada: 'Entrada', diagnostico: 'Diagnostico', orcamento: 'Orcamento',
      aprovada: 'Aprovada', aguardando_peca: 'Aguardando Peça', execucao: 'Em execucao', pronto: 'Pronto',
      entregue: 'Entregue', cancelada: 'Cancelada'
    };

    const itensServico = itens.filter(i => i.tipo === 'servico');
    const itensPeca = itens.filter(i => i.tipo === 'peca');
    const totalServicos = itensServico.reduce((s, i) => s + (i.valor_total || 0), 0);
    const totalPecas = itensPeca.reduce((s, i) => s + (i.valor_total || 0), 0);
    const desconto = os.desconto || 0;
    const totalGeral = totalServicos + totalPecas - desconto;

    const _mob = window.innerWidth <= 768;
    openModal(`
      <div class="modal-header">
        <h3>OS #${esc(os.numero || '-')} — ${esc(os.veiculos?.placa)}</h3>
        <button class="modal-close" onclick="closeModal()">&times;</button>
      </div>
      <div class="modal-body">
        <!-- RESUMO TOPO (sempre visivel) -->
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;flex-wrap:wrap;gap:8px;">
          <div>
            <div style="font-weight:700;font-size:16px;">${esc(os.veiculos?.placa)} · ${esc(os.veiculos?.marca || '')} ${esc(os.veiculos?.modelo || '')}</div>
            <div style="font-size:13px;color:var(--text-secondary);">${esc(os.clientes?.nome)} · ${esc(os.profiles?.nome || 'Sem mecânico')}</div>
          </div>
          <div style="text-align:right;">
            <div style="font-size:20px;font-weight:800;color:var(--success);" id="det-total">R$ ${totalGeral.toFixed(2)}</div>
            <span class="badge badge-${os.status}">${statusLabel[os.status]}</span>
          </div>
        </div>

        ${_mob ? `
        <!-- ABAS MOBILE -->
        <div style="display:flex;gap:6px;overflow-x:auto;margin-bottom:12px;-webkit-overflow-scrolling:touch;" id="os-det-tabs">
          <button class="kanban-tab active" onclick="OS._switchDetTab('info',this)">Info</button>
          <button class="kanban-tab" onclick="OS._switchDetTab('servicos',this)">Serviços</button>
          <button class="kanban-tab" onclick="OS._switchDetTab('pecas',this)">Peças</button>
          <button class="kanban-tab" onclick="OS._switchDetTab('checklist',this)">Checklist</button>
          <button class="kanban-tab" onclick="OS._switchDetTab('acoes',this)">Ações</button>
        </div>` : ''}

        <!-- INFO -->
        <div id="os-det-info" ${_mob ? '' : ''}>
        <div style="display:grid;grid-template-columns:${_mob ? '1fr' : '1fr 1fr'};gap:12px;margin-bottom:16px;">
          <div>
            <div style="font-size:11px;color:var(--text-secondary);">Veiculo</div>
            <div style="font-weight:600;font-size:14px;"><a href="#" onclick="event.preventDefault();closeModal();setTimeout(()=>VEICULOS.abrirHistorico('${os.veiculo_id}','${escAttr(os.veiculos?.placa)}'),200)" style="color:var(--primary);text-decoration:none;">${escAttr(os.veiculos?.placa)}</a> — ${escAttr(os.veiculos?.marca || '')} ${escAttr(os.veiculos?.modelo || '')}</div>
          </div>
          <div>
            <div style="font-size:11px;color:var(--text-secondary);">Cliente</div>
            <div style="font-weight:600;font-size:14px;">${esc(os.clientes?.nome)}</div>
          </div>
          <div>
            <div style="font-size:11px;color:var(--text-secondary);">Mecanico</div>
            <div style="font-weight:600;font-size:14px;">${esc(os.profiles?.nome || 'Nao definido')}</div>
          </div>
          <div>
            <div style="font-size:11px;color:var(--text-secondary);">Entrada</div>
            <div style="font-weight:600;font-size:14px;">${APP.formatDateTime(os.data_entrada)}${os.km_entrada ? ' — ' + os.km_entrada.toLocaleString('pt-BR') + ' km' : ''}</div>
          </div>
        </div>

        <!-- STATUS + PAGAMENTO -->
        <div style="display:grid;grid-template-columns:${_mob ? '1fr' : '1fr 1fr'};gap:12px;margin-bottom:16px;">
          <div class="form-group" style="margin:0;">
            <label>Status</label>
            <select class="form-control" id="det-status" onchange="OS.atualizarStatus('${os.id}', this.value)">
              ${statusOptions.map(s => `<option value="${s}" ${s === os.status ? 'selected' : ''}>${statusLabel[s]}</option>`).join('')}
            </select>
          </div>
          <div class="form-group" style="margin:0;">
            <label>Pagamento</label>
            <select class="form-control" id="det-pagamento" onchange="OS.atualizarPagamento('${os.id}', this.value)">
              <option value="pendente" ${os.forma_pagamento === 'pendente' ? 'selected' : ''}>Pendente</option>
              <option value="dinheiro" ${os.forma_pagamento === 'dinheiro' ? 'selected' : ''}>Dinheiro</option>
              <option value="pix" ${os.forma_pagamento === 'pix' ? 'selected' : ''}>Pix</option>
              <option value="debito" ${os.forma_pagamento === 'debito' ? 'selected' : ''}>Debito</option>
              <option value="credito" ${os.forma_pagamento === 'credito' ? 'selected' : ''}>Credito</option>
            </select>
          </div>
        </div>
        ${['debito','credito'].includes(os.forma_pagamento) ? `
        <div style="background:var(--bg-input);border-radius:var(--radius);padding:10px 14px;margin-bottom:16px;display:flex;align-items:center;gap:12px;flex-wrap:wrap;">
          <div style="font-size:12px;color:var(--text-secondary);">Taxa maquineta:</div>
          <input type="number" class="form-control" id="det-taxa-cartao" value="${os.taxa_cartao || (os.forma_pagamento === 'debito' ? (APP.oficina?.taxa_debito || 2) : (APP.oficina?.taxa_credito || 3.5))}" min="0" max="20" step="0.1" style="width:70px;padding:4px 8px;font-size:13px;" onchange="OS.atualizarTaxa('${os.id}', this.value)">
          <span style="font-size:12px;color:var(--text-secondary);">%</span>
          <div style="margin-left:auto;font-size:13px;">
            <span style="color:var(--danger);">-R$ ${((totalGeral * (os.taxa_cartao || (os.forma_pagamento === 'debito' ? (APP.oficina?.taxa_debito || 2) : (APP.oficina?.taxa_credito || 3.5))) / 100)).toFixed(2)}</span>
            <span style="margin-left:8px;font-weight:700;color:var(--success);">Liquido: R$ ${(totalGeral - (totalGeral * (os.taxa_cartao || (os.forma_pagamento === 'debito' ? (APP.oficina?.taxa_debito || 2) : (APP.oficina?.taxa_credito || 3.5))) / 100)).toFixed(2)}</span>
          </div>
        </div>` : ''}
        ${_mob ? '</div>' : ''}

        <!-- SERVICOS -->
        ${_mob ? '<div id="os-det-servicos" style="display:none;">' : ''}
        <div style="border-top:1px solid var(--border);padding-top:12px;margin-bottom:12px;">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
            <label style="font-size:13px;font-weight:700;color:var(--text-secondary);margin:0;">SERVICOS (Mao de obra)</label>
            <span style="font-size:13px;font-weight:700;color:var(--success);">R$ ${totalServicos.toFixed(2)}</span>
          </div>
          ${itensServico.length ? itensServico.map(i => `
            <div style="display:flex;justify-content:space-between;align-items:center;padding:6px 0;font-size:13px;">
              <span>${esc(i.descricao)}</span>
              <div style="display:flex;align-items:center;gap:6px;">
                <span style="color:var(--text-secondary);">R$ ${(i.valor_total || 0).toFixed(2)}</span>
                <button onclick="OS.removerItem('${i.id}','${os.id}')" style="background:none;border:none;color:var(--danger);cursor:pointer;font-size:14px;">&times;</button>
              </div>
            </div>
          `).join('') : '<div style="font-size:13px;color:var(--text-muted);padding:4px 0;">Nenhum servico</div>'}

          <!-- ADICIONAR SERVICO -->
          <div style="margin-top:10px;display:flex;gap:6px;">
            <button type="button" class="btn btn-secondary btn-sm" onclick="OS.mostrarAddServico('catalogo')">+ Do catalogo</button>
            <button type="button" class="btn btn-secondary btn-sm" onclick="OS.mostrarAddServico('manual')">+ Servico manual</button>
          </div>
          <div id="det-add-servico" class="hidden" style="margin-top:10px;background:var(--bg-input);padding:12px;border-radius:var(--radius);"></div>
        </div>
        ${_mob ? '</div>' : ''}

        <!-- PECAS / MATERIAIS -->
        ${_mob ? '<div id="os-det-pecas" style="display:none;">' : ''}
        <div style="border-top:1px solid var(--border);padding-top:12px;margin-bottom:12px;">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
            <label style="font-size:13px;font-weight:700;color:var(--text-secondary);margin:0;">PECAS / MATERIAIS</label>
            <span style="font-size:13px;font-weight:700;color:var(--warning);">R$ ${totalPecas.toFixed(2)}</span>
          </div>
          ${itensPeca.length ? itensPeca.map(i => `
            <div style="display:flex;justify-content:space-between;align-items:center;padding:6px 0;font-size:13px;">
              <span>${esc(i.descricao)} ${i.peca_id ? '<span style="color:var(--info);font-size:11px;">(estoque)</span>' : '<span style="color:var(--text-muted);font-size:11px;">(avulso)</span>'}</span>
              <div style="display:flex;align-items:center;gap:6px;">
                <span style="color:var(--text-secondary);">${i.quantidade}x R$ ${(i.valor_unitario || 0).toFixed(2)} = R$ ${(i.valor_total || 0).toFixed(2)}</span>
                <button onclick="OS.removerItem('${i.id}','${os.id}','${i.peca_id || ''}',${i.quantidade})" style="background:none;border:none;color:var(--danger);cursor:pointer;font-size:14px;">&times;</button>
              </div>
            </div>
          `).join('') : '<div style="font-size:13px;color:var(--text-muted);padding:4px 0;">Nenhuma peca</div>'}

          <!-- ADICIONAR PECA -->
          <div style="margin-top:10px;display:flex;gap:6px;">
            <button type="button" class="btn btn-secondary btn-sm" onclick="OS.mostrarAddPeca('estoque')">+ Do estoque</button>
            <button type="button" class="btn btn-secondary btn-sm" onclick="OS.mostrarAddPeca('avulso')">+ Item avulso</button>
          </div>

          <div id="det-add-peca" class="hidden" style="margin-top:10px;background:var(--bg-input);padding:12px;border-radius:var(--radius);"></div>
        </div>
        ${_mob ? '</div>' : ''}

        <!-- TOTAIS -->
        <div style="border-top:1px solid var(--border);padding-top:12px;">
          <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;margin-bottom:8px;">
            <div>
              <div style="font-size:11px;color:var(--text-secondary);">Servicos</div>
              <div style="font-weight:600;">R$ ${totalServicos.toFixed(2)}</div>
            </div>
            <div>
              <div style="font-size:11px;color:var(--text-secondary);">Pecas</div>
              <div style="font-weight:600;">R$ ${totalPecas.toFixed(2)}</div>
            </div>
            <div>
              <div style="font-size:11px;color:var(--text-secondary);">Desconto</div>
              <input type="number" class="form-control" id="det-desconto" value="${desconto}" min="0" step="0.01" style="padding:6px 10px;font-size:14px;" onchange="OS.atualizarDesconto('${os.id}', ${totalServicos}, ${totalPecas})">
            </div>
          </div>
          <div style="display:flex;justify-content:space-between;align-items:center;padding:12px;background:var(--bg-input);border-radius:var(--radius);">
            <span style="font-size:16px;font-weight:700;">TOTAL</span>
            <span style="font-size:20px;font-weight:800;color:var(--success);" id="det-total">R$ ${totalGeral.toFixed(2)}</span>
          </div>
        </div>

        <!-- CHECKLIST DE ENTRADA -->
        ${_mob ? '<div id="os-det-checklist" style="display:none;">' : ''}
        <div style="border-top:1px solid var(--border);padding-top:12px;margin-top:12px;">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
            <label style="font-size:13px;font-weight:700;color:var(--text-secondary);margin:0;">
              ${chkEntrada ? '✅' : '📋'} CHECKLIST DE ENTRADA
            </label>
            <button class="btn ${chkEntrada ? 'btn-secondary' : 'btn-primary'} btn-sm" onclick="OS.abrirChecklistEntrada('${os.id}')">
              ${chkEntrada ? 'Ver / Editar' : 'Preencher'}
            </button>
          </div>
          ${chkEntrada ? this._resumoChecklist(chkEntrada, 'entrada') : '<div style="font-size:12px;color:var(--warning);">Pendente — preencha antes de mover para diagnostico</div>'}
        </div>

        <!-- DIAGNOSTICO TECNICO -->
        <div style="border-top:1px solid var(--border);padding-top:12px;margin-top:12px;">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
            <label style="font-size:13px;font-weight:700;color:var(--text-secondary);margin:0;">
              🔍 DIAGNOSTICO TECNICO
            </label>
            <button class="btn btn-primary btn-sm" onclick="DIAGNOSTICO.abrir('${os.id}')">
              Abrir diagnostico
            </button>
          </div>
          <div style="font-size:12px;color:var(--text-muted);">Inspecao por setor antes de montar o orcamento</div>
        </div>

        <!-- CHECKLIST DE SAIDA -->
        <div style="border-top:1px solid var(--border);padding-top:12px;margin-top:12px;">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
            <label style="font-size:13px;font-weight:700;color:var(--text-secondary);margin:0;">
              ${chkSaida ? '✅' : '📋'} CHECKLIST DE SAIDA
            </label>
            <button class="btn ${chkSaida ? 'btn-secondary' : 'btn-primary'} btn-sm" onclick="OS.abrirChecklistSaida('${os.id}')">
              ${chkSaida ? 'Ver / Editar' : 'Preencher'}
            </button>
          </div>
          ${chkSaida ? this._resumoChecklist(chkSaida, 'saida') : '<div style="font-size:12px;color:var(--text-muted);">Preencha antes de marcar como Pronto</div>'}
        </div>
        ${_mob ? '</div>' : ''}

        ${_mob ? '<div id="os-det-acoes" style="display:none;">' : ''}
        ${!['pronto', 'entregue'].includes(os.status) && chkSaida ? `
          <button class="btn btn-primary" style="width:100%;margin-top:12px;padding:14px;font-size:15px;" onclick="OS.marcarPronto('${os.id}')">
            ✅ Marcar como Pronto
          </button>
        ` : ''}

        ${os.status === 'pronto' ? `
          <button class="btn btn-success" style="width:100%;margin-top:12px;padding:14px;font-size:15px;" onclick="OS.entregarVeiculo('${os.id}')">
            🚗 Entregar veículo
          </button>
        ` : ''}

        ${os.clientes?.whatsapp ? `
          <button class="btn btn-success" style="width:100%;margin-top:8px;" onclick="OS.enviarWhatsApp('${os.clientes.whatsapp}', '${escAttr(os.veiculos?.placa)}', '${os.status}', '${escAttr(os.veiculos?.marca || '')}', '${escAttr(os.veiculos?.modelo || '')}')">
            💬 Avisar cliente pelo WhatsApp
          </button>
        ` : ''}

        <div style="display:flex;gap:8px;margin-top:12px;">
          <button class="btn btn-secondary" style="flex:1;" onclick="PDF_OS.gerar('${os.id}')">🖨️ Imprimir OS</button>
          <button class="btn btn-secondary" style="flex:1;" onclick="PDF_OS.recibo('${os.id}')">🧾 Gerar Recibo</button>
        </div>

        ${os.veiculos?.placa ? `
        <button class="btn btn-secondary" style="width:100%;margin-top:8px;" onclick="OS.enviarHistorico('${escAttr(os.veiculos.placa)}', '${os.clientes?.whatsapp || ''}', '${escAttr(os.veiculos?.marca || '')}', '${escAttr(os.veiculos?.modelo || '')}')">
          📋 Enviar historico do veiculo
        </button>
        ` : ''}

        <div style="display:flex;gap:8px;margin-top:8px;">
          <button class="btn btn-secondary" style="flex:1;" onclick="OS.editarOS('${os.id}')">Editar OS</button>
          ${os.status !== 'entregue' ? `<button class="btn btn-danger" style="flex:1;" onclick="OS.excluirOS('${os.id}')">Excluir OS</button>` : ''}
        </div>

        ${os.descricao ? `
          <div style="margin-top:12px;padding:10px 14px;background:var(--bg-input);border-radius:var(--radius);font-size:13px;color:var(--text-secondary);">
            <strong>Obs:</strong> ${esc(os.descricao)}
          </div>
        ` : ''}
        ${_mob ? '</div>' : ''}
      </div>
    `);

  },

  // Adicionar serviço na OS aberta
  async mostrarAddServico(tipo) {
    const container = document.getElementById('det-add-servico');
    container.classList.remove('hidden');

    if (tipo === 'catalogo') {
      container.innerHTML = `
        <div style="font-size:13px;font-weight:600;margin-bottom:8px;">Adicionar servico do catalogo</div>
        <div style="position:relative;margin-bottom:8px;">
          <input type="text" class="form-control" id="det-servico-busca" placeholder="Digite pra buscar servico..." autocomplete="off" oninput="OS._buscarServico(this.value, 'det-servico-sugestoes', 'detalhe')">
          <input type="hidden" id="det-servico-nome-selecionado">
          <div id="det-servico-sugestoes" class="hidden" style="position:absolute;left:0;right:0;top:100%;background:var(--bg-card);border:1px solid var(--border);border-radius:var(--radius);max-height:200px;overflow-y:auto;z-index:10;"></div>
        </div>
        <div style="display:grid;grid-template-columns:1fr auto;gap:8px;align-items:end;">
          <div class="form-group" style="margin:0;">
            <label style="font-size:11px;">Valor (R$)</label>
            <input type="number" class="form-control" id="det-servico-valor" value="0" min="0" step="0.01">
          </div>
          <button type="button" class="btn btn-primary btn-sm" onclick="OS.addServicoCatalogo()">Add</button>
        </div>
      `;
    } else {
      container.innerHTML = `
        <div style="font-size:13px;font-weight:600;margin-bottom:8px;">Adicionar servico manual</div>
        <div class="form-group" style="margin:0 0 8px;">
          <input type="text" class="form-control" id="det-servico-nome" placeholder="Descricao do servico">
        </div>
        <div style="display:grid;grid-template-columns:1fr auto;gap:8px;align-items:end;">
          <div class="form-group" style="margin:0;">
            <label style="font-size:11px;">Valor (R$)</label>
            <input type="number" class="form-control" id="det-servico-valor-manual" value="0" min="0" step="0.01">
          </div>
          <button type="button" class="btn btn-primary btn-sm" onclick="OS.addServicoManual()">Add</button>
        </div>
      `;
    }
  },

  async addServicoCatalogo() {
    const nome = document.getElementById('det-servico-nome-selecionado')?.value || document.getElementById('det-servico-busca')?.value?.trim();
    if (!nome) { APP.toast('Busque e selecione um servico', 'error'); return; }
    const valor = parseFloat(document.getElementById('det-servico-valor').value) || 0;

    const { error } = await db.from('itens_os').insert({
      oficina_id: this._osAtualOficinaId,
      os_id: this._osAtualId,
      tipo: 'servico',
      descricao: nome,
      quantidade: 1,
      valor_unitario: valor,
      valor_total: valor
    });
    if (error) { APP.toast('Erro: ' + error.message, 'error'); return; }

    await this._recalcularTotaisOS(this._osAtualId);
    APP.toast('Servico adicionado');
    this.abrirDetalhes(this._osAtualId);
  },

  async addServicoManual() {
    const nome = document.getElementById('det-servico-nome').value.trim();
    if (!nome) { APP.toast('Digite a descricao do servico', 'error'); return; }
    const valor = parseFloat(document.getElementById('det-servico-valor-manual').value) || 0;

    const { error } = await db.from('itens_os').insert({
      oficina_id: this._osAtualOficinaId,
      os_id: this._osAtualId,
      tipo: 'servico',
      descricao: nome,
      quantidade: 1,
      valor_unitario: valor,
      valor_total: valor
    });
    if (error) { APP.toast('Erro: ' + error.message, 'error'); return; }

    await this._recalcularTotaisOS(this._osAtualId);
    APP.toast('Servico adicionado');
    this.abrirDetalhes(this._osAtualId);
  },

  // Adicionar peça (do estoque ou avulso)
  async mostrarAddPeca(tipo) {
    // Carrega peças do estoque sob demanda (com cache)
    if (tipo === 'estoque' && !this._pecasEstoque) {
      const { data } = await db.from('pecas')
        .select('id, nome, codigo, marca, preco_venda, quantidade, compatibilidade')
        .eq('oficina_id', APP.oficinaId)
        .order('nome');
      this._pecasEstoque = data || [];
    }
    const container = document.getElementById('det-add-peca');
    container.classList.remove('hidden');

    if (tipo === 'estoque') {
      container.innerHTML = `
        <div style="font-size:13px;font-weight:600;margin-bottom:8px;">Adicionar do estoque</div>
        <div style="position:relative;margin-bottom:8px;">
          <input type="text" class="form-control" id="det-peca-busca" placeholder="Digite pra buscar peca..." oninput="OS._buscarPecaEstoque(this.value)" autocomplete="off">
          <input type="hidden" id="det-peca-id">
          <div id="det-peca-sugestoes" class="hidden" style="position:absolute;left:0;right:0;top:100%;background:var(--bg-card);border:1px solid var(--border);border-radius:var(--radius);max-height:180px;overflow-y:auto;z-index:10;"></div>
        </div>
        <div id="det-peca-estoque-info" style="font-size:11px;color:var(--text-secondary);margin-bottom:8px;"></div>
        <div style="display:grid;grid-template-columns:1fr 1fr auto;gap:8px;align-items:end;">
          <div class="form-group" style="margin:0;">
            <label style="font-size:11px;">Qtd</label>
            <input type="number" class="form-control" id="det-peca-qtd" value="1" min="1" step="1">
          </div>
          <div class="form-group" style="margin:0;">
            <label style="font-size:11px;">Valor unit.</label>
            <input type="number" class="form-control" id="det-peca-valor" value="0" min="0" step="0.01">
          </div>
          <button type="button" class="btn btn-primary btn-sm" onclick="OS.addPecaEstoque()">Add</button>
        </div>
      `;
    } else {
      container.innerHTML = `
        <div style="font-size:13px;font-weight:600;margin-bottom:8px;">Adicionar item avulso</div>
        <div style="display:grid;grid-template-columns:2fr 1fr;gap:8px;margin-bottom:8px;">
          <div class="form-group" style="margin:0;">
            <label style="font-size:11px;">Nome da peca *</label>
            <input type="text" class="form-control" id="det-avulso-nome" placeholder="Ex: Filtro de oleo Mann W71251">
          </div>
          <div class="form-group" style="margin:0;">
            <label style="font-size:11px;">Marca</label>
            <input type="text" class="form-control" id="det-avulso-marca" placeholder="Mann, Fram...">
          </div>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr auto;gap:8px;align-items:end;">
          <div class="form-group" style="margin:0;">
            <label style="font-size:11px;">Qtd</label>
            <input type="number" class="form-control" id="det-avulso-qtd" value="1" min="1" step="1">
          </div>
          <div class="form-group" style="margin:0;">
            <label style="font-size:11px;">Custo unit.</label>
            <input type="number" class="form-control" id="det-avulso-custo" value="0" min="0" step="0.01">
          </div>
          <div class="form-group" style="margin:0;">
            <label style="font-size:11px;">Venda unit.</label>
            <input type="number" class="form-control" id="det-avulso-valor" value="0" min="0" step="0.01">
          </div>
          <button type="button" class="btn btn-primary btn-sm" onclick="OS.addPecaAvulso()">Add</button>
        </div>
        <div style="margin-top:8px;">
          <label style="display:flex;align-items:center;gap:6px;font-size:12px;color:var(--text-secondary);cursor:pointer;">
            <input type="checkbox" id="det-avulso-salvar" checked> Salvar no estoque pra proxima vez
          </label>
        </div>
      `;
    }
  },

  _buscarPecaEstoque(val) {
    const termo = val.trim().toLowerCase();
    const sugEl = document.getElementById('det-peca-sugestoes');
    if (termo.length < 2) { sugEl.classList.add('hidden'); return; }

    // Filtra por termo
    let resultados = this._pecasEstoque.filter(p =>
      (p.nome || '').toLowerCase().includes(termo) ||
      (p.codigo || '').toLowerCase().includes(termo) ||
      (p.marca || '').toLowerCase().includes(termo)
    );

    // Ordena: compatíveis com o veículo da OS primeiro
    if (this._osVeiculoMarca) {
      const marca = this._osVeiculoMarca;
      const modelo = this._osVeiculoModelo;
      resultados.sort((a, b) => {
        const aCompat = this._pecaCompativel(a, marca, modelo) ? 0 : 1;
        const bCompat = this._pecaCompativel(b, marca, modelo) ? 0 : 1;
        return aCompat - bCompat;
      });
    }

    resultados = resultados.slice(0, 15);

    if (!resultados.length) {
      sugEl.innerHTML = '<div style="padding:8px 12px;font-size:13px;color:var(--text-secondary);">Nenhuma peca encontrada</div>';
      sugEl.classList.remove('hidden');
      return;
    }

    const marca = this._osVeiculoMarca;
    const modelo = this._osVeiculoModelo;

    sugEl.innerHTML = resultados.map(p => {
      const compat = marca && this._pecaCompativel(p, marca, modelo);
      return `
      <div style="padding:8px 12px;cursor:pointer;border-bottom:1px solid var(--border);font-size:13px;${compat ? 'background:rgba(63,185,80,0.06);' : ''}"
           onmouseover="this.style.background='rgba(255,69,0,0.1)'" onmouseout="this.style.background='${compat ? 'rgba(63,185,80,0.06)' : ''}'"
           onclick="OS._selecionarPecaEstoque('${p.id}','${(p.nome || '').replace(/'/g, '')}',${p.preco_venda || 0},${p.quantidade || 0})">
        ${compat ? '<span style="color:var(--success);font-size:11px;">✓ Compativel</span> ' : ''}
        <strong>${esc(p.nome)}</strong>${p.marca ? ' — ' + esc(p.marca) : ''}${p.codigo ? ' (' + esc(p.codigo) + ')' : ''}
        <div style="color:var(--text-secondary);font-size:11px;">Estoque: ${p.quantidade} | R$ ${(p.preco_venda || 0).toFixed(2)}</div>
      </div>`;
    }).join('');
    sugEl.classList.remove('hidden');
  },

  _pecaCompativel(peca, marca, modelo) {
    if (!peca.compatibilidade || !peca.compatibilidade.length) return false;
    return peca.compatibilidade.some(c => {
      if (c.marca !== marca) return false;
      if (!c.modelos || !c.modelos.length) return true; // todos os modelos da marca
      return c.modelos.includes(modelo);
    });
  },

  _selecionarPecaEstoque(id, nome, preco, qtdEstoque) {
    document.getElementById('det-peca-id').value = id;
    document.getElementById('det-peca-busca').value = nome;
    document.getElementById('det-peca-valor').value = preco;
    document.getElementById('det-peca-sugestoes').classList.add('hidden');
    document.getElementById('det-peca-estoque-info').innerHTML = `<span style="color:var(--success);">✓ ${esc(nome)}</span> — ${qtdEstoque} em estoque`;
    this._pecaSelecionadaQtd = qtdEstoque;
    this._pecaSelecionadaNome = nome;
  },

  _pecaSelecionadaQtd: 0,
  _pecaSelecionadaNome: '',

  async addPecaEstoque() {
    const pecaId = document.getElementById('det-peca-id').value;
    if (!pecaId) { APP.toast('Busque e selecione uma peca', 'error'); return; }

    const qtd = parseFloat(document.getElementById('det-peca-qtd').value) || 1;
    const valorUnit = parseFloat(document.getElementById('det-peca-valor').value) || 0;
    const estoqueDisp = this._pecaSelecionadaQtd;

    if (qtd > estoqueDisp) {
      if (!confirm(`So tem ${estoqueDisp} em estoque. Usar ${qtd} mesmo assim? O estoque vai ficar negativo.`)) return;
    }

    const oficina_id = this._osAtualOficinaId;
    const os_id = this._osAtualId;

    // 1. Insere item na OS
    const { error: itemErr } = await db.from('itens_os').insert({
      oficina_id,
      os_id,
      tipo: 'peca',
      descricao: this._pecaSelecionadaNome,
      peca_id: pecaId,
      quantidade: qtd,
      valor_unitario: valorUnit,
      valor_total: qtd * valorUnit
    });
    if (itemErr) { APP.toast('Erro: ' + itemErr.message, 'error'); return; }

    // 2. Baixa do estoque (atômica via RPC)
    await db.rpc('baixar_estoque', { p_peca_id: pecaId, p_quantidade: qtd });

    // 3. Registra movimento
    await db.from('estoque_movimentos').insert({
      oficina_id,
      peca_id: pecaId,
      os_id,
      tipo: 'saida',
      quantidade: qtd,
      custo_unitario: valorUnit,
      observacao: 'Aplicado na OS #' + os_id.slice(0, 8),
      created_by: APP.profile.id
    });

    // 4. Atualiza totais da OS
    await this._recalcularTotaisOS(os_id);

    APP.toast('Peca adicionada e baixada do estoque');
    this.abrirDetalhes(os_id); // recarrega modal
  },

  async addPecaAvulso() {
    const nome = document.getElementById('det-avulso-nome').value.trim();
    if (!nome) { APP.toast('Digite o nome da peca', 'error'); return; }

    const marcaPeca = (document.getElementById('det-avulso-marca')?.value || '').trim();
    const qtd = parseFloat(document.getElementById('det-avulso-qtd').value) || 1;
    const custo = parseFloat(document.getElementById('det-avulso-custo')?.value) || 0;
    const valorUnit = parseFloat(document.getElementById('det-avulso-valor').value) || 0;
    const salvarEstoque = document.getElementById('det-avulso-salvar')?.checked;

    const oficina_id = this._osAtualOficinaId;
    let pecaId = null;

    // Se marcou "salvar no estoque", cria a peça e vincula
    if (salvarEstoque) {
      // Verifica se já existe peça com esse nome
      const { data: existe } = await db.from('pecas')
        .select('id')
        .eq('oficina_id', oficina_id)
        .ilike('nome', nome)
        .maybeSingle();

      if (existe) {
        pecaId = existe.id;
        // Incrementa quantidade (comprou mais)
        await db.rpc('devolver_estoque', { p_peca_id: pecaId, p_quantidade: qtd });
      } else {
        // Cria peça nova no estoque com compatibilidade do veículo da OS
        const compat = [];
        if (this._osVeiculoMarca) {
          compat.push({
            marca: this._osVeiculoMarca,
            modelos: this._osVeiculoModelo ? [this._osVeiculoModelo] : []
          });
        }

        const margem = APP.oficina?.margem_padrao || 30;
        const { data: novaPeca, error: pecaErr } = await db.from('pecas').insert({
          oficina_id,
          nome,
          marca: marcaPeca,
          quantidade: 0, // vai pra OS direto, estoque fica 0 (ou negativo)
          custo,
          preco_venda: valorUnit || (custo * (1 + margem / 100)),
          compatibilidade: compat
        }).select().single();

        if (!pecaErr && novaPeca) pecaId = novaPeca.id;
      }

      // Baixa do estoque (vai ficar negativo se não tinha, tá ok — registra a saída)
      if (pecaId) {
        await db.rpc('baixar_estoque', { p_peca_id: pecaId, p_quantidade: qtd });

        // Registra movimento
        await db.from('estoque_movimentos').insert({
          oficina_id,
          peca_id: pecaId,
          os_id: this._osAtualId,
          tipo: 'saida',
          quantidade: qtd,
          custo_unitario: valorUnit,
          observacao: 'Aplicado na OS (item novo)',
          created_by: APP.profile.id
        });
      }
    }

    // Insere item na OS
    const { error } = await db.from('itens_os').insert({
      oficina_id,
      os_id: this._osAtualId,
      tipo: 'peca',
      descricao: nome + (marcaPeca ? ' — ' + marcaPeca : '') + (!salvarEstoque ? ' (avulso)' : ''),
      peca_id: pecaId,
      quantidade: qtd,
      valor_unitario: valorUnit,
      valor_total: qtd * valorUnit
    });
    if (error) { APP.toast('Erro: ' + error.message, 'error'); return; }

    await this._recalcularTotaisOS(this._osAtualId);
    this._pecasEstoque = null; // limpa cache
    APP.toast(salvarEstoque ? 'Peca adicionada e salva no estoque' : 'Item avulso adicionado');
    this.abrirDetalhes(this._osAtualId);
  },

  async removerItem(itemId, osId, pecaId, quantidade) {
    if (!confirm('Remover este item?')) return;

    // Se era do estoque, devolve (incremento atômico via RPC)
    if (pecaId) {
      try {
        await db.rpc('devolver_estoque', { p_peca_id: pecaId, p_quantidade: quantidade });
      } catch (_) {
        // Fallback se RPC não existir ainda
        const { data: peca } = await db.from('pecas').select('quantidade').eq('id', pecaId).single();
        if (peca) {
          await db.from('pecas').update({ quantidade: (peca.quantidade || 0) + quantidade }).eq('id', pecaId);
        }
      }
      await db.from('estoque_movimentos').insert({
        oficina_id: this._osAtualOficinaId,
        peca_id: pecaId,
        os_id: osId,
        tipo: 'entrada',
        quantidade: quantidade,
        observacao: 'Devolvido da OS (item removido)',
        created_by: APP.profile.id
      });
    }

    await db.from('itens_os').delete().eq('id', itemId);
    await this._recalcularTotaisOS(osId);
    APP.toast('Item removido');
    this.abrirDetalhes(osId);
  },

  async _recalcularTotaisOS(osId) {
    const { data: itens } = await db.from('itens_os').select('tipo, valor_total').eq('os_id', osId);
    const totalMao = (itens || []).filter(i => i.tipo === 'servico').reduce((s, i) => s + (i.valor_total || 0), 0);
    const totalPecas = (itens || []).filter(i => i.tipo === 'peca').reduce((s, i) => s + (i.valor_total || 0), 0);

    const { data: os } = await db.from('ordens_servico').select('desconto').eq('id', osId).single();
    const desconto = os?.desconto || 0;

    await db.from('ordens_servico').update({
      valor_mao_obra: totalMao,
      valor_pecas: totalPecas,
      valor_total: totalMao + totalPecas - desconto,
      updated_at: new Date().toISOString()
    }).eq('id', osId);
  },

  async atualizarDesconto(osId, totalServicos, totalPecas) {
    const desconto = parseFloat(document.getElementById('det-desconto').value) || 0;
    const total = totalServicos + totalPecas - desconto;
    document.getElementById('det-total').textContent = 'R$ ' + total.toFixed(2);

    await db.from('ordens_servico').update({
      desconto,
      valor_total: total,
      updated_at: new Date().toISOString()
    }).eq('id', osId);
    APP.toast('Desconto aplicado');
  },

  async editarOS(id) {
    const { data: os } = await db.from('ordens_servico')
      .select('*, veiculos(placa), profiles!ordens_servico_mecanico_id_fkey(nome)')
      .eq('id', id).single();
    if (!os) return;

    // Busca mecanicos
    const { data: mecanicos } = await db.from('profiles')
      .select('id, nome')
      .eq('oficina_id', APP.oficinaId)
      .in('role', ['mecanico', 'aux_mecanico', 'dono', 'gerente'])
      .order('nome');

    openModal(`
      <div class="modal-header">
        <h3>Editar OS #${esc(os.numero)} — ${esc(os.veiculos?.placa)}</h3>
        <button class="modal-close" onclick="closeModal()">&times;</button>
      </div>
      <div class="modal-body">
        <form onsubmit="OS.salvarEdicao(event, '${id}')">
          <div class="form-group">
            <label>Mecanico responsavel</label>
            <select class="form-control" id="edit-mecanico">
              <option value="">Nao definido</option>
              ${(mecanicos || []).map(m => `<option value="${m.id}" ${m.id === os.mecanico_id ? 'selected' : ''}>${esc(m.nome)}</option>`).join('')}
            </select>
          </div>
          <div class="form-group">
            <label>Descricao / Observacoes</label>
            <textarea class="form-control" id="edit-descricao" rows="3">${esc(os.descricao || '')}</textarea>
          </div>
          <div class="form-group">
            <label>KM de entrada</label>
            <input type="number" class="form-control" id="edit-km" value="${os.km_entrada || ''}">
          </div>
          <div class="form-group">
            <label>Desconto (R$)</label>
            <input type="number" class="form-control" id="edit-desconto" value="${os.desconto || 0}" min="0" step="0.01">
          </div>
          <div class="modal-footer" style="padding:16px 0 0;border:0;">
            <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancelar</button>
            <button type="submit" class="btn btn-primary">Salvar</button>
          </div>
        </form>
      </div>
    `);
  },

  async salvarEdicao(e, id) {
    e.preventDefault();
    const mecanicoId = document.getElementById('edit-mecanico').value || null;
    const { error } = await db.from('ordens_servico').update({
      mecanico_id: mecanicoId,
      descricao: document.getElementById('edit-descricao').value.trim(),
      km_entrada: document.getElementById('edit-km').value ? parseInt(document.getElementById('edit-km').value) : null,
      desconto: parseFloat(document.getElementById('edit-desconto').value) || 0,
      updated_at: new Date().toISOString()
    }).eq('id', id).eq('oficina_id', APP.oficinaId);

    if (error) { APP.toast('Erro: ' + error.message, 'error'); return; }
    closeModal();
    APP.toast('OS atualizada');
    this.abrirDetalhes(id);
  },

  async excluirOS(id) {
    if (!confirm('Tem certeza que quer excluir esta OS? Essa acao nao pode ser desfeita.')) return;

    const oficina_id = APP.oficinaId;

    // Verifica se não é entregue
    const { data: os } = await db.from('ordens_servico').select('status').eq('id', id).single();
    if (os?.status === 'entregue') {
      APP.toast('OS entregue nao pode ser excluida', 'error');
      return;
    }

    // Remove itens, checklists e depois a OS
    await db.from('itens_os').delete().eq('os_id', id).eq('oficina_id', oficina_id);
    await db.from('checklists_entrada').delete().eq('os_id', id).eq('oficina_id', oficina_id);
    await db.from('checklists_saida').delete().eq('os_id', id).eq('oficina_id', oficina_id);
    const { error } = await db.from('ordens_servico').delete().eq('id', id).eq('oficina_id', oficina_id);

    if (error) { APP.toast('Erro: ' + error.message, 'error'); return; }
    closeModal();
    APP.toast('OS excluida');
    this.carregar();
  },

  async atualizarStatus(id, status) {
    // Busca status atual pra validar transicoes
    const { data: osAtual } = await db.from('ordens_servico').select('status').eq('id', id).single();
    const statusAtual = osAtual?.status;

    // Bloqueio: sair de "entrada" sem checklist de entrada
    if (statusAtual === 'entrada' && status !== 'entrada' && status !== 'cancelada') {
      const temEntrada = await this._temChecklistEntrada(id);
      if (!temEntrada) {
        APP.toast('Preencha o checklist de entrada antes de mover a OS', 'error');
        document.getElementById('det-status').value = statusAtual;
        return;
      }
    }

    // Bloqueio: ir pra "execucao" sem ter passado por "aprovada"
    if (status === 'execucao' && statusAtual !== 'aprovada' && statusAtual !== 'aguardando_peca' && statusAtual !== 'execucao') {
      APP.toast('A OS precisa estar aprovada antes de ir pra execucao', 'error');
      document.getElementById('det-status').value = statusAtual;
      return;
    }

    // Bloqueio: ir pra "pronto" sem checklist de saida
    if (status === 'pronto') {
      const temSaida = await this._temChecklistSaida(id);
      if (!temSaida) {
        APP.toast('Preencha o checklist de saida antes de marcar como Pronto', 'error');
        document.getElementById('det-status').value = statusAtual;
        return;
      }
    }

    // Se mudou pra entregue pelo select de status, redireciona pro fluxo com pagamento
    if (status === 'entregue') {
      const detStatus = document.getElementById('det-status');
      if (detStatus) detStatus.value = statusAtual;
      this.entregarVeiculo(id);
      return;
    }

    // Se SAINDO de entregue → limpa caixa e reseta pagamento
    if (statusAtual === 'entregue' && status !== 'entregue') {
      await db.from('caixa').delete().eq('os_id', id).eq('oficina_id', APP.oficinaId);
      await db.from('ordens_servico').update({ pago: false, forma_pagamento: 'pendente', data_entrega: null }).eq('id', id);
    }

    const update = { status, updated_at: new Date().toISOString() };
    if (status === 'aprovada') update.data_aprovacao = new Date().toISOString();
    if (status === 'pronto') update.data_conclusao = new Date().toISOString();

    await db.from('ordens_servico').update(update).eq('id', id);

    // Se marcou como entregue, tenta lançar no caixa
    if (status === 'entregue') {
      await this._lancarNoCaixa(id);
    }

    APP.toast('Status atualizado');
  },

  async atualizarPagamento(id, forma) {
    const pago = forma !== 'pendente';
    const update = {
      forma_pagamento: forma,
      pago,
      updated_at: new Date().toISOString()
    };

    // Seta taxa automática quando forma é cartão
    if (forma === 'debito') update.taxa_cartao = APP.oficina?.taxa_debito || 2;
    else if (forma === 'credito') update.taxa_cartao = APP.oficina?.taxa_credito || 3.5;
    else update.taxa_cartao = 0;

    await db.from('ordens_servico').update(update).eq('id', id);

    // Se pagou e OS já tá entregue, lança no caixa
    if (pago) {
      await this._lancarNoCaixa(id);
    }

    APP.toast('Pagamento atualizado');
    this.abrirDetalhes(id); // Recarrega pra mostrar taxa
  },

  async atualizarTaxa(id, taxa) {
    await db.from('ordens_servico').update({
      taxa_cartao: parseFloat(taxa) || 0,
      updated_at: new Date().toISOString()
    }).eq('id', id);
    APP.toast('Taxa atualizada');
  },

  // Lança OS no caixa automaticamente (se entregue + paga + ainda não lançada)
  async _lancarNoCaixa(osId) {
    const oficina_id = APP.oficinaId;

    // Busca OS pra verificar se tá paga e entregue
    const { data: os } = await db.from('ordens_servico')
      .select('id, numero, status, pago, valor_mao_obra, valor_pecas, valor_total, desconto, forma_pagamento, veiculos(placa), clientes(nome)')
      .eq('id', osId).single();

    if (!os || !os.pago || os.status !== 'entregue') return;

    // Remove lançamentos anteriores dessa OS (previne duplicata)
    await db.from('caixa').delete().eq('oficina_id', oficina_id).eq('os_id', osId);

    // Guard extra (não deveria chegar aqui com duplicatas, mas garante)
    const { data: jaLancou } = await db.from('caixa')
      .select('id')
      .eq('oficina_id', oficina_id)
      .eq('os_id', osId)
      .maybeSingle();

    if (jaLancou) return; // já tá no caixa

    // Lança entrada no caixa
    const descricao = `OS #${os.numero || '-'} — ${os.veiculos?.placa || ''} — ${os.clientes?.nome || ''}`;

    const lancamentos = [];

    if (os.valor_mao_obra > 0) {
      lancamentos.push({
        oficina_id,
        os_id: osId,
        tipo: 'entrada',
        categoria: 'servico',
        descricao: descricao + ' (mão de obra)',
        valor: os.valor_mao_obra,
        forma_pagamento: os.forma_pagamento,
        created_by: APP.profile.id
      });
    }

    if (os.valor_pecas > 0) {
      lancamentos.push({
        oficina_id,
        os_id: osId,
        tipo: 'entrada',
        categoria: 'peca',
        descricao: descricao + ' (peças)',
        valor: os.valor_pecas,
        forma_pagamento: os.forma_pagamento,
        created_by: APP.profile.id
      });
    }

    // Se só tem valor_total sem split, lança inteiro
    if (!lancamentos.length && os.valor_total > 0) {
      lancamentos.push({
        oficina_id,
        os_id: osId,
        tipo: 'entrada',
        categoria: 'servico',
        descricao,
        valor: os.valor_total,
        forma_pagamento: os.forma_pagamento,
        created_by: APP.profile.id
      });
    }

    if (lancamentos.length) {
      await db.from('caixa').insert(lancamentos);
    }
  },

  // ==========================================
  // CHECKLISTS
  // ==========================================

  _itensEntrada: [
    { secao: 'EXTERIOR' },
    { key: 'amassados', label: 'Amassados e riscos', temCampo: true, dica: 'Descreva lado e local. Ex: porta traseira esquerda, risco 10cm' },
    { key: 'vidros', label: 'Vidros e retrovisores OK', temCampo: true, dica: 'Trinca, lascado? Qual vidro?' },
    { key: 'pneus', label: 'Pneus e rodas', temCampo: true, dica: 'Estado, desgaste, calibragem. Ex: dianteiro esq careca' },
    { key: 'faróis', label: 'Farois e lanternas', temCampo: true, dica: 'Queimado? Trincado? Qual?' },
    { key: 'pintura', label: 'Pintura e lataria', temCampo: true, dica: 'Descascando, oxidacao, local' },
    { secao: 'INTERIOR' },
    { key: 'combustivel', label: 'Nivel de combustivel', tipo: 'select', opcoes: ['vazio','1/4','meio','3/4','cheio'] },
    { key: 'interior', label: 'Pertences do cliente', temCampo: true, dica: 'Documentos, ferramentas, objetos no porta-luvas' },
    { key: 'travas', label: 'Travas e vidros eletricos', temCampo: false },
    { key: 'painel', label: 'Luzes no painel', temCampo: true, dica: 'Quais luzes acesas? ABS, oleo, motor, etc' },
    { key: 'ar_cond', label: 'Ar condicionado', temCampo: true, dica: 'Funciona? Cheiro ruim? Fraco?' },
    { secao: 'MECANICO' },
    { key: 'sintoma', label: 'Sintoma relatado pelo cliente', temCampo: true, dica: 'Descreva o que o cliente disse com as palavras dele' },
    { key: 'sintoma_confirmado', label: 'Sintoma confirmado pelo mecanico', temCampo: true, dica: 'O mecanico reproduziu o problema? Como?' },
    { key: 'scanner', label: 'Scanner/diagnostico', temCampo: true, dica: 'Codigos de erro, resultado do scanner' },
    { key: 'km', label: 'Quilometragem conferida', temCampo: false }
  ],

  _itensSaida: [
    { secao: 'SERVICO' },
    { key: 'itens_executados', label: 'Todos os itens da OS executados', temCampo: false },
    { key: 'pecas_registradas', label: 'Pecas substituidas registradas', temCampo: false },
    { key: 'torques', label: 'Torques aplicados corretamente', temCampo: false },
    { secao: 'VERIFICACAO' },
    { key: 'sem_vazamentos', label: 'Sem vazamentos visiveis', temCampo: false },
    { key: 'sem_ruidos', label: 'Sem ruidos anormais', temCampo: false },
    { key: 'test_drive', label: 'Test drive realizado', temCampo: true, dica: 'Km rodado, comportamento do veiculo' },
    { key: 'scanner_final', label: 'Scanner final sem erros', temCampo: true, dica: 'Apagou codigos? Algum novo?' },
    { secao: 'ENTREGA' },
    { key: 'interior_limpo', label: 'Interior limpo', temCampo: false },
    { key: 'sem_ferramentas', label: 'Sem ferramentas esquecidas', temCampo: false },
    { key: 'documentos_devolvidos', label: 'Documentos devolvidos', temCampo: false },
    { key: 'cliente_orientado', label: 'Cliente orientado sobre o servico', temCampo: true, dica: 'Explicou o que foi feito e cuidados?' }
  ],

  _switchDetTab(tab, btn) {
    ['info','servicos','pecas','checklist','acoes'].forEach(t => {
      const el = document.getElementById('os-det-' + t);
      if (el) el.style.display = t === tab ? 'block' : 'none';
    });
    document.querySelectorAll('#os-det-tabs .kanban-tab').forEach(b => b.classList.remove('active'));
    if (btn) btn.classList.add('active');
  },

  _resumoChecklist(chk, tipo) {
    const itensData = chk.itens || {};
    const defs = tipo === 'entrada' ? this._itensEntrada : this._itensSaida;
    const campos = defs.filter(d => !d.secao);
    const marcados = campos.filter(d => d.tipo === 'select' ? !!itensData[d.key]?.valor : itensData[d.key]?.checked).length;
    const total = campos.length;
    const cor = marcados === total ? 'var(--success)' : 'var(--warning)';

    let html = `<div style="font-size:12px;color:${cor};margin-bottom:6px;font-weight:600;">${marcados}/${total} itens verificados</div>`;

    // Mostra detalhes preenchidos
    const detalhes = campos.filter(d => {
      const val = itensData[d.key];
      if (!val) return false;
      if (d.tipo === 'select') return !!val.valor;
      return val.checked && val.obs;
    });

    if (detalhes.length) {
      html += '<div style="font-size:11px;color:var(--text-secondary);line-height:1.6;">';
      detalhes.forEach(d => {
        const val = itensData[d.key];
        if (d.tipo === 'select') {
          html += `<div>· ${esc(d.label)}: <strong>${esc(val.valor)}</strong></div>`;
        } else if (val.obs) {
          html += `<div>· ${esc(d.label)}: ${esc(val.obs)}</div>`;
        }
      });
      html += '</div>';
    }

    if (chk.observacoes) {
      html += `<div style="font-size:11px;color:var(--text-secondary);font-style:italic;margin-top:4px;">Obs: ${esc(chk.observacoes)}</div>`;
    }
    return html;
  },

  async abrirChecklistEntrada(osId) {
    const { data: existente } = await db.from('checklists_entrada')
      .select('*').eq('os_id', osId).maybeSingle();
    const itens = existente?.itens || {};
    const obs = existente?.observacoes || '';

    const campos = this._itensEntrada.map(item => {
      if (item.secao) {
        return `<div style="padding:12px 0 6px;margin-top:8px;border-bottom:2px solid var(--primary);font-size:11px;font-weight:800;letter-spacing:1px;color:var(--primary);">${item.secao}</div>`;
      }
      const val = itens[item.key] || {};
      if (item.tipo === 'select') {
        return `
          <div style="padding:10px 0;border-bottom:1px solid var(--border);">
            <label style="font-size:13px;font-weight:600;">${esc(item.label)}</label>
            <select class="form-control" id="chk-e-${item.key}" style="margin-top:4px;">
              <option value="">Selecione</option>
              ${item.opcoes.map(op => `<option value="${op}" ${val.valor === op ? 'selected' : ''}>${op}</option>`).join('')}
            </select>
          </div>`;
      }
      return `
        <div style="padding:10px 0;border-bottom:1px solid var(--border);">
          <label style="display:flex;align-items:center;gap:8px;cursor:pointer;">
            <input type="checkbox" id="chk-e-${item.key}" ${val.checked ? 'checked' : ''}>
            <span style="font-size:13px;">${esc(item.label)}</span>
          </label>
          ${item.temCampo ? `<input type="text" class="form-control" id="chk-e-${item.key}-obs" value="${esc(val.obs || '')}" placeholder="${esc(item.dica || 'Detalhes...')}" style="margin-top:6px;font-size:12px;">` : ''}
        </div>`;
    }).join('');

    // Busca fotos existentes
    const { data: fotos } = await db.from('fotos_os').select('*').eq('os_id', osId).eq('tipo', 'entrada').order('created_at');
    const fotosExistentes = fotos || [];

    openModal(`
      <div class="modal-header">
        <h3>Checklist de Entrada</h3>
        <button class="modal-close" onclick="closeModal()">&times;</button>
      </div>
      <div class="modal-body">
        ${campos}

        <!-- FOTOS DO VEÍCULO -->
        <div style="margin-top:16px;padding-top:16px;border-top:1px solid var(--border);">
          <label style="font-size:13px;font-weight:600;margin-bottom:8px;display:block;">Fotos do veiculo na entrada</label>
          <div id="fotos-entrada-lista" style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:10px;">
            ${fotosExistentes.map(f => `
              <div style="position:relative;width:80px;height:80px;border-radius:var(--radius);overflow:hidden;border:1px solid var(--border);">
                <img src="${esc(f.url)}" style="width:100%;height:100%;object-fit:cover;cursor:pointer;" onclick="OS.ampliarFoto('${esc(f.url)}')">
                <button onclick="event.stopPropagation();OS.excluirFoto('${f.id}','${osId}')" style="position:absolute;top:2px;right:2px;background:rgba(0,0,0,0.7);color:#fff;border:none;border-radius:50%;width:20px;height:20px;font-size:12px;cursor:pointer;line-height:1;">X</button>
              </div>
            `).join('')}
          </div>
          <div style="display:flex;gap:8px;">
            <input type="file" id="foto-entrada-input" accept="image/*" capture="environment" multiple style="display:none;" onchange="OS.uploadFotos(this.files,'${osId}','entrada')">
            <button type="button" class="btn btn-secondary btn-sm" onclick="document.getElementById('foto-entrada-input').click()">📷 Tirar / Enviar fotos</button>
          </div>
          <span style="font-size:11px;color:var(--text-muted);display:block;margin-top:4px;">Registre arranhoes, amassados e estado geral do veiculo</span>
        </div>

        <div class="form-group" style="margin-top:12px;">
          <label>Observacoes gerais</label>
          <textarea class="form-control" id="chk-e-obs" placeholder="Observacoes adicionais...">${esc(obs)}</textarea>
        </div>
        <div class="modal-footer" style="padding:16px 0 0;border:0;">
          <button class="btn btn-secondary" onclick="OS.abrirDetalhes('${osId}')">Voltar</button>
          <button class="btn btn-primary" onclick="OS.salvarChecklistEntrada('${osId}')">Salvar checklist</button>
        </div>
      </div>
    `);
  },

  async salvarChecklistEntrada(osId) {
    const itens = {};
    this._itensEntrada.filter(i => !i.secao).forEach(item => {
      if (item.tipo === 'select') {
        const el = document.getElementById('chk-e-' + item.key);
        itens[item.key] = { valor: el?.value || '' };
      } else {
        const el = document.getElementById('chk-e-' + item.key);
        const obsEl = document.getElementById('chk-e-' + item.key + '-obs');
        itens[item.key] = {
          checked: el?.checked || false,
          obs: obsEl?.value?.trim() || ''
        };
      }
    });
    const observacoes = document.getElementById('chk-e-obs')?.value?.trim() || '';

    const { data: existente } = await db.from('checklists_entrada')
      .select('id').eq('os_id', osId).maybeSingle();

    if (existente) {
      const { error } = await db.from('checklists_entrada')
        .update({ itens, observacoes })
        .eq('id', existente.id);
      if (error) { APP.toast('Erro ao salvar: ' + error.message, 'error'); return; }
    } else {
      const { error } = await db.from('checklists_entrada')
        .insert({
          oficina_id: APP.oficinaId,
          os_id: osId,
          itens,
          observacoes,
          created_by: APP.profile.id
        });
      if (error) { APP.toast('Erro ao salvar: ' + error.message, 'error'); return; }
    }

    APP.toast('Checklist de entrada salvo');
    this.abrirDetalhes(osId);
  },

  async abrirChecklistSaida(osId) {
    const { data: existente } = await db.from('checklists_saida')
      .select('*').eq('os_id', osId).maybeSingle();
    const itens = existente?.itens || {};
    const obs = existente?.observacoes || '';

    const campos = this._itensSaida.map(item => {
      if (item.secao) {
        return `<div style="padding:12px 0 6px;margin-top:8px;border-bottom:2px solid var(--primary);font-size:11px;font-weight:800;letter-spacing:1px;color:var(--primary);">${item.secao}</div>`;
      }
      const val = itens[item.key] || {};
      return `
        <div style="padding:10px 0;border-bottom:1px solid var(--border);">
          <label style="display:flex;align-items:center;gap:8px;cursor:pointer;">
            <input type="checkbox" id="chk-s-${item.key}" ${val.checked ? 'checked' : ''}>
            <span style="font-size:13px;">${esc(item.label)}</span>
          </label>
          ${item.temCampo ? `<input type="text" class="form-control" id="chk-s-${item.key}-obs" value="${esc(val.obs || '')}" placeholder="${esc(item.dica || 'Detalhes...')}" style="margin-top:6px;font-size:12px;">` : ''}
        </div>`;
    }).join('');

    openModal(`
      <div class="modal-header">
        <h3>Checklist de Saida</h3>
        <button class="modal-close" onclick="closeModal()">&times;</button>
      </div>
      <div class="modal-body">
        ${campos}
        <div class="form-group" style="margin-top:12px;">
          <label>Observacoes gerais</label>
          <textarea class="form-control" id="chk-s-obs" placeholder="Observacoes adicionais...">${esc(obs)}</textarea>
        </div>
        <div class="modal-footer" style="padding:16px 0 0;border:0;">
          <button class="btn btn-secondary" onclick="OS.abrirDetalhes('${osId}')">Voltar</button>
          <button class="btn btn-primary" onclick="OS.salvarChecklistSaida('${osId}')">Salvar checklist</button>
        </div>
      </div>
    `);
  },

  async salvarChecklistSaida(osId) {
    const itens = {};
    this._itensSaida.filter(i => !i.secao).forEach(item => {
      const el = document.getElementById('chk-s-' + item.key);
      const obsEl = document.getElementById('chk-s-' + item.key + '-obs');
      itens[item.key] = {
        checked: el?.checked || false,
        obs: obsEl?.value?.trim() || ''
      };
    });
    const observacoes = document.getElementById('chk-s-obs')?.value?.trim() || '';

    const { data: existente } = await db.from('checklists_saida')
      .select('id').eq('os_id', osId).maybeSingle();

    if (existente) {
      const { error } = await db.from('checklists_saida')
        .update({ itens, observacoes })
        .eq('id', existente.id);
      if (error) { APP.toast('Erro ao salvar: ' + error.message, 'error'); return; }
    } else {
      const { error } = await db.from('checklists_saida')
        .insert({
          oficina_id: APP.oficinaId,
          os_id: osId,
          itens,
          observacoes,
          created_by: APP.profile.id
        });
      if (error) { APP.toast('Erro ao salvar: ' + error.message, 'error'); return; }
    }

    APP.toast('Checklist de saida salvo');

    // Verifica status atual — se não tá pronto/entregue, oferece marcar como pronto
    const { data: osAtual } = await db.from('ordens_servico').select('status').eq('id', osId).single();
    if (osAtual && !['pronto', 'entregue'].includes(osAtual.status)) {
      if (confirm('Checklist de saida salvo! Marcar esta OS como Pronto?')) {
        await db.from('ordens_servico').update({
          status: 'pronto',
          data_conclusao: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }).eq('id', osId);
        APP.toast('OS marcada como Pronto');
        closeModal();
        if (typeof KANBAN !== 'undefined') KANBAN.carregar();
        return;
      }
    }

    this.abrirDetalhes(osId);
  },

  async _temChecklistEntrada(osId) {
    const { data } = await db.from('checklists_entrada')
      .select('id').eq('os_id', osId).maybeSingle();
    return !!data;
  },

  async _temChecklistSaida(osId) {
    const { data } = await db.from('checklists_saida')
      .select('id').eq('os_id', osId).maybeSingle();
    return !!data;
  },

  async uploadFotos(files, osId, tipo) {
    if (!files || !files.length) return;
    const oficina_id = APP.oficinaId;

    for (const file of files) {
      if (file.size > 2 * 1024 * 1024) { APP.toast('Foto muito grande (max 2MB): ' + file.name, 'error'); continue; }
      if (!file.type.startsWith('image/')) continue;

      const ext = file.name.split('.').pop().toLowerCase();
      const nome = `${oficina_id}/${osId}/${tipo}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}.${ext}`;

      const { error: upErr } = await db.storage.from('fotos-os').upload(nome, file, { upsert: true });
      if (upErr) { APP.toast('Erro upload: ' + upErr.message, 'error'); continue; }

      const { data: urlData } = db.storage.from('fotos-os').getPublicUrl(nome);

      await db.from('fotos_os').insert({
        os_id: osId,
        oficina_id,
        tipo,
        url: urlData.publicUrl
      });
    }

    APP.toast(files.length + ' foto(s) enviada(s)');
    // Recarrega o checklist pra mostrar as fotos
    if (tipo === 'entrada') this.abrirChecklistEntrada(osId);
    else this.abrirDetalhes(osId);
  },

  ampliarFoto(url) {
    var overlay = document.getElementById('foto-overlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'foto-overlay';
      overlay.style.cssText = 'display:none;position:fixed;top:0;left:0;width:100vw;height:100vh;background:rgba(0,0,0,0.95);z-index:99999;cursor:zoom-out;align-items:center;justify-content:center;padding:20px;';
      overlay.innerHTML = '<img id="foto-overlay-img" style="max-width:100%;max-height:100%;object-fit:contain;border-radius:8px;">';
      overlay.onclick = function() { overlay.style.display = 'none'; document.body.style.overflow = ''; };
      document.body.appendChild(overlay);
      document.addEventListener('keydown', function(e) { if (e.key === 'Escape') { overlay.style.display = 'none'; document.body.style.overflow = ''; } });
    }
    document.getElementById('foto-overlay-img').src = url;
    overlay.style.display = 'flex';
    document.body.style.overflow = 'hidden';
  },

  async excluirFoto(fotoId, osId) {
    if (!confirm('Excluir esta foto?')) return;
    await db.from('fotos_os').delete().eq('id', fotoId);
    APP.toast('Foto excluida');
    this.abrirChecklistEntrada(osId);
  },

  async marcarPronto(osId) {
    await db.from('ordens_servico').update({
      status: 'pronto',
      data_conclusao: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }).eq('id', osId);
    APP.toast('OS marcada como Pronto');
    closeModal();
    if (typeof KANBAN !== 'undefined') KANBAN.carregar();
  },

  async entregarVeiculo(osId) {
    // Verifica se tem valor
    const { data: osCheck } = await db.from('ordens_servico').select('valor_total, pago, forma_pagamento').eq('id', osId).single();
    if (!osCheck || !osCheck.valor_total || osCheck.valor_total <= 0) {
      APP.toast('OS sem valor. Adicione servicos ou pecas antes de entregar.', 'error');
      return;
    }

    // Se já tá pago, entrega direto
    if (osCheck.pago && osCheck.forma_pagamento && osCheck.forma_pagamento !== 'pendente') {
      await this._confirmarEntrega(osId);
      return;
    }

    // Carrega maquininhas pra mostrar no modal se tiver
    const { data: maquininhas } = await db.from('maquininhas').select('id, nome, taxa_debito, taxa_credito').eq('oficina_id', APP.oficinaId).eq('ativo', true).order('nome');
    OS._maquininhasCache = maquininhas || [];

    // Pergunta forma de pagamento
    openModal(`
      <div class="modal-header">
        <h3>Como o cliente pagou?</h3>
        <button class="modal-close" onclick="closeModal()">&times;</button>
      </div>
      <div class="modal-body">
        <div style="font-size:14px;color:var(--text-secondary);margin-bottom:16px;">Total: <strong style="font-size:18px;color:var(--success);">${APP.formatMoney(osCheck.valor_total)}</strong></div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
          <button class="btn btn-success" style="padding:16px;font-size:15px;" onclick="OS._entregarComPagamento('${osId}','dinheiro')">Dinheiro</button>
          <button class="btn btn-success" style="padding:16px;font-size:15px;" onclick="OS._entregarComPagamento('${osId}','pix')">Pix</button>
          <button class="btn btn-success" style="padding:16px;font-size:15px;" onclick="OS._escolherMaquininha('${osId}','debito')">Debito</button>
          <button class="btn btn-success" style="padding:16px;font-size:15px;" onclick="OS._escolherMaquininha('${osId}','credito')">Credito</button>
        </div>
        <div style="margin-top:12px;">
          <button class="btn btn-danger" style="width:100%;padding:14px;font-size:14px;" onclick="OS._entregarComPagamento('${osId}','fiado')">Fiado (nao pagou)</button>
        </div>
      </div>
    `);
    return; // Espera seleção
  },

  _maquininhasCache: [],

  _escolherMaquininha(osId, forma) {
    const maqs = OS._maquininhasCache;
    if (!maqs.length) {
      // Sem maquininhas cadastradas, usa taxa genérica da oficina
      OS._entregarComPagamento(osId, forma);
      return;
    }
    if (maqs.length === 1) {
      // Só tem uma, usa direto
      const m = maqs[0];
      const taxa = forma === 'debito' ? m.taxa_debito : m.taxa_credito;
      OS._entregarComPagamento(osId, forma, m.id, taxa);
      return;
    }
    // Múltiplas: mostra seleção
    openModal(`
      <div class="modal-header">
        <h3>Qual maquininha?</h3>
        <button class="modal-close" onclick="closeModal()">&times;</button>
      </div>
      <div class="modal-body">
        <div style="font-size:13px;color:var(--text-secondary);margin-bottom:12px;">${forma === 'debito' ? 'Debito' : 'Credito'} — escolha a maquininha usada:</div>
        <div style="display:flex;flex-direction:column;gap:10px;">
          ${maqs.map(m => {
            const taxa = forma === 'debito' ? m.taxa_debito : m.taxa_credito;
            return `<button class="btn btn-success" style="padding:16px;font-size:15px;display:flex;justify-content:space-between;" onclick="OS._entregarComPagamento('${osId}','${forma}','${m.id}',${taxa})">
              <span>${esc(m.nome)}</span>
              <span style="font-size:13px;opacity:0.8;">taxa ${taxa}%</span>
            </button>`;
          }).join('')}
        </div>
      </div>
    `);
  },

  async _entregarComPagamento(osId, forma, maquininhaId, taxaOverride) {
    const pago = forma !== 'fiado';
    let taxa = 0;
    if (taxaOverride !== undefined) {
      taxa = taxaOverride;
    } else if (forma === 'debito') {
      taxa = APP.oficina?.taxa_debito || 0;
    } else if (forma === 'credito') {
      taxa = APP.oficina?.taxa_credito || 0;
    }

    const updateOS = {
      forma_pagamento: forma === 'fiado' ? 'pendente' : forma,
      pago,
      taxa_cartao: taxa,
      status: 'entregue',
      data_entrega: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    if (maquininhaId) updateOS.maquininha_id = maquininhaId;
    await db.from('ordens_servico').update(updateOS).eq('id', osId);

    // Lança no caixa se pagou
    if (pago && typeof OS._lancarNoCaixa === 'function') await OS._lancarNoCaixa(osId);

    closeModal();

    // WhatsApp de entrega
    const { data: os } = await db.from('ordens_servico')
      .select('id, status, clientes(nome, whatsapp), veiculos(placa)')
      .eq('id', osId).single();
    if (os) KANBAN._enviarWhatsAuto(os, 'entregue');

    APP.toast('Veículo entregue');
    closeModal();
    if (typeof KANBAN !== 'undefined') KANBAN.carregar();
  },

  _montarMsgCompleta(tipo, placa, marca, modelo, link) {
    const o = APP.oficina || {};
    const nomeOficina = o.nome || 'a oficina';
    const veiculo = [marca, modelo].filter(Boolean).join(' ');
    const veiculoStr = veiculo ? veiculo + ' — ' + placa : placa;

    const aberturas = {
      historico: o.msg_historico_abertura || 'Olá! Tudo bem?',
      orcamento: o.msg_orcamento_abertura || 'Olá! Tudo certo?',
      pronto: o.msg_pronto_abertura || 'Olá! Boas notícias!',
      execucao: o.msg_execucao_abertura || 'Olá! Passando pra te atualizar.'
    };
    const fechamentos = {
      historico: o.msg_historico_fechamento || 'Qualquer dúvida é só chamar! Abraço.',
      orcamento: o.msg_orcamento_fechamento || 'Posso te enviar os detalhes? Abraço!',
      pronto: o.msg_pronto_fechamento || 'Quando pode vir buscar? Abraço!',
      execucao: o.msg_execucao_fechamento || 'Te aviso assim que ficar pronto! Abraço.'
    };
    const meios = {
      historico: `Aqui é da *${nomeOficina}*. Segue o histórico completo do seu veículo:\n*${veiculoStr}*\n\n${link}`,
      orcamento: `O orçamento do seu *${veiculoStr}* ficou pronto aqui na *${nomeOficina}*.`,
      pronto: `Seu *${veiculoStr}* está pronto e disponível para retirada aqui na *${nomeOficina}*.`,
      execucao: `Seu *${veiculoStr}* já está em execução aqui na *${nomeOficina}*. Estamos cuidando com atenção.`
    };

    return [aberturas[tipo], '', meios[tipo], '', fechamentos[tipo]].join('\n');
  },

  enviarHistorico(placa, whatsapp, marca, modelo) {
    const link = 'https://rpmpro.com.br/v?p=' + placa.replace(/[^A-Z0-9]/gi, '');
    const msg = this._montarMsgCompleta('historico', placa, marca, modelo, link);

    if (whatsapp) {
      const num = whatsapp.replace(/\D/g, '');
      const fone = num.startsWith('55') ? num : '55' + num;
      window.open(`https://wa.me/${fone}?text=${encodeURIComponent(msg)}`, '_blank');
    } else {
      navigator.clipboard.writeText(link);
      APP.toast('Link copiado: ' + link);
    }
  },

  enviarWhatsApp(whatsapp, placa, status, marca, modelo) {
    const msg = this._montarMsgCompleta(status, placa, marca, modelo);
    const num = whatsapp.replace(/\D/g, '');
    const fone = num.startsWith('55') ? num : '55' + num;
    window.open(`https://wa.me/${fone}?text=${encodeURIComponent(msg)}`, '_blank');
  }
};

document.addEventListener('pageLoad', (e) => {
  if (e.detail.page === 'os') OS.carregar();
});
