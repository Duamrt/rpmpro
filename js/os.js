// RPM Pro — Ordens de Servico
const OS = {
  async carregar() {
    const { data, error } = await supabase
      .from('ordens_servico')
      .select('*, veiculos(placa, marca, modelo), clientes(nome), profiles!ordens_servico_mecanico_id_fkey(nome)')
      .eq('oficina_id', APP.profile.oficina_id)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) { APP.toast('Erro ao carregar OS', 'error'); return; }
    this.render(data || []);
  },

  render(lista) {
    const container = document.getElementById('os-lista');
    if (!lista.length) {
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
      aprovada: 'Aprovada', execucao: 'Em execucao', pronto: 'Pronto',
      entregue: 'Entregue', cancelada: 'Cancelada'
    };

    container.innerHTML = `
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
          ${lista.map(os => `
            <tr style="cursor:pointer" onclick="OS.abrirDetalhes('${os.id}')">
              <td><strong>${os.numero || '-'}</strong></td>
              <td>
                <strong>${os.veiculos?.placa || '-'}</strong><br>
                <span style="font-size:12px;color:var(--text-secondary)">${os.veiculos?.marca || ''} ${os.veiculos?.modelo || ''}</span>
              </td>
              <td>${os.clientes?.nome || '-'}</td>
              <td>${os.profiles?.nome || '-'}</td>
              <td>${APP.formatMoney(os.valor_total)}</td>
              <td><span class="badge badge-${os.status}">${statusLabel[os.status]}</span></td>
              <td style="font-size:12px;color:var(--text-secondary)">${APP.formatDate(os.data_entrada)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>`;
  },

  async abrirModal() {
    // Busca mecanicos
    const { data: mecanicos } = await supabase
      .from('profiles')
      .select('id, nome')
      .eq('oficina_id', APP.profile.oficina_id)
      .in('role', ['mecanico', 'dono', 'gerente'])
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
            <input type="text" class="form-control" id="os-placa" required placeholder="ABC-1D23" style="text-transform:uppercase" oninput="OS.buscarPlaca(this.value)">
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
                <input type="text" class="form-control" id="os-novo-marca">
              </div>
              <div class="form-group">
                <label>Modelo</label>
                <input type="text" class="form-control" id="os-novo-modelo">
              </div>
            </div>
          </div>

          <div class="form-group">
            <label>Mecanico responsavel</label>
            <select class="form-control" id="os-mecanico">
              <option value="">Sem mecanico (definir depois)</option>
              ${(mecanicos || []).map(m => `<option value="${m.id}">${m.nome}</option>`).join('')}
            </select>
          </div>

          <div class="form-group">
            <label>Descricao do servico *</label>
            <textarea class="form-control" id="os-descricao" required placeholder="Ex: Troca de embreagem + revisao dos freios"></textarea>
          </div>

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

  // Busca automatica ao digitar placa
  _buscarTimeout: null,
  buscarPlaca(val) {
    clearTimeout(this._buscarTimeout);
    const placa = val.trim().toUpperCase();
    if (placa.length < 7) {
      document.getElementById('os-placa-info').textContent = '';
      document.getElementById('os-novo-registro').classList.add('hidden');
      return;
    }

    this._buscarTimeout = setTimeout(async () => {
      const veiculo = await VEICULOS.buscarPorPlaca(placa);
      const infoEl = document.getElementById('os-placa-info');
      const novoEl = document.getElementById('os-novo-registro');

      if (veiculo) {
        document.getElementById('os-veiculo-id').value = veiculo.id;
        document.getElementById('os-cliente-id').value = veiculo.clientes?.id || '';
        infoEl.innerHTML = `<span style="color:var(--success)">✓ ${veiculo.marca} ${veiculo.modelo} — ${veiculo.clientes?.nome || 'Sem dono'}</span>`;
        novoEl.classList.add('hidden');
      } else {
        document.getElementById('os-veiculo-id').value = '';
        document.getElementById('os-cliente-id').value = '';
        infoEl.textContent = '';
        novoEl.classList.remove('hidden');
      }
    }, 400);
  },

  async salvar(e) {
    e.preventDefault();
    const oficina_id = APP.profile.oficina_id;
    let veiculo_id = document.getElementById('os-veiculo-id').value;
    let cliente_id = document.getElementById('os-cliente-id').value;

    // Se veiculo novo, cria cliente + veiculo
    if (!veiculo_id) {
      const nomeCliente = document.getElementById('os-novo-cliente').value.trim();
      if (!nomeCliente) { APP.toast('Preencha o nome do cliente', 'error'); return; }

      // Cria cliente
      const { data: cli, error: cliErr } = await supabase
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
      const { data: vei, error: veiErr } = await supabase
        .from('veiculos')
        .insert({
          oficina_id,
          cliente_id: cli.id,
          placa: document.getElementById('os-placa').value.trim().toUpperCase(),
          marca: document.getElementById('os-novo-marca').value.trim(),
          modelo: document.getElementById('os-novo-modelo').value.trim()
        })
        .select()
        .single();
      if (veiErr) { APP.toast('Erro ao criar veiculo: ' + veiErr.message, 'error'); return; }
      veiculo_id = vei.id;
    }

    // Cria OS
    const mecanico = document.getElementById('os-mecanico').value;
    const { error } = await supabase
      .from('ordens_servico')
      .insert({
        oficina_id,
        veiculo_id,
        cliente_id,
        mecanico_id: mecanico || null,
        descricao: document.getElementById('os-descricao').value.trim(),
        km_entrada: document.getElementById('os-km').value ? parseInt(document.getElementById('os-km').value) : null,
        status: document.getElementById('os-status').value
      });

    if (error) { APP.toast('Erro ao criar OS: ' + error.message, 'error'); return; }

    closeModal();
    APP.toast('OS aberta com sucesso');
    this.carregar();
    DASHBOARD.carregar();
  },

  async abrirDetalhes(id) {
    const { data: os } = await supabase
      .from('ordens_servico')
      .select('*, veiculos(placa, marca, modelo, km_atual), clientes(nome, whatsapp), profiles!ordens_servico_mecanico_id_fkey(nome)')
      .eq('id', id)
      .single();

    if (!os) return;

    const statusOptions = ['entrada','diagnostico','orcamento','aprovada','execucao','pronto','entregue','cancelada'];
    const statusLabel = {
      entrada: 'Entrada', diagnostico: 'Diagnostico', orcamento: 'Orcamento',
      aprovada: 'Aprovada', execucao: 'Em execucao', pronto: 'Pronto',
      entregue: 'Entregue', cancelada: 'Cancelada'
    };

    openModal(`
      <div class="modal-header">
        <h3>OS #${os.numero || '-'} — ${os.veiculos?.placa}</h3>
        <button class="modal-close" onclick="closeModal()">&times;</button>
      </div>
      <div class="modal-body">
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:20px;">
          <div>
            <div style="font-size:12px;color:var(--text-secondary);">Veiculo</div>
            <div style="font-weight:600;">${os.veiculos?.marca} ${os.veiculos?.modelo}</div>
          </div>
          <div>
            <div style="font-size:12px;color:var(--text-secondary);">Cliente</div>
            <div style="font-weight:600;">${os.clientes?.nome}</div>
          </div>
          <div>
            <div style="font-size:12px;color:var(--text-secondary);">Mecanico</div>
            <div style="font-weight:600;">${os.profiles?.nome || 'Nao definido'}</div>
          </div>
          <div>
            <div style="font-size:12px;color:var(--text-secondary);">Entrada</div>
            <div style="font-weight:600;">${APP.formatDateTime(os.data_entrada)}</div>
          </div>
        </div>

        <div class="form-group">
          <label>Descricao</label>
          <div style="background:var(--bg-input);padding:10px 14px;border-radius:var(--radius);font-size:14px;">${os.descricao || '-'}</div>
        </div>

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
          <div class="form-group">
            <label>Status</label>
            <select class="form-control" id="det-status" onchange="OS.atualizarStatus('${os.id}', this.value)">
              ${statusOptions.map(s => `<option value="${s}" ${s === os.status ? 'selected' : ''}>${statusLabel[s]}</option>`).join('')}
            </select>
          </div>
          <div class="form-group">
            <label>Forma de pagamento</label>
            <select class="form-control" id="det-pagamento" onchange="OS.atualizarPagamento('${os.id}', this.value)">
              <option value="pendente" ${os.forma_pagamento === 'pendente' ? 'selected' : ''}>Pendente</option>
              <option value="dinheiro" ${os.forma_pagamento === 'dinheiro' ? 'selected' : ''}>Dinheiro</option>
              <option value="pix" ${os.forma_pagamento === 'pix' ? 'selected' : ''}>Pix</option>
              <option value="debito" ${os.forma_pagamento === 'debito' ? 'selected' : ''}>Debito</option>
              <option value="credito" ${os.forma_pagamento === 'credito' ? 'selected' : ''}>Credito</option>
            </select>
          </div>
        </div>

        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;">
          <div class="form-group">
            <label>Pecas (R$)</label>
            <input type="number" class="form-control" id="det-pecas" value="${os.valor_pecas || 0}" step="0.01" onchange="OS.atualizarValores('${os.id}')">
          </div>
          <div class="form-group">
            <label>Mao de obra (R$)</label>
            <input type="number" class="form-control" id="det-mao" value="${os.valor_mao_obra || 0}" step="0.01" onchange="OS.atualizarValores('${os.id}')">
          </div>
          <div class="form-group">
            <label>Total</label>
            <div style="background:var(--bg-input);padding:10px 14px;border-radius:var(--radius);font-size:16px;font-weight:700;color:var(--success);" id="det-total">${APP.formatMoney(os.valor_total)}</div>
          </div>
        </div>

        ${os.clientes?.whatsapp ? `
          <button class="btn btn-success" style="width:100%;margin-top:12px;" onclick="OS.enviarWhatsApp('${os.clientes.whatsapp}', '${os.veiculos?.placa}', '${os.status}')">
            💬 Avisar cliente pelo WhatsApp
          </button>
        ` : ''}
      </div>
    `);
  },

  async atualizarStatus(id, status) {
    const update = { status, updated_at: new Date().toISOString() };
    if (status === 'aprovada') update.data_aprovacao = new Date().toISOString();
    if (status === 'pronto') update.data_conclusao = new Date().toISOString();
    if (status === 'entregue') update.data_entrega = new Date().toISOString();

    await supabase.from('ordens_servico').update(update).eq('id', id);
    APP.toast('Status atualizado');
  },

  async atualizarPagamento(id, forma) {
    await supabase.from('ordens_servico').update({
      forma_pagamento: forma,
      pago: forma !== 'pendente',
      updated_at: new Date().toISOString()
    }).eq('id', id);
    APP.toast('Pagamento atualizado');
  },

  async atualizarValores(id) {
    const pecas = parseFloat(document.getElementById('det-pecas').value) || 0;
    const mao = parseFloat(document.getElementById('det-mao').value) || 0;
    const total = pecas + mao;

    document.getElementById('det-total').textContent = APP.formatMoney(total);

    await supabase.from('ordens_servico').update({
      valor_pecas: pecas,
      valor_mao_obra: mao,
      valor_total: total,
      updated_at: new Date().toISOString()
    }).eq('id', id);
  },

  enviarWhatsApp(whatsapp, placa, status) {
    const msgs = {
      orcamento: `Ola! Seu veiculo ${placa} esta com o orcamento pronto. Posso enviar os detalhes?`,
      pronto: `Ola! Seu veiculo ${placa} esta pronto para retirada. Quando pode vir buscar?`,
      execucao: `Ola! Informamos que seu veiculo ${placa} ja esta em execucao na oficina.`
    };
    const msg = msgs[status] || `Ola! Atualizacao sobre seu veiculo ${placa} na oficina.`;
    const num = whatsapp.replace(/\D/g, '');
    const fone = num.startsWith('55') ? num : '55' + num;
    window.open(`https://wa.me/${fone}?text=${encodeURIComponent(msg)}`, '_blank');
  }
};

document.addEventListener('pageLoad', (e) => {
  if (e.detail.page === 'os') OS.carregar();
});
