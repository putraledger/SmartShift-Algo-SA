import { useState, useEffect } from 'react'
import axios from 'axios'
import Sidebar from '../components/Sidebar'
import { motion, AnimatePresence } from 'framer-motion'
import { Clock, Edit, Trash2, Plus, Save, X } from 'lucide-react'
import Swal from 'sweetalert2'

export default function AdminShift() {
  const [shifts, setShifts] = useState([])
  const [namaShift, setNamaShift] = useState('')
  const [jamMulai, setJamMulai] = useState('')
  const [jamSelesai, setJamSelesai] = useState('')
  const [editId, setEditId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [prosesSimpan, setProsesSimpan] = useState(false)

  const ambilShift = async () => {
    try {
      const response = await axios.get('http://localhost:8000/shift/')
      setShifts(response.data)
      // Debug kecil untuk melihat struktur data asli dari Python di console browser
      console.log("Data Shift dari Backend:", response.data)
    } catch (error) {
      console.error("Gagal menarik data shift", error)
    }
    setLoading(false)
  }

  useEffect(() => { ambilShift() }, [])

  // FUNGSI PINTAR: Mendeteksi otomatis kolom jam di database secara dinamis
  const deteksiWaktuTersimpan = (shiftObj) => {
    // Cari properti apa pun yang nilainya berupa string dan mengandung format jam (: atau -)
    for (let key in shiftObj) {
      if (key !== 'nama' && key !== 'nama_shift' && typeof shiftObj[key] === 'string') {
        if (shiftObj[key].includes(':') || shiftObj[key].includes('-')) {
          return shiftObj[key]
        }
      }
    }
    return shiftObj.jam || shiftObj.waktu || null
  }

  const handleSimpan = async (e) => {
    e.preventDefault()
    if (!jamMulai || !jamSelesai) {
      Swal.fire('Peringatan', 'Mohon lengkapi Jam Mulai dan Jam Selesai!', 'warning')
      return
    }

    setProsesSimpan(true)
    const rentangWaktu = `${jamMulai} - ${jamSelesai}`

    try {
      // Kita kirim ke beberapa kemungkinan nama kolom sekaligus agar pasti tersimpan
      const payload = { 
        nama_shift: namaShift, 
        jam: rentangWaktu,
        waktu: rentangWaktu,
        jam_kerja: rentangWaktu
      }

      if (editId) {
        await axios.put(`http://localhost:8000/shift/${editId}`, payload)
        Swal.fire('Diperbarui', 'Data shift berhasil diubah.', 'success')
      } else {
        await axios.post('http://localhost:8000/shift/', payload)
        Swal.fire('Berhasil', 'Shift baru berhasil ditambahkan.', 'success')
      }
      resetForm()
      ambilShift()
    } catch (error) {
      Swal.fire('Gagal', 'Terjadi kesalahan pada sistem.', 'error')
    }
    setProsesSimpan(false)
  }

  const handleHapus = (id) => {
    Swal.fire({
      title: 'Hapus Shift?',
      text: "Data yang dihapus tidak bisa dikembalikan!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Ya, Hapus'
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await axios.delete(`http://localhost:8000/shift/${id}`)
          Swal.fire('Terhapus!', 'Shift berhasil dihapus.', 'success')
          ambilShift()
        } catch (error) {
          Swal.fire('Gagal', 'Sistem gagal menghapus data.', 'error')
        }
      }
    })
  }

  const klikEdit = (shift) => {
    setEditId(shift.id)
    setNamaShift(shift.nama_shift || shift.nama || '')
    
    const waktuTersimpan = deteksiWaktuTersimpan(shift) || ''
    
    if (waktuTersimpan.includes('-')) {
      const parts = waktuTersimpan.split('-')
      setJamMulai(parts[0].trim())
      setJamSelesai(parts[1].trim())
    } else {
      setJamMulai('')
      setJamSelesai('')
    }
  }

  const resetForm = () => {
    setEditId(null)
    setNamaShift('')
    setJamMulai('')
    setJamSelesai('')
  }

  return (
    <div style={{ display: 'flex' }}>
      <Sidebar />
      <div style={{ marginLeft: '260px', padding: '40px', width: 'calc(100% - 260px)', backgroundColor: '#f8fafc', minHeight: '100vh', display: 'flex', gap: '30px', boxSizing: 'border-box' }}>
        
        <div style={{ flex: '1' }}>
          <div style={{ marginBottom: '30px' }}>
            <h1 style={{ color: '#1e293b', fontSize: '26px', fontWeight: 'bold', margin: '0 0 6px 0' }}>Manajemen Shift</h1>
            <p style={{ color: '#64748b', margin: 0, fontSize: '14px' }}>Atur jam kerja operasional lapangan.</p>
          </div>

          <form onSubmit={handleSimpan} style={{ backgroundColor: 'white', padding: '24px', borderRadius: '16px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '16px', position: 'relative' }}>
            {editId && (
              <div style={{ position: 'absolute', top: '-10px', right: '20px', backgroundColor: '#f59e0b', color: 'white', padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '700' }}>Mode Edit Aktif</div>
            )}
            
            <div>
              <label style={labelStyle}>Nama Shift</label>
              <input type="text" placeholder="Contoh: Pagi, Siang, Malam" value={namaShift} onChange={(e) => setNamaShift(e.target.value)} required style={inputStyle} />
            </div>
            
            <div style={{ display: 'flex', gap: '16px' }}>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>Jam Mulai</label>
                <input type="time" value={jamMulai} onChange={(e) => setJamMulai(e.target.value)} required style={inputStyle} />
              </div>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>Jam Selesai</label>
                <input type="time" value={jamSelesai} onChange={(e) => setJamSelesai(e.target.value)} required style={inputStyle} />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
              <button type="submit" disabled={prosesSimpan} style={{ flex: 1, padding: '14px', backgroundColor: editId ? '#10b981' : '#3b82f6', color: 'white', border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                {editId ? <Save size={18} /> : <Plus size={18} />} 
                {prosesSimpan ? 'Menyimpan...' : (editId ? 'Perbarui Shift' : 'Tambah Shift')}
              </button>
              
              {editId && (
                <button type="button" onClick={resetForm} style={{ padding: '14px', backgroundColor: '#f1f5f9', color: '#64748b', border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <X size={18} /> Batal
                </button>
              )}
            </div>
          </form>
        </div>

        <div style={{ flex: '1.5' }}>
          <h2 style={{ fontSize: '18px', color: '#1e293b', marginBottom: '20px' }}>Daftar Shift Tersedia</h2>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <AnimatePresence>
              {loading ? (
                [1, 2, 3].map((i) => <div key={i} style={{ height: '70px', backgroundColor: '#e2e8f0', borderRadius: '14px', animation: 'pulse 1.5s infinite' }} />)
              ) : (
                shifts.map((s, idx) => (
                  <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ delay: idx * 0.04 }} key={s.id} style={{ backgroundColor: 'white', padding: '16px 20px', borderRadius: '14px', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                      <div style={{ backgroundColor: '#eff6ff', padding: '12px', borderRadius: '12px', color: '#3b82f6' }}>
                        <Clock size={20} />
                      </div>
                      <div>
                        <h4 style={{ margin: 0, fontSize: '16px', color: '#1e293b', fontWeight: '700' }}>
                          Shift {s.nama_shift || s.nama || 'Tanpa Nama'}
                        </h4>
                        <p style={{ margin: 0, fontSize: '13px', color: '#64748b', fontWeight: '600' }}>
                          {/* Menggunakan fungsi Auto-Detect cerdas */}
                          {deteksiWaktuTersimpan(s) || 'Waktu belum diatur'}
                        </p>
                      </div>
                    </div>
                    
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <motion.button whileHover={{ scale: 1.1, color: '#f59e0b' }} whileTap={{ scale: 0.9 }} onClick={() => klikEdit(s)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '6px' }}>
                        <Edit size={18} />
                      </motion.button>
                      <motion.button whileHover={{ scale: 1.1, color: '#ef4444' }} whileTap={{ scale: 0.9 }} onClick={() => handleHapus(s.id)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '6px' }}>
                        <Trash2 size={18} />
                      </motion.button>
                    </div>
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