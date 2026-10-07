import os
import sys
import json
import pickle
import numpy as np

from sklearn.ensemble import RandomForestRegressor, HistGradientBoostingRegressor
from sklearn.metrics import r2_score, mean_absolute_error

from ml import config
from ml.exception import CustomException
from ml.logger import logging

MODEL_CLASSES = {
    "random_forest": RandomForestRegressor,
    "hist_gradient_boosting": HistGradientBoostingRegressor,
}


def compute_metrics(y_true, y_pred):
    """Metrics in MPa and in percent. R2 is computed on log(E)."""
    y_true = np.asarray(y_true, float)
    y_pred = np.asarray(y_pred, float)
    pct = np.abs(y_pred / y_true - 1) * 100
    return {
        "r2_log": float(r2_score(np.log(y_true), np.log(y_pred))),
        "mae_mpa": float(mean_absolute_error(y_true, y_pred)),
        "median_error_pct": float(np.median(pct)),
        "p80_error_pct": float(np.percentile(pct, 80)),
    }


def compute_feature_ranges(X_train, log_features):
    """
    1st-99th percentile of each raw input in the training data.
    Used by the backend to warn when a prediction needs extrapolation.
    Log-transformed inputs are converted back to their original units.
    """
    ranges = {}
    for col in X_train.columns:
        lo, hi = X_train[col].quantile([0.01, 0.99])
        if col in log_features:
            lo, hi = np.exp(lo), np.exp(hi)
        ranges[col] = [float(lo), float(hi)]
    return ranges


class ModelTrainer:

    def initiate_model_trainer(self, X_train, y_train, X_test, y_test):
        try:
            os.makedirs(config.ARTIFACTS_DIR, exist_ok=True)
            model_cls = MODEL_CLASSES[config.MODEL_TYPE]
            params = config.MODEL_PARAMS[config.MODEL_TYPE]
            log_features = [c for c in config.LOG_FEATURES if c in X_train.columns]

            print("\n" + "=" * 70)
            print(f"TRAINING: {config.MODEL_TYPE} | features: {', '.join(config.ACTIVE_FEATURE_GROUPS)}")
            print(f"Train: {len(X_train)} cases | Test: {len(X_test)} cases")
            print("=" * 70)
            print(f"{'Target':<6} | {'R2 (log)':>8} | {'Median err':>10} | {'80% within':>10} | {'MAE (MPa)':>9}")
            print("-" * 70)

            models, metrics = {}, {}
            for target in config.TARGETS:
                model = model_cls(**params)
                model.fit(X_train, np.log(y_train[target]))

                pred = np.exp(model.predict(X_test))
                lo, hi = config.MODULUS_LIMITS[target]
                pred = np.clip(pred, lo, hi)

                m = compute_metrics(y_test[target], pred)
                metrics[target] = m
                models[target] = model
                print(f"{target:<6} | {m['r2_log']:>8.3f} | {m['median_error_pct']:>9.1f}% | "
                      f"{m['p80_error_pct']:>9.1f}% | {m['mae_mpa']:>9.1f}")
                logging.info(f"{target}: {m}")

            # Save everything needed to use the model later, so prediction
            # never depends on the current config file.
            bundle = {
                "models": models,
                "features": list(X_train.columns),
                "log_features": log_features,
                "feature_groups": list(config.ACTIVE_FEATURE_GROUPS),
                "targets": list(config.TARGETS),
                "limits": dict(config.MODULUS_LIMITS),
                "model_type": config.MODEL_TYPE,
                "model_params": params,
                "metrics": metrics,
                "feature_ranges": compute_feature_ranges(X_train, log_features),
            }
            with open(os.path.join(config.ARTIFACTS_DIR, "model.pkl"), "wb") as f:
                pickle.dump(bundle, f)
            with open(os.path.join(config.ARTIFACTS_DIR, "metrics.json"), "w") as f:
                json.dump({k: v for k, v in bundle.items() if k != "models"}, f, indent=2)

            print("-" * 70)
            print(f"Saved: {config.ARTIFACTS_DIR}/model.pkl and metrics.json")
            logging.info("Model bundle saved.")
            return metrics

        except Exception as e:
            logging.error("Error occurred inside ModelTrainer.")
            raise CustomException(e, sys)
