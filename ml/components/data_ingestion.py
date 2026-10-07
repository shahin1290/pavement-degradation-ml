import os
import numpy as np
import pandas as pd
from sklearn.model_selection import GroupShuffleSplit

from ml import config
from ml.logger import logging


class DataIngestion:

    def __init__(self):
        self.raw_data_path = os.path.join(config.ARTIFACTS_DIR, "solved_data.csv")
        self.train_data_path = os.path.join(config.ARTIFACTS_DIR, "train.csv")
        self.test_data_path = os.path.join(config.ARTIFACTS_DIR, "test.csv")
        self.holdout_data_path = os.path.join(config.ARTIFACTS_DIR, "holdout.csv")

    def initiate_data_ingestion(self, source_path=None):
        source_path = source_path or config.DATA_PATH
        logging.info(f"Starting data ingestion from {source_path}")

        try:
            df = pd.read_csv(source_path)
            df.columns = df.columns.str.strip()
            logging.info(f"Original dataset shape: {df.shape}")

            # 1. Check that every needed column exists
            features = config.get_feature_columns()
            keep_cols = ["row_index", "key", "survey"]       # for splitting and per-survey results
            needed = list(dict.fromkeys(
                keep_cols + features + config.TARGETS
                + list(config.FILTERS) + [config.SPLIT_GROUP_COLUMN]
            ))
            missing = [c for c in needed if c not in df.columns]
            if missing:
                raise ValueError(f"Missing columns: {', '.join(missing)}")

            # 2. Keep only reliable labels
            for col, value in config.FILTERS.items():
                before = len(df)
                df = df[df[col] == value]
                logging.info(f"Filter {col} == {value}: {before} -> {len(df)} rows")

            df = df[needed].dropna()

            # 3. Deflections must be positive (they are logged later)
            for c in config.LOG_FEATURES:
                if c in df.columns:
                    df[c] = df[c].abs()
                    df = df[df[c] > 0]

            os.makedirs(config.ARTIFACTS_DIR, exist_ok=True)
            df.to_csv(self.raw_data_path, index=False)

            # 4. Split by road stretch, not randomly
            groups = df[config.SPLIT_GROUP_COLUMN] // config.SPLIT_BLOCK_SIZE
            splitter = GroupShuffleSplit(
                n_splits=1, test_size=config.TEST_SIZE,
                random_state=config.RANDOM_STATE,
            )
            train_idx, test_idx = next(splitter.split(df, groups=groups))
            train_set, test_set = df.iloc[train_idx], df.iloc[test_idx]

            overlap = set(groups.iloc[train_idx]) & set(groups.iloc[test_idx])
            if overlap:
                raise RuntimeError("Train and test share road stretches.")

            # 5. Put a few random test cases aside for ERAPAVE checks
            holdout = test_set.iloc[0:0]
            if config.HOLDOUT_PER_SURVEY > 0:
                picks = [g.sample(min(len(g), config.HOLDOUT_PER_SURVEY),
                                  random_state=config.RANDOM_STATE)
                         for _, g in test_set.groupby("survey")]
                holdout = pd.concat(picks)
                test_set = test_set.drop(holdout.index)
            holdout.sort_values(["row_index", "survey"]).to_csv(self.holdout_data_path, index=False)
            logging.info(f"Holdout set: {len(holdout)} cases -> {self.holdout_data_path}")

            train_set.to_csv(self.train_data_path, index=False)
            test_set.to_csv(self.test_data_path, index=False)

            logging.info(f"Training set: {train_set.shape}, "
                         f"{groups.iloc[train_idx].nunique()} road stretches")
            logging.info(f"Test set: {test_set.shape}, "
                         f"{groups.iloc[test_idx].nunique()} road stretches")

            return self.train_data_path, self.test_data_path

        except Exception as e:
            logging.error(f"Error during data ingestion: {str(e)}")
            raise
