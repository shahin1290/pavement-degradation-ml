// Content of the "Objective & Key Picture" page.
// Each stage is a list of steps. A step is either a box, or { row: [box, box] }
// for boxes side by side. `arrow` is the label on the arrow above a step.
// icon: name of an icon in pages/ObjectivePage.jsx; tone: blue | orange | green | purple | teal

export const OBJECTIVE = {
  title: 'Develop a data-driven pavement structural Digital Twin',
  text:
    'The project combines measured TSD deflection basins, pavement structure, ERAPave backcalculation and ' +
    'machine learning to estimate pavement layer stiffness. These results are used to establish and update a ' +
    'Digital Twin that represents the current structural condition of the pavement and supports future ' +
    'structural-response prediction and maintenance decisions.',
};

export const STAGES = [
  {
    title: 'Back-Calculation — Establish Structural State',
    subtitle: 'Use measured pavement response to determine layer stiffness through iterative ERAPave calculations.',
    steps: [
      {
        icon: 'input', title: 'Known Field Inputs', tone: 'blue',
        items: [
          'h₁, h₂, h₃ — layer thicknesses',
          'Load: 100 kN axle, 800 kPa',
          'Poisson ratios',
          'Measured deflection basin D0–D1500',
        ],
      },
      {
        arrow: 'Initial trial E₁, E₂, E₃, E₄',
        icon: 'calculate', title: 'ERAPave — Forward Calculation', tone: 'blue',
        text: 'ERAPave receives the pavement geometry, loading conditions and trial layer moduli.',
        highlight: 'E₁, E₂, E₃, E₄ → calculated deflections D0–D1500',
      },
      {
        arrow: 'Compare',
        icon: 'compare', title: 'Compare Calculated vs Measured Basin', tone: 'orange',
        text: 'The fit is measured as the RMS difference over all 9 deflection points.',
      },
      {
        arrow: 'If the error is too large → adjust E₁, E₂, E₃, E₄',
        icon: 'check', title: 'Converged Structural State', tone: 'green',
        text: 'Iterate until the calculated basin agrees with the measured TSD basin within the selected tolerance.',
        highlight: 'E₁, E₂, E₃, E₄ → backcalculated structural dataset',
      },
    ],
  },
  {
    title: 'TPIS / Machine Learning Model Development',
    subtitle: 'Learn the relationship between field observations and the layer moduli obtained from backcalculation.',
    steps: [
      {
        icon: 'model', title: 'Training Dataset', tone: 'purple',
        text: 'Deflection basins and layer thicknesses are combined with the E₁–E₄ values obtained in Stage 1.',
        highlight: 'X = 9 deflections + 3 thicknesses   ·   Y = E₁, E₂, E₃, E₄',
      },
      {
        arrow: 'Train',
        icon: 'model', title: 'Trained TPIS / ML Model', tone: 'purple',
        text: 'The model estimates layer moduli directly from field data, avoiding a full ERAPave backcalculation for every new section.',
        highlight: 'New TSD data → ML → estimated E₁, E₂, E₃, E₄',
      },
    ],
  },
  {
    title: 'Digital Twin — State Initialization and Updating',
    subtitle: 'Represent the physical pavement digitally and update its structural state when new field observations become available.',
    maxWidth: 900,
    steps: [
      {
        icon: 'memory', title: 'Digital Twin — Initial Structural State', tone: 'teal',
        text: 'The Digital Twin is initialized with moduli from Stage 1 and/or estimates from the trained ML model in Stage 2.',
        highlight: 'Digital Twin state = geometry + E₁–E₄ + conditions',
      },
      {
        arrow: 'New survey / new TSD observation',
        icon: 'timeline', title: 'New Field Observation', tone: 'blue',
        text: 'A later TSD survey provides a new measured deflection basin, together with updated pavement and environmental information.',
      },
      {
        arrow: 'Update the Digital Twin',
        row: [
          {
            icon: 'calculate', title: 'Option A — ERAPave Iterative Updating', tone: 'orange',
            text: 'Use the previous Digital Twin state (or the ML estimate) as starting moduli, run ERAPave, compare with the new TSD basin and adjust E₁–E₄.',
            highlight: 'New TSD → ERAPave → adjust E₁–E₄ → agreement',
          },
          {
            icon: 'model', title: 'Option B — ML-Based DT Updating', tone: 'purple',
            text: 'Use the trained ML model to estimate the new structural state directly from the new field data.',
            highlight: 'New TSD → ML → new E₁–E₄ → update DT',
          },
        ],
      },
      {
        arrow: 'Updated structural state',
        icon: 'memory', title: 'Updated Digital Twin', tone: 'teal',
        text: 'The Digital Twin now represents the latest estimated structural condition of the physical pavement.',
        highlight: 'Updated E₁–E₄ + pavement state + environmental conditions',
      },
    ],
  },
  {
    title: 'Future Prediction and Decision Support',
    subtitle: 'Use the updated Digital Twin to understand future structural behaviour and support maintenance planning.',
    steps: [
      {
        icon: 'trend', title: 'Forward Prediction', tone: 'blue',
        text: 'The updated Digital Twin can be evaluated under future traffic, temperature and environmental scenarios to estimate future structural response.',
        highlight: 'Updated DT + future conditions → predicted response',
      },
      {
        arrow: 'Evaluate deterioration / condition',
        icon: 'check', title: 'Maintenance & Decision Support', tone: 'green',
        text: 'Predicted structural response and deterioration trends support identification of sections that may need investigation, maintenance or rehabilitation.',
      },
    ],
  },
];

export const OVERALL_LOGIC = [
  'Field Data', 'ERAPave Back-Calculation', 'E₁–E₄ Dataset', 'TPIS / ML',
  'Digital Twin', 'DT Updating', 'Future Prediction', 'Maintenance Decision',
];
