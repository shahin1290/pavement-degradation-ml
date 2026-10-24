"""Thesis figure: change of backcalculated E1 with asphalt temperature at the same location, before and after
the own-data temperature correction, and the E1 level at 20 C compared with E = 6500*exp(-0.065 (T - 10)) (Erlingsson 2012).

Each location is compared with itself and each survey day's general level is removed (two-way fixed effects),
so the figure shows the same thing as the "% per C" numbers.
Run from the project root:  uv run python fig_E1_vs_temp.py"""
import sys
from pathlib import Path
import numpy as np, pandas as pd
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt

ROOT = Path(sys.argv[1]) if len(sys.argv) > 1 else Path(".")
BEFORE = ROOT / "data/before_tempcorr/backcalc_rows0-7050_full.csv"     # original bowls
AFTER = ROOT / "data/backcalc_rows0-7050_full.csv"                      # own-data correction (training data)
OUT = Path(sys.argv[2]) if len(sys.argv) > 2 else ROOT / "figures"
OUT.mkdir(parents=True, exist_ok=True)

C_BEFORE, C_AFTER, C_REF = "#eb6834", "#2a78d6", "#52514e"    # orange, blue, neutral ink
INK, INK2, GRID, BG = "#0b0b0b", "#52514e", "#e4e3df", "#ffffff"


def same_location(t):
    """Two-way demeaned temperature (x) and E1 change in % (y); slope in % per C; median per 1 C step."""
    g = t[t.rms_pct <= 5].copy()
    g = g[g.groupby("row_index").row_index.transform("size") >= 2]
    l, x = np.log(g.E1), g.asphalt_temp_C.astype(float)
    for _ in range(30):
        l = l - l.groupby(g.row_index).transform("mean"); l = l - l.groupby(g.survey).transform("mean")
        x = x - x.groupby(g.row_index).transform("mean"); x = x - x.groupby(g.survey).transform("mean")
    slope = 100 * (np.exp((l * x).sum() / (x * x).sum()) - 1)
    d = pd.DataFrame({"b": x.round() + 0.0, "y": 100 * (np.exp(l) - 1)})
    q = d.groupby("b").y.agg(n="size", med="median", q25=lambda v: v.quantile(0.25), q75=lambda v: v.quantile(0.75))
    return q[q.n >= 200], slope, len(g)


before, after = pd.read_csv(BEFORE), pd.read_csv(AFTER)
qb, sb, nb = same_location(before)
qa, sa, na = same_location(after)

plt.rcParams.update({"font.family": "DejaVu Sans", "font.size": 10, "axes.edgecolor": INK2, "axes.labelcolor": INK,
                     "xtick.color": INK2, "ytick.color": INK2, "text.color": INK})
fig, ax = plt.subplots(figsize=(7.2, 4.4), dpi=200)
fig.patch.set_facecolor(BG); ax.set_facecolor(BG)

lo, hi = min(qb.index.min(), qa.index.min()), max(qb.index.max(), qa.index.max())
ax.axhline(0, color=INK2, lw=0.9, zorder=1)
for q, s, n, c, lab in [(qb, sb, nb, C_BEFORE, "Without correction"),
                        (qa, sa, na, C_AFTER, "Corrected to 20 °C, own coefficients")]:
    ax.plot(q.index, q.med, color=c, lw=2, marker="o", ms=5, mec="white", mew=1, zorder=3,
            label=f"{lab}: {s:+.1f}% per °C (n = {n:,})")

# level check at 20 C against the Swedish relation (Erlingsson 2012)
e20 = 6500 * np.exp(-0.065 * 10)
own20 = after[after.rms_pct <= 5].E1.median()
ax.text(0.02, 0.05, f"E1 at 20 °C:  our corrected median {own20:,.0f} MPa\n"
        f"Swedish asphalt, E = 6500·e$^{{-0.065(T-10)}}$ (Erlingsson 2012): {e20:,.0f} MPa",
        transform=ax.transAxes, fontsize=8.3, color=INK, va="bottom",
        bbox=dict(boxstyle="round,pad=0.5", fc="#f4f3ef", ec="none"))

ax.set_xlim(lo - 0.3, hi + 0.3)
ax.set_xticks(np.arange(lo, hi + 1))
ax.xaxis.set_major_formatter(matplotlib.ticker.FuncFormatter(lambda v, _: f"{v:+.0f}" if v else "0"))
ax.yaxis.set_major_formatter(matplotlib.ticker.FuncFormatter(lambda v, _: f"{v:+.0f}%" if v else "0%"))
ax.set_ylim(-15, 15)
ax.set_xlabel("Asphalt temperature compared with usual for that location and survey (°C)")
ax.set_ylabel("Change of E1 (%)")
ax.grid(axis="y", color=GRID, lw=0.8); ax.set_axisbelow(True)
for sp in ("top", "right"):
    ax.spines[sp].set_visible(False)
ax.legend(loc="upper right", fontsize=8.2, frameon=False)
ax.set_title("Asphalt modulus E1: change with temperature at the same location", loc="left",
             fontsize=11, fontweight="bold", pad=10)
fig.text(0.01, 0.01, "Location and survey-day effects removed (two-way fixed effects). Bowls with fit ≤ 5% at locations with "
         "≥ 2 usable surveys.\nLines = median per 1 °C step. A flat line at 0% means E1 does not depend on temperature.",
         fontsize=7.5, color=INK2)
fig.tight_layout(rect=(0, 0.06, 1, 1))
for ext in ("png", "pdf"):
    fig.savefig(OUT / f"E1_vs_temperature_erlingsson.{ext}", facecolor=BG)
print(f"without: {sb:+.1f}%/C {qb.med.round(1).to_dict()}")
print(f"own:     {sa:+.1f}%/C {qa.med.round(1).to_dict()}")
print("saved", OUT)
