import { useState } from 'react';
import { Box, ToggleButton, ToggleButtonGroup, Typography } from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import {
  Area, AreaChart, CartesianGrid, ReferenceDot, ReferenceLine, ResponsiveContainer, Scatter, ScatterChart,
  Tooltip, XAxis, YAxis,
} from 'recharts';

import { useResults, Loading, SimpleTable, fmt } from './common';

// Road condition from the critical strains: three questions in plain words
// (data: strain_condition.json, built by strain/strain_analysis.py).
const CLASS_COLORS = {
  Good: '#2e8b57', Adequate: '#9acd32', Satisfactory: '#f2c94c', Alarming: '#f2994a', Deteriorating: '#d64545',
};
const METHODS = [
  { id: 'ours', name: 'Our method', what: 'strain calculated from the backcalculated layer stiffness' },
  { id: 'eq3', name: 'Trafikverket formula', what: 'strain estimated directly from the deflection bowl (Eq. 3)' },
];

function Question({ n, title, answer, tone, children }) {
  return (
    <Box sx={{ mt: 4, pt: 2.5, borderTop: 1, borderColor: 'divider' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap', mb: 1 }}>
        <Typography variant="h6">{n}. {title}</Typography>
        <Box sx={{ px: 1.25, py: 0.25, borderRadius: 5, fontSize: 13, fontWeight: 700,
          bgcolor: (t) => alpha(t.palette[tone].main, 0.12), color: `${tone}.dark` }}
        >
          {answer}
        </Box>
      </Box>
      {children}
    </Box>
  );
}

function StatBox({ value, label }) {
  return (
    <Box sx={{ p: 1.5, borderRadius: 2, border: 1, borderColor: 'divider', minWidth: 170, flex: 1 }}>
      <Typography variant="h5" sx={{ fontWeight: 700, lineHeight: 1.2 }}>{value}</Typography>
      <Typography variant="body2" color="text.secondary">{label}</Typography>
    </Box>
  );
}

/** One horizontal bar split into the five grades. */
function GradeBar({ shares, classes }) {
  return (
    <Box sx={{ display: 'flex', height: 30, borderRadius: 1.5, overflow: 'hidden', border: 1, borderColor: 'divider' }}>
      {classes.map((c) => shares[c] > 0 && (
        <Box key={c} title={`${c}: ${fmt(shares[c], 1)}%`}
          sx={{ width: `${shares[c]}%`, bgcolor: CLASS_COLORS[c], display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 12, fontWeight: 700, color: '#222', overflow: 'hidden', whiteSpace: 'nowrap' }}
        >
          {shares[c] >= 7 ? `${fmt(shares[c])}%` : ''}
        </Box>
      ))}
    </Box>
  );
}

function Legend({ classes, limits }) {
  const text = (i) => (i === 0 ? `< ${limits[0]}` : i === classes.length - 1 ? `> ${limits[limits.length - 1]}` : `${limits[i - 1]}–${limits[i]}`);
  return (
    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, my: 1 }}>
      {classes.map((c, i) => (
        <Box key={c} sx={{ display: 'flex', alignItems: 'center', gap: 0.75, fontSize: 13 }}>
          <Box sx={{ width: 14, height: 14, borderRadius: 0.5, bgcolor: CLASS_COLORS[c] }} />
          <b>{c}</b>&nbsp;<span style={{ opacity: 0.7 }}>{text(i)} µε</span>
        </Box>
      ))}
    </Box>
  );
}

