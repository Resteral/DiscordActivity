/**
 * File: src/components/tournament/TournamentDashboard.tsx
 * Purpose: Enhanced tournament management with improved UI, player pool selection, real draft modes, and betting interface.
 */

import React, { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import type { Player, Owner, Bet, DraftMode } from '../../types';
import { SnakeDraft } from './modes/SnakeDraft';
import { AuctionDraft } from './modes/AuctionDraft';

interface TournamentDashboardProps {
  /** Global players available in the app */
  players: Player[];
  /** Setter to update global players (e.g., after wallet changes) */
  setPlayers: (players: Player[] | ((prev: Player[]) => Player[])) => void;
}

/**
 * TournamentDashboard
 * - Setup: configure draft mode, team count, and select a Player Pool.
 * - Draft: run Snake or Auction draft using the selected pool (owners excluded).
 * - Bracket: placeholder for bracket visualization.
 * - Betting: tournament betting demo.
 */
export function TournamentDashboard({ players, setPlayers }: TournamentDashboardProps) {
  const [activeTab, setActiveTab] = useState<'setup' | 'draft' | 'bracket' | 'betting'>('setup');
  const [draftMode, setDraftMode] = useState<DraftMode>('snake');
  const [teamCount, setTeamCount] = useState(4);
  const [owners, setOwners] = useState<Owner[]>([]);
  const [bets, setBets] = useState<Bet[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<string>('');
  const [betAmount, setBetAmount] = useState(50);

  // Player pool state: which players are eligible to be drafted (owners will be excluded automatically)
  const [selectedPoolIds, setSelectedPoolIds] = useState<string[]>([]);

  // Initialize the pool to "all players" on first load or when players list appears
  useEffect(() => {
    if (players.length && selectedPoolIds.length === 0) {
      setSelectedPoolIds(players.map(p => p.id));
    }
  }, [players, selectedPoolIds.length]);

  /** Toggle a single player in/out of the pool */
  function togglePool(id: string) {
    setSelectedPoolIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  }

  /** Select all players into the pool */
  function selectAllPool() {
    setSelectedPoolIds(players.map(p => p.id));
  }

  /** Clear the pool selection */
  function clearPool() {
    setSelectedPoolIds([]);
  }

  /** Draftable pool = selected players minus owners (owners are captains) */
  const poolPlayers = useMemo(
    () =>
      players.filter(
        p => selectedPoolIds.includes(p.id) && !owners.some(o => o.id === p.id)
      ),
    [players, selectedPoolIds, owners]
  );

  /** Total picks required given roster size (handled inside draft modes), informatively check sufficiency if needed */
  const canCreateTeams = useMemo(() => poolPlayers.length >= teamCount, [poolPlayers.length, teamCount]);

  // Calculate total betting pool (tournament betting demo)
  const totalPool = useMemo(() => bets.reduce((sum, bet) => sum + bet.amount, 0), [bets]);

  // Calculate team betting odds (proportional to money placed)
  const teamOdds = useMemo(() => {
    const teamBets = bets.reduce((acc, bet) => {
      acc[bet.teamName] = (acc[bet.teamName] || 0) + bet.amount;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(teamBets).map(([team, amount]) => ({
      team,
      amount,
      odds: totalPool > 0 ? (amount / totalPool * 100).toFixed(1) : '0.0',
    }));
  }, [bets, totalPool]);

  /**
   * Create teamCount owners (captains) randomly from the pool.
   * Owners are excluded from poolPlayers by definition.
   */
  function createRandomOwners() {
    if (!canCreateTeams) return;
    const candidates = [...poolPlayers];
    candidates.sort(() => Math.random() - 0.5);
    const chosen = candidates.slice(0, teamCount);

    setOwners(
      chosen.map((player, index) => ({
        id: player.id,
        name: player.name,
        wallet: player.wallet,
        teamName: `Team ${index + 1}`,
        playerIds: [],
        budget: 200,
      }))
    );
    setActiveTab('draft');
  }

  /**
   * Apply drafted assignments returned by a draft mode to owners.
   * assignments: map of teamName -> array of playerIds
   */
  function applyDraftResults(assignments: { [teamName: string]: string[] }) {
    setOwners(prev =>
      prev.map(o => ({
        ...o,
        playerIds: assignments[o.teamName] ?? o.playerIds,
      }))
    );
  }

  /** Betting: place a bet from a placeholder connected id (demo) */
  function placeBet(teamName: string, amount: number) {
    const connectedPlayer = players.find(p => p.id === 'connected'); // TODO: wire real connectedId via props
    if (!connectedPlayer || connectedPlayer.wallet < amount) return;

    setPlayers(prev => prev.map(p => (p.id === 'connected' ? { ...p, wallet: p.wallet - amount } : p)));
    setBets(prev => [...prev, { bettorId: 'connected', teamName, amount }]);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-100">Tournament Manager</h2>
          <p className="text-slate-400">Configure player pool, draft teams, and run a tournament</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="bg-emerald-500/20 text-emerald-300">{owners.length} Teams</Badge>
          <Badge variant="secondary" className="bg-blue-500/20 text-blue-300">${totalPool} Pool</Badge>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="setup">Tournament Setup</TabsTrigger>
          <TabsTrigger value="draft" disabled={owners.length === 0}>Draft</TabsTrigger>
          <TabsTrigger value="bracket" disabled={owners.length === 0}>Bracket</TabsTrigger>
          <TabsTrigger value="betting">Betting Market</TabsTrigger>
        </TabsList>

        {/* Setup */}
        <TabsContent value="setup" className="space-y-6">
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Configuration */}
            <Card className="bg-slate-900/70 border-slate-700">
              <CardHeader>
                <CardTitle className="text-slate-100">Tournament Configuration</CardTitle>
                <CardDescription className="text-slate-400">Set the format and number of teams</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-slate-300">Draft Mode</Label>
                  <Select value={draftMode} onValueChange={(v: DraftMode) => setDraftMode(v)}>
                    <SelectTrigger className="bg-slate-800 border-slate-600 text-slate-100">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="snake">Snake Draft</SelectItem>
                      <SelectItem value="auction">Auction Draft</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-slate-300">Number of Teams</Label>
                  <Input
                    type="number"
                    min={2}
                    max={8}
                    value={teamCount}
                    onChange={(e) => setTeamCount(parseInt(e.target.value || '4', 10))}
                    className="bg-slate-800 border-slate-600 text-slate-100"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-slate-300">Buy-in (demo)</Label>
                  <Input type="number" min={0} value={200} disabled className="bg-slate-800 border-slate-600 text-slate-100" />
                </div>

                <div className="rounded-md border border-slate-700 p-3 text-sm text-slate-300 bg-slate-800/40">
                  <div className="flex items-center justify-between">
                    <span>Selected pool: <b className="text-cyan-300">{selectedPoolIds.length}</b> players</span>
                    <span>Teams to create: <b className="text-cyan-300">{teamCount}</b></span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Player Pool Selection */}
            <Card className="bg-slate-900/70 border-slate-700">
              <CardHeader>
                <CardTitle className="text-slate-100">Player Pool</CardTitle>
                <CardDescription className="text-slate-400">
                  Choose who can be drafted (owners are excluded automatically)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex gap-2">
                  <Button variant="outline" className="bg-transparent border-slate-600 text-slate-300" onClick={selectAllPool}>
                    Select All
                  </Button>
                  <Button variant="outline" className="bg-transparent border-slate-600 text-slate-300" onClick={clearPool}>
                    Clear
                  </Button>
                </div>
                <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                  {players.map((player) => {
                    const checked = selectedPoolIds.includes(player.id);
                    return (
                      <label
                        key={player.id}
                        className="flex items-center justify-between gap-3 p-2 rounded-lg bg-slate-800/50 border border-slate-700"
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            className="h-4 w-4 accent-cyan-500"
                            checked={checked}
                            onChange={() => togglePool(player.id)}
                          />
                          <div>
                            <div className="text-slate-100 font-medium">{player.name}</div>
                            <div className="text-slate-400 text-sm">Elo: {player.elo} • Wallet: ${player.wallet}</div>
                          </div>
                        </div>
                        <Badge variant="outline" className="bg-transparent">
                          {checked ? 'In Pool' : 'Excluded'}
                        </Badge>
                      </label>
                    );
                  })}
                  {players.length === 0 && (
                    <div className="text-sm text-slate-500 py-6 text-center">No players available</div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="flex flex-wrap gap-4">
            <Button
              onClick={createRandomOwners}
              disabled={!canCreateTeams}
              className="bg-cyan-600 hover:bg-cyan-500 text-white disabled:opacity-50"
              title={!canCreateTeams ? 'Select enough players for the pool first' : 'Create teams from selected pool'}
            >
              Create Random Teams
            </Button>
            <Button variant="outline" className="bg-transparent border-slate-600 text-slate-300" disabled>
              Manual Team Selection (soon)
            </Button>
          </div>
        </TabsContent>

        {/* Draft */}
        <TabsContent value="draft" className="space-y-6">
          <Card className="bg-slate-900/70 border-slate-700">
            <CardHeader>
              <CardTitle className="text-slate-100">
                {draftMode === 'snake' ? 'Snake Draft' : 'Auction Draft'}
              </CardTitle>
              <CardDescription className="text-slate-400">
                {draftMode === 'snake'
                  ? 'Teams pick players in serpentine order'
                  : 'Owners bid on players using their budgets'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Draft Mode Component */}
              <div className="rounded-lg border border-slate-700 p-3 bg-slate-800/40">
                {draftMode === 'snake' ? (
                  <SnakeDraft owners={owners} players={poolPlayers} onComplete={applyDraftResults} />
                ) : (
                  <AuctionDraft owners={owners} players={poolPlayers} onComplete={applyDraftResults} />
                )}
              </div>

              {/* Current Teams */}
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                {owners.map((owner) => (
                  <Card key={owner.id} className="bg-slate-800/50 border-slate-600">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-slate-100 text-lg">{owner.teamName}</CardTitle>
                      <CardDescription className="text-slate-400">
                        {owner.name} • ${owner.wallet}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {owner.playerIds.length === 0 ? (
                          <div className="text-slate-500 text-sm">No players drafted yet</div>
                        ) : (
                          owner.playerIds.map((playerId) => {
                            const player = players.find(p => p.id === playerId);
                            return player ? (
                              <div key={playerId} className="text-slate-300 text-sm">
                                {player.name} ({player.elo})
                              </div>
                            ) : null;
                          })
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Betting */}
        <TabsContent value="betting" className="space-y-6">
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Betting Market */}
            <Card className="lg:col-span-2 bg-slate-900/70 border-slate-700">
              <CardHeader>
                <CardTitle className="text-slate-100">Tournament Betting</CardTitle>
                <CardDescription className="text-slate-400">Place bets on tournament outcomes</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-slate-300">Select Team to Bet On</Label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {owners.map((owner) => (
                      <Button
                        key={owner.teamName}
                        variant={selectedTeam === owner.teamName ? 'default' : 'outline'}
                        className={`bg-transparent ${
                          selectedTeam === owner.teamName ? 'bg-cyan-600 text-white' : 'border-slate-600 text-slate-300'
                        }`}
                        onClick={() => setSelectedTeam(owner.teamName)}
                      >
                        {owner.teamName}
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bet-amount" className="text-slate-300">Bet Amount</Label>
                  <div className="flex gap-2">
                    <Input
                      id="bet-amount"
                      type="number"
                      min={1}
                      value={betAmount}
                      onChange={(e) => setBetAmount(parseInt(e.target.value) || 0)}
                      className="bg-slate-800 border-slate-600 text-slate-100"
                    />
                    <Button
                      onClick={() => selectedTeam && placeBet(selectedTeam, betAmount)}
                      disabled={!selectedTeam || betAmount <= 0}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white"
                    >
                      Place Bet
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-slate-300">Your Current Bets</Label>
                  <div className="space-y-2">
                    {bets.filter(bet => bet.bettorId === 'connected').map((bet, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50 border border-slate-700"
                      >
                        <div className="text-slate-100">{bet.teamName}</div>
                        <div className="flex items-center gap-2">
                          <Badge className="bg-amber-500/20 text-amber-300">${bet.amount}</Badge>
                          <Button variant="ghost" size="sm" className="text-rose-400 hover:text-rose-300">
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ))}
                    {bets.filter(bet => bet.bettorId === 'connected').length === 0 && (
                      <div className="text-slate-500 text-sm text-center py-4">No bets placed yet</div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Odds & Pool */}
            <Card className="bg-slate-900/70 border-slate-700">
              <CardHeader>
                <CardTitle className="text-slate-100">Betting Pool</CardTitle>
                <CardDescription className="text-slate-400">Current odds and total pool</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center p-4 rounded-lg bg-slate-800/50 border border-slate-700">
                  <div className="text-2xl font-bold text-emerald-400">${totalPool}</div>
                  <div className="text-slate-400 text-sm">Total Pool</div>
                </div>

                <div className="space-y-3">
                  <div className="text-slate-300 font-medium">Current Odds</div>
                  {teamOdds.map((team) => (
                    <div key={team.team} className="flex items-center justify-between p-2 rounded bg-slate-800/30">
                      <div className="text-slate-200 text-sm">{team.team}</div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="bg-blue-500/20 text-blue-300">{team.odds}%</Badge>
                        <div className="text-slate-400 text-sm">${team.amount}</div>
                      </div>
                    </div>
                  ))}
                  {teamOdds.length === 0 && (
                    <div className="text-slate-500 text-sm text-center py-2">No bets placed yet</div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Bracket */}
        <TabsContent value="bracket">
          <Card className="bg-slate-900/70 border-slate-700">
            <CardHeader>
              <CardTitle className="text-slate-100">Tournament Bracket</CardTitle>
              <CardDescription className="text-slate-400">Follow the tournament progress</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-slate-500">Tournament bracket visualization coming soon...</div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
