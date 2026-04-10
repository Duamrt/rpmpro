// RPM Pro — Utilitários

// Cache em memória + sessionStorage com TTL
// CACHE.get(key, ttlSegundos, fetchFn) → retorna dados cacheados ou busca novos
// CACHE.bust(key) → invalida manualmente (ex: após salvar maquininha nova)
const CACHE = (() => {
  const _mem = {};

  function _load(key) {
    try {
      const raw = sessionStorage.getItem('rpm_cache_' + key);
      if (!raw) return null;
      const entry = JSON.parse(raw);
      if (Date.now() > entry.exp) { sessionStorage.removeItem('rpm_cache_' + key); return null; }
      return entry.data;
    } catch { return null; }
  }

  function _save(key, data, ttlSeg) {
    try {
      sessionStorage.setItem('rpm_cache_' + key, JSON.stringify({ data, exp: Date.now() + ttlSeg * 1000 }));
    } catch {}
  }

  return {
    async get(key, ttlSeg, fetchFn) {
      if (_mem[key] && Date.now() < _mem[key].exp) return _mem[key].data;
      const stored = _load(key);
      if (stored !== null) { _mem[key] = { data: stored, exp: Date.now() + ttlSeg * 1000 }; return stored; }
      const data = await fetchFn();
      _mem[key] = { data, exp: Date.now() + ttlSeg * 1000 };
      _save(key, data, ttlSeg);
      return data;
    },
    bust(key) {
      delete _mem[key];
      try { sessionStorage.removeItem('rpm_cache_' + key); } catch {}
    }
  };
})();

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
