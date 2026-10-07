"""
Build the JSON files shown on the frontend "Results" page.

Reads (from data/):
  backcalc_rows0-7050_full.csv                  all backcalculated cases (4 layers, bounded)
  backcalc_rows0-999_4or5L_full.csv             experiment: 4 or 5 layers (rows 0-999)
  backcalc_rows0-999_4L_bounded_vs_unbounded.csv experiment: bounded vs unbounded (rows 0-999)

  artifacts/holdout.csv                          the 20 holdout cases (made by train.py)
  data/erapave_holdout/*.txt                     ERAPave output files for holdout cases (optional)

Writes (to frontend/public/results/):
  dataset.json   every case, compact column format
  layers.json    4 vs 4-or-5 layers comparison
  bounds.json    bounded vs unbounded comparison
  holdout.json   holdout cases for the Live Predictor dropdown,
                 incl. the ERAPave check when output files are present

Run from the project root after changing any backcalculation file:
  python make_results_data.py
"""
import json
from pathlib import Path

import numpy as np
import pandas as pd

ROOT = Path(__file__).resolve().parent
DATA = ROOT / "data"
OUT = ROOT / "frontend" / "public" / "results"

DATASET = DATA / "backcalc_rows0-7050_full.csv"
LAYERS = DATA / "backcalc_rows0-999_4or5L_full.csv"
BOUNDS = DATA / "backcalc_rows0-999_4L_bounded_vs_unbounded.csv"
HOLDOUT = ROOT / "artifacts" / "holdout.csv"
ERAPAVE_DIR = DATA / "erapave_holdout"

DEFL = ["D0", "D130", "D215", "D300", "D450", "D600", "D900", "D1200", "D1500"]
SURVEYS = {1: "Aug 2022", 2: "Sep 2023", 3: "May 2024", 4: "Sep 2024"}
LIMITS = {"E1": (1500, 8000), "E2": (100, 3000), "E3": (50, 600), "E4": (30, 400)}


def road_of(key):
    """'5V796D8300' -> '796', '5V4.05D20' -> '4.05' (text, so branch roads keep their number)"""
    s = str(key)
    try:
        return s.split("V", 1)[1].split("D", 1)[0]
    except IndexError:
        return "?"


def columnar(df, decimals):
    """DataFrame -> {column: [values]} with per-column rounding, NaN -> None."""
    out = {}
    for c in df.columns:
        s = df[c]
        if c in decimals:
            s = s.round(decimals[c])
            if decimals[c] == 0:
                out[c] = [None if pd.isna(v) else int(v) for v in s]
                continue
        out[c] = [None if (isinstance(v, float) and np.isnan(v)) else (v.item() if hasattr(v, "item") else v) for v in s]
    return out


def write(name, obj):
    OUT.mkdir(parents=True, exist_ok=True)
    path = OUT / name
    path.write_text(json.dumps(obj, separators=(",", ":"), ensure_ascii=False), encoding="utf-8")
    print(f"{path.relative_to(ROOT)}: {path.stat().st_size / 1e6:.1f} MB")


def pct(x):
    return round(float(100 * np.mean(x)), 1)


# ------------------------------------------------------------------ dataset
def build_dataset():
    d = pd.read_csv(DATASET).sort_values(["row_index", "survey"])
    d["road"] = d["key"].map(road_of)
    d["at_limit"] = d["at_limit"].fillna("")
    cols = ["row_index", "key", "road", "survey", "chainage_m", "asphalt_temp_C",
            "thk1_mm", "thk2_mm", "thk3_mm", *DEFL,
            "E1", "E2", "E3", "E4", "rms_pct", "poor_fit", "position_mismatch", "at_limit"]
    dec = {"chainage_m": 0, "asphalt_temp_C": 1, "thk1_mm": 1, "thk2_mm": 1, "thk3_mm": 1,
           **{c: 1 for c in DEFL}, "E1": 0, "E2": 0, "E3": 0, "E4": 0, "rms_pct": 2}

    summary = []
    for s, g in d.groupby("survey"):
        summary.append({
            "survey": int(s), "date": SURVEYS.get(int(s), ""), "cases": int(len(g)),
            "good_fit_pct": pct(g.poor_fit == 0), "median_rms": round(float(g.rms_pct.median()), 2),
            "position_mismatch": int(g.position_mismatch.sum()),
            **{f"{e}_median": int(g.loc[g.poor_fit == 0, e].median()) for e in LIMITS},
        })
    total = {"cases": int(len(d)), "good_fit": int((d.poor_fit == 0).sum()),
             "poor_fit": int(d.poor_fit.sum()), "position_mismatch": int(d.position_mismatch.sum()),
             "median_rms": round(float(d.rms_pct.median()), 2), "roads": int(d.road.nunique())}
    write("dataset.json", {"surveys": SURVEYS, "limits": LIMITS, "total": total,
                           "by_survey": summary, "columns": columnar(d[cols], dec)})


