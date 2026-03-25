# RPM Pro — Auditoria Frontend
**Autor:** Anderson (Dev Frontend)
**Data:** 2026-03-25

---

## 1. Organizacao e Padroes do Codigo

### Pontos positivos
- Padrao consistente: cada modulo e um objeto global (APP, OS, CLIENTES, KANBAN, etc.) com metodos async — facil de ler e manter
- Navegacao via evento customizado `pageLoad` com lazy loading por pagina — carrega dados so quando o usuario acessa a aba
- Persistencia de pagina via localStorage (nao perde contexto ao recarregar)
- Helpers centralizados em APP (formatMoney, formatDate, toast) — sem duplicacao
- CSS com variáveis bem definidas, design system coerente (cores, radius, espacamentos)
- Catalogo de veiculos e servicos como dados estaticos no JS — leve, sem query extra

### Problemas encontrados
- **Excesso de inline styles** — o kanban.js e os.js constroem UI inteira com `style=""` direto no HTML. Dificulta manutencao e quebra consistencia. Deveria usar classes CSS
- **Nenhuma separacao de templates** — todo HTML mora dentro de strings JS (template literals). Funciona, mas com 800+ linhas no os.js fica dificil manter
- **Globals sem namespace** — funcoes soltas como `openModal()`, `closeModal()`, `optionsMarcas()`, `optionsModelos()`, `optionsServicos()` poluem o escopo global. Risco de colisao conforme o projeto cresce
- **Ordem de scripts importa** — catalogo-veiculos.js precisa ser carregado antes de clientes.js/veiculos.js/os.js. Nao tem protecao contra carga fora de ordem

---

## 2. Bugs Visuais e Logicos

### CRITICO — Modulos inexistentes referenciados
- `index.html` linha 158: `onclick="PECAS.abrirModal()"` — **PECAS nao existe em nenhum JS**. Clicar no botao "Nova Peca" vai dar erro no console
- Pagina `page-pecas` e `page-financeiro` tem `<div class="loading">Carregando...</div>` mas nenhum JS carrega esses conteudos — o usuario ve "Carregando..." eternamente

### BUG — login.html usa `event` implicito
- `showTab()` (login.html linha 95) usa `event.target` sem receber `event` como parametro. Funciona na maioria dos browsers por causa do `window.event` implicito, mas e comportamento nao-padrao e quebra no Firefox strict mode. Deveria ser `showTab(tab, e)` com `onclick="showTab('login', event)"`

### BUG — Kanban filtro depende de seletor fragil
- `kanban.js` linha 205: `col.querySelector('[style*="border-radius:12px"]')` — busca o contador pelo estilo inline. Se qualquer mudanca de CSS alterar esse valor, o filtro para de funcionar. Deveria usar classe ou data-attribute

### BUG — Drag and drop reseta opacidade cedo demais
- `kanban.js` linhas 133-134: o `setTimeout` de 200ms reseta a opacidade do card arrastado, mas o drag pode durar segundos. O card volta a parecer normal durante o arraste

### BUG — Bottom nav falta Dashboard, Financeiro e Config
- Bottom nav mobile so tem 5 itens (Patio, OS, Clientes, Estoque, Equipe). Faltam Dashboard, Financeiro e Configuracoes. O usuario mobile nao tem como acessar essas paginas exceto pelo menu hamburger

### BUG VISUAL — Menu toggle mobile sem posicao fixa
- O botao "Menu" e um `<button>` simples que sobe com o scroll. Deveria ser fixo no topo ou integrado a um header fixo pra mobile

---

## 3. Seguranca — XSS (innerHTML com dados do usuario)

### ALERTA ALTO — Dados do banco injetados direto em innerHTML sem sanitizacao

Todos os modulos inserem dados vindos do Supabase diretamente em template literals que vao pra innerHTML. Exemplos criticos:

1. **clientes.js** — `c.nome`, `c.whatsapp`, `c.observacoes` vao direto no HTML
2. **os.js** — `os.descricao` (linha 602) renderizado cru: `${os.descricao}` — se o usuario salvar `<img onerror=alert(1)>` na descricao, executa
3. **kanban.js** — nomes de clientes, mecanicos e placas renderizados sem escape
4. **equipe.js** — `m.nome`, `m.email` direto no HTML
5. **config-oficina.js** — `oficina.nome`, `oficina.cnpj`, etc. direto em `value="${...}"` — aspas duplas no nome da oficina quebram o HTML
6. **dashboard.js** — idem ao kanban

