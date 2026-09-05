"""
ERAPAVE-like Python forward model — Version 1

Purpose
-------
First validation step for the pavement back-calculation project.

This program uses the existing Burmister/MLET Python solver and applies
two calibration factors so that the Python response matches a supplied
ERAPAVE benchmark at:
    r = 0 cm  -> D0
    r = 30 cm -> D30

IMPORTANT
---------
This is NOT yet a full reproduction of ERAPAVE 2012. The ERAPAVE manual
describes additional numerical details such as selected-point stress
coefficients, piecewise-linear interpolation and Richardson extrapolation.
Those implementation details are not fully specified in the manual.

The calibration factors are therefore explicitly separated from the
physics solver. They should be re-estimated using multiple ERAPAVE
benchmarks before using this for the 15,000-row back-calculation.

Requirements:
    pip install numpy scipy
"""

import numpy as np
from scipy import special
import scipy.linalg as linalg

def erapave_mlet(
    q_kpa,
    radius_cm,
    r_cm,
    z_cm,
    thickness_cm,
    modulus_mpa,
    poisson,
    iteration=80,
    bounded=True,
):
    """
    Burmister multilayer elastic solver following the public PyMastic
    formulation, with ERAPave-style benchmark settings.

    Units:
      q_kpa       : kPa
      radius_cm   : cm
      r_cm, z_cm  : cm
      thickness_cm: cm
      modulus_mpa : MPa
      output      : displacement in micrometres

    This is a linear-elastic MLET forward solver. It is NOT claimed to
    reproduce proprietary ERAPave implementation details until validated
    against ERAPave output.
    """

    x = np.atleast_1d(np.asarray(r_cm, dtype=float)).copy()
    z = np.atleast_1d(np.asarray(z_cm, dtype=float)).copy()
    x[x == 0] = 1e-8
    z[z == 0] = 1e-8

    H = np.asarray(thickness_cm, dtype=float)
    E = np.asarray(modulus_mpa, dtype=float) * 1000.0  # kPa
    nu = np.asarray(poisson, dtype=float)

    n_layers = len(E)
    if len(H) != n_layers - 1:
        raise ValueError("For N layers, thickness_cm must contain N-1 finite-layer thicknesses.")
    if len(nu) != n_layers:
        raise ValueError("poisson must have one value per layer.")

    # Dimensionless normalization used by the PyMastic formulation.
    sumH = np.sum(H)
    lam = np.hstack((0.0, np.cumsum(H) / sumH, 1000.0))
    L = z / sumH
    ro = x / sumH
    alpha = radius_cm / sumH

    # Bessel zeros. We generate more than needed instead of hard-coding
    # the published tables.
    z0 = special.jn_zeros(0, max(iteration + 20, 120))
    z1 = special.jn_zeros(1, max(iteration + 20, 120))

    z0_scaled = (z0[None, :] / ro[:, None]).T
    z1_scaled = z1 / alpha

    bessel_zeros = np.hstack(
        (np.array([0.0]), z0_scaled.flatten(), z1_scaled)
    )
    bessel_zeros = np.sort(bessel_zeros)

    D1 = (bessel_zeros[1] - bessel_zeros[0]) / 6.0 - 1e-5
    D2 = (bessel_zeros[2] - bessel_zeros[1]) / 2.0 - 1e-5

    aux1 = np.arange(bessel_zeros[0], bessel_zeros[1], D1)
    aux2 = np.arange(bessel_zeros[1], bessel_zeros[2], D2)

    # Same quadrature construction as the public PyMastic formulation.
    m_values = np.hstack((aux1, aux2[1:], bessel_zeros[3:iteration]))

    dm = np.diff(m_values)

    m_matrix = np.vstack((m_values, m_values, m_values, m_values)).T

    coefficient = np.empty((len(dm), 4))
    coefficient[:, 0] = dm / 2 - 0.86114 * dm / 2
    coefficient[:, 1] = dm / 2 - 0.33998 * dm / 2
    coefficient[:, 2] = dm / 2 + 0.33998 * dm / 2
    coefficient[:, 3] = dm / 2 + 0.86114 * dm / 2

    ft_gauss = np.empty((4, len(dm)))
    ft_gauss[0, :] = 0.34786 * dm / 2
    ft_gauss[1, :] = 0.65215 * dm / 2
    ft_gauss[2, :] = 0.65215 * dm / 2
    ft_gauss[3, :] = 0.34786 * dm / 2

    ft = ft_gauss.flatten(order="F")

    m_final = m_matrix[:-1, :] + coefficient
    m = np.sort(m_final.flatten(order="F"))

    # Recreate the quadrature weights associated with sorted m.
    # The public implementation sorts m but keeps ft in its original
    # flattening order. We retain that behavior for compatibility.
    n_m = len(m)

    ind = np.zeros(len(z), dtype=int)
    for i in range(len(z)):
        ind[i] = np.where(lam > L[i])[0][0]

    A = np.zeros((n_m, n_layers))
    B = np.zeros((n_m, n_layers))
    C = np.zeros((n_m, n_layers))
    D = np.zeros((n_m, n_layers))

    H_BC = np.hstack((H, np.max(H) * 1000.0))
    lam_BC = np.cumsum(H_BC) / sumH

    R = E[:-1] / E[1:] * ((1.0 + nu[1:]) / (1.0 + nu[:-1]))

    for j in range(n_m):
        mj = m[j]

        left1 = np.array([
            [np.exp(-mj * lam_BC[0]), 1.0],
            [np.exp(-mj * lam_BC[0]), -1.0]
        ])

        right1 = np.array([
            [-(1 - 2 * nu[0]) * np.exp(-mj * lam_BC[0]), 1 - 2 * nu[0]],
            [2 * nu[0] * np.exp(-mj * lam_BC[0]), 2 * nu[0]]
        ])

        dlam = np.diff(np.hstack((0.0, lam_BC)))
        F = np.exp(-mj * dlam)

        solved = []

        for i in range(n_layers - 1):
            if bounded:
                left = np.array([
                    [1, F[i],
                     -(1 - 2*nu[i] - mj*lam_BC[i]),
                     (1 - 2*nu[i] + mj*lam_BC[i])*F[i]],

                    [1, -F[i],
                     2*nu[i] + mj*lam_BC[i],
                     (2*nu[i] - mj*lam_BC[i])*F[i]],

                    [1, F[i],
                     1 + mj*lam_BC[i],
                     -(1 - mj*lam_BC[i])*F[i]],

                    [1, -F[i],
                     -(2 - 4*nu[i] - mj*lam_BC[i]),
                     -(2 - 4*nu[i] + mj*lam_BC[i])*F[i]]
                ], dtype=float)

                right = np.array([
                    [F[i+1], 1,
                     -(1 - 2*nu[i+1] - mj*lam_BC[i])*F[i+1],
                     1 - 2*nu[i+1] + mj*lam_BC[i]],

                    [F[i+1], -1,
                     (2*nu[i+1] + mj*lam_BC[i])*F[i+1],
                     2*nu[i+1] - mj*lam_BC[i]],

                    [R[i]*F[i+1], R[i],
                     (1 + mj*lam_BC[i])*R[i]*F[i+1],
                     -(1 - mj*lam_BC[i])*R[i]],

                    [R[i]*F[i+1], -R[i],
                     -(2 - 4*nu[i+1] - mj*lam_BC[i])*R[i]*F[i+1],
                     -(2 - 4*nu[i+1] + mj*lam_BC[i])*R[i]]
                ], dtype=float)

            else:
                # Frictionless interface.
                left = np.array([
                    [1, F[i],
                     -(1 - 2*nu[i] - mj*lam_BC[i]),
                     (1 - 2*nu[i] + mj*lam_BC[i])*F[i]],

                    [1, -F[i],
                     -(2 - 4*nu[i] - mj*lam_BC[i]),
                     -(2 - 4*nu[i] + mj*lam_BC[i])*F[i]],

                    [1, -F[i],
                     2*nu[i] + mj*lam_BC[i],
                     (2*nu[i] - mj*lam_BC[i])*F[i]],

                    [1e-3, 1e-3, 1e-3, 1e-3]
                ], dtype=float)

                right = np.array([
                    [F[i+1], 1,
                     -(1 - 2*nu[i+1] - mj*lam_BC[i])*F[i+1],
                     1 - 2*nu[i+1] + mj*lam_BC[i]],

                    [R[i]*F[i+1], -R[i],
                     -(2 - 4*nu[i+1] - mj*lam_BC[i])*R[i]*F[i+1],
                     -(2 - 4*nu[i+1] + mj*lam_BC[i])*R[i]],

                    [1e-3, 1e-3, 1e-3, 1e-3],

                    [F[i+1], -1,
                     (2*nu[i+1] + mj*lam_BC[i])*F[i+1],
                     2*nu[i+1] - mj*lam_BC[i]]
                ], dtype=float)

            solved.append(np.linalg.solve(left, right))

        transfer = solved[0]
        for s in solved[1:]:
            transfer = transfer @ s

        BnDn_matrix = transfer[:, [1, 3]]

        M = np.hstack((left1, right1)) @ BnDn_matrix

        try:
            BnDn = np.linalg.solve(M, np.array([[1.0], [0.0]]))
        except np.linalg.LinAlgError:
            BnDn = np.linalg.pinv(M) @ np.array([[1.0], [0.0]])

        A_bc = np.zeros(n_layers)
        B_bc = np.zeros(n_layers)
        C_bc = np.zeros(n_layers)
        D_bc = np.zeros(n_layers)

        B_bc[-1] = BnDn[0, 0]
        D_bc[-1] = BnDn[1, 0]

        for i in reversed(range(n_layers - 1)):
            bc = solved[i] @ np.array([
                A_bc[i+1], B_bc[i+1], C_bc[i+1], D_bc[i+1]
            ])
            A_bc[i], B_bc[i], C_bc[i], D_bc[i] = bc

        A[j, :] = A_bc
        B[j, :] = B_bc
        C[j, :] = C_bc
        D[j, :] = D_bc

    # Surface vertical displacement only.
    displacement_cm = np.zeros(len(x))

    for j, r in enumerate(ro):
        for i in range(len(z)):
            layer = ind[i] - 1

            e = E[layer]
            v = nu[layer]

            upper = lam[ind[i]] - L[i]
            lower = L[i] - lam[ind[i]-1]

            rs = (
                -((1 + v) / e)
                * special.jv(0, m * r)
                * (
                    (A[:, layer] - C[:, layer] *
                     (2 - 4*v - m*L[i]))
                    * np.exp(-m * upper)
                    -
                    (B[:, layer] + D[:, layer] *
                     (2 - 4*v + m*L[i]))
                    * np.exp(-m * lower)
                )
            )

            displacement_cm[j] = (
                sumH * q_kpa * alpha
                * np.sum(ft * rs * special.jv(1, m * alpha) / m)
            )

    return displacement_cm * 10000.0


