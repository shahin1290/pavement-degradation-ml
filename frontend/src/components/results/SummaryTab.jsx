import { useState } from 'react';
import { Box, Button, Chip, Collapse, Paper, Typography } from '@mui/material';
import { alpha } from '@mui/material/styles';

import { useResults, Loading, SimpleTable, fmt, fmtPct } from './common';

// "8,000 → 12,345": with limits → without limits. Red + bold when the new value is outside the limits.
const change = (a, b, limits, d = 0) => {
  const outside = limits && (b < limits[0] * 0.98 || b > limits[1] * 1.02);
  return (
    <span>
      {fmt(a, d)} → <span style={outside ? { fontWeight: 700, color: '#c0392b' } : undefined}>{fmt(b, d)}</span>
    </span>
  );
};

/** Big number with a short label, tinted by colour (success / warning / primary). */
function Stat({ value, label, color = 'primary' }) {
  return (
    <Box
      sx={{
        flex: '1 1 180px',
        p: 2,
        borderRadius: 2,
        borderLeft: 4,
        borderColor: `${color}.main`,
        bgcolor: (t) => alpha(t.palette[color].main, 0.07),
      }}
    >
      <Typography variant="h4" sx={{ color: `${color}.main`, lineHeight: 1.1 }}>{value}</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>{label}</Typography>
    </Box>
  );
}

/** One small box with a heading and short bullet points. */
function Point({ title, color, items }) {
  return (
    <Box sx={{ flex: '1 1 260px', p: 2, borderRadius: 2, border: 1, borderColor: 'divider', bgcolor: 'background.paper' }}>
      <Typography variant="subtitle2" sx={{ color: `${color}.main`, mb: 1 }}>{title}</Typography>
      <Box component="ul" sx={{ m: 0, pl: 2.2, '& li': { mb: 0.75, fontSize: '0.9rem', lineHeight: 1.45 } }}>
        {items.map((t, i) => <li key={i}>{t}</li>)}
      </Box>
    </Box>
  );
}

// One card = one question, the key numbers, the explanation and the decision. Details stay hidden until clicked.
function ResultCard({ n, question, stats, children, decision, details }) {
  const [open, setOpen] = useState(false);
  return (
    <Paper variant="outlined" sx={{ p: { xs: 2, md: 3 }, mb: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
        <Box
          sx={{
            width: 32, height: 32, borderRadius: '50%', bgcolor: 'primary.main', color: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, flexShrink: 0,
          }}
        >
          {n}
        </Box>
        <Typography variant="h6">{question}</Typography>
      </Box>

      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 2 }}>
        {stats.map((s) => <Stat key={s.label} {...s} />)}
      </Box>

      {children}

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap', mt: 2 }}>
        <Chip color="primary" label={`Decision: ${decision}`} />
        {details && (
          <Button size="small" onClick={() => setOpen(!open)}>{open ? 'Hide details' : 'Show details'}</Button>
        )}
      </Box>
      {details && (
        <Collapse in={open}>
          <Box sx={{ mt: 2 }}>{details}</Box>
        </Collapse>
      )}
    </Paper>
  );
}

const surveyColumns = [
  { key: 'survey', label: 'Survey', align: 'left', format: (v, r) => `${v} (${r.date})` },
  { key: 'good_before', label: 'Good fits with limits', format: fmtPct },
  { key: 'good_after', label: 'Good fits without limits', format: fmtPct },
];

function SummaryTab() {
  const ds = useResults('dataset');
  const bd = useResults('bounds');
  if (!ds.data || !bd.data) return <Loading error={ds.error || bd.error} />;

  const t = ds.data.total;
  const b = bd.data;
  const ml = b.ml_filter_test;
  const worst = [...ds.data.by_survey].sort((x, y) => x.good_fit_pct - y.good_fit_pct)[0];

  return (
    <>
      <ResultCard
        n={1}
        question="How much data does the ML model learn from?"
        stats={[
          { value: fmt(t.cases), label: 'cases backcalculated (Östergötland, 4 surveys)', color: 'primary' },
          { value: fmt(t.good_fit), label: `good fits used for training (${fmtPct((100 * t.good_fit) / t.cases)})`, color: 'success' },
        ]}
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
      >
        <Typography color="text.secondary">
          A case is a good fit when the backcalculated moduli reproduce the measured deflections within 5% (RMS).
          The weakest survey is survey {worst.survey} ({worst.date}) with {fmtPct(worst.good_fit_pct)} good fits.
        </Typography>
      </ResultCard>

      <ResultCard
        n={2}
        question="Why use modulus limits in the backcalculation?"
        stats={[
          { value: fmtPct(b.total.good_before), label: 'usable with limits (good fit, realistic moduli)', color: 'success' },
          { value: fmtPct(b.total.good_after), label: 'good fit without limits…', color: 'primary' },
          { value: fmtPct(b.realistic_unbounded_pct), label: '…but only this share also has realistic moduli', color: 'warning' },
        ]}
        decision="keep the limits"
        details={(
          <>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              Test on rows {b.rows} ({fmt(b.total.cases)} cases). {fmt(b.recalculated)} cases touched a limit and were
              recalculated without limits.
            </Typography>
            <SimpleTable rows={b.by_survey} columns={surveyColumns} />
            <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>
              Examples: with limits → without limits (red = outside the normal range)
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
      >
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
          <Point
            title="What happens without limits"
            color="warning"
            items={[
              `Almost every case fits, but ${fmt(b.good_unbounded - b.realistic_unbounded)} good fits have unrealistic moduli.`,
              `Asphalt too stiff: E1 above 8,000 MPa in ${fmt(b.E1_above_8000)} cases (up to ~${fmt(b.E1_unb_p95)}).`,
              `Base too soft: E2 below 100 MPa in ${fmt(b.E2_below_100)} cases (as low as ${fmt(b.E2_unb_min)}).`,
              `Subgrade too stiff: E4 above 400 MPa in ${fmt(b.E4_above_400)} cases.`,
              'Cause: layers trade off. A very stiff top on a very soft base gives almost the same bowl as normal values.',
            ]}
          />
          <Point
            title="Problem for the ML model"
            color="error"
            items={[
              'The model copies what it learns: unrealistic training values give unrealistic predictions.',
              'Unbounded answers jump between surveys for the same road, which is noisy training data.',
              `Keeping only the realistic unbounded cases removes the difficult roads: error on those roads
               rises from ${ml.bounded.difficult_rms.toFixed(1)}% to ${ml.unbounded_realistic.difficult_rms.toFixed(1)}%.`,
            ]}
          />
          <Point
            title="Why we chose limits"
            color="success"
            items={[
              `More usable data: ${fmt(b.good_bounded)} realistic good fits vs ${fmt(b.realistic_unbounded)} without limits.`,
              'Every modulus stays within a physically realistic range for its material.',
              'One consistent method for all cases, as in standard backcalculation practice.',
              'A value on a limit means "at least" or "at most" this stiff.',
            ]}
          />
        </Box>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, alignItems: 'center', mt: 2 }}>
          <Typography variant="body2" color="text.secondary">Limits used (MPa):</Typography>
          {Object.entries(b.limits).map(([e, [lo, hi]]) => (
            <Chip key={e} size="small" variant="outlined" label={`${e}: ${fmt(lo)} – ${fmt(hi)}`} />
          ))}
        </Box>
      </ResultCard>
    </>
  );
}

export default SummaryTab;
