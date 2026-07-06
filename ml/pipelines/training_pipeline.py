import sys
from ml.exception import CustomException
from ml.logger import logging
from ml.components.data_ingestion import DataIngestion
from ml.components.data_transformation import DataTransformation
from ml.components.model_trainer import ModelTrainer

class TrainingPipeline:
    def __init__(self):
        pass

    def run_pipeline(self, raw_data_path: str):
        """
        Executes the full end-to-end training architecture:
        Ingestion -> Transformation -> Model Training & Serialization
        """
        try:
            logging.info("--- Training Pipeline Triggered ---")
            
            # 1. Data Ingestion Phase
            ingestion = DataIngestion()
            train_path, test_path = ingestion.initiate_data_ingestion(raw_data_path)
            
            # 2. Data Transformation Phase
            transformation = DataTransformation()
            X_train, y_train, X_test, y_test = transformation.process_data(train_path, test_path)
            
            # 3. Model Training & Evaluation Phase
            trainer = ModelTrainer()
            r2, mae = trainer.initiate_model_trainer(X_train, y_train, X_test, y_test)
            
            logging.info("--- Training Pipeline Finished Successfully ---")
            return r2, mae

        except Exception as e:
            logging.error("Exception occurred within the Training Pipeline execution block")
            raise CustomException(e, sys)

if __name__ == "__main__":
    # This allows you to test the pipeline directly by running this script
    pipeline = TrainingPipeline()
    pipeline.run_pipeline("data/Dataexport från PMSv4_2026-07-06_144059.xlsx")