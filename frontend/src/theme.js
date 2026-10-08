import { createTheme } from '@mui/material/styles';

// One place for colours and fonts used across the dashboard
const theme = createTheme({
  palette: {
    primary: { main: '#1f5f8b' },        // steel blue
    secondary: { main: '#0f8b7d' },      // teal
    success: { main: '#2e7d4f' },
    warning: { main: '#d9822b' },
    error: { main: '#c0392b' },
    text: { primary: '#1b2b3a', secondary: '#5b6b7b' },
    background: { default: '#f3f5f8', paper: '#ffffff' },
    divider: '#e3e8ee',
  },
  shape: { borderRadius: 10 },
  typography: {
    fontFamily: '"Inter", "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    h4: { fontWeight: 800, letterSpacing: '-0.02em' },
    h5: { fontWeight: 800, letterSpacing: '-0.01em' },
    h6: { fontWeight: 700 },
    subtitle2: { fontWeight: 700 },
    button: { textTransform: 'none', fontWeight: 600 },
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        outlined: { borderColor: '#e3e8ee', boxShadow: '0 1px 3px rgba(16, 40, 64, 0.06)' },
      },
    },
    MuiTab: { styleOverrides: { root: { textTransform: 'none', fontWeight: 600, fontSize: '0.95rem' } } },
    MuiToggleButton: { styleOverrides: { root: { textTransform: 'none', fontWeight: 600, padding: '4px 12px' } } },
    MuiChip: { styleOverrides: { root: { fontWeight: 600 } } },
    MuiTableCell: {
      styleOverrides: {
        head: {
          backgroundColor: '#f6f8fb',
          color: '#5b6b7b',
          fontWeight: 700,
          fontSize: '0.78rem',
          borderBottom: '2px solid #e3e8ee',
        },
        root: { borderColor: '#eef1f5' },
      },
    },
  },
});

export default theme;
