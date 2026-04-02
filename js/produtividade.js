// RPM Pro — Painel de Produtividade da Equipe
const PRODUTIVIDADE = {
  _periodo: 'mes',
  _filtroUser: '',

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
    const [profilesRes, osRes, caixaRes, clientesRes, veiculosRes] = await Promise.all([
      db.from('profiles').select('id, nome, role').eq('oficina_id', oficina_id).eq('ativo', true).order('nome'),
      db.from('ordens_servico').select('id, numero, status, pago, forma_pagamento, valor_total, created_by, mecanico_id, created_at, updated_at, data_entrega, veiculos(placa), clientes(nome)').eq('oficina_id', oficina_id),
      db.from('caixa').select('id, tipo, categoria, descricao, valor, created_by, created_at').eq('oficina_id', oficina_id).gte('created_at', dataInicio),
      db.from('clientes').select('id, nome, created_by, created_at').eq('oficina_id', oficina_id).gte('created_at', dataInicio),
      db.from('veiculos').select('id, placa, created_by, created_at').eq('oficina_id', oficina_id).gte('created_at', dataInicio)
    ]);

    const profiles = profilesRes.data || [];
    const todasOS = osRes.data || [];
    const caixa = caixaRes.data || [];
    const clientes = clientesRes.data || [];
    const veiculos = veiculosRes.data || [];

    // OS filtradas por periodo
    const osPeriodo = todasOS.filter(o => o.created_at >= dataInicio);
    const osAbertas = todasOS.filter(o => !['entregue', 'cancelada'].includes(o.status));
    const osEntregues = todasOS.filter(o => o.status === 'entregue' && o.data_entrega && o.data_entrega >= dataInicio);
    const totalFaturado = osEntregues.reduce((s, o) => s + (o.valor_total || 0), 0);
    const pendentes = todasOS.filter(o => o.status === 'entregue' && !o.pago);
    const ticketMedio = osEntregues.length ? totalFaturado / osEntregues.length : 0;

    // Por status
    const statusLabel = { entrada: 'Entrada', diagnostico: 'Diagnostico', orcamento: 'Orcamento', aprovada: 'Aprovada', aguardando_peca: 'Ag. Peca', execucao: 'Execucao', pronto: 'Pronto' };
    const statusCor = { entrada: 'var(--info)', diagnostico: 'var(--primary-light)', orcamento: 'var(--warning)', aprovada: 'var(--success)', aguardando_peca: 'var(--danger)', execucao: 'var(--primary-light)', pronto: 'var(--success)' };
    const statusCount = {};
    osAbertas.forEach(o => { statusCount[o.status] = (statusCount[o.status] || 0) + 1; });

    // Caixa
    const entradas = caixa.filter(c => c.tipo === 'entrada').reduce((s, c) => s + (c.valor || 0), 0);
    const saidas = caixa.filter(c => c.tipo === 'saida').reduce((s, c) => s + (c.valor || 0), 0);

    // Todos os profiles (admin + mecanico juntos)
    const todosProfiles = profiles.filter(p => ['dono', 'gerente', 'atendente', 'aux_admin', 'mecanico', 'aux_mecanico'].includes(p.role));
    const roleLabel = { dono: 'Proprietario', gerente: 'Gerente', atendente: 'Atendente', aux_admin: 'Aux. Admin', mecanico: 'Mecanico', aux_mecanico: 'Aux. Mecanico' };

    // Dados por pessoa
    const dadosPessoa = todosProfiles.map(u => {
      const isMec = ['mecanico', 'aux_mecanico'].includes(u.role);

      // OS criadas por essa pessoa
      const osCriadas = osPeriodo.filter(o => o.created_by === u.id);
      // OS atribuidas (mecanico)
      const osAtribuidas = todasOS.filter(o => o.mecanico_id === u.id && !['entregue', 'cancelada'].includes(o.status));
      // OS entregues (mecanico ou criador)
      const osEntreguesPessoa = osEntregues.filter(o => o.mecanico_id === u.id || o.created_by === u.id);
      const valorEntregue = osEntreguesPessoa.reduce((s, o) => s + (o.valor_total || 0), 0);
      // OS movimentadas (updated_at no periodo, atribuidas ou criadas por)
      const osMovimentadas = todasOS.filter(o => o.updated_at && o.updated_at >= dataInicio && (o.created_by === u.id || o.mecanico_id === u.id));
      // Clientes e veiculos cadastrados
      const clientesCad = clientes.filter(c => c.created_by === u.id);
      const veiculosCad = veiculos.filter(v => v.created_by === u.id);
      // Caixa
      const despesas = caixa.filter(c => c.created_by === u.id && c.tipo === 'saida');
      const pagtos = caixa.filter(c => c.created_by === u.id && c.tipo === 'entrada');

      // Timeline
      const timeline = [];
      osCriadas.forEach(o => timeline.push({ hora: o.created_at, desc: `Abriu OS #${o.numero || '-'} — ${o.veiculos?.placa || '-'} (${o.clientes?.nome || '-'})`, tipo: 'OS', cor: 'primary' }));
      osEntreguesPessoa.forEach(o => timeline.push({ hora: o.data_entrega || o.created_at, desc: `Entregou OS #${o.numero || '-'} — ${o.veiculos?.placa || '-'}`, tipo: 'Entrega', cor: 'success' }));
      // Movimentacoes (que nao sao criacao nem entrega)
      const idsJaContados = new Set([...osCriadas.map(o => o.id), ...osEntreguesPessoa.map(o => o.id)]);
      osMovimentadas.filter(o => !idsJaContados.has(o.id)).forEach(o => timeline.push({ hora: o.updated_at, desc: `Moveu OS #${o.numero || '-'} → ${o.status} — ${o.veiculos?.placa || '-'}`, tipo: 'Movim.', cor: 'primary' }));
      clientesCad.forEach(c => timeline.push({ hora: c.created_at, desc: `Cadastrou cliente: ${c.nome}`, tipo: 'Cliente', cor: 'success' }));
      veiculosCad.forEach(v => timeline.push({ hora: v.created_at, desc: `Cadastrou veiculo: ${v.placa}`, tipo: 'Veiculo', cor: 'success' }));
      despesas.forEach(d => timeline.push({ hora: d.created_at, desc: `Despesa: ${d.descricao} — ${APP.formatMoney(d.valor)}`, tipo: 'Despesa', cor: 'danger' }));
      pagtos.forEach(p => timeline.push({ hora: p.created_at, desc: `Recebeu: ${p.descricao || 'Pagamento'} — ${APP.formatMoney(p.valor)}`, tipo: 'Pagto', cor: 'success' }));
      timeline.sort((a, b) => new Date(b.hora) - new Date(a.hora));

      const totalAcoes = osCriadas.length + osEntreguesPessoa.length + osMovimentadas.filter(o => !idsJaContados.has(o.id)).length + clientesCad.length + veiculosCad.length + despesas.length + pagtos.length;

      // Ultima acao
      const ultimaAcao = timeline.length ? new Date(timeline[0].hora) : null;
      const minSemAcao = ultimaAcao ? Math.floor((Date.now() - ultimaAcao.getTime()) / 60000) : null;

      return {
        ...u, isMec, osCriadas: osCriadas.length, osAtribuidas: osAtribuidas.length,
        osEntregues: osEntreguesPessoa.length, valorEntregue, osMovimentadas: osMovimentadas.filter(o => !idsJaContados.has(o.id)).length,
        clientesCad: clientesCad.length, veiculosCad: veiculosCad.length,
        despesas: despesas.length, pagtos: pagtos.length,
        totalAcoes, timeline, minSemAcao
      };
    }).sort((a, b) => b.totalAcoes - a.totalAcoes);

    // Alertas
    const gaps = [];
    if (pendentes.length) gaps.push({ msg: `${pendentes.length} OS entregue(s) sem pagamento registrado`, nivel: 'warning' });
    const mecSemOS = todosProfiles.filter(p => ['mecanico', 'aux_mecanico'].includes(p.role) && !todasOS.some(o => o.mecanico_id === p.id && !['entregue', 'cancelada'].includes(o.status)));
    if (mecSemOS.length) gaps.push({ msg: `${mecSemOS.map(m => m.nome).join(', ')} sem OS em andamento`, nivel: 'warning' });
    // Pessoa sem atividade no periodo
    const semAtividade = dadosPessoa.filter(p => p.totalAcoes === 0 && !['mecanico', 'aux_mecanico'].includes(p.role));
    // Filtro
    const listaFinal = this._filtroUser ? dadosPessoa.filter(u => u.id === this._filtroUser) : dadosPessoa;

    const corBg = (cor) => cor === 'primary' ? 'var(--primary-glow)' : cor === 'success' ? 'var(--success-bg)' : cor === 'danger' ? 'var(--danger-bg)' : 'var(--warning-bg)';
    const corTxt = (cor) => cor === 'primary' ? 'var(--primary-light)' : cor === 'success' ? 'var(--success)' : cor === 'danger' ? 'var(--danger)' : 'var(--warning)';

    container.innerHTML = `
      <!-- Filtros -->
      <div style="display:flex;gap:8px;margin-bottom:20px;flex-wrap:wrap;align-items:center;">
        <div style="display:flex;gap:4px;">
          ${['hoje', 'semana', 'mes'].map(p => `
            <button class="btn ${this._periodo === p ? 'btn-primary' : 'btn-secondary'} btn-sm" onclick="PRODUTIVIDADE._periodo='${p}';PRODUTIVIDADE._filtroUser='';PRODUTIVIDADE.carregar();">${periodoLabel[p]}</button>
          `).join('')}
        </div>
        <select class="form-control" style="max-width:200px;" onchange="PRODUTIVIDADE._filtroUser=this.value;PRODUTIVIDADE.carregar();">
          <option value="">Todos</option>
          ${todosProfiles.map(u => `<option value="${u.id}" ${u.id === this._filtroUser ? 'selected' : ''}>${esc(u.nome)} (${roleLabel[u.role] || u.role})</option>`).join('')}
        </select>
      </div>

      <!-- Resumo geral -->
      <div style="background:var(--bg-card);border:1px solid var(--border);border-radius:var(--radius-lg);padding:20px;margin-bottom:20px;">
        <div style="font-size:13px;font-weight:600;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.5px;margin-bottom:14px;">Resumo — ${periodoLabel[this._periodo]}</div>
        <div style="display:grid;grid-template-columns:repeat(${_mob ? 3 : 6}, 1fr);gap:16px;">
          <div style="text-align:center;">
            <div style="font-family:var(--heading);font-size:28px;font-weight:800;color:var(--primary-light);">${osPeriodo.length}</div>
            <div style="font-size:11px;color:var(--text-muted);">OS novas</div>
          </div>
          <div style="text-align:center;">
            <div style="font-family:var(--heading);font-size:28px;font-weight:800;color:var(--warning);">${osAbertas.length}</div>
            <div style="font-size:11px;color:var(--text-muted);">Em andamento</div>
          </div>
          <div style="text-align:center;">
            <div style="font-family:var(--heading);font-size:28px;font-weight:800;color:var(--success);">${osEntregues.length}</div>
            <div style="font-size:11px;color:var(--text-muted);">Entregues</div>
          </div>
          <div style="text-align:center;">
            <div style="font-family:var(--heading);font-size:28px;font-weight:800;color:var(--success);">${APP.formatMoney(totalFaturado)}</div>
            <div style="font-size:11px;color:var(--text-muted);">Faturado</div>
          </div>
          <div style="text-align:center;">
            <div style="font-family:var(--heading);font-size:28px;font-weight:800;">${APP.formatMoney(ticketMedio)}</div>
            <div style="font-size:11px;color:var(--text-muted);">Ticket medio</div>
          </div>
          <div style="text-align:center;">
            <div style="font-family:var(--heading);font-size:28px;font-weight:800;${pendentes.length ? 'color:var(--danger);' : ''}">${pendentes.length}</div>
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
              <div style="font-family:var(--heading);font-size:22px;font-weight:800;${statusCount[s] ? 'color:' + statusCor[s] + ';' : 'color:var(--text-muted);opacity:0.3;'}">${statusCount[s] || 0}</div>
              <div style="font-size:10px;color:var(--text-muted);line-height:1.2;">${statusLabel[s]}</div>
            </div>
          `).join('')}
        </div>
      </div>

      <!-- Cards por pessoa -->
      <div style="display:grid;grid-template-columns:${_mob ? '1fr' : 'repeat(2, 1fr)'};gap:16px;margin-bottom:24px;">
        ${listaFinal.map(u => {
          const ociosoClass = u.minSemAcao === null ? 'muted' : u.minSemAcao > 240 ? 'danger' : u.minSemAcao > 120 ? 'warning' : 'success';
          const ociosoLabel = u.minSemAcao === null ? 'Sem atividade no periodo' : u.minSemAcao > 60 ? `${Math.floor(u.minSemAcao/60)}h${u.minSemAcao%60}min atras` : `${u.minSemAcao}min atras`;
          const gridItems = u.isMec ? [
            ['OS atribuidas', u.osAtribuidas],
            ['Moviment.', u.osMovimentadas],
            ['Entregues', u.osEntregues],
            ['Valor', u.valorEntregue ? APP.formatMoney(u.valorEntregue) : '-']
          ] : [
            ['OS criadas', u.osCriadas],
            ['Moviment.', u.osMovimentadas],
            ['Entregues', u.osEntregues],
            ['Clientes', u.clientesCad],
            ['Veiculos', u.veiculosCad],
            ['Despesas', u.despesas],
            ['Pagtos', u.pagtos]
          ];
          return `
          <div style="background:var(--bg-card);border:1px solid var(--border);border-radius:var(--radius-lg);overflow:hidden;">
            <div style="padding:14px 18px;border-bottom:1px solid var(--border);display:flex;justify-content:space-between;align-items:center;">
              <div>
                <div style="font-family:var(--heading);font-size:17px;font-weight:700;">${esc(u.nome)}</div>
                <div style="font-size:11px;color:var(--text-muted);">${esc(roleLabel[u.role] || u.role)}</div>
              </div>
              <div style="text-align:right;">
                <div style="font-family:var(--heading);font-size:22px;font-weight:800;color:var(--primary-light);">${u.totalAcoes}</div>
                <div style="font-size:9px;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.5px;">acoes</div>
              </div>
            </div>

            <div style="display:grid;grid-template-columns:repeat(${_mob ? 4 : gridItems.length}, 1fr);border-bottom:1px solid var(--border);">
              ${gridItems.map(([lbl, num]) => `
                <div style="padding:8px 4px;text-align:center;border-right:1px solid var(--border);">
                  <div style="font-family:var(--heading);font-size:16px;font-weight:800;${(typeof num === 'number' ? num : 0) === 0 ? 'color:var(--text-muted);opacity:0.4;' : ''}">${num}</div>
                  <div style="font-size:9px;color:var(--text-muted);line-height:1.2;">${lbl}</div>
                </div>
              `).join('')}
            </div>

            <div style="padding:8px 14px;display:flex;justify-content:space-between;align-items:center;">
              <span style="font-size:11px;font-weight:600;color:${ociosoClass === 'danger' ? 'var(--danger)' : ociosoClass === 'warning' ? 'var(--warning)' : ociosoClass === 'success' ? 'var(--success)' : 'var(--text-muted)'};">Ultima acao: ${ociosoLabel}</span>
              <span style="font-size:11px;color:var(--text-muted);cursor:pointer;text-decoration:underline;" onclick="var el=this.parentElement.nextElementSibling;el.style.display=el.style.display==='none'?'block':'none';">Ver historico</span>
            </div>
            <div style="display:none;padding:0 14px 10px;max-height:250px;overflow-y:auto;">
              ${u.timeline.slice(0, 20).map(t => {
                const h = new Date(t.hora).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
                const d = new Date(t.hora).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
                return `<div style="display:flex;gap:8px;align-items:flex-start;padding:4px 0;border-bottom:1px solid rgba(46,46,54,0.3);">
                  <span style="font-size:11px;color:var(--text-muted);min-width:75px;font-weight:600;">${d} ${h}</span>
                  <span style="font-size:12px;flex:1;">${esc(t.desc)}</span>
                  <span style="font-size:9px;padding:2px 6px;border-radius:8px;font-weight:600;background:${corBg(t.cor)};color:${corTxt(t.cor)};white-space:nowrap;">${esc(t.tipo)}</span>
                </div>`;
              }).join('')}
              ${!u.timeline.length ? '<div style="font-size:12px;color:var(--text-muted);padding:8px 0;">Nenhuma atividade registrada no periodo</div>' : ''}
            </div>
          </div>`;
        }).join('')}
      </div>

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
