import os
import sys
import pickle
import pandas as pd
import matplotlib.pyplot as plt
from sklearn.metrics import mean_absolute_error, r2_score, mean_squared_error
import numpy as np
from ml.exception import CustomException

def evaluate_all_methods():
    try:
        test_path = os.path.join("artifacts", "test.csv")
        if not os.path.exists(test_path):
            raise FileNotFoundError("Missing artifacts/test.csv. Please run 'uv run python train.py' first!")

        # 1. Load test data split
        test_df = pd.read_csv(test_path)
        test_df['Pavement_Age'] = 2026 - test_df['Beläggningsår']
        
        features = ['Spårdjup max 15', 'ÅDT fordon', 'Pavement_Age', 'Hastighetsgräns']
        X_test = test_df[features]
        y_actual = test_df['IRI höger']

        print("\nReading evaluation artifacts...")
        
        # 2. Find all models saved in the artifacts folder
        model_files = [f for f in os.listdir("artifacts") if f.startswith("model_") and f.endswith(".pkl")]
        
        if not model_files:
            print("No individual model checkpoints found. Evaluating default main model instead.")
            model_files = ["model.pkl"]

        print("="*75)
        print(f"       DEFINITIVE MULTI-MODEL TEST RESULTS ({len(X_test)} samples)")
        print("="*75)
        print(f"{'MODEL METHOD':<30} | {'R² SCORE':<10} | {'MAE (mm/m)':<12} | {'RMSE':<10}")
        print("-"*75)

        plt.figure(figsize=(10, 8))

        # 3. Loop through and evaluate each model dynamically
        for model_file in model_files:
            model_path = os.path.join("artifacts", model_file)
            method_name = model_file.replace("model_", "").replace(".pkl", "")

            with open(model_path, "rb") as f:
                model = pickle.load(f)

            y_pred = model.predict(X_test)
            r2 = r2_score(y_actual, y_pred)
            mae = mean_absolute_error(y_actual, y_pred)
            rmse = np.sqrt(mean_squared_error(y_actual, y_pred))

            print(f"{method_name:<30} | {r2*100:6.1f}%    | {mae:10.3f}   | {rmse:8.3f}")

            # Plot this model's predictions on the scatter plot
            plt.scatter(y_actual, y_pred, alpha=0.2, label=f'{method_name} (R²: {r2*100:.1f}%)')

        print("="*75)

        # 4. Save visualization comparison
        plt.plot([y_actual.min(), y_actual.max()], [y_actual.min(), y_actual.max()], 
                 color='red', linestyle='--', linewidth=2, label='Perfect Prediction')
        plt.title('AI Evaluation: Multi-Model Comparison of Road Roughness (IRI)', fontsize=12, fontweight='bold')
        plt.xlabel('Actual Laser IRI (mm/m)', fontsize=10)
        plt.ylabel('Model Predicted IRI (mm/m)', fontsize=10)
        plt.legend()
        plt.grid(True, linestyle=':', alpha=0.6)
        
        output_image = os.path.join("artifacts", "actual_vs_predicted.png")
        plt.savefig(output_image, dpi=300)
        plt.close()
        
        print(f"\n📊 Comparison visualization saved to: {output_image}\n")

    except Exception as e:
        raise CustomException(e, sys)

if __name__ == "__main__":
    evaluate_all_methods()