from typing import Dict, List, Optional
from pydantic import BaseModel, Field


class PredictionRequest(BaseModel):
    """
    One TSD measurement point.

    Core inputs (always needed): the 9 deflections and 3 layer thicknesses.
    Optional inputs are only used if the trained model includes them
    (see ACTIVE_FEATURE_GROUPS in ml/config.py and GET /api/model-info).
    """

    # Deflection basin, micrometres (positive values; negative values are accepted
    # and converted to positive)
    D0: float = Field(..., description="Deflection at 0 mm (um)", example=418.99)
    D130: float = Field(..., description="Deflection at 130 mm (um)", example=342.35)
    D215: float = Field(..., description="Deflection at 215 mm (um)", example=276.10)
    D300: float = Field(..., description="Deflection at 300 mm (um)", example=231.06)
    D450: float = Field(..., description="Deflection at 450 mm (um)", example=164.00)
    D600: float = Field(..., description="Deflection at 600 mm (um)", example=107.06)
    D900: float = Field(..., description="Deflection at 900 mm (um)", example=41.51)
    D1200: float = Field(..., description="Deflection at 1200 mm (um)", example=20.07)
    D1500: float = Field(..., description="Deflection at 1500 mm (um)", example=11.40)

    # Layer thicknesses, millimetres (as in the training data)
    thk1_mm: float = Field(..., gt=0, description="Layer 1 (asphalt) thickness in mm", example=81.85)
    thk2_mm: float = Field(..., gt=0, description="Layer 2 (base) thickness in mm", example=112.37)
    thk3_mm: float = Field(..., gt=0, description="Layer 3 (subbase) thickness in mm", example=991.35)

    # Optional inputs (only needed if the model was trained with them)
    survey: Optional[float] = Field(None, description="Survey number 1-4", example=1)
    asphalt_temp_C: Optional[float] = Field(None, description="Pavement temperature BELLS_TEMP (C)", example=29.3)
    speed_kmh: Optional[float] = Field(None, description="TSD survey speed (km/h)", example=42.75)


class PredictionResponse(BaseModel):
    E1_Asphalt_MPa: float = Field(..., description="Predicted asphalt layer modulus")
    E2_Base_MPa: float = Field(..., description="Predicted base layer modulus")
    E3_Subbase_MPa: float = Field(..., description="Predicted subbase layer modulus")
    E4_Subgrade_MPa: float = Field(..., description="Predicted subgrade modulus")
    warnings: List[str] = Field(
        default_factory=list,
        description="Inputs outside the training data range; predictions there are less reliable",
    )


class ModelInfoResponse(BaseModel):
    model_type: str
    feature_groups: List[str]
    features: List[str]
    targets: List[str]
    limits_MPa: Dict[str, List[float]]
    test_metrics: Dict[str, Dict[str, float]]
