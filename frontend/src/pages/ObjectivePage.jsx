import { Fragment } from 'react';
import { Box, Divider, Paper, Typography } from '@mui/material';
import {
  Input, Calculate, CompareArrows, ModelTraining, Memory, Timeline, TrendingUp, CheckCircle,
} from '@mui/icons-material';

import Section from '../components/Section';
import { StageHeader, FlowArrow, FlowBox, FlowColumn } from '../components/Flow';
import { OBJECTIVE, STAGES, OVERALL_LOGIC } from '../data/projectFlow';

// Icon names used in data/projectFlow.js
const ICONS = {
  input: <Input />, calculate: <Calculate />, compare: <CompareArrows />, model: <ModelTraining />,
  memory: <Memory />, timeline: <Timeline />, trend: <TrendingUp />, check: <CheckCircle />,
};

function Step({ step }) {
  return (
    <FlowBox icon={ICONS[step.icon]} title={step.title} text={step.text} highlight={step.highlight} tone={step.tone}>
      {step.items && (
        <Box sx={{ display: 'grid', gap: 1, gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' } }}>
          {step.items.map((item) => (
            <Typography key={item} variant="body2" sx={{ p: 1, borderRadius: 1, bgcolor: '#eef5fb', color: '#455a64' }}>
              {item}
            </Typography>
          ))}
        </Box>
      )}
    </FlowBox>
  );
}

function ObjectivePage() {
  return (
    <>
      <Section>
        <Typography variant="overline" color="primary" sx={{ fontWeight: 700, letterSpacing: 1.2 }}>
          Project objective
        </Typography>
        <Typography variant="h5" sx={{ mt: 0.5, mb: 1.5 }}>
          {OBJECTIVE.title}
        </Typography>
        <Typography sx={{ color: '#455a64', lineHeight: 1.7 }}>{OBJECTIVE.text}</Typography>
      </Section>

      <Section
        title="Complete Project Flow"
        intro="From measured pavement response to machine learning, Digital Twin updating and future structural prediction."
      >
        {STAGES.map((stage, s) => (
          <Fragment key={stage.title}>
            {s > 0 && <Divider sx={{ my: 4 }} />}
            <StageHeader number={s + 1} title={stage.title} subtitle={stage.subtitle} />
            <FlowColumn maxWidth={stage.maxWidth}>
              {stage.steps.map((step, i) => (
                <Fragment key={i}>
                  {i > 0 && <FlowArrow label={step.arrow} />}
                  {step.row ? (
                    <Box sx={{ width: '100%', display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' } }}>
                      {step.row.map((box) => <Step key={box.title} step={box} />)}
                    </Box>
                  ) : (
                    <Step step={step} />
                  )}
                </Fragment>
              ))}
            </FlowColumn>
          </Fragment>
        ))}

        <Paper variant="outlined" sx={{ mt: 4, p: 2.5, bgcolor: '#f5f7fa' }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 1 }}>
            Overall logic
          </Typography>
          <Typography variant="body2" sx={{ color: '#455a64', lineHeight: 1.8, textAlign: 'center', fontWeight: 600 }}>
            {OVERALL_LOGIC.join(' → ')}
          </Typography>
        </Paper>
      </Section>
    </>
  );
}

export default ObjectivePage;
