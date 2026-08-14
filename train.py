from ml.pipelines.training_pipeline import TrainingPipeline

if __name__ == "__main__":
    pipeline = TrainingPipeline()
    pipeline.run_pipeline("data/Uttag_temp_korr_20m_260608_with_distance.xlsx")