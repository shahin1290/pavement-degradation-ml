import os
import sys
import pickle
import numpy as np
import pandas as pd

from ml import config
from ml.exception import CustomException
from ml.logger import logging
from ml.components.data_transformation import build_features


class PredictionPipeline:
    def __init__(self, model_path=None):
        self.model_path = model_path or os.path.join(config.ARTIFACTS_DIR, "model.pkl")
        self._bundle = None

    @property
    def bundle(self):
        if self._bundle is None:
            if not os.path.exists(self.model_path):
                raise FileNotFoundError(
                    f"Model not found at {self.model_path}. Run train.py first."
                )
            with open(self.model_path, "rb") as f:
                self._bundle = pickle.load(f)
        return self._bundle

    @property
    def feature_names(self):
        """Raw input columns the trained model expects."""
        return self.bundle["features"]

    def predict_df(self, features_df: pd.DataFrame) -> pd.DataFrame:
        """Predict E1-E4 (MPa) for one or many rows. Returns a DataFrame."""
        try:
            b = self.bundle
            missing = [c for c in b["features"] if c not in features_df.columns]
            if missing:
                raise ValueError(f"Missing input columns: {', '.join(missing)}")

            X = build_features(features_df, b["features"], b["log_features"])
            out = pd.DataFrame(index=features_df.index)
            for t in b["targets"]:
                lo, hi = b["limits"][t]
                out[t] = np.clip(np.exp(b["models"][t].predict(X)), lo, hi)
            return out

        except Exception as e:
            raise CustomException(e, sys)

    def predict(self, features_df: pd.DataFrame):
        """Predict for a single row. Returns [E1, E2, E3, E4] in MPa."""
        logging.info("Modulus prediction triggered.")
        return self.predict_df(features_df).iloc[0].tolist()


class RoadDataInput:
    """
    One measurement point. Pass the inputs the model was trained with,
    e.g. RoadDataInput(D0=419.0, D130=342.4, ..., thk1_mm=81.9, ...).
    """

    def __init__(self, **inputs: float):
        self.inputs = {k: float(v) for k, v in inputs.items()}

    def get_data_as_dataframe(self) -> pd.DataFrame:
        try:
            return pd.DataFrame({k: [v] for k, v in self.inputs.items()})
        except Exception as e:
            raise CustomException(e, sys)
