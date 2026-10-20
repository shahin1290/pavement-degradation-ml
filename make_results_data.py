"""
Build the JSON files shown on the frontend "Results" page.

Reads (from data/):
  backcalc_rows0-7050_full.csv                  all backcalculated cases = ML training data
                                                (deflections corrected to 20 C with the own-data coefficients,
                                                 compromise limits)
  backcalc_full_with_vs_without_limits.csv      the same cases, with vs without limits
  before_tempcorr/                              the run before the correction (original bowls, old limits)
  limits_compare/, limits_compare_own/          all limit options, Park statewide / own-data correction

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

DATASET = DATA / "backcalc_rows0-7050_full.csv"                    # training data (own-data correction, compromise)
BOUNDS_FULL = DATA / "backcalc_full_with_vs_without_limits.csv"   # all cases, with vs without limits
BEFORE_DIR = DATA / "before_tempcorr"                              # original bowls, old limits
BEFORE_DATASET = BEFORE_DIR / "backcalc_rows0-7050_full.csv"
BEFORE_BOUNDS = BEFORE_DIR / "backcalc_full_with_vs_without_limits.csv"
HOLDOUT = ROOT / "artifacts" / "holdout.csv"
ERAPAVE_DIR = DATA / "erapave_holdout"

DEFL = ["D0", "D130", "D215", "D300", "D450", "D600", "D900", "D1200", "D1500"]
SURVEYS = {1: "Aug 2022", 2: "Sep 2023", 3: "May 2024", 4: "Sep 2024"}
LIMITS = {"E1": (1500, 10000), "E2": (100, 1000), "E3": (50, 1000), "E4": (30, 2000)}   # compromise limits
BEFORE_LIMITS = {"E1": (1500, 8000), "E2": (100, 3000), "E3": (50, 600), "E4": (30, 400)}  # old limits
TRAIN_LABEL = "Training data: deflections corrected to 20 °C (own-data coefficients), compromise limits"


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
def build_dataset(src=DATASET, out="dataset.json", limits=LIMITS, label=TRAIN_LABEL):
    """All backcalculated cases in compact column form (one file per limit option)."""
    d = pd.read_csv(src).sort_values(["row_index", "survey"])
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
            **{f"{e}_median": int(g.loc[g.poor_fit == 0, e].median()) for e in limits},
        })
    total = {"cases": int(len(d)), "good_fit": int((d.poor_fit == 0).sum()),
             "poor_fit": int(d.poor_fit.sum()), "position_mismatch": int(d.position_mismatch.sum()),
             "median_rms": round(float(d.rms_pct.median()), 2), "roads": int(d.road.nunique())}
    write(out, {"label": label, "surveys": SURVEYS, "limits": limits, "total": total,
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
            **{f"{e}_{side}": int((m & ((g[f"{e}_no_limits"] < lo * 0.98) if side == "below" else
                                         (g[f"{e}_no_limits"] > hi * 1.02))).sum())
               for e, (lo, hi) in LIMITS.items() for side in ("below", "above")},
        }

    return {
        **count(d, u),
        "by_survey": [{"survey": int(s), "date": SURVEYS[int(s)], **count(g, u[g.index])} for s, g in d.groupby("survey")],
        "by_road": sorted(
            [{"road": r, "km": round(g.row_index.nunique() * 0.02, 1), **count(g, u[g.index])}
             for r, g in d.groupby(d.key.map(road_of))],
            key=lambda x: -x["unrealistic_pct"]),
    }


# Clear unrealistic examples: both answers fit the measured bowl within 3 %.
# Picked automatically: for each way a layer can be clearly impossible, the case with the best fits (one per road).
def unrealistic_examples(n_max=6):
    d = pd.read_csv(BOUNDS_FULL)
    d = d[d.unrealistic_without_limits.astype(bool) & (d.rms_no_limits_pct <= 3) & (d.rms_limits_pct <= 3)]
    d = d.assign(worst=d[["rms_no_limits_pct", "rms_limits_pct"]].max(axis=1)).sort_values(["worst", "row_index", "survey"])
    E = list(LIMITS)
    out, used = [], set()
    for e, (lo, hi) in LIMITS.items():
        for side in ("above", "below"):
            col = d[f"{e}_no_limits"]
            m = (col > hi * 1.5) if side == "above" else (col < lo / 1.5)     # clearly outside (factor 1.5)
            for r in d[m].itertuples():
                road = road_of(r.key)
                if road in used:
                    continue
                used.add(road)
                out.append({
                    "row_index": int(r.row_index), "survey": int(r.survey), "date": SURVEYS[int(r.survey)], "road": road,
                    "no_limits": [int(getattr(r, f"{x}_no_limits")) for x in E], "rms_no_limits": round(float(r.rms_no_limits_pct), 1),
                    "limits": [int(getattr(r, f"{x}_limits")) for x in E], "rms_limits": round(float(r.rms_limits_pct), 1),
                })
                break
            if len(out) >= n_max:
                return out
    return out


def build_bounds():
    """With vs without limits, all Östergötland cases."""
    full = unrealistic_full()
    if full is None:
        print(f"skipped bounds.json: {BOUNDS_FULL.relative_to(ROOT)} not found")
        return
    write("bounds.json", {
        "limits": LIMITS,
        "full": full,
        "examples": unrealistic_examples(),
        "ml_filter_test": ML_FILTER_TEST,
    })


# ------------------------------------------------------------------ ERAPave output files
# ------------------------------------------------------------------ limit options (temperature-corrected bowls)
LIMIT_OPTIONS = [                         # id, label, limits (MPa)
    ("new", "New", {"E1": (1500, 10000), "E2": (200, 1000), "E3": (100, 1000), "E4": (30, 2000)}),
    ("comp", "Compromise", {"E1": (1500, 10000), "E2": (100, 1000), "E3": (50, 1000), "E4": (30, 2000)}),
]
# Temperature corrections: id, label, folder with the step2_limits.py files, json suffix ("" keeps the old file names)
CORRECTIONS = [
    ("state", "Park statewide (C0 = 4.65E-05, A = -5.47E-08)", DATA / "limits_compare", ""),
    ("own", "Own data (C0 = 2.45E-05, A = -8.24E-08)", DATA / "limits_compare_own", "_own"),
]


def _option_summary(t, w, limits):
    """Usable / at-limit / unrealistic shares for one limit option, overall, per survey and per road."""
    t = t.assign(road=t.key.map(road_of), usable=t.rms_pct <= 5, at_lim=t.at_limit.fillna("") != "")
    w = w.assign(road=w.key.map(road_of))

    def shares(tt, ww):
        return {"bowls": int(len(tt)), "usable": int(tt.usable.sum()), "usable_pct": pct(tt.usable),
                "usable7_pct": pct(tt.rms_pct <= 7), "at_limit_pct": pct(tt.at_lim),
                "unrealistic_pct": pct(ww.unrealistic_without_limits)}

    hits = t.at_limit.fillna("").str.split(";").explode()
    good = t[t.usable]
    roads = []
    for r, g in t.groupby("road"):
        if len(g) >= 300:
            roads.append({"road": r, "km": round(g.row_index.nunique() * 0.02, 1), **shares(g, w[w.road == r])})
    return {
        "limits": limits,
        "total": shares(t, w),
        "by_survey": [{"survey": int(s), "date": SURVEYS[int(s)], **shares(g, w[w.survey == s])} for s, g in t.groupby("survey")],
        "by_road": sorted(roads, key=lambda x: x["usable_pct"]),
        "limit_hits": {k: int(v) for k, v in hits[hits != ""].value_counts().items()},
        "median": {e: int(good[e].median()) for e in LIMITS},
    }


def build_option_datasets():
    """dataset<suffix>_<id>.json for each correction and limit option, for the cases table."""
    for cid, clabel, folder, suf in CORRECTIONS:
        for oid, label, limits in LIMIT_OPTIONS:
            src = folder / f"backcalc_tempcorr_{oid}_full.csv"
            if src.exists():
                build_dataset(src, f"dataset{suf}_{oid}.json", limits,
                              f"{label} limits, deflections corrected to 20 °C ({clabel})")


def build_limits_compare():
    """limits_compare<suffix>.json for each temperature correction."""
    baseline = None
    if BEFORE_DATASET.exists() and BEFORE_BOUNDS.exists():
        baseline = {"label": "Before (original bowls, old limits)",
                    **_option_summary(pd.read_csv(BEFORE_DATASET), pd.read_csv(BEFORE_BOUNDS), BEFORE_LIMITS)}
    for cid, clabel, folder, suf in CORRECTIONS:
        if not folder.exists():
            print(f"skipped limits_compare{suf}.json: {folder.relative_to(ROOT)} not found")
            continue
        options = []
        for oid, label, limits in LIMIT_OPTIONS:
            tp = folder / f"backcalc_tempcorr_{oid}_full.csv"
            wp = folder / f"backcalc_full_with_vs_without_limits_{oid}.csv"
            if not (tp.exists() and wp.exists()):
                print(f"  limits_compare{suf}: {oid} files missing, skipped")
                continue
            options.append({"id": oid, "label": label, **_option_summary(pd.read_csv(tp), pd.read_csv(wp), limits)})
        write(f"limits_compare{suf}.json", {"correction": cid, "correction_label": clabel,
                                           "note": f"Deflections temperature-corrected to 20 C with Park et al. (2002), "
                                                   f"{clabel}; all bowls backcalculated again; only the limits differ.",
                                           "options": options, "baseline": baseline})


def _e1_trend(t):
    """Change of E1 (%) per +1 C at the same location (usable bowls, location means removed)."""
    g = t[t.rms_pct <= 5]
    g = g[g.groupby("row_index").row_index.transform("size") >= 2]
    l = np.log(g.E1) - np.log(g.E1).groupby(g.row_index).transform("mean")
    T = g.asphalt_temp_C - g.groupby("row_index").asphalt_temp_C.transform("mean")
    return round(100 * (np.exp((l * T).sum() / (T * T).sum()) - 1), 1)


def build_temp_correction():
    """temp_correction.json: how much each correction changes the deflections, own vs Park statewide (compromise run)."""
    if not BEFORE_DATASET.exists():
        print(f"skipped temp_correction.json: {BEFORE_DATASET.relative_to(ROOT)} not found")
        return
    orig = pd.read_csv(BEFORE_DATASET).sort_values(["row_index", "survey"]).reset_index(drop=True)
    runs = {}
    for cid, clabel, folder, suf in CORRECTIONS:
        f = folder / "backcalc_tempcorr_comp_full.csv"
        if f.exists():
            runs[cid] = (clabel, pd.read_csv(f).sort_values(["row_index", "survey"]).reset_index(drop=True))
    if not runs:
        print("skipped temp_correction.json: no corrected runs found")
        return
    change = {cid: {d: 100 * (t[d].abs() / orig[d].abs() - 1) for d in DEFL} for cid, (_, t) in runs.items()}
    T = orig.asphalt_temp_C
    by_sensor = []
    for d, r in zip(DEFL, [0, 130, 215, 300, 450, 600, 900, 1200, 1500]):
        row = {"sensor": d, "r_mm": r}
        for cid, ch in change.items():
            c = ch[d]
            row[cid] = {"median": round(float(c.median()), 2), "p10": round(float(c.quantile(0.1)), 2),
                        "p90": round(float(c.quantile(0.9)), 2), "corrected_pct": pct(c.abs() > 0.01)}
        by_sensor.append(row)
    by_survey = []
    for s in sorted(orig.survey.unique()):
        m = orig.survey == s
        by_survey.append({"survey": int(s), "date": SURVEYS[int(s)], "T_median": round(float(T[m].median()), 1),
                          **{cid: round(float(ch["D0"][m].median()), 2) for cid, ch in change.items()}})
    by_temp = []
    for tb in range(int(np.floor(T.min())), int(np.ceil(T.max()))):
        m = (T >= tb) & (T < tb + 1)
        if m.sum() >= 30:
            by_temp.append({"T": tb + 0.5, "n": int(m.sum()),
                            **{cid: round(float(ch["D0"][m].median()), 2) for cid, ch in change.items()}})
    e1 = [{"id": "none", "label": "No correction (original bowls, old limits)", "pct": _e1_trend(orig),
           "median_E1": int(orig[orig.rms_pct <= 5].E1.median())}]
    for cid, (clabel, t) in runs.items():
        e1.append({"id": cid, "label": clabel, "pct": _e1_trend(t), "median_E1": int(t[t.rms_pct <= 5].E1.median())})
    simple = []
    for s_, m in [(int(s), orig.survey == s) for s in sorted(orig.survey.unique())] + [(0, orig.survey > 0)]:
        row = {"survey": s_, "date": SURVEYS.get(s_, "All surveys"), "T_median": round(float(T[m].median()), 1),
               "before": round(float(orig.D0[m].abs().median()), 1)}
        for cid, (_, t) in runs.items():
            row[cid] = round(float(t.D0[m].abs().median()), 1)
            row[cid + "_pct"] = round(float(change[cid]["D0"][m].median()), 1)
        simple.append(row)
    example = None
    EX_ROW = 6619                                          # a typical location (all 4 surveys fit well, no limit hit)
    ex = orig[orig.row_index == EX_ROW].sort_values("asphalt_temp_C")
    if len(ex) == 4:
        rows_ex = []
        for r in ex.itertuples():
            row = {"survey": int(r.survey), "date": SURVEYS[int(r.survey)], "T": round(float(r.asphalt_temp_C), 1), "none": int(r.E1)}
            for cid, (_, t) in runs.items():
                row[cid] = int(t[(t.row_index == EX_ROW) & (t.survey == r.survey)].E1.iloc[0])
            rows_ex.append(row)
        example = {"row_index": EX_ROW, "road_key": ex.key.iloc[0], "thk1_mm": round(float(ex.thk1_mm.iloc[0])), "rows": rows_ex}
    write("temp_correction.json", {
        "simple": simple, "example": example,
        "corrections": [{"id": cid, "label": lab} for cid, (lab, _) in runs.items()],
        "by_sensor": by_sensor, "by_survey": by_survey, "by_temp": by_temp, "e1_trend": e1,
        "note": "Change = corrected / measured - 1. Median over all bowls. E1 trends from the compromise-limit runs."})


# ------------------------------------------------------------------ how C0 was calculated (step by step)
C0_EXAMPLE_LOCATIONS = [1220, 2830, 6856]     # 3 locations x 4 surveys, only to show the arithmetic
C0_SENSORS = [("D0", 0), ("D130", 130), ("D215", 215), ("D300", 300)]


def _two_way(v, loc, surv):
    """x* = x - location mean - survey mean + overall mean (all locations have all 4 surveys)."""
    return v - v.groupby(loc).transform("mean") - v.groupby(surv).transform("mean") + v.mean()


def build_c0_calc():
    """c0_calc.json: the C0 / A calculation (Park et al. 2002, Eq. 2, 6, 7) on the original bowls."""
    if not BEFORE_DATASET.exists():
        print(f"skipped c0_calc.json: {BEFORE_DATASET.relative_to(ROOT)} not found")
        return
    d = pd.read_csv(BEFORE_DATASET).sort_values(["row_index", "survey"]).reset_index(drop=True)
    d = d[d.groupby("row_index").survey.transform("nunique") == 4]

    # ---- worked example
    e = d[d.row_index.isin(C0_EXAMPLE_LOCATIONS)].copy()
    e["y"] = np.log10(e.D0.abs()); e["x"] = e.thk1_mm * (e.asphalt_temp_C - 20)
    lm = e.groupby("row_index")[["x", "y"]].mean(); sm = e.groupby("survey")[["x", "y"]].mean(); gm = e[["x", "y"]].mean()
    e["xst"] = _two_way(e.x, e.row_index, e.survey); e["yst"] = _two_way(e.y, e.row_index, e.survey)
    rows = [{"loc": int(r.row_index), "survey": int(r.survey), "date": SURVEYS[int(r.survey)],
             "H": round(float(r.thk1_mm), 2), "T": round(float(r.asphalt_temp_C), 1), "D0": round(float(abs(r.D0)), 3),
             "y": round(float(r.y), 5), "x": round(float(r.x), 1),
             "lx": round(float(lm.x[r.row_index]), 1), "ly": round(float(lm.y[r.row_index]), 5),
             "sx": round(float(sm.x[r.survey]), 1), "sy": round(float(sm.y[r.survey]), 5),
             "xs": round(float(r.xst), 1), "ys": round(float(r.yst), 5),
             "xy": round(float(r.xst * r.yst), 4), "xx": round(float(r.xst ** 2), 1)} for r in e.itertuples()]
    sxy, sxx = float((e.xst * e.yst).sum()), float((e.xst ** 2).sum())
    example = {"rows": rows,
               "loc_means": [{"loc": int(k), "x": round(float(v.x), 1), "y": round(float(v.y), 5)} for k, v in lm.iterrows()],
               "survey_means": [{"survey": int(k), "date": SURVEYS[int(k)], "x": round(float(v.x), 1), "y": round(float(v.y), 5)}
                                for k, v in sm.iterrows()],
               "all_mean": {"x": round(float(gm.x), 1), "y": round(float(gm.y), 5)},
               "sum_xy": round(sxy, 4), "sum_xx": round(sxx, 1), "C": sxy / sxx}

    # ---- full data, each sensor (90% range: standard error clustered by location)
    xs = _two_way(d.thk1_mm * (d.asphalt_temp_C - 20), d.row_index, d.survey)
    sensors = []
    for name, r in C0_SENSORS:
        ys = _two_way(np.log10(d[name].abs()), d.row_index, d.survey)
        C = float((xs * ys).sum() / (xs ** 2).sum())
        g = (xs * (ys - C * xs)).groupby(d.row_index).sum()
        se = float(np.sqrt((g ** 2).sum()) / (xs ** 2).sum())
        sensors.append({"sensor": name, "r": r, "C": C, "lo": C - 1.645 * se, "hi": C + 1.645 * se})
    rr = np.array([s_["r"] for s_ in sensors], float); cc = np.array([s_["C"] for s_ in sensors])
    dr, dc = rr - rr.mean(), cc - cc.mean()
    A = float((dr * dc).sum() / (dr ** 2).sum()); C0 = float(cc.mean() - A * rr.mean())
    line = {"r_mean": float(rr.mean()), "C_mean": float(cc.mean()),
            "rows": [{"sensor": s_["sensor"], "r": s_["r"], "C": s_["C"], "dr": float(a), "dc": float(b)}
                     for s_, a, b in zip(sensors, dr, dc)],
            "sum_drdc": float((dr * dc).sum()), "sum_drdr": float((dr ** 2).sum()), "A": A, "C0": C0}
    write("c0_calc.json", {"bowls": int(len(d)), "locations": int(d.row_index.nunique()),
                           "example": example, "sensors": sensors, "line": line,
                           "park": [{"name": "Statewide", "C0": 4.65e-5, "A": -5.47e-8}, {"name": "East", "C0": 3.61e-5, "A": -5.72e-8},
                                    {"name": "Central", "C0": 5.80e-5, "A": -5.62e-8}, {"name": "West", "C0": 4.32e-5, "A": -5.07e-8}]})


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
    if BEFORE_DATASET.exists():
        build_dataset(BEFORE_DATASET, "dataset_before.json", BEFORE_LIMITS, "Before (original bowls, old limits)")
    build_bounds()
    build_holdout()
    build_limits_compare()
    build_option_datasets()
    build_temp_correction()
    build_c0_calc()
