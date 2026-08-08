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

    def __init__(
        self,
        spardjup_15: float,
        spardjup_17: float,
        vagbredd: float,
        adt_fordon: int,
        belaggningsar: int,
        hastighet: int,
    ):
        self.spardjup_15 = spardjup_15
        self.spardjup_17 = spardjup_17
        self.vagbredd = vagbredd
        self.adt_fordon = adt_fordon
        self.belaggningsar = belaggningsar
        self.hastighet = hastighet

    def get_data_as_dataframe(self) -> pd.DataFrame:
        try:
            # Map manual inputs exactly to the 6 features expected by the trained model
            custom_data_dict = {
                "Spårdjup max 15": [self.spardjup_15],
                "ÅDT fordon": [self.adt_fordon],
                "Pavement_Age": [2026 - self.belaggningsar],  # Feature engineering
                "Hastighetsgräns": [self.hastighet],
                "Spårdjup max 17": [self.spardjup_17],
                "Vägbredd": [self.vagbredd],
            }
            return pd.DataFrame(custom_data_dict)
        except Exception as e:
            raise CustomException(e, sys)