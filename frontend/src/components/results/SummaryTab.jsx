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

const LAYERS = [['E1', 'Asphalt'], ['E2', 'Base'], ['E3', 'Subbase'], ['E4', 'Subgrade']];

/** One card per limit option (New / Compromise); the chosen one is highlighted. */
function OptionCard({ o, chosen, base }) {
  const good = o.total.usable_pct >= 90;
  return (
    <Box sx={{
      flex: '1 1 300px', p: 2, borderRadius: 3, border: 2,
      borderColor: chosen ? 'success.main' : 'divider',
      bgcolor: chosen ? (t) => alpha(t.palette.success.main, 0.05) : 'background.paper',
    }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Typography variant="h6" sx={{ lineHeight: 1.2 }}>{o.label}</Typography>
        {chosen && <Chip size="small" color="success" label="✓ chosen" />}
      </Box>
      <Box sx={{ mt: 1, mb: 1.5, display: 'grid', gridTemplateColumns: 'auto 1fr', columnGap: 1.5, rowGap: 0.25 }}>
        {LAYERS.map(([e, name]) => {
          const [lo, hi] = o.limits[e];
          const diff = base && (lo !== base.limits[e][0] || hi !== base.limits[e][1]);
          return (
            <Box key={e} sx={{ display: 'contents' }}>
              <Typography variant="body2" color="text.secondary">{name} {e}</Typography>
              <Typography variant="body2" sx={{ fontWeight: diff ? 700 : 400, fontVariantNumeric: 'tabular-nums' }}>
                {fmt(lo)} – {fmt(hi)} MPa
              </Typography>
            </Box>
          );
        })}
      </Box>
      <Typography variant="h4" sx={{ color: good ? 'success.main' : 'error.main', lineHeight: 1 }}>{fmtPct(o.total.usable_pct)}</Typography>
      <Typography variant="body2" color="text.secondary">usable bowls (fit ≤ 5%)</Typography>
      <Box sx={{ display: 'flex', gap: 2, mt: 1.25, flexWrap: 'wrap' }}>
        <Typography variant="body2"><b>{fmtPct(o.total.at_limit_pct)}</b> <span style={{ opacity: 0.7 }}>at a limit</span></Typography>
      </Box>
    </Box>
  );
}

function SummaryTab() {
  const ds = useResults('dataset');
  const bd = useResults('bounds');
  const lc = useResults('limits_compare_own');
  if (!ds.data || !bd.data || !lc.data) return <Loading error={ds.error || bd.error || lc.error} />;

  const t = ds.data.total;
  const b = bd.data;
  const opts = lc.data.options || [];
  const comp = opts.find((o) => o.id === 'comp');
  const neu = opts.find((o) => o.id === 'new');
  const order = [neu, comp].filter(Boolean);

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
        subtitle="Many bowls can be matched well by a layer combination that is not possible in a real road (the layers trade off against each other). Limits are needed to pick the realistic answer."
      >
        {b.examples?.length > 0 && (
          <>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>Examples</Typography>
            <SimpleTable
              rows={b.examples}
              columns={[
                { key: 'road', label: 'Road, survey', align: 'left', format: (v, r) => <span><b>{v}</b>, {r.date}</span> },
                {
                  key: 'no_limits', label: 'Without limits: E1 / E2 / E3 / E4 (MPa)',
                  format: (v, r) => <span><Moduli values={v} limits={b.limits} /> <small>(fit {fmt(r.rms_no_limits, 1)}%)</small></span>,
                },
                {
                  key: 'limits', label: 'With compromise limits (MPa)',
                  format: (v, r) => <span><Moduli values={v} limits={b.limits} /> <small>(fit {fmt(r.rms_limits, 1)}%)</small></span>,
                },
              ]}
            />
            <Typography variant="body2" color="text.secondary">
              Both answers match the measured bowl within 3%, but the red values are not possible in a real road.
            </Typography>
          </>
        )}
      </Step>

      <Step
        n={3}
        title="Two sets of realistic limits"
        subtitle="Only the bowls with an impossible answer change: they get the best-fitting answer within the limits. Bold = where the two options differ."
      >
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
          {order.map((o) => <OptionCard key={o.id} o={o} chosen={o.id === 'comp'} base={o.id === 'new' ? comp : neu} />)}
        </Box>
        {lc.data.baseline && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1.5 }}>
            For reference, before the temperature correction (original bowls, old limits 1,500–8,000 / 100–3,000 / 50–600 / 30–400):{' '}
            {fmtPct(lc.data.baseline.total.usable_pct)} usable.
          </Typography>
        )}
      </Step>

      <Step
        n={4}
        title="Backcalculate all data with limits, and choose"
        subtitle="Both options were run on all bowls. The stricter New limits leave many bowls without a good fit, mostly because the base (E2 ≥ 200) and subbase (E3 ≥ 100) minimums are too high for many roads."
      >
        <SimpleTable
          rows={[...(comp?.by_survey || []).map((s, i) => ({ name: s.date, i })), { name: 'All surveys', i: -1 }]}
          highlight={(r) => r.i === -1}
          columns={[
            { key: 'name', label: 'Usable bowls (fit ≤ 5%)', align: 'left', format: (v, r) => (r.i === -1 ? <b>{v}</b> : v) },
            ...order.map((o) => ({
              key: o.id, label: o.id === 'comp' ? `${o.label} ✓` : o.label, align: 'center',
              format: (_, r) => {
                const v = r.i === -1 ? o.total.usable_pct : o.by_survey[r.i].usable_pct;
                return <Box component="span" sx={{ fontWeight: 700, color: v >= 90 ? 'success.dark' : v >= 80 ? 'warning.dark' : 'error.dark' }}>{fmtPct(v)}</Box>;
              },
            })),
          ]}
        />
        <Box sx={{ mt: 1.5, p: 1.5, borderRadius: 2, bgcolor: (th) => alpha(th.palette.success.main, 0.07) }}>
          <Typography variant="body2">
            <b>Chosen: Compromise.</b> It keeps {fmtPct(comp?.total.usable_pct)} of the bowls usable
            (New: {fmtPct(neu?.total.usable_pct)}), hits a limit far less often ({fmtPct(comp?.total.at_limit_pct)} vs {fmtPct(neu?.total.at_limit_pct)}),
            and its limits still cover realistic values for Swedish roads.
          </Typography>
        </Box>
      </Step>

      <Step n={5} last title={`${fmt(t.good_fit)} bowls train the ML model`}>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5 }}>
          <Stat value={fmt(t.cases)} label={`bowls: ${fmt(t.cases / 4)} locations × 4 surveys`} color="primary" />
          <Stat value={fmt(t.good_fit)} label="usable with the compromise limits (fit within 5%)" color="success" />
          <Stat value={fmt(t.median_rms, 2) + '%'} label="median fit of all bowls" color="primary" />
        </Box>
      </Step>
    </>
  );
}

export default SummaryTab;
