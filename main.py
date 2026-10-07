from ml.pipelines.prediction_pipeline import PredictionPipeline, RoadDataInput

# Example values shown in the prompts (row 0, survey 1)
EXAMPLES = {
    "D0": 418.99, "D130": 342.35, "D215": 276.1, "D300": 231.06, "D450": 163.995,
    "D600": 107.06, "D900": 41.51, "D1200": 20.07, "D1500": 11.395,
    "thk1_mm": 81.85, "thk2_mm": 112.37, "thk3_mm": 991.35,
    "survey": 1, "asphalt_temp_C": 29.3, "speed_kmh": 42.75,
}


def query_model():
    print("\n" + "=" * 60)
    print(" PAVEMENT MODULUS SURROGATE: E1-E4 FROM TSD DATA ")
    print("=" * 60)
    print("Deflections in micrometres (positive), thicknesses in mm.\n")

    try:
        pipeline = PredictionPipeline()
        inputs = {}
        for name in pipeline.feature_names:     # asks for exactly what the model needs
            ex = EXAMPLES.get(name)
            hint = f" (e.g. {ex})" if ex is not None else ""
            inputs[name] = float(input(f"Enter {name}{hint}: "))

        preds = pipeline.predict(RoadDataInput(**inputs).get_data_as_dataframe())

        print("\n" + "-" * 60)
        print(f"Predicted E1 (asphalt):  {preds[0]:8.0f} MPa")
        print(f"Predicted E2 (base):     {preds[1]:8.0f} MPa")
        print(f"Predicted E3 (subbase):  {preds[2]:8.0f} MPa")
        print(f"Predicted E4 (subgrade): {preds[3]:8.0f} MPa")
        print("-" * 60 + "\n")

    except Exception as e:
        print(f"\nAn error occurred during calculation: {e}")


if __name__ == "__main__":
    query_model()
