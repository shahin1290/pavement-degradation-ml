import { Tabs, Tab } from '@mui/material';

// `pages` comes from App.jsx: [{ id, label, ... }]
function Navigation({ pages, activeId, onChange }) {
  return (
    <Tabs
      value={activeId}
      onChange={(_, id) => onChange(id)}
      variant="scrollable"
      scrollButtons="auto"
      sx={{ mb: 3, borderBottom: 1, borderColor: 'divider' }}
    >
      {pages.map((page) => (
        <Tab key={page.id} value={page.id} label={page.label} />
      ))}
    </Tabs>
  );
}

export default Navigation;
