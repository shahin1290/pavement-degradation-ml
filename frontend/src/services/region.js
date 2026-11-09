import { createContext, useContext } from 'react';

// Regions shown on the Backcalculation page. Each region's result files are in frontend/public/results/<dir>
// (Östergötland: made by make_results_data.py; Västergötland: by make_results_vg.py, soil_effect.py, strain_analysis.py).
export const REGIONS = [
  {
    id: 'og',
    name: 'Östergötland',
    dir: '',
    C0: '2.45E-05',
    A: '−8.24E-08',
    intro: 'Östergötland TSD data (7,047 locations × 4 surveys, Aug 2022 – Sep 2024).',
  },
  {
    id: 'vg',
    name: 'Västergötland',
    dir: 'vg/',
    C0: '3.12E-05',
    A: '−1.01E-07',
    intro: 'Västergötland TSD data (9,078 locations × 4 surveys, Aug 2022 – Sep 2024), backcalculated with the same method '
      + 'and its own temperature correction.',
  },
];

export const RegionContext = createContext(REGIONS[0]);

/** The region selected on the Backcalculation page (Östergötland outside it). */
export const useRegion = () => useContext(RegionContext);
