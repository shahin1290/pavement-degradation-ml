import os
import sys
import pickle
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt

from sklearn.metrics import mean_absolute_error, r2_score, mean_squared_error
from ml.exception import CustomException


FEATURES = [
    "Medelförtsd_1_SCI_300",
    "Medelförpmsv4_AADT",
    "Medelförtsd_1_BELLS_TEMP",
    "Medelförmst_Layer_1_thk",
]
TARGET = "Medelförtsd_1_D0000"


def evaluate_all_methods():
    try:
        test_path = os.path.join("artifacts", "test.csv")
        if not os.path.exists(test_path):
            raise FileNotFoundError("Run train.py first.")

        test_df = pd.read_csv(test_path)[FEATURES + [TARGET]].dropna()
        X_test = test_df[FEATURES]
        y_actual = test_df[TARGET]

        model_files = [
            f for f in os.listdir("artifacts")
            if f.startswith("model_") and f.endswith(".pkl")
        ]
        if not model_files:
            model_files = ["model.pkl"]

        print("=" * 80)
        print(f"STRUCTURAL AI TEST RESULTS ({len(X_test)} samples)")
        print("=" * 80)
        print(f"{'MODEL':<30} | {'R2':<10} | {'MAE':<12} | {'RMSE':<12}")
        print("-" * 80)

        plt.figure(figsize=(10, 8))

        for model_file in model_files:
            with open(os.path.join("artifacts", model_file), "rb") as f:
                model = pickle.load(f)

            name = model_file.replace("model_", "").replace(".pkl", "")
            y_pred = model.predict(X_test)

            r2 = r2_score(y_actual, y_pred)
            mae = mean_absolute_error(y_actual, y_pred)
            rmse = np.sqrt(mean_squared_error(y_actual, y_pred))

            print(
                f"{name:<30} | {r2:>8.4f} | "
                f"{mae:>10.4f} | {rmse:>10.4f}"
            )

            plt.scatter(
                y_actual, y_pred, alpha=0.2,
                label=f"{name} (R2: {r2:.3f})"
            )

        min_value, max_value = y_actual.min(), y_actual.max()
        plt.plot(
            [min_value, max_value], [min_value, max_value],
            linestyle="--", linewidth=2, label="Perfect Prediction"
        )
        plt.title("Structural AI: Actual vs Predicted D0000")
        plt.xlabel("Actual D0000")
        plt.ylabel("Predicted D0000")
        plt.legend()
        plt.grid(True, linestyle=":", alpha=0.6)

        output_image = os.path.join(
            "artifacts", "actual_vs_predicted_D0000.png"
        )
        plt.savefig(output_image, dpi=300)
        plt.close()

        print(f"Visualization saved to: {output_image}")

    except Exception as e:
        raise CustomException(e, sys)


if __name__ == "__main__":
    evaluate_all_methods()
