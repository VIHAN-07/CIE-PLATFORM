// ==========================================
// MainLayout — Sidebar + Content area
// ==========================================

import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  HiOutlineHome,
  HiOutlineAcademicCap,
  HiOutlineUserGroup,
  HiOutlineBookOpen,
  HiOutlineClipboardList,
  HiOutlineChartBar,
  HiOutlineCog,
  HiOutlineLogout,
  HiOutlineSparkles,
  HiOutlineTemplate,
  HiOutlineUsers,
  HiOutlineCollection,
} from 'react-icons/hi';

const navItemClass = ({ isActive }) =>
  `flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
    isActive
      ? 'bg-primary-600 text-white shadow-md'
      : 'text-gray-300 hover:bg-gray-700 hover:text-white'
  }`;

export default function MainLayout() {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-900 flex flex-col flex-shrink-0">
        {/* Logo */}
        <div className="px-5 py-5 border-b border-gray-700">
          <h1 className="text-lg font-bold text-white">PICT CIE Platform</h1>
          <p className="text-xs text-gray-400 mt-1">Smart Evaluation System</p>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          <NavLink to="/" end className={navItemClass}>
            <HiOutlineHome className="w-5 h-5" /> Dashboard
          </NavLink>

          {isAdmin && (
            <>
              <p className="px-4 pt-4 pb-1 text-xs text-gray-500 uppercase tracking-wider">Admin</p>
              <NavLink to="/academic-years" className={navItemClass}>
                <HiOutlineAcademicCap className="w-5 h-5" /> Academic Years
              </NavLink>
              <NavLink to="/classes" className={navItemClass}>
                <HiOutlineCollection className="w-5 h-5" /> Classes
              </NavLink>
              <NavLink to="/users" className={navItemClass}>
                <HiOutlineUsers className="w-5 h-5" /> Users
              </NavLink>
              <NavLink to="/templates" className={navItemClass}>
                <HiOutlineTemplate className="w-5 h-5" /> Templates
              </NavLink>
            </>
          )}

          <p className="px-4 pt-4 pb-1 text-xs text-gray-500 uppercase tracking-wider">Academics</p>
          <NavLink to="/subjects" className={navItemClass}>
            <HiOutlineBookOpen className="w-5 h-5" /> Subjects
          </NavLink>
          <NavLink to="/students" className={navItemClass}>
            <HiOutlineUserGroup className="w-5 h-5" /> Students
          </NavLink>
          <NavLink to="/activities" className={navItemClass}>
            <HiOutlineClipboardList className="w-5 h-5" /> Activities
          </NavLink>

          <p className="px-4 pt-4 pb-1 text-xs text-gray-500 uppercase tracking-wider">Tools</p>
          <NavLink to="/ai-tools" className={navItemClass}>
            <HiOutlineSparkles className="w-5 h-5" /> AI Tools
          </NavLink>
        </nav>

        {/* User info */}
        <div className="p-4 border-t border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-primary-600 flex items-center justify-center text-white font-bold text-sm">
              {user?.name?.charAt(0)?.toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-white truncate">{user?.name}</p>
              <p className="text-xs text-gray-400 capitalize">{user?.role}</p>
            </div>
            <button onClick={handleLogout} className="text-gray-400 hover:text-red-400 transition-colors">
              <HiOutlineLogout className="w-5 h-5" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto bg-gray-50">
        <div className="p-6 max-w-7xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
