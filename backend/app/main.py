from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from backend.app.models.schemas import (
    PredictionRequest,
    PredictionResponse
)

from backend.app.services.predictor import predictor_service


app = FastAPI(
    title="Trafikverket Structural Pavement AI API",
    version="1.0.0"
)


# --------------------------------------------------
# CORS
# --------------------------------------------------

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


# --------------------------------------------------
# Health check
# --------------------------------------------------

@app.get("/")
def health_check():
    return {
        "status": "operational",
        "service": "structural-pavement-ai-backend"
    }


# --------------------------------------------------
# D0000 prediction
# --------------------------------------------------

@app.post(
    "/api/predict",
    response_model=PredictionResponse
)
def predict(request: PredictionRequest):

    try:

        predicted_d0000 = (
            predictor_service.predict_d0000(request)
        )

        return PredictionResponse(
            predicted_d0000=predicted_d0000
        )

    except Exception as e:

        raise HTTPException(
            status_code=500,
            detail=str(e)
        )