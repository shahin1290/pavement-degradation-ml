import { Box, Typography } from '@mui/material';

function Header() {
  return (
    <Box component="header" sx={{ py: 3, textAlign: 'center' }}>
      <Typography variant="h4" component="h1">
        Trafikverket Structural Pavement AI Dashboard
      </Typography>
      <Typography color="text.secondary">
        Machine learning for pavement layer moduli from TSD measurements
      </Typography>
    </Box>
  );
}

export default Header;
