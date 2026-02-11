// ==========================================
// Activity Templates Page (Admin only)
// ==========================================

import { useState, useEffect } from 'react';
import api from '../api/axios';
import toast from 'react-hot-toast';
import Modal from '../components/Modal';

export default function TemplatesPage() {
  const [templates, setTemplates] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    activityType: '',
    description: '',
    guidelines: '',
    defaultRubrics: [{ name: '', criteria: { scale1: '', scale2: '', scale3: '', scale4: '', scale5: '' } }],
  });

  useEffect(() => { load(); }, []);

  const load = async () => {
    const { data } = await api.get('/admin/templates');
    setTemplates(data);
  };

  const addRubric = () => {
    setForm((f) => ({
      ...f,
      defaultRubrics: [...f.defaultRubrics, { name: '', criteria: { scale1: '', scale2: '', scale3: '', scale4: '', scale5: '' } }],
    }));
  };

  const removeRubric = (idx) => {
    setForm((f) => ({
      ...f,
      defaultRubrics: f.defaultRubrics.filter((_, i) => i !== idx),
    }));
  };

  const updateRubric = (idx, field, value) => {
    setForm((f) => {
      const updated = [...f.defaultRubrics];
      if (field === 'name') {
        updated[idx].name = value;
      } else {
        updated[idx].criteria[field] = value;
      }
      return { ...f, defaultRubrics: updated };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/admin/templates', form);
      toast.success('Template created!');
      setShowModal(false);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this template?')) return;
    try {
      await api.delete(`/admin/templates/${id}`);
      toast.success('Deleted!');
      load();
    } catch (err) {
      toast.error('Error');
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Activity Templates</h1>
        <button onClick={() => setShowModal(true)} className="btn-primary">+ Create Template</button>
      </div>

      <div className="space-y-4">
        {templates.map((t) => (
          <div key={t._id} className="bg-white rounded-xl shadow-sm border p-5">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="font-semibold text-lg">{t.activityType}</h3>
                <p className="text-sm text-gray-500">{t.description}</p>
              </div>
              <button onClick={() => handleDelete(t._id)} className="text-red-600 text-sm hover:underline">Delete</button>
            </div>
            <p className="text-sm mb-2"><strong>Rubrics:</strong> {t.defaultRubrics?.length || 0}</p>
            <div className="flex flex-wrap gap-2">
              {t.defaultRubrics?.map((r, i) => (
                <span key={i} className="text-xs bg-gray-100 px-2 py-1 rounded">{r.name}</span>
              ))}
            </div>
          </div>
        ))}
        {templates.length === 0 && <p className="text-center text-gray-400 py-8">No templates yet.</p>}
      </div>

      <Modal show={showModal} onClose={() => setShowModal(false)} title="Create Activity Template" wide>
        <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto">
          <div>
            <label className="label">Activity Type (e.g. PPT, GD, Viva)</label>
            <input value={form.activityType} onChange={(e) => setForm({ ...form, activityType: e.target.value })} required className="input" />
          </div>
          <div>
            <label className="label">Description</label>
            <input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="input" />
          </div>
          <div>
            <label className="label">Guidelines</label>
            <textarea value={form.guidelines} onChange={(e) => setForm({ ...form, guidelines: e.target.value })} rows={3} className="input" />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="label mb-0">Default Rubrics</label>
              <button type="button" onClick={addRubric} className="text-sm text-primary-600 hover:underline">+ Add Rubric</button>
            </div>
            {form.defaultRubrics.map((r, idx) => (
              <div key={idx} className="border rounded-lg p-3 mb-3">
                <div className="flex items-center justify-between mb-2">
                  <input
                    value={r.name}
                    onChange={(e) => updateRubric(idx, 'name', e.target.value)}
                    placeholder="Rubric name"
                    className="input flex-1 mr-2"
                    required
                  />
                  <button type="button" onClick={() => removeRubric(idx)} className="text-red-500 text-sm">✕</button>
                </div>
                <div className="grid grid-cols-5 gap-2">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <input
                      key={s}
                      value={r.criteria[`scale${s}`]}
                      onChange={(e) => updateRubric(idx, `scale${s}`, e.target.value)}
                      placeholder={`Score ${s}`}
                      className="input text-xs"
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-primary">Create Template</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
