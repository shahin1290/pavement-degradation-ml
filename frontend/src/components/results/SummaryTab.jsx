import { useState } from 'react';
import { Box, Button, Chip, Collapse, Paper, Typography } from '@mui/material';

import { useResults, Loading, SimpleTable, fmt, fmtPct } from './common';

// "8,000 → 12,345": with limits → without limits. Red + bold when the new value is outside the limits.
const change = (a, b, limits, d = 0) => {
  const outside = limits && (b < limits[0] * 0.98 || b > limits[1] * 1.02);
  return (
    <span>
      {fmt(a, d)} → <span style={outside ? { fontWeight: 700, color: '#c62828' } : undefined}>{fmt(b, d)}</span>
    </span>
  );
};

// One card = one question, one result, one decision. Details stay hidden until clicked.
function ResultCard({ question, before, after, beforeLabel, afterLabel, finding, extra, decision, details }) {
  const [open, setOpen] = useState(false);
  return (
    <Paper variant="outlined" sx={{ p: 3, mb: 2 }}>
      <Typography variant="h6" gutterBottom>{question}</Typography>

      {before != null && (
        <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 2, flexWrap: 'wrap', mb: 1 }}>
          <Box>
            <Typography variant="h4" component="span">{before}</Typography>
            <Typography variant="body2" color="text.secondary">{beforeLabel}</Typography>
          </Box>
          <Typography variant="h5" color="text.secondary">→</Typography>
          <Box>
            <Typography variant="h4" component="span">{after}</Typography>
            <Typography variant="body2" color="text.secondary">{afterLabel}</Typography>
          </Box>
        </Box>
      )}

      <Typography sx={{ mb: 1.5 }}>{finding}</Typography>
      {extra}
      <Chip color="primary" label={`Decision: ${decision}`} />

      {details && (
        <>
          <Box sx={{ mt: 1 }}>
            <Button size="small" onClick={() => setOpen(!open)}>{open ? 'Hide details' : 'Show details'}</Button>
          </Box>
          <Collapse in={open}>
            <Box sx={{ mt: 1 }}>{details}</Box>
          </Collapse>
        </>
      )}
    </Paper>
  );
}

const surveyColumns = [
  { key: 'survey', label: 'Survey', align: 'left', format: (v, r) => `${v} (${r.date})` },
  { key: 'good_before', label: 'Good fits before', format: fmtPct },
  { key: 'good_after', label: 'Good fits after', format: fmtPct },
];

function SummaryTab() {
  const ds = useResults('dataset');
  const ly = useResults('layers');
  const bd = useResults('bounds');
  if (!ds.data || !ly.data || !bd.data) return <Loading error={ds.error || ly.error || bd.error} />;

  const t = ds.data.total;
  const l = ly.data;
  const b = bd.data;
  const worst = [...ds.data.by_survey].sort((x, y) => x.good_fit_pct - y.good_fit_pct)[0];

  return (
    <>
      <ResultCard
        question="1. How much data does the ML model learn from?"
        before={fmt(t.cases)}
        beforeLabel="cases backcalculated"
        after={fmt(t.good_fit)}
        afterLabel={`used for training (${fmtPct((100 * t.good_fit) / t.cases)})`}
        finding={`Cases are used when the backcalculation reproduces the measured deflections within 5% (RMS).
          The weakest survey is survey ${worst.survey} (${worst.date}) with ${fmtPct(worst.good_fit_pct)} good fits.`}
        decision="train on good fits only"
        details={(
          <SimpleTable
            rows={ds.data.by_survey}
            columns={[
              { key: 'survey', label: 'Survey', align: 'left', format: (v, r) => `${v} (${r.date})` },
              { key: 'cases', label: 'Cases', format: (v) => fmt(v) },
              { key: 'good_fit_pct', label: 'Good fits', format: fmtPct },
              { key: 'median_rms', label: 'Median RMS', format: (v) => `${v}%` },
            ]}
          />
        )}
      />

      <ResultCard
        question="2. Should a 5th stiff layer (rock) be added?"
        before={fmtPct(l.total.good_before)}
        beforeLabel="good fits, 4 layers"
        after={fmtPct(l.total.good_after)}
        afterLabel="good fits, 4 or 5 layers"
        finding={`It improves the fit, but rock does not move: the stiff layer was needed at ${fmt(l.rows_any_survey)}
          locations in some survey, yet in all four surveys at only ${fmt(l.rows_all_surveys)}. This points to a
          difference between surveys, not real rock.`}
        decision="keep 4 layers"
        details={(
          <>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              Rows {l.rows}, {fmt(l.total.cases)} cases. {fmt(l.total.five_layer_cases)} cases used 5 layers,
              median depth {l.median_depth_m} m.
            </Typography>
            <SimpleTable
              rows={l.by_survey}
              columns={[...surveyColumns, { key: 'five_layer_cases', label: 'Cases with 5 layers' }]}
            />
          </>
        )}
      />

      <ResultCard
        question="3. Should the modulus limits be removed?"
        before={fmtPct(b.total.good_before)}
        beforeLabel="good fits, with limits"
        after={fmtPct(b.total.good_after)}
        afterLabel="good fits, no limits"
        finding={`Almost everything fits without limits, but the values become unrealistic: E1 above 8,000 MPa in
          ${fmt(b.E1_above_8000)} cases (up to about ${fmt(b.E1_unb_p95)}) and E2 below 100 MPa in
          ${fmt(b.E2_below_100)} cases. A good fit does not mean correct moduli.`}
        extra={(
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, alignItems: 'center', mb: 1.5 }}>
            <Typography variant="body2" color="text.secondary">Limits used (MPa):</Typography>
            {Object.entries(b.limits).map(([e, [lo, hi]]) => (
              <Chip key={e} size="small" variant="outlined" label={`${e}: ${fmt(lo)} – ${fmt(hi)}`} />
            ))}
          </Box>
        )}
        decision="keep the limits"
        details={(
          <>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              Rows {b.rows}, {fmt(b.total.cases)} cases ({fmt(b.recalculated)} touched a limit and were recalculated).
            </Typography>
            <SimpleTable rows={b.by_survey} columns={surveyColumns} />
            <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>
              Examples without limits: with limits → without limits (red = outside the limits)
            </Typography>
            <SimpleTable
              rows={b.examples}
              columns={[
                { key: 'why', label: 'Problem', align: 'left' },
                { key: 'row_index', label: 'Row' },
                { key: 'survey', label: 'Survey' },
                ...['E1', 'E2', 'E3', 'E4'].map((e) => ({
                  key: e, label: `${e} (MPa)`, format: (_, r) => change(r[`${e}_4L`], r[`${e}_unb`], b.limits[e]),
                })),
                { key: 'rms', label: 'RMS (%)', format: (_, r) => change(r.rms_pct_4L, r.rms_pct_unb, null, 1) },
              ]}
            />
          </>
        )}
      />
    </>
  );
}

export default SummaryTab;
