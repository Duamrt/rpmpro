// RPM Pro — Infra: Permissões granulares por módulo e seção
const INFRA = {
  _perms: null,

  // Mapeia página → chave de permissão (bloqueio de rota inteira)
  PAGE_MODULE: {
    'folha-v2.html':      'folha',
    'comissao-v2.html':   'comissao',
    'config-v2.html':     'config',
    'crm-v2.html':        'crm',
    'satisfacao-v2.html': 'crm',
  },

  // Padrões para quem não tem permissions configurado
  DEFAULTS: {
    folha:      false,
    comissao:   false,
    fin_resumo: false,
    config:     false,
    crm:        false,
  },

  // Verifica se usuário pode ver determinada chave
  podeVer(key) {
    if (!this._perms) return true; // dono/gerente — sem restrição
    return this._perms[key] !== false;
  },

  checkPermissions(perfil) {
    if (!perfil) return;
    // Dono nunca é bloqueado
    // Gerente só é bloqueado se tiver permissions configurado explicitamente
    if (perfil.role === 'dono') return;
    if (perfil.role === 'gerente' && !perfil.permissions) return;

    this._perms = Object.assign({}, this.DEFAULTS, perfil.permissions || {});

    // Proteção de rota: redireciona se a página atual não tiver permissão
    const page = window.location.pathname.split('/').pop() || '';
    const pageModule = this.PAGE_MODULE[page];
    if (pageModule && !this.podeVer(pageModule)) {
      window.location.replace('kanban-v2.html');
      return;
    }

    // Oculta links da sidebar sem permissão
    const applyHide = () => {
      document.querySelectorAll('.sidebar-nav a[href]').forEach(a => {
        const href = (a.getAttribute('href') || '').split('/').pop().split('?')[0];
        const mod = this.PAGE_MODULE[href];
        if (mod && !this.podeVer(mod)) {
          a.style.display = 'none';
        }
      });

      // Oculta seção da sidebar se todos os itens estiverem ocultos
      document.querySelectorAll('.nav-section').forEach(section => {
        let next = section.nextElementSibling;
        let algumVisivel = false;
        while (next && !next.classList.contains('nav-section')) {
          if (next.tagName === 'A' && next.style.display !== 'none') {
            algumVisivel = true;
            break;
          }
          next = next.nextElementSibling;
        }
        if (!algumVisivel) section.style.display = 'none';
      });
    };

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', applyHide);
    } else {
      applyHide();
    }
  }
};
