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
            <div class="form-group">
              <label>Capacidade diaria (veiculos/dia)</label>
              <input type="number" class="form-control" id="cfg-capacidade" value="${oficina.capacidade_diaria || 5}" min="1" max="50" step="1" style="max-width:200px;">
              <span style="font-size:11px;color:var(--text-secondary);margin-top:4px;display:block;">Quantos veiculos a oficina consegue atender por dia. Aparece no calendario de agendamentos.</span>
            </div>
            <button type="submit" class="btn btn-primary" style="margin-top:8px;">Salvar valores</button>
          </form>
        </div>

        <!-- HORÁRIO DE FUNCIONAMENTO -->
        <div style="background:var(--bg-card);border:1px solid var(--border);border-radius:var(--radius-lg);padding:24px;margin-bottom:20px;">
          <h3 style="font-size:16px;margin-bottom:4px;">Horário de Funcionamento</h3>
          <p style="font-size:12px;color:var(--text-secondary);margin-bottom:16px;">Define os dias e horários que a oficina atende. Usado nos agendamentos.</p>
          <form id="form-config-horario" onsubmit="CONFIG.salvarHorario(event)">
            ${['Segunda','Terca','Quarta','Quinta','Sexta','Sabado','Domingo'].map((dia, i) => {
              const key = ['seg','ter','qua','qui','sex','sab','dom'][i];
              const h = oficina.horario || {};
              const ativo = h[key]?.ativo !== false && i < 6; // seg-sex ativo por padrão
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

        <!-- MENSAGENS WHATSAPP -->
        <div style="background:var(--bg-card);border:1px solid var(--border);border-radius:var(--radius-lg);padding:24px;margin-bottom:20px;">
          <h3 style="font-size:16px;margin-bottom:4px;">Mensagens WhatsApp</h3>
          <p style="font-size:12px;color:var(--text-secondary);margin-bottom:16px;">Personalize a saudação e o fechamento de cada mensagem. Os dados do veículo e da oficina são inseridos automaticamente — você não precisa se preocupar com isso.</p>
          <form id="form-config-msgs" onsubmit="CONFIG.salvarMensagens(event)">

            <div style="margin-bottom:20px;padding:16px;background:var(--bg-input);border-radius:var(--radius);border-left:3px solid var(--primary);">
              <label style="font-size:13px;font-weight:700;margin-bottom:8px;display:block;">📋 Histórico do veículo</label>
              <div class="form-group" style="margin-bottom:8px;">
                <label style="font-size:11px;">Saudação</label>
                <input type="text" class="form-control" id="cfg-msg-historico-abertura" value="${esc(oficina.msg_historico_abertura || 'Olá! Tudo bem?')}" placeholder="Ex: Olá! Tudo bem?">
              </div>
              <div style="font-size:12px;color:var(--text-secondary);padding:8px 12px;background:var(--bg-card);border-radius:6px;margin-bottom:8px;line-height:1.6;">
                <em>Aqui é da <strong>${esc(oficina.nome)}</strong>. Segue o histórico completo do seu veículo:<br>
                <strong>Placa · Marca Modelo</strong><br>
                🔗 Link do histórico</em>
              </div>
              <div class="form-group" style="margin:0;">
                <label style="font-size:11px;">Fechamento</label>
                <input type="text" class="form-control" id="cfg-msg-historico-fechamento" value="${esc(oficina.msg_historico_fechamento || 'Qualquer dúvida é só chamar! Abraço.')}" placeholder="Ex: Qualquer dúvida é só chamar!">
              </div>
            </div>

            <div style="margin-bottom:20px;padding:16px;background:var(--bg-input);border-radius:var(--radius);border-left:3px solid var(--warning);">
              <label style="font-size:13px;font-weight:700;margin-bottom:8px;display:block;">💰 Orçamento pronto</label>
              <div class="form-group" style="margin-bottom:8px;">
                <label style="font-size:11px;">Saudação</label>
                <input type="text" class="form-control" id="cfg-msg-orcamento-abertura" value="${esc(oficina.msg_orcamento_abertura || 'Olá! Tudo certo?')}" placeholder="Ex: Olá! Tudo certo?">
              </div>
              <div style="font-size:12px;color:var(--text-secondary);padding:8px 12px;background:var(--bg-card);border-radius:6px;margin-bottom:8px;line-height:1.6;">
                <em>O orçamento do seu <strong>Marca Modelo — Placa</strong> ficou pronto.</em>
              </div>
              <div class="form-group" style="margin:0;">
                <label style="font-size:11px;">Fechamento</label>
                <input type="text" class="form-control" id="cfg-msg-orcamento-fechamento" value="${esc(oficina.msg_orcamento_fechamento || 'Posso te enviar os detalhes? Abraço!')}" placeholder="Ex: Posso te enviar os detalhes?">
              </div>
            </div>

            <div style="margin-bottom:20px;padding:16px;background:var(--bg-input);border-radius:var(--radius);border-left:3px solid var(--success);">
              <label style="font-size:13px;font-weight:700;margin-bottom:8px;display:block;">✅ Veículo pronto</label>
              <div class="form-group" style="margin-bottom:8px;">
                <label style="font-size:11px;">Saudação</label>
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

            <div style="margin-bottom:20px;padding:16px;background:var(--bg-input);border-radius:var(--radius);border-left:3px solid var(--info);">
              <label style="font-size:13px;font-weight:700;margin-bottom:8px;display:block;">🔧 Em execução</label>
              <div class="form-group" style="margin-bottom:8px;">
                <label style="font-size:11px;">Saudação</label>
                <input type="text" class="form-control" id="cfg-msg-execucao-abertura" value="${esc(oficina.msg_execucao_abertura || 'Olá! Passando pra te atualizar.')}" placeholder="Ex: Olá! Passando pra te atualizar.">
              </div>
              <div style="font-size:12px;color:var(--text-secondary);padding:8px 12px;background:var(--bg-card);border-radius:6px;margin-bottom:8px;line-height:1.6;">
                <em>Seu <strong>Marca Modelo — Placa</strong> já está em execução na oficina. Estamos cuidando com atenção.</em>
              </div>
              <div class="form-group" style="margin:0;">
                <label style="font-size:11px;">Fechamento</label>
                <input type="text" class="form-control" id="cfg-msg-execucao-fechamento" value="${esc(oficina.msg_execucao_fechamento || 'Te aviso assim que ficar pronto! Abraço.')}" placeholder="Ex: Te aviso assim que ficar pronto!">
              </div>
            </div>

            <button type="submit" class="btn btn-primary" style="margin-top:8px;">Salvar mensagens</button>
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
    }).eq('id', APP.profile.oficina_id);

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
    const { error } = await db.from('oficinas').update({ horario }).eq('id', APP.profile.oficina_id);
    if (error) { APP.toast('Erro: ' + error.message, 'error'); return; }
    if (APP.oficina) APP.oficina.horario = horario;
    APP.toast('Horários salvos');
  },

  async salvarMensagens(e) {
    e.preventDefault();
    const campos = {};
    ['historico','orcamento','pronto','execucao'].forEach(tipo => {
      campos['msg_' + tipo + '_abertura'] = document.getElementById('cfg-msg-' + tipo + '-abertura').value.trim();
      campos['msg_' + tipo + '_fechamento'] = document.getElementById('cfg-msg-' + tipo + '-fechamento').value.trim();
    });
    const { error } = await db.from('oficinas').update(campos).eq('id', APP.profile.oficina_id);
    if (error) { APP.toast('Erro: ' + error.message, 'error'); return; }
    if (APP.oficina) Object.assign(APP.oficina, campos);
    APP.toast('Mensagens salvas');
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
    }).eq('id', APP.profile.oficina_id);

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
    }).eq('id', APP.profile.oficina_id);

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

    const oficina_id = APP.profile.oficina_id;
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
    const oficina_id = APP.profile.oficina_id;
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
