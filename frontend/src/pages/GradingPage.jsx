// ==========================================
// Grading Page — AG Grid based fast grading
// ==========================================

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { AgGridReact } from 'ag-grid-react';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';
import api from '../api/axios';
import toast from 'react-hot-toast';

export default function GradingPage() {
  const { activityId } = useParams();
  const [activity, setActivity] = useState(null);
  const [rubrics, setRubrics] = useState([]);
  const [rowData, setRowData] = useState([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => { loadGrid(); }, [activityId]);

  const loadGrid = async () => {
    try {
      const { data } = await api.get(`/scores/activity/${activityId}`);
      setActivity(data.activity);
      setRubrics(data.rubrics);

      // Transform grid data for AG Grid
      const rows = data.grid.map((row) => {
        const r = {
          studentId: row.student._id,
          rollNo: row.student.rollNo,
          name: row.student.name,
          activityScore: row.activityScore,
        };
        row.rubricScores.forEach((rs) => {
          r[`rubric_${rs.rubricId}`] = rs.score;
        });
        return r;
      });
      setRowData(rows);
    } catch (err) {
      toast.error('Failed to load grading data');
    }
  };

  // Column definitions
  const columnDefs = useMemo(() => {
    const cols = [
      {
        headerName: 'Roll No',
        field: 'rollNo',
        pinned: 'left',
        width: 110,
        sortable: true,
        filter: true,
      },
      {
        headerName: 'Name',
        field: 'name',
        pinned: 'left',
        width: 180,
        sortable: true,
        filter: true,
      },
    ];

    rubrics.forEach((rub) => {
      cols.push({
        headerName: rub.name,
        field: `rubric_${rub._id}`,
        width: 120,
        editable: activity?.status !== 'locked',
        cellEditor: 'agSelectCellEditor',
        cellEditorParams: { values: [1, 2, 3, 4, 5] },
        cellStyle: (params) => {
          if (!params.value) return { backgroundColor: '#fef9c3' }; // ungraded
          if (params.value >= 4) return { backgroundColor: '#dcfce7', color: '#166534' };
          if (params.value <= 2) return { backgroundColor: '#fee2e2', color: '#991b1b' };
          return {};
        },
        headerTooltip: `${rub.criteria?.scale1 || ''} → ${rub.criteria?.scale5 || ''}`,
      });
    });

    cols.push({
      headerName: `Score (/${activity?.totalMarks || 0})`,
      field: 'activityScore',
      pinned: 'right',
      width: 130,
      cellStyle: { fontWeight: 'bold', backgroundColor: '#f0f9ff' },
    });

    return cols;
  }, [rubrics, activity]);

  const defaultColDef = useMemo(() => ({
    resizable: true,
    suppressMovable: true,
  }), []);

  // Collect all edits and save in bulk
  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      const scores = [];
      rowData.forEach((row) => {
        rubrics.forEach((rub) => {
          const val = row[`rubric_${rub._id}`];
          if (val && val >= 1 && val <= 5) {
            scores.push({
              studentId: row.studentId,
              rubricId: rub._id,
              score: parseInt(val),
            });
          }
        });
      });

      await api.post('/scores/bulk', { activityId, scores });
      toast.success(`Saved ${scores.length} scores!`);
      loadGrid(); // Refresh to recalculate
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  }, [rowData, rubrics, activityId]);

  const onCellValueChanged = useCallback((event) => {
    // Update local state for the changed cell
    setRowData((prev) => {
      const updated = [...prev];
      const idx = updated.findIndex((r) => r.studentId === event.data.studentId);
      if (idx >= 0) {
        updated[idx] = { ...event.data };
        // Recalculate activity score
        let sum = 0;
        let count = 0;
        rubrics.forEach((rub) => {
          const val = updated[idx][`rubric_${rub._id}`];
          if (val) { sum += parseInt(val); count++; }
        });
        const maxRubric = rubrics.length * 5;
        updated[idx].activityScore = maxRubric > 0
          ? Math.round(((sum / maxRubric) * (activity?.totalMarks || 0)) * 100) / 100
          : 0;
      }
      return updated;
    });
  }, [rubrics, activity]);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold">Grading: {activity?.name}</h1>
          <p className="text-gray-500 text-sm mt-1">
            {activity?.activityType} • {activity?.subject?.name} • {rubrics.length} rubrics • Score 1-5 per rubric
          </p>
        </div>
        <div className="flex gap-3">
          <Link to={`/activities/${activityId}`} className="btn-secondary">← Back</Link>
          <button onClick={handleSave} disabled={saving || activity?.status === 'locked'} className="btn-primary">
            {saving ? '💾 Saving...' : '💾 Save All Scores'}
          </button>
        </div>
      </div>

      {activity?.status === 'locked' && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4 text-sm text-red-700">
          ⚠️ This activity is locked. Scores are read-only. Request admin to unlock.
        </div>
      )}

      <div className="ag-theme-alpine" style={{ height: 'calc(100vh - 200px)', width: '100%' }}>
        <AgGridReact
          rowData={rowData}
          columnDefs={columnDefs}
          defaultColDef={defaultColDef}
          onCellValueChanged={onCellValueChanged}
          animateRows={true}
          enableCellTextSelection={true}
          stopEditingWhenCellsLoseFocus={true}
          singleClickEdit={true}
        />
      </div>
    </div>
  );
}
