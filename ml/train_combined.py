"""
Train ONE model on both regions (Östergötland + Västergötland).

Same settings as the current model (ml/config.py: inputs, log transform, model type, limits).

Split: as in data_ingestion.py, per region: whole road stretches (100 rows ~ 2 km) go to train or test (20 %),
same seed; the 20 ERAPave holdout cases are removed from the Östergötland test set.

Bowls with a modulus stuck at a limit (column at_limit, e.g. E3_min) are not true values, so they are left out of
training (use --keep-at-limit to keep them). Test results are shown per region for the test bowls without a limit
value ("clean", the real reference) and for all usable test bowls.

Run from the project folder:
    uv run python -m ml.train_combined
Output: artifacts_combined/model.pkl, metrics.json, test_metrics_per_region.csv
To use it in the website, copy artifacts_combined/model.pkl to artifacts/model.pkl.
"""
import argparse
import json
import os
import pickle
import time

import numpy as np
import pandas as pd
from sklearn.model_selection import GroupShuffleSplit

from ml import config
from ml.components.data_transformation import build_features
from ml.components.model_trainer import MODEL_CLASSES, compute_metrics, compute_feature_ranges

REGIONS = {
    "Östergötland": "data/backcalc_rows0-7050_full.csv",
    "Västergötland": "data/backcalc_vg_full.csv",
}
OUT_DIR = "artifacts_combined"
BLOCK_OFFSET = 1_000_000          # keeps road-stretch ids of the two regions apart


def load_region(name, path):
    """Usable bowls of one region, split into train and test by road stretch (same as data_ingestion.py)."""
    df = pd.read_csv(path)
    df.columns = df.columns.str.strip()
    features = config.get_feature_columns()
    for col, value in config.FILTERS.items():
        df = df[df[col] == value]
    df["at_limit"] = df["at_limit"].fillna("").astype(str)
    keep = list(dict.fromkeys(["row_index", "key", "survey"] + features + config.TARGETS + ["at_limit"]))
    df = df[keep].dropna(subset=features + config.TARGETS)
    for c in config.LOG_FEATURES:
        if c in df.columns:
            df[c] = df[c].abs()
            df = df[df[c] > 0]

    groups = df[config.SPLIT_GROUP_COLUMN] // config.SPLIT_BLOCK_SIZE
    tr, te = next(GroupShuffleSplit(n_splits=1, test_size=config.TEST_SIZE, random_state=config.RANDOM_STATE)
                  .split(df, groups=groups))
    train, test = df.iloc[tr].copy(), df.iloc[te].copy()
    if name == "Östergötland" and config.HOLDOUT_PER_SURVEY > 0:        # same holdout as data_ingestion.py
        hold = pd.concat([g.sample(min(len(g), config.HOLDOUT_PER_SURVEY), random_state=config.RANDOM_STATE)
                          for _, g in test.groupby("survey")])
        test = test.drop(hold.index)
    for d in (train, test):
        d["region"] = name
        d["block"] = groups.loc[d.index] + (BLOCK_OFFSET if name != "Östergötland" else 0)
    return train, test


def fit(train, features, log_features):
    cls, params = MODEL_CLASSES[config.MODEL_TYPE], config.MODEL_PARAMS[config.MODEL_TYPE]
    X = build_features(train, features, log_features)
    models = {}
    for t in config.TARGETS:
        m = cls(**params)
        m.fit(X, np.log(train[t]))
        models[t] = m
    return models


