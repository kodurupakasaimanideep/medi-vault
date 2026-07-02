export default function About() {
  return (
    <div className="container animate-fade-in">
      <div className="card prose" style={{ maxWidth: '800px', margin: '0 auto', textAlign: 'center', padding: '3rem 2rem' }}>
        <h1>About Us</h1>
        <p style={{ fontSize: '1.25rem', color: 'var(--text-muted)' }}>
          This system is used for managing employees, attendance, and office records. This is an internal office management system for authorized users.
        </p>
      </div>
    </div>
  );
}
