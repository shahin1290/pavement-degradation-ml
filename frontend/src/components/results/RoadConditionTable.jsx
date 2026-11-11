import { useMemo, useState } from 'react';
import {
  Box, Button, Checkbox, FormControlLabel, MenuItem, TextField, ToggleButton, ToggleButtonGroup, Typography,
} from '@mui/material';
import { alpha } from '@mui/material/styles';

import { toRows, toCsv, downloadCsv } from '../../services/results';
import { useRegion } from '../../services/region';
import { useResults, Loading, SimpleTable, fmt } from './common';

// Every usable 20 m point with its grade from both methods, with filters
// (data: strain_points.json, written by strain/strain_analysis.py).
const COLORS = { Good: '#2e8b57', Adequate: '#9acd32', Satisfactory: '#f2c94c', Alarming: '#f2994a', Deteriorating: '#d64545' };
const THICKNESS = [
  { id: 'all', label: 'All', test: () => true },
  { id: 'lt100', label: '< 100 mm', test: (v) => v < 100 },
  { id: '100-150', label: '100–150 mm', test: (v) => v >= 100 && v < 150 },
  { id: 'ge150', label: '≥ 150 mm', test: (v) => v >= 150 },
];
const AGREE = [
  { id: 'all', label: 'All' },
  { id: 'same', label: 'Same grade' },
  { id: 'ours_worse', label: 'Own method worse' },
  { id: 'tv_worse', label: 'Trafikverket worse' },
];
const SORTS = [
  { id: 'road', label: 'Road and km' },
  { id: 'ours', label: 'Own strain, highest first' },
  { id: 'eq3', label: 'Trafikverket strain, highest first' },
  { id: 'diff', label: 'Biggest difference between methods' },
];

function GradeChip({ g }) {
  return (
    <Box component="span" sx={{ px: 0.75, py: 0.1, borderRadius: 1, fontWeight: 700, bgcolor: alpha(COLORS[g] || '#ccc', 0.4) }}>{g}</Box>
  );
}

/** Pick any number of grades (none picked = all). */
function GradePicker({ label, classes, value, onChange }) {
  return (
    <Box>
      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>{label}</Typography>
      <ToggleButtonGroup size="small" value={value} onChange={(_, v) => onChange(v)} sx={{ display: 'flex', flexWrap: 'wrap' }}>
        {classes.map((c) => (
          <ToggleButton key={c} value={c} sx={{ py: 0.25, px: 1, textTransform: 'none', '&.Mui-selected': { bgcolor: alpha(COLORS[c], 0.45) } }}>
            {c}
          </ToggleButton>
        ))}
      </ToggleButtonGroup>
    </Box>
  );
}

/** Share of the filtered points per grade, as one bar. */
function ShareBar({ label, rows, field, classes }) {
  const n = rows.length || 1;
  const share = Object.fromEntries(classes.map((c) => [c, (100 * rows.filter((r) => r[field] === c).length) / n]));
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.75 }}>
      <Typography variant="body2" sx={{ width: 150, flexShrink: 0 }}>{label}</Typography>
      <Box sx={{ flex: 1, display: 'flex', height: 22, borderRadius: 1, overflow: 'hidden', border: 1, borderColor: 'divider' }}>
        {classes.map((c) => share[c] > 0 && (
          <Box key={c} title={`${c}: ${fmt(share[c], 1)}%`} sx={{ width: `${share[c]}%`, bgcolor: COLORS[c], fontSize: 11, fontWeight: 700,
            display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', whiteSpace: 'nowrap' }}
          >
            {share[c] >= 8 ? `${fmt(share[c])}%` : ''}
          </Box>
        ))}
      </Box>
    </Box>
  );
}

