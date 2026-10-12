import { useState } from 'react';
import { Box, Button, Chip, Collapse, Typography } from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';

import { useResults, Loading, SimpleTable, fmt, fmtPct } from './common';

// "Ambiguous bowl" = the bowl fits well WITHOUT limits, but only with physically impossible moduli
// (more than 2 % outside the limits). In the data files this is the column unrealistic_without_limits.

/** Big number with a short label, tinted by colour. */
function Stat({ value, label, color = 'primary' }) {
  return (
    <Box
      sx={{
        flex: '1 1 170px', p: 1.75, borderRadius: 2, borderLeft: 4, borderColor: `${color}.main`,
        bgcolor: (t) => alpha(t.palette[color].main, 0.07),
      }}
    >
      <Typography variant="h5" sx={{ color: `${color}.main`, lineHeight: 1.1 }}>{value}</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>{label}</Typography>
    </Box>
  );
}

/** Short highlighted note, e.g. "What this means". */
function Note({ children, color = 'info' }) {
  return (
    <Box sx={{ p: 1.5, mt: 1.5, borderRadius: 2, bgcolor: (t) => alpha(t.palette[color].main, 0.07), borderLeft: 3, borderColor: `${color}.main` }}>
      <Typography variant="body2">{children}</Typography>
    </Box>
  );
}

function SubTitle({ children }) {
  return <Typography variant="subtitle1" sx={{ fontWeight: 700, mt: 3, mb: 1 }}>{children}</Typography>;
}

/** One step of the story: number + line on the left, content on the right. */
function Step({ n, title, subtitle, last, children, details, detailsLabel = 'Show details' }) {
  const [open, setOpen] = useState(false);
  return (
    <Box sx={{ display: 'flex', gap: { xs: 1.5, md: 2.5 } }}>
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
        <Box
          sx={{
            width: 40, height: 40, borderRadius: '50%', bgcolor: last ? 'success.main' : 'primary.main', color: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '1.1rem',
          }}
        >
          {last ? '✓' : n}
        </Box>
        {!last && <Box sx={{ flex: 1, width: 3, bgcolor: 'divider', my: 0.5, borderRadius: 2 }} />}
      </Box>

      <Box sx={{ flex: 1, minWidth: 0, pb: last ? 0 : 4, pt: 0.5 }}>
        <Typography variant="overline" color="text.secondary" sx={{ lineHeight: 1.2 }}>
          {last ? 'Result' : `Step ${n}`}
        </Typography>
        <Typography variant="h6" sx={{ mb: 0.5 }}>{title}</Typography>
        {subtitle && <Typography color="text.secondary" sx={{ mb: 2 }}>{subtitle}</Typography>}
        {!subtitle && children && <Box sx={{ mb: 1.5 }} />}
        {children}
        {details && (
          <>
            <Button size="small" sx={{ mt: 1.5 }} onClick={() => setOpen(!open)}>
              {open ? 'Hide' : detailsLabel}
            </Button>
            <Collapse in={open}><Box sx={{ mt: 1.5 }}>{details}</Box></Collapse>
          </>
        )}
      </Box>
    </Box>
  );
}

// ---------------------------------------------------------------- step 2: one bowl, two answers

/** Measured bowl (dots) with the bowls calculated from two very different sets of moduli (lines). */
function BowlChart({ ex }) {
  const theme = useTheme();
  const W = 560, H = 250, L = 52, R = 14, T = 14, B = 40;
  const xMax = 1500;
  const yMax = Math.ceil(Math.max(...ex.measured, ...ex.no_limits.bowl, ...ex.limits.bowl) / 50) * 50;
  const x = (v) => L + (v / xMax) * (W - L - R);
  const y = (v) => T + (v / yMax) * (H - T - B);          // deflection grows downwards, like the real bowl
  const line = (bowl) => bowl.map((v, i) => `${i ? 'L' : 'M'}${x(ex.offsets_mm[i])},${y(v)}`).join(' ');
  const cA = theme.palette.warning.main, cB = theme.palette.primary.main, grid = theme.palette.divider;
  const yTicks = Array.from({ length: yMax / 100 + 1 }, (_, i) => i * 100);

  return (
    <Box sx={{ border: 1, borderColor: 'divider', borderRadius: 2, p: 1.5, bgcolor: 'background.paper' }}>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label="Measured deflection bowl and two calculated bowls">
        {yTicks.map((t) => (
          <g key={t}>
            <line x1={L} x2={W - R} y1={y(t)} y2={y(t)} stroke={grid} />
            <text x={L - 6} y={y(t) + 4} fontSize="11" textAnchor="end" fill={theme.palette.text.secondary}>{t}</text>
          </g>
        ))}
        {[0, 300, 600, 900, 1200, 1500].map((t) => (
          <text key={t} x={x(t)} y={H - B + 16} fontSize="11" textAnchor="middle" fill={theme.palette.text.secondary}>{t}</text>
        ))}
        <text x={(L + W - R) / 2} y={H - 4} fontSize="11" textAnchor="middle" fill={theme.palette.text.secondary}>
          Distance from load (mm)
        </text>
        <text x={12} y={(T + H - B) / 2} fontSize="11" textAnchor="middle" fill={theme.palette.text.secondary}
          transform={`rotate(-90 12 ${(T + H - B) / 2})`}>Deflection (µm)</text>
        <path d={line(ex.limits.bowl)} fill="none" stroke={cB} strokeWidth="3" />
        <path d={line(ex.no_limits.bowl)} fill="none" stroke={cA} strokeWidth="2.5" strokeDasharray="7 5" />
        {ex.measured.map((v, i) => (
          <circle key={i} cx={x(ex.offsets_mm[i])} cy={y(v)} r="5" fill={theme.palette.text.primary} />
        ))}
      </svg>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, justifyContent: 'center', mt: 0.5 }}>
        <Legend dot color={theme.palette.text.primary} label="Measured (TSD, 9 sensors)" />
        <Legend color={cA} dashed label={`Answer A, no limits (fit ${ex.no_limits.rms_pct}%)`} />
        <Legend color={cB} label={`Answer B, with limits (fit ${ex.limits.rms_pct}%)`} />
      </Box>
    </Box>
  );
}

function Legend({ color, label, dot, dashed }) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
      {dot
        ? <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: color }} />
        : <Box sx={{ width: 22, borderTop: `3px ${dashed ? 'dashed' : 'solid'} ${color}` }} />}
      <Typography variant="caption">{label}</Typography>
    </Box>
  );
}

const LAYER_NAMES = ['Asphalt E1', 'Base E2', 'Subbase E3', 'Subgrade E4'];
const PLAIN = { E2: { low: 'as soft as wet clay' }, E3: { high: 'stiffer than concrete' } };

/** The two answers side by side, impossible values in red with a plain-words comment. */
function AnswerTable({ ex, limits }) {
  const keys = ['E1', 'E2', 'E3', 'E4'];
  const cell = (v, k) => {
    const [lo, hi] = limits[k];
    const bad = v < lo * 0.98 ? 'low' : v > hi * 1.02 ? 'high' : null;
    return (
      <Box component="span" sx={bad ? { color: 'error.main', fontWeight: 700 } : undefined}>
        {fmt(v)}
        {bad && <Box component="span" sx={{ fontWeight: 400, fontSize: '0.8em' }}> ✗ {PLAIN[k]?.[bad] || (bad === 'low' ? 'too soft' : 'too stiff')}</Box>}
      </Box>
    );
  };
  const rows = keys.map((k, i) => ({
    layer: `${LAYER_NAMES[i]}${i < 3 ? ` (${ex.thk_mm[i]} mm)` : ''}`,
    A: cell(ex.no_limits.E[i], k), B: cell(ex.limits.E[i], k), range: `${fmt(limits[k][0])} – ${fmt(limits[k][1])}`,
  }));
  return (
    <SimpleTable
      rows={rows}
      columns={[
        { key: 'layer', label: 'Layer (thickness)', align: 'left' },
        { key: 'A', label: 'A: no limits (MPa)' },
        { key: 'B', label: 'B: with limits (MPa)' },
        { key: 'range', label: 'Realistic (MPa)' },
      ]}
    />
  );
}

// ---------------------------------------------------------------- step 3: where

/** Small heat cell: the darker, the more ambiguous bowls. */
function Heat({ v }) {
  return (
    <Box
      component="span"
      sx={{
        display: 'inline-block', minWidth: 44, px: 0.75, py: 0.25, borderRadius: 1, textAlign: 'center', fontWeight: 600,
        bgcolor: (t) => alpha(t.palette.warning.main, Math.min(0.85, v / 100)), color: v > 60 ? '#fff' : 'text.primary',
      }}
    >
      {Math.round(v)}%
    </Box>
  );
}

/** Horizontal bar + % for the overall share of a road. */
function Bar({ v }) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, justifyContent: 'flex-end' }}>
      <Box sx={{ width: 70, height: 8, borderRadius: 4, bgcolor: 'action.hover', overflow: 'hidden' }}>
        <Box sx={{ width: `${v}%`, height: '100%', bgcolor: v > 60 ? 'error.main' : 'warning.main' }} />
      </Box>
      <b>{fmtPct(v)}</b>
    </Box>
  );
}

function RoadTable({ story, surveys }) {
  return (
    <>
      <SimpleTable
        rows={story.roads}
        highlight={(r) => r.ambiguous_pct > 60}
        columns={[
          { key: 'road', label: 'Road', align: 'left', format: (v) => <b>{v}</b> },
          { key: 'km', label: 'Length', format: (v) => `${fmt(v, 1)} km` },
          { key: 'ambiguous_pct', label: 'Ambiguous', format: (v) => <Bar v={v} /> },
          ...surveys.map((s, i) => ({
            key: `s${s.survey}`, label: s.date, align: 'center', format: (_, r) => <Heat v={r.by_survey[i]} />,
          })),
          {
            key: 'main_causes', label: 'Without limits, the solver says…', align: 'left',
            format: (v) => v.map((c) => c.text).join(' + '),
          },
          { key: 'thk_mm', label: 'Layers (mm)', format: (v) => v.join(' / ') },
        ]}
      />
      <Typography variant="body2" color="text.secondary">
        Main roads only ({story.roads_left_out.roads} short branch roads with {fmt(story.roads_left_out.cases)} cases left out).
        Length ≈ locations × 20 m. Layers = median asphalt / base / subbase thickness from the road database.
      </Typography>
    </>
  );
}

function SameLocation({ loc }) {
  const show = (v) => v.map((e) => fmt(e)).join(' / ');
  return (
    <SimpleTable
      rows={loc.surveys}
      highlight={(r) => r.ambiguous}
      columns={[
        { key: 'date', label: 'Survey', align: 'left' },
        {
          key: 'ambiguous', label: 'Bowl', align: 'left',
          format: (v) => (v ? <Box component="span" sx={{ color: 'warning.dark', fontWeight: 700 }}>ambiguous</Box> : 'clear'),
        },
        {
          key: 'no_limits', label: 'No limits E1 / E2 / E3 / E4',
          format: (v, r) => (r.ambiguous ? <span>{show(v)} <small>({r.rms_no_limits}%)</small></span> : '= same'),
        },
        { key: 'limits', label: 'With limits E1 / E2 / E3 / E4', format: (v, r) => <span><b>{show(v)}</b> <small>({r.rms_limits}%)</small></span> },
      ]}
    />
  );
}

// ---------------------------------------------------------------- page

function SummaryTab() {
  const ds = useResults('dataset');
  const bd = useResults('bounds');
  if (!ds.data || !bd.data) return <Loading error={ds.error || bd.error} />;

  const t = ds.data.total;
  const b = bd.data;
  const F = b.full;            // all Östergötland cases, with vs without limits
  const S = b.story;           // example bowl, per road, one location over time
  if (!F || !S) return <Loading error={new Error('bounds.json is out of date: run python make_results_data.py')} />;

  const ex = S.example;
  const worst = S.roads[0];
  const loc = S.same_location;
  const clearE2 = loc.surveys.filter((s) => !s.ambiguous).map((s) => s.limits[1]);
  const ambE2 = loc.surveys.filter((s) => s.ambiguous);
  const ml = b.ml_filter_test;

  return (
    <>
      {/* 1 ---------------------------------------------------------------- */}
      <Step
        n={1}
        title={`Backcalculate every bowl automatically (${fmt(F.cases)} bowls)`}
        subtitle="For each TSD bowl, find the layer moduli E1–E4 that make the calculated bowl match the 9 measured deflections."
      >
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 1.5 }}>
          {['Same layered elastic model as ERAPAVE', '4 layers', '50 kN wheel (100 kN axle), 800 kPa',
            'Poisson 0.35 / 0.35 / 0.35 / 0.40', 'Good fit: RMS ≤ 5%'].map((c) => (
            <Chip key={c} size="small" variant="outlined" label={c} />
          ))}
        </Box>
        <Typography color="text.secondary">
          It does what an engineer does in ERAPAVE, change the moduli until the bowls match, but with a least-squares search
          instead of trial and error. For the same moduli it gives the same bowl as ERAPAVE (within 0.2%).
        </Typography>
      </Step>

      {/* 2 ---------------------------------------------------------------- */}
      <Step
        n={2}
        title="Problem: some bowls are ambiguous"
        subtitle="Very different pavements can give almost the same bowl. Then the measurement alone cannot decide, and the search may pick physically impossible moduli."
        details={(
          <SimpleTable
            rows={Object.values(S.causes_total)}
            columns={[
              { key: 'text', label: 'Without limits, the solver says…', align: 'left' },
              { key: 'rule', label: 'Rule' },
              { key: 'cases', label: 'Bowls', format: (v) => fmt(v) },
            ]}
          />
        )}
        detailsLabel="What goes wrong most often"
      >
        <Typography variant="body2" sx={{ mb: 1 }}>
          Example: road {ex.road}, {ex.date} (row {ex.row_index}). Two answers, both fit the measured bowl within 2%:
        </Typography>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1.15fr 1fr' }, gap: 2, alignItems: 'start' }}>
          <BowlChart ex={ex} />
          <AnswerTable ex={ex} limits={b.limits} />
        </Box>
        <Note>
          The dashed and solid lines both go through the measured points. The 9 sensors cannot tell these two pavements apart
          (the known <b>non-uniqueness</b> of backcalculation). Without limits the search takes A because it fits {(ex.limits.rms_pct - ex.no_limits.rms_pct).toFixed(1)}% better,
          but a base of {fmt(ex.no_limits.E[1])} MPa under a subbase of {fmt(ex.no_limits.E[2])} MPa is not a real road.
        </Note>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, mt: 2 }}>
          <Stat value={fmtPct(F.unrealistic_pct)} label={`of all bowls are ambiguous (${fmt(F.unrealistic)} of ${fmt(F.cases)})`} color="warning" />
        </Box>
      </Step>

      {/* 3 ---------------------------------------------------------------- */}
      <Step
        n={3}
        title="Where the ambiguous bowls are"
        subtitle="They are not random: they depend on the survey (season) and on the road."
      >
        <SubTitle>By survey</SubTitle>
        <SimpleTable
          rows={[...F.by_survey, { ...F, survey: 'total' }]}
          highlight={(r) => r.survey !== 'total' && r.unrealistic_pct > 40}
          columns={[
            { key: 'survey', label: 'Survey', align: 'left', format: (v, r) => (v === 'total' ? <b>All surveys</b> : r.date) },
            { key: 'unrealistic', label: 'Ambiguous bowls', format: (v, r) => <span><b>{fmt(v)}</b> ({fmtPct(r.unrealistic_pct)})</span> },
            { key: 'E1_above_8000', label: 'Asphalt E1 > 8,000', format: (v) => fmt(v) },
            { key: 'E2_below_100', label: 'Base E2 < 100', format: (v) => fmt(v) },
            { key: 'E4_above_400', label: 'Subgrade E4 > 400', format: (v) => fmt(v) },
          ]}
        />
        <Typography variant="body2" color="text.secondary">
          About half the bowls in Aug 2022 and May 2024, only 1 in 5 in the two September surveys. Same roads, different
          conditions (moisture, temperature, season).
        </Typography>

        <SubTitle>By road</SubTitle>
        <RoadTable story={S} surveys={F.by_survey} />
        <Note color="warning">
          <b>Road {worst.road}</b> ({fmt(worst.km, 1)} km) is ambiguous in {fmtPct(worst.ambiguous_pct)} of bowls, in every survey.
          Without limits the solver keeps answering {worst.main_causes.map((c) => `${c.text} (${c.rule})`).join(' and ')}. A problem in every
          season points to the road itself: the real layers probably differ from the database (for example thicker asphalt,
          or a bound/stabilised layer). Worth checking with cores or construction records.
        </Note>

        <SubTitle>Same location, four surveys (road {loc.road}, row {loc.row_index})</SubTitle>
        <SameLocation loc={loc} />
        <Note>
          In the September surveys the bowl is clear: base E2 = {clearE2.map((v) => fmt(v)).join(' and ')} MPa. In {ambE2.map((s) => s.date).join(' and ')} the
          bowl is ambiguous: without limits the base falls to {ambE2.map((s) => fmt(s.no_limits[1])).join(' and ')} MPa. With
          limits it stays at {fmt(ambE2[0].limits[1])} MPa, much closer to the clear surveys. So the bowl is not wrong data,
          and the location is not a bad road; the limits give the more believable answer.
        </Note>
      </Step>

      {/* 4 ---------------------------------------------------------------- */}
      <Step
        n={4}
        title="Add engineering limits"
        subtitle="The search only looks inside realistic ranges. This is engineering knowledge, added to the measurement."
      >
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
          {Object.entries(b.limits).map(([e, [lo, hi]], i) => (
            <Chip key={e} variant="outlined" color="primary" label={`${LAYER_NAMES[i]}: ${fmt(lo)} – ${fmt(hi)} MPa`} />
          ))}
        </Box>
        <Box component="ul" sx={{ m: 0, pl: 2.5, '& li': { mb: 0.5 } }}>
          <li><Typography variant="body2"><b>Clear bowls ({fmtPct(100 - F.unrealistic_pct)}):</b> the best answer is already inside the limits. Nothing changes.</Typography></li>
          <li><Typography variant="body2"><b>Ambiguous bowls ({fmtPct(F.unrealistic_pct)}):</b> the search takes the best-fitting <i>realistic</i> answer, like answer B above.</Typography></li>
          <li><Typography variant="body2"><b>A value exactly on a limit</b> means "the measurement wanted to go further". It is the most plausible answer, not a proven one, so the ML model marks such bowls with a reliability warning.</Typography></li>
        </Box>
      </Step>

      {/* 5 ---------------------------------------------------------------- */}
      <Step n={5} title="Backcalculate all Östergötland data with limits">
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5 }}>
          <Stat value={fmt(t.cases)} label={`bowls: ${fmt(t.cases / 4)} locations × 4 surveys`} color="primary" />
          <Stat value={fmt(t.good_fit)} label="usable bowls (fit within 5%)" color="success" />
        </Box>
      </Step>

      <Step n={6} last title={`${fmt(t.good_fit)} bowls train the ML model, ambiguous ones included`}>
        <Typography color="text.secondary">
          Ambiguous bowls are real measurements and will also come in future TSD surveys, so they stay in training with
          their limited answer.
          {ml && (
            <> A test on rows 0–999 confirms it: a model trained <i>without</i> them misses the ambiguous bowls by{' '}
              {ml.unbounded_realistic.difficult_rms}% (deflection RMS), against {ml.bounded.difficult_rms}% when they are kept.</>
          )}
        </Typography>
      </Step>
    </>
  );
}

export default SummaryTab;
