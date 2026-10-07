import { Alert, Box, Chip, Table, TableBody, TableCell, TableHead, TableRow, Typography } from '@mui/material';

import Section from '../components/Section';
import { VARIABLE_GROUPS, ROLES, BACKCALC_SETTINGS } from '../data/variables';

function VariablesPage() {
  return (
    <Section
      title="📋 Variable Definitions"
      intro="Variables in the TSD data files and their role in the backcalculation and the ML model."
    >
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
        {Object.values(ROLES).map((r) => (
          <Chip key={r.label} label={r.label} color={r.color} size="small" />
        ))}
      </Box>

      <Alert severity="info" sx={{ mb: 3 }}>
        <strong>Backcalculation settings:</strong> {BACKCALC_SETTINGS}
      </Alert>

      {VARIABLE_GROUPS.map((group) => (
        <Box key={group.title} sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            {group.title}
          </Typography>
          <Box sx={{ overflowX: 'auto' }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ width: '35%' }}>Variable</TableCell>
                  <TableCell>Meaning</TableCell>
                  <TableCell sx={{ width: 170 }}>Role</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {group.items.map((item) => {
                  const role = ROLES[item.role];
                  return (
                    <TableRow key={item.code}>
                      <TableCell>
                        <code>{item.code}</code>
                      </TableCell>
                      <TableCell>{item.text}</TableCell>
                      <TableCell>
                        {role && <Chip label={role.label} color={role.color} size="small" />}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </Box>
        </Box>
      ))}
    </Section>
  );
}

export default VariablesPage;
