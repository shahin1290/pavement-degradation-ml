// Loads the result files built by `python make_results_data.py` (frontend/public/results/*.json)
// and, for other regions, from a sub-folder (e.g. results/vg/). Each file is fetched once and cached.

const cache = {};

export function loadResults(name, dir = '') {
  const path = `${dir}${name}`;
  if (!cache[path]) {
    cache[path] = fetch(`/results/${path}.json`).then((r) => {
      if (!r.ok) {
        throw new Error(`Could not load results/${path}.json (HTTP ${r.status}).`);
      }
      return r.json();
    });
    cache[path].catch(() => delete cache[path]); // allow a retry after an error
  }
  return cache[path];
}

/** { col: [v0, v1, ...] } -> [{ col: v0 }, { col: v1 }, ...] */
export function toRows(columns) {
  const names = Object.keys(columns);
  const n = names.length ? columns[names[0]].length : 0;
  const rows = new Array(n);
  for (let i = 0; i < n; i += 1) {
    const row = {};
    for (const c of names) row[c] = columns[c][i];
    rows[i] = row;
  }
  return rows;
}

/** Rows -> CSV text, for the "Download" buttons */
export function toCsv(rows, cols) {
  const esc = (v) => (v == null ? '' : /[",\n]/.test(String(v)) ? `"${String(v).replace(/"/g, '""')}"` : String(v));
  return [cols.join(','), ...rows.map((r) => cols.map((c) => esc(r[c])).join(','))].join('\n');
}

export function downloadCsv(filename, text) {
  const url = URL.createObjectURL(new Blob([text], { type: 'text/csv;charset=utf-8' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
