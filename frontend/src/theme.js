import { createTheme } from '@mui/material/styles';

// One place for colours and fonts used across the dashboard
const theme = createTheme({
  palette: {
    primary: { main: '#1976d2' },
    text: { primary: '#17324d', secondary: '#607080' },
    background: { default: '#f4f7fa' },
  },
  shape: { borderRadius: 8 },
  typography: {
    h4: { fontWeight: 800 },
    h5: { fontWeight: 800 },
    h6: { fontWeight: 700 },
  },
});

export default theme;
