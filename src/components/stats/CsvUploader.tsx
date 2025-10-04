/**
 * File: src/components/stats/CsvUploader.tsx
 * Purpose: Textarea-driven CSV uploader for stats ingestion and aggregation.
 */

import React, { useState } from 'react';

/**
 * CsvUploader: paste raw CSV text and emit it upward for parsing.
 */
export function CsvUploader({ onCsv }: { onCsv: (text: string) => void }) {
  const [text, setText] = useState<string>('');
  const sample = String.raw`,1,1-S2-1-6820063,8,2,0,7,35,17,16,1.32,0,0,0,719
,1,1-S2-1-10300134,1,1,1,4,33,16,22,1.13,0,0,0,719
,1,1-S2-1-4122701,5,1,0,1,28,12,11,0.45,0,0,0,719
,1,1-S2-1-1520631,0,0,1,1,8,9,5,0.42,9,7,696,23
,2,1-S2-1-6347815,2,0,0,2,34,19,11,0.63,0,0,0,719
,2,1-S2-1-4964615,0,0,0,0,12,7,4,0.75,12,8,672,42
,2,1-S2-1-4096795,-6,1,0,4,31,12,20,1.55,1,1,35,680
,2,1-S2-1-6218367,-10,1,1,3,34,14,17,1.17,0,0,0,715`;

  return (
    <div className="rounded-xl border bg-white p-4 space-y-3">
      <div className="font-medium">Paste CSV statistics</div>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Paste CSV rows here (\\n for new player)..."
        rows={6}
        className="w-full border rounded p-2 font-mono text-sm"
      />
      <div className="flex gap-2">
        <button
          onClick={() => onCsv(text)}
          className="px-3 py-1.5 rounded-md border bg-white hover:bg-slate-50 text-sm"
        >
          Import CSV
        </button>
        <button
          onClick={() => setText(sample)}
          className="px-3 py-1.5 rounded-md border bg-white hover:bg-slate-50 text-sm"
        >
          Load sample
        </button>
      </div>
      <p className="text-xs text-slate-500">
        Format: team,accountId,steals/turnovers,goals,assists,shots,pickups,passes,passes received,possession,shots allowed,saves,goalie time,skater time
      </p>
    </div>
  );
}
