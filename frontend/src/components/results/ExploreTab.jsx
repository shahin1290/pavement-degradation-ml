import { useMemo, useState } from 'react';
import { Box, Button, Chip, MenuItem, TextField, ToggleButton, ToggleButtonGroup, Tooltip, Typography } from '@mui/material';

import { toRows, toCsv, downloadCsv } from '../../services/results';
import { useResults, Loading, SimpleTable, fmt, fmtPct, CORRECTIONS } from './common';

const DEFL = ['D0', 'D130', 'D215', 'D300', 'D450', 'D600', 'D900', 'D1200', 'D1500'];
const SURVEY_DATE = { 1: 'Aug 2022', 2: 'Sep 2023', 3: 'May 2024', 4: 'Sep 2024' };

// Which backcalculation to show: file name in public/results/ (built by make_results_data.py)
const OPTIONS = [
  { id: 'comp', label: 'Compromise' },
  { id: 'new', label: 'New' },
  { id: 'before', label: 'Before (old)' },
];
const fileFor = (optId, corr) => (optId === 'before' ? 'dataset_before' : `dataset${corr.suffix}_${optId}`);
/** Position along the road in km from the road key: '5V4D76180' -> 76.18 */
const posKm = (key) => {
  const m = /D(\d+)$/.exec(String(key || ''));
  return m ? Number(m[1]) / 1000 : null;
};
const limitText = (l) => ['E1', 'E2', 'E3', 'E4'].map((e) => `${e} ${fmt(l[e][0])}–${fmt(l[e][1])}`).join(' · ');

/** Case in the shape the predictor page expects */
function toPredictorCase(r) {
  return {
    id: `results-${r.row_index}-${r.survey}`,
    fromResults: true,
    label: `Row ${r.row_index}, survey ${r.survey} (${r.key})${r.poor_fit ? ' — poor fit' : ''}`,
    inputs: Object.fromEntries([...DEFL, 'thk1_mm', 'thk2_mm', 'thk3_mm'].map((c) => [c, r[c]])),
    backcalc: { E1: r.E1, E2: r.E2, E3: r.E3, E4: r.E4 },
  };
}

/** Modulus value; orange when it sits on a limit. */
function Modulus({ e, v, limits }) {
  const [lo, hi] = limits[e];
  const at = v <= lo * 1.005 ? 'lower' : v >= hi * 0.995 ? 'upper' : null;
  if (!at) return fmt(v);
  return (
    <Tooltip title={`On the ${at} limit (${fmt(at === 'lower' ? lo : hi)} MPa)`}>
      <Box component="span" sx={{ color: 'warning.main', fontWeight: 700 }}>{fmt(v)}</Box>
    </Tooltip>
  );
}

