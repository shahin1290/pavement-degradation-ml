from pydantic import BaseModel, Field


class PredictionRequest(BaseModel):
    spardjup: float = Field(
        ..., description="Rut Depth / Spårdjup max 15 (mm)", example=4.5
    )
    spardjup_17: float = Field(
        ..., description="Rut Depth / Spårdjup max 17 (mm)", example=5.2
    )
    vagbredd: float = Field(..., description="Road Width / Vägbredd (m)", example=8.5)
    adt_fordon: int = Field(
        ..., description="Traffic Volume / ÅDT fordon", example=3500
    )
    belaggningsar: int = Field(
        ..., description="Construction Year / Beläggningsår", example=2021
    )
    hastighet: int = Field(
        ..., description="Speed Limit / Hastighetsgräns (km/h)", example=90
    )


class PredictionResponse(BaseModel):
    predicted_iri: float
    condition: str