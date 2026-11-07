import { useState } from 'react';
import { Box, Button, Collapse, ToggleButton, ToggleButtonGroup, Typography } from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import {
  Bar, BarChart, CartesianGrid, Cell, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';

import { useResults, Loading, SimpleTable, fmt } from './common';

// Road factors and soil type vs the layer moduli, with robustness checks
// (data: soil_effect.json, built by soil_effect.py).
const LAYERS = [
  { id: 'E1', name: 'E1 asphalt' }, { id: 'E2', name: 'E2 base' },
  { id: 'E3', name: 'E3 subbase' }, { id: 'E4', name: 'E4 subgrade' },
];
const VERSION_IDS = ['A', 'B', 'C'];
const pct = (v, d = 0) => (v == null ? '–' : `${v > 0 ? '+' : ''}${fmt(v, d)}%`);

const NOTES = {
  thk1: 'Control only: thickness is an input of the backcalculation itself, so this is mostly a calculation effect.',
  thk2: 'Control only: thickness is an input of the backcalculation itself.',
  thk3: 'Control only: thickness is an input of the backcalculation itself.',
  taadt: 'Busier roads are stiffer, also within the same road. Traffic itself does not make a road stiffer: busier stretches are likely built and maintained to a higher standard.',
  ditch: 'No effect in any version.',
  ghum: 'Small but robust. Meaning of ghum_max still to be confirmed with the data provider.',
};

function SubTitle({ children }) {
  return <Typography variant="subtitle1" sx={{ fontWeight: 700, mt: 3.5, mb: 1 }}>{children}</Typography>;
}

/** "+45%*" for one version: bold when significant, grey when not, "n/a" when it cannot be estimated. */
function Eff({ c }) {
  if (!c) return <span style={{ opacity: 0.5 }}>n/a</span>;
  return c.sig ? <b>{pct(c.pct)}</b> : <span style={{ opacity: 0.55 }}>{pct(c.pct)}</span>;
}

function Robust({ v }) {
  return v
    ? <Box component="span" sx={{ fontWeight: 700, color: 'success.dark' }}>robust</Box>
    : <Box component="span" sx={{ color: 'text.secondary' }}>no</Box>;
}

function Tip({ active, payload, layer }) {
  if (!active || !payload?.length) return null;
  const r = payload[0].payload;
  return (
    <Box sx={{ bgcolor: 'background.paper', border: 1, borderColor: 'divider', borderRadius: 2, p: 1.25, boxShadow: 2, fontSize: 13 }}>
      <b>{r.soil_en}</b> ({r.soil}), {fmt(r.locations)} locations<br />
      Typical {layer} (adjusted): <b>{fmt(r.adjusted)} MPa</b> {r.reference ? '(reference)' : `(${pct(r.adjusted_pct)} vs glacial clay)`}<br />
      {!r.reference && (r.robust ? 'Robust: significant in all three versions' : 'Not robust')}
    </Box>
  );
}

function SoilChart({ rows, layer }) {
  const theme = useTheme();
  const axis = { fill: theme.palette.text.secondary, fontSize: 12 };
  const color = (r) => (r.reference ? theme.palette.text.secondary : r.robust ? '#2a78d6' : '#c3c2bd');
  return (
    <Box sx={{ width: '100%', height: 48 + rows.length * 38 }}>
      <ResponsiveContainer>
        <BarChart data={rows} layout="vertical" margin={{ top: 8, right: 70, bottom: 24, left: 8 }}>
          <CartesianGrid horizontal={false} stroke={theme.palette.divider} />
          <XAxis type="number" tick={axis} tickFormatter={(v) => fmt(v)}
            label={{ value: `Typical ${layer} for the same road structure and traffic (MPa)`, position: 'insideBottom', offset: -14, fill: theme.palette.text.secondary, fontSize: 12 }} />
          <YAxis type="category" dataKey="soil_en" width={170} tick={axis} />
          <Tooltip content={<Tip layer={layer} />} cursor={{ fill: theme.palette.action.hover }} />
          <Bar dataKey="adjusted" isAnimationActive={false} barSize={20}>
            {rows.map((r) => <Cell key={r.soil} fill={color(r)} />)}
            <LabelList dataKey="label" position="right" style={{ fontSize: 12, fill: theme.palette.text.primary }} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </Box>
  );
}

/** Short list of the robust findings for the chosen layer. */
function Findings({ data, layer, name }) {
  const soils = data.soils.filter((s) => !s.reference && s[layer].robust);
  const factors = data.factors.filter((f) => !f.control && f[layer].robust);
  return (
    <Box sx={{ p: 2, borderRadius: 3, border: 1, borderColor: 'divider', bgcolor: (t) => alpha(t.palette.success.main, 0.04) }}>
      <Typography sx={{ fontWeight: 700, mb: 0.5 }}>Robust findings for {name}</Typography>
      {soils.length === 0 && factors.length === 0 && (
        <Typography variant="body2">No soil type or road factor has a robust effect on {name}.</Typography>
      )}
      <Box component="ul" sx={{ m: 0, pl: 2.5 }}>
        {soils.map((s) => (
          <Typography component="li" variant="body2" key={s.soil}>
            <b>{s.soil_en}</b>: {fmt(s[layer].adjusted)} MPa vs {fmt(data.soils.find((r) => r.reference)[layer].adjusted)} MPa
            on glacial clay ({pct(s[layer].adjusted_pct)}; range over the three versions {pct(Math.min(...VERSION_IDS.map((v) => s[layer][v]?.pct ?? 0)))} to {pct(Math.max(...VERSION_IDS.map((v) => s[layer][v]?.pct ?? 0)))})
          </Typography>
        ))}
        {factors.map((f) => (
          <Typography component="li" variant="body2" key={f.id}>
            <b>{f.label}</b>: {pct(f[layer].A.pct)} (range {pct(Math.min(...VERSION_IDS.map((v) => f[layer][v]?.pct ?? 0)))} to {pct(Math.max(...VERSION_IDS.map((v) => f[layer][v]?.pct ?? 0)))})
          </Typography>
        ))}
      </Box>
    </Box>
  );
}

function Example({ ex }) {
  const usable = ex.surveys.filter((s) => s.usable);
  return (
    <Box>
      <Typography variant="body2" sx={{ mb: 1 }}>
        <b>Step 1. Read the location from the Excel</b> (row {ex.excel_row}, key {ex.key}): soil <b>{ex.soil}</b> ({ex.soil_en}),
        asphalt {ex.thk1} mm, base {ex.thk2} mm, subbase {fmt(ex.thk3)} mm, heavy traffic {fmt(ex.taadt)} vehicles/day,
        ditch {ex.ditch} m, ghum_max {fmt(ex.ghum)}.
      </Typography>
      <Typography variant="body2" sx={{ mb: 1 }}>
        <b>Step 2. Take the backcalculated moduli of each survey</b> (our result, not in the Excel). Surveys with fit error above 5% are not used.
      </Typography>
      <SimpleTable
        rows={[...ex.surveys, ...(ex.location_value ? [{ date: 'One value for this location (geometric mean of usable surveys)', ...ex.location_value, total: true }] : [])]}
        highlight={(r) => r.total}
        columns={[
          { key: 'date', label: 'Survey', align: 'left', format: (v, r) => (r.total ? <b>{v}</b> : v) },
          ...LAYERS.map((l) => ({ key: l.id, label: `${l.id} (MPa)`, format: (v, r) => (r.total ? <b>{fmt(v)}</b> : fmt(v)) })),
          { key: 'rms', label: 'Fit error', format: (v, r) => (r.total ? '' : `${fmt(v, 1)}%`) },
          { key: 'usable', label: 'Used?', format: (v, r) => (r.total ? '' : v ? 'yes' : 'no (> 5%)') },
          { key: 'at_limit', label: 'At a limit', align: 'left', format: (v, r) => (r.total ? '' : v || '–') },
        ]}
      />
      {usable.length > 0 && ex.location_value && (
        <Typography variant="body2" sx={{ mb: 1 }}>
          Example for E3: ({usable.map((s) => s.E3).join(' × ')})^(1/{usable.length}) = <b>{fmt(ex.location_value.E3)} MPa</b>.
        </Typography>
      )}
      <Typography variant="body2" sx={{ mb: 1 }}>
        <b>Step 3. Repeat for every location</b> and give each one 0/1 columns for its soil type (glacial clay has no column: it is the reference).
      </Typography>
      <Typography variant="body2" sx={{ mb: 1 }}>
        <b>Step 4. Regression per layer:</b> log(E) = b0 + thicknesses + log2(heavy traffic) + ditch + ghum_max + soil columns.
        A coefficient b becomes a % with (e<sup>b</sup> − 1) × 100.
      </Typography>
      <Typography variant="body2" sx={{ mb: 1 }}>
        <b>Step 5. Significance:</b> neighbouring 20 m points are almost copies, so the uncertainty is calculated with 2 km road
        blocks as the unit (clustered standard errors). Significant = the 95% range does not include 0%.
      </Typography>
      <Typography variant="body2">
        <b>Step 6. Robustness:</b> the same regression is repeated (B) with the road added, so locations are only compared within
        the same road, and (C) without the locations where this layer hit a modulus limit. Only results that are significant with
        the same sign in A, B and C are called robust.
      </Typography>
    </Box>
  );
}

function SoilEffectTab() {
  const { data, error } = useResults('soil_effect');
  const [layer, setLayer] = useState('E3');
  const [showSteps, setShowSteps] = useState(false);
  if (!data) return <Loading error={error} />;
  const L = LAYERS.find((l) => l.id === layer);
  const V = data.versions;
  const chartRows = data.soils.map((s) => ({
    soil: s.soil, soil_en: s.soil_en, locations: s.locations, reference: s.reference, mixed: s.mixed,
    adjusted: s[layer].adjusted, adjusted_pct: s[layer].adjusted_pct, robust: s[layer].robust,
    label: s.reference ? `${fmt(s[layer].adjusted)}` : `${fmt(s[layer].adjusted)} (${pct(s[layer].adjusted_pct)})`,
  }));

  return (
    <>
      <Typography color="text.secondary" sx={{ mb: 2 }}>
        Which parameters from the Excel go together with the layer stiffness, and which results can be trusted?
        One regression per layer over {fmt(data.locations)} locations on {data.roads} roads: soil type, layer thicknesses,
        heavy traffic, ditch depth and ghum_max together. Every result is checked in three versions:
        {' '}<b>A</b> {V.A.toLowerCase()}, <b>B</b> {V.B.toLowerCase()}, <b>C</b> {V.C.toLowerCase()}.
        A result is <b>robust</b> only if it is significant with the same sign in all three.
      </Typography>

      <ToggleButtonGroup size="small" exclusive value={layer} onChange={(_, v) => v && setLayer(v)} sx={{ mb: 2 }}>
        {LAYERS.map((l) => <ToggleButton key={l.id} value={l.id}>{l.name}</ToggleButton>)}
      </ToggleButtonGroup>

      <Findings data={data} layer={layer} name={L.name} />

      <SubTitle>1. Soil type: typical {L.name} for the same road structure and traffic</SubTitle>
      <SoilChart rows={chartRows} layer={L.name} />
      <Typography variant="body2" color="text.secondary">
        Adjusted typical value: every location gets the same thickness, traffic, ditch depth and ghum_max, only the soil changes.
        Blue = robust difference from glacial clay, grey = not robust, dark grey = glacial clay (reference).
        “Other soils” mixes many small soil types and is not interpreted.
      </Typography>
      <SimpleTable
        rows={data.soils}
        highlight={(r) => r.reference}
        columns={[
          { key: 'soil_en', label: 'Soil', align: 'left', format: (v, r) => `${v} (${r.soil})` },
          { key: 'locations', label: 'Locations', format: (v) => fmt(v) },
          { key: 'adj', label: 'Typical (MPa)', format: (_, r) => fmt(r[layer].adjusted) },
          ...VERSION_IDS.map((v) => ({
            key: v, label: `${v}: ${V[v]}`, format: (_, r) => (r.reference ? 'reference' : <Eff c={r[layer][v]} />),
          })),
          { key: 'rob', label: 'Robust?', format: (_, r) => (r.reference ? '' : r.mixed ? 'not interpreted' : <Robust v={r[layer].robust} />) },
        ]}
      />

      <SubTitle>2. Other road factors: change in {L.name} for one step, all else equal</SubTitle>
      <SimpleTable
        rows={data.factors}
        columns={[
          { key: 'label', label: 'Factor (one step)', align: 'left' },
          ...VERSION_IDS.map((v) => ({ key: v, label: `${v}: ${V[v]}`, format: (_, r) => <Eff c={r[layer][v]} /> })),
          { key: 'rob', label: 'Robust?', format: (_, r) => (r.control ? 'control only' : <Robust v={r[layer].robust} />) },
        ]}
      />
      <Box component="ul" sx={{ mt: 0, pl: 2.5, '& li': { mb: 0.5 } }}>
        {data.factors.map((f) => (
          <Typography component="li" variant="body2" key={f.id}><b>{f.label}:</b> {NOTES[f.id]}</Typography>
        ))}
      </Box>
      <Typography variant="body2" color="text.secondary">
        Bold = significant, grey = not significant, n/a = cannot be estimated within roads. Heavy traffic is on a log scale:
        the effect is for twice as many heavy vehicles (e.g. 200 → 400 per day).
      </Typography>

      <SubTitle>3. How much do these parameters explain?</SubTitle>
      <SimpleTable
        rows={LAYERS.map((l) => ({ name: l.name, ...data.r2[l.id], between: data.between_location_share[l.id], nC: data.n[l.id].C }))}
        columns={[
          { key: 'name', label: 'Layer', align: 'left' },
          ...VERSION_IDS.map((v) => ({ key: v, label: `R² ${v}`, format: (x) => `${fmt(100 * x)}%` })),
          { key: 'nC', label: 'Locations in C', format: (x) => fmt(x) },
          { key: 'between', label: 'Variation between locations', format: (x) => `${fmt(100 * x)}%` },
        ]}
      />
      <Typography variant="body2" color="text.secondary">
        R² = share of the differences between locations explained by the parameters. The last column shows how much of all
        variation is between locations; the rest is between surveys at the same location (season, moisture), which no road
        parameter can explain. For the subgrade (E4) most variation is between surveys, so a low R² is expected.
      </Typography>

      {data.example && (
        <Box sx={{ mt: 4, pt: 2.5, borderTop: 1, borderColor: 'divider' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
            <Typography variant="h6">How it was calculated</Typography>
            <Button size="small" variant={showSteps ? 'outlined' : 'contained'} onClick={() => setShowSteps((v) => !v)}>
              {showSteps ? 'Hide steps' : 'Show step by step'}
            </Button>
          </Box>
          <Collapse in={showSteps} unmountOnExit>
            <Box sx={{ mt: 1.5 }}><Example ex={data.example} /></Box>
          </Collapse>
        </Box>
      )}
    </>
  );
}

export default SoilEffectTab;
