// ==========================================
// Activities Page — List + Create wizard
// ==========================================

import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../api/axios';
import toast from 'react-hot-toast';
import Modal from '../components/Modal';

const ACTIVITY_TYPES = ['PPT', 'Flip Classroom', 'GD', 'Viva', 'Lab', 'Assignment', 'Quiz', 'Project', 'Seminar', 'Other'];

export default function ActivitiesPage() {
  const [searchParams] = useSearchParams();
  const subjectFilter = searchParams.get('subject') || '';
  const [activities, setActivities] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState(subjectFilter);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: '', activityType: 'PPT', subject: '', totalMarks: 10, topic: '' });
  const [aiLoading, setAiLoading] = useState(false);

  useEffect(() => { loadSubjects(); }, []);
  useEffect(() => { loadActivities(); }, [selectedSubject]);

  const loadSubjects = async () => {
    const { data } = await api.get('/subjects');
    setSubjects(data);
    if (!selectedSubject && data.length) setSelectedSubject(data[0]._id);
  };

  const loadActivities = async () => {
    if (!selectedSubject) return;
    const { data } = await api.get(`/activities?subject=${selectedSubject}`);
    setActivities(data);
  };

  const openCreate = () => {
    setForm({ name: '', activityType: 'PPT', subject: selectedSubject, totalMarks: 10, topic: '' });
    setShowModal(true);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await api.post('/activities', form);
      toast.success('Activity created! Default rubrics applied.');
      setShowModal(false);
      loadActivities();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error');
    }
  };

  const handleGenerateGuidelines = async () => {
    if (!form.activityType || !form.topic) return toast.error('Set type & topic first');
    setAiLoading(true);
    try {
      const { data } = await api.post('/ai/generate-guidelines', {
        activityType: form.activityType,
        topic: form.topic,
      });
      setForm((f) => ({ ...f, guidelines: data.guidelines }));
      toast.success('Guidelines generated!');
    } catch (err) {
      toast.error('AI generation failed');
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Activities</h1>
        <button onClick={openCreate} className="btn-primary">+ Create Activity</button>
      </div>

      {/* Subject Filter */}
      <div className="mb-6">
        <select
          value={selectedSubject}
          onChange={(e) => setSelectedSubject(e.target.value)}
          className="input w-80"
        >
          {subjects.map((s) => (
            <option key={s._id} value={s._id}>{s.name} ({s.code})</option>
          ))}
        </select>
      </div>

      {/* Activities List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {activities.map((a) => (
          <Link key={a._id} to={`/activities/${a._id}`}
            className="bg-white rounded-xl shadow-sm border p-5 hover:shadow-md transition group"
          >
            <div className="flex items-start justify-between mb-2">
              <h3 className="font-semibold text-gray-900 group-hover:text-primary-600">{a.name}</h3>
              <span className={`text-xs px-2 py-1 rounded-full ${
                a.status === 'draft' ? 'bg-yellow-100 text-yellow-700' :
                a.status === 'submitted' ? 'bg-green-100 text-green-700' :
                'bg-red-100 text-red-700'
              }`}>
                {a.status}
              </span>
            </div>
            <p className="text-sm text-gray-500">{a.activityType}</p>
            <p className="text-sm text-gray-500 mt-1">Total Marks: <strong>{a.totalMarks}</strong></p>
            <div className="mt-3 flex gap-2">
              <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                {a.subject?.code}
              </span>
            </div>
          </Link>
        ))}
      </div>

      {activities.length === 0 && (
        <div className="text-center text-gray-400 py-12">No activities for this subject.</div>
      )}

      {/* Create Activity Modal */}
      <Modal show={showModal} onClose={() => setShowModal(false)} title="Create CIE Activity" wide>
        <form onSubmit={handleCreate} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Activity Name</label>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required className="input" placeholder="e.g. CIE-1" />
            </div>
            <div>
              <label className="label">Activity Type</label>
              <select value={form.activityType} onChange={(e) => setForm({ ...form, activityType: e.target.value })} className="input">
                {ACTIVITY_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Subject</label>
              <select value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} required className="input">
                {subjects.map((s) => <option key={s._id} value={s._id}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Total Marks</label>
              <input type="number" min="1" value={form.totalMarks} onChange={(e) => setForm({ ...form, totalMarks: parseInt(e.target.value) || 1 })} required className="input" />
            </div>
          </div>
          <div>
            <label className="label">Topic</label>
            <input value={form.topic} onChange={(e) => setForm({ ...form, topic: e.target.value })} className="input" placeholder="Activity topic (used for AI generation)" />
          </div>
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="label mb-0">Guidelines</label>
              <button type="button" onClick={handleGenerateGuidelines} disabled={aiLoading} className="text-xs text-primary-600 hover:underline">
                {aiLoading ? '⏳ Generating...' : '✨ AI Generate'}
              </button>
            </div>
            <textarea
              value={form.guidelines || ''}
              onChange={(e) => setForm({ ...form, guidelines: e.target.value })}
              rows={4}
              className="input"
              placeholder="Activity conduction guidelines..."
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-primary">Create Activity</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
