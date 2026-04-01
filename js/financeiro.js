// RPM Pro — Financeiro (Caixa da Oficina + Fechamento do Dia)
const FINANCEIRO = {
  _periodo: 'hoje',
  _aba: 'fechamento', // fechamento | caixa | despesas
  _despMes: new Date().getMonth(),
  _despAno: new Date().getFullYear(),
  _caixaMes: new Date().getMonth(),
  _caixaAno: new Date().getFullYear(),
  _pecasMes: new Date().getMonth(),
  _pecasAno: new Date().getFullYear(),

  async carregar() {
    const container = document.getElementById('financeiro-content');
    if (!container) return;

    container.innerHTML = `
      <!-- Abas -->
      <div style="display:flex;gap:6px;margin-bottom:20px;border-bottom:2px solid var(--border);padding-bottom:0;">
        <button class="kanban-tab ${this._aba === 'fechamento' ? 'active' : ''}" onclick="FINANCEIRO._aba='fechamento';FINANCEIRO.carregar();" style="padding:10px 20px;font-size:14px;font-weight:700;">Fechamento do Dia</button>
        <button class="kanban-tab ${this._aba === 'caixa' ? 'active' : ''}" onclick="FINANCEIRO._aba='caixa';FINANCEIRO.carregar();" style="padding:10px 20px;font-size:14px;font-weight:700;">Caixa</button>
        <button class="kanban-tab ${this._aba === 'despesas' ? 'active' : ''}" onclick="FINANCEIRO._aba='despesas';FINANCEIRO.carregar();" style="padding:10px 20px;font-size:14px;font-weight:700;">Despesas Fixas</button>
        <button class="kanban-tab ${this._aba === 'pecas' ? 'active' : ''}" onclick="FINANCEIRO._aba='pecas';FINANCEIRO.carregar();" style="padding:10px 20px;font-size:14px;font-weight:700;">Lucro Pecas</button>
      </div>
      <div id="fin-conteudo"></div>
    `;

    if (this._aba === 'fechamento') await this._carregarFechamento();
    else if (this._aba === 'despesas') await this._carregarDespesas();
    else if (this._aba === 'pecas') await this._carregarLucroPecas();
    else await this._carregarCaixa();
  },

  // ==================== FECHAMENTO DO DIA ====================
  async _carregarFechamento() {
    const el = document.getElementById('fin-conteudo');
    const oficina_id = APP.oficinaId;
    const hoje = new Date().toISOString().split('T')[0];

    // Busca OS entregues hoje + caixa saidas hoje + itens peças
    const [osRes, caixaRes] = await Promise.all([
      db.from('ordens_servico')
        .select('id, numero, valor_total, valor_mao_obra, valor_pecas, forma_pagamento, taxa_cartao, data_entrega, veiculos(placa), clientes(nome)')
        .eq('oficina_id', oficina_id)
        .eq('status', 'entregue')
        .eq('pago', true)
        .gte('data_entrega', hoje)
        .order('data_entrega', { ascending: false }),
      db.from('caixa')
        .select('*')
        .eq('oficina_id', oficina_id)
        .gte('created_at', hoje)
        .order('created_at', { ascending: false })
    ]);

    const osDia = osRes.data || [];
    const movDia = caixaRes.data || [];

    // Busca itens de peça das OS do dia (pra calcular custo)
    const osIds = osDia.map(o => o.id);
    let itensPecaDia = [];
    if (osIds.length) {
      const { data } = await db.from('itens_os')
        .select('os_id, descricao, quantidade, valor_unitario, valor_total, peca_id, pecas(nome, preco_custo)')
        .in('os_id', osIds)
        .eq('tipo', 'peca');
      itensPecaDia = data || [];
    }

    // Calculos
    const faturamentoBruto = osDia.reduce((s, o) => s + (o.valor_total || 0), 0);
    const totalMO = osDia.reduce((s, o) => s + (o.valor_mao_obra || 0), 0);
    const totalPecas = osDia.reduce((s, o) => s + (o.valor_pecas || 0), 0);
    const totalTaxas = osDia.reduce((s, o) => {
      const taxa = o.taxa_cartao || 0;
      return s + (o.valor_total * taxa / 100);
    }, 0);
    const saidasCaixa = movDia.filter(m => m.tipo === 'saida').reduce((s, m) => s + (m.valor || 0), 0);
    const entradasCaixa = movDia.filter(m => m.tipo === 'entrada' && !m.os_id).reduce((s, m) => s + (m.valor || 0), 0);
    const lucroLiquido = faturamentoBruto + entradasCaixa - totalTaxas - saidasCaixa;

    // Lucro peças: vendeu - custou
    let custoPecas = 0;
    let vendaPecas = 0;
    itensPecaDia.forEach(item => {
      vendaPecas += item.valor_total || 0;
      if (item.peca_id && item.pecas?.preco_custo) {
        custoPecas += item.pecas.preco_custo * (item.quantidade || 1);
      } else {
        // Peça avulsa: sem custo cadastrado, estima 0
        custoPecas += 0;
      }
    });
    const lucroBrutoPecas = vendaPecas - custoPecas;
    // Taxa maquineta proporcional sobre peças
    const taxaPropPecas = faturamentoBruto > 0 ? totalTaxas * (vendaPecas / faturamentoBruto) : 0;
    const lucroLiqPecas = lucroBrutoPecas - taxaPropPecas;

    // Por forma de pagamento
    const porForma = {};
    osDia.forEach(o => {
      const f = o.forma_pagamento || 'outros';
      porForma[f] = (porForma[f] || 0) + (o.valor_total || 0);
    });
    const formaLabel = { dinheiro: 'Dinheiro', pix: 'Pix', debito: 'Débito', credito: 'Crédito', boleto: 'Boleto', transferencia: 'Transferência', outros: 'Outros' };

    const _mob = window.innerWidth <= 768;

    el.innerHTML = `
      <div style="text-align:center;margin-bottom:20px;">
        <div style="font-size:13px;color:var(--text-secondary);">Fechamento de</div>
        <div style="font-size:18px;font-weight:700;">${new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}</div>
      </div>

      <!-- KPIs Principais -->
      <div class="kpi-grid" style="margin-bottom:20px;">
        <div class="kpi-card">
          <div class="label">Faturamento Bruto</div>
          <div class="value success">${APP.formatMoney(faturamentoBruto)}</div>
        </div>
        <div class="kpi-card">
          <div class="label">Mao de Obra</div>
          <div class="value primary">${APP.formatMoney(totalMO)}</div>
        </div>
        <div class="kpi-card">
          <div class="label">Pecas</div>
          <div class="value" style="color:var(--warning);">${APP.formatMoney(totalPecas)}</div>
        </div>
        <div class="kpi-card">
          <div class="label">OS Entregues</div>
          <div class="value primary">${osDia.length}</div>
        </div>
      </div>

      <!-- Descontos e Líquido -->
      <div style="background:var(--bg-card);border:1px solid var(--border);border-radius:var(--radius-lg);padding:20px;margin-bottom:20px;">
        <div style="display:grid;grid-template-columns:${_mob ? '1fr' : '1fr 1fr 1fr 1fr'};gap:16px;">
          <div>
            <div style="font-size:11px;color:var(--text-secondary);">Taxas Maquineta</div>
            <div style="font-size:18px;font-weight:700;color:var(--danger);">-${APP.formatMoney(totalTaxas)}</div>
          </div>
          <div>
            <div style="font-size:11px;color:var(--text-secondary);">Saidas do Caixa</div>
            <div style="font-size:18px;font-weight:700;color:var(--danger);">-${APP.formatMoney(saidasCaixa)}</div>
          </div>
          <div>
            <div style="font-size:11px;color:var(--text-secondary);">Entradas Avulsas</div>
            <div style="font-size:18px;font-weight:700;color:var(--success);">+${APP.formatMoney(entradasCaixa)}</div>
          </div>
          <div style="border-left:${_mob ? 'none' : '2px solid var(--border)'};padding-left:${_mob ? '0' : '16px'};">
            <div style="font-size:11px;color:var(--text-secondary);">LUCRO LIQUIDO</div>
            <div style="font-size:24px;font-weight:800;color:${lucroLiquido >= 0 ? 'var(--success)' : 'var(--danger)'};">${APP.formatMoney(lucroLiquido)}</div>
          </div>
        </div>
      </div>

      <!-- Lucro Peças -->
      ${vendaPecas > 0 ? `
      <div style="background:var(--bg-card);border:1px solid var(--border);border-radius:var(--radius-lg);padding:16px 20px;margin-bottom:20px;">
        <h3 style="font-size:14px;margin-bottom:12px;color:var(--text-secondary);">Lucro em Pecas</h3>
        <div style="display:grid;grid-template-columns:repeat(${_mob ? 2 : 5}, 1fr);gap:12px;text-align:center;">
          <div>
            <div style="font-size:11px;color:var(--text-secondary);">Vendeu por</div>
            <div style="font-size:16px;font-weight:700;color:var(--success);">${APP.formatMoney(vendaPecas)}</div>
          </div>
          <div>
            <div style="font-size:11px;color:var(--text-secondary);">Custou</div>
            <div style="font-size:16px;font-weight:700;color:var(--danger);">${APP.formatMoney(custoPecas)}</div>
          </div>
          <div>
            <div style="font-size:11px;color:var(--text-secondary);">Lucro bruto</div>
            <div style="font-size:16px;font-weight:700;color:${lucroBrutoPecas >= 0 ? 'var(--success)' : 'var(--danger)'};">${APP.formatMoney(lucroBrutoPecas)}</div>
          </div>
          <div>
            <div style="font-size:11px;color:var(--text-secondary);">Taxa cartao</div>
            <div style="font-size:16px;font-weight:700;color:var(--danger);">-${APP.formatMoney(taxaPropPecas)}</div>
          </div>
          <div style="${_mob ? 'grid-column:span 2;' : ''}border-left:${_mob ? 'none' : '2px solid var(--border)'};padding-left:${_mob ? '0' : '12px'};">
            <div style="font-size:11px;color:var(--text-secondary);">Lucro liquido pecas</div>
            <div style="font-size:20px;font-weight:800;color:${lucroLiqPecas >= 0 ? 'var(--success)' : 'var(--danger)'};">${APP.formatMoney(lucroLiqPecas)}</div>
          </div>
        </div>
      </div>` : ''}

      <!-- Por forma de pagamento -->
      <div style="background:var(--bg-card);border:1px solid var(--border);border-radius:var(--radius-lg);padding:16px 20px;margin-bottom:20px;">
        <h3 style="font-size:14px;margin-bottom:12px;color:var(--text-secondary);">Recebimentos por forma de pagamento</h3>
        <div style="display:grid;grid-template-columns:repeat(${_mob ? 2 : 4}, 1fr);gap:12px;">
          ${['dinheiro','pix','debito','credito'].map(f => {
            const bruto = porForma[f] || 0;
            const temTaxa = (f === 'debito' || f === 'credito') && bruto > 0;
            const pctTaxa = f === 'debito' ? (APP.oficina?.taxa_debito || 0) : f === 'credito' ? (APP.oficina?.taxa_credito || 0) : 0;
            const vlrTaxa = bruto * pctTaxa / 100;
            const liquido = bruto - vlrTaxa;
            return `
            <div style="background:var(--bg-input);padding:12px 16px;border-radius:var(--radius);${bruto > 0 ? '' : 'opacity:0.5;'}">
              <div style="font-size:12px;color:var(--text-secondary);margin-bottom:4px;">${esc(formaLabel[f])}</div>
              <div style="font-size:18px;font-weight:700;color:var(--success);">${APP.formatMoney(bruto)}</div>
              ${temTaxa ? `
                <div style="font-size:12px;color:var(--danger);margin-top:4px;">-${APP.formatMoney(vlrTaxa)} <span style="font-size:10px;color:var(--text-muted);">(${pctTaxa}%)</span></div>
                <div style="font-size:14px;font-weight:700;color:var(--text-primary);margin-top:2px;border-top:1px solid var(--border);padding-top:4px;">Liquido ${APP.formatMoney(liquido)}</div>
              ` : ''}
            </div>`;
          }).join('')}
        </div>
      </div>

      <!-- OS do dia -->
      <div style="background:var(--bg-card);border:1px solid var(--border);border-radius:var(--radius-lg);overflow:hidden;margin-bottom:20px;">
        <div style="padding:14px 20px;border-bottom:1px solid var(--border);">
          <h3 style="font-size:14px;">OS Entregues Hoje</h3>
        </div>
        ${osDia.length ? (_mob ? `
        <div class="mobile-card-list" style="padding:10px;">
          ${osDia.map(o => {
            const taxa = o.taxa_cartao || 0;
            const vlrTaxa = o.valor_total * taxa / 100;
            const liquido = o.valor_total - vlrTaxa;
            return `
            <div class="mobile-card" onclick="OS.abrirDetalhes('${o.id}')">
              <div class="mobile-card-header">
                <div>
                  <div class="mobile-card-title">#${esc(o.numero || '-')} · ${esc(o.veiculos?.placa || '-')}</div>
                  <div class="mobile-card-subtitle">${esc(o.clientes?.nome || '-')}</div>
                </div>
                <div style="text-align:right;">
                  <div style="font-weight:700;color:var(--success);">${APP.formatMoney(o.valor_total)}</div>
                  ${taxa > 0 ? `<div style="font-size:11px;color:var(--danger);">-${taxa}% = ${APP.formatMoney(liquido)}</div>` : ''}
                </div>
              </div>
              <div class="mobile-card-row"><span class="badge badge-pronto">${esc(formaLabel[o.forma_pagamento] || o.forma_pagamento || '-')}</span></div>
            </div>`;
          }).join('')}
        </div>` : `
        <table class="data-table">
          <thead>
            <tr><th>OS</th><th>Veiculo</th><th>Cliente</th><th>Pagamento</th><th>Bruto</th><th>Taxa</th><th>Liquido</th></tr>
          </thead>
          <tbody>
            ${osDia.map(o => {
              const taxa = o.taxa_cartao || 0;
              const vlrTaxa = o.valor_total * taxa / 100;
              const liquido = o.valor_total - vlrTaxa;
              return `
              <tr style="cursor:pointer;" onclick="OS.abrirDetalhes('${o.id}')">
                <td><strong>#${esc(o.numero || '-')}</strong></td>
                <td>${esc(o.veiculos?.placa || '-')}</td>
                <td>${esc(o.clientes?.nome || '-')}</td>
                <td><span class="badge badge-pronto">${esc(formaLabel[o.forma_pagamento] || o.forma_pagamento || '-')}</span></td>
                <td style="font-weight:700;color:var(--success);">${APP.formatMoney(o.valor_total)}</td>
                <td style="color:var(--danger);">${taxa > 0 ? `-${taxa}%` : '-'}</td>
                <td style="font-weight:700;">${APP.formatMoney(liquido)}</td>
              </tr>`;
            }).join('')}
          </tbody>
          <tfoot>
            <tr style="border-top:2px solid var(--border);font-weight:700;">
              <td colspan="4">TOTAL</td>
              <td style="color:var(--success);">${APP.formatMoney(faturamentoBruto)}</td>
              <td style="color:var(--danger);">${totalTaxas > 0 ? '-' + APP.formatMoney(totalTaxas) : '-'}</td>
              <td>${APP.formatMoney(faturamentoBruto - totalTaxas)}</td>
            </tr>
          </tfoot>
        </table>`) : '<div style="padding:30px;text-align:center;color:var(--text-muted);font-size:13px;">Nenhuma OS entregue hoje</div>'}
      </div>

      <button class="btn btn-secondary" onclick="FINANCEIRO._gerarPDFFechamento()">Gerar PDF do Fechamento</button>
    `;
  },

  _caixaNavegar(delta) {
    this._caixaMes += delta;
    if (this._caixaMes > 11) { this._caixaMes = 0; this._caixaAno++; }
    if (this._caixaMes < 0) { this._caixaMes = 11; this._caixaAno--; }
    this.carregar();
  },

  // ==================== CAIXA ====================
  async _carregarCaixa() {
    const el = document.getElementById('fin-conteudo');
    const oficina_id = APP.oficinaId;
    const agora = new Date();

    const dataInicio = new Date(this._caixaAno, this._caixaMes, 1).toISOString().split('T')[0];
    const dataFim = new Date(this._caixaAno, this._caixaMes + 1, 0, 23, 59, 59).toISOString();

    // Sub-filtro dentro do mês
    const hoje = agora.toISOString().split('T')[0];
    const inicioSemana = new Date(agora);
    inicioSemana.setDate(agora.getDate() - agora.getDay());
    let filtroInicio = dataInicio;
    if (this._periodo === 'hoje') filtroInicio = hoje;
    else if (this._periodo === 'semana') filtroInicio = inicioSemana.toISOString().split('T')[0];

    const [caixaRes, osRes] = await Promise.all([
      db.from('caixa')
        .select('*')
        .eq('oficina_id', oficina_id)
        .gte('created_at', filtroInicio)
        .lte('created_at', dataFim)
        .order('created_at', { ascending: false }),
      db.from('ordens_servico')
        .select('id, numero, valor_total, forma_pagamento, data_entrega, descricao, veiculos(placa), clientes(nome)')
        .eq('oficina_id', oficina_id)
        .eq('pago', true)
        .gte('data_entrega', filtroInicio)
        .lte('data_entrega', dataFim)
        .order('data_entrega', { ascending: false })
    ]);

    const movimentacoes = caixaRes.data || [];
    const osPagas = osRes.data || [];

    const totalEntradas = movimentacoes.filter(m => m.tipo === 'entrada').reduce((s, m) => s + (m.valor || 0), 0);
    const totalSaidas = movimentacoes.filter(m => m.tipo === 'saida').reduce((s, m) => s + (m.valor || 0), 0);
    const totalOS = osPagas.reduce((s, o) => s + (o.valor_total || 0), 0);
    const saldo = totalEntradas + totalOS - totalSaidas;

    const porForma = {};
    osPagas.forEach(o => {
      const f = o.forma_pagamento || 'outros';
      porForma[f] = (porForma[f] || 0) + (o.valor_total || 0);
    });
    movimentacoes.filter(m => m.tipo === 'entrada').forEach(m => {
      const f = m.forma_pagamento || 'outros';
      porForma[f] = (porForma[f] || 0) + (m.valor || 0);
    });

    const formaLabel = { dinheiro: 'Dinheiro', pix: 'Pix', debito: 'Débito', credito: 'Crédito', boleto: 'Boleto', transferencia: 'Transferência', outros: 'Outros' };
    const periodoLabel = { hoje: 'Hoje', semana: 'Semana', mes: 'Mês inteiro' };
    const nomeMesCaixa = new Date(this._caixaAno, this._caixaMes).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });

    el.innerHTML = `
      <!-- Navegação mês + sub-filtro -->
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;flex-wrap:wrap;gap:8px;">
        <div style="display:flex;align-items:center;gap:12px;">
          <button class="btn btn-secondary btn-sm" onclick="FINANCEIRO._caixaNavegar(-1)" style="padding:6px 12px;font-size:16px;">&lt;</button>
          <div style="font-size:18px;font-weight:700;text-transform:capitalize;">${nomeMesCaixa}</div>
          <button class="btn btn-secondary btn-sm" onclick="FINANCEIRO._caixaNavegar(1)" style="padding:6px 12px;font-size:16px;">&gt;</button>
        </div>
        <div style="display:flex;gap:6px;">
          <button class="btn btn-primary btn-sm" onclick="FINANCEIRO.novaMovimentacao('entrada')">+ Entrada</button>
          <button class="btn btn-danger btn-sm" onclick="FINANCEIRO.novaMovimentacao('saida')">+ Saida</button>
        </div>
      </div>
      <div style="display:flex;gap:6px;margin-bottom:20px;">
        ${['mes','semana','hoje'].map(p => `
          <button class="btn ${this._periodo === p ? 'btn-primary' : 'btn-secondary'} btn-sm" onclick="FINANCEIRO._periodo='${p}'; FINANCEIRO.carregar();">${periodoLabel[p]}</button>
        `).join('')}
      </div>

      <!-- KPIs -->
      <div class="kpi-grid" style="margin-bottom:20px;">
        <div class="kpi-card">
          <div class="label">Entradas (OS + Caixa)</div>
          <div class="value success">${APP.formatMoney(totalEntradas + totalOS)}</div>
        </div>
        <div class="kpi-card">
          <div class="label">Saidas</div>
          <div class="value" style="color:var(--danger);">${APP.formatMoney(totalSaidas)}</div>
        </div>
        <div class="kpi-card">
          <div class="label">Saldo</div>
          <div class="value ${saldo >= 0 ? 'success' : ''}" style="${saldo < 0 ? 'color:var(--danger);' : ''}">${APP.formatMoney(saldo)}</div>
        </div>
        <div class="kpi-card">
          <div class="label">OS Pagas</div>
          <div class="value primary">${osPagas.length}</div>
        </div>
      </div>

      <!-- Recebimentos por forma de pagamento -->
      <div style="background:var(--bg-card);border:1px solid var(--border);border-radius:var(--radius-lg);padding:16px 20px;margin-bottom:20px;">
        <h3 style="font-size:14px;margin-bottom:12px;color:var(--text-secondary);">Recebimentos por forma de pagamento</h3>
        <div style="display:grid;grid-template-columns:repeat(${window.innerWidth <= 768 ? 2 : 4}, 1fr);gap:12px;">
          ${['dinheiro','pix','debito','credito'].map(f => {
            const bruto = porForma[f] || 0;
            const temTaxa = (f === 'debito' || f === 'credito') && bruto > 0;
            const pctTaxa = f === 'debito' ? (APP.oficina?.taxa_debito || 0) : f === 'credito' ? (APP.oficina?.taxa_credito || 0) : 0;
            const vlrTaxa = bruto * pctTaxa / 100;
            const liquido = bruto - vlrTaxa;
            return `
            <div style="background:var(--bg-input);padding:12px 16px;border-radius:var(--radius);${bruto > 0 ? '' : 'opacity:0.5;'}">
              <div style="font-size:12px;color:var(--text-secondary);margin-bottom:4px;">${esc(formaLabel[f])}</div>
              <div style="font-size:18px;font-weight:700;color:var(--success);">${APP.formatMoney(bruto)}</div>
              ${temTaxa ? `
                <div style="font-size:12px;color:var(--danger);margin-top:4px;">-${APP.formatMoney(vlrTaxa)} <span style="font-size:10px;color:var(--text-muted);">(${pctTaxa}%)</span></div>
                <div style="font-size:14px;font-weight:700;color:var(--text-primary);margin-top:2px;border-top:1px solid var(--border);padding-top:4px;">Liquido ${APP.formatMoney(liquido)}</div>
              ` : ''}
            </div>`;
          }).join('')}
          ${Object.entries(porForma).filter(([f]) => !['dinheiro','pix','debito','credito'].includes(f)).map(([f, v]) => `
            <div style="background:var(--bg-input);padding:12px 16px;border-radius:var(--radius);">
              <div style="font-size:12px;color:var(--text-secondary);margin-bottom:4px;">${esc(formaLabel[f] || f)}</div>
              <div style="font-size:18px;font-weight:700;color:var(--success);">${APP.formatMoney(v)}</div>
            </div>
          `).join('')}
        </div>
      </div>

      <!-- OS Pagas -->
      <div style="background:var(--bg-card);border:1px solid var(--border);border-radius:var(--radius-lg);overflow:hidden;margin-bottom:20px;">
        <div style="padding:14px 20px;border-bottom:1px solid var(--border);display:flex;justify-content:space-between;align-items:center;">
          <h3 style="font-size:14px;">OS Pagas — ${esc(periodoLabel[this._periodo])}</h3>
          <span style="font-size:13px;color:var(--success);font-weight:700;">${APP.formatMoney(totalOS)}</span>
        </div>
        ${osPagas.length ? (window.innerWidth <= 768 ? `
        <div class="mobile-card-list" style="padding:10px;">
          ${osPagas.map(o => `
            <div class="mobile-card" onclick="OS.abrirDetalhes('${o.id}')">
              <div class="mobile-card-header">
                <div>
                  <div class="mobile-card-title">#${esc(o.numero || '-')} · ${esc(o.veiculos?.placa || '-')}</div>
                  <div class="mobile-card-subtitle">${esc(o.clientes?.nome || '-')}</div>
                </div>
                <span style="font-weight:700;color:var(--success);">${APP.formatMoney(o.valor_total)}</span>
              </div>
              <div class="mobile-card-row"><span>${esc(formaLabel[o.forma_pagamento] || o.forma_pagamento || '-')}</span></div>
            </div>
          `).join('')}
        </div>` : `
        <table class="data-table">
          <thead>
            <tr><th>OS</th><th>Veiculo</th><th>Cliente</th><th>Pagamento</th><th>Valor</th></tr>
          </thead>
          <tbody>
            ${osPagas.map(o => `
              <tr style="cursor:pointer;" onclick="OS.abrirDetalhes('${o.id}')">
                <td><strong>#${esc(o.numero || '-')}</strong></td>
                <td>${esc(o.veiculos?.placa || '-')}</td>
                <td>${esc(o.clientes?.nome || '-')}</td>
                <td><span class="badge badge-pronto">${esc(formaLabel[o.forma_pagamento] || o.forma_pagamento || '-')}</span></td>
                <td style="font-weight:700;color:var(--success);">${APP.formatMoney(o.valor_total)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>`) : '<div style="padding:30px;text-align:center;color:var(--text-muted);font-size:13px;">Nenhuma OS paga nesse periodo</div>'}
      </div>

      <!-- Movimentações do caixa -->
      <div style="background:var(--bg-card);border:1px solid var(--border);border-radius:var(--radius-lg);overflow:hidden;">
        <div style="padding:14px 20px;border-bottom:1px solid var(--border);display:flex;justify-content:space-between;align-items:center;">
          <h3 style="font-size:14px;">Movimentacoes do Caixa</h3>
          <span style="font-size:13px;color:var(--text-secondary);">${movimentacoes.length} lancamentos</span>
        </div>
        ${movimentacoes.length ? (window.innerWidth <= 768 ? `
        <div class="mobile-card-list" style="padding:10px;">
          ${movimentacoes.map(m => `
            <div class="mobile-card">
              <div class="mobile-card-header">
                <div>
                  <div class="mobile-card-title">${esc(m.descricao)}</div>
                  <div class="mobile-card-subtitle">${esc(FINANCEIRO._catLabel(m.categoria))} · ${APP.formatDate(m.created_at)}</div>
                </div>
                <span style="font-weight:700;color:${m.tipo === 'entrada' ? 'var(--success)' : 'var(--danger)'};">${m.tipo === 'saida' ? '-' : ''}${APP.formatMoney(m.valor)}</span>
              </div>
              <div class="mobile-card-row">
                <span class="badge badge-${m.tipo === 'entrada' ? 'pronto' : 'cancelada'}">${m.tipo === 'entrada' ? 'Entrada' : 'Saída'}</span>
                <button class="btn btn-danger btn-sm" style="flex:0;" onclick="FINANCEIRO.excluir('${m.id}')">X</button>
              </div>
            </div>
          `).join('')}
        </div>` : `
        <table class="data-table">
          <thead>
            <tr><th>Data</th><th>Tipo</th><th>Categoria</th><th>Descricao</th><th>Valor</th><th></th></tr>
          </thead>
          <tbody>
            ${movimentacoes.map(m => `
              <tr>
                <td style="font-size:12px;color:var(--text-secondary);">${APP.formatDateTime(m.created_at)}</td>
                <td><span class="badge badge-${m.tipo === 'entrada' ? 'pronto' : 'cancelada'}">${m.tipo === 'entrada' ? 'Entrada' : 'Saida'}</span></td>
                <td style="font-size:13px;">${esc(FINANCEIRO._catLabel(m.categoria))}</td>
                <td style="font-size:13px;">${esc(m.descricao)}</td>
                <td style="font-weight:700;color:${m.tipo === 'entrada' ? 'var(--success)' : 'var(--danger)'};">${m.tipo === 'saida' ? '-' : ''}${APP.formatMoney(m.valor)}</td>
                <td><button class="btn btn-danger btn-sm" onclick="FINANCEIRO.excluir('${m.id}')">X</button></td>
              </tr>
            `).join('')}
          </tbody>
        </table>`) : '<div style="padding:30px;text-align:center;color:var(--text-muted);font-size:13px;">Nenhuma movimentacao registrada</div>'}
      </div>

      <!-- Botão PDF -->
      <div style="margin-top:16px;display:flex;gap:8px;">
        <button class="btn btn-secondary" onclick="FINANCEIRO.gerarPDF()">Gerar Relatorio PDF</button>
      </div>
    `;
  },

  _despNavegar(delta) {
    this._despMes += delta;
    if (this._despMes > 11) { this._despMes = 0; this._despAno++; }
    if (this._despMes < 0) { this._despMes = 11; this._despAno--; }
    this.carregar();
  },

  // ==================== DESPESAS FIXAS ====================
  async _carregarDespesas() {
    const el = document.getElementById('fin-conteudo');
    const oficina_id = APP.oficinaId;
    const inicioMes = new Date(this._despAno, this._despMes, 1).toISOString().split('T')[0];
    const fimMes = new Date(this._despAno, this._despMes + 1, 0, 23, 59, 59).toISOString();

    const { data: despesas } = await db.from('caixa')
      .select('*')
      .eq('oficina_id', oficina_id)
      .eq('tipo', 'saida')
      .gte('created_at', inicioMes)
      .lte('created_at', fimMes)
      .order('created_at', { ascending: false });

    const lista = despesas || [];
    const totalMes = lista.reduce((s, d) => s + (d.valor || 0), 0);

    // Agrupa por categoria
    const porCat = {};
    lista.forEach(d => {
      const cat = d.categoria || 'outro';
      porCat[cat] = (porCat[cat] || 0) + (d.valor || 0);
    });

    const catLabel = {
      aluguel: 'Aluguel', conta_luz: 'Conta de Luz', conta_agua: 'Conta de Água',
      internet: 'Internet/Telefone', fornecedor: 'Fornecedor', boleto: 'Boleto',
      material: 'Material de uso', combustivel: 'Combustível', manutencao: 'Manutenção',
      retirada: 'Retirada/Pró-labore', despesa: 'Despesa operacional', outro: 'Outro'
    };

    const _mob = window.innerWidth <= 768;

    const nomeMes = new Date(this._despAno, this._despMes).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });

    el.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;">
        <div style="display:flex;align-items:center;gap:12px;">
          <button class="btn btn-secondary btn-sm" onclick="FINANCEIRO._despNavegar(-1)" style="padding:6px 12px;font-size:16px;">&lt;</button>
          <div>
            <div style="font-size:18px;font-weight:700;text-transform:capitalize;">${nomeMes}</div>
            <div style="font-size:13px;color:var(--text-secondary);">${lista.length} lancamentos</div>
          </div>
          <button class="btn btn-secondary btn-sm" onclick="FINANCEIRO._despNavegar(1)" style="padding:6px 12px;font-size:16px;">&gt;</button>
        </div>
        <button class="btn btn-danger" onclick="FINANCEIRO._novaDespesa()">+ Nova Despesa</button>
      </div>

      <!-- Total do mês -->
      <div style="background:var(--bg-card);border:1px solid var(--border);border-radius:var(--radius-lg);padding:20px;margin-bottom:20px;text-align:center;">
        <div style="font-size:12px;color:var(--text-secondary);">Total de despesas no mês</div>
        <div style="font-size:28px;font-weight:800;color:var(--danger);">${APP.formatMoney(totalMes)}</div>
      </div>

      <!-- Por categoria -->
      ${Object.keys(porCat).length ? `
      <div style="background:var(--bg-card);border:1px solid var(--border);border-radius:var(--radius-lg);padding:16px 20px;margin-bottom:20px;">
        <h3 style="font-size:14px;margin-bottom:12px;color:var(--text-secondary);">Por categoria</h3>
        <div style="display:flex;flex-wrap:wrap;gap:12px;">
          ${Object.entries(porCat).sort((a, b) => b[1] - a[1]).map(([c, v]) => `
            <div style="background:var(--bg-input);padding:10px 16px;border-radius:var(--radius);min-width:120px;">
              <div style="font-size:12px;color:var(--text-secondary);">${esc(catLabel[c] || c)}</div>
              <div style="font-size:16px;font-weight:700;color:var(--danger);">${APP.formatMoney(v)}</div>
            </div>
          `).join('')}
        </div>
      </div>` : ''}

      <!-- Lista -->
      <div style="background:var(--bg-card);border:1px solid var(--border);border-radius:var(--radius-lg);overflow:hidden;">
        ${lista.length ? (_mob ? `
        <div class="mobile-card-list" style="padding:10px;">
          ${lista.map(d => `
            <div class="mobile-card">
              <div class="mobile-card-header">
                <div>
                  <div class="mobile-card-title">${esc(d.descricao)}</div>
                  <div class="mobile-card-subtitle">${esc(catLabel[d.categoria] || d.categoria)} · ${APP.formatDate(d.created_at)}</div>
                </div>
                <span style="font-weight:700;color:var(--danger);">-${APP.formatMoney(d.valor)}</span>
              </div>
              <div class="mobile-card-row">
                <span class="badge badge-cancelada">${esc(d.forma_pagamento || '-')}</span>
                <button class="btn btn-danger btn-sm" onclick="FINANCEIRO.excluir('${d.id}')">X</button>
              </div>
            </div>
          `).join('')}
        </div>` : `
        <table class="data-table">
          <thead>
            <tr><th>Data</th><th>Categoria</th><th>Descricao</th><th>Pagamento</th><th>Valor</th><th></th></tr>
          </thead>
          <tbody>
            ${lista.map(d => `
              <tr>
                <td style="font-size:12px;">${APP.formatDate(d.created_at)}</td>
                <td style="font-size:13px;">${esc(catLabel[d.categoria] || d.categoria)}</td>
                <td style="font-size:13px;">${esc(d.descricao)}</td>
                <td style="font-size:13px;">${esc(d.forma_pagamento || '-')}</td>
                <td style="font-weight:700;color:var(--danger);">-${APP.formatMoney(d.valor)}</td>
                <td><button class="btn btn-danger btn-sm" onclick="FINANCEIRO.excluir('${d.id}')">X</button></td>
              </tr>
            `).join('')}
          </tbody>
        </table>`) : '<div style="padding:30px;text-align:center;color:var(--text-muted);font-size:13px;">Nenhuma despesa registrada este mês</div>'}
      </div>
    `;
  },

  async _novaDespesa() {
    // Carrega membros pra vale/adiantamento
    const { data: membros } = await db.from('profiles')
      .select('id, nome, role')
      .eq('oficina_id', APP.oficinaId)
      .eq('ativo', true)
      .in('role', ['mecanico','aux_mecanico','gerente','atendente','aux_admin'])
      .order('nome');
    const lista = membros || [];

    openModal(`
      <div class="modal-header">
        <h3>Nova Despesa</h3>
        <button class="modal-close" onclick="closeModal()">&times;</button>
      </div>
      <div class="modal-body">
        <form onsubmit="FINANCEIRO._salvarDespesa(event)">
          <div class="form-group">
            <label>Categoria</label>
            <select class="form-control" id="desp-categoria" required onchange="FINANCEIRO._toggleMembro()">
              <option value="aluguel">Aluguel</option>
              <option value="conta_luz">Conta de Luz</option>
              <option value="conta_agua">Conta de Água</option>
              <option value="internet">Internet / Telefone</option>
              <option value="fornecedor">Fornecedor</option>
              <option value="boleto">Boleto</option>
              <option value="material">Material de uso</option>
              <option value="combustivel">Combustível</option>
              <option value="manutencao">Manutenção</option>
              <option value="retirada">Retirada / Pró-labore</option>
              <option value="vale">Vale / Adiantamento funcionario</option>
              <option value="outro">Outro</option>
            </select>
          </div>
          <div class="form-group hidden" id="desp-membro-wrap">
            <label>Funcionario</label>
            <select class="form-control" id="desp-membro">
              <option value="">Selecione...</option>
              ${lista.map(m => `<option value="${m.id}">${esc(m.nome)}</option>`).join('')}
            </select>
          </div>
          <div class="form-group">
            <label>Descricao *</label>
            <input type="text" class="form-control" id="desp-descricao" required placeholder="Ex: Aluguel abril, Conta Equatorial, Fornecedor X...">
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
            <div class="form-group">
              <label>Valor (R$) *</label>
              <input type="number" class="form-control" id="desp-valor" required min="0.01" step="0.01">
            </div>
            <div class="form-group">
              <label>Forma de pagamento</label>
              <select class="form-control" id="desp-forma">
                <option value="dinheiro">Dinheiro</option>
                <option value="pix">Pix</option>
                <option value="boleto">Boleto</option>
                <option value="debito">Débito</option>
                <option value="credito">Crédito</option>
                <option value="transferencia">Transferência</option>
              </select>
            </div>
          </div>
          <div class="form-group">
            <label>Data (se diferente de hoje)</label>
            <input type="date" class="form-control" id="desp-data" value="${new Date().toISOString().split('T')[0]}">
          </div>
          <div class="modal-footer" style="padding:16px 0 0;border:0;">
            <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancelar</button>
            <button type="submit" class="btn btn-danger">Registrar Despesa</button>
          </div>
        </form>
      </div>
    `);
  },

  _toggleMembro() {
    const cat = document.getElementById('desp-categoria').value;
    const wrap = document.getElementById('desp-membro-wrap');
    if (cat === 'vale') {
      wrap.classList.remove('hidden');
      document.getElementById('desp-membro').required = true;
    } else {
      wrap.classList.add('hidden');
      document.getElementById('desp-membro').required = false;
    }
  },

  async _salvarDespesa(e) {
    e.preventDefault();
    const cat = document.getElementById('desp-categoria').value;
    const membroId = document.getElementById('desp-membro')?.value || null;
    const data = document.getElementById('desp-data').value;

    if (cat === 'vale' && !membroId) {
      APP.toast('Selecione o funcionario', 'error');
      return;
    }

    const { error } = await db.from('caixa').insert({
      oficina_id: APP.oficinaId,
      tipo: 'saida',
      categoria: cat,
      descricao: document.getElementById('desp-descricao').value.trim(),
      valor: parseFloat(document.getElementById('desp-valor').value) || 0,
      forma_pagamento: document.getElementById('desp-forma').value,
      membro_id: cat === 'vale' ? membroId : null,
      created_by: APP.profile.id,
      created_at: data ? new Date(data + 'T12:00:00').toISOString() : new Date().toISOString()
    });

    if (error) { APP.toast('Erro: ' + error.message, 'error'); return; }
    closeModal();
    APP.toast('Despesa registrada');
    this.carregar();
  },

  _pecasNavegar(delta) {
    this._pecasMes += delta;
    if (this._pecasMes > 11) { this._pecasMes = 0; this._pecasAno++; }
    if (this._pecasMes < 0) { this._pecasMes = 11; this._pecasAno--; }
    this.carregar();
  },

  // ==================== LUCRO PECAS ====================
  async _carregarLucroPecas() {
    const el = document.getElementById('fin-conteudo');
    const oficina_id = APP.oficinaId;
    const inicio = new Date(this._pecasAno, this._pecasMes, 1).toISOString().split('T')[0];
    const fim = new Date(this._pecasAno, this._pecasMes + 1, 0).toISOString().split('T')[0];
    const nomeMes = new Date(this._pecasAno, this._pecasMes).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });

    // OS entregues no mês
    const { data: osMes } = await db.from('ordens_servico')
      .select('id, valor_total, valor_pecas, forma_pagamento, taxa_cartao')
      .eq('oficina_id', oficina_id)
      .eq('status', 'entregue')
      .gte('data_entrega', inicio)
      .lte('data_entrega', fim);

    const ordens = osMes || [];
    const osIds = ordens.map(o => o.id);

    // Itens de peça
    let itensPeca = [];
    if (osIds.length) {
      const { data } = await db.from('itens_os')
        .select('os_id, descricao, quantidade, valor_unitario, valor_total, peca_id, pecas(nome, preco_custo)')
        .in('os_id', osIds)
        .eq('tipo', 'peca');
      itensPeca = data || [];
    }

    // Totais
    let totalVenda = 0, totalCusto = 0;
    const faturamentoTotal = ordens.reduce((s, o) => s + (o.valor_total || 0), 0);
    const totalTaxasMes = ordens.reduce((s, o) => s + ((o.valor_total || 0) * (o.taxa_cartao || 0) / 100), 0);

    // Ranking por peça
    const ranking = {};
    itensPeca.forEach(item => {
      const nome = item.pecas?.nome || item.descricao || 'Sem nome';
      const venda = item.valor_total || 0;
      const custo = item.peca_id && item.pecas?.preco_custo ? item.pecas.preco_custo * (item.quantidade || 1) : 0;
      totalVenda += venda;
      totalCusto += custo;

      if (!ranking[nome]) ranking[nome] = { qtd: 0, venda: 0, custo: 0 };
      ranking[nome].qtd += item.quantidade || 1;
      ranking[nome].venda += venda;
      ranking[nome].custo += custo;
    });

    const lucroBruto = totalVenda - totalCusto;
    const taxaProp = faturamentoTotal > 0 ? totalTaxasMes * (totalVenda / faturamentoTotal) : 0;
    const lucroLiq = lucroBruto - taxaProp;
    const margem = totalVenda > 0 ? (lucroBruto / totalVenda * 100) : 0;

    // Ranking ordenado por lucro
    const rankList = Object.entries(ranking)
      .map(([nome, d]) => ({ nome, ...d, lucro: d.venda - d.custo }))
      .sort((a, b) => b.lucro - a.lucro);

    const _mob = window.innerWidth <= 768;

    el.innerHTML = `
      <!-- Navegação mês -->
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:20px;">
        <button class="btn btn-secondary btn-sm" onclick="FINANCEIRO._pecasNavegar(-1)" style="padding:6px 12px;font-size:16px;">&lt;</button>
        <div style="font-size:18px;font-weight:700;text-transform:capitalize;">${nomeMes}</div>
        <button class="btn btn-secondary btn-sm" onclick="FINANCEIRO._pecasNavegar(1)" style="padding:6px 12px;font-size:16px;">&gt;</button>
        <span style="font-size:13px;color:var(--text-secondary);margin-left:8px;">${itensPeca.length} pecas vendidas</span>
      </div>

      <!-- KPIs -->
      <div class="kpi-grid" style="margin-bottom:20px;">
        <div class="kpi-card">
          <div class="label">Vendeu por</div>
          <div class="value success">${APP.formatMoney(totalVenda)}</div>
        </div>
        <div class="kpi-card">
          <div class="label">Custou</div>
          <div class="value" style="color:var(--danger);">${APP.formatMoney(totalCusto)}</div>
        </div>
        <div class="kpi-card">
          <div class="label">Lucro bruto</div>
          <div class="value" style="color:${lucroBruto >= 0 ? 'var(--success)' : 'var(--danger)'};">${APP.formatMoney(lucroBruto)}</div>
          <div style="font-size:11px;color:var(--text-muted);">Margem ${margem.toFixed(1)}%</div>
        </div>
        <div class="kpi-card">
          <div class="label">Lucro liquido</div>
          <div class="value" style="color:var(--warning);font-size:22px;">${APP.formatMoney(lucroLiq)}</div>
          <div style="font-size:11px;color:var(--text-muted);">-${APP.formatMoney(taxaProp)} taxas</div>
        </div>
      </div>

      <!-- Ranking -->
      <div style="background:var(--bg-card);border:1px solid var(--border);border-radius:var(--radius-lg);overflow:hidden;">
        <div style="padding:14px 20px;border-bottom:1px solid var(--border);">
          <h3 style="font-size:14px;">Pecas mais vendidas</h3>
        </div>
        ${rankList.length ? (_mob ? `
        <div class="mobile-card-list" style="padding:10px;">
          ${rankList.slice(0, 20).map((p, i) => `
            <div class="mobile-card">
              <div class="mobile-card-header">
                <div>
                  <div class="mobile-card-title">${i + 1}. ${esc(p.nome)}</div>
                  <div class="mobile-card-subtitle">${p.qtd}x · Custo ${APP.formatMoney(p.custo)} · Vendeu ${APP.formatMoney(p.venda)}</div>
                </div>
                <span style="font-weight:700;color:${p.lucro >= 0 ? 'var(--success)' : 'var(--danger)'};">+${APP.formatMoney(p.lucro)}</span>
              </div>
            </div>
          `).join('')}
        </div>` : `
        <table class="data-table">
          <thead>
            <tr><th>#</th><th>Peca</th><th style="text-align:center;">Qtd</th><th style="text-align:right;">Custo</th><th style="text-align:right;">Vendeu</th><th style="text-align:right;">Lucro</th></tr>
          </thead>
          <tbody>
            ${rankList.slice(0, 20).map((p, i) => `
              <tr>
                <td style="font-weight:700;color:var(--text-muted);">${i + 1}</td>
                <td><strong>${esc(p.nome)}</strong></td>
                <td style="text-align:center;">${p.qtd}</td>
                <td style="text-align:right;color:var(--danger);">${APP.formatMoney(p.custo)}</td>
                <td style="text-align:right;">${APP.formatMoney(p.venda)}</td>
                <td style="text-align:right;font-weight:700;color:${p.lucro >= 0 ? 'var(--success)' : 'var(--danger)'};">${APP.formatMoney(p.lucro)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>`) : '<div style="padding:30px;text-align:center;color:var(--text-muted);">Nenhuma peca vendida nesse mes</div>'}
      </div>
    `;
  },

  _catLabel(cat) {
    const labels = {
      servico: 'Servico', peca: 'Peca', despesa: 'Despesa', retirada: 'Retirada',
      aporte: 'Aporte', outro: 'Outro', aluguel: 'Aluguel', conta_luz: 'Conta de Luz',
      conta_agua: 'Conta de Água', internet: 'Internet', fornecedor: 'Fornecedor',
      boleto: 'Boleto', material: 'Material', combustivel: 'Combustível', manutencao: 'Manutenção',
      vale: 'Vale funcionario'
    };
    return labels[cat] || cat;
  },

  novaMovimentacao(tipo) {
    const categorias = tipo === 'entrada'
      ? [['aporte', 'Aporte de capital'], ['outro', 'Outra entrada']]
      : [['despesa', 'Despesa operacional'], ['retirada', 'Retirada / Pro-labore'], ['outro', 'Outra saida']];

    openModal(`
      <div class="modal-header">
        <h3>${tipo === 'entrada' ? 'Nova Entrada' : 'Nova Saida'}</h3>
        <button class="modal-close" onclick="closeModal()">&times;</button>
      </div>
      <div class="modal-body">
        <form onsubmit="FINANCEIRO.salvar(event, '${tipo}')">
          <div class="form-group">
            <label>Categoria</label>
            <select class="form-control" id="fin-categoria" required>
              ${categorias.map(([v, l]) => `<option value="${v}">${l}</option>`).join('')}
            </select>
          </div>
          <div class="form-group">
            <label>Descricao *</label>
            <input type="text" class="form-control" id="fin-descricao" required placeholder="Ex: Aluguel, Conta de luz, Compra de material...">
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
            <div class="form-group">
              <label>Valor (R$) *</label>
              <input type="number" class="form-control" id="fin-valor" required min="0.01" step="0.01" placeholder="0,00">
            </div>
            <div class="form-group">
              <label>Forma de pagamento</label>
              <select class="form-control" id="fin-forma">
                <option value="dinheiro">Dinheiro</option>
                <option value="pix">Pix</option>
                <option value="debito">Debito</option>
                <option value="credito">Credito</option>
                <option value="boleto">Boleto</option>
                <option value="transferencia">Transferencia</option>
              </select>
            </div>
          </div>
          <div class="modal-footer" style="padding:16px 0 0;border:0;">
            <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancelar</button>
            <button type="submit" class="btn ${tipo === 'entrada' ? 'btn-success' : 'btn-danger'}">Registrar</button>
          </div>
        </form>
      </div>
    `);
  },

  async salvar(e, tipo) {
    e.preventDefault();
    const { error } = await db.from('caixa').insert({
      oficina_id: APP.oficinaId,
      tipo,
      categoria: document.getElementById('fin-categoria').value,
      descricao: document.getElementById('fin-descricao').value.trim(),
      valor: parseFloat(document.getElementById('fin-valor').value) || 0,
      forma_pagamento: document.getElementById('fin-forma').value,
      created_by: APP.profile.id
    });

    if (error) { APP.toast('Erro: ' + error.message, 'error'); return; }
    closeModal();
    APP.toast('Lancamento registrado');
    this.carregar();
  },

  async excluir(id) {
    if (!confirm('Excluir este lancamento?')) return;
    const { error } = await db.from('caixa').delete().eq('id', id).eq('oficina_id', APP.oficinaId);
    if (error) { APP.toast('Erro: ' + error.message, 'error'); return; }
    APP.toast('Lancamento excluido');
    this.carregar();
  },

  // ==================== PDF Fechamento ====================
  async _gerarPDFFechamento() {
    try {
      await PDF_OS._carregarLogo();
      const oficina = APP.oficina || {};
      const hoje = new Date().toISOString().split('T')[0];
      const fmt = v => (v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

      const [osRes, caixaRes] = await Promise.all([
        db.from('ordens_servico')
          .select('numero, valor_total, valor_mao_obra, valor_pecas, forma_pagamento, taxa_cartao, veiculos(placa), clientes(nome)')
          .eq('oficina_id', APP.oficinaId).eq('status', 'entregue').eq('pago', true).gte('data_entrega', hoje),
        db.from('caixa').select('*').eq('oficina_id', APP.oficinaId).gte('created_at', hoje)
      ]);

      const oss = osRes.data || [];
      const movs = caixaRes.data || [];
      const faturamento = oss.reduce((s, o) => s + (o.valor_total || 0), 0);
      const taxas = oss.reduce((s, o) => s + (o.valor_total * (o.taxa_cartao || 0) / 100), 0);
      const saidas = movs.filter(m => m.tipo === 'saida').reduce((s, m) => s + (m.valor || 0), 0);
      const liquido = faturamento - taxas - saidas;

      const formaLabel = { dinheiro: 'Dinheiro', pix: 'Pix', debito: 'Débito', credito: 'Crédito', boleto: 'Boleto', transferencia: 'Transferência', outros: 'Outros' };
      const header = PDF_OS._montarHeader(oficina, 'FECHAMENTO DO DIA');

      const doc = {
        pageSize: 'A4',
        pageMargins: [40, 30, 40, 50],
        content: [
          ...header.filter(h => h && (h.text || h.columns || h.canvas)),
          { text: new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }), fontSize: 12, alignment: 'center', color: '#666', margin: [0, 0, 0, 16] },
          {
            table: {
              widths: ['*', '*', '*', '*'],
              body: [[
                { stack: [{ text: 'FATURAMENTO', fontSize: 8, color: '#666' }, { text: fmt(faturamento), fontSize: 14, bold: true, color: '#3fb950' }], alignment: 'center' },
                { stack: [{ text: 'TAXAS', fontSize: 8, color: '#666' }, { text: '-' + fmt(taxas), fontSize: 14, bold: true, color: '#f85149' }], alignment: 'center' },
                { stack: [{ text: 'SAÍDAS', fontSize: 8, color: '#666' }, { text: '-' + fmt(saidas), fontSize: 14, bold: true, color: '#f85149' }], alignment: 'center' },
                { stack: [{ text: 'LÍQUIDO', fontSize: 8, color: '#666' }, { text: fmt(liquido), fontSize: 16, bold: true, color: liquido >= 0 ? '#3fb950' : '#f85149' }], alignment: 'center' }
              ]]
            },
            layout: { hLineWidth: () => 0, vLineWidth: () => 0.3, vLineColor: () => '#ddd', paddingTop: () => 10, paddingBottom: () => 10 },
            margin: [0, 0, 0, 20]
          },
          { text: `OS ENTREGUES (${oss.length})`, fontSize: 10, bold: true, margin: [0, 0, 0, 6] },
          oss.length ? {
            table: {
              headerRows: 1,
              widths: [35, '*', '*', 60, 60, 40, 60],
              body: [
                ['OS', 'Veículo', 'Cliente', 'Pagamento', 'Bruto', 'Taxa', 'Líquido'].map(t => ({ text: t, fontSize: 9, bold: true, color: '#666' })),
                ...oss.map(o => {
                  const tx = o.taxa_cartao || 0;
                  return [
                    { text: '#' + (o.numero || '-'), fontSize: 9 },
                    { text: o.veiculos?.placa || '-', fontSize: 9 },
                    { text: o.clientes?.nome || '-', fontSize: 9 },
                    { text: formaLabel[o.forma_pagamento] || '-', fontSize: 9 },
                    { text: fmt(o.valor_total), fontSize: 9, color: '#3fb950' },
                    { text: tx > 0 ? tx + '%' : '-', fontSize: 9, color: '#f85149' },
                    { text: fmt(o.valor_total - (o.valor_total * tx / 100)), fontSize: 9, bold: true }
                  ];
                })
              ]
            },
            layout: { hLineWidth: (i, node) => (i <= 1 || i === node.table.body.length) ? 0.5 : 0.3, vLineWidth: () => 0, hLineColor: () => '#ccc', paddingLeft: () => 4, paddingRight: () => 4, paddingTop: () => 3, paddingBottom: () => 3 },
            margin: [0, 0, 0, 16]
          } : { text: 'Nenhuma OS', fontSize: 10, italics: true, color: '#999' }
        ],
        footer: PDF_OS._footer(),
        styles: PDF_OS._styles()
      };

      const pdf = pdfMake.createPdf(doc);
      pdf.getBlob((blob) => {
        const url = URL.createObjectURL(blob);
        if (window.innerWidth <= 768) {
          const a = document.createElement('a'); a.href = url; a.download = 'fechamento-' + hoje + '.pdf'; a.click(); URL.revokeObjectURL(url);
        } else { window.open(url, '_blank'); }
      });
    } catch (e) { APP.toast('Erro ao gerar PDF: ' + e.message, 'error'); console.error(e); }
  },

  // ==================== PDF Caixa ====================
  async gerarPDF() {
    try {
    await PDF_OS._carregarLogo();
    const oficina = APP.oficina || {};
    const oficina_id = APP.oficinaId;
    const periodoLabel = { hoje: 'Hoje', semana: 'Esta semana', mes: 'Este mês' };
    const formaLabel = { dinheiro: 'Dinheiro', pix: 'Pix', debito: 'Débito', credito: 'Crédito', boleto: 'Boleto', transferencia: 'Transferência', outros: 'Outros' };
    const agora = new Date();
    const hoje = agora.toISOString().split('T')[0];
    const inicioSemana = new Date(agora); inicioSemana.setDate(agora.getDate() - agora.getDay());
    const inicioMes = new Date(agora.getFullYear(), agora.getMonth(), 1);

    let dataInicio;
    if (this._periodo === 'hoje') dataInicio = hoje;
    else if (this._periodo === 'semana') dataInicio = inicioSemana.toISOString().split('T')[0];
    else dataInicio = inicioMes.toISOString().split('T')[0];

    const [caixaRes, osRes] = await Promise.all([
      db.from('caixa').select('*').eq('oficina_id', oficina_id).gte('created_at', dataInicio).order('created_at'),
      db.from('ordens_servico').select('numero, valor_total, forma_pagamento, data_entrega, veiculos(placa), clientes(nome)')
        .eq('oficina_id', oficina_id).eq('pago', true).gte('data_entrega', dataInicio).order('data_entrega')
    ]);

    const movs = caixaRes.data || [];
    const oss = osRes.data || [];
    const totalOS = oss.reduce((s, o) => s + (o.valor_total || 0), 0);
    const totalEntradas = movs.filter(m => m.tipo === 'entrada').reduce((s, m) => s + (m.valor || 0), 0);
    const totalSaidas = movs.filter(m => m.tipo === 'saida').reduce((s, m) => s + (m.valor || 0), 0);
    const saldo = totalEntradas + totalOS - totalSaidas;

    const porForma = {};
    oss.forEach(o => { const f = o.forma_pagamento || 'outros'; porForma[f] = (porForma[f] || 0) + (o.valor_total || 0); });
    movs.filter(m => m.tipo === 'entrada').forEach(m => { const f = m.forma_pagamento || 'outros'; porForma[f] = (porForma[f] || 0) + (m.valor || 0); });

    const header = PDF_OS._montarHeader(oficina, 'RELATÓRIO FINANCEIRO');
    const fmt = v => (v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

    const doc = {
      pageSize: 'A4',
      pageMargins: [40, 30, 40, 50],
      content: [
        ...header.filter(h => h && (h.text || h.columns || h.canvas)),
        { text: periodoLabel[this._periodo] || 'Período', fontSize: 11, color: '#666', margin: [0, 0, 0, 14] },
        {
          table: {
            widths: ['*', '*', '*', '*'],
            body: [[
              { stack: [{ text: 'ENTRADAS', fontSize: 8, color: '#666' }, { text: fmt(totalEntradas + totalOS), fontSize: 14, bold: true, color: '#3fb950' }], alignment: 'center' },
              { stack: [{ text: 'SAÍDAS', fontSize: 8, color: '#666' }, { text: fmt(totalSaidas), fontSize: 14, bold: true, color: '#f85149' }], alignment: 'center' },
              { stack: [{ text: 'SALDO', fontSize: 8, color: '#666' }, { text: fmt(saldo), fontSize: 14, bold: true, color: saldo >= 0 ? '#3fb950' : '#f85149' }], alignment: 'center' },
              { stack: [{ text: 'OS PAGAS', fontSize: 8, color: '#666' }, { text: String(oss.length), fontSize: 14, bold: true, color: '#D97706' }], alignment: 'center' }
            ]]
          },
          layout: { hLineWidth: () => 0, vLineWidth: () => 0.3, vLineColor: () => '#ddd', paddingTop: () => 10, paddingBottom: () => 10, paddingLeft: () => 8, paddingRight: () => 8 },
          margin: [0, 0, 0, 20]
        },
        ...(Object.keys(porForma).length ? [
          { text: 'RECEBIMENTOS POR FORMA DE PAGAMENTO', fontSize: 10, bold: true, color: '#333', margin: [0, 0, 0, 8] },
          {
            table: {
              widths: ['*', 100],
              body: Object.entries(porForma).sort((a, b) => b[1] - a[1]).map(([f, v]) => [
                { text: formaLabel[f] || f, fontSize: 10 },
                { text: fmt(v), fontSize: 10, bold: true, color: '#3fb950', alignment: 'right' }
              ])
            },
            layout: { hLineWidth: (i) => i === 0 ? 0 : 0.3, vLineWidth: () => 0, hLineColor: () => '#eee', paddingTop: () => 4, paddingBottom: () => 4, paddingLeft: () => 4, paddingRight: () => 4 },
            margin: [0, 0, 0, 20]
          }
        ] : []),
        { text: `OS PAGAS (${oss.length})`, fontSize: 10, bold: true, color: '#333', fillColor: '#f0f0f0', margin: [0, 0, 0, 6] },
        oss.length ? {
          table: {
            headerRows: 1,
            widths: [35, '*', '*', 65, 70],
            body: [
              [
                { text: 'OS', fontSize: 9, bold: true, color: '#666' },
                { text: 'Veículo', fontSize: 9, bold: true, color: '#666' },
                { text: 'Cliente', fontSize: 9, bold: true, color: '#666' },
                { text: 'Pagamento', fontSize: 9, bold: true, color: '#666' },
                { text: 'Valor', fontSize: 9, bold: true, color: '#666', alignment: 'right' }
              ],
              ...oss.map(o => [
                { text: '#' + (o.numero || '-'), fontSize: 9 },
                { text: o.veiculos?.placa || '-', fontSize: 9, bold: true },
                { text: o.clientes?.nome || '-', fontSize: 9 },
                { text: formaLabel[o.forma_pagamento] || o.forma_pagamento || '-', fontSize: 9 },
                { text: fmt(o.valor_total), fontSize: 9, bold: true, color: '#3fb950', alignment: 'right' }
              ]),
              [
                { text: 'TOTAL', fontSize: 9, bold: true, colSpan: 4 }, {}, {}, {},
                { text: fmt(totalOS), fontSize: 10, bold: true, color: '#3fb950', alignment: 'right' }
              ]
            ]
          },
          layout: {
            hLineWidth: (i, node) => (i === 0 || i === 1 || i === node.table.body.length) ? 0.5 : 0.3,
            vLineWidth: () => 0.3, hLineColor: () => '#ccc', vLineColor: () => '#eee',
            paddingLeft: () => 6, paddingRight: () => 6, paddingTop: () => 4, paddingBottom: () => 4
          },
          margin: [0, 0, 0, 20]
        } : { text: 'Nenhuma OS paga no período', fontSize: 10, italics: true, color: '#999', margin: [0, 0, 0, 20] },
        { text: `MOVIMENTAÇÕES DO CAIXA (${movs.length})`, fontSize: 10, bold: true, color: '#333', margin: [0, 0, 0, 6] },
        movs.length ? {
          table: {
            headerRows: 1,
            widths: [50, 70, '*', 70],
            body: [
              [
                { text: 'Tipo', fontSize: 9, bold: true, color: '#666' },
                { text: 'Categoria', fontSize: 9, bold: true, color: '#666' },
                { text: 'Descrição', fontSize: 9, bold: true, color: '#666' },
                { text: 'Valor', fontSize: 9, bold: true, color: '#666', alignment: 'right' }
              ],
              ...movs.map(m => [
                { text: m.tipo === 'entrada' ? 'Entrada' : 'Saída', fontSize: 9, color: m.tipo === 'entrada' ? '#3fb950' : '#f85149', bold: true },
                { text: FINANCEIRO._catLabel(m.categoria), fontSize: 9 },
                { text: m.descricao || '-', fontSize: 9 },
                { text: (m.tipo === 'saida' ? '- ' : '') + fmt(m.valor), fontSize: 9, bold: true, color: m.tipo === 'entrada' ? '#3fb950' : '#f85149', alignment: 'right' }
              ])
            ]
          },
          layout: {
            hLineWidth: (i, node) => (i === 0 || i === 1 || i === node.table.body.length) ? 0.5 : 0.3,
            vLineWidth: () => 0.3, hLineColor: () => '#ccc', vLineColor: () => '#eee',
            paddingLeft: () => 6, paddingRight: () => 6, paddingTop: () => 4, paddingBottom: () => 4
          },
          margin: [0, 0, 0, 14]
        } : { text: 'Nenhuma movimentação no período', fontSize: 10, italics: true, color: '#999' },
      ],
      footer: PDF_OS._footer(),
      styles: PDF_OS._styles()
    };

    const pdf = pdfMake.createPdf(doc);
    pdf.getBlob((blob) => {
      const url = URL.createObjectURL(blob);
      if (window.innerWidth <= 768) {
        const a = document.createElement('a'); a.href = url; a.download = 'financeiro-' + this._periodo + '.pdf'; a.click(); URL.revokeObjectURL(url);
      } else { window.open(url, '_blank'); }
    });
    } catch(e) { APP.toast('Erro ao gerar PDF: ' + e.message, 'error'); console.error(e); }
  }
};

document.addEventListener('pageLoad', (e) => {
  if (e.detail.page === 'financeiro') FINANCEIRO.carregar();
});
