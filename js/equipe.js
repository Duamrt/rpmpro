// RPM Pro — Equipe
const EQUIPE = {
  async carregar() {
    const { data, error } = await db
      .from('profiles')
      .select('*')
      .eq('oficina_id', APP.profile.oficina_id)
      .order('nome');

    if (error) { APP.toast('Erro ao carregar equipe', 'error'); return; }
    this.render(data || []);
  },

  render(lista) {
    const container = document.getElementById('equipe-lista');
    if (!lista.length) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="icon">👥</div>
          <h3>Nenhum membro na equipe</h3>
          <p>Clique em "+ Novo Membro" para comecar</p>
        </div>`;
      return;
    }

    const roleLabel = { dono: 'Dono', gerente: 'Gerente', mecanico: 'Mecanico', atendente: 'Atendente', aux_mecanico: 'Aux. Mecanico', aux_admin: 'Aux. Administrativo' };

    const isAdmin = ['dono','gerente'].includes(APP.profile.role) || SUPER_ADMIN.isSuperAdmin;
    container.innerHTML = window.innerWidth <= 768 ? `
      <div class="mobile-card-list">
        ${lista.map(m => `
          <div class="mobile-card">
            <div class="mobile-card-header">
              <div>
                <div class="mobile-card-title">${esc(m.nome)}</div>
                <div class="mobile-card-subtitle">${roleLabel[m.role] || m.role}${m.comissao_percent ? ' · ' + m.comissao_percent + '% comissão' : ''}</div>
              </div>
              <span class="badge badge-${m.ativo ? 'pronto' : 'entregue'}">${m.ativo ? 'Ativo' : 'Inativo'}</span>
            </div>
            ${isAdmin ? `<div class="mobile-card-actions">
              <button class="btn btn-secondary btn-sm" onclick="EQUIPE.editar('${m.id}')">Editar</button>
              ${!m.senha_texto ? `<button class="btn btn-primary btn-sm" onclick="EQUIPE.criarLogin('${m.id}','${esc(m.nome)}','${esc(m.email || '')}')">Criar login</button>` : `<button class="btn btn-secondary btn-sm" onclick="EQUIPE.gerenciarLogin('${m.id}','${esc(m.nome)}','${esc(m.email)}','${esc(m.senha_texto || '')}')">Login</button>`}
            </div>` : ''}
          </div>
        `).join('')}
      </div>` : `
      <table class="data-table">
        <thead>
          <tr>
            <th>Nome</th>
            <th>Funcao</th>
            <th>Comissao</th>
            <th>Status</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          ${lista.map(m => `
            <tr>
              <td>
                <strong>${esc(m.nome)}</strong>
                <br><span style="font-size:12px;color:var(--text-secondary)">${esc(m.email || '')}</span>
              </td>
              <td>${roleLabel[m.role] || m.role}</td>
              <td>${m.comissao_percent ? m.comissao_percent + '%' : '-'}</td>
              <td><span class="badge badge-${m.ativo ? 'pronto' : 'entregue'}">${m.ativo ? 'Ativo' : 'Inativo'}</span></td>
              <td>
                ${isAdmin ? `<button class="btn btn-secondary btn-sm" onclick="EQUIPE.editar('${m.id}')">Editar</button>` : ''}
                ${isAdmin && !m.senha_texto ? `<button class="btn btn-primary btn-sm" onclick="EQUIPE.criarLogin('${m.id}','${esc(m.nome)}','${esc(m.email || '')}')">Criar login</button>` : ''}
                ${isAdmin && m.senha_texto ? `<button class="btn btn-secondary btn-sm" onclick="EQUIPE.gerenciarLogin('${m.id}','${esc(m.nome)}','${esc(m.email)}','${esc(m.senha_texto || '')}')">Login</button>` : ''}
                ${isAdmin && m.id !== APP.profile.id && m.role !== 'dono' ? `<button class="btn btn-danger btn-sm" onclick="EQUIPE.excluir('${m.id}','${esc(m.nome)}')">Excluir</button>` : ''}
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>`;
  },

  abrirModal(dados = {}) {
    openModal(`
      <div class="modal-header">
        <h3>${dados.id ? 'Editar Membro' : 'Novo Membro'}</h3>
        <button class="modal-close" onclick="closeModal()">&times;</button>
      </div>
      <div class="modal-body">
        <form id="form-equipe" onsubmit="EQUIPE.salvar(event, '${dados.id || ''}')">
          <div class="form-group">
            <label>Nome *</label>
            <input type="text" class="form-control" id="eq-nome" required value="${esc(dados.nome || '')}">
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
            <div class="form-group">
              <label>Email</label>
              <input type="email" class="form-control" id="eq-email" value="${esc(dados.email || '')}">
            </div>
            <div class="form-group">
              <label>Telefone</label>
              <input type="text" class="form-control" id="eq-telefone" value="${esc(dados.telefone || '')}">
            </div>
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
            <div class="form-group">
              <label>Funcao</label>
              <select class="form-control" id="eq-role">
                <option value="mecanico" ${dados.role === 'mecanico' || !dados.role ? 'selected' : ''}>Mecanico</option>
                <option value="aux_mecanico" ${dados.role === 'aux_mecanico' ? 'selected' : ''}>Aux. Mecanico</option>
                <option value="atendente" ${dados.role === 'atendente' ? 'selected' : ''}>Atendente</option>
                <option value="aux_admin" ${dados.role === 'aux_admin' ? 'selected' : ''}>Aux. Administrativo</option>
                <option value="gerente" ${dados.role === 'gerente' ? 'selected' : ''}>Gerente</option>
                <option value="dono" ${dados.role === 'dono' ? 'selected' : ''}>Dono</option>
              </select>
            </div>
            <div class="form-group">
              <label>Comissao (%)</label>
              <input type="number" class="form-control" id="eq-comissao" value="${dados.comissao_percent || APP.oficina?.comissao_padrao || 0}" min="0" max="100" step="0.5">
            </div>
          </div>
          <div class="form-group">
            <label>Status</label>
            <select class="form-control" id="eq-ativo">
              <option value="true" ${dados.ativo !== false ? 'selected' : ''}>Ativo</option>
              <option value="false" ${dados.ativo === false ? 'selected' : ''}>Inativo</option>
            </select>
          </div>
          <div class="modal-footer" style="padding:16px 0 0;border:0;">
            <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancelar</button>
            <button type="submit" class="btn btn-primary">Salvar</button>
          </div>
        </form>
      </div>
    `);
  },

  async salvar(e, id) {
    e.preventDefault();
    const dados = {
      nome: document.getElementById('eq-nome').value.trim(),
      email: document.getElementById('eq-email').value.trim(),
      telefone: document.getElementById('eq-telefone').value.trim(),
      role: document.getElementById('eq-role').value,
      comissao_percent: parseFloat(document.getElementById('eq-comissao').value) || 0,
      ativo: document.getElementById('eq-ativo').value === 'true'
    };

    if (id) {
      // Edita membro existente
      const { error } = await db.from('profiles').update(dados).eq('id', id).eq('oficina_id', APP.profile.oficina_id);
      if (error) { APP.toast('Erro: ' + error.message, 'error'); return; }
    } else {
      // Novo membro — usa RPC pra criar sem FK do auth
      dados.oficina_id = APP.profile.oficina_id;
      const { error } = await db.rpc('criar_membro_equipe', {
        p_oficina_id: dados.oficina_id,
        p_nome: dados.nome,
        p_email: dados.email || null,
        p_telefone: dados.telefone || null,
        p_role: dados.role,
        p_comissao: dados.comissao_percent,
        p_ativo: dados.ativo
      });
      if (error) { APP.toast('Erro: ' + error.message, 'error'); return; }
    }

    closeModal();
    APP.toast(id ? 'Membro atualizado' : 'Membro cadastrado');
    this.carregar();
  },

  async editar(id) {
    const { data } = await db.from('profiles').select('*').eq('id', id).single();
    if (data) this.abrirModal(data);
  },

  criarLogin(profileId, nome, emailAtual) {
    openModal(`
      <div class="modal-header">
        <h3>Criar login — ${esc(nome)}</h3>
        <button class="modal-close" onclick="closeModal()">&times;</button>
      </div>
      <div class="modal-body">
        <form onsubmit="EQUIPE.salvarLogin(event, '${profileId}')">
          <div class="form-group">
            <label>Email *</label>
            <div style="display:flex;align-items:center;gap:0;">
              <input type="text" class="form-control" id="login-email-user" required placeholder="nome" value="${emailAtual ? esc(emailAtual.split('@')[0]) : esc(nome.toLowerCase().normalize('NFD').replace(/[\\u0300-\\u036f]/g,'').replace(/\\s+/g,'.'))}" style="border-radius:var(--radius) 0 0 var(--radius);border-right:0;">
              <span style="background:var(--bg-input);border:1px solid var(--border);padding:8px 12px;font-size:13px;color:var(--text-secondary);white-space:nowrap;border-radius:0 var(--radius) var(--radius) 0;">@rpmpro.com.br</span>
            </div>
          </div>
          <div class="form-group">
            <label>Senha *</label>
            <input type="text" class="form-control" id="login-senha" required minlength="6" value="" placeholder="Minimo 6 caracteres">
          </div>
          <div style="background:var(--bg-input);padding:10px 12px;border-radius:var(--radius);margin-bottom:16px;font-size:12px;color:var(--text-secondary);">
            Anote a senha! Voce pode resetar depois pelo Super Admin, mas o membro vai precisar dela pra logar.
          </div>
          <div class="modal-footer" style="padding:16px 0 0;border:0;">
            <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancelar</button>
            <button type="submit" class="btn btn-primary">Criar login</button>
          </div>
        </form>
      </div>
    `);
  },

  async salvarLogin(e, profileId) {
    e.preventDefault();
    const emailUser = document.getElementById('login-email-user').value.trim().toLowerCase().replace(/\s+/g, '.');
    if (!emailUser) { APP.toast('Preencha o nome de usuario', 'error'); return; }
    const email = emailUser + '@rpmpro.com.br';
    const senha = document.getElementById('login-senha').value;

    if (senha.length < 6) { APP.toast('Senha precisa ter pelo menos 6 caracteres', 'error'); return; }

    // Client temporário pra não deslogar o dono
    const tempDb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { persistSession: false }
    });

    // Cria auth user pelo fluxo oficial do Supabase
    const { data: authData, error: authError } = await tempDb.auth.signUp({
      email, password: senha,
      options: { data: { created_by_team: true } }
    });

    if (authError) { APP.toast('Erro ao criar login: ' + authError.message, 'error'); return; }

    // Supabase retorna user sem identities se email já existe
    if (!authData.user || !authData.user.identities || authData.user.identities.length === 0) {
      APP.toast('Esse email ja esta cadastrado no sistema', 'error');
      return;
    }

    const userId = authData.user.id;

    // Confirma email automaticamente via RPC
    const { data, error } = await db.rpc('vincular_login_membro', {
      p_profile_id: profileId,
      p_user_id: userId,
      p_email: email,
      p_senha: senha
    });

    if (error) { APP.toast('Erro ao vincular: ' + error.message, 'error'); return; }
    if (data && !data.ok) { APP.toast(data.erro, 'error'); return; }

    closeModal();
    APP.toast('Login criado! Email: ' + email);
    this.carregar();
  },

  gerenciarLogin(profileId, nome, email, senha) {
    openModal(`
      <div class="modal-header">
        <h3>Login — ${esc(nome)}</h3>
        <button class="modal-close" onclick="closeModal()">&times;</button>
      </div>
      <div class="modal-body">
        <div class="form-group">
          <label>Email</label>
          <input type="text" class="form-control" value="${esc(email)}" readonly style="opacity:.7;">
        </div>
        <div class="form-group">
          <label>Senha atual</label>
          <div style="display:flex;gap:8px;align-items:center;">
            <input type="text" class="form-control" value="${esc(senha || 'Nao registrada')}" readonly style="opacity:.7;flex:1;">
          </div>
        </div>
        <hr style="border-color:var(--border);margin:16px 0;">
        <div class="form-group">
          <label>Nova senha</label>
          <input type="text" class="form-control" id="nova-senha" placeholder="Minimo 6 caracteres" minlength="6">
        </div>
        <div class="modal-footer" style="padding:16px 0 0;border:0;display:flex;gap:8px;">
          <button type="button" class="btn btn-danger" onclick="EQUIPE.removerLogin('${profileId}','${esc(nome)}')">Remover login</button>
          <div style="flex:1;"></div>
          <button type="button" class="btn btn-secondary" onclick="closeModal()">Fechar</button>
          <button type="button" class="btn btn-primary" onclick="EQUIPE.salvarNovaSenha('${profileId}')">Redefinir senha</button>
        </div>
      </div>
    `);
  },

  async salvarNovaSenha(profileId) {
    const senha = document.getElementById('nova-senha').value;
    if (!senha || senha.length < 6) { APP.toast('Senha precisa ter pelo menos 6 caracteres', 'error'); return; }

    const { data, error } = await db.rpc('redefinir_senha_membro', { p_profile_id: profileId, p_nova_senha: senha });
    if (error) { APP.toast('Erro: ' + error.message, 'error'); return; }
    if (data && !data.ok) { APP.toast(data.erro, 'error'); return; }

    closeModal();
    APP.toast('Senha redefinida!');
    this.carregar();
  },

  async removerLogin(profileId, nome) {
    if (!confirm(`Remover login de ${nome}? Ele nao vai mais conseguir acessar o sistema.`)) return;

    const { data, error } = await db.rpc('remover_login_membro', { p_profile_id: profileId });
    if (error) { APP.toast('Erro: ' + error.message, 'error'); return; }
    if (data && !data.ok) { APP.toast(data.erro, 'error'); return; }

    closeModal();
    APP.toast('Login removido');
    this.carregar();
  },

  async excluir(id, nome) {
    if (!confirm(`Excluir ${nome} da equipe? Essa acao nao pode ser desfeita.`)) return;

    const { error } = await db.from('profiles').delete().eq('id', id).eq('oficina_id', APP.profile.oficina_id);
    if (error) { APP.toast('Erro: ' + error.message, 'error'); return; }
    APP.toast(nome + ' removido da equipe');
    this.carregar();
  }
};

document.addEventListener('pageLoad', (e) => {
  if (e.detail.page === 'equipe') EQUIPE.carregar();
});
