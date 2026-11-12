import { useState } from 'react';
import { Box, ButtonBase, Typography } from '@mui/material';

import Section from '../components/Section';
import { REGIONS, RegionContext } from '../services/region';
import SummaryTab from '../components/results/SummaryTab';
import ExploreTab from '../components/results/ExploreTab';
import TempCorrectionTab from '../components/results/TempCorrectionTab';
import RoadProfileTab from '../components/results/RoadProfileTab';
import SoilEffectTab from '../components/results/SoilEffectTab';
import StrainConditionTab from '../components/results/StrainConditionTab';
import NotesTab from '../components/results/NotesTab';

// The first entry opens by default.
// To add a view: build its JSON in make_results_data.py,
// create a component in components/results/, and add one entry here.
const VIEWS = [
  { id: 'cases', icon: '📋', label: 'Backcalculated cases', component: ExploreTab },
  { id: 'process', icon: '🧭', label: 'How the data was built', component: SummaryTab },
  { id: 'tempcorr', icon: '🌡️', label: 'Temperature correction', component: TempCorrectionTab },
  { id: 'roads', icon: '🛣️', label: 'Road profiles', component: RoadProfileTab },
  { id: 'soil', icon: '🪨', label: 'Road factors, soil & moisture', component: SoilEffectTab },
  { id: 'strain', icon: '🚧', label: 'Road condition', component: StrainConditionTab },
  { id: 'notes', icon: '📝', label: 'Notes', component: NotesTab },
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

/** Region choice: Östergötland / Västergötland. */
function RegionSwitch({ value, onChange }) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2, flexWrap: 'wrap' }}>
      <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 700 }}>Region</Typography>
      <Box sx={{ display: 'inline-flex', borderRadius: 2, border: 1, borderColor: 'primary.main', overflow: 'hidden' }}>
        {REGIONS.map((r) => {
          const active = r.id === value;
          return (
            <ButtonBase
              key={r.id}
              onClick={() => onChange(r.id)}
              sx={{
                px: 2.5, py: 0.9, fontWeight: 700, fontSize: '0.95rem',
                bgcolor: active ? 'primary.main' : 'transparent', color: active ? '#fff' : 'primary.main',
              }}
            >
              {r.name}
            </ButtonBase>
          );
        })}
      </Box>
    </Box>
  );
}

function ResultsPage({ onOpenInPredictor }) {
  const [viewId, setViewId] = useState(VIEWS[0].id);
  const [regionId, setRegionId] = useState(REGIONS[0].id);
  const region = REGIONS.find((r) => r.id === regionId);
  const Active = VIEWS.find((v) => v.id === viewId).component;

  return (
    <Section title="🧮 Backcalculation" intro={region.intro}>
      <RegionContext.Provider value={region}>
        <RegionSwitch value={regionId} onChange={setRegionId} />
        <ViewSwitch value={viewId} onChange={setViewId} />
        <Active key={region.id} onOpenInPredictor={onOpenInPredictor} />
      </RegionContext.Provider>
    </Section>
  );
}

export default ResultsPage;
