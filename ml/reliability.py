"""
Reliability of a backcalculation, predicted from the measurement alone.

Two parts, trained on the same inputs as the modulus model (deflection bowl + thicknesses):

1. Reliability classifier
   Predicts the probability that a case is UNRELIABLE: it fits the deflections
   without modulus limits but gives physically unrealistic moduli (the layers trade off).
   Labels come from backcalc_full_with_vs_without_limits.csv.

2. Calibrated ranges for E1-E4 (conformalized quantile regression)
   Low (10 %) and high (90 %) quantile models, widened on a calibration set so that
   about 80 % of true values really fall inside the range.

Train:    python train_reliability.py
Use:      bundle = load_reliability(); assess(bundle, features_df)
"""
import os
import pickle
import numpy as np
import pandas as pd
from sklearn.ensemble import HistGradientBoostingClassifier, HistGradientBoostingRegressor
from sklearn.calibration import CalibratedClassifierCV
from sklearn.frozen import FrozenEstimator
from sklearn.model_selection import GroupShuffleSplit
from sklearn.metrics import roc_auc_score, precision_score, recall_score, brier_score_loss

from ml import config
from ml.components.data_transformation import build_features

LABELS_PATH = "data/backcalc_full_with_vs_without_limits.csv"
BUNDLE_PATH = os.path.join(config.ARTIFACTS_DIR, "reliability.pkl")
COVERAGE = 0.80            # target share of true values inside the range
THRESHOLD = 0.5            # probability above which a case is flagged unreliable


def _load_data(data_path, labels_path):
    """All backcalculated cases (good and poor fits) with the unreliable label."""
    d = pd.read_csv(data_path)
    lab = pd.read_csv(labels_path)[["row_index", "survey", "unrealistic_without_limits"]]
    d = d.merge(lab, on=["row_index", "survey"], how="inner")
    for c in config.LOG_FEATURES:
        d[c] = d[c].abs()
    return d.dropna(subset=config.get_feature_columns())


def _split_groups(d):
    """
    Same unseen road stretches as the modulus model: test = stretches in artifacts/test.csv
    and holdout.csv. The rest is split into fit (80 %) and calibration (20 %) stretches.
    """
    groups = d[config.SPLIT_GROUP_COLUMN] // config.SPLIT_BLOCK_SIZE
    test_rows = pd.concat([pd.read_csv(os.path.join(config.ARTIFACTS_DIR, f)) for f in ("test.csv", "holdout.csv")])
    test_groups = set(test_rows[config.SPLIT_GROUP_COLUMN] // config.SPLIT_BLOCK_SIZE)
    is_test = groups.isin(test_groups).values
    rest = np.where(~is_test)[0]
    fit_i, cal_i = next(GroupShuffleSplit(1, test_size=0.2, random_state=config.RANDOM_STATE)
                        .split(rest, groups=groups.iloc[rest]))
    return rest[fit_i], rest[cal_i], np.where(is_test)[0]


def train_reliability(data_path=config.DATA_PATH, labels_path=LABELS_PATH):
    d = _load_data(data_path, labels_path)
    features = config.get_feature_columns()
    log_features = [c for c in config.LOG_FEATURES if c in features]
    X = build_features(d, features, log_features)
    fit, cal, test = _split_groups(d)
    report = {"cases": {"fit": len(fit), "calibration": len(cal), "test": len(test)}}

    # ---- 1. reliability classifier (all cases), probabilities calibrated on unseen stretches
    y = d["unrealistic_without_limits"].astype(int).values
    clf = HistGradientBoostingClassifier(max_iter=400, learning_rate=0.05, random_state=config.RANDOM_STATE)
    clf.fit(X.iloc[fit], y[fit])
    clf = CalibratedClassifierCV(FrozenEstimator(clf), method="isotonic").fit(X.iloc[cal], y[cal])
    p = clf.predict_proba(X.iloc[test])[:, 1]
    flag = p >= THRESHOLD
    report["classifier"] = {
        "base_rate_pct": round(100 * y[test].mean(), 1),
        "auc": round(roc_auc_score(y[test], p), 3),
        "brier": round(brier_score_loss(y[test], p), 3),
        "flagged_pct": round(100 * flag.mean(), 1),
        "precision": round(precision_score(y[test], flag), 3),
        "recall": round(recall_score(y[test], flag), 3),
    }

    # ---- 2. calibrated ranges for E1-E4 (good fits only, like the modulus model)
    good = (d["poor_fit"] == 0).values
    fit_g, cal_g, test_g = (np.intersect1d(i, np.where(good)[0]) for i in (fit, cal, test))
    lo_q, hi_q = (1 - COVERAGE) / 2, 1 - (1 - COVERAGE) / 2
    ranges, report["ranges"] = {}, {}
    for t in config.TARGETS:
        yl = np.log(d[t].values)
        m_lo, m_hi = (HistGradientBoostingRegressor(loss="quantile", quantile=q, max_iter=300, learning_rate=0.05,
                                                    random_state=config.RANDOM_STATE).fit(X.iloc[fit_g], yl[fit_g])
                      for q in (lo_q, hi_q))
        # conformal step: how far outside the range the calibration cases fall
        s = np.maximum(m_lo.predict(X.iloc[cal_g]) - yl[cal_g], yl[cal_g] - m_hi.predict(X.iloc[cal_g]))
        n = len(s)
        widen = float(np.quantile(s, min(1.0, np.ceil((n + 1) * COVERAGE) / n)))
        ranges[t] = {"lo": m_lo, "hi": m_hi, "widen": widen}
        lo = m_lo.predict(X.iloc[test_g]) - widen
        hi = m_hi.predict(X.iloc[test_g]) + widen
        report["ranges"][t] = {
            "coverage_pct": round(100 * np.mean((yl[test_g] >= lo) & (yl[test_g] <= hi)), 1),
            "median_width_factor": round(float(np.median(np.exp(hi - lo))), 2),
        }

    bundle = {"classifier": clf, "ranges": ranges, "features": features, "log_features": log_features,
              "threshold": THRESHOLD, "coverage": COVERAGE, "limits": dict(config.MODULUS_LIMITS), "report": report}
    os.makedirs(config.ARTIFACTS_DIR, exist_ok=True)
    with open(BUNDLE_PATH, "wb") as f:
        pickle.dump(bundle, f)
    return report


def load_reliability(path=BUNDLE_PATH):
    with open(path, "rb") as f:
        return pickle.load(f)


def assess(bundle, features_df):
    """
    For each row: probability that the backcalculation is unreliable, a flag,
    and a calibrated low-high range (MPa) for E1-E4.
    """
    X = build_features(features_df, bundle["features"], bundle["log_features"])
    out = pd.DataFrame(index=features_df.index)
    out["p_unreliable"] = bundle["classifier"].predict_proba(X)[:, 1]
    out["unreliable"] = out["p_unreliable"] >= bundle["threshold"]
    for t, r in bundle["ranges"].items():
        lo_lim, hi_lim = bundle["limits"][t]
        out[f"{t}_low"] = np.clip(np.exp(r["lo"].predict(X) - r["widen"]), lo_lim, hi_lim)
        out[f"{t}_high"] = np.clip(np.exp(r["hi"].predict(X) + r["widen"]), lo_lim, hi_lim)
    return out
