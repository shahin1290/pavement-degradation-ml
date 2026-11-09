"""Three analyses on the critical strains (data/strains_all.csv from calc_strains_all.py).

1. Classification: condition classes with the Finnish limits (Saarenketo & Männistö 2024, Table 1) for
   horizontal asphalt strain, SCI200 = D0 - D200 and BCI = D900 - D1200.
2. Comparison: our strain (layered elastic, from the backcalculated moduli) vs the Swedish deflection formula
   eps = 37.4 + 0.988 D0 - 0.553 D200 - 0.502 D600  (TRVMB 114, Trafikverket 2012). TSD has no 200 mm sensor,
   so D200 is interpolated linearly between D130 and D215.
3. Damage ranking: relative damage per year = heavy vehicles/day x (strain / network median)^4
   (power law N = f * eps^-n with n = 4 and Miner's rule, as in Saliko & Erlingsson 2021), for fatigue
   (asphalt tension) and rutting (subgrade compression), averaged over 500 m road segments.

All deflections are the temperature-corrected (20 °C) ones used in the backcalculation.
Run:  uv run python strain/strain_analysis.py --excel "data/Uttag_temp_korr 20m_Östergötland_260910.xlsx"
      uv run python strain/strain_analysis.py --strains data/strains_vg.csv --backcalc data/backcalc_vg_full.csv
            --excel "data/Uttag_temp_korr 20m_Västergötland_260910.xlsx" --out data/strain_analysis_vg
            --json frontend/public/results/vg/strain_condition.json
Writes data/strain_analysis/*.csv and *.png
"""
import argparse
import json
import os

import numpy as np
import pandas as pd
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt

SURVEYS = {1: "Aug 2022", 2: "Sep 2023", 3: "May 2024", 4: "Sep 2024"}   # replaced by the dates in the data
CLASSES = ["Good", "Adequate", "Satisfactory", "Alarming", "Deteriorating"]
COLORS = ["#2e8b57", "#9acd32", "#f2c94c", "#f2994a", "#d64545"]
# Finnish limits (upper bound of each class); SCI200 and BCI have no "Good" class in the table
LIMITS = {"strain": [100, 200, 300, 400], "SCI200": [None, 250, 300, 350], "BCI": [None, 40, 60, 80]}
SEGMENT_KM = 0.5
N_EXP = 4


