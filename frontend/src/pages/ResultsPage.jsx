import { useState } from 'react';
import { Box, ButtonBase, Typography } from '@mui/material';

import Section from '../components/Section';
import SummaryTab from '../components/results/SummaryTab';
import ExploreTab from '../components/results/ExploreTab';
import LimitsCompareTab from '../components/results/LimitsCompareTab';
import TempCorrectionTab from '../components/results/TempCorrectionTab';

// The first entry opens by default.
// To add a view: build its JSON in make_results_data.py,
// create a component in components/results/, and add one entry here.
const VIEWS = [
  { id: 'cases', icon: '📋', label: 'Backcalculated cases', component: ExploreTab },
  { id: 'process', icon: '🧭', label: 'How the data was built', component: SummaryTab },
  { id: 'limits', icon: '⚖️', label: 'Compare limits', component: LimitsCompareTab },
  { id: 'tempcorr', icon: '🌡️', label: 'Temperature correction', component: TempCorrectionTab },
];

/** Compact segmented switch: one pill per view, the active one filled. */
function ViewSwitch({ value, onChange }) {
  return (
    <Box
      sx={{
        display: 'inline-flex', p: 0.5, gap: 0.5, mb: 3, borderRadius: 999,
        bgcolor: 'background.default', border: 1, borderColor: 'divider', maxWidth: '100%', flexWrap: 'wrap',
      }}
    >
      {VIEWS.map((v) => {
        const active = v.id === value;
        return (
          <ButtonBase
            key={v.id}
            onClick={() => onChange(v.id)}
            sx={{
              px: 2.25, py: 1, borderRadius: 999, gap: 1,
              bgcolor: active ? 'primary.main' : 'transparent',
              color: active ? '#fff' : 'text.secondary',
              boxShadow: active ? '0 2px 6px rgba(31, 95, 139, 0.25)' : 'none',
              transition: 'all 0.15s',
              '&:hover': { color: active ? '#fff' : 'primary.main' },
            }}
          >
            <span aria-hidden>{v.icon}</span>
            <Typography component="span" sx={{ fontWeight: 700, fontSize: '0.95rem' }}>{v.label}</Typography>
          </ButtonBase>
        );
      })}
    </Box>
  );
}

function ResultsPage({ onOpenInPredictor }) {
  const [viewId, setViewId] = useState(VIEWS[0].id);
  const Active = VIEWS.find((v) => v.id === viewId).component;

  return (
    <Section
      title="🧮 Backcalculation"
      intro="Östergötland TSD data only (4 surveys, Aug 2022 – Sep 2024). This is the data the ML model is trained on."
    >
      <ViewSwitch value={viewId} onChange={setViewId} />
      <Active onOpenInPredictor={onOpenInPredictor} />
    </Section>
  );
}

export default ResultsPage;
