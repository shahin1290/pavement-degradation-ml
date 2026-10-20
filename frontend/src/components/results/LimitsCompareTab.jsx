import { useState } from 'react';
import { Box, ButtonBase, ToggleButton, ToggleButtonGroup, Typography } from '@mui/material';
import { alpha } from '@mui/material/styles';

import { useResults, Loading, SimpleTable, fmt, fmtPct, CORRECTIONS } from './common';

// Compares limit options on the temperature-corrected bowls (data: limits_compare.json).
const LAYERS = [['E1', 'Asphalt'], ['E2', 'Base'], ['E3', 'Subbase'], ['E4', 'Subgrade']];
const HIT_TEXT = {
  E1_min: 'Asphalt at minimum', E1_max: 'Asphalt at maximum', E2_min: 'Base at minimum', E2_max: 'Base at maximum',
  E3_min: 'Subbase at minimum', E3_max: 'Subbase at maximum', E4_min: 'Subgrade at minimum', E4_max: 'Subgrade at maximum',
};

/** Green for high usable %, orange/red for low. */
const usableColor = (v) => (v >= 90 ? 'success' : v >= 80 ? 'warning' : 'error');

function SubTitle({ children }) {
  return <Typography variant="subtitle1" sx={{ fontWeight: 700, mt: 3.5, mb: 1 }}>{children}</Typography>;
}

/** One selectable card per limit option. */
function OptionCard({ o, active, onClick, base }) {
  const c = usableColor(o.total.usable_pct);
  return (
    <ButtonBase
      onClick={onClick}
      sx={{
        display: 'block', textAlign: 'left', width: '100%', p: 2, borderRadius: 3, border: 2,
        borderColor: active ? 'primary.main' : 'divider', bgcolor: active ? (t) => alpha(t.palette.primary.main, 0.04) : 'background.paper',
        transition: 'all 0.15s', '&:hover': { borderColor: 'primary.main' },
      }}
    >
      <Typography variant="h6" sx={{ lineHeight: 1.2 }}>{o.label}</Typography>
      <Box sx={{ mt: 1, mb: 1.5, display: 'grid', gridTemplateColumns: 'auto 1fr', columnGap: 1.5, rowGap: 0.25 }}>
        {LAYERS.map(([e, name]) => {
          const [lo, hi] = o.limits[e];
          const changed = base && (lo !== base.limits[e][0] || hi !== base.limits[e][1]);
          return (
            <Box key={e} sx={{ display: 'contents' }}>
              <Typography variant="body2" color="text.secondary">{name}</Typography>
              <Typography variant="body2" sx={{ fontWeight: changed ? 700 : 400, fontVariantNumeric: 'tabular-nums' }}>
                {fmt(lo)} – {fmt(hi)}
              </Typography>
            </Box>
          );
        })}
      </Box>
      <Typography variant="h4" sx={{ color: `${c}.main`, lineHeight: 1 }}>{fmtPct(o.total.usable_pct)}</Typography>
      <Typography variant="body2" color="text.secondary">usable bowls (fit ≤ 5%)</Typography>
      <Box sx={{ display: 'flex', gap: 2, mt: 1.25 }}>
        <Typography variant="body2"><b>{fmtPct(o.total.at_limit_pct)}</b> <span style={{ opacity: 0.7 }}>at a limit</span></Typography>
        <Typography variant="body2"><b>{fmtPct(o.total.unrealistic_pct)}</b> <span style={{ opacity: 0.7 }}>unrealistic</span></Typography>
      </Box>
    </ButtonBase>
  );
}

/** Coloured cell for a usable %. */
function UsableCell({ v }) {
  const c = usableColor(v);
  return (
    <Box component="span" sx={{ display: 'inline-block', minWidth: 58, px: 1, py: 0.25, borderRadius: 1, fontWeight: 700,
      textAlign: 'center', color: `${c}.dark`, bgcolor: (t) => alpha(t.palette[c].main, 0.12) }}
    >
      {fmtPct(v)}
    </Box>
  );
}

/** Horizontal bars: how often each limit is hit in the selected option. */
function LimitHits({ o }) {
  const entries = Object.entries(o.limit_hits).sort((a, b) => b[1] - a[1]);
  const max = Math.max(...entries.map(([, v]) => v), 1);
  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '190px 1fr 110px' }, alignItems: 'center', columnGap: 1.5, rowGap: 0.75 }}>
      {entries.map(([k, v]) => (
        <Box key={k} sx={{ display: 'contents' }}>
          <Typography variant="body2">{HIT_TEXT[k] || k} ({fmt(o.limits[k.slice(0, 2)][k.endsWith('min') ? 0 : 1])})</Typography>
          <Box sx={{ height: 10, borderRadius: 5, bgcolor: 'action.hover', overflow: 'hidden' }}>
            <Box sx={{ width: `${(100 * v) / max}%`, height: '100%', bgcolor: k.endsWith('min') ? 'warning.main' : 'info.main' }} />
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'right' }}>
            {fmt(v)} ({fmtPct((100 * v) / o.total.bowls)})
          </Typography>
        </Box>
      ))}
    </Box>
  );
}

