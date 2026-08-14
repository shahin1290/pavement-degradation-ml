from ml.pipelines.prediction_pipeline import (
    PredictionPipeline,
    RoadDataInput,
)


def query_model():
    print("\n" + "=" * 55)
    print(" STRUCTURAL PAVEMENT AI - D0000 PROTOTYPE ")
    print("=" * 55)

    try:
        sci300 = float(input("Enter SCI300: "))
        aadt = float(input("Enter AADT: "))
        bells_temp = float(input("Enter pavement temperature (BELLS_TEMP): "))
        layer_1_thk = float(input("Enter Layer 1 thickness: "))

        road_profile = RoadDataInput(
            sci300=sci300,
            aadt=aadt,
            bells_temp=bells_temp,
            layer_1_thk=layer_1_thk,
        )

        input_df = road_profile.get_data_as_dataframe()
        pipeline = PredictionPipeline()
        predicted_d0000 = pipeline.predict(input_df)[0]

        print("\n" + "-" * 55)
        print(f"Predicted D0000: {predicted_d0000:.4f}")
        print("-" * 55 + "\n")

    except Exception as e:
        print(f"\nAn error occurred during calculation: {e}")


if __name__ == "__main__":
    query_model()
