import { Box, Card, CardContent, Typography } from '@mui/material';

// Building blocks for flow diagrams (Objective page, Work packages page).

export function StageHeader({ number, title, subtitle }) {
  return (
    <Box sx={{ mb: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2, mb: 0.5 }}>
        <Box
          sx={{
            width: 34, height: 34, borderRadius: '50%', flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 700, fontSize: '0.9rem', bgcolor: 'primary.main', color: '#fff',
          }}
        >
          {number}
        </Box>
        <Typography variant="h6">{title}</Typography>
      </Box>
      {subtitle && (
        <Typography variant="body2" color="text.secondary" sx={{ ml: 5.5 }}>
          {subtitle}
        </Typography>
      )}
    </Box>
  );
}

export function FlowArrow({ label }) {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 0.5 }}>
      {label && (
        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textAlign: 'center' }}>
          {label}
        </Typography>
      )}
      <Typography sx={{ color: '#90a4ae', lineHeight: 1, fontSize: 22 }}>↓</Typography>
    </Box>
  );
}

// Colour presets so boxes stay consistent
const TONES = {
  blue:   { bg: '#f5faff', border: '#d8e1e8', accent: '#1976d2' },
  orange: { bg: '#fffaf2', border: '#ead8b4', accent: '#8d6e00' },
  green:  { bg: '#f3faf5', border: '#c8dfcf', accent: '#2e7d32' },
  purple: { bg: '#faf7ff', border: '#ddd2ec', accent: '#6a1b9a' },
  teal:   { bg: '#f3f9f8', border: '#c8dfdb', accent: '#00796b' },
};

export function FlowBox({ icon, title, text, highlight, tone = 'blue', children }) {
  const t = TONES[tone] || TONES.blue;
  return (
    <Card elevation={0} sx={{ width: '100%', border: `1px solid ${t.border}`, bgcolor: t.bg }}>
      <CardContent sx={{ p: 2.2, '&:last-child': { pb: 2.2 } }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1, color: t.accent }}>
          {icon}
          <Typography variant="subtitle1" sx={{ fontWeight: 700, color: 'text.primary' }}>
            {title}
          </Typography>
        </Box>
        {text && (
          <Typography variant="body2" sx={{ color: '#455a64', lineHeight: 1.6 }}>
            {text}
          </Typography>
        )}
        {children}
        {highlight && (
          <Typography variant="body2" sx={{ mt: 1, fontWeight: 700, color: t.accent, textAlign: 'center' }}>
            {highlight}
          </Typography>
        )}
      </CardContent>
    </Card>
  );
}

// Vertical column that centres flow boxes and arrows
export function FlowColumn({ children, maxWidth = 760 }) {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', maxWidth, mx: 'auto' }}>
      {children}
    </Box>
  );
}
