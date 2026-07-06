import os
import sys
import pandas as pd
import matplotlib.pyplot as plt
from sklearn.metrics import mean_absolute_error, r2_score
from ml.pipelines.prediction_pipeline import PredictionPipeline
from ml.exception import CustomException

def evaluate_and_visualize():
    try:
        print("Reading evaluation artifacts...")
        test_path = os.path.join("artifacts", "test.csv")
        
        if not os.path.exists(test_path):
            raise FileNotFoundError("Missing artifacts/test.csv. Please run 'uv run python run_pipeline.py' first!")
            
        # 1. Load split test data
        test_df = pd.read_csv(test_path)
        test_df['Pavement_Age'] = 2026 - test_df['Beläggningsår']
        
        features = ['Spårdjup max 15', 'ÅDT fordon', 'Pavement_Age', 'Hastighetsgräns']
        X_test = test_df[features]
        y_actual = test_df['IRI höger']
        
        # 2. Predict using our pipeline
        pipeline = PredictionPipeline()
        y_pred = pipeline.predict(X_test)
        
        # 3. Calculate metrics
        mae = mean_absolute_error(y_actual, y_pred)
        r2 = r2_score(y_actual, y_pred)
        
        print("\n" + "="*50)
        print("         DEFINITIVE TEST RESULTS")
        print("="*50)
        print(f"Total Test Samples Evaluated : {len(X_test)} segments")
        print(f"Mean Absolute Error (MAE)    : {mae:.3f} mm/m")
        print(f"R² Variance Accuracy Score   : {r2:.3f} ({r2*100:.1f}%)")
        print("="*50)
        
        # 4. Generate & Save Thesis Plot
        print("\nGenerating evaluation plot for thesis...")
        plt.figure(figsize=(8, 6))
        plt.scatter(y_actual, y_pred, alpha=0.3, color='#008080', label='Road Segments (20m)')
        
        # Draw perfect prediction line (diagonal)
        plt.plot([y_actual.min(), y_actual.max()], [y_actual.min(), y_actual.max()], 
                 color='red', linestyle='--', linewidth=2, label='Perfect Prediction Line')
        
        plt.title('AI Evaluation: Predicted vs. Actual Road Roughness (IRI)', fontsize=12, fontweight='bold')
        plt.xlabel('Actual Laser IRI (mm/m)', fontsize=10)
        plt.ylabel('Model Predicted IRI (mm/m)', fontsize=10)
        plt.legend()
        plt.grid(True, linestyle=':', alpha=0.6)
        
        # Save visualization to artifacts
        output_image = os.path.join("artifacts", "actual_vs_predicted.png")
        plt.savefig(output_image, dpi=300)
        plt.close()
        
        print(f"📊 Visualization successfully saved to: {output_image}")
        print("You can open this image file to see the regression graph!")

    except Exception as e:
        raise CustomException(e, sys)

if __name__ == "__main__":
    evaluate_and_visualize()