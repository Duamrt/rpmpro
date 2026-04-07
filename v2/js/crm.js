// RPM Pro — CRM de Reativação
const CRM = {
  _dados: null,

  async carregar() {
    const container = document.getElementById('crm-content');
    if (!container) return;
    const oficina_id = APP.oficinaId;

    // Busca todos os clientes com data da última OS
    const { data: clientes } = await db
      .from('clientes')
      .select('id, nome, whatsapp, telefone, created_at')
      .eq('oficina_id', oficina_id)
      .order('nome');

    if (!clientes || !clientes.length) {
      container.innerHTML = `<div class="empty-state"><div class="icon">📋</div><h3>Nenhum cliente cadastrado</h3><p>Cadastre clientes para usar o CRM</p></div>`;
      return;
    }

    // Busca última OS de cada cliente
    const { data: oss } = await db
      .from('ordens_servico')
      .select('cliente_id, created_at, status')
      .eq('oficina_id', oficina_id)
      .order('created_at', { ascending: false });

    // Monta mapa: cliente_id → última OS
    const ultimaOS = {};
    const totalOS = {};
    (oss || []).forEach(os => {
      if (!ultimaOS[os.cliente_id]) ultimaOS[os.cliente_id] = os.created_at;
      totalOS[os.cliente_id] = (totalOS[os.cliente_id] || 0) + 1;
    });

    const hoje = new Date();
    const diasEntre = (d) => Math.floor((hoje - new Date(d)) / 86400000);

    // Classifica clientes
    const grupos = {
      atencao: [],    // 30-60 dias
      risco: [],      // 60-90 dias
      inativo: [],    // 90-180 dias
      perdido: [],    // 180+ dias
      semOS: [],      // nunca fez OS
    };

    clientes.forEach(c => {
      const ultima = ultimaOS[c.id];
      const total = totalOS[c.id] || 0;
      const dias = ultima ? diasEntre(ultima) : null;

      const item = { ...c, dias, total, ultimaData: ultima };

      if (!ultima) grupos.semOS.push(item);
      else if (dias >= 180) grupos.perdido.push(item);
      else if (dias >= 90) grupos.inativo.push(item);
      else if (dias >= 60) grupos.risco.push(item);
      else if (dias >= 30) grupos.atencao.push(item);
      // < 30 dias = ativo, não aparece no CRM
    });

    const totalInativos = grupos.atencao.length + grupos.risco.length + grupos.inativo.length + grupos.perdido.length;

    this._dados = grupos;

    container.innerHTML = `
      <!-- KPIs -->
      <div class="kpi-grid" style="margin-bottom:20px;">
        <div class="kpi-card">
          <div class="label">Clientes inativos</div>
          <div class="value" style="color:var(--warning);">${totalInativos}</div>
        </div>
        <div class="kpi-card">
          <div class="label">Atencao (30-60d)</div>
          <div class="value" style="color:var(--info);">${grupos.atencao.length}</div>
        </div>
        <div class="kpi-card">
          <div class="label">Risco (60-90d)</div>
          <div class="value" style="color:var(--warning);">${grupos.risco.length}</div>
        </div>
        <div class="kpi-card">
          <div class="label">Perdidos (90d+)</div>
          <div class="value" style="color:var(--danger);">${grupos.inativo.length + grupos.perdido.length}</div>
        </div>
      </div>

      <!-- Grupos -->
      ${this._renderGrupo('Atencao — 30 a 60 dias', grupos.atencao, 'warning', 'Hora de lembrar que voce existe! Mande um oi pelo WhatsApp.')}
      ${this._renderGrupo('Risco — 60 a 90 dias', grupos.risco, 'danger', 'Cliente esfriando. Uma mensagem agora pode trazer de volta.')}
      ${this._renderGrupo('Inativos — 90 a 180 dias', grupos.inativo, 'danger', 'Ja faz tempo. Ofereça um check-up ou desconto.')}
      ${this._renderGrupo('Perdidos — 180+ dias', grupos.perdido, 'danger', 'Pode ter ido pra outra oficina. Vale tentar resgatar.')}
      ${this._renderGrupo('Nunca fizeram OS', grupos.semOS, 'secondary', 'Cadastrados mas nunca trouxeram o carro. Ative esses contatos.')}
    `;
  },

  _renderGrupo(titulo, lista, cor, dica) {
    if (!lista.length) return '';
    const _mob = window.innerWidth <= 768;
    const badgeCls = cor === 'danger' ? 'cancelada' : cor === 'warning' ? 'orcamento' : 'entregue';
    return `
      <div style="background:var(--bg-card);border:1px solid var(--border);border-radius:var(--radius-lg);overflow:hidden;margin-bottom:16px;">
        <div style="padding:14px 20px;border-bottom:1px solid var(--border);display:flex;justify-content:space-between;align-items:center;">
          <div>
            <h3 style="font-size:14px;">${esc(titulo)}</h3>
            <span style="font-size:12px;color:var(--text-muted);">${esc(dica)}</span>
          </div>
          <span class="badge badge-${badgeCls}">${lista.length}</span>
        </div>
        ${_mob ? `
        <div class="mobile-card-list" style="padding:10px;">
          ${lista.map(c => `
            <div class="mobile-card">
              <div class="mobile-card-header">
                <div>
                  <div class="mobile-card-title">${esc(c.nome)}</div>
                  <div class="mobile-card-subtitle">${c.whatsapp ? esc(c.whatsapp) : 'Sem WhatsApp'} · ${c.total} OS · ${c.dias !== null ? c.dias + 'd atras' : 'Nunca'}</div>
                </div>
                ${c.dias !== null ? `<span style="font-size:12px;font-weight:700;color:var(--text-muted);">${c.dias}d</span>` : ''}
              </div>
              <div class="mobile-card-row">
                ${!c.whatsapp ? `<div style="display:flex;gap:4px;flex:1;">
                  <input type="text" class="form-control" id="crm-whats-${c.id}" placeholder="(00) 00000-0000" maxlength="15" style="padding:6px 8px;font-size:13px;flex:1;" oninput="CRM._maskFone(this)">
                  <button class="btn btn-primary btn-sm" onclick="CRM.salvarWhatsApp('${c.id}')">Salvar</button>
                </div>` : `<div style="display:flex;gap:6px;flex-wrap:wrap;">
                  <button class="btn btn-success btn-sm" onclick="CRM.enviarWhatsApp('${escAttr(c.whatsapp)}','${escAttr(c.nome)}',${c.dias || 0})">WhatsApp</button>
                  <button class="btn btn-secondary btn-sm" onclick="CRM.agendarRetorno('${c.id}')">Agendar</button>
                </div>`}
              </div>
            </div>
          `).join('')}
        </div>` : `
        <table class="data-table">
          <thead>
            <tr><th>Cliente</th><th>WhatsApp</th><th>OS feitas</th><th>Ultima OS</th><th></th></tr>
          </thead>
          <tbody>
            ${lista.map(c => `
              <tr>
                <td><strong>${esc(c.nome)}</strong></td>
                <td>
                  ${c.whatsapp ? `<span>${esc(c.whatsapp)}</span>` : `<input type="text" class="form-control" id="crm-whats-${c.id}" placeholder="(00) 00000-0000" maxlength="15" style="padding:4px 8px;font-size:12px;width:140px;" oninput="CRM._maskFone(this)">
                  <button class="btn btn-primary btn-sm" style="margin-top:2px;" onclick="CRM.salvarWhatsApp('${c.id}')">Salvar</button>`}
                </td>
                <td>${c.total}</td>
                <td>${c.dias !== null ? c.dias + ' dias atras' : 'Nunca'}</td>
                <td style="display:flex;gap:4px;">
                  ${c.whatsapp ? `<button class="btn btn-success btn-sm" onclick="CRM.enviarWhatsApp('${escAttr(c.whatsapp)}','${escAttr(c.nome)}',${c.dias || 0})">WhatsApp</button>` : ''}
                  <button class="btn btn-secondary btn-sm" onclick="CRM.agendarRetorno('${c.id}')">Agendar</button>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>`}
      </div>`;
  },

  async salvarWhatsApp(clienteId) {
    const input = document.getElementById('crm-whats-' + clienteId);
    if (!input) return;
    const whatsapp = input.value.trim();
    if (!whatsapp) { APP.toast('Digite o WhatsApp', 'error'); return; }

    await db.from('clientes').update({ whatsapp }).eq('id', clienteId);
    APP.toast('WhatsApp salvo');
    this.carregar();
  },

  _maskFone(el) {
    let v = el.value.replace(/\D/g, '').slice(0, 11);
    if (v.length > 10) v = v.replace(/^(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    else if (v.length > 6) v = v.replace(/^(\d{2})(\d{4,5})(\d{0,4})/, '($1) $2-$3');
    else if (v.length > 2) v = v.replace(/^(\d{2})(\d{0,5})/, '($1) $2');
    el.value = v;
  },

  enviarWhatsApp(fone, nome, dias) {
    const num = fone.replace(/\D/g, '');
    const numFull = num.length <= 11 ? '55' + num : num;

    let msg;
    if (dias === 0) {
      msg = `Oi ${nome}! Tudo bem? Aqui e da oficina ${APP.oficina?.nome || ''}. Vimos que voce ta cadastrado mas ainda nao trouxe o carro. Quer agendar uma revisao? Estamos a disposicao!`;
    } else if (dias < 60) {
      msg = `Oi ${nome}! Ja faz ${dias} dias desde o ultimo servico aqui na ${APP.oficina?.nome || ''}. Que tal agendar uma revisao preventiva? Prevenir e melhor que remediar!`;
    } else if (dias < 120) {
      msg = `Oi ${nome}! Sentimos sua falta aqui na ${APP.oficina?.nome || ''}! Ja faz ${dias} dias. Temos condicoes especiais pra clientes que retornam. Bora agendar?`;
    } else {
      msg = `Oi ${nome}! Aqui e da ${APP.oficina?.nome || ''}. Faz tempo que nao nos vemos (${dias} dias). Gostaríamos de ter voce de volta! Temos novidades e condicoes especiais. Podemos conversar?`;
    }

    window.open(`https://wa.me/${numFull}?text=${encodeURIComponent(msg)}`, '_blank');
  },

  agendarRetorno(clienteId) {
    // Redireciona pra tela de agendamentos com o cliente pré-selecionado
    APP.loadPage('agendamentos');
    setTimeout(() => {
      if (typeof AGENDAMENTOS !== 'undefined') AGENDAMENTOS.abrirModal({ cliente_id: clienteId });
    }, 300);
  }
};

document.addEventListener('pageLoad', (e) => {
  if (e.detail.page === 'crm') CRM.carregar();
});
