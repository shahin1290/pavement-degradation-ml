from pydantic import BaseModel, Field


class PredictionRequest(BaseModel):
    h1_cm: float = Field(
        ...,
        description="Layer 1 (Asphalt) thickness in cm",
        example=18.75
    )
    h2_cm: float = Field(
        ...,
        description="Layer 2 (Base) thickness in cm",
        example=33.0
    )
    h3_cm: float = Field(
        ...,
        description="Layer 3 (Subbase) thickness in cm",
        example=70.72
    )
    bells_temp: float = Field(
        ...,
        description="Pavement temperature during survey (BELLS_TEMP)",
        example=20.81
    )
    d0_target: float = Field(
        ...,
        description="Target peak deflection D0 (um)",
        example=298.02
    )
    sci300_target: float = Field(
        ...,
        description="Target Surface Curvature Index SCI300 (um)",
        example=104.92
    )


class PredictionResponse(BaseModel):
    E1_Asphalt_MPa: float = Field(..., description="Predicted Asphalt Layer Modulus")
    E2_Base_MPa: float = Field(..., description="Predicted Base Layer Modulus")
    E3_Subbase_MPa: float = Field(..., description="Predicted Subbase Layer Modulus")
    E4_Subgrade_MPa: float = Field(..., description="Predicted Subgrade Modulus")