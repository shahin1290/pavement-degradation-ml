import os
import pickle
import pandas as pd
from ml.pipelines.prediction_pipeline import RoadDataInput

class RoadPredictorService:
    def __init__(self):
        self.model_path = os.path.join("artifacts", "model.pkl")
        self.model = None
        self._load_model()

    def _load_model(self):
        if os.path.exists(self.model_path):
            with open(self.model_path, "rb") as f:
                self.model = pickle.load(f)
        else:
            raise FileNotFoundError(f"Weights file missing at {self.model_path}. Run training first!")

    def predict_iri(self, data) -> tuple[float, str]:
        road_profile = RoadDataInput(
            spardjup=data.spardjup,
            adt_fordon=data.adt_fordon,
            belaggningsar=data.belaggningsar,
            hastighet=data.hastighet
        )
        input_df = road_profile.get_data_as_dataframe()
        raw_prediction = self.model.predict(input_df)[0]
        
        if raw_prediction < 1.5:
            condition = "Excellent"
        elif raw_prediction < 3.0:
            condition = "Acceptable"
        else:
            condition = "Poor"
            
        return round(float(raw_prediction), 3), condition

# Create a single instance to share across routes
predictor_service = RoadPredictorService()