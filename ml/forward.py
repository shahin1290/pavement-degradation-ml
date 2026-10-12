"""
Forward calculation: layer moduli -> surface deflections (multilayer elastic theory).

Same setup as the backcalculation and ERAPave (single wheel 50 kN = 100 kN axle,
800 kPa, Poisson 0.35/0.35/0.35/0.40, infinite subgrade). Agrees with ERAPave within ~0.2%.
"""
import math
import numpy as np
from scipy.special import j0, j1

WHEEL_LOAD_KN = 50.0
CONTACT_PRESSURE_KPA = 800.0
POISSON = [0.35, 0.35, 0.35, 0.40]
OFFSETS_MM = [0, 130, 215, 300, 450, 600, 900, 1200, 1500]
POINT_NAMES = ["D0", "D130", "D215", "D300", "D450", "D600", "D900", "D1200", "D1500"]
_SEGMENTS = [(0, 20, 0.04), (20, 100, 0.2), (100, 400, 0.8), (400, 1200, 3.0)]


class _Grid:
    def __init__(self, a, radii):
        parts = [np.arange(s0, s1, st) for s0, s1, st in _SEGMENTS]
        self.lam = np.concatenate(parts + [[_SEGMENTS[-1][1]]])
        self.lam[0] = 1e-6
        self.J0 = j0(np.outer(self.lam, radii))
        self.P1 = j1(self.lam * a) * a / self.lam
        d = np.diff(self.lam)
        w = np.zeros_like(self.lam)
        w[:-1] += d / 2
        w[1:] += d / 2
        self.wt = w * self.lam


def _basis(lam, z, h, which):
    if which == 0:
        E = np.exp(-lam * z); return E, -lam * E, lam**2 * E, -lam**3 * E
    if which == 1:
        E = np.exp(-lam * z); return z*E, E*(1-lam*z), E*(-2*lam+lam**2*z), E*(3*lam**2-lam**3*z)
    s = h - z; F = np.exp(-lam * s)
    if which == 2:
        return F, lam*F, lam**2*F, lam**3*F
    return s*F, F*(lam*s-1), F*(lam**2*s-2*lam), F*(lam**3*s-3*lam**2)


def _fields(lam, nu, G, f, f1, f2, f3):
    w = ((1-2*nu)*f2 - 2*(1-nu)*lam**2*f) / (2*G)
    u = lam*f1 / (2*G)
    sz = (1-nu)*f3 - (2-nu)*lam**2*f1
    tr = lam*(nu*f2 + (1-nu)*lam**2*f)
    return w, u, sz, tr


def _surface_deflection(grid, p, E, nu, h):
    lam = grid.lam; L = lam.size; n = len(E)
    E = np.asarray(E, float); nu = np.asarray(nu, float); G = E / (2*(1+nu))
    nun = [4]*(n-1) + [2]
    off = np.concatenate([[0], np.cumsum(nun)]); N = off[-1]
    A = np.zeros((L, N, N)); b = np.zeros((L, N))
    def bas(k, which, z):
        return _basis(lam, z, (h[k] if k < n-1 else 0.0), which)
    for j in range(nun[0]):
        fl = _fields(lam, nu[0], G[0], *bas(0, j, 0.0))
        A[:, 0, off[0]+j] = fl[2]; A[:, 1, off[0]+j] = fl[3]
    b[:, 0] = -p * grid.P1
    row = 2
    for k in range(n-1):
        for j in range(nun[k]):
            fl = _fields(lam, nu[k], G[k], *bas(k, j, h[k]))
            for i in range(4): A[:, row+i, off[k]+j] = fl[i]
        for j in range(nun[k+1]):
            fl = _fields(lam, nu[k+1], G[k+1], *bas(k+1, j, 0.0))
            for i in range(4): A[:, row+i, off[k+1]+j] = -fl[i]
        row += 4
    x = np.linalg.solve(A, b[..., None])[..., 0]
    w0 = np.zeros(L)
    for j in range(nun[0]):
        w0 += x[:, off[0]+j] * _fields(lam, nu[0], G[0], *bas(0, j, 0.0))[0]
    return (w0 * grid.wt) @ grid.J0


_P = CONTACT_PRESSURE_KPA * 1e3
_A = math.sqrt(WHEEL_LOAD_KN * 1e3 / (math.pi * _P))
_grid = None


def forward_deflections(E_mpa, thk_mm):
    """E_mpa = [E1, E2, E3, E4] in MPa, thk_mm = [h1, h2, h3] in mm -> {D0: um, ..., D1500: um}"""
    global _grid
    if _grid is None:
        _grid = _Grid(_A, [o / 1000 for o in OFFSETS_MM])
    d = _surface_deflection(_grid, _P, [e * 1e6 for e in E_mpa], POISSON, [t / 1000 for t in thk_mm]) * 1e6
    return {name: float(v) for name, v in zip(POINT_NAMES, d)}
