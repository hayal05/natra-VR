// Check-page entry: the REAL Home screen (and everything under it — RoleShell,
// EntityCard, ResponsiveGrid, HorizontalScroller, FilterBar, SearchBar, hooks,
// CSS Modules, global.css) with only the router and API client stubbed.
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import Home from '../../src/pages/Home';
import '../../src/styles/global.css';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Home />
  </StrictMode>
);
