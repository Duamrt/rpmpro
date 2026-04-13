const puppeteer = require('puppeteer-core');
const path = require('path');

const CHROME = 'C:/Users/Duam Rodrigues/.cache/puppeteer/chrome/win64-146.0.7680.153/chrome-win64/chrome.exe';
const OUT = 'C:/Users/Duam Rodrigues/rpmpro/v2/img';

async function prep(page) {
  await page.evaluate(() => {
    // Remove barra admin
    const b = document.getElementById('admin-barra');
    if (b) b.style.display = 'none';
    document.body.style.paddingTop = '0';

    // Borra bloco do usuário logado — sobe só até filho direto da sidebar
    const sidebar = document.querySelector('nav.sidebar, .sidebar');
    if (!sidebar) return;
    sidebar.querySelectorAll('*').forEach(el => {
      if (el.children.length === 0 && el.textContent.trim().includes('Duam')) {
        // Sobe até o filho direto da sidebar
        let p = el;
        while (p.parentElement && p.parentElement !== sidebar) {
          p = p.parentElement;
        }
        if (p.parentElement === sidebar) {
          p.style.filter = 'blur(8px)';
        }
      }
    });
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

  // Acessa Carbon
  await page.goto('https://rpmpro.com.br/v2/admin.html', { waitUntil: 'networkidle2', timeout: 20000 });
  await new Promise(r => setTimeout(r, 4000));
  await page.evaluate(() => {
    document.querySelectorAll('[data-tab]').forEach(t => { if (t.dataset.tab === 'oficinas') t.click(); });
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
  await prep(page);
  await page.screenshot({ path: path.join(OUT, 'screenshot-kanban.png') });
  console.log('Dashboard salvo');

  // === OS LIST ===
  await page.goto(baseUrl + 'os-list-v2.html', { waitUntil: 'networkidle2', timeout: 20000 });
  await new Promise(r => setTimeout(r, 4000));
  await prep(page);
  await page.evaluate(() => {
    // Blur cirúrgico: só no .os-cliente (nome do cliente em cada OS)
    document.querySelectorAll('.os-cliente').forEach(el => {
      el.style.filter = 'blur(6px)';
      el.style.userSelect = 'none';
    });
    // Blur no número da OS (#—) se tiver dados sensíveis — mantemos
    // Blur no os-veiculo — mantemos (modelo do carro, não é dado pessoal)
    // Mantemos mecânicos visíveis (.os-mecanico)
  });
  await page.screenshot({ path: path.join(OUT, 'screenshot-agendamentos.png') });
  console.log('OS List salvo');

  await browser.close();
  console.log('Pronto!');
})();