def predict(models, df, features, log_features):
    X = build_features(df, features, log_features)
    out = {}
    for t in config.TARGETS:
        lo, hi = config.MODULUS_LIMITS[t]
        out[t] = np.clip(np.exp(models[t].predict(X)), lo, hi)
    return out


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--keep-at-limit", action="store_true",
                    help="also train on bowls with a modulus at a limit (default: left out)")
    args = ap.parse_args()
    drop = not args.keep_at_limit

    features = config.get_feature_columns()
    log_features = [c for c in config.LOG_FEATURES if c in features]

    trains, tests = {}, {}
    for name, path in REGIONS.items():
        if not os.path.exists(path):
            raise FileNotFoundError(f"{path} not found (backcalculation results of {name})")
        trains[name], tests[name] = load_region(name, path)

    train = pd.concat(trains.values())
    if drop:
        train = train[train.at_limit == ""]

    print("=" * 78)
    print(f"COMBINED MODEL: {config.MODEL_TYPE} | inputs: {', '.join(config.ACTIVE_FEATURE_GROUPS)} | "
          f"training bowls at a limit: {'left out' if drop else 'kept'}")
    for r in REGIONS:
        t, s = trains[r], tests[r]
        print(f"  {r:<14} train {(t.at_limit == '').sum() if drop else len(t):>6,} bowls | "
              f"test {len(s):>6,} ({(s.at_limit == '').sum():,} clean)")
    t0 = time.time()
    models = fit(train, features, log_features)
    print(f"Trained on {len(train):,} bowls in {time.time() - t0:.0f} s")
    print("=" * 78)

    # Test on the unseen road stretches of each region
    rows = []
    for test_region, te in list(tests.items()) + [("Both regions", pd.concat(tests.values()))]:
        pred = predict(models, te, features, log_features)
        for subset, mask in [("all", np.ones(len(te), bool)), ("clean", (te.at_limit == "").values)]:
            for t in config.TARGETS:
                m = compute_metrics(te[t].values[mask], pred[t][mask])
                rows.append({"tested_on": test_region, "test_bowls": subset, "n": int(mask.sum()), "target": t,
                             **{k: round(v, 3) for k, v in m.items()}})
    res = pd.DataFrame(rows)

    for subset in ("clean", "all"):
        print(f"\nTest bowls: {'clean (no limit value; the real reference)' if subset == 'clean' else 'all usable'}")
        print(f"  {'tested on':<16}{'n':>7}" + "".join(f"{t:>16}" for t in config.TARGETS) + "   median error % (R² log)")
        for test_region in res.tested_on.unique():
            q = res[(res.tested_on == test_region) & (res.test_bowls == subset)].set_index("target")
            print(f"  {test_region:<16}{q.n.iat[0]:>7,}" + "".join(
                f"{q.loc[t, 'median_error_pct']:>8.1f}% ({q.loc[t, 'r2_log']:.2f})" for t in config.TARGETS))

    # Save the model in the same format as artifacts/model.pkl
    os.makedirs(OUT_DIR, exist_ok=True)
    res.to_csv(os.path.join(OUT_DIR, "test_metrics_per_region.csv"), index=False)
    clean = res[(res.tested_on == "Both regions") & (res.test_bowls == "clean")].set_index("target")
    metrics = {t: {k: float(clean.loc[t, k]) for k in ("r2_log", "mae_mpa", "median_error_pct", "p80_error_pct")}
               for t in config.TARGETS}
    bundle = {
        "models": models,
        "features": list(features),
        "log_features": log_features,
        "feature_groups": list(config.ACTIVE_FEATURE_GROUPS),
        "targets": list(config.TARGETS),
        "limits": dict(config.MODULUS_LIMITS),
        "model_type": config.MODEL_TYPE,
        "model_params": config.MODEL_PARAMS[config.MODEL_TYPE],
        "metrics": metrics,                                   # clean test bowls, both regions
        "feature_ranges": compute_feature_ranges(build_features(train, features, log_features), log_features),
        "regions": list(REGIONS),
        "dropped_at_limit": drop,
    }
    with open(os.path.join(OUT_DIR, "model.pkl"), "wb") as f:
        pickle.dump(bundle, f)
    with open(os.path.join(OUT_DIR, "metrics.json"), "w") as f:
        json.dump({k: v for k, v in bundle.items() if k != "models"}, f, indent=2)
    print(f"\nSaved: {OUT_DIR}/model.pkl, metrics.json, test_metrics_per_region.csv")
    print(f"To use it in the website: copy {OUT_DIR}/model.pkl to {config.ARTIFACTS_DIR}/model.pkl")


if __name__ == "__main__":
    main()