def classify(v, lim):
    edges = [-np.inf] + [x for x in lim if x is not None] + [np.inf]
    names = CLASSES if lim[0] is not None else CLASSES[1:]
    return pd.cut(v, edges, labels=names, right=False).astype(str)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--strains", default="data/strains_all.csv")
    ap.add_argument("--backcalc", default="data/backcalc_rows0-7050_full.csv")
    ap.add_argument("--excel", default="data/Uttag_temp_korr 20m_Östergötland_260910.xlsx")
    ap.add_argument("--out", default="data/strain_analysis")
    ap.add_argument("--json", default="frontend/public/results/strain_condition.json")
    a = ap.parse_args()
    os.makedirs(a.out, exist_ok=True)
    global SURVEYS
    dates = pd.read_csv(a.backcalc, usecols=["survey", "survey_date"]).groupby("survey").survey_date.agg(lambda v: v.mode().iat[0])
    SURVEYS = {int(k): pd.to_datetime(v).strftime("%b %Y") for k, v in dates.items()}

    s = pd.read_csv(a.strains)
    b = pd.read_csv(a.backcalc)[["row_index", "survey", "D0", "D130", "D215", "D600", "D900", "D1200"]]
    x = pd.read_excel(a.excel, sheet_name="Uttag_temp_korr", usecols=["Nyckel", "Medelförpmsv4_TAADT"])
    x["row_index"] = np.arange(len(x))
    d = s.merge(b, on=["row_index", "survey"]).merge(x.rename(columns={"Medelförpmsv4_TAADT": "taadt"}), on="row_index")
    assert (d.key == d.Nyckel).all()
    d["section"] = d.key.str.extract(r"^(.*)D\d+$")[0]
    d["road"] = d.key.str.extract(r"V([^D]+)D")[0]
    d["km"] = d.key.str.extract(r"D(\d+)$")[0].astype(float) / 1000

    # ---- indices
    d["D200"] = d.D130 + (d.D215 - d.D130) * (200 - 130) / (215 - 130)
    d["strain_eq3"] = 37.4 + 0.988 * d.D0 - 0.553 * d.D200 - 0.502 * d.D600
    d["SCI200"] = d.D0 - d.D200
    d["BCI"] = d.D900 - d.D1200
    d["class_strain_ours"] = classify(d.asphalt_tension_ue, LIMITS["strain"])
    d["class_strain_eq3"] = classify(d.strain_eq3, LIMITS["strain"])
    d["class_SCI200"] = classify(d.SCI200, LIMITS["SCI200"])
    d["class_BCI"] = classify(d.BCI, LIMITS["BCI"])

    # ---- 1. classification per survey (share of usable 20 m points = share of measured road length)
    rows = []
    for col, lab in [("class_strain_ours", "Asphalt strain (ours)"), ("class_strain_eq3", "Asphalt strain (Eq. 3)"),
                     ("class_SCI200", "SCI200"), ("class_BCI", "BCI")]:
        for sv, g in d.groupby("survey"):
            sh = g[col].value_counts(normalize=True).mul(100)
            rows.append({"index": lab, "survey": SURVEYS[sv], **{c: round(sh.get(c, 0.0), 1) for c in CLASSES}})
    cls = pd.DataFrame(rows)
    cls.to_csv(f"{a.out}/classification_by_survey.csv", index=False)
    print("1. Share of usable 20 m points per condition class (%)\n" + cls.to_string(index=False))

    fig, axs = plt.subplots(1, 4, figsize=(12, 3.4), dpi=160, sharey=True)
    for ax, lab in zip(axs, cls["index"].unique()):
        t = cls[cls["index"] == lab].set_index("survey")[CLASSES]
        left = np.zeros(len(t))
        for c, col in zip(CLASSES, COLORS):
            ax.barh(t.index, t[c], left=left, color=col, label=c); left += t[c].values
        ax.set_title(lab, fontsize=10); ax.set_xlim(0, 100); ax.invert_yaxis()
        for sp in ("top", "right"): ax.spines[sp].set_visible(False)
        ax.set_xlabel("Share of measured road (%)", fontsize=8)
    h, l = axs[0].get_legend_handles_labels()
    fig.legend(h, l, ncol=5, fontsize=8.5, frameon=False, loc="upper center")
    fig.tight_layout(rect=(0, 0, 1, 0.9)); fig.savefig(f"{a.out}/classification.png"); plt.close(fig)

    # ---- 2. comparison ours vs Eq. 3
    r = np.corrcoef(d.asphalt_tension_ue, d.strain_eq3)[0, 1]
    rs = d[["asphalt_tension_ue", "strain_eq3"]].corr(method="spearman").iloc[0, 1]
    diff = d.asphalt_tension_ue - d.strain_eq3
    same = (d.class_strain_ours == d.class_strain_eq3).mean() * 100
    near = (abs(pd.Categorical(d.class_strain_ours, CLASSES).codes - pd.Categorical(d.class_strain_eq3, CLASSES).codes) <= 1).mean() * 100
    lim = d.at_limit.notna() & (d.at_limit != "")
    r_nolim = np.corrcoef(d.loc[~lim, "asphalt_tension_ue"], d.loc[~lim, "strain_eq3"])[0, 1]
    comp = pd.DataFrame([{"bowls": len(d), "median_ours": d.asphalt_tension_ue.median(), "median_eq3": d.strain_eq3.median(),
                          "median_diff_ours_minus_eq3": diff.median(), "pearson_r": r, "spearman_r": rs,
                          "pearson_r_without_limit_bowls": r_nolim, "same_class_pct": same, "within_one_class_pct": near}]).round(3)
    comp.to_csv(f"{a.out}/comparison_eq3.csv", index=False)
    by_sv = d.groupby("survey").apply(lambda g: pd.Series({"ours": g.asphalt_tension_ue.median(), "eq3": g.strain_eq3.median(),
                                                           "r": np.corrcoef(g.asphalt_tension_ue, g.strain_eq3)[0, 1]})).round(2)
    print("\n2. Our strain vs Eq. 3\n" + comp.T.to_string(header=False) + "\nby survey:\n" + by_sv.to_string())

    fig, ax = plt.subplots(figsize=(5.2, 4.6), dpi=160)
    ax.hexbin(d.strain_eq3, d.asphalt_tension_ue, gridsize=70, bins="log", cmap="Blues", extent=(0, 800, 0, 800), mincnt=1)
    ax.plot([0, 800], [0, 800], color="#444", lw=1, ls="--", label="equal")
    for v in LIMITS["strain"]:
        ax.axvline(v, color="#bbb", lw=0.6); ax.axhline(v, color="#bbb", lw=0.6)
    ax.set_xlim(0, 800); ax.set_ylim(0, 800)
    ax.set_xlabel("Eq. 3 strain from deflections (µε)"); ax.set_ylabel("Our strain from backcalculated moduli (µε)")
    ax.set_title(f"r = {r:.2f}, {len(d):,} bowls", fontsize=10); ax.legend(frameon=False, loc="upper left")
    fig.tight_layout(); fig.savefig(f"{a.out}/comparison_eq3.png"); plt.close(fig)

    # ---- 3. damage ranking
    ref_t, ref_c = d.asphalt_tension_ue.median(), d.subgrade_compression_ue.median()
    d["fat_rel"] = (d.asphalt_tension_ue / ref_t) ** N_EXP
    d["rut_rel"] = (d.subgrade_compression_ue / ref_c) ** N_EXP
    loc = d.groupby("row_index").agg(key=("key", "first"), section=("section", "first"), road=("road", "first"), km=("km", "first"),
                                     taadt=("taadt", "first"), surveys=("survey", "size"), thk1=("thk1_mm", "first"),
                                     strain=("asphalt_tension_ue", "median"), subgrade=("subgrade_compression_ue", "median"),
                                     fat_rel=("fat_rel", "mean"), rut_rel=("rut_rel", "mean"),
                                     at_limit_share=("at_limit", lambda v: v.notna().mean()))
    loc = loc[(loc.surveys >= 2) & loc.taadt.notna()]
    loc["fatigue_damage_per_year"] = loc.taadt * 365 * loc.fat_rel
    loc["rutting_damage_per_year"] = loc.taadt * 365 * loc.rut_rel
    ref_year = loc.taadt.median() * 365          # a typical location with median traffic and median strain = 1
    loc["fatigue_index"] = loc.fatigue_damage_per_year / ref_year
    loc["rutting_index"] = loc.rutting_damage_per_year / ref_year
    loc["segment"] = loc.section + "_" + (loc.km // SEGMENT_KM).astype(int).astype(str)
    seg = loc.groupby("segment").agg(road=("road", "first"), section=("section", "first"), km_from=("km", "min"), km_to=("km", "max"),
                                     locations=("key", "size"), heavy_veh_day=("taadt", "median"), asphalt_mm=("thk1", "median"),
                                     strain_median=("strain", "median"), subgrade_median=("subgrade", "median"),
                                     fatigue_index=("fatigue_index", "mean"), rutting_index=("rutting_index", "mean"),
                                     at_limit_share=("at_limit_share", "mean"))
    seg = seg[seg.locations >= 10].copy()
    # robustness: same index without bowls that have a modulus at a limit
    nl = d[d.at_limit.isna() | (d.at_limit == "")]
    nloc = nl.groupby("row_index").agg(fat=("fat_rel", "mean"), rut=("rut_rel", "mean"), n=("survey", "size"))
    nloc = loc.join(nloc, how="inner"); nloc = nloc[nloc.n >= 2]
    nseg = nloc.assign(fi=nloc.taadt * 365 * nloc.fat / ref_year, ri=nloc.taadt * 365 * nloc.rut / ref_year) \
               .groupby("segment")[["fi", "ri"]].mean()
    seg = seg.join(nseg.rename(columns={"fi": "fatigue_index_no_limit", "ri": "rutting_index_no_limit"}))
    seg["uncertain"] = seg.at_limit_share > 0.5          # most bowls of the segment have a modulus at a limit
    seg["fatigue_rank"] = seg.fatigue_index.rank(ascending=False).astype(int)
    seg["rutting_rank"] = seg.rutting_index.rank(ascending=False).astype(int)
    seg["strain_class"] = classify(seg.strain_median, LIMITS["strain"])
    seg = seg.sort_values("fatigue_rank")
    seg.round(2).to_csv(f"{a.out}/damage_ranking_500m.csv")
    loc.round(3).to_csv(f"{a.out}/damage_per_location.csv")
    ok = seg[~seg.uncertain]
    top_f = ok.head(20); top_r = ok.sort_values("rutting_rank").head(20)
    rob = seg[["fatigue_index", "fatigue_index_no_limit", "rutting_index", "rutting_index_no_limit"]].corr(method="spearman")
    print(f"\nRanking robustness (Spearman, with vs without limit bowls): fatigue {rob.iloc[0, 1]:.2f}, rutting {rob.iloc[2, 3]:.2f};"
          f" {int(seg.uncertain.sum())} segments flagged uncertain (>50% of bowls at a limit) and left out of the top lists")
    share_top10 = seg.sort_values("fatigue_index", ascending=False).fatigue_index
    share_top10 = share_top10.head(int(len(share_top10) * 0.1)).sum() / share_top10.sum() * 100
    cols = ["road", "km_from", "km_to", "heavy_veh_day", "asphalt_mm", "strain_median", "strain_class", "fatigue_index", "at_limit_share"]
    print(f"\n3. Damage ranking: {len(seg)} segments of {SEGMENT_KM * 1000:.0f} m; the 10% worst segments carry {share_top10:.0f}% of all fatigue damage")
    print("Top 20 fatigue (index 1 = typical traffic and typical strain):\n" + top_f[cols].round(2).to_string())
    print("Top 20 rutting:\n" + top_r[["road", "km_from", "km_to", "heavy_veh_day", "subgrade_median", "rutting_index", "at_limit_share"]].round(2).to_string())

    # ---- website file (tab "Road condition")
    def shares(col, g):
        v = g[col].value_counts(normalize=True).mul(100)
        return {c: round(float(v.get(c, 0.0)), 1) for c in CLASSES}
    q1 = []
    for sv, g in d.groupby("survey"):
        q1.append({"survey": SURVEYS[sv], "ours": shares("class_strain_ours", g), "eq3": shares("class_strain_eq3", g),
                   "median_ours": round(float(g.asphalt_tension_ue.median())), "median_eq3": round(float(g.strain_eq3.median()))})
    xt = pd.crosstab(d.class_strain_ours, d.class_strain_eq3, normalize=True).mul(100).reindex(index=CLASSES, columns=CLASSES).fillna(0).round(1)
    smp = d.sample(min(1500, len(d)), random_state=0)
    order = np.sort(seg.fatigue_index.values)[::-1]
    cum = np.cumsum(order) / order.sum() * 100
    curve = [{"road_pct": round(100 * (i + 1) / len(order), 1), "damage_pct": round(float(c), 1)}
             for i, c in enumerate(cum) if (i + 1) % 3 == 0 or i == len(order) - 1]
    rowf = lambda r, kind: {"rank": int(r[f"{kind}_rank"]), "road": str(r.road), "km_from": round(float(r.km_from), 1),
                            "km_to": round(float(r.km_to) + 0.02, 1), "heavy": int(r.heavy_veh_day), "asphalt_mm": int(round(r.asphalt_mm)),
                            "strain": int(round(r.strain_median)), "subgrade": int(round(r.subgrade_median)),
                            "class": r.strain_class, "index": round(float(r[f"{kind}_index"]), 1)}
    web = {
        "bowls": int(len(d)), "classes": CLASSES, "limits": LIMITS["strain"],
        "q1": q1, "crosstab": {c: xt.loc[c].to_dict() for c in CLASSES},
        "q2": {"r": round(float(r), 2), "median_ours": round(float(d.asphalt_tension_ue.median())),
               "median_eq3": round(float(d.strain_eq3.median())),
               "slope": round(float(np.polyfit(d.strain_eq3, d.asphalt_tension_ue, 1)[0]), 2),
               "same_class": round(float(same), 0), "near_class": round(float(near), 0),
               "points": [{"eq3": round(float(p), 0), "ours": round(float(q), 0)} for p, q in zip(smp.strain_eq3, smp.asphalt_tension_ue)]},
        "q3": {"segments": int(len(seg)), "uncertain": int(seg.uncertain.sum()), "share_top10": round(float(share_top10), 0),
               "median_heavy": int(loc.taadt.median()), "ref_strain": int(round(ref_t)), "ref_subgrade": int(round(ref_c)),
               "robust_fatigue": round(float(rob.iloc[0, 1]), 2), "robust_rutting": round(float(rob.iloc[2, 3]), 2),
               "fatigue": [rowf(r, "fatigue") for _, r in ok.sort_values("fatigue_rank").head(10).iterrows()],
               "rutting": [rowf(r, "rutting") for _, r in ok.sort_values("rutting_rank").head(10).iterrows()],
               "curve": curve},
    }
    os.makedirs(os.path.dirname(a.json), exist_ok=True)
    with open(a.json, "w", encoding="utf-8") as f:
        json.dump(web, f, ensure_ascii=False, separators=(",", ":"))
    print(f"\nwrote {a.json} (website tab 'Road condition')")


if __name__ == "__main__":
    main()
