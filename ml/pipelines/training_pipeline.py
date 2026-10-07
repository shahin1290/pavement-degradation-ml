import sys

from ml import config
from ml.exception import CustomException
from ml.logger import logging
from ml.components.data_ingestion import DataIngestion
from ml.components.data_transformation import DataTransformation
from ml.components.model_trainer import ModelTrainer


class TrainingPipeline:
    def run_pipeline(self, raw_data_path: str = None):
        try:
            logging.info("--- Training pipeline started ---")

            ingestion = DataIngestion()
            train_path, test_path = ingestion.initiate_data_ingestion(
                raw_data_path or config.DATA_PATH
            )

            transformation = DataTransformation()
            X_train, y_train, X_test, y_test = transformation.process_data(
                train_path, test_path
            )

            trainer = ModelTrainer()
            metrics = trainer.initiate_model_trainer(X_train, y_train, X_test, y_test)

            logging.info("--- Training pipeline finished ---")
            return metrics

        except Exception as e:
            logging.error("Training pipeline failed.")
            raise CustomException(e, sys)


if __name__ == "__main__":
    TrainingPipeline().run_pipeline()
