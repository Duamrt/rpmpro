const puppeteer = require('puppeteer-core');
const path = require('path');

const CHROME = 'C:/Users/Duam Rodrigues/.cache/puppeteer/chrome/win64-146.0.7680.153/chrome-win64/chrome.exe';
const OUT = 'C:/Users/Duam Rodrigues/rpmpro/v2/img';

async function esconderBarraAdmin(page) {
  await page.evaluate(() => {
    const barra = document.getElementById('admin-barra');
    if (barra) barra.style.display = 'none';
    document.body.style.paddingTop = '0';
  });
}

async function anonimizar(page) {
  await page.evaluate(() => {
    // Borra nome do dono/usuario logado na sidebar
    document.querySelectorAll('.sidebar-footer, .sidebar-user, .user-info, [class*="sidebar-bottom"]').forEach(el => {
      el.style.filter = 'blur(6px)';
    });

    // Borra qualquer elemento que tenha o nome do perfil logado
    // (o avatar+nome no rodapé da sidebar)
    const sidebarLinks = document.querySelectorAll('.sidebar nav a, .sidebar-nav a');
    // Pega o último bloco da sidebar (onde fica o user)
    const sidebar = document.querySelector('.sidebar');
    if (sidebar) {
      // O último div dentro da sidebar costuma ser o info do usuario
      const children = Array.from(sidebar.children);
      const lastDiv = children[children.length - 1];
      if (lastDiv) lastDiv.style.filter = 'blur(6px)';
    }

    // Borra nomes de clientes nas OS (preserva placas e mecânicos)
    // Seletores comuns pra nome de cliente
    document.querySelectorAll('.os-cliente, .cliente-nome, [class*="cliente"]').forEach(el => {
      el.style.filter = 'blur(5px)';
    });

    // Nas linhas de OS: o texto do nome do cliente geralmente é o 2º ou 3º span
    // Varre todos os cards de OS e borra os nomes
    document.querySelectorAll('.os-card, .os-item, [class*="os-row"], [class*="list-item"]').forEach(card => {
      // Pega texto que parece nome de pessoa (não é placa, não é mecanico label)
      const spans = card.querySelectorAll('span, div, p');
      spans.forEach(el => {
        const txt = el.textContent.trim();
        // Borra se parecer nome de pessoa/empresa (letras, espaço, >5 chars) mas não é status/label
        const isStatus = /^(EXECUCAO|DIAGNOSTICO|ENTREGUE|PRONTO|ENTRADA|CANCELADA|PENDENTE|OS|R\$|#)/.test(txt.toUpperCase());
        const isPlaca = /^[A-Z]{3}[0-9][A-Z0-9][0-9]{2}$/.test(txt.replace(/\s/g,''));
        const isShort = txt.length < 4;
        if (!isStatus && !isPlaca && !isShort && el.children.length === 0) {
          // Candidato a nome de pessoa
          if (/[a-zA-ZÀ-ú]{3,}/.test(txt) && txt.length > 5) {
            el.style.filter = 'blur(5px)';
          }
        }
      });
    });

    // Dashboard: borra nomes de mecânicos no ranking (opcional - são funcionarios)
    // Decidimos manter os mecanicos pois mostram o sistema em uso real
  });
}

(async () => {
  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    defaultViewport: { width: 1440, height: 900 }
  });

  const page = await browser.newPage();

  console.log('Login...');
  await page.goto('https://rpmpro.com.br/v2/login.html', { waitUntil: 'networkidle2', timeout: 30000 });
  await page.waitForSelector('input[type="email"]', { timeout: 10000 });
  await page.type('input[type="email"]', 'admin@rpmpro.com.br');
  await page.type('input[type="password"]', 'admin123');
  await page.click('button[type="submit"]');
  await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 20000 });

  // Acessa Carbon Car Service
  await page.goto('https://rpmpro.com.br/v2/admin.html', { waitUntil: 'networkidle2', timeout: 20000 });
  await new Promise(r => setTimeout(r, 4000));
  await page.evaluate(() => {
    document.querySelectorAll('[data-tab]').forEach(t => {
      if (t.dataset.tab === 'oficinas') t.click();
    });
  });
  await new Promise(r => setTimeout(r, 3000));
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button')).filter(b => b.textContent.trim() === 'Acessar');
    if (btns.length >= 2) btns[1].click(); else if (btns.length) btns[0].click();
  });
  await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 20000 }).catch(() => {});
  await new Promise(r => setTimeout(r, 5000));

  const baseUrl = page.url().replace('kanban-v2.html', '');

  // === DASHBOARD ===
  await page.goto(baseUrl + 'dashboard-v2.html', { waitUntil: 'networkidle2', timeout: 20000 });
  await new Promise(r => setTimeout(r, 4000));
  await esconderBarraAdmin(page);
  await anonimizar(page);

  // Borra especificamente o bloco do usuario logado (ultimo filho da sidebar)
  await page.evaluate(() => {
    const sidebar = document.querySelector('.sidebar, nav.sidebar');
    if (!sidebar) return;
    // Encontra elemento com "Duam" ou qualquer nome proprio
    sidebar.querySelectorAll('*').forEach(el => {
      if (el.children.length === 0 && el.textContent.includes('Duam')) {
        el.closest('div') && (el.closest('div').style.filter = 'blur(6px)');
      }
    });
  });

  await page.screenshot({ path: path.join(OUT, 'screenshot-kanban.png') });
  console.log('Dashboard salvo');

  // === OS LIST ===
  await page.goto(baseUrl + 'os-list-v2.html', { waitUntil: 'networkidle2', timeout: 20000 });
  await new Promise(r => setTimeout(r, 4000));
  await esconderBarraAdmin(page);

  // Borra nome do dono na sidebar e nomes de clientes
  await page.evaluate(() => {
    const sidebar = document.querySelector('.sidebar, nav.sidebar');
    if (sidebar) {
      sidebar.querySelectorAll('*').forEach(el => {
        if (el.children.length === 0 && el.textContent.includes('Duam')) {
          const parent = el.closest('div') || el.parentElement;
          if (parent) parent.style.filter = 'blur(6px)';
        }
      });
    }

    // Borra nomes de clientes nas linhas de OS
    // Estrutura típica: .os-nome-cliente, ou texto dentro de .os-card
    document.querySelectorAll('.os-cliente-nome, [class*="cliente-nome"]').forEach(el => {
      el.style.filter = 'blur(5px)';
    });

    // Varre todos os elementos de texto e borra candidatos a nome de pessoa
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    const toBlur = [];
    let node;
    while (node = walker.nextNode()) {
      const txt = node.textContent.trim();
      const parent = node.parentElement;
      if (!parent) continue;
      const tag = parent.tagName.toLowerCase();
      if (['script', 'style', 'button', 'input'].includes(tag)) continue;
      // Parece nome de pessoa: tem letras, espaço, >5 chars, não é status/valor
      const isNome = txt.length > 5 &&
        /^[A-ZÀ-Ú][a-zà-ú]/.test(txt) &&
        !/^(Carbon|RPM|Dashboard|Patio|Clientes|Veiculos|Servicos|Estoque|Financeiro|Nota|Caixa|Comissao|Folha|Equipe|Produtividade|Agendamentos|Fornecedores|Fila|Ordens|Execucao|Atendimento|Catalogo|Oficina|Todas|Hoje|Semana|Entrada|Diagnostico|Pronto|Entregue|Cancelada|Pendentes)/.test(txt);
      if (isNome) toBlur.push(parent);
    }
    // Remove duplicatas e aplica blur
    const seen = new Set();
    toBlur.forEach(el => {
      if (!seen.has(el)) {
        seen.add(el);
        el.style.filter = 'blur(5px)';
      }
    });
  });

  await page.screenshot({ path: path.join(OUT, 'screenshot-agendamentos.png') });
  console.log('OS List salvo');

  await browser.close();
  console.log('Concluido!');
})();
