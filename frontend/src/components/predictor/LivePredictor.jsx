import React, { useState } from 'react';
import { predictModuli } from '../../services/api';

import {
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Alert,
  CircularProgress,
  Divider
} from '@mui/material';

function LivePredictor() {
  const [formData, setFormData] = useState({
    h1_cm: 18.75,
    h2_cm: 33.0,
    h3_cm: 70.72,
    bells_temp: 20.81,
    d0_target: 298.02,
    sci300_target: 104.92
  });

  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /*
   * Training / converged data
   *
   * IMPORTANT:
   * This table does NOT use the status column.
   * All rows listed here are your converged cases.
   */
  const convergedData = [
    {
      original_row_index: 0,
      Nyckel: '5V4D76180',
      h1_cm: 8.19,
      h2_cm: 11.24,
      h3_cm: 99.13,
      bells_temp: 29.28,
      d0_target: 418.99,
      sci300_target: 187.93,
      E1_MPa: 1742.56,
      E2_MPa: 273.88,
      E3_MPa: 110.06,
      E4_MPa: 33.21,
      d0_calc: 415.5,
      sci300_calc: 189.3,
      error_pct: 0.78
    },
    {
      original_row_index: 1,
      Nyckel: '5V4D76200',
      h1_cm: 8.13,
      h2_cm: 13.44,
      h3_cm: 100.3,
      bells_temp: 29.59,
      d0_target: 446.26,
      sci300_target: 178.81,
      E1_MPa: 1737,
      E2_MPa: 276,
      E3_MPa: 115,
      E4_MPa: 30,
      d0_calc: 446.9,
      sci300_calc: 178.9,
      error_pct: 0.1
    },
    {
      original_row_index: 2,
      Nyckel: '5V4D76460',
      h1_cm: 7.74,
      h2_cm: 21.38,
      h3_cm: 112.58,
      bells_temp: 28.25,
      d0_target: 346.75,
      sci300_target: 139.89,
      E1_MPa: 4000,
      E2_MPa: 370,
      E3_MPa: 143,
      E4_MPa: 48,
      d0_calc: 345.5,
      sci300_calc: 140.1,
      error_pct: 0.26
    },
    {
      original_row_index: 3,
      Nyckel: '5V4D76500',
      h1_cm: 8.54,
      h2_cm: 18.99,
      h3_cm: 112.08,
      bells_temp: 26.05,
      d0_target: 365.76,
      sci300_target: 115.06,
      E1_MPa: 4800,
      E2_MPa: 410,
      E3_MPa: 140,
      E4_MPa: 30,
      d0_calc: 365.9,
      sci300_calc: 115.6,
      error_pct: 0.26
    },
    {
      original_row_index: 4,
      Nyckel: '5V4D76520',
      h1_cm: 8.46,
      h2_cm: 19.8,
      h3_cm: 111.93,
      bells_temp: 28.02,
      d0_target: 423.86,
      sci300_target: 135.84,
      E1_MPa: 4200,
      E2_MPa: 330,
      E3_MPa: 130,
      E4_MPa: 25,
      d0_calc: 421.8,
      sci300_calc: 136.0,
      error_pct: 0.3
    },
    {
      original_row_index: 5,
      Nyckel: '5V4D76540',
      h1_cm: 7.81,
      h2_cm: 18.94,
      h3_cm: 111.82,
      bells_temp: 28.48,
      d0_target: 422.18,
      sci300_target: 159.76,
      E1_MPa: 3500,
      E2_MPa: 322,
      E3_MPa: 135,
      E4_MPa: 32,
      d0_calc: 420.4,
      sci300_calc: 160.8,
      error_pct: 0.54
    },
    {
      original_row_index: 6,
      Nyckel: '5V4D76580',
      h1_cm: 8.25,
      h2_cm: 18.15,
      h3_cm: 110.84,
      bells_temp: 28.54,
      d0_target: 465.42,
      sci300_target: 147.96,
      E1_MPa: 3800,
      E2_MPa: 340,
      E3_MPa: 120,
      E4_MPa: 22,
      d0_calc: 468.1,
      sci300_calc: 148.3,
      error_pct: 0.4
    },
    {
      original_row_index: 7,
      Nyckel: '5V4D76600',
      h1_cm: 8.18,
      h2_cm: 17.15,
      h3_cm: 104.28,
      bells_temp: 28.46,
      d0_target: 375.12,
      sci300_target: 138.16,
      E1_MPa: 4000,
      E2_MPa: 360,
      E3_MPa: 150,
      E4_MPa: 38,
      d0_calc: 372.8,
      sci300_calc: 138.6,
      error_pct: 0.47
    },
    {
      original_row_index: 8,
      Nyckel: '5V4D76620',
      h1_cm: 7.78,
      h2_cm: 18.25,
      h3_cm: 102.55,
      bells_temp: 28.54,
      d0_target: 405.48,
      sci300_target: 138.46,
      E1_MPa: 4300,
      E2_MPa: 390,
      E3_MPa: 134,
      E4_MPa: 30,
      d0_calc: 407.8,
      sci300_calc: 138.5,
      error_pct: 0.3
    },
    {
      original_row_index: 9,
      Nyckel: '5V4D76640',
      h1_cm: 7.61,
      h2_cm: 16.89,
      h3_cm: 103.83,
      bells_temp: 28.63,
      d0_target: 402.83,
      sci300_target: 154.89,
      E1_MPa: 3800,
      E2_MPa: 360,
      E3_MPa: 140,
      E4_MPa: 37,
      d0_calc: 402.0,
      sci300_calc: 154.7,
      error_pct: 0.16
    },

    // Row 48
    {
      original_row_index: 48,
      Nyckel: '5V4D77460',
      h1_cm: 9.62,
      h2_cm: 19.16,
      h3_cm: 102.94,
      bells_temp: 28.07,
      d0_target: 525.50,
      sci300_target: 181.06,
      E1_MPa: 1840,
      E2_MPa: 270,
      E3_MPa: 165,
      E4_MPa: 16,
      d0_calc: 527.10,
      sci300_calc: 180.60,
      error_pct: 0.31
    },
    {
      original_row_index: 49,
      Nyckel: '5V4D77480',
      h1_cm: 9.62,
      h2_cm: 18.37,
      h3_cm: 102.47,
      bells_temp: 28.04,
      d0_target: 527.04,
      sci300_target: 186.83,
      E1_MPa: 1900,
      E2_MPa: 250,
      E3_MPa: 140,
      E4_MPa: 20,
      d0_calc: 523.5,
      sci300_calc: 188.2,
      error_pct: 0.7
    },
    {
      original_row_index: 50,
      Nyckel: '5V4D77500',
      h1_cm: 10.31,
      h2_cm: 17.84,
      h3_cm: 103.47,
      bells_temp: 27.86,
      d0_target: 515.04,
      sci300_target: 180.74,
      E1_MPa: 1900,
      E2_MPa: 240,
      E3_MPa: 135,
      E4_MPa: 20,
      d0_calc: 519.1,
      sci300_calc: 180.3,
      error_pct: 0.52
    },

    // Row 55
    {
      original_row_index: 55,
      Nyckel: '5V4D77600',
      h1_cm: 10.96,
      h2_cm: 19.44,
      h3_cm: 107.15,
      bells_temp: 27.77,
      d0_target: 401.745,
      sci300_target: 149.58,
      E1_MPa: 2330,
      E2_MPa: 250,
      E3_MPa: 130,
      E4_MPa: 37,
      d0_calc: 400.90,
      sci300_calc: 149.50,
      error_pct: 0.21
    },
    {
      original_row_index: 56,
      Nyckel: '5V4D77620',
      h1_cm: 10.83,
      h2_cm: 20.89,
      h3_cm: 108.02,
      bells_temp: 27.73,
      d0_target: 343.83,
      sci300_target: 121.69,
      E1_MPa: 3000,
      E2_MPa: 300,
      E3_MPa: 142,
      E4_MPa: 40,
      d0_calc: 346.5,
      sci300_calc: 122.4,
      error_pct: 0.68
    },
    {
      original_row_index: 57,
      Nyckel: '5V4D77640',
      h1_cm: 11.06,
      h2_cm: 22.9,
      h3_cm: 108.03,
      bells_temp: 27.68,
      d0_target: 322.37,
      sci300_target: 113.11,
      E1_MPa: 3200,
      E2_MPa: 305,
      E3_MPa: 145,
      E4_MPa: 44,
      d0_calc: 322.3,
      sci300_calc: 113.5,
      error_pct: 0.18
    },
    {
      original_row_index: 58,
      Nyckel: '5V4D77660',
      h1_cm: 11.25,
      h2_cm: 22.86,
      h3_cm: 108.02,
      bells_temp: 27.68,
      d0_target: 348.88,
      sci300_target: 116.9,
      E1_MPa: 3000,
      E2_MPa: 300,
      E3_MPa: 140,
      E4_MPa: 35,
      d0_calc: 349.8,
      sci300_calc: 116.6,
      error_pct: 0.26
    },

    // Row 153
    {
      original_row_index: 153,
      Nyckel: '5V4D79560',
      h1_cm: 16.50,
      h2_cm: 30.56,
      h3_cm: 103.04,
      bells_temp: 26.69,
      d0_target: 443.59,
      sci300_target: 147.34,
      E1_MPa: 1200,
      E2_MPa: 250,
      E3_MPa: 130,
      E4_MPa: 20,
      d0_calc: 445.40,
      sci300_calc: 147.40,
      error_pct: 0.41
    },
    {
      original_row_index: 154,
      Nyckel: '5V4D79580',
      h1_cm: 15.34,
      h2_cm: 24.14,
      h3_cm: 103.53,
      bells_temp: 26.84,
      d0_target: 402.85,
      sci300_target: 141.68,
      E1_MPa: 1400,
      E2_MPa: 250,
      E3_MPa: 140,
      E4_MPa: 28,
      d0_calc: 401.7,
      sci300_calc: 141.6,
      error_pct: 0.17
    },
    {
      original_row_index: 155,
      Nyckel: '5V4D79600',
      h1_cm: 13.48,
      h2_cm: 24.84,
      h3_cm: 103.92,
      bells_temp: 27.1,
      d0_target: 395.9,
      sci300_target: 148.39,
      E1_MPa: 1500,
      E2_MPa: 258,
      E3_MPa: 142,
      E4_MPa: 32,
      d0_calc: 395.5,
      sci300_calc: 149.2,
      error_pct: 0.32
    },

    // Row 358
    {
      original_row_index: 358,
      Nyckel: '5V32D960',
      h1_cm: 20.64,
      h2_cm: 31.69,
      h3_cm: 82.65,
      bells_temp: 20.46,
      d0_target: 615.065,
      sci300_target: 161.48,
      E1_MPa: 900,
      E2_MPa: 250,
      E3_MPa: 130,
      E4_MPa: 10,
      d0_calc: 606.50,
      sci300_calc: 160.80,
      error_pct: 1.39
    },
    {
      original_row_index: 359,
      Nyckel: '5V32D980',
      h1_cm: 22.32,
      h2_cm: 33.46,
      h3_cm: 58.41,
      bells_temp: 20.37,
      d0_target: 661.04,
      sci300_target: 189.28,
      E1_MPa: 850,
      E2_MPa: 100,
      E3_MPa: 80,
      E4_MPa: 17,
      d0_calc: 655.8,
      sci300_calc: 190.1,
      error_pct: 0.61
    },
    {
      original_row_index: 360,
      Nyckel: '5V32D1000',
      h1_cm: 23.65,
      h2_cm: 36.75,
      h3_cm: 55.09,
      bells_temp: 20.26,
      d0_target: 562.62,
      sci300_target: 188.71,
      E1_MPa: 830,
      E2_MPa: 90,
      E3_MPa: 80,
      E4_MPa: 26,
      d0_calc: 564.7,
      sci300_calc: 187.8,
      error_pct: 0.43
    },

    // Row 451
    {
      original_row_index: 451,
      Nyckel: '5V32D2820',
      h1_cm: 20.75,
      h2_cm: 36.36,
      h3_cm: 77.41,
      bells_temp: 20.69,
      d0_target: 500.84,
      sci300_target: 160.595,
      E1_MPa: 880,
      E2_MPa: 250,
      E3_MPa: 130,
      E4_MPa: 16.5,
      d0_calc: 497.90,
      sci300_calc: 160.60,
      error_pct: 0.59
    },
    {
      original_row_index: 452,
      Nyckel: '5V32D2840',
      h1_cm: 20.17,
      h2_cm: 38.83,
      h3_cm: 76.28,
      bells_temp: 20.69,
      d0_target: 468.64,
      sci300_target: 165.56,
      E1_MPa: 900,
      E2_MPa: 210,
      E3_MPa: 126,
      E4_MPa: 22,
      d0_calc: 465.5,
      sci300_calc: 165.1,
      error_pct: 0.47
    },
    {
      original_row_index: 453,
      Nyckel: '5V32D2860',
      h1_cm: 18.99,
      h2_cm: 36.87,
      h3_cm: 71.96,
      bells_temp: 20.65,
      d0_target: 458.86,
      sci300_target: 164.37,
      E1_MPa: 1000,
      E2_MPa: 182,
      E3_MPa: 127,
      E4_MPa: 25,
      d0_calc: 462.9,
      sci300_calc: 163.6,
      error_pct: 0.67
    },

    // Row 602
    {
      original_row_index: 602,
      Nyckel: '5V32D5840',
      h1_cm: 15.96,
      h2_cm: 35.60,
      h3_cm: 75.37,
      bells_temp: 20.94,
      d0_target: 460.695,
      sci300_target: 171.695,
      E1_MPa: 970,
      E2_MPa: 250,
      E3_MPa: 130,
      E4_MPa: 25.5,
      d0_calc: 458.20,
      sci300_calc: 172.10,
      error_pct: 0.54
    },
    {
      original_row_index: 603,
      Nyckel: '5V32D5860',
      h1_cm: 14.75,
      h2_cm: 32.5,
      h3_cm: 75.79,
      bells_temp: 20.88,
      d0_target: 486.83,
      sci300_target: 144.34,
      E1_MPa: 1350,
      E2_MPa: 290,
      E3_MPa: 95,
      E4_MPa: 21,
      d0_calc: 483.4,
      sci300_calc: 144.0,
      error_pct: 0.47
    },
    {
      original_row_index: 604,
      Nyckel: '5V32D5880',
      h1_cm: 10.04,
      h2_cm: 32.54,
      h3_cm: 75.85,
      bells_temp: 21.23,
      d0_target: 407.26,
      sci300_target: 127.6,
      E1_MPa: 2800,
      E2_MPa: 330,
      E3_MPa: 120,
      E4_MPa: 28,
      d0_calc: 404.3,
      sci300_calc: 128.2,
      error_pct: 0.6
    },

    // Row 712
    {
      original_row_index: 712,
      Nyckel: '5V32D8260',
      h1_cm: 15.78,
      h2_cm: 28.54,
      h3_cm: 74.61,
      bells_temp: 21.14,
      d0_target: 330.625,
      sci300_target: 102.32,
      E1_MPa: 2200,
      E2_MPa: 250,
      E3_MPa: 130,
      E4_MPa: 42,
      d0_calc: 327.90,
      sci300_calc: 102.80,
      error_pct: 0.82
    },
    {
      original_row_index: 713,
      Nyckel: '5V32D8280',
      h1_cm: 15.01,
      h2_cm: 25.83,
      h3_cm: 72.73,
      bells_temp: 21.24,
      d0_target: 295.21,
      sci300_target: 95.12,
      E1_MPa: 2600,
      E2_MPa: 265,
      E3_MPa: 140,
      E4_MPa: 55,
      d0_calc: 292.9,
      sci300_calc: 95.5,
      error_pct: 0.59
    },
    {
      original_row_index: 714,
      Nyckel: '5V32D8300',
      h1_cm: 14.39,
      h2_cm: 27.27,
      h3_cm: 69.88,
      bells_temp: 21.24,
      d0_target: 320.03,
      sci300_target: 97.6,
      E1_MPa: 2700,
      E2_MPa: 270,
      E3_MPa: 118,
      E4_MPa: 48,
      d0_calc: 319.5,
      sci300_calc: 98.2,
      error_pct: 0.39
    },

    // Row 800
    {
      original_row_index: 800,
      Nyckel: '5V32D10020',
      h1_cm: 11.8522,
      h2_cm: 27.1403,
      h3_cm: 116.4918,
      bells_temp: 21.06,
      d0_target: 340.875,
      sci300_target: 87.94,
      E1_MPa: 3800,
      E2_MPa: 350,
      E3_MPa: 180,
      E4_MPa: 20,
      d0_calc: 336.6,
      sci300_calc: 88.9,
      error_pct: 1.25
    },
    {
      original_row_index: 801,
      Nyckel: '5V32D10040',
      h1_cm: 11.72,
      h2_cm: 23.04,
      h3_cm: 118.2,
      bells_temp: 21.06,
      d0_target: 308.97,
      sci300_target: 79.72,
      E1_MPa: 4600,
      E2_MPa: 380,
      E3_MPa: 175,
      E4_MPa: 25,
      d0_calc: 306.6,
      sci300_calc: 79.8,
      error_pct: 0.43
    },
    {
      original_row_index: 802,
      Nyckel: '5V32D10060',
      h1_cm: 11.36,
      h2_cm: 25.0,
      h3_cm: 120.22,
      bells_temp: 21.06,
      d0_target: 256.8,
      sci300_target: 79.28,
      E1_MPa: 4800,
      E2_MPa: 385,
      E3_MPa: 180,
      E4_MPa: 41,
      d0_calc: 257.3,
      sci300_calc: 79.1,
      error_pct: 0.21
    },

    // Row 1004
    {
      original_row_index: 1004,
      Nyckel: '5V32D14100',
      h1_cm: 15.2937,
      h2_cm: 31.1902,
      h3_cm: 99.2357,
      bells_temp: 21.4591,
      d0_target: 548.77,
      sci300_target: 175.34,
      E1_MPa: 1400,
      E2_MPa: 130,
      E3_MPa: 100,
      E4_MPa: 20,
      d0_calc: 540.3,
      sci300_calc: 172.5,
      error_pct: 1.54
    },
    {
      original_row_index: 1005,
      Nyckel: '5V32D14120',
      h1_cm: 16.16,
      h2_cm: 30.36,
      h3_cm: 101.38,
      bells_temp: 21.31,
      d0_target: 491.54,
      sci300_target: 165.7,
      E1_MPa: 1400,
      E2_MPa: 124,
      E3_MPa: 95,
      E4_MPa: 27,
      d0_calc: 492.5,
      sci300_calc: 164.9,
      error_pct: 0.34
    },
    {
      original_row_index: 1006,
      Nyckel: '5V32D14140',
      h1_cm: 14.56,
      h2_cm: 30.09,
      h3_cm: 105.12,
      bells_temp: 21.41,
      d0_target: 533.27,
      sci300_target: 181.86,
      E1_MPa: 1420,
      E2_MPa: 125,
      E3_MPa: 95,
      E4_MPa: 24,
      d0_calc: 532.1,
      sci300_calc: 182.7,
      error_pct: 0.34
    },

    // Row 1098
    {
      original_row_index: 1098,
      Nyckel: '5V32D15980',
      h1_cm: 13.8151,
      h2_cm: 31.6319,
      h3_cm: 97.8646,
      bells_temp: 21.1904,
      d0_target: 466.625,
      sci300_target: 169.45,
      E1_MPa: 870,
      E2_MPa: 400,
      E3_MPa: 128,
      E4_MPa: 20,
      d0_calc: 467.2,
      sci300_calc: 171.2,
      error_pct: 0.12
    },

    // Additional cases
    {
      original_row_index: 1583,
      Nyckel: '5V50D2660',
      h1_cm: 16.9907,
      h2_cm: 27.4084,
      h3_cm: 93.5335,
      bells_temp: 25.239,
      d0_target: 648.075,
      sci300_target: 253.41,
      E1_MPa: 700,
      E2_MPa: 120,
      E3_MPa: 85,
      E4_MPa: 22,
      d0_calc: 655.6,
      sci300_calc: 258.4,
      error_pct: 1.16
    },
    {
      original_row_index: 1838,
      Nyckel: '5V50D9780',
      h1_cm: 15.2204,
      h2_cm: 26.9897,
      h3_cm: 67.1763,
      bells_temp: 25.522939,
      d0_target: 504.23,
      sci300_target: 176.66,
      E1_MPa: 1300,
      E2_MPa: 150,
      E3_MPa: 110,
      E4_MPa: 30,
      d0_calc: 502.9,
      sci300_calc: 175.5,
      error_pct: 0.26
    },
    {
      original_row_index: 1875,
      Nyckel: '5V50D12620',
      h1_cm: 12.229,
      h2_cm: 23.9436,
      h3_cm: 47.7422,
      bells_temp: 25.8679,
      d0_target: 389.015,
      sci300_target: 148.825,
      E1_MPa: 1000,
      E2_MPa: 575,
      E3_MPa: 150,
      E4_MPa: 45,
      d0_calc: 381.6,
      sci300_calc: 149.7,
      error_pct: 1.91
    },

    {
      original_row_index: 2302,
      Nyckel: '5V131D5660',
      h1_cm: 11.792,
      h2_cm: 51.584,
      h3_cm: 83.594,
      bells_temp: 21.36,
      d0_target: 480.265,
      sci300_target: 180.145,
      E1_MPa: 900,
      E2_MPa: 375,
      E3_MPa: 80,
      E4_MPa: 20,
      d0_calc: 483.4,
      sci300_calc: 179.4,
      error_pct: 0.65
    },
    {
      original_row_index: 2404,
      Nyckel: '5V131D7700',
      h1_cm: 15.4972,
      h2_cm: 25.4813,
      h3_cm: 47.968,
      bells_temp: 20.9653,
      d0_target: 537.48,
      sci300_target: 198.235,
      E1_MPa: 950,
      E2_MPa: 180,
      E3_MPa: 180,
      E4_MPa: 25,
      d0_calc: 543.2,
      sci300_calc: 197.2,
      error_pct: 1.06
    },
    {
      original_row_index: 2447,
      Nyckel: '5V131D8560',
      h1_cm: 14.8803,
      h2_cm: 25.703,
      h3_cm: 69.0419,
      bells_temp: 20.8871,
      d0_target: 420.075,
      sci300_target: 150.49,
      E1_MPa: 1600,
      E2_MPa: 170,
      E3_MPa: 150,
      E4_MPa: 35,
      d0_calc: 419.0,
      sci300_calc: 148.2,
      error_pct: 0.26
    },
    {
      original_row_index: 2470,
      Nyckel: '5V131D9020',
      h1_cm: 13.6335,
      h2_cm: 32.2636,
      h3_cm: 74.1394,
      bells_temp: 21.143221,
      d0_target: 396.255,
      sci300_target: 141.69,
      E1_MPa: 2000,
      E2_MPa: 170,
      E3_MPa: 140,
      E4_MPa: 40,
      d0_calc: 390.9,
      sci300_calc: 140.8,
      error_pct: 1.35
    },
    {
      original_row_index: 2583,
      Nyckel: '5V131D11280',
      h1_cm: 15.9012,
      h2_cm: 36.2962,
      h3_cm: 70.6879,
      bells_temp: 20.7181,
      d0_target: 509.615,
      sci300_target: 169.17,
      E1_MPa: 1250,
      E2_MPa: 165,
      E3_MPa: 120,
      E4_MPa: 21,
      d0_calc: 514.6,
      sci300_calc: 166.0,
      error_pct: 0.98
    },
    {
      original_row_index: 2879,
      Nyckel: '5V131D17340',
      h1_cm: 13.6316,
      h2_cm: 27.0305,
      h3_cm: 83.6684,
      bells_temp: 21.084566,
      d0_target: 495.335,
      sci300_target: 153.89,
      E1_MPa: 1100,
      E2_MPa: 400,
      E3_MPa: 105,
      E4_MPa: 20,
      d0_calc: 495.7,
      sci300_calc: 155.2,
      error_pct: 0.07
    },

    {
      original_row_index: 3654,
      Nyckel: '5V741D28780',
      h1_cm: 8.474393,
      h2_cm: 20.705983,
      h3_cm: 74.662452,
      bells_temp: 21.540735,
      d0_target: 627.2,
      sci300_target: 232.375,
      E1_MPa: 1200,
      E2_MPa: 280,
      E3_MPa: 140,
      E4_MPa: 20,
      d0_calc: 614.9,
      sci300_calc: 236.5,
      error_pct: 1.96
    },
    {
      original_row_index: 3879,
      Nyckel: '5V741D23540',
      h1_cm: 13.313902,
      h2_cm: 27.344724,
      h3_cm: 82.406611,
      bells_temp: 20.608213,
      d0_target: 669.815,
      sci300_target: 255.555,
      E1_MPa: 750,
      E2_MPa: 190,
      E3_MPa: 95,
      E4_MPa: 19,
      d0_calc: 665.2,
      sci300_calc: 256.4,
      error_pct: 0.69
    },
    {
      original_row_index: 4045,
      Nyckel: '5V741D20140',
      h1_cm: 9.3732,
      h2_cm: 23.0598,
      h3_cm: 69.6488,
      bells_temp: 21.3813,
      d0_target: 754.62,
      sci300_target: 283.635,
      E1_MPa: 1500,
      E2_MPa: 140,
      E3_MPa: 90,
      E4_MPa: 20,
      d0_calc: 753.8,
      sci300_calc: 285.5,
      error_pct: 0.11
    },
    {
      original_row_index: 4323,
      Nyckel: '5V741D14500',
      h1_cm: 13.5415,
      h2_cm: 50.0579,
      h3_cm: 89.7946,
      bells_temp: 20.183184,
      d0_target: 630.605,
      sci300_target: 257.825,
      E1_MPa: 1000,
      E2_MPa: 100,
      E3_MPa: 240,
      E4_MPa: 15,
      d0_calc: 633.5,
      sci300_calc: 258.5,
      error_pct: 0.46
    },
    {
      original_row_index: 4461,
      Nyckel: '5V741D11740',
      h1_cm: 13.9887,
      h2_cm: 37.0848,
      h3_cm: 88.2629,
      bells_temp: 20.7529,
      d0_target: 681.945,
      sci300_target: 270.63,
      E1_MPa: 740,
      E2_MPa: 140,
      E3_MPa: 80,
      E4_MPa: 20,
      d0_calc: 682.7,
      sci300_calc: 275.2,
      error_pct: 0.11
    },
    {
      original_row_index: 4517,
      Nyckel: '5V741D10620',
      h1_cm: 13.4246,
      h2_cm: 42.346,
      h3_cm: 87.1116,
      bells_temp: 21.1717,
      d0_target: 2348.045,
      sci300_target: 654.34,
      E1_MPa: 500,
      E2_MPa: 30,
      E3_MPa: 20,
      E4_MPa: 4.2,
      d0_calc: 2359.4,
      sci300_calc: 656.5,
      error_pct: 0.48
    },
    {
      original_row_index: 4520,
      Nyckel: '5V741D10560',
      h1_cm: 16.4417,
      h2_cm: 48.5275,
      h3_cm: 85.7997,
      bells_temp: 21.056161,
      d0_target: 1618.73,
      sci300_target: 414.77,
      E1_MPa: 700,
      E2_MPa: 30,
      E3_MPa: 11,
      E4_MPa: 10,
      d0_calc: 1643.3,
      sci300_calc: 406.6,
      error_pct: 1.52
    },
    {
      original_row_index: 4551,
      Nyckel: '5V741D9940',
      h1_cm: 14.5633,
      h2_cm: 30.3663,
      h3_cm: 86.6375,
      bells_temp: 21.178191,
      d0_target: 855.55,
      sci300_target: 240.075,
      E1_MPa: 500,
      E2_MPa: 450,
      E3_MPa: 80,
      E4_MPa: 8,
      d0_calc: 838.9,
      sci300_calc: 239.7,
      error_pct: 1.95
    },
    {
      original_row_index: 4620,
      Nyckel: '5V741D8540',
      h1_cm: 19.3015,
      h2_cm: 36.2143,
      h3_cm: 74.6692,
      bells_temp: 20.6201,
      d0_target: 620.285,
      sci300_target: 251.395,
      E1_MPa: 600,
      E2_MPa: 150,
      E3_MPa: 120,
      E4_MPa: 20,
      d0_calc: 608.2,
      sci300_calc: 247.1,
      error_pct: 1.95
    },
    {
      original_row_index: 4632,
      Nyckel: '5V741D8300',
      h1_cm: 13.1748,
      h2_cm: 38.3693,
      h3_cm: 78.5106,
      bells_temp: 20.644303,
      d0_target: 727.235,
      sci300_target: 282.09,
      E1_MPa: 600,
      E2_MPa: 200,
      E3_MPa: 100,
      E4_MPa: 14,
      d0_calc: 724.4,
      sci300_calc: 281.0,
      error_pct: 0.39
    },
    {
      original_row_index: 4634,
      Nyckel: '5V741D8260',
      h1_cm: 15.5272,
      h2_cm: 38.4161,
      h3_cm: 87.1531,
      bells_temp: 20.50645,
      d0_target: 486.15,
      sci300_target: 211.2,
      E1_MPa: 845,
      E2_MPa: 155,
      E3_MPa: 400,
      E4_MPa: 20,
      d0_calc: 478.8,
      sci300_calc: 214.6,
      error_pct: 1.61
    },
    {
      original_row_index: 4642,
      Nyckel: '5V741D8100',
      h1_cm: 14.257,
      h2_cm: 33.766,
      h3_cm: 83.498,
      bells_temp: 20.50645,
      d0_target: 997.855,
      sci300_target: 428.685,
      E1_MPa: 247,
      E2_MPa: 325,
      E3_MPa: 22,
      E4_MPa: 20,
      d0_calc: 984.4,
      sci300_calc: 432.7,
      error_pct: 1.35
    },
    {
      original_row_index: 4672,
      Nyckel: '5V741D7500',
      h1_cm: 12.1227,
      h2_cm: 23.0905,
      h3_cm: 73.3757,
      bells_temp: 20.91,
      d0_target: 617.71,
      sci300_target: 224.3,
      E1_MPa: 600,
      E2_MPa: 500,
      E3_MPa: 65,
      E4_MPa: 25,
      d0_calc: 616.0,
      sci300_calc: 223.4,
      error_pct: 0.9
    },
    {
      original_row_index: 4741,
      Nyckel: '5V741D6120',
      h1_cm: 14.04,
      h2_cm: 30.62,
      h3_cm: 66.0,
      bells_temp: 21.58,
      d0_target: 1118.63,
      sci300_target: 273.61,
      E1_MPa: 450,
      E2_MPa: 430,
      E3_MPa: 18,
      E4_MPa: 9.3,
      d0_calc: 1104.4,
      sci300_calc: 275.3,
      error_pct: 0.94
    },
    {
      original_row_index: 4766,
      Nyckel: '5V741D5620',
      h1_cm: 10.61,
      h2_cm: 33.14,
      h3_cm: 79.16,
      bells_temp: 20.7,
      d0_target: 523.29,
      sci300_target: 222.38,
      E1_MPa: 630,
      E2_MPa: 400,
      E3_MPa: 90,
      E4_MPa: 30,
      d0_calc: 518.5,
      sci300_calc: 224.7,
      error_pct: 0.98
    },
    {
      original_row_index: 4863,
      Nyckel: '5V741D3680',
      h1_cm: 9.61,
      h2_cm: 23.45,
      h3_cm: 80.14,
      bells_temp: 21.95,
      d0_target: 400.92,
      sci300_target: 194.71,
      E1_MPa: 1200,
      E2_MPa: 350,
      E3_MPa: 100,
      E4_MPa: 80,
      d0_calc: 401.7,
      sci300_calc: 196.2,
      error_pct: 0.48
    },
    {
      original_row_index: 4917,
      Nyckel: '5V741D2580',
      h1_cm: 12.3,
      h2_cm: 25.98,
      h3_cm: 73.25,
      bells_temp: 21.13,
      d0_target: 483.06,
      sci300_target: 182.18,
      E1_MPa: 1030,
      E2_MPa: 350,
      E3_MPa: 100,
      E4_MPa: 30,
      d0_calc: 485.1,
      sci300_calc: 180.3,
      error_pct: 0.73
    },

    {
      original_row_index: 5017,
      Nyckel: '5V796D7100',
      h1_cm: 14.05,
      h2_cm: 36.89,
      h3_cm: 89.63,
      bells_temp: 25.53,
      d0_target: 253.9,
      sci300_target: 36.31,
      E1_MPa: 5500,
      E2_MPa: 1500,
      E3_MPa: 72,
      E4_MPa: 23,
      d0_calc: 255.3,
      sci300_calc: 35.9,
      error_pct: 0.84
    },
    {
      original_row_index: 5043,
      Nyckel: '5V796D7620',
      h1_cm: 12.76,
      h2_cm: 29.48,
      h3_cm: 98.28,
      bells_temp: 27.65,
      d0_target: 355.7,
      sci300_target: 34.84,
      E1_MPa: 7100,
      E2_MPa: 1700,
      E3_MPa: 65,
      E4_MPa: 14,
      d0_calc: 354.1,
      sci300_calc: 34.9,
      error_pct: 0.3
    },
    {
      original_row_index: 5193,
      Nyckel: '5V796D10740',
      h1_cm: 8.83,
      h2_cm: 22.29,
      h3_cm: 51.54,
      bells_temp: 26.93,
      d0_target: 435.23,
      sci300_target: 70.92,
      E1_MPa: 7500,
      E2_MPa: 830,
      E3_MPa: 100,
      E4_MPa: 21,
      d0_calc: 431.3,
      sci300_calc: 70.7,
      error_pct: 0.61
    },
    {
      original_row_index: 5288,
      Nyckel: '5V796D13180',
      h1_cm: 11.85,
      h2_cm: 35.41,
      h3_cm: 57.31,
      bells_temp: 27.1,
      d0_target: 361.72,
      sci300_target: 46.62,
      E1_MPa: 7300,
      E2_MPa: 800,
      E3_MPa: 90,
      E4_MPa: 17,
      d0_calc: 364.4,
      sci300_calc: 46.9,
      error_pct: 0.67
    },

    {
      original_row_index: 5412,
      Nyckel: '5V987D3640',
      h1_cm: 10.27,
      h2_cm: 31.21,
      h3_cm: 87.9,
      bells_temp: 26.34,
      d0_target: 619.3,
      sci300_target: 277.52,
      E1_MPa: 1100,
      E2_MPa: 155,
      E3_MPa: 115,
      E4_MPa: 24,
      d0_calc: 623.9,
      sci300_calc: 275.5,
      error_pct: 0.74
    },

    {
      original_row_index: 5605,
      Nyckel: '5V1050D4600',
      h1_cm: 9.71,
      h2_cm: 23.13,
      h3_cm: 63.7,
      bells_temp: 27.44,
      d0_target: 553.06,
      sci300_target: 238.54,
      E1_MPa: 2000,
      E2_MPa: 120,
      E3_MPa: 140,
      E4_MPa: 39,
      d0_calc: 548.4,
      sci300_calc: 239.6,
      error_pct: 0.64
    },
    {
      original_row_index: 5677,
      Nyckel: '5V1050D6120',
      h1_cm: 10.59,
      h2_cm: 24.09,
      h3_cm: 63.02,
      bells_temp: 28.1,
      d0_target: 688.76,
      sci300_target: 313.16,
      E1_MPa: 1200,
      E2_MPa: 100,
      E3_MPa: 100,
      E4_MPa: 34,
      d0_calc: 692.5,
      sci300_calc: 312.8,
      error_pct: 0.33
    },
    {
      original_row_index: 5884,
      Nyckel: '5V1050D13180',
      h1_cm: 9.65,
      h2_cm: 37.35,
      h3_cm: 87.22,
      bells_temp: 28.76,
      d0_target: 479.01,
      sci300_target: 223.48,
      E1_MPa: 1800,
      E2_MPa: 165,
      E3_MPa: 120,
      E4_MPa: 42,
      d0_calc: 481.9,
      sci300_calc: 222.6,
      error_pct: 0.5
    },
    {
      original_row_index: 6014,
      Nyckel: '5V1050D15940',
      h1_cm: 10.21,
      h2_cm: 28.67,
      h3_cm: 82.91,
      bells_temp: 24.98,
      d0_target: 488.6,
      sci300_target: 205.18,
      E1_MPa: 2400,
      E2_MPa: 120,
      E3_MPa: 110,
      E4_MPa: 50,
      d0_calc: 486.1,
      sci300_calc: 206.6,
      error_pct: 0.6
    },
    {
      original_row_index: 6197,
      Nyckel: '5V1050D20120',
      h1_cm: 10.7,
      h2_cm: 26.02,
      h3_cm: 74.86,
      bells_temp: 28.37,
      d0_target: 387.06,
      sci300_target: 194.36,
      E1_MPa: 2000,
      E2_MPa: 150,
      E3_MPa: 140,
      E4_MPa: 100,
      d0_calc: 387.0,
      sci300_calc: 194.1,
      error_pct: 0.07
    },
    {
      original_row_index: 6426,
      Nyckel: '5V1050D24940',
      h1_cm: 9.82,
      h2_cm: 23.72,
      h3_cm: 71.34,
      bells_temp: 28.8,
      d0_target: 588.06,
      sci300_target: 304.17,
      E1_MPa: 1400,
      E2_MPa: 110,
      E3_MPa: 100,
      E4_MPa: 60,
      d0_calc: 592.2,
      sci300_calc: 301.9,
      error_pct: 0.72
    },

    {
      original_row_index: 7210,
      Nyckel: '6V32D74780',
      h1_cm: 12.5,
      h2_cm: 26.85,
      h3_cm: 71.84,
      bells_temp: 21.13,
      d0_target: 494.82,
      sci300_target: 202.4,
      E1_MPa: 1600,
      E2_MPa: 125,
      E3_MPa: 100,
      E4_MPa: 48,
      d0_calc: 492.7,
      sci300_calc: 201.6,
      error_pct: 0.41
    },
    {
      original_row_index: 7276,
      Nyckel: '6V131D100',
      h1_cm: 18.75,
      h2_cm: 33.0,
      h3_cm: 70.72,
      bells_temp: 20.81,
      d0_target: 298.02,
      sci300_target: 104.92,
      E1_MPa: 2100,
      E2_MPa: 110,
      E3_MPa: 110,
      E4_MPa: 90,
      d0_calc: 299.6,
      sci300_calc: 104.9,
      error_pct: 0.27
    },
    {
      original_row_index: 7587,
      Nyckel: '6V131D6320',
      h1_cm: 16.58,
      h2_cm: 35.53,
      h3_cm: 72.28,
      bells_temp: 21.14,
      d0_target: 492.16,
      sci300_target: 192.83,
      E1_MPa: 1200,
      E2_MPa: 90,
      E3_MPa: 80,
      E4_MPa: 55,
      d0_calc: 491.1,
      sci300_calc: 193.8,
      error_pct: 0.36
    }
  ];

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setLoading(true);
    setError(null);
    setResult(null);

    const payload = {
      h1_cm: parseFloat(formData.h1_cm),
      h2_cm: parseFloat(formData.h2_cm),
      h3_cm: parseFloat(formData.h3_cm),
      bells_temp: parseFloat(formData.bells_temp),
      d0_target: parseFloat(formData.d0_target),
      sci300_target: parseFloat(formData.sci300_target)
    };

    try {
      const data = await predictModuli(payload);
      setResult(data);
    } catch (err) {
      const detail = err.response?.data?.detail;

      if (typeof detail === 'object') {
        setError(JSON.stringify(detail));
      } else {
        setError(
          detail || 'Failed to communicate with FastAPI server.'
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ width: '100%' }}>

      {/* =========================
          LIVE PREDICTOR
      ========================= */}
      <Paper
        elevation={3}
        sx={{
          p: 3,
          mb: 4,
          borderRadius: 2
        }}
      >
        <Typography variant="h4" gutterBottom>
          🔮 Live Predictor — 4-Layer Moduli Surrogate
        </Typography>

        <Box
          sx={{
            backgroundColor: '#f5f5f5',
            p: 2,
            borderRadius: 2,
            mb: 3
          }}
        >
          <Typography variant="h6">
            Purpose of the Live Predictor
          </Typography>

          <Typography paragraph>
            This Live Predictor demonstrates the integrated machine
            learning prediction pipeline for structural pavement
            back-calculation.
          </Typography>

          <Typography paragraph>
            The interface takes structural and environmental inputs,
            sends them to the deployed FastAPI backend, and retrieves
            the predicted moduli E1–E4 in real time.
          </Typography>

          <Typography variant="body2">
            <strong>Current workflow:</strong>
          </Typography>

          <Typography variant="body2">
            React → FastAPI (Render) → Random Forest Surrogate → E1–E4 Moduli
          </Typography>
        </Box>

        <Typography variant="h6" gutterBottom>
          Surrogate Model Input Features
        </Typography>

        <Typography paragraph>
          Enter the structural layer thicknesses, pavement temperature,
          and target deflection responses to estimate layer moduli.
        </Typography>

        <Box
          component="form"
          onSubmit={handleSubmit}
        >
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: {
                xs: '1fr',
                sm: '1fr 1fr',
                md: '1fr 1fr 1fr'
              },
              gap: 2
            }}
          >

            <TextField
              label="Layer 1 Thickness (h1_cm)"
              type="number"
              name="h1_cm"
              value={formData.h1_cm}
              onChange={handleChange}
              inputProps={{ step: 'any' }}
              required
            />

            <TextField
              label="Layer 2 Thickness (h2_cm)"
              type="number"
              name="h2_cm"
              value={formData.h2_cm}
              onChange={handleChange}
              inputProps={{ step: 'any' }}
              required
            />

            <TextField
              label="Layer 3 Thickness (h3_cm)"
              type="number"
              name="h3_cm"
              value={formData.h3_cm}
              onChange={handleChange}
              inputProps={{ step: 'any' }}
              required
            />

            <TextField
              label="Pavement Temperature (°C)"
              type="number"
              name="bells_temp"
              value={formData.bells_temp}
              onChange={handleChange}
              inputProps={{ step: 'any' }}
              required
            />

            <TextField
              label="Target Deflection D0 (µm)"
              type="number"
              name="d0_target"
              value={formData.d0_target}
              onChange={handleChange}
              inputProps={{ step: 'any' }}
              required
            />

            <TextField
              label="Target SCI300 (µm)"
              type="number"
              name="sci300_target"
              value={formData.sci300_target}
              onChange={handleChange}
              inputProps={{ step: 'any' }}
              required
            />

          </Box>

          <Button
            type="submit"
            variant="contained"
            size="large"
            disabled={loading}
            sx={{ mt: 3 }}
          >
            {loading ? (
              <>
                <CircularProgress
                  size={22}
                  sx={{ mr: 1 }}
                />
                Calculating Moduli...
              </>
            ) : (
              'Predict Layer Moduli'
            )}
          </Button>
        </Box>

        {/* ERROR */}
        {error && (
          <Alert
            severity="error"
            sx={{ mt: 3 }}
          >
            <strong>Error:</strong> {error}
          </Alert>
        )}

        {/* RESULT */}
        {result && (
          <Box sx={{ mt: 4 }}>

            <Typography variant="h5" gutterBottom>
              Predicted Pavement Moduli
            </Typography>

            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: {
                  xs: '1fr',
                  sm: '1fr 1fr',
                  md: 'repeat(4, 1fr)'
                },
                gap: 2
              }}
            >

              <Paper sx={{ p: 2 }}>
                <Typography variant="body2">
                  E1 — Asphalt
                </Typography>
                <Typography variant="h5">
                  {Number(result.E1_Asphalt_MPa).toFixed(2)} MPa
                </Typography>
              </Paper>

              <Paper sx={{ p: 2 }}>
                <Typography variant="body2">
                  E2 — Base
                </Typography>
                <Typography variant="h5">
                  {Number(result.E2_Base_MPa).toFixed(2)} MPa
                </Typography>
              </Paper>

              <Paper sx={{ p: 2 }}>
                <Typography variant="body2">
                  E3 — Subbase
                </Typography>
                <Typography variant="h5">
                  {Number(result.E3_Subbase_MPa).toFixed(2)} MPa
                </Typography>
              </Paper>

              <Paper sx={{ p: 2 }}>
                <Typography variant="body2">
                  E4 — Subgrade
                </Typography>
                <Typography variant="h5">
                  {Number(result.E4_Subgrade_MPa).toFixed(2)} MPa
                </Typography>
              </Paper>

            </Box>
          </Box>
        )}
      </Paper>

      <Divider sx={{ mb: 4 }} />

      {/* =========================
          TRAINING DATA TABLE
      ========================= */}
      <Paper
        elevation={3}
        sx={{
          p: 3,
          borderRadius: 2
        }}
      >

        <Typography variant="h5" gutterBottom>
          📊 Converged Back-Calculation Training Data
        </Typography>

        <Typography
          variant="body1"
          sx={{ mb: 1 }}
        >
          The following table contains the converged pavement cases
          used for development of the surrogate model.
        </Typography>

        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ mb: 3 }}
        >
          Training dataset: <strong>{convergedData.length} cases</strong>
        </Typography>

        <TableContainer
          component={Paper}
          variant="outlined"
          sx={{
            maxHeight: 650,
            overflow: 'auto'
          }}
        >
          <Table
            stickyHeader
            size="small"
          >

            <TableHead>
              <TableRow>

                <TableCell>
                  <strong>Row</strong>
                </TableCell>

                <TableCell>
                  <strong>Nyckel</strong>
                </TableCell>

                <TableCell align="right">
                  <strong>h1 (cm)</strong>
                </TableCell>

                <TableCell align="right">
                  <strong>h2 (cm)</strong>
                </TableCell>

                <TableCell align="right">
                  <strong>h3 (cm)</strong>
                </TableCell>

                <TableCell align="right">
                  <strong>Temp (°C)</strong>
                </TableCell>

                <TableCell align="right">
                  <strong>D0 Target</strong>
                </TableCell>

                <TableCell align="right">
                  <strong>SCI300 Target</strong>
                </TableCell>

                <TableCell align="right">
                  <strong>E1 (MPa)</strong>
                </TableCell>

                <TableCell align="right">
                  <strong>E2 (MPa)</strong>
                </TableCell>

                <TableCell align="right">
                  <strong>E3 (MPa)</strong>
                </TableCell>

                <TableCell align="right">
                  <strong>E4 (MPa)</strong>
                </TableCell>

                <TableCell align="right">
                  <strong>D0 Calc</strong>
                </TableCell>

                <TableCell align="right">
                  <strong>SCI300 Calc</strong>
                </TableCell>

                <TableCell align="right">
                  <strong>Error (%)</strong>
                </TableCell>

              </TableRow>
            </TableHead>

            <TableBody>

              {convergedData.map((row) => (
                <TableRow
                  key={row.original_row_index}
                  hover
                >

                  <TableCell>
                    {row.original_row_index}
                  </TableCell>

                  <TableCell>
                    {row.Nyckel}
                  </TableCell>

                  <TableCell align="right">
                    {row.h1_cm}
                  </TableCell>

                  <TableCell align="right">
                    {row.h2_cm}
                  </TableCell>

                  <TableCell align="right">
                    {row.h3_cm}
                  </TableCell>

                  <TableCell align="right">
                    {row.bells_temp}
                  </TableCell>

                  <TableCell align="right">
                    {row.d0_target}
                  </TableCell>

                  <TableCell align="right">
                    {row.sci300_target}
                  </TableCell>

                  <TableCell align="right">
                    <strong>{row.E1_MPa}</strong>
                  </TableCell>

                  <TableCell align="right">
                    <strong>{row.E2_MPa}</strong>
                  </TableCell>

                  <TableCell align="right">
                    <strong>{row.E3_MPa}</strong>
                  </TableCell>

                  <TableCell align="right">
                    <strong>{row.E4_MPa}</strong>
                  </TableCell>

                  <TableCell align="right">
                    {row.d0_calc}
                  </TableCell>

                  <TableCell align="right">
                    {row.sci300_calc}
                  </TableCell>

                  <TableCell align="right">
                    {row.error_pct}
                  </TableCell>

                </TableRow>
              ))}

            </TableBody>

          </Table>
        </TableContainer>

      </Paper>

    </Box>
  );
}

export default LivePredictor;