import { useState } from 'react';
import { Box, Button, Collapse, Typography } from '@mui/material';
import { alpha } from '@mui/material/styles';

import { useResults, Loading, SimpleTable, fmt } from './common';
import C0Calculation from './C0Calculation';
import E1TempChart from './E1TempChart';

// What the temperature correction does to E1: no correction vs own data vs Park statewide (data: temp_correction.json).
const CASES = [
  { id: 'none', name: 'No correction', color: 'text.secondary', what: 'Measured bowls used as they are' },
  { id: 'own', name: 'Own data', color: 'primary.main', what: 'Corrected to 20 °C with C0 = 2.45E-05 (fitted on our data)' },
  { id: 'state', name: 'Park statewide', color: 'warning.dark', what: 'Corrected to 20 °C with C0 = 4.65E-05 (North Carolina)' },
];
const pctText = (v) => `${v > 0 ? '+' : ''}${fmt(v, 1)}%`;

/** Verdict: is E1 still tied to the temperature? Goal = 0 %. */
function verdict(p) {
  if (Math.abs(p) <= 0.5) return { text: 'E1 no longer depends on temperature', c: 'success' };
  if (p < 0) return { text: 'Warm days look softer (not corrected)', c: 'error' };
  return { text: 'Warm days look stiffer (over-corrected)', c: 'warning' };
}

function SubTitle({ children }) {
  return <Typography variant="subtitle1" sx={{ fontWeight: 700, mt: 3.5, mb: 1 }}>{children}</Typography>;
}

/** One card per case with the E1 change per +1 °C. */
function CaseCard({ c, trend }) {
  const v = verdict(trend.pct);
  return (
    <Box sx={{ p: 2, borderRadius: 3, border: 2, borderColor: (t) => alpha(t.palette[v.c].main, 0.6),
      bgcolor: (t) => alpha(t.palette[v.c].main, 0.05) }}
    >
      <Typography variant="h6" sx={{ lineHeight: 1.2, color: c.color }}>{c.name}</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5, minHeight: 40 }}>{c.what}</Typography>
      <Typography variant="h4" sx={{ lineHeight: 1, color: `${v.c}.main` }}>{pctText(trend.pct)}</Typography>
      <Typography variant="body2" color="text.secondary">E1 change per +1 °C warmer</Typography>
      <Typography variant="body2" sx={{ mt: 1, fontWeight: 700, color: `${v.c}.dark` }}>{v.text}</Typography>
      <Typography variant="body2" sx={{ mt: 0.5 }}>
        Typical E1: <b>{fmt(trend.median_E1)} MPa</b>
      </Typography>
    </Box>
  );
}

function TempCorrectionTab() {
  const { data, error } = useResults('temp_correction');
  const [showC0, setShowC0] = useState(false);
  if (!data) return <Loading error={error} />;
  const trend = Object.fromEntries(data.e1_trend.map((r) => [r.id, r]));
  const cases = CASES.filter((c) => trend[c.id]);
  const ex = data.example;
  const first = ex?.rows[0];
  const last = ex?.rows[ex.rows.length - 1];

  return (
    <>
      <Typography color="text.secondary" sx={{ mb: 2.5 }}>
        Warm asphalt is soft. Without correction the same road gets a lower E1 on a warm day, only because of the weather.
        The correction should remove this, so E1 stays the same whatever the temperature (goal: 0% per °C).
        Measured at the same location on different survey days.
      </Typography>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: `repeat(${cases.length}, 1fr)` }, gap: 2 }}>
        {cases.map((c) => <CaseCard key={c.id} c={c} trend={trend[c.id]} />)}
      </Box>

      {data.e1_vs_dt && (
        <>
          <SubTitle>Warmer than usual → how much does E1 change? (all locations)</SubTitle>
          <E1TempChart data={data.e1_vs_dt} e20={data.e1_vs_temp?.erlingsson?.find((p) => p.T === 20)?.E}
            ownMedian={trend.own?.median_E1} />
        </>
      )}

      {ex && (
        <>
          <SubTitle>Example: one location measured on 4 days (row {ex.row_index}, road {ex.road_key}, asphalt {ex.thk1_mm} mm)</SubTitle>
          <SimpleTable
            rows={[...ex.rows, { date: `Coldest → warmest (${fmt(first.T, 1)} → ${fmt(last.T, 1)} °C)`, change: true }]}
            highlight={(r) => r.change}
            columns={[
              { key: 'date', label: 'Survey', align: 'left', format: (v, r) => (r.change ? <b>{v}</b> : v) },
              { key: 'T', label: 'Asphalt temp.', format: (v, r) => (r.change ? '' : `${fmt(v, 1)} °C`) },
              ...cases.map((c) => ({
                key: c.id, label: `E1 ${c.name} (MPa)`,
                format: (v, r) => {
                  if (!r.change) return fmt(v);
                  const p = 100 * (last[c.id] / first[c.id] - 1);
                  const vv = verdict(p / Math.max(last.T - first.T, 1));
                  return <Box component="span" sx={{ fontWeight: 700, color: `${vv.c}.dark` }}>{pctText(p)}</Box>;
                },
              })),
            ]}
          />
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            The road did not change between the surveys, so E1 should stay about the same.
          </Typography>
        </>
      )}

      <Box sx={{ mt: 4, pt: 2.5, borderTop: 1, borderColor: 'divider' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
          <Typography variant="h6">How C0 = 2.45E-05 was calculated</Typography>
          <Button size="small" variant={showC0 ? 'outlined' : 'contained'} onClick={() => setShowC0((v) => !v)}>
            {showC0 ? 'Hide steps' : 'Show step by step'}
          </Button>
        </Box>
        <Collapse in={showC0} unmountOnExit>
          <Box sx={{ mt: 1.5 }}><C0Calculation /></Box>
        </Collapse>
      </Box>
    </>
  );
}

export default TempCorrectionTab;
