import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'

// Import Pages
import Login from './pages/Login'
import AdminDashboard from './pages/AdminDashboard'
import AdminGenerator from './pages/AdminGenerator'
import AdminKaryawan from './pages/AdminKaryawan'
import AdminCuti from './pages/AdminCuti'
import KaryawanDashboard from './pages/KaryawanDashboard'
import AdminShift from './pages/AdminShift'

// KOMPONEN: Splash Screen & Wrapper Transisi
const PageWrapper = ({ children }) => (
  <motion.div
    initial={{ opacity: 0, x: 20 }}
    animate={{ opacity: 1, x: 0 }}
    exit={{ opacity: 0, x: -20 }}
    transition={{ duration: 0.4, ease: "easeInOut" }}
  >
    {children}
  </motion.div>
);

const SplashScreen = () => (
  <motion.div 
    initial={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    transition={{ duration: 1 }}
    style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: '#0f172a', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}
  >
    <motion.div
      animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
      transition={{ repeat: Infinity, duration: 2 }}
      style={{ width: '80px', height: '80px', borderRadius: '20px', background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)', marginBottom: '20px', boxShadow: '0 0 30px rgba(59, 130, 246, 0.5)' }}
    />
    <h1 style={{ color: 'white', fontSize: '24px', fontWeight: 'bold', letterSpacing: '2px' }}>SMARTSHIFT <span style={{color: '#3b82f6'}}>AI</span></h1>
    <p style={{ color: '#64748b', fontSize: '12px', marginTop: '10px' }}>Management Enterprise Edition</p>
  </motion.div>
);

function AnimatedRoutes() {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/login" element={<PageWrapper><Login /></PageWrapper>} />
        <Route path="/admin" element={<PageWrapper><AdminDashboard /></PageWrapper>} />
        <Route path="/admin/generator" element={<PageWrapper><AdminGenerator /></PageWrapper>} />
        <Route path="/admin/karyawan" element={<PageWrapper><AdminKaryawan /></PageWrapper>} />
        <Route path="/admin/cuti" element={<PageWrapper><AdminCuti /></PageWrapper>} />
        <Route path="/karyawan" element={<PageWrapper><KaryawanDashboard /></PageWrapper>} />
        <Route path="*" element={<Navigate to="/login" />} />
        <Route path="/admin/shift" element={<PageWrapper><AdminShift /></PageWrapper>} />
      </Routes>
    </AnimatePresence>
  );
}

export default function App() {
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    // Splash screen muncul 2 detik saja saat aplikasi pertama dibuka
    const timer = setTimeout(() => setShowSplash(false), 2000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <Router>
      <AnimatePresence>
        {showSplash && <SplashScreen />}
      </AnimatePresence>
      {!showSplash && <AnimatedRoutes />}
    </Router>
  );
}