/**
 * File: src/components/tournament/TournamentManager.tsx
 * Purpose: Enhanced tournament management with improved UI and betting system
 */

import React from 'react';
import type { Player } from '../../types';
import { TournamentDashboard } from './TournamentDashboard';

/**
 * TournamentManager: Main tournament component using the enhanced dashboard
 */
export function TournamentManager({
  players,
  setPlayers,
}: {
  players: Player[];
  setPlayers: (next: Player[] | ((p: Player[]) => Player[])) => void;
}) {
  return (
    <TournamentDashboard players={players} setPlayers={setPlayers} />
  );
}