import os
import sys
import pickle
import pandas as pd

from ml.exception import CustomException
from ml.logger import logging


class PredictionPipeline:
    def __init__(self):
        self.model_path = os.path.join("artifacts", "model.pkl")

    def predict(self, features_df: pd.DataFrame):
        try:
            logging.info("Structural AI prediction pipeline triggered.")

            if not os.path.exists(self.model_path):
                raise FileNotFoundError(
                    f"Model not found at {self.model_path}. Run training first."
                )

            with open(self.model_path, "rb") as file_obj:
                model = pickle.load(file_obj)

            predictions = model.predict(features_df)
            logging.info("Structural AI prediction successful.")
            return predictions

        except Exception as e:
            raise CustomException(e, sys)


class RoadDataInput:
    def __init__(
        self,
        sci300: float,
        aadt: float,
        bells_temp: float,
        layer_1_thk: float,
    ):
        self.sci300 = sci300
        self.aadt = aadt
        self.bells_temp = bells_temp
        self.layer_1_thk = layer_1_thk

    def get_data_as_dataframe(self) -> pd.DataFrame:
        try:
            return pd.DataFrame({
                "Medelförtsd_1_SCI_300": [self.sci300],
                "Medelförpmsv4_AADT": [self.aadt],
                "Medelförtsd_1_BELLS_TEMP": [self.bells_temp],
                "Medelförmst_Layer_1_thk": [self.layer_1_thk],
            })
        except Exception as e:
            raise CustomException(e, sys)
