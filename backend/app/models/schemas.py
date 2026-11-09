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


class Reliability(BaseModel):
    """Is this measurement suitable for backcalculation? Plus a calibrated range for each modulus."""
    p_unreliable: float = Field(..., description="Probability (0-1) that the backcalculated moduli are unrealistic")
    unreliable: bool = Field(..., description="True if p_unreliable is above the model's threshold")
    ranges_MPa: Dict[str, List[float]] = Field(
        ..., description="Calibrated low-high range per modulus (about 80 % of true values fall inside)"
    )
    coverage: float = Field(..., description="Target share of true values inside the range")


class StrainResult(BaseModel):
    """Critical strains from the predicted moduli, and the condition grade (see services/strain.py)."""
    asphalt_tension_ue: float = Field(..., description="Horizontal strain at the bottom of the asphalt (microstrain), cracking")
    subgrade_compression_ue: float = Field(..., description="Vertical strain at the top of the subgrade (microstrain), rutting")
    trafikverket_ue: float = Field(..., description="Asphalt strain from the deflections, Trafikverket formula (TRVMB 114)")
    grade_ours: str = Field(..., description="Condition grade from our strain (Finnish limits)")
    grade_trafikverket: str = Field(..., description="Condition grade from the Trafikverket strain")
    grade_limits_ue: List[float]
    cracking_damage_vs_typical: float = Field(..., description="Damage per truck compared with a typical road (strain^4)")
    rutting_damage_vs_typical: float
    typical_asphalt_ue: float
    typical_subgrade_ue: float
    load: str


class BackcalcResult(BaseModel):
    """Physics backcalculation of the same bowl (services/backcalc.py), same settings as ERAPave / the Excel results."""
    E1_Asphalt_MPa: float
    E2_Base_MPa: float
    E3_Subbase_MPa: float
    E4_Subgrade_MPa: float
    fit_rms_pct: float = Field(..., description="Difference between the calculated and the measured bowl (RMS, %)")
    fit_max_error_pct: float
    usable: bool = Field(..., description="True if fit_rms_pct <= 5 %")
    at_limit: List[str] = Field(default_factory=list, description="Moduli stuck at an allowed limit, e.g. E3_min")
    sensors_mm: List[float]
    measured_um: List[float]
    bowl_backcalc_um: List[float] = Field(..., description="Bowl calculated from the backcalculated moduli")
    bowl_ml_um: Optional[List[float]] = Field(None, description="Bowl calculated from the ML moduli")
    ml_fit_rms_pct: Optional[float] = None
    ml_fit_max_error_pct: Optional[float] = None
    limits_MPa: Dict[str, List[float]]
    seconds: Optional[float] = None


class PredictionResponse(BaseModel):
    E1_Asphalt_MPa: float = Field(..., description="Predicted asphalt layer modulus")
    E2_Base_MPa: float = Field(..., description="Predicted base layer modulus")
    E3_Subbase_MPa: float = Field(..., description="Predicted subbase layer modulus")
    E4_Subgrade_MPa: float = Field(..., description="Predicted subgrade modulus")
    warnings: List[str] = Field(
        default_factory=list,
        description="Inputs outside the training data range; predictions there are less reliable",
    )
    reliability: Optional[Reliability] = Field(
        None, description="Reliability check (only if artifacts/reliability.pkl exists)"
    )
    strain: Optional[StrainResult] = Field(
        None, description="Critical strains and condition grade calculated from the predicted moduli"
    )
    backcalc: Optional[BackcalcResult] = Field(
        None, description="Physics backcalculation of the same bowl, to compare with the ML prediction"
    )


class ModelInfoResponse(BaseModel):
    model_type: str
    feature_groups: List[str]
    features: List[str]
    targets: List[str]
    limits_MPa: Dict[str, List[float]]
    test_metrics: Dict[str, Dict[str, float]]
