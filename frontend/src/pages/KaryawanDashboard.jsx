import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { motion, AnimatePresence } from 'framer-motion'
import { CalendarDays, Palmtree, Home, Bell, LogOut, Clock, Sun, Send, X, FileText, Calendar, LogIn, UserCheck } from 'lucide-react'
import Swal from 'sweetalert2'

export default function KaryawanDashboard() {
  const navigate = useNavigate()
  const [userLogon, setUserLogon] = useState(null)
  
  const [jadwalHariIni, setJadwalHariIni] = useState(null)
  const [jadwalFull, setJadwalFull] = useState([])
  const [riwayatCuti, setRiwayatCuti] = useState([])
  const [loading, setLoading] = useState(true)
  
  const [statusAbsen, setStatusAbsen] = useState('Belum Absen')
  const [dataAbsen, setDataAbsen] = useState(null)
  const [prosesAbsen, setProsesAbsen] = useState(false)
  
  const [showCutiModal, setShowCutiModal] = useState(false)
  const [showKalenderModal, setShowKalenderModal] = useState(false)
  const [showNotifModal, setShowNotifModal] = useState(false)
  
  const [tanggalCuti, setTanggalCuti] = useState('')
  const [alasanCuti, setAlasanCuti] = useState('')
  const [prosesKirim, setProsesKirim] = useState(false)

  const ambilStatusAbsen = async (userId) => {
    try {
      const response = await axios.get(`http://localhost:8000/absensi/status/${userId}`)
      setStatusAbsen(response.data.status_absen)
      setDataAbsen(response.data.data)
    } catch (error) {
      console.error("Gagal memuat status absensi", error)
    }
  }

  const ambilRiwayatCuti = async (userId) => {
    try {
      const response = await axios.get(`http://localhost:8000/cuti/karyawan/${userId}`)
      setRiwayatCuti(response.data)
    } catch (error) {
      console.error("Gagal memuat riwayat cuti", error)
    }
  }

  useEffect(() => {
    const dataDisimpan = localStorage.getItem('user')
    if (!dataDisimpan) {
      navigate('/login')
      return
    }
    
    const user = JSON.parse(dataDisimpan)
    setUserLogon(user)

    const ambilJadwalPribadi = async () => {
      try {
        const response = await axios.get(`http://localhost:8000/jadwal-karyawan/${user.id}`)
        if (response.data.jadwal && response.data.jadwal.length > 0) {
          setJadwalHariIni(response.data.jadwal[0])
          setJadwalFull(response.data.jadwal)
        }
      } catch (error) {
        console.error("Gagal memuat jadwal pribadi", error)
      }
      setLoading(false)
    }

    ambilJadwalPribadi()
    ambilRiwayatCuti(user.id)
    ambilStatusAbsen(user.id)
  }, [navigate])

  const handleClockIn = async () => {
    setProsesAbsen(true)
    try {
      const response = await axios.post('http://localhost:8000/absensi/clock-in/', { karyawan_id: userLogon.id })
      if (response.data.error) {
        Swal.fire('Peringatan', response.data.error, 'warning')
      } else {
        Swal.fire({ title: 'Berhasil Masuk!', text: `${response.data.pesan} Status Kehadiran: ${response.data.status_kehadiran}`, icon: 'success', confirmButtonColor: '#3b82f6' })
        ambilStatusAbsen(userLogon.id)
      }
    } catch (error) {
      Swal.fire('Gagal', 'Terjadi kesalahan sistem saat melakukan Clock-In.', 'error')
    }
    setProsesAbsen(false)
  }

  const handleClockOut = async () => {
    setProsesAbsen(true)
    try {
      const response = await axios.post('http://localhost:8000/absensi/clock-out/', { karyawan_id: userLogon.id })
      if (response.data.error) {
        Swal.fire('Peringatan', response.data.error, 'warning')
      } else {
        Swal.fire({ title: 'Berhasil Pulang!', text: response.data.pesan, icon: 'success', confirmButtonColor: '#10b981' })
        ambilStatusAbsen(userLogon.id)
      }
    } catch (error) {
      Swal.fire('Gagal', 'Terjadi kesalahan sistem saat melakukan Clock-Out.', 'error')
    }
    setProsesAbsen(false)
  }

  const handleAjukanCuti = async (e) => {
    e.preventDefault()
    if (!tanggalCuti || !alasanCuti) {
      Swal.fire('Opps!', 'Format tanggal dan alasan wajib diisi!', 'warning')
      return
    }
    setProsesKirim(true)
    try {
      const response = await axios.post('http://localhost:8000/cuti/', {
        karyawan_id: userLogon.id, tanggal_izin: tanggalCuti, alasan: alasanCuti
      })
      if (response.data.error) {
        Swal.fire('Gagal', response.data.error, 'error')
      } else {
        Swal.fire('Cuti Terkirim!', 'Pengajuan cuti Anda telah diteruskan ke HRD.', 'success')
        setTanggalCuti(''); setAlasanCuti(''); setShowCutiModal(false)
        ambilRiwayatCuti(userLogon.id)
      }
    } catch (error) {
      Swal.fire('Eror', 'Gagal mengirim permohonan cuti.', 'error')
    }
    setProsesKirim(false)
  }

  const handleLogout = () => {
    Swal.fire({
      title: 'Keluar Aplikasi?',
      text: 'Anda harus memasukkan password kembali untuk melakukan presensi.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3b82f6',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Ya, Keluar',
      cancelButtonText: 'Batal'
    }).then((result) => {
      if (result.isConfirmed) {
        localStorage.removeItem('user')
        navigate('/login')
      }
    })
  }

  // SKELETON LOADING UI UNTUK KARYAWAN
  if (loading) return (
    <div style={{ backgroundColor: '#e2e8f0', minHeight: '100vh', display: 'flex', justifyContent: 'center' }}>
      <div style={{ width: '100%', maxWidth: '480px', backgroundColor: '#f8fafc', padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <motion.div animate={{ opacity: [0.5, 1, 0.5] }} transition={{ repeat: Infinity, duration: 1.5 }} style={{ height: '140px', backgroundColor: '#cbd5e1', borderRadius: '30px' }} />
        <motion.div animate={{ opacity: [0.5, 1, 0.5] }} transition={{ repeat: Infinity, duration: 1.5, delay: 0.2 }} style={{ height: '150px', backgroundColor: '#cbd5e1', borderRadius: '20px' }} />
        <motion.div animate={{ opacity: [0.5, 1, 0.5] }} transition={{ repeat: Infinity, duration: 1.5, delay: 0.4 }} style={{ height: '200px', backgroundColor: '#cbd5e1', borderRadius: '20px' }} />
      </div>
    </div>
  )

  return (
    <div style={{ backgroundColor: '#e2e8f0', minHeight: '100vh', display: 'flex', justifyContent: 'center' }}>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} style={{ width: '100%', maxWidth: '480px', backgroundColor: '#f8fafc', position: 'relative', boxShadow: '0 0 20px rgba(0,0,0,0.1)', overflowY: 'auto', display: 'flex', flexDirection: 'column', paddingBottom: '100px' }}>
        
        {/* HEADER */}
        <div style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)', color: 'white', padding: '40px 24px 60px 24px', borderBottomLeftRadius: '30px', borderBottomRightRadius: '30px' }}>
          <p style={{ margin: '0 0 4px 0', fontSize: '14px', color: '#bfdbfe', display: 'flex', alignItems: 'center', gap: '6px' }}><Sun size={16} /> Selamat datang kembali,</p>
          <h2 style={{ margin: 0, fontSize: '26px', fontWeight: 'bold' }}>{userLogon?.nama}</h2>
        </div>

        {/* KONTEN UTAMA */}
        <div style={{ padding: '0 24px', marginTop: '-40px', flex: 1, display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '20px', boxShadow: '0 10px 25px rgba(0,0,0,0.03)', borderLeft: jadwalHariIni ? '6px solid #3b82f6' : '6px solid #ef4444' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <p style={{ margin: 0, color: '#64748b', fontSize: '13px', fontWeight: '700', letterSpacing: '0.5px' }}>SHIFT ANDA HARI INI</p>
              <button onClick={() => setShowKalenderModal(true)} style={{ backgroundColor: '#f1f5f9', padding: '6px', borderRadius: '8px', color: '#64748b', border: 'none', cursor: 'pointer' }}>
                <CalendarDays size={18} />
              </button>
            </div>
            {jadwalHariIni ? (
              <>
                <h2 style={{ margin: '0 0 8px 0', color: '#1e293b', fontSize: '28px', fontWeight: 'bold' }}>{jadwalHariIni.nama_shift}</h2>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#3b82f6', fontWeight: '600', backgroundColor: '#eff6ff', padding: '8px 12px', borderRadius: '8px', display: 'inline-flex' }}>
                  <Clock size={16} /> <span>{jadwalHariIni.jam}</span>
                </div>
                <p style={{ margin: '12px 0 0 0', color: '#94a3b8', fontSize: '13px', fontWeight: '500' }}>{jadwalHariIni.tanggal}</p>
              </>
            ) : (
              <>
                <h2 style={{ margin: '0 0 8px 0', color: '#ef4444', fontSize: '26px', fontWeight: 'bold' }}>Hari Libur</h2>
                <p style={{ margin: 0, color: '#64748b', fontSize: '14px' }}>Tidak ada jadwal kerja untuk Anda hari ini.</p>
              </>
            )}
          </div>

          <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '20px', boxShadow: '0 10px 25px rgba(0,0,0,0.03)', border: '1px solid #e2e8f0', textAlign: 'center' }}>
            <p style={{ margin: '0 0 16px 0', color: '#64748b', fontSize: '13px', fontWeight: '700', letterSpacing: '0.5px', textAlign: 'left' }}>PRESENSI DIGITAL</p>
            
            {/* TOMBOL CLOCK-IN DENGAN EFEK PULSE */}
            {statusAbsen === 'Belum Absen' && (
              <motion.button 
                animate={{ scale: [1, 1.03, 1], boxShadow: ["0 0 0px rgba(59, 130, 246, 0)", "0 0 20px rgba(59, 130, 246, 0.4)", "0 0 0px rgba(59, 130, 246, 0)"] }}
                transition={{ repeat: Infinity, duration: 2 }}
                whileTap={{ scale: 0.95 }} 
                onClick={handleClockIn} 
                disabled={prosesAbsen} 
                style={{ ...absenBtnStyle, backgroundColor: '#3b82f6' }}
              >
                <LogIn size={20} /> <span>Masuk Kerja Sekarang</span>
              </motion.button>
            )}

            {statusAbsen === 'Sudah Clock-In' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center', color: '#10b981', fontWeight: '600', backgroundColor: '#d1fae5', padding: '10px', borderRadius: '10px', fontSize: '14px' }}>
                  <UserCheck size={18} /> Terhitung: {dataAbsen?.status_kehadiran} ({dataAbsen?.jam_masuk})
                </div>
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={handleClockOut} disabled={prosesAbsen} style={{ ...absenBtnStyle, backgroundColor: '#10b981' }}>
                  <LogOut size={20} /> <span>Pulang Kerja (Clock-Out)</span>
                </motion.button>
              </div>
            )}

            {statusAbsen === 'Sudah Clock-Out' && (
              <div style={{ padding: '16px', backgroundColor: '#f1f5f9', borderRadius: '12px', color: '#64748b', fontSize: '14px', fontWeight: '600' }}>
                🎉 Tugas Hari Ini Selesai!<br/>
                <span style={{ fontSize: '12px', fontWeight: 'normal' }}>Masuk: {dataAbsen?.jam_masuk} | Pulang: {dataAbsen?.jam_keluar}</span>
              </div>
            )}
          </div>

          <div>
            <h3 style={{ color: '#1e293b', fontSize: '15px', marginBottom: '12px', fontWeight: '700' }}>Aksi Cepat</h3>
            <div style={{ display: 'flex', gap: '16px' }}>
              <button onClick={() => setShowCutiModal(true)} style={menuBtnStyle}>
                <div style={{ backgroundColor: '#fef3c7', color: '#d97706', padding: '12px', borderRadius: '12px', marginBottom: '12px' }}><Palmtree size={22} /></div>
                <span style={{ fontWeight: '600', color: '#475569', fontSize: '13px' }}>Ajukan Libur</span>
              </button>
              <button onClick={() => setShowKalenderModal(true)} style={menuBtnStyle}>
                <div style={{ backgroundColor: '#eff6ff', color: '#3b82f6', padding: '12px', borderRadius: '12px', marginBottom: '12px' }}><CalendarDays size={22} /></div>
                <span style={{ fontWeight: '600', color: '#475569', fontSize: '13px' }}>Kalender</span>
              </button>
            </div>
          </div>

          <div>
            <h3 style={{ color: '#1e293b', fontSize: '15px', marginBottom: '12px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FileText size={18} color="#3b82f6" /> Status & Riwayat Cuti
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {riwayatCuti.length > 0 ? (
                riwayatCuti.map((cuti) => (
                  <div key={cuti.id} style={{ backgroundColor: 'white', padding: '16px', borderRadius: '14px', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <h4 style={{ margin: '0 0 4px 0', color: '#334155', fontSize: '14px', fontWeight: '600' }}>{cuti.tanggal_izin}</h4>
                      <p style={{ margin: 0, color: '#64748b', fontSize: '12px' }}>Ket: {cuti.alasan}</p>
                    </div>
                    <span style={{ padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '700', backgroundColor: cuti.status_izin === 'Approved' ? '#d1fae5' : cuti.status_izin === 'Rejected' ? '#fee2e2' : '#fef3c7', color: cuti.status_izin === 'Approved' ? '#065f46' : cuti.status_izin === 'Rejected' ? '#991b1b' : '#92400e' }}>
                      {cuti.status_izin}
                    </span>
                  </div>
                ))
              ) : (
                <p style={{ textAlign: 'center', color: '#94a3b8', fontSize: '13px', margin: '10px 0' }}>Belum pernah mengajukan cuti.</p>
              )}
            </div>
          </div>
        </div>

        <div style={{ position: 'fixed', bottom: 0, width: '100%', maxWidth: '480px', backgroundColor: 'white', display: 'flex', justifyContent: 'space-around', padding: '14px 0', borderTop: '1px solid #f1f5f9', borderTopLeftRadius: '24px', borderTopRightRadius: '24px', boxShadow: '0 -10px 20px rgba(0,0,0,0.03)', zIndex: 10 }}>
          <button style={navBtnStyleActive}><Home size={22} /><span style={{ fontSize: '11px', marginTop: '4px' }}>Beranda</span></button>
          <button onClick={() => setShowNotifModal(true)} style={navBtnStyle}>
            <div style={{ position: 'relative' }}>
              <Bell size={22} />
              {riwayatCuti.length > 0 && <span style={{ position: 'absolute', top: -1, right: -1, width: '7px', height: '7px', backgroundColor: '#ef4444', borderRadius: '50%' }}></span>}
            </div>
            <span style={{ fontSize: '11px', marginTop: '4px' }}>Notifikasi</span>
          </button>
          <button onClick={handleLogout} style={navBtnStyle}><LogOut size={22} /><span style={{ fontSize: '11px', marginTop: '4px' }}>Keluar</span></button>
        </div>

        <AnimatePresence>
          {showCutiModal && (
            <ModalOverlay onClose={() => setShowCutiModal(false)}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h3 style={{ margin: 0, fontSize: '17px', fontWeight: '700', color: '#1e293b' }}>Formulir Permohonan Cuti</h3>
                <button onClick={() => setShowCutiModal(false)} style={closeBtnStyle}><X size={22} /></button>
              </div>
              <form onSubmit={handleAjukanCuti} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={labelStyle}>Pilih Tanggal Libur</label>
                  <input type="date" value={tanggalCuti} onChange={(e) => setTanggalCuti(e.target.value)} required style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Alasan / Keterangan</label>
                  <textarea placeholder="Contoh: Sakit, Urusan keluarga..." value={alasanCuti} onChange={(e) => setAlasanCuti(e.target.value)} required rows="3" style={{ ...inputStyle, resize: 'none' }}></textarea>
                </div>
                <button type="submit" disabled={prosesKirim} style={submitBtnStyle}>
                  {prosesKirim ? <div className="spinner" style={{width:'16px', height:'16px', border:'2px solid white', borderTop:'2px solid transparent', borderRadius:'50%'}} /> : <Send size={14} />} 
                  {prosesKirim ? 'Mengirim...' : 'Kirim Pengajuan'}
                </button>
              </form>
            </ModalOverlay>
          )}

          {showKalenderModal && (
            <ModalOverlay onClose={() => setShowKalenderModal(false)}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h3 style={{ margin: 0, fontSize: '17px', fontWeight: '700', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Calendar size={18} color="#3b82f6" /> Jadwal Kerja Saya
                </h3>
                <button onClick={() => setShowKalenderModal(false)} style={closeBtnStyle}><X size={22} /></button>
              </div>
              <div style={{ maxHeight: '350px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {jadwalFull.length > 0 ? (
                  jadwalFull.map((j, idx) => (
                    <div key={idx} style={{ padding: '14px', border: '1px solid #e2e8f0', borderRadius: '12px', backgroundColor: idx === 0 ? '#eff6ff' : 'white' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                        <span style={{ fontWeight: 'bold', color: '#1e293b', fontSize: '13px' }}>{j.tanggal}</span>
                        <span style={{ backgroundColor: idx === 0 ? '#3b82f6' : '#f1f5f9', color: idx === 0 ? 'white' : '#64748b', padding: '2px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: '600' }}>
                          {j.nama_shift}
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#64748b', fontSize: '12px' }}><Clock size={12} /> {j.jam}</div>
                    </div>
                  ))
                ) : (
                  <p style={{ textAlign: 'center', color: '#94a3b8', fontSize: '13px' }}>Belum ada jadwal kalender yang diterbitkan HRD.</p>
                )}
              </div>
            </ModalOverlay>
          )}

          {showNotifModal && (
            <ModalOverlay onClose={() => setShowNotifModal(false)}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h3 style={{ margin: '0', fontSize: '17px', fontWeight: '700', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Bell size={18} color="#3b82f6" /> Pemberitahuan Sistem
                </h3>
                <button onClick={() => setShowNotifModal(false)} style={closeBtnStyle}><X size={22} /></button>
              </div>
              <div style={{ maxHeight: '350px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {riwayatCuti.map((cuti) => (
                  <div key={cuti.id} style={{ padding: '14px', backgroundColor: cuti.status_izin === 'Approved' ? '#ecfdf5' : cuti.status_izin === 'Rejected' ? '#fef2f2' : '#f8fafc', borderRadius: '12px', borderLeft: `4px solid ${cuti.status_izin === 'Approved' ? '#10b981' : cuti.status_izin === 'Rejected' ? '#ef4444' : '#cbd5e1'}` }}>
                    <p style={{ margin: '0 0 4px 0', fontSize: '13px', color: '#334155', fontWeight: '600' }}>Pembaruan Cuti Lapangan</p>
                    <p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>Pengajuan libur tanggal <strong>{cuti.tanggal_izin}</strong> telah diproses dengan status: <span style={{ fontWeight: 'bold' }}>{cuti.status_izin}</span>.</p>
                  </div>
                ))}
                <div style={{ padding: '14px', backgroundColor: '#eff6ff', borderRadius: '12px', borderLeft: '4px solid #3b82f6' }}>
                  <p style={{ margin: '0 0 4px 0', fontSize: '13px', color: '#334155', fontWeight: '600' }}>Sistem Aktif</p>
                  <p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>Selamat menggunakan SmartShift TA-Management Enterprise Edition.</p>
                </div>
              </div>
            </ModalOverlay>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  )
}

const ModalOverlay = ({ children, onClose }) => (
  <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.5)', display: 'flex', justifyContent: 'center', alignItems: 'flex-end', zIndex: 100 }}>
    <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 26, stiffness: 220 }} style={{ width: '100%', maxWidth: '480px', backgroundColor: 'white', borderTopLeftRadius: '24px', borderTopRightRadius: '24px', padding: '24px', boxSizing: 'border-box' }}>
      {children}
    </motion.div>
  </div>
)

const menuBtnStyle = { flex: 1, padding: '16px', backgroundColor: 'white', border: '1px solid #f1f5f9', borderRadius: '16px', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', boxShadow: '0 4px 6px rgba(0,0,0,0.01)' }
const navBtnStyle = { background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', display: 'flex', flexDirection: 'column', alignItems: 'center', fontWeight: '500' }
const navBtnStyleActive = { ...navBtnStyle, color: '#3b82f6' }
const inputStyle = { width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '14px', outline: 'none', boxSizing: 'border-box', backgroundColor: '#f8fafc' }
const labelStyle = { display: 'block', margin: '0 0 6px 0', fontSize: '13px', fontWeight: '600', color: '#475569' }
const closeBtnStyle = { background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }
const submitBtnStyle = { padding: '12px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '12px', fontSize: '14px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginTop: '10px' }
const absenBtnStyle = { width: '100%', padding: '14px', color: 'white', border: 'none', borderRadius: '12px', fontSize: '15px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }