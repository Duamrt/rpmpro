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

    // Carrega pagina salva ou dashboard
    this.loadPage(localStorage.getItem('rpmpro-page') || 'dashboard');

    // Sidebar navigation
    document.querySelectorAll('[data-page]').forEach(el => {
      el.addEventListener('click', (e) => {
        e.preventDefault();
        this.loadPage(el.dataset.page);
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
