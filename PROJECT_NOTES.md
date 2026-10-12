# Project notes — ML prediction of pavement layer moduli from TSD

_Last updated: 12 Oct 2026. Start every new Claude chat with: "Read PROJECT_NOTES.md in my repo."_

## 1. Goal (one paragraph)
Predict the layer moduli **E1 (asphalt), E2 (base), E3 (subbase), E4 (subgrade)** directly from a
TSD deflection bowl + layer thicknesses, instead of slow backcalculation (ERAPAVE). Training labels
are our own backcalculated moduli from **Östergötland** TSD data. The model is a building block for a
later **digital twin** of the road network (Trafikverket / VTI, project sheet WP0–WP4).
Extra contribution beyond "ML backcalculation": **a reliability check + calibrated ranges** (idea 1).

User preferences: simple English, simple attractive UI, one-line git commit messages.

## 2. Data
| Item | Value |
|---|---|
| Region | Östergötland, 7,047 locations × 4 surveys = **28,188 cases** |
| Surveys | 1 = Aug 2022, 2 = Sep 2023, 3 = May 2024, 4 = Sep 2024 |
| Inputs | D0, D130, D215, D300, D450, D600, D900, D1200, D1500 (log, abs) + thk1_mm, thk2_mm, thk3_mm |
| Good fit | RMS of % errors at 9 sensors ≤ 5 % → **23,642 usable cases** |
| Västergötland | Has thicknesses → can be backcalculated and added (not done yet) |
| Finland | No thicknesses → cannot be used with this model |

## 3. Backcalculation (our own, matches ERAPAVE)
- 4-layer linear elastic (MLET, Hankel transform), bounded least squares in log space.
- Load **50 kN per wheel** (ERAPAVE 100 kN axle), contact pressure 800 kPa.
- **Limits (MPa): E1 1,500–8,000 · E2 100–3,000 · E3 50–600 · E4 30–400.**
- Scripts: `backcalc.py`, `lsolver.py`, `export.py` (backup zip, folder `bc/`).
- Checked against ERAPAVE: e.g. row 1876 S1 → ERAPAVE RMS 2.46 %, moduli 1,697/131/108/152.

### Why limits (key finding)
Without limits, many bowls still fit well (RMS ≤ 5 %) but give **physically unrealistic** moduli
(> 2 % outside limits) because layers trade off against each other (**non-uniqueness**).
- Full data: **10,418 / 28,188 = 37.0 % unrealistic** without limits.
- Per survey: S1 3,677 (52.2 %), S2 1,612 (22.9 %), S3 3,750 (53.2 %), S4 1,379 (19.6 %).
- Typical breaks: E1 > 8,000 (2,873), E2 < 100 (2,891), E4 > 400 (3,671).
- Rows 0–999 test first: 34.6 %.
- Example of non-uniqueness, row 427 S3: E3 fixed anywhere 100→260 still gives RMS 1.9–3.3 %.
- Best "one slide" example: row 2437 S3 (road 131, May 2024): no limits 5,429/21/80,072/87 (RMS 1.1 %)
  vs limits 4,530/100/66/225 (RMS 1.5 %) — identical bowls. Row 6790 (road 131): clear in both Sep surveys
  (E2 127–136), ambiguous in Aug 2022 / May 2024 (E2 36 / 64 without limits, 100 with limits).
- By road: road 796 (8.6 km) ambiguous 90 % in every survey (stiff asphalt + very soft base) → layer data in
  the database probably wrong (check cores). Other main roads 22–41 %.
- Wording: call these "ambiguous bowls" (limit-dependent), not "errors". Keep them in training
  (rows 0–999 test: without them, error on ambiguous bowls 8.0 % vs 6.1 % with them).
- Limits only change those unrealistic cases; all others keep identical values.
- File: `data/backcalc_full_with_vs_without_limits.csv`
  (row_index, key, survey, E1–E4_limits, rms_limits_pct, E1–E4_no_limits, rms_no_limits_pct, unrealistic_without_limits).

## 4. ML model (modulus prediction)
- `HistGradientBoostingRegressor` (max_iter 600, lr 0.05), one per target, trained on log(E).
- Split by road stretch: blocks of 100 rows (~2 km) → no neighbour leakage. Test 20 % + holdout.
- Median error on unseen stretches: **E1 6.8 %, E2 8.3 %, E3 5.1 %, E4 1.9 %.**
- Code: `ml/` (config.py, components/), `train.py`, `evaluate.py`, `predict_holdout.py`.
- Output: `artifacts/model.pkl` (~8.7 MB), `metrics.json`, `train/test/holdout.csv`.
- ERAPAVE check of ML predictions: `create_erapave_dat_ml.py` makes .dat files from ML E-values,
  `check_erapave_result.py` scores them (RMS% ≤ 3 very good, ≤ 5 good).

