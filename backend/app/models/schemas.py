from pydantic import BaseModel

class PredictionRequest(BaseModel):
    spardjup: float
    adt_fordon: int
    belaggningsar: int
    hastighet: int

class PredictionResponse(BaseModel):
    predicted_iri: float
    condition: str