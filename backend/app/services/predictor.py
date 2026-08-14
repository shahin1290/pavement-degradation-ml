from backend.app.models.schemas import PredictionRequest
from ml.pipelines.prediction_pipeline import (
    RoadDataInput,
    PredictionPipeline
)


class PredictorService:

    def predict_d0000(self, request: PredictionRequest):

        road_data = RoadDataInput(
            sci300=request.sci300,
            aadt=request.aadt,
            bells_temp=request.bells_temp,
            layer_1_thk=request.layer_1_thk
        )

        input_df = road_data.get_data_as_dataframe()

        pipeline = PredictionPipeline()

        predicted_d0000 = float(
            pipeline.predict(input_df)[0]
        )

        return round(predicted_d0000, 2)


predictor_service = PredictorService()