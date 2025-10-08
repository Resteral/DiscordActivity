/**
 * File: src/components/clan/ClanManager.tsx
 * Purpose: Clan management system with clan creation, matches, and betting
 */

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import type { Player, Clan, ClanMatch, ClanBet } from '../../types';

interface ClanManagerProps {
  players: Player[];
  setPlayers: (players: Player[] | ((prev: Player[]) => Player[])) => void;
  connectedId?: string;
}

/**
 * ClanManager: Comprehensive clan system with matches and betting
 */
export function ClanManager({ players, setPlayers, connectedId }: ClanManagerProps) {
  const [activeTab, setActiveTab] = useState<'clans' | 'matches' | 'betting'>('clans');
  const [clans, setClans] = useState<Clan[]>([]);
  const [matches, setMatches] = useState<ClanMatch[]>([]);
  const [clanBets, setClanBets] = useState<ClanBet[]>([]);
  const [newClanName, setNewClanName] = useState('');
  const [newClanTag, setNewClanTag] = useState('');
  const [selectedClanColor, setSelectedClanColor] = useState('#3b82f6');

  // Available colors for clans
  const clanColors = [
    '#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6',
    '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#6366f1'
  ];

  // Calculate clan statistics
  const clanStats = useMemo(() => 
    clans.map(clan => {
      const clanMatches = matches.filter(m => 
        m.clanAId === clan.id || m.clanBId === clan.id
      );
      const completedMatches = clanMatches.filter(m => m.status === 'completed');
      
      return {
        ...clan,
        totalMatches: completedMatches.length,
        winRate: completedMatches.length > 0 
          ? (clan.wins / completedMatches.length * 100).toFixed(1)
          : '0.0'
      };
    }), 
    [clans, matches]
  );

  // Calculate match betting pools
  const matchPools = useMemo(() => 
    matches.map(match => ({
      ...match,
      totalPool: match.bets.reduce((sum, bet) => sum + bet.amount, 0),
      clanABets: match.bets.filter(bet => bet.clanId === match.clanAId).reduce((sum, bet) => sum + bet.amount, 0),
      clanBBets: match.bets.filter(bet => bet.clanId === match.clanBId).reduce((sum, bet) => sum + bet.amount, 0),
    })), 
    [matches]
  );

  // Create a new clan
  const createClan = () => {
    if (!newClanName.trim() || !newClanTag.trim() || !connectedId) return;

    const newClan: Clan = {
      id: `clan-${Date.now()}`,
      name: newClanName,
      tag: newClanTag.toUpperCase(),
      leaderId: connectedId,
      memberIds: [connectedId],
      wins: 0,
      losses: 0,
      draws: 0,
      elo: 1200,
      createdAt: new Date(),
      color: selectedClanColor
    };

    setClans(prev => [...prev, newClan]);
    setNewClanName('');
    setNewClanTag('');
    setSelectedClanColor('#3b82f6');
  };

  // Schedule a match between two clans
  const scheduleMatch = (clanAId: string, clanBId: string) => {
    const newMatch: ClanMatch = {
      id: `match-${Date.now()}`,
      clanAId,
      clanBId,
      status: 'scheduled',
      scheduledTime: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
      bets: [],
      totalPool: 0
    };

    setMatches(prev => [...prev, newMatch]);
  };

  // Place a bet on a clan match
  const placeClanBet = (matchId: string, clanId: string, amount: number) => {
    if (!connectedId) return;

    const connectedPlayer = players.find(p => p.id === connectedId);
    if (!connectedPlayer || connectedPlayer.wallet < amount) return;

    // Deduct from player wallet
    setPlayers(prev => 
      prev.map(p => 
        p.id === connectedId ? { ...p, wallet: p.wallet - amount } : p
      )
    );

    // Add bet
    const newBet: ClanBet = {
      bettorId: connectedId,
      clanId,
      amount,
      placedAt: new Date()
    };

    setMatches(prev => 
      prev.map(match => 
        match.id === matchId 
          ? { ...match, bets: [...match.bets, newBet] }
          : match
      )
    );

    setClanBets(prev => [...prev, newBet]);
  };

  return (
    <div className="space-y-6">
      {/* Clan System Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-100">Clan System</h2>
          <p className="text-slate-400">Create clans, organize matches, and bet on clan competitions</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="bg-purple-500/20 text-purple-300">
            {clans.length} Clans
          </Badge>
          <Badge variant="secondary" className="bg-orange-500/20 text-orange-300">
            {matches.length} Matches
          </Badge>
        </div>
      </div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="clans">Clan Management</TabsTrigger>
          <TabsTrigger value="matches">Clan Matches</TabsTrigger>
          <TabsTrigger value="betting">Clan Betting</TabsTrigger>
        </TabsList>

        {/* Clan Management Tab */}
        <TabsContent value="clans" className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Create Clan Card */}
            <Card className="bg-slate-900/70 border-slate-700">
              <CardHeader>
                <CardTitle className="text-slate-100">Create New Clan</CardTitle>
                <CardDescription className="text-slate-400">
                  Start your own clan and invite players
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="clan-name" className="text-slate-300">Clan Name</Label>
                  <Input
                    id="clan-name"
                    placeholder="Enter clan name"
                    value={newClanName}
                    onChange={(e) => setNewClanName(e.target.value)}
                    className="bg-slate-800 border-slate-600 text-slate-100"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="clan-tag" className="text-slate-300">Clan Tag</Label>
                  <Input
                    id="clan-tag"
                    placeholder="TAG (3-5 letters)"
                    value={newClanTag}
                    onChange={(e) => setNewClanTag(e.target.value)}
                    maxLength={5}
                    className="bg-slate-800 border-slate-600 text-slate-100 uppercase"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-slate-300">Clan Color</Label>
                  <div className="flex gap-2 flex-wrap">
                    {clanColors.map((color) => (
                      <button
                        key={color}
                        className={`w-8 h-8 rounded-full border-2 ${
                          selectedClanColor === color ? 'border-white' : 'border-slate-600'
                        }`}
                        style={{ backgroundColor: color }}
                        onClick={() => setSelectedClanColor(color)}
                      />
                    ))}
                  </div>
                </div>

                <Button
                  onClick={createClan}
                  disabled={!newClanName.trim() || !newClanTag.trim() || !connectedId}
                  className="w-full bg-purple-600 hover:bg-purple-500 text-white"
                >
                  Create Clan
                </Button>
              </CardContent>
            </Card>

            {/* Clan List Card */}
            <Card className="bg-slate-900/70 border-slate-700">
              <CardHeader>
                <CardTitle className="text-slate-100">Active Clans</CardTitle>
                <CardDescription className="text-slate-400">
                  {clans.length} clans registered in the system
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-80 overflow-y-auto">
                  {clanStats.map((clan) => (
                    <div
                      key={clan.id}
                      className="p-3 rounded-lg bg-slate-800/50 border border-slate-700"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <div 
                            className="w-4 h-4 rounded-full"
                            style={{ backgroundColor: clan.color }}
                          />
                          <div>
                            <div className="text-slate-100 font-medium">{clan.name}</div>
                            <div className="text-slate-400 text-sm">[{clan.tag}]</div>
                          </div>
                        </div>
                        <Badge 
                          variant="secondary" 
                          className="bg-transparent border-slate-600 text-slate-300"
                        >
                          {clan.memberIds.length} members
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-2 text-center text-sm">
                        <div>
                          <div className="text-emerald-400 font-semibold">{clan.wins}W</div>
                          <div className="text-slate-500">Wins</div>
                        </div>
                        <div>
                          <div className="text-rose-400 font-semibold">{clan.losses}L</div>
                          <div className="text-slate-500">Losses</div>
                        </div>
                        <div>
                          <div className="text-amber-400 font-semibold">{clan.elo}</div>
                          <div className="text-slate-500">Elo</div>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {clans.length === 0 && (
                    <div className="text-center py-8 text-slate-500">
                      No clans created yet. Be the first to start one!
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Clan Matches Tab */}
        <TabsContent value="matches" className="space-y-6">
          <Card className="bg-slate-900/70 border-slate-700">
            <CardHeader>
              <CardTitle className="text-slate-100">Clan Matches</CardTitle>
              <CardDescription className="text-slate-400">
                Schedule and manage clan competitions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {matches.map((match) => {
                  const clanA = clans.find(c => c.id === match.clanAId);
                  const clanB = clans.find(c => c.id === match.clanBId);
                  
                  if (!clanA || !clanB) return null;

                  return (
                    <div
                      key={match.id}
                      className="p-4 rounded-lg bg-slate-800/50 border border-slate-700"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-2">
                            <div 
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: clanA.color }}
                            />
                            <span className="text-slate-100 font-medium">{clanA.name}</span>
                            <Badge variant="outline" className="bg-transparent text-slate-400">
                              {clanA.elo}
                            </Badge>
                          </div>
                          
                          <div className="text-slate-500 font-bold">VS</div>
                          
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="bg-transparent text-slate-400">
                              {clanB.elo}
                            </Badge>
                            <span className="text-slate-100 font-medium">{clanB.name}</span>
                            <div 
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: clanB.color }}
                            />
                          </div>
                        </div>
                        
                        <Badge 
                          className={
                            match.status === 'scheduled' ? 'bg-blue-500/20 text-blue-300' :
                            match.status === 'live' ? 'bg-emerald-500/20 text-emerald-300' :
                            'bg-slate-500/20 text-slate-300'
                          }
                        >
                          {match.status}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="text-slate-400 text-sm">
                          {match.scheduledTime && `Scheduled: ${match.scheduledTime.toLocaleDateString()}`}
                        </div>
                        
                        <div className="flex gap-2">
                          <Button 
                            size="sm" 
                            variant="outline"
                            className="bg-transparent border-slate-600 text-slate-300"
                            onClick={() => scheduleMatch(clanA.id, clanB.id)}
                          >
                            Reschedule
                          </Button>
                          <Button 
                            size="sm"
                            className="bg-orange-600 hover:bg-orange-500 text-white"
                          >
                            Report Result
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
                
                {matches.length === 0 && (
                  <div className="text-center py-8 text-slate-500">
                    No clan matches scheduled yet. Create clans first!
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Clan Betting Tab */}
        <TabsContent value="betting" className="space-y-6">
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Match Betting */}
            <Card className="lg:col-span-2 bg-slate-900/70 border-slate-700">
              <CardHeader>
                <CardTitle className="text-slate-100">Clan Match Betting</CardTitle>
                <CardDescription className="text-slate-400">
                  Place bets on upcoming clan matches
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {matchPools.map((match) => {
                  const clanA = clans.find(c => c.id === match.clanAId);
                  const clanB = clans.find(c => c.id === match.clanBId);
                  
                  if (!clanA || !clanB || match.status !== 'scheduled') return null;

                  const totalPool = match.totalPool;
                  const clanAOdds = totalPool > 0 ? (match.clanABets / totalPool * 100).toFixed(1) : '50.0';
                  const clanBOdds = totalPool > 0 ? (match.clanBBets / totalPool * 100).toFixed(1) : '50.0';

                  return (
                    <div key={match.id} className="p-4 rounded-lg bg-slate-800/50 border border-slate-700">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-4">
                          <div className="text-center">
                            <div 
                              className="w-4 h-4 rounded-full mx-auto mb-1"
                              style={{ backgroundColor: clanA.color }}
                            />
                            <div className="text-slate-100 font-medium">{clanA.name}</div>
                            <div className="text-blue-400 text-sm">{clanAOdds}%</div>
                          </div>
                          
                          <div className="text-slate-500 font-bold text-xl">VS</div>
                          
                          <div className="text-center">
                            <div 
                              className="w-4 h-4 rounded-full mx-auto mb-1"
                              style={{ backgroundColor: clanB.color }}
                            />
                            <div className="text-slate-100 font-medium">{clanB.name}</div>
                            <div className="text-blue-400 text-sm">{clanBOdds}%</div>
                          </div>
                        </div>
                        
                        <div className="text-center">
                          <div className="text-emerald-400 font-bold">${totalPool}</div>
                          <div className="text-slate-400 text-sm">Total Pool</div>
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          className="flex-1 bg-transparent border-slate-600 text-slate-300"
                          onClick={() => placeClanBet(match.id, clanA.id, 50)}
                        >
                          Bet $50 on {clanA.tag}
                        </Button>
                        <Button
                          variant="outline"
                          className="flex-1 bg-transparent border-slate-600 text-slate-300"
                          onClick={() => placeClanBet(match.id, clanB.id, 50)}
                        >
                          Bet $50 on {clanB.tag}
                        </Button>
                      </div>
                    </div>
                  );
                })}
                
                {matchPools.filter(m => m.status === 'scheduled').length === 0 && (
                  <div className="text-center py-8 text-slate-500">
                    No scheduled matches available for betting
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Clan Leaderboard */}
            <Card className="bg-slate-900/70 border-slate-700">
              <CardHeader>
                <CardTitle className="text-slate-100">Clan Leaderboard</CardTitle>
                <CardDescription className="text-slate-400">
                  Top clans by Elo rating
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {clanStats
                    .sort((a, b) => b.elo - a.elo)
                    .slice(0, 5)
                    .map((clan, index) => (
                      <div
                        key={clan.id}
                        className="flex items-center justify-between p-3 rounded bg-slate-800/30"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-6 h-6 rounded-full flex items-center justify-center bg-slate-700 text-slate-300 text-xs font-bold">
                            {index + 1}
                          </div>
                          <div 
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: clan.color }}
                          />
                          <div>
                            <div className="text-slate-200 text-sm font-medium">{clan.name}</div>
                            <div className="text-slate-400 text-xs">[{clan.tag}]</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-amber-400 font-semibold">{clan.elo}</div>
                          <div className="text-slate-400 text-xs">{clan.wins}-{clan.losses}</div>
                        </div>
                      </div>
                    ))
                  }
                  
                  {clanStats.length === 0 && (
                    <div className="text-center py-4 text-slate-500 text-sm">
                      No clans yet
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}