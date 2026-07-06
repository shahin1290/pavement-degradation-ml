import os
import sys
import pickle
import pandas as pd
from src.exception import CustomException
from src.logger import logging

class PredictionPipeline:
    def __init__(self):
        self.model_path = os.path.join("artifacts", "model.pkl")

    def predict(self, features_df: pd.DataFrame):
        """Loads serialized model weights to evaluate incoming road parameters."""
        try:
            logging.info("Prediction pipeline triggered.")
            
            if not os.path.exists(self.model_path):
                raise FileNotFoundError(f"Model weight file not found at {self.model_path}. Run training first!")
                
            with open(self.model_path, "rb") as file_obj:
                model = pickle.load(file_obj)
                
            predictions = model.predict(features_df)
            logging.info("Prediction successful.")
            return predictions
            
        except Exception as e:
            raise CustomException(e, sys)

class RoadDataInput:
    """Structure to translate manual user inputs into a structured DataFrame for the ML model."""
    def __init__(self, spardjup: float, adt_fordon: int, belaggningsar: int, hastighet: int):
        self.spardjup = spardjup
        self.adt_fordon = adt_fordon
        self.belaggningsar = belaggningsar
        self.hastighet = hastighet

    def get_data_as_dataframe(self) -> pd.DataFrame:
        try:
            # Map manual inputs exactly to the format expected by the model
            custom_data_dict = {
                "Spårdjup max 15": [self.spardjup],
                "ÅDT fordon": [self.adt_fordon],
                "Pavement_Age": [2026 - self.belaggningsar], # Feature engineering calculation
                "Hastighetsgräns": [self.hastighet]
            }
            return pd.DataFrame(custom_data_dict)
        except Exception as e:
            raise CustomException(e, sys)