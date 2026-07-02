export default function Placeholder({ title }) {
  return (
    <div className="container animate-fade-in" style={{ padding: '2rem', textAlign: 'center' }}>
      <h1 style={{ fontSize: '2.5rem', color: 'var(--primary)', marginBottom: '1rem' }}>{title}</h1>
      <p style={{ color: 'var(--text-muted)' }}>This module is currently being built. Stay tuned!</p>
    </div>
  );
}
