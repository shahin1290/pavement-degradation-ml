import { useState } from 'react';
import { Box, ButtonBase, Typography } from '@mui/material';
import { alpha } from '@mui/material/styles';

import Section from '../components/Section';
import SummaryTab from '../components/results/SummaryTab';
import ExploreTab from '../components/results/ExploreTab';

// To add a view: build its JSON in make_results_data.py,
// create a component in components/results/, and add one entry here.
const VIEWS = [
  {
    id: 'process',
    icon: '🧭',
    label: 'How the training data was built',
    caption: 'From 28,188 backcalculated cases to 23,642 training cases',
    component: SummaryTab,
  },
  {
    id: 'cases',
    icon: '🔎',
    label: 'All backcalculated cases',
    caption: 'Browse, filter and predict any of the 28,188 cases',
    component: ExploreTab,
  },
];

/** Large clickable card used to switch between the two views. */
function ViewCard({ view, active, onClick }) {
  return (
    <ButtonBase
      onClick={onClick}
      sx={{
        flex: '1 1 260px',
        justifyContent: 'flex-start',
        textAlign: 'left',
        gap: 1.5,
        p: 2,
        borderRadius: 3,
        border: 2,
        borderColor: active ? 'primary.main' : 'divider',
        bgcolor: (t) => (active ? alpha(t.palette.primary.main, 0.07) : t.palette.background.paper),
        boxShadow: active ? '0 4px 14px rgba(31, 95, 139, 0.15)' : 'none',
        transition: 'all 0.2s',
        '&:hover': { borderColor: 'primary.main', transform: 'translateY(-1px)' },
      }}
    >
      <Box
        sx={{
          width: 48, height: 48, borderRadius: 2, flexShrink: 0, fontSize: '1.6rem',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          bgcolor: (t) => alpha(t.palette.primary.main, active ? 0.15 : 0.07),
        }}
      >
        {view.icon}
      </Box>
      <Box>
        <Typography sx={{ fontWeight: 800, color: active ? 'primary.main' : 'text.primary' }}>{view.label}</Typography>
        <Typography variant="body2" color="text.secondary">{view.caption}</Typography>
      </Box>
    </ButtonBase>
  );
}

function ResultsPage({ onOpenInPredictor }) {
  const [viewId, setViewId] = useState(VIEWS[0].id);
  const Active = VIEWS.find((v) => v.id === viewId).component;

  return (
    <Section
      title="📈 Backcalculation Results"
      intro="Östergötland TSD data only (4 surveys, Aug 2022 – Sep 2024). This is the data the ML model is trained on."
    >
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 4 }}>
        {VIEWS.map((v) => (
          <ViewCard key={v.id} view={v} active={v.id === viewId} onClick={() => setViewId(v.id)} />
        ))}
      </Box>
      <Active onOpenInPredictor={onOpenInPredictor} />
    </Section>
  );
}

export default ResultsPage;
