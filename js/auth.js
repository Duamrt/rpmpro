// RPM Pro — Autenticação
const AUTH = {
  async login(email, senha) {
    const { data, error } = await db.auth.signInWithPassword({
      email, password: senha
    });
    if (error) throw error;
    return data;
  },

  async cadastrar(email, senha, nomeOficina, nomeUsuario) {
    // 1. Cria usuario no auth
    const { data: authData, error: authError } = await db.auth.signUp({
      email, password: senha
    });
    if (authError) throw authError;

    // Se nao tem sessao (confirmacao de email ligada), faz login
    if (!authData.session) {
      const { data: loginData, error: loginError } = await db.auth.signInWithPassword({
        email, password: senha
      });
      if (loginError) throw new Error('Conta criada mas nao conseguiu logar. Tente fazer login.');
    }

    const userId = authData.user.id;

    // 2. Cria oficina + profile atomicamente via RPC
    const { data: result, error: rpcError } = await db.rpc('criar_oficina_e_dono', {
      p_user_id: userId,
      p_email: email,
      p_nome_oficina: nomeOficina,
      p_nome_usuario: nomeUsuario
    });
    if (rpcError) throw rpcError;

    return { user: authData.user, oficina: result };
  },

  async logout() {
    await db.auth.signOut();
    window.location.href = 'login.html';
  },

  async getUser() {
    const { data: { session } } = await db.auth.getSession();
    if (!session) return null;
    return session.user;
  },

  async getProfile() {
    const user = await this.getUser();
    if (!user) return null;
    const { data } = await db
      .from('profiles')
      .select('*, oficinas(*)')
      .eq('id', user.id)
      .single();
    return data;
  },

  // Redireciona pra login se nao estiver autenticado
  async requireAuth() {
    const user = await this.getUser();
    if (!user) {
      // Evita loop: so redireciona se NAO estiver no login
      if (!window.location.pathname.includes('login')) {
        window.location.href = 'login.html';
      }
      return null;
    }
    return user;
  }
};
