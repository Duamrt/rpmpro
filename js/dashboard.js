// RPM Pro — Dashboard
const DASHBOARD = {
  async carregar() {
    const oficina_id = APP.profile.oficina_id;

    // KPIs em paralelo
    const [osAbertas, aguardando, prontas, faturamento, fila] = await Promise.all([
      // OS abertas (tudo que nao foi entregue nem cancelada)
      db.from('ordens_servico')
        .select('id', { count: 'exact', head: true })
        .eq('oficina_id', oficina_id)
        .not('status', 'in', '("entregue","cancelada")'),

      // Aguardando orcamento
      db.from('ordens_servico')
        .select('id', { count: 'exact', head: true })
        .eq('oficina_id', oficina_id)
        .eq('status', 'orcamento'),

      // Prontas pra entrega
      db.from('ordens_servico')
        .select('id', { count: 'exact', head: true })
        .eq('oficina_id', oficina_id)
        .eq('status', 'pronto'),

      // Faturamento do mes (OS entregues e pagas)
      db.from('ordens_servico')
        .select('valor_total')
        .eq('oficina_id', oficina_id)
        .eq('pago', true)
        .gte('data_entrega', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()),

      // Fila do dia (OS nao entregues, ordenado por status)
      db.from('ordens_servico')
        .select('*, veiculos(placa, marca, modelo), clientes(nome), profiles!ordens_servico_mecanico_id_fkey(nome)')
        .eq('oficina_id', oficina_id)
        .not('status', 'in', '("entregue","cancelada")')
        .order('created_at', { ascending: false })
        .limit(20)
    ]);

    // Atualiza KPIs
    document.getElementById('kpi-os-abertas').textContent = osAbertas.count || 0;
    document.getElementById('kpi-aguardando').textContent = aguardando.count || 0;
    document.getElementById('kpi-prontas').textContent = prontas.count || 0;

    const totalFat = (faturamento.data || []).reduce((s, o) => s + (o.valor_total || 0), 0);
    document.getElementById('kpi-faturamento').textContent = APP.formatMoney(totalFat);

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
      entrada: 'Entrada',
      diagnostico: 'Diagnostico',
      orcamento: 'Orcamento',
      aprovada: 'Aprovada',
      aguardando_peca: 'Aguardando Peca',
      execucao: 'Em execucao',
      pronto: 'Pronto',
    };

    container.innerHTML = `
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

// Carrega dashboard quando a pagina for ativada
document.addEventListener('pageLoad', (e) => {
  if (e.detail.page === 'dashboard') DASHBOARD.carregar();
});
