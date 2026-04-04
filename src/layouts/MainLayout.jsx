import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Header from '../components/Header/Header';
import Sidebar from '../components/Sidebar/Sidebar';
import './MainLayout.css';

const MainLayout = () => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  return (
    <div className={`layout-container ${isSidebarCollapsed ? 'collapsed' : ''} ${!isSidebarCollapsed ? 'mobile-sidebar-open' : ''}`}>
      {/* Mobile overlay */}
      {!isSidebarCollapsed && (
        <div className="mobile-overlay fade-in" onClick={() => setIsSidebarCollapsed(true)}></div>
      )}
      <Sidebar isCollapsed={isSidebarCollapsed} />
      <div className="main-wrapper">
        <Header toggleSidebar={toggleSidebar} isSidebarCollapsed={isSidebarCollapsed} />
        <main className="content-area">
          <div className="content-container fade-in">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
