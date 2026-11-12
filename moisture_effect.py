"""Simple moisture analysis: are the layer moduli lower in wet surveys?

Only clean bowls (fit <= 5 %, no modulus at a limit), both regions. Rain = 14-day rain before the survey
(Medelförtsd_s_PCIP_14_DAYS). It is practically the same for every location in a survey, so rain = survey day.

1. Survey table: rain, asphalt temperature and median E1-E4 per survey.
2. Same location, wettest vs driest survey: change of E1-E4 in %.
3. E vs rain: each bowl compared with its own location's normal level, median per survey.
4. Step 2 per soil group (clay / moraine and sand / bedrock / other).

Run:  uv run python moisture_effect.py
Writes data/moisture_effect/*.csv and *.png, and frontend/public/results/moisture_surveys.json (table 1, website)
"""
import json
import os

import numpy as np
import pandas as pd
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt

REGIONS = {
    "Östergötland": ("data/backcalc_rows0-7050_full.csv", "data/Uttag_temp_korr 20m_Östergötland_260910.xlsx"),
    "Västergötland": ("data/backcalc_vg_full.csv", "data/Uttag_temp_korr 20m_Västergötland_260910.xlsx"),
}
LAYERS = ["E1", "E2", "E3", "E4"]
OUT = "data/moisture_effect"
WEB = "frontend/public/results/moisture_surveys.json"


def soil_group(s):
    s = str(s).lower()
    if "urberg" in s:
        return "Bedrock"
    if "lera" in s:
        return "Clay"
    if "morän" in s or "sand" in s or "isälv" in s:
        return "Moraine / sand"
    return "Other"


def load(region, bc_path, xl_path):
    b = pd.read_csv(bc_path)
    b = b[(b.poor_fit == 0) & (b.at_limit.fillna("") == "")].copy()
    x = pd.read_excel(xl_path, sheet_name="Uttag_temp_korr")
    x["row_index"] = np.arange(len(x))
    rain = x.melt(id_vars="row_index", value_vars=[f"Medelförtsd_{s}_PCIP_14_DAYS" for s in (1, 2, 3, 4)],
                  var_name="col", value_name="rain_mm")
    rain["survey"] = rain.col.str.extract(r"_(\d)_")[0].astype(int)
    b = b.merge(rain[["row_index", "survey", "rain_mm"]], on=["row_index", "survey"])
    b = b.merge(x[["row_index", "Förstaförsoil_GJ2_tx"]].rename(columns={"Förstaförsoil_GJ2_tx": "soil"}), on="row_index")
    b["soil_group"] = b.soil.map(soil_group)
    b["region"] = region
    b["date"] = pd.to_datetime(b.survey_date).dt.strftime("%b %Y")
    return b


def main():
    os.makedirs(OUT, exist_ok=True)
    d = pd.concat([load(r, *p) for r, p in REGIONS.items()], ignore_index=True)
    print(f"{len(d):,} clean bowls ({', '.join(f'{r}: {(d.region == r).sum():,}' for r in REGIONS)})\n")

    # 1. survey table
    t1 = d.groupby(["region", "survey", "date"]).agg(bowls=("E1", "size"), rain_mm=("rain_mm", "median"),
                                                    asphalt_temp_C=("asphalt_temp_C", "median"),
                                                    **{e: (e, "median") for e in LAYERS}).round(1).reset_index()
    t1[LAYERS] = t1[LAYERS].round(0).astype(int)
    t1.to_csv(f"{OUT}/1_survey_table.csv", index=False)
    print("1. Per survey (medians of clean bowls)\n" + t1.to_string(index=False))
    os.makedirs(os.path.dirname(WEB), exist_ok=True)
    with open(WEB, "w", encoding="utf-8") as f:
        json.dump({"rows": [{"region": r.region, "survey": int(r.survey), "date": r.date, "bowls": int(r.bowls),
                             "rain_mm": round(float(r.rain_mm)), "asphalt_temp_C": float(r.asphalt_temp_C),
                             **{e: int(getattr(r, e)) for e in LAYERS}} for r in t1.itertuples()]},
                  f, ensure_ascii=False, separators=(",", ":"))

    # locations with at least 2 clean surveys; log E relative to the location's own mean
    d = d[d.groupby(["region", "row_index"]).survey.transform("size") >= 2].copy()
    for e in LAYERS:
        d[f"{e}_rel"] = np.log(d[e]) - np.log(d[e]).groupby([d.region, d.row_index]).transform("mean")

    # 2. same location, wettest vs driest clean survey
    def wet_dry(g):
        g = g.sort_values("rain_mm")
        dry, wet = g.iloc[0], g.iloc[-1]
        if wet.rain_mm - dry.rain_mm < 10:          # no real difference in rain
            return None
        return pd.Series({"rain_dry": dry.rain_mm, "rain_wet": wet.rain_mm, "soil_group": dry.soil_group,
                          **{e: 100 * (wet[e] / dry[e] - 1) for e in LAYERS}})
    wd = d.groupby(["region", "row_index"]).apply(wet_dry).dropna(how="all").reset_index()
    t2 = wd.groupby("region").agg(locations=("E1", "size"), **{e: (e, "median") for e in LAYERS}).round(0)
    t2.to_csv(f"{OUT}/2_wet_vs_dry.csv")
    print("\n2. Same location: wettest vs driest clean survey, median change in % (negative = softer when wet)\n" + t2.to_string())

    # 3. E vs rain per survey (relative to the location's normal level)
    t3 = d.groupby(["region", "survey", "date"]).agg(rain_mm=("rain_mm", "median"), bowls=("E1", "size"),
                                                    **{e: (f"{e}_rel", "median") for e in LAYERS}).reset_index()
    for e in LAYERS:
        t3[e] = (100 * (np.exp(t3[e]) - 1)).round(1)
    t3 = t3.sort_values("rain_mm")
    t3.to_csv(f"{OUT}/3_vs_rain.csv", index=False)
    print("\n3. Each survey vs the location's normal level, median % (sorted by rain)\n" + t3.to_string(index=False))

    fig, axes = plt.subplots(1, 4, figsize=(15, 3.8), sharey=True)
    for ax, e in zip(axes, LAYERS):
        for r, mk in zip(REGIONS, ["o", "s"]):
            q = t3[t3.region == r]
            ax.scatter(q.rain_mm, q[e], marker=mk, s=60, label=r)
            for _, row in q.iterrows():
                ax.annotate(row.date, (row.rain_mm, row[e]), fontsize=7, xytext=(4, 3), textcoords="offset points")
        ax.axhline(0, color="grey", lw=0.8)
        ax.set_title(e); ax.set_xlabel("Rain, 14 days before survey (mm)")
    axes[0].set_ylabel("vs location's normal (%)"); axes[0].legend(fontsize=8)
    fig.tight_layout(); fig.savefig(f"{OUT}/3_vs_rain.png", dpi=130); plt.close(fig)

    # 4. wet vs dry per soil group
    t4 = wd.groupby(["region", "soil_group"]).agg(locations=("E1", "size"), **{e: (e, "median") for e in LAYERS}).round(0)
    t4 = t4[t4.locations >= 50]
    t4.to_csv(f"{OUT}/4_wet_vs_dry_by_soil.csv")
    print("\n4. Wet vs dry by soil group, median change in % (groups with >= 50 locations)\n" + t4.to_string())
    print(f"\nwrote {OUT}/")


if __name__ == "__main__":
    main()
