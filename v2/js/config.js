// RPM Pro — Configuração Supabase
const SUPABASE_URL = 'https://roeeyypssutzfzzkypsq.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJvZWV5eXBzc3V0emZ6emt5cHNxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ4MTk0MTgsImV4cCI6MjA5MDM5NTQxOH0.9oCOmABUTXox3FaRViD2zcUaqv94VfOJFMQYz_fcJi4';

const _dbRaw = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ============================================================
// Pilares de Confiabilidade: Retry + Timeout + Erro amigável
// Envolve TODA query Supabase automaticamente
// ============================================================
const DB_TIMEOUT = 10000; // 10s
const DB_RETRIES = 2;     // 2 tentativas extras
const DB_RETRY_DELAY = 2000; // 2s entre tentativas

function _isNetworkError(err) {
  if (!err) return false;
  const msg = (err.message || err.toString()).toLowerCase();
  return msg.includes('fetch') || msg.includes('network') || msg.includes('failed') ||
         msg.includes('timeout') || msg.includes('aborted') || msg.includes('econnrefused');
}

function _wrapQueryResult(promise, context) {
  // Adiciona timeout
  const withTimeout = Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout: servidor nao respondeu em ' + (DB_TIMEOUT/1000) + 's')), DB_TIMEOUT))
  ]);

  // Adiciona retry em erro de rede
  const withRetry = withTimeout.then(result => {
    // Pilar 2: Falha silenciosa — diferencia erro de vazio
    if (result && result.error) {
      const code = result.error.code || '';
      const msg = result.error.message || '';
      // RLS retornou vazio sem erro = ok (data=[])
      // Mas se tem code de erro real, avisa
      if (code === '42501' || msg.includes('permission') || msg.includes('policy')) {
        console.warn('[DB] Acesso negado:', context, result.error);
      }
    }
    return result;
  }).catch(async (err) => {
    if (_isNetworkError(err)) {
      // Retry
      for (let i = 0; i < DB_RETRIES; i++) {
        await new Promise(r => setTimeout(r, DB_RETRY_DELAY));
        try {
          const retry = await Promise.race([
            promise,
            new Promise((_, rej) => setTimeout(() => rej(new Error('Timeout retry')), DB_TIMEOUT))
          ]);
          return retry; // Deu certo no retry
        } catch (retryErr) {
          if (i === DB_RETRIES - 1) {
            // Ultimo retry falhou
            console.error('[DB] Falha apos ' + (DB_RETRIES + 1) + ' tentativas:', context, retryErr);
            if (typeof APP !== 'undefined' && APP.toast) {
              APP.toast('Erro de conexao. Verifique sua internet.', 'error');
            }
            return { data: null, error: { message: 'Sem conexao com o servidor' } };
          }
        }
      }
    }
    // Erro nao e de rede — timeout ou outro
    console.error('[DB] Erro:', context, err);
    if (typeof APP !== 'undefined' && APP.toast) {
      APP.toast('Erro ao carregar dados. Tente novamente.', 'error');
    }
    return { data: null, error: { message: err.message || 'Erro desconhecido' } };
  });

  return withRetry;
}

// Proxy que intercepta .then() de qualquer query Supabase
function _wrapBuilder(builder, tableName) {
  return new Proxy(builder, {
    get(target, prop) {
      const val = target[prop];
      if (typeof val === 'function') {
        return function(...args) {
          const result = val.apply(target, args);
          // Se retornou outro builder (chaining), envolve tambem
          if (result && typeof result.then === 'function' && typeof result.select === 'function') {
            return _wrapBuilder(result, tableName);
          }
          if (result && typeof result.then === 'function' && typeof result.select !== 'function') {
            // E uma promise final (ex: .single(), ultimo da chain)
            return _wrapBuilder(result, tableName);
          }
          if (result && typeof result.eq === 'function') {
            return _wrapBuilder(result, tableName);
          }
          return result;
        };
      }
      // Intercepta .then pra aplicar timeout+retry na execucao final
      if (prop === 'then') {
        return function(resolve, reject) {
          return _wrapQueryResult(
            target.then(r => r),
            tableName
          ).then(resolve, reject);
        };
      }
      return val;
    }
  });
}

// db final: Proxy que envolve .from() com proteções
const db = new Proxy(_dbRaw, {
  get(target, prop) {
    if (prop === 'from') {
      return function(table) {
        const builder = target.from(table);
        return _wrapBuilder(builder, table);
      };
    }
    // Auth, realtime, storage — passa direto sem wrapper
    return target[prop];
  }
});
