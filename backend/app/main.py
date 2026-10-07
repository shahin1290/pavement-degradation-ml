from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from backend.app.models.schemas import (
    PredictionRequest,
    PredictionResponse,
    ModelInfoResponse,
)
from backend.app.services.predictor import predictor_service, MissingInputError


app = FastAPI(
    title="Trafikverket Structural Pavement AI API",
    version="2.0.0",
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
        "service": "structural-pavement-ai-backend",
    }


# --------------------------------------------------
# Model information (which inputs the current model needs)
# --------------------------------------------------

@app.get("/api/model-info", response_model=ModelInfoResponse)
def model_info():
    try:
        return ModelInfoResponse(**predictor_service.model_info())
    except FileNotFoundError as e:
        raise HTTPException(status_code=503, detail=str(e))


# --------------------------------------------------
# Pavement moduli prediction (E1 - E4)
# --------------------------------------------------

@app.post("/api/predict", response_model=PredictionResponse)
def predict(request: PredictionRequest):
    try:
        predictions, warnings = predictor_service.predict_moduli(request)

        return PredictionResponse(
            E1_Asphalt_MPa=predictions[0],
            E2_Base_MPa=predictions[1],
            E3_Subbase_MPa=predictions[2],
            E4_Subgrade_MPa=predictions[3],
            warnings=warnings,
        )

    except (MissingInputError, ValueError) as e:
        # Bad or incomplete input from the user
        raise HTTPException(status_code=422, detail=str(e))

    except FileNotFoundError as e:
        # Model not trained yet
        raise HTTPException(status_code=503, detail=str(e))

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
