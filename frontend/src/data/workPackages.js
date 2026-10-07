// Content of the "Work Packages" page.

export const WORK_PACKAGES = [
  { id: 'WP0', title: 'Data Collection', short: 'NDT data',
    text: 'Data collection of NDT inspection data.' },
  { id: 'WP1', title: 'Machine Learning', short: 'Process TSD/FWD',
    text: 'ML for processing NDT inspection data, including TSD/FWD data.' },
  { id: 'WP2', title: 'Digital Twin / TPIS Model Development', short: 'TPIS / DT',
    text: 'DT development using data from WP1, structural data such as layer thicknesses and material, PMSv4 maintenance history, climate data such as temperature and precipitation, and ERAPave (MLET), FEM and DEM. The TPIS model is developed and validated.' },
  { id: 'WP3', title: 'Iteration and Validation', short: 'Validation',
    text: 'Iteration of the obtained Digital Twin with data from WP0 until agreement is obtained. The process is repeated at different time intervals to estimate changes and evolution of structural conditions over time.' },
  { id: 'WP4', title: 'Decision-Making', short: 'Decision',
    text: 'Prediction of suitable timing of maintenance and type of maintenance treatment method, including optimization. Provides timing of repairs, recycling and reuse in alignment with circular economy principles.' },
];

export const AI_ROLE =
  'The AI model is developed as part of the structural modelling process to automatically estimate pavement ' +
  'layer moduli from TSD deflection basins and layer thicknesses (WP1), as input to the Digital Twin (WP2).';
