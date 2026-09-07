from ml.pipelines.training_pipeline import TrainingPipeline

if __name__ == "__main__":
    pipeline = TrainingPipeline()
    pipeline.run_pipeline("data/results_log_260608.csv")