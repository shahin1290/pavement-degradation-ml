from ml.pipelines.prediction_pipeline import RoadDataInput, PredictionPipeline

def query_model():
    print("\n" + "="*40)
    print(" TRAFIKVERKET ROAD IRI PREDICTOR (AI) ")
    print("="*40)
    
    try:
        # 1. Gather manual user inputs
        spardjup = float(input("Enter Rut Depth / Spårdjup max 15 (e.g., 4.5): "))
        adt = int(input("Enter Traffic Volume / ÅDT fordon (e.g., 3500): "))
        year = int(input("Enter Pavement Construction Year / Beläggningsår (e.g., 2021): "))
        speed = int(input("Enter Speed Limit / Hastighetsgräns in km/h (e.g., 90): "))
        
        # 2. Convert and run through prediction pipeline
        road_profile = RoadDataInput(spardjup, adt, year, speed)
        input_df = road_profile.get_data_as_dataframe()
        
        pipeline = PredictionPipeline()
        predicted_iri = pipeline.predict(input_df)[0]
        
        print("\n" + "-"*40)
        print(f"🔮 PREDICTED ROAD ROUGHNESS (IRI): {predicted_iri:.2f} mm/m")
        
        # Interpret the results qualitatively for the user
        if predicted_iri < 1.5:
            print("Road Condition: Excellent (Smooth ride)")
        elif predicted_iri < 3.0:
            print("Road Condition: Acceptable (Normal Wear)")
        else:
            print("Road Condition: Poor (Needs Maintenance Intervention!)")
        print("-"*40 + "\n")
        
    except Exception as e:
        print(f"\nAn error occurred during calculation: {e}")

if __name__ == "__main__":
    query_model()