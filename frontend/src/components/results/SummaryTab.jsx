import { Box, Chip, Typography } from '@mui/material';
import { alpha } from '@mui/material/styles';

import { useResults, Loading, SimpleTable, fmt, fmtPct } from './common';

// Unrealistic = the bowl fits well WITHOUT limits, but a modulus is more than 2 % outside the limits.

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
function Step({ n, title, subtitle, last, children }) {
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

      <Box sx={{ flex: 1, minWidth: 0, pb: last ? 0 : 4, pt: 0.5 }}>
        <Typography variant="overline" color="text.secondary" sx={{ lineHeight: 1.2 }}>
          {last ? 'Result' : `Step ${n}`}
        </Typography>
        <Typography variant="h6" sx={{ mb: 0.5 }}>{title}</Typography>
        {subtitle && <Typography color="text.secondary" sx={{ mb: 2 }}>{subtitle}</Typography>}
        {children}
      </Box>
    </Box>
  );
}

/** Bar + % + count for the share of unrealistic bowls. */
function Share({ pct, count }) {
  const color = pct > 50 ? 'error.main' : 'warning.main';
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, justifyContent: 'flex-end' }}>
      <Box sx={{ width: 90, height: 8, borderRadius: 4, bgcolor: 'action.hover', overflow: 'hidden' }}>
        <Box sx={{ width: `${pct}%`, height: '100%', bgcolor: color }} />
      </Box>
      <Box component="span" sx={{ minWidth: 52, fontWeight: 700, color: pct > 50 ? 'error.main' : 'text.primary' }}>{fmtPct(pct)}</Box>
      <Box component="span" sx={{ minWidth: 48, color: 'text.secondary' }}>{fmt(count)}</Box>
    </Box>
  );
}

const shareColumn = { key: 'unrealistic_pct', label: 'Unrealistic', format: (v, r) => <Share pct={v} count={r.unrealistic} /> };

function SummaryTab() {
  const ds = useResults('dataset');
  const bd = useResults('bounds');
  if (!ds.data || !bd.data) return <Loading error={ds.error || bd.error} />;

  const t = ds.data.total;
  const b = bd.data;
  const F = b.full;
  if (!F?.by_road) return <Loading error={new Error('bounds.json is out of date: run python make_results_data.py')} />;
  const worst = F.by_road[0];

  return (
    <>
      <Step
        n={1}
        title="Backcalculate all data without limits"
        subtitle="Unrealistic = the calculated bowl matches the measured bowl, but a layer gets an impossible stiffness (for example a base of 21 MPa under a subbase of 80,000 MPa)."
      >
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, mb: 1 }}>
          <Stat value={fmtPct(F.unrealistic_pct)} label={`of all bowls are unrealistic (${fmt(F.unrealistic)} of ${fmt(F.cases)})`} color="warning" />
        </Box>

        <Typography variant="subtitle1" sx={{ fontWeight: 700, mt: 2.5, mb: 1 }}>By survey</Typography>
        <SimpleTable
          rows={F.by_survey}
          columns={[
            { key: 'date', label: 'Survey', align: 'left' },
            { key: 'cases', label: 'Bowls', format: (v) => fmt(v) },
            shareColumn,
          ]}
        />

        <Typography variant="subtitle1" sx={{ fontWeight: 700, mt: 2.5, mb: 1 }}>By road</Typography>
        <SimpleTable
          rows={F.by_road}
          highlight={(r) => r.unrealistic_pct > 50}
          columns={[
            { key: 'road', label: 'Road', align: 'left', format: (v) => <b>{v}</b> },
            { key: 'km', label: 'Length', format: (v) => `${fmt(v, 1)} km` },
            { key: 'cases', label: 'Bowls', format: (v) => fmt(v) },
            shareColumn,
          ]}
        />
        <Typography variant="body2" color="text.secondary">
          Road {worst.road} is unrealistic in {fmtPct(worst.unrealistic_pct)} of bowls, so its layer data may not match the real road.
        </Typography>
      </Step>

      <Step
        n={2}
        title="Add realistic limits"
        subtitle="Only the unrealistic bowls change: they get the best-fitting realistic answer. All other bowls keep the same values."
      >
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
          {Object.entries(b.limits).map(([e, [lo, hi]]) => (
            <Chip key={e} variant="outlined" color="primary" label={`${e}: ${fmt(lo)} – ${fmt(hi)} MPa`} />
          ))}
        </Box>
      </Step>

      <Step n={3} title="Backcalculate all data with limits">
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5 }}>
          <Stat value={fmt(t.cases)} label={`bowls: ${fmt(t.cases / 4)} locations × 4 surveys`} color="primary" />
          <Stat value={fmt(t.good_fit)} label="usable bowls (fit within 5%)" color="success" />
        </Box>
      </Step>

      <Step n={4} last title={`${fmt(t.good_fit)} bowls train the ML model`} />
    </>
  );
}

export default SummaryTab;
