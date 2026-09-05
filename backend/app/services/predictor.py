import pandas as pd
from ml.pipelines.prediction_pipeline import PredictionPipeline, RoadDataInput
from backend.app.models.schemas import PredictionRequest


class PredictorService:
    def __init__(self):
        self.pipeline = PredictionPipeline()

    def predict_moduli(self, request: PredictionRequest) -> list:
        road_profile = RoadDataInput(
            h1_cm=request.h1_cm,
            h2_cm=request.h2_cm,
            h3_cm=request.h3_cm,
            bells_temp=request.bells_temp,
            d0_target=request.d0_target,
            sci300_target=request.sci300_target,
        )
        input_df = road_profile.get_data_as_dataframe()
        return self.pipeline.predict(input_df)


predictor_service = PredictorService()