// RPM Pro — Configurações da Oficina
const CONFIG = {
  async carregar() {
    const container = document.getElementById('config-content');

    // Busca dados atuais da oficina
    const { data: oficina } = await db
      .from('oficinas')
      .select('*')
      .eq('id', APP.profile.oficina_id)
      .single();

    if (!oficina) { container.innerHTML = '<div class="empty-state"><h3>Erro ao carregar</h3></div>'; return; }

    container.innerHTML = `
      <div style="max-width:600px;">
        <!-- DADOS DA OFICINA -->
        <div style="background:var(--bg-card);border:1px solid var(--border);border-radius:var(--radius-lg);padding:24px;margin-bottom:20px;">
          <h3 style="font-size:16px;margin-bottom:16px;">Dados da Oficina</h3>
          <form id="form-config-dados" onsubmit="CONFIG.salvarDados(event)">
            <div class="form-group">
              <label>Nome da oficina</label>
              <input type="text" class="form-control" id="cfg-nome" value="${esc(oficina.nome || '')}">
            </div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
              <div class="form-group">
                <label>CNPJ</label>
                <input type="text" class="form-control" id="cfg-cnpj" value="${esc(oficina.cnpj || '')}">
              </div>
              <div class="form-group">
                <label>Telefone</label>
                <input type="text" class="form-control" id="cfg-telefone" value="${esc(oficina.telefone || '')}">
              </div>
            </div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
              <div class="form-group">
                <label>WhatsApp</label>
                <input type="text" class="form-control" id="cfg-whatsapp" value="${esc(oficina.whatsapp || '')}">
              </div>
              <div class="form-group">
                <label>Email</label>
                <input type="email" class="form-control" id="cfg-email" value="${esc(oficina.email || '')}">
              </div>
            </div>
            <div class="form-group">
              <label>Endereco</label>
              <input type="text" class="form-control" id="cfg-endereco" value="${esc(oficina.endereco || '')}">
            </div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
              <div class="form-group">
                <label>Cidade</label>
                <input type="text" class="form-control" id="cfg-cidade" value="${esc(oficina.cidade || '')}">
              </div>
              <div class="form-group">
                <label>Estado</label>
                <input type="text" class="form-control" id="cfg-estado" value="${esc(oficina.estado || '')}" maxlength="2" style="text-transform:uppercase">
              </div>
            </div>
            <button type="submit" class="btn btn-primary" style="margin-top:8px;">Salvar dados</button>
          </form>
        </div>

        <!-- VALORES E COMISSAO -->
        <div style="background:var(--bg-card);border:1px solid var(--border);border-radius:var(--radius-lg);padding:24px;margin-bottom:20px;">
          <h3 style="font-size:16px;margin-bottom:16px;">Valores e Comissao</h3>
          <form id="form-config-valores" onsubmit="CONFIG.salvarValores(event)">
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
              <div class="form-group">
                <label>Valor da hora (R$)</label>
                <input type="number" class="form-control" id="cfg-valor-hora" value="${oficina.valor_hora || 0}" min="0" step="0.01">
                <span style="font-size:11px;color:var(--text-secondary);margin-top:4px;display:block;">Usado no calculo de mao de obra</span>
              </div>
              <div class="form-group">
                <label>Comissao padrao (%)</label>
                <input type="number" class="form-control" id="cfg-comissao" value="${oficina.comissao_padrao || 0}" min="0" max="100" step="0.5">
                <span style="font-size:11px;color:var(--text-secondary);margin-top:4px;display:block;">Aplicado ao cadastrar novo mecanico</span>
              </div>
            </div>
            <div class="form-group">
              <label>Margem padrao sobre pecas (%)</label>
              <input type="number" class="form-control" id="cfg-margem" value="${oficina.margem_padrao || 30}" min="0" max="500" step="1" style="max-width:200px;">
              <span style="font-size:11px;color:var(--text-secondary);margin-top:4px;display:block;">Ex: 30% = peca que custa R$100 vende a R$130. Aplicado ao cadastrar nova peca.</span>
            </div>
            <button type="submit" class="btn btn-primary" style="margin-top:8px;">Salvar valores</button>
          </form>
        </div>

        <!-- PLANO -->
        <div style="background:var(--bg-card);border:1px solid var(--border);border-radius:var(--radius-lg);padding:24px;">
          <h3 style="font-size:16px;margin-bottom:12px;">Plano</h3>
          <div style="display:flex;align-items:center;gap:12px;">
            <span class="badge badge-pronto" style="font-size:14px;padding:6px 14px;">${oficina.plano === 'beta' ? 'Beta (gratis)' : oficina.plano}</span>
            ${oficina.trial_ate ? `<span style="font-size:13px;color:var(--text-secondary);">Valido ate ${new Date(oficina.trial_ate).toLocaleDateString('pt-BR')}</span>` : ''}
          </div>
        </div>
      </div>
    `;
  },

  async salvarDados(e) {
    e.preventDefault();
    const { error } = await db.from('oficinas').update({
      nome: document.getElementById('cfg-nome').value.trim(),
      cnpj: document.getElementById('cfg-cnpj').value.trim(),
      telefone: document.getElementById('cfg-telefone').value.trim(),
      whatsapp: document.getElementById('cfg-whatsapp').value.trim(),
      email: document.getElementById('cfg-email').value.trim(),
      endereco: document.getElementById('cfg-endereco').value.trim(),
      cidade: document.getElementById('cfg-cidade').value.trim(),
      estado: document.getElementById('cfg-estado').value.trim().toUpperCase()
    }).eq('id', APP.profile.oficina_id);

    if (error) { APP.toast('Erro: ' + error.message, 'error'); return; }

    // Atualiza nome no sidebar
    const elNome = document.getElementById('oficina-nome');
    if (elNome) elNome.textContent = document.getElementById('cfg-nome').value.trim();

    APP.toast('Dados salvos');
  },

  async salvarValores(e) {
    e.preventDefault();
    const valor_hora = parseFloat(document.getElementById('cfg-valor-hora').value) || 0;
    const comissao_padrao = parseFloat(document.getElementById('cfg-comissao').value) || 0;

    const margem_padrao = parseFloat(document.getElementById('cfg-margem').value) || 30;

    const { error } = await db.from('oficinas').update({
      valor_hora,
      comissao_padrao,
      margem_padrao
    }).eq('id', APP.profile.oficina_id);

    if (error) { APP.toast('Erro: ' + error.message, 'error'); return; }

    // Atualiza no objeto local pra usar nos modais
    APP.oficina.valor_hora = valor_hora;
    APP.oficina.comissao_padrao = comissao_padrao;
    APP.oficina.margem_padrao = margem_padrao;

    APP.toast('Valores salvos');
  }
};

document.addEventListener('pageLoad', (e) => {
  if (e.detail.page === 'config') CONFIG.carregar();
});
