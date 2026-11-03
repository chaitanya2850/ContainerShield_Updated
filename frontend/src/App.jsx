import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { SidebarProvider } from './context/SidebarContext';
import AppLayout from './components/layout/AppLayout';
import Dashboard from './pages/Dashboard';
import Containers from './pages/Containers';
import ContainerDetails from './pages/ContainerDetails';
import Images from './pages/Images';
import ImageDetails from './pages/ImageDetails';
import NewScan from './pages/NewScan';
import ScanHistory from './pages/ScanHistory';
import ScanDetails from './pages/ScanDetails';
import SourceScanner from './pages/SourceScanner';
import SourceScanDetails from './pages/SourceScanDetails';
import Assistant from './pages/Assistant';
import Settings from './pages/Settings';
import NotFound from './pages/NotFound';
import RuntimeSecurity from './pages/RuntimeSecurity';
import SecurityAnalysis from './pages/SecurityAnalysis';

export default function App() {
  return (
    <ThemeProvider>
      <SidebarProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<AppLayout />}>
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="containers" element={<Containers />} />
              <Route path="containers/:id" element={<ContainerDetails />} />
              <Route path="runtime-security" element={<RuntimeSecurity />} />
              <Route path="security-analysis" element={<SecurityAnalysis />} />
              <Route path="images" element={<Images />} />
              <Route path="images/:name" element={<ImageDetails />} />
              <Route path="scans/new" element={<NewScan />} />
              <Route path="scans/history" element={<ScanHistory />} />
              <Route path="scans/:id" element={<ScanDetails />} />
              <Route path="source-scan" element={<SourceScanner />} />
              <Route path="source-scan/:id" element={<SourceScanDetails />} />
              <Route path="assistant" element={<Assistant />} />
              <Route path="settings" element={<Settings />} />
              <Route path="*" element={<NotFound />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </SidebarProvider>
    </ThemeProvider>
  );
}
