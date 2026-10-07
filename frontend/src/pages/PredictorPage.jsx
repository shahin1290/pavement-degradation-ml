import { useEffect, useMemo, useState } from 'react';
import {
  Alert, Box, Button, Chip, CircularProgress, Paper, Stack, TextField, Typography,
  Table, TableBody, TableCell, TableHead, TableRow,
} from '@mui/material';

import Section from '../components/Section';
import { predictModuli, getModelInfo } from '../services/api';
import { INPUT_DEFINITIONS, INPUT_GROUPS, CORE_INPUTS, MODULI } from '../data/predictorInputs';
import { EXAMPLE_CASES } from '../data/exampleCases';

const toFormValues = (inputs) =>
  Object.fromEntries(Object.entries(inputs).map(([k, v]) => [k, String(v)]));

function PredictorPage() {
  const [modelInfo, setModelInfo] = useState(null);
  const [example, setExample] = useState(EXAMPLE_CASES[0]);
  const [values, setValues] = useState(toFormValues(EXAMPLE_CASES[0].inputs));
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Ask the backend which inputs the current model needs
  useEffect(() => {
    getModelInfo().then(setModelInfo).catch(() => setModelInfo(null));
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
        <Stack direction="row" spacing={1} sx={{ mb: 2, flexWrap: 'wrap', gap: 1 }}>
          <Typography variant="body2" sx={{ alignSelf: 'center', mr: 1 }}>
            Load example:
          </Typography>
          {EXAMPLE_CASES.map((ex) => (
            <Chip
              key={ex.id}
              label={ex.label}
              onClick={() => loadExample(ex)}
              color={example?.id === ex.id ? 'primary' : 'default'}
              variant={example?.id === ex.id ? 'filled' : 'outlined'}
            />
          ))}
          <Chip label="Clear" onClick={clearForm} variant="outlined" />
        </Stack>

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
