import { useMemo, useState } from 'react';
import {
  Alert, Box, Button, Chip, FormControl, InputLabel, MenuItem, Select, Table, TableBody, TableCell,
  TableHead, TablePagination, TableRow, TableSortLabel, ToggleButton, ToggleButtonGroup, Typography,
} from '@mui/material';
import {
  CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';

import { toRows, toCsv, downloadCsv } from '../../services/results';
import {
  useResults, Loading, StatRow, SimpleTable, ChartCard, SURVEY_COLOR, GRID, AXIS, fmt, fmtPct,
} from './common';

const MODULI = ['E1', 'E2', 'E3', 'E4'];
const MODULUS_NAMES = { E1: 'E1 asphalt', E2: 'E2 base', E3: 'E3 subbase', E4: 'E4 subgrade' };
const DEFL = ['D0', 'D130', 'D215', 'D300', 'D450', 'D600', 'D900', 'D1200', 'D1500'];

// Columns of the case table. `fit` and `predict` are drawn specially.
const TABLE_COLS = [
  { key: 'row_index', label: 'Row' },
  { key: 'key', label: 'Key', align: 'left' },
  { key: 'survey', label: 'Survey' },
  { key: 'chainage_m', label: 'Chainage (m)' },
  { key: 'thk1_mm', label: 'h1 (mm)' },
  { key: 'thk2_mm', label: 'h2 (mm)' },
  { key: 'thk3_mm', label: 'h3 (mm)' },
  { key: 'D0', label: 'D0 (µm)' },
  { key: 'E1', label: 'E1' },
  { key: 'E2', label: 'E2' },
  { key: 'E3', label: 'E3' },
  { key: 'E4', label: 'E4' },
  { key: 'rms_pct', label: 'RMS %' },
];

/** Case as the predictor page expects it */
function toPredictorCase(r) {
  return {
    id: `results-${r.row_index}-${r.survey}`,
    fromResults: true,
    label: `Row ${r.row_index}, survey ${r.survey} (${r.key})${r.poor_fit ? ' — poor fit' : ''}`,
    inputs: Object.fromEntries([...DEFL, 'thk1_mm', 'thk2_mm', 'thk3_mm'].map((c) => [c, r[c]])),
    backcalc: { E1: r.E1, E2: r.E2, E3: r.E3, E4: r.E4 },
  };
}

function DatasetTab({ onOpenInPredictor }) {
  const { data, error } = useResults('dataset');
  const rows = useMemo(() => (data ? toRows(data.columns) : []), [data]);

  const [road, setRoad] = useState('all');
  const [surveys, setSurveys] = useState([1, 2, 3, 4]);
  const [fit, setFit] = useState('all');
  const [modulus, setModulus] = useState('E4');
  const [sort, setSort] = useState({ key: 'row_index', dir: 'asc' });
  const [page, setPage] = useState(0);
  const [perPage, setPerPage] = useState(25);

  const roads = useMemo(() => [...new Set(rows.map((r) => r.road))].sort((a, b) => parseFloat(a) - parseFloat(b)), [rows]);

  const filtered = useMemo(() => rows.filter((r) =>
    (road === 'all' || r.road === road)
    && surveys.includes(r.survey)
    && (fit === 'all' || (fit === 'good' ? !r.poor_fit : r.poor_fit))), [rows, road, surveys, fit]);

  const sorted = useMemo(() => {
    const s = [...filtered];
    const m = sort.dir === 'asc' ? 1 : -1;
    s.sort((a, b) => (a[sort.key] > b[sort.key] ? m : a[sort.key] < b[sort.key] ? -m : 0));
    return s;
  }, [filtered, sort]);

  // Per-road summary (good fits only for the moduli)
  const roadSummary = useMemo(() => {
    const by = new Map();
    rows.forEach((r) => {
      if (!by.has(r.road)) by.set(r.road, []);
      by.get(r.road).push(r);
    });
    const median = (a) => {
      if (!a.length) return null;
      const s = [...a].sort((x, y) => x - y);
      return s[Math.floor(s.length / 2)];
    };
    return [...by.entries()].map(([rd, rs]) => {
      const good = rs.filter((r) => !r.poor_fit);
      return {
        road: rd,
        rows: `${Math.min(...rs.map((r) => r.row_index))}–${Math.max(...rs.map((r) => r.row_index))}`,
        cases: rs.length,
        good_pct: (100 * good.length) / rs.length,
        median_rms: median(rs.map((r) => r.rms_pct)),
        ...Object.fromEntries(MODULI.map((e) => [e, median(good.map((r) => r[e]))])),
      };
    }).sort((a, b) => parseFloat(a.road) - parseFloat(b.road));
  }, [rows]);

  // Line chart data for one road: one point per chainage, one line per survey
  const chartData = useMemo(() => {
    if (road === 'all') return [];
    const byCh = new Map();
    filtered.forEach((r) => {
      if (!byCh.has(r.chainage_m)) byCh.set(r.chainage_m, { chainage: r.chainage_m });
      byCh.get(r.chainage_m)[`s${r.survey}`] = r[modulus];
    });
    return [...byCh.values()].sort((a, b) => a.chainage - b.chainage);
  }, [filtered, road, modulus]);

  if (!data) return <Loading error={error} />;
  const t = data.total;

  const toggleSort = (key) => setSort((s) => ({ key, dir: s.key === key && s.dir === 'asc' ? 'desc' : 'asc' }));
  const changeFilter = (setter) => (v) => { setter(v); setPage(0); };

  return (
    <>
      <Typography color="text.secondary" sx={{ mb: 2 }}>
        Every backcalculated case (4 layers, bounded moduli). Cases with RMS ≤ 5% are used to train the ML model;
        poor fits are shown for reference.
      </Typography>

      <StatRow items={[
        { label: 'Cases', value: fmt(t.cases), note: `${t.roads} roads × 4 surveys` },
        { label: 'Used for training', value: fmt(t.good_fit), note: `${fmtPct((100 * t.good_fit) / t.cases)} (RMS ≤ 5%)` },
        { label: 'Poor fits', value: fmt(t.poor_fit), note: 'RMS > 5%, not used' },
        { label: 'Median RMS', value: `${t.median_rms}%`, note: 'measured vs calculated' },
      ]} />

      <Typography variant="h6" gutterBottom>Per survey</Typography>
      <SimpleTable
        rows={data.by_survey}
        highlight={(r) => r.good_fit_pct < 80}
        columns={[
          { key: 'survey', label: 'Survey', align: 'left', format: (v, r) => `${v} (${r.date})` },
          { key: 'cases', label: 'Cases', format: (v) => fmt(v) },
          { key: 'good_fit_pct', label: 'Good fits', format: fmtPct },
          { key: 'median_rms', label: 'Median RMS', format: (v) => `${v}%` },
          { key: 'position_mismatch', label: 'Position mismatch', format: (v) => fmt(v) },
          ...MODULI.map((e) => ({ key: `${e}_median`, label: `Median ${e} (MPa)`, format: (v) => fmt(v) })),
        ]}
      />

      {/* Filters: one row above the chart and table */}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center', mb: 2 }}>
        <FormControl size="small" sx={{ minWidth: 160 }}>
          <InputLabel id="road-label">Road</InputLabel>
          <Select labelId="road-label" label="Road" value={road} onChange={(e) => changeFilter(setRoad)(e.target.value)}>
            <MenuItem value="all">All roads</MenuItem>
            {roads.map((r) => <MenuItem key={r} value={r}>Road {r}</MenuItem>)}
          </Select>
        </FormControl>
        <ToggleButtonGroup size="small" value={surveys} onChange={(_, v) => v.length && changeFilter(setSurveys)(v)}>
          {[1, 2, 3, 4].map((s) => <ToggleButton key={s} value={s}>Survey {s}</ToggleButton>)}
        </ToggleButtonGroup>
        <ToggleButtonGroup size="small" exclusive value={fit} onChange={(_, v) => v && changeFilter(setFit)(v)}>
          <ToggleButton value="all">All</ToggleButton>
          <ToggleButton value="good">Good fits</ToggleButton>
          <ToggleButton value="poor">Poor fits</ToggleButton>
        </ToggleButtonGroup>
        <Typography variant="body2" color="text.secondary">{fmt(filtered.length)} cases</Typography>
      </Box>

      {road === 'all' ? (
        <>
          <Alert severity="info" sx={{ mb: 2 }}>
            Select a road (or click one in the table below) to see the moduli along the road for each survey.
          </Alert>
          <Typography variant="h6" gutterBottom>Per road</Typography>
          <Box sx={{ maxHeight: 360, overflowY: 'auto', mb: 3 }}>
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  {['Road', 'Rows', 'Cases', 'Good fits', 'Median RMS', 'E1', 'E2', 'E3', 'E4'].map((h) => (
                    <TableCell key={h} align={h === 'Road' ? 'left' : 'right'} sx={{ fontWeight: 700 }}>{h}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {roadSummary.map((r) => (
                  <TableRow
                    key={r.road}
                    hover
                    onClick={() => changeFilter(setRoad)(r.road)}
                    sx={{ cursor: 'pointer', ...(r.good_pct < 70 ? { bgcolor: '#fff7e6' } : {}) }}
                  >
                    <TableCell>Road {r.road}</TableCell>
                    <TableCell align="right">{r.rows}</TableCell>
                    <TableCell align="right">{fmt(r.cases)}</TableCell>
                    <TableCell align="right">{fmtPct(r.good_pct)}</TableCell>
                    <TableCell align="right">{fmt(r.median_rms, 2)}%</TableCell>
                    {MODULI.map((e) => <TableCell key={e} align="right">{fmt(r[e])}</TableCell>)}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Box>
        </>
      ) : (
        <ChartCard
          title={`Road ${road}: ${MODULUS_NAMES[modulus]} along the road`}
          note="One line per survey. Logarithmic scale. Gaps are missing or filtered cases."
          height={340}
        >
          <Box sx={{ mb: 1 }}>
            <ToggleButtonGroup size="small" exclusive value={modulus} onChange={(_, v) => v && setModulus(v)}>
              {MODULI.map((e) => <ToggleButton key={e} value={e}>{MODULUS_NAMES[e]}</ToggleButton>)}
            </ToggleButtonGroup>
          </Box>
          <ResponsiveContainer width="100%" height="85%">
            <LineChart data={chartData} margin={{ top: 8, right: 16, bottom: 8, left: 8 }}>
              <CartesianGrid stroke={GRID} vertical={false} />
              <XAxis dataKey="chainage" type="number" domain={['dataMin', 'dataMax']} tick={AXIS}
                label={{ value: 'Chainage (m)', position: 'insideBottom', offset: -4, ...AXIS }} />
              <YAxis scale="log" domain={['auto', 'auto']} allowDataOverflow tick={AXIS} width={56}
                tickFormatter={(v) => fmt(v)} />
              <Tooltip formatter={(v, n) => [`${fmt(v)} MPa`, n]} labelFormatter={(l) => `Chainage ${fmt(l)} m`} />
              <Legend />
              {surveys.map((s) => (
                <Line key={s} type="linear" dataKey={`s${s}`} name={`Survey ${s} (${data.surveys[s]})`}
                  stroke={SURVEY_COLOR[s]} strokeWidth={2} dot={false} connectNulls={false} isAnimationActive={false} />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
      )}

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
        <Typography variant="h6">Cases</Typography>
        <Button
          size="small"
          variant="outlined"
          onClick={() => downloadCsv('backcalc_filtered.csv', toCsv(sorted, Object.keys(data.columns)))}
        >
          Download {fmt(sorted.length)} cases (CSV)
        </Button>
      </Box>
      <Box sx={{ overflowX: 'auto' }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              {TABLE_COLS.map((c) => (
                <TableCell key={c.key} align={c.align || 'right'} sx={{ fontWeight: 700, whiteSpace: 'nowrap' }}>
                  <TableSortLabel
                    active={sort.key === c.key}
                    direction={sort.key === c.key ? sort.dir : 'asc'}
                    onClick={() => toggleSort(c.key)}
                  >
                    {c.label}
                  </TableSortLabel>
                </TableCell>
              ))}
              <TableCell sx={{ fontWeight: 700 }}>Flags</TableCell>
              <TableCell />
            </TableRow>
          </TableHead>
          <TableBody>
            {sorted.slice(page * perPage, page * perPage + perPage).map((r) => (
              <TableRow key={`${r.row_index}-${r.survey}`} hover>
                {TABLE_COLS.map((c) => (
                  <TableCell key={c.key} align={c.align || 'right'}>
                    {typeof r[c.key] === 'number' && c.key !== 'row_index' && c.key !== 'survey'
                      ? fmt(r[c.key], c.key === 'rms_pct' ? 2 : 0)
                      : r[c.key]}
                  </TableCell>
                ))}
                <TableCell sx={{ whiteSpace: 'nowrap' }}>
                  {r.poor_fit ? <Chip size="small" color="warning" label="poor fit" sx={{ mr: 0.5 }} /> : null}
                  {r.position_mismatch ? <Chip size="small" label="position" sx={{ mr: 0.5 }} /> : null}
                  {r.at_limit ? <Chip size="small" variant="outlined" label={r.at_limit} /> : null}
                </TableCell>
                <TableCell>
                  {onOpenInPredictor && (
                    <Button size="small" onClick={() => onOpenInPredictor(toPredictorCase(r))}>Predict</Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Box>
      <TablePagination
        component="div"
        count={sorted.length}
        page={page}
        onPageChange={(_, p) => setPage(p)}
        rowsPerPage={perPage}
        onRowsPerPageChange={(e) => { setPerPage(parseInt(e.target.value, 10)); setPage(0); }}
        rowsPerPageOptions={[25, 50, 100]}
      />
    </>
  );
}

export default DatasetTab;