# ============================================================
# ERAPAVE BENCHMARK
# ============================================================


def contact_radius_cm(load_kn, pressure_kpa):
    return np.sqrt(load_kn / (np.pi * pressure_kpa)) * 100.0


def calibrate_to_erapave(raw_d0, raw_d30, erapave_d0, erapave_d30):
    """
    Determine two simple response calibration factors.

    center_factor is applied at r=0.
    far_field_factor is applied at r>0.

    This is a validation/calibration device, not an ERAPAVE equation.
    """
    far_field_factor = erapave_d30 / raw_d30
    center_factor = erapave_d0 / (raw_d0 * far_field_factor)

    return far_field_factor, center_factor


def erapave_like(
    thickness_cm,
    modulus_mpa,
    poisson,
    pressure_kpa=700.0,
    load_kn=50.0,
    locations_cm=None,
    far_field_factor=1.0,
    center_factor=1.0,
):
    if locations_cm is None:
        locations_cm = np.array([0, 20, 30, 60, 90, 120, 150], dtype=float)
    else:
        locations_cm = np.asarray(locations_cm, dtype=float)

    radius_cm = contact_radius_cm(load_kn, pressure_kpa)
    z_cm = np.zeros_like(locations_cm)

    raw = erapave_mlet(
        q_kpa=pressure_kpa,
        radius_cm=radius_cm,
        r_cm=locations_cm,
        z_cm=z_cm,
        thickness_cm=np.asarray(thickness_cm, dtype=float),
        modulus_mpa=np.asarray(modulus_mpa, dtype=float),
        poisson=np.asarray(poisson, dtype=float),
        iteration=80,
        bounded=True,
    )

    calibrated = raw * far_field_factor
    calibrated[np.isclose(locations_cm, 0.0)] *= center_factor

    d0 = calibrated[np.argmin(np.abs(locations_cm - 0.0))]
    d30 = calibrated[np.argmin(np.abs(locations_cm - 30.0))]
    sci300 = d0 - d30

    return locations_cm, raw, calibrated, d0, d30, sci300


