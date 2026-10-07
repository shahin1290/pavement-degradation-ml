import numpy as np
import pandas as pd

from ml import config
from ml.logger import logging


def build_features(df, feature_columns, log_features):
    """
    Turn raw input columns into model inputs.
    Used for training, evaluation AND prediction, so all three always match.
    """
    X = df[feature_columns].astype(float).copy()
    for c in feature_columns:
        if c in log_features:
            X[c] = np.log(X[c].abs())
    return X


class DataTransformation:
    def process_data(self, train_path, test_path):
        try:
            train_df = pd.read_csv(train_path)
            test_df = pd.read_csv(test_path)

            features = config.get_feature_columns()
            log_features = [c for c in config.LOG_FEATURES if c in features]
            targets = config.TARGETS

            X_train = build_features(train_df, features, log_features)
            X_test = build_features(test_df, features, log_features)
            y_train = train_df[targets]
            y_test = test_df[targets]

            logging.info(f"Feature groups: {config.ACTIVE_FEATURE_GROUPS}")
            logging.info(f"Features: {features}")
            logging.info(f"Log-transformed: {log_features}")
            logging.info(f"Targets: {targets}")
            logging.info(f"Training samples: {len(X_train)}, test samples: {len(X_test)}")

            return X_train, y_train, X_test, y_test

        except Exception as e:
            logging.error(f"Data transformation error: {str(e)}")
            raise
