"""
Build the website files for Västergötland (frontend/public/results/vg/), next to the Östergötland ones.

Reads (from data/):
  backcalc_vg_full.csv                               backcalculation (own-data correction C0 = 3.12E-05, A = -1.01E-07,
                                                     compromise limits)
  Uttag_temp_korr 20m_Västergötland_260910.xlsx      original Excel (measured bowls before the correction)

Writes (to frontend/public/results/vg/):
  dataset.json           every case (tabs "Backcalculated cases", "Road profiles", "How the data was built")
  c0_calc.json           the C0 / A calculation on the original bowls
  temp_correction.json   what the correction does to the deflections and to E1
                         (only "own data": the original bowls were not backcalculated for Västergötland)

Not made for Västergötland (these need extra backcalculation runs):
  bounds.json, limits_compare_own.json (runs without limits and with other limit sets), holdout.json (ML model)

The other two Västergötland files are made by their own scripts:
  soil_effect.py --backcalc data/backcalc_vg_full.csv --excel "data/Uttag_temp_korr 20m_Västergötland_260910.xlsx"
                 --json frontend/public/results/vg/soil_effect.json --outdir data/soil_effect_vg
  strain/calc_strains_all.py --backcalc data/backcalc_vg_full.csv --out data/strains_vg.csv
  strain/strain_analysis.py --strains data/strains_vg.csv --backcalc data/backcalc_vg_full.csv
                 --excel "data/Uttag_temp_korr 20m_Västergötland_260910.xlsx" --out data/strain_analysis_vg
                 --json frontend/public/results/vg/strain_condition.json

Run from the project root:  uv run python make_results_vg.py
"""
import numpy as np
import pandas as pd

import make_results_data as mrd

REGION = "Västergötland"
BACKCALC = mrd.DATA / "backcalc_vg_full.csv"
EXCEL = mrd.DATA / "Uttag_temp_korr 20m_Västergötland_260910.xlsx"
ORIGINAL_BOWLS = mrd.DATA / "vg_original_bowls.csv"      # written here: measured bowls in the backcalc layout
C0, A = 3.12e-05, -1.01e-07
OWN_LABEL = f"Own data (C0 = {C0:.2E}, A = {A:.2E})"
SENSOR_COLS = {"D0": "D00001", "D130": "D0130", "D215": "D0215", "D300": "D0300", "D450": "D0450",
               "D600": "D0600", "D900": "D0900", "D1200": "D1200", "D1500": "D1500"}

mrd.OUT = mrd.OUT / "vg"


def survey_dates(d):
    dates = d.groupby("survey").survey_date.agg(lambda v: v.mode().iat[0])
    return {int(k): pd.to_datetime(v).strftime("%b %Y") for k, v in dates.items()}


def original_bowls():
    """Measured (not corrected) bowls from the Excel, one row per location and survey, same columns as the backcalc."""
    x = pd.read_excel(EXCEL, sheet_name="Uttag_temp_korr")
    rows = []
    for s in (1, 2, 3, 4):
        p = f"Medelförtsd_{s}_"
        t = pd.DataFrame({"row_index": np.arange(len(x)), "key": x.Nyckel, "survey": s,
                          "asphalt_temp_C": x[p + "BELLS_TEMP"], "thk1_mm": x["Medelförmst_Layer_1_thk"] * 1000})
        for name, col in SENSOR_COLS.items():
            t[name] = x[p + col].abs()
        rows.append(t)
    o = pd.concat(rows).dropna()
    o = o[(o[list(SENSOR_COLS)] > 0).all(axis=1)]
    o.to_csv(ORIGINAL_BOWLS, index=False)
    return o


def pick_locations(run, n):
    """Typical locations: all 4 surveys usable, no modulus at a limit, widest temperature range first."""
    g = run.groupby("row_index")
    ok = g.filter(lambda v: len(v) == 4 and (v.rms_pct <= 5).all() and (v.at_limit.fillna("") == "").all())
    span = ok.groupby("row_index").asphalt_temp_C.agg(lambda v: v.max() - v.min()).sort_values(ascending=False)
    return [int(i) for i in span.index[:n]]


def typical_example(t):
    """Example location for the temperature tab: wide temperature range (top quarter), and an E1 change from the
    coldest to the warmest survey close to the median change of all such locations (so it is typical, not chosen)."""
    g = t[t.row_index.isin(pick_locations(t, 10 ** 6))].sort_values("asphalt_temp_C")
    f = g.groupby("row_index").agg(span=("asphalt_temp_C", lambda v: v.max() - v.min()),
                                   ch=("E1", lambda v: np.log(v.iloc[-1] / v.iloc[0])))
    f = f[f.span >= f.span.quantile(0.75)]
    return [int((f.ch - f.ch.median()).abs().idxmin())] if len(f) else []


def build_c0_calc(orig, run):
    mrd.BEFORE_DATASET = ORIGINAL_BOWLS
    mrd.C0_EXAMPLE_LOCATIONS = pick_locations(run, 3)
    mrd.build_c0_calc()


