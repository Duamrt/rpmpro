// RPM Pro — Super Admin (Painel Dedicado)
const SUPER_ADMIN = {
  isSuperAdmin: false,
  _tab: 'dashboard',
  _filtroLead: 'todos',
  _buscaOficina: '',
  _dados: null,

  async verificar() {
    const { data } = await db.rpc('is_platform_admin');
    this.isSuperAdmin = !!data;
    return this.isSuperAdmin;
  },

  // Busca todos os dados de uma vez e cacheia
  async _fetchDados() {
    const [oficinasRes, usersRes, osRes, leadsRes] = await Promise.all([
      db.from('oficinas').select('id, nome, plano, trial_ate, ativo, cidade, estado, cnpj, telefone, whatsapp, created_at').neq('id', 'aaaa0001-0000-0000-0000-000000000001').order('created_at', { ascending: false }),
      db.from('profiles').select('id, oficina_id, nome, role, created_at'),
      db.from('ordens_servico').select('id, oficina_id, status, valor_total, created_at'),
      db.from('leads').select('*').order('created_at', { ascending: false })
    ]);

    const oficinas = oficinasRes.data || [];
    const users = usersRes.data || [];
    const ordens = osRes.data || [];
    const leads = leadsRes.data || [];

    // Pre-calcula contagens por oficina
    oficinas.forEach(o => {
      o._qtdUsers = users.filter(u => u.oficina_id === o.id).length;
      o._qtdOS = ordens.filter(os => os.oficina_id === o.id).length;
      o._faturamento = ordens.filter(os => os.oficina_id === o.id && os.status === 'entregue').reduce((s, os) => s + (os.valor_total || 0), 0);
    });

    this._dados = { oficinas, users, ordens, leads };
    return this._dados;
  },

  async carregar() {
    const container = document.getElementById('admin-content');
    if (!container) return;

    container.innerHTML = '<div class="loading">Carregando...</div>';

    if (!this._dados) await this._fetchDados();
    const { oficinas, users, ordens, leads } = this._dados;

    // Atualiza badge de leads novos na sidebar
    const leadsNovos = leads.filter(l => l.status === 'novo').length;
    const badge = document.getElementById('admin-leads-badge');
    if (badge) {
      if (leadsNovos > 0) {
        badge.textContent = leadsNovos;
        badge.style.display = '';
      } else {
        badge.style.display = 'none';
      }
    }

    // Renderiza tab ativa
    switch (this._tab) {
      case 'leads': container.innerHTML = this._renderLeads(leads); break;
      case 'oficinas': container.innerHTML = this._renderOficinas(oficinas); break;
      default: container.innerHTML = this._renderDashboard(oficinas, users, ordens, leads); break;
    }

    // Marca tab ativa na sidebar
    document.querySelectorAll('[data-admin-tab]').forEach(el => {
      el.classList.toggle('active', el.dataset.adminTab === this._tab);
    });
  },

  // ========== DASHBOARD ==========
  _renderDashboard(oficinas, users, ordens, leads) {
    const leadsNovos = leads.filter(l => l.status === 'novo').length;
    const leadsConvertidos = leads.filter(l => l.status === 'convertido').length;
    const taxaConversao = leads.length ? Math.round(leadsConvertidos / leads.length * 100) : 0;

    // MRR estimado
    const precos = { essencial: 189, profissional: 324, rede: 494 };
    const mrr = oficinas.reduce((s, o) => s + (precos[o.plano] || 0), 0);

    // OS do mês
    const mesAtual = new Date().toISOString().slice(0, 7);
    const osMes = ordens.filter(o => o.created_at && o.created_at.slice(0, 7) === mesAtual).length;

    // Oficinas ativas (não trial expirado)
    const hoje = new Date().toISOString().split('T')[0];
    const oficinasAtivas = oficinas.filter(o => {
      if (['essencial', 'profissional', 'rede', 'beta'].includes(o.plano)) return true;
      if (o.plano === 'trial' && o.trial_ate && o.trial_ate >= hoje) return true;
      return false;
    }).length;

    // Últimas oficinas (5)
    const ultimas = oficinas.slice(0, 5);

    // Últimos leads (5)
    const ultimosLeads = leads.slice(0, 5);

    // Pipeline de leads
    const pipeline = ['novo', 'contato', 'negociando', 'convertido', 'perdido'];
    const pipelineCores = { novo: 'var(--info)', contato: 'var(--warning)', negociando: '#eab308', convertido: 'var(--success)', perdido: 'var(--text-muted)' };
    const pipelineLabels = { novo: 'Novos', contato: 'Contato', negociando: 'Negociando', convertido: 'Convertidos', perdido: 'Perdidos' };

    return `
      <div class="page-header">
        <h2>Dashboard</h2>
        <button class="btn btn-secondary btn-sm" onclick="SUPER_ADMIN._dados=null;SUPER_ADMIN.carregar();">Atualizar</button>
      </div>

      <div class="kpi-grid" style="grid-template-columns:repeat(auto-fit,minmax(150px,1fr));">
        <div class="kpi-card">
          <div class="label">Oficinas Ativas</div>
          <div class="value primary">${oficinasAtivas}</div>
        </div>
        <div class="kpi-card">
          <div class="label">Total Usuarios</div>
          <div class="value">${users.length}</div>
        </div>
        <div class="kpi-card">
          <div class="label">MRR Estimado</div>
          <div class="value success">${APP.formatMoney(mrr)}</div>
        </div>
        <div class="kpi-card">
          <div class="label">Leads Novos</div>
          <div class="value warning">${leadsNovos}</div>
        </div>
        <div class="kpi-card">
          <div class="label">OS no Mes</div>
          <div class="value">${osMes}</div>
        </div>
        <div class="kpi-card">
          <div class="label">Conversao</div>
          <div class="value" style="color:${taxaConversao >= 30 ? 'var(--success)' : taxaConversao >= 15 ? 'var(--warning)' : 'var(--danger)'};">${taxaConversao}%</div>
        </div>
      </div>

      <!-- Pipeline de Leads -->
      <div style="background:var(--bg-card);border:1px solid var(--border);border-radius:var(--radius-lg);padding:20px;margin-bottom:20px;">
        <h3 style="font-size:15px;margin-bottom:16px;">Pipeline de Leads</h3>
        <div style="display:flex;gap:8px;flex-wrap:wrap;">
          ${pipeline.map(s => {
            const qtd = leads.filter(l => l.status === s).length;
            return `<div style="flex:1;min-width:100px;background:var(--bg-input);border-radius:var(--radius);padding:14px;text-align:center;border-top:3px solid ${pipelineCores[s]};">
              <div style="font-size:24px;font-weight:800;color:${pipelineCores[s]};">${qtd}</div>
              <div style="font-size:11px;color:var(--text-secondary);margin-top:4px;">${pipelineLabels[s]}</div>
            </div>`;
          }).join('')}
        </div>
      </div>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;">
        <!-- Últimos Leads -->
        <div style="background:var(--bg-card);border:1px solid var(--border);border-radius:var(--radius-lg);overflow:hidden;">
          <div style="padding:16px 20px;border-bottom:1px solid var(--border);display:flex;justify-content:space-between;align-items:center;">
            <h3 style="font-size:15px;">Leads Recentes</h3>
            <a href="#" onclick="event.preventDefault();SUPER_ADMIN._tab='leads';SUPER_ADMIN.carregar();" style="font-size:12px;color:var(--primary);text-decoration:none;">Ver todos</a>
          </div>
          <div style="padding:12px;">
            ${ultimosLeads.length ? ultimosLeads.map(l => `
              <div style="display:flex;justify-content:space-between;align-items:center;padding:10px 8px;border-bottom:1px solid var(--border);">
                <div>
                  <div style="font-size:14px;font-weight:600;">${esc(l.oficina_nome || l.nome || '-')}</div>
                  <div style="font-size:11px;color:var(--text-muted);">${esc(l.cidade || '')} — ${APP.formatDate(l.created_at)}</div>
                </div>
                <span style="font-size:11px;font-weight:700;color:${pipelineCores[l.status] || '#666'};background:${pipelineCores[l.status] || '#666'}18;padding:2px 8px;border-radius:10px;">${l.status}</span>
              </div>
            `).join('') : '<div style="padding:20px;text-align:center;color:var(--text-muted);">Nenhum lead</div>'}
          </div>
        </div>

        <!-- Últimas Oficinas -->
        <div style="background:var(--bg-card);border:1px solid var(--border);border-radius:var(--radius-lg);overflow:hidden;">
          <div style="padding:16px 20px;border-bottom:1px solid var(--border);display:flex;justify-content:space-between;align-items:center;">
            <h3 style="font-size:15px;">Oficinas Recentes</h3>
            <a href="#" onclick="event.preventDefault();SUPER_ADMIN._tab='oficinas';SUPER_ADMIN.carregar();" style="font-size:12px;color:var(--primary);text-decoration:none;">Ver todas</a>
          </div>
          <div style="padding:12px;">
            ${ultimas.map(o => {
              const planoCor = { beta: 'var(--success)', essencial: 'var(--info)', profissional: '#22d3ee', rede: 'var(--success)', trial: 'var(--warning)' };
              return `
              <div style="display:flex;justify-content:space-between;align-items:center;padding:10px 8px;border-bottom:1px solid var(--border);">
                <div>
                  <div style="font-size:14px;font-weight:600;">${esc(o.nome)}</div>
                  <div style="font-size:11px;color:var(--text-muted);">${o._qtdUsers} usuarios — ${o._qtdOS} OS</div>
                </div>
                <span style="font-size:11px;font-weight:700;color:${planoCor[o.plano] || '#666'};background:${planoCor[o.plano] || '#666'}18;padding:2px 8px;border-radius:10px;">${o.plano || 'trial'}</span>
              </div>`;
            }).join('')}
          </div>
        </div>
      </div>`;
  },

  // ========== LEADS ==========
  _renderLeads(leads) {
    const statusCor = { novo: 'var(--info)', contato: 'var(--warning)', negociando: '#eab308', convertido: 'var(--success)', perdido: 'var(--text-muted)' };
    const statusLabels = { novo: 'Novos', contato: 'Contato', negociando: 'Negociando', convertido: 'Convertidos', perdido: 'Perdidos' };

    // Filtra
    const filtrados = this._filtroLead && this._filtroLead !== 'todos' ? leads.filter(l => l.status === this._filtroLead) : leads;

    return `
      <div class="page-header">
        <h2>Leads</h2>
        <span style="font-size:13px;color:var(--text-secondary);">${leads.length} total</span>
      </div>

      <div style="display:flex;gap:8px;margin-bottom:20px;flex-wrap:wrap;">
        ${['todos', 'novo', 'contato', 'negociando', 'convertido', 'perdido'].map(f => {
          const qtd = f === 'todos' ? leads.length : leads.filter(l => l.status === f).length;
          const ativo = (this._filtroLead || 'todos') === f;
          return `<button class="btn ${ativo ? 'btn-primary' : 'btn-secondary'} btn-sm" onclick="SUPER_ADMIN._filtroLead='${f}';SUPER_ADMIN.carregar();">${f === 'todos' ? 'Todos' : statusLabels[f] || f} (${qtd})</button>`;
        }).join('')}
      </div>

      <div style="display:flex;flex-direction:column;gap:10px;">
        ${filtrados.length ? filtrados.map(l => `
          <div style="background:var(--bg-card);border:1px solid var(--border);border-left:4px solid ${statusCor[l.status] || '#666'};border-radius:var(--radius);padding:16px;">
            <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:10px;flex-wrap:wrap;gap:8px;">
              <div>
                <div style="font-size:16px;font-weight:700;">${esc(l.oficina_nome || '-')}</div>
                <div style="font-size:12px;color:var(--text-muted);margin-top:2px;">${esc(l.cidade || '')}${l.estado ? '/' + esc(l.estado) : ''} — ${APP.formatDate(l.created_at)}</div>
              </div>
              <div style="display:flex;align-items:center;gap:6px;">
                <select class="form-control" style="width:auto;font-size:12px;padding:4px 8px;" onchange="SUPER_ADMIN.mudarStatusLead('${l.id}',this.value)">
                  ${['novo', 'contato', 'negociando', 'convertido', 'perdido'].map(s => `<option value="${s}" ${l.status === s ? 'selected' : ''}>${s}</option>`).join('')}
                </select>
              </div>
            </div>
            <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;">
              <div style="font-size:13px;color:var(--text-secondary);">
                ${l.nome ? '<strong>' + esc(l.nome) + '</strong>' : ''}
                ${l.whatsapp ? ' — ' + esc(l.whatsapp) : ''}
              </div>
              <div style="display:flex;gap:6px;">
                ${l.whatsapp ? `<a href="https://wa.me/55${l.whatsapp.replace(/[^0-9]/g, '')}" target="_blank" class="btn btn-success btn-sm">WhatsApp</a>` : ''}
                <button class="btn btn-danger btn-sm" onclick="SUPER_ADMIN.excluirLead('${l.id}')" title="Excluir">X</button>
              </div>
            </div>
          </div>
        `).join('') : '<div class="empty-state"><div class="icon">🎯</div><h3>Nenhum lead</h3><p>Leads captados pela landing aparecem aqui</p></div>'}
      </div>`;
  },

  // ========== OFICINAS ==========
  _getOrdemOficinas() {
    try { return JSON.parse(localStorage.getItem('rpmpro-admin-ordem') || '[]'); } catch { return []; }
  },

  _salvarOrdem(ordem) {
    localStorage.setItem('rpmpro-admin-ordem', JSON.stringify(ordem));
  },

  _ordenarOficinas(oficinas) {
    const ordem = this._getOrdemOficinas();
    if (!ordem.length) return oficinas;
    // Ordena: quem tá na lista de ordem vem primeiro, na posição salva
    const mapa = new Map(ordem.map((id, i) => [id, i]));
    return [...oficinas].sort((a, b) => {
      const posA = mapa.has(a.id) ? mapa.get(a.id) : 9999;
      const posB = mapa.has(b.id) ? mapa.get(b.id) : 9999;
      if (posA !== posB) return posA - posB;
      return 0; // mantém ordem original pra quem não tá na lista
    });
  },

  moverOficina(oficinaId, direcao) {
    const oficinas = this._dados?.oficinas || [];
    let ordem = this._getOrdemOficinas();

    // Se ordem vazia, inicializa com ordem atual
    if (!ordem.length) ordem = oficinas.map(o => o.id);

    const idx = ordem.indexOf(oficinaId);
    if (idx === -1) return;

    const novoIdx = idx + direcao;
    if (novoIdx < 0 || novoIdx >= ordem.length) return;

    // Swap
    [ordem[idx], ordem[novoIdx]] = [ordem[novoIdx], ordem[idx]];
    this._salvarOrdem(ordem);

    // Re-ordena dados locais e re-renderiza
    this._dados.oficinas = this._ordenarOficinas(this._dados.oficinas);
    const container = document.getElementById('admin-content');
    if (container) container.innerHTML = this._renderOficinas(this._dados.oficinas);
  },

  fixarOficina(oficinaId) {
    const oficinas = this._dados?.oficinas || [];
    let ordem = this._getOrdemOficinas();
    if (!ordem.length) ordem = oficinas.map(o => o.id);

    const idx = ordem.indexOf(oficinaId);
    if (idx === -1) return;

    // Remove e coloca no topo
    ordem.splice(idx, 1);
    ordem.unshift(oficinaId);
    this._salvarOrdem(ordem);

    this._dados.oficinas = this._ordenarOficinas(this._dados.oficinas);
    const container = document.getElementById('admin-content');
    if (container) container.innerHTML = this._renderOficinas(this._dados.oficinas);
    APP.toast('Oficina fixada no topo');
  },

  _renderOficinas(oficinas) {
    const busca = (this._buscaOficina || '').toLowerCase();

    // Aplica ordenação customizada
    const ordenadas = this._ordenarOficinas(oficinas);

    const filtradas = busca ? ordenadas.filter(o =>
      (o.nome || '').toLowerCase().includes(busca) ||
      (o.cidade || '').toLowerCase().includes(busca) ||
      (o.cnpj || '').includes(busca) ||
      (o.plano || '').includes(busca)
    ) : ordenadas;

    const planoCores = { beta: 'var(--success)', essencial: 'var(--info)', profissional: '#22d3ee', rede: 'var(--success)', trial: 'var(--warning)' };
    const hoje = new Date().toISOString().split('T')[0];
    const ordem = this._getOrdemOficinas();

    return `
      <div class="page-header">
        <h2>Oficinas</h2>
        <span style="font-size:13px;color:var(--text-secondary);">${oficinas.length} cadastradas</span>
      </div>

      <div style="margin-bottom:20px;">
        <input type="text" class="form-control" placeholder="Buscar oficina por nome, cidade, CNPJ ou plano..." value="${esc(this._buscaOficina || '')}" oninput="SUPER_ADMIN._buscaOficina=this.value;SUPER_ADMIN._renderOficinasDebounce();" style="max-width:480px;">
      </div>

      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(340px,1fr));gap:16px;">
        ${filtradas.map((o, idx) => {
          const trialVencido = o.plano === 'trial' && o.trial_ate && o.trial_ate < hoje;
          const isFirst = idx === 0;
          const isLast = idx === filtradas.length - 1;
          const isPinned = ordem.length > 0 && ordem[0] === o.id;
          return `
          <div style="background:var(--bg-card);border:1px solid var(--border);border-radius:var(--radius-lg);padding:20px;${trialVencido ? 'opacity:0.6;' : ''}${isPinned ? 'border-color:var(--primary);' : ''}">
            <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:12px;">
              <div style="display:flex;align-items:flex-start;gap:8px;">
                <div style="display:flex;flex-direction:column;gap:2px;margin-top:2px;">
                  <button onclick="SUPER_ADMIN.fixarOficina('${o.id}')" title="Fixar no topo" style="background:none;border:none;cursor:pointer;font-size:14px;padding:0;line-height:1;opacity:${isPinned ? '1' : '0.4'};">📌</button>
                  ${!busca ? `
                  <button onclick="SUPER_ADMIN.moverOficina('${o.id}',-1)" title="Mover pra cima" style="background:none;border:none;cursor:pointer;font-size:11px;padding:0;line-height:1;${isFirst ? 'opacity:0.15;' : 'opacity:0.5;'}">▲</button>
                  <button onclick="SUPER_ADMIN.moverOficina('${o.id}',1)" title="Mover pra baixo" style="background:none;border:none;cursor:pointer;font-size:11px;padding:0;line-height:1;${isLast ? 'opacity:0.15;' : 'opacity:0.5;'}">▼</button>
                  ` : ''}
                </div>
                <div>
                  <div style="font-weight:700;font-size:16px;">${esc(o.nome)}</div>
                  ${o.cidade ? `<div style="font-size:12px;color:var(--text-secondary);margin-top:2px;">${esc(o.cidade)}${o.estado ? '/' + esc(o.estado) : ''}</div>` : ''}
                </div>
              </div>
              <div style="display:flex;flex-direction:column;align-items:flex-end;gap:4px;">
                <span style="font-size:11px;font-weight:700;color:${planoCores[o.plano] || 'var(--warning)'};background:${planoCores[o.plano] || 'var(--warning)'}18;padding:2px 10px;border-radius:10px;">${(o.plano || 'trial').toUpperCase()}</span>
                ${trialVencido ? '<span style="font-size:10px;color:var(--danger);font-weight:600;">VENCIDO</span>' : ''}
              </div>
            </div>
            <div style="display:flex;gap:16px;margin-bottom:14px;font-size:13px;color:var(--text-secondary);flex-wrap:wrap;">
              <span>👥 ${o._qtdUsers}</span>
              <span>🔧 ${o._qtdOS} OS</span>
              ${o._faturamento ? `<span>💰 ${APP.formatMoney(o._faturamento)}</span>` : ''}
              ${o.trial_ate ? `<span>📅 ${APP.formatDate(o.trial_ate)}</span>` : ''}
            </div>
            ${o.cnpj ? `<div style="font-size:11px;color:var(--text-muted);margin-bottom:12px;">CNPJ: ${esc(o.cnpj)}</div>` : ''}
            <div style="display:flex;gap:8px;flex-wrap:wrap;">
              <button class="btn btn-primary btn-sm" onclick="SUPER_ADMIN.acessarOficina('${o.id}','${escAttr(o.nome)}')">Acessar</button>
              <button class="btn btn-secondary btn-sm" onclick="SUPER_ADMIN.verUsuarios('${o.id}','${escAttr(o.nome)}')">Usuarios</button>
              <button class="btn btn-secondary btn-sm" onclick="SUPER_ADMIN.editarPlano('${o.id}','${escAttr(o.nome)}','${o.plano || 'trial'}','${o.trial_ate || ''}')">Plano</button>
              ${o.whatsapp ? `<a href="https://wa.me/55${o.whatsapp.replace(/[^0-9]/g, '')}" target="_blank" class="btn btn-success btn-sm">WhatsApp</a>` : ''}
            </div>
          </div>`;
        }).join('')}
      </div>
      ${!filtradas.length ? '<div class="empty-state" style="margin-top:20px;"><div class="icon">🔍</div><h3>Nenhuma oficina encontrada</h3></div>' : ''}`;
  },

  _renderOficinasDebounce() {
    clearTimeout(this._debounceTimer);
    this._debounceTimer = setTimeout(() => {
      if (this._dados) {
        const container = document.getElementById('admin-content');
        if (container) container.innerHTML = this._renderOficinas(this._dados.oficinas);
      }
    }, 200);
  },

  // ========== AÇÕES ==========
  async mudarStatusLead(id, status) {
    await db.from('leads').update({ status, updated_at: new Date().toISOString() }).eq('id', id);
    APP.toast('Lead atualizado');
    // Atualiza dados locais sem re-fetch
    if (this._dados) {
      const lead = this._dados.leads.find(l => l.id === id);
      if (lead) lead.status = status;
    }
    this.carregar();
  },

  async excluirLead(id) {
    if (!confirm('Excluir este lead?')) return;
    await db.from('leads').delete().eq('id', id);
    APP.toast('Lead excluido');
    if (this._dados) this._dados.leads = this._dados.leads.filter(l => l.id !== id);
    this.carregar();
  },

  async acessarOficina(oficinaId, nome) {
    // Salva oficina original pra voltar
    this._oficinaOriginal = this._oficinaOriginal || APP.profile.oficina_id;
    this._acessandoOutra = true;

    // Persiste no localStorage pra sobreviver a F5
    localStorage.setItem('rpmpro-admin-oficina', oficinaId);

    // Troca contexto
    APP.profile.oficina_id = oficinaId;
    APP.oficina = { id: oficinaId, nome };

    const { data: oficina } = await db.from('oficinas').select('*').eq('id', oficinaId).single();
    if (oficina) APP.oficina = oficina;

    // Atualiza header + logo
    const elNome = document.getElementById('oficina-nome');
    if (elNome) elNome.textContent = oficina?.nome || nome;
    const logoEl = document.getElementById('sidebar-logo-img');
    if (logoEl) {
      logoEl.innerHTML = oficina?.logo_url
        ? `<img src="${esc(oficina.logo_url)}" style="max-height:44px;max-width:60px;object-fit:contain;display:block;border-radius:6px;">`
        : '';
    }

    // Mostra toda a sidebar de oficina e esconde admin nav
    document.querySelectorAll('.nav-atendimento, .nav-dono-gerente, .nav-contas').forEach(el => el.style.display = '');
    const sidebarLabels = document.querySelectorAll('.sidebar-group-label');
    sidebarLabels.forEach(label => {
      const group = label.nextElementSibling;
      if (!group) return;
      // Expande OFICINA, fecha o resto
      if (label.textContent.trim() === 'OFICINA') {
        label.classList.remove('collapsed');
        group.classList.remove('collapsed');
      } else if (label.textContent.trim() !== 'PLATAFORMA') {
        label.classList.add('collapsed');
        group.classList.add('collapsed');
      }
    });

    // Barra fixa no topo — mostra qual oficina tá acessando
    let barra = document.getElementById('admin-barra');
    if (!barra) {
      barra = document.createElement('div');
      barra.id = 'admin-barra';
      barra.style.cssText = 'position:fixed;top:0;left:var(--sidebar-width);right:0;background:var(--primary);color:#fff;padding:10px 24px;font-size:13px;font-weight:700;z-index:150;display:flex;justify-content:space-between;align-items:center;box-shadow:0 2px 8px rgba(0,0,0,0.3);';
      document.body.appendChild(barra);
      // Empurra o conteúdo pra baixo
      document.querySelector('.main-content').style.paddingTop = '56px';
    }
    const nomeOficina = oficina?.nome || nome;
    const cidadeUF = [oficina?.cidade, oficina?.estado].filter(Boolean).join('/');
    barra.innerHTML = `
      <div>
        <span style="font-size:15px;">🏢 ${esc(nomeOficina)}</span>
        ${cidadeUF ? `<span style="opacity:0.7;margin-left:8px;font-size:12px;font-weight:400;">${esc(cidadeUF)}</span>` : ''}
      </div>
      <button onclick="SUPER_ADMIN.voltarAdmin()" style="background:rgba(255,255,255,0.2);border:none;color:#fff;padding:6px 16px;border-radius:6px;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit;">← Voltar ao Master</button>
    `;

    APP.toast('Acessando: ' + (oficina?.nome || nome));
    APP.loadPage('kanban');
  },

  voltarAdmin() {
    if (this._oficinaOriginal) APP.profile.oficina_id = this._oficinaOriginal;
    this._acessandoOutra = false;
    localStorage.removeItem('rpmpro-admin-oficina');

    const barra = document.getElementById('admin-barra');
    if (barra) barra.remove();
    document.querySelector('.main-content').style.paddingTop = '';

    const elNome = document.getElementById('oficina-nome');
    if (elNome) elNome.textContent = 'RPM Pro Admin';
    const logoEl = document.getElementById('sidebar-logo-img');
    if (logoEl) logoEl.innerHTML = '';

    // Restaura sidebar admin: esconde nav de oficina, mostra admin
    const role = APP.profile.role;
    if (!['dono', 'gerente'].includes(role)) {
      document.querySelectorAll('.nav-dono-gerente').forEach(el => el.style.display = 'none');
    }

    // Colapsa tudo menos PLATAFORMA
    const sidebarLabels = document.querySelectorAll('.sidebar-group-label');
    sidebarLabels.forEach(label => {
      const group = label.nextElementSibling;
      if (!group) return;
      if (label.textContent.trim() === 'PLATAFORMA') {
        label.classList.remove('collapsed');
        group.classList.remove('collapsed');
      } else {
        label.classList.add('collapsed');
        group.classList.add('collapsed');
      }
    });

    this._dados = null; // Re-fetch ao voltar
    this._tab = 'dashboard';
    APP.loadPage('admin');
    APP.toast('Voltou pro painel admin');
  },

  editarPlano(oficinaId, nome, planoAtual, trialAte) {
    openModal(`
      <div class="modal-header">
        <h3>Plano — ${esc(nome)}</h3>
        <button class="modal-close" onclick="closeModal()">&times;</button>
      </div>
      <div class="modal-body">
        <form onsubmit="SUPER_ADMIN.salvarPlano(event, '${oficinaId}')">
          <div class="form-group">
            <label>Plano</label>
            <select class="form-control" id="adm-plano">
              ${['trial', 'essencial', 'profissional', 'rede', 'beta'].map(p => `<option value="${p}" ${planoAtual === p ? 'selected' : ''}>${p.charAt(0).toUpperCase() + p.slice(1)}</option>`).join('')}
            </select>
          </div>
          <div class="form-group">
            <label>Trial/Validade ate</label>
            <input type="date" class="form-control" id="adm-trial" value="${trialAte}">
          </div>
          <div class="modal-footer" style="padding:16px 0 0;border:0;">
            <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancelar</button>
            <button type="submit" class="btn btn-primary">Salvar</button>
          </div>
        </form>
      </div>
    `);
  },

  async salvarPlano(e, oficinaId) {
    e.preventDefault();
    const plano = document.getElementById('adm-plano').value;
    const trialAte = document.getElementById('adm-trial').value || null;

    const { data, error } = await db.rpc('admin_mudar_plano', {
      p_oficina_id: oficinaId,
      p_plano: plano,
      p_trial_ate: trialAte
    });

    if (error) { APP.toast('Erro: ' + error.message, 'error'); return; }
    if (data && !data.ok) { APP.toast(data.erro, 'error'); return; }

    closeModal();
    APP.toast('Plano atualizado');
    this._dados = null;
    this.carregar();
  },

  async verUsuarios(oficinaId, nome) {
    const { data, error } = await db.rpc('admin_listar_usuarios', { p_oficina_id: oficinaId });

    if (error || !data || !data.ok) {
      APP.toast('Erro ao carregar usuarios', 'error');
      return;
    }

    const usuarios = data.usuarios || [];

    openModal(`
      <div class="modal-header">
        <h3>Usuarios — ${esc(nome)}</h3>
        <button class="modal-close" onclick="closeModal()">&times;</button>
      </div>
      <div class="modal-body">
        ${usuarios.length ? `
        <div style="display:flex;flex-direction:column;gap:12px;">
          ${usuarios.map(u => `
            <div style="background:var(--bg-input);border-radius:var(--radius);padding:14px;">
              <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
                <strong style="font-size:15px;">${esc(u.nome)}</strong>
                <span class="badge badge-${u.role === 'dono' ? 'pronto' : u.role === 'gerente' ? 'aprovada' : u.role === 'mecanico' ? 'orcamento' : 'entregue'}">${esc(u.role)}</span>
              </div>
              <div style="display:flex;align-items:center;gap:6px;margin-bottom:6px;">
                <span style="font-size:13px;color:var(--text-secondary);">${esc(u.auth_email || u.email)}</span>
                <button style="background:none;border:none;cursor:pointer;font-size:11px;color:var(--primary);" onclick="navigator.clipboard.writeText('${escAttr(u.auth_email || u.email)}'); APP.toast('Email copiado');">copiar</button>
              </div>
              <div style="font-size:12px;color:var(--text-muted);margin-bottom:10px;">Ultimo login: ${u.last_sign_in ? APP.formatDateTime(u.last_sign_in) : 'Nunca'}</div>
              <button class="btn btn-secondary btn-sm" onclick="SUPER_ADMIN.resetarSenha('${u.id}','${escAttr(u.nome)}')">Resetar senha</button>
            </div>
          `).join('')}
        </div>` : '<div style="padding:20px;text-align:center;color:var(--text-muted);">Nenhum usuario encontrado</div>'}
      </div>
    `);
  },

  async resetarSenha(userId, nome) {
    const novaSenha = prompt(`Nova senha para ${nome}:`);
    if (!novaSenha || novaSenha.length < 6) {
      if (novaSenha !== null) APP.toast('Senha precisa ter pelo menos 6 caracteres', 'error');
      return;
    }

    const { data, error } = await db.rpc('admin_reset_senha', {
      p_user_id: userId,
      p_nova_senha: novaSenha
    });

    if (error) { APP.toast('Erro: ' + error.message, 'error'); return; }
    if (data && !data.ok) { APP.toast(data.erro, 'error'); return; }

    APP.toast('Senha alterada com sucesso');
  }
};

// Listener de navegação
document.addEventListener('pageLoad', (e) => {
  if (e.detail.page === 'admin') SUPER_ADMIN.carregar();
});

// Intercepta cliques nos links admin da sidebar
document.addEventListener('click', (e) => {
  const el = e.target.closest('[data-admin-tab]');
  if (!el) return;
  e.preventDefault();
  SUPER_ADMIN._tab = el.dataset.adminTab;
  if (document.getElementById('page-admin')?.classList.contains('hidden')) {
    APP.loadPage('admin');
  } else {
    SUPER_ADMIN.carregar();
  }
});