function Q1({ data }) {
  const [survey, setSurvey] = useState(data.q1[data.q1.length - 1].survey);
  const s = data.q1.find((q) => q.survey === survey);
  const bad = (sh) => sh.Alarming + sh.Deteriorating;
  return (
    <>
      <Typography sx={{ mb: 1.5 }}>
        Every 20 m of road gets a grade from its asphalt strain, using the Finnish limits (Saarenketo &amp; Männistö 2024).
        We grade the road twice: with <b>our method</b> and with the official <b>Trafikverket formula</b>.
      </Typography>
      <Legend classes={data.classes} limits={data.limits} />
      <ToggleButtonGroup size="small" exclusive value={survey} onChange={(_, v) => v && setSurvey(v)} sx={{ my: 1 }}>
        {data.q1.map((q) => <ToggleButton key={q.survey} value={q.survey}>{q.survey}</ToggleButton>)}
      </ToggleButtonGroup>
      {METHODS.map((m) => (
        <Box key={m.id} sx={{ mb: 1.5 }}>
          <Typography variant="body2" sx={{ mb: 0.5 }}>
            <b>{m.name}</b> ({m.what}): typical strain <b>{fmt(s[`median_${m.id}`])} µε</b>,{' '}
            <b>{fmt(bad(s[m.id]))}%</b> of the road alarming or worse
          </Typography>
          <GradeBar shares={s[m.id]} classes={data.classes} />
        </Box>
      ))}
      <SimpleTable
        rows={data.q1}
        columns={[
          { key: 'survey', label: 'Alarming or worse', align: 'left' },
          { key: 'ours', label: 'Our method', format: (v) => `${fmt(bad(v))}%` },
          { key: 'eq3', label: 'Trafikverket formula', format: (v) => `${fmt(bad(v))}%` },
        ]}
      />
      <Typography variant="body2">
        <b>What it means:</b> both methods agree that most of the road is adequate or satisfactory, but they disagree on how much is
        alarming. The grade also changes between survey days. So the share of the road in bad condition <b>cannot be given as one firm number</b> yet.
      </Typography>
    </>
  );
}

function Q2({ data }) {
  const theme = useTheme();
  const q = data.q2;
  const axis = { fill: theme.palette.text.secondary, fontSize: 12 };
  const higher = Math.round(100 * (q.median_ours / q.median_eq3 - 1));
  return (
    <>
      <Typography sx={{ mb: 1.5 }}>
        Trafikverket has a formula that estimates the same strain directly from the deflection bowl
        (ε = 37.4 + 0.988·D0 − 0.553·D200 − 0.502·D600, TRVMB 114, 2012). We compared it with our strain for all {fmt(data.bowls)} points.
      </Typography>
      <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', mb: 2 }}>
        <StatBox value={`r = ${q.r}`} label="Both methods agree on which roads are weak and which are strong (1 = perfect)" />
        <StatBox value={`+${higher}%`} label={`Our strain is higher (typical ${q.median_ours} vs ${q.median_eq3} µε)`} />
        <StatBox value={`${fmt(q.near_class)}%`} label="of the points get the same grade or the neighbouring grade" />
      </Box>
      <Box sx={{ width: '100%', maxWidth: 560, height: 380 }}>
        <ResponsiveContainer>
          <ScatterChart margin={{ top: 10, right: 20, bottom: 30, left: 10 }}>
            <CartesianGrid stroke={theme.palette.divider} />
            <XAxis type="number" dataKey="eq3" domain={[0, 800]} ticks={[0, 100, 200, 300, 400, 500, 600, 700, 800]} tick={axis}
              label={{ value: 'Trafikverket formula (µε)', position: 'insideBottom', offset: -18, fill: theme.palette.text.secondary, fontSize: 12 }} />
            <YAxis type="number" dataKey="ours" domain={[0, 800]} ticks={[0, 100, 200, 300, 400, 500, 600, 700, 800]} tick={axis}
              label={{ value: 'Our method (µε)', angle: -90, position: 'insideLeft', fill: theme.palette.text.secondary, fontSize: 12 }} />
            <ReferenceLine segment={[{ x: 0, y: 0 }, { x: 800, y: 800 }]} stroke={theme.palette.text.secondary} strokeDasharray="5 4"
              label={{ value: 'equal', position: 'insideTopRight', fill: theme.palette.text.secondary, fontSize: 12 }} />
            <Tooltip cursor={false} formatter={(v) => `${v} µε`} />
            <Scatter data={q.points} fill="#2a78d6" fillOpacity={0.25} isAnimationActive={false} shape="circle" />
          </ScatterChart>
        </ResponsiveContainer>
      </Box>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
        Each dot is one 20 m point (random sample of 1,500). Dots above the dashed line: our method gives a higher strain.
      </Typography>
      <Typography variant="body2">
        <b>What it means:</b> like two scales that always agree on who is heavier, but one always shows about {higher}% more.
        The <b>order</b> of the roads can be trusted (a good, independent check of our stiffness values); the <b>exact level</b> is uncertain.
        Possible reasons: the Trafikverket formula was made for FWD measurements, not TSD, and the TSD has no sensor at 200 mm.
      </Typography>
    </>
  );
}

