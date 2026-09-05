import os
import sys
import pickle
import numpy as np
import pandas as pd
from ml.exception import CustomException
from ml.logger import logging


class PredictionPipeline:
    def __init__(self):
        self.model_path = os.path.join("artifacts", "model.pkl")

    def predict(self, features_df: pd.DataFrame):
        try:
            logging.info("Modulus surrogate prediction pipeline triggered.")

            if not os.path.exists(self.model_path):
                raise FileNotFoundError(
                    f"Model not found at {self.model_path}. Run training first."
                )

            with open(self.model_path, "rb") as file_obj:
                models_dict = pickle.load(file_obj)

            predictions = []
            for target_col in ["E1_MPa", "E2_MPa", "E3_MPa", "E4_MPa"]:
                model = models_dict[target_col]
                pred_raw = model.predict(features_df)
                
                # Robustly handle arrays, lists, or scalar floats
                if isinstance(pred_raw, (np.ndarray, list)):
                    pred_log = pred_raw[0]
                else:
                    pred_log = pred_raw
                
                pred_val = float(np.exp(float(pred_log)))
                predictions.append(pred_val)

            # Apply physical bounds and realistic engineering clipping
            E1, E2, E3, E4 = predictions
            E1 = max(500.0, min(E1, 15000.0))
            E2 = max(50.0, min(E2, 2000.0))
            E3 = max(30.0, min(E3, 1000.0))
            E4 = max(10.0, min(E4, 300.0))

            logging.info("Modulus prediction and constraint clipping successful.")
            return [E1, E2, E3, E4]

        except Exception as e:
            raise CustomException(e, sys)


class RoadDataInput:
    def __init__(
        self,
        h1_cm: float,
        h2_cm: float,
        h3_cm: float,
        bells_temp: float,
        d0_target: float,
        sci300_target: float,
    ):
        self.h1_cm = h1_cm
        self.h2_cm = h2_cm
        self.h3_cm = h3_cm
        self.bells_temp = bells_temp
        self.d0_target = d0_target
        self.sci300_target = sci300_target

    def get_data_as_dataframe(self) -> pd.DataFrame:
        try:
            return pd.DataFrame({
                "h1_cm": [self.h1_cm],
                "h2_cm": [self.h2_cm],
                "h3_cm": [self.h3_cm],
                "bells_temp": [self.bells_temp],
                "d0_target": [self.d0_target],
                "sci300_target": [self.sci300_target],
            })
        except Exception as e:
            raise CustomException(e, sys)