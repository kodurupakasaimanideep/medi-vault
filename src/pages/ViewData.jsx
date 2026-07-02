import { useState, useEffect } from 'react';
import { Database, Calendar, Trash2 } from 'lucide-react';

export default function ViewData({ user }) {
  const [records, setRecords] = useState([]);

  useEffect(() => {
    loadData();
  }, [user.id]);

  const loadData = () => {
    const allData = JSON.parse(localStorage.getItem('medivault_userdata') || '[]');
    // Filter data for logged-in user
    const userData = allData.filter(r => r.user_id === user.id).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    setRecords(userData);
  };

  const deleteRecord = (id) => {
    if(window.confirm('Are you sure you want to delete this record?')) {
      const allData = JSON.parse(localStorage.getItem('medivault_userdata') || '[]');
      const newData = allData.filter(r => r.id !== id);
      localStorage.setItem('medivault_userdata', JSON.stringify(newData));
      loadData();
    }
  };

  return (
    <div className="container animate-fade-in">
      <h1 style={{ fontSize: '2rem', fontWeight: '800', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <Database size={28} color="var(--primary)" />
        My Health Records
      </h1>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {records.length > 0 ? (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Category</th>
                  <th>Title</th>
                  <th>Notes</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {records.map((record) => (
                  <tr key={record.id}>
                    <td style={{ whiteSpace: 'nowrap' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem' }}>
                        <Calendar size={14} color="var(--text-muted)" />
                        {new Date(record.created_at).toLocaleDateString()}
                      </div>
                    </td>
                    <td>
                      <span style={{ 
                        background: record.category === 'Yoga' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(14, 165, 233, 0.1)',
                        color: record.category === 'Yoga' ? 'var(--secondary)' : 'var(--primary)',
                        padding: '0.25rem 0.75rem', 
                        borderRadius: '1rem', 
                        fontSize: '0.75rem',
                        fontWeight: '600'
                      }}>
                        {record.category}
                      </span>
                    </td>
                    <td style={{ fontWeight: '500' }}>{record.title}</td>
                    <td style={{ color: 'var(--text-muted)', fontSize: '0.875rem', maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {record.notes || '-'}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button onClick={() => deleteRecord(record.id)} className="btn btn-outline" style={{ padding: '0.4rem 0.5rem', color: 'var(--error)', borderColor: 'var(--error)' }}>
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            <Database size={48} style={{ margin: '0 auto 1rem', opacity: 0.2 }} />
            <p>No records found. Your added data will appear here.</p>
          </div>
        )}
      </div>
    </div>
  );
}
