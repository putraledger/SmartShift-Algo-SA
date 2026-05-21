import { useState, useEffect } from 'react'
import axios from 'axios'
import Sidebar from '../components/Sidebar'
import { motion, AnimatePresence } from 'framer-motion'
import { Check, X, Calendar, AlertCircle } from 'lucide-react'
import Swal from 'sweetalert2'

export default function AdminCuti() {
  const [permohonan, setPermohonan] = useState([])
  const [loading, setLoading] = useState(true)

  const ambilCuti = async () => {
    try {
      const response = await axios.get('http://localhost:8000/cuti/')
      setPermohonan(response.data)
    } catch (error) {
      console.error("Gagal memuat permohonan cuti", error)
    }
    setLoading(false)
  }

  useEffect(() => { ambilCuti() }, [])

  const handleKeputusan = async (id, status) => {
    try {
      await axios.put(`http://localhost:8000/cuti/${id}?status=${status}`)
      Swal.fire('Selesai!', `Permohonan cuti karyawan telah di-${status}.`, 'success')
      ambilCuti()
    } catch (error) {
      Swal.fire('Gagal', 'Terjadi kesalahan sistem saat memproses permohonan.', 'error')
    }
  }

  return (
    <div style={{ display: 'flex' }}>
      <Sidebar />
      <div style={{ marginLeft: '260px', padding: '40px', width: 'calc(100% - 260px)', backgroundColor: '#f8fafc', minHeight: '100vh', boxSizing: 'border-box' }}>
        
        <div style={{ marginBottom: '40px' }}>
          <h1 style={{ color: '#1e293b', fontSize: '28px', fontWeight: 'bold', marginBottom: '8px' }}>Log & Persetujuan Cuti</h1>
          <p style={{ color: '#64748b', margin: 0, fontSize: '16px' }}>Tinjau, setujui, atau tolak permohonan cuti lapangan karyawan secara terpusat.</p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <AnimatePresence>
            {loading ? (
              [1, 2].map((i) => <div key={i} style={{ height: '80px', backgroundColor: '#e2e8f0', borderRadius: '16px', animation: 'pulse 1.5s infinite' }} />)
            ) : permohonan.length > 0 ? (
              permohonan.map((c, idx) => (
                <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ delay: idx * 0.05 }} key={c.id} style={{ backgroundColor: 'white', padding: '20px 24px', borderRadius: '16px', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 4px 6px rgba(0,0,0,0.01)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ backgroundColor: '#fef3c7', padding: '12px', borderRadius: '14px', color: '#d97706' }}><Calendar size={22} /></div>
                    <div>
                      <h3 style={{ margin: '0 0 4px 0', fontSize: '16px', color: '#1e293b', fontWeight: '700' }}>{c.nama_karyawan}</h3>
                      <p style={{ margin: '0 0 4px 0', fontSize: '13px', color: '#475569', fontWeight: '600' }}>Tanggal Libur: {c.tanggal_izin}</p>
                      <p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>Alasan: <i>"{c.alasan}"</i></p>
                    </div>
                  </div>

                  {c.status_izin === 'Pending' ? (
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => handleKeputusan(c.id, 'Approved')} style={{ ...actionBtnStyle, backgroundColor: '#10b981' }}><Check size={16} /> Izinkan</motion.button>
                      <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => handleKeputusan(c.id, 'Rejected')} style={{ ...actionBtnStyle, backgroundColor: '#ef4444' }}><X size={16} /> Tolak</motion.button>
                    </div>
                  ) : (
                    <span style={{ padding: '6px 14px', borderRadius: '20px', fontSize: '12px', fontWeight: '700', backgroundColor: c.status_izin === 'Approved' ? '#d1fae5' : '#fee2e2', color: c.status_izin === 'Approved' ? '#059669' : '#dc2626' }}>
                      {c.status_izin === 'Approved' ? 'Telah Diizinkan' : 'Ditolak HRD'}
                    </span>
                  )}
                </motion.div>
              ))
            ) : (
              <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8', backgroundColor: 'white', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                <AlertCircle size={32} style={{ margin: '0 auto 10px auto', display: 'block', color: '#cbd5e1' }} />
                Kotak permohonan kosong. Belum ada pengajuan cuti masuk minggu ini.
              </div>
            )}
          </AnimatePresence>
        </div>

      </div>
    </div>
  )
}

const actionBtnStyle = { padding: '8px 16px', color: 'white', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }