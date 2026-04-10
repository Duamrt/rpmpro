// RPM Pro — Onboarding Guiado (wizard primeira vez)
const ONBOARDING = {
  _step: 0,
  _dados: {},

  // Verifica se precisa mostrar onboarding
  async verificar() {
    if (!APP.profile || APP.profile.role !== 'dono') return false;
    // Defensivo: funciona com ou sem SUPER_ADMIN (kanban-v2 não tem)
    if (typeof SUPER_ADMIN !== 'undefined' && SUPER_ADMIN.isSuperAdmin) return false;
    // Não mostra pro super admin acessando outra oficina
    if (localStorage.getItem('rpmpro-admin-oficina')) return false;

    // Checa se já fez onboarding
    const feito = localStorage.getItem('rpmpro-onboarding-' + APP.oficina_id);
    if (feito) return false;

    // Verifica se oficina tem dados (se já tem cliente ou mecanico, pula)
    const [clientesRes, equipRes] = await Promise.all([
      db.from('clientes').select('id', { count: 'exact', head: true }).eq('oficina_id', APP.oficina_id),
      db.from('profiles').select('id', { count: 'exact', head: true }).eq('oficina_id', APP.oficina_id).neq('role', 'dono')
    ]);

    const temClientes = (clientesRes.count || 0) > 0;
    const temEquipe = (equipRes.count || 0) > 0;

    if (temClientes || temEquipe) {
      this._marcarFeito();
      return false;
    }

    return true;
  },

  iniciar() {
    this._step = 0;
    this._dados = {};
    this._render();
  },

  _marcarFeito() {
    localStorage.setItem('rpmpro-onboarding-' + APP.oficina_id, '1');
  },

  _render() {
    const steps = [
      { id: 'boas-vindas', titulo: 'Bem-vindo ao RPM Pro!', icone: '🚗' },
      { id: 'oficina',     titulo: 'Sua oficina',           icone: '🏢' },
      { id: 'mecanico',    titulo: 'Primeiro mecânico',     icone: '🔧' },
      { id: 'cliente',     titulo: 'Primeiro cliente',      icone: '👤' },
      { id: 'demo',        titulo: 'Ver em ação',           icone: '✨' }
    ];

    const step = steps[this._step];
    const total = steps.length;

    const progresso = steps.map((s, i) => {
      const status = i < this._step ? 'done' : i === this._step ? 'active' : '';
      return `<div style="flex:1;height:4px;border-radius:2px;background:${status === 'done' ? 'var(--success,#22c55e)' : status === 'active' ? 'var(--primary,#2563eb)' : 'var(--border,#334155)'};transition:background 0.3s;"></div>`;
    }).join('');

    let conteudo = '';
    switch (step.id) {
      case 'boas-vindas': conteudo = this._stepBoasVindas(); break;
      case 'oficina':     conteudo = this._stepOficina();    break;
      case 'mecanico':    conteudo = this._stepMecanico();   break;
      case 'cliente':     conteudo = this._stepCliente();    break;
      case 'demo':        conteudo = this._stepDemo();       break;
    }

    let overlay = document.getElementById('onboarding-overlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'onboarding-overlay';
      overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.85);z-index:2000;display:flex;align-items:center;justify-content:center;padding:16px;';
      document.body.appendChild(overlay);
    }

    overlay.innerHTML = `
      <div style="background:var(--bg-card,#1e293b);border:1px solid var(--border,#334155);border-radius:var(--radius-lg,12px);width:100%;max-width:520px;max-height:90vh;overflow-y:auto;">
        <!-- Progress -->
        <div style="display:flex;gap:6px;padding:20px 24px 0;">
          ${progresso}
        </div>

        <!-- Header -->
        <div style="padding:20px 24px 0;text-align:center;">
          <div style="font-size:48px;margin-bottom:8px;">${step.icone}</div>
          <h2 style="font-size:20px;font-weight:800;margin-bottom:4px;">${step.titulo}</h2>
          <div style="font-size:12px;color:var(--text-muted,#64748b);">Passo ${this._step + 1} de ${total}</div>
        </div>

        <!-- Conteúdo -->
        <div style="padding:20px 24px 24px;">
          ${conteudo}
        </div>
      </div>
    `;
  },

  // ===== STEP 1: BOAS VINDAS =====
  _stepBoasVindas() {
    return `
      <p style="color:var(--text-secondary,#94a3b8);font-size:14px;text-align:center;margin-bottom:24px;">
        Vamos configurar sua oficina em menos de 2 minutos.<br>
        Depois disso você já pode abrir a primeira OS.
      </p>

      <div style="display:flex;flex-direction:column;gap:12px;margin-bottom:24px;">
        <div style="display:flex;align-items:center;gap:12px;padding:12px;background:var(--bg-input,#0f172a);border-radius:var(--radius,8px);">
          <span style="font-size:24px;">🏢</span>
          <div>
            <div style="font-weight:600;font-size:14px;">Dados da oficina</div>
            <div style="font-size:12px;color:var(--text-muted,#64748b);">WhatsApp e endereço</div>
          </div>
        </div>
        <div style="display:flex;align-items:center;gap:12px;padding:12px;background:var(--bg-input,#0f172a);border-radius:var(--radius,8px);">
          <span style="font-size:24px;">🔧</span>
          <div>
            <div style="font-weight:600;font-size:14px;">Primeiro mecânico</div>
            <div style="font-size:12px;color:var(--text-muted,#64748b);">Pra poder atribuir OS</div>
          </div>
        </div>
        <div style="display:flex;align-items:center;gap:12px;padding:12px;background:var(--bg-input,#0f172a);border-radius:var(--radius,8px);">
          <span style="font-size:24px;">👤</span>
          <div>
            <div style="font-weight:600;font-size:14px;">Primeiro cliente</div>
            <div style="font-size:12px;color:var(--text-muted,#64748b);">Com veículo pra abrir OS</div>
          </div>
        </div>
        <div style="display:flex;align-items:center;gap:12px;padding:12px;background:var(--bg-input,#0f172a);border-radius:var(--radius,8px);">
          <span style="font-size:24px;">✨</span>
          <div>
            <div style="font-weight:600;font-size:14px;">OS de demonstração</div>
            <div style="font-size:12px;color:var(--text-muted,#64748b);">Ver o pátio com dados reais</div>
          </div>
        </div>
      </div>

      <div style="display:flex;gap:8px;justify-content:center;">
        <button class="btn btn-secondary" onclick="ONBOARDING.pular()">Pular por agora</button>
        <button class="btn btn-primary" onclick="ONBOARDING._step=1;ONBOARDING._render();">Vamos lá</button>
      </div>
    `;
  },

  // ===== STEP 2: OFICINA =====
  _stepOficina() {
    const oficina = APP.oficina || {};
    return `
      <form onsubmit="ONBOARDING.salvarOficina(event)">
        <div class="form-group">
          <label>WhatsApp da oficina</label>
          <input type="text" class="form-control" id="ob-whatsapp" value="${esc(oficina.whatsapp || '')}" placeholder="(11) 99999-9999">
        </div>
        <div class="form-group">
          <label>Endereço</label>
          <input type="text" class="form-control" id="ob-endereco" value="${esc(oficina.endereco || '')}" placeholder="Rua, número — Bairro">
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
          <div class="form-group">
            <label>Cidade</label>
            <input type="text" class="form-control" id="ob-cidade" value="${esc(oficina.cidade || '')}" placeholder="Sua cidade">
          </div>
          <div class="form-group">
            <label>Estado</label>
            <select class="form-control" id="ob-estado">
              <option value="">Selecione</option>
              ${['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'].map(uf =>
                `<option value="${uf}" ${oficina.estado === uf ? 'selected' : ''}>${uf}</option>`
              ).join('')}
            </select>
          </div>
        </div>

        <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:8px;">
          <button type="button" class="btn btn-secondary" onclick="ONBOARDING._step=2;ONBOARDING._render();">Pular</button>
          <button type="submit" class="btn btn-primary">Salvar e continuar</button>
        </div>
      </form>
    `;
  },

  async salvarOficina(e) {
    e.preventDefault();
    const dados = {
      whatsapp: document.getElementById('ob-whatsapp').value.trim(),
      endereco: document.getElementById('ob-endereco').value.trim(),
      cidade: document.getElementById('ob-cidade').value.trim(),
      estado: document.getElementById('ob-estado').value
    };

    const update = {};
    if (dados.whatsapp) update.whatsapp = dados.whatsapp;
    if (dados.endereco) update.endereco = dados.endereco;
    if (dados.cidade) update.cidade = dados.cidade;
    if (dados.estado) update.estado = dados.estado;

    if (Object.keys(update).length) {
      await db.from('oficinas').update(update).eq('id', APP.oficina_id);
      Object.assign(APP.oficina, update);
    }

    this._step = 2;
    this._render();
  },

  // ===== STEP 3: MECÂNICO =====
  _stepMecanico() {
    return `
      <p style="color:var(--text-secondary,#94a3b8);font-size:13px;margin-bottom:16px;">
        Cadastre pelo menos um mecânico pra poder atribuir ordens de serviço.
      </p>
      <form onsubmit="ONBOARDING.salvarMecanico(event)">
        <div class="form-group">
          <label>Nome do mecânico</label>
          <input type="text" class="form-control" id="ob-mec-nome" placeholder="Ex: Carlos" required>
        </div>
        <div class="form-group">
          <label>Função</label>
          <select class="form-control" id="ob-mec-role">
            <option value="mecanico">Mecânico</option>
            <option value="aux_mecanico">Aux. Mecânico</option>
            <option value="gerente">Gerente</option>
            <option value="atendente">Atendente</option>
          </select>
        </div>
        <div class="form-group">
          <label>Comissão (%)</label>
          <input type="number" class="form-control" id="ob-mec-comissao" value="10" min="0" max="100" step="1">
        </div>

        <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:8px;">
          <button type="button" class="btn btn-secondary" onclick="ONBOARDING._step=3;ONBOARDING._render();">Pular</button>
          <button type="submit" class="btn btn-primary">Cadastrar e continuar</button>
        </div>
      </form>
    `;
  },

  async salvarMecanico(e) {
    e.preventDefault();
    const nome = document.getElementById('ob-mec-nome').value.trim();
    const role = document.getElementById('ob-mec-role').value;
    const comissao = parseFloat(document.getElementById('ob-mec-comissao').value) || 0;

    if (!nome) { APP.toast('Preencha o nome', 'error'); return; }

    const { error } = await db.from('profiles').insert({
      oficina_id: APP.oficina_id,
      nome,
      role,
      comissao_percent: comissao,
      ativo: true
    });

    if (error) { APP.toast('Erro: ' + error.message, 'error'); return; }

    this._dados.mecanico_nome = nome;
    APP.toast('Mecânico cadastrado');
    this._step = 3;
    this._render();
  },

  // ===== STEP 4: CLIENTE =====
  _stepCliente() {
    return `
      <p style="color:var(--text-secondary,#94a3b8);font-size:13px;margin-bottom:16px;">
        Cadastre um cliente com veículo. Depois disso você já pode abrir sua primeira OS.
      </p>
      <form onsubmit="ONBOARDING.salvarCliente(event)">
        <div class="form-group">
          <label>Nome do cliente</label>
          <input type="text" class="form-control" id="ob-cli-nome" placeholder="Ex: João Silva" required>
        </div>
        <div class="form-group">
          <label>WhatsApp do cliente</label>
          <input type="text" class="form-control" id="ob-cli-whats" placeholder="(11) 99999-9999">
        </div>

        <div style="border-top:1px solid var(--border,#334155);padding-top:16px;margin-top:16px;">
          <h4 style="font-size:14px;font-weight:700;margin-bottom:12px;">Veículo</h4>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
            <div class="form-group">
              <label>Placa</label>
              <input type="text" class="form-control" id="ob-vei-placa" placeholder="ABC-1234" required style="text-transform:uppercase;">
            </div>
            <div class="form-group">
              <label>Cor</label>
              <input type="text" class="form-control" id="ob-vei-cor" placeholder="Prata">
            </div>
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
            <div class="form-group">
              <label>Marca</label>
              <input type="text" class="form-control" id="ob-vei-marca" placeholder="Fiat">
            </div>
            <div class="form-group">
              <label>Modelo</label>
              <input type="text" class="form-control" id="ob-vei-modelo" placeholder="Uno">
            </div>
          </div>
          <div class="form-group">
            <label>Ano</label>
            <input type="text" class="form-control" id="ob-vei-ano" placeholder="2020" style="max-width:120px;">
          </div>
        </div>

        <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:8px;">
          <button type="button" class="btn btn-secondary" onclick="ONBOARDING._step=4;ONBOARDING._render();">Pular</button>
          <button type="submit" class="btn btn-primary">Cadastrar e continuar</button>
        </div>
      </form>
    `;
  },

  async salvarCliente(e) {
    e.preventDefault();
    const nome = document.getElementById('ob-cli-nome').value.trim();
    const whatsapp = document.getElementById('ob-cli-whats').value.trim();
    const placa = document.getElementById('ob-vei-placa').value.trim().toUpperCase();
    const marca = document.getElementById('ob-vei-marca').value.trim();
    const modelo = document.getElementById('ob-vei-modelo').value.trim();
    const ano = document.getElementById('ob-vei-ano').value.trim();
    const cor = document.getElementById('ob-vei-cor').value.trim();

    if (!nome) { APP.toast('Preencha o nome do cliente', 'error'); return; }
    if (!placa) { APP.toast('Preencha a placa do veículo', 'error'); return; }

    const { data: cliente, error: errCli } = await db.from('clientes').insert({
      oficina_id: APP.oficina_id,
      nome,
      whatsapp: whatsapp || null
    }).select().single();

    if (errCli) { APP.toast('Erro: ' + errCli.message, 'error'); return; }

    const { data: veiculo, error: errVei } = await db.from('veiculos').insert({
      oficina_id: APP.oficina_id,
      cliente_id: cliente.id,
      placa,
      marca: marca || null,
      modelo: modelo || null,
      ano: ano || null,
      cor: cor || null
    }).select().single();

    if (errVei) { APP.toast('Erro no veículo: ' + errVei.message, 'error'); return; }

    this._dados.cliente_id = cliente.id;
    this._dados.veiculo_id = veiculo.id;
    APP.toast('Cliente e veículo cadastrados');
    this._step = 4;
    this._render();
  },

  // ===== STEP 5: DEMO OS =====
  _stepDemo() {
    return `
      <p style="color:var(--text-secondary,#94a3b8);font-size:14px;text-align:center;margin-bottom:20px;">
        Quer ver como o pátio fica com dados reais? A gente cria uma OS de exemplo pra você visualizar e já entender o fluxo.
      </p>

      <div style="background:var(--bg-input,#0f172a);border-radius:var(--radius,8px);padding:16px;margin-bottom:24px;">
        <div style="font-size:13px;font-weight:700;margin-bottom:10px;color:var(--text-primary,#f1f5f9);">OS de demonstração inclui:</div>
        <div style="display:flex;flex-direction:column;gap:8px;">
          <div style="display:flex;align-items:center;gap:8px;font-size:13px;color:var(--text-secondary,#94a3b8);">
            <span style="color:var(--success,#22c55e);font-weight:700;">✓</span> Aparece no pátio em "Aguardando"
          </div>
          <div style="display:flex;align-items:center;gap:8px;font-size:13px;color:var(--text-secondary,#94a3b8);">
            <span style="color:var(--success,#22c55e);font-weight:700;">✓</span> Troca de óleo + revisão geral com valores
          </div>
          <div style="display:flex;align-items:center;gap:8px;font-size:13px;color:var(--text-secondary,#94a3b8);">
            <span style="color:var(--success,#22c55e);font-weight:700;">✓</span> Mecânico atribuído automaticamente
          </div>
          <div style="display:flex;align-items:center;gap:8px;font-size:13px;color:var(--text-secondary,#94a3b8);">
            <span style="color:var(--text-muted,#64748b);">○</span> Pode excluir quando quiser
          </div>
        </div>
      </div>

      <div style="display:flex;gap:8px;justify-content:center;">
        <button class="btn btn-secondary" onclick="ONBOARDING.concluir()">Não, obrigado</button>
        <button class="btn btn-primary" onclick="ONBOARDING.criarDemoOS()">Criar OS de exemplo</button>
      </div>
    `;
  },

  async criarDemoOS() {
    const btn = document.querySelector('#onboarding-overlay .btn-primary');
    if (btn) { btn.disabled = true; btn.textContent = 'Criando...'; }

    try {
      // Pega o mecânico cadastrado ou o primeiro disponível
      const { data: mecanicos } = await db.from('profiles')
        .select('id')
        .eq('oficina_id', APP.oficina_id)
        .in('role', ['mecanico', 'aux_mecanico', 'dono'])
        .eq('ativo', true)
        .limit(1);

      // Pega o veículo cadastrado no step 4 ou o primeiro disponível
      let veiculoId = this._dados.veiculo_id;
      let clienteId = this._dados.cliente_id;

      if (!veiculoId) {
        const { data: veiculos } = await db.from('veiculos')
          .select('id, cliente_id')
          .eq('oficina_id', APP.oficina_id)
          .limit(1);
        if (veiculos?.length) {
          veiculoId = veiculos[0].id;
          clienteId = veiculos[0].cliente_id;
        }
      }

      if (!veiculoId) {
        // Sem veículo cadastrado, pula a criação de demo
        this.concluir();
        return;
      }

      const mecId = mecanicos?.[0]?.id || null;

      const { data: os, error } = await db.from('ordens_servico').insert({
        oficina_id: APP.oficina_id,
        veiculo_id: veiculoId,
        cliente_id: clienteId,
        mecanico_id: mecId,
        descricao: 'Revisão geral completa — OS de demonstração (pode excluir)',
        status: 'aguardando',
        km_entrada: 45000,
        valor_mao_obra: 150,
        valor_pecas: 85.90,
        valor_total: 235.90
      }).select().single();

      if (error || !os) { this.concluir(); return; }

      await db.from('itens_os').insert([
        { oficina_id: APP.oficina_id, os_id: os.id, tipo: 'servico', descricao: 'Troca de óleo + filtro', quantidade: 1, valor_unitario: 80, valor_total: 80 },
        { oficina_id: APP.oficina_id, os_id: os.id, tipo: 'servico', descricao: 'Revisão geral', quantidade: 1, valor_unitario: 70, valor_total: 70 },
        { oficina_id: APP.oficina_id, os_id: os.id, tipo: 'peca', descricao: 'Óleo Motor 5W30 4L', quantidade: 1, valor_unitario: 55.90, valor_total: 55.90 },
        { oficina_id: APP.oficina_id, os_id: os.id, tipo: 'peca', descricao: 'Filtro de óleo', quantidade: 1, valor_unitario: 30, valor_total: 30 }
      ]);

      this._dados.demo_criado = true;
    } catch(e) {
      console.warn('[onboarding] erro ao criar demo OS:', e);
    }

    this.concluir();
  },

  async concluir() {
    this._marcarFeito();

    // Importa catálogo base de serviços pra oficina nova
    await this._importarCatalogoBase();

    const overlay = document.getElementById('onboarding-overlay');
    if (overlay) {
      const msg = this._dados.demo_criado
        ? 'Sua oficina está configurada com uma OS de exemplo no pátio e mais de 100 serviços prontos.'
        : 'Sua oficina está configurada com mais de 100 serviços prontos.';
      overlay.innerHTML = `
        <div style="background:var(--bg-card,#1e293b);border:1px solid var(--border,#334155);border-radius:var(--radius-lg,12px);width:100%;max-width:520px;padding:40px 24px;text-align:center;">
          <div style="font-size:64px;margin-bottom:16px;">🎉</div>
          <h2 style="font-size:22px;font-weight:800;margin-bottom:8px;">Tudo pronto!</h2>
          <p style="color:var(--text-secondary,#94a3b8);font-size:14px;margin-bottom:24px;">${msg}<br>Agora você pode abrir ordens de serviço e acompanhar tudo pelo Pátio.</p>
          <button class="btn btn-primary" style="padding:12px 32px;font-size:15px;" onclick="ONBOARDING.fechar()">Começar a usar</button>
        </div>
      `;
    }
  },

  async _importarCatalogoBase() {
    if (typeof CATALOGO_SERVICOS === 'undefined') return;
    try {
      const { count } = await db.from('servicos_catalogo')
        .select('id', { count: 'exact', head: true })
        .eq('oficina_id', APP.oficina_id);
      if (count > 0) return;

      const rows = [];
      for (const [cat, servicos] of Object.entries(CATALOGO_SERVICOS)) {
        servicos.forEach(s => {
          rows.push({
            oficina_id: APP.oficina_id,
            categoria: cat,
            nome: s.nome,
            valor_padrao: s.valor,
            ativo: true
          });
        });
      }

      if (rows.length) {
        await db.from('servicos_catalogo').insert(rows);
      }
    } catch (e) {
      console.warn('Erro ao importar catálogo base:', e);
    }
  },

  fechar() {
    const overlay = document.getElementById('onboarding-overlay');
    if (overlay) overlay.remove();
    // Compatível com app.js (loadPage) e kanban-v2.html standalone (carregar)
    if (typeof APP !== 'undefined' && typeof APP.loadPage === 'function') {
      APP.loadPage('kanban');
    } else if (typeof carregar === 'function') {
      carregar();
    }
  },

  // Alias mantido para compatibilidade (step 4 usava finalizar diretamente)
  finalizar() {
    this._step = 4;
    this._render();
  },

  async pular() {
    this._marcarFeito();
    await this._importarCatalogoBase();
    const overlay = document.getElementById('onboarding-overlay');
    if (overlay) overlay.remove();
  }
};
