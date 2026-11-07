"""Strains anywhere in the road with the same layered elastic model as the backcalculation (lsolver.py).
Axisymmetric, bonded layers, uniform circular load. Output sign convention = ERAPave: compression positive.
"""
import math
import numpy as np
from scipy.special import j0, j1
from lsolver import _basis, _fields

SEG = [(0, 20, 0.01), (20, 100, 0.05), (100, 500, 0.2), (500, 2000, 0.5), (2000, 20000, 2.0)]   # Hankel integration grid (1/m)


def _lam():
    parts = [np.arange(a, b, s) for a, b, s in SEG]
    lam = np.concatenate(parts + [[SEG[-1][1]]]); lam[0] = 1e-6
    d = np.diff(lam); w = np.zeros_like(lam); w[:-1] += d / 2; w[1:] += d / 2
    return lam, w * lam


LAM, WT = _lam()


def _solve(p, a, E, nu, h):
    """Same equations as lsolver.surface_deflection, but keeps the coefficients of every layer."""
    lam = LAM; L = lam.size; n = len(E)
    E = np.asarray(E, float); nu = np.asarray(nu, float); G = E / (2 * (1 + nu))
    nun = [4] * (n - 1) + [2]
    off = np.concatenate([[0], np.cumsum(nun)]); N = off[-1]
    A = np.zeros((L, N, N)); b = np.zeros((L, N))
    bas = lambda k, j, z: _basis(lam, z, (h[k] if k < n - 1 else 0.0), j)
    for j in range(nun[0]):
        fl = _fields(lam, nu[0], G[0], *bas(0, j, 0.0))
        A[:, 0, off[0] + j] = fl[2]; A[:, 1, off[0] + j] = fl[3]
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
    return x, off, nun, G, bas


def strains(E_mpa, h_m, nu, points, wheel_kN=50.0, pressure_kPa=800.0):
    """E_mpa: 4 moduli, h_m: 3 thicknesses (m), nu: 4 Poisson's ratios.
    points: list of (r [m], z [m] from the surface, layer index 0..3).
    Returns list of dicts: deflection wz [µm], strains ezz, err, ett [µε] (compression positive)."""
    p = pressure_kPa * 1e3; a = math.sqrt(wheel_kN * 1e3 / (math.pi * p))
    E = [e * 1e6 for e in E_mpa]
    x, off, nun, G, bas = _solve(p, a, E, nu, h_m)
    tops = np.concatenate([[0], np.cumsum(h_m)])
    out = []
    for r, z, k in points:
        zl = z - tops[k]
        def wu(zz):
            w = np.zeros(LAM.size); u = np.zeros(LAM.size)
            for j in range(nun[k]):
                f = _fields(LAM, nu[k], G[k], *bas(k, j, zz))
                w += x[:, off[k] + j] * f[0]; u += x[:, off[k] + j] * f[1]
            return w, u
        dz = 1e-5
        w0, u0 = wu(zl)
        wp, _ = wu(zl + dz); wm, _ = wu(max(zl - dz, 0.0))
        dw = (wp - wm) / (zl + dz - max(zl - dz, 0.0))
        wz = (w0 * WT) @ j0(LAM * r)
        ezz = (dw * WT) @ j0(LAM * r)                       # d w / d z
        if r < 1e-9:
            ett = (u0 * WT) @ (LAM / 2); err = ett           # u / r and du/dr at the centre
        else:
            ett = (u0 * WT) @ j1(LAM * r) / r
            err = (u0 * WT) @ (LAM * (j0(LAM * r) - j1(LAM * r) / (LAM * r)))   # d J1(lam r)/dr
        out.append({"r_cm": r * 100, "z_cm": z * 100, "wz_um": wz * 1e6,
                    "ezz": -ezz * 1e6, "err": -err * 1e6, "ett": -ett * 1e6})
    return out
