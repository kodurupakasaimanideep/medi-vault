import { Link, useLocation } from 'react-router-dom';
import { Activity, LogOut, Moon, Sun, User, Home, PlusCircle, Database } from 'lucide-react';

export default function Navbar({ user, onLogout, theme, toggleTheme }) {
  const location = useLocation();
  
  const isActive = (path) => location.pathname === path ? 'active' : '';

  return (
    <nav className="navbar">
      <div className="container nav-container">
        <Link to="/" className="nav-logo">
          <Activity size={28} className="animate-heartbeat" />
          MEDIVAULT
        </Link>

        {user ? (
          <div className="nav-links">
            <Link to="/dashboard" className={`nav-link ${isActive('/dashboard')}`} title="Dashboard">
              <Home size={20} />
            </Link>
            <Link to="/add-data" className={`nav-link ${isActive('/add-data')}`} title="Add Data">
              <PlusCircle size={20} />
            </Link>
            <Link to="/view-data" className={`nav-link ${isActive('/view-data')}`} title="View My Data">
              <Database size={20} />
            </Link>
            
            <div style={{ width: '1px', height: '24px', background: 'var(--border)', margin: '0 0.5rem' }}></div>
            
            <button onClick={toggleTheme} className="nav-link" style={{ background: 'none', border: 'none', cursor: 'pointer' }} title="Toggle Theme">
              {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
            </button>
            <div className="nav-link" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <User size={20} />
              <span>{user.username}</span>
            </div>
            <button onClick={onLogout} className="btn btn-danger" style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}>
              <LogOut size={16} /> Logout
            </button>
          </div>
        ) : (
          <div className="nav-links">
            <button onClick={toggleTheme} className="nav-link" style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
              {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
            </button>
            {location.pathname !== '/login' && (
              <Link to="/login" className="btn btn-primary">Login</Link>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}
