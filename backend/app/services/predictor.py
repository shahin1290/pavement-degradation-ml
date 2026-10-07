import math
from typing import List, Tuple

from ml.pipelines.prediction_pipeline import PredictionPipeline, RoadDataInput
from backend.app.models.schemas import PredictionRequest

DEFLECTIONS = ["D0", "D130", "D215", "D300", "D450", "D600", "D900", "D1200", "D1500"]


class MissingInputError(ValueError):
    """Raised when the request lacks an input the trained model needs."""


class PredictorService:
    def __init__(self):
        self.pipeline = PredictionPipeline()

    @property
    def required_features(self) -> List[str]:
        return self.pipeline.feature_names

    def _collect_inputs(self, request: PredictionRequest) -> dict:
        data = request.dict()                       # works with pydantic v1 and v2
        inputs = {}
        missing = []
        for name in self.required_features:         # exactly what the model was trained on
            value = data.get(name)
            if value is None:
                missing.append(name)
                continue
            if name in DEFLECTIONS:
                value = abs(value)
                if value == 0:
                    raise ValueError(f"{name} must not be zero.")
            inputs[name] = float(value)
        if missing:
            raise MissingInputError(
                f"The trained model needs these inputs: {', '.join(missing)}"
            )
        return inputs

    def _range_warnings(self, inputs: dict) -> List[str]:
        ranges = self.pipeline.bundle.get("feature_ranges", {})   # older models have none
        warnings = []
        for name, value in inputs.items():
            if name not in ranges:
                continue
            lo, hi = ranges[name]
            if value < lo or value > hi:
                warnings.append(
                    f"{name} = {value:g} is outside the training range "
                    f"({lo:.4g}-{hi:.4g}); prediction is less reliable."
                )
        return warnings

    def predict_moduli(self, request: PredictionRequest) -> Tuple[list, List[str]]:
        inputs = self._collect_inputs(request)
        input_df = RoadDataInput(**inputs).get_data_as_dataframe()
        predictions = self.pipeline.predict(input_df)
        return predictions, self._range_warnings(inputs)

    def model_info(self) -> dict:
        b = self.pipeline.bundle
        return {
            "model_type": b["model_type"],
            "feature_groups": b["feature_groups"],
            "features": b["features"],
            "targets": b["targets"],
            "limits_MPa": {k: list(v) for k, v in b["limits"].items()},
            "test_metrics": b.get("metrics", {}),
        }


predictor_service = PredictorService()
