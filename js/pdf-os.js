// RPM Pro — PDF de OS e Recibo (pdfmake)
const PDF_OS = {
  _logoBase64: null,

  async _carregarLogo() {
    const url = APP.oficina?.logo_url;
    if (!url || this._logoBase64) return;
    try {
      const res = await fetch(url);
      const blob = await res.blob();
      return new Promise(resolve => {
        const reader = new FileReader();
        reader.onload = () => { this._logoBase64 = reader.result; resolve(); };
        reader.onerror = () => resolve();
        reader.readAsDataURL(blob);
      });
    } catch (e) { /* ignora se não conseguir */ }
  },

  async _buscarDados(osId) {
    const [osRes, itensRes] = await Promise.all([
      db.from('ordens_servico')
        .select('*, veiculos(placa, marca, modelo, ano, cor, km_atual), clientes(nome, cpf_cnpj, whatsapp, telefone), profiles!ordens_servico_mecanico_id_fkey(nome)')
        .eq('id', osId).single(),
      db.from('itens_os')
        .select('*')
        .eq('os_id', osId)
        .order('tipo', { ascending: false })
        .order('created_at')
    ]);

    if (!osRes.data) { APP.toast('OS nao encontrada', 'error'); return null; }

    const oficina = APP.oficina;
    return { os: osRes.data, itens: itensRes.data || [], oficina };
  },

  async gerar(osId) {
    await this._carregarLogo();
    const dados = await this._buscarDados(osId);
    if (!dados) return;

    const { os, itens, oficina } = dados;
    const servicos = itens.filter(i => i.tipo === 'servico');
    const pecas = itens.filter(i => i.tipo === 'peca');
    const totalServicos = servicos.reduce((s, i) => s + (i.valor_total || 0), 0);
    const totalPecas = pecas.reduce((s, i) => s + (i.valor_total || 0), 0);
    const desconto = os.desconto || 0;
    const totalGeral = totalServicos + totalPecas - desconto;

    const statusLabel = {
      entrada: 'Entrada', diagnostico: 'Diagnostico', orcamento: 'Orcamento',
      aprovada: 'Aprovada', aguardando_peca: 'Aguardando Peca', execucao: 'Em execucao',
      pronto: 'Pronto', entregue: 'Entregue', cancelada: 'Cancelada'
    };

    const pagLabel = {
      dinheiro: 'Dinheiro', pix: 'Pix', debito: 'Debito',
      credito: 'Credito', boleto: 'Boleto', pendente: 'Pendente'
    };

    // Header — logo da oficina como protagonista
    const headerLeft = [];
    if (oficina.logo_url && this._logoBase64) {
      headerLeft.push({ image: this._logoBase64, width: 80, margin: [0, 0, 0, 4] });
    }
    headerLeft.push({ text: oficina.nome || 'Oficina', style: 'headerOficina' });

    const header = {
      columns: [
        { stack: headerLeft, width: '*' },
        {
          stack: [
            oficina.cnpj ? { text: 'CNPJ: ' + oficina.cnpj, style: 'headerInfo' } : {},
            oficina.telefone ? { text: 'Tel: ' + oficina.telefone, style: 'headerInfo' } : {},
            oficina.whatsapp ? { text: 'WhatsApp: ' + oficina.whatsapp, style: 'headerInfo' } : {},
            oficina.endereco ? { text: oficina.endereco + (oficina.cidade ? ' — ' + oficina.cidade + '/' + (oficina.estado || 'PE') : ''), style: 'headerInfo' } : {}
          ],
          alignment: 'right'
        }
      ],
      margin: [0, 0, 0, 15]
    };

    // Dados da OS
    const infoOS = {
      table: {
        widths: ['*', '*', '*', '*'],
        body: [
          [
            { text: 'OS #' + (os.numero || '-'), style: 'infoLabel', colSpan: 1 },
            { text: 'Data: ' + APP.formatDate(os.data_entrada), style: 'infoVal' },
            { text: 'Status: ' + (statusLabel[os.status] || os.status), style: 'infoVal' },
            { text: 'KM: ' + (os.km_entrada ? os.km_entrada.toLocaleString('pt-BR') : '-'), style: 'infoVal' }
          ],
          [
            { text: 'Placa: ' + (os.veiculos?.placa || '-'), style: 'infoVal' },
            { text: 'Veiculo: ' + [os.veiculos?.marca, os.veiculos?.modelo, os.veiculos?.ano].filter(Boolean).join(' '), style: 'infoVal', colSpan: 2 },
            {},
            { text: 'Cor: ' + (os.veiculos?.cor || '-'), style: 'infoVal' }
          ],
          [
            { text: 'Cliente: ' + (os.clientes?.nome || '-'), style: 'infoVal', colSpan: 2 },
            {},
            { text: 'Mecanico: ' + (os.profiles?.nome || 'Nao definido'), style: 'infoVal', colSpan: 2 },
            {}
          ]
        ]
      },
      layout: {
        hLineWidth: () => 0.5,
        vLineWidth: () => 0.5,
        hLineColor: () => '#cccccc',
        vLineColor: () => '#cccccc',
        paddingLeft: () => 6,
        paddingRight: () => 6,
        paddingTop: () => 4,
        paddingBottom: () => 4
      },
      margin: [0, 0, 0, 12]
    };

    // Tabela de servicos
    const tabelaServicos = {
      table: {
        headerRows: 1,
        widths: ['*', 80],
        body: [
          [
            { text: 'SERVICOS (Mao de obra)', style: 'tableHeader', colSpan: 2 },
            {}
          ],
          ...servicos.map(s => [
            { text: s.descricao, style: 'tableCell' },
            { text: 'R$ ' + (s.valor_total || 0).toFixed(2), style: 'tableCellRight' }
          ]),
          ...(servicos.length === 0 ? [[{ text: 'Nenhum servico', style: 'tableEmpty', colSpan: 2 }, {}]] : []),
          [
            { text: 'Subtotal Servicos', style: 'tableSubtotal' },
            { text: 'R$ ' + totalServicos.toFixed(2), style: 'tableSubtotalRight' }
          ]
        ]
      },
      layout: {
        hLineWidth: (i, node) => (i === 0 || i === 1 || i === node.table.body.length) ? 0.5 : 0.3,
        vLineWidth: () => 0.5,
        hLineColor: () => '#cccccc',
        vLineColor: () => '#cccccc',
        paddingLeft: () => 6,
        paddingRight: () => 6,
        paddingTop: () => 3,
        paddingBottom: () => 3
      },
      margin: [0, 0, 0, 10]
    };

    // Tabela de pecas
    const tabelaPecas = {
      table: {
        headerRows: 1,
        widths: ['*', 35, 65, 70],
        body: [
          [
            { text: 'PECAS / MATERIAIS', style: 'tableHeader', colSpan: 4 },
            {}, {}, {}
          ],
          [
            { text: 'Descricao', style: 'tableColHeader' },
            { text: 'Qtd', style: 'tableColHeader', alignment: 'center' },
            { text: 'Valor Unit.', style: 'tableColHeader', alignment: 'right' },
            { text: 'Total', style: 'tableColHeader', alignment: 'right' }
          ],
          ...pecas.map(p => [
            { text: p.descricao, style: 'tableCell' },
            { text: String(p.quantidade || 1), style: 'tableCell', alignment: 'center' },
            { text: 'R$ ' + (p.valor_unitario || 0).toFixed(2), style: 'tableCellRight' },
            { text: 'R$ ' + (p.valor_total || 0).toFixed(2), style: 'tableCellRight' }
          ]),
          ...(pecas.length === 0 ? [[{ text: 'Nenhuma peca', style: 'tableEmpty', colSpan: 4 }, {}, {}, {}]] : []),
          [
            { text: 'Subtotal Pecas', style: 'tableSubtotal', colSpan: 3 },
            {}, {},
            { text: 'R$ ' + totalPecas.toFixed(2), style: 'tableSubtotalRight' }
          ]
        ]
      },
      layout: {
        hLineWidth: (i, node) => (i <= 2 || i === node.table.body.length) ? 0.5 : 0.3,
        vLineWidth: () => 0.5,
        hLineColor: () => '#cccccc',
        vLineColor: () => '#cccccc',
        paddingLeft: () => 6,
        paddingRight: () => 6,
        paddingTop: () => 3,
        paddingBottom: () => 3
      },
      margin: [0, 0, 0, 10]
    };

    // Totais
    const blocoTotais = {
      table: {
        widths: ['*', 120],
        body: [
          [{ text: 'Servicos', style: 'totalLabel' }, { text: 'R$ ' + totalServicos.toFixed(2), style: 'totalVal' }],
          [{ text: 'Pecas', style: 'totalLabel' }, { text: 'R$ ' + totalPecas.toFixed(2), style: 'totalVal' }],
          ...(desconto > 0 ? [[{ text: 'Desconto', style: 'totalLabel' }, { text: '- R$ ' + desconto.toFixed(2), style: 'totalValDesconto' }]] : []),
          [
            { text: 'TOTAL', style: 'totalFinal' },
            { text: 'R$ ' + totalGeral.toFixed(2), style: 'totalFinalVal' }
          ]
        ]
      },
      layout: {
        hLineWidth: (i, node) => i === node.table.body.length - 1 ? 1 : 0.3,
        vLineWidth: () => 0,
        hLineColor: () => '#333333',
        paddingLeft: () => 6,
        paddingRight: () => 6,
        paddingTop: () => 4,
        paddingBottom: () => 4
      },
      margin: [0, 0, 0, 12]
    };

    // Pagamento
    const infoPagamento = os.forma_pagamento && os.forma_pagamento !== 'pendente'
      ? { text: 'Forma de pagamento: ' + (pagLabel[os.forma_pagamento] || os.forma_pagamento), style: 'obs', margin: [0, 0, 0, 6] }
      : { text: 'Pagamento: Pendente', style: 'obs', color: '#e63e00', margin: [0, 0, 0, 6] };

    // Observacoes
    const obs = os.observacoes || os.descricao
      ? { text: 'Obs: ' + (os.observacoes || os.descricao), style: 'obs', margin: [0, 0, 0, 12] }
      : {};

    const docDef = {
      pageSize: 'A4',
      pageMargins: [40, 30, 40, 50],
      content: [
        header,
        { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 1, lineColor: '#FF4500' }], margin: [0, 0, 0, 12] },
        infoOS,
        tabelaServicos,
        tabelaPecas,
        blocoTotais,
        infoPagamento,
        obs
      ],
      footer: {
        text: 'Powered by RPM Pro — rpmpro.com.br',
        alignment: 'center',
        style: 'footer'
      },
      styles: {
        headerRpm: { fontSize: 22, bold: true, color: '#FF4500' },
        headerPro: { fontSize: 22, bold: true, color: '#333333' },
        headerOficina: { fontSize: 14, bold: true, color: '#333333' },
        headerInfo: { fontSize: 9, color: '#666666' },
        infoLabel: { fontSize: 11, bold: true, color: '#333333' },
        infoVal: { fontSize: 10, color: '#444444' },
        tableHeader: { fontSize: 11, bold: true, color: '#333333', fillColor: '#f5f5f5' },
        tableColHeader: { fontSize: 9, bold: true, color: '#666666' },
        tableCell: { fontSize: 10, color: '#333333' },
        tableCellRight: { fontSize: 10, color: '#333333', alignment: 'right' },
        tableEmpty: { fontSize: 10, color: '#999999', italics: true },
        tableSubtotal: { fontSize: 10, bold: true, color: '#333333', fillColor: '#f9f9f9' },
        tableSubtotalRight: { fontSize: 10, bold: true, color: '#333333', alignment: 'right', fillColor: '#f9f9f9' },
        totalLabel: { fontSize: 10, color: '#555555' },
        totalVal: { fontSize: 10, color: '#333333', alignment: 'right' },
        totalValDesconto: { fontSize: 10, color: '#e63e00', alignment: 'right' },
        totalFinal: { fontSize: 14, bold: true, color: '#000000' },
        totalFinalVal: { fontSize: 14, bold: true, color: '#2e7d32', alignment: 'right' },
        obs: { fontSize: 9, color: '#666666' },
        footer: { fontSize: 8, color: '#999999', margin: [40, 10, 40, 0] }
      }
    };

    pdfMake.createPdf(docDef).open();
  },

  async recibo(osId) {
    const dados = await this._buscarDados(osId);
    if (!dados) return;

    const { os, itens, oficina } = dados;
    const totalServicos = itens.filter(i => i.tipo === 'servico').reduce((s, i) => s + (i.valor_total || 0), 0);
    const totalPecas = itens.filter(i => i.tipo === 'peca').reduce((s, i) => s + (i.valor_total || 0), 0);
    const desconto = os.desconto || 0;
    const totalGeral = totalServicos + totalPecas - desconto;

    const pagLabel = {
      dinheiro: 'Dinheiro', pix: 'Pix', debito: 'Debito',
      credito: 'Credito', boleto: 'Boleto', pendente: 'Pendente'
    };

    const docDef = {
      pageSize: 'A4',
      pageMargins: [40, 30, 40, 50],
      content: [
        {
          columns: [
            { text: [{ text: 'RPM ', bold: true, color: '#FF4500', fontSize: 18 }, { text: 'PRO', bold: true, fontSize: 18 }], width: 'auto' },
            { text: oficina.nome || 'Oficina', alignment: 'right', fontSize: 12, bold: true }
          ],
          margin: [0, 0, 0, 8]
        },
        { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 1, lineColor: '#FF4500' }], margin: [0, 0, 0, 15] },
        { text: 'RECIBO DE SERVICO', fontSize: 16, bold: true, alignment: 'center', margin: [0, 0, 0, 15] },
        {
          table: {
            widths: ['*', '*'],
            body: [
              [{ text: 'OS #' + (os.numero || '-'), fontSize: 11, bold: true }, { text: 'Data: ' + APP.formatDate(os.data_entrada), fontSize: 11, alignment: 'right' }],
              [{ text: 'Cliente: ' + (os.clientes?.nome || '-'), fontSize: 11, colSpan: 2 }, {}],
              [{ text: 'Veiculo: ' + (os.veiculos?.placa || '') + ' — ' + [os.veiculos?.marca, os.veiculos?.modelo].filter(Boolean).join(' '), fontSize: 11, colSpan: 2 }, {}]
            ]
          },
          layout: {
            hLineWidth: () => 0.3,
            vLineWidth: () => 0,
            hLineColor: () => '#dddddd',
            paddingTop: () => 5,
            paddingBottom: () => 5,
            paddingLeft: () => 4,
            paddingRight: () => 4
          },
          margin: [0, 0, 0, 20]
        },
        {
          table: {
            widths: ['*', 100],
            body: [
              [{ text: 'Servicos', fontSize: 11 }, { text: 'R$ ' + totalServicos.toFixed(2), fontSize: 11, alignment: 'right' }],
              [{ text: 'Pecas / Materiais', fontSize: 11 }, { text: 'R$ ' + totalPecas.toFixed(2), fontSize: 11, alignment: 'right' }],
              ...(desconto > 0 ? [[{ text: 'Desconto', fontSize: 11 }, { text: '- R$ ' + desconto.toFixed(2), fontSize: 11, alignment: 'right', color: '#e63e00' }]] : []),
              [
                { text: 'TOTAL', fontSize: 14, bold: true },
                { text: 'R$ ' + totalGeral.toFixed(2), fontSize: 14, bold: true, alignment: 'right', color: '#2e7d32' }
              ]
            ]
          },
          layout: {
            hLineWidth: (i, node) => i === node.table.body.length - 1 ? 1 : 0.3,
            vLineWidth: () => 0,
            hLineColor: () => '#cccccc',
            paddingTop: () => 6,
            paddingBottom: () => 6,
            paddingLeft: () => 4,
            paddingRight: () => 4
          },
          margin: [0, 0, 0, 15]
        },
        {
          text: 'Forma de pagamento: ' + (pagLabel[os.forma_pagamento] || 'Pendente'),
          fontSize: 11,
          bold: true,
          margin: [0, 0, 0, 30]
        },
        {
          columns: [
            { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 200, y2: 0, lineWidth: 0.5 }], width: 220 },
            { text: '', width: '*' },
            { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 200, y2: 0, lineWidth: 0.5 }], width: 220 }
          ],
          margin: [0, 0, 0, 4]
        },
        {
          columns: [
            { text: 'Assinatura do cliente', fontSize: 9, color: '#999999', alignment: 'center', width: 220 },
            { text: '', width: '*' },
            { text: 'Assinatura da oficina', fontSize: 9, color: '#999999', alignment: 'center', width: 220 }
          ]
        }
      ],
      footer: {
        text: 'Powered by RPM Pro — rpmpro.com.br',
        alignment: 'center',
        fontSize: 8,
        color: '#999999',
        margin: [40, 10, 40, 0]
      }
    };

    pdfMake.createPdf(docDef).open();
  }
};
