type Props = {
  title: string;
  description: string;
  loading: boolean;
  error: string | null;
  emptyText: string;
  items: Array<string | number | Record<string, unknown>>;
  renderItem: (item: string | number | Record<string, unknown>, index: number) => React.ReactNode;
};

export function CapabilityCard({ title, description, loading, error, emptyText, items, renderItem }: Props) {
  if (loading) {
    return <section className="card h-100"><div className="card-body"><h2 className="h4">{title}</h2><p>{description}</p><p role="status">Loading...</p></div></section>;
  }

  if (error) {
    return <section className="card h-100"><div className="card-body"><h2 className="h4">{title}</h2><p>{description}</p><p role="alert">Unable to load {title.toLowerCase()}.</p></div></section>;
  }

  if (items.length === 0) {
    return <section className="card h-100"><div className="card-body"><h2 className="h4">{title}</h2><p>{description}</p><p>{emptyText}</p></div></section>;
  }

  return <section className="card h-100"><div className="card-body"><h2 className="h4">{title}</h2><p>{description}</p><ul className="list-group list-group-flush">{items.map((item, index) => <li key={index} className="list-group-item">{renderItem(item, index)}</li>)}</ul></div></section>;
}
