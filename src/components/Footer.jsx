import { Link } from 'react-router-dom';
import { HeartPulse } from 'lucide-react';

export default function Footer() {
  const year = new Date().getFullYear();
  
  return (
    <footer className="footer">
      <div className="container footer-inner">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--primary)', fontWeight: '600' }}>
          <HeartPulse size={20} />
          MEDIVAULT
        </div>
        <div className="footer-links">
          <Link to="/about" className="footer-link">About</Link>
          <Link to="/contact" className="footer-link">Contact</Link>
          <Link to="/privacy-policy" className="footer-link">Privacy Policy</Link>
          <Link to="/terms" className="footer-link">Terms</Link>
        </div>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '0.5rem' }}>
          &copy; {year} MEDIVAULT. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
