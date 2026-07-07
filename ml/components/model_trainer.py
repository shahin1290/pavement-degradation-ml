import os
import sys
import pickle
from sklearn.ensemble import RandomForestRegressor, HistGradientBoostingRegressor, GradientBoostingRegressor
from sklearn.metrics import r2_score, mean_absolute_error
from ml.exception import CustomException
from ml.logger import logging

class ModelTrainer:
    def __init__(self):
        # We define the directory and the path for the main deployment model
        self.artifacts_dir = "artifacts"
        self.main_model_path = os.path.join(self.artifacts_dir, "model.pkl")

    def initiate_model_trainer(self, X_train, y_train, X_test, y_test):
        try:
            logging.info("Initiating model evaluation pipeline...")
            os.makedirs(self.artifacts_dir, exist_ok=True)

            # Define the models to test side-by-side
            # (Spaces removed from keys to keep file naming clean)
            models = {
                "Random_Forest_Baseline": RandomForestRegressor(n_estimators=100, random_state=42, n_jobs=-1),
                "HistGradientBoosting": HistGradientBoostingRegressor(max_iter=200, learning_rate=0.05, max_depth=6, random_state=42),
                "GradientBoostingRegressor": GradientBoostingRegressor(n_estimators=150, learning_rate=0.05, max_depth=5, random_state=42)
            }

            model_report = {}

            # Train, evaluate, and save EACH individual model checkpoint
            for name, model in models.items():
                logging.info(f"Training {name}...")
                model.fit(X_train, y_train)

                # Predict on test data
                y_pred = model.predict(X_test)
                r2 = r2_score(y_test, y_pred)
                mae = mean_absolute_error(y_test, y_pred)

                model_report[name] = {"r2": r2, "mae": mae, "model_object": model}
                logging.info(f"{name} Evaluation -> R²: {r2:.4f} | MAE: {mae:.4f}")

                # UPDATE: Save this specific model so evaluate.py can find it later
                specific_model_path = os.path.join(self.artifacts_dir, f"model_{name}.pkl")
                with open(specific_model_path, "wb") as file_obj:
                    pickle.dump(model, file_obj)
                logging.info(f"Saved individual checkpoint: {specific_model_path}")

            # Select the absolute best model based on R² score
            best_model_name = max(model_report, key=lambda k: model_report[k]["r2"])
            best_model_data = model_report[best_model_name]

            if best_model_data["r2"] < 0.4:
                raise CustomException("No model reached the minimum acceptable R² performance threshold.", sys)

            logging.info(f"🏆 Best Model Found: {best_model_name} with R²: {best_model_data['r2']:.4f}")

            # Save a duplicate of the winning model as the main model.pkl for FastAPI/React
            with open(self.main_model_path, "wb") as file_obj:
                pickle.dump(best_model_data["model_object"], file_obj)
            logging.info(f"Saved production deployment model to: {self.main_model_path}")

            return best_model_data["r2"], best_model_data["mae"]

        except Exception as e:
            raise CustomException(e, sys)