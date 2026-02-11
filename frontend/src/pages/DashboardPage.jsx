// ==========================================
// Dashboard Page
// ==========================================

import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import {
  HiOutlineUserGroup,
  HiOutlineBookOpen,
  HiOutlineClipboardList,
  HiOutlineAcademicCap,
} from 'react-icons/hi';

function StatCard({ title, value, icon: Icon, color }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex items-center gap-4">
      <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${color}`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
      <div>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        <p className="text-sm text-gray-500">{title}</p>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { user, isAdmin } = useAuth();
  const [stats, setStats] = useState(null);
  const [subjects, setSubjects] = useState([]);
  const [activities, setActivities] = useState([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      if (isAdmin) {
        const { data } = await api.get('/admin/stats');
        setStats(data);
      }
      const { data: subData } = await api.get('/subjects');
      setSubjects(subData);
      const { data: actData } = await api.get('/activities');
      setActivities(actData.slice(0, 10)); // latest 10
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Welcome, {user?.name}!</h1>
        <p className="text-gray-500 mt-1">
          {isAdmin ? 'Admin Dashboard' : 'Faculty Dashboard'} — CIE Evaluation Platform
        </p>
      </div>

      {/* Admin Stats */}
      {isAdmin && stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard title="Faculty" value={stats.totalFaculty} icon={HiOutlineUserGroup} color="bg-blue-500" />
          <StatCard title="Subjects" value={stats.totalSubjects} icon={HiOutlineBookOpen} color="bg-green-500" />
          <StatCard title="Students" value={stats.totalStudents} icon={HiOutlineAcademicCap} color="bg-purple-500" />
          <StatCard title="Activities" value={stats.totalActivities} icon={HiOutlineClipboardList} color="bg-orange-500" />
        </div>
      )}

      {/* Quick Links */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* My Subjects */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            {isAdmin ? 'All Subjects' : 'My Subjects'}
          </h2>
          {subjects.length === 0 ? (
            <p className="text-gray-400 text-sm">No subjects found.</p>
          ) : (
            <div className="space-y-2">
              {subjects.map((s) => (
                <Link
                  key={s._id}
                  to={`/results/${s._id}`}
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition border border-gray-50"
                >
                  <div>
                    <p className="font-medium text-gray-900">{s.name}</p>
                    <p className="text-xs text-gray-500">{s.code} • {s.class?.name}</p>
                  </div>
                  <span className="text-xs bg-primary-100 text-primary-700 px-2 py-1 rounded-full">
                    {s.faculty?.name}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Recent Activities */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Activities</h2>
          {activities.length === 0 ? (
            <p className="text-gray-400 text-sm">No activities yet.</p>
          ) : (
            <div className="space-y-2">
              {activities.map((a) => (
                <Link
                  key={a._id}
                  to={`/activities/${a._id}`}
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition border border-gray-50"
                >
                  <div>
                    <p className="font-medium text-gray-900">{a.name}</p>
                    <p className="text-xs text-gray-500">{a.activityType} • {a.subject?.name}</p>
                  </div>
                  <span
                    className={`text-xs px-2 py-1 rounded-full ${
                      a.status === 'draft'
                        ? 'bg-yellow-100 text-yellow-700'
                        : a.status === 'submitted'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-red-100 text-red-700'
                    }`}
                  >
                    {a.status}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
