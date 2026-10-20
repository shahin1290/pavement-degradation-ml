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

/** E1 / E2 / E3 / E4 with impossible values in red. */
function Moduli({ values, limits }) {
  return (
    <Box component="span" sx={{ fontVariantNumeric: 'tabular-nums' }}>
      {values.map((v, i) => {
        const [lo, hi] = Object.values(limits)[i];
        const bad = v < lo * 0.98 || v > hi * 1.02;
        return (
          <span key={i}>
            {i > 0 && <Box component="span" sx={{ color: 'text.disabled' }}> / </Box>}
            <Box component="span" sx={bad ? { color: 'error.main', fontWeight: 800 } : undefined}>{fmt(v)}</Box>
          </span>
        );
      })}
    </Box>
  );
}

function SummaryTab() {
  const ds = useResults('dataset');
  const bd = useResults('bounds');
  if (!ds.data || !bd.data) return <Loading error={ds.error || bd.error} />;

  const t = ds.data.total;
  const b = bd.data;
  const F = b.full;
  if (!F?.by_road) return <Loading error={new Error('bounds.json is out of date: run python make_results_data.py')} />;

  return (
    <>
      <Step
        n={1}
        title="Correct the deflections to 20 °C"
        subtitle="Warm asphalt is soft and bends more. Every deflection near the load is converted to what it would be at 20 °C asphalt temperature, so all surveys can be compared."
      >
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
          <Chip variant="outlined" color="primary" label="Park et al. (2002) equation" />
          <Chip variant="outlined" color="primary" label="C0 = 2.45E-05, A = −8.24E-08 (fitted on our data)" />
        </Box>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          After the correction E1 no longer depends on the temperature (see “Temperature correction”).
        </Typography>
      </Step>

      <Step
        n={2}
        title="Backcalculate all data without limits"
        subtitle="Unrealistic = the calculated bowl matches the measured bowl, but a layer gets an impossible stiffness."
      >
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, mb: 1 }}>
          <Stat value={fmtPct(F.unrealistic_pct)} label={`of all bowls are unrealistic (${fmt(F.unrealistic)} of ${fmt(F.cases)})`} color="warning" />
        </Box>

        {b.examples?.length > 0 && (
          <>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, mt: 2.5, mb: 1 }}>Examples</Typography>
            <SimpleTable
              rows={b.examples}
              columns={[
                { key: 'road', label: 'Road, survey', align: 'left', format: (v, r) => <span><b>{v}</b>, {r.date}</span> },
                {
                  key: 'no_limits', label: 'Without limits: E1 / E2 / E3 / E4 (MPa)',
                  format: (v, r) => <span><Moduli values={v} limits={b.limits} /> <small>(fit {fmt(r.rms_no_limits, 1)}%)</small></span>,
                },
                {
                  key: 'limits', label: 'With limits (MPa)',
                  format: (v, r) => <span><Moduli values={v} limits={b.limits} /> <small>(fit {fmt(r.rms_limits, 1)}%)</small></span>,
                },
              ]}
            />
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              Both answers match the measured bowl within 3%, but the red values are not possible in a real road.
            </Typography>
          </>
        )}

      </Step>

      <Step
        n={3}
        title="Add realistic limits"
        subtitle="Only the unrealistic bowls change: they get the best-fitting realistic answer. All other bowls keep the same values."
      >
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, alignItems: 'center' }}>
          <Typography variant="body2" sx={{ fontWeight: 700, mr: 0.5 }}>Compromise limits:</Typography>
          {Object.entries(b.limits).map(([e, [lo, hi]]) => (
            <Chip key={e} variant="outlined" color="primary" label={`${e}: ${fmt(lo)} – ${fmt(hi)} MPa`} />
          ))}
        </Box>
      </Step>

      <Step n={4} title="Backcalculate all data with limits">
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5 }}>
          <Stat value={fmt(t.cases)} label={`bowls: ${fmt(t.cases / 4)} locations × 4 surveys`} color="primary" />
          <Stat value={fmt(t.good_fit)} label="usable bowls (fit within 5%)" color="success" />
        </Box>
      </Step>

      <Step n={5} last title={`${fmt(t.good_fit)} bowls train the ML model`} />
    </>
  );
}

export default SummaryTab;
