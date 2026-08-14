import os
import sys
import pickle
import numpy as np

from sklearn.metrics import r2_score, mean_absolute_error, mean_squared_error
from sklearn.linear_model import LinearRegression, Ridge
from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor
from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import StandardScaler

from ml.exception import CustomException
from ml.logger import logging


class ModelTrainer:
    def __init__(self):
        self.models = {
            "Linear_Regression": make_pipeline(
                StandardScaler(), LinearRegression()
            ),
            "Ridge_Regression": make_pipeline(
                StandardScaler(), Ridge(alpha=1.0)
            ),
            "Gradient_Boosting": GradientBoostingRegressor(random_state=42),
            "Random_Forest": RandomForestRegressor(
                n_estimators=100, random_state=42, n_jobs=-1
            ),
        }

    def initiate_model_trainer(self, X_train, y_train, X_test, y_test):
        try:
            artifacts_dir = "artifacts"
            os.makedirs(artifacts_dir, exist_ok=True)

            best_r2 = -float("inf")
            best_model = None
            best_name = ""

            for name, model in self.models.items():
                logging.info(f"Training model: {name}")
                model.fit(X_train, y_train)

                predictions = model.predict(X_test)
                r2 = r2_score(y_test, predictions)
                mae = mean_absolute_error(y_test, predictions)
                rmse = np.sqrt(
                    mean_squared_error(y_test, predictions)
                )

                with open(
                    os.path.join(artifacts_dir, f"model_{name}.pkl"), "wb"
                ) as f:
                    pickle.dump(model, f)

                logging.info(
                    f"{name}: R2={r2:.4f}, MAE={mae:.4f}, RMSE={rmse:.4f}"
                )

                if r2 > best_r2:
                    best_r2 = r2
                    best_model = model
                    best_name = name

            if best_model is None:
                raise RuntimeError("No model was trained.")

            with open(os.path.join(artifacts_dir, "model.pkl"), "wb") as f:
                pickle.dump(best_model, f)

            final_predictions = best_model.predict(X_test)
            final_mae = mean_absolute_error(y_test, final_predictions)

            logging.info(
                f"Production model: {best_name}, R2={best_r2:.4f}"
            )

            return best_r2, final_mae

        except Exception as e:
            logging.error("Error occurred inside ModelTrainer.")
            raise CustomException(e, sys)
