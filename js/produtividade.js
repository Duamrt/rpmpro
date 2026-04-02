// RPM Pro — Painel de Produtividade da Equipe
const PRODUTIVIDADE = {
  _periodo: 'mes',

  async carregar() {
    const container = document.getElementById('produtividade-content');
    if (!container) return;
    const oficina_id = APP.oficinaId;

    // Periodo
    const agora = new Date();
    const hoje = agora.toISOString().split('T')[0];
    const inicioSemana = new Date(agora);
    inicioSemana.setDate(agora.getDate() - agora.getDay());
    const inicioMes = new Date(agora.getFullYear(), agora.getMonth(), 1);

    let dataInicio;
    if (this._periodo === 'hoje') dataInicio = hoje;
    else if (this._periodo === 'semana') dataInicio = inicioSemana.toISOString().split('T')[0];
    else dataInicio = inicioMes.toISOString().split('T')[0];

    const periodoLabel = { hoje: 'Hoje', semana: 'Esta semana', mes: 'Este mes' };
    const _mob = window.innerWidth <= 768;

    // Busca tudo em paralelo
    const [profilesRes, osRes, caixaRes] = await Promise.all([
      db.from('profiles').select('id, nome, role').eq('oficina_id', oficina_id).eq('ativo', true).order('nome'),
      db.from('ordens_servico').select('id, numero, status, pago, forma_pagamento, valor_total, mecanico_id, created_at, data_entrega, veiculos(placa), clientes(nome)').eq('oficina_id', oficina_id),
      db.from('caixa').select('id, tipo, categoria, descricao, valor, created_by, created_at').eq('oficina_id', oficina_id).gte('created_at', dataInicio)
    ]);

    const profiles = profilesRes.data || [];
    const todasOS = osRes.data || [];
    const caixa = caixaRes.data || [];

    // Filtra OS do periodo (criadas no periodo)
    const osPeriodo = todasOS.filter(o => o.created_at >= dataInicio);
    // OS abertas (em andamento agora, independente de quando foram criadas)
    const osAbertas = todasOS.filter(o => !['entregue', 'cancelada'].includes(o.status));
    // OS entregues no periodo
    const osEntregues = todasOS.filter(o => o.status === 'entregue' && o.data_entrega && o.data_entrega >= dataInicio);
    const totalFaturado = osEntregues.reduce((s, o) => s + (o.valor_total || 0), 0);
    // Pendentes pagamento
    const pendentes = todasOS.filter(o => o.status === 'entregue' && !o.pago);
    // Canceladas no periodo
    const osCanceladas = todasOS.filter(o => o.status === 'cancelada' && o.created_at >= dataInicio);

    // Por status
    const statusCount = {};
    osAbertas.forEach(o => { statusCount[o.status] = (statusCount[o.status] || 0) + 1; });
    const statusLabel = { entrada: 'Entrada', diagnostico: 'Diagnostico', orcamento: 'Orcamento', aprovada: 'Aprovada', aguardando_peca: 'Ag. Peca', execucao: 'Execucao', pronto: 'Pronto' };
    const statusCor = { entrada: 'var(--info)', diagnostico: 'var(--primary-light)', orcamento: 'var(--warning)', aprovada: 'var(--success)', aguardando_peca: 'var(--danger)', execucao: 'var(--primary-light)', pronto: 'var(--success)' };

    // Mecanicos
    const mecanicos = profiles.filter(p => ['mecanico', 'aux_mecanico'].includes(p.role));
    const dadosMec = mecanicos.map(m => {
      const osDoMec = todasOS.filter(o => o.mecanico_id === m.id);
      const emAndamento = osDoMec.filter(o => !['entregue', 'cancelada'].includes(o.status));
      const entregues = osDoMec.filter(o => o.status === 'entregue' && o.data_entrega && o.data_entrega >= dataInicio);
      const valor = entregues.reduce((s, o) => s + (o.valor_total || 0), 0);
      return { ...m, total: osDoMec.length, emAndamento: emAndamento.length, entregues: entregues.length, valor };
    }).sort((a, b) => b.entregues - a.entregues);

    // Caixa do periodo
    const entradas = caixa.filter(c => c.tipo === 'entrada').reduce((s, c) => s + (c.valor || 0), 0);
    const saidas = caixa.filter(c => c.tipo === 'saida').reduce((s, c) => s + (c.valor || 0), 0);

    // Ticket medio
    const ticketMedio = osEntregues.length ? totalFaturado / osEntregues.length : 0;

    // Alertas
    const gaps = [];
    if (pendentes.length) gaps.push({ msg: `${pendentes.length} OS entregue(s) sem pagamento registrado`, nivel: 'warning' });
    const mecSemOS = mecanicos.filter(m => !todasOS.some(o => o.mecanico_id === m.id && !['entregue', 'cancelada'].includes(o.status)));
    if (mecSemOS.length) gaps.push({ msg: `${mecSemOS.map(m => m.nome).join(', ')} sem OS em andamento`, nivel: 'warning' });
    const osAguardando = osAbertas.filter(o => o.status === 'aguardando_peca');
    if (osAguardando.length) gaps.push({ msg: `${osAguardando.length} OS aguardando peca`, nivel: 'danger' });

    container.innerHTML = `
      <!-- Filtros -->
      <div style="display:flex;gap:8px;margin-bottom:20px;flex-wrap:wrap;align-items:center;">
        <div style="display:flex;gap:4px;">
          ${['hoje', 'semana', 'mes'].map(p => `
            <button class="btn ${this._periodo === p ? 'btn-primary' : 'btn-secondary'} btn-sm" onclick="PRODUTIVIDADE._periodo='${p}';PRODUTIVIDADE.carregar();">${periodoLabel[p]}</button>
          `).join('')}
        </div>
      </div>

      <!-- Resumo geral -->
      <div style="background:var(--bg-card);border:1px solid var(--border);border-radius:var(--radius-lg);padding:20px;margin-bottom:20px;">
        <div style="font-size:13px;font-weight:600;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.5px;margin-bottom:14px;">Resumo — ${periodoLabel[this._periodo]}</div>
        <div style="display:grid;grid-template-columns:repeat(${_mob ? 3 : 6}, 1fr);gap:16px;">
          <div style="text-align:center;">
            <div style="font-family:var(--heading);font-size:32px;font-weight:800;color:var(--primary-light);">${osPeriodo.length}</div>
            <div style="font-size:11px;color:var(--text-muted);">OS novas</div>
          </div>
          <div style="text-align:center;">
            <div style="font-family:var(--heading);font-size:32px;font-weight:800;color:var(--warning);">${osAbertas.length}</div>
            <div style="font-size:11px;color:var(--text-muted);">Em andamento</div>
          </div>
          <div style="text-align:center;">
            <div style="font-family:var(--heading);font-size:32px;font-weight:800;color:var(--success);">${osEntregues.length}</div>
            <div style="font-size:11px;color:var(--text-muted);">Entregues</div>
          </div>
          <div style="text-align:center;">
            <div style="font-family:var(--heading);font-size:32px;font-weight:800;color:var(--success);">${APP.formatMoney(totalFaturado)}</div>
            <div style="font-size:11px;color:var(--text-muted);">Faturado</div>
          </div>
          <div style="text-align:center;">
            <div style="font-family:var(--heading);font-size:32px;font-weight:800;">${APP.formatMoney(ticketMedio)}</div>
            <div style="font-size:11px;color:var(--text-muted);">Ticket medio</div>
          </div>
          <div style="text-align:center;">
            <div style="font-family:var(--heading);font-size:32px;font-weight:800;${pendentes.length ? 'color:var(--danger);' : ''}">${pendentes.length}</div>
            <div style="font-size:11px;color:var(--text-muted);">Pendentes pgto</div>
          </div>
        </div>
      </div>

      <!-- OS por status -->
      <div style="background:var(--bg-card);border:1px solid var(--border);border-radius:var(--radius-lg);padding:20px;margin-bottom:20px;">
        <div style="font-size:13px;font-weight:600;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.5px;margin-bottom:14px;">OS em andamento por etapa</div>
        <div style="display:grid;grid-template-columns:repeat(${_mob ? 4 : 7}, 1fr);gap:8px;">
          ${Object.keys(statusLabel).map(s => `
            <div style="text-align:center;padding:10px 4px;background:var(--bg-input);border-radius:var(--radius);${statusCount[s] ? 'border:1px solid ' + statusCor[s] + ';' : ''}">
              <div style="font-family:var(--heading);font-size:24px;font-weight:800;${statusCount[s] ? 'color:' + statusCor[s] + ';' : 'color:var(--text-muted);opacity:0.3;'}">${statusCount[s] || 0}</div>
              <div style="font-size:10px;color:var(--text-muted);line-height:1.2;">${statusLabel[s]}</div>
            </div>
          `).join('')}
        </div>
      </div>

      <!-- Mecanicos ranking -->
      ${dadosMec.length ? `
      <div style="background:var(--bg-card);border:1px solid var(--border);border-radius:var(--radius-lg);padding:20px;margin-bottom:20px;">
        <div style="font-size:13px;font-weight:600;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.5px;margin-bottom:14px;">Mecanicos</div>
        <div style="display:grid;grid-template-columns:repeat(${_mob ? 2 : Math.min(dadosMec.length, 4)}, 1fr);gap:12px;">
          ${dadosMec.map((m, i) => `
            <div style="background:var(--bg-input);border:1px solid var(--border);border-radius:var(--radius);padding:16px;text-align:center;${i === 0 && m.entregues > 0 ? 'border-color:var(--primary);' : ''}">
              ${i === 0 && m.entregues > 0 ? '<div style="font-size:10px;color:var(--primary-light);font-weight:700;margin-bottom:4px;">🏆 TOP</div>' : ''}
              <div style="font-weight:700;font-size:15px;margin-bottom:8px;">${esc(m.nome)}</div>
              <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
                <div>
                  <div style="font-family:var(--heading);font-size:20px;font-weight:800;color:var(--warning);">${m.emAndamento}</div>
                  <div style="font-size:10px;color:var(--text-muted);">Em andamento</div>
                </div>
                <div>
                  <div style="font-family:var(--heading);font-size:20px;font-weight:800;color:var(--success);">${m.entregues}</div>
                  <div style="font-size:10px;color:var(--text-muted);">Entregues</div>
                </div>
              </div>
              ${m.valor ? `<div style="font-size:14px;font-weight:700;color:var(--success);margin-top:8px;padding-top:8px;border-top:1px solid var(--border);">${APP.formatMoney(m.valor)}</div>` : ''}
            </div>
          `).join('')}
        </div>
      </div>` : ''}

      <!-- Caixa resumo -->
      <div style="background:var(--bg-card);border:1px solid var(--border);border-radius:var(--radius-lg);padding:20px;margin-bottom:20px;">
        <div style="font-size:13px;font-weight:600;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.5px;margin-bottom:14px;">Movimentacao financeira — ${periodoLabel[this._periodo]}</div>
        <div style="display:grid;grid-template-columns:repeat(3, 1fr);gap:16px;">
          <div style="text-align:center;">
            <div style="font-family:var(--heading);font-size:24px;font-weight:800;color:var(--success);">${APP.formatMoney(entradas)}</div>
            <div style="font-size:11px;color:var(--text-muted);">Entradas</div>
          </div>
          <div style="text-align:center;">
            <div style="font-family:var(--heading);font-size:24px;font-weight:800;color:var(--danger);">${APP.formatMoney(saidas)}</div>
            <div style="font-size:11px;color:var(--text-muted);">Saidas</div>
          </div>
          <div style="text-align:center;">
            <div style="font-family:var(--heading);font-size:24px;font-weight:800;${entradas - saidas >= 0 ? 'color:var(--success);' : 'color:var(--danger);'}">${APP.formatMoney(entradas - saidas)}</div>
            <div style="font-size:11px;color:var(--text-muted);">Saldo</div>
          </div>
        </div>
      </div>

      <!-- Alertas -->
      ${gaps.length ? `
      <div style="margin-bottom:24px;">
        <div style="font-size:13px;font-weight:600;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.5px;margin-bottom:10px;">Alertas</div>
        <div style="display:flex;flex-direction:column;gap:6px;">
          ${gaps.map(g => `
            <div style="display:flex;align-items:center;gap:10px;padding:10px 12px;background:${g.nivel === 'danger' ? 'var(--danger-bg)' : 'var(--warning-bg)'};border-radius:var(--radius);border-left:3px solid ${g.nivel === 'danger' ? 'var(--danger)' : 'var(--warning)'};">
              <span style="font-size:13px;font-weight:600;">${esc(g.msg)}</span>
            </div>
          `).join('')}
        </div>
      </div>` : ''}
    `;
  }
};

document.addEventListener('pageLoad', (e) => {
  if (e.detail.page === 'produtividade') PRODUTIVIDADE.carregar();
});
