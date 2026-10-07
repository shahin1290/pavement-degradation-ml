import { Alert, Box, Paper, Typography } from '@mui/material';

import Section from '../components/Section';
import { WORK_PACKAGES, AI_ROLE } from '../data/workPackages';

function WorkPackagesPage() {
  return (
    <Section
      title="🏗️ Work Packages WP0–WP4"
      intro="The project moves from NDT data collection to machine learning, Digital Twin development,
        validation and maintenance decision-making."
    >
      {WORK_PACKAGES.map((wp) => (
        <Paper key={wp.id} variant="outlined" sx={{ p: 2, mb: 1.5, display: 'flex', gap: 2 }}>
          <Box
            sx={{
              minWidth: 56, height: 56, borderRadius: 2, bgcolor: 'primary.main', color: '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800,
            }}
          >
            {wp.id}
          </Box>
          <Box>
            <Typography variant="h6">{wp.title}</Typography>
            <Typography variant="body2" color="text.secondary">
              {wp.text}
            </Typography>
          </Box>
        </Paper>
      ))}

      <Typography variant="h6" sx={{ mt: 3, mb: 1 }}>
        Overall workflow
      </Typography>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 1, mb: 3 }}>
        {WORK_PACKAGES.map((wp, i) => (
          <Box key={wp.id} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Paper variant="outlined" sx={{ px: 2, py: 1, textAlign: 'center' }}>
              <Typography sx={{ fontWeight: 700 }}>{wp.id}</Typography>
              <Typography variant="caption" color="text.secondary">
                {wp.short}
              </Typography>
            </Paper>
            {i < WORK_PACKAGES.length - 1 && <Typography color="text.secondary">→</Typography>}
          </Box>
        ))}
      </Box>

      <Alert severity="info">
        <strong>Where the AI backcalculation fits:</strong> {AI_ROLE}
      </Alert>
    </Section>
  );
}

export default WorkPackagesPage;
