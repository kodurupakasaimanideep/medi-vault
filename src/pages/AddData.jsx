import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Save, FileText, HeartPulse } from 'lucide-react';

export default function AddData({ user }) {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Medical');
  const [notes, setNotes] = useState('');
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title) return;

    const newRecord = {
      id: Date.now(),
      user_id: user.id,
      title,
      category,
      notes,
      created_at: new Date().toISOString()
    };

    const existingData = JSON.parse(localStorage.getItem('medivault_userdata') || '[]');
    localStorage.setItem('medivault_userdata', JSON.stringify([...existingData, newRecord]));
    
    setSuccess(true);
    setTimeout(() => {
      navigate('/view-data');
    }, 1500);
  };

  return (
    <div className="container animate-fade-in" style={{ maxWidth: '600px' }}>
      <h1 style={{ fontSize: '2rem', fontWeight: '800', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <HeartPulse size={28} color="var(--primary)" />
        Add New Health Record
      </h1>

      <div className="card">
        {success && (
          <div className="alert alert-success">
            <Save size={16} /> Record saved successfully! Redirecting...
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="label">Record Title</label>
            <input 
              type="text" 
              className="input-field" 
              placeholder="e.g. Morning Yoga Session, Blood Pressure Log"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="label">Category</label>
            <select 
              className="input-field"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              <option value="Medical">Medical / Health</option>
              <option value="Yoga">Yoga / Fitness</option>
              <option value="Diet">Diet / Nutrition</option>
            </select>
          </div>

          <div className="form-group">
            <label className="label">Notes / Details</label>
            <textarea 
              className="input-field" 
              rows="5"
              placeholder="Enter your health metrics, yoga duraton, or any notes..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            ></textarea>
          </div>

          <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
            <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
              <Save size={18} /> Save Record
            </button>
            <button type="button" onClick={() => navigate('/dashboard')} className="btn btn-outline">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
