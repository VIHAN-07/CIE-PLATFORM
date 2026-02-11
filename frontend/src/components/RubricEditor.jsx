// ==========================================
// Rubric Editor Component
// ==========================================

import { useState } from 'react';
import api from '../api/axios';
import toast from 'react-hot-toast';

export default function RubricEditor({ activityId, rubrics, isLocked, onRefresh }) {
  const [editing, setEditing] = useState(null); // rubric id being edited
  const [form, setForm] = useState({ name: '', criteria: {} });
  const [showAdd, setShowAdd] = useState(false);
  const [newRubric, setNewRubric] = useState({
    name: '',
    criteria: { scale1: '', scale2: '', scale3: '', scale4: '', scale5: '' },
  });

  const startEdit = (rubric) => {
    setEditing(rubric._id);
    setForm({ name: rubric.name, criteria: { ...rubric.criteria } });
  };

  const handleSaveEdit = async (id) => {
    try {
      await api.put(`/rubrics/${id}`, form);
      toast.success('Rubric updated!');
      setEditing(null);
      onRefresh();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this rubric?')) return;
    try {
      await api.delete(`/rubrics/${id}`);
      toast.success('Rubric deleted!');
      onRefresh();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error');
    }
  };

  const handleAdd = async () => {
    try {
      await api.post('/rubrics', { activity: activityId, ...newRubric });
      toast.success('Rubric added!');
      setShowAdd(false);
      setNewRubric({ name: '', criteria: { scale1: '', scale2: '', scale3: '', scale4: '', scale5: '' } });
      onRefresh();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error');
    }
  };

  const handleSaveToLibrary = async (rubric) => {
    try {
      await api.post('/rubrics/library', {
        activityType: 'General',
        name: rubric.name,
        criteria: rubric.criteria,
      });
      toast.success('Saved to library!');
    } catch (err) {
      toast.error('Error saving to library');
    }
  };

  return (
    <div className="space-y-4">
      {rubrics.map((rubric) => (
        <div key={rubric._id} className="border rounded-lg p-4">
          {editing === rubric._id ? (
            /* Edit mode */
            <div className="space-y-3">
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="input font-semibold"
              />
              <div className="grid grid-cols-5 gap-2">
                {[1, 2, 3, 4, 5].map((s) => (
                  <div key={s}>
                    <label className="text-xs text-gray-500">Score {s}</label>
                    <textarea
                      value={form.criteria[`scale${s}`] || ''}
                      onChange={(e) => setForm({
                        ...form,
                        criteria: { ...form.criteria, [`scale${s}`]: e.target.value },
                      })}
                      rows={2}
                      className="input text-xs"
                    />
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <button onClick={() => handleSaveEdit(rubric._id)} className="btn-primary text-sm">Save</button>
                <button onClick={() => setEditing(null)} className="btn-secondary text-sm">Cancel</button>
              </div>
            </div>
          ) : (
            /* View mode */
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold text-gray-900">
                  {rubric.name}
                  {rubric.isLocked && <span className="ml-2 text-xs text-red-500">🔒 Locked</span>}
                </h4>
                {!isLocked && (
                  <div className="flex gap-2">
                    <button onClick={() => startEdit(rubric)} className="text-xs text-primary-600 hover:underline">Edit</button>
                    <button onClick={() => handleSaveToLibrary(rubric)} className="text-xs text-green-600 hover:underline">📚 Library</button>
                    <button onClick={() => handleDelete(rubric._id)} className="text-xs text-red-600 hover:underline">Delete</button>
                  </div>
                )}
              </div>
              <div className="grid grid-cols-5 gap-2 text-xs">
                {[1, 2, 3, 4, 5].map((s) => (
                  <div key={s} className={`p-2 rounded ${
                    s <= 2 ? 'bg-red-50' : s === 3 ? 'bg-yellow-50' : 'bg-green-50'
                  }`}>
                    <span className="font-medium">Score {s}:</span>
                    <p className="mt-0.5">{rubric.criteria[`scale${s}`] || '—'}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ))}

      {rubrics.length === 0 && <p className="text-gray-400 text-center py-4">No rubrics yet. Add one below.</p>}

      {/* Add new rubric */}
      {!isLocked && (
        <div>
          {showAdd ? (
            <div className="border-2 border-dashed border-primary-300 rounded-lg p-4 space-y-3">
              <input
                value={newRubric.name}
                onChange={(e) => setNewRubric({ ...newRubric, name: e.target.value })}
                placeholder="Rubric name"
                className="input font-semibold"
              />
              <div className="grid grid-cols-5 gap-2">
                {[1, 2, 3, 4, 5].map((s) => (
                  <div key={s}>
                    <label className="text-xs text-gray-500">Score {s}</label>
                    <textarea
                      value={newRubric.criteria[`scale${s}`]}
                      onChange={(e) => setNewRubric({
                        ...newRubric,
                        criteria: { ...newRubric.criteria, [`scale${s}`]: e.target.value },
                      })}
                      rows={2}
                      className="input text-xs"
                    />
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <button onClick={handleAdd} className="btn-primary text-sm">Add Rubric</button>
                <button onClick={() => setShowAdd(false)} className="btn-secondary text-sm">Cancel</button>
              </div>
            </div>
          ) : (
            <button onClick={() => setShowAdd(true)} className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-primary-400 hover:text-primary-600 transition text-sm">
              + Add Custom Rubric
            </button>
          )}
        </div>
      )}
    </div>
  );
}
