// RPM Pro — Diagnóstico Técnico (checklist por setores, rápido e touch-friendly)
const DIAGNOSTICO = {
  // Setores e itens — só aparece o que o mecânico clicar
  _setores: {
    'vistoria': {
      nome: 'Vistoria do Veículo',
      icone: '🚗',
      especial: true
    },
    'injecao': {
      nome: 'Injeção Eletrônica',
      icone: '⚡',
      itens: [
        'Leitura scanner (codigos DTC)',
        'Sensores oxigenio / sonda lambda',
        'Sensor MAP / MAF',
        'Sensor temperatura (agua/ar)',
        'Corpo de borboleta',
        'Bicos injetores',
        'Bobinas de ignicao',
        'Velas de ignicao',
        'Bomba de combustivel',
        'Filtro de combustivel',
        'Filtro de ar',
        'Valvula canister',
        'Chicote eletrico',
      ]
    },
    'suspensao_d': {
      nome: 'Suspensão Dianteira',
      icone: '🔩',
      itens: [
        'Amortecedor diant. esquerdo',
        'Amortecedor diant. direito',
        'Mola diant. esquerda',
        'Mola diant. direita',
        'Braco/bandeja esquerdo',
        'Braco/bandeja direito',
        'Bucha bandeja esquerda',
        'Bucha bandeja direita',
        'Pivo esquerdo',
        'Pivo direito',
        'Bieleta esquerda',
        'Bieleta direita',
        'Terminal direcao esquerdo',
        'Terminal direcao direito',
        'Coifa homocinetica esq.',
        'Coifa homocinetica dir.',
        'Rolamento roda esq.',
        'Rolamento roda dir.',
        'Caixa de direcao',
        'Bomba direcao hidraulica',
      ]
    },
    'suspensao_t': {
      nome: 'Suspensão Traseira',
      icone: '🔩',
      itens: [
        'Amortecedor tras. esquerdo',
        'Amortecedor tras. direito',
        'Mola tras. esquerda',
        'Mola tras. direita',
        'Bucha eixo traseiro',
        'Bieleta tras. esquerda',
        'Bieleta tras. direita',
        'Rolamento tras. esq.',
        'Rolamento tras. dir.',
      ]
    },
    'freio_d': {
      nome: 'Freio Dianteiro',
      icone: '🛑',
      itens: [
        'Pastilha diant. esquerda',
        'Pastilha diant. direita',
        'Disco diant. esquerdo',
        'Disco diant. direito',
        'Pinca/cilindro diant. esq.',
        'Pinca/cilindro diant. dir.',
        'Flexivel diant. esq.',
        'Flexivel diant. dir.',
      ]
    },
    'freio_t': {
      nome: 'Freio Traseiro',
      icone: '🛑',
      itens: [
        'Pastilha/lona tras. esq.',
        'Pastilha/lona tras. dir.',
        'Disco/tambor tras. esq.',
        'Disco/tambor tras. dir.',
        'Cilindro tras. esq.',
        'Cilindro tras. dir.',
        'Flexivel tras. esq.',
        'Flexivel tras. dir.',
        'Fluido de freio',
        'Cilindro mestre',
        'Freio de mao',
      ]
    },
    'vazamento': {
      nome: 'Vazamentos',
      icone: '💧',
      itens: [
        'Oleo motor — tampa valvulas',
        'Oleo motor — carter/bujao',
        'Oleo motor — retentor dianteiro',
        'Oleo motor — retentor traseiro',
        'Oleo motor — filtro/carcaca',
        'Oleo hidraulico — bomba direcao',
        'Oleo hidraulico — mangueiras',
        'Oleo hidraulico — caixa direcao',
        'Agua — radiador',
        'Agua — mangueira superior',
        'Agua — mangueira inferior',
        'Agua — bomba d agua',
        'Agua — valvula termostatica',
        'Agua — reservatorio',
        'Cambio — retentor saida',
        'Cambio — retentor seletor',
        'Cambio — junta carter',
        'Cambio — retentor tulipa',
        'Cambio — nivel/cor do oleo',
      ]
    },
    'lampadas': {
      nome: 'Lâmpadas',
      icone: '💡',
      itens: [
        'Farol baixo esquerdo',
        'Farol baixo direito',
        'Farol alto esquerdo',
        'Farol alto direito',
        'Farol milha/auxiliar',
        'Luz freio esquerda',
        'Luz freio direita',
        'Terceira luz freio',
        'Lanterna tras. esquerda',
        'Lanterna tras. direita',
        'Seta diant. esq.',
        'Seta diant. dir.',
        'Seta tras. esq.',
        'Seta tras. dir.',
        'Luz de re',
        'Luz da placa',
      ]
    },
    'correias': {
      nome: 'Correias',
      icone: '⚙️',
      itens: [
        'Correia dentada',
        'Tensor da dentada',
        'Polia guia',
        'Correia alternador/acessorios',
        'Tensor alternador',
        'Bomba d agua (trocar junto?)',
      ]
    },
    'embreagem': {
      nome: 'Embreagem / Transmissão',
      icone: '🔄',
      itens: [
        'Disco de embreagem',
        'Plato',
        'Rolamento de embreagem',
        'Cabo/atuador embreagem',
        'Trambulador/articulacao',
        'Coxim do cambio',
        'Homocinetica int. esq.',
        'Homocinetica int. dir.',
        'Homocinetica ext. esq.',
        'Homocinetica ext. dir.',
      ]
    },
    'escapamento': {
      nome: 'Escapamento',
      icone: '💨',
      itens: [
        'Catalisador',
        'Tubo dianteiro/flexivel',
        'Silencioso intermediario',
        'Silencioso traseiro',
        'Juntas e abracadeiras',
        'Suportes de borracha',
      ]
    },
  },

  // Abre o painel de diagnóstico pra uma OS
  async abrir(osId) {
    // Busca diagnóstico existente
    const { data: existente } = await db.from('diagnosticos_tecnicos')
      .select('*').eq('os_id', osId).maybeSingle();

    const dados = existente?.dados || {};
    const obs = existente?.observacoes || '';

    // Conta setores verificados
    const setoresKeys = Object.keys(this._setores);
    const verificados = setoresKeys.filter(k => dados[k] && Object.keys(dados[k]).length > 0);

    // Monta grid de setores (botões grandes)
    openModal(`
      <div class="modal-header">
        <h3>Diagnóstico Técnico</h3>
        <button class="modal-close" onclick="closeModal()">&times;</button>
      </div>
      <div class="modal-body" style="padding:12px;">
        <div style="font-size:12px;color:var(--text-secondary);margin-bottom:12px;">
          Toque no setor pra inspecionar. Verde = verificado
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;" id="diag-grid">
          ${setoresKeys.map(key => {
            const s = this._setores[key];
            const temDados = dados[key] && Object.keys(dados[key]).length > 0;
            const isVistoria = s.especial;
            const vistoriaObs = isVistoria && dados[key]?._obs;
            const qtdProblemas = temDados && !isVistoria ? Object.values(dados[key]).filter(v => v.problema).length : 0;
            return `
              <button onclick="DIAGNOSTICO._abrirSetor('${key}','${escAttr(osId)}')"
                style="padding:16px 12px;border-radius:var(--radius-lg);border:2px solid ${temDados ? 'var(--success)' : 'var(--border)'};
                background:${temDados ? 'rgba(34,197,94,0.08)' : 'var(--bg-input)'};cursor:pointer;text-align:center;
                display:flex;flex-direction:column;align-items:center;gap:6px;min-height:80px;justify-content:center;color:#fff;">
                <span style="font-size:24px;">${s.icone}</span>
                <span style="font-size:13px;font-weight:700;">${esc(s.nome)}</span>
                ${temDados ? `<span style="font-size:10px;color:${qtdProblemas > 0 ? 'var(--danger)' : vistoriaObs ? 'var(--warning)' : 'var(--success)'};">${isVistoria ? (vistoriaObs ? 'Com observação' : 'Conferido') : (qtdProblemas > 0 ? qtdProblemas + ' problema(s)' : 'OK')}</span>` : ''}
              </button>`;
          }).join('')}
        </div>

        ${verificados.length > 0 ? `
        <div style="margin-top:16px;padding-top:12px;border-top:1px solid var(--border);">
          <div style="font-size:12px;font-weight:700;color:var(--text-secondary);margin-bottom:8px;">PEÇAS NECESSÁRIAS</div>
          <div id="diag-pecas-resumo">
            ${this._resumoPecas(dados)}
          </div>
        </div>` : ''}

        <div class="form-group" style="margin-top:12px;">
          <label style="font-size:12px;">Observações gerais</label>
          <textarea class="form-control" id="diag-obs" placeholder="Observações...">${esc(obs)}</textarea>
        </div>

        <div style="display:flex;gap:8px;margin-top:12px;">
          <button class="btn btn-secondary" style="flex:1;" onclick="OS.abrirDetalhes('${escAttr(osId)}')">Voltar</button>
          ${verificados.length > 0 ? `<button class="btn btn-secondary" style="flex:1;" onclick="DIAGNOSTICO._gerarPDF('${escAttr(osId)}')">Imprimir PDF</button>` : ''}
          <button class="btn btn-primary" style="flex:1;" onclick="DIAGNOSTICO._salvar('${escAttr(osId)}')">Salvar diagnóstico</button>
        </div>
      </div>
    `);

    // Cache
    this._osId = osId;
    this._dados = dados;
    this._existente = existente;
  },

  _osId: null,
  _dados: {},
  _existente: null,

  // Abre um setor específico
  _abrirSetor(setorKey, osId) {
    const setor = this._setores[setorKey];
    if (!setor) return;
    const dados = this._dados[setorKey] || {};

    // Vistoria = tela especial (check rápido + observação)
    if (setor.especial) {
      this._abrirVistoria(setorKey, osId, dados);
      return;
    }

    openModal(`
      <div class="modal-header">
        <h3>${setor.icone} ${esc(setor.nome)}</h3>
        <button class="modal-close" onclick="DIAGNOSTICO.abrir('${escAttr(osId)}')">&times;</button>
      </div>
      <div class="modal-body" style="padding:8px 12px;">
        <div style="font-size:11px;color:var(--text-secondary);margin-bottom:8px;">Marque o que tem PROBLEMA. Deixe desmarcado o que ta OK.</div>
        <div style="display:flex;flex-direction:column;gap:2px;">
          ${setor.itens.map((item, i) => {
            const key = setorKey + '_' + i;
            const d = dados[i] || {};
            return `
              <div style="padding:10px 8px;border-bottom:1px solid var(--border);${d.problema ? 'background:rgba(239,68,68,0.06);' : ''}">
                <label style="display:flex;align-items:center;gap:10px;cursor:pointer;">
                  <input type="checkbox" class="diag-item-chk" data-idx="${i}" ${d.problema ? 'checked' : ''}
                    onchange="DIAGNOSTICO._toggleItem(this)" style="width:22px;height:22px;min-width:22px;">
                  <span style="font-size:14px;font-weight:${d.problema ? '700' : '500'};">${esc(item)}</span>
                </label>
                <div class="diag-item-detalhe" data-idx="${i}" style="display:${d.problema ? 'block' : 'none'};margin-top:8px;margin-left:32px;">
                  <input type="text" class="form-control diag-peca" data-idx="${i}" value="${esc(d.peca || '')}"
                    placeholder="Peça necessária..." style="font-size:13px;padding:8px 10px;margin-bottom:4px;">
                  <input type="text" class="form-control diag-detalhe" data-idx="${i}" value="${esc(d.detalhe || '')}"
                    placeholder="Detalhe do problema..." style="font-size:12px;padding:6px 10px;">
                </div>
              </div>`;
          }).join('')}
        </div>
        <div style="display:flex;gap:8px;margin-top:12px;padding-top:12px;border-top:1px solid var(--border);">
          <button class="btn btn-secondary" style="flex:1;" onclick="DIAGNOSTICO.abrir('${escAttr(osId)}')">Voltar</button>
          <button class="btn btn-primary" style="flex:1;" onclick="DIAGNOSTICO._salvarSetor('${escAttr(setorKey)}','${escAttr(osId)}')">Confirmar setor</button>
        </div>
      </div>
    `);
  },

  // Vistoria rápida: check + observação
  _abrirVistoria(setorKey, osId, dados) {
    const conferido = dados._conferido || false;
    const obs = dados._obs || '';
    this._vistoriaChecked = conferido;

    openModal(`
      <div class="modal-header">
        <h3>🚗 Vistoria do Veículo</h3>
        <button class="modal-close" onclick="DIAGNOSTICO.abrir('${escAttr(osId)}')">&times;</button>
      </div>
      <div class="modal-body" style="padding:16px;">
        <div style="text-align:center;margin-bottom:20px;">
          <div style="font-size:14px;color:var(--text-secondary);margin-bottom:16px;">
            Confira o estado geral do veículo na entrada
          </div>
          <button id="vistoria-check-btn" onclick="DIAGNOSTICO._toggleVistoriaCheck()"
            style="width:100%;padding:20px;border-radius:var(--radius-lg);border:2px solid ${conferido ? 'var(--success)' : 'var(--border)'};
            background:${conferido ? 'rgba(34,197,94,0.1)' : 'var(--bg-input)'};cursor:pointer;
            font-size:16px;font-weight:700;color:${conferido ? 'var(--success)' : '#fff'};
            display:flex;align-items:center;justify-content:center;gap:10px;">
            <span style="font-size:28px;">${conferido ? '✅' : '⬜'}</span>
            ${conferido ? 'Veículo conferido' : 'Marcar como conferido'}
          </button>
        </div>

        <div style="margin-bottom:16px;">
          <label style="font-size:13px;font-weight:600;margin-bottom:6px;display:block;">
            Notou algo? Descreva aqui
          </label>
          <textarea class="form-control" id="vistoria-obs" rows="4"
            placeholder="Ex: Risco na porta traseira esquerda, pneu dianteiro careca, cliente deixou documentos no porta-luvas..."
            style="font-size:14px;padding:12px;">${esc(obs)}</textarea>
          <div style="font-size:11px;color:var(--text-muted);margin-top:4px;">
            Só preencha se tiver algo pra registrar. Se tá tudo OK, só marque como conferido.
          </div>
        </div>

        <div style="display:flex;gap:8px;">
          <button class="btn btn-secondary" style="flex:1;" onclick="DIAGNOSTICO.abrir('${escAttr(osId)}')">Voltar</button>
          <button class="btn btn-primary" style="flex:1;" onclick="DIAGNOSTICO._salvarVistoria('${escAttr(setorKey)}','${escAttr(osId)}')">Confirmar</button>
        </div>
      </div>
    `);
  },

  _vistoriaChecked: false,

  _toggleVistoriaCheck() {
    this._vistoriaChecked = !this._vistoriaChecked;
    const btn = document.getElementById('vistoria-check-btn');
    if (btn) {
      const c = this._vistoriaChecked;
      btn.style.borderColor = c ? 'var(--success)' : 'var(--border)';
      btn.style.background = c ? 'rgba(34,197,94,0.1)' : 'var(--bg-input)';
      btn.style.color = c ? 'var(--success)' : '#fff';
      btn.innerHTML = `<span style="font-size:28px;">${c ? '✅' : '⬜'}</span> ${c ? 'Veículo conferido' : 'Marcar como conferido'}`;
    }
  },

  _salvarVistoria(setorKey, osId) {
    const btn = document.getElementById('vistoria-check-btn');
    const conferido = this._vistoriaChecked || (btn && btn.style.borderColor.includes('success'));
    const obs = document.getElementById('vistoria-obs')?.value?.trim() || '';

    if (!conferido && !obs) {
      APP.toast('Marque como conferido ou descreva o que notou', 'error');
      return;
    }

    this._dados[setorKey] = { _conferido: true, _obs: obs, _ok: !obs };
    this.abrir(osId);
  },

  _toggleItem(chk) {
    const idx = chk.dataset.idx;
    const detalhe = document.querySelector(`.diag-item-detalhe[data-idx="${idx}"]`);
    if (detalhe) {
      detalhe.style.display = chk.checked ? 'block' : 'none';
      if (chk.checked) {
        const pecaInput = detalhe.querySelector('.diag-peca');
        if (pecaInput) pecaInput.focus();
      }
    }
    // Highlight
    const row = chk.closest('div[style*="border-bottom"]');
    if (row) row.style.background = chk.checked ? 'rgba(239,68,68,0.06)' : '';
  },

  _salvarSetor(setorKey, osId) {
    const setor = this._setores[setorKey];
    const dados = {};
    document.querySelectorAll('.diag-item-chk').forEach(chk => {
      const idx = parseInt(chk.dataset.idx);
      const problema = chk.checked;
      const pecaEl = document.querySelector(`.diag-peca[data-idx="${idx}"]`);
      const detalheEl = document.querySelector(`.diag-detalhe[data-idx="${idx}"]`);
      if (problema) {
        dados[idx] = {
          problema: true,
          peca: pecaEl?.value?.trim() || '',
          detalhe: detalheEl?.value?.trim() || '',
        };
      }
    });
    // Se nenhum problema marcado, salva como verificado (objeto vazio = OK)
    this._dados[setorKey] = Object.keys(dados).length > 0 ? dados : { _ok: true };
    // Volta pro painel principal
    this.abrir(osId);
  },

  async _salvar(osId) {
    const obs = document.getElementById('diag-obs')?.value?.trim() || '';
    const payload = {
      os_id: osId,
      oficina_id: APP.oficinaId,
      dados: this._dados,
      observacoes: obs,
    };

    if (this._existente) {
      await db.from('diagnosticos_tecnicos').update({ dados: this._dados, observacoes: obs }).eq('id', this._existente.id);
    } else {
      await db.from('diagnosticos_tecnicos').insert(payload);
    }

    APP.toast('Diagnóstico salvo');
    closeModal();
    OS.abrirDetalhes(osId);
  },

  // Monta resumo de peças de todos os setores
  _resumoPecas(dados) {
    const pecas = [];
    for (const [setorKey, setorDados] of Object.entries(dados)) {
      if (!this._setores[setorKey]) continue;
      const setor = this._setores[setorKey];
      for (const [idx, item] of Object.entries(setorDados)) {
        if (idx === '_ok') continue;
        if (item.problema && item.peca) {
          pecas.push({ setor: setor.nome, item: setor.itens[parseInt(idx)] || '', peca: item.peca, detalhe: item.detalhe || '' });
        }
      }
    }
    if (!pecas.length) return '<div style="font-size:12px;color:var(--text-muted);">Nenhuma peça listada nos setores verificados.</div>';
    return pecas.map(p => `
      <div style="display:flex;justify-content:space-between;align-items:center;padding:6px 0;border-bottom:1px solid var(--border);font-size:12px;">
        <div>
          <span style="font-weight:600;">${esc(p.peca)}</span>
          <span style="color:var(--text-muted);margin-left:6px;">(${esc(p.item)})</span>
        </div>
      </div>
    `).join('');
  },

  // Verifica se tem diagnóstico preenchido
  async temDiagnostico(osId) {
    const { count } = await db.from('diagnosticos_tecnicos')
      .select('id', { count: 'exact', head: true })
      .eq('os_id', osId);
    return (count || 0) > 0;
  },

  // Gera PDF do diagnóstico
  async _gerarPDF(osId) {
    try {
      await PDF_OS._carregarLogo();
      const oficina = APP.oficina || {};
      const fmt = v => (v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

      // Busca OS + diagnóstico
      const [osRes, diagRes] = await Promise.all([
        db.from('ordens_servico')
          .select('numero, descricao, veiculos(placa, marca, modelo, km_atual), clientes(nome, whatsapp)')
          .eq('id', osId).single(),
        db.from('diagnosticos_tecnicos').select('*').eq('os_id', osId).maybeSingle()
      ]);

      const os = osRes.data;
      const diag = diagRes.data;
      if (!os || !diag) { APP.toast('Sem dados pra gerar PDF', 'error'); return; }

      const dados = diag.dados || {};
      const header = PDF_OS._montarHeader(oficina, 'DIAGNÓSTICO TÉCNICO');

      // Info do veículo
      const infoContent = [
        { columns: [
          { text: 'Veículo: ' + [os.veiculos?.marca, os.veiculos?.modelo].filter(Boolean).join(' '), fontSize: 10, bold: true },
          { text: 'Placa: ' + (os.veiculos?.placa || ''), fontSize: 10, bold: true },
          { text: 'OS #' + (os.numero || ''), fontSize: 10, alignment: 'right' }
        ], margin: [0, 0, 0, 4] },
        { columns: [
          { text: 'Cliente: ' + (os.clientes?.nome || ''), fontSize: 9, color: '#666' },
          { text: 'KM: ' + (os.veiculos?.km_atual || '-'), fontSize: 9, color: '#666' },
          { text: 'Data: ' + new Date().toLocaleDateString('pt-BR'), fontSize: 9, color: '#666', alignment: 'right' }
        ], margin: [0, 0, 0, 12] },
      ];

      // Monta setores verificados
      const setoresContent = [];
      for (const [setorKey, setorDados] of Object.entries(dados)) {
        if (!this._setores[setorKey]) continue;
        const setor = this._setores[setorKey];
        const isOk = setorDados._ok;
        const problemas = [];

        if (!isOk) {
          for (const [idx, item] of Object.entries(setorDados)) {
            if (idx === '_ok') continue;
            if (item.problema) {
              problemas.push({
                item: setor.itens[parseInt(idx)] || '',
                peca: item.peca || '',
                detalhe: item.detalhe || ''
              });
            }
          }
        }

        setoresContent.push({
          text: setor.nome + (isOk ? ' — OK' : problemas.length ? ' — ' + problemas.length + ' problema(s)' : ' — OK'),
          fontSize: 11, bold: true, margin: [0, 8, 0, 4],
          color: problemas.length ? '#DC2626' : '#16A34A'
        });

        if (problemas.length) {
          const rows = problemas.map(p => [
            { text: p.item, fontSize: 9 },
            { text: p.peca || '-', fontSize: 9, bold: true },
            { text: p.detalhe || '-', fontSize: 8, color: '#666' }
          ]);
          setoresContent.push({
            table: {
              headerRows: 1,
              widths: ['*', 120, 120],
              body: [
                ['Item', 'Peça necessária', 'Detalhe'].map(t => ({ text: t, fontSize: 8, bold: true, color: '#666', fillColor: '#f5f5f5' })),
                ...rows
              ]
            },
            layout: { hLineWidth: () => 0.3, vLineWidth: () => 0.3, hLineColor: () => '#ddd', vLineColor: () => '#eee', paddingLeft: () => 4, paddingRight: () => 4, paddingTop: () => 3, paddingBottom: () => 3 }
          });
        }
      }

      // Lista consolidada de peças
      const todasPecas = [];
      for (const [setorKey, setorDados] of Object.entries(dados)) {
        if (!this._setores[setorKey]) continue;
        const setor = this._setores[setorKey];
        for (const [idx, item] of Object.entries(setorDados)) {
          if (idx === '_ok') continue;
          if (item.problema && item.peca) {
            todasPecas.push({ setor: setor.nome, item: setor.itens[parseInt(idx)] || '', peca: item.peca });
          }
        }
      }

      let pecasContent = [];
      if (todasPecas.length) {
        pecasContent = [
          { text: 'PEÇAS NECESSÁRIAS', fontSize: 12, bold: true, margin: [0, 16, 0, 8] },
          {
            table: {
              headerRows: 1,
              widths: [20, '*', 140],
              body: [
                ['#', 'Peça', 'Setor'].map(t => ({ text: t, fontSize: 9, bold: true, fillColor: '#f5f5f5', color: '#666' })),
                ...todasPecas.map((p, i) => [
                  { text: String(i + 1), fontSize: 9, alignment: 'center' },
                  { text: p.peca, fontSize: 10, bold: true },
                  { text: p.setor, fontSize: 8, color: '#888' },
                ])
              ]
            },
            layout: { hLineWidth: () => 0.3, vLineWidth: () => 0.3, hLineColor: () => '#ddd', vLineColor: () => '#eee', paddingLeft: () => 6, paddingRight: () => 6, paddingTop: () => 4, paddingBottom: () => 4 }
          }
        ];
      }

      // Observações
      const obsContent = diag.observacoes ? [
        { text: 'OBSERVAÇÕES', fontSize: 10, bold: true, margin: [0, 16, 0, 4] },
        { text: diag.observacoes, fontSize: 9, color: '#444', margin: [0, 0, 0, 12] }
      ] : [];

      // Assinaturas
      const assinaturas = {
        columns: [
          { text: '________________________________\nMecânico responsável', fontSize: 9, color: '#888', alignment: 'center', margin: [0, 30, 0, 0] },
          { text: '________________________________\nAprovado por', fontSize: 9, color: '#888', alignment: 'center', margin: [0, 30, 0, 0] },
        ]
      };

      const doc = {
        pageSize: 'A4', pageMargins: [40, 30, 40, 50],
        content: [
          ...header.filter(h => h && (h.text || h.columns || h.canvas)),
          ...infoContent,
          ...setoresContent,
          ...pecasContent,
          ...obsContent,
          assinaturas
        ],
        footer: PDF_OS._footer(),
        styles: PDF_OS._styles()
      };

      pdfMake.createPdf(doc).open();
    } catch (e) {
      APP.toast('Erro ao gerar PDF: ' + e.message, 'error');
      console.error(e);
    }
  }
};
