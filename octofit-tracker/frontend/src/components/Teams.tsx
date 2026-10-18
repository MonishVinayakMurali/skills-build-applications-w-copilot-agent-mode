import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';
import { CapabilityCard } from './CapabilityCard.js';

type Team = { name?: string; members?: Array<string | { toString: () => string }> };

export default function Teams() {
  const [items, setItems] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    getJson<{ teams?: Team[] }>('/api/teams')
      .then((data) => {
        if (!active) return;
        setItems(data.teams ?? []);
        setLoading(false);
      })
      .catch((err) => {
        if (!active) return;
        setError(err instanceof Error ? err.message : 'Unable to load teams.');
        setLoading(false);
      });
    return () => { active = false; };
  }, []);

  return <CapabilityCard title="Teams" description="Manage teams and members." loading={loading} error={error} emptyText="No teams" items={items} renderItem={(item) => {
    const team = item as Team;
    return <span>{team.name ?? 'Team'} ({(team.members ?? []).length} members)</span>;
  }} />;
}
