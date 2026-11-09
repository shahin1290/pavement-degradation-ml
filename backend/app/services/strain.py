"""Critical strains and a condition grade for one road point (used by the Live Predictor).

Layered elastic model (same as the backcalculation; verified against ERAPave within 0.34 %):
4 bonded layers, uniform circular load 50 kN at 800 kPa (radius 141 mm), Poisson 0.35/0.35/0.35/0.40.
  - asphalt tension      horizontal strain at the bottom of the asphalt  -> fatigue cracking
  - subgrade compression vertical strain at the top of the subgrade      -> rutting
Also the Trafikverket formula from the deflections (TRVMB 114, 2012):
  eps = 37.4 + 0.988 D0 - 0.553 D200 - 0.502 D600  (D200 interpolated between D130 and D215)
Grades: Finnish limits for horizontal strain (Saarenketo & Männistö 2024).
Damage per truck vs a typical road: (strain / network median)^4 (Saliko & Erlingsson 2021).
"""
import math

import numpy as np
from scipy.special import j0, j1

WHEEL_KN, PRESSURE_KPA = 50.0, 800.0
NU = [0.35, 0.35, 0.35, 0.40]
GRADES = [(100, "Good"), (200, "Adequate"), (300, "Satisfactory"), (400, "Alarming"), (math.inf, "Deteriorating")]
GRADE_LIMITS = [100, 200, 300, 400]
TYPICAL_ASPHALT_UE = 269.0     # network median, Östergötland, 26,048 usable bowls
TYPICAL_SUBGRADE_UE = 67.0

# Hankel integration grid (1/m). Both points are deeper than 5 cm, where this grid is exact (checked < 0.001 %).
_SEG = [(0, 20, 0.01), (20, 100, 0.05), (100, 800, 0.25)]
_LAM = np.concatenate([np.arange(a, b, s) for a, b, s in _SEG] + [[_SEG[-1][1]]]); _LAM[0] = 1e-6
_d = np.diff(_LAM); _w = np.zeros_like(_LAM); _w[:-1] += _d / 2; _w[1:] += _d / 2
_WT = _w * _LAM


def _basis(lam, z, h, which):
    if which == 0:
        E = np.exp(-lam * z); return E, -lam * E, lam**2 * E, -lam**3 * E
    if which == 1:
        E = np.exp(-lam * z); return z * E, E * (1 - lam * z), E * (-2 * lam + lam**2 * z), E * (3 * lam**2 - lam**3 * z)
    s = h - z; F = np.exp(-lam * s)
    if which == 2:
        return F, lam * F, lam**2 * F, lam**3 * F
    return s * F, F * (lam * s - 1), F * (lam**2 * s - 2 * lam), F * (lam**3 * s - 3 * lam**2)


def _fields(lam, nu, G, f, f1, f2, f3):
    w = ((1 - 2 * nu) * f2 - 2 * (1 - nu) * lam**2 * f) / (2 * G)
    u = lam * f1 / (2 * G)
    sz = (1 - nu) * f3 - (2 - nu) * lam**2 * f1
    tr = lam * (nu * f2 + (1 - nu) * lam**2 * f)
    return w, u, sz, tr


def critical_strains(E_mpa, thk_mm):
    """Returns (asphalt tension, subgrade compression) in microstrain under the wheel centre."""
    lam = _LAM; L = lam.size; n = 4
    h = [t / 1000 for t in thk_mm]
    p = PRESSURE_KPA * 1e3; a = math.sqrt(WHEEL_KN * 1e3 / (math.pi * p))
    E = np.asarray(E_mpa, float) * 1e6; nu = np.asarray(NU); G = E / (2 * (1 + nu))
    nun = [4, 4, 4, 2]; off = np.concatenate([[0], np.cumsum(nun)]); N = off[-1]
    A = np.zeros((L, N, N)); b = np.zeros((L, N))
    bas = lambda k, j, z: _basis(lam, z, (h[k] if k < n - 1 else 0.0), j)
    for j in range(nun[0]):
        fl = _fields(lam, nu[0], G[0], *bas(0, j, 0.0)); A[:, 0, j] = fl[2]; A[:, 1, j] = fl[3]
    b[:, 0] = -p * j1(lam * a) * a / lam
    row = 2
    for k in range(n - 1):
        for j in range(nun[k]):
            fl = _fields(lam, nu[k], G[k], *bas(k, j, h[k]))
            for i in range(4): A[:, row + i, off[k] + j] = fl[i]
        for j in range(nun[k + 1]):
            fl = _fields(lam, nu[k + 1], G[k + 1], *bas(k + 1, j, 0.0))
            for i in range(4): A[:, row + i, off[k + 1] + j] = -fl[i]
        row += 4
    x = np.linalg.solve(A, b[..., None])[..., 0]

    def field(k, z, idx):
        out = np.zeros(L)
        for j in range(nun[k]):
            out += x[:, off[k] + j] * _fields(lam, nu[k], G[k], *bas(k, j, z))[idx]
        return out
    # bottom of asphalt (0.1 mm above the interface): horizontal strain = u / r at r -> 0
    u = field(0, h[0] - 1e-4, 1)
    tension = (u * _WT) @ (lam / 2) * 1e6
    # top of subgrade (0.1 mm below): vertical strain = -dw/dz
    dz = 1e-5
    dw = (field(3, 1e-4 + dz, 0) - field(3, 1e-4 - dz, 0)) / (2 * dz)
    compression = -(dw * _WT).sum() * 1e6           # J0(0) = 1
    return float(tension), float(compression)


def grade(strain_ue):
    return next(name for lim, name in GRADES if strain_ue < lim)


def assess(E_mpa, thk_mm, defl):
    """E_mpa: [E1..E4], thk_mm: [h1, h2, h3], defl: dict with D0, D130, D215, D600 (µm)."""
    ten, com = critical_strains(E_mpa, thk_mm)
    d0, d130, d215, d600 = (abs(float(defl[k])) for k in ("D0", "D130", "D215", "D600"))
    d200 = d130 + (d215 - d130) * (200 - 130) / (215 - 130)
    eq3 = 37.4 + 0.988 * d0 - 0.553 * d200 - 0.502 * d600
    return {
        "asphalt_tension_ue": round(ten, 1),
        "subgrade_compression_ue": round(com, 1),
        "trafikverket_ue": round(eq3, 1),
        "grade_ours": grade(ten),
        "grade_trafikverket": grade(eq3),
        "grade_limits_ue": GRADE_LIMITS,
        "cracking_damage_vs_typical": round((ten / TYPICAL_ASPHALT_UE) ** 4, 2),
        "rutting_damage_vs_typical": round((com / TYPICAL_SUBGRADE_UE) ** 4, 2),
        "typical_asphalt_ue": TYPICAL_ASPHALT_UE,
        "typical_subgrade_ue": TYPICAL_SUBGRADE_UE,
        "load": f"{WHEEL_KN:.0f} kN wheel, {PRESSURE_KPA:.0f} kPa",
    }
