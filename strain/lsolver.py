"""Fast axisymmetric multilayer elastic (LET) surface deflection solver.
Layers 1..n-1 finite (thickness h), layer n is a semi-infinite half-space.
Bonded interfaces, uniform circular load. Hankel-transform / Love stress-function method."""
import numpy as np
from scipy.special import j0, j1

class Grid:
    def __init__(self, a, radii, lmax=1000.0, n=3001, segments=None):
        self.a = a; self.radii = np.asarray(radii, float)
        if segments is None:
            self.lam = np.linspace(1e-6, lmax, n)
        else:
            parts = [np.arange(s0, s1, st) for s0, s1, st in segments]
            self.lam = np.concatenate(parts + [[segments[-1][1]]]); self.lam[0] = 1e-6
        self.J0 = j0(np.outer(self.lam, self.radii))
        self.P1 = j1(self.lam * a) * a / self.lam
        d = np.diff(self.lam); w = np.zeros_like(self.lam)
        w[:-1] += d / 2; w[1:] += d / 2
        self.wt = w * self.lam

def _basis(lam, z, h, which):
    if which == 0:
        E = np.exp(-lam * z);  return E, -lam * E, lam**2 * E, -lam**3 * E
    if which == 1:
        E = np.exp(-lam * z);  return z*E, E*(1-lam*z), E*(-2*lam+lam**2*z), E*(3*lam**2-lam**3*z)
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

def surface_deflection(grid, p, E, nu, h):
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
