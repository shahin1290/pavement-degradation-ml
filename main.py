from ml.pipelines.prediction_pipeline import (
    PredictionPipeline,
    RoadDataInput,
)


def query_model():
    print("\n" + "=" * 60)
    print(" STRUCTURAL PAVEMENT AI - E1-E4 MODULUS SURROGATE ")
    print("=" * 60)

    try:
        h1 = float(input("Enter Layer 1 Thickness [cm] (e.g. 18.75): "))
        h2 = float(input("Enter Layer 2 Thickness [cm] (e.g. 33.0): "))
        h3 = float(input("Enter Layer 3 Thickness [cm] (e.g. 70.72): "))
        bells_temp = float(input("Enter Pavement Temp BELLS_TEMP (°C) (e.g. 20.81): "))
        d0_target = float(input("Enter Target D0 (um) (e.g. 298.02): "))
        sci300_target = float(input("Enter Target SCI300 (um) (e.g. 104.92): "))

        road_profile = RoadDataInput(
            h1_cm=h1,
            h2_cm=h2,
            h3_cm=h3,
            bells_temp=bells_temp,
            d0_target=d0_target,
            sci300_target=sci300_target,
        )

        input_df = road_profile.get_data_as_dataframe()
        pipeline = PredictionPipeline()
        preds = pipeline.predict(input_df)

        print("\n" + "-" * 60)
        print(f"Predicted E1 (Asphalt Layer): {preds[0]:.2f} MPa")
        print(f"Predicted E2 (Base Layer):     {preds[1]:.2f} MPa")
        print(f"Predicted E3 (Subbase Layer):  {preds[2]:.2f} MPa")
        print(f"Predicted E4 (Subgrade):       {preds[3]:.2f} MPa")
        print("-" * 60 + "\n")

    except Exception as e:
        print(f"\nAn error occurred during calculation: {e}")


if __name__ == "__main__":
    query_model()