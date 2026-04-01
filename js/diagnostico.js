// RPM Pro — Diagnóstico Técnico (checklist por setores, rápido e touch-friendly)
const DIAGNOSTICO = {
  // Setores e itens — só aparece o que o mecânico clicar
  _setores: {
    'injecao': {
      nome: 'Injecao Eletronica',
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
      nome: 'Suspensao Dianteira',
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
      nome: 'Suspensao Traseira',
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
      nome: 'Lampadas',
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
      nome: 'Embreagem / Transmissao',
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
        <h3>Diagnostico Tecnico</h3>
        <button class="modal-close" onclick="closeModal()">&times;</button>
      </div>
      <div class="modal-body" style="padding:12px;">
        <div style="font-size:12px;color:var(--text-secondary);margin-bottom:12px;">
          Toque no setor pra inspecionar. Verde = verificado.
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;" id="diag-grid">
          ${setoresKeys.map(key => {
            const s = this._setores[key];
            const temDados = dados[key] && Object.keys(dados[key]).length > 0;
            const qtdProblemas = temDados ? Object.values(dados[key]).filter(v => v.problema).length : 0;
            return `
              <button onclick="DIAGNOSTICO._abrirSetor('${key}','${escAttr(osId)}')"
                style="padding:16px 12px;border-radius:var(--radius-lg);border:2px solid ${temDados ? 'var(--success)' : 'var(--border)'};
                background:${temDados ? 'rgba(34,197,94,0.08)' : 'var(--bg-input)'};cursor:pointer;text-align:center;
                display:flex;flex-direction:column;align-items:center;gap:6px;min-height:80px;justify-content:center;">
                <span style="font-size:24px;">${s.icone}</span>
                <span style="font-size:12px;font-weight:700;color:var(--text-primary);">${esc(s.nome)}</span>
                ${temDados ? `<span style="font-size:10px;color:${qtdProblemas > 0 ? 'var(--danger)' : 'var(--success)'};">${qtdProblemas > 0 ? qtdProblemas + ' problema(s)' : 'OK'}</span>` : ''}
              </button>`;
          }).join('')}
        </div>

        ${verificados.length > 0 ? `
        <div style="margin-top:16px;padding-top:12px;border-top:1px solid var(--border);">
          <div style="font-size:12px;font-weight:700;color:var(--text-secondary);margin-bottom:8px;">PECAS NECESSARIAS</div>
          <div id="diag-pecas-resumo">
            ${this._resumoPecas(dados)}
          </div>
        </div>` : ''}

        <div class="form-group" style="margin-top:12px;">
          <label style="font-size:12px;">Observacoes gerais</label>
          <textarea class="form-control" id="diag-obs" placeholder="Observacoes...">${esc(obs)}</textarea>
        </div>

        <div style="display:flex;gap:8px;margin-top:12px;">
          <button class="btn btn-secondary" style="flex:1;" onclick="OS.abrirDetalhes('${escAttr(osId)}')">Voltar</button>
          <button class="btn btn-primary" style="flex:1;" onclick="DIAGNOSTICO._salvar('${escAttr(osId)}')">Salvar diagnostico</button>
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
                    placeholder="Peca necessaria..." style="font-size:13px;padding:8px 10px;margin-bottom:4px;">
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

    APP.toast('Diagnostico salvo');
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
    if (!pecas.length) return '<div style="font-size:12px;color:var(--text-muted);">Nenhuma peca listada nos setores verificados.</div>';
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
  }
};
