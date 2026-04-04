import React, { useState } from 'react';
import Header from '../components/Header/Header';
import Sidebar from '../components/Sidebar/Sidebar';

const Nav = () => {
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

    const toggleSidebar = () => {
        setIsSidebarCollapsed(!isSidebarCollapsed);
    };

    return (
        <>
            <Header toggleSidebar={toggleSidebar} isSidebarCollapsed={isSidebarCollapsed} />
            <Sidebar isCollapsed={isSidebarCollapsed} />
        </>
    );
};

export default Nav;