function Q3({ data }) {
  const theme = useTheme();
  const q = data.q3;
  const [kind, setKind] = useState('fatigue');
  const axis = { fill: theme.palette.text.secondary, fontSize: 12 };
  const p10 = q.curve.find((c) => c.road_pct >= 10) || q.curve[0];
  return (
    <>
      <Typography sx={{ mb: 1 }}>
        A road wears out faster when the asphalt stretches more <b>and</b> when more heavy trucks drive on it.
        Damage grows very fast with strain, roughly with the 4th power (Saliko &amp; Erlingsson 2021):
      </Typography>
      <SimpleTable
        rows={[{ s: 'same as typical', d: '1×' }, { s: '20% higher', d: 'about 2×' }, { s: '60% higher', d: 'about 7×' }]}
        columns={[{ key: 's', label: 'Strain', align: 'left' }, { key: 'd', label: 'Damage per truck', align: 'left' }]}
      />
      <Typography sx={{ mb: 1.5 }}>
        For every 500 m of road: <b>damage index = trucks per day × (strain ÷ typical strain)⁴</b>.
        Index 1 = an average stretch ({q.median_heavy} heavy vehicles/day, {q.ref_strain} µε); index 20 = wears out 20 times faster.
      </Typography>

      <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', mb: 2 }}>
        <StatBox value={`${fmt(q.share_top10)}%`} label={`of all damage happens on the worst 10% of the road (${q.segments} stretches of 500 m)`} />
        <StatBox value="Roads 50 and 32" label="dominate the top: high strain and 570–710 heavy vehicles/day" />
        <StatBox value={q.robust_fatigue} label="Ranking hardly changes without uncertain data (1 = identical)" />
      </Box>

      <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Damage is concentrated on a small part of the road</Typography>
      <Box sx={{ width: '100%', maxWidth: 620, height: 280 }}>
        <ResponsiveContainer>
          <AreaChart data={q.curve} margin={{ top: 10, right: 20, bottom: 30, left: 10 }}>
            <CartesianGrid stroke={theme.palette.divider} />
            <XAxis type="number" dataKey="road_pct" domain={[0, 100]} ticks={[0, 10, 20, 40, 60, 80, 100]} tick={axis} tickFormatter={(v) => `${v}%`}
              label={{ value: 'Share of the road, worst first', position: 'insideBottom', offset: -18, fill: theme.palette.text.secondary, fontSize: 12 }} />
            <YAxis domain={[0, 100]} tick={axis} tickFormatter={(v) => `${v}%`}
              label={{ value: 'Share of all damage', angle: -90, position: 'insideLeft', fill: theme.palette.text.secondary, fontSize: 12 }} />
            <ReferenceLine segment={[{ x: 0, y: 0 }, { x: 100, y: 100 }]} stroke={theme.palette.text.secondary} strokeDasharray="5 4" />
            <Tooltip formatter={(v) => `${v}%`} labelFormatter={(v) => `Worst ${v}% of the road`} />
            <Area dataKey="damage_pct" stroke="#d64545" fill={alpha('#d64545', 0.15)} strokeWidth={2.5} isAnimationActive={false} />
            <ReferenceDot x={p10.road_pct} y={p10.damage_pct} r={5} fill="#d64545" stroke="#fff"
              label={{ value: `${p10.road_pct}% of road → ${p10.damage_pct}% of damage`, position: 'right', fontSize: 12, fill: theme.palette.text.primary }} />
          </AreaChart>
        </ResponsiveContainer>
      </Box>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        If damage were spread evenly, the line would follow the dashed diagonal. The higher the curve, the more the damage is concentrated.
      </Typography>

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap', mb: 1 }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Top 10 stretches to check first</Typography>
        <ToggleButtonGroup size="small" exclusive value={kind} onChange={(_, v) => v && setKind(v)}>
          <ToggleButton value="fatigue">Cracking (asphalt)</ToggleButton>
          <ToggleButton value="rutting">Rutting (subgrade)</ToggleButton>
        </ToggleButtonGroup>
      </Box>
      <SimpleTable
        rows={q[kind]}
        columns={[
          { key: 'rank', label: 'Rank' },
          { key: 'road', label: 'Road', align: 'left' },
          { key: 'km_from', label: 'Where (km)', align: 'left', format: (v, r) => `${fmt(v, 1)}–${fmt(r.km_to, 1)}` },
          { key: 'heavy', label: 'Heavy vehicles/day', format: (v) => fmt(v) },
          ...(kind === 'fatigue'
            ? [{ key: 'strain', label: 'Asphalt strain (µε)', format: (v) => fmt(v) },
              { key: 'class', label: 'Grade', align: 'left', format: (v) => (
                <Box component="span" sx={{ px: 0.75, borderRadius: 1, bgcolor: alpha(CLASS_COLORS[v] || '#ccc', 0.35) }}>{v}</Box>) }]
            : [{ key: 'subgrade', label: 'Subgrade strain (µε)', format: (v) => fmt(v) }]),
          { key: 'index', label: 'Damage index', format: (v) => <b>{fmt(v, 1)}</b> },
        ]}
      />
      <Typography variant="body2" sx={{ mb: 1 }}>
        <b>What it means:</b> this is a priority list for maintenance (WP4). A small part of the network causes a large part of the damage,
        so targeted repairs on these stretches give the most benefit.
      </Typography>
      <Typography variant="body2" color="text.secondary">
        Left out: {q.uncertain} stretches where most stiffness values are at a limit (too uncertain). Rutting is less certain than cracking,
        because the subgrade strain changes strongly with season. The index ranks stretches; it does not give remaining life in years
        (that needs the Trafikverket design coefficients and the age of each road).
      </Typography>
    </>
  );
}

