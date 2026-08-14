import sys

from ml.exception import CustomException
from ml.logger import logging
from ml.components.data_ingestion import DataIngestion
from ml.components.data_transformation import DataTransformation
from ml.components.model_trainer import ModelTrainer


class TrainingPipeline:
    def run_pipeline(self, raw_data_path: str):
        try:
            logging.info("--- Structural AI Training Pipeline Triggered ---")

            ingestion = DataIngestion()
            train_path, test_path = ingestion.initiate_data_ingestion(
                raw_data_path
            )

            transformation = DataTransformation()
            X_train, y_train, X_test, y_test = transformation.process_data(
                train_path, test_path
            )

            trainer = ModelTrainer()
            r2, mae = trainer.initiate_model_trainer(
                X_train, y_train, X_test, y_test
            )

            logging.info("--- Structural AI Training Pipeline Finished ---")
            return r2, mae

        except Exception as e:
            logging.error("Structural AI Training Pipeline failed.")
            raise CustomException(e, sys)


if __name__ == "__main__":
    pipeline = TrainingPipeline()
    pipeline.run_pipeline("data/structural-ai-data.xlsx")
