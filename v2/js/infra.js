// RPM Pro — Infra: Permissões granulares por módulo e seção
(function(){const v=(document.currentScript?.src||'').match(/\?v=(\d+)/)?.[1]||'?';console.log('%c RPM Pro %c v'+v+' ','background:#1e3a5f;color:#60a5fa;font-weight:700;padding:3px 7px;border-radius:3px 0 0 3px','background:#60a5fa;color:#1e3a5f;font-weight:700;padding:3px 7px;border-radius:0 3px 3px 0');})();
const INFRA = {
  _perms: null,

  // Mapeia página → chave de permissão (bloqueio de rota inteira)
  PAGE_MODULE: {
    'folha-v2.html':          'folha',
    'comissao-v2.html':       'comissao',
    'config-v2.html':         'config',
    'crm-v2.html':            'crm',
    'satisfacao-v2.html':     'crm',
    'dashboard-v2.html':      'dashboard',
    'produtividade-v2.html':  'produtividade',
    'fornecedores-v2.html':   'fornecedores',
    'notas-fiscais-v2.html':  'fornecedores',
    'historico-nf-v2.html':   'fornecedores',
  },

  // Padrões para quem não tem permissions configurado
  DEFAULTS: {
    fornecedores:    false,
    folha:           false,
    comissao:        false,
    fin_resumo:      false,
    config:          false,
    crm:             false,
    dashboard:       false,
    produtividade:   false,
    fin_fechamento:  false,
    fin_caixa:       false,
    fin_lucro_pecas: false,
    fin_dre:         false,
    equipe_edit:     false,
    config_full:     false,
  },

  // Verifica se usuário pode ver determinada chave
  podeVer(key) {
    if (!this._perms) return true; // dono/gerente — sem restrição
    return this._perms[key] !== false;
  },

  _trialExpirado(oficina) {
    if (!oficina) return false;
    const plano = oficina.plano;
    if (['essencial','profissional','rede','beta'].includes(plano)) return false;
    if (plano === 'trial' && oficina.trial_ate) {
      const hoje = new Date().toISOString().split('T')[0];
      return oficina.trial_ate < hoje;
    }
    return !plano;
  },

  _mostrarBloqueio(oficina) {
    const nome = oficina?.nome || 'Sua Oficina';
    const fimRaw = oficina?.trial_ate || '';
    const fimFmt = fimRaw
      ? new Date(fimRaw + 'T12:00:00').toLocaleDateString('pt-BR')
      : '';
    document.querySelectorAll('.sidebar,.bottom-nav').forEach(el => el.style.display = 'none');
    const ov = document.createElement('div');
    ov.id = 'rpm-trial-block';
    ov.style.cssText = 'position:fixed;inset:0;z-index:99999;background:var(--bg,#09090B);display:flex;align-items:center;justify-content:center;padding:24px;font-family:var(--body,"Space Grotesk",sans-serif)';
    ov.innerHTML = `<div style="width:100%;max-width:440px;">
      <div style="text-align:center;margin-bottom:32px;">
        <div style="font-family:var(--head,'Barlow Condensed',sans-serif);font-size:28px;font-weight:900;text-transform:uppercase;letter-spacing:1px;color:var(--w,#F0F0F2);">RPM<span style="color:var(--amber,#E8930C);">PRO</span></div>
        <div style="font-family:var(--mono,'JetBrains Mono',monospace);font-size:10px;color:var(--w3,rgba(255,255,255,.32));letter-spacing:2px;margin-top:2px;">GESTÃO DE OFICINAS</div>
      </div>
      <div style="background:var(--sf,#111114);border:1px solid rgba(255,255,255,.08);border-radius:4px;overflow:hidden;">
        <div style="background:rgba(255,59,48,.12);border-bottom:1px solid rgba(255,59,48,.2);padding:10px 20px;display:flex;align-items:center;gap:8px;">
          <div style="width:6px;height:6px;border-radius:50%;background:#FF3B30;flex-shrink:0;box-shadow:0 0 8px #FF3B30;"></div>
          <span style="font-family:var(--head,'Barlow Condensed',sans-serif);font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:2px;color:#FF3B30;">Acesso Suspenso</span>
        </div>
        <div style="padding:32px 28px;">
          <div style="margin-bottom:24px;">
            <div style="font-family:var(--head,'Barlow Condensed',sans-serif);font-size:22px;font-weight:900;text-transform:uppercase;letter-spacing:.5px;color:var(--w,#F0F0F2);margin-bottom:4px;">${nome}</div>
            <div style="display:flex;align-items:center;gap:16px;">
              <span style="font-family:var(--mono,'JetBrains Mono',monospace);font-size:11px;color:var(--w3,rgba(255,255,255,.32));">TRIAL</span>
              ${fimFmt ? `<span style="font-family:var(--mono,'JetBrains Mono',monospace);font-size:11px;color:#FF3B30;">EXPIROU EM ${fimFmt}</span>` : ''}
            </div>
          </div>
          <div style="height:1px;background:rgba(255,255,255,.08);margin-bottom:24px;"></div>
          <p style="font-size:14px;color:var(--w2,rgba(255,255,255,.6));line-height:1.65;margin-bottom:28px;">Seu período de teste gratuito encerrou. Para reativar o acesso e continuar usando o RPM Pro, entre em contato e escolha um plano.</p>
          <a href="https://wa.me/5587981456565" target="_blank" style="display:flex;align-items:center;justify-content:center;gap:10px;width:100%;background:var(--amber,#E8930C);color:#000;font-family:var(--head,'Barlow Condensed',sans-serif);font-size:16px;font-weight:800;text-transform:uppercase;letter-spacing:1px;padding:14px 20px;border-radius:3px;text-decoration:none;margin-bottom:10px;">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.124.558 4.115 1.535 5.836L.057 23.215a.75.75 0 0 0 .93.927l5.487-1.461A11.943 11.943 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.891 0-3.667-.5-5.207-1.377l-.374-.213-3.876 1.032 1.056-3.773-.228-.37A9.944 9.944 0 0 1 2 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/></svg>
            Falar no WhatsApp
          </a>
          <a href="landing.html" style="display:flex;align-items:center;justify-content:center;width:100%;background:none;color:var(--w3,rgba(255,255,255,.32));font-size:13px;padding:10px;border-radius:3px;text-decoration:none;border:1px solid rgba(255,255,255,.14);">Ver planos e preços</a>
        </div>
        <div style="background:var(--sf2,#18181C);border-top:1px solid rgba(255,255,255,.08);padding:14px 28px;display:flex;align-items:center;justify-content:space-between;">
          <span style="font-family:var(--mono,'JetBrains Mono',monospace);font-size:11px;color:var(--w4,rgba(255,255,255,.14));">A partir de R$ 189/mês</span>
          <span style="font-family:var(--mono,'JetBrains Mono',monospace);font-size:11px;color:var(--w4,rgba(255,255,255,.14));">(87) 9 8145-6565</span>
        </div>
      </div>
    </div>`;
    document.body.appendChild(ov);
    document.addEventListener('keydown', e => { if (e.key === 'Escape') e.stopImmediatePropagation(); }, true);
  },

  checkPermissions(perfil) {
    if (!perfil) return;
    // Bloquear trial expirado (super admin DM Stack nunca é bloqueado)
    const isSuperAdmin = perfil.oficina_id === 'aaaa0001-0000-0000-0000-000000000001';
    if (!isSuperAdmin && this._trialExpirado(perfil.oficinas)) {
      this._mostrarBloqueio(perfil.oficinas);
      return;
    }
    // Dono nunca é bloqueado por permissões
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
