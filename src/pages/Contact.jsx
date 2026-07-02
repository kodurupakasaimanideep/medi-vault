import { Mail } from 'lucide-react';

export default function Contact() {
  return (
    <div className="container animate-fade-in">
      <div className="card prose" style={{ maxWidth: '800px', margin: '0 auto', textAlign: 'center', padding: '3rem 2rem' }}>
        <h1>Contact Support</h1>
        <p style={{ fontSize: '1.25rem', color: 'var(--text-muted)', marginBottom: '2rem' }}>
          For support or issues, contact:
        </p>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.75rem', padding: '1rem 2rem', background: 'var(--bg-color)', borderRadius: '1rem', border: '1px solid var(--border)' }}>
          <Mail size={24} color="var(--primary)" />
          <a href="mailto:admin@kps.com" style={{ fontSize: '1.25rem', fontWeight: '600', color: 'var(--text-main)', textDecoration: 'none' }}>
            admin@kps.com
          </a>
        </div>
      </div>
    </div>
  );
}