function RoadConditionTable() {
  const { data, error } = useResults('strain_points');
  const region = useRegion();
  const [survey, setSurvey] = useState('all');
  const [road, setRoad] = useState('all');
  const [gOurs, setGOurs] = useState([]);
  const [gTv, setGTv] = useState([]);
  const [agree, setAgree] = useState('all');
  const [thk, setThk] = useState('all');
  const [hideLimit, setHideLimit] = useState(false);
  const [sort, setSort] = useState('road');

  const classes = data?.classes || [];
  const rows = useMemo(() => {
    if (!data) return [];
    const lim = data.limits;
    const grade = (v) => classes[lim.filter((x) => v >= x).length];
    return toRows(data.columns).map((r) => {
      const go = grade(r.ours); const gt = grade(r.eq3);
      return { ...r, g_ours: go, g_tv: gt, step: classes.indexOf(go) - classes.indexOf(gt) };
    });
  }, [data]);   // eslint-disable-line react-hooks/exhaustive-deps

  const roads = useMemo(() => [...new Set(rows.map((r) => r.road))].sort((a, b) => parseFloat(a) - parseFloat(b)), [rows]);

  const filtered = useMemo(() => {
    const t = THICKNESS.find((x) => x.id === thk);
    const out = rows.filter((r) => (survey === 'all' || r.survey === survey)
      && (road === 'all' || r.road === road)
      && (!gOurs.length || gOurs.includes(r.g_ours))
      && (!gTv.length || gTv.includes(r.g_tv))
      && (agree === 'all' || (agree === 'same' ? r.step === 0 : agree === 'ours_worse' ? r.step > 0 : r.step < 0))
      && t.test(r.thk1)
      && (!hideLimit || !r.at_limit));
    const by = {
      road: (a, b) => parseFloat(a.road) - parseFloat(b.road) || a.km - b.km || a.survey - b.survey,
      ours: (a, b) => b.ours - a.ours,
      eq3: (a, b) => b.eq3 - a.eq3,
      diff: (a, b) => Math.abs(b.ours - b.eq3) - Math.abs(a.ours - a.eq3),
    }[sort];
    return [...out].sort(by);
  }, [rows, survey, road, gOurs, gTv, agree, thk, hideLimit, sort]);

  if (!data) return <Loading error={error} />;
  const reset = () => {
    setSurvey('all'); setRoad('all'); setGOurs([]); setGTv([]); setAgree('all'); setThk('all'); setHideLimit(false); setSort('road');
  };
  const csvCols = ['road', 'km', 'survey', 'thk1', 'thk2', 'thk3', 'E1', 'E2', 'E3', 'E4', 'D0', 'ours', 'g_ours', 'eq3', 'g_tv',
    'subgrade', 'heavy', 'at_limit', 'key'];

  return (
    <Box>
      <Typography sx={{ mb: 2 }}>
        Every usable 20 m point ({fmt(rows.length)} in {region.name}) with its grade from both methods:
        {' '}<b>own</b> = asphalt strain calculated from the backcalculated moduli, <b>Trafikverket</b> = strain estimated from the
        deflection bowl. Pick grades to filter (nothing picked = all grades).
      </Typography>

      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'flex-end', mb: 2 }}>
        <GradePicker label="Grade, own method (moduli)" classes={classes} value={gOurs} onChange={setGOurs} />
        <GradePicker label="Grade, Trafikverket (deflections)" classes={classes} value={gTv} onChange={setGTv} />
      </Box>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center', mb: 2 }}>
        <TextField select size="small" label="Survey" value={survey} onChange={(e) => setSurvey(e.target.value)} sx={{ minWidth: 150 }}>
          <MenuItem value="all">All surveys</MenuItem>
          {Object.entries(data.surveys).map(([s, d]) => <MenuItem key={s} value={Number(s)}>{d}</MenuItem>)}
        </TextField>
        <TextField select size="small" label="Road" value={road} onChange={(e) => setRoad(e.target.value)} sx={{ minWidth: 120 }}>
          <MenuItem value="all">All roads</MenuItem>
          {roads.map((r) => <MenuItem key={r} value={r}>Road {r}</MenuItem>)}
        </TextField>
        <TextField select size="small" label="Methods agree?" value={agree} onChange={(e) => setAgree(e.target.value)} sx={{ minWidth: 190 }}>
          {AGREE.map((a) => <MenuItem key={a.id} value={a.id}>{a.label}</MenuItem>)}
        </TextField>
        <TextField select size="small" label="Asphalt thickness" value={thk} onChange={(e) => setThk(e.target.value)} sx={{ minWidth: 160 }}>
          {THICKNESS.map((t) => <MenuItem key={t.id} value={t.id}>{t.label}</MenuItem>)}
        </TextField>
        <TextField select size="small" label="Sort by" value={sort} onChange={(e) => setSort(e.target.value)} sx={{ minWidth: 230 }}>
          {SORTS.map((s) => <MenuItem key={s.id} value={s.id}>{s.label}</MenuItem>)}
        </TextField>
        <FormControlLabel control={<Checkbox size="small" checked={hideLimit} onChange={(e) => setHideLimit(e.target.checked)} />}
          label="Hide points with a modulus at a limit (less certain)" />
      </Box>

      <Box sx={{ p: 1.5, mb: 2, borderRadius: 2, bgcolor: 'action.hover' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap', mb: 1 }}>
          <Typography variant="body2"><b>{fmt(filtered.length)}</b> points shown</Typography>
          <Button size="small" onClick={reset}>Reset filters</Button>
          <Button size="small" variant="outlined"
            onClick={() => downloadCsv(`road_condition_${region.id}.csv`, toCsv(filtered, csvCols))}>
            Download CSV
          </Button>
        </Box>
        <ShareBar label="Own method" rows={filtered} field="g_ours" classes={classes} />
        <ShareBar label="Trafikverket" rows={filtered} field="g_tv" classes={classes} />
      </Box>

      <SimpleTable
        rows={filtered}
        perPage={25}
        highlight={(r) => r.at_limit}
        columns={[
          { key: 'road', label: 'Road', align: 'left' },
          { key: 'km', label: 'km', format: (v) => fmt(v, 2) },
          { key: 'survey', label: 'Survey', align: 'left', format: (v) => data.surveys[v] },
          { key: 'thk1', label: 'Asphalt (mm)' },
          { key: 'E1', label: 'E1', format: (v) => fmt(v) },
          { key: 'E2', label: 'E2', format: (v) => fmt(v) },
          { key: 'E3', label: 'E3', format: (v) => fmt(v) },
          { key: 'E4', label: 'E4', format: (v) => fmt(v) },
          { key: 'D0', label: 'D0 (µm)' },
          { key: 'ours', label: 'Own strain (µε)', format: (v) => fmt(v) },
          { key: 'g_ours', label: 'Own grade', align: 'left', format: (v) => <GradeChip g={v} /> },
          { key: 'eq3', label: 'Trafikverket (µε)', format: (v) => fmt(v) },
          { key: 'g_tv', label: 'Trafikverket grade', align: 'left', format: (v) => <GradeChip g={v} /> },
          { key: 'heavy', label: 'Heavy veh./day', format: (v) => fmt(v) },
          { key: 'at_limit', label: 'At limit', align: 'left', format: (v) => v.replaceAll(';', ', ') },
        ]}
      />
      <Typography variant="caption" color="text.secondary">
        Moduli E1–E4 in MPa. Yellow rows: a modulus is at a limit, so the own strain is less certain.
        Grades: Good &lt; {data.limits[0]}, Adequate {data.limits[0]}–{data.limits[1]}, Satisfactory {data.limits[1]}–{data.limits[2]},
        Alarming {data.limits[2]}–{data.limits[3]}, Deteriorating &gt; {data.limits[3]} µε (Saarenketo &amp; Männistö 2024).
      </Typography>
    </Box>
  );
}

export default RoadConditionTable;
