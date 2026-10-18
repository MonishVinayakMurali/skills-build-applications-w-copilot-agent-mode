import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';
import { CapabilityCard } from './CapabilityCard.js';

type Activity = { type?: string; minutes?: number; points?: number };

export default function Activities() {
  const [items, setItems] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    getJson<{ activities?: Activity[] }>('/api/activities')
      .then((data) => {
        if (!active) return;
        setItems(data.activities ?? []);
        setLoading(false);
      })
      .catch((err) => {
        if (!active) return;
        setError(err instanceof Error ? err.message : 'Unable to load activities.');
        setLoading(false);
      });
    return () => { active = false; };
  }, []);

  return <CapabilityCard title="Activities" description="Track student activity minutes and points." loading={loading} error={error} emptyText="No activities" items={items} renderItem={(item) => {
    const activity = item as Activity;
    return <span>{activity.type ?? 'Activity'}: {activity.minutes ?? 0} min</span>;
  }} />;
}
