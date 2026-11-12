"""
Reliability of a backcalculation, predicted from the measurement alone. Trained on BOTH regions
(Östergötland + Västergötland), with the same inputs as the modulus model (deflection bowl + thicknesses).

1. Reliability classifier
   Predicts the probability that a bowl gives an UNRELIABLE backcalculation: a poor fit (RMS > 5 %) or a modulus
   stuck at a limit (column at_limit). Both regions have this label.
   (The earlier label "unrealistic without limits" needs a run without limits, which only exists for Östergötland.
   There, every unrealistic bowl is also a poor fit or at a limit, and 90 % of the poor-fit / at-limit bowls are
   unrealistic, so the two labels are almost the same.)

2. Calibrated ranges for E1-E4 (conformalized quantile regression)
   Low (10 %) and high (90 %) quantile models on the clean bowls (fit <= 5 %, no modulus at a limit, the same bowls
   as the combined modulus model), widened on a calibration set so that about 80 % of true values fall inside.

Split: the same unseen road stretches as ml/train_combined.py are the test set; the remaining stretches are split
into fit (80 %) and calibration (20 %).

Train:    uv run python train_reliability.py
Use:      bundle = load_reliability(); assess(bundle, features_df)
"""
import os
import pickle

import numpy as np
import pandas as pd
from sklearn.calibration import CalibratedClassifierCV
from sklearn.ensemble import HistGradientBoostingClassifier, HistGradientBoostingRegressor
from sklearn.frozen import FrozenEstimator
from sklearn.metrics import brier_score_loss, precision_score, recall_score, roc_auc_score
from sklearn.model_selection import GroupShuffleSplit

from ml import config
from ml.components.data_transformation import build_features
from ml.train_combined import BLOCK_OFFSET, REGIONS, load_region

BUNDLE_PATH = os.path.join(config.ARTIFACTS_DIR, "reliability.pkl")
COVERAGE = 0.80            # target share of true values inside the range
THRESHOLD = 0.5            # probability above which a case is flagged unreliable


def _load_data():
    """All backcalculated bowls of both regions (good and poor fits), with the label and the test flag."""
    features = config.get_feature_columns()
    parts = []
    for i, (name, path) in enumerate(REGIONS.items()):
        d = pd.read_csv(path)
        d.columns = d.columns.str.strip()
        d["at_limit"] = d["at_limit"].fillna("").astype(str)
        for c in config.LOG_FEATURES:
            d[c] = d[c].abs()
        d = d.dropna(subset=features + config.TARGETS)
        d = d[(d[config.LOG_FEATURES] > 0).all(axis=1)].copy()
        d["region"] = name
        d["block"] = d[config.SPLIT_GROUP_COLUMN] // config.SPLIT_BLOCK_SIZE + (BLOCK_OFFSET if i else 0)
        _, test = load_region(name, path)                       # same unseen stretches as the modulus model
        d["is_test"] = d.block.isin(set(test.block))
        parts.append(d)
    d = pd.concat(parts, ignore_index=True)
    d["unreliable"] = ((d.poor_fit == 1) | (d.at_limit != "")).astype(int)
    d["clean"] = d.unreliable == 0
    return d


def _split(d):
    test = np.where(d.is_test)[0]
    rest = np.where(~d.is_test)[0]
    fit_i, cal_i = next(GroupShuffleSplit(1, test_size=0.2, random_state=config.RANDOM_STATE)
                        .split(rest, groups=d.block.iloc[rest]))
    return rest[fit_i], rest[cal_i], test


def train_reliability():
    d = _load_data()
    features = config.get_feature_columns()
    log_features = [c for c in config.LOG_FEATURES if c in features]
    X = build_features(d, features, log_features)
    fit, cal, test = _split(d)
    report = {"label": "unreliable = poor fit (RMS > 5 %) or a modulus at a limit",
              "regions": list(REGIONS), "cases": {"fit": len(fit), "calibration": len(cal), "test": len(test)}}

    # ---- 1. reliability classifier (all bowls), probabilities calibrated on unseen stretches
    y = d["unreliable"].values
    clf = HistGradientBoostingClassifier(max_iter=400, learning_rate=0.05, random_state=config.RANDOM_STATE)
    clf.fit(X.iloc[fit], y[fit])
    clf = CalibratedClassifierCV(FrozenEstimator(clf), method="isotonic").fit(X.iloc[cal], y[cal])
    p_all = clf.predict_proba(X.iloc[test])[:, 1]
    report["classifier"] = {}
    for name in ["all"] + list(REGIONS):
        m = np.ones(len(test), bool) if name == "all" else (d.region.values[test] == name)
        yt, pt = y[test][m], p_all[m]
        flag = pt >= THRESHOLD
        report["classifier"][name] = {
            "base_rate_pct": round(100 * yt.mean(), 1), "auc": round(roc_auc_score(yt, pt), 3),
            "brier": round(brier_score_loss(yt, pt), 3), "flagged_pct": round(100 * flag.mean(), 1),
            "precision": round(precision_score(yt, flag), 3), "recall": round(recall_score(yt, flag), 3),
        }

    # ---- 2. calibrated ranges for E1-E4 (clean bowls only, like the combined modulus model)
    clean = d["clean"].values
    fit_g, cal_g, test_g = (np.intersect1d(i, np.where(clean)[0]) for i in (fit, cal, test))
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
        inside = (yl[test_g] >= lo) & (yl[test_g] <= hi)
        reg = d.region.values[test_g]
        report["ranges"][t] = {
            "coverage_pct": round(100 * inside.mean(), 1),
            **{f"coverage_pct_{r}": round(100 * inside[reg == r].mean(), 1) for r in REGIONS},
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
