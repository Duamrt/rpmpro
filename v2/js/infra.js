// RPM Pro — Infra: Permissões granulares por módulo
const INFRA = {

  // Mapeia página → chave de permissão
  PAGE_MODULE: {
    'financeiro-v2.html': 'financeiro',
    'comissao-v2.html':   'financeiro',
    'folha-v2.html':      'financeiro',
    'catalogo-v2.html':   'estoque',
    'config-v2.html':     'config',
    'equipe-v2.html':     'equipe',
    'produtividade-v2.html': 'equipe',
    'crm-v2.html':        'crm',
    'satisfacao-v2.html': 'crm',
  },

  // Permissões padrão quando permissions == null
  DEFAULTS: {
    financeiro: false,
    estoque:    true,
    config:     false,
    equipe:     false,
    crm:        false,
  },

  checkPermissions(perfil) {
    if (!perfil) return;
    // Dono e gerente nunca são bloqueados
    if (['dono', 'gerente'].includes(perfil.role)) return;

    const perms = Object.assign({}, this.DEFAULTS, perfil.permissions || {});

    // Proteção de rota: redireciona se a página atual não tiver permissão
    const page = window.location.pathname.split('/').pop() || '';
    const pageModule = this.PAGE_MODULE[page];
    if (pageModule && perms[pageModule] === false) {
      window.location.replace('kanban-v2.html');
      return;
    }

    // Aguarda DOM estar pronto antes de esconder itens da sidebar
    const applyHide = () => {
      document.querySelectorAll('.sidebar-nav a[href]').forEach(a => {
        const href = (a.getAttribute('href') || '').split('/').pop().split('?')[0];
        const mod = this.PAGE_MODULE[href];
        if (mod && perms[mod] === false) {
          a.style.display = 'none';
        }
      });

      // Oculta seção da sidebar se todos os itens da seção estiverem ocultos
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
