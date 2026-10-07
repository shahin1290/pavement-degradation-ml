import { useState } from 'react';
import { Tab, Tabs } from '@mui/material';

import Section from '../components/Section';
import SummaryTab from '../components/results/SummaryTab';
import ExploreTab from '../components/results/ExploreTab';

// To add an experiment: build its JSON in make_results_data.py,
// create a tab component in components/results/, and add one line here.
const TABS = [
  { id: 'summary', label: 'Summary', component: SummaryTab },
  { id: 'explore', label: 'Explore the data', component: ExploreTab },
];

function ResultsPage({ onOpenInPredictor }) {
  const [tab, setTab] = useState(TABS[0].id);
  const Active = TABS.find((t) => t.id === tab).component;

  return (
    <Section title="📈 Backcalculation Results" intro="The data the ML model is trained on, and the experiments behind the main choices.">
      <Tabs value={tab} onChange={(_, v) => setTab(v)} variant="scrollable" sx={{ mb: 3, borderBottom: 1, borderColor: 'divider' }}>
        {TABS.map((t) => <Tab key={t.id} value={t.id} label={t.label} />)}
      </Tabs>
      <Active onOpenInPredictor={onOpenInPredictor} />
    </Section>
  );
}

export default ResultsPage;
