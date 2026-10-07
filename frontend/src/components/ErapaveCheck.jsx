import { Alert, Box, Chip, Paper, Table, TableBody, TableCell, TableHead, TableRow, Typography } from '@mui/material';

const POINTS = ['D0', 'D130', 'D215', 'D300', 'D450', 'D600', 'D900', 'D1200', 'D1500'];
const fmt = (v, d = 1) => (v == null ? '–' : Number(v).toLocaleString(undefined, { maximumFractionDigits: d, minimumFractionDigits: d }));

function verdict(rms) {
  if (rms <= 3) return { label: 'Good match (RMS ≤ 3%)', color: 'success' };
  if (rms <= 5) return { label: 'Acceptable (RMS ≤ 5%)', color: 'info' };
  return { label: 'Needs ERAPave iteration (RMS > 5%)', color: 'warning' };
}

function ErrorCell({ value }) {
  const big = Math.abs(value) > 5;
  return (
    <TableCell align="right" sx={big ? { color: '#c62828', fontWeight: 700 } : undefined}>
      {value > 0 ? '+' : ''}{fmt(value)}%
    </TableCell>
  );
}

/**
 * Measured deflections vs ERAPave run with the ML moduli (and the converged run, if available).
 * `check` comes from holdout.json -> case.erapave = { ml: {...}, final: {...} }.
 */
function ErapaveCheck({ check, measured, predicted }) {
  const ml = check?.ml;
  if (!ml) return null;
  const fin = check.final;
  const v = verdict(ml.rms_pct);

  // Were the ERAPave runs made with the moduli the current model predicts?
  const KEYS = ['E1_Asphalt_MPa', 'E2_Base_MPa', 'E3_Subbase_MPa', 'E4_Subgrade_MPa'];
  const differs = predicted
    && KEYS.some((k, i) => Math.abs(ml.E[i] / predicted[k] - 1) > 0.02);

  return (
    <Paper variant="outlined" sx={{ p: 2, mt: 3 }}>
      <Typography variant="h6">ERAPave check</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
        The ML moduli were entered in ERAPave (100 kN axle, 800 kPa). How well do the calculated deflections match
        the measured TSD basin?
      </Typography>

      {differs && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          This ERAPave run used different moduli ({ml.E.map((e, i) => `E${i + 1} ${fmt(e, 0)}`).join(', ')}) than the
          current model predicts above, probably from an earlier model version. Rerun ERAPave with the current
          prediction to check the current model.
        </Alert>
      )}

      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, alignItems: 'center', mb: 2 }}>
        <Chip color={v.color} label={v.label} />
        <Typography variant="body2">
          RMS <strong>{fmt(ml.rms_pct, 2)}%</strong> · RMSE {fmt(ml.rmse_um, 1)} µm
        </Typography>
        <Typography variant="body2" color="text.secondary">
          · Moduli used: {ml.E.map((e, i) => `E${i + 1} ${fmt(e, 0)}`).join(', ')} MPa
        </Typography>
      </Box>

      {fin && (
        <Typography variant="body2" sx={{ mb: 1.5 }}>
          After ERAPave iteration: RMS <strong>{fmt(fin.rms_pct, 2)}%</strong> with{' '}
          {fin.E.map((e, i) => `E${i + 1} ${fmt(e, 0)}`).join(', ')} MPa
          {check.iterations ? ` (${check.iterations} iterations)` : ''}.
        </Typography>
      )}

      <Box sx={{ overflowX: 'auto' }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 700 }}>Point</TableCell>
              <TableCell align="right" sx={{ fontWeight: 700 }}>Measured (µm)</TableCell>
              <TableCell align="right" sx={{ fontWeight: 700 }}>ERAPave, ML moduli (µm)</TableCell>
              <TableCell align="right" sx={{ fontWeight: 700 }}>Error</TableCell>
              {fin && <TableCell align="right" sx={{ fontWeight: 700 }}>ERAPave, converged (µm)</TableCell>}
              {fin && <TableCell align="right" sx={{ fontWeight: 700 }}>Error</TableCell>}
            </TableRow>
          </TableHead>
          <TableBody>
            {POINTS.map((p, i) => (
              <TableRow key={p}>
                <TableCell>{p}</TableCell>
                <TableCell align="right">{fmt(measured[p])}</TableCell>
                <TableCell align="right">{fmt(ml.deflections[i])}</TableCell>
                <ErrorCell value={ml.error_pct[i]} />
                {fin && <TableCell align="right">{fmt(fin.deflections[i])}</TableCell>}
                {fin && <ErrorCell value={fin.error_pct[i]} />}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Box>
      <Typography variant="caption" color="text.secondary">
        Errors above 5% in red. Source: {ml.file}{fin ? `, ${fin.file}` : ''}.
      </Typography>
    </Paper>
  );
}

export default ErapaveCheck;
