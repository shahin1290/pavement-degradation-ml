import { Box, Paper, Typography } from '@mui/material';
import { alpha } from '@mui/material/styles';

// From stiffness to road condition: strains calculated from the predicted moduli (backend: services/strain.py).
const GRADES = ['Good', 'Adequate', 'Satisfactory', 'Alarming', 'Deteriorating'];
const GRADE_COLORS = {
  Good: '#2e8b57', Adequate: '#9acd32', Satisfactory: '#f2c94c', Alarming: '#f2994a', Deteriorating: '#d64545',
};
const fmt = (v, d = 0) => Number(v).toLocaleString(undefined, { maximumFractionDigits: d, minimumFractionDigits: d });

function Step({ n, title, text, last }) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      <Box sx={{ px: 1.5, py: 1, borderRadius: 2, border: 1, borderColor: 'divider', bgcolor: 'background.paper', minWidth: 140 }}>
        <Typography variant="caption" color="text.secondary">Step {n}</Typography>
        <Typography variant="body2" sx={{ fontWeight: 700 }}>{title}</Typography>
        <Typography variant="caption" color="text.secondary">{text}</Typography>
      </Box>
      {!last && <Typography sx={{ fontSize: 22, color: 'text.secondary' }}>→</Typography>}
    </Box>
  );
}

function GradeChip({ grade }) {
  return (
    <Box component="span" sx={{ px: 1, py: 0.25, borderRadius: 1, fontWeight: 700, fontSize: 13,
      bgcolor: alpha(GRADE_COLORS[grade] || '#ccc', 0.35) }}
    >
      {grade}
    </Box>
  );
}

/** The five grades side by side, with markers for our strain and the Trafikverket strain. */
function GradeScale({ limits, ours, tv }) {
  const max = 500;
  const pos = (v) => `${Math.min(Math.max(v, 0), max) / max * 100}%`;
  const edges = [0, ...limits, max];
  return (
    <Box sx={{ mt: 4.5, mb: 3.5 }}>
      <Box sx={{ position: 'relative', height: 16, display: 'flex', borderRadius: 1, overflow: 'visible' }}>
        {GRADES.map((g, i) => (
          <Box key={g} title={g} sx={{ width: `${(edges[i + 1] - edges[i]) / max * 100}%`, bgcolor: GRADE_COLORS[g] }} />
        ))}
        {[{ v: ours, label: `Ours ${fmt(ours)}`, top: true }, { v: tv, label: `Trafikverket ${fmt(tv)}`, top: false }].map((m) => (
          <Box key={m.label} sx={{ position: 'absolute', left: pos(m.v), top: 0, bottom: 0, transform: 'translateX(-50%)' }}>
            <Box sx={{ width: 3, height: 26, mt: '-5px', bgcolor: m.top ? 'text.primary' : '#2a78d6', borderRadius: 1 }} />
            <Typography variant="caption" sx={{ position: 'absolute', whiteSpace: 'nowrap', transform: 'translateX(-50%)', left: '50%',
              fontWeight: 700, color: m.top ? 'text.primary' : '#2a78d6', ...(m.top ? { top: -26 } : { top: 24 }) }}
            >
              {m.label} µε
            </Typography>
          </Box>
        ))}
      </Box>
    </Box>
  );
}

function StrainPanel({ strain }) {
  if (!strain) return null;
  const s = strain;
  return (
    <Box sx={{ mt: 4 }}>
      <Typography variant="h6" gutterBottom>From stiffness to road condition</Typography>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, alignItems: 'center', mb: 2 }}>
        <Step n={1} title="Deflection bowl" text="measured by the TSD" />
        <Step n={2} title="Layer stiffness" text="E1–E4 from the ML model" />
        <Step n={3} title="Strain" text="how much the layers stretch" />
        <Step n={4} title="Condition grade" text="Finnish limits" last />
      </Box>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        A standard truck wheel ({s.load}) is put on the road with the predicted stiffness. The layered elastic model (same result as
        ERAPave, within 0.34%) gives how much the asphalt stretches at its bottom: the more it stretches, the sooner it cracks.
      </Typography>

      <Box sx={{ maxWidth: 760 }}>
        <Paper variant="outlined" sx={{ p: 2 }}>
          <Typography variant="body2" color="text.secondary">Cracking risk: asphalt stretching at its bottom</Typography>
          <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap', mt: 1 }}>
            <Box>
              <Typography variant="caption" color="text.secondary">Our method (from the stiffness)</Typography>
              <Typography variant="h5">{fmt(s.asphalt_tension_ue)} µε</Typography>
              <GradeChip grade={s.grade_ours} />
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">Trafikverket formula (from the bowl)</Typography>
              <Typography variant="h5" sx={{ color: '#2a78d6' }}>{fmt(s.trafikverket_ue)} µε</Typography>
              <GradeChip grade={s.grade_trafikverket} />
            </Box>
          </Box>
          <GradeScale limits={s.grade_limits_ue} ours={s.asphalt_tension_ue} tv={s.trafikverket_ue} />
        </Paper>
      </Box>

      <Typography variant="caption" color="text.secondary" component="p" sx={{ mt: 1.5 }}>
        Grades: Good &lt; 100, Adequate 100–200, Satisfactory 200–300, Alarming 300–400, Deteriorating &gt; 400 µε (Saarenketo &amp; Männistö 2024).
        Trafikverket formula: ε = 37.4 + 0.988·D0 − 0.553·D200 − 0.502·D600 (TRVMB 114, 2012), made for FWD; over all our data our
        method gives higher values but the same ranking (r = 0.91 in Östergötland, 0.92 in Västergötland).
      </Typography>
    </Box>
  );
}

export default StrainPanel;
