# Project notes — ML prediction of pavement layer moduli from TSD

_Last updated: 13 Oct 2026. Start every new Claude chat with: "Read PROJECT_NOTES.md in my repo."_

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
- **NEW limits (decided 13 Oct 2026), use from now on (MPa):**

  | Layer | New limits | Old limits (all results below were made with these) |
  |---|---|---|
  | E1 asphalt | **1,500 – 10,000** | 1,500 – 8,000 |
  | E2 base | **200 – 1,000** | 100 – 3,000 |
  | E3 subbase | **100 – 1,000** | 50 – 600 |
  | E4 subgrade | **30 – 2,000** | 30 – 400 |

  ⚠ Every number in sections 3–5 (37 % unrealistic, 23,642 usable, model errors, reliability AUC,
  coverage) comes from the OLD limits. They must be recomputed (see section 8, "Switch to new limits").
- Scripts: `backcalc.py`, `lsolver.py`, `export.py` (backup zip, folder `bc/`).
- Checked against ERAPAVE: e.g. row 1876 S1 → ERAPAVE RMS 2.46 %, moduli 1,697/131/108/152.

### Why limits (key finding — numbers with the OLD limits)
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
- Limits never improve the fit (0 bowls fit better with limits); they keep it equal (realistic bowls) or
  slightly worse, and select the realistic answer among answers that fit within measurement noise.
- Wording: call these "ambiguous bowls" (limit-dependent), not "errors". Keep them in training
  (rows 0–999 test: without them, error on ambiguous bowls 8.0 % vs 6.1 % with them).
- Limits only change those unrealistic cases; all others keep identical values.
- File: `data/backcalc_full_with_vs_without_limits.csv`
  (row_index, key, survey, E1–E4_limits, rms_limits_pct, E1–E4_no_limits, rms_no_limits_pct, unrealistic_without_limits).

### Validation against ELMOD (12–13 Oct 2026, 9-geophone F25 files, 141 mm / 800 kPa)
Fits below = RMS on the real 9-point bowl, calculated with our forward model.

| Row, survey | Road | Type | ELMOD E1/E2/E3/E4 (fit) | Ours no limits (fit) | Ours old limits (fit) |
|---|---|---|---|---|---|
| 2437 S3 | 131 | base soft | 4,741/77/77/216 (1.39 %) | 5,429/21/80,072/87 (1.12 %) | 4,530/100/66/225 (1.53 %) |
| 6791 S4 | 131 | base soft | 4,804/81/78/190 (0.85 %) | 5,215/48/124/173 (0.64 %) | 4,616/100/70/199 (0.86 %) |
| 715 S4 | 32 | asphalt stiff | 17,856/1,382/68/186 (0.57 %) | 18,353/1,340/71/181 (0.48 %) | 8,000/2,173/55/241 (1.15 %) |
| 4855 S4 | 796 | asphalt extreme | 76,864/764/51/212 (0.97 %) | 100,000/248/87/178 (0.75 %) | 8,000/2,263/50/207 (4.04 %) |
| 1353 S4 | 50 | asphalt stiff | 15,600/1,159/78/166 (0.86 %) | 18,409/1,054/81/161 (0.81 %) | 8,000/1,589/72/182 (1.28 %) |
| 3021 S2 | 131 | asphalt stiff | 10,988/788/78/71 (1.26 %) | 12,376/746/80/71 (0.97 %) | 8,000/956/73/73 (1.21 %) |

- Our solver finds the same solution type as ELMOD in all 6 cases (within a few %).
- ELMOD stays realistic for soft-base bowls (E2 ≈ 80) but gives impossible asphalt (11,000–77,000 MPa at
  22–28 °C) in all 4 stiff-asphalt bowls, without warning → supports fixed limits + reliability flag.
- Row 4855 (road 796): realistic answer fits clearly worse; even with asphalt 200 mm instead of 91 mm, E1 stays
  at the limit → probably a bound/stabilised layer missing from the database.
- Still to run in ELMOD: control case row 1876 S1 (clear bowl, ours 1,697/131/108/152).
- Files: `f25_from_case.py ROW SURVEY PREFIX` (copies the header of a working ELMOD F25 "one.f25").
  ELMOD needs thicknesses entered by hand; Poisson 0.35/0.35/0.35/0.40, no stiff layer.

### Temperature (BELLS)
- File is "temp_korr", but D0000 = D00001 and SCI_300 ≈ SCI300_norm (0.3 %) → no uncorrected bowl in the files.
- All bowls: E1 vs BELLS ρ ≈ −0.01. Same location across surveys: E1 **−3.4 % per °C** (physically expected);
  same survey + road: +3.1 % per °C (confounded). → ask VTI what "temp_korr" corrects and the reference temperature.
- Chart: `E1_vs_BELLS_temperature.png`.

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

### Switch to new limits (do first)
- [ ] `bc/backcalc.py`: `LIMITS = [(1500, 10000), (200, 1000), (100, 1000), (30, 2000)]`; rerun all 28,188 bowls.
- [ ] Rerun the with/without-limits comparison → new `backcalc_full_with_vs_without_limits.csv`
      (unrealistic = outside the NEW limits by > 2 %; the no-limits run itself does not change).
- [ ] `ml/config.py` `MODULUS_LIMITS`; frontend `LAYER_LIMITS` (PredictorPage.jsx) and `LIMITS` (results/common.jsx).
- [ ] `python train.py` → `python train_reliability.py` → `python make_results_data.py`; redeploy Cloud Run.
- [ ] New ERAPAVE check of the 20 holdout cases (`make_erapave_holdout_dat.py`), replace `data/erapave_holdout/`.
- [ ] Update all numbers in this file (unrealistic %, usable bowls, model errors, AUC, coverage).
- [ ] Quick estimate from the existing no-limits run (13 Oct): outside NEW limits = **18,507 / 28,188 = 65.7 %**
      (old limits 36.8 %). Mostly E2 < 200 (10,791 bowls; median free E2 = 232) and E3 < 100 (9,677; median 121).
      E4 > 2,000 only 62. By survey: 86.6 / 54.2 / 63.4 / 58.5 %. → discuss with professor before the full rerun.
- [ ] Watch: E2 min 200 is higher than ELMOD's soft-base answers (77–81) → more bowls will sit at E2 = 200;
      E4 max 2,000 lets the subgrade go much stiffer than before. Check how many bowls end at a limit or become poor fits.

### Other
- [ ] Thesis notebook for idea 1: calibration plot, coverage plot, SHAP of the classifier.
- [ ] Chart RMS vs fixed E3 (row 427) to show non-uniqueness.
- [ ] Idea 2 notebooks (seasonal effect) + ask VTI about TSD calibration 2023 vs 2024.
- [ ] Backcalculate Västergötland, test model on it, then retrain with both regions.
- [ ] Fix git user.email config on the laptop.
- [ ] Link moduli + reliability to the digital twin (WP roadmap).
- [ ] Ask VTI: meaning of "temp_korr", reference temperature, uncorrected deflections, thickness source for road 796.
- [ ] Optional experiments: merge base + subbase (3 layers), or fix E1 from temperature, to reduce ambiguity.

## 9. Rebuild from scratch
```bash
python train.py                 # needs data/backcalc_rows0-7050_full.csv
python train_reliability.py     # needs data/backcalc_full_with_vs_without_limits.csv
python make_results_data.py     # frontend JSON
gcloud run deploy pavement-api --source . --region europe-north1 --allow-unauthenticated
```
