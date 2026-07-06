from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from backend.app.models.schemas import PredictionRequest, PredictionResponse
from backend.app.services.predictor import predictor_service

app = FastAPI(title="Trafikverket Road IRI Prediction API", version="1.0.0")

# Enable CORS for the frontend React app
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def health_check():
    return {"status": "operational", "service": "pavement-ml-backend"}

@app.post("/api/predict", response_model=PredictionResponse)
def predict(request: PredictionRequest):
    try:
        predicted_iri, condition = predictor_service.predict_iri(request)
        return PredictionResponse(predicted_iri=predicted_iri, condition=condition)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))