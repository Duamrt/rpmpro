// RPM Pro — App Core
const APP = {
  profile: null,
  oficina: null,

  // Retorna oficina_id correto (se super-admin acessando outra, usa APP.oficina.id)
  get oficinaId() {
    return this.oficina?.id || this.profile?.oficina_id;
  },

  async init() {
    try {
    const user = await AUTH.requireAuth();
    if (!user) return;

    this.profile = await AUTH.getProfile();
    if (!this.profile) {
      await AUTH.logout();
      return;
    }
    this.oficina = this.profile.oficinas || null;

    // Atualiza nome da oficina no header
    const elNome = document.getElementById('oficina-nome');
    if (elNome) elNome.textContent = this.oficina?.nome || '';

    const elUser = document.getElementById('user-nome');
    if (elUser) elUser.textContent = this.profile.nome;

    const roleLabels = { dono: 'Dono', gerente: 'Gerente', mecanico: 'Mecanico', atendente: 'Atendente', aux_mecanico: 'Aux. Mecanico', aux_admin: 'Aux. Administrativo' };
    const elRole = document.getElementById('user-role');
    // Super admin mostra "Admin" ao invés do role da oficina
    if (elRole) elRole.textContent = roleLabels[this.profile.role] || this.profile.role;
    const elAvatar = document.getElementById('user-avatar');
    if (elAvatar) elAvatar.textContent = (this.profile.nome || '?')[0].toUpperCase();

    // Logo da oficina na sidebar — grande e centralizada
    if (this.oficina?.logo_url) {
      const logoEl = document.getElementById('sidebar-logo-img');
      if (logoEl) logoEl.innerHTML = `<img src="${esc(this.oficina.logo_url)}" style="max-height:44px;max-width:60px;object-fit:contain;display:block;border-radius:6px;">`;
    }

    // Verifica super admin
    const isAdmin = await SUPER_ADMIN.verificar();
    if (isAdmin) {
      document.querySelectorAll('.nav-super-admin').forEach(el => el.style.display = '');
      const elRole = document.getElementById('user-role');
      if (elRole) elRole.textContent = 'Admin';

      // Restaura oficina que estava acessando antes do F5
      const oficinaSalva = localStorage.getItem('rpmpro-admin-oficina');
      if (oficinaSalva) {
        await SUPER_ADMIN.acessarOficina(oficinaSalva, '');
      }
    }

    // Verifica trial/plano (super admin ignora)
    if (!isAdmin && this._trialExpirado()) {
      this._mostrarBloqueio();
      return;
    }

    // Ajusta bottom nav por perfil
    this._setupBottomNav();

    // Sidebar: permissões por perfil
    const role = this.profile.role;
    if (!['dono', 'gerente'].includes(role) && !isAdmin) {
      document.querySelectorAll('.nav-dono-gerente').forEach(el => el.style.display = 'none');
      // Contas a pagar: visível pra atendente/aux_admin também
      if (['atendente', 'aux_admin'].includes(role)) {
        document.querySelectorAll('.nav-contas').forEach(el => el.style.display = '');
      }
    }
    // Mecânico/aux_mecanico: só vê Oficina (Pátio + Dashboard)
    if (['mecanico', 'aux_mecanico'].includes(role) && !isAdmin) {
      document.querySelectorAll('.nav-atendimento').forEach(el => el.style.display = 'none');
    }

    // aux_mecanico = mesmas permissoes de mecanico
    // aux_admin = mesmas permissoes de atendente
    if (this.profile.role === 'aux_mecanico') this.profile._roleBase = 'mecanico';
    else if (this.profile.role === 'aux_admin') this.profile._roleBase = 'atendente';
    else this.profile._roleBase = this.profile.role;

    // Sidebar: colapsa grupos conforme perfil
    this._setupSidebarGroups(isAdmin);

    // Carrega pagina salva ou pagina padrão do perfil
    const paginaPadrao = isAdmin ? 'admin' : 'kanban';
    this.loadPage(localStorage.getItem('rpmpro-page') || paginaPadrao);

    // Onboarding guiado (primeira vez)
    if (!isAdmin) {
      const precisaOnboarding = await ONBOARDING.verificar();
      if (precisaOnboarding) ONBOARDING.iniciar();
    }

    // Sidebar navigation — bind único
    if (!this._navBound) {
    this._navBound = true;
    document.querySelectorAll('[data-page]').forEach(el => {
      el.addEventListener('click', (e) => {
        e.preventDefault();
        this.loadPage(el.dataset.page);
        // Fecha sidebar mobile + overlay
        document.getElementById('sidebar').classList.remove('open');
        const overlay = document.getElementById('sidebar-overlay');
        if (overlay) overlay.classList.remove('show');
        // Fecha menu overflow se aberto
        const moreMenu = document.getElementById('bottom-nav-more');
        if (moreMenu) moreMenu.remove();
      });
    });
    }
    } catch (e) { console.error('[APP] Erro no init:', e); }
  },

  // Páginas permitidas por perfil
  _paginasPermitidas: {
    mecanico: ['kanban', 'dashboard'],
    aux_mecanico: ['kanban', 'dashboard'],
    atendente: ['kanban', 'dashboard', 'fila', 'os', 'clientes', 'veiculos', 'agendamentos', 'servicos', 'pecas', 'contas', 'equipe'],
    aux_admin: ['kanban', 'dashboard', 'fila', 'os', 'clientes', 'veiculos', 'agendamentos', 'servicos', 'pecas', 'contas', 'equipe'],
    gerente: ['kanban', 'dashboard', 'fila', 'os', 'clientes', 'veiculos', 'agendamentos', 'servicos', 'pecas', 'financeiro', 'contas', 'comissao', 'crm', 'pesquisa', 'equipe', 'config'],
    dono: null, // null = tudo
  },

  loadPage(page) {
    // Trava por perfil (dono e super admin podem tudo)
    if (this.profile && this.profile.role !== 'dono' && !SUPER_ADMIN.isSuperAdmin) {
      const permitidas = this._paginasPermitidas[this.profile.role];
      if (permitidas && !permitidas.includes(page)) {
        page = 'kanban';
      }
    }

    // Esconde todas as sections
    document.querySelectorAll('.page-content').forEach(s => s.classList.add('hidden'));

    // Mostra a section da pagina
    const section = document.getElementById('page-' + page);
    if (section) {
      section.classList.remove('hidden');
      localStorage.setItem('rpmpro-page', page);
    }

    // Atualiza sidebar ativo
    document.querySelectorAll('[data-page]').forEach(el => {
      el.classList.toggle('active', el.dataset.page === page);
    });

    // Dispara evento de carregamento
    const event = new CustomEvent('pageLoad', { detail: { page } });
    document.dispatchEvent(event);
  },

  // Helpers
  formatMoney(val) {
    return (val || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  },

  formatDate(date) {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('pt-BR');
  },

  formatDateTime(date) {
    if (!date) return '-';
    return new Date(date).toLocaleString('pt-BR');
  },

  _setupBottomNav() {
    const nav = document.querySelector('.bottom-nav');
    if (!nav) return;
    const role = this.profile.role;

    // Define itens por perfil — otimizado pra ações mais frequentes
    const configs = {
      mecanico: [
        { page: 'kanban', icon: '🏗️', label: 'Pátio' },
        { page: 'os', icon: '🔧', label: 'OS' },
        { page: 'pecas', icon: '📦', label: 'Estoque' },
        { page: '_more', icon: '⋯', label: 'Mais' },
      ],
      atendente: [
        { page: 'kanban', icon: '🏗️', label: 'Pátio' },
        { page: 'fila', icon: '⏳', label: 'Fila' },
        { page: 'os', icon: '🔧', label: 'OS' },
        { page: 'clientes', icon: '👤', label: 'Clientes' },
        { page: '_more', icon: '⋯', label: 'Mais' },
      ],
      dono: [
        { page: 'kanban', icon: '🏗️', label: 'Pátio' },
        { page: 'os', icon: '🔧', label: 'OS' },
        { page: 'financeiro', icon: '💵', label: 'Financeiro' },
        { page: 'dashboard', icon: '📊', label: 'Dashboard' },
        { page: '_more', icon: '⋯', label: 'Mais' },
      ],
    };
    configs.gerente = configs.dono;

    const baseRole = this.profile._roleBase || role;
    const items = configs[baseRole] || configs.dono;

    // Itens extras pro menu overflow — exclui os que já estão na nav
    const navPages = new Set(items.map(i => i.page));
    const allPages = [
      { page: 'kanban', icon: '🏗️', label: 'Pátio' },
      { page: 'os', icon: '🔧', label: 'OS' },
      { page: 'fila', icon: '⏳', label: 'Fila' },
      { page: 'clientes', icon: '👤', label: 'Clientes' },
      { page: 'veiculos', icon: '🚗', label: 'Veículos' },
      { page: 'pecas', icon: '📦', label: 'Estoque' },
      { page: 'equipe', icon: '👥', label: 'Equipe' },
      { page: 'agendamentos', icon: '📅', label: 'Agendamentos' },
      { page: 'comissao', icon: '💰', label: 'Comissão' },
      { page: 'financeiro', icon: '💵', label: 'Financeiro' },
      { page: 'contas', icon: '💳', label: 'Contas' },
      { page: 'crm', icon: '📋', label: 'CRM' },
      { page: 'pesquisa', icon: '⭐', label: 'Satisfação' },
      { page: 'dashboard', icon: '📊', label: 'Dashboard' },
      { page: 'servicos', icon: '🛠️', label: 'Serviços' },
      { page: 'config', icon: '⚙️', label: 'Config' },
    ];
    const moreItems = allPages.filter(p => !navPages.has(p.page) && p.page !== '_more');

    nav.innerHTML = items.map(item => {
      if (item.page === '_more') {
        return `<a href="#" onclick="event.preventDefault(); APP._toggleMoreMenu()">
          <span class="icon">${item.icon}</span> ${item.label}
        </a>`;
      }
      return `<a href="#" data-page="${item.page}">
        <span class="icon">${item.icon}</span> ${item.label}
      </a>`;
    }).join('');

    // Guarda moreItems pra uso no toggle
    this._moreItems = moreItems;
  },

  _toggleMoreMenu() {
    let menu = document.getElementById('bottom-nav-more');
    if (menu) { menu.remove(); return; }

    menu = document.createElement('div');
    menu.id = 'bottom-nav-more';
    menu.className = 'bottom-nav-more';
    menu.innerHTML = (this._moreItems || []).map(item =>
      `<a href="#" data-page="${item.page}" onclick="event.preventDefault(); APP.loadPage('${item.page}'); document.getElementById('bottom-nav-more')?.remove();">
        <span class="icon">${item.icon}</span> ${item.label}
      </a>`
    ).join('');
    document.body.appendChild(menu);

    // Fecha ao clicar fora
    const fechar = (e) => {
      if (!menu.contains(e.target)) {
        menu.remove();
        document.removeEventListener('click', fechar);
      }
    };
    setTimeout(() => document.addEventListener('click', fechar), 10);
  },

  _setupSidebarGroups(isAdmin) {
    const labels = document.querySelectorAll('.sidebar-group-label');
    labels.forEach(label => {
      const group = label.nextElementSibling;
      if (!group) return;
      const texto = label.textContent.trim();

      if (isAdmin) {
        // Super admin: tudo fechado, só PLATAFORMA aberto
        if (texto !== 'PLATAFORMA') {
          label.classList.add('collapsed');
          group.classList.add('collapsed');
        }
      } else {
        // Clientes: só OFICINA aberto, resto fechado
        if (texto !== 'OFICINA') {
          label.classList.add('collapsed');
          group.classList.add('collapsed');
        }
      }
    });
  },

  _trialExpirado() {
    if (!this.oficina) return false;
    const plano = this.oficina.plano;
    // Planos pagos e beta nunca bloqueiam
    if (['essencial', 'profissional', 'rede', 'beta'].includes(plano)) return false;
    // Trial: verifica data
    if (plano === 'trial' && this.oficina.trial_ate) {
      const hoje = new Date().toISOString().split('T')[0];
      return this.oficina.trial_ate < hoje;
    }
    // Sem plano definido = bloqueia
    if (!plano) return true;
    return false;
  },

  _mostrarBloqueio() {
    document.querySelector('.main-content').innerHTML = `
      <div style="display:flex;align-items:center;justify-content:center;min-height:80vh;padding:24px;">
        <div style="text-align:center;max-width:480px;">
          <div style="font-size:64px;margin-bottom:16px;">⏰</div>
          <h2 style="font-size:24px;margin-bottom:12px;">Seu periodo de teste acabou</h2>
          <p style="color:var(--text-secondary);font-size:15px;margin-bottom:24px;">
            O trial de 7 dias da <strong>${esc(this.oficina.nome)}</strong> expirou em ${APP.formatDate(this.oficina.trial_ate)}.
            <br>Pra continuar usando o RPM Pro, escolha um plano.
          </p>
          <div style="display:flex;flex-direction:column;gap:12px;align-items:center;">
            <a href="https://wa.me/5587981456565?text=${encodeURIComponent('Oi! Meu trial do RPM Pro acabou. Quero ativar um plano pra oficina ' + (this.oficina.nome || ''))}" target="_blank" class="btn btn-primary" style="padding:14px 32px;font-size:16px;border-radius:10px;text-decoration:none;">Falar no WhatsApp pra ativar</a>
            <a href="landing.html" style="color:var(--text-secondary);font-size:13px;">Ver planos e precos</a>
          </div>
          <div style="margin-top:32px;padding-top:20px;border-top:1px solid var(--border);">
            <p style="font-size:13px;color:var(--text-muted);">Planos a partir de R$ 189/mes</p>
          </div>
        </div>
      </div>
    `;
    // Esconde bottom nav
    const nav = document.querySelector('.bottom-nav');
    if (nav) nav.style.display = 'none';
  },

  toast(msg, tipo = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${tipo}`;
    toast.textContent = msg;
    document.body.appendChild(toast);
    setTimeout(() => toast.classList.add('show'), 10);
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }
};