## 5. Reliability module (idea 1 — implemented)
- `ml/reliability.py`, run `python train_reliability.py` **after** `train.py`.
- **Classifier**: HGB + isotonic calibration (FrozenEstimator + CalibratedClassifierCV).
  Label = `unrealistic_without_limits`. Output = probability that bowls like this one were unrealistic.
  Test: **AUC 0.959, precision 0.889, recall 0.849** (threshold 0.5).
- **Ranges**: quantile HGB (10 % / 90 %) + split-conformal widening (CQR), target 80 % coverage.
  Test coverage **83–86 %**. Backend stretches the range to always include the prediction.
- Output `artifacts/reliability.pkl` (~10 MB) — **in .gitignore**; rebuild or keep a copy.
- UI levels: < 20 % "✓ Trustworthy measurement", 20–50 % "◐ Use with some care", ≥ 50 % "⚠ Use with caution".
  Range precision: hi/lo ≤ 1.35 well determined, ≤ 1.8 fairly, else poorly.
- How to explain it: the % is about the *type* of bowl (what happened to similar bowls without limits),
  not the fit of this one. Example row 1876 S1: itself stable (same answer with/without limits, RMS 1.55 %)
  but 6 of 11 neighbours on road 131 were unrealistic → 33 %.

## 6. App and deployment
- **Backend**: FastAPI (`backend/app/`: main.py, services/predictor.py, models/schemas.py).
  `PredictionResponse.reliability` = {p_unreliable, unreliable, ranges_MPa, coverage}.
- **Hosting**: Google Cloud Run, service `pavement-api`, region `europe-north1`,
  project `pavement-moduli`, URL `https://pavement-api-1061126389150.europe-north1.run.app`.
  `Dockerfile` copies `artifacts/model.pkl` + `artifacts/reliability.pkl`; uvicorn on `$PORT` 8080;
  `requirements-cloudrun.txt` (scikit-learn **1.8.0** — must match the version used to train the pickles).
  Deploy: `gcloud run deploy pavement-api --source . --region europe-north1 --allow-unauthenticated`.
  (Render: slow cold start; Hugging Face Docker = paid; Koyeb no free tier → Cloud Run chosen.)
- **Frontend**: React + MUI on Vercel. `api.js` → `PRODUCTION_API` points to Cloud Run.
  Pages (in order): 🎯 Project Overview → 📋 Input Data → 🧮 Backcalculation → 🤖 ML Model → 🗺️ Roadmap.
  Results data JSON built by `make_results_data.py`.
- Repo: `github.com/shahin1290/pavement-degradation-ml`. Large files (pkl, big CSV) not in Git.

## 7. Thesis ideas (feasibility checked, see Thesis_ideas_feasibility_check.pdf)
1. **Reliability + ranges** — feasible (AUC 0.935 in CV) → **done** (section 5).
2. **Seasonal / moisture effect** — wet Sep 2023 vs dry Sep 2024: E4 ×0.48 (lower at 92 % of
   locations), E2 ×0.78, E3 ×1.42. Ditch depth showed no effect. Promising; check TSD calibration
   between 2023 and 2024 with VTI before claiming it.
3. **Moduli → cracking** — weak (AUC 0.72 → 0.75). Low priority.

## 8. Open next steps
- [ ] Thesis notebook for idea 1: calibration plot, coverage plot, SHAP of the classifier.
- [ ] Chart RMS vs fixed E3 (row 427) to show non-uniqueness.
- [ ] Idea 2 notebooks (seasonal effect) + ask VTI about TSD calibration 2023 vs 2024.
- [ ] Backcalculate Västergötland, test model on it, then retrain with both regions.
- [ ] Fix git user.email config on the laptop.
- [ ] Link moduli + reliability to the digital twin (WP roadmap).

## 9. Rebuild from scratch
```bash
python train.py                 # needs data/backcalc_rows0-7050_full.csv
python train_reliability.py     # needs data/backcalc_full_with_vs_without_limits.csv
python make_results_data.py     # frontend JSON
gcloud run deploy pavement-api --source . --region europe-north1 --allow-unauthenticated
```
