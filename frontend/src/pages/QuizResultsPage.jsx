// ==========================================
// Quiz Results Page — Faculty views quiz submissions
// ==========================================
// Shows all submissions, per-question breakdown,
// faculty override capability, and CIE sync controls.

import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api/axios';
import toast from 'react-hot-toast';
import Modal from '../components/Modal';

export default function QuizResultsPage() {
  const { activityId } = useParams();
  const [submissions, setSubmissions] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [summary, setSummary] = useState({});
  const [activity, setActivity] = useState(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [breakdown, setBreakdown] = useState([]);
  const [showDetail, setShowDetail] = useState(false);

  useEffect(() => { loadData(); }, [activityId]);

  const loadData = async () => {
    try {
      const [subRes, actRes] = await Promise.all([
        api.get(`/quiz/submissions/${activityId}`),
        api.get(`/activities/${activityId}`),
      ]);
      setSubmissions(subRes.data.submissions);
      setQuestions(subRes.data.questions);
      setSummary(subRes.data.summary);
      setActivity(actRes.data.activity);
    } catch (err) {
      toast.error('Failed to load results');
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetail = async (submissionId) => {
    try {
      const { data } = await api.get(`/quiz/submissions/detail/${submissionId}`);
      setSelectedSubmission(data.submission);
      setBreakdown(data.breakdown);
      setShowDetail(true);
    } catch (err) {
      toast.error('Failed to load submission details');
    }
  };

  const handleOverrideScore = async (answerId, maxMarks) => {
    const input = prompt(`Enter new marks (0 to ${maxMarks}):`);
    if (input === null) return;
    const marks = parseFloat(input);
    if (isNaN(marks) || marks < 0 || marks > maxMarks) {
      return toast.error(`Invalid marks. Must be between 0 and ${maxMarks}.`);
    }

    try {
      const { data } = await api.patch(`/quiz/submissions/${selectedSubmission._id}/override`, {
        answerId,
        overrideMarks: marks,
      });
      setSelectedSubmission(data.submission);
      toast.success('Score overridden!');
      // Refresh breakdown
      handleViewDetail(selectedSubmission._id);
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error');
    }
  };

  const handleSyncAllToCIE = async () => {
    if (!confirm('Sync all evaluated quiz scores to CIE marks? This will update the grading grid.')) return;
    setSyncing(true);
    try {
      const { data } = await api.post(`/quiz/sync-cie/${activityId}`);
      toast.success(data.message);
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Sync failed');
    } finally {
      setSyncing(false);
    }
  };

  const handleSyncSingle = async (submissionId) => {
    try {
      const { data } = await api.post(`/quiz/sync-cie/single/${submissionId}`);
      if (data.synced) {
        toast.success(`Synced to CIE (Rubric score: ${data.rubricScore}/5)`);
      } else {
        toast.error(data.reason || 'Sync failed');
      }
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Sync failed');
    }
  };

  if (loading) return <div className="text-center py-12"><Spinner /></div>;

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Quiz Results</h1>
          <p className="text-gray-500 mt-1">
            {activity?.name} • {activity?.subject?.name} ({activity?.subject?.code})
          </p>
        </div>
        <div className="flex gap-3">
          <Link to={`/quiz/builder/${activityId}`} className="btn-secondary">← Quiz Builder</Link>
          <Link to={`/activities/${activityId}`} className="btn-secondary">📋 Activity</Link>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl border p-4">
          <p className="text-sm text-gray-500">Total Submissions</p>
          <p className="text-2xl font-bold text-gray-900">{summary.total || 0}</p>
        </div>
        <div className="bg-white rounded-xl border p-4">
          <p className="text-sm text-gray-500">Evaluated</p>
          <p className="text-2xl font-bold text-green-600">{summary.evaluated || 0}</p>
        </div>
        <div className="bg-white rounded-xl border p-4">
          <p className="text-sm text-gray-500">CIE Synced</p>
          <p className="text-2xl font-bold text-primary-600">{summary.cieSynced || 0}</p>
        </div>
        <div className="bg-white rounded-xl border p-4">
          <p className="text-sm text-gray-500">Average Score</p>
          <p className="text-2xl font-bold text-orange-600">{summary.averageScore || 0}%</p>
        </div>
      </div>

      {/* Sync to CIE button */}
      {submissions.length > 0 && (
        <div className="flex gap-3 mb-6">
          <button
            onClick={handleSyncAllToCIE}
            disabled={syncing}
            className="btn-primary"
          >
            {syncing ? '⏳ Syncing...' : '🔄 Sync All to CIE Marks'}
          </button>
          <p className="text-sm text-gray-500 flex items-center">
            Syncs evaluated quiz scores into the CIE grading grid automatically.
          </p>
        </div>
      )}

      {/* Submissions Table */}
      <div className="bg-white rounded-xl border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b">
                <th className="text-left px-4 py-3 font-semibold text-gray-600">#</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Roll No</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Name</th>
                {questions.map((q, idx) => (
                  <th key={q._id} className="text-center px-3 py-3 font-semibold text-gray-600 min-w-[80px]">
                    Q{idx + 1}
                    <span className="block text-xs font-normal text-gray-400">({q.marks}m)</span>
                  </th>
                ))}
                <th className="text-center px-4 py-3 font-semibold text-gray-600">Total</th>
                <th className="text-center px-4 py-3 font-semibold text-gray-600">%</th>
                <th className="text-center px-4 py-3 font-semibold text-gray-600">CIE</th>
                <th className="text-center px-4 py-3 font-semibold text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {submissions.map((sub, idx) => {
                // Build question-answer map
                const answerMap = {};
                sub.answers.forEach(a => { answerMap[a.question?.toString() || a.question] = a; });

                return (
                  <tr key={sub._id} className="border-b hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-500">{idx + 1}</td>
                    <td className="px-4 py-3 font-medium">{sub.rollNo}</td>
                    <td className="px-4 py-3">{sub.studentName}</td>
                    {questions.map((q) => {
                      const ans = answerMap[q._id];
                      const marks = ans?.facultyOverride !== null && ans?.facultyOverride !== undefined
                        ? ans.facultyOverride
                        : ans?.awardedMarks || 0;
                      const maxM = ans?.maxMarks || q.marks;
                      const pct = maxM > 0 ? marks / maxM : 0;

                      return (
                        <td key={q._id} className="text-center px-3 py-3">
                          <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                            pct >= 0.8 ? 'bg-green-100 text-green-700' :
                            pct >= 0.5 ? 'bg-yellow-100 text-yellow-700' :
                            pct > 0 ? 'bg-orange-100 text-orange-700' :
                            'bg-red-100 text-red-700'
                          }`}>
                            {marks}/{maxM}
                          </span>
                        </td>
                      );
                    })}
                    <td className="text-center px-4 py-3 font-bold">
                      {sub.totalMarksObtained}/{sub.totalMarksPossible}
                    </td>
                    <td className="text-center px-4 py-3">
                      <span className={`font-semibold ${
                        sub.percentageScore >= 80 ? 'text-green-600' :
                        sub.percentageScore >= 60 ? 'text-yellow-600' :
                        sub.percentageScore >= 40 ? 'text-orange-600' :
                        'text-red-600'
                      }`}>
                        {sub.percentageScore}%
                      </span>
                    </td>
                    <td className="text-center px-4 py-3">
                      {sub.cieSynced ? (
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">✓ Synced</span>
                      ) : (
                        <button
                          onClick={() => handleSyncSingle(sub._id)}
                          className="text-xs text-primary-600 hover:underline"
                        >
                          Sync
                        </button>
                      )}
                    </td>
                    <td className="text-center px-4 py-3">
                      <button
                        onClick={() => handleViewDetail(sub._id)}
                        className="text-xs text-primary-600 hover:underline"
                      >
                        View Detail
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {submissions.length === 0 && (
          <div className="text-center text-gray-400 py-12">
            No submissions yet. Share the quiz link with students to start receiving responses.
          </div>
        )}
      </div>

      {/* Submission Detail Modal */}
      <Modal show={showDetail} onClose={() => setShowDetail(false)} title={`Submission: ${selectedSubmission?.studentName} (${selectedSubmission?.rollNo})`} wide>
        {selectedSubmission && (
          <div className="space-y-4">
            {/* Summary */}
            <div className="bg-gray-50 rounded-lg p-4 flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">
                  Score: <strong>{selectedSubmission.totalMarksObtained}/{selectedSubmission.totalMarksPossible}</strong>
                  {' '}({selectedSubmission.percentageScore}%)
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  Submitted: {new Date(selectedSubmission.submittedAt).toLocaleString()}
                  {selectedSubmission.evaluatedAt && ` • Evaluated: ${new Date(selectedSubmission.evaluatedAt).toLocaleString()}`}
                </p>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                selectedSubmission.status === 'evaluated' ? 'bg-green-100 text-green-700' :
                selectedSubmission.status === 'reviewed' ? 'bg-blue-100 text-blue-700' :
                'bg-yellow-100 text-yellow-700'
              }`}>
                {selectedSubmission.status}
              </span>
            </div>

            {/* Question-wise breakdown */}
            <div className="space-y-4 max-h-[60vh] overflow-y-auto">
              {breakdown.map((item, idx) => (
                <div key={idx} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="bg-primary-100 text-primary-700 text-xs font-bold px-2 py-1 rounded-full">
                        Q{idx + 1}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded ${
                        item.questionType === 'mcq' ? 'bg-blue-100 text-blue-700' :
                        item.questionType === 'short' ? 'bg-green-100 text-green-700' :
                        'bg-purple-100 text-purple-700'
                      }`}>
                        {item.questionType}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`font-bold text-sm ${
                        item.awardedMarks >= item.maxMarks * 0.8 ? 'text-green-600' :
                        item.awardedMarks > 0 ? 'text-yellow-600' :
                        'text-red-600'
                      }`}>
                        {item.awardedMarks}/{item.maxMarks}
                      </span>
                      <button
                        onClick={() => handleOverrideScore(breakdown[idx]?._id || `answer-${idx}`, item.maxMarks)}
                        className="text-xs text-orange-600 hover:underline"
                        title="Override score"
                      >
                        ✏️ Override
                      </button>
                    </div>
                  </div>

                  <p className="text-sm text-gray-900 mb-2 font-medium">{item.questionText}</p>

                  {/* Student's answer */}
                  <div className="bg-gray-50 rounded-lg p-3 mb-2">
                    <p className="text-xs text-gray-500 mb-1">Student's Answer:</p>
                    {item.questionType === 'mcq' && item.options.length > 0 ? (
                      <div className="space-y-1">
                        {item.options.map((opt, oi) => {
                          const wasSelected = item.selectedOptions?.some(id => id.toString() === opt._id.toString());
                          return (
                            <div key={oi} className={`text-sm flex items-center gap-2 ${
                              wasSelected ? 'font-medium text-primary-700' : 'text-gray-500'
                            }`}>
                              {wasSelected ? '☑' : '☐'} {opt.label}
                              {opt.isCorrect && <span className="text-green-600 text-xs">(correct)</span>}
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">{item.studentAnswer || '(no answer)'}</p>
                    )}
                  </div>

                  {/* Expected answer for short */}
                  {item.questionType === 'short' && item.expectedAnswer && (
                    <div className="bg-green-50 rounded-lg p-2 mb-2 text-xs text-green-700">
                      <strong>Expected keywords:</strong> {item.expectedAnswer}
                    </div>
                  )}

                  {/* Evaluation note */}
                  <p className="text-xs text-gray-500 italic">{item.evaluationNote}</p>
                  {item.hasOverride && (
                    <p className="text-xs text-orange-600 mt-1">⚠️ Faculty override applied</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

function Spinner() {
  return <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto" />;
}
