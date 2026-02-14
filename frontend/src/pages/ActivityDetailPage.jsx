// ==========================================
// Activity Detail Page — Rubric editor + status
// ==========================================

import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import toast from 'react-hot-toast';
import RubricEditor from '../components/RubricEditor';
import ConductionGuidelines from '../components/ConductionGuidelines';

export default function ActivityDetailPage() {
  const { id } = useParams();
  const { isAdmin } = useAuth();
  const navigate = useNavigate();
  const [activity, setActivity] = useState(null);
  const [rubrics, setRubrics] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { load(); }, [id]);

  const load = async () => {
    try {
      const { data } = await api.get(`/activities/${id}`);
      setActivity(data.activity);
      setRubrics(data.rubrics);
    } catch (err) {
      toast.error('Activity not found');
      navigate('/activities');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!confirm('Submit this activity? Rubrics will be locked.')) return;
    try {
      await api.post(`/activities/${id}/submit`);
      toast.success('Activity submitted & rubrics locked!');
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error');
    }
  };

  const handleUnlock = async () => {
    try {
      await api.post(`/activities/${id}/unlock`);
      toast.success('Activity unlocked!');
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error');
    }
  };

  const handleDelete = async () => {
    if (!confirm('Delete this activity and all its rubrics?')) return;
    try {
      await api.delete(`/activities/${id}`);
      toast.success('Deleted!');
      navigate('/activities');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error');
    }
  };

  const handleAIRubrics = async () => {
    if (!activity.topic) return toast.error('Set a topic first');
    try {
      const { data } = await api.post('/ai/generate-rubrics', {
        activityType: activity.activityType,
        topic: activity.topic,
      });
      // Add AI rubrics to activity
      for (const r of data.rubrics) {
        await api.post('/rubrics', {
          activity: id,
          name: r.name,
          criteria: r.criteria,
        });
      }
      toast.success(`Added ${data.rubrics.length} AI-generated rubrics!`);
      load();
    } catch (err) {
      toast.error('AI generation failed');
    }
  };

  if (loading) return <div className="text-center py-12"><Spinner /></div>;
  if (!activity) return null;

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">{activity.name}</h1>
          <p className="text-gray-500 mt-1">
            {activity.activityType} • {activity.subject?.name} ({activity.subject?.code}) • {activity.totalMarks} marks
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
            activity.status === 'draft' ? 'bg-yellow-100 text-yellow-700' :
            activity.status === 'submitted' ? 'bg-green-100 text-green-700' :
            'bg-red-100 text-red-700'
          }`}>
            {activity.status.toUpperCase()}
          </span>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex flex-wrap gap-3 mb-6">
        <Link to={`/grading/${activity._id}`} className="btn-primary">📝 Open Grading Grid</Link>
        {activity.status === 'draft' && (
          <button onClick={handleSubmit} className="btn-secondary bg-green-600 text-white hover:bg-green-700">
            ✅ Submit Activity
          </button>
        )}
        {(activity.status === 'submitted' || activity.status === 'locked') && (isAdmin || true) && (
          <button onClick={handleUnlock} className="btn-secondary bg-orange-500 text-white hover:bg-orange-600">
            🔓 Unlock
          </button>
        )}
        <button onClick={handleAIRubrics} className="btn-secondary">✨ AI Generate Rubrics</button>
        {activity.status === 'draft' && (
          <button onClick={handleDelete} className="btn-secondary text-red-600 border-red-300 hover:bg-red-50">
            🗑️ Delete
          </button>
        )}
      </div>

      {/* Conduction Guidelines */}
      <div className="mb-6">
        <ConductionGuidelines activityType={activity.activityType} collapsible />
      </div>

      {/* Custom Guidelines */}
      {activity.guidelines && (
        <div className="bg-blue-50 rounded-xl p-5 mb-6">
          <h3 className="font-semibold text-blue-900 mb-2">📋 Guidelines</h3>
          <pre className="text-sm text-blue-800 whitespace-pre-wrap">{activity.guidelines}</pre>
        </div>
      )}

      {/* Rubric Editor */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <h2 className="text-lg font-semibold mb-4">Rubrics ({rubrics.length})</h2>
        <RubricEditor
          activityId={id}
          rubrics={rubrics}
          isLocked={activity.status !== 'draft'}
          onRefresh={load}
        />
      </div>
    </div>
  );
}

function Spinner() {
  return <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto" />;
}