# ------------------------------------------------------------------ 4 vs 5 layers
def build_layers():
    four = pd.read_csv(BOUNDS)[["row_index", "survey", "rms_pct_4L"]]
    mix = pd.read_csv(LAYERS)[["row_index", "survey", "layers_used", "rms_pct", "rigid_depth_m"]]
    d = four.merge(mix, on=["row_index", "survey"])

    def summ(g):
        return {"cases": int(len(g)), "good_before": pct(g.rms_pct_4L <= 5), "good_after": pct(g.rms_pct <= 5),
                "five_layer_cases": int((g.layers_used == 5).sum())}

    n5 = (d.pivot_table(index="row_index", columns="survey", values="layers_used") == 5).sum(axis=1)
    write("layers.json", {
        "rows": "0-999", "total": summ(d),
        "by_survey": [{"survey": int(s), "date": SURVEYS[int(s)], **summ(g)} for s, g in d.groupby("survey")],
        "median_depth_m": round(float(d.loc[d.layers_used == 5, "rigid_depth_m"].median()), 1),
        "rows_any_survey": int((n5 >= 1).sum()), "rows_all_surveys": int((n5 == 4).sum()),
    })


# ------------------------------------------------------------------ bounded vs unbounded
def pick_examples(r):
    """A few clear examples of what goes wrong without limits."""
    rules = [
        ("E1 far above 8,000", r.sort_values("E1_unb", ascending=False), 3),
        ("E2 far below 100", r[r.E2_unb < 98].sort_values("E2_unb"), 3),
        ("E4 far above 400", r.sort_values("E4_unb", ascending=False), 2),
        ("Poor fit 'fixed' by extreme values", r.assign(gain=r.rms_pct_4L - r.rms_pct_unb).sort_values("gain", ascending=False), 2),
    ]
    out, seen = [], set()
    for why, g, n in rules:
        for x in g.itertuples():
            if len([o for o in out if o["why"] == why]) >= n:
                break
            if (x.row_index, x.survey) in seen:
                continue
            seen.add((x.row_index, x.survey))
            out.append({"why": why, "row_index": int(x.row_index), "survey": int(x.survey),
                        **{f"{e}_{k}": int(getattr(x, f"{e}_{k}")) for e in LIMITS for k in ("4L", "unb")},
                        "rms_pct_4L": round(float(x.rms_pct_4L), 2), "rms_pct_unb": round(float(x.rms_pct_unb), 2)})
    return out



def build_bounds():
    d = pd.read_csv(BOUNDS)  # all cases; cases that never hit a limit keep the same values unbounded

    def summ(g):
        return {"cases": int(len(g)), "good_before": pct(g.rms_pct_4L <= 5), "good_after": pct(g.rms_pct_unb <= 5)}

    write("bounds.json", {
        "rows": "0-999", "total": summ(d),
        "by_survey": [{"survey": int(s), "date": SURVEYS[int(s)], **summ(g)} for s, g in d.groupby("survey")],
        "recalculated": int(d.recalculated.sum()),
        "E1_above_8000": int((d.E1_unb > 8000 * 1.02).sum()),
        "E1_unb_p95": int(round(d.E1_unb.quantile(0.95), -2)),
        "E2_below_100": int((d.E2_unb < 100 * 0.98).sum()),
        "E4_above_400": int((d.E4_unb > 400 * 1.02).sum()),
        "limits": LIMITS,
        "examples": pick_examples(d[d.recalculated == 1]),
    })


# ------------------------------------------------------------------ ERAPave output files
def read_erapave_output(path):
    """
    Read one ERAPave output file (the "SUMMARY OF INPUT DATA ..." text).
    Returns thicknesses (cm), moduli (MPa) and surface deflections (micrometres) by x (cm).
    """
    lines = Path(path).read_text(encoding="utf-8", errors="ignore").splitlines()
    section, header, layers, defl = None, None, [], {}
    for line in lines:
        t = line.strip()
        if not t:
            continue
        if t.isupper() and not t[0].isdigit() and "[" not in t:
            section, header = t, None
            continue
        parts = t.split()
        if section == "MATERIAL PROPERTIES" and parts[0].isdigit() and len(parts) >= 3:
            layers.append((float(parts[1]), float(parts[2])))
        elif section == "STRESSES AND DISPLACEMENTS":
            if header is None and "wz[cm]" in t:
                header = parts
                continue
            if header and len(parts) == len(header):
                row = dict(zip(header, map(float, parts)))
                if abs(row.get("z[cm]", 0)) < 1e-9 and abs(row.get("y[cm]", 0)) < 1e-9:
                    defl[round(row["x[cm]"], 1)] = row["wz[cm]"] * 1e4   # cm -> micrometres
    return {"thk_cm": [l[0] for l in layers[:3]], "E": [l[1] for l in layers[:4]], "defl": defl}


