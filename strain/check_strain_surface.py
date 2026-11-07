"""Step 1: compare our strains with the ERAPave results you already have (surface points, 20 holdout cases).
Run: uv run python strain/check_strain_surface.py data/erapave_holdout"""
import sys, glob, os
import numpy as np, pandas as pd
sys.path.insert(0, os.path.dirname(__file__))
import parse_erapave as pe, let_strain as ls

folder = sys.argv[1] if len(sys.argv) > 1 else "data/erapave_holdout"
rows = []
for f in sorted(glob.glob(os.path.join(folder, "*.txt")), key=lambda p: int("".join(c for c in os.path.basename(p) if c.isdigit()) or 0)):
    d = pe.read(f); h = list(d["h_cm"] / 100)
    pts = [(x / 100, 0.0, 0) for x in d["strain"].x]
    ours = ls.strains(d["E"], h, d["nu"], pts, wheel_kN=d["axle_kN"] / 2, pressure_kPa=d["pressure_kPa"])
    for o, (_, s), (_, t) in zip(ours, d["strain"].iterrows(), d["stress"].iterrows()):
        rows.append({"case": os.path.basename(f)[:-4], "r_cm": o["r_cm"], "D_erapave_um": t.wz * 1e4, "D_ours_um": o["wz_um"],
                     "ezz_erapave": s.ezz * 1e3, "ezz_ours": o["ezz"], "err_erapave": s.exx * 1e3, "err_ours": o["err"],
                     "ett_erapave": s.eyy * 1e3, "ett_ours": o["ett"]})
r = pd.DataFrame(rows)
r.round(2).to_csv(os.path.join(folder, "..", "strain_check_surface.csv"), index=False)
print(f"{r.case.nunique()} cases, {len(r)} points (strains in microstrain, compression positive)\n")
r = r.rename(columns={"D_erapave_um": "D_erapave", "D_ours_um": "D_ours"})
print("Median / max absolute difference, ours minus ERAPave (deflection D in µm, strains in microstrain):")
out = []
for zone, m in (("under the wheel (r = 0)", r.r_cm == 0), ("at the load edge (r = 13 cm)", r.r_cm == 13),
                ("outside the load (r >= 21.5 cm)", r.r_cm >= 21.5)):
    q = r[m]; o = {"where": zone, "points": len(q)}
    for v in ("D", "ezz", "err", "ett"):
        diff = (q[v + "_ours"] - q[v + "_erapave"]).abs()
        o[v] = f"{diff.median():.1f} / {diff.max():.1f}"
    out.append(o)
print(pd.DataFrame(out).to_string(index=False))
