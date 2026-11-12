import { Box, Paper, Table, TableBody, TableCell, TableHead, TableRow, Typography } from '@mui/material';
import { alpha } from '@mui/material/styles';

// "Notes" tab: short notes for the discussion with the supervisor.
// Note 1: why Västergötland gives fewer clean backcalculation results. Note 2: why rain is not in the regression.
// Note 3: planned later (maintenance priority).
// Numbers: backcalc_vg_full.csv and backcalc_rows0-7050_full.csv
// (clean = fit within 5 % and no modulus at a limit; total = asphalt + base + subbase).
const ROWS = [
  { label: 'Clean result (fit ≤ 5%, no modulus at a limit)', og: '70%', vg: '35%', bad: true },
  { label: 'Usable fit (≤ 5%)', og: '92%', vg: '81%' },
  { label: 'Asphalt thickness (median)', og: '130 mm', vg: '109 mm' },
  { label: 'Subbase thickness (median)', og: '787 mm', vg: '510 mm' },
  { label: 'Total pavement (median)', og: '1,230 mm', vg: '880 mm', bad: true },
  { label: 'Bowls on roads thinner than 800 mm', og: '3%', vg: '39%', bad: true },
];

const BY_THICKNESS = [
  { total: '< 800 mm', vg: 15, share: 39 },
  { total: '800–1000 mm', vg: 32, share: 22 },
  { total: '> 1000 mm', vg: 58, share: 39 },
];

function VasterNote() {
  return (
    <Paper
      variant="outlined"
      sx={{ p: 2.5, mb: 3, borderLeft: 5, borderColor: 'warning.main', bgcolor: (t) => alpha(t.palette.warning.main, 0.05) }}
    >
      <Typography variant="h6" sx={{ mb: 0.5 }}>Why Västergötland gives fewer good backcalculation results</Typography>
      <Typography variant="body2" sx={{ mb: 2 }}>
        Same method, limits and settings as Östergötland, but only half as many bowls give a clean result.
        The reason is the road structure: <b>Västergötland's roads are much thinner</b>.
      </Typography>

      <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', md: '3fr 2fr' } }}>
        <Box sx={{ overflowX: 'auto' }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell />
                <TableCell align="right">Östergötland</TableCell>
                <TableCell align="right">Västergötland</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {ROWS.map((r) => (
                <TableRow key={r.label}>
                  <TableCell>{r.label}</TableCell>
                  <TableCell align="right">{r.og}</TableCell>
                  <TableCell align="right" sx={r.bad ? { fontWeight: 800, color: 'warning.dark' } : undefined}>{r.vg}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Box>

        <Box>
          <Typography variant="body2" sx={{ fontWeight: 700, mb: 1 }}>Västergötland: clean results by total pavement thickness</Typography>
          {BY_THICKNESS.map((r) => (
            <Box key={r.total} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.75 }}>
              <Typography variant="body2" sx={{ width: 96, flexShrink: 0 }}>{r.total}</Typography>
              <Box sx={{ flex: 1, height: 16, bgcolor: 'divider', borderRadius: 1, overflow: 'hidden' }}>
                <Box sx={{ width: `${r.vg}%`, height: '100%', bgcolor: r.vg < 40 ? 'warning.main' : 'success.main' }} />
              </Box>
              <Typography variant="body2" sx={{ width: 40, textAlign: 'right', fontWeight: 700 }}>{r.vg}%</Typography>
            </Box>
          ))}
          <Typography variant="caption" color="text.secondary">
            Shares of the bowls: {BY_THICKNESS.map((r) => `${r.total} ${r.share}%`).join(', ')}.
          </Typography>
        </Box>
      </Box>

      <Typography variant="body2" sx={{ mt: 2 }}>
        <b>Why thin roads fail:</b> thin layers hardly change the shape of the deflection bowl, so the bowl cannot tell the layers
        apart. The solver then trades stiffness between them: E1 goes up to the 10,000 MPa limit and E3 down to 50 MPa.
        The bowl still fits, but those values are not real. Wrong or missing layer thicknesses in the database would have the same effect.
      </Typography>
      <Typography variant="body2" sx={{ mt: 1 }}>
        <b>What can be trusted:</b> E2 and especially E4 (subgrade) everywhere; E1 and E3 mainly on roads thicker than about 1 m.
      </Typography>
    </Paper>
  );
}

function PlannedNote() {
  return (
    <Paper
      variant="outlined"
      sx={{ p: 2.5, mb: 3, borderLeft: 5, borderColor: 'info.main', bgcolor: (t) => alpha(t.palette.info.main, 0.05) }}
    >
      <Typography variant="h6" sx={{ mb: 0.5 }}>Planned for a later iteration: where should maintenance happen first?</Typography>
      <Typography variant="body2">
        Idea: rank 500 m road stretches by expected damage, using the strains from the layer stiffness and the heavy traffic:
        {' '}<b>damage index = heavy vehicles per day × (strain ÷ typical strain)⁴</b> (power 4 as in Saliko &amp; Erlingsson 2021),
        for cracking (asphalt strain) and rutting (subgrade strain).
      </Typography>
    </Paper>
  );
}

function RainNote() {
  const rows = [
    { region: 'Östergötland', s1: '9–15', s2: '48–56', s3: '14–19', s4: '8–14' },
    { region: 'Västergötland', s1: '2–7', s2: '63–73', s3: '14–19', s4: '36–43' },
  ];
  return (
    <Paper
      variant="outlined"
      sx={{ p: 2.5, mb: 3, borderLeft: 5, borderColor: 'info.main', bgcolor: (t) => alpha(t.palette.info.main, 0.05) }}
    >
      <Typography variant="h6" sx={{ mb: 0.5 }}>Why rain is not in the regression</Typography>
      <Typography variant="body2" sx={{ mb: 1.5 }}>
        The rain column (<code>PCIP_14_DAYS</code>, rain in the 14 days before the survey) is almost the same for every location
        on a survey day. Within a survey it differs by only a few mm; between surveys by up to 60 mm:
      </Typography>
      <Box sx={{ overflowX: 'auto', mb: 1.5 }}>
        <Table size="small" sx={{ maxWidth: 560 }}>
          <TableHead>
            <TableRow>
              <TableCell>Rain (mm)</TableCell>
              <TableCell align="right">Survey 1</TableCell>
              <TableCell align="right">Survey 2</TableCell>
              <TableCell align="right">Survey 3</TableCell>
              <TableCell align="right">Survey 4</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((r) => (
              <TableRow key={r.region}>
                <TableCell>{r.region}</TableCell>
                <TableCell align="right">{r.s1}</TableCell>
                <TableCell align="right">{r.s2}</TableCell>
                <TableCell align="right">{r.s3}</TableCell>
                <TableCell align="right">{r.s4}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Box>
      <Box component="ul" sx={{ mt: 0, mb: 1, pl: 3, '& li': { mb: 0.5 } }}>
        <li><Typography variant="body2">
          So in practice there are only <b>4 rain values per region</b>, one per survey day. Rain cannot be separated from
          everything else that differs between survey days (season, groundwater level of that year, the measurement itself).
        </Typography></li>
      </Box>
    </Paper>
  );
}

function NotesTab() {
  return (
    <>
      <VasterNote />
      <RainNote />
      <PlannedNote />
    </>
  );
}

export default NotesTab;
