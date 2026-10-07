// Holdout cases: never used for training or testing the model.
// `backcalc` = moduli from the 4-layer backcalculation, shown for comparison.

export const EXAMPLE_CASES = [
  {
    id: 'row1876_s1',
    label: 'Row 1876, survey 1 (good case)',
    inputs: {
      D0: 549.6, D130: 476.67, D215: 397.28, D300: 336.94, D450: 257.12,
      D600: 191.62, D900: 116.54, D1200: 84.53, D1500: 60.83,
      thk1_mm: 176.32, thk2_mm: 320.07, thk3_mm: 717.58,
    },
    backcalc: { E1: 1697, E2: 131, E3: 108, E4: 152 },
  },
  {
    id: 'row1028_s2',
    label: 'Row 1028, survey 2',
    inputs: {
      D0: 569.14, D130: 499.7, D215: 431.45, D300: 378.0, D450: 301.56,
      D600: 247.88, D900: 200.55, D1200: 180.25, D1500: 151.59,
      thk1_mm: 165.43, thk2_mm: 252.85, thk3_mm: 932.77,
    },
    backcalc: { E1: 1912, E2: 138, E3: 259, E4: 48 },
  },
  {
    id: 'row541_s3',
    label: 'Row 541, survey 3 (weak case)',
    inputs: {
      D0: 358.89, D130: 304.44, D215: 253.53, D300: 214.62, D450: 156.47,
      D600: 115.07, D900: 79.53, D1200: 67.67, D1500: 55.12,
      thk1_mm: 159.58, thk2_mm: 356.05, thk3_mm: 753.74,
    },
    backcalc: { E1: 2830, E2: 169, E3: 498, E4: 148 },
  },
];
