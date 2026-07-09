from ml.pipelines.training_pipeline import TrainingPipeline

if __name__ == "__main__":
    pipeline = TrainingPipeline()
    pipeline.run_pipeline("data/data-7-features.xlsx")