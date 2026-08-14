import pandas as pd
from ml.logger import logging


class DataTransformation:
    def process_data(self, train_path, test_path):
        try:
            train_df = pd.read_csv(train_path)
            test_df = pd.read_csv(test_path)

            features = [
                "Medelförtsd_1_SCI_300",
                "Medelförpmsv4_AADT",
                "Medelförtsd_1_BELLS_TEMP",
                "Medelförmst_Layer_1_thk",
            ]
            target = "Medelförtsd_1_D0000"

            train_df = train_df[features + [target]].dropna()
            test_df = test_df[features + [target]].dropna()

            X_train = train_df[features]
            y_train = train_df[target]
            X_test = test_df[features]
            y_test = test_df[target]

            logging.info(f"Features: {features}")
            logging.info(f"Target: {target}")
            logging.info(f"Training samples: {len(X_train)}")
            logging.info(f"Test samples: {len(X_test)}")

            return X_train, y_train, X_test, y_test

        except Exception as e:
            logging.error(f"Structural AI transformation error: {str(e)}")
            raise