function ExploreTab({ onOpenInPredictor }) {
  const [optId, setOptId] = useState(OPTIONS[0].id);
  const [corrId, setCorrId] = useState(CORRECTIONS[0].id);
  const opt = OPTIONS.find((o) => o.id === optId);
  const corr = CORRECTIONS.find((c) => c.id === corrId);
  const { data, error } = useResults(fileFor(optId, corr));
  const rows = useMemo(() => (data ? toRows(data.columns) : []), [data]);
  const [survey, setSurvey] = useState('all');
  const [fit, setFit] = useState('all');
  const [road, setRoad] = useState('all');

  // Roads sorted by number, with their number of bowls
  const roads = useMemo(() => {
    const n = {};
    rows.forEach((r) => { n[r.road] = (n[r.road] || 0) + 1; });
    return Object.keys(n).sort((a, b) => parseFloat(a) - parseFloat(b)).map((k) => ({ road: k, n: n[k] }));
  }, [rows]);

  const filtered = useMemo(() => rows.filter((r) =>
    (survey === 'all' || r.survey === survey)
    && (road === 'all' || r.road === road)
    && (fit === 'all' || (fit === 'good' ? !r.poor_fit : r.poor_fit))), [rows, survey, road, fit]);

  const picker = (
    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, alignItems: 'center', mb: 2 }}>
      <Typography variant="body2" sx={{ fontWeight: 700 }}>Limits:</Typography>
      <ToggleButtonGroup size="small" exclusive value={optId} onChange={(_, v) => v && setOptId(v)} color="primary">
        {OPTIONS.map((o) => <ToggleButton key={o.id} value={o.id} sx={{ px: 2 }}>{o.label}</ToggleButton>)}
      </ToggleButtonGroup>
      <Typography variant="body2" sx={{ fontWeight: 700, ml: { sm: 2 } }}>Temperature correction:</Typography>
      <ToggleButtonGroup size="small" exclusive value={optId === 'before' ? null : corrId}
        onChange={(_, v) => v && setCorrId(v)} color="primary" disabled={optId === 'before'}>
        {CORRECTIONS.map((c) => (
          <ToggleButton key={c.id} value={c.id} title={c.tip} sx={{ px: 2 }}>{c.label}</ToggleButton>
        ))}
      </ToggleButtonGroup>
    </Box>
  );
  if (!data) return <>{picker}<Loading error={error} /></>;

  const columns = [
    {
      key: 'row_index', label: 'Row', align: 'left',
      format: (v, r) => <Tooltip title={`Road key ${r.key}`}><span>{v}</span></Tooltip>,
    },
    {
      key: 'road', label: 'Road', align: 'left',
      format: (v, r) => (
        <Tooltip title={`Road key ${r.key}`}>
          <span><b>{v}</b>{posKm(r.key) != null && (
            <Box component="span" sx={{ color: 'text.secondary' }}> · km {fmt(posKm(r.key), 2)}</Box>
          )}</span>
        </Tooltip>
      ),
    },
    {
      key: 'survey', label: 'Survey', align: 'center',
      format: (v) => <span>{v} <Box component="span" sx={{ color: 'text.secondary' }}>({SURVEY_DATE[v]})</Box></span>,
    },
    {
      key: 'thk', label: 'h1 / h2 / h3 (mm)', align: 'center',
      format: (_, r) => (
        <Box component="span" sx={{ color: 'text.secondary' }}>
          {fmt(r.thk1_mm)} / {fmt(r.thk2_mm)} / {fmt(r.thk3_mm)}
        </Box>
      ),
    },
    { key: 'asphalt_temp_C', label: 'Asphalt temp.', format: (v) => (v == null ? '–' : `${fmt(v, 1)} °C`) },
    ...['E1', 'E2', 'E3', 'E4'].map((e) => ({ key: e, label: e, format: (v) => <Modulus e={e} v={v} limits={data.limits} /> })),
    {
      key: 'rms_pct', label: 'Fit (RMS)', align: 'center',
      format: (v, r) => (
        <Chip
          size="small"
          color={r.poor_fit ? 'warning' : 'success'}
          variant={r.poor_fit ? 'filled' : 'outlined'}
          label={`${fmt(v, 1)}%`}
          sx={{ minWidth: 64 }}
        />
      ),
    },
  ];
  if (onOpenInPredictor) {
    columns.push({
      key: 'predict', label: '', align: 'center',
      format: (_, r) => (
        <Button size="small" variant="outlined" sx={{ py: 0, minWidth: 0, px: 1.25 }}
          onClick={() => onOpenInPredictor(toPredictorCase(r))}>
          Predict
        </Button>
      ),
    });
  }

  return (
    <>
      {picker}
      <Box sx={{ p: 1.5, mb: 2, borderRadius: 2, bgcolor: 'action.hover' }}>
        <Typography variant="body2"><b>{data.label || opt.label}</b></Typography>
        <Typography variant="body2" color="text.secondary">Limits (MPa): {limitText(data.limits)}</Typography>
        <Typography variant="body2" sx={{ mt: 0.5 }}>
          <b>{fmt(data.total.good_fit)}</b> of {fmt(data.total.cases)} cases fit within 5%{' '}
          (<b>{fmtPct((100 * data.total.good_fit) / data.total.cases)}</b>), median fit {fmt(data.total.median_rms, 2)}%.
        </Typography>
      </Box>
      <Typography color="text.secondary" sx={{ mb: 1 }}>
        All backcalculated Östergötland cases (4 layers). Moduli E1–E4 in MPa. Click <strong>Predict</strong> to
        compare the ML model with the backcalculation for any case.
      </Typography>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, alignItems: 'center', mb: 2 }}>
        <Chip size="small" color="success" variant="outlined" label="good fit: RMS ≤ 5%, used for training" />
        <Chip size="small" color="warning" label="poor fit: RMS > 5%" />
        <Typography variant="body2" sx={{ color: 'warning.main', fontWeight: 700 }}>orange modulus</Typography>
        <Typography variant="body2" color="text.secondary">= on a limit</Typography>
      </Box>

      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center', mb: 2 }}>
        <ToggleButtonGroup size="small" exclusive value={survey} onChange={(_, v) => v && setSurvey(v)}>
          <ToggleButton value="all">All surveys</ToggleButton>
          {[1, 2, 3, 4].map((s) => <ToggleButton key={s} value={s}>Survey {s}</ToggleButton>)}
        </ToggleButtonGroup>
        <TextField select size="small" label="Road" value={road} onChange={(e) => setRoad(e.target.value)} sx={{ minWidth: 150 }}>
          <MenuItem value="all">All roads</MenuItem>
          {roads.map((x) => <MenuItem key={x.road} value={x.road}>Road {x.road} ({fmt(x.n)})</MenuItem>)}
        </TextField>
        <ToggleButtonGroup size="small" exclusive value={fit} onChange={(_, v) => v && setFit(v)}>
          <ToggleButton value="all">All</ToggleButton>
          <ToggleButton value="good">Good fits</ToggleButton>
          <ToggleButton value="poor">Poor fits</ToggleButton>
        </ToggleButtonGroup>
        <Typography variant="body2" color="text.secondary">{fmt(filtered.length)} cases</Typography>
        <Box sx={{ flexGrow: 1 }} />
        <Button size="small" variant="outlined"
          onClick={() => downloadCsv(`backcalc_results_${opt.id}${optId === 'before' ? '' : corr.suffix}.csv`, toCsv(filtered, Object.keys(data.columns)))}>
          Download CSV
        </Button>
      </Box>

      <SimpleTable rows={filtered} columns={columns} perPage={25} />
    </>
  );
}

export default ExploreTab;
