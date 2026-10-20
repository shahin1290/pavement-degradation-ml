import { Box, Typography } from '@mui/material';
import { alpha } from '@mui/material/styles';

import { useResults, Loading, SimpleTable, fmt } from './common';

// Step-by-step: how C0 and A were calculated from our data (data: c0_calc.json).
// Same content as How_C0_is_calculated.pdf.

const sci = (v, d = 2) => (v == null ? '–' : Number(v).toExponential(d).replace('e', 'E').replace(/E-(\d)$/, 'E-0$1'));
const f5 = (v) => fmt(v, 5);
const f1 = (v) => fmt(v, 1);

function H({ n, children }) {
  return (
    <Typography variant="subtitle1" sx={{ fontWeight: 700, mt: 3.5, mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
      <Box component="span" sx={{ width: 26, height: 26, borderRadius: '50%', bgcolor: 'primary.main', color: '#fff',
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.85rem', flexShrink: 0 }}
      >
        {n}
      </Box>
      {children}
    </Typography>
  );
}

/** Formula / worked calculation box */
function Eq({ children }) {
  return (
    <Box sx={{ my: 1, px: 2, py: 1.25, borderRadius: 2, fontFamily: 'ui-monospace, Consolas, monospace', fontSize: '0.92rem',
      lineHeight: 1.7, bgcolor: (t) => alpha(t.palette.primary.main, 0.07), overflowX: 'auto' }}
    >
      {children}
    </Box>
  );
}

function Quote({ children }) {
  return <Typography variant="body2" sx={{ fontStyle: 'italic', color: 'text.secondary', pl: 2, mb: 1 }}>“{children}”</Typography>;
}

function P({ children }) {
  return <Typography variant="body2" sx={{ mb: 1 }}>{children}</Typography>;
}

function C0Calculation() {
  const { data, error } = useResults('c0_calc');
  if (!data) return <Loading error={error} />;
  const ex = data.example;
  const r1 = ex.rows[0];
  const loc1 = ex.rows.filter((r) => r.loc === r1.loc);
  const s1 = ex.rows.filter((r) => r.survey === 1);
  const L = data.line;
  const D0 = data.sensors[0];

  return (
    <Box>
      <Typography color="text.secondary" sx={{ mb: 1 }}>
        Following Park, Kim &amp; Park (2002), <i>Temperature Correction of Multiload-Level FWD Deflections</i>, TRR 1806,
        applied to the original (not corrected) Östergötland TSD bowls.
      </Typography>

      <H n={1}>Two equations from the paper</H>
      <P><b>Eq. 2</b>: the correction factor is the deflection at 20 °C divided by the measured deflection.</P>
      <Eq>λ = w(20 °C) / w(T)</Eq>
      <Quote>…dividing the measured deflection at a specific temperature (T) by the deflection at a reference temperature (T0, 20°C).</Quote>
      <P><b>Eq. 6</b>: the correction factor depends on asphalt thickness and temperature.</P>
      <Eq>λ = 10^( −C · H_ac · (T − 20) )</Eq>
      <Quote>…where Hac is the AC layer thickness in millimeters, and C is the regression constant.</Quote>

      <H n={2}>Rewrite them as a straight line</H>
      <Eq>
        (a) both are λ:      w(20) / w(T) = 10^( −C · H · (T − 20) )<br />
        (b) solve for w(T):  w(T) = w(20) · 10^( C · H · (T − 20) )<br />
        (c) take log10:      <b>log10 w(T) = log10 w(20) + C · H · (T − 20)</b>
      </Eq>
      <P>
        This is a straight line <b>y = b + C · x</b> with <b>y = log10(D0)</b>, <b>x = H · (T − 20)</b>,
        b = the deflection the location would have at 20 °C (different for every location), and <b>C = the slope</b>.
        The paper says the same in Eq. 3 (“a linear function between log w and T”) and below Eq. 5
        (“the n-value is an increasing function of the AC layer thickness”).
      </P>

      <H n={3}>Example data: 3 locations × 4 surveys</H>
      <SimpleTable
        rows={ex.rows}
        columns={[
          { key: 'loc', label: 'Location', align: 'left' },
          { key: 'date', label: 'Survey', align: 'left' },
          { key: 'H', label: 'H asphalt (mm)', format: (v) => fmt(v, 2) },
          { key: 'T', label: 'T (°C)', format: f1 },
          { key: 'D0', label: 'D0 (µm)', format: (v) => fmt(v, 2) },
        ]}
      />
      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
        3 locations are far too few for a reliable value; they only show the arithmetic.
      </Typography>

      <H n={4}>Step 1: y and x for every bowl</H>
      <Eq>
        y = log10({fmt(r1.D0, 3)}) = <b>{f5(r1.y)}</b><br />
        x = {fmt(r1.H, 2)} × ({f1(r1.T)} − 20) = <b>{f1(r1.x)}</b>
      </Eq>

      <H n={5}>Step 2: location averages (each location's own level b)</H>
      <Eq>
        mean x = ({loc1.map((r) => f1(r.x)).join(' + ')}) / 4 = <b>{f1(r1.lx)}</b><br />
        mean y = ({loc1.map((r) => f5(r.y)).join(' + ')}) / 4 = <b>{f5(r1.ly)}</b>
      </Eq>
      <P>Subtracting it means a stiff location is not compared with a soft one.</P>

      <H n={6}>Step 3: survey averages and the overall average</H>
      <Eq>
        survey {r1.date}: mean x = ({s1.map((r) => f1(r.x)).join(' + ')}) / {s1.length} = <b>{f1(r1.sx)}</b><br />
        overall mean of all {ex.rows.length} bowls: x = <b>{f1(ex.all_mean.x)}</b>, y = <b>{f5(ex.all_mean.y)}</b>
      </Eq>
      <P>
        Things that affect a whole survey day (moisture, season, device) are not mistaken for temperature.
        For example, the far sensor D1500 is about 30 µm in May 2024 but 110 µm in Sep 2023.{' '}
        <i>This step is not in the paper</i> (Park tested 11 sections many times); it is the standard
        “two-way fixed effects” regression. Without it, C would grow with distance, which contradicts the paper.
      </P>

      <H n={7}>Step 4: remove both levels</H>
      <Eq>
        x* = x − location mean − survey mean + overall mean<br />
        x* = {f1(r1.x)} − {f1(r1.lx)} − {f1(r1.sx)} + {f1(ex.all_mean.x)} = <b>{f1(r1.xs)}</b><br />
        y* = {f5(r1.y)} − {f5(r1.ly)} − {f5(r1.sy)} + {f5(ex.all_mean.y)} = <b>{f5(r1.ys)}</b>
      </Eq>
      <P>x* &gt; 0 means “warmer than normal for this location and survey”; y* &gt; 0 means “D0 larger than normal”.</P>

      <H n={8}>Step 5: the slope C (least squares)</H>
      <SimpleTable
        rows={[...ex.rows, { sum: true }]}
        highlight={(r) => r.sum}
        columns={[
          { key: 'loc', label: 'Location', align: 'left', format: (v, r) => (r.sum ? <b>Sum Σ</b> : v) },
          { key: 'date', label: 'Survey', align: 'left' },
          { key: 'xs', label: 'x*', format: (v, r) => (r.sum ? '' : f1(v)) },
          { key: 'ys', label: 'y*', format: (v, r) => (r.sum ? '' : f5(v)) },
          { key: 'xy', label: 'x* · y*', format: (v, r) => (r.sum ? <b>{fmt(ex.sum_xy, 4)}</b> : fmt(v, 4)) },
          { key: 'xx', label: 'x*²', format: (v, r) => (r.sum ? <b>{f1(ex.sum_xx)}</b> : f1(v)) },
        ]}
      />
      <Eq>
        C = Σ(x* · y*) / Σ(x*²) = {fmt(ex.sum_xy, 4)} / {f1(ex.sum_xx)} = <b>{sci(ex.C)}</b>   (3 locations)<br />
        All {fmt(data.bowls)} bowls ({fmt(data.locations)} locations): <b>C = {sci(D0.C)}</b> for D0
        (90% range {sci(D0.lo)} to {sci(D0.hi)})
      </Eq>

      <H n={9}>From C at each sensor to C0 and A (Eq. 7)</H>
      <Quote>…the degree of temperature dependency of deflections linearly decreases as the radial distance increases.</Quote>
      <P>So C is a straight line in the distance r: <b>C = C0 + A · r</b> (A negative). Steps 1–5 are repeated for D130, D215 and D300.</P>
      <SimpleTable
        rows={[...L.rows, { sum: true }]}
        highlight={(r) => r.sum}
        columns={[
          { key: 'sensor', label: 'Sensor', align: 'left', format: (v, r) => (r.sum ? <b>Mean / sum</b> : v) },
          { key: 'r', label: 'r (mm)', format: (v, r) => (r.sum ? <b>r̄ = {fmt(L.r_mean, 2)}</b> : v) },
          { key: 'C', label: 'C (×10⁻⁵)', format: (v, r) => (r.sum ? <b>C̄ = {fmt(L.C_mean * 1e5, 3)}</b> : fmt(v * 1e5, 3)) },
          { key: 'dr', label: 'r − r̄', format: (v, r) => (r.sum ? '' : fmt(v, 2)) },
          { key: 'dc', label: 'C − C̄', format: (v, r) => (r.sum ? '' : fmt(v * 1e5, 3)) },
          { key: 'p', label: '(r − r̄)(C − C̄)', format: (_, r) => (r.sum ? <b>{fmt(L.sum_drdc * 1e5, 1)}</b> : fmt(r.dr * r.dc * 1e5, 1)) },
          { key: 'q', label: '(r − r̄)²', format: (_, r) => (r.sum ? <b>{fmt(L.sum_drdr)}</b> : fmt(r.dr * r.dr)) },
        ]}
      />
      <Eq>
        A  = Σ(r − r̄)(C − C̄) / Σ(r − r̄)² = {fmt(L.sum_drdc * 1e5, 1)} / {fmt(L.sum_drdr)} ×10⁻⁵ = <b>{sci(L.A)} per mm</b><br />
        C0 = C̄ − A · r̄ = {fmt(L.C_mean * 1e5, 3)} − ({fmt(L.A * 1e5, 5)} × {fmt(L.r_mean, 2)}) = <b>{sci(L.C0)}</b>
      </Eq>
      <Typography variant="body2" color="text.secondary">
        The paper prints Eq. 7 as C = −A·r + C0 but lists negative A values in Table 3; with both minus signs C would grow
        with distance, against the paper's own text. C = C0 + A·r with negative A matches both, and is used for Park's values and ours.
      </Typography>

      <H n={10}>Result</H>
      <SimpleTable
        rows={[...data.park.map((p) => ({ ...p, src: 'Park et al. (2002), Table 3' })),
          { name: 'Östergötland TSD', C0: L.C0, A: L.A, src: 'this calculation', ours: true }]}
        highlight={(r) => r.ours}
        columns={[
          { key: 'name', label: '', align: 'left', format: (v, r) => (r.ours ? <b>{v}</b> : v) },
          { key: 'C0', label: 'C0', format: (v, r) => (r.ours ? <b>{sci(v)}</b> : sci(v)) },
          { key: 'A', label: 'A (per mm)', format: (v, r) => (r.ours ? <b>{sci(v)}</b> : sci(v)) },
          { key: 'src', label: 'Source', align: 'left' },
        ]}
      />
      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
        Our asphalt reacts about half as strongly to temperature as the North Carolina asphalt. The check is at the top of this page:
        with our values E1 no longer depends on temperature.
      </Typography>
    </Box>
  );
}

export default C0Calculation;
