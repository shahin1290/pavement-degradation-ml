import { useMemo, useState } from 'react';
import { Box, Button, Chip, ToggleButton, ToggleButtonGroup, Typography } from '@mui/material';

import { toRows, toCsv, downloadCsv } from '../../services/results';
import { useResults, Loading, SimpleTable, fmt } from './common';

const DEFL = ['D0', 'D130', 'D215', 'D300', 'D450', 'D600', 'D900', 'D1200', 'D1500'];

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

function ExploreTab({ onOpenInPredictor }) {
  const { data, error } = useResults('dataset');
  const rows = useMemo(() => (data ? toRows(data.columns) : []), [data]);
  const [survey, setSurvey] = useState('all');
  const [fit, setFit] = useState('all');

  const filtered = useMemo(() => rows.filter((r) =>
    (survey === 'all' || r.survey === survey)
    && (fit === 'all' || (fit === 'good' ? !r.poor_fit : r.poor_fit))), [rows, survey, fit]);

  if (!data) return <Loading error={error} />;

  const columns = [
    { key: 'row_index', label: 'Row' },
    { key: 'key', label: 'Key', align: 'left' },
    { key: 'survey', label: 'Survey' },
    { key: 'thk1_mm', label: 'h1 (mm)', format: (v) => fmt(v) },
    { key: 'thk2_mm', label: 'h2 (mm)', format: (v) => fmt(v) },
    { key: 'thk3_mm', label: 'h3 (mm)', format: (v) => fmt(v) },
    { key: 'asphalt_temp_C', label: 'BELLS temp (°C)', format: (v) => fmt(v, 1) },
    { key: 'E1', label: 'E1', format: (v) => fmt(v) },
    { key: 'E2', label: 'E2', format: (v) => fmt(v) },
    { key: 'E3', label: 'E3', format: (v) => fmt(v) },
    { key: 'E4', label: 'E4', format: (v) => fmt(v) },
    { key: 'rms_pct', label: 'RMS', format: (v) => `${fmt(v, 1)}%` },
    {
      key: 'poor_fit', label: 'Fit', align: 'left',
      format: (v) => (v
        ? <Chip size="small" color="warning" label="poor" />
        : <Chip size="small" variant="outlined" label="good" />),
    },
    {
      key: 'predict', label: '', align: 'left',
      format: (_, r) => onOpenInPredictor && (
        <Button size="small" onClick={() => onOpenInPredictor(toPredictorCase(r))}>Predict</Button>
      ),
    },
  ];

  return (
    <>
      <Typography color="text.secondary" sx={{ mb: 2 }}>
        All backcalculated cases (4 layers, with limits). Moduli in MPa. Good fits (RMS ≤ 5%) are used for training.
        Click <strong>Predict</strong> to compare the ML model with the backcalculation for any case.
      </Typography>

      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center', mb: 2 }}>
        <ToggleButtonGroup size="small" exclusive value={survey} onChange={(_, v) => v && setSurvey(v)}>
          <ToggleButton value="all">All surveys</ToggleButton>
          {[1, 2, 3, 4].map((s) => <ToggleButton key={s} value={s}>Survey {s}</ToggleButton>)}
        </ToggleButtonGroup>
        <ToggleButtonGroup size="small" exclusive value={fit} onChange={(_, v) => v && setFit(v)}>
          <ToggleButton value="all">All</ToggleButton>
          <ToggleButton value="good">Good fits</ToggleButton>
          <ToggleButton value="poor">Poor fits</ToggleButton>
        </ToggleButtonGroup>
        <Typography variant="body2" color="text.secondary">{fmt(filtered.length)} cases</Typography>
        <Box sx={{ flexGrow: 1 }} />
        <Button size="small" variant="outlined"
          onClick={() => downloadCsv('backcalc_results.csv', toCsv(filtered, Object.keys(data.columns)))}>
          Download CSV
        </Button>
      </Box>

      <SimpleTable rows={filtered} columns={columns} perPage={25} />
    </>
  );
}

export default ExploreTab;
