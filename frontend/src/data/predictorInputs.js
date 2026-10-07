// Every input the predictor form knows about.
// The form only shows the inputs the trained model actually uses
// (from GET /api/model-info). To support a new model input, add it here.

export const INPUT_DEFINITIONS = {
  D0:     { label: 'D0',    unit: 'µm', group: 'deflections' },
  D130:   { label: 'D130',  unit: 'µm', group: 'deflections' },
  D215:   { label: 'D215',  unit: 'µm', group: 'deflections' },
  D300:   { label: 'D300',  unit: 'µm', group: 'deflections' },
  D450:   { label: 'D450',  unit: 'µm', group: 'deflections' },
  D600:   { label: 'D600',  unit: 'µm', group: 'deflections' },
  D900:   { label: 'D900',  unit: 'µm', group: 'deflections' },
  D1200:  { label: 'D1200', unit: 'µm', group: 'deflections' },
  D1500:  { label: 'D1500', unit: 'µm', group: 'deflections' },

  thk1_mm: { label: 'Layer 1 (asphalt)', unit: 'mm', group: 'thicknesses' },
  thk2_mm: { label: 'Layer 2 (base)',    unit: 'mm', group: 'thicknesses' },
  thk3_mm: { label: 'Layer 3 (subbase)', unit: 'mm', group: 'thicknesses' },

  // Optional inputs: shown only if the model was trained with them
  survey:         { label: 'Survey (1-4)',         unit: '',     group: 'other' },
  asphalt_temp_C: { label: 'Pavement temperature', unit: '°C',   group: 'other' },
  speed_kmh:      { label: 'Survey speed',         unit: 'km/h', group: 'other' },
};

export const INPUT_GROUPS = [
  { id: 'deflections', title: 'TSD deflection basin', note: 'Positive values in micrometres, at 0-1500 mm from the load.' },
  { id: 'thicknesses', title: 'Layer thicknesses',    note: 'Millimetres (data file values in metres × 1000).' },
  { id: 'other',       title: 'Other inputs',         note: '' },
];

// Used if the backend cannot report its inputs
export const CORE_INPUTS = [
  'D0', 'D130', 'D215', 'D300', 'D450', 'D600', 'D900', 'D1200', 'D1500',
  'thk1_mm', 'thk2_mm', 'thk3_mm',
];

// Response fields of POST /api/predict
export const MODULI = [
  { key: 'E1_Asphalt_MPa',  target: 'E1', label: 'E1 — Asphalt' },
  { key: 'E2_Base_MPa',     target: 'E2', label: 'E2 — Base' },
  { key: 'E3_Subbase_MPa',  target: 'E3', label: 'E3 — Subbase' },
  { key: 'E4_Subgrade_MPa', target: 'E4', label: 'E4 — Subgrade' },
];
