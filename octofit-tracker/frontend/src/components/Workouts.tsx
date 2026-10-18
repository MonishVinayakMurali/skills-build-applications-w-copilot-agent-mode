import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';
import { CapabilityCard } from './CapabilityCard.js';

type WorkoutSuggestion = { title?: string; reason?: string; focus?: string };

export default function Workouts() {
  const [items, setItems] = useState<WorkoutSuggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    getJson<{ suggestions?: WorkoutSuggestion[] }>('/api/workouts/suggestions/mona@example.com')
      .then((data) => {
        if (!active) return;
        setItems(data.suggestions ?? []);
        setLoading(false);
      })
      .catch((err) => {
        if (!active) return;
        setError(err instanceof Error ? err.message : 'Unable to load workout suggestions.');
        setLoading(false);
      });
    return () => { active = false; };
  }, []);

  return <CapabilityCard title="Workout suggestions" description="Recommend workouts from activity patterns." loading={loading} error={error} emptyText="No workout suggestions" items={items} renderItem={(item) => {
    const workout = item as WorkoutSuggestion;
    return <span>{workout.title ?? 'Workout'}: {workout.reason ?? workout.focus ?? 'No reason provided'}</span>;
  }} />;
}
