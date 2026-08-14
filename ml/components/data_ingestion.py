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

        logging.info(
            "Starting structural AI data ingestion phase."
        )

        try:
            # --------------------------------------------------
            # 1. Read Excel file
            # --------------------------------------------------
            df = pd.read_excel(
                source_path,
                sheet_name="Uttag_temp_korr"
            )

            # Remove accidental spaces from column names
            df.columns = df.columns.str.strip()

            logging.info(
                f"Original dataset shape: {df.shape}"
            )

            # --------------------------------------------------
            # 2. Variables required for the first prototype
            # --------------------------------------------------
            required_columns = [
                "Medelförtsd_1_SCI_300",
                "Medelförpmsv4_AADT",
                "Medelförtsd_1_BELLS_TEMP",
                "Medelförmst_Layer_1_thk",
                "Medelförtsd_1_D0000",
            ]

            # --------------------------------------------------
            # 3. Check that all required columns exist
            # --------------------------------------------------
            missing_columns = [
                col
                for col in required_columns
                if col not in df.columns
            ]

            if missing_columns:
                raise ValueError(
                    "The following required columns are missing: "
                    + ", ".join(missing_columns)
                )

            # --------------------------------------------------
            # 4. Keep only variables used by this prototype
            # --------------------------------------------------
            df = df[required_columns].copy()

            logging.info(
                f"Selected structural AI columns: {required_columns}"
            )

            # --------------------------------------------------
            # 5. Remove rows with missing values
            # --------------------------------------------------
            rows_before = len(df)

            df = df.dropna()

            rows_after = len(df)

            rows_removed = rows_before - rows_after

            logging.info(
                f"Rows before removing missing values: "
                f"{rows_before}"
            )

            logging.info(
                f"Rows removed because of missing values: "
                f"{rows_removed}"
            )

            logging.info(
                f"Complete rows remaining: {rows_after}"
            )

            # --------------------------------------------------
            # 6. Create artifacts directory
            # --------------------------------------------------
            os.makedirs(
                "artifacts",
                exist_ok=True
            )

            # Save cleaned data
            df.to_excel(
                self.raw_data_path,
                index=False
            )

            # --------------------------------------------------
            # 7. Split data into training and testing sets
            # --------------------------------------------------
            train_set, test_set = train_test_split(
                df,
                test_size=0.2,
                random_state=42
            )

            # --------------------------------------------------
            # 8. Save train and test data
            # --------------------------------------------------
            train_set.to_csv(
                self.train_data_path,
                index=False
            )

            test_set.to_csv(
                self.test_data_path,
                index=False
            )

            logging.info(
                f"Training dataset shape: {train_set.shape}"
            )

            logging.info(
                f"Testing dataset shape: {test_set.shape}"
            )

            logging.info(
                "Structural AI data ingestion completed successfully."
            )

            return (
                self.train_data_path,
                self.test_data_path
            )

        except Exception as e:

            logging.error(
                f"Error encountered during structural AI "
                f"data ingestion: {str(e)}"
            )

            raise