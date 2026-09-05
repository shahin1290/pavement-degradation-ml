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
# Pavement Moduli Prediction (E1 - E4)
# --------------------------------------------------

@app.post(
    "/api/predict",
    response_model=PredictionResponse
)
def predict(request: PredictionRequest):

    try:
        # Call the updated predictor service method for 4-layer moduli
        predictions = predictor_service.predict_moduli(request)

        return PredictionResponse(
            E1_Asphalt_MPa=predictions[0],
            E2_Base_MPa=predictions[1],
            E3_Subbase_MPa=predictions[2],
            E4_Subgrade_MPa=predictions[3]
        )

    except Exception as e:

        raise HTTPException(
            status_code=500,
            detail=str(e)
        )