// RPM Pro — PDF de OS e Recibo (pdfmake)
const PDF_OS = {
  _logoBase64: null,

  async _carregarLogo() {
    const url = APP.oficina?.logo_url;
    if (!url) return;
    if (this._logoBase64) return;
    try {
      // Carrega via Image pra garantir que é imagem válida, depois converte pra canvas → dataURL
      return new Promise(resolve => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
          try {
            const canvas = document.createElement('canvas');
            canvas.width = img.naturalWidth;
            canvas.height = img.naturalHeight;
            canvas.getContext('2d').drawImage(img, 0, 0);
            this._logoBase64 = canvas.toDataURL('image/png');
          } catch(e) { this._logoBase64 = null; }
          resolve();
        };
        img.onerror = () => { this._logoBase64 = null; resolve(); };
        img.src = url;
      });
    } catch (e) { this._logoBase64 = null; }
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

  _formatMoney(val) {
    return (val || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  },

  _montarHeader(oficina, titulo) {
    // Monta endereço completo
    const partes = [];
    if (oficina.endereco) {
      let rua = oficina.endereco;
      if (oficina.numero) rua += ', ' + oficina.numero;
      partes.push(rua);
    }
    if (oficina.bairro) partes.push(oficina.bairro);
    if (oficina.cidade) partes.push(oficina.cidade + (oficina.estado ? '/' + oficina.estado : ''));
    const endereco = partes.join(' — ');

    // Coluna esquerda: logo oficina + nome
    const headerLeft = [];
    if (oficina.logo_url && this._logoBase64 && this._logoBase64.startsWith('data:image/')) {
      headerLeft.push({ image: this._logoBase64, width: 80, margin: [0, 0, 0, 4] });
    }
    headerLeft.push({ text: oficina.nome || 'Oficina', fontSize: 16, bold: true, color: '#1a1a1a' });

    // Coluna direita: dados da oficina + RPM PRO
    const infoLines = [];
    if (oficina.cnpj) infoLines.push({ text: 'CNPJ: ' + oficina.cnpj, style: 'headerInfo' });
    if (oficina.telefone) infoLines.push({ text: 'Tel: ' + oficina.telefone, style: 'headerInfo' });
    if (oficina.whatsapp) infoLines.push({ text: 'WhatsApp: ' + oficina.whatsapp, style: 'headerInfo' });
    if (endereco) infoLines.push({ text: endereco, style: 'headerInfo' });

    return [
      // RPM PRO marca — topo direito, discreto mas visível
      {
        columns: [
          { stack: headerLeft, width: '*' },
          {
            stack: [
              { text: [{ text: 'RPM ', bold: true, color: '#D97706', fontSize: 11 }, { text: 'PRO', bold: true, color: '#666666', fontSize: 11 }], alignment: 'right', margin: [0, 0, 0, 6] },
              ...infoLines
            ],
            alignment: 'right',
            width: 'auto'
          }
        ],
        margin: [0, 0, 0, 8]
      },
      { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 1.5, lineColor: '#D97706' }], margin: [0, 0, 0, 12] },
      titulo ? { text: titulo, fontSize: 16, bold: true, alignment: 'center', color: '#1a1a1a', margin: [0, 0, 0, 14] } : {}
    ];
  },

  _footer() {
    return {
      text: 'Powered by RPM Pro — rpmpro.com.br',
      alignment: 'center',
      fontSize: 8,
      color: '#999999',
      margin: [40, 10, 40, 0]
    };
  },

  _styles() {
    return {
      headerInfo: { fontSize: 9, color: '#666666' },
      infoLabel: { fontSize: 11, bold: true, color: '#1a1a1a' },
      infoVal: { fontSize: 10, color: '#444444' },
      sectionTitle: { fontSize: 11, bold: true, color: '#1a1a1a', fillColor: '#f0f0f0' },
      tableColHeader: { fontSize: 9, bold: true, color: '#666666', fillColor: '#fafafa' },
      tableCell: { fontSize: 10, color: '#333333' },
      tableCellRight: { fontSize: 10, color: '#333333', alignment: 'right' },
      tableEmpty: { fontSize: 10, color: '#999999', italics: true },
      tableSubtotal: { fontSize: 10, bold: true, color: '#1a1a1a', fillColor: '#f5f5f5' },
      tableSubtotalRight: { fontSize: 10, bold: true, color: '#1a1a1a', alignment: 'right', fillColor: '#f5f5f5' },
      totalLabel: { fontSize: 10, color: '#555555' },
      totalVal: { fontSize: 10, color: '#333333', alignment: 'right' },
      totalValDesconto: { fontSize: 10, color: '#B45309', alignment: 'right' },
      totalFinal: { fontSize: 14, bold: true, color: '#1a1a1a' },
      totalFinalVal: { fontSize: 14, bold: true, color: '#2e7d32', alignment: 'right' },
      obs: { fontSize: 9, color: '#666666' }
    };
  },

  // ========== OS ==========
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
      aprovada: 'Aprovada', aguardando_peca: 'Aguardando Peca', execucao: 'Em Execucao',
      pronto: 'Pronto', entregue: 'Entregue', cancelada: 'Cancelada'
    };

    const pagLabel = {
      dinheiro: 'Dinheiro', pix: 'Pix', debito: 'Debito',
      credito: 'Credito', boleto: 'Boleto', pendente: 'Pendente'
    };

    const header = this._montarHeader(oficina);

    // Dados da OS
    const veiculo = [os.veiculos?.marca, os.veiculos?.modelo, os.veiculos?.ano].filter(Boolean).join(' ');
    const infoOS = {
      table: {
        widths: ['*', '*', '*', '*'],
        body: [
          [
            { text: 'OS #' + (os.numero || '-'), style: 'infoLabel' },
            { text: 'Data: ' + APP.formatDate(os.data_entrada), style: 'infoVal' },
            { text: 'Status: ' + (statusLabel[os.status] || os.status), style: 'infoVal' },
            { text: os.km_entrada ? 'KM: ' + os.km_entrada.toLocaleString('pt-BR') : '', style: 'infoVal' }
          ],
          [
            { text: 'Placa: ' + (os.veiculos?.placa || '-'), style: 'infoVal' },
            { text: veiculo ? 'Veiculo: ' + veiculo : '', style: 'infoVal', colSpan: 2 },
            {},
            { text: os.veiculos?.cor ? 'Cor: ' + os.veiculos.cor : '', style: 'infoVal' }
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
        paddingTop: () => 5,
        paddingBottom: () => 5
      },
      margin: [0, 0, 0, 14]
    };

    // Tabela servicos
    const tabelaServicos = {
      table: {
        headerRows: 1,
        widths: ['*', 90],
        body: [
          [{ text: 'SERVICOS (Mao de obra)', style: 'sectionTitle', colSpan: 2 }, {}],
          ...servicos.map(s => [
            { text: s.descricao, style: 'tableCell' },
            { text: this._formatMoney(s.valor_total), style: 'tableCellRight' }
          ]),
          ...(servicos.length === 0 ? [[{ text: 'Nenhum servico registrado', style: 'tableEmpty', colSpan: 2 }, {}]] : []),
          [
            { text: 'Subtotal Servicos', style: 'tableSubtotal' },
            { text: this._formatMoney(totalServicos), style: 'tableSubtotalRight' }
          ]
        ]
      },
      layout: {
        hLineWidth: (i, node) => (i === 0 || i === 1 || i === node.table.body.length) ? 0.5 : 0.3,
        vLineWidth: () => 0.5,
        hLineColor: () => '#cccccc',
        vLineColor: () => '#cccccc',
        paddingLeft: () => 6, paddingRight: () => 6,
        paddingTop: () => 4, paddingBottom: () => 4
      },
      margin: [0, 0, 0, 10]
    };

    // Tabela pecas
    const tabelaPecas = {
      table: {
        headerRows: 2,
        widths: ['*', 35, 70, 80],
        body: [
          [{ text: 'PECAS / MATERIAIS', style: 'sectionTitle', colSpan: 4 }, {}, {}, {}],
          [
            { text: 'Descricao', style: 'tableColHeader' },
            { text: 'Qtd', style: 'tableColHeader', alignment: 'center' },
            { text: 'Valor Unit.', style: 'tableColHeader', alignment: 'right' },
            { text: 'Total', style: 'tableColHeader', alignment: 'right' }
          ],
          ...pecas.map(p => [
            { text: p.descricao, style: 'tableCell' },
            { text: String(p.quantidade || 1), style: 'tableCell', alignment: 'center' },
            { text: this._formatMoney(p.valor_unitario), style: 'tableCellRight' },
            { text: this._formatMoney(p.valor_total), style: 'tableCellRight' }
          ]),
          ...(pecas.length === 0 ? [[{ text: 'Nenhuma peca registrada', style: 'tableEmpty', colSpan: 4 }, {}, {}, {}]] : []),
          [
            { text: 'Subtotal Pecas', style: 'tableSubtotal', colSpan: 3 }, {}, {},
            { text: this._formatMoney(totalPecas), style: 'tableSubtotalRight' }
          ]
        ]
      },
      layout: {
        hLineWidth: (i, node) => (i <= 2 || i === node.table.body.length) ? 0.5 : 0.3,
        vLineWidth: () => 0.5,
        hLineColor: () => '#cccccc',
        vLineColor: () => '#cccccc',
        paddingLeft: () => 6, paddingRight: () => 6,
        paddingTop: () => 4, paddingBottom: () => 4
      },
      margin: [0, 0, 0, 10]
    };

    // Totais
    const linhasTotais = [
      [{ text: 'Servicos', style: 'totalLabel' }, { text: this._formatMoney(totalServicos), style: 'totalVal' }],
      [{ text: 'Pecas', style: 'totalLabel' }, { text: this._formatMoney(totalPecas), style: 'totalVal' }]
    ];
    if (desconto > 0) {
      linhasTotais.push([{ text: 'Desconto', style: 'totalLabel' }, { text: '- ' + this._formatMoney(desconto), style: 'totalValDesconto' }]);
    }
    linhasTotais.push([
      { text: 'TOTAL', style: 'totalFinal' },
      { text: this._formatMoney(totalGeral), style: 'totalFinalVal' }
    ]);

    const blocoTotais = {
      table: { widths: ['*', 120], body: linhasTotais },
      layout: {
        hLineWidth: (i, node) => i === node.table.body.length - 1 ? 1 : 0.3,
        vLineWidth: () => 0,
        hLineColor: () => '#333333',
        paddingLeft: () => 6, paddingRight: () => 6,
        paddingTop: () => 5, paddingBottom: () => 5
      },
      margin: [0, 0, 0, 14]
    };

    // Pagamento
    const infoPagamento = os.forma_pagamento && os.forma_pagamento !== 'pendente'
      ? { text: 'Forma de pagamento: ' + (pagLabel[os.forma_pagamento] || os.forma_pagamento), fontSize: 10, bold: true, margin: [0, 0, 0, 6] }
      : { text: 'Pagamento: Pendente', fontSize: 10, bold: true, color: '#B45309', margin: [0, 0, 0, 6] };

    // Observações
    const obsText = os.observacoes || os.descricao;
    const obs = obsText ? { text: 'Obs: ' + obsText, style: 'obs', margin: [0, 0, 0, 20] } : { text: '', margin: [0, 0, 0, 20] };

    // Assinaturas
    const assinaturas = {
      columns: [
        {
          stack: [
            { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 200, y2: 0, lineWidth: 0.5, lineColor: '#999' }] },
            { text: 'Assinatura do cliente', fontSize: 8, color: '#999', alignment: 'center', margin: [0, 4, 0, 0] }
          ],
          width: 220
        },
        { text: '', width: '*' },
        {
          stack: [
            { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 200, y2: 0, lineWidth: 0.5, lineColor: '#999' }] },
            { text: 'Assinatura da oficina', fontSize: 8, color: '#999', alignment: 'center', margin: [0, 4, 0, 0] }
          ],
          width: 220
        }
      ],
      margin: [0, 10, 0, 0]
    };

    const docDef = {
      pageSize: 'A4',
      pageMargins: [40, 30, 40, 50],
      content: [
        ...header,
        infoOS,
        tabelaServicos,
        tabelaPecas,
        blocoTotais,
        infoPagamento,
        obs,
        assinaturas
      ],
      footer: this._footer(),
      styles: this._styles()
    };

    const pdf = pdfMake.createPdf(docDef);
    if (window.innerWidth <= 768) { pdf.download(); } else { pdf.open(); }
  },

  // ========== RECIBO ==========
  async recibo(osId) {
    try {
    await this._carregarLogo();
    const dados = await this._buscarDados(osId);
    if (!dados) { APP.toast('Erro ao buscar dados da OS', 'error'); return; }

    const { os, itens, oficina } = dados;
    const servicos = itens.filter(i => i.tipo === 'servico');
    const pecas = itens.filter(i => i.tipo === 'peca');
    const totalServicos = servicos.reduce((s, i) => s + (i.valor_total || 0), 0);
    const totalPecas = pecas.reduce((s, i) => s + (i.valor_total || 0), 0);
    const desconto = os.desconto || 0;
    const totalGeral = totalServicos + totalPecas - desconto;

    const pagLabel = {
      dinheiro: 'Dinheiro', pix: 'Pix', debito: 'Debito',
      credito: 'Credito', boleto: 'Boleto', pendente: 'Pendente'
    };

    const header = this._montarHeader(oficina, 'RECIBO DE SERVICO');

    // Info — mesma estrutura do gerar() que funciona
    const veiculo = [os.veiculos?.marca, os.veiculos?.modelo, os.veiculos?.ano].filter(Boolean).join(' ');
    const infoOS = {
      table: {
        widths: ['*', '*', '*', '*'],
        body: [
          [
            { text: 'OS #' + (os.numero || '-'), style: 'infoLabel' },
            { text: 'Data: ' + APP.formatDate(os.data_entrada), style: 'infoVal' },
            { text: 'Pagamento: ' + (pagLabel[os.forma_pagamento] || 'Pendente'), style: 'infoVal' },
            { text: os.km_entrada ? 'KM: ' + os.km_entrada.toLocaleString('pt-BR') : '', style: 'infoVal' }
          ],
          [
            { text: 'Placa: ' + (os.veiculos?.placa || '-'), style: 'infoVal' },
            { text: veiculo ? 'Veiculo: ' + veiculo : '', style: 'infoVal', colSpan: 2 },
            {},
            { text: os.veiculos?.cor ? 'Cor: ' + os.veiculos.cor : '', style: 'infoVal' }
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
        hLineWidth: () => 0.5, vLineWidth: () => 0.5,
        hLineColor: () => '#cccccc', vLineColor: () => '#cccccc',
        paddingLeft: () => 6, paddingRight: () => 6,
        paddingTop: () => 5, paddingBottom: () => 5
      },
      margin: [0, 0, 0, 14]
    };

    // Tabela servicos — mesma estrutura do gerar()
    const tabelaServicos = {
      table: {
        headerRows: 1, widths: ['*', 90],
        body: [
          [{ text: 'SERVICOS (Mao de obra)', style: 'sectionTitle', colSpan: 2 }, {}],
          ...servicos.map(s => [
            { text: s.descricao, style: 'tableCell' },
            { text: this._formatMoney(s.valor_total), style: 'tableCellRight' }
          ]),
          ...(servicos.length === 0 ? [[{ text: 'Nenhum servico registrado', style: 'tableEmpty', colSpan: 2 }, {}]] : []),
          [{ text: 'Subtotal Servicos', style: 'tableSubtotal' }, { text: this._formatMoney(totalServicos), style: 'tableSubtotalRight' }]
        ]
      },
      layout: {
        hLineWidth: (i, node) => (i === 0 || i === 1 || i === node.table.body.length) ? 0.5 : 0.3,
        vLineWidth: () => 0.5, hLineColor: () => '#cccccc', vLineColor: () => '#cccccc',
        paddingLeft: () => 6, paddingRight: () => 6, paddingTop: () => 4, paddingBottom: () => 4
      },
      margin: [0, 0, 0, 10]
    };

    // Tabela pecas — mesma estrutura do gerar()
    const tabelaPecas = {
      table: {
        headerRows: 2, widths: ['*', 35, 70, 80],
        body: [
          [{ text: 'PECAS / MATERIAIS', style: 'sectionTitle', colSpan: 4 }, {}, {}, {}],
          [
            { text: 'Descricao', style: 'tableColHeader' },
            { text: 'Qtd', style: 'tableColHeader', alignment: 'center' },
            { text: 'Valor Unit.', style: 'tableColHeader', alignment: 'right' },
            { text: 'Total', style: 'tableColHeader', alignment: 'right' }
          ],
          ...pecas.map(p => [
            { text: p.descricao, style: 'tableCell' },
            { text: String(p.quantidade || 1), style: 'tableCell', alignment: 'center' },
            { text: this._formatMoney(p.valor_unitario), style: 'tableCellRight' },
            { text: this._formatMoney(p.valor_total), style: 'tableCellRight' }
          ]),
          ...(pecas.length === 0 ? [[{ text: 'Nenhuma peca registrada', style: 'tableEmpty', colSpan: 4 }, {}, {}, {}]] : []),
          [{ text: 'Subtotal Pecas', style: 'tableSubtotal', colSpan: 3 }, {}, {}, { text: this._formatMoney(totalPecas), style: 'tableSubtotalRight' }]
        ]
      },
      layout: {
        hLineWidth: (i, node) => (i <= 2 || i === node.table.body.length) ? 0.5 : 0.3,
        vLineWidth: () => 0.5, hLineColor: () => '#cccccc', vLineColor: () => '#cccccc',
        paddingLeft: () => 6, paddingRight: () => 6, paddingTop: () => 4, paddingBottom: () => 4
      },
      margin: [0, 0, 0, 10]
    };

    // Totais
    const linhasTotais = [
      [{ text: 'Servicos', style: 'totalLabel' }, { text: this._formatMoney(totalServicos), style: 'totalVal' }],
      [{ text: 'Pecas', style: 'totalLabel' }, { text: this._formatMoney(totalPecas), style: 'totalVal' }]
    ];
    if (desconto > 0) linhasTotais.push([{ text: 'Desconto', style: 'totalLabel' }, { text: '- ' + this._formatMoney(desconto), style: 'totalValDesconto' }]);
    linhasTotais.push([{ text: 'TOTAL', style: 'totalFinal' }, { text: this._formatMoney(totalGeral), style: 'totalFinalVal' }]);

    const blocoTotais = {
      table: { widths: ['*', 120], body: linhasTotais },
      layout: {
        hLineWidth: (i, node) => i === node.table.body.length - 1 ? 1 : 0.3,
        vLineWidth: () => 0, hLineColor: () => '#333333',
        paddingLeft: () => 6, paddingRight: () => 6, paddingTop: () => 5, paddingBottom: () => 5
      },
      margin: [0, 0, 0, 14]
    };

    const obsText = os.observacoes || os.descricao;
    const obs = obsText ? { text: 'Obs: ' + obsText, style: 'obs', margin: [0, 0, 0, 20] } : { text: '', margin: [0, 0, 0, 20] };

    // Assinaturas
    const assinaturas = {
      columns: [
        { stack: [
          { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 200, y2: 0, lineWidth: 0.5, lineColor: '#999' }] },
          { text: 'Assinatura do cliente', fontSize: 8, color: '#999', alignment: 'center', margin: [0, 4, 0, 0] }
        ], width: 220 },
        { text: '', width: '*' },
        { stack: [
          { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 200, y2: 0, lineWidth: 0.5, lineColor: '#999' }] },
          { text: 'Assinatura da oficina', fontSize: 8, color: '#999', alignment: 'center', margin: [0, 4, 0, 0] }
        ], width: 220 }
      ],
      margin: [0, 10, 0, 0]
    };

    // QR Code Pix
    let blocoPix = null;
    try {
      if (oficina.pix_chave && totalGeral > 0 && typeof qrcode !== 'undefined') {
        const qrData = this._gerarPixEMV(oficina, totalGeral, os.numero);
        if (qrData) {
          const qrImg = await this._gerarQRBase64(qrData);
          if (qrImg) {
            blocoPix = {
              stack: [
                { text: 'Pague com Pix', fontSize: 10, bold: true, color: '#1a1a1a', margin: [0, 0, 0, 4] },
                { image: qrImg, width: 85, height: 85 },
                { text: 'Chave: ' + oficina.pix_chave, fontSize: 7, color: '#666', margin: [0, 2, 0, 0] },
                { text: oficina.pix_nome || oficina.nome, fontSize: 7, color: '#666' }
              ], alignment: 'center', width: 120
            };
          }
        }
      }
    } catch(qe) { /* ignora erro do QR */ }

    // Bloco final: totais + QR lado a lado, assinaturas embaixo
    const blocoFinal = [];
    if (blocoPix) {
      blocoFinal.push({
        columns: [
          { ...blocoTotais, width: '*', margin: [0, 0, 0, 6] },
          blocoPix
        ],
        margin: [0, 0, 0, 6]
      });
    } else {
      blocoFinal.push(blocoTotais);
    }
    blocoFinal.push(obs);
    blocoFinal.push(assinaturas);

    const content = [
      ...header.filter(h => h && (h.text || h.columns || h.canvas)),
      infoOS,
      tabelaServicos,
      tabelaPecas,
      ...blocoFinal
    ];

    const docDef = {
      pageSize: 'A4',
      pageMargins: [40, 30, 40, 50],
      content,
      footer: this._footer(),
      styles: this._styles()
    };

    const pdf = pdfMake.createPdf(docDef);
    pdf.getBlob((blob) => {
      const url = URL.createObjectURL(blob);
      if (window.innerWidth <= 768) {
        const a = document.createElement('a');
        a.href = url; a.download = 'recibo-os-' + (os.numero || osId) + '.pdf';
        a.click(); URL.revokeObjectURL(url);
      } else {
        window.open(url, '_blank');
      }
    });
    } catch(e) { APP.toast('Erro ao gerar recibo: ' + e.message, 'error'); console.error(e); }
  },

  // Gera código Pix EMV (BR Code estático)
  _gerarPixEMV(oficina, valor, numOS) {
    const chave = oficina.pix_chave;
    const nome = (oficina.pix_nome || oficina.nome || 'OFICINA').substring(0, 25).toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const cidade = (oficina.cidade || 'CIDADE').substring(0, 15).toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const valorStr = valor.toFixed(2);
    const txid = 'OS' + (numOS || '0');

    const tlv = (id, val) => id + String(val.length).padStart(2, '0') + val;

    // Merchant Account Info (chave Pix)
    const mai = tlv('00', 'br.gov.bcb.pix') + tlv('01', chave);

    let emv = '';
    emv += tlv('00', '01'); // Payload Format
    emv += tlv('26', mai); // Merchant Account
    emv += tlv('52', '0000'); // MCC
    emv += tlv('53', '986'); // Moeda BRL
    emv += tlv('54', valorStr); // Valor
    emv += tlv('58', 'BR'); // País
    emv += tlv('59', nome); // Nome
    emv += tlv('60', cidade); // Cidade
    emv += tlv('62', tlv('05', txid)); // Additional Data

    // CRC16
    emv += '6304';
    const crc = this._crc16(emv);
    emv += crc;

    return emv;
  },

  _crc16(str) {
    let crc = 0xFFFF;
    for (let i = 0; i < str.length; i++) {
      crc ^= str.charCodeAt(i) << 8;
      for (let j = 0; j < 8; j++) {
        if (crc & 0x8000) crc = (crc << 1) ^ 0x1021;
        else crc <<= 1;
        crc &= 0xFFFF;
      }
    }
    return crc.toString(16).toUpperCase().padStart(4, '0');
  },

  // ========== OS MECÂNICO (sem preços) ==========
  async gerarMecanico(osId) {
    await this._carregarLogo();
    const dados = await this._buscarDados(osId);
    if (!dados) return;

    const { os, itens, oficina } = dados;
    const servicos = itens.filter(i => i.tipo === 'servico');
    const pecas = itens.filter(i => i.tipo === 'peca');

    const header = this._montarHeader(oficina, 'ORDEM DE SERVICO — MECANICO');

    const veiculo = [os.veiculos?.marca, os.veiculos?.modelo, os.veiculos?.ano].filter(Boolean).join(' ');
    const infoOS = {
      table: {
        widths: ['*', '*', '*', '*'],
        body: [
          [
            { text: 'OS #' + (os.numero || '-'), style: 'infoLabel' },
            { text: 'Data: ' + APP.formatDate(os.data_entrada), style: 'infoVal' },
            { text: 'Status: ' + (os.status || '-'), style: 'infoVal' },
            { text: os.km_entrada ? 'KM: ' + os.km_entrada.toLocaleString('pt-BR') : '', style: 'infoVal' }
          ],
          [
            { text: 'Placa: ' + (os.veiculos?.placa || '-'), style: 'infoVal' },
            { text: veiculo ? 'Veiculo: ' + veiculo : '', style: 'infoVal', colSpan: 2 },
            {},
            { text: os.veiculos?.cor ? 'Cor: ' + os.veiculos.cor : '', style: 'infoVal' }
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
        hLineWidth: () => 0.5, vLineWidth: () => 0.5,
        hLineColor: () => '#cccccc', vLineColor: () => '#cccccc',
        paddingLeft: () => 6, paddingRight: () => 6,
        paddingTop: () => 5, paddingBottom: () => 5
      },
      margin: [0, 0, 0, 14]
    };

    // Servicos — só qtd e descrição, sem valor
    const tabelaServicos = {
      table: {
        headerRows: 1,
        widths: [30, '*'],
        body: [
          [{ text: 'SERVICOS (Mao de obra)', style: 'sectionTitle', colSpan: 2 }, {}],
          ...servicos.map(s => [
            { text: String(s.quantidade || 1), style: 'tableCell', alignment: 'center' },
            { text: s.descricao, style: 'tableCell' }
          ]),
          ...(servicos.length === 0 ? [[{ text: 'Nenhum servico registrado', style: 'tableEmpty', colSpan: 2 }, {}]] : [])
        ]
      },
      layout: {
        hLineWidth: (i, node) => (i === 0 || i === 1 || i === node.table.body.length) ? 0.5 : 0.3,
        vLineWidth: () => 0.5, hLineColor: () => '#cccccc', vLineColor: () => '#cccccc',
        paddingLeft: () => 6, paddingRight: () => 6, paddingTop: () => 4, paddingBottom: () => 4
      },
      margin: [0, 0, 0, 10]
    };

    // Pecas — só qtd e descrição, sem valor
    const tabelaPecas = {
      table: {
        headerRows: 2,
        widths: [30, '*'],
        body: [
          [{ text: 'PECAS / MATERIAIS', style: 'sectionTitle', colSpan: 2 }, {}],
          [
            { text: 'Qtd', style: 'tableColHeader', alignment: 'center' },
            { text: 'Descricao', style: 'tableColHeader' }
          ],
          ...pecas.map(p => [
            { text: String(p.quantidade || 1), style: 'tableCell', alignment: 'center' },
            { text: p.descricao, style: 'tableCell' }
          ]),
          ...(pecas.length === 0 ? [[{ text: 'Nenhuma peca registrada', style: 'tableEmpty', colSpan: 2 }, {}]] : [])
        ]
      },
      layout: {
        hLineWidth: (i, node) => (i <= 2 || i === node.table.body.length) ? 0.5 : 0.3,
        vLineWidth: () => 0.5, hLineColor: () => '#cccccc', vLineColor: () => '#cccccc',
        paddingLeft: () => 6, paddingRight: () => 6, paddingTop: () => 4, paddingBottom: () => 4
      },
      margin: [0, 0, 0, 10]
    };

    const obsText = os.observacoes || os.descricao;
    const obs = obsText ? { text: 'Obs: ' + obsText, style: 'obs', margin: [0, 0, 0, 20] } : { text: '', margin: [0, 0, 0, 20] };

    const docDef = {
      pageSize: 'A4',
      pageMargins: [40, 30, 40, 50],
      content: [...header, infoOS, tabelaServicos, tabelaPecas, obs],
      footer: this._footer(),
      styles: this._styles()
    };

    const pdf = pdfMake.createPdf(docDef);
    if (window.innerWidth <= 768) { pdf.download(); } else { pdf.open(); }
  },

  async gerarPDFMecanico(osId) { return this.gerarMecanico(osId); },

  async _gerarQRBase64(data) {
    if (typeof qrcode === 'undefined') return null;
    try {
      const qr = qrcode(0, 'M');
      qr.addData(data);
      qr.make();
      const cellSize = 4;
      const count = qr.getModuleCount();
      const size = count * cellSize;
      // Desenhar direto no canvas (sem passar por GIF)
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, size, size);
      ctx.fillStyle = '#000000';
      for (let r = 0; r < count; r++) {
        for (let c = 0; c < count; c++) {
          if (qr.isDark(r, c)) ctx.fillRect(c * cellSize, r * cellSize, cellSize, cellSize);
        }
      }
      return canvas.toDataURL('image/png');
    } catch (e) {
      return null;
    }
  }
};

window.gerarPDFMecanico = (osId) => PDF_OS.gerarMecanico(osId);
