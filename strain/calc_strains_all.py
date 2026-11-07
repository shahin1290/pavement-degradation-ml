"""Critical strains for every usable backcalculated bowl.

For each usable bowl (fit error <= 5%) the backcalculated moduli E1..E4 and the layer thicknesses are put in the
layered elastic model (same model as the backcalculation, verified against ERAPave within 0.34%) with a standard
wheel load, and two strains are calculated under the wheel centre:
  asphalt_tension_ue      horizontal tensile strain at the bottom of the asphalt  -> fatigue cracking
  subgrade_compression_ue vertical compressive strain at the top of the subgrade  -> rutting
Both in microstrain (µε), positive values.

Run:    uv run python strain/calc_strains_all.py
        uv run python strain/calc_strains_all.py --backcalc data/backcalc_rows0-7050_full.csv --out data/strains_all.csv
Takes about 10 minutes for ~26,000 bowls.
"""
import argparse
import os
import sys
import time

import numpy as np
import pandas as pd

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import let_strain as ls

# Standard load, the same as in the ERAPave check (axle 100 kN = 50 kN single wheel, 800 kPa)
WHEEL_KN = 50.0
PRESSURE_KPA = 800.0
NU = [0.35, 0.35, 0.35, 0.40]          # Poisson's ratios, same as the backcalculation
OFFSET_M = 1e-4                        # points 0.1 mm above / below the interface

# Both points are at least 7.5 cm deep (thinnest asphalt 75 mm), where the integrand dies out quickly: a shorter
# integration grid gives the same result (checked incl. the thinnest layers: max difference 0.0005%) and is 3x faster.
ls.SEG = [(0, 20, 0.01), (20, 100, 0.05), (100, 800, 0.25)]
ls.LAM, ls.WT = ls._lam()


def critical_strains(E, thk_mm):
    h = [t / 1000 for t in thk_mm]
    o = ls.strains(E, h, NU, [(0, h[0] - OFFSET_M, 0), (0, sum(h) + OFFSET_M, 3)],
                   wheel_kN=WHEEL_KN, pressure_kPa=PRESSURE_KPA)
    return -o[0]["err"], o[1]["ezz"]          # tension at asphalt bottom, compression at subgrade top


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--backcalc", default="data/backcalc_rows0-7050_full.csv")
    ap.add_argument("--out", default="data/strains_all.csv")
    args = ap.parse_args()

    b = pd.read_csv(args.backcalc)
    if b.thk1_mm.min() < 50:
        raise ValueError("asphalt thinner than 5 cm: use the fine integration grid in let_strain.py")
    u = b[b.poor_fit == 0].copy()
    print(f"{len(u):,} usable bowls of {len(b):,}; load {WHEEL_KN:.0f} kN wheel at {PRESSURE_KPA:.0f} kPa")

    t0 = time.time(); ten, com = [], []
    for i, r in enumerate(u.itertuples(index=False), 1):
        a, s = critical_strains([r.E1, r.E2, r.E3, r.E4], [r.thk1_mm, r.thk2_mm, r.thk3_mm])
        ten.append(a); com.append(s)
        if i % 2000 == 0 or i == len(u):
            el = time.time() - t0
            print(f"  {i:,}/{len(u):,}  ({el / 60:.1f} min, about {el / i * (len(u) - i) / 60:.1f} min left)")
    u["asphalt_tension_ue"] = np.round(ten, 2)
    u["subgrade_compression_ue"] = np.round(com, 2)

    keep = ["row_index", "key", "survey", "survey_date", "asphalt_temp_C", "thk1_mm", "thk2_mm", "thk3_mm",
            "E1", "E2", "E3", "E4", "rms_pct", "at_limit", "asphalt_tension_ue", "subgrade_compression_ue"]
    u[keep].to_csv(args.out, index=False)
    print(f"\nwrote {args.out}")

    # short summary
    q = u.groupby("survey")[["asphalt_tension_ue", "subgrade_compression_ue"]].median().round(0)
    q["bowls"] = u.groupby("survey").size()
    print("\nMedian strain per survey (µε):\n" + q.to_string())
    d = u[["asphalt_tension_ue", "subgrade_compression_ue"]].describe(percentiles=[.05, .25, .5, .75, .95]).round(0)
    print("\nAll usable bowls (µε):\n" + d.to_string())
    lim = u.at_limit.notna() & (u.at_limit != "")
    print(f"\n{lim.mean():.0%} of these bowls have a modulus at a limit (column at_limit): their strains are less certain.")


if __name__ == "__main__":
    main()
