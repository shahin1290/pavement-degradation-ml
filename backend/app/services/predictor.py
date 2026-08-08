import os
import pickle
import pandas as pd
from backend.app.models.schemas import PredictionRequest
from ml.pipelines.prediction_pipeline import RoadDataInput, PredictionPipeline

class PredictorService:
    def predict_iri(self, request: PredictionRequest):
        # Use spardjup_15= instead of spardjup=
        road_data = RoadDataInput(
            spardjup_15=request.spardjup,
            spardjup_17=request.spardjup_17,
            vagbredd=request.vagbredd,
            adt_fordon=request.adt_fordon,
            belaggningsar=request.belaggningsar,
            hastighet=request.hastighet
        )
        
        input_df = road_data.get_data_as_dataframe()
        
        pipeline = PredictionPipeline()
        predicted_iri = float(pipeline.predict(input_df)[0])

        if predicted_iri < 1.5:
            condition = "Excellent"
        elif predicted_iri < 3.0:
            condition = "Acceptable"
        else:
            condition = "Poor"

        return round(predicted_iri, 2), condition

predictor_service = PredictorService()