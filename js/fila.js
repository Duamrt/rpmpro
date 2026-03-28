// RPM Pro — Fila de Espera
const FILA = {
  _filtro: 'aguardando',

  async carregar() {
    const container = document.getElementById('fila-content');
    if (!container) return;
    const oficina_id = APP.profile.oficina_id;

    let query = db.from('fila_espera').select('*').eq('oficina_id', oficina_id).order('created_at', { ascending: false });

    if (this._filtro !== 'todos') query = query.eq('status', this._filtro);

    const { data } = await query;
    const lista = data || [];

    // Contadores
    const aguardando = lista.filter(f => f.status === 'aguardando').length;
    const urgentes = lista.filter(f => f.urgencia === 'urgente' && f.status === 'aguardando').length;

    const urgenciaCor = { baixa: 'var(--text-muted)', normal: 'var(--info)', urgente: 'var(--danger)' };
    const urgenciaLabel = { baixa: 'Pode esperar', normal: 'Normal', urgente: 'Urgente' };
    const statusBadge = { aguardando: 'orcamento', contatado: 'aprovada', agendado: 'pronto', cancelado: 'cancelada' };

    container.innerHTML = `
      <!-- KPIs -->
      <div class="kpi-grid" style="margin-bottom:20px;">
        <div class="kpi-card">
          <div class="label">Na fila</div>
          <div class="value primary">${this._filtro === 'todos' ? lista.length : aguardando}</div>
        </div>
        <div class="kpi-card">
          <div class="label">Urgentes</div>
          <div class="value" style="color:var(--danger);">${urgentes}</div>
        </div>
      </div>

      <!-- Filtros -->
      <div style="display:flex;gap:8px;margin-bottom:16px;flex-wrap:wrap;">
        ${['aguardando','contatado','agendado','todos'].map(f => `
          <button class="btn ${this._filtro === f ? 'btn-primary' : 'btn-secondary'} btn-sm" onclick="FILA._filtro='${f}'; FILA.carregar();">${f.charAt(0).toUpperCase() + f.slice(1)}</button>
        `).join('')}
      </div>

      ${lista.length ? `
      <div style="display:flex;flex-direction:column;gap:12px;">
        ${lista.map(f => `
          <div style="background:var(--bg-card);border:1px solid ${f.urgencia === 'urgente' && f.status === 'aguardando' ? 'var(--danger)' : 'var(--border)'};border-radius:var(--radius-lg);padding:16px;${f.urgencia === 'urgente' && f.status === 'aguardando' ? 'border-left:4px solid var(--danger);' : ''}">
            <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:8px;flex-wrap:wrap;gap:6px;">
              <div>
                <strong style="font-size:15px;">${esc(f.nome)}</strong>
                ${f.placa ? `<span style="margin-left:8px;font-size:13px;color:var(--primary);font-weight:700;">${esc(f.placa)}</span>` : ''}
                ${f.veiculo_info ? `<br><span style="font-size:12px;color:var(--text-secondary);">${esc(f.veiculo_info)}</span>` : ''}
              </div>
              <div style="display:flex;gap:6px;align-items:center;flex-wrap:wrap;">
                <span style="font-size:12px;font-weight:700;color:var(--text-secondary);background:var(--bg-input);padding:2px 8px;border-radius:6px;">${FILA._tempoAtras(f.created_at)}</span>
                <span style="font-size:11px;font-weight:700;color:${urgenciaCor[f.urgencia]};">${esc(urgenciaLabel[f.urgencia])}</span>
                <span class="badge badge-${statusBadge[f.status] || 'orcamento'}">${esc(f.status)}</span>
              </div>
            </div>
            <div style="background:var(--bg-input);padding:10px 12px;border-radius:var(--radius);margin-bottom:10px;font-size:14px;line-height:1.5;">
              "${esc(f.sintoma)}"
            </div>
            <div style="font-size:12px;color:var(--text-muted);margin-bottom:10px;">
              ${APP.formatDateTime(f.created_at)}
              ${f.whatsapp ? ` · ${esc(f.whatsapp)}` : ''}
            </div>
            <div style="display:flex;gap:8px;flex-wrap:wrap;">
              ${f.whatsapp && f.status === 'aguardando' ? `<button class="btn btn-success btn-sm" onclick="FILA.contatar('${f.id}','${esc(f.whatsapp)}','${esc(f.nome)}')">WhatsApp</button>` : ''}
              ${f.status === 'aguardando' || f.status === 'contatado' ? `<button class="btn btn-primary btn-sm" onclick="FILA.agendar('${f.id}','${esc(f.nome)}','${esc(f.placa || '')}','${esc(f.sintoma)}')">Agendar</button>` : ''}
              ${f.status === 'aguardando' ? `<button class="btn btn-secondary btn-sm" onclick="FILA.mudarStatus('${f.id}','contatado')">Contatado</button>` : ''}
              ${f.status !== 'cancelado' && f.status !== 'agendado' ? `<button class="btn btn-secondary btn-sm" onclick="FILA.editar('${f.id}')">Editar</button>` : ''}
              ${f.status !== 'cancelado' && f.status !== 'agendado' ? `<button class="btn btn-danger btn-sm" onclick="FILA.mudarStatus('${f.id}','cancelado')">X</button>` : ''}
            </div>
            ${f.observacoes ? `<div style="font-size:12px;color:var(--text-secondary);margin-top:8px;padding-top:8px;border-top:1px solid var(--border);">${esc(f.observacoes)}</div>` : ''}
          </div>
        `).join('')}
      </div>` : `
      <div class="empty-state">
        <div class="icon">📞</div>
        <h3>Fila vazia</h3>
        <p>Quando um cliente ligar ou mandar WhatsApp, registre aqui pra nao perder</p>
      </div>`}
    `;
  },

  _cliCache: [],

  _veiCache: [],

  async abrirModal() {
    // Carrega clientes e veículos pra autocomplete
    const [cliRes, veiRes] = await Promise.all([
      db.from('clientes').select('id, nome, whatsapp').eq('oficina_id', APP.profile.oficina_id).order('nome'),
      db.from('veiculos').select('id, placa, marca, modelo, cliente_id').eq('oficina_id', APP.profile.oficina_id).order('placa')
    ]);
    this._cliCache = cliRes.data || [];
    this._veiCache = veiRes.data || [];

    openModal(`
      <div class="modal-header">
        <h3>Novo na fila</h3>
        <button class="modal-close" onclick="closeModal()">&times;</button>
      </div>
      <div class="modal-body">
        <form onsubmit="FILA.salvar(event)">
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
            <div class="form-group" style="position:relative;">
              <label>Nome do cliente *</label>
              <input type="text" class="form-control" id="fila-nome" required placeholder="Digite pra buscar ou cadastrar novo" autocomplete="off" oninput="FILA._buscarCli(this.value)" onfocus="FILA._buscarCli(this.value)">
              <input type="hidden" id="fila-cliente-id" value="">
              <div id="fila-cli-lista" style="position:absolute;top:100%;left:0;right:0;z-index:100;background:var(--bg-card);border:1px solid var(--border);border-radius:0 0 var(--radius) var(--radius);max-height:200px;overflow-y:auto;display:none;box-shadow:0 4px 12px rgba(0,0,0,0.3);"></div>
            </div>
            <div class="form-group">
              <label>WhatsApp</label>
              <input type="text" class="form-control" id="fila-whatsapp" placeholder="(00) 00000-0000" maxlength="15" oninput="FILA._maskFone(this)">
            </div>
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
            <div class="form-group" style="position:relative;">
              <label>Veiculo</label>
              <input type="text" class="form-control" id="fila-veiculo" placeholder="Digite marca ou modelo..." autocomplete="off" oninput="FILA._buscarVeiculo(document.getElementById('fila-veiculo').value)" onfocus="FILA._buscarVeiculo(document.getElementById('fila-veiculo').value)">
              <div id="fila-veiculo-lista" style="position:absolute;top:100%;left:0;right:0;z-index:100;background:var(--bg-card);border:1px solid var(--border);border-radius:0 0 var(--radius) var(--radius);max-height:200px;overflow-y:auto;display:none;box-shadow:0 4px 12px rgba(0,0,0,0.3);"></div>
            </div>
            <div class="form-group">
              <label>Placa</label>
              <input type="text" class="form-control" id="fila-placa" placeholder="Se souber" style="text-transform:uppercase" maxlength="8">
            </div>
          </div>
          <div class="form-group">
            <label>O que o cliente disse? *</label>
            <textarea class="form-control" id="fila-sintoma" required rows="3" placeholder="Resuma o que ele falou. Ex: barulho na roda dianteira quando freia, ar nao gela, luz do painel acesa..."></textarea>
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
            <div class="form-group">
              <label>Urgencia</label>
              <select class="form-control" id="fila-urgencia">
                <option value="normal">Normal</option>
                <option value="urgente">Urgente</option>
                <option value="baixa">Pode esperar</option>
              </select>
            </div>
          </div>
          <div class="form-group">
            <label>Observacoes internas</label>
            <textarea class="form-control" id="fila-obs" rows="2" placeholder="Anotacoes pra equipe (cliente nao ve)"></textarea>
          </div>
          <div class="modal-footer" style="padding:16px 0 0;border:0;">
            <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancelar</button>
            <button type="submit" class="btn btn-primary">Adicionar na fila</button>
          </div>
        </form>
      </div>
    `);
  },

  async editar(id) {
    const { data } = await db.from('fila_espera').select('*').eq('id', id).single();
    if (!data) return;

    openModal(`
      <div class="modal-header">
        <h3>Editar — ${esc(data.nome)}</h3>
        <button class="modal-close" onclick="closeModal()">&times;</button>
      </div>
      <div class="modal-body">
        <form onsubmit="FILA.salvarEdicao(event, '${id}')">
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
            <div class="form-group">
              <label>Nome *</label>
              <input type="text" class="form-control" id="fila-ed-nome" required value="${esc(data.nome)}">
            </div>
            <div class="form-group">
              <label>WhatsApp</label>
              <input type="text" class="form-control" id="fila-ed-whatsapp" value="${esc(data.whatsapp || '')}">
            </div>
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
            <div class="form-group">
              <label>Placa</label>
              <input type="text" class="form-control" id="fila-ed-placa" value="${esc(data.placa || '')}" style="text-transform:uppercase" maxlength="8">
            </div>
            <div class="form-group">
              <label>Veiculo</label>
              <input type="text" class="form-control" id="fila-ed-veiculo" value="${esc(data.veiculo_info || '')}">
            </div>
          </div>
          <div class="form-group">
            <label>O que o cliente disse? *</label>
            <textarea class="form-control" id="fila-ed-sintoma" required rows="3">${esc(data.sintoma)}</textarea>
          </div>
          <div class="form-group">
            <label>Urgencia</label>
            <select class="form-control" id="fila-ed-urgencia">
              <option value="normal" ${data.urgencia === 'normal' ? 'selected' : ''}>Normal</option>
              <option value="urgente" ${data.urgencia === 'urgente' ? 'selected' : ''}>Urgente</option>
              <option value="baixa" ${data.urgencia === 'baixa' ? 'selected' : ''}>Pode esperar</option>
            </select>
          </div>
          <div class="form-group">
            <label>Observacoes internas</label>
            <textarea class="form-control" id="fila-ed-obs" rows="2">${esc(data.observacoes || '')}</textarea>
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
    const { error } = await db.from('fila_espera').update({
      nome: document.getElementById('fila-ed-nome').value.trim(),
      whatsapp: document.getElementById('fila-ed-whatsapp').value.trim() || null,
      placa: document.getElementById('fila-ed-placa').value.trim().toUpperCase() || null,
      veiculo_info: document.getElementById('fila-ed-veiculo').value.trim() || null,
      sintoma: document.getElementById('fila-ed-sintoma').value.trim(),
      urgencia: document.getElementById('fila-ed-urgencia').value,
      observacoes: document.getElementById('fila-ed-obs').value.trim() || null
    }).eq('id', id).eq('oficina_id', APP.profile.oficina_id);

    if (error) { APP.toast('Erro: ' + error.message, 'error'); return; }
    closeModal();
    APP.toast('Atualizado');
    this.carregar();
  },

  async salvar(e) {
    e.preventDefault();
    const oficina_id = APP.profile.oficina_id;
    const nome = document.getElementById('fila-nome').value.trim();
    const whatsapp = document.getElementById('fila-whatsapp').value.trim() || null;
    const placa = document.getElementById('fila-placa').value.trim().toUpperCase() || null;
    const veiculoInfo = document.getElementById('fila-veiculo').value.trim() || null;
    const clienteId = document.getElementById('fila-cliente-id').value || null;

    // Se não selecionou cliente existente, cadastra novo automaticamente
    if (!clienteId && nome) {
      const { data: novoCli } = await db.from('clientes').insert({
        oficina_id, nome, whatsapp
      }).select().single();

      // Se tem placa, cadastra veículo também
      if (novoCli && placa) {
        await db.from('veiculos').insert({
          oficina_id,
          cliente_id: novoCli.id,
          placa,
          modelo: veiculoInfo || null
        });
      }
    }

    const { error } = await db.from('fila_espera').insert({
      oficina_id,
      nome,
      whatsapp,
      placa,
      veiculo_info: veiculoInfo,
      sintoma: document.getElementById('fila-sintoma').value.trim(),
      urgencia: document.getElementById('fila-urgencia').value,
      observacoes: document.getElementById('fila-obs').value.trim() || null,
      created_by: APP.profile.id
    });

    if (error) { APP.toast('Erro: ' + error.message, 'error'); return; }
    closeModal();
    APP.toast(clienteId ? 'Adicionado na fila' : 'Cliente cadastrado e adicionado na fila');
    this.carregar();
  },

  _buscarCli(termo) {
    const lista = document.getElementById('fila-cli-lista');
    if (!lista) return;
    const t = termo.toLowerCase();
    const filtrados = t.length >= 2 ? this._cliCache.filter(c => c.nome.toLowerCase().includes(t)) : [];

    if (!filtrados.length) {
      lista.style.display = 'none';
      document.getElementById('fila-cliente-id').value = '';
      return;
    }

    lista.style.display = 'block';
    lista.innerHTML = filtrados.slice(0, 10).map(c =>
      `<div style="padding:10px 14px;cursor:pointer;font-size:13px;border-bottom:1px solid var(--border);" onmousedown="FILA._selecionarCli('${c.id}','${esc(c.nome)}','${esc(c.whatsapp || '')}')" onmouseover="this.style.background='var(--bg-input)'" onmouseout="this.style.background=''">
        <strong>${esc(c.nome)}</strong>
        ${c.whatsapp ? `<span style="font-size:11px;color:var(--text-muted);margin-left:8px;">${esc(c.whatsapp)}</span>` : ''}
      </div>`
    ).join('');
  },

  _selecionarCli(id, nome, whatsapp) {
    document.getElementById('fila-nome').value = nome;
    document.getElementById('fila-cliente-id').value = id;
    document.getElementById('fila-cli-lista').style.display = 'none';
    if (whatsapp && !document.getElementById('fila-whatsapp').value) {
      document.getElementById('fila-whatsapp').value = whatsapp;
    }
  },

  _buscarVeiculo(termo) {
    const lista = document.getElementById('fila-veiculo-lista');
    if (!lista) return;
    const t = termo.toLowerCase();
    if (t.length < 2) { lista.style.display = 'none'; return; }

    let html = '';

    // 1. Busca nos veículos já cadastrados da oficina
    const cadastrados = this._veiCache.filter(v =>
      ((v.marca || '') + ' ' + (v.modelo || '') + ' ' + v.placa).toLowerCase().includes(t)
    );

    if (cadastrados.length) {
      html += `<div style="padding:6px 14px;font-size:10px;font-weight:700;color:var(--text-muted);letter-spacing:1px;">CADASTRADOS</div>`;
      html += cadastrados.slice(0, 5).map(v => {
        const cli = this._cliCache.find(c => c.id === v.cliente_id);
        return `<div style="padding:10px 14px;cursor:pointer;font-size:13px;border-bottom:1px solid var(--border);" onmousedown="FILA._selecionarVeiculo('${esc(v.placa)}','${esc((v.marca || '') + ' ' + (v.modelo || ''))}','${v.cliente_id}','${esc(cli?.nome || '')}','${esc(cli?.whatsapp || '')}')" onmouseover="this.style.background='var(--bg-input)'" onmouseout="this.style.background=''">
          <strong>${esc(v.marca || '')} ${esc(v.modelo || '')}</strong>
          <span style="font-size:12px;color:var(--primary);margin-left:6px;">${esc(v.placa)}</span>
          ${cli ? `<span style="font-size:11px;color:var(--text-muted);margin-left:6px;">— ${esc(cli.nome)}</span>` : ''}
        </div>`;
      }).join('');
    }

    // 2. Busca no catálogo geral de marcas/modelos
    if (typeof CATALOGO_VEICULOS !== 'undefined') {
      const resultsCatalogo = [];
      for (const [marca, modelos] of Object.entries(CATALOGO_VEICULOS)) {
        for (const modelo of modelos) {
          if ((marca + ' ' + modelo).toLowerCase().includes(t)) {
            resultsCatalogo.push({ marca, modelo });
          }
        }
      }

      if (resultsCatalogo.length) {
        html += `<div style="padding:6px 14px;font-size:10px;font-weight:700;color:var(--text-muted);letter-spacing:1px;border-top:1px solid var(--border);">CATALOGO</div>`;
        html += resultsCatalogo.slice(0, 8).map(v =>
          `<div style="padding:10px 14px;cursor:pointer;font-size:13px;border-bottom:1px solid var(--border);" onmousedown="FILA._selecionarCatalogo('${esc(v.marca)}','${esc(v.modelo)}')" onmouseover="this.style.background='var(--bg-input)'" onmouseout="this.style.background=''">
            <strong>${esc(v.marca)}</strong> <span style="color:var(--text-secondary);">${esc(v.modelo)}</span>
          </div>`
        ).join('');
      }
    }

    if (!html) {
      lista.style.display = 'none';
      return;
    }

    lista.style.display = 'block';
    lista.innerHTML = html;
  },

  _selecionarVeiculo(placa, veiInfo, clienteId, clienteNome, clienteWhats) {
    document.getElementById('fila-placa').value = placa;
    document.getElementById('fila-veiculo').value = veiInfo.trim();
    document.getElementById('fila-veiculo-lista').style.display = 'none';
    if (clienteNome && !document.getElementById('fila-nome').value) {
      document.getElementById('fila-nome').value = clienteNome;
      document.getElementById('fila-cliente-id').value = clienteId;
    }
    if (clienteWhats && !document.getElementById('fila-whatsapp').value) {
      document.getElementById('fila-whatsapp').value = clienteWhats;
    }
  },

  _selecionarCatalogo(marca, modelo) {
    document.getElementById('fila-veiculo').value = marca + ' ' + modelo;
    document.getElementById('fila-veiculo-lista').style.display = 'none';
  },

  _maskFone(el) {
    let v = el.value.replace(/\D/g, '').slice(0, 11);
    if (v.length > 10) v = v.replace(/^(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    else if (v.length > 6) v = v.replace(/^(\d{2})(\d{4,5})(\d{0,4})/, '($1) $2-$3');
    else if (v.length > 2) v = v.replace(/^(\d{2})(\d{0,5})/, '($1) $2');
    el.value = v;
  },

  contatar(id, fone, nome) {
    const num = fone.replace(/\D/g, '');
    const numFull = num.length <= 11 ? '55' + num : num;
    const msg = `Oi ${nome}! Aqui e da ${APP.oficina?.nome || ''}. Recebemos seu contato e vamos verificar a disponibilidade. Ja te retorno com a data!`;
    window.open(`https://wa.me/${numFull}?text=${encodeURIComponent(msg)}`, '_blank');
    this.mudarStatus(id, 'contatado');
  },

  async agendar(filaId, nome, placa, sintoma) {
    // Busca cliente pela placa ou nome
    let clienteId = null;
    let veiculoId = null;
    const oficina_id = APP.profile.oficina_id;

    if (placa) {
      const { data: vei } = await db.from('veiculos').select('id, cliente_id').eq('oficina_id', oficina_id).eq('placa', placa).maybeSingle();
      if (vei) { veiculoId = vei.id; clienteId = vei.cliente_id; }
    }

    if (!clienteId) {
      const { data: cli } = await db.from('clientes').select('id').eq('oficina_id', oficina_id).ilike('nome', nome).maybeSingle();
      if (cli) clienteId = cli.id;
    }

    if (!clienteId || !veiculoId) {
      // Abre cadastro de cliente com dados preenchidos, depois volta pra agendar
      APP.toast('Cadastre o cliente com veículo primeiro', 'warning');
      APP.loadPage('clientes');
      setTimeout(() => {
        CLIENTES.abrirModal({}, nome, async () => {
          // Depois de cadastrar, tenta agendar de novo
          APP.loadPage('agendamentos');
          setTimeout(() => AGENDAMENTOS.abrirModal({ descricao: sintoma, tipo: 'outro' }), 300);
        });
      }, 300);
      return;
    }

    // Abre modal de agendamento pre-preenchido
    APP.loadPage('agendamentos');
    setTimeout(() => {
      AGENDAMENTOS.abrirModal({
        cliente_id: clienteId,
        veiculo_id: veiculoId,
        descricao: sintoma,
        tipo: 'outro'
      });
    }, 300);

    // Marca como agendado na fila
    this.mudarStatus(filaId, 'agendado');
  },

  _tempoAtras(data) {
    const agora = Date.now();
    const diff = agora - new Date(data).getTime();
    const min = Math.floor(diff / 60000);
    if (min < 1) return 'agora';
    if (min < 60) return min + ' min';
    const horas = Math.floor(min / 60);
    if (horas < 24) return horas + 'h';
    const dias = Math.floor(horas / 24);
    if (dias === 1) return 'ontem';
    return dias + 'd';
  },

  async mudarStatus(id, novoStatus) {
    const { error } = await db.from('fila_espera').update({ status: novoStatus }).eq('id', id).eq('oficina_id', APP.profile.oficina_id);
    if (error) { APP.toast('Erro: ' + error.message, 'error'); return; }
    APP.toast('Status atualizado');
    this.carregar();
  }
};

document.addEventListener('pageLoad', (e) => {
  if (e.detail.page === 'fila') FILA.carregar();
});
