/**
 * Supabase REST helper using curl (works around Node.js fetch timeouts in some environments)
 */
const { execSync } = require('child_process');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;

function supabaseRequest(method, path, { body, params, headers: extraHeaders } = {}) {
  let url = `${SUPABASE_URL}/rest/v1/${path}`;
  if (params) {
    const qs = new URLSearchParams(params).toString();
    url += `?${qs}`;
  }

  const headers = {
    'apikey': SUPABASE_KEY,
    'Authorization': `Bearer ${SUPABASE_KEY}`,
    'Content-Type': 'application/json',
    ...extraHeaders
  };

  const headerArgs = Object.entries(headers).map(([k, v]) => `-H "${k}: ${v}"`).join(' ');
  const bodyArg = body ? `-d '${JSON.stringify(body).replace(/'/g, "'\\''")}'` : '';

  const cmd = `curl -s --max-time 30 -X ${method} "${url}" ${headerArgs} ${bodyArg}`;

  try {
    const result = execSync(cmd, { maxBuffer: 50 * 1024 * 1024 }).toString();
    if (!result.trim()) return { data: null, error: null };
    const parsed = JSON.parse(result);
    if (parsed.code && parsed.message) {
      return { data: null, error: parsed };
    }
    return { data: parsed, error: null };
  } catch (e) {
    return { data: null, error: { message: e.message } };
  }
}

// Supabase-js-like interface
const supabase = {
  from(table) {
    let _select = '*';
    let _filters = [];
    let _order = null;
    let _limit = null;
    let _head = false;
    let _count = null;
    let _method = 'GET';

    const builder = {
      select(columns, opts) {
        _select = columns || '*';
        if (opts?.count) _count = opts.count;
        if (opts?.head) _head = true;
        return builder;
      },
      eq(col, val) { _filters.push(`${col}=eq.${val}`); return builder; },
      ilike(col, val) { _filters.push(`${col}=ilike.${val}`); return builder; },
      in(col, vals) { _filters.push(`${col}=in.(${vals.join(',')})`); return builder; },
      order(col, { ascending } = {}) {
        _order = `${col}.${ascending === false ? 'desc' : 'asc'}`;
        return builder;
      },
      limit(n) { _limit = n; return builder; },

      async upsert(data, { onConflict } = {}) {
        const headers = {
          'Prefer': 'resolution=merge-duplicates,return=representation'
        };
        if (onConflict) {
          headers['Prefer'] = 'resolution=merge-duplicates,return=representation';
        }
        const rows = Array.isArray(data) ? data : [data];
        // Use curl for upsert
        const url = `${SUPABASE_URL}/rest/v1/${table}${onConflict ? `?on_conflict=${onConflict}` : ''}`;
        const cmd = buildCurlCmd('POST', url, rows, headers);
        try {
          const result = execSync(cmd, { maxBuffer: 50 * 1024 * 1024 }).toString();
          if (!result.trim()) return { data: null, error: null };
          const parsed = JSON.parse(result);
          if (parsed.code && parsed.message) return { data: null, error: parsed };
          return { data: parsed, error: null };
        } catch (e) {
          return { data: null, error: { message: e.message } };
        }
      },

      async then(resolve) {
        const params = [];
        params.push(`select=${encodeURIComponent(_select)}`);
        for (const f of _filters) params.push(f);
        if (_order) params.push(`order=${_order}`);
        if (_limit) params.push(`limit=${_limit}`);

        const url = `${SUPABASE_URL}/rest/v1/${table}?${params.join('&')}`;
        const headers = {};
        if (_count) headers['Prefer'] = `count=${_count}`;
        if (_head) headers['Prefer'] = (headers['Prefer'] ? headers['Prefer'] + ',' : '') + 'count=exact';

        const cmd = buildCurlCmd('GET', url, null, headers);
        try {
          const result = execSync(cmd, { maxBuffer: 50 * 1024 * 1024 });
          const text = result.toString();

          // Extract count from headers if requested
          if (_head && _count) {
            // Use HEAD request with count
            const headCmd = buildCurlCmd('HEAD', url, null, { 'Prefer': 'count=exact' }, true);
            const headResult = execSync(headCmd, { maxBuffer: 1024 * 1024 }).toString();
            const countMatch = headResult.match(/content-range:\s*\d*-\d*\/(\d+)/i);
            const count = countMatch ? parseInt(countMatch[1]) : 0;
            resolve({ data: null, count, error: null });
            return;
          }

          if (!text.trim()) { resolve({ data: [], error: null }); return; }
          const parsed = JSON.parse(text);
          if (parsed.code && parsed.message) {
            resolve({ data: null, error: parsed });
          } else {
            resolve({ data: parsed, error: null });
          }
        } catch (e) {
          resolve({ data: null, error: { message: e.message } });
        }
      }
    };
    return builder;
  }
};

function buildCurlCmd(method, url, body, extraHeaders, includeHeaders) {
  const headers = {
    'apikey': SUPABASE_KEY,
    'Authorization': `Bearer ${SUPABASE_KEY}`,
    'Content-Type': 'application/json',
    ...extraHeaders
  };

  const headerArgs = Object.entries(headers).map(([k, v]) => `-H "${k}: ${v}"`).join(' ');

  let bodyArg = '';
  if (body) {
    // Write body to temp file to avoid shell escaping issues
    const tmpFile = `/tmp/supabase-body-${Date.now()}.json`;
    require('fs').writeFileSync(tmpFile, JSON.stringify(body));
    bodyArg = `-d @${tmpFile}`;
  }

  const inclHeaders = includeHeaders ? '-i' : '';
  return `curl -s --max-time 60 ${inclHeaders} -X ${method} "${url}" ${headerArgs} ${bodyArg}`;
}

module.exports = { supabase, supabaseRequest, buildCurlCmd };
