import { useEffect, useState } from 'react';
import {
  Alert, Box, CircularProgress, Table, TableBody, TableCell, TableHead, TablePagination, TableRow,
} from '@mui/material';

import { loadResults } from '../../services/results';

/** Load a results file and show loading / error states. */
export function useResults(name) {
  const [state, setState] = useState({ data: null, error: null });
  useEffect(() => {
    let alive = true;
    loadResults(name)
      .then((data) => alive && setState({ data, error: null }))
      .catch((error) => alive && setState({ data: null, error }));
    return () => { alive = false; };
  }, [name]);
  return state;
}

export function Loading({ error }) {
  if (error) return <Alert severity="error">{error.message}</Alert>;
  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
      <CircularProgress />
    </Box>
  );
}

/**
 * Table from a column config: [{ key, label, align, format(value, row) }].
 * With `perPage`, shows a page at a time.
 */
export function SimpleTable({ columns, rows, highlight, perPage }) {
  const [page, setPage] = useState(0);
  const shown = perPage ? rows.slice(page * perPage, page * perPage + perPage) : rows;
  useEffect(() => setPage(0), [rows]);

  return (
    <Box sx={{ mb: 2 }}>
      <Box sx={{ overflowX: 'auto' }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              {columns.map((c) => (
                <TableCell key={c.key} align={c.align || 'right'} sx={{ fontWeight: 700, whiteSpace: 'nowrap' }}>
                  {c.label}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {shown.map((r, i) => (
              <TableRow key={i} hover sx={highlight?.(r) ? { bgcolor: '#fff7e6' } : undefined}>
                {columns.map((c) => (
                  <TableCell key={c.key} align={c.align || 'right'} sx={{ whiteSpace: 'nowrap' }}>
                    {c.format ? c.format(r[c.key], r) : r[c.key]}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Box>
      {perPage && rows.length > perPage && (
        <TablePagination
          component="div"
          count={rows.length}
          page={page}
          onPageChange={(_, p) => setPage(p)}
          rowsPerPage={perPage}
          rowsPerPageOptions={[perPage]}
        />
      )}
    </Box>
  );
}

export const fmt = (v, d = 0) => (v == null ? '–' : Number(v).toLocaleString(undefined, { maximumFractionDigits: d, minimumFractionDigits: d }));
export const fmtPct = (v) => (v == null ? '–' : `${Number(v).toFixed(1)}%`);
