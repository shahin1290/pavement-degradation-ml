import os
import sys
import pickle
import numpy as np
import pandas as pd
from sklearn.metrics import r2_score, mean_absolute_error, mean_squared_error
from sklearn.linear_model import LinearRegression, Ridge, Lasso
from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor
from sklearn.experimental import enable_hist_gradient_boosting  # Explicitly needed if using older sklearn versions
from sklearn.ensemble import HistGradientBoostingRegressor
from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import GridSearchCV
from ml.exception import CustomException
from ml.logger import logging

class ModelTrainer:
    def __init__(self):
        # Define baseline models (with proper scaling for linear variants)
        self.baseline_models = {
            "Linear_Regression_Vanilla": make_pipeline(StandardScaler(), LinearRegression()),
            "Ridge_Regression_L2": make_pipeline(StandardScaler(), Ridge(alpha=1.0)),
            "Lasso_Regression_L1": make_pipeline(StandardScaler(), Lasso(alpha=0.1)),
            "GradientBoostingRegressor": GradientBoostingRegressor(random_state=42),
            "HistGradientBoosting": HistGradientBoostingRegressor(random_state=42),
            "Random_Forest_Baseline": RandomForestRegressor(random_state=42, n_jobs=-1)
        }

        # Define hyperparameter search configurations for top tree architectures
        self.tuning_configs = {
            "Random_Forest_Tuned": {
                "model": RandomForestRegressor(random_state=42, n_jobs=-1),
                "params": {
                    "n_estimators": [50, 100, 150],
                    "max_depth": [6, 10, None],
                    "min_samples_split": [2, 5]
                }
            },
            "Gradient_Boosting_Tuned": {
                "model": GradientBoostingRegressor(random_state=42),
                "params": {
                    "n_estimators": [100, 150],
                    "learning_rate": [0.01, 0.05, 0.1],
                    "max_depth": [4, 6]
                }
            }
        }

    def initiate_model_trainer(self, X_train, y_train, X_test, y_test):
        try:
            artifacts_dir = "artifacts"
            os.makedirs(artifacts_dir, exist_ok=True)

            best_overall_r2 = -float('inf')
            best_overall_model = None
            best_overall_name = ""

            # --- Step 1: Evaluate Baseline Models ---
            logging.info("Starting baseline model training loop...")
            for name, model in self.baseline_models.items():
                logging.info(f"Training baseline model: {name}")
                model.fit(X_train, y_train)
                
                # Check performance on validation slice
                preds = model.predict(X_test)
                r2 = r2_score(y_test, preds)
                
                # Serialize baseline artifact checkpoint
                model_path = os.path.join(artifacts_dir, f"model_{name}.pkl")
                with open(model_path, "wb") as f:
                    pickle.dump(model, f)

                if r2 > best_overall_r2:
                    best_overall_r2 = r2
                    best_overall_model = model
                    best_overall_name = name

            # --- Step 2: Run GridSearchCV Automated Hyperparameter Tuning ---
            logging.info("Starting automated hyperparameter optimization phase...")
            for name, config in self.tuning_configs.items():
                logging.info(f"Running GridSearchCV optimization grid for: {name}")
                
                grid_search = GridSearchCV(
                    estimator=config["model"],
                    param_grid=config["params"],
                    cv=3,
                    scoring='r2',
                    n_jobs=-1
                )
                grid_search.fit(X_train, y_train)
                
                optimized_model = grid_search.best_estimator_
                preds = optimized_model.predict(X_test)
                r2 = r2_score(y_test, preds)
                
                # Serialize specialized optimized artifact checkpoint
                tuned_model_path = os.path.join(artifacts_dir, f"model_{name}.pkl")
                with open(tuned_model_path, "wb") as f:
                    pickle.dump(optimized_model, f)

                logging.info(f"Optimized {name} Best Params: {grid_search.best_params_} | Test R²: {r2*100:.2f}%")

                if r2 > best_overall_r2:
                    best_overall_r2 = r2
                    best_overall_model = optimized_model
                    best_overall_name = name

            # --- Step 3: Export Production Champion Baseline ---
            logging.info(f"🏆 Production Champion Determined: {best_overall_name} with R²: {best_overall_r2*100:.2f}%")
            
            production_model_path = os.path.join(artifacts_dir, "model.pkl")
            with open(production_model_path, "wb") as f:
                pickle.dump(best_overall_model, f)
            
            # Final validation scores to pass back up to TrainingPipeline
            final_preds = best_overall_model.predict(X_test)
            final_mae = mean_absolute_error(y_test, final_preds)
            
            return best_overall_r2, final_mae

        except Exception as e:
            logging.error("Error occurred inside ModelTrainer phase execution block")
            raise CustomException(e, sys)