ERAPAVE_X_CM = [0, 13, 21.5, 30, 45, 60, 90, 120, 150]


def erapave_checks(cases):
    """
    Match ERAPave output files to holdout cases (by file name rowXX_surveyY, else by thicknesses)
    and compare the calculated deflections with the measured ones.
    A file whose name contains 'final' is the converged run after iteration.
    """
    if not ERAPAVE_DIR.exists():
        return {}
    found = {}
    for f in sorted(ERAPAVE_DIR.glob("*")):
        if not f.is_file():
            continue
        try:
            out = read_erapave_output(f)
        except Exception as e:                      # noqa: BLE001
            print(f"  could not read {f.name}: {e}")
            continue
        if len(out["defl"]) < 9 or len(out["E"]) < 4:
            print(f"  skipped {f.name}: not an ERAPave output with 9 deflections")
            continue
        name = f.stem.lower()
        match = None
        for c in cases:
            r, s = c["id"].split("-")[1:]
            if f"row{r}_survey{s}" in name:
                match = c
                break
        if match is None:   # fall back to thicknesses
            for c in cases:
                h = [c["inputs"][f"thk{k}_mm"] / 10 for k in (1, 2, 3)]
                if all(abs(a - b) < 0.05 for a, b in zip(h, out["thk_cm"])):
                    match = c
                    break
        if match is None:
            print(f"  skipped {f.name}: no matching holdout case")
            continue
        kind = "final" if "final" in name else "ml"
        meas = [match["inputs"][d] for d in DEFL]
        calc = [out["defl"].get(float(x)) for x in ERAPAVE_X_CM]
        err = [(c / m - 1) * 100 for c, m in zip(calc, meas)]
        found.setdefault(match["id"], {})[kind] = {
            "file": f.name,
            "E": [round(e, 1) for e in out["E"]],
            "deflections": [round(v, 2) for v in calc],
            "error_pct": [round(e, 2) for e in err],
            "rms_pct": round(float(np.sqrt(np.mean(np.square(err)))), 2),
            "rmse_um": round(float(np.sqrt(np.mean(np.square(np.array(calc) - np.array(meas))))), 2),
        }
        print(f"  {f.name} -> {match['id']} ({kind})")
    return found


# ------------------------------------------------------------------ holdout cases
def build_holdout():
    if not HOLDOUT.exists():
        print(f"skipped holdout.json: {HOLDOUT.relative_to(ROOT)} not found (run train.py first)")
        return
    h = pd.read_csv(HOLDOUT).sort_values(["survey", "row_index"])
    full = pd.read_csv(DATASET)[["row_index", "survey", "rms_pct"]]
    h = h.merge(full, on=["row_index", "survey"], how="left")
    cases = []
    for r in h.itertuples():
        cases.append({
            "id": f"holdout-{r.row_index}-{r.survey}",
            "label": f"Row {r.row_index}, survey {r.survey} ({SURVEYS.get(r.survey, '')}, road {road_of(r.key)})",
            "inputs": {c: round(float(getattr(r, c)), 2) for c in DEFL + ["thk1_mm", "thk2_mm", "thk3_mm"]},
            "backcalc": {e: int(getattr(r, e)) for e in LIMITS},
            "backcalc_rms": None if pd.isna(r.rms_pct) else round(float(r.rms_pct), 2),
        })
    checks = erapave_checks(cases)
    for c in cases:
        if c["id"] in checks:
            c["erapave"] = checks[c["id"]]
    ml = [c["erapave"]["ml"]["rms_pct"] for c in cases if "ml" in c.get("erapave", {})]
    summary = None
    if ml:
        summary = {"cases": len(ml), "median_rms_pct": round(float(np.median(ml)), 2),
                   "within_3": int(sum(v <= 3 for v in ml)), "within_5": int(sum(v <= 5 for v in ml))}
        print(f"  ERAPave check: {len(ml)} cases, median RMS {summary['median_rms_pct']}%")
    write("holdout.json", {"note": "Never used for training or testing the model.",
                           "erapave_summary": summary, "cases": cases})


if __name__ == "__main__":
    build_dataset()
    build_layers()
    build_bounds()
    build_holdout()
