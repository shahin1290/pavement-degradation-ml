from ml import config
from ml.pipelines.training_pipeline import TrainingPipeline

if __name__ == "__main__":
    # Data file, features, split and model are set in ml/config.py
    TrainingPipeline().run_pipeline(config.DATA_PATH)