function LimitsCompareTab() {
  const [corrId, setCorrId] = useState(CORRECTIONS[0].id);
  const corr = CORRECTIONS.find((c) => c.id === corrId);
  const { data, error } = useResults(`limits_compare${corr.suffix}`);
  const [selId, setSelId] = useState(null);
  const picker = (
    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, alignItems: 'center', mb: 2 }}>
      <Typography variant="body2" sx={{ fontWeight: 700 }}>Temperature correction:</Typography>
      <ToggleButtonGroup size="small" exclusive value={corrId} onChange={(_, v) => v && setCorrId(v)} color="primary">
        {CORRECTIONS.map((c) => (
          <ToggleButton key={c.id} value={c.id} title={c.tip} sx={{ px: 2 }}>{c.label}</ToggleButton>
        ))}
      </ToggleButtonGroup>
      <Typography variant="body2" color="text.secondary">{corr.tip}</Typography>
    </Box>
  );
  if (!data) return <>{picker}<Loading error={error} /></>;
  const opts = data.options;
  const folder = corr.id === 'own' ? 'data/limits_compare_own/' : 'data/limits_compare/';
  if (!opts?.length) return <>{picker}<Loading error={new Error(`No limit options found: put the step2 files in ${folder} and run make_results_data.py`)} /></>;
  const base = data.baseline;
  const sel = opts.find((o) => o.id === selId) || opts[opts.length - 1];
  const baseRoad = Object.fromEntries((base?.by_road || []).map((r) => [r.road, r]));

  return (
    <>
      {picker}
      <Typography color="text.secondary" sx={{ mb: 2.5 }}>
        All {fmt(opts[0].total.bowls)} bowls were temperature-corrected to 20 °C and backcalculated again.
        The options differ only in the limits (MPa). Bold limits differ from the compromise. Click an option for details.
      </Typography>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: `repeat(${opts.length}, 1fr)` }, gap: 2 }}>
        {opts.map((o) => (
          <OptionCard key={o.id} o={o} active={o.id === sel.id} onClick={() => setSelId(o.id)}
            base={opts.find((x) => x.id === 'comp')} />
        ))}
      </Box>
      {base && (
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1.5 }}>
          For reference, before the correction (original bowls, old limits 1,500–8,000 / 100–3,000 / 50–600 / 30–400):{' '}
          <b>{fmtPct(base.total.usable_pct)}</b> usable, {fmtPct(base.total.at_limit_pct)} at a limit,{' '}
          {fmtPct(base.total.unrealistic_pct)} unrealistic.
        </Typography>
      )}

      <SubTitle>Usable bowls by survey</SubTitle>
      <SimpleTable
        rows={[...opts[0].by_survey.map((s, i) => ({ name: s.date, i })), { name: 'All surveys', i: -1 }]}
        highlight={(r) => r.i === -1}
        columns={[
          { key: 'name', label: 'Survey', align: 'left', format: (v, r) => (r.i === -1 ? <b>{v}</b> : v) },
          ...opts.map((o) => ({
            key: o.id, label: o.label, align: 'center',
            format: (_, r) => <UsableCell v={r.i === -1 ? o.total.usable_pct : o.by_survey[r.i].usable_pct} />,
          })),
          ...(base ? [{ key: 'base', label: 'Before', align: 'center',
            format: (_, r) => fmtPct(r.i === -1 ? base.total.usable_pct : base.by_survey[r.i].usable_pct) }] : []),
        ]}
      />

      <SubTitle>Typical moduli of the usable bowls (median, MPa)</SubTitle>
      <SimpleTable
        rows={[...opts, ...(base ? [{ ...base, id: 'base', label: 'Before' }] : [])]}
        columns={[
          { key: 'label', label: 'Option', align: 'left' },
          ...LAYERS.map(([e, name]) => ({ key: e, label: `${name} ${e}`, format: (_, r) => fmt(r.median[e]) })),
        ]}
      />

      <SubTitle>{sel.label}: which limits are hit</SubTitle>
      <LimitHits o={sel} />
      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
        A value at a limit means "this or beyond": the measured bowl wanted to go further.
      </Typography>

      <SubTitle>{sel.label}: by road</SubTitle>
      <SimpleTable
        rows={sel.by_road}
        highlight={(r) => r.usable_pct < 80}
        columns={[
          { key: 'road', label: 'Road', align: 'left', format: (v) => <b>{v}</b> },
          { key: 'km', label: 'Length', format: (v) => `${fmt(v, 1)} km` },
          { key: 'usable_pct', label: 'Usable', align: 'center', format: (v) => <UsableCell v={v} /> },
          ...(base ? [{ key: 'b', label: 'Usable before', format: (_, r) => fmtPct(baseRoad[r.road]?.usable_pct) }] : []),
          { key: 'at_limit_pct', label: 'At a limit', format: (v) => fmtPct(v) },
          { key: 'unrealistic_pct', label: 'Unrealistic without limits', format: (v) => fmtPct(v) },
        ]}
      />
    </>
  );
}

export default LimitsCompareTab;
