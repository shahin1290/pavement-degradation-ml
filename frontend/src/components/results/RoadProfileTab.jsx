import { useMemo, useState } from 'react';
import {
  Box, FormControlLabel, MenuItem, Slider, Switch, TextField, ToggleButton, ToggleButtonGroup, Typography,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import {
  CartesianGrid, Legend, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';

import { toRows } from '../../services/results';
import { useResults, Loading, SimpleTable, fmt, fmtPct } from './common';

// Road profiles: backcalculated results along each road, one line per survey.
// Data: dataset.json (the training data, deflections corrected to 20 °C, compromise limits).

const SURVEYS = [
  { s: 1, date: 'Aug 2022', color: '#2a78d6' },
  { s: 2, date: 'Sep 2023', color: '#eb6834' },
  { s: 3, date: 'May 2024', color: '#1baf7a' },
  { s: 4, date: 'Sep 2024', color: '#eda100' },
];
const VARS = [
  { id: 'E1', label: 'E1 asphalt (MPa)', log: true, fitOnly: true },
  { id: 'E2', label: 'E2 base (MPa)', log: true, fitOnly: true },
  { id: 'E3', label: 'E3 subbase (MPa)', log: true, fitOnly: true },
  { id: 'E4', label: 'E4 subgrade (MPa)', log: true, fitOnly: true },
  { id: 'D0', label: 'D0 deflection at 20 °C (µm)' },
  { id: 'D900', label: 'D900 deflection at 20 °C (µm)' },
  { id: 'thk1_mm', label: 'Asphalt thickness (mm)' },
  { id: 'thk2_mm', label: 'Base thickness (mm)' },
  { id: 'thk3_mm', label: 'Subbase thickness (mm)' },
  { id: 'asphalt_temp_C', label: 'Asphalt temperature at measurement (°C)' },
  { id: 'rms_pct', label: 'Fit of the backcalculation, RMS (%)' },
];
const SMOOTH = [
  { id: 1, label: 'Raw (20 m)' },
  { id: 5, label: '100 m' },
  { id: 25, label: '500 m' },
];
const GAP_KM = 0.1;   // a jump larger than this along the road starts a new piece of line

/** '5V131D76180' -> { section: '5V131', km: 76.18 } */
function parseKey(key) {
  const m = /^(.*)D(\d+)$/.exec(String(key || ''));
  return m ? { section: m[1], km: Number(m[2]) / 1000 } : { section: String(key), km: null };
}
const sectionLabel = (sec) => {
  const m = /^(\d+)V(.+)$/.exec(sec);
  return m ? `Road ${m[2]} (county code ${m[1]})` : sec;
};

/** Rolling median over n points, only inside continuous pieces (null = gap). */
function smooth(values, n) {
  if (n <= 1) return values;
  const h = Math.floor(n / 2);
  return values.map((v, i) => {
    if (v == null) return null;
    const win = [];
    for (let j = i - h; j <= i + h; j += 1) {
      if (j < 0 || j >= values.length || values[j] == null) continue;
      win.push(values[j]);
    }
    win.sort((a, b) => a - b);
    return win[Math.floor(win.length / 2)];
  });
}

const median = (a) => {
  const v = a.filter((x) => x != null).sort((x, y) => x - y);
  return v.length ? v[Math.floor(v.length / 2)] : null;
};

function RoadProfileTab() {
  const theme = useTheme();
  const { data, error } = useResults('dataset');
  const rows = useMemo(() => (data ? toRows(data.columns) : []), [data]);

  // sections (road + county prefix), biggest first
  const sections = useMemo(() => {
    const n = {};
    rows.forEach((r) => { const { section } = parseKey(r.key); n[section] = (n[section] || 0) + 1; });
    return Object.entries(n).sort((a, b) => b[1] - a[1]).map(([sec, count]) => ({ sec, count }));
  }, [rows]);

  const [sec, setSec] = useState(null);
  const [varId, setVarId] = useState('E1');
  const [shown, setShown] = useState([1, 2, 3, 4]);
  const [win, setWin] = useState(5);
  const [hidePoor, setHidePoor] = useState(true);
  const [logY, setLogY] = useState(true);
  const [range, setRange] = useState(null);

  const section = sec || sections[0]?.sec;
  const v = VARS.find((x) => x.id === varId);

  // all rows of this section with km, sorted
  const secRows = useMemo(() => rows
    .map((r) => ({ ...r, ...parseKey(r.key) }))
    .filter((r) => r.section === section && r.km != null)
    .sort((a, b) => a.km - b.km), [rows, section]);
  const kmMin = secRows.length ? secRows[0].km : 0;
  const kmMax = secRows.length ? secRows[secRows.length - 1].km : 1;
  const [lo, hi] = range && range[0] >= kmMin && range[1] <= kmMax ? range : [kmMin, kmMax];

  // one series per survey: [{km, value}], nulls at gaps
  const series = useMemo(() => SURVEYS.map(({ s }) => {
    const pts = secRows.filter((r) => r.survey === s && r.km >= lo && r.km <= hi);
    const out = [];
    let prev = null;
    pts.forEach((r) => {
      if (prev != null && r.km - prev > GAP_KM) out.push({ km: (prev + r.km) / 2, raw: null });
      const bad = v.fitOnly && hidePoor && r.poor_fit;
      out.push({ km: r.km, raw: bad ? null : r[varId], r });
      prev = r.km;
    });
    const sm = smooth(out.map((p) => p.raw), win);
    return { s, points: out.map((p, i) => ({ km: p.km, [`s${s}`]: sm[i], r: p.r })) };
  }), [secRows, lo, hi, varId, hidePoor, win, v]);

  // summary per survey in the visible range
  const summary = SURVEYS.map(({ s, date }) => {
    const pts = secRows.filter((r) => r.survey === s && r.km >= lo && r.km <= hi);
    return {
      date, n: pts.length,
      med: median(pts.filter((r) => !(v.fitOnly && hidePoor && r.poor_fit)).map((r) => r[varId])),
      good: pts.length ? (100 * pts.filter((r) => !r.poor_fit).length) / pts.length : null,
      atLim: pts.length ? (100 * pts.filter((r) => r.at_limit).length) / pts.length : null,
      temp: median(pts.map((r) => r.asphalt_temp_C)),
    };
  });

  if (!data) return <Loading error={error} />;
  const axis = { fill: theme.palette.text.secondary, fontSize: 12 };
  const limits = v.id in (data.limits || {}) ? data.limits[v.id] : null;
  const useLog = v.log && logY;

  const Tip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
      <Box sx={{ bgcolor: 'background.paper', border: 1, borderColor: 'divider', borderRadius: 2, p: 1.25, boxShadow: 2, fontSize: 13 }}>
        <b>km {fmt(label, 2)}</b>
        {payload.filter((p) => p.value != null).map((p) => {
          const s = Number(p.dataKey.slice(1));
          const r = p.payload.r;
          const sv = SURVEYS.find((x) => x.s === s);
          return (
            <Box key={p.dataKey} sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
              <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: sv.color }} />
              <span>
                {sv.date}: <b>{fmt(p.value, v.id.startsWith('thk') || v.id === 'asphalt_temp_C' || v.id === 'rms_pct' ? 1 : 0)}</b>
                {r && <span style={{ opacity: 0.7 }}> · row {r.row_index}, {fmt(r.asphalt_temp_C, 1)} °C, fit {fmt(r.rms_pct, 1)}%</span>}
              </span>
            </Box>
          );
        })}
      </Box>
    );
  };

  return (
    <>
      <Typography color="text.secondary" sx={{ mb: 2 }}>
        Backcalculated results along each road, one line per survey (deflections corrected to 20 °C, compromise limits).
        Look for stretches that stay level, sudden jumps (often a change in construction or layer data) and changes between the surveys.
      </Typography>

      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center', mb: 2 }}>
        <TextField select size="small" label="Road" value={section || ''} sx={{ minWidth: 260 }}
          onChange={(e) => { setSec(e.target.value); setRange(null); }}>
          {sections.map((x) => (
            <MenuItem key={x.sec} value={x.sec}>{sectionLabel(x.sec)} — {fmt(x.count / 4)} points</MenuItem>
          ))}
        </TextField>
        <TextField select size="small" label="Show" value={varId} onChange={(e) => setVarId(e.target.value)} sx={{ minWidth: 280 }}>
          {VARS.map((x) => <MenuItem key={x.id} value={x.id}>{x.label}</MenuItem>)}
        </TextField>
        <ToggleButtonGroup size="small" exclusive value={win} onChange={(_, val) => val && setWin(val)}>
          {SMOOTH.map((x) => <ToggleButton key={x.id} value={x.id} title="Rolling median along the road">{x.label}</ToggleButton>)}
        </ToggleButtonGroup>
      </Box>

      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center', mb: 1 }}>
        <ToggleButtonGroup size="small" value={shown} onChange={(_, val) => val.length && setShown(val)}>
          {SURVEYS.map((x) => (
            <ToggleButton key={x.s} value={x.s} sx={{ gap: 0.75 }}>
              <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: x.color }} />{x.date}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
        {v.fitOnly && (
          <FormControlLabel control={<Switch size="small" checked={hidePoor} onChange={(e) => setHidePoor(e.target.checked)} />}
            label="Hide poor fits (RMS > 5%)" />
        )}
        {v.log && (
          <FormControlLabel control={<Switch size="small" checked={logY} onChange={(e) => setLogY(e.target.checked)} />}
            label="Log scale" />
        )}
      </Box>

      <Box sx={{ px: 1, mb: 1 }}>
        <Typography variant="body2" color="text.secondary">
          Section: km {fmt(lo, 2)} – {fmt(hi, 2)} (whole road: km {fmt(kmMin, 2)} – {fmt(kmMax, 2)})
        </Typography>
        <Slider size="small" min={kmMin} max={kmMax} step={0.02} value={[lo, hi]}
          onChange={(_, val) => setRange(val)} valueLabelDisplay="auto" valueLabelFormat={(x) => `km ${fmt(x, 2)}`}
          disableSwap />
      </Box>

      <Box sx={{ width: '100%', height: 380 }}>
        <ResponsiveContainer>
          <LineChart margin={{ top: 10, right: 20, bottom: 24, left: 8 }}>
            <CartesianGrid vertical={false} stroke={theme.palette.divider} />
            <XAxis dataKey="km" type="number" domain={[lo, hi]} tick={axis} tickFormatter={(x) => fmt(x, 1)}
              allowDuplicatedCategory={false}
              label={{ value: `${sectionLabel(section)}: position along the road (km)`, position: 'insideBottom', offset: -14, fill: theme.palette.text.secondary, fontSize: 12 }} />
            <YAxis tick={axis} width={60} scale={useLog ? 'log' : 'auto'} domain={useLog ? ['auto', 'auto'] : ['auto', 'auto']}
              allowDataOverflow={false} tickFormatter={(x) => fmt(x)}
              label={{ value: v.label, angle: -90, position: 'insideLeft', fill: theme.palette.text.secondary, fontSize: 12 }} />
            <Tooltip content={<Tip />} />
            <Legend verticalAlign="top" height={28} wrapperStyle={{ fontSize: 13 }} />
            {limits && limits.map((x) => (
              <ReferenceLine key={x} y={x} stroke={theme.palette.text.disabled} strokeDasharray="4 4"
                label={{ value: `limit ${fmt(x)}`, position: 'insideTopRight', fill: theme.palette.text.secondary, fontSize: 11 }} />
            ))}
            {series.filter((x) => shown.includes(x.s)).map((x) => {
              const sv = SURVEYS.find((y) => y.s === x.s);
              return (
                <Line key={x.s} data={x.points} dataKey={`s${x.s}`} name={sv.date} stroke={sv.color} strokeWidth={1.6}
                  dot={false} activeDot={{ r: 4 }} connectNulls={false} isAnimationActive={false} />
              );
            })}
          </LineChart>
        </ResponsiveContainer>
      </Box>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Each point is one 20 m piece of road. Gaps = no data there (or a poor fit, if hidden). Dashed lines = modulus limits.
        Smoothing uses a rolling median, so single odd points do not hide the trend.
      </Typography>

      <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>Visible section, by survey</Typography>
      <SimpleTable
        rows={summary}
        columns={[
          { key: 'date', label: 'Survey', align: 'left' },
          { key: 'n', label: 'Points', format: (x) => fmt(x) },
          { key: 'temp', label: 'Asphalt temp. (median)', format: (x) => (x == null ? '–' : `${fmt(x, 1)} °C`) },
          { key: 'med', label: `${v.label}, median`, format: (x) => fmt(x, v.id.startsWith('thk') || v.id === 'rms_pct' ? 1 : 0) },
          { key: 'good', label: 'Good fit (≤ 5%)', format: (x) => fmtPct(x) },
          { key: 'atLim', label: 'At a limit', format: (x) => fmtPct(x) },
        ]}
      />
    </>
  );
}

export default RoadProfileTab;
