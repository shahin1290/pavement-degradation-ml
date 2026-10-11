import { useState } from 'react';
import { Box, Button, Chip, Collapse, Typography } from '@mui/material';
import { alpha } from '@mui/material/styles';

import { useResults, Loading, SimpleTable, fmt, fmtPct } from './common';

// Fallback values (rows 0-999 test) in case bounds.json was built by an older make_results_data.py
const BOUNDS_DEFAULTS = {
  good_bounded: 3518,
  good_unbounded: 3975,
  realistic_unbounded: 2589,
  E2_unb_min: 16,
};

// "8,000 → 12,345": with limits → without limits. Red + bold when the new value is outside the limits.
const change = (a, b, limits, d = 0) => {
  const outside = limits && (b < limits[0] * 0.98 || b > limits[1] * 1.02);
  return (
    <span>
      {fmt(a, d)} → <span style={outside ? { fontWeight: 700, color: '#c0392b' } : undefined}>{fmt(b, d)}</span>
    </span>
  );
};

/** Big number with a short label, tinted by colour. */
function Stat({ value, label, color = 'primary' }) {
  return (
    <Box
      sx={{
        flex: '1 1 170px', p: 1.75, borderRadius: 2, borderLeft: 4, borderColor: `${color}.main`,
        bgcolor: (t) => alpha(t.palette[color].main, 0.07),
      }}
    >
      <Typography variant="h5" sx={{ color: `${color}.main`, lineHeight: 1.1 }}>{value}</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>{label}</Typography>
    </Box>
  );
}


/** One step of the story: number + line on the left, content on the right. */
function Step({ n, title, subtitle, last, children, details, detailsLabel = 'Show details' }) {
  const [open, setOpen] = useState(false);
  return (
    <Box sx={{ display: 'flex', gap: { xs: 1.5, md: 2.5 } }}>
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
        <Box
          sx={{
            width: 40, height: 40, borderRadius: '50%', bgcolor: last ? 'success.main' : 'primary.main', color: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '1.1rem',
          }}
        >
          {last ? '✓' : n}
        </Box>
        {!last && <Box sx={{ flex: 1, width: 3, bgcolor: 'divider', my: 0.5, borderRadius: 2 }} />}
      </Box>

      <Box sx={{ flex: 1, minWidth: 0, pb: last ? 0 : 3.5, pt: 0.5 }}>
        <Typography variant="overline" color="text.secondary" sx={{ lineHeight: 1.2 }}>
          {last ? 'Result' : `Step ${n}`}
        </Typography>
        <Typography variant="h6" sx={{ mb: 0.5 }}>{title}</Typography>
        {subtitle && <Typography color="text.secondary" sx={{ mb: 2 }}>{subtitle}</Typography>}
        {!subtitle && children && <Box sx={{ mb: 1.5 }} />}
        {children}
        {details && (
          <>
            <Button size="small" sx={{ mt: 1.5 }} onClick={() => setOpen(!open)}>
              {open ? 'Hide' : detailsLabel}
            </Button>
            <Collapse in={open}><Box sx={{ mt: 1.5 }}>{details}</Box></Collapse>
          </>
        )}
      </Box>
    </Box>
  );
}


function SummaryTab() {
  const ds = useResults('dataset');
  const bd = useResults('bounds');
  if (!ds.data || !bd.data) return <Loading error={ds.error || bd.error} />;

  const t = ds.data.total;
  const b = { ...BOUNDS_DEFAULTS, ...bd.data };
  const testCases = b.total.cases;                                   // 4,000
  const unrealistic = b.good_unbounded - b.realistic_unbounded;      // fitted, but unrealistic moduli
  const unrealisticPct = (100 * unrealistic) / testCases;
  // Full-data numbers when available, otherwise the 1,000-row test
  const F = b.full || {
    cases: testCases, unrealistic, unrealistic_pct: unrealisticPct, by_survey: b.by_survey,
    E1_above_8000: b.E1_above_8000, E2_below_100: b.E2_below_100, E4_above_400: b.E4_above_400,
  };

  return (
    <>
      <Step
        n={1}
        title={`Backcalculate without limits: all Östergötland data (${fmt(F.cases)} cases)`}
        details={(
          <SimpleTable
            rows={b.examples}
            columns={[
              { key: 'why', label: 'Problem', align: 'left' },
              { key: 'row_index', label: 'Row' },
              { key: 'survey', label: 'Survey' },
              ...['E1', 'E2', 'E3', 'E4'].map((e) => ({
                key: e, label: `${e} (MPa)`, format: (_, r) => change(r[`${e}_4L`], r[`${e}_unb`], b.limits[e]),
              })),
            ]}
          />
        )}
        detailsLabel="Show examples"
      >
        <Stat value={fmtPct(F.unrealistic_pct)} label={`had unrealistic moduli (${fmt(F.unrealistic)} cases)`} color="warning" />
        {b.full && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            First seen in a test on the first {fmt(testCases / 4)} rows ({fmtPct(unrealisticPct)}), then confirmed on all data.
          </Typography>
        )}
        {F.by_survey?.[0]?.unrealistic != null && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>Where the unrealistic moduli came from</Typography>
            <SimpleTable
              rows={[
                ...F.by_survey,
                { ...F, survey: 'total' },
              ]}
              highlight={(r) => r.survey !== 'total' && r.unrealistic_pct > 40}
              columns={[
                {
                  key: 'survey', label: 'Survey', align: 'left',
                  format: (v, r) => (v === 'total' ? <b>All surveys</b> : `${v} (${r.date})`),
                },
                {
                  key: 'unrealistic', label: 'Unrealistic cases',
                  format: (v, r) => (
                    <Box component="span" sx={{ fontWeight: 700, color: r.unrealistic_pct > 40 ? 'warning.main' : 'text.primary' }}>
                      {fmt(v)} ({fmtPct(r.unrealistic_pct)})
                    </Box>
                  ),
                },
                { key: 'E1_above_8000', label: 'E1 > 8,000', format: (v) => fmt(v) },
                { key: 'E2_below_100', label: 'E2 < 100', format: (v) => fmt(v) },
                { key: 'E4_above_400', label: 'E4 > 400', format: (v) => fmt(v) },
              ]}
            />
            <Typography variant="body2" color="text.secondary">
              Out of {fmt(F.by_survey[0].cases)} cases per survey. A case can break more than one limit. Highlighted: the two problem
              surveys (soft base E2 in Aug 2022, stiff subgrade E4 in May 2024).
            </Typography>
          </Box>
        )}
      </Step>

      <Step n={2} title="Add limits to stop unrealistic moduli">
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
          {Object.entries(b.limits).map(([e, [lo, hi]]) => (
            <Chip key={e} variant="outlined" color="primary" label={`${e}: ${fmt(lo)} – ${fmt(hi)} MPa`} />
          ))}
        </Box>
        <Typography color="text.secondary">
          The limits only change the cases that produced unrealistic moduli. All other cases keep exactly the same values.
        </Typography>
      </Step>

      <Step n={3} title="Backcalculate all Östergötland data with limits">
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5 }}>
          <Stat value={fmt(t.cases)} label={`cases: ${fmt(t.cases / 4)} locations × 4 surveys`} color="primary" />
          <Stat value={fmt(t.good_fit)} label="usable cases (fit within 5%)" color="success" />
        </Box>
      </Step>

      <Step n={4} last title={`${fmt(t.good_fit)} cases train the ML model`} />
    </>
  );
}

export default SummaryTab;
