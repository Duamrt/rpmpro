// RPM Pro — Utilitários
// Escape HTML pra prevenir XSS
function esc(str) {
  if (str === null || str === undefined) return '';
  const div = document.createElement('div');
  div.textContent = String(str);
  return div.innerHTML;
}

// Escape pra contexto de atributo (onclick, value, etc) — escapa aspas simples e duplas
function escAttr(str) {
  if (str === null || str === undefined) return '';
  return String(str).replace(/&/g,'&amp;').replace(/'/g,'&#39;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

// Sanitiza busca PostgREST — remove caracteres que manipulam filtros
function sanitizeBusca(str) {
  if (!str) return '';
  return String(str).replace(/[,().]/g, '').trim();
}
