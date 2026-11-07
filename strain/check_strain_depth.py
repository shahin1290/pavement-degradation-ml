"""Step 3: compare our critical strains with ERAPave at the bottom of the asphalt and the top of the subgrade.
Run after ERAPave:  uv run python strain/check_strain_depth.py data/erapave_strain
Without ERAPave results it prints only our own values."""
import sys, glob, os
import numpy as np, pandas as pd
sys.path.insert(0, os.path.dirname(__file__))
import parse_erapave as pe, let_strain as ls

folder = sys.argv[1] if len(sys.argv) > 1 else "data/erapave_strain"
src = sys.argv[2] if len(sys.argv) > 2 else "data/erapave_holdout"
rows = []
for f in sorted(glob.glob(os.path.join(src, "*.txt")), key=lambda p: int(os.path.basename(p)[:-4])):
    case = os.path.basename(f)[:-4]
    d = pe.read(f); h = list(d["h_cm"] / 100)
    za, zs = h[0] - 1e-4, sum(h) + 1e-4
    o = ls.strains(d["E"], h, d["nu"], [(0, za, 0), (0, zs, 3)], wheel_kN=d["axle_kN"] / 2, pressure_kPa=d["pressure_kPa"])
    r = {"case": case, "asphalt_cm": round(d["h_cm"][0], 1), "E1": d["E"][0], "E4": d["E"][3],
         "asphalt_tension_ours": -o[0]["err"], "subgrade_compression_ours": o[1]["ezz"]}
    e = os.path.join(folder, f"{case}_strain.txt")
    if os.path.exists(e):
        er = pe.read(e)
        assert np.allclose(er["E"], d["E"]) and np.allclose(er["h_cm"], d["h_cm"]), f"{case}: ERAPave input differs"
        s = er["principal"] if er["principal"] is not None else er["strain"].rename(columns={"ezz": "e1", "exx": "e3"})
        a = s.iloc[(s.z - za * 100).abs().argmin()]; b = s.iloc[(s.z - zs * 100).abs().argmin()]
        # under the wheel centre: horizontal strain = the smallest principal strain, vertical = the largest (ERAPave: compression +)
        r["asphalt_tension_erapave"] = -min(a.e1, a.e2, a.e3) * 1e3; r["subgrade_compression_erapave"] = max(b.e1, b.e2, b.e3) * 1e3
    rows.append(r)
t = pd.DataFrame(rows)
done = t.dropna(subset=["asphalt_tension_erapave"]) if "asphalt_tension_erapave" in t else t.iloc[0:0]
print(f"ERAPave results found for {len(done)} of {len(t)} cases")
if "asphalt_tension_erapave" in t:
    for v in ("asphalt_tension", "subgrade_compression"):
        t[f"{v}_diff_pct"] = 100 * (t[f"{v}_ours"] / t[f"{v}_erapave"] - 1)
pd.set_option("display.width", 200)
print("Critical strains under a 50 kN wheel, 800 kPa (microstrain). Asphalt tension = horizontal stretching at the bottom of the asphalt;"
      " subgrade compression = vertical squeezing at the top of the subgrade.\n")
print(t.round(1).to_string(index=False))
if "asphalt_tension_diff_pct" in t:
    for v in ("asphalt_tension", "subgrade_compression"):
        print(f"{v}: median |difference| {t[f'{v}_diff_pct'].abs().median():.2f}%, max {t[f'{v}_diff_pct'].abs().max():.2f}%")
t.round(3).to_csv(os.path.join(folder, "strain_check_depth.csv"), index=False)
