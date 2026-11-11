import { useState } from 'react';
import { Box, ToggleButton, ToggleButtonGroup, Typography } from '@mui/material';
import { alpha } from '@mui/material/styles';

import { useResults, Loading, SimpleTable, fmt } from './common';
import RoadConditionTable from './RoadConditionTable';

// Road condition from the critical strains: how good is the road (grades with two methods)
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

function StrainConditionTab() {
  const { data, error } = useResults('strain_condition');
  if (!data) return <Loading error={error} />;
  return (
    <>
      <Typography color="text.secondary" sx={{ mb: 2 }}>
        When a truck wheel drives over the road, the bottom of the asphalt <b>stretches</b> a tiny bit (strain, in µε = millionths).
        More stretching means the asphalt cracks sooner. We calculated this strain for {fmt(data.bowls)} points from the layer stiffness
        (checked against ERAPave: same result within 0.34%) and graded the road with it.
      </Typography>

      <Question n={1} title="How good is the road?" answer="⚠️ Depends on the method" tone="warning"><Q1 data={data} /></Question>
      <Question n={2} title="Road condition table: filter and analyse" answer="🔎 Every point" tone="info"><RoadConditionTable /></Question>
    </>
  );
}

export default StrainConditionTab;
