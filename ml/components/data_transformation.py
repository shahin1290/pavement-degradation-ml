import pandas as pd
from ml.logger import logging

class DataTransformation:
    def process_data(self, train_path, test_path):
        try:
            train_df = pd.read_csv(train_path)
            test_df = pd.read_csv(test_path)
            
            logging.info("Transforming variables and engineering Pavement_Age.")
            for df in [train_df, test_df]:
                df['Pavement_Age'] = 2026 - df['Beläggningsår']
                
            features = ['Spårdjup max 15', 'ÅDT fordon', 'Pavement_Age', 'Hastighetsgräns']
            target = 'IRI höger'
            
            X_train = train_df[features]
            y_train = train_df[target]
            X_test = test_df[features]
            y_test = test_df[target]
            
            return X_train, y_train, X_test, y_test
        except Exception as e:
            raise e