// RPM Pro — Autenticação
const AUTH = {
  async login(email, senha) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email, password: senha
    });
    if (error) throw error;
    return data;
  },

  async cadastrar(email, senha, nomeOficina, nomeUsuario) {
    // 1. Cria usuario no auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email, password: senha
    });
    if (authError) throw authError;

    const userId = authData.user.id;

    // 2. Cria oficina
    const { data: oficina, error: ofError } = await supabase
      .from('oficinas')
      .insert({
        nome: nomeOficina,
        plano: 'beta',
        trial_ate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      })
      .select()
      .single();
    if (ofError) throw ofError;

    // 3. Cria profile do dono
    const { error: pfError } = await supabase
      .from('profiles')
      .insert({
        id: userId,
        oficina_id: oficina.id,
        nome: nomeUsuario,
        email: email,
        role: 'dono'
      });
    if (pfError) throw pfError;

    return { user: authData.user, oficina };
  },

  async logout() {
    await supabase.auth.signOut();
    window.location.href = 'login.html';
  },

  async getUser() {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  },

  async getProfile() {
    const user = await this.getUser();
    if (!user) return null;
    const { data } = await supabase
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
      window.location.href = 'login.html';
      return null;
    }
    return user;
  }
};
