import { useEffect, useMemo, useState } from 'react';
import {
  Alert, Box, Button, CircularProgress, FormControl, InputLabel, MenuItem, Paper, Select, TextField, Typography,
  Table, TableBody, TableCell, TableHead, TableRow,
} from '@mui/material';

import Section from '../components/Section';
import ErapaveCheck from '../components/ErapaveCheck';
import { predictModuli, getModelInfo } from '../services/api';
import { INPUT_DEFINITIONS, INPUT_GROUPS, CORE_INPUTS, MODULI } from '../data/predictorInputs';
import { EXAMPLE_CASES } from '../data/exampleCases';
import { loadResults } from '../services/results';

const toFormValues = (inputs) =>
  Object.fromEntries(Object.entries(inputs).map(([k, v]) => [k, String(v)]));

// `preset` (optional): a case sent from the Results page, same shape as an example case
function PredictorPage({ preset }) {
  const start = preset || EXAMPLE_CASES[0];
  const [modelInfo, setModelInfo] = useState(null);
  const [example, setExample] = useState(start);
  const [values, setValues] = useState(toFormValues(start.inputs));
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Holdout cases (never used for training); falls back to the built-in examples
  const [cases, setCases] = useState(EXAMPLE_CASES);
  const [erapaveSummary, setErapaveSummary] = useState(null);

  // Ask the backend which inputs the current model needs
  useEffect(() => {
    getModelInfo().then(setModelInfo).catch(() => setModelInfo(null));
    loadResults('holdout')
      .then((h) => {
        if (!h.cases?.length) return;
        setCases(h.cases);
        setErapaveSummary(h.erapave_summary);
        // start on the first holdout case, unless a case was sent from the Results page
        if (!preset) loadExample(h.cases.find((c) => c.id === 'holdout-1876-1') || h.cases[0]);
      })
      .catch(() => {});
  }, []);

  const features = modelInfo?.features || CORE_INPUTS;

  // Group the needed inputs for display
  const groups = useMemo(
    () =>
      INPUT_GROUPS.map((g) => ({
        ...g,
        fields: features.filter((f) => (INPUT_DEFINITIONS[f]?.group || 'other') === g.id),
      })).filter((g) => g.fields.length > 0),
    [features],
  );

  const loadExample = (ex) => {
    setExample(ex);
    setValues(toFormValues(ex.inputs));
    setResult(null);
    setError(null);
  };

  // A new case sent from the Results page
  useEffect(() => {
    if (preset) loadExample(preset);
  }, [preset]);

  const clearForm = () => {
    setExample(null);
    setValues({});
    setResult(null);
    setError(null);
  };

  const handleChange = (name) => (e) => {
    setValues({ ...values, [name]: e.target.value });
    setExample(null); // edited values no longer match the example
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const payload = Object.fromEntries(features.map((f) => [f, parseFloat(values[f])]));
      setResult(await predictModuli(payload));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Section
        title="🔮 Live Predictor — Layer Moduli E1–E4"
        intro="Enter a TSD deflection basin and the layer thicknesses. The trained model returns the
          four layer moduli of the 4-layer structure (asphalt, base, subbase, subgrade) in milliseconds,
          instead of an iterative ERAPave backcalculation."
      >
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center', mb: 2 }}>
          <FormControl size="small" sx={{ minWidth: 340 }}>
            <InputLabel id="case-label">Holdout case ({cases.length}, never used for training)</InputLabel>
            <Select
              labelId="case-label"
              label={`Holdout case (${cases.length}, never used for training)`}
              value={cases.some((c) => c.id === example?.id) ? example.id : ''}
              onChange={(e) => loadExample(cases.find((c) => c.id === e.target.value))}
            >
              {cases.map((c) => (
                <MenuItem key={c.id} value={c.id}>
                  {c.label}{c.erapave?.ml ? ' — ✓ ERAPave check' : ''}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <Button variant="outlined" size="small" onClick={clearForm}>Clear</Button>
        </Box>

        {erapaveSummary && (
          <Alert severity="info" sx={{ mb: 2 }}>
            ERAPave check of the ML moduli: <strong>{erapaveSummary.cases}</strong> holdout cases,
            median RMS <strong>{erapaveSummary.median_rms_pct}%</strong>,{' '}
            {erapaveSummary.within_3} within 3% and {erapaveSummary.within_5} within 5%.
          </Alert>
        )}

        {example?.fromResults && (
          <Alert severity="info" sx={{ mb: 2 }}>
            Loaded from the Results page: <strong>{example.label}</strong>
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit}>
          {groups.map((group) => (
            <Box key={group.id} sx={{ mb: 2 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                {group.title}
              </Typography>
              {group.note && (
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  {group.note}
                </Typography>
              )}
              <Box
                sx={{
                  display: 'grid',
                  gap: 1.5,
                  gridTemplateColumns: { xs: '1fr 1fr', sm: 'repeat(3, 1fr)', md: 'repeat(5, 1fr)' },
                }}
              >
                {group.fields.map((name) => {
                  const def = INPUT_DEFINITIONS[name] || { label: name, unit: '' };
                  return (
                    <TextField
                      key={name}
                      label={def.unit ? `${def.label} (${def.unit})` : def.label}
                      type="number"
                      size="small"
                      value={values[name] ?? ''}
                      onChange={handleChange(name)}
                      inputProps={{ step: 'any' }}
                      required
                    />
                  );
                })}
              </Box>
            </Box>
          ))}

          <Button type="submit" variant="contained" size="large" disabled={loading}>
            {loading ? <CircularProgress size={22} sx={{ mr: 1 }} /> : null}
            {loading ? 'Calculating…' : 'Predict layer moduli'}
          </Button>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mt: 3 }}>
            {error}
          </Alert>
        )}

        {result && <Results result={result} reference={example?.backcalc} />}

        {example?.erapave && <ErapaveCheck check={example.erapave} measured={example.inputs} predicted={result} />}
      </Section>

      {modelInfo && <ModelInfo info={modelInfo} />}
    </>
  );
}

function Results({ result, reference }) {
  return (
    <Box sx={{ mt: 4 }}>
      <Typography variant="h6" gutterBottom>
        Predicted layer moduli
      </Typography>

      {result.warnings?.map((w) => (
        <Alert key={w} severity="warning" sx={{ mb: 1 }}>
          {w}
        </Alert>
      ))}

      <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr 1fr', md: 'repeat(4, 1fr)' } }}>
        {MODULI.map((m) => {
          const value = result[m.key];
          const ref = reference?.[m.target];
          const diff = ref ? ((value / ref - 1) * 100).toFixed(0) : null;
          return (
            <Paper key={m.key} variant="outlined" sx={{ p: 2 }}>
              <Typography variant="body2" color="text.secondary">
                {m.label}
              </Typography>
              <Typography variant="h5">{Math.round(value).toLocaleString()} MPa</Typography>
              {ref && (
                <Typography variant="caption" color="text.secondary">
                  Backcalculated: {ref.toLocaleString()} MPa ({diff > 0 ? '+' : ''}{diff}%)
                </Typography>
              )}
            </Paper>
          );
        })}
      </Box>
    </Box>
  );
}

function ModelInfo({ info }) {
  const metrics = info.test_metrics || {};
  return (
    <Section
      title="📊 Current model"
      intro={`Model: ${info.model_type} · Inputs: ${info.feature_groups.join(', ')} · Tested on road
        stretches not used for training.`}
    >
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Modulus</TableCell>
            <TableCell align="right">Median error</TableCell>
            <TableCell align="right">80% of cases within</TableCell>
            <TableCell align="right">R² (log)</TableCell>
            <TableCell align="right">Allowed range (MPa)</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {info.targets.map((t) => (
            <TableRow key={t}>
              <TableCell>{t}</TableCell>
              <TableCell align="right">{metrics[t] ? `${metrics[t].median_error_pct.toFixed(1)}%` : '–'}</TableCell>
              <TableCell align="right">{metrics[t] ? `${metrics[t].p80_error_pct.toFixed(1)}%` : '–'}</TableCell>
              <TableCell align="right">{metrics[t] ? metrics[t].r2_log.toFixed(3) : '–'}</TableCell>
              <TableCell align="right">{info.limits_MPa[t]?.join(' – ')}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Section>
  );
}

export default PredictorPage;
