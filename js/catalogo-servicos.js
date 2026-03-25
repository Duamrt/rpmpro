// RPM Pro — Catálogo de Serviços de Oficina (com valor padrão de mão de obra)
const CATALOGO_SERVICOS = {
  'Motor': [
    { nome: 'Troca de óleo e filtro', valor: 80 },
    { nome: 'Troca de correia dentada', valor: 350 },
    { nome: 'Troca de correia do alternador', valor: 150 },
    { nome: 'Troca de velas de ignição', valor: 100 },
    { nome: 'Troca de cabos de vela', valor: 80 },
    { nome: 'Troca de bobina de ignição', valor: 120 },
    { nome: 'Limpeza de bicos injetores', valor: 200 },
    { nome: 'Troca de bomba de combustível', valor: 250 },
    { nome: 'Troca de filtro de combustível', valor: 60 },
    { nome: 'Troca de filtro de ar', valor: 40 },
    { nome: 'Retífica de motor', valor: 3500 },
    { nome: 'Troca de junta do cabeçote', valor: 800 },
    { nome: 'Regulagem de válvulas', valor: 300 },
    { nome: 'Troca de sensor de oxigênio (sonda lambda)', valor: 150 },
    { nome: 'Troca de catalisador', valor: 200 },
    { nome: 'Limpeza de corpo de borboleta (TBI)', valor: 120 },
    { nome: 'Diagnóstico eletrônico (scanner)', valor: 80 },
  ],
  'Freios': [
    { nome: 'Troca de pastilhas dianteiras', valor: 100 },
    { nome: 'Troca de pastilhas traseiras', valor: 100 },
    { nome: 'Troca de discos dianteiros', valor: 150 },
    { nome: 'Troca de discos traseiros', valor: 150 },
    { nome: 'Troca de lonas de freio', valor: 120 },
    { nome: 'Troca de tambor de freio', valor: 180 },
    { nome: 'Troca de fluido de freio', valor: 60 },
    { nome: 'Sangria do sistema de freio', valor: 80 },
    { nome: 'Troca de flexível de freio', valor: 100 },
    { nome: 'Troca de cilindro mestre', valor: 200 },
    { nome: 'Reparo de pinça de freio', valor: 180 },
    { nome: 'Regulagem de freio de mão', valor: 60 },
  ],
  'Suspensão e Direção': [
    { nome: 'Troca de amortecedor dianteiro (par)', valor: 300 },
    { nome: 'Troca de amortecedor traseiro (par)', valor: 250 },
    { nome: 'Troca de mola dianteira (par)', valor: 250 },
    { nome: 'Troca de mola traseira (par)', valor: 200 },
    { nome: 'Troca de pivô', valor: 150 },
    { nome: 'Troca de bieleta', valor: 100 },
    { nome: 'Troca de bucha da bandeja', valor: 120 },
    { nome: 'Troca de bandeja completa', valor: 200 },
    { nome: 'Troca de terminal de direção', valor: 120 },
    { nome: 'Troca de caixa de direção', valor: 500 },
    { nome: 'Troca de bomba de direção hidráulica', valor: 300 },
    { nome: 'Troca de coifa da homocinética', valor: 150 },
    { nome: 'Troca de homocinética', valor: 300 },
    { nome: 'Troca de rolamento de roda', valor: 200 },
    { nome: 'Alinhamento', valor: 80 },
    { nome: 'Balanceamento', valor: 60 },
    { nome: 'Alinhamento + balanceamento', valor: 120 },
  ],
  'Arrefecimento': [
    { nome: 'Troca de radiador', valor: 250 },
    { nome: 'Troca de mangueira do radiador', valor: 80 },
    { nome: 'Troca de válvula termostática', valor: 120 },
    { nome: 'Troca de bomba d\'água', valor: 250 },
    { nome: 'Troca de líquido de arrefecimento', valor: 60 },
    { nome: 'Troca de ventoinha', valor: 200 },
    { nome: 'Limpeza do sistema de arrefecimento', valor: 100 },
  ],
  'Transmissão e Embreagem': [
    { nome: 'Troca de kit embreagem', valor: 600 },
    { nome: 'Troca de cabo de embreagem', valor: 100 },
    { nome: 'Troca de atuador de embreagem', valor: 200 },
    { nome: 'Troca de óleo do câmbio', valor: 100 },
    { nome: 'Reparo de câmbio manual', valor: 1200 },
    { nome: 'Reparo de câmbio automático', valor: 2500 },
    { nome: 'Troca de junta homocinética', valor: 300 },
  ],
  'Elétrica': [
    { nome: 'Troca de bateria', valor: 60 },
    { nome: 'Troca de alternador', valor: 250 },
    { nome: 'Troca de motor de partida (arranque)', valor: 250 },
    { nome: 'Reparo de chicote elétrico', valor: 200 },
    { nome: 'Troca de farol', valor: 100 },
    { nome: 'Troca de lâmpada', valor: 30 },
    { nome: 'Instalação de alarme', valor: 150 },
    { nome: 'Instalação de som', valor: 200 },
    { nome: 'Instalação de câmera de ré', valor: 150 },
    { nome: 'Instalação de sensor de estacionamento', valor: 200 },
    { nome: 'Reparo de vidro elétrico', valor: 180 },
    { nome: 'Reparo de trava elétrica', valor: 100 },
  ],
  'Ar Condicionado': [
    { nome: 'Recarga de gás', valor: 200 },
    { nome: 'Troca de compressor', valor: 500 },
    { nome: 'Troca de condensador', valor: 300 },
    { nome: 'Troca de evaporador', valor: 400 },
    { nome: 'Troca de filtro secador', valor: 150 },
    { nome: 'Higienização do ar condicionado', valor: 100 },
    { nome: 'Reparo de vazamento', valor: 200 },
  ],
  'Pneus e Rodas': [
    { nome: 'Troca de pneu', valor: 40 },
    { nome: 'Rodízio de pneus', valor: 60 },
    { nome: 'Conserto de furo', valor: 30 },
    { nome: 'Balanceamento', valor: 60 },
    { nome: 'Restauração de roda', valor: 150 },
  ],
  'Revisão': [
    { nome: 'Revisão completa (10 mil km)', valor: 300 },
    { nome: 'Revisão completa (20 mil km)', valor: 400 },
    { nome: 'Revisão completa (40 mil km)', valor: 600 },
    { nome: 'Revisão completa (60 mil km)', valor: 800 },
    { nome: 'Revisão pré-viagem', valor: 150 },
    { nome: 'Check-up geral', valor: 120 },
    { nome: 'Inspeção veicular', valor: 80 },
  ],
  'Funilaria e Pintura': [
    { nome: 'Reparo de amassado (martelinho de ouro)', valor: 200 },
    { nome: 'Pintura parcial', valor: 500 },
    { nome: 'Pintura completa', valor: 3000 },
    { nome: 'Polimento técnico', valor: 200 },
    { nome: 'Cristalização', valor: 250 },
    { nome: 'Vitrificação', valor: 400 },
    { nome: 'Reparo de para-choque', valor: 300 },
    { nome: 'Troca de para-brisa', valor: 200 },
  ],
  'Outros': [
    { nome: 'Guincho / Reboque', valor: 150 },
    { nome: 'Laudo cautelar', valor: 200 },
    { nome: 'Instalação de acessórios', valor: 100 },
    { nome: 'Troca de escapamento', valor: 150 },
    { nome: 'Troca de silencioso', valor: 120 },
    { nome: 'Lavagem de motor', valor: 80 },
  ]
};

// Helper: gera options agrupados por categoria
function optionsServicos() {
  let html = '<option value="">Selecione o servico (ou descreva abaixo)</option>';
  for (const [cat, servicos] of Object.entries(CATALOGO_SERVICOS)) {
    html += `<optgroup label="${cat}">`;
    servicos.forEach(s => {
      html += `<option value="${s.nome}" data-valor="${s.valor}">${s.nome} — R$ ${s.valor.toFixed(2)}</option>`;
    });
    html += '</optgroup>';
  }
  html += '<option value="__outro">Outro servico</option>';
  return html;
}

// Helper: busca valor padrão de um serviço
function getValorServico(nome) {
  for (const servicos of Object.values(CATALOGO_SERVICOS)) {
    const s = servicos.find(x => x.nome === nome);
    if (s) return s.valor;
  }
  return 0;
}
