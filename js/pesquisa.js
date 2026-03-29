// RPM Pro — Pesquisa de Satisfação (lado admin)
const PESQUISA = {
  async carregar() {
    const container = document.getElementById('pesquisa-content');
    if (!container) return;
    const oficina_id = APP.profile.oficina_id;

    const { data } = await db
      .from('pesquisas_satisfacao')
      .select('*, clientes(nome, whatsapp), ordens_servico(numero)')
      .eq('oficina_id', oficina_id)
      .order('created_at', { ascending: false })
      .limit(100);

    const lista = data || [];
    const respondidas = lista.filter(p => p.respondido_em);
    const media = respondidas.length ? (respondidas.reduce((s, p) => s + p.nota, 0) / respondidas.length).toFixed(1) : '-';
    const taxaResposta = lista.length ? Math.round((respondidas.length / lista.length) * 100) : 0;

    // Distribuição de notas
    const dist = [0, 0, 0, 0, 0];
    respondidas.forEach(p => dist[p.nota - 1]++);

    const estrelas = (n) => '★'.repeat(n) + '☆'.repeat(5 - n);

    container.innerHTML = `
      <!-- KPIs -->
      <div class="kpi-grid" style="margin-bottom:20px;">
        <div class="kpi-card">
          <div class="label">Nota media</div>
          <div class="value" style="color:var(--warning);">${media} <span style="font-size:14px;">/ 5</span></div>
        </div>
        <div class="kpi-card">
          <div class="label">Enviadas</div>
          <div class="value primary">${lista.length}</div>
        </div>
        <div class="kpi-card">
          <div class="label">Respondidas</div>
          <div class="value success">${respondidas.length}</div>
        </div>
        <div class="kpi-card">
          <div class="label">Taxa de resposta</div>
          <div class="value" style="color:var(--info);">${taxaResposta}%</div>
        </div>
      </div>

      <!-- Distribuição -->
      ${respondidas.length ? `
      <div style="background:var(--bg-card);border:1px solid var(--border);border-radius:var(--radius-lg);padding:16px 20px;margin-bottom:20px;">
        <h3 style="font-size:14px;margin-bottom:12px;">Distribuicao de notas</h3>
        ${[5,4,3,2,1].map(n => {
          const qtd = dist[n - 1];
          const pct = respondidas.length ? Math.round((qtd / respondidas.length) * 100) : 0;
          return `
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px;">
            <span style="width:30px;font-size:13px;font-weight:700;color:var(--warning);">${n} ★</span>
            <div style="flex:1;height:20px;background:var(--bg-input);border-radius:4px;overflow:hidden;">
              <div style="height:100%;width:${pct}%;background:${n >= 4 ? 'var(--success)' : n === 3 ? 'var(--warning)' : 'var(--danger)'};border-radius:4px;transition:width 0.3s;"></div>
            </div>
            <span style="width:50px;font-size:12px;color:var(--text-secondary);text-align:right;">${qtd} (${pct}%)</span>
          </div>`;
        }).join('')}
      </div>` : ''}

      <!-- Lista -->
      <div style="background:var(--bg-card);border:1px solid var(--border);border-radius:var(--radius-lg);overflow:hidden;">
        <div style="padding:14px 20px;border-bottom:1px solid var(--border);">
          <h3 style="font-size:14px;">Pesquisas enviadas</h3>
        </div>
        ${lista.length ? `
        <table class="data-table">
          <thead>
            <tr><th>OS</th><th>Cliente</th><th>Enviada</th><th>Nota</th><th>Comentario</th><th></th></tr>
          </thead>
          <tbody>
            ${lista.map(p => `
              <tr>
                <td><strong>#${esc(p.ordens_servico?.numero || '-')}</strong></td>
                <td>${esc(p.clientes?.nome || '-')}</td>
                <td style="font-size:12px;">${APP.formatDate(p.created_at)}</td>
                <td>${p.respondido_em ? `<span style="color:var(--warning);font-weight:700;">${estrelas(p.nota)}</span>` : '<span style="color:var(--text-muted);font-size:12px;">Aguardando</span>'}</td>
                <td style="font-size:13px;max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${esc(p.comentario || '-')}</td>
                <td>
                  ${!p.respondido_em && p.clientes?.whatsapp ? `<button class="btn btn-success btn-sm" onclick="PESQUISA.reenviar('${escAttr(p.clientes.whatsapp)}','${escAttr(p.clientes.nome)}','${p.token}')">Reenviar</button>` : ''}
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>` : `
        <div style="padding:30px;text-align:center;color:var(--text-muted);font-size:13px;">
          Nenhuma pesquisa enviada ainda. As pesquisas sao criadas automaticamente ao entregar uma OS.
        </div>`}
      </div>
    `;
  },

  // Cria pesquisa e envia WhatsApp (chamado ao entregar OS)
  async criarEEnviar(osId, clienteId, clienteNome, clienteWhatsapp, osNumero) {
    if (!clienteWhatsapp) return;

    const oficina_id = APP.profile.oficina_id;

    // Verifica se já existe pesquisa pra essa OS
    const { data: existe } = await db.from('pesquisas_satisfacao')
      .select('id')
      .eq('os_id', osId)
      .maybeSingle();

    if (existe) return; // já enviou

    // Cria pesquisa
    const { data, error } = await db.from('pesquisas_satisfacao').insert({
      oficina_id,
      os_id: osId,
      cliente_id: clienteId
    }).select('token').single();

    if (error || !data) return;

    // Envia WhatsApp
    const token = data.token;
    const link = `${window.location.origin}/pesquisa.html?t=${token}`;
    const num = clienteWhatsapp.replace(/\D/g, '');
    const numFull = num.length <= 11 ? '55' + num : num;
    const msg = `Oi ${clienteNome}! Obrigado por confiar na ${APP.oficina?.nome || 'nossa oficina'}! Sua OS #${osNumero} foi entregue. Avalie nosso servico em 1 minuto:\n${link}\nSua opiniao e muito importante pra gente!`;

    window.open(`https://wa.me/${numFull}?text=${encodeURIComponent(msg)}`, '_blank');
  },

  reenviar(fone, nome, token) {
    const num = fone.replace(/\D/g, '');
    const numFull = num.length <= 11 ? '55' + num : num;
    const link = `${window.location.origin}/pesquisa.html?t=${token}`;
    const msg = `Oi ${nome}! Voce ainda nao avaliou nosso servico. Leva menos de 1 minuto:\n${link}\nSua opiniao nos ajuda a melhorar!`;
    window.open(`https://wa.me/${numFull}?text=${encodeURIComponent(msg)}`, '_blank');
  }
};

document.addEventListener('pageLoad', (e) => {
  if (e.detail.page === 'pesquisa') PESQUISA.carregar();
});
