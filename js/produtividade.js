// RPM Pro — Painel de Produtividade da Equipe
const PRODUTIVIDADE = {
  _periodo: 'hoje',
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

    // Busca tudo em paralelo
    const [profilesRes, osResAll, clientesRes, veiculosRes, pecasRes, caixaRes, itensRes] = await Promise.all([
      db.from('profiles').select('id, nome, role').eq('oficina_id', oficina_id).eq('ativo', true).order('nome'),
      db.from('ordens_servico').select('id, numero, status, pago, forma_pagamento, valor_total, created_by, mecanico_id, created_at, data_entrega, veiculos(placa), clientes(nome)').eq('oficina_id', oficina_id),
      db.from('clientes').select('id, nome, created_by, created_at').eq('oficina_id', oficina_id).gte('created_at', dataInicio),
      db.from('veiculos').select('id, placa, created_at').eq('oficina_id', oficina_id).gte('created_at', dataInicio),
      db.from('pecas').select('id, nome, created_at').eq('oficina_id', oficina_id).gte('created_at', dataInicio),
      db.from('caixa').select('id, tipo, categoria, descricao, valor, created_by, created_at').eq('oficina_id', oficina_id).gte('created_at', dataInicio),
      db.from('itens_os').select('id, os_id, tipo, created_at').eq('oficina_id', oficina_id).gte('created_at', dataInicio)
    ]);

    const profiles = profilesRes.data || [];
    const todasOS = osResAll.data || [];
    const osList = todasOS;
    const clientes = clientesRes.data || [];
    const veiculos = veiculosRes.data || [];
    const pecas = pecasRes.data || [];
    const caixa = caixaRes.data || [];
    const itens = itensRes.data || [];

    // Monta dados por usuario
    const usuarios = profiles.filter(p => ['dono','gerente','atendente','aux_admin'].includes(p.role));
    const mecanicos = profiles.filter(p => ['mecanico','aux_mecanico'].includes(p.role));

    const roleLabel = { dono: 'Proprietario', gerente: 'Gerente', atendente: 'Atendente', aux_admin: 'Aux. Administrativo', mecanico: 'Mecanico', aux_mecanico: 'Aux. Mecanico' };
    const periodoLabel = { hoje: 'Hoje', semana: 'Esta semana', mes: 'Este mes' };
    const _mob = window.innerWidth <= 768;

    // Calcula acoes por usuario (admin) e por mecanico (OS atribuidas)
    const dadosUser = usuarios.map(u => {
      const osAbertas = osList.filter(o => o.created_by === u.id && o.created_at >= dataInicio);
      const osFechadasBy = osList.filter(o => o.created_by === u.id && o.status === 'entregue');
      const osMovimentadas = osList.filter(o => (o.created_by === u.id || o.mecanico_id === u.id));
      const clientesCad = clientes.filter(c => c.created_by === u.id);
      const veiculosCad = veiculos.filter(v => v.created_by === u.id);
      const pecasCad = pecas.filter(p => p.created_by === u.id);
      const despesas = caixa.filter(c => c.created_by === u.id && c.tipo === 'saida');
      const pagtos = caixa.filter(c => c.created_by === u.id && c.tipo === 'entrada' && c.categoria === 'servico');

      // Timeline: todas as ações com timestamp
      const timeline = [];
      osAbertas.forEach(o => timeline.push({ hora: o.created_at, desc: `Abriu OS #${o.numero || '-'} — ${o.veiculos?.placa || '-'} (${o.clientes?.nome || '-'})`, tipo: 'OS', cor: 'primary' }));
      osFechadasBy.forEach(o => timeline.push({ hora: o.data_entrega || o.created_at, desc: `Entregou OS #${o.numero || '-'}`, tipo: 'Entrega', cor: 'success' }));
      osMovimentadas.filter(o => !osAbertas.find(a => a.id === o.id) && !osFechadasBy.find(a => a.id === o.id)).forEach(o => timeline.push({ hora: o.created_at, desc: `OS #${o.numero || '-'} — ${o.veiculos?.placa || '-'} (${o.status})`, tipo: 'OS ativa', cor: 'primary' }));
      clientesCad.forEach(c => timeline.push({ hora: c.created_at, desc: `Cadastrou cliente: ${c.nome}`, tipo: 'Cliente', cor: 'success' }));
      veiculosCad.forEach(v => timeline.push({ hora: v.created_at, desc: `Cadastrou veiculo: ${v.placa}`, tipo: 'Veiculo', cor: 'success' }));
      pecasCad.forEach(p => timeline.push({ hora: p.created_at, desc: `Cadastrou peca: ${p.nome}`, tipo: 'Peca', cor: 'warning' }));
      despesas.forEach(d => timeline.push({ hora: d.created_at, desc: `Despesa: ${d.descricao} — ${APP.formatMoney(d.valor)}`, tipo: 'Despesa', cor: 'danger' }));
      pagtos.forEach(p => timeline.push({ hora: p.created_at, desc: `Recebeu pagamento — ${APP.formatMoney(p.valor)}`, tipo: 'Pagto', cor: 'success' }));

      timeline.sort((a, b) => new Date(b.hora) - new Date(a.hora));

      const movims = osMovimentadas.filter(o => !osAbertas.find(a => a.id === o.id) && !osFechadasBy.find(a => a.id === o.id)).length;
      const totalAcoes = osAbertas.length + osFechadasBy.length + movims + clientesCad.length + veiculosCad.length + pecasCad.length + despesas.length + pagtos.length;

      // Tempo desde ultima acao
      const ultimaAcao = timeline.length ? new Date(timeline[0].hora) : null;
      const minSemAcao = ultimaAcao ? Math.floor((Date.now() - ultimaAcao.getTime()) / 60000) : null;

      return {
        ...u,
        osAbertas: osAbertas.length,
        osFechadas: osFechadasBy.length,
        movims,
        clientesCad: clientesCad.length,
        veiculosCad: veiculosCad.length,
        pecasCad: pecasCad.length,
        despesas: despesas.length,
        pagtos: pagtos.length,
        totalAcoes,
        timeline,
        minSemAcao
      };
    });

    // Dados mecanicos (so OS atribuidas)
    const dadosMec = mecanicos.map(m => {
      const osAtribuidas = osList.filter(o => o.mecanico_id === m.id);
      const osEntregues = osAtribuidas.filter(o => o.status === 'entregue');
      const osMovHoje = osAtribuidas.filter(o => !['entregue','cancelada'].includes(o.status));
      const valorTotal = osEntregues.reduce((s, o) => s + (o.valor_total || 0), 0);
      return { ...m, osAtribuidas: osAtribuidas.length, osEntregues: osEntregues.length, osMovHoje: osMovHoje.length, valorTotal };
    });

    // Resumo geral da oficina (independente de created_by)
    const totalOSPeriodo = osList.length;
    const totalOSCriadas = osList.filter(o => o.created_at >= dataInicio).length;
    const totalOSMovidas = osList.filter(o => !['entregue','cancelada'].includes(o.status) && o.created_at < dataInicio).length;
    const totalOSEntregues = osList.filter(o => o.status === 'entregue').length;
    const totalOSAbertas = osList.filter(o => !['entregue','cancelada'].includes(o.status)).length;
    const totalFaturado = osList.filter(o => o.status === 'entregue').reduce((s, o) => s + (o.valor_total || 0), 0);
    const osSemDono = osList.filter(o => !o.created_by);

    // Gaps
    const gaps = [];
    dadosUser.forEach(u => {
      if (u.osFechadas === 0 && u.osAbertas > 0) gaps.push({ user: u.nome, msg: `${u.osAbertas} OS aberta(s), nenhuma fechada`, nivel: 'danger' });
      if (u.minSemAcao !== null && u.minSemAcao > 120) gaps.push({ user: u.nome, msg: `${Math.floor(u.minSemAcao / 60)}h${u.minSemAcao % 60}min sem atividade`, nivel: u.minSemAcao > 240 ? 'danger' : 'warning' });
    });
    const pendentes = osList.filter(o => o.status === 'entregue' && !o.pago);
    if (pendentes.length) gaps.push({ user: 'Geral', msg: `${pendentes.length} OS pendente(s) sem pagamento`, nivel: 'warning' });

    // Filtro usuario
    const listaFinal = this._filtroUser ? dadosUser.filter(u => u.id === this._filtroUser) : dadosUser;

    const corBg = (cor) => cor === 'primary' ? 'var(--primary-glow)' : cor === 'success' ? 'var(--success-bg)' : cor === 'danger' ? 'var(--danger-bg)' : 'var(--warning-bg)';
    const corTxt = (cor) => cor === 'primary' ? 'var(--primary-light)' : cor === 'success' ? 'var(--success)' : cor === 'danger' ? 'var(--danger)' : 'var(--warning)';

    container.innerHTML = `
      <!-- Filtros -->
      <div style="display:flex;gap:8px;margin-bottom:20px;flex-wrap:wrap;align-items:center;">
        <div style="display:flex;gap:4px;">
          ${['hoje','semana','mes'].map(p => `
            <button class="btn ${this._periodo === p ? 'btn-primary' : 'btn-secondary'} btn-sm" onclick="PRODUTIVIDADE._periodo='${p}';PRODUTIVIDADE._filtroUser='';PRODUTIVIDADE.carregar();">${periodoLabel[p]}</button>
          `).join('')}
        </div>
        <select class="form-control" style="max-width:200px;" onchange="PRODUTIVIDADE._filtroUser=this.value;PRODUTIVIDADE.carregar();">
          <option value="">Todos</option>
          ${usuarios.map(u => `<option value="${u.id}" ${u.id === this._filtroUser ? 'selected' : ''}>${esc(u.nome)}</option>`).join('')}
        </select>
      </div>

      <!-- Resumo geral -->
      <div style="background:var(--bg-card);border:1px solid var(--border);border-radius:var(--radius-lg);padding:20px;margin-bottom:20px;">
        <div style="font-size:13px;font-weight:600;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.5px;margin-bottom:12px;">Resumo da oficina — ${periodoLabel[this._periodo]}</div>
        <div style="display:grid;grid-template-columns:repeat(${_mob ? 3 : 6}, 1fr);gap:12px;">
          <div style="text-align:center;">
            <div style="font-family:var(--heading);font-size:28px;font-weight:800;color:var(--primary-light);">${totalOSPeriodo}</div>
            <div style="font-size:11px;color:var(--text-muted);">OS no periodo</div>
          </div>
          <div style="text-align:center;">
            <div style="font-family:var(--heading);font-size:28px;font-weight:800;">${totalOSCriadas}</div>
            <div style="font-size:11px;color:var(--text-muted);">Novas</div>
          </div>
          <div style="text-align:center;">
            <div style="font-family:var(--heading);font-size:28px;font-weight:800;color:var(--info);">${totalOSMovidas}</div>
            <div style="font-size:11px;color:var(--text-muted);">Movimentadas</div>
          </div>
          <div style="text-align:center;">
            <div style="font-family:var(--heading);font-size:28px;font-weight:800;color:var(--warning);">${totalOSAbertas}</div>
            <div style="font-size:11px;color:var(--text-muted);">Em andamento</div>
          </div>
          <div style="text-align:center;">
            <div style="font-family:var(--heading);font-size:28px;font-weight:800;color:var(--success);">${totalOSEntregues}</div>
            <div style="font-size:11px;color:var(--text-muted);">Entregues</div>
          </div>
          <div style="text-align:center;">
            <div style="font-family:var(--heading);font-size:28px;font-weight:800;color:var(--success);">${APP.formatMoney(totalFaturado)}</div>
            <div style="font-size:11px;color:var(--text-muted);">Faturado</div>
          </div>
        </div>
        ${osSemDono.length ? '<div style="margin-top:10px;padding:8px 12px;background:var(--warning-bg);border-radius:var(--radius);font-size:12px;color:var(--warning);">' + osSemDono.length + ' OS sem responsavel atribuido (dados importados)</div>' : ''}
      </div>

      <!-- Cards por usuario -->
      <div style="display:grid;grid-template-columns:${_mob ? '1fr' : 'repeat(2, 1fr)'};gap:16px;margin-bottom:24px;">
        ${listaFinal.map(u => {
          const ociosoClass = u.minSemAcao === null ? '' : u.minSemAcao > 240 ? 'danger' : u.minSemAcao > 120 ? 'warning' : 'success';
          const ociosoLabel = u.minSemAcao === null ? 'Sem atividade' : u.minSemAcao > 60 ? `${Math.floor(u.minSemAcao/60)}h${u.minSemAcao%60}min atras` : `${u.minSemAcao}min atras`;
          return `
          <div style="background:var(--bg-card);border:1px solid var(--border);border-radius:var(--radius-lg);overflow:hidden;">
            <!-- Header -->
            <div style="padding:16px 20px;border-bottom:1px solid var(--border);display:flex;justify-content:space-between;align-items:center;">
              <div>
                <div style="font-family:var(--heading);font-size:18px;font-weight:700;">${esc(u.nome)}</div>
                <div style="font-size:12px;color:var(--text-muted);">${esc(roleLabel[u.role] || u.role)}</div>
              </div>
              <div style="text-align:right;">
                <div style="font-family:var(--heading);font-size:24px;font-weight:800;color:var(--primary-light);">${u.totalAcoes}</div>
                <div style="font-size:10px;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.5px;">acoes</div>
              </div>
            </div>

            <!-- Grid atividades -->
            <div style="display:grid;grid-template-columns:repeat(${_mob ? 4 : 8}, 1fr);border-bottom:1px solid var(--border);">
              ${[
                ['OS abertas', u.osAbertas],
                ['Moviment.', u.movims],
                ['OS fechadas', u.osFechadas],
                ['Clientes', u.clientesCad],
                ['Veiculos', u.veiculosCad],
                ['Pecas', u.pecasCad],
                ['Despesas', u.despesas],
                ['Pagtos rec.', u.pagtos]
              ].map(([lbl, num]) => `
                <div style="padding:10px 6px;text-align:center;border-right:1px solid var(--border);">
                  <div style="font-family:var(--heading);font-size:18px;font-weight:800;${num === 0 ? 'color:var(--text-muted);opacity:0.4;' : ''}">${num}</div>
                  <div style="font-size:10px;color:var(--text-muted);line-height:1.2;">${lbl}</div>
                </div>
              `).join('')}
            </div>

            <!-- Ociosidade -->
            ${u.minSemAcao !== null ? `
            <div style="margin:10px 14px;padding:8px 12px;border-radius:var(--radius);background:${ociosoClass === 'danger' ? 'var(--danger-bg)' : ociosoClass === 'warning' ? 'var(--warning-bg)' : 'var(--success-bg)'};display:flex;justify-content:space-between;align-items:center;">
              <span style="font-size:12px;font-weight:700;color:${ociosoClass === 'danger' ? 'var(--danger)' : ociosoClass === 'warning' ? 'var(--warning)' : 'var(--success)'};">Ultima acao: ${ociosoLabel}</span>
            </div>` : ''}

            <!-- Timeline (colapsavel) -->
            <div style="padding:10px 14px;">
              <div style="font-size:12px;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.5px;margin-bottom:8px;cursor:pointer;" onclick="var el=this.nextElementSibling;el.style.display=el.style.display==='none'?'block':'none';">Historico do dia ▾</div>
              <div style="display:${this._filtroUser ? 'block' : 'none'};">
                ${u.timeline.slice(0, 15).map(t => {
                  const h = new Date(t.hora).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
                  return `<div style="display:flex;gap:10px;align-items:flex-start;padding:5px 0;border-bottom:1px solid rgba(46,46,54,0.3);">
                    <span style="font-size:12px;color:var(--text-muted);min-width:45px;font-weight:600;">${h}</span>
                    <span style="font-size:13px;flex:1;">${esc(t.desc)}</span>
                    <span style="font-size:10px;padding:2px 8px;border-radius:10px;font-weight:600;background:${corBg(t.cor)};color:${corTxt(t.cor)};white-space:nowrap;">${esc(t.tipo)}</span>
                  </div>`;
                }).join('')}
                ${!u.timeline.length ? '<div style="font-size:12px;color:var(--text-muted);padding:8px 0;">Nenhuma atividade registrada</div>' : ''}
              </div>
            </div>
          </div>`;
        }).join('')}
      </div>

      <!-- Mecanicos -->
      ${dadosMec.length ? `
      <div style="margin-bottom:24px;">
        <div style="font-size:13px;font-weight:600;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.5px;margin-bottom:10px;">Mecanicos (OS atribuidas)</div>
        <div style="display:grid;grid-template-columns:repeat(${_mob ? 2 : dadosMec.length}, 1fr);gap:10px;">
          ${dadosMec.map(m => `
            <div style="background:var(--bg-card);border:1px solid var(--border);border-radius:var(--radius);padding:14px;text-align:center;">
              <div style="font-weight:700;font-size:14px;margin-bottom:4px;">${esc(m.nome)}</div>
              <div style="font-family:var(--heading);font-size:22px;font-weight:800;">${m.osAtribuidas}</div>
              <div style="font-size:10px;color:var(--text-muted);">OS atribuidas</div>
              <div style="font-size:13px;font-weight:600;color:var(--primary-light);margin-top:4px;">${m.osMovHoje} movimentadas</div>
              <div style="font-size:13px;font-weight:600;color:var(--success);margin-top:2px;">${m.osEntregues} entregues</div>
              ${m.valorTotal ? `<div style="font-size:12px;color:var(--text-muted);margin-top:2px;">${APP.formatMoney(m.valorTotal)}</div>` : ''}
            </div>
          `).join('')}
        </div>
      </div>` : ''}

      <!-- Gaps -->
      ${gaps.length ? `
      <div style="margin-bottom:24px;">
        <div style="font-size:13px;font-weight:600;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.5px;margin-bottom:10px;">Alertas</div>
        <div style="display:flex;flex-direction:column;gap:6px;">
          ${gaps.map(g => `
            <div style="display:flex;align-items:center;gap:10px;padding:10px 12px;background:${g.nivel === 'danger' ? 'var(--danger-bg)' : 'var(--warning-bg)'};border-radius:var(--radius);border-left:3px solid ${g.nivel === 'danger' ? 'var(--danger)' : 'var(--warning)'};">
              <span style="font-size:13px;font-weight:600;">${esc(g.user)} — ${esc(g.msg)}</span>
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
