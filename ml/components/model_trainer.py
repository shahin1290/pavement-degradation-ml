import os
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import r2_score, mean_absolute_error
from ml.utils import save_object
from ml.logger import logging

class ModelTrainer:
    def __init__(self):
        self.model_file_path = os.path.join("artifacts", "model.pkl")

    def initiate_model_trainer(self, X_train, y_train, X_test, y_test):
        try:
            logging.info("Training baseline Random Forest Regressor on full network grid...")
            model = RandomForestRegressor(n_estimators=100, random_state=42, n_jobs=-1)
            model.fit(X_train, y_train)
            
            predictions = model.predict(X_test)
            r2 = r2_score(y_test, predictions)
            mae = mean_absolute_error(y_test, predictions)
            
            logging.info(f"Training finalized. Performance Metrics: R²: {r2:.3f}, MAE: {mae:.3f}")
            
            # Persist model weights to disk
            save_object(self.model_file_path, model)
            return r2, mae
        except Exception as e:
            raise e