import os
import pandas as pd
from sklearn.model_selection import train_test_split
from ml.logger import logging

class DataIngestion:
    def __init__(self):
        self.raw_data_path = "artifacts/data.xlsx"
        self.train_data_path = "artifacts/train.csv"
        self.test_data_path = "artifacts/test.csv"

    def initiate_data_ingestion(self, source_path):
        logging.info("Starting data ingestion phase.")
        try:
            df = pd.read_excel(source_path, sheet_name='20m data')
            df.columns = df.columns.str.strip()
            
            os.makedirs(os.path.dirname(self.raw_data_path), exist_ok=True)
            df.to_excel(self.raw_data_path, index=False)
            
            train_set, test_set = train_test_split(df, test_size=0.2, random_state=42)
            train_set.to_csv(self.train_data_path, index=False, header=True)
            test_set.to_csv(self.test_data_path, index=False, header=True)
            
            logging.info("Data splits exported to artifacts successfully.")
            return self.train_data_path, self.test_data_path
        except Exception as e:
            logging.error(f"Error encountered during Ingestion: {str(e)}")
            raise e