def build_temp_correction(orig, run):
    """Same content as make_results_data.build_temp_correction, for the own-data correction only."""
    t = run.sort_values(["row_index", "survey"]).reset_index(drop=True)
    o = t[["row_index", "survey"]].merge(orig, on=["row_index", "survey"], how="left")
    keep = o.D0.notna().values
    t, o = t[keep].reset_index(drop=True), o[keep].reset_index(drop=True)
    DEFL = mrd.DEFL
    change = {d: 100 * (t[d].abs() / o[d].abs() - 1) for d in DEFL}
    T = o.asphalt_temp_C
    S = mrd.SURVEYS

    by_sensor = []
    for d, r in zip(DEFL, [0, 130, 215, 300, 450, 600, 900, 1200, 1500]):
        c = change[d]
        by_sensor.append({"sensor": d, "r_mm": r, "own": {"median": round(float(c.median()), 2),
                          "p10": round(float(c.quantile(0.1)), 2), "p90": round(float(c.quantile(0.9)), 2),
                          "corrected_pct": mrd.pct(c.abs() > 0.01)}})
    by_survey = [{"survey": int(s), "date": S[int(s)], "T_median": round(float(T[o.survey == s].median()), 1),
                  "own": round(float(change["D0"][o.survey == s].median()), 2)} for s in sorted(o.survey.unique())]
    by_temp = []
    for tb in range(int(np.floor(T.min())), int(np.ceil(T.max()))):
        m = (T >= tb) & (T < tb + 1)
        if m.sum() >= 30:
            by_temp.append({"T": tb + 0.5, "n": int(m.sum()), "own": round(float(change["D0"][m].median()), 2)})
    simple = []
    for s_, m in [(int(s), o.survey == s) for s in sorted(o.survey.unique())] + [(0, o.survey > 0)]:
        simple.append({"survey": s_, "date": S.get(s_, "All surveys"), "T_median": round(float(T[m].median()), 1),
                       "before": round(float(o.D0[m].median()), 1), "own": round(float(t.D0[m].abs().median()), 1),
                       "own_pct": round(float(change["D0"][m].median()), 1)})

    e1 = [{"id": "own", "label": OWN_LABEL, "pct": mrd._e1_trend(t), "median_E1": int(t[t.rms_pct <= 5].E1.median())}]

    ex_row = typical_example(t)
    example = None
    if ex_row:
        ex = t[t.row_index == ex_row[0]].sort_values("asphalt_temp_C")
        example = {"row_index": ex_row[0], "road_key": ex.key.iloc[0], "thk1_mm": round(float(ex.thk1_mm.iloc[0])),
                   "rows": [{"survey": int(r.survey), "date": S[int(r.survey)], "T": round(float(r.asphalt_temp_C), 1),
                             "own": int(r.E1)} for r in ex.itertuples()]}

    def e1_bins(t):
        g = t[t.rms_pct <= 5].copy()
        g = g[g.groupby("row_index").row_index.transform("size") >= 2]
        l = np.log(g.E1)
        g["E1n"] = np.exp(l - l.groupby(g.row_index).transform("mean") + l.mean())
        g["Tb"] = np.floor(g.asphalt_temp_C) + 0.5
        q = g.groupby("Tb").E1n.agg(["size", "median", lambda x: x.quantile(0.25), lambda x: x.quantile(0.75)])
        q.columns = ["n", "med", "q25", "q75"]
        q = q[q.n >= 100]
        return [{"T": float(k), "n": int(r.n), "med": int(r.med), "band": [int(r.q25), int(r.q75)]} for k, r in q.iterrows()]

    def e1_dt(t):
        g = t[t.rms_pct <= 5].copy()
        g = g[g.groupby("row_index").row_index.transform("size") >= 2]
        l, x = np.log(g.E1), g.asphalt_temp_C.astype(float)
        for _ in range(30):
            l = l - l.groupby(g.row_index).transform("mean"); l = l - l.groupby(g.survey).transform("mean")
            x = x - x.groupby(g.row_index).transform("mean"); x = x - x.groupby(g.survey).transform("mean")
        slope = 100 * (np.exp((l * x).sum() / (x * x).sum()) - 1)
        d = pd.DataFrame({"b": x.round(), "y": 100 * (np.exp(l) - 1)})
        q = d.groupby("b").y.agg(["size", "median"])
        q = q[q["size"] >= 200]
        return {"pct_per_C": round(float(slope), 1),
                "points": [{"dT": float(k) + 0.0, "n": int(r["size"]), "med": round(float(r["median"]), 1)} for k, r in q.iterrows()]}

    e1_vs_dt = {"own": e1_dt(t)}
    pts = e1_vs_dt["own"]["points"]
    e1_vs_dt["erlingsson"] = [{"dT": float(x), "pct": round(float(100 * (np.exp(-0.065 * x) - 1)), 1)}
                              for x in np.arange(min(p["dT"] for p in pts), max(p["dT"] for p in pts) + 0.01, 0.5)]
    e1_vs_temp = {"own": e1_bins(t), "erlingsson": [{"T": float(x), "E": int(round(6500 * np.exp(-0.065 * (x - 10))))}
                                                    for x in np.arange(17, 32.01, 0.5)]}
    mrd.write("temp_correction.json", {
        "simple": simple, "example": example, "e1_vs_temp": e1_vs_temp, "e1_vs_dt": e1_vs_dt,
        "corrections": [{"id": "own", "label": OWN_LABEL}],
        "by_sensor": by_sensor, "by_survey": by_survey, "by_temp": by_temp, "e1_trend": e1,
        "no_uncorrected_run": True,
        "note": "Change = corrected / measured - 1. Median over all bowls. Only the own-data correction was backcalculated "
                "for Västergötland, so there is no 'no correction' E1 to compare with."})


def main():
    run = pd.read_csv(BACKCALC)
    mrd.SURVEYS = survey_dates(run)
    mrd.build_dataset(src=BACKCALC, out="dataset.json",
                      label=f"{REGION}: deflections corrected to 20 °C (own-data coefficients), compromise limits")
    orig = original_bowls()
    build_c0_calc(orig, run)
    build_temp_correction(orig, run)
    print("Other Västergötland files: see the docstring (soil_effect.py and strain/strain_analysis.py).")


if __name__ == "__main__":
    main()
