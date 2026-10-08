import { useMemo, useState } from 'react';
import { Box, Button, Chip, ToggleButton, ToggleButtonGroup, Tooltip, Typography } from '@mui/material';

import { toRows, toCsv, downloadCsv } from '../../services/results';
import { useResults, Loading, SimpleTable, fmt, LIMITS } from './common';

const DEFL = ['D0', 'D130', 'D215', 'D300', 'D450', 'D600', 'D900', 'D1200', 'D1500'];
const SURVEY_DATE = { 1: 'Aug 2022', 2: 'Sep 2023', 3: 'May 2024', 4: 'Sep 2024' };

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
function Modulus({ e, v }) {
  const [lo, hi] = LIMITS[e];
  const at = v <= lo * 1.005 ? 'lower' : v >= hi * 0.995 ? 'upper' : null;
  if (!at) return fmt(v);
  return (
    <Tooltip title={`On the ${at} limit (${fmt(at === 'lower' ? lo : hi)} MPa)`}>
      <Box component="span" sx={{ color: 'warning.main', fontWeight: 700 }}>{fmt(v)}</Box>
    </Tooltip>
  );
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
    {
      key: 'row_index', label: 'Row', align: 'left',
      format: (v, r) => <Tooltip title={`Road key ${r.key}`}><span>{v}</span></Tooltip>,
    },
    {
      key: 'survey', label: 'Survey', align: 'center',
      format: (v) => <Tooltip title={SURVEY_DATE[v] || ''}><span>{v}</span></Tooltip>,
    },
    {
      key: 'thk', label: 'h1 / h2 / h3 (mm)', align: 'center',
      format: (_, r) => (
        <Box component="span" sx={{ color: 'text.secondary' }}>
          {fmt(r.thk1_mm)} / {fmt(r.thk2_mm)} / {fmt(r.thk3_mm)}
        </Box>
      ),
    },
    { key: 'asphalt_temp_C', label: 'Temp (°C)', format: (v) => fmt(v, 1) },
    ...['E1', 'E2', 'E3', 'E4'].map((e) => ({ key: e, label: e, format: (v) => <Modulus e={e} v={v} /> })),
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
      <Typography color="text.secondary" sx={{ mb: 1 }}>
        All backcalculated cases (4 layers, with limits). Moduli E1–E4 in MPa. Click <strong>Predict</strong> to
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
