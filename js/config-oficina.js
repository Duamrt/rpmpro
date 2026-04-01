// RPM Pro — Configurações da Oficina
const CONFIG = {
  async carregar() {
    const container = document.getElementById('config-content');

    // Busca dados atuais da oficina
    const { data: oficina } = await db
      .from('oficinas')
      .select('*')
      .eq('id', APP.oficinaId)
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
                <input type="text" class="form-control" id="cfg-cnpj" value="${esc(oficina.cnpj || '')}" placeholder="00.000.000/0000-00" maxlength="18" oninput="CONFIG._maskCNPJ(this)">
              </div>
              <div class="form-group">
                <label>Telefone</label>
                <input type="text" class="form-control" id="cfg-telefone" value="${esc(oficina.telefone || '')}" placeholder="(00) 0000-0000" maxlength="15" oninput="CONFIG._maskFone(this)">
              </div>
            </div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
              <div class="form-group">
                <label>WhatsApp</label>
                <input type="text" class="form-control" id="cfg-whatsapp" value="${esc(oficina.whatsapp || '')}" placeholder="(00) 00000-0000" maxlength="15" oninput="CONFIG._maskFone(this)">
              </div>
              <div class="form-group">
                <label>Email</label>
                <input type="email" class="form-control" id="cfg-email" value="${esc(oficina.email || '')}">
              </div>
            </div>
            <div style="display:grid;grid-template-columns:1fr 100px;gap:12px;">
              <div class="form-group">
                <label>Endereco (rua/avenida)</label>
                <input type="text" class="form-control" id="cfg-endereco" value="${esc(oficina.endereco || '')}" placeholder="Av. Brasil">
              </div>
              <div class="form-group">
                <label>Numero</label>
                <input type="text" class="form-control" id="cfg-numero" value="${esc(oficina.numero || '')}" placeholder="1500">
              </div>
            </div>
            <div style="display:grid;grid-template-columns:1fr 1fr 80px;gap:12px;">
              <div class="form-group">
                <label>Bairro</label>
                <input type="text" class="form-control" id="cfg-bairro" value="${esc(oficina.bairro || '')}" placeholder="Centro">
              </div>
              <div class="form-group">
                <label>Cidade</label>
                <input type="text" class="form-control" id="cfg-cidade" value="${esc(oficina.cidade || '')}">
              </div>
              <div class="form-group">
                <label>UF</label>
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
                <input type="number" class="form-control" id="cfg-valor-hora" value="${oficina.valor_hora || 0}" readonly style="background:var(--bg-input);opacity:0.8;cursor:not-allowed;">
                <span style="font-size:11px;color:var(--text-secondary);margin-top:4px;display:block;">Calculado automaticamente em "Quanto cobrar na mao de obra?" abaixo</span>
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
            <div class="form-group">
              <label>Capacidade diaria (veiculos/dia)</label>
              <input type="number" class="form-control" id="cfg-capacidade" value="${oficina.capacidade_diaria || 5}" min="1" max="50" step="1" style="max-width:200px;">
              <span style="font-size:11px;color:var(--text-secondary);margin-top:4px;display:block;">Quantos veiculos a oficina consegue atender por dia. Aparece no calendario de agendamentos.</span>
            </div>
            <button type="submit" class="btn btn-primary" style="margin-top:8px;">Salvar valores</button>
          </form>
        </div>

        <!-- MAQUININHAS -->
        <div style="background:var(--bg-card);border:1px solid var(--border);border-radius:var(--radius-lg);padding:24px;margin-bottom:20px;">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;">
            <h3 style="font-size:16px;">Maquininhas</h3>
            <button class="btn btn-primary btn-sm" onclick="CONFIG._novaMaquininha()">+ Adicionar</button>
          </div>
          <p style="font-size:12px;color:var(--text-secondary);margin-bottom:16px;">Cadastre suas maquininhas com as taxas de cada uma. Na entrega, o sistema pergunta qual foi usada.</p>
          <div id="cfg-maquininhas"><div class="loading">Carregando...</div></div>
        </div>

        <!-- HORÁRIO DE FUNCIONAMENTO -->
        <div style="background:var(--bg-card);border:1px solid var(--border);border-radius:var(--radius-lg);padding:24px;margin-bottom:20px;">
          <h3 style="font-size:16px;margin-bottom:4px;">Horário de Funcionamento</h3>
          <p style="font-size:12px;color:var(--text-secondary);margin-bottom:16px;">Define os dias e horários que a oficina atende.</p>
          <form id="form-config-horario" onsubmit="CONFIG.salvarHorario(event)">
            ${['Segunda','Terca','Quarta','Quinta','Sexta','Sabado','Domingo'].map((dia, i) => {
              const key = ['seg','ter','qua','qui','sex','sab','dom'][i];
              const h = oficina.horario || {};
              const ativo = h[key]?.ativo !== false && i < 6;
              const abertura = h[key]?.abertura || (i < 6 ? '08:00' : '');
              const fechamento = h[key]?.fechamento || (i < 6 ? '18:00' : i === 5 ? '12:00' : '');
              return `<div style="display:flex;align-items:center;gap:12px;padding:8px 0;${i < 6 ? '' : 'opacity:0.7;'}border-bottom:1px solid var(--border);">
                <label style="display:flex;align-items:center;gap:8px;width:100px;cursor:pointer;">
                  <input type="checkbox" class="cfg-dia" data-dia="${key}" ${ativo ? 'checked' : ''}>
                  <span style="font-weight:600;font-size:13px;">${dia}</span>
                </label>
                <input type="time" class="form-control cfg-abertura" data-dia="${key}" value="${abertura}" style="width:100px;padding:6px 8px;">
                <span style="color:var(--text-secondary);">às</span>
                <input type="time" class="form-control cfg-fechamento" data-dia="${key}" value="${fechamento}" style="width:100px;padding:6px 8px;">
              </div>`;
            }).join('')}
            <button type="submit" class="btn btn-primary" style="margin-top:12px;">Salvar horários</button>
          </form>
        </div>

        <!-- CALCULADORA CUSTO HORA -->
        <div style="background:var(--bg-card);border:1px solid var(--border);border-radius:var(--radius-lg);padding:24px;margin-bottom:20px;">
          <h3 style="font-size:16px;margin-bottom:4px;">Quanto cobrar na mao de obra?</h3>
          <p style="font-size:12px;color:var(--text-secondary);margin-bottom:16px;">Baseado no horario acima, nos salarios da equipe e nos custos fixos, o sistema calcula quanto voce precisa cobrar por hora.</p>

          <!-- Equipe (carregada automaticamente) -->
          <div id="calc-equipe" style="margin-bottom:16px;">
            <div class="loading" style="font-size:13px;">Carregando equipe...</div>
          </div>

          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
            <div class="form-group">
              <label>Custos fixos mensais (R$)</label>
              <input type="number" class="form-control" id="calc-fixos" value="0" min="0" step="100" oninput="CONFIG._calcularCusto()">
              <span style="font-size:11px;color:var(--text-secondary);">Aluguel, luz, agua, internet...</span>
            </div>
            <div class="form-group">
              <label>Margem de lucro desejada (%)</label>
              <input type="number" class="form-control" id="calc-margem" value="30" min="0" max="200" step="5" oninput="CONFIG._calcularCusto()">
              <span style="font-size:11px;color:var(--text-secondary);">Quanto quer ganhar acima do custo</span>
            </div>
          </div>
          <div id="calc-resultado" style="margin-top:16px;"></div>
        </div>

        <!-- PIX -->
        <div style="background:var(--bg-card);border:1px solid var(--border);border-radius:var(--radius-lg);padding:24px;margin-bottom:20px;">
          <h3 style="font-size:16px;margin-bottom:16px;">Chave Pix</h3>
          <form id="form-config-pix" onsubmit="CONFIG.salvarPix(event)">
            <div class="form-group">
              <label>Tipo da chave</label>
              <select class="form-control" id="cfg-pix-tipo" style="max-width:200px;">
                <option value="">Nenhuma</option>
                <option value="cpf" ${oficina.pix_tipo === 'cpf' ? 'selected' : ''}>CPF</option>
                <option value="cnpj" ${oficina.pix_tipo === 'cnpj' ? 'selected' : ''}>CNPJ</option>
                <option value="telefone" ${oficina.pix_tipo === 'telefone' ? 'selected' : ''}>Telefone</option>
                <option value="email" ${oficina.pix_tipo === 'email' ? 'selected' : ''}>E-mail</option>
                <option value="aleatoria" ${oficina.pix_tipo === 'aleatoria' ? 'selected' : ''}>Chave aleatoria</option>
              </select>
            </div>
            <div class="form-group">
              <label>Chave Pix</label>
              <input type="text" class="form-control" id="cfg-pix-chave" value="${esc(oficina.pix_chave || '')}" placeholder="Digite sua chave Pix" style="max-width:400px;">
            </div>
            <div class="form-group">
              <label>Nome do beneficiario (como aparece no Pix)</label>
              <input type="text" class="form-control" id="cfg-pix-nome" value="${esc(oficina.pix_nome || oficina.nome || '')}" style="max-width:400px;">
            </div>
            <span style="font-size:11px;color:var(--text-secondary);display:block;margin-bottom:12px;">A chave Pix aparece como QR Code no recibo da OS. O cliente paga na hora pelo celular.</span>
            <button type="submit" class="btn btn-primary">Salvar Pix</button>
          </form>
        </div>

        <!-- MENSAGENS WHATSAPP (só pronto — único disparo automático) -->
        <div style="background:var(--bg-card);border:1px solid var(--border);border-radius:var(--radius-lg);padding:24px;margin-bottom:20px;">
          <h3 style="font-size:16px;margin-bottom:4px;">Mensagem WhatsApp</h3>
          <p style="font-size:12px;color:var(--text-secondary);margin-bottom:16px;">O WhatsApp so dispara quando o veiculo fica pronto. Personalize a saudacao e o fechamento — o resto e automatico.</p>
          <form id="form-config-msgs" onsubmit="CONFIG.salvarMensagens(event)">
            <div style="padding:16px;background:var(--bg-input);border-radius:var(--radius);border-left:3px solid var(--success);">
              <label style="font-size:13px;font-weight:700;margin-bottom:8px;display:block;">Veiculo pronto pra retirada</label>
              <div class="form-group" style="margin-bottom:8px;">
                <label style="font-size:11px;">Saudacao</label>
                <input type="text" class="form-control" id="cfg-msg-pronto-abertura" value="${esc(oficina.msg_pronto_abertura || 'Olá! Boas notícias!')}" placeholder="Ex: Olá! Boas notícias!">
              </div>
              <div style="font-size:12px;color:var(--text-secondary);padding:8px 12px;background:var(--bg-card);border-radius:6px;margin-bottom:8px;line-height:1.6;">
                <em>Seu <strong>Marca Modelo — Placa</strong> está pronto e disponível para retirada aqui na <strong>${esc(oficina.nome)}</strong>.</em>
              </div>
              <div class="form-group" style="margin:0;">
                <label style="font-size:11px;">Fechamento</label>
                <input type="text" class="form-control" id="cfg-msg-pronto-fechamento" value="${esc(oficina.msg_pronto_fechamento || 'Quando pode vir buscar? Abraço!')}" placeholder="Ex: Quando pode vir buscar?">
              </div>
            </div>
            <button type="submit" class="btn btn-primary" style="margin-top:12px;">Salvar mensagem</button>
          </form>
        </div>

        <!-- LOGO -->
        <div style="background:var(--bg-card);border:1px solid var(--border);border-radius:var(--radius-lg);padding:24px;margin-bottom:20px;">
          <h3 style="font-size:16px;margin-bottom:16px;">Logo da Oficina</h3>
          <div style="display:flex;align-items:center;gap:20px;">
            <div id="cfg-logo-preview" style="width:80px;height:80px;border-radius:var(--radius);border:2px dashed var(--border);display:flex;align-items:center;justify-content:center;overflow:hidden;background:var(--bg-input);">
              ${oficina.logo_url ? `<img src="${esc(oficina.logo_url)}" style="width:100%;height:100%;object-fit:contain;">` : '<span style="font-size:28px;color:var(--text-muted);">🏢</span>'}
            </div>
            <div>
              <input type="file" id="cfg-logo-file" accept="image/*" style="display:none;" onchange="CONFIG.uploadLogo(this.files[0])">
              <button type="button" class="btn btn-primary btn-sm" onclick="document.getElementById('cfg-logo-file').click()">Enviar logo</button>
              ${oficina.logo_url ? `<button type="button" class="btn btn-danger btn-sm" style="margin-left:8px;" onclick="CONFIG.removerLogo()">Remover</button>` : ''}
              <div style="font-size:11px;color:var(--text-secondary);margin-top:8px;">JPG ou PNG, max 500KB. Aparece no sistema, PDFs e pesquisa de satisfacao.</div>
            </div>
          </div>
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

    // Carrega maquininhas e equipe
    this._carregarMaquininhas();
    this._carregarEquipeCalc();
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
      numero: document.getElementById('cfg-numero').value.trim(),
      bairro: document.getElementById('cfg-bairro').value.trim(),
      cidade: document.getElementById('cfg-cidade').value.trim(),
      estado: document.getElementById('cfg-estado').value.trim().toUpperCase()
    }).eq('id', APP.oficinaId);

    if (error) { APP.toast('Erro: ' + error.message, 'error'); return; }

    // Atualiza nome no sidebar
    const elNome = document.getElementById('oficina-nome');
    if (elNome) elNome.textContent = document.getElementById('cfg-nome').value.trim();

    APP.toast('Dados salvos');
  },

  async salvarHorario(e) {
    e.preventDefault();
    const horario = {};
    ['seg','ter','qua','qui','sex','sab','dom'].forEach(dia => {
      const ativo = document.querySelector(`.cfg-dia[data-dia="${dia}"]`)?.checked || false;
      const abertura = document.querySelector(`.cfg-abertura[data-dia="${dia}"]`)?.value || '';
      const fechamento = document.querySelector(`.cfg-fechamento[data-dia="${dia}"]`)?.value || '';
      horario[dia] = { ativo, abertura, fechamento };
    });
    const { error } = await db.from('oficinas').update({ horario }).eq('id', APP.oficinaId);
    if (error) { APP.toast('Erro: ' + error.message, 'error'); return; }
    if (APP.oficina) APP.oficina.horario = horario;
    APP.toast('Horários salvos');
  },

  async salvarMensagens(e) {
    e.preventDefault();
    const campos = {
      msg_pronto_abertura: document.getElementById('cfg-msg-pronto-abertura').value.trim(),
      msg_pronto_fechamento: document.getElementById('cfg-msg-pronto-fechamento').value.trim()
    };
    const { error } = await db.from('oficinas').update(campos).eq('id', APP.oficinaId);
    if (error) { APP.toast('Erro: ' + error.message, 'error'); return; }
    if (APP.oficina) Object.assign(APP.oficina, campos);
    APP.toast('Mensagem salva');
  },

  async salvarValores(e) {
    e.preventDefault();
    const valor_hora = parseFloat(document.getElementById('cfg-valor-hora').value) || 0;
    const comissao_padrao = parseFloat(document.getElementById('cfg-comissao').value) || 0;

    const margem_padrao = parseFloat(document.getElementById('cfg-margem').value) || 30;
    const capacidade_diaria = parseInt(document.getElementById('cfg-capacidade').value) || 5;

    const { error } = await db.from('oficinas').update({
      valor_hora,
      comissao_padrao,
      margem_padrao,
      capacidade_diaria
    }).eq('id', APP.oficinaId);

    if (error) { APP.toast('Erro: ' + error.message, 'error'); return; }

    APP.oficina.valor_hora = valor_hora;
    APP.oficina.comissao_padrao = comissao_padrao;
    APP.oficina.margem_padrao = margem_padrao;
    APP.oficina.capacidade_diaria = capacidade_diaria;

    APP.toast('Valores salvos');
  },

  async salvarPix(e) {
    e.preventDefault();
    const pix_tipo = document.getElementById('cfg-pix-tipo').value || null;
    const pix_chave = document.getElementById('cfg-pix-chave').value.trim() || null;
    const pix_nome = document.getElementById('cfg-pix-nome').value.trim() || null;

    const { error } = await db.from('oficinas').update({
      pix_tipo, pix_chave, pix_nome
    }).eq('id', APP.oficinaId);

    if (error) { APP.toast('Erro: ' + error.message, 'error'); return; }

    APP.oficina.pix_tipo = pix_tipo;
    APP.oficina.pix_chave = pix_chave;
    APP.oficina.pix_nome = pix_nome;

    APP.toast('Pix salvo');
  },

  async uploadLogo(file) {
    if (!file) return;
    if (file.size > 512000) { APP.toast('Imagem muito grande. Max 500KB.', 'error'); return; }
    if (!file.type.startsWith('image/')) { APP.toast('Selecione uma imagem.', 'error'); return; }

    const oficina_id = APP.oficinaId;
    const ext = file.name.split('.').pop().toLowerCase();
    const path = `${oficina_id}/logo.${ext}`;

    // Remove logo anterior se existir
    await db.storage.from('logos').remove([`${oficina_id}/logo.png`, `${oficina_id}/logo.jpg`, `${oficina_id}/logo.jpeg`, `${oficina_id}/logo.webp`]);

    // Upload
    const { error: upErr } = await db.storage.from('logos').upload(path, file, { upsert: true });
    if (upErr) { APP.toast('Erro no upload: ' + upErr.message, 'error'); return; }

    // Gera URL pública
    const { data: urlData } = db.storage.from('logos').getPublicUrl(path);
    const logoUrl = urlData.publicUrl + '?t=' + Date.now();

    // Salva URL na oficina
    const { error } = await db.from('oficinas').update({ logo_url: logoUrl }).eq('id', oficina_id);
    if (error) { APP.toast('Erro ao salvar: ' + error.message, 'error'); return; }

    APP.oficina.logo_url = logoUrl;
    APP.toast('Logo atualizado');
    this.carregar();

    // Atualiza sidebar
    CONFIG._atualizarLogoSidebar(logoUrl);
  },

  async removerLogo() {
    const oficina_id = APP.oficinaId;
    await db.storage.from('logos').remove([`${oficina_id}/logo.png`, `${oficina_id}/logo.jpg`, `${oficina_id}/logo.jpeg`, `${oficina_id}/logo.webp`]);
    await db.from('oficinas').update({ logo_url: null }).eq('id', oficina_id);
    APP.oficina.logo_url = null;
    APP.toast('Logo removido');
    this.carregar();
    CONFIG._atualizarLogoSidebar(null);
  },

  _atualizarLogoSidebar(url) {
    const logoEl = document.getElementById('sidebar-logo-img');
    if (logoEl) {
      logoEl.innerHTML = url
        ? `<img src="${url}" style="max-height:32px;max-width:120px;object-fit:contain;">`
        : '';
    }
  },

  // === MAQUININHAS ===
  _maquininhas: [],

  async _carregarMaquininhas() {
    const el = document.getElementById('cfg-maquininhas');
    if (!el) return;
    const { data } = await db.from('maquininhas').select('*').eq('oficina_id', APP.oficinaId).eq('ativo', true).order('nome');
    this._maquininhas = data || [];
    if (!this._maquininhas.length) {
      el.innerHTML = '<div style="font-size:13px;color:var(--text-secondary);padding:12px 0;">Nenhuma maquininha cadastrada. Clique em "+ Adicionar".</div>';
      return;
    }
    el.innerHTML = this._maquininhas.map(m => `
      <div style="display:flex;align-items:center;gap:12px;padding:12px;background:var(--bg-input);border-radius:var(--radius);margin-bottom:8px;">
        <div style="flex:1;">
          <div style="font-weight:700;font-size:14px;">${esc(m.nome)}</div>
          <div style="font-size:12px;color:var(--text-secondary);">Debito: ${m.taxa_debito}% · Credito: ${m.taxa_credito}%</div>
        </div>
        <button class="btn btn-secondary btn-sm" onclick="CONFIG._editarMaquininha('${escAttr(m.id)}','${escAttr(m.nome)}',${m.taxa_debito},${m.taxa_credito})">Editar</button>
        <button class="btn btn-danger btn-sm" onclick="CONFIG._excluirMaquininha('${escAttr(m.id)}','${escAttr(m.nome)}')">X</button>
      </div>
    `).join('');
  },

  _novaMaquininha() {
    openModal(`
      <div class="modal-header"><h3>Nova Maquininha</h3><button class="modal-close" onclick="closeModal()">&times;</button></div>
      <div class="modal-body">
        <form onsubmit="CONFIG._salvarMaquininha(event)">
          <div class="form-group"><label>Nome (ex: Stone, Itau, Cielo...)</label><input type="text" class="form-control" id="maq-nome" required></div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
            <div class="form-group"><label>Taxa Debito (%)</label><input type="number" class="form-control" id="maq-debito" value="2" min="0" max="20" step="0.01"></div>
            <div class="form-group"><label>Taxa Credito (%)</label><input type="number" class="form-control" id="maq-credito" value="3.5" min="0" max="20" step="0.01"></div>
          </div>
          <button type="submit" class="btn btn-primary" style="width:100%;margin-top:8px;">Salvar</button>
        </form>
      </div>
    `);
  },

  async _salvarMaquininha(e) {
    e.preventDefault();
    const nome = document.getElementById('maq-nome').value.trim();
    const taxa_debito = parseFloat(document.getElementById('maq-debito').value) || 0;
    const taxa_credito = parseFloat(document.getElementById('maq-credito').value) || 0;
    if (!nome) { APP.toast('Preencha o nome', 'error'); return; }
    const { error } = await db.from('maquininhas').insert({ oficina_id: APP.oficinaId, nome, taxa_debito, taxa_credito });
    if (error) { APP.toast('Erro: ' + error.message, 'error'); return; }
    closeModal();
    APP.toast('Maquininha adicionada');
    this._carregarMaquininhas();
  },

  _editarMaquininha(id, nome, debito, credito) {
    openModal(`
      <div class="modal-header"><h3>Editar ${esc(nome)}</h3><button class="modal-close" onclick="closeModal()">&times;</button></div>
      <div class="modal-body">
        <form onsubmit="CONFIG._atualizarMaquininha(event,'${escAttr(id)}')">
          <div class="form-group"><label>Nome</label><input type="text" class="form-control" id="maq-nome" value="${esc(nome)}" required></div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
            <div class="form-group"><label>Taxa Debito (%)</label><input type="number" class="form-control" id="maq-debito" value="${debito}" min="0" max="20" step="0.01"></div>
            <div class="form-group"><label>Taxa Credito (%)</label><input type="number" class="form-control" id="maq-credito" value="${credito}" min="0" max="20" step="0.01"></div>
          </div>
          <button type="submit" class="btn btn-primary" style="width:100%;margin-top:8px;">Salvar</button>
        </form>
      </div>
    `);
  },

  async _atualizarMaquininha(e, id) {
    e.preventDefault();
    const nome = document.getElementById('maq-nome').value.trim();
    const taxa_debito = parseFloat(document.getElementById('maq-debito').value) || 0;
    const taxa_credito = parseFloat(document.getElementById('maq-credito').value) || 0;
    const { error } = await db.from('maquininhas').update({ nome, taxa_debito, taxa_credito }).eq('id', id);
    if (error) { APP.toast('Erro: ' + error.message, 'error'); return; }
    closeModal();
    APP.toast('Maquininha atualizada');
    this._carregarMaquininhas();
  },

  async _excluirMaquininha(id, nome) {
    if (!confirm('Excluir maquininha ' + nome + '?')) return;
    await db.from('maquininhas').update({ ativo: false }).eq('id', id);
    APP.toast('Maquininha removida');
    this._carregarMaquininhas();
  },

  _calcEquipe: [], // cache da equipe carregada

  async _carregarEquipeCalc() {
    const el = document.getElementById('calc-equipe');
    if (!el) return;

    const { data: membros } = await db.from('profiles')
      .select('id, nome, role, salario_base, comissao_percent')
      .eq('oficina_id', APP.oficinaId)
      .eq('ativo', true)
      .in('role', ['mecanico', 'aux_mecanico', 'gerente', 'atendente', 'aux_admin'])
      .order('nome');

    this._calcEquipe = membros || [];
    const roleLabel = { mecanico: 'Mecânico', aux_mecanico: 'Aux.Mec', gerente: 'Gerente', atendente: 'Atendente', aux_admin: 'Aux.Admin' };

    if (!this._calcEquipe.length) {
      el.innerHTML = '<div style="font-size:13px;color:var(--warning);padding:8px 0;">Nenhum funcionario ativo. Cadastre na aba Equipe.</div>';
      return;
    }

    el.innerHTML = `
      <label style="font-size:13px;font-weight:700;color:var(--text-secondary);margin-bottom:8px;display:block;">Equipe (${this._calcEquipe.length} ativos)</label>
      <div style="display:flex;flex-direction:column;gap:6px;">
        ${this._calcEquipe.map((m, i) => `
          <div style="display:grid;grid-template-columns:1fr 120px;gap:8px;align-items:center;padding:8px 12px;background:var(--bg-input);border-radius:var(--radius);">
            <div>
              <span style="font-weight:600;font-size:13px;">${esc(m.nome)}</span>
              <span style="font-size:11px;color:var(--text-muted);margin-left:6px;">${esc(roleLabel[m.role] || m.role)}</span>
            </div>
            <div>
              <input type="number" class="form-control calc-salario-membro" data-idx="${i}" value="${m.salario_base || 0}" min="0" step="50" style="padding:4px 8px;font-size:13px;" oninput="CONFIG._calcularCusto()" placeholder="Salario R$">
            </div>
          </div>
        `).join('')}
      </div>
    `;

    this._calcularCusto();
  },

  _calcularCusto() {
    // Soma salários dos inputs da equipe
    let salarios = 0;
    let qtdMecanicos = 0;
    document.querySelectorAll('.calc-salario-membro').forEach((input, i) => {
      salarios += parseFloat(input.value) || 0;
      const m = this._calcEquipe[i];
      if (m && ['mecanico', 'aux_mecanico'].includes(m.role)) qtdMecanicos++;
    });
    if (qtdMecanicos < 1) qtdMecanicos = 1;

    // Puxa horas/dia e dias/mês do horário de funcionamento
    const h = APP.oficina?.horario || {};
    let diasSemana = 0;
    let horasDiaTotais = 0;
    ['seg','ter','qua','qui','sex','sab','dom'].forEach(dia => {
      if (h[dia]?.ativo) {
        diasSemana++;
        const ab = h[dia].abertura || '08:00';
        const fe = h[dia].fechamento || '18:00';
        const [hA, mA] = ab.split(':').map(Number);
        const [hF, mF] = fe.split(':').map(Number);
        horasDiaTotais += (hF + mF/60) - (hA + mA/60);
      }
    });
    const horasDia = diasSemana > 0 ? horasDiaTotais / diasSemana : 8;
    const diasMes = Math.round(diasSemana * 4.33); // semanas por mês

    const fixos = parseFloat(document.getElementById('calc-fixos')?.value) || 0;
    const margemDesejada = parseFloat(document.getElementById('calc-margem')?.value) || 30;

    const custoTotal = salarios + fixos;
    const horasTotais = qtdMecanicos * horasDia * diasMes;
    const custoHora = horasTotais > 0 ? custoTotal / horasTotais : 0;
    const sugerido = custoHora * (1 + margemDesejada / 100);
    const lucroHora = sugerido - custoHora;
    const valorAtual = APP.oficina?.valor_hora || 0;

    const el = document.getElementById('calc-resultado');
    if (!el) return;

    el.innerHTML = `
      <div style="background:var(--bg-input);border-radius:var(--radius-lg);padding:20px;">
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:16px;text-align:center;margin-bottom:16px;">
          <div>
            <div style="font-size:11px;color:var(--text-secondary);">Custo real/hora</div>
            <div style="font-size:22px;font-weight:800;color:var(--danger);">R$ ${custoHora.toFixed(2)}</div>
            <div style="font-size:11px;color:var(--text-muted);">Minimo pra nao perder</div>
          </div>
          <div style="border-left:2px solid var(--border);border-right:2px solid var(--border);padding:0 12px;">
            <div style="font-size:11px;color:var(--text-secondary);">Valor sugerido/hora</div>
            <div style="font-size:28px;font-weight:800;color:var(--success);">R$ ${sugerido.toFixed(2)}</div>
            <div style="font-size:11px;color:var(--text-muted);">Com ${margemDesejada}% de lucro</div>
          </div>
          <div>
            <div style="font-size:11px;color:var(--text-secondary);">Lucro por hora</div>
            <div style="font-size:22px;font-weight:800;color:var(--success);">R$ ${lucroHora.toFixed(2)}</div>
            <div style="font-size:11px;color:var(--text-muted);">Por mecanico</div>
          </div>
        </div>

        <div style="font-size:13px;color:var(--text-secondary);text-align:center;margin-bottom:12px;">
          ${qtdMecanicos} mecanico${qtdMecanicos > 1 ? 's' : ''} · ${horasDia.toFixed(1)}h/dia · ${diasMes} dias/mes · ${horasTotais}h produtivas/mes
          <br>Salarios: R$ ${salarios.toFixed(0)} + Fixos: R$ ${fixos.toFixed(0)} = <strong>R$ ${custoTotal.toFixed(0)}/mes</strong>
        </div>

        ${valorAtual > 0 && Math.abs(valorAtual - sugerido) > 5 ? `
          <div style="text-align:center;padding:10px;background:var(--bg-card);border-radius:var(--radius);margin-bottom:12px;font-size:13px;">
            Hoje voce cobra <strong style="color:var(--primary);">R$ ${valorAtual.toFixed(2)}/h</strong>
            ${valorAtual < custoHora
              ? '<span style="color:var(--danger);font-weight:700;"> — PREJUIZO! Voce perde R$ ' + (custoHora - valorAtual).toFixed(2) + ' por hora</span>'
              : valorAtual < sugerido
                ? ' — da lucro, mas abaixo do sugerido'
                : ' — acima do sugerido, otimo!'
            }
          </div>
        ` : ''}

        <div style="text-align:center;">
          <button class="btn btn-primary" onclick="CONFIG._aplicarValorHora(${sugerido.toFixed(2)})">
            Usar R$ ${sugerido.toFixed(2)}/hora como valor padrao
          </button>
        </div>
      </div>
    `;
  },

  async _aplicarValorHora(valor) {
    const { error } = await db.from('oficinas').update({ valor_hora: valor }).eq('id', APP.oficinaId);
    if (error) { APP.toast('Erro: ' + error.message, 'error'); return; }
    APP.oficina.valor_hora = valor;
    document.getElementById('cfg-valor-hora').value = valor;
    APP.toast('Valor da hora atualizado pra R$ ' + valor.toFixed(2));
  },

  _maskCNPJ(el) {
    let v = el.value.replace(/\D/g, '').slice(0, 14);
    if (v.length > 12) v = v.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{1,2})/, '$1.$2.$3/$4-$5');
    else if (v.length > 8) v = v.replace(/^(\d{2})(\d{3})(\d{3})(\d{1,4})/, '$1.$2.$3/$4');
    else if (v.length > 5) v = v.replace(/^(\d{2})(\d{3})(\d{1,3})/, '$1.$2.$3');
    else if (v.length > 2) v = v.replace(/^(\d{2})(\d{1,3})/, '$1.$2');
    el.value = v;
  },

  _maskFone(el) {
    let v = el.value.replace(/\D/g, '').slice(0, 11);
    if (v.length > 10) v = v.replace(/^(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    else if (v.length > 6) v = v.replace(/^(\d{2})(\d{4,5})(\d{0,4})/, '($1) $2-$3');
    else if (v.length > 2) v = v.replace(/^(\d{2})(\d{0,5})/, '($1) $2');
    el.value = v;
  }
};

document.addEventListener('pageLoad', (e) => {
  if (e.detail.page === 'config') CONFIG.carregar();
});
