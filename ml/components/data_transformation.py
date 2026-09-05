import pandas as pd
from ml.logger import logging


class DataTransformation:
    def process_data(self, train_path, test_path):
        try:
            train_df = pd.read_csv(train_path)
            test_df = pd.read_csv(test_path)

            features = [
                "h1_cm",
                "h2_cm",
                "h3_cm",
                "bells_temp",
                "d0_target",
                "sci300_target",
            ]
            targets = ["E1_MPa", "E2_MPa", "E3_MPa", "E4_MPa"]

            X_train = train_df[features]
            y_train = train_df[targets]
            X_test = test_df[features]
            y_test = test_df[targets]

            logging.info(f"Features: {features}")
            logging.info(f"Targets: {targets}")
            logging.info(f"Training samples: {len(X_train)}")
            logging.info(f"Test samples: {len(X_test)}")

            return X_train, y_train, X_test, y_test

        except Exception as e:
            logging.error(f"Structural AI transformation error: {str(e)}")
            raise