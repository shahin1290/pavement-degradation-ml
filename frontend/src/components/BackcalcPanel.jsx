import { Box, Chip, Paper, Table, TableBody, TableCell, TableHead, TableRow, Typography } from '@mui/material';
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

// ML prediction next to the physics backcalculation of the same bowl (backend: services/backcalc.py).
const LAYERS = [
  { key: 'E1_Asphalt_MPa', label: 'E1 Asphalt', id: 'E1' },
  { key: 'E2_Base_MPa', label: 'E2 Base', id: 'E2' },
  { key: 'E3_Subbase_MPa', label: 'E3 Subbase', id: 'E3' },
  { key: 'E4_Subgrade_MPa', label: 'E4 Subgrade', id: 'E4' },
];
const COLORS = { measured: '#222222', backcalc: '#2a78d6', ml: '#e07b39' };
const fmt = (v) => Math.round(v).toLocaleString();

// fit error of a calculated bowl vs the measured bowl
const fitLevel = (rms) =>
  rms <= 3 ? { color: 'success', text: 'very good' } : rms <= 5 ? { color: 'info', text: 'good' } : { color: 'warning', text: 'poor' };

function FitChip({ label, rms }) {
  if (rms == null) return null;
  const l = fitLevel(rms);
  return <Chip size="small" color={l.color} variant="outlined" label={`${label}: ${rms.toFixed(1)}% (${l.text})`} />;
}

function BackcalcPanel({ backcalc, ml }) {
  if (!backcalc) return null;
  const b = backcalc;
  const limitText = (id) => {
    const hit = b.at_limit.find((a) => a.startsWith(id));
    return hit ? (hit.endsWith('min') ? 'at lower limit' : 'at upper limit') : null;
  };
  const chart = b.sensors_mm.map((r, i) => ({
    r,
    measured: b.measured_um[i],
    backcalc: b.bowl_backcalc_um[i],
    ml: b.bowl_ml_um ? b.bowl_ml_um[i] : null,
  }));

  return (
    <Box sx={{ mt: 4 }}>
      <Typography variant="h6" gutterBottom>ML prediction vs physics backcalculation</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        The same bowl is also backcalculated with the layered elastic solver (same model and settings as ERAPave and the
        Excel results: 50 kN wheel, 800 kPa, 4 layers). The solver searches for the E1–E4 that reproduce the measured bowl;
        the ML model predicts them directly.
      </Typography>

      <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' } }}>
        <Paper variant="outlined" sx={{ p: 2, overflowX: 'auto' }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Layer</TableCell>
                <TableCell align="right" sx={{ color: COLORS.ml, fontWeight: 700 }}>ML (MPa)</TableCell>
                <TableCell align="right" sx={{ color: COLORS.backcalc, fontWeight: 700 }}>Backcalc (MPa)</TableCell>
                <TableCell align="right">Difference</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {LAYERS.map((l) => {
                const m = ml[l.key]; const p = b[l.key];
                const diff = Math.round((100 * (m - p)) / p);
                const lim = limitText(l.id);
                return (
                  <TableRow key={l.key}>
                    <TableCell>{l.label}</TableCell>
                    <TableCell align="right">{fmt(m)}</TableCell>
                    <TableCell align="right">
                      {fmt(p)}
                      {lim && <Chip size="small" color="warning" variant="outlined" label={lim} sx={{ ml: 1 }} />}
                    </TableCell>
                    <TableCell align="right">{diff > 0 ? '+' : ''}{diff}%</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
          <Typography variant="body2" sx={{ mt: 2, mb: 1 }}>How well each set of moduli reproduces the measured bowl:</Typography>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <FitChip label="Backcalc" rms={b.fit_rms_pct} />
            <FitChip label="ML" rms={b.ml_fit_rms_pct} />
          </Box>
          {b.at_limit.length > 0 && (
            <Typography variant="caption" color="text.secondary" component="p" sx={{ mt: 1.5 }}>
              A modulus at a limit means the solver wanted to go further than the allowed range: the bowl does not pin that
              layer down (common for thin layers), so that value is uncertain.
            </Typography>
          )}
          {!b.usable && (
            <Typography variant="caption" color="warning.main" component="p" sx={{ mt: 1 }}>
              The backcalculation fits the bowl poorly (more than 5%): no set of E1–E4 explains this bowl well.
            </Typography>
          )}
        </Paper>

        <Paper variant="outlined" sx={{ p: 2 }}>
          <Typography variant="body2" color="text.secondary">Deflection bowl (µm)</Typography>
          <Box sx={{ height: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chart} margin={{ top: 10, right: 10, bottom: 18, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="r" type="number" domain={[0, 1500]} ticks={[0, 300, 600, 900, 1200, 1500]}
                  label={{ value: 'Distance from load (mm)', position: 'insideBottom', offset: -10, fontSize: 12 }} />
                <YAxis reversed width={45} />
                <Tooltip formatter={(v) => (v == null ? '–' : `${v.toFixed(1)} µm`)} labelFormatter={(r) => `${r} mm`} />
                <Legend verticalAlign="top" height={28} />
                <Line dataKey="measured" name="Measured" stroke={COLORS.measured} strokeWidth={0}
                  dot={{ r: 4, fill: COLORS.measured }} isAnimationActive={false} />
                <Line dataKey="backcalc" name="From backcalc moduli" stroke={COLORS.backcalc} strokeWidth={2}
                  dot={false} isAnimationActive={false} />
                {b.bowl_ml_um && (
                  <Line dataKey="ml" name="From ML moduli" stroke={COLORS.ml} strokeWidth={2} strokeDasharray="6 4"
                    dot={false} isAnimationActive={false} />
                )}
              </LineChart>
            </ResponsiveContainer>
          </Box>
        </Paper>
      </Box>

      <Typography variant="caption" color="text.secondary" component="p" sx={{ mt: 1.5 }}>
        Both lines are calculated with the same solver; the closer a line is to the measured points, the better those moduli
        explain the measurement. If both fit well but the moduli differ, the bowl cannot tell the layers apart (several
        combinations of E1–E4 give almost the same bowl). Backcalculation took {b.seconds} s.
      </Typography>
    </Box>
  );
}

export default BackcalcPanel;
