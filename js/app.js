// RPM Pro — App Core
const APP = {
  profile: null,
  oficina: null,

  async init() {
    const user = await AUTH.requireAuth();
    if (!user) return;

    this.profile = await AUTH.getProfile();
    if (!this.profile) {
      await AUTH.logout();
      return;
    }
    this.oficina = this.profile.oficinas;

    // Atualiza nome da oficina no header
    const elNome = document.getElementById('oficina-nome');
    if (elNome) elNome.textContent = this.oficina.nome;

    const elUser = document.getElementById('user-nome');
    if (elUser) elUser.textContent = this.profile.nome;

    // Logo da oficina na sidebar
    if (this.oficina?.logo_url) {
      const logoEl = document.getElementById('sidebar-logo-img');
      if (logoEl) logoEl.innerHTML = `<img src="${this.oficina.logo_url}" style="max-height:32px;max-width:120px;object-fit:contain;">`;
    }

    // Verifica super admin
    const isAdmin = await SUPER_ADMIN.verificar();
    if (isAdmin) {
      document.querySelectorAll('.nav-super-admin').forEach(el => el.style.display = '');
    }

    // Verifica trial/plano (super admin ignora)
    if (!isAdmin && this._trialExpirado()) {
      this._mostrarBloqueio();
      return;
    }

    // Ajusta bottom nav por perfil
    this._setupBottomNav();

    // Sidebar: esconde itens restritos a dono/gerente
    if (!['dono', 'gerente'].includes(this.profile.role)) {
      document.querySelectorAll('.nav-dono-gerente').forEach(el => el.style.display = 'none');
    }

    // Sidebar: colapsa grupos conforme perfil
    this._setupSidebarGroups(isAdmin);

    // Carrega pagina salva ou pagina padrão do perfil
    const paginaPadrao = isAdmin ? 'admin' : 'kanban';
    this.loadPage(localStorage.getItem('rpmpro-page') || paginaPadrao);

    // Sidebar navigation
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
  },

  loadPage(page) {
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

    // Define itens por perfil
    const configs = {
      mecanico: [
        { page: 'kanban', icon: '🏗️', label: 'Patio' },
        { page: 'os', icon: '🔧', label: 'OS' },
        { page: 'equipe', icon: '👥', label: 'Equipe' },
      ],
      atendente: [
        { page: 'kanban', icon: '🏗️', label: 'Patio' },
        { page: 'os', icon: '🔧', label: 'OS' },
        { page: 'clientes', icon: '👤', label: 'Clientes' },
        { page: 'veiculos', icon: '🚗', label: 'Veiculos' },
      ],
      dono: [
        { page: 'kanban', icon: '🏗️', label: 'Patio' },
        { page: 'os', icon: '🔧', label: 'OS' },
        { page: 'clientes', icon: '👤', label: 'Clientes' },
        { page: 'pecas', icon: '📦', label: 'Estoque' },
        { page: '_more', icon: '⋯', label: 'Mais' },
      ],
    };
    configs.gerente = configs.dono;

    const items = configs[role] || configs.dono;

    // Itens extras pro menu overflow (dono/gerente)
    const moreItems = [
      { page: 'veiculos', icon: '🚗', label: 'Veiculos' },
      { page: 'equipe', icon: '👥', label: 'Equipe' },
      { page: 'comissao', icon: '💰', label: 'Comissao' },
      { page: 'financeiro', icon: '💵', label: 'Financeiro' },
      { page: 'contas', icon: '💳', label: 'Contas' },
      { page: 'crm', icon: '📋', label: 'CRM' },
      { page: 'agendamentos', icon: '📅', label: 'Agendamentos' },
      { page: 'pesquisa', icon: '⭐', label: 'Satisfacao' },
      { page: 'dashboard', icon: '📊', label: 'Dashboard' },
      { page: 'config', icon: '⚙️', label: 'Config' },
    ];

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
        // Super admin: tudo fechado, só ADMIN aberto
        if (texto !== 'ADMIN') {
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