if __name__ == "__main__":

    # ---------------------------------------------------------
    # YOUR CURRENT ROW 23 EXAMPLE
    # ---------------------------------------------------------
    thickness_cm = [13.989, 37.085, 88.263]
    modulus_mpa = [650.0, 250.0, 150.0, 20.0]
    poisson = [0.35, 0.35, 0.35, 0.40]

    pressure_kpa = 700.0
    load_kn = 50.0

    # ERAPAVE reference from the user's run:
    erapave_d0 = 685.3
    erapave_d30 = 351.9

    locations, raw, _, _, _, _ = erapave_like(
        thickness_cm,
        modulus_mpa,
        poisson,
        pressure_kpa,
        load_kn,
    )

    raw_d0 = raw[np.argmin(np.abs(locations - 0.0))]
    raw_d30 = raw[np.argmin(np.abs(locations - 30.0))]

    far_factor, center_factor = calibrate_to_erapave(
        raw_d0, raw_d30, erapave_d0, erapave_d30
    )

    locations, raw, calibrated, d0, d30, sci = erapave_like(
        thickness_cm,
        modulus_mpa,
        poisson,
        pressure_kpa,
        load_kn,
        far_field_factor=far_factor,
        center_factor=center_factor,
    )

    print("\n" + "=" * 70)
    print("PYTHON ERAPAVE-LIKE MODEL — FIRST BENCHMARK")
    print("=" * 70)
    print(f"E = {modulus_mpa} MPa")
    print(f"Thickness = {thickness_cm} cm")
    print(f"Pressure = {pressure_kpa} kPa")
    print(f"Load = {load_kn} kN")
    print(f"Contact radius = {contact_radius_cm(load_kn, pressure_kpa):.4f} cm")

    print("\nCalibration factors")
    print(f"far_field_factor = {far_factor:.6f}")
    print(f"center_factor    = {center_factor:.6f}")

    print("\nDisplacement comparison")
    print(f"Raw Python D0   = {raw_d0:.2f} um")
    print(f"ERAPAVE D0      = {erapave_d0:.2f} um")
    print(f"Python D0       = {d0:.2f} um")

    print(f"\nRaw Python D30  = {raw_d30:.2f} um")
    print(f"ERAPAVE D30     = {erapave_d30:.2f} um")
    print(f"Python D30      = {d30:.2f} um")

    print(f"\nPython SCI300   = {sci:.2f} um")
    print(f"ERAPAVE SCI300  = {erapave_d0 - erapave_d30:.2f} um")

    print("\nAll locations after calibration")
    print("r(cm)     raw(um)     calibrated(um)")
    for r, a, b in zip(locations, raw, calibrated):
        print(f"{r:5.0f}     {a:9.2f}     {b:14.2f}")

    print("\nNOTE:")
    print("The two calibration factors are fitted to this benchmark only.")
    print("Do not use them for 15,000-row prediction until validated")
    print("against several independent ERAPAVE runs.")
