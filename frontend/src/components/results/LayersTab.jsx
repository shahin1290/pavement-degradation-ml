import { Alert, Typography } from '@mui/material';
import {
  Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';

import {
  useResults, Loading, StatRow, SimpleTable, ChartCard, SERIES, GRID, AXIS, fmt, fmtPct,
} from './common';

function LayersTab() {
  const { data, error } = useResults('layers');
  if (!data) return <Loading error={error} />;
  const t = data.total;
  const c = data.consistency;

  const chart = data.by_survey.map((s) => ({
    name: `S${s.survey} (${s.date})`,
    '4 layers': s.good_4L,
    '4 or 5 layers': s.good_mixed,
  }));

  return (
    <>
      <Typography color="text.secondary" sx={{ mb: 2 }}>
        Experiment on rows {data.rows} ({fmt(t.cases)} cases). A 5th, very stiff layer (10,000 MPa) at depth was added
        only where the 4-layer fit was poor (RMS &gt; 5%) and the 5-layer fit was better.
      </Typography>

      <StatRow items={[
        { label: 'Good fits, 4 layers', value: fmtPct(t.good_4L) },
        { label: 'Good fits, 4 or 5 layers', value: fmtPct(t.good_mixed) },
        { label: 'Cases using 5 layers', value: fmt(t.five_layer_cases), note: `median depth ${t.median_depth_m} m` },
        { label: 'RMS > 10%', value: `${t.rms10_4L} → ${t.rms10_mixed}`, note: '4 layers → 4 or 5 layers' },
      ]} />

      <ChartCard
        title="Good fits (RMS ≤ 5%) per survey"
        note="The 5th layer helps almost only in surveys 1 and 3."
      >
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chart} margin={{ top: 8, right: 16, bottom: 8, left: 8 }} barGap={2}>
            <CartesianGrid stroke={GRID} vertical={false} />
            <XAxis dataKey="name" tick={AXIS} />
            <YAxis domain={[0, 100]} tick={AXIS} unit="%" width={48} />
            <Tooltip formatter={(v) => `${v}%`} />
            <Legend />
            <Bar dataKey="4 layers" fill={SERIES[0]} radius={[4, 4, 0, 0]} isAnimationActive={false} />
            <Bar dataKey="4 or 5 layers" fill={SERIES[1]} radius={[4, 4, 0, 0]} isAnimationActive={false} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <Typography variant="h6" gutterBottom>Per survey</Typography>
      <SimpleTable
        rows={[...data.by_survey, { survey: 'All', date: '', ...t }]}
        columns={[
          { key: 'survey', label: 'Survey', align: 'left', format: (v, r) => (r.date ? `${v} (${r.date})` : v) },
          { key: 'cases', label: 'Cases', format: (v) => fmt(v) },
          { key: 'good_4L', label: 'Good fits, 4L', format: fmtPct },
          { key: 'good_mixed', label: 'Good fits, 4/5L', format: fmtPct },
          { key: 'rms10_4L', label: 'RMS > 10%, 4L' },
          { key: 'rms10_mixed', label: 'RMS > 10%, 4/5L' },
          { key: 'five_layer_cases', label: '5-layer cases' },
          { key: 'E4_at_max_4L', label: 'E4 at 400, 4L', format: fmtPct },
          { key: 'E4_at_max_mixed', label: 'E4 at 400, 4/5L', format: fmtPct },
          { key: 'median_depth_m', label: 'Median depth (m)', format: (v) => fmt(v, 1) },
        ]}
      />

      <Typography variant="h6" gutterBottom>Is the stiff layer real?</Typography>
      <StatRow items={[
        { label: 'Rows needing 5 layers in ≥ 1 survey', value: fmt(c.rows_any), note: `of ${fmt(c.rows_total)} rows` },
        { label: 'In ≥ 3 of 4 surveys', value: fmt(c.rows_ge3) },
        { label: 'In all 4 surveys', value: fmt(c.rows_all4) },
      ]} />
      <Alert severity="warning">
        Rock or a stiff layer at depth does not change between surveys. Here the stiff layer appears at a location in
        one survey (mostly 1 or 3) but not in the others. This points to a difference between surveys (measurement or
        processing) rather than a real stiff layer. <strong>Decision: 4 layers for the ML model.</strong>
      </Alert>
    </>
  );
}

export default LayersTab;
