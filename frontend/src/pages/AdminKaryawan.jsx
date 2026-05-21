import { useState, useEffect } from 'react'
import axios from 'axios'
import Sidebar from '../components/Sidebar'
import { motion, AnimatePresence } from 'framer-motion'
import { UserPlus, Trash2, ShieldCheck, User } from 'lucide-react'
import Swal from 'sweetalert2'

export default function AdminKaryawan() {
  const [karyawan, setKaryawan] = useState([])
  const [nama, setNama] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState('Karyawan')
  const [loading, setLoading] = useState(true)

  const ambilKaryawan = async () => {
    try {
      const response = await axios.get('http://localhost:8000/karyawan/')
      setKaryawan(response.data)
    } catch (error) {
      console.error("Gagal menarik data", error)
    }
    setLoading(false)
  }

  useEffect(() => { ambilKaryawan() }, [])

  const handleTambah = async (e) => {
    e.preventDefault()
    try {
      await axios.post('http://localhost:8000/karyawan/', { nama, username, password, role })
      Swal.fire('Berhasil', 'Akun Karyawan Berhasil Didaftarkan.', 'success')
      setNama(''); setUsername(''); setPassword(''); setRole('Karyawan')
      ambilKaryawan()
    } catch (error) {
      Swal.fire('Gagal', 'Username sudah terpakai di sistem.', 'error')
    }
  }

  const handleHapus = async (id) => {
    Swal.fire({
      title: 'Hapus Karyawan?',
      text: "Seluruh riwayat presensi karyawan ini juga akan dihapus permanen!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Ya, Hapus'
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await axios.delete(`http://localhost:8000/karyawan/${id}`)
          Swal.fire('Terhapus!', 'Data berhasil dibersihkan dari sistem.', 'success')
          ambilKaryawan()
        } catch (error) {
          Swal.fire('Gagal', 'Sistem gagal menghapus data.', 'error')
        }
      }
    })
  }

  return (
    <div style={{ display: 'flex' }}>
      <Sidebar />
      <div style={{ marginLeft: '260px', padding: '40px', width: 'calc(100% - 260px)', backgroundColor: '#f8fafc', minHeight: '100vh', display: 'flex', gap: '30px', boxSizing: 'border-box' }}>
        
        {/* FORM REGISTRASI */}
        <div style={{ flex: '1' }}>
          <div style={{ marginBottom: '30px' }}>
            <h1 style={{ color: '#1e293b', fontSize: '26px', fontWeight: 'bold', margin: '0 0 6px 0' }}>Registrasi Staf</h1>
            <p style={{ color: '#64748b', margin: 0, fontSize: '14px' }}>Daftarkan akun karyawan atau otoritas HRD baru.</p>
          </div>

          <form onSubmit={handleTambah} style={{ backgroundColor: 'white', padding: '24px', borderRadius: '16px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={labelStyle}>Nama Lengkap</label>
              <input type="text" value={nama} onChange={(e) => setNama(e.target.value)} required style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Username Akses</label>
              <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} required style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Sandi Kunci (Password)</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Hak Akses Otoritas</label>
              <select value={role} onChange={(e) => setRole(e.target.value)} style={inputStyle}>
                <option value="Karyawan">Karyawan Lapangan</option>
                <option value="Admin">HRD / Administrator</option>
              </select>
            </div>
            <button type="submit" style={{ padding: '14px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '10px', fontSize: '15px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginTop: '10px' }}>
              <UserPlus size={18} /> Daftarkan Karyawan
            </button>
          </form>
        </div>

        {/* LIST KARYAWAN DENGAN SKELETON & ANIMASI CASCADE */}
        <div style={{ flex: '1.5' }}>
          <h2 style={{ fontSize: '18px', color: '#1e293b', marginBottom: '20px' }}>Database Karyawan Aktif</h2>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <AnimatePresence>
              {loading ? (
                [1, 2, 3].map((i) => <div key={i} style={{ height: '70px', backgroundColor: '#e2e8f0', borderRadius: '14px', animation: 'pulse 1.5s infinite' }} />)
              ) : (
                karyawan.map((k, idx) => (
                  <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ delay: idx * 0.04 }} key={k.id} style={{ backgroundColor: 'white', padding: '16px 20px', borderRadius: '14px', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ backgroundColor: k.role === 'Admin' ? '#f3e8ff' : '#eff6ff', padding: '10px', borderRadius: '12px', color: k.role === 'Admin' ? '#8b5cf6' : '#3b82f6' }}>
                        {k.role === 'Admin' ? <ShieldCheck size={20} /> : <User size={20} />}
                      </div>
                      <div>
                        <h4 style={{ margin: 0, fontSize: '15px', color: '#1e293b', fontWeight: '700' }}>{k.nama}</h4>
                        <p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>User: @{k.username} | Role: {k.role}</p>
                      </div>
                    </div>
                    <motion.button whileHover={{ scale: 1.1, color: '#ef4444' }} whileTap={{ scale: 0.9 }} onClick={() => handleHapus(k.id)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
                      <Trash2 size={18} />
                    </motion.button>
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </div>
        </div>

      </div>
    </div>
  )
}

const labelStyle = { display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '600', color: '#475569' }
const inputStyle = { width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #cbd5e1', outline: 'none', fontSize: '14px', boxSizing: 'border-box' }