import os
import pandas as pd
from sklearn.model_selection import train_test_split
from ml.logger import logging


class DataIngestion:

    def __init__(self):
        self.raw_data_path = "artifacts/solved_data.csv"
        self.train_data_path = "artifacts/train.csv"
        self.test_data_path = "artifacts/test.csv"

    def initiate_data_ingestion(self, source_path):
        logging.info("Starting structural AI surrogate data ingestion phase.")

        try:
            # 1. Read solved converged results log (or master dataset)
            df = pd.read_csv(source_path)
            df.columns = df.columns.str.strip()

            logging.info(f"Original solved dataset shape: {df.shape}")

            # 2. Required feature and target columns for moduli prediction
            required_columns = [
                "h1_cm",
                "h2_cm",
                "h3_cm",
                "bells_temp",
                "d0_target",
                "sci300_target",
                "E1_MPa",
                "E2_MPa",
                "E3_MPa",
                "E4_MPa"
            ]

            missing_columns = [
                col for col in required_columns if col not in df.columns
            ]
            if missing_columns:
                raise ValueError(
                    f"Missing columns: {', '.join(missing_columns)}"
                )

            df = df[required_columns].dropna()
            os.makedirs("artifacts", exist_ok=True)
            df.to_csv(self.raw_data_path, index=False)

            # 3. Split into train and test sets
            train_set, test_set = train_test_split(
                df, test_size=0.2, random_state=42
            )

            train_set.to_csv(self.train_data_path, index=False)
            test_set.to_csv(self.test_data_path, index=False)

            logging.info(f"Training set shape: {train_set.shape}")
            logging.info(f"Testing set shape: {test_set.shape}")

            return self.train_data_path, self.test_data_path

        except Exception as e:
            logging.error(f"Error during data ingestion: {str(e)}")
            raise