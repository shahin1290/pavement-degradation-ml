import { Box, Typography } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import {
  CartesianGrid, Legend, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';

import { fmt } from './common';

// Same comparison as the "% per °C" numbers, drawn: at the same location and with each survey day's level
// removed, how much warmer than usual was it (x), and how much higher/lower was E1 (y)?
// Data: temp_correction.json → e1_vs_dt.
const COLORS = { none: '#eb6834', own: '#2a78d6' };
const NAMES = { none: 'Without correction', own: 'Corrected to 20 °C (own data)' };
const pct = (v, d = 1) => (v == null ? '–' : `${v > 0 ? '+' : ''}${fmt(v, d)}%`);
const deg = (v) => `${v > 0 ? '+' : ''}${fmt(v, 0)} °C`;

function Tip({ active, label, data }) {
  if (!active || label == null) return null;
  const at = (id) => data[id]?.points.find((p) => p.dT === label);
  return (
    <Box sx={{ bgcolor: 'background.paper', border: 1, borderColor: 'divider', borderRadius: 2, p: 1.25, boxShadow: 2, fontSize: 13 }}>
      <b>{deg(label)} warmer than usual</b>
      {['none', 'own'].map((id) => at(id) && (
        <Box key={id} sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
          <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: COLORS[id] }} />
          <span>{NAMES[id]}: E1 <b>{pct(at(id).med)}</b> <span style={{ opacity: 0.7 }}>(n = {fmt(at(id).n)})</span></span>
        </Box>
      ))}
    </Box>
  );
}

function E1TempChart({ data, e20, ownMedian }) {
  const theme = useTheme();
  if (!data?.none) return null;
  const axis = { fill: theme.palette.text.secondary, fontSize: 12 };
  const xs = data.none.points.map((p) => p.dT);
  const ticks = xs.filter((v, i) => xs.indexOf(v) === i);

  return (
    <Box>
      <Box sx={{ width: '100%', height: 340 }}>
        <ResponsiveContainer>
          <LineChart margin={{ top: 10, right: 20, bottom: 24, left: 8 }}>
            <CartesianGrid vertical={false} stroke={theme.palette.divider} />
            <XAxis dataKey="dT" type="number" domain={[Math.min(...ticks), Math.max(...ticks)]} ticks={ticks}
              tickFormatter={deg} tick={axis} allowDuplicatedCategory={false}
              label={{ value: 'Asphalt temperature compared with usual for that location and survey (°C)', position: 'insideBottom', offset: -14, fill: theme.palette.text.secondary, fontSize: 12 }} />
            <YAxis tick={axis} width={52} tickFormatter={(v) => pct(v, 0)} domain={[-25, 25]} ticks={[-20, -10, 0, 10, 20]}
              label={{ value: 'E1 change (%)', angle: -90, position: 'insideLeft', fill: theme.palette.text.secondary, fontSize: 12 }} />
            <ReferenceLine y={0} stroke={theme.palette.text.secondary} strokeWidth={1} />
            <Tooltip content={<Tip data={data} />} />
            <Legend verticalAlign="top" height={30} wrapperStyle={{ fontSize: 13 }} />
            {['none', 'own'].filter((id) => data[id]).map((id) => (
              <Line key={id} data={data[id].points} dataKey="med" name={`${NAMES[id]} (${pct(data[id].pct_per_C)} per °C)`}
                stroke={COLORS[id]} strokeWidth={2.5} dot={{ r: 4, strokeWidth: 1.5, stroke: '#fff', fill: COLORS[id] }}
                activeDot={{ r: 6 }} isAnimationActive={false} />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </Box>
      <Typography variant="body2" color="text.secondary">
        Each location is compared with itself, and the general level of each survey day (season, moisture) is removed,
        so only the effect of temperature remains. A flat line at 0% means E1 does not depend on temperature.
        Without correction E1 falls on warmer days; after the correction the line is flat.
      </Typography>
      {e20 && ownMedian && (
        <Box sx={{ mt: 2, p: 1.5, borderRadius: 2, bgcolor: 'action.hover', display: 'flex', flexWrap: 'wrap', gap: 3, alignItems: 'center' }}>
          <Typography variant="body2" sx={{ fontWeight: 700 }}>E1 at 20 °C</Typography>
          <Typography variant="body2">Our corrected median: <b>{fmt(ownMedian)} MPa</b></Typography>
          <Typography variant="body2">
            Typical Swedish asphalt, E = 6500·e<sup>−0.065(20−10)</sup> (Erlingsson 2012): <b>{fmt(e20)} MPa</b>
          </Typography>
          <Typography variant="body2" color="text.secondary">
            difference {fmt((100 * (ownMedian - e20)) / e20, 0)}%
          </Typography>
        </Box>
      )}
    </Box>
  );
}

export default E1TempChart;