**Impacto:** Qualquer campo texto do banco pode injetar HTML/JS. Como o Supabase usa RLS e os dados sao por oficina, o risco e de self-XSS ou XSS persistente entre usuarios da mesma oficina (dono insere, mecanico ve).

**Recomendacao:** Criar funcao `escapeHtml(str)` no APP e usar em TODOS os pontos de interpolacao. Exemplo:
```
escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
```

### ALERTA MEDIO — Valores de ID injetados em onclick sem validacao
- IDs do Supabase (UUID) sao interpolados em strings onclick: `onclick="OS.abrirDetalhes('${os.id}')"`. UUIDs sao seguros por natureza, mas se qualquer dado nao-UUID entrar ali, pode quebrar ou explorar. Melhor usar `data-attributes` + `addEventListener`

---

## 4. Sistema de Modais

### Arquitetura atual
- Um unico overlay (`#modal-overlay`) com um container (`#modal-content`)
- `openModal(html)` injeta HTML inteiro no container
- `closeModal()` esconde o overlay
- Clique fora fecha

### Problemas
- **Nao suporta modais aninhados** — se o usuario esta no modal de detalhes da OS e clica "Editar" veiculo do cliente, o `closeModal()` + `openModal()` substitui o conteudo. Ao fechar, perde o modal anterior. Exemplo real: `clientes.js` linha 108 faz `closeModal(); VEICULOS.editar('${v.id}')` — funciona, mas nao volta pro modal do cliente depois
- **Sem stack de modais** — nao tem push/pop de estado. Cada `openModal` destroi o anterior
- **Sem animacao de entrada** — o overlay tem transicao de opacity, mas o `.modal` nao tem transform (ex: scale ou translateY). Parece "snap" no lugar
- **Sem trap de foco** — modal aberto nao prende Tab dentro dele. Tab pode navegar pra elementos atras do overlay (problema de acessibilidade)
- **ESC nao fecha modal** — nao tem listener de teclado pra Escape
- **Scroll do body nao e bloqueado** — com modal aberto, da pra scrollar o fundo

---

## 5. Performance

### Bom
- Queries no Supabase usam `select` com campos especificos e JOINs
- Dashboard faz 5 queries em paralelo via Promise.all — eficiente
- Kanban busca tudo de uma vez e agrupa no JS — evita N queries
- Catalogos (veiculos, servicos) sao dados estaticos, sem query
- Busca de peca no estoque usa filtro local no array (ja carregado) — rapido

### Ruim
- **Nenhum cache de dados** — cada vez que o usuario troca de aba e volta, faz query nova. Ex: clicar em OS, depois Kanban, depois OS de novo = 2 queries identicas de OS. Deveria cachear por 30-60s
- **Kanban faz 2 queries sequenciais** — primeiro busca as OS, depois os mecanicos. Deveria ser Promise.all
- **Nenhum debounce visual** — ao trocar de aba, mostra "Carregando..." sem skeleton/placeholder. Parece que travou
- **Scripts bloqueantes** — 12 arquivos JS carregados em sequencia sem `defer` ou `async`. O Supabase SDK do CDN tambem e sincrono. Em conexao lenta, a tela fica branca ate tudo carregar
- **Google Fonts sincrono** — o `@import` do Inter no CSS bloqueia a renderizacao. Deveria usar `<link rel="preload">` ou `font-display: swap`
- **catalogo-servicos.js** tem ~130 itens de servicos sempre carregados — ok por enquanto, mas se crescer pra centenas ficaria pesado. Nao e problema hoje

---

## 6. Mobile e Touch

### Bottom Nav
- 5 itens com touch target de `padding: 6px` — **muito pequeno**. Recomendacao minima do Google e 48x48px. Os icones emoji de 20px + padding nao atingem isso
- Faltam 4 paginas na bottom nav: Dashboard, Financeiro, Veiculos e Configuracoes
- Nao tem indicador visual de "mais opcoes" (ex: tres pontinhos) pra acessar paginas ocultas

