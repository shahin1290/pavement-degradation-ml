"""Train the reliability model (run after train.py, which creates the test/holdout split)."""
import json
from ml.reliability import train_reliability, BUNDLE_PATH

if __name__ == "__main__":
    report = train_reliability()
    print(json.dumps(report, indent=2))
    print(f"Saved: {BUNDLE_PATH}")
