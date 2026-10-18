import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';
import { CapabilityCard } from './CapabilityCard.js';

type LeaderboardEntry = { teamName?: string; totalPoints?: number; rank?: number };

export default function Leaderboard() {
  const [items, setItems] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    getJson<{ leaderboard?: LeaderboardEntry[] }>('/api/leaderboard')
      .then((data) => {
        if (!active) return;
        setItems(data.leaderboard ?? []);
        setLoading(false);
      })
      .catch((err) => {
        if (!active) return;
        setError(err instanceof Error ? err.message : 'Unable to load leaderboard.');
        setLoading(false);
      });
    return () => { active = false; };
  }, []);

  return <CapabilityCard title="Leaderboard" description="Compare team point totals." loading={loading} error={error} emptyText="No leaderboard" items={items} renderItem={(item) => {
    const entry = item as LeaderboardEntry;
    return <span>{entry.teamName ?? 'Team'}: {entry.totalPoints ?? 0}</span>;
  }} />;
}
