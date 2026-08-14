from pydantic import BaseModel, Field


class PredictionRequest(BaseModel):
    sci300: float = Field(
        ...,
        description="TSD SCI300 structural-response index",
        example=115.91
    )

    aadt: float = Field(
        ...,
        description="Average Annual Daily Traffic",
        example=15140
    )

    bells_temp: float = Field(
        ...,
        description="Pavement temperature during TSD survey",
        example=28.41
    )

    layer_1_thk: float = Field(
        ...,
        description="Layer 1 pavement thickness",
        example=0.089455
    )


class PredictionResponse(BaseModel):
    predicted_d0000: float