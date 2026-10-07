
# ============================================================
# DATA
# ============================================================

# Backcalculation results, one row per (Excel row, survey)
DATA_PATH = "data/backcalc_rows0-7050_full.csv"

ARTIFACTS_DIR = "artifacts"

# ============================================================
# FEATURES (inputs)
# ============================================================

# All available input groups. Column names must match the data file.
FEATURE_GROUPS = {
    # Core inputs: exactly what the backcalculation used
    "deflections": ["D0", "D130", "D215", "D300", "D450",
                    "D600", "D900", "D1200", "D1500"],          # micrometres, positive
    "thicknesses": ["thk1_mm", "thk2_mm", "thk3_mm"],           # mm

    # Optional groups to test later
    "survey":      ["survey"],                                  # 1-4
    "temperature": ["asphalt_temp_C"],                          # BELLS temperature
    "speed":       ["speed_kmh"],
}

# Groups used in the current experiment
ACTIVE_FEATURE_GROUPS = ["deflections", "thicknesses"]

# Features that are log-transformed before training (wide-ranging, positive)
LOG_FEATURES = FEATURE_GROUPS["deflections"]

# ============================================================
# TARGETS (outputs)
# ============================================================

TARGETS = ["E1", "E2", "E3", "E4"]   # MPa, trained in log space

# Backcalculation limits (MPa). Predictions are clipped to these.
MODULUS_LIMITS = {
    "E1": (1500, 8000),
    "E2": (100, 3000),
    "E3": (50, 600),
    "E4": (30, 400),
}

# ============================================================
# DATA FILTERS
# ============================================================

# Only train on reliable labels: backcalculation RMS <= 5 %
FILTERS = {
    "poor_fit": 0,
}

# ============================================================
# TRAIN / TEST SPLIT
# ============================================================

# Rows are 20 m apart, so neighbours are almost identical.
# Whole road stretches go either to train or to test.
SPLIT_GROUP_COLUMN = "row_index"
SPLIT_BLOCK_SIZE = 100        # rows per block (100 rows ~ 2 km)
TEST_SIZE = 0.2
RANDOM_STATE = 42

# ============================================================
# HOLDOUT (cases kept aside for manual checks in ERAPAVE)
# ============================================================

# Taken from the unseen test road stretches, then removed from the test set,
# so they are used neither for training nor for the test metrics.
HOLDOUT_PER_SURVEY = 5        # 5 x 4 surveys = 20 cases; set 0 to disable

# ERAPAVE settings for the .dat files (same as the backcalculation)
ERAPAVE_LOAD_KN = 100.0
ERAPAVE_STRESS_KPA = 800.0
ERAPAVE_POISSON = [0.35, 0.35, 0.35, 0.40]
ERAPAVE_UNIT_WEIGHT = [24, 22, 20, 18]
ERAPAVE_EVAL_CM = [0, 13, 21.5, 30, 45, 60, 90, 120, 150]

# ============================================================
# MODEL
# ============================================================

# "random_forest" or "hist_gradient_boosting"
MODEL_TYPE = "hist_gradient_boosting"

MODEL_PARAMS = {
    "random_forest": {
        "n_estimators": 300,
        "min_samples_leaf": 2,
        "random_state": RANDOM_STATE,
        "n_jobs": -1,
    },
    "hist_gradient_boosting": {
        "max_iter": 600,
        "learning_rate": 0.05,
        "random_state": RANDOM_STATE,
    },
}


def get_feature_columns():
    cols = []
    for group in ACTIVE_FEATURE_GROUPS:
        if group not in FEATURE_GROUPS:
            raise ValueError(f"Unknown feature group: {group}")
        for c in FEATURE_GROUPS[group]:
            if c not in cols:
                cols.append(c)
    return cols
