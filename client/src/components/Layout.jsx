import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';

const Layout = () => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    const toggleSidebar = () => setIsSidebarOpen((prev) => !prev);

    return (
        <div className={`app-layout-wrapper ${isSidebarOpen ? 'sidebar-open' : ''}`}>
            {/* Permanent sidebar for all views */}
            <Sidebar isSidebarOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />

            {/* Overlay for mobile when sidebar is open */}
            <div
                className="sidebar-overlay d-lg-none"
                onClick={isSidebarOpen ? toggleSidebar : undefined}
            />

            {/* Main Content Area */}
            <div className="app-content-wrapper">
                {/* Mobile top bar (hamburger + title) */}
                <div className="content-topbar d-lg-none">
                    <button
                        type="button"
                        className="btn btn-outline-secondary btn-sm me-2"
                        onClick={toggleSidebar}
                    >
                        <span className="content-topbar-icon" />
                    </button>
                    <span className="content-topbar-title">Project PWMS</span>
                </div>

                <main className="main-content py-3 py-md-4">
                    <div className="container-fluid px-3 px-md-4">
                        <Outlet />
                    </div>
                </main>

                <footer className="app-footer mt-auto">
                    <div className="container-fluid px-3 px-md-4 text-center text-md-start">
                        &copy; {new Date().getFullYear()} - Project Workflow Management System.
                    </div>
                </footer>
            </div>
        </div>
    );
};

export default Layout;
