// RPM Pro — Super Admin (Painel de Oficinas)
const SUPER_ADMIN = {
  isSuperAdmin: false,

  async verificar() {
    const { data } = await db.rpc('is_platform_admin');
    this.isSuperAdmin = !!data;
    return this.isSuperAdmin;
  },

  async carregar() {
    const container = document.getElementById('admin-content');
    if (!container) return;

    // Stats globais
    const [oficinasRes, usersRes, osRes] = await Promise.all([
      db.from('oficinas').select('id, nome, plano, trial_ate, ativo, cidade, estado, cnpj, created_at').order('created_at', { ascending: false }),
      db.from('profiles').select('id, oficina_id'),
      db.from('ordens_servico').select('id, oficina_id, status')
    ]);

    const oficinas = oficinasRes.data || [];
    const users = usersRes.data || [];
    const ordens = osRes.data || [];

    const totalOficinas = oficinas.length;
    const totalUsers = users.length;
    const totalOS = ordens.length;
    const osAbertas = ordens.filter(o => !['entregue', 'cancelada'].includes(o.status)).length;

    container.innerHTML = `
      <!-- KPIs -->
      <div class="kpi-grid" style="margin-bottom:20px;">
        <div class="kpi-card">
          <div class="label">Oficinas</div>
          <div class="value primary">${totalOficinas}</div>
        </div>
        <div class="kpi-card">
          <div class="label">Usuarios</div>
          <div class="value">${totalUsers}</div>
        </div>
        <div class="kpi-card">
          <div class="label">OS Total</div>
          <div class="value">${totalOS}</div>
        </div>
        <div class="kpi-card">
          <div class="label">OS Abertas</div>
          <div class="value warning">${osAbertas}</div>
        </div>
      </div>

      <!-- Lista de oficinas -->
      <div style="background:var(--bg-card);border:1px solid var(--border);border-radius:var(--radius-lg);overflow:hidden;">
        <div style="padding:16px 20px;border-bottom:1px solid var(--border);display:flex;justify-content:space-between;align-items:center;">
          <h3 style="font-size:15px;">Oficinas cadastradas</h3>
        </div>
        <table class="data-table">
          <thead>
            <tr>
              <th>Oficina</th>
              <th>Plano</th>
              <th>Trial ate</th>
              <th>Usuarios</th>
              <th>OS</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            ${oficinas.map(o => {
              const qtdUsers = users.filter(u => u.oficina_id === o.id).length;
              const qtdOS = ordens.filter(os => os.oficina_id === o.id).length;
              return `
              <tr>
                <td>
                  <strong>${esc(o.nome)}</strong>
                  ${o.cidade ? '<br><span style="font-size:11px;color:var(--text-secondary);">' + esc(o.cidade) + (o.estado ? '/' + esc(o.estado) : '') + '</span>' : ''}
                </td>
                <td><span class="badge badge-${o.plano === 'beta' ? 'pronto' : 'orcamento'}">${esc(o.plano)}</span></td>
                <td style="font-size:13px;">${o.trial_ate ? APP.formatDate(o.trial_ate) : '-'}</td>
                <td>${qtdUsers}</td>
                <td>${qtdOS}</td>
                <td style="display:flex;gap:4px;flex-wrap:nowrap;">
                  <button class="btn btn-primary btn-sm" onclick="SUPER_ADMIN.acessarOficina('${o.id}','${esc(o.nome)}')">Acessar</button>
                  <button class="btn btn-secondary btn-sm" onclick="SUPER_ADMIN.editarPlano('${o.id}','${esc(o.nome)}','${o.plano || 'trial'}','${o.trial_ate || ''}')">Plano</button>
                </td>
              </tr>`;
            }).join('')}
          </tbody>
        </table>
      </div>
    `;
  },

  async acessarOficina(oficinaId, nome) {
    // Troca o contexto do APP pra essa oficina
    APP.profile.oficina_id = oficinaId;
    APP.oficina = { id: oficinaId, nome };

    // Busca dados completos da oficina
    const { data: oficina } = await db.from('oficinas').select('*').eq('id', oficinaId).single();
    if (oficina) APP.oficina = oficina;

    // Atualiza header
    const elNome = document.getElementById('oficina-nome');
    if (elNome) elNome.textContent = oficina?.nome || nome;

    // Marca que tá no modo admin acessando outra oficina
    this._oficinaOriginal = this._oficinaOriginal || APP.profile.oficina_id;
    this._acessandoOutra = true;

    // Mostra badge de admin
    let badge = document.getElementById('admin-badge');
    if (!badge) {
      badge = document.createElement('div');
      badge.id = 'admin-badge';
      badge.style.cssText = 'position:fixed;top:8px;right:8px;background:var(--primary);color:#fff;padding:6px 14px;border-radius:20px;font-size:12px;font-weight:700;z-index:999;cursor:pointer;';
      badge.onclick = () => this.voltarAdmin();
      document.body.appendChild(badge);
    }
    badge.textContent = '🔑 Admin → ' + esc(oficina?.nome || nome) + ' (clique pra voltar)';

    APP.toast('Acessando: ' + (oficina?.nome || nome));
    APP.loadPage('kanban');
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
              ${['trial','essencial','profissional','rede','beta'].map(p => `<option value="${p}" ${planoAtual === p ? 'selected' : ''}>${p.charAt(0).toUpperCase() + p.slice(1)}</option>`).join('')}
            </select>
          </div>
          <div class="form-group">
            <label>Trial/Validade ate (deixe vazio pra planos pagos sem vencimento)</label>
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
    this.carregar();
  },

  voltarAdmin() {
    // Restaura oficina original do admin
    if (this._oficinaOriginal) {
      APP.profile.oficina_id = this._oficinaOriginal;
    }
    this._acessandoOutra = false;

    // Remove badge
    const badge = document.getElementById('admin-badge');
    if (badge) badge.remove();

    // Restaura nome
    const elNome = document.getElementById('oficina-nome');
    if (elNome) elNome.textContent = 'RPM Pro Admin';

    APP.loadPage('admin');
    APP.toast('Voltou pro painel admin');
  }
};

document.addEventListener('pageLoad', (e) => {
  if (e.detail.page === 'admin') SUPER_ADMIN.carregar();
});
