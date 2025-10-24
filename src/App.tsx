/**
 * Main Application Component
 * Purpose:
 * - Provides app-wide Discord SDK readiness context
 * - Configures routing via react-router (hash-based for safe embedding)
 */

import React from 'react';
import { createHashRouter, RouterProvider } from 'react-router';
import Home from './pages/Home';
import DiscordActivity from './pages/DiscordActivity';
import DiscordTest from './pages/DiscordTest';
import { DiscordReady } from './components/discord/DiscordReady';

/**
 * Create application router using hash strategy.
 * Using react-router's data router API per project rule (no react-router-dom).
 */
const router = createHashRouter([
  { path: '/', element: <Home /> },
  { path: '/activity', element: <DiscordActivity /> },
  { path: '/test', element: <DiscordTest /> },
]);

/**
 * App root component
 */
export default function App() {
  return (
    <DiscordReady>
      <RouterProvider router={router} />
    </DiscordReady>
  );
}
