import { useMemo, useState } from 'react';
import { Alert, Box, ToggleButton, ToggleButtonGroup, Typography } from '@mui/material';
import {
  Bar, BarChart, CartesianGrid, Legend, ReferenceLine, ResponsiveContainer, Scatter, ScatterChart,
  Tooltip, XAxis, YAxis,
} from 'recharts';

import { toRows } from '../../services/results';
import {
  useResults, Loading, StatRow, SimpleTable, ChartCard, SERIES, GRID, AXIS, fmt, fmtPct,
} from './common';

const MODULI = ['E1', 'E2', 'E3', 'E4'];
const NAMES = { E1: 'E1 asphalt', E2: 'E2 base', E3: 'E3 subbase', E4: 'E4 subgrade' };

function BoundsTab() {
  const { data, error } = useResults('bounds');
  const [modulus, setModulus] = useState('E1');
  const cases = useMemo(() => (data ? toRows(data.cases) : []), [data]);
  const points = useMemo(
    () => cases.map((r) => ({ x: r[`${modulus}_4L`], y: r[`${modulus}_unb`], row: r.row_index, survey: r.survey })),
    [cases, modulus],
  );

  if (!data) return <Loading error={error} />;
  const t = data.total;
  const [lo, hi] = data.limits[modulus];

  const chart = data.by_survey.map((s) => ({
    name: `S${s.survey} (${s.date})`, Bounded: s.good_bounded, Unbounded: s.good_unbounded,
  }));

  return (
    <>
      <Typography color="text.secondary" sx={{ mb: 2 }}>
        Experiment on rows {data.rows}: the {fmt(data.recalculated)} cases (of {fmt(data.all_cases)}) where a modulus
        ended on a limit were recalculated with practically no limits (10–100,000 MPa). Cases that never touched a
        limit would not change.
      </Typography>

      <StatRow items={[
        { label: 'Good fits, bounded', value: fmtPct(t.good_bounded), note: 'recalculated cases' },
        { label: 'Good fits, unbounded', value: fmtPct(t.good_unbounded) },
        { label: 'E1 above 8,000 MPa', value: fmt(t.E1_above_max), note: 'unbounded' },
        { label: 'E2 below 100 MPa', value: fmt(t.E2_below_min), note: 'unbounded' },
      ]} />

      <ChartCard title="Good fits (RMS ≤ 5%) per survey, recalculated cases">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chart} margin={{ top: 8, right: 16, bottom: 8, left: 8 }} barGap={2}>
            <CartesianGrid stroke={GRID} vertical={false} />
            <XAxis dataKey="name" tick={AXIS} />
            <YAxis domain={[0, 100]} tick={AXIS} unit="%" width={48} />
            <Tooltip formatter={(v) => `${v}%`} />
            <Legend />
            <Bar dataKey="Bounded" fill={SERIES[0]} radius={[4, 4, 0, 0]} isAnimationActive={false} />
            <Bar dataKey="Unbounded" fill={SERIES[1]} radius={[4, 4, 0, 0]} isAnimationActive={false} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard
        title={`${NAMES[modulus]}: bounded vs unbounded`}
        note={`Each dot is one case. Dashed lines: the limits (${fmt(lo)}–${fmt(hi)} MPa). Dots far from the diagonal
          moved a lot once the limit was removed. Logarithmic scales.`}
        height={400}
      >
        <Box sx={{ mb: 1 }}>
          <ToggleButtonGroup size="small" exclusive value={modulus} onChange={(_, v) => v && setModulus(v)}>
            {MODULI.map((e) => <ToggleButton key={e} value={e}>{NAMES[e]}</ToggleButton>)}
          </ToggleButtonGroup>
        </Box>
        <ResponsiveContainer width="100%" height="88%">
          <ScatterChart margin={{ top: 8, right: 16, bottom: 24, left: 8 }}>
            <CartesianGrid stroke={GRID} />
            <XAxis type="number" dataKey="x" scale="log" domain={['auto', 'auto']} tick={AXIS}
              tickFormatter={(v) => fmt(v)} name="Bounded"
              label={{ value: 'Bounded (MPa)', position: 'insideBottom', offset: -12, ...AXIS }} />
            <YAxis type="number" dataKey="y" scale="log" domain={['auto', 'auto']} tick={AXIS}
              tickFormatter={(v) => fmt(v)} name="Unbounded" width={64}
              label={{ value: 'Unbounded (MPa)', angle: -90, position: 'insideLeft', ...AXIS }} />
            <ReferenceLine y={hi} stroke="#607080" strokeDasharray="4 4" />
            <ReferenceLine y={lo} stroke="#607080" strokeDasharray="4 4" />
            <Tooltip
              cursor={{ strokeDasharray: '3 3' }}
              content={({ payload }) => {
                const p = payload?.[0]?.payload;
                if (!p) return null;
                return (
                  <Box sx={{ bgcolor: '#fff', border: '1px solid #d8e1e8', p: 1, fontSize: 13 }}>
                    Row {p.row}, survey {p.survey}<br />
                    Bounded: {fmt(p.x)} MPa<br />
                    Unbounded: {fmt(p.y)} MPa
                  </Box>
                );
              }}
            />
            <Scatter data={points} fill={SERIES[0]} fillOpacity={0.45} isAnimationActive={false} />
          </ScatterChart>
        </ResponsiveContainer>
      </ChartCard>

      <Typography variant="h6" gutterBottom>Unbounded values outside the usual limits</Typography>
      <SimpleTable
        rows={MODULI.map((e) => ({
          modulus: NAMES[e], limits: `${fmt(data.limits[e][0])}–${fmt(data.limits[e][1])}`,
          above: t[`${e}_above_max`], below: t[`${e}_below_min`],
        }))}
        columns={[
          { key: 'modulus', label: 'Modulus', align: 'left' },
          { key: 'limits', label: 'Limits (MPa)' },
          { key: 'above', label: 'Above max', format: (v) => fmt(v) },
          { key: 'below', label: 'Below min', format: (v) => fmt(v) },
        ]}
      />

      <Alert severity="warning">
        Without limits almost every case fits, but E1 rises to 10,000–20,000 MPa while E2 drops below 100 MPa: the
        surface deflections cannot separate a thin asphalt layer from its base. A good fit does not guarantee realistic
        moduli. <strong>Decision: keep the limits.</strong>
      </Alert>
    </>
  );
}

export default BoundsTab;
