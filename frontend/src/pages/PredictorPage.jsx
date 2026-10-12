import { useEffect, useMemo, useState } from 'react';
import {
  Alert, Box, Button, Chip, CircularProgress, FormControl, InputLabel, MenuItem, Paper, Select, TextField, Typography,
  Table, TableBody, TableCell, TableHead, TableRow,
} from '@mui/material';

import { alpha } from '@mui/material/styles';

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
        title="🤖 ML Model — Predict Layer Moduli E1–E4"
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
            Loaded from the Backcalculation page: <strong>{example.label}</strong>
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
                      slotProps={{ htmlInput: { step: 'any' } }}
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

        {result && <Results result={result} />}

        {example?.erapave && <ErapaveCheck check={example.erapave} measured={example.inputs} predicted={result} />}
      </Section>

      {modelInfo && <ModelInfo info={modelInfo} />}
    </>
  );
}

// Allowed range per layer (MPa), same limits as the backcalculation; used to draw the range bar
const LAYER_LIMITS = { E1: [1500, 8000], E2: [100, 3000], E3: [50, 600], E4: [30, 400] };

// How precisely a layer is known, from the width of its range (high / low)
const PRECISION = [
  { max: 1.35, color: 'success', label: 'Well determined' },
  { max: 1.8, color: 'info', label: 'Fairly determined' },
  { max: Infinity, color: 'warning', label: 'Poorly determined' },
];

// Can this measurement be trusted? From the chance of unrealistic moduli for similar bowls.
const TRUST = [
  { max: 0.2, color: 'success', title: 'Trustworthy measurement', icon: '✓' },
  { max: 0.5, color: 'info', title: 'Use with some care', icon: '◐' },
  { max: 1.01, color: 'warning', title: 'Use with caution', icon: '⚠' },
];

const fmtMPa = (v) => Math.round(v).toLocaleString();

function Results({ result }) {
  const rel = result.reliability;
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

      {rel && <TrustBanner rel={rel} />}

      <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: 'repeat(4, 1fr)' } }}>
        {MODULI.map((m) => (
          <ModulusCard key={m.key} label={m.label} target={m.target} value={result[m.key]} range={rel?.ranges_MPa?.[m.target]} />
        ))}
      </Box>

      {rel && (
        <Typography variant="caption" color="text.secondary" component="p" sx={{ mt: 1.5 }}>
          <b>Expected range</b>: the true layer modulus falls inside this range for about {Math.round(rel.coverage * 100)}
          {' '}of 100 similar measurements. A narrow range means the deflection bowl pins the layer down well; a wide range
          means several values fit the bowl almost equally well. The bar shows the range within the allowed limits for the layer.
        </Typography>
      )}
    </Box>
  );
}

/** One layer: predicted value, highlighted expected range with a bar, and how precisely it is known. */
function ModulusCard({ label, target, value, range }) {
  const [lo, hi] = LAYER_LIMITS[target];
  const pos = (v) => `${(100 * (Math.log(v) - Math.log(lo))) / (Math.log(hi) - Math.log(lo))}%`;
  const precision = range ? PRECISION.find((p) => range[1] / range[0] <= p.max) : null;
  return (
    <Paper variant="outlined" sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 1 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 1 }}>
        <Typography variant="body2" color="text.secondary">{label}</Typography>
        {precision && <Chip size="small" variant="outlined" color={precision.color} label={precision.label} />}
      </Box>
      <Typography variant="h5">{fmtMPa(value)} MPa</Typography>

      {range && (
        <Box sx={{ p: 1.25, borderRadius: 2, bgcolor: (t) => alpha(t.palette[precision.color].main, 0.08) }}>
          <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: 700 }}>
            Expected range
          </Typography>
          <Typography sx={{ fontWeight: 800, color: `${precision.color}.main`, fontSize: '1.05rem' }}>
            {fmtMPa(range[0])} – {fmtMPa(range[1])} MPa
          </Typography>
          {/* range bar on a log scale between the allowed limits */}
          <Box sx={{ position: 'relative', height: 8, mt: 1, borderRadius: 4, bgcolor: 'divider' }}>
            <Box sx={{
              position: 'absolute', top: 0, bottom: 0, borderRadius: 4, bgcolor: `${precision.color}.main`, opacity: 0.55,
              left: pos(Math.max(range[0], lo)), right: `calc(100% - ${pos(Math.min(range[1], hi))})`,
            }} />
            <Box sx={{
              position: 'absolute', top: '50%', width: 12, height: 12, borderRadius: '50%', bgcolor: 'text.primary',
              border: '2px solid #fff', transform: 'translate(-50%, -50%)', left: pos(Math.min(Math.max(value, lo), hi)),
            }} />
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
            <Typography variant="caption" color="text.secondary">{fmtMPa(lo)}</Typography>
            <Typography variant="caption" color="text.secondary">{fmtMPa(hi)}</Typography>
          </Box>
        </Box>
      )}
    </Paper>
  );
}

/** Can this measurement be trusted? Plain-language explanation of the reliability check. */
function TrustBanner({ rel }) {
  const pct = Math.round(rel.p_unreliable * 100);
  const level = TRUST.find((l) => rel.p_unreliable < l.max);
  return (
    <Paper
      variant="outlined"
      sx={{ p: 2, mb: 2, borderLeft: 5, borderColor: `${level.color}.main`, bgcolor: (t) => alpha(t.palette[level.color].main, 0.06) }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
        <Typography sx={{ fontWeight: 800, color: `${level.color}.main` }}>{level.icon} {level.title}</Typography>
        <Chip size="small" color={level.color} label={`${pct}% risk`} />
      </Box>
      <Typography variant="body2" sx={{ mt: 0.75 }}>
        Of earlier measurements with a similar deflection bowl, <b>{pct} in 100</b> could only be explained with
        unrealistic layer stiffness (outside the normal range for asphalt, base or soil).
        {level.color === 'success' && ' This bowl looks like a normal road, so the values below are meaningful.'}
        {level.color === 'info' && ' Look at the expected ranges before using the values.'}
        {level.color === 'warning' && ' Something may be unusual here (e.g. wrong layer thickness or a damaged layer); check before using the values.'}
      </Typography>
    </Paper>
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
