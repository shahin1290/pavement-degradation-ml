"""Step 2: ERAPave input files with points INSIDE the road, for the same cases (same moduli and thicknesses).
Points: the 9 surface sensors, bottom of the asphalt (0.1 mm above the interface) and top of the subgrade (0.1 mm below).
Run:  uv run python strain/make_strain_dat.py data/erapave_holdout data/erapave_strain
Then run each .dat in ERAPave and save the result as <case>_strain.txt in the same folder."""
import sys, glob, os
sys.path.insert(0, os.path.dirname(__file__))
import parse_erapave as pe

src = sys.argv[1] if len(sys.argv) > 1 else "data/erapave_holdout"
out = sys.argv[2] if len(sys.argv) > 2 else "data/erapave_strain"
os.makedirs(out, exist_ok=True)
SURFACE = [0, 13, 21.5, 30, 45, 60, 90, 120, 150]
for f in sorted(glob.glob(os.path.join(src, "*.txt"))):
    case = os.path.basename(f)[:-4]
    d = pe.read(f); h1, h2, h3 = d["h_cm"]; E = d["E"]; nu = d["nu"]
    z_asph = h1 - 0.01                 # cm, bottom of the asphalt
    z_subg = h1 + h2 + h3 + 0.01       # cm, top of the subgrade
    pts = [(x, 0.0) for x in SURFACE] + [(0, z_asph), (0, z_subg)]
    with open(os.path.join(out, f"{case}_strain.dat"), "w", encoding="utf-8") as g:
        g.write("MATERIAL PROPERTIES\n4\n0\n")
        for i, (hh, uw) in enumerate([(h1, 24), (h2, 22), (h3, 20)]):
            g.write(f"{i+1} {hh:.4f} {E[i]:.2f} {nu[i]} {uw}\n")
        g.write(f"4 1e+300 {E[3]:.2f} {nu[3]} 18\n")
        g.write(f"\nLOADING\n1\n{d['pressure_kPa']:.3f}\n{d['axle_kN']:.3f}\n0\n0\n")
        g.write(f"\nEVALUATION LOCATIONS\n{len(pts)}\nx y z\n")
        for x, z in pts:
            g.write(f"{x} 0 {z:.4f}\n")
    print("wrote", os.path.join(out, f"{case}_strain.dat"), f"(asphalt bottom z = {z_asph:.2f} cm, subgrade top z = {z_subg:.2f} cm)")
