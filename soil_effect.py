"""Road factors and soil type vs the backcalculated layer moduli, with robustness checks.

Question: which parameters from the Excel go together with the layer stiffness, and which results are robust?

Data
  - one value per location = geometric mean of E1..E4 over its usable surveys (fit error <= 5%), at least 2 surveys
  - parameters from the Excel: soil type, layer thicknesses, heavy traffic (TAADT), ditch depth, ghum_max

Model (one per layer):  log(E) = b0 + thickness + log2(heavy traffic) + ditch + ghum_max + soil type (0/1, glacial clay = reference)
  effect in % = (exp(b) - 1) * 100;  standard errors clustered by 2 km road blocks (neighbouring 20 m points are not independent)

Robustness (the 7 points)
  1. Version B "within road": adds the road (section) as a factor -> soils/traffic are only compared within the same road
  2. Version C "no limit values": drops locations where this layer hit a modulus limit in any usable survey
  3. Thicknesses stay in the model as controls only (they are inputs of the backcalculation itself)
  4. Heavy traffic on a log scale: effect per doubling of heavy traffic
  5. Soils shown as adjusted typical values (same thickness/traffic/... for every soil)
  6. Robust = significant (p < 0.05) with the same sign in all three versions (A, B, C)
  7. R2 reported, plus how much of the variation is between locations vs between surveys at the same location

Run:    uv run python soil_effect.py --excel "data/Uttag_temp_korr 20m_Östergötland_260910.xlsx"
        uv run python soil_effect.py --backcalc data/backcalc_vg_full.csv --excel "data/Uttag_temp_korr 20m_Västergötland_260910.xlsx"
                --json frontend/public/results/vg/soil_effect.json --outdir data/soil_effect_vg
Writes: frontend/public/results/soil_effect.json, data/soil_effect/*.csv (or the --json / --outdir given)
"""
import argparse
import json
from pathlib import Path

import numpy as np
import pandas as pd
from scipy import stats

ROOT = Path(__file__).resolve().parent
BACKCALC = ROOT / "data" / "backcalc_rows0-7050_full.csv"        # own temperature correction, compromise limits
EXCEL = ROOT / "data" / "Uttag_temp_korr 20m_Östergötland_260910.xlsx"
OUT_JSON = ROOT / "frontend" / "public" / "results" / "soil_effect.json"
OUT_DIR = ROOT / "data" / "soil_effect"

LAYERS = ["E1", "E2", "E3", "E4"]
REFERENCE = "Glacial lera"
MIN_LOCATIONS = 150             # smaller soil groups -> "Other"
MIN_SURVEYS = 2
BLOCK_KM = 2
EXAMPLE_KEY = "5V32D11500"
VERSIONS = {"A": "Main model", "B": "Within the same road", "C": "Without limit values"}

SOIL_EN = {
    "Glacial lera": "Glacial clay", "Morän": "Moraine (till)", "Sandig morän": "Sandy moraine",
    "Isälvssediment": "Glaciofluvial sediment", "Lerig morän": "Clayey moraine", "Urberg": "Bedrock",
    "Postglacial finsand": "Postglacial fine sand", "Postglacial lera": "Postglacial clay",
    "Postglacial sand": "Postglacial sand", "Postglacial silt": "Postglacial silt", "Glacial finlera": "Glacial fine clay",
    "Other": "Other soils (mixed)",
}
# column -> (label, how the column is transformed into one "step", unit, is it only a control?)
FACTORS = {
    "thk1": ("Asphalt thickness (+10 mm)", lambda v: v / 10, "mm", True),
    "thk2": ("Base thickness (+100 mm)", lambda v: v / 100, "mm", True),
    "thk3": ("Subbase thickness (+100 mm)", lambda v: v / 100, "mm", True),
    "taadt": ("Heavy traffic (doubled)", lambda v: np.log2(v), "heavy vehicles/day", False),
    "ditch": ("Ditch depth (+1 m)", lambda v: v, "m", False),
    "ghum": ("ghum_max (+10)", lambda v: v / 10, "", False),
}


