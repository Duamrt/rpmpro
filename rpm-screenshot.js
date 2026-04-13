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

(async () => {
  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    defaultViewport: { width: 1440, height: 900 }
  });

  const page = await browser.newPage();

  // Login como admin
  console.log('Login...');
  await page.goto('https://rpmpro.com.br/v2/login.html', { waitUntil: 'networkidle2', timeout: 30000 });
  await page.waitForSelector('input[type="email"]', { timeout: 10000 });
  await page.type('input[type="email"]', 'admin@rpmpro.com.br');
  await page.type('input[type="password"]', 'admin123');
  await page.click('button[type="submit"]');
  await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 20000 });

  // Admin.html — aba Oficinas → Acessar Carbon
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
    if (btns.length >= 2) btns[1].click(); else if (btns.length === 1) btns[0].click();
  });
  await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 20000 }).catch(() => {});
  await new Promise(r => setTimeout(r, 5000));
  console.log('Kanban URL:', page.url());

  const baseUrl = page.url().replace('kanban-v2.html', '');

  // === DASHBOARD ===
  await page.goto(baseUrl + 'dashboard-v2.html', { waitUntil: 'networkidle2', timeout: 20000 });
  await new Promise(r => setTimeout(r, 4000));
  await esconderBarraAdmin(page);
  await page.screenshot({ path: path.join(OUT, 'screenshot-dashboard.png') });
  console.log('Dashboard salvo');

  // === KANBAN (pátio) ===
  await page.goto(baseUrl + 'kanban-v2.html', { waitUntil: 'networkidle2', timeout: 20000 });
  await new Promise(r => setTimeout(r, 5000));
  await esconderBarraAdmin(page);
  await page.screenshot({ path: path.join(OUT, 'screenshot-kanban.png') });
  console.log('Kanban salvo');

  // === OS LIST ===
  await page.goto(baseUrl + 'os-list-v2.html', { waitUntil: 'networkidle2', timeout: 20000 });
  await new Promise(r => setTimeout(r, 4000));
  await esconderBarraAdmin(page);
  await page.screenshot({ path: path.join(OUT, 'screenshot-os-list.png') });
  console.log('OS List salvo');

  // === FINANCEIRO — aba Caixa (menos comprometedor que Fechamento) ===
  await page.goto(baseUrl + 'financeiro-v2.html', { waitUntil: 'networkidle2', timeout: 20000 });
  await new Promise(r => setTimeout(r, 4000));
  // Clica na aba Caixa
  await page.evaluate(() => {
    const tabs = document.querySelectorAll('.tab-btn, [data-tab], .fin-tab');
    tabs.forEach(t => { if (t.textContent.trim() === 'Caixa') t.click(); });
  });
  await new Promise(r => setTimeout(r, 2000));
  await esconderBarraAdmin(page);
  await page.screenshot({ path: path.join(OUT, 'screenshot-financeiro.png') });
  console.log('Financeiro salvo');

  await browser.close();
  console.log('Concluido!');
})();
