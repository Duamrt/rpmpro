// RPM Pro — Dashboard Avancado
const DASHBOARD = {
  async carregar() {
    const oficina_id = APP.oficinaId;
    const inicioMes = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();

    const [osAbertas, aguardando, prontas, faturamento, fila, osEntreguesMes, osTodas, mecanicosRes] = await Promise.all([
      db.from('ordens_servico').select('id', { count: 'exact', head: true })
        .eq('oficina_id', oficina_id).not('status', 'in', '("entregue","cancelada")'),

      db.from('ordens_servico').select('id', { count: 'exact', head: true })
        .eq('oficina_id', oficina_id).eq('status', 'orcamento'),

      db.from('ordens_servico').select('id', { count: 'exact', head: true })
        .eq('oficina_id', oficina_id).eq('status', 'pronto'),

      db.from('ordens_servico').select('valor_total')
        .eq('oficina_id', oficina_id).eq('pago', true).gte('data_entrega', inicioMes),

      db.from('ordens_servico')
        .select('*, veiculos(placa, marca, modelo), clientes(nome), profiles!ordens_servico_mecanico_id_fkey(nome)')
        .eq('oficina_id', oficina_id).not('status', 'in', '("entregue","cancelada")')
        .order('created_at', { ascending: false }).limit(20),

      // OS entregues no mês (pra ticket médio e ranking)
      db.from('ordens_servico').select('id, valor_total, mecanico_id, data_entrada, data_entrega')
        .eq('oficina_id', oficina_id).eq('status', 'entregue').gte('data_entrega', inicioMes),

      // Total de OS entregues (histórico)
      db.from('ordens_servico').select('id', { count: 'exact', head: true })
        .eq('oficina_id', oficina_id).eq('status', 'entregue'),

      // Mecânicos
      db.from('profiles').select('id, nome')
        .eq('oficina_id', oficina_id).in('role', ['mecanico', 'aux_mecanico']).eq('ativo', true)
    ]);

    // KPIs básicos
    document.getElementById('kpi-os-abertas').textContent = osAbertas.count || 0;
    document.getElementById('kpi-aguardando').textContent = aguardando.count || 0;
    document.getElementById('kpi-prontas').textContent = prontas.count || 0;

    const totalFat = (faturamento.data || []).reduce((s, o) => s + (o.valor_total || 0), 0);
    document.getElementById('kpi-faturamento').textContent = APP.formatMoney(totalFat);

    // Métricas avançadas
    const entreguesMes = osEntreguesMes.data || [];
    const ticketMedio = entreguesMes.length ? totalFat / entreguesMes.length : 0;

    // Tempo médio (entrada → entrega)
    let tempoTotal = 0, tempoCount = 0;
    entreguesMes.forEach(os => {
      if (os.data_entrada && os.data_entrega) {
        const diff = new Date(os.data_entrega) - new Date(os.data_entrada);
        tempoTotal += diff;
        tempoCount++;
      }
    });
    const tempoMedioHoras = tempoCount ? Math.round(tempoTotal / tempoCount / 3600000) : 0;
    const tempoLabel = tempoMedioHoras >= 24 ? Math.round(tempoMedioHoras / 24) + 'd' : tempoMedioHoras + 'h';

    // Ranking mecânicos
    const mecanicos = mecanicosRes.data || [];
    const rankingMec = mecanicos.map(m => {
      const osMec = entreguesMes.filter(os => os.mecanico_id === m.id);
      return { nome: m.nome, qtd: osMec.length, faturamento: osMec.reduce((s, os) => s + (os.valor_total || 0), 0) };
    }).sort((a, b) => b.qtd - a.qtd);

    // Renderiza seção avançada abaixo dos KPIs
    let htmlAvanc = `
    <div class="kpi-grid" style="margin-bottom:20px;">
      <div class="kpi-card">
        <div class="label">Ticket Medio</div>
        <div class="value">${APP.formatMoney(ticketMedio)}</div>
      </div>
      <div class="kpi-card">
        <div class="label">Tempo Medio</div>
        <div class="value">${tempoLabel}</div>
      </div>
      <div class="kpi-card">
        <div class="label">OS no Mes</div>
        <div class="value primary">${entreguesMes.length}</div>
      </div>
      <div class="kpi-card">
        <div class="label">Total Historico</div>
        <div class="value">${osTodas.count || 0}</div>
      </div>
    </div>`;

    // Ranking mecânicos
    if (rankingMec.length && ['dono', 'gerente'].includes(APP.profile.role)) {
      htmlAvanc += `
      <div style="display:grid;grid-template-columns: 1fr 1fr;gap:16px;margin-bottom:20px;">
        <div style="background:var(--bg-card);border:1px solid var(--border);border-radius:var(--radius-lg);overflow:hidden;">
          <div style="padding:16px 20px;border-bottom:1px solid var(--border);">
            <h3 style="font-size:15px;">Ranking Mecanicos (mes)</h3>
          </div>
          <div style="padding:12px;">
            ${rankingMec.map((m, i) => `
              <div style="display:flex;justify-content:space-between;align-items:center;padding:10px 8px;${i < rankingMec.length - 1 ? 'border-bottom:1px solid var(--border);' : ''}">
                <div style="display:flex;align-items:center;gap:8px;">
                  <span style="font-size:16px;">${i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : '·'}</span>
                  <span style="font-weight:600;font-size:14px;">${esc(m.nome)}</span>
                </div>
                <div style="text-align:right;">
                  <div style="font-size:14px;font-weight:700;">${m.qtd} OS</div>
                  <div style="font-size:11px;color:var(--text-secondary);">${APP.formatMoney(m.faturamento)}</div>
                </div>
              </div>
            `).join('')}
          </div>
        </div>

        <div style="background:var(--bg-card);border:1px solid var(--border);border-radius:var(--radius-lg);overflow:hidden;">
          <div style="padding:16px 20px;border-bottom:1px solid var(--border);">
            <h3 style="font-size:15px;">Resumo do Mes</h3>
          </div>
          <div style="padding:16px 20px;">
            <div style="margin-bottom:16px;">
              <div style="font-size:12px;color:var(--text-secondary);margin-bottom:4px;">Faturamento</div>
              <div style="font-size:24px;font-weight:800;color:var(--success);">${APP.formatMoney(totalFat)}</div>
            </div>
            <div style="margin-bottom:16px;">
              <div style="font-size:12px;color:var(--text-secondary);margin-bottom:4px;">Ticket Medio</div>
              <div style="font-size:20px;font-weight:700;">${APP.formatMoney(ticketMedio)}</div>
            </div>
            <div style="margin-bottom:16px;">
              <div style="font-size:12px;color:var(--text-secondary);margin-bottom:4px;">Tempo Medio de Permanencia</div>
              <div style="font-size:20px;font-weight:700;">${tempoLabel}</div>
            </div>
            <div>
              <div style="font-size:12px;color:var(--text-secondary);margin-bottom:4px;">OS Entregues no Mes</div>
              <div style="font-size:20px;font-weight:700;">${entreguesMes.length}</div>
            </div>
          </div>
        </div>
      </div>`;
    }

    // Insere métricas avançadas
    let metricsContainer = document.getElementById('dash-metricas');
    if (!metricsContainer) {
      metricsContainer = document.createElement('div');
      metricsContainer.id = 'dash-metricas';
      const kpiGrid = document.querySelector('#page-dashboard .kpi-grid');
      if (kpiGrid) kpiGrid.after(metricsContainer);
    }
    metricsContainer.innerHTML = htmlAvanc;

    // Fila
    this.renderFila(fila.data || []);
  },

  renderFila(lista) {
    const container = document.getElementById('dash-fila');
    const total = document.getElementById('dash-total-fila');

    if (!lista.length) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="icon">🔧</div>
          <h3>Nenhuma OS aberta</h3>
          <p>Clique em "+ Nova OS" para comecar</p>
        </div>`;
      total.textContent = '';
      return;
    }

    total.textContent = lista.length + ' veiculos';

    const statusLabel = {
      entrada: 'Entrada', diagnostico: 'Diagnostico', orcamento: 'Orcamento',
      aprovada: 'Aprovada', aguardando_peca: 'Aguardando Peca',
      execucao: 'Em execucao', pronto: 'Pronto',
    };

    container.innerHTML = window.innerWidth <= 768 ? `
      <div class="mobile-card-list">
        ${lista.map(os => `
          <div class="mobile-card" onclick="OS.abrirDetalhes('${os.id}')">
            <div class="mobile-card-header">
              <div>
                <div class="mobile-card-title">${esc(os.veiculos?.placa || '-')}</div>
                <div class="mobile-card-subtitle">${esc(os.veiculos?.marca || '')} ${esc(os.veiculos?.modelo || '')} · ${esc(os.clientes?.nome || '-')}</div>
              </div>
              <span class="badge badge-${os.status}">${statusLabel[os.status] || os.status}</span>
            </div>
            <div class="mobile-card-row"><span>${esc(os.profiles?.nome || 'Sem mecânico')}</span></div>
          </div>
        `).join('')}
      </div>` : `
      <table class="data-table">
        <thead>
          <tr>
            <th>Veiculo</th>
            <th>Cliente</th>
            <th>Mecanico</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          ${lista.map(os => `
            <tr style="cursor:pointer" onclick="OS.abrirDetalhes('${os.id}')">
              <td>
                <strong>${esc(os.veiculos?.placa || '-')}</strong><br>
                <span style="font-size:12px;color:var(--text-secondary)">${esc(os.veiculos?.marca || '')} ${esc(os.veiculos?.modelo || '')}</span>
              </td>
              <td>${esc(os.clientes?.nome || '-')}</td>
              <td>${esc(os.profiles?.nome || 'Sem mecanico')}</td>
              <td><span class="badge badge-${os.status}">${statusLabel[os.status] || os.status}</span></td>
            </tr>
          `).join('')}
        </tbody>
      </table>`;
  }
};

document.addEventListener('pageLoad', (e) => {
  if (e.detail.page === 'dashboard') DASHBOARD.carregar();
});
