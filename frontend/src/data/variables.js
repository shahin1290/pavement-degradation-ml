// Content of the "Variable Definitions" page.
// Edit text here; the page layout is in pages/VariablesPage.jsx.
//
// role: 'core'     = input of the current ML model
//       'optional' = input that can be tested (ACTIVE_FEATURE_GROUPS in ml/config.py)
//       'context'  = not a model input; used for analysis / Digital Twin
//       'unused'   = duplicate of, or derived from, other inputs
//       'target'   = model output

export const ROLES = {
  core:     { label: 'Model input',          color: 'primary' },
  optional: { label: 'Optional input',       color: 'info' },
  context:  { label: 'Analysis / DT',        color: 'default' },
  unused:   { label: 'Not used (derived)',   color: 'warning' },
  target:   { label: 'Target',               color: 'success' },
};

export const VARIABLE_GROUPS = [
  {
    title: 'TSD deflection basin (structural response)',
    items: [
      { code: 'Medelförtsd_1..4_D00001 … D1500', text: 'Deflections at 0, 130, 215, 300, 450, 600, 900, 1200 and 1500 mm from the load (µm). The full basin is the main input of the model.', role: 'core' },
      { code: 'Medelförtsd_1..4_D0000', text: 'Central deflection; identical to D00001.', role: 'unused' },
      { code: 'Medelförtsd_1..4_SCI_300', text: 'Surface Curvature Index, D0 − D300.', role: 'unused' },
      { code: 'tsd1..4_SCI_sub', text: 'Lower-structure index, D900 − D1500.', role: 'unused' },
      { code: 'Medelförtsd1..4_SCI300_norm', text: 'Normalised SCI300.', role: 'unused' },
    ],
  },
  {
    title: 'Pavement geometry',
    items: [
      { code: 'Medelförmst_Layer_1_thk', text: 'Thickness of layer 1, asphalt (m in the data, mm in the model).', role: 'core' },
      { code: 'Medelförmst_Layer_2_thk', text: 'Thickness of layer 2, base.', role: 'core' },
      { code: 'Medelförmst_Layer_3_thk', text: 'Thickness of layer 3, subbase. Below it: infinite subgrade.', role: 'core' },
    ],
  },
  {
    title: 'Measurement conditions',
    items: [
      { code: 'Medelförtsd_1..4_BELLS_TEMP', text: 'Pavement temperature during the TSD survey (°C).', role: 'optional' },
      { code: 'Medelförtsd_1..4_SPEED', text: 'TSD survey speed (km/h).', role: 'optional' },
      { code: 'Survey number (1-4)', text: '1 = Aug 2022, 2 = Sep 2023, 3 = May 2024, 4 = Sep 2024.', role: 'optional' },
    ],
  },
  {
    title: 'Environment, moisture and soil',
    items: [
      { code: 'Medelförtsd_1..4_PCIP_14_DAYS', text: 'Precipitation during the 14 days before the survey (mm).', role: 'context' },
      { code: 'Förstaförsoil_JG2 / _GJ2_tx', text: 'Soil / subgrade classification (code and text).', role: 'context' },
      { code: 'Medelförghum_max', text: 'Humidity / moisture-related variable.', role: 'context' },
      { code: 'Medelförmst_ditch_depth_10', text: 'Ditch / drainage depth.', role: 'context' },
    ],
  },
  {
    title: 'Traffic and condition',
    items: [
      { code: 'Medelförpmsv4_AADT', text: 'Average Annual Daily Traffic.', role: 'context' },
      { code: 'Medelförpmsv4_TAADT', text: 'Heavy-vehicle AADT.', role: 'context' },
      { code: 'Medelförtsd_1..4_ACD_PERCENT_WP_CELLS_CRACKED', text: 'Share of wheel-path cells with cracking (%).', role: 'context' },
      { code: 'Spårdjup / Spårdjup max', text: 'Rut depth and maximum rut depth (PMSv4).', role: 'context' },
    ],
  },
  {
    title: 'Other model outputs in the data',
    items: [
      { code: 'Medelförstrain1..4_left/right_norm', text: 'Normalised structural strains. Origin to be confirmed; not used as input.', role: 'unused' },
    ],
  },
  {
    title: 'Layer moduli — targets of the ML model',
    items: [
      { code: 'E1 (E_AC)', text: 'Asphalt layer modulus, MPa (limits 1,500-8,000).', role: 'target' },
      { code: 'E2 (E_base / MR2)', text: 'Base layer modulus, MPa (limits 100-3,000).', role: 'target' },
      { code: 'E3 (E_subbase / MR3)', text: 'Subbase layer modulus, MPa (limits 50-600).', role: 'target' },
      { code: 'E4 (E_subgrade / MR4)', text: 'Subgrade modulus, MPa (limits 30-400).', role: 'target' },
    ],
  },
];

export const BACKCALC_SETTINGS =
  '4 layers (asphalt, base, subbase, infinite subgrade), bounded moduli. ERAPave: single axle / single wheel, ' +
  'axle load 100 kN, contact pressure 800 kPa. Poisson 0.35 / 0.35 / 0.35 / 0.40.';
