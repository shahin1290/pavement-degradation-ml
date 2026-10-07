import { Paper, Typography } from '@mui/material';

// White card with an optional title and intro text. Used by every page.
function Section({ title, intro, children, sx }) {
  return (
    <Paper variant="outlined" sx={{ p: { xs: 2, md: 3 }, mb: 3, ...sx }}>
      {title && (
        <Typography variant="h5" gutterBottom>
          {title}
        </Typography>
      )}
      {intro && (
        <Typography color="text.secondary" sx={{ mb: 2 }}>
          {intro}
        </Typography>
      )}
      {children}
    </Paper>
  );
}

export default Section;
