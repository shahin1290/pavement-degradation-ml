"""Read an ERAPave result .txt: layers, load, and the stress/strain/deflection tables."""
import re
import numpy as np
import pandas as pd

def read(path):
    txt = open(path, encoding="utf-8", errors="ignore").read()
    lines = txt.splitlines()
    layers, i = [], 0
    while i < len(lines) and "Layer Id" not in lines[i]: i += 1
    i += 1
    while i < len(lines):
        p = lines[i].split()
        if len(p) == 5 and p[0].isdigit():
            layers.append([float(v) for v in p[1:]])
        elif layers and not p:
            if len(layers) == 4: break
        i += 1
    pres = float(re.search(r"Contact pressure \[kPa\]\s*=\s*([\d.]+)", txt).group(1))
    axle = float(re.search(r"Axle load \[kN\]\s*=\s*([\d.]+)", txt).group(1))
    def table(head, cols):
        j = next(k for k, l in enumerate(lines) if l.strip().startswith(head)) + 2
        rows = []
        while j < len(lines):
            p = lines[j].split()
            if not p:
                if rows: break
                j += 1; continue
            try: rows.append([float(v) for v in p])
            except ValueError: break
            j += 1
        return pd.DataFrame(rows, columns=cols)
    st = table("STRESSES AND DISPLACEMENTS", ["x", "y", "z", "szz", "sxx", "syy", "sxz", "syz", "sxy", "wz"])
    sn = table("STRAINS", ["x", "y", "z", "ezz", "exx", "eyy", "exz", "eyz", "exy"])
    try:
        pr = table("PRINCIPAL STRAINS", ["x", "y", "z", "e1", "e2", "e3"])   # more decimals than STRAINS
    except StopIteration:
        pr = None
    L = np.array(layers)
    return {"h_cm": L[:3, 0], "E": L[:, 1], "nu": L[:, 2], "pressure_kPa": pres, "axle_kN": axle,
            "stress": st, "strain": sn, "principal": pr}
