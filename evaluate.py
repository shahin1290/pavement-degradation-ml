import os
import sys
import pickle
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt

from sklearn.metrics import mean_absolute_error, r2_score, mean_squared_error
from ml.exception import CustomException


FEATURES = [
    "h1_cm",
    "h2_cm",
    "h3_cm",
    "bells_temp",
    "d0_target",
    "sci300_target",
]
TARGETS = ["E1_MPa", "E2_MPa", "E3_MPa", "E4_MPa"]


def evaluate_all_methods():
    try:
        test_path = os.path.join("artifacts", "test.csv")
        if not os.path.exists(test_path):
            raise FileNotFoundError("Run train.py first.")

        test_df = pd.read_csv(test_path)[FEATURES + TARGETS].dropna()
        X_test = test_df[FEATURES]
        y_actual = test_df[TARGETS]

        model_files = [
            f for f in os.listdir("artifacts")
            if f.startswith("model_") and f.endswith(".pkl")
        ]
        if not model_files:
            model_files = ["model.pkl"]

        print("=" * 90)
        print(f"STRUCTURAL AI SURROGATE TEST RESULTS ({len(X_test)} samples)")
        print("=" * 90)

        for model_file in model_files:
            with open(os.path.join("artifacts", model_file), "rb") as f:
                model = pickle.load(f)

            name = model_file.replace("model_", "").replace(".pkl", "")
            y_pred = model.predict(X_test)

            print(f"\nModel: {name.upper()}")
            print(f"{'MODULUS':<12} | {'R2':<10} | {'MAE':<12} | {'RMSE':<12}")
            print("-" * 55)

            for i, target_col in enumerate(TARGETS):
                actual_col_vals = y_actual.iloc[:, i]
                pred_col_vals = y_pred[:, i]

                r2 = r2_score(actual_col_vals, pred_col_vals)
                mae = mean_absolute_error(actual_col_vals, pred_col_vals)
                rmse = np.sqrt(mean_squared_error(actual_col_vals, pred_col_vals))

                print(
                    f"{target_col:<12} | {r2:>8.4f} | "
                    f"{mae:>10.4f} | {rmse:>10.4f}"
                )

        print("=" * 90)

    except Exception as e:
        raise CustomException(e, sys)


if __name__ == "__main__":
    evaluate_all_methods()