# ---------------------------------------------------------------- data
def load(backcalc_path, excel_path):
    b = pd.read_csv(backcalc_path)
    x = pd.read_excel(excel_path, sheet_name="Uttag_temp_korr")
    x["row_index"] = np.arange(len(x))
    x = x.rename(columns={"Nyckel": "excel_key", "Förstaförsoil_GJ2_tx": "soil", "Medelförpmsv4_TAADT": "taadt",
                          "Medelförmst_ditch_depth_10": "ditch", "Medelförghum_max": "ghum"})
    d = b.merge(x[["row_index", "excel_key", "soil", "taadt", "ditch", "ghum"]], on="row_index")
    assert (d.key == d.excel_key).all(), "rows of the Excel and the backcalculation do not match"
    d["usable"] = d.poor_fit == 0
    d["section"] = d.key.str.extract(r"^(.*)D\d+$")[0]
    km = d.key.str.extract(r"D(\d+)$")[0].astype(float) / 1000
    d["block"] = d.section + "_" + (km // BLOCK_KM).astype(int).astype(str)
    for e in LAYERS:
        d[f"{e}_lim"] = d.at_limit.fillna("").str.contains(e)
    return d


def per_location(d):
    u = d[d.usable]
    agg = dict(key=("key", "first"), surveys=("E1", "size"), thk1=("thk1_mm", "first"), thk2=("thk2_mm", "first"),
               thk3=("thk3_mm", "first"), taadt=("taadt", "first"), ditch=("ditch", "first"), ghum=("ghum", "first"),
               soil=("soil", "first"), block=("block", "first"), section=("section", "first"))
    agg.update({e: (e, lambda v: float(np.exp(np.log(v).mean()))) for e in LAYERS})
    agg.update({f"{e}_lim": (f"{e}_lim", "any") for e in LAYERS})
    loc = u.groupby("row_index").agg(**agg)
    loc = loc[(loc.surveys >= MIN_SURVEYS) & (loc.taadt > 0)].dropna(subset=["taadt", "ditch", "ghum", "soil"])
    counts = loc.soil.value_counts()
    loc["soil_group"] = np.where(loc.soil.isin(counts[counts >= MIN_LOCATIONS].index), loc.soil, "Other")
    return loc


def variance_split(d, loc):
    """Point 7: share of the variation in log E that is between locations (vs between surveys at one location)."""
    u = d[d.usable & d.row_index.isin(loc.index)]
    out = {}
    for e in LAYERS:
        l = np.log(u[e])
        within = (l - l.groupby(u.row_index).transform("mean")).var()
        out[e] = round(float(1 - within / l.var()), 3)
    return out


# ---------------------------------------------------------------- regression
def ols_clustered(y, X, groups):
    X, y = np.asarray(X, float), np.asarray(y, float)
    n, k = X.shape
    XtX_inv = np.linalg.pinv(X.T @ X)
    b = XtX_inv @ X.T @ y
    resid = y - X @ b
    g = pd.factorize(groups)[0]
    G = g.max() + 1
    meat = np.zeros((k, k))
    for j in range(G):
        s = X[g == j].T @ resid[g == j]
        meat += np.outer(s, s)
    V = G / (G - 1) * (n - 1) / (n - k) * XtX_inv @ meat @ XtX_inv
    se = np.sqrt(np.maximum(np.diag(V), 0))
    p = 2 * stats.t.sf(np.abs(b / np.where(se > 0, se, np.nan)), G - 1)
    r2 = 1 - resid @ resid / ((y - y.mean()) @ (y - y.mean()))
    return b, se, p, r2, G


def design(loc, soils, with_road):
    cols, names = [np.ones(len(loc))], ["intercept"]
    for c, (label, f, _, _) in FACTORS.items():
        cols.append(f(loc[c].values)); names.append(label)
    for s in soils:
        cols.append((loc.soil_group == s).astype(float).values); names.append(f"soil:{s}")
    if with_road:
        secs = sorted(loc.section.unique())
        for s in secs[1:]:
            cols.append((loc.section == s).astype(float).values); names.append(f"road:{s}")
    return np.column_stack(cols), names


def estimable(X, names, with_road, loc):
    """A factor is not estimable within roads if it (almost) never varies inside a road."""
    ok = {}
    for i, nm in enumerate(names):
        if nm == "intercept" or nm.startswith("road:"):
            continue
        if not with_road:
            ok[nm] = True; continue
        v = pd.Series(X[:, i], index=loc.index)
        within_sd = (v - v.groupby(loc.section).transform("mean")).std()
        ok[nm] = bool(within_sd > 1e-6 * (v.std() + 1e-12))
    return ok


def fit_all(loc):
    soils = [s for s in loc.soil_group.value_counts().index if s != REFERENCE]
    rows, r2, nloc, adjusted = [], {}, {}, {}
    for e in LAYERS:
        for v in VERSIONS:
            sub = loc[~loc[f"{e}_lim"]] if v == "C" else loc
            X, names = design(sub, soils, with_road=(v == "B"))
            ok = estimable(X, names, v == "B", sub)
            b, se, p, rr, G = ols_clustered(np.log(sub[e].values), X, sub.block.values)
            t = stats.t.ppf(0.975, G - 1)
            r2[(e, v)] = round(float(rr), 3); nloc[(e, v)] = int(len(sub))
            for i, nm in enumerate(names):
                if nm == "intercept" or nm.startswith("road:"):
                    continue
                good = ok[nm] and se[i] > 0
                rows.append({"layer": e, "version": v, "factor": nm, "locations": len(sub), "blocks": int(G),
                             "b": b[i] if good else np.nan, "se": se[i] if good else np.nan,
                             "effect_pct": 100 * (np.exp(b[i]) - 1) if good else np.nan,
                             "ci_low_pct": 100 * (np.exp(b[i] - t * se[i]) - 1) if good else np.nan,
                             "ci_high_pct": 100 * (np.exp(b[i] + t * se[i]) - 1) if good else np.nan,
                             "p": p[i] if good else np.nan, "significant": bool(good and p[i] < 0.05)})
            if v == "A":   # point 5: adjusted typical value per soil (all locations, soil set to s, geometric mean)
                base = X.copy()
                si = [names.index(f"soil:{s}") for s in soils]
                base[:, si] = 0
                adjusted[e] = {REFERENCE: float(np.exp((base @ b).mean()))}
                for s in soils:
                    xs = base.copy(); xs[:, names.index(f"soil:{s}")] = 1
                    adjusted[e][s] = float(np.exp((xs @ b).mean()))
    reg = pd.DataFrame(rows)
    # point 6: robust = significant and same sign in A, B and C
    key = ["layer", "factor"]
    w = reg.pivot_table(index=key, columns="version", values=["effect_pct", "significant"], aggfunc="first")
    rob = []
    for (e, f), r in w.iterrows():
        sig = [bool(r[("significant", v)]) for v in VERSIONS]
        sgn = [np.sign(r[("effect_pct", v)]) for v in VERSIONS]
        rob.append({"layer": e, "factor": f, "robust": all(sig) and len(set(sgn)) == 1})
    reg = reg.merge(pd.DataFrame(rob), on=key)
    return reg, r2, nloc, adjusted, soils


def example_key(d, loc):
    """A typical location for the worked example when EXAMPLE_KEY is not in this region:
    all 4 surveys usable, no modulus at a limit, E3 closest to the median."""
    ok = d.groupby("row_index").apply(lambda g: len(g) == 4 and g.usable.all() and (g.at_limit.fillna("") == "").all())
    cand = loc[loc.index.isin(ok[ok].index)]
    if cand.empty:
        cand = loc
    return cand.key.loc[(np.log(cand.E3) - np.log(cand.E3).median()).abs().idxmin()]


# ---------------------------------------------------------------- main
def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--backcalc", default=BACKCALC)
    ap.add_argument("--excel", default=EXCEL)
    ap.add_argument("--json", default=OUT_JSON, help="website file to write")
    ap.add_argument("--outdir", default=OUT_DIR, help="folder for the CSV tables")
    args = ap.parse_args()
    out_json, out_dir = Path(args.json), Path(args.outdir)

    d = load(args.backcalc, args.excel)
    loc = per_location(d)
    reg, r2, nloc, adjusted, soils = fit_all(loc)
    vsplit = variance_split(d, loc)
    out_dir.mkdir(parents=True, exist_ok=True)
    reg.round(5).to_csv(out_dir / "regression_all_versions.csv", index=False)
    loc.to_csv(out_dir / "locations.csv")

    def cell(e, f, v):
        q = reg[(reg.layer == e) & (reg.factor == f) & (reg.version == v)].iloc[0]
        if pd.isna(q.effect_pct):
            return None
        return {"pct": round(float(q.effect_pct), 1), "lo": round(float(q.ci_low_pct), 1),
                "hi": round(float(q.ci_high_pct), 1), "p": float(f"{q.p:.3g}"), "sig": bool(q.significant)}

    def robust(e, f):
        return bool(reg[(reg.layer == e) & (reg.factor == f)].robust.iloc[0])

    factors = []
    for c, (label, _, unit, control) in FACTORS.items():
        med = float(loc[c].median())
        f = {"id": c, "label": label, "unit": unit, "control": control, "median": round(med, 2)}
        for e in LAYERS:
            f[e] = {v: cell(e, label, v) for v in VERSIONS} | {"robust": robust(e, label)}
        factors.append(f)

    soil_rows = []
    for s in [REFERENCE] + soils:
        r = {"soil": s, "soil_en": SOIL_EN.get(s, s), "locations": int((loc.soil_group == s).sum()),
             "reference": s == REFERENCE, "mixed": s == "Other"}
        for e in LAYERS:
            r[e] = {"median": round(float(loc.loc[loc.soil_group == s, e].median())),
                    "adjusted": round(adjusted[e][s]),
                    "adjusted_pct": round(100 * (adjusted[e][s] / adjusted[e][REFERENCE] - 1), 1)}
            if s != REFERENCE:
                r[e].update({v: cell(e, f"soil:{s}", v) for v in VERSIONS})
                r[e]["robust"] = robust(e, f"soil:{s}") and s != "Other"
        soil_rows.append(r)

    ex_key = EXAMPLE_KEY if (d.key == EXAMPLE_KEY).any() else example_key(d, loc)
    ex = d[d.key == ex_key].sort_values("survey")
    example = None
    if len(ex):
        lx = loc[loc.key == ex_key]
        example = {"key": ex_key, "excel_row": int(ex.row_index.iloc[0]) + 2,
                   "soil": ex.soil.iloc[0], "soil_en": SOIL_EN.get(ex.soil.iloc[0], ex.soil.iloc[0]),
                   "thk1": round(float(ex.thk1_mm.iloc[0])), "thk2": round(float(ex.thk2_mm.iloc[0])),
                   "thk3": round(float(ex.thk3_mm.iloc[0])), "taadt": float(ex.taadt.iloc[0]),
                   "ditch": round(float(ex.ditch.iloc[0]), 2), "ghum": float(ex.ghum.iloc[0]),
                   "surveys": [{"date": r.survey_date, **{e: int(r[e]) for e in LAYERS}, "rms": round(float(r.rms_pct), 2),
                                "usable": bool(r.usable), "at_limit": r.at_limit if isinstance(r.at_limit, str) else ""}
                               for _, r in ex.iterrows()],
                   "location_value": {e: round(float(lx[e].iloc[0])) for e in LAYERS} if len(lx) else None}

    out = {"reference": REFERENCE, "reference_en": SOIL_EN[REFERENCE], "locations": int(len(loc)),
           "blocks": int(loc.block.nunique()), "roads": int(loc.section.nunique()), "block_km": BLOCK_KM,
           "min_locations": MIN_LOCATIONS, "versions": VERSIONS,
           "r2": {e: {v: r2[(e, v)] for v in VERSIONS} for e in LAYERS},
           "n": {e: {v: nloc[(e, v)] for v in VERSIONS} for e in LAYERS},
           "between_location_share": vsplit,
           "tests": int(reg[reg.version == "A"].shape[0]),
           "factors": factors, "soils": soil_rows, "example": example}
    out_json.parent.mkdir(parents=True, exist_ok=True)
    out_json.write_text(json.dumps(out, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")

    # ---------- console summary
    print(f"{len(loc)} locations, {loc.section.nunique()} roads, {loc.block.nunique()} blocks of {BLOCK_KM} km")
    for e in LAYERS:
        print(f"{e}: R2 A {r2[(e,'A')]:.2f}  B {r2[(e,'B')]:.2f}  C {r2[(e,'C')]:.2f} (C uses {nloc[(e,'C')]} locations);"
              f" between-location share of variation {vsplit[e]:.0%}")
    show = reg.copy()
    show["txt"] = show.apply(lambda r: "  n/a " if pd.isna(r.effect_pct) else f"{r.effect_pct:+5.0f}%{'*' if r.significant else ' '}", axis=1)
    t = show.pivot_table(index=["factor"], columns=["layer", "version"], values="txt", aggfunc="first")
    rb = show[show.version == "A"].pivot_table(index="factor", columns="layer", values="robust", aggfunc="first")
    pd.set_option("display.width", 250); pd.set_option("display.max_columns", 30)
    print("\n% effect per step, versions A/B/C, * = significant; R = robust in all three\n")
    for e in LAYERS:
        t[(e, "R")] = rb[e].map({True: "R", False: ""})
    print(t.sort_index(axis=1).to_string())
    print(f"\nwrote {out_json} and {out_dir}/")


if __name__ == "__main__":
    main()
