"""Physics backcalculation for one deflection bowl (used by the Live Predictor, next to the ML prediction).

Same model and settings as the backcalculation of the whole data set (and as ERAPave):
4 bonded layers (asphalt, base, subbase, infinite subgrade), 50 kN wheel at 800 kPa (radius 141 mm),
Poisson 0.35/0.35/0.35/0.40, all 9 sensors fitted, least squares on relative errors,
compromise limits E1 1500-10000, E2 100-1000, E3 50-1000, E4 30-2000 MPa, 4 starting points.
Gives the same E1-E4 as the Excel results for the same bowl. Takes about 1 second.

Also calculates the bowl that the ML moduli would produce, so both can be compared with the measured bowl.
"""
import math
import time

import numpy as np
from scipy.optimize import least_squares
from scipy.special import j0, j1

WHEEL_KN, PRESSURE_KPA = 50.0, 800.0
SENSORS_MM = [0, 130, 215, 300, 450, 600, 900, 1200, 1500]
SENSOR_KEYS = ["D0", "D130", "D215", "D300", "D450", "D600", "D900", "D1200", "D1500"]
NU = [0.35, 0.35, 0.35, 0.40]
LIMITS = [(1500, 10000), (100, 1000), (50, 1000), (30, 2000)]
STARTS = [(4000, 500, 150, 100), (2000, 300, 300, 150), (6000, 1500, 100, 60), (3000, 200, 200, 250)]
GOOD_RMS = 5.0

# Hankel integration grid (1/m), the same as in the batch backcalculation
_SEG = [(0, 20, 0.04), (20, 100, 0.2), (100, 400, 0.8), (400, 1200, 3.0)]
_P = PRESSURE_KPA * 1e3
_A = math.sqrt(WHEEL_KN * 1e3 / (math.pi * _P))
_LAM = np.concatenate([np.arange(a, b, s) for a, b, s in _SEG] + [[_SEG[-1][1]]]); _LAM[0] = 1e-6
_J0 = j0(np.outer(_LAM, np.array(SENSORS_MM) / 1000))
_P1 = j1(_LAM * _A) * _A / _LAM
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


def bowl(E_mpa, h_m):
    """Surface deflections (µm) at the 9 sensors for moduli E_mpa (4 values) and thicknesses h_m (3 values, metres)."""
    lam = _LAM; L = lam.size; n = 4
    E = np.asarray(E_mpa, float) * 1e6; nu = np.asarray(NU); G = E / (2 * (1 + nu))
    nun = [4, 4, 4, 2]; off = np.concatenate([[0], np.cumsum(nun)]); N = off[-1]
    A = np.zeros((L, N, N)); b = np.zeros((L, N))
    bas = lambda k, j, z: _basis(lam, z, (h_m[k] if k < n - 1 else 0.0), j)
    for j in range(nun[0]):
        fl = _fields(lam, nu[0], G[0], *bas(0, j, 0.0)); A[:, 0, j] = fl[2]; A[:, 1, j] = fl[3]
    b[:, 0] = -_P * _P1
    row = 2
    for k in range(n - 1):
        for j in range(nun[k]):
            fl = _fields(lam, nu[k], G[k], *bas(k, j, h_m[k]))
            for i in range(4): A[:, row + i, off[k] + j] = fl[i]
        for j in range(nun[k + 1]):
            fl = _fields(lam, nu[k + 1], G[k + 1], *bas(k + 1, j, 0.0))
            for i in range(4): A[:, row + i, off[k + 1] + j] = -fl[i]
        row += 4
    x = np.linalg.solve(A, b[..., None])[..., 0]
    w0 = np.zeros(L)
    for j in range(nun[0]):
        w0 += x[:, j] * _fields(lam, nu[0], G[0], *bas(0, j, 0.0))[0]
    return (w0 * _WT) @ _J0 * 1e6


def _errors(meas, calc):
    r = calc / meas - 1
    return round(float(np.sqrt(np.mean(r**2)) * 100), 2), round(float(np.max(np.abs(r)) * 100), 2)


def backcalculate(meas_um, thk_mm, E_ml=None):
    """meas_um: 9 deflections (µm, positive), thk_mm: 3 thicknesses, E_ml: ML moduli (optional, for comparison)."""
    t0 = time.time()
    meas = np.abs(np.asarray(meas_um, float))
    if np.any(meas <= 0):
        raise ValueError("all deflections must be non-zero")
    h = [t / 1000 for t in thk_mm]
    lo = np.log([l for l, _ in LIMITS]); hi = np.log([u for _, u in LIMITS])
    res = lambda x: bowl(np.exp(x), h) / meas - 1
    best = None
    for s in STARTS:
        x0 = np.clip(np.log(np.array(s, float)), lo + 1e-6, hi - 1e-6)
        r = least_squares(res, x0, bounds=(lo, hi), diff_step=1e-3, max_nfev=60, xtol=1e-8, ftol=1e-10)
        if best is None or r.cost < best.cost:
            best = r
    E = np.exp(best.x)
    calc = bowl(E, h)
    rms, mx = _errors(meas, calc)
    at_limit = [f"E{i + 1}_{'min' if E[i] <= LIMITS[i][0] * 1.02 else 'max'}" for i in range(4)
                if E[i] <= LIMITS[i][0] * 1.02 or E[i] >= LIMITS[i][1] * 0.98]
    out = {
        "E1_Asphalt_MPa": round(float(E[0])), "E2_Base_MPa": round(float(E[1])),
        "E3_Subbase_MPa": round(float(E[2])), "E4_Subgrade_MPa": round(float(E[3])),
        "fit_rms_pct": rms, "fit_max_error_pct": mx, "usable": rms <= GOOD_RMS, "at_limit": at_limit,
        "sensors_mm": SENSORS_MM, "measured_um": [round(float(v), 2) for v in meas],
        "bowl_backcalc_um": [round(float(v), 2) for v in calc],
        "bowl_ml_um": None, "ml_fit_rms_pct": None, "ml_fit_max_error_pct": None,
        "limits_MPa": {f"E{i + 1}": list(LIMITS[i]) for i in range(4)},
        "seconds": None,
    }
    if E_ml is not None:
        calc_ml = bowl([max(float(e), 1.0) for e in E_ml], h)
        out["bowl_ml_um"] = [round(float(v), 2) for v in calc_ml]
        out["ml_fit_rms_pct"], out["ml_fit_max_error_pct"] = _errors(meas, calc_ml)
    out["seconds"] = round(time.time() - t0, 2)
    return out


def from_request(req: dict, E_ml=None):
    return backcalculate([req[k] for k in SENSOR_KEYS], [req["thk1_mm"], req["thk2_mm"], req["thk3_mm"]], E_ml)
