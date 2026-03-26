// RPM Pro — Onboarding Guiado (wizard primeira vez)
const ONBOARDING = {
  _step: 0,
  _dados: {},

  // Verifica se precisa mostrar onboarding
  async verificar() {
    if (!APP.profile || APP.profile.role !== 'dono') return false;
    if (SUPER_ADMIN.isSuperAdmin) return false;

    // Checa se já fez onboarding (flag no localStorage + verifica se tem dados)
    const feito = localStorage.getItem('rpmpro-onboarding-' + APP.profile.oficina_id);
    if (feito) return false;

    // Verifica se oficina tem dados (se já tem cliente ou mecanico, pula)
    const [clientesRes, equipRes] = await Promise.all([
      db.from('clientes').select('id', { count: 'exact', head: true }).eq('oficina_id', APP.profile.oficina_id),
      db.from('profiles').select('id', { count: 'exact', head: true }).eq('oficina_id', APP.profile.oficina_id).neq('role', 'dono')
    ]);

    const temClientes = (clientesRes.count || 0) > 0;
    const temEquipe = (equipRes.count || 0) > 0;

    // Se já tem cliente ou equipe, marca como feito e pula
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
    localStorage.setItem('rpmpro-onboarding-' + APP.profile.oficina_id, '1');
  },

  _render() {
    const steps = [
      { id: 'boas-vindas', titulo: 'Bem-vindo ao RPM Pro!', icone: '🚗' },
      { id: 'oficina', titulo: 'Sua oficina', icone: '🏢' },
      { id: 'mecanico', titulo: 'Primeiro mecanico', icone: '🔧' },
      { id: 'cliente', titulo: 'Primeiro cliente', icone: '👤' }
    ];

    const step = steps[this._step];
    const total = steps.length;

    // Progress bar
    const progresso = steps.map((s, i) => {
      const status = i < this._step ? 'done' : i === this._step ? 'active' : '';
      return `<div style="flex:1;height:4px;border-radius:2px;background:${status === 'done' ? 'var(--success)' : status === 'active' ? 'var(--primary)' : 'var(--border)'};transition:background 0.3s;"></div>`;
    }).join('');

    let conteudo = '';
    switch (step.id) {
      case 'boas-vindas': conteudo = this._stepBoasVindas(); break;
      case 'oficina': conteudo = this._stepOficina(); break;
      case 'mecanico': conteudo = this._stepMecanico(); break;
      case 'cliente': conteudo = this._stepCliente(); break;
    }

    // Overlay fullscreen
    let overlay = document.getElementById('onboarding-overlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'onboarding-overlay';
      overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.85);z-index:2000;display:flex;align-items:center;justify-content:center;padding:16px;';
      document.body.appendChild(overlay);
    }

    overlay.innerHTML = `
      <div style="background:var(--bg-card);border:1px solid var(--border);border-radius:var(--radius-lg);width:100%;max-width:520px;max-height:90vh;overflow-y:auto;">
        <!-- Progress -->
        <div style="display:flex;gap:6px;padding:20px 24px 0;">
          ${progresso}
        </div>

        <!-- Header -->
        <div style="padding:20px 24px 0;text-align:center;">
          <div style="font-size:48px;margin-bottom:8px;">${step.icone}</div>
          <h2 style="font-size:20px;font-weight:800;margin-bottom:4px;">${step.titulo}</h2>
          <div style="font-size:12px;color:var(--text-muted);">Passo ${this._step + 1} de ${total}</div>
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
      <p style="color:var(--text-secondary);font-size:14px;text-align:center;margin-bottom:24px;">
        Vamos configurar sua oficina em menos de 2 minutos.<br>
        Depois disso voce ja pode abrir a primeira OS.
      </p>

      <div style="display:flex;flex-direction:column;gap:12px;margin-bottom:24px;">
        <div style="display:flex;align-items:center;gap:12px;padding:12px;background:var(--bg-input);border-radius:var(--radius);">
          <span style="font-size:24px;">🏢</span>
          <div>
            <div style="font-weight:600;font-size:14px;">Dados da oficina</div>
            <div style="font-size:12px;color:var(--text-muted);">WhatsApp e endereco</div>
          </div>
        </div>
        <div style="display:flex;align-items:center;gap:12px;padding:12px;background:var(--bg-input);border-radius:var(--radius);">
          <span style="font-size:24px;">🔧</span>
          <div>
            <div style="font-weight:600;font-size:14px;">Primeiro mecanico</div>
            <div style="font-size:12px;color:var(--text-muted);">Pra poder atribuir OS</div>
          </div>
        </div>
        <div style="display:flex;align-items:center;gap:12px;padding:12px;background:var(--bg-input);border-radius:var(--radius);">
          <span style="font-size:24px;">👤</span>
          <div>
            <div style="font-weight:600;font-size:14px;">Primeiro cliente</div>
            <div style="font-size:12px;color:var(--text-muted);">Com veiculo pra abrir OS</div>
          </div>
        </div>
      </div>

      <div style="display:flex;gap:8px;justify-content:center;">
        <button class="btn btn-secondary" onclick="ONBOARDING.pular()">Pular por agora</button>
        <button class="btn btn-primary" onclick="ONBOARDING._step=1;ONBOARDING._render();">Vamos la</button>
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
          <label>Endereco</label>
          <input type="text" class="form-control" id="ob-endereco" value="${esc(oficina.endereco || '')}" placeholder="Rua, numero — Bairro">
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

    // Só salva campos preenchidos
    const update = {};
    if (dados.whatsapp) update.whatsapp = dados.whatsapp;
    if (dados.endereco) update.endereco = dados.endereco;
    if (dados.cidade) update.cidade = dados.cidade;
    if (dados.estado) update.estado = dados.estado;

    if (Object.keys(update).length) {
      await db.from('oficinas').update(update).eq('id', APP.profile.oficina_id);
      Object.assign(APP.oficina, update);
    }

    this._step = 2;
    this._render();
  },

  // ===== STEP 3: MECÂNICO =====
  _stepMecanico() {
    return `
      <p style="color:var(--text-secondary);font-size:13px;margin-bottom:16px;">
        Cadastre pelo menos um mecanico pra poder atribuir ordens de servico.
      </p>
      <form onsubmit="ONBOARDING.salvarMecanico(event)">
        <div class="form-group">
          <label>Nome do mecanico</label>
          <input type="text" class="form-control" id="ob-mec-nome" placeholder="Ex: Carlos" required>
        </div>
        <div class="form-group">
          <label>Funcao</label>
          <select class="form-control" id="ob-mec-role">
            <option value="mecanico">Mecanico</option>
            <option value="aux_mecanico">Aux. Mecanico</option>
            <option value="gerente">Gerente</option>
            <option value="atendente">Atendente</option>
          </select>
        </div>
        <div class="form-group">
          <label>Comissao (%)</label>
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
      oficina_id: APP.profile.oficina_id,
      nome,
      role,
      comissao_percent: comissao,
      ativo: true
    });

    if (error) { APP.toast('Erro: ' + error.message, 'error'); return; }

    this._dados.mecanico = nome;
    APP.toast('Mecanico cadastrado');
    this._step = 3;
    this._render();
  },

  // ===== STEP 4: CLIENTE =====
  _stepCliente() {
    return `
      <p style="color:var(--text-secondary);font-size:13px;margin-bottom:16px;">
        Cadastre um cliente com veiculo. Depois disso voce ja pode abrir sua primeira OS.
      </p>
      <form onsubmit="ONBOARDING.salvarCliente(event)">
        <div class="form-group">
          <label>Nome do cliente</label>
          <input type="text" class="form-control" id="ob-cli-nome" placeholder="Ex: Joao Silva" required>
        </div>
        <div class="form-group">
          <label>WhatsApp do cliente</label>
          <input type="text" class="form-control" id="ob-cli-whats" placeholder="(11) 99999-9999">
        </div>

        <div style="border-top:1px solid var(--border);padding-top:16px;margin-top:16px;">
          <h4 style="font-size:14px;font-weight:700;margin-bottom:12px;">Veiculo</h4>
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
          <button type="button" class="btn btn-secondary" onclick="ONBOARDING.finalizar()">Pular</button>
          <button type="submit" class="btn btn-primary">Cadastrar e finalizar</button>
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
    if (!placa) { APP.toast('Preencha a placa do veiculo', 'error'); return; }

    // Insere cliente
    const { data: cliente, error: errCli } = await db.from('clientes').insert({
      oficina_id: APP.profile.oficina_id,
      nome,
      whatsapp: whatsapp || null
    }).select().single();

    if (errCli) { APP.toast('Erro: ' + errCli.message, 'error'); return; }

    // Insere veículo
    const { error: errVei } = await db.from('veiculos').insert({
      oficina_id: APP.profile.oficina_id,
      cliente_id: cliente.id,
      placa,
      marca: marca || null,
      modelo: modelo || null,
      ano: ano || null,
      cor: cor || null
    });

    if (errVei) { APP.toast('Erro no veiculo: ' + errVei.message, 'error'); return; }

    APP.toast('Cliente e veiculo cadastrados');
    this.finalizar();
  },

  finalizar() {
    this._marcarFeito();

    const overlay = document.getElementById('onboarding-overlay');
    if (overlay) {
      overlay.innerHTML = `
        <div style="background:var(--bg-card);border:1px solid var(--border);border-radius:var(--radius-lg);width:100%;max-width:520px;padding:40px 24px;text-align:center;">
          <div style="font-size:64px;margin-bottom:16px;">🎉</div>
          <h2 style="font-size:22px;font-weight:800;margin-bottom:8px;">Tudo pronto!</h2>
          <p style="color:var(--text-secondary);font-size:14px;margin-bottom:24px;">
            Sua oficina ta configurada. Agora voce pode abrir<br>ordens de servico e acompanhar tudo pelo Patio.
          </p>
          <button class="btn btn-primary" style="padding:12px 32px;font-size:15px;" onclick="ONBOARDING.fechar()">Comecar a usar</button>
        </div>
      `;
    }
  },

  fechar() {
    const overlay = document.getElementById('onboarding-overlay');
    if (overlay) overlay.remove();
    // Recarrega dados da oficina pra pegar atualizações
    APP.loadPage('kanban');
  },

  pular() {
    this._marcarFeito();
    const overlay = document.getElementById('onboarding-overlay');
    if (overlay) overlay.remove();
  }
};
