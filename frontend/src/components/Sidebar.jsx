import { useNavigate, useLocation } from 'react-router-dom'
import { LayoutDashboard, CalendarDays, Users, Palmtree, LogOut, Clock } from 'lucide-react'
import { motion } from 'framer-motion'
import Swal from 'sweetalert2'

export default function Sidebar() {
  const navigate = useNavigate()
  const location = useLocation()

  const menuItems = [
    { nama: 'Dashboard', path: '/admin', ikon: <LayoutDashboard size={20} /> },
    { nama: 'Generator Jadwal', path: '/admin/generator', ikon: <CalendarDays size={20} /> },
    { nama: 'Data Karyawan', path: '/admin/karyawan', ikon: <Users size={20} /> },
    { nama: 'Manajemen Shift', path: '/admin/shift', ikon: <Clock size={20} /> },
    { nama: 'Persetujuan Cuti', path: '/admin/cuti', ikon: <Palmtree size={20} /> },
  ]

  // FUNGSI BARU: Konfirmasi sebelum keluar sistem
  const handleLogoutAdmin = () => {
    Swal.fire({
      title: 'Konfirmasi Keluar',
      text: 'Apakah Anda yakin ingin keluar dari akun HRD?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Ya, Keluar',
      cancelButtonText: 'Batal',
      reverseButtons: true
    }).then((result) => {
      if (result.isConfirmed) {
        localStorage.removeItem('user')
        navigate('/login')
      }
    })
  }

  return (
    <div style={{ width: '260px', backgroundColor: '#0f172a', height: '100vh', position: 'fixed', top: 0, left: 0, color: 'white', display: 'flex', flexDirection: 'column', padding: '24px', boxSizing: 'border-box', boxShadow: '4px 0 10px rgba(0,0,0,0.05)' }}>
      
      <div style={{ marginBottom: '40px', paddingLeft: '8px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 'bold', margin: 0, letterSpacing: '1px' }}>SMARTSHIFT <span style={{ color: '#3b82f6' }}>AI</span></h2>
        <p style={{ margin: '4px 0 0 0', fontSize: '11px', color: '#475569' }}>Panel Kendali Manajemen</p>
      </div>

      <nav style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
        {menuItems.map((item) => {
          const aktif = location.pathname === item.path
          return (
            <motion.button
              key={item.path}
              whileHover={{ x: 4, backgroundColor: aktif ? '#3b82f6' : 'rgba(255,255,255,0.05)' }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate(item.path)}
              style={{
                display: 'flex', alignItems: 'center', gap: '12px', width: '100%', padding: '14px 16px', borderRadius: '12px', border: 'none', cursor: 'pointer', fontSize: '14px', fontWeight: '600', transition: 'all 0.2s',
                backgroundColor: aktif ? '#3b82f6' : 'transparent',
                color: aktif ? 'white' : '#94a3b8'
              }}
            >
              {item.ikon}
              <span>{item.nama}</span>
            </motion.button>
          )
        })}
      </nav>

      <motion.button
        whileHover={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }}
        whileTap={{ scale: 0.98 }}
        onClick={handleLogoutAdmin}
        style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '100%', padding: '14px 16px', borderRadius: '12px', border: 'none', backgroundColor: 'transparent', color: '#94a3b8', cursor: 'pointer', fontSize: '14px', fontWeight: '600', marginTop: 'auto' }}
      >
        <LogOut size={20} />
        <span>Keluar (Logout)</span>
      </motion.button>
    </div>
  )
}