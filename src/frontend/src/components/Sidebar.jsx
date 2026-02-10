import { Link, useLocation } from 'react-router-dom';

export default function Sidebar({ user, onLogout, darkMode, isOpen, toggleSidebar, profileImage, text }) {
  const location = useLocation();
  const path = location.pathname;

  // Fallback (Jaga-jaga jika prop 'text' belum siap)
  const labels = text || {
     dashboard: 'Dashboard',
     transactions: 'Transactions',
     budget: 'Budgeting',
     forecast: 'AI Forecast',
     profile: 'Profile',
     logout: 'Logout'
  };

  const menus = [
    { name: labels.dashboard, path: '/', icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg> },
    { name: labels.transactions, path: '/transactions', icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg> },
    { name: labels.budget, path: '/budget', icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" /></svg> },
    { name: 'AI Forecast', path: '/forecast', icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg> },
    { name: labels.profile, path: '/profile', icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg> },
  ];

  return (
    <div className={`${isOpen ? 'w-64' : 'w-20'} h-screen fixed left-0 top-0 flex flex-col transition-all duration-300 z-50 overflow-y-auto ${darkMode ? 'bg-slate-900 border-r border-slate-800' : 'bg-blue-600'}`}>
      
      {/* TOMBOL BURGER */}
      <div className={`flex items-center h-16 px-4 shrink-0 ${isOpen ? 'justify-between' : 'justify-center'}`}>
        {isOpen && <span className="text-white font-bold text-xl tracking-wide">DUITKUDW</span>}
        <button onClick={toggleSidebar} className="p-2 rounded-lg text-white hover:bg-white/10 transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>

      {/* PROFILE USER */}
      <div className={`transition-all duration-300 shrink-0 mb-6 ${isOpen ? 'px-6 py-6' : 'px-2 py-6'}`}>
        <Link 
          to="/profile" 
          className={`flex items-center gap-4 ${isOpen ? '' : 'justify-center'} p-2 rounded-xl hover:bg-white/10 transition-colors cursor-pointer group`}
          title="Lihat Profil"
        >
          <div className="w-10 h-10 min-w-[2.5rem] rounded-full bg-white/20 flex items-center justify-center text-white font-bold border-2 border-white/50 overflow-hidden group-hover:border-white transition-colors">
            {profileImage ? (
              <img src={profileImage} alt="User" className="w-full h-full object-cover" />
            ) : (
              <span>{user ? user.charAt(0).toUpperCase() : 'U'}</span>
            )}
          </div>
          <div className={`overflow-hidden transition-all duration-200 ${isOpen ? 'opacity-100 w-auto' : 'opacity-0 w-0 hidden'}`}>
            <h2 className="text-white font-bold truncate whitespace-nowrap">{user || 'User'}</h2>
            <p className="text-blue-100 text-xs truncate opacity-80">Mahasiswa</p>
          </div>
        </Link>
      </div>

      {/* MENU NAVIGASI */}
      <div className="flex-1 px-3 flex flex-col gap-6 overflow-y-auto">
        {menus.map((menu) => {
          const isActive = path === menu.path;
          return (
            <Link 
              to={menu.path} 
              key={menu.name}
              title={!isOpen ? menu.name : ''} 
              className={`flex items-center gap-3 px-3 py-4 rounded-xl transition-all duration-200 font-medium ${
                isActive 
                  ? (darkMode ? 'bg-blue-500 text-white shadow-lg' : 'bg-white text-blue-600 shadow-lg') 
                  : 'text-blue-100 hover:bg-white/10 hover:text-white'
              } ${isOpen ? '' : 'justify-center'}`}
            >
              <div>{menu.icon}</div>
              <span className={`whitespace-nowrap transition-all duration-300 ${isOpen ? 'opacity-100 w-auto' : 'opacity-0 w-0 hidden'}`}>
                {menu.name}
              </span>
            </Link>
          );
        })}
      </div>

      {/* LOGOUT */}
      <div className="p-4 shrink-0 mt-auto">
        <button 
          onClick={onLogout}
          title={labels.logout}
          className={`w-full flex items-center gap-2 px-3 py-4 rounded-xl bg-white/10 text-white hover:bg-red-500 hover:text-white transition-all duration-300 font-medium border border-white/20 ${isOpen ? '' : 'justify-center'}`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 min-w-[1.5rem]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
          <span className={`${isOpen ? 'block' : 'hidden'}`}>{labels.logout}</span>
        </button>
      </div>
      
    </div>
  );
}