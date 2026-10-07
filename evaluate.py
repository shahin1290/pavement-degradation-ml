import os
import sys
import numpy as np
import pandas as pd
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt

from ml import config
from ml.exception import CustomException
from ml.components.model_trainer import compute_metrics
from ml.pipelines.prediction_pipeline import PredictionPipeline


def evaluate():
    try:
        test_path = os.path.join(config.ARTIFACTS_DIR, "test.csv")
        if not os.path.exists(test_path):
            raise FileNotFoundError("Run train.py first.")

        test_df = pd.read_csv(test_path)
        pipe = PredictionPipeline()
        b = pipe.bundle
        pred = pipe.predict_df(test_df)

        print("=" * 72)
        print(f"TEST RESULTS: {len(test_df)} cases from unseen road stretches")
        print(f"Model: {b['model_type']} | features: {', '.join(b['feature_groups'])}")
        print("=" * 72)
        print(f"{'Target':<6} | {'R2 (log)':>8} | {'Median err':>10} | {'80% within':>10} | {'MAE (MPa)':>9}")
        print("-" * 72)
        for t in b["targets"]:
            m = compute_metrics(test_df[t], pred[t])
            print(f"{t:<6} | {m['r2_log']:>8.3f} | {m['median_error_pct']:>9.1f}% | "
                  f"{m['p80_error_pct']:>9.1f}% | {m['mae_mpa']:>9.1f}")

        # Median % error per survey
        if "survey" in test_df.columns:
            print("\nMedian error (%) per survey")
            print(f"{'Survey':<6} | {'Cases':>6} | " + " | ".join(f"{t:>6}" for t in b["targets"]))
            for s, g in test_df.groupby("survey"):
                errs = [np.median(np.abs(pred.loc[g.index, t] / g[t] - 1)) * 100 for t in b["targets"]]
                print(f"{s:<6} | {len(g):>6} | " + " | ".join(f"{e:>5.1f}%" for e in errs))

        # Save predictions and predicted-vs-backcalculated plots
        out = test_df.copy()
        for t in b["targets"]:
            out[f"{t}_pred"] = pred[t].round(0)
        out.to_csv(os.path.join(config.ARTIFACTS_DIR, "test_predictions.csv"), index=False)

        fig, axes = plt.subplots(1, len(b["targets"]), figsize=(4 * len(b["targets"]), 4))
        for ax, t in zip(np.atleast_1d(axes), b["targets"]):
            ax.scatter(test_df[t], pred[t], s=3, alpha=0.3)
            lo, hi = b["limits"][t]
            ax.plot([lo, hi], [lo, hi], "k--", lw=1)
            ax.set_xscale("log"); ax.set_yscale("log")
            ax.set_xlabel(f"{t} backcalculated (MPa)"); ax.set_ylabel(f"{t} predicted (MPa)")
            ax.set_title(t)
        plt.tight_layout()
        plot_path = os.path.join(config.ARTIFACTS_DIR, "pred_vs_backcalc.png")
        plt.savefig(plot_path, dpi=150)

        print("=" * 72)
        print(f"Saved: {config.ARTIFACTS_DIR}/test_predictions.csv and pred_vs_backcalc.png")

    except Exception as e:
        raise CustomException(e, sys)


if __name__ == "__main__":
    evaluate()
