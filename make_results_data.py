"""
Build the JSON files shown on the frontend "Results" page.

Reads (from data/):
  backcalc_rows0-7050_full.csv                  all backcalculated cases (4 layers, with limits)
  backcalc_full_with_vs_without_limits.csv      all cases, with vs without limits

  artifacts/holdout.csv                          the 20 holdout cases (made by train.py)
  data/erapave_holdout/*.txt                     ERAPave output with the ML moduli for holdout cases (optional)

Writes (to frontend/public/results/):
  dataset.json   every case, compact column format
  bounds.json    with vs without limits: unrealistic moduli per survey and per road
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
BOUNDS_FULL = DATA / "backcalc_full_with_vs_without_limits.csv"   # all cases, with vs without limits
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


# ------------------------------------------------------------------ bounded vs unbounded
# ML test: model trained on bounded good fits (A) vs only the cases that are realistic
# without limits (B). Same model and features, 5-fold split by road stretch on rows 0-999.
# Score = RMS error (%) of the deflections calculated from the predicted moduli.
# "difficult" = the cases that are NOT realistic without limits.
ML_FILTER_TEST = {
    "bounded": {"train_cases": 3518, "all_rms": 3.4, "difficult_rms": 6.1, "difficult_within5": 42},
    "unbounded_realistic": {"train_cases": 2589, "all_rms": 3.6, "difficult_rms": 8.0, "difficult_within5": 31},
}


def unrealistic_full():
    """Unrealistic moduli without limits for ALL Östergötland cases (None if the file is missing).
    Unrealistic = fits the deflections without limits (RMS <= 5%) but a modulus is outside the realistic range."""
    if not BOUNDS_FULL.exists():
        return None
    d = pd.read_csv(BOUNDS_FULL)
    u = d.unrealistic_without_limits.astype(bool)

    def count(g, m):
        return {
            "cases": int(len(g)),
            "unrealistic": int(m.sum()),
            "unrealistic_pct": pct(m),
            "E1_above_8000": int((m & (g.E1_no_limits > 8000 * 1.02)).sum()),
            "E2_below_100": int((m & (g.E2_no_limits < 100 * 0.98)).sum()),
            "E4_above_400": int((m & (g.E4_no_limits > 400 * 1.02)).sum()),
        }

    return {
        **count(d, u),
        "by_survey": [{"survey": int(s), "date": SURVEYS[int(s)], **count(g, u[g.index])} for s, g in d.groupby("survey")],
        "by_road": sorted(
            [{"road": r, "km": round(g.row_index.nunique() * 0.02, 1), **count(g, u[g.index])}
             for r, g in d.groupby(d.key.map(road_of))],
            key=lambda x: -x["unrealistic_pct"]),
    }


def build_bounds():
    """With vs without limits, all Östergötland cases."""
    full = unrealistic_full()
    if full is None:
        print(f"skipped bounds.json: {BOUNDS_FULL.relative_to(ROOT)} not found")
        return
    write("bounds.json", {
        "limits": LIMITS,
        "full": full,
        "ml_filter_test": ML_FILTER_TEST,
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
    Match ERAPave output files (run with the ML moduli) to holdout cases (by file name
    rowXX_surveyY, else by thicknesses) and compare the calculated deflections with the measured ones.
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
        meas = [match["inputs"][d] for d in DEFL]
        calc = [out["defl"].get(float(x)) for x in ERAPAVE_X_CM]
        err = [(c / m - 1) * 100 for c, m in zip(calc, meas)]
        found[match["id"]] = {"ml": {
            "file": f.name,
            "E": [round(e, 1) for e in out["E"]],
            "deflections": [round(v, 2) for v in calc],
            "error_pct": [round(e, 2) for e in err],
            "rms_pct": round(float(np.sqrt(np.mean(np.square(err)))), 2),
            "rmse_um": round(float(np.sqrt(np.mean(np.square(np.array(calc) - np.array(meas))))), 2),
        }}
        print(f"  {f.name} -> {match['id']}")
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
    rms = [c["erapave"]["ml"]["rms_pct"] for c in cases if "erapave" in c]
    summary = None
    if rms:
        summary = {"cases": len(rms), "median_rms_pct": round(float(np.median(rms)), 2),
                   "within_3": int(sum(v <= 3 for v in rms)), "within_5": int(sum(v <= 5 for v in rms))}
        print(f"  ERAPave check: {len(rms)} cases, median RMS {summary['median_rms_pct']}%")
    write("holdout.json", {"note": "Never used for training or testing the model.",
                           "erapave_summary": summary, "cases": cases})


if __name__ == "__main__":
    build_dataset()
    build_bounds()
    build_holdout()
