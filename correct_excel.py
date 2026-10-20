"""
Temperature-correct TSD deflections to T0 = 20 C (Park, Kim & Park 2002, TRR 1806).

  lambda_w = 10 ** (-C * H_ac * (T - T0))        corrected = measured * lambda_w
  C        = C0 + A * r   (A < 0: correction decreases with distance r, as described in the paper's text)
  D_eff    = max(4.75 * H_ac - 413, 0)   (mm); sensors with r > D_eff are not corrected
             (floor at 0: for asphalt < 87 mm, where Eq. 1 is negative, D0 is still corrected)
  C is never below 0 (a sensor where C0 + A*r <= 0 is not corrected).
  Default C0 = 4.65e-5, A = -5.47e-8 (Park statewide). H_ac = Layer_1_thk in mm, T = BELLS temperature of that survey.

Keeps the original file layout (same sheet and column names) so existing backcalculation scripts read it unchanged.
Usage: python correct_excel.py INPUT.xlsx OUTPUT.xlsx [C0 A "label"]
  e.g.  python correct_excel.py in.xlsx out.xlsx 2.45e-5 -8.24e-8 "Östergötland TSD, fitted (estimate_C0.py)"
"""
import sys
import numpy as np
import pandas as pd

C0, A, T0 = 4.65e-5, -5.47e-8, 20.0
SHEET = "Uttag_temp_korr"
SENSORS = {"D00001": 0, "D0130": 130, "D0215": 215, "D0300": 300, "D0450": 450,
           "D0600": 600, "D0900": 900, "D1200": 1200, "D1500": 1500}


def factors(T, H):
    """Correction factor per sensor (arrays over rows). NaN T or H -> factor 1 (not corrected)."""
    deff = np.maximum(4.75 * H - 413, 0.0)
    out = {}
    for name, r in SENSORS.items():
        C = max(C0 + A * r, 0.0)
        lam = 10 ** (-C * H * (T - T0))
        ok = np.isfinite(lam) & (r <= deff) & (C > 0)
        out[name] = np.where(ok, lam, 1.0)
    return out, deff


if __name__ == "__main__":
    src, dst = sys.argv[1], sys.argv[2]
    LABEL = "Park statewide"
    if len(sys.argv) > 3:
        C0, A = float(sys.argv[3]), float(sys.argv[4])
        LABEL = sys.argv[5] if len(sys.argv) > 5 else "user values"
    df = pd.read_excel(src, sheet_name=SHEET)
    H = df["Medelförmst_Layer_1_thk"].astype(float) * 1000          # m -> mm
    info = []
    for s in (1, 2, 3, 4):
        p = f"Medelförtsd_{s}_"
        T = df[p + "BELLS_TEMP"].astype(float)
        lam, deff = factors(T.values, H.values)
        for name in SENSORS:
            df[p + name] = df[p + name] * lam[name]
        if p + "D0000" in df:                                       # duplicate of D00001 in the file
            df[p + "D0000"] = df[p + "D0000"] * lam["D00001"]
        if p + "SCI_300" in df:                                     # SCI_300 = D0 - D300 (positive), recomputed
            df[p + "SCI_300"] = (df[p + "D0300"] - df[p + "D00001"]).round(2)
        df[f"tempcorr_{s}_factor_D0"] = np.round(lam["D00001"], 5)
        info.append({"survey": s, "rows": len(df),
                     "rows corrected (D0)": int((lam["D00001"] != 1).sum()),
                     "median BELLS T (C)": round(float(np.nanmedian(T)), 1),
                     "median D0 factor": round(float(np.median(lam["D00001"])), 4),
                     "min D0 factor": round(float(np.min(lam["D00001"])), 4),
                     "max D0 factor": round(float(np.max(lam["D00001"])), 4),
                     "median sensors corrected": float(np.median([sum(lam[n][i] != 1 for n in SENSORS) for i in range(len(df))]))})
    df["tempcorr_Deff_mm"] = np.round(deff, 0)

    r0 = -C0 / A if A < 0 else float("inf")
    method = pd.DataFrame({"item": ["Method", "Equation", "C", "D_eff", "Coefficients", "C0", "A", "T0",
                                    "H_ac", "T", "Not corrected", "Note"],
                           "value": ["Park, Kim & Park (2002), TRR 1806, Eq. 1, 5-7",
                                     "corrected = measured * 10^(-C * H_ac * (T - T0))",
                                     "C = max(C0 + A*r, 0) (A<0, decreases with distance r in mm)",
                                     f"D_eff = max(4.75*H_ac - 413, 0) mm; sensors with r > D_eff unchanged (asphalt < 87 mm: D0 only); also C >= 0, so sensors beyond r = {r0:.0f} mm unchanged",
                                     LABEL, f"{C0:.2E}", f"{A:.2E}", "20 C", "Medelförmst_Layer_1_thk (m) * 1000 = mm",
                                     "Medelförtsd_s_BELLS_TEMP of each survey s",
                                     "rows with missing T or H_ac; sensors beyond D_eff",
                                     "Deflections D00001...D1500 and D0000 corrected; SCI_300 recalculated as D0 - D300; SCI_sub and SCI300_norm unchanged"]})
    with pd.ExcelWriter(dst, engine="openpyxl") as w:
        df.to_excel(w, sheet_name=SHEET, index=False)
        method.to_excel(w, sheet_name="temp_correction_method", index=False)
        pd.DataFrame(info).to_excel(w, sheet_name="temp_correction_summary", index=False)
    print(pd.DataFrame(info).to_string(index=False))
