import { useState } from 'react';
import { Container, CssBaseline, ThemeProvider } from '@mui/material';

import theme from './theme';
import Header from './components/Header';
import Navigation from './components/Navigation';
import PredictorPage from './pages/PredictorPage';
import VariablesPage from './pages/VariablesPage';
import ObjectivePage from './pages/ObjectivePage';
import WorkPackagesPage from './pages/WorkPackagesPage';
import ResultsPage from './pages/ResultsPage';

// To add a page: create it in src/pages/ and add one line here.
const PAGES = [
  { id: 'predictor', label: '🔮 Live Predictor', component: PredictorPage },
  { id: 'results', label: '📈 Results', component: ResultsPage },
  { id: 'variables', label: '📋 Variable Definitions', component: VariablesPage },
  { id: 'objective', label: '🎯 Objective & Key Picture', component: ObjectivePage },
  { id: 'wp', label: '🏗️ WP0–WP4', component: WorkPackagesPage },
];

function App() {
  const [activeId, setActiveId] = useState(PAGES[0].id);
  const [preset, setPreset] = useState(null); // case sent from Results to the predictor
  const ActivePage = PAGES.find((p) => p.id === activeId).component;

  const openInPredictor = (caseData) => {
    setPreset(caseData);
    setActiveId('predictor');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Container maxWidth="lg" sx={{ pb: 6 }}>
        <Header />
        <Navigation pages={PAGES} activeId={activeId} onChange={setActiveId} />
        <main>
          <ActivePage preset={preset} onOpenInPredictor={openInPredictor} />
        </main>
      </Container>
    </ThemeProvider>
  );
}

export default App;
