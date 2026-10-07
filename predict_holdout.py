"""
Predict E1-E4 for the holdout cases and write ERAPAVE .dat files.

Output in artifacts/holdout/:
  holdout_predictions.csv   inputs, ML moduli, backcalculated moduli, measured deflections
  row<R>_survey<S>.dat      one ERAPAVE input file per case, with the ML moduli
"""
import os
import pandas as pd

from ml import config
from ml.pipelines.prediction_pipeline import PredictionPipeline

DEFL = ["D0", "D130", "D215", "D300", "D450", "D600", "D900", "D1200", "D1500"]


def write_dat(path, h_cm, E):
    nu, uw = config.ERAPAVE_POISSON, config.ERAPAVE_UNIT_WEIGHT
    with open(path, "w", encoding="utf-8") as f:
        f.write("MATERIAL PROPERTIES\n4\n0\n")
        for i in range(3):
            f.write(f"{i+1} {h_cm[i]:.4f} {E[i]:.2f} {nu[i]} {uw[i]}\n")
        f.write(f"4 1e+300 {E[3]:.2f} {nu[3]} {uw[3]}\n")
        f.write("\nLOADING\n1\n")
        f.write(f"{config.ERAPAVE_STRESS_KPA:.3f}\n{config.ERAPAVE_LOAD_KN:.3f}\n0\n0\n")
        f.write("\nEVALUATION LOCATIONS\n")
        f.write(f"{len(config.ERAPAVE_EVAL_CM)}\nx y z\n")
        for x in config.ERAPAVE_EVAL_CM:
            f.write(f"{x} 0 0\n")


def main():
    path = os.path.join(config.ARTIFACTS_DIR, "holdout.csv")
    if not os.path.exists(path):
        raise FileNotFoundError("Run train.py first (it creates artifacts/holdout.csv).")
    df = pd.read_csv(path)
    if df.empty:
        raise ValueError("Holdout is empty. Set HOLDOUT_PER_SURVEY > 0 in ml/config.py.")

    pred = PredictionPipeline().predict_df(df)
    out_dir = os.path.join(config.ARTIFACTS_DIR, "holdout")
    os.makedirs(out_dir, exist_ok=True)

    rows = []
    for i, r in df.iterrows():
        h_cm = [r["thk1_mm"] / 10, r["thk2_mm"] / 10, r["thk3_mm"] / 10]
        E_ml = [pred.loc[i, t] for t in config.TARGETS]
        name = f"row{int(r['row_index'])}_survey{int(r['survey'])}"
        write_dat(os.path.join(out_dir, name + ".dat"), h_cm, E_ml)
        rows.append({
            "case": name, "row_index": int(r["row_index"]), "key": r["key"], "survey": int(r["survey"]),
            "h1_cm": round(h_cm[0], 3), "h2_cm": round(h_cm[1], 3), "h3_cm": round(h_cm[2], 3),
            **{f"{t}_ML": round(e) for t, e in zip(config.TARGETS, E_ml)},
            **{f"{t}_backcalc": int(r[t]) for t in config.TARGETS},
            **{f"{d}_measured": round(abs(r[d]), 2) for d in DEFL},
        })

    out = pd.DataFrame(rows)
    out.to_csv(os.path.join(out_dir, "holdout_predictions.csv"), index=False)

    print(f"{len(out)} holdout cases (never used for training or testing)")
    print(out[["case", "E1_ML", "E1_backcalc", "E2_ML", "E2_backcalc",
               "E3_ML", "E3_backcalc", "E4_ML", "E4_backcalc"]].to_string(index=False))
    print(f"\nSaved to {out_dir}/: holdout_predictions.csv and {len(out)} .dat files")
    print(f"ERAPAVE: single axle/single wheel, axle load {config.ERAPAVE_LOAD_KN} kN "
          f"({config.ERAPAVE_LOAD_KN / 2:.0f} kN per wheel), {config.ERAPAVE_STRESS_KPA} kPa")


if __name__ == "__main__":
    main()