function StrainConditionTab() {
  const { data, error } = useResults('strain_condition');
  if (!data) return <Loading error={error} />;
  const last = data.q1[data.q1.length - 1];
  const higher = Math.round(100 * (data.q2.median_ours / data.q2.median_eq3 - 1));
  const topRoads = [...new Set(data.q3.fatigue.map((r) => r.road))].slice(0, 2).join(' and ');
  return (
    <>
      <Typography color="text.secondary" sx={{ mb: 2 }}>
        When a truck wheel drives over the road, the bottom of the asphalt <b>stretches</b> a tiny bit (strain, in µε = millionths).
        More stretching means the asphalt cracks sooner. We calculated this strain for {fmt(data.bowls)} points from the layer stiffness
        (checked against ERAPave: same result within 0.34%) and asked three questions.
      </Typography>
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 1.5 }}>
        <StatBox value="⚠️ Unclear" label={`1. How good is the road? ${fmt(last.ours.Alarming + last.ours.Deteriorating)}% or ${fmt(last.eq3.Alarming + last.eq3.Deteriorating)}% alarming (${last.survey}), depending on the method`} />
        <StatBox value="✅ Yes, for ranking" label={`2. Is our strain right? Same order as the Trafikverket formula (r = ${data.q2.r}), values about ${higher}% higher`} />
        <StatBox value="✅ Clear list" label={`3. Where to repair first? Roads ${topRoads}; the worst 10% of the road carries ${fmt(data.q3.share_top10)}% of the damage`} />
      </Box>

      <Question n={1} title="How good is the road?" answer="⚠️ Depends on the method" tone="warning"><Q1 data={data} /></Question>
      <Question n={2} title="Is our strain calculation right?" answer="✅ Same ranking, higher values" tone="success"><Q2 data={data} /></Question>
      <Question n={3} title="Where should maintenance happen first?" answer="✅ Priority list" tone="success"><Q3 data={data} /></Question>
    </>
  );
}

export default StrainConditionTab;