### Kanban em tela pequena
- Colunas com `min-width: 220px` em scroll horizontal — **funciona tecnicamente**, mas a experiencia e ruim:
  - Usuario precisa arrastar horizontalmente pra ver status diferentes
  - Drag and drop com touch nao funciona nativamente — `draggable="true"` + `ondragstart` usa a API de Drag nativa que **nao funciona em mobile** (iOS e Android). O kanban e **inutilizavel em celular** pra mover cards
  - Sem indicacao visual de que da pra scrollar (nenhuma seta ou fade nas bordas)

### Outros problemas mobile
- Modal com `width: 95%` e ok, mas o conteudo do modal de detalhes da OS fica longo e precisa de scroll interno — funciona mas o header do modal some ao scrollar (nao e fixo dentro do modal)
- Tabelas com 5+ colunas (OS, Clientes, Veiculos) nao sao responsivas — cortam no mobile. Deveria trocar pra layout card em telas pequenas
- Menu hamburger e um botao solto no topo do conteudo sem header fixo — ao scrollar, desaparece
- Sidebar mobile (`transform: translateX(-100%)`) nao tem overlay escuro atras — se abrir a sidebar, o conteudo de tras fica interagivel

---

## 7. Melhorias de Estabilidade (sem features novas)

### Prioridade ALTA

1. **Criar funcao escapeHtml e usar em TODOS os innerHTML** — XSS e o risco mais grave do codigo atual

2. **Implementar drag and drop mobile** — substituir API nativa de Drag por Touch Events ou biblioteca leve (ex: SortableJS ~8KB). Sem isso, o kanban — que e a tela principal — nao funciona em celular

3. **Resolver modulos fantasma** — PECAS e FINANCEIRO estao no HTML mas nao existem no JS. Remover os botoes ou criar os modulos. Usuario clicar e dar erro de console e inaceitavel em producao

4. **Adicionar `defer` em todos os scripts** — evita render-blocking. Trocar:
   - `<script src="js/app.js">` por `<script src="js/app.js" defer">`

5. **Adicionar listener ESC pra fechar modal** — usabilidade basica esperada

### Prioridade MEDIA

6. **Substituir inline styles por classes CSS** — principalmente no kanban.js e os.js. Criar classes como `.kanban-card-header`, `.os-detail-info`, etc.

7. **Cache simples de dados** — guardar resultado de queries por 30s num Map no APP. Invalidar ao salvar/editar

8. **Skeleton loading** — trocar "Carregando..." por placeholders animados (CSS puro). Melhora percepcao de velocidade

9. **Aumentar touch targets mobile** — bottom nav precisa de `min-height: 48px` nos links

10. **Bloquear scroll do body com modal aberto** — `document.body.style.overflow = 'hidden'` no openModal, restaurar no closeModal

11. **Overlay escuro ao abrir sidebar mobile** — clique no overlay fecha a sidebar

### Prioridade BAIXA

12. **Extrair kanban.js filtrar()** pra usar classes/data-attributes em vez de `querySelector('[style*="..."]')`

13. **Agrupar scripts** — 12 arquivos JS separados geram 12 requests HTTP. Em producao, minificar e concatenar (ou usar um bundler leve)

14. **Service Worker basico** — offline page + cache de assets estaticos. Oficina mecanica tem internet instavel

15. **Acessibilidade** — focus trap em modais, `aria-label` nos botoes de emoji, `role="dialog"` no modal, `role="navigation"` na sidebar

---

## Resumo

| Area | Nota | Observacao |
|------|------|------------|
| Organizacao | 7/10 | Padrao consistente mas muito inline style e HTML em JS |
| Seguranca | 3/10 | innerHTML sem escape em toda a app — XSS em potencial |
| Modal system | 5/10 | Funciona pro basico, nao suporta aninhamento nem acessibilidade |
| Performance | 7/10 | Queries bem feitas, mas scripts bloqueantes e zero cache |
| Mobile | 4/10 | Bottom nav incompleto, kanban inutilizavel (drag nao funciona), touch targets pequenos |
| Estabilidade | 6/10 | 2 modulos fantasma (PECAS/FINANCEIRO), bugs de filtro e drag |

**Veredicto geral:** A base de codigo e boa e o padrao e consistente. Os 3 pontos criticos que precisam de atencao imediata antes de ir pra producao sao: (1) sanitizacao de HTML, (2) drag and drop mobile no kanban, e (3) modulos PECAS/FINANCEIRO que estao no HTML mas nao existem.
