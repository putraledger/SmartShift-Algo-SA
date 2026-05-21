import { useState, useEffect, useMemo } from 'react'
import axios from 'axios'
import Sidebar from '../components/Sidebar'
import { motion } from 'framer-motion'
import { Users, CalendarCheck, BarChart2, Fingerprint, Clock, Calendar, ShieldAlert } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Cell } from 'recharts'

export default function AdminDashboard() {
  const [jadwalAktif, setJadwalAktif] = useState([])
  const [dataAbsen, setDataAbsen] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const ambilDataDashboard = async () => {
      try {
        const resJadwal = await axios.get('http://localhost:8000/jadwal-keseluruhan/')
        if (resJadwal.data.jadwal) setJadwalAktif(resJadwal.data.jadwal)
        
        const resAbsen = await axios.get('http://localhost:8000/absensi/hari-ini/')
        setDataAbsen(resAbsen.data)
      } catch (error) {
        console.error("Gagal menarik data dashboard", error)
      }
      setLoading(false)
    }
    ambilDataDashboard()
  }, [])

  const dataBebanKerja = useMemo(() => {
    if (!jadwalAktif || jadwalAktif.length === 0) return []
    const rekap = {}
    
    jadwalAktif.forEach(harian => {
      ['Pagi', 'Siang', 'Malam'].forEach(shiftName => {
        let pekerjaArray = []
        const capName = shiftName.charAt(0).toUpperCase() + shiftName.slice(1)
        if (harian[capName] && Array.isArray(harian[capName])) {
          pekerjaArray = harian[capName]
        } else if (harian.shifts && Array.isArray(harian.shifts)) {
          const shift = harian.shifts.find(s => s.nama?.toLowerCase() === shiftName.toLowerCase())
          if (shift && shift.pekerja && Array.isArray(shift.pekerja)) pekerjaArray = shift.pekerja
        }
        pekerjaArray.forEach(namaKaryawan => {
          if (!rekap[namaKaryawan]) rekap[namaKaryawan] = 0
          rekap[namaKaryawan] += 1
        })
      })
    })
    
    return Object.keys(rekap).map(nama => ({ nama: nama, total_shift: rekap[nama] }))
  }, [jadwalAktif])

  // Fungsi kebal crash untuk menarik nama pekerja
  const getPekerja = (harian, shiftName, indexArray) => {
    if (harian.shifts && Array.isArray(harian.shifts)) {
      const shift = harian.shifts.find(s => s.nama?.toLowerCase() === shiftName.toLowerCase()) || harian.shifts[indexArray]
      if (shift && shift.pekerja && shift.pekerja.length > 0) return shift.pekerja.join(', ')
    }
    const capName = shiftName.charAt(0).toUpperCase() + shiftName.slice(1)
    if (harian[capName] && Array.isArray(harian[capName]) && harian[capName].length > 0) return harian[capName].join(', ')
    if (harian[shiftName.toLowerCase()] && Array.isArray(harian[shiftName.toLowerCase()]) && harian[shiftName.toLowerCase()].length > 0) return harian[shiftName.toLowerCase()].join(', ')
    return 'Kosong'
  }

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#14b8a6']

  if (loading) return (
    <div style={{ display: 'flex' }}>
      <Sidebar />
      <div style={{ marginLeft: '260px', padding: '40px', width: '100%', backgroundColor: '#f8fafc', minHeight: '100vh' }}>
        <motion.div animate={{ opacity: [0.4, 1, 0.4] }} transition={{ repeat: Infinity, duration: 1.5 }} style={{ height: '40px', width: '300px', backgroundColor: '#e2e8f0', borderRadius: '10px', marginBottom: '40px' }} />
        <div style={{ display: 'flex', gap: '24px', marginBottom: '40px' }}>
          <motion.div animate={{ opacity: [0.4, 1, 0.4] }} transition={{ repeat: Infinity, duration: 1.5 }} style={{ height: '120px', flex: 1, backgroundColor: '#e2e8f0', borderRadius: '16px' }} />
          <motion.div animate={{ opacity: [0.4, 1, 0.4] }} transition={{ repeat: Infinity, duration: 1.5, delay: 0.2 }} style={{ height: '120px', flex: 1, backgroundColor: '#e2e8f0', borderRadius: '16px' }} />
        </div>
        <motion.div animate={{ opacity: [0.4, 1, 0.4] }} transition={{ repeat: Infinity, duration: 1.5, delay: 0.4 }} style={{ height: '300px', width: '100%', backgroundColor: '#e2e8f0', borderRadius: '20px' }} />
      </div>
    </div>
  )

  return (
    <div style={{ display: 'flex' }}>
      <Sidebar />
      <div style={{ marginLeft: '260px', padding: '40px', width: 'calc(100% - 260px)', backgroundColor: '#f8fafc', minHeight: '100vh', boxSizing: 'border-box' }}>
        
        <div style={{ marginBottom: '40px' }}>
          <h1 style={{ color: '#1e293b', marginBottom: '8px', fontSize: '28px', fontWeight: 'bold' }}>Ruang Kendali HRD</h1>
          <p style={{ color: '#64748b', margin: 0, fontSize: '16px' }}>Pantau dan kelola seluruh sistem penjadwalan & kehadiran dari satu tempat.</p>
        </div>
        
        <motion.div variants={{ visible: { transition: { staggerChildren: 0.1 } } }} initial="hidden" animate="visible" style={{ display: 'flex', gap: '24px', flexWrap: 'wrap', marginBottom: '40px' }}>
          <motion.div whileHover={{ y: -8, boxShadow: "0 20px 25px -5px rgba(59, 130, 246, 0.2)" }} variants={{ hidden: { opacity: 0, scale: 0.9 }, visible: { opacity: 1, scale: 1 } }} style={{ ...cardStyle, borderTop: '4px solid #3b82f6' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <p style={{ margin: '0 0 8px 0', color: '#64748b', fontSize: '13px', fontWeight: '700' }}>TOTAL KARYAWAN AKTIF</p>
                <h3 style={{ margin: 0, fontSize: '32px', fontWeight: '800', color: '#1e293b' }}>{dataBebanKerja.length} <span style={{fontSize: '14px', color: '#10b981', fontWeight: 'normal'}}>Orang</span></h3>
              </div>
              <div style={{ backgroundColor: '#eff6ff', padding: '12px', borderRadius: '12px', color: '#3b82f6' }}><Users size={24} /></div>
            </div>
          </motion.div>

          <motion.div whileHover={{ y: -8, boxShadow: "0 20px 25px -5px rgba(139, 92, 246, 0.2)" }} variants={{ hidden: { opacity: 0, scale: 0.9 }, visible: { opacity: 1, scale: 1 } }} style={{ ...cardStyle, borderTop: '4px solid #8b5cf6' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <p style={{ margin: '0 0 8px 0', color: '#64748b', fontSize: '13px', fontWeight: '700' }}>HARI TERJADWAL</p>
                <h3 style={{ margin: 0, fontSize: '32px', fontWeight: '800', color: '#1e293b' }}>{jadwalAktif.length} <span style={{fontSize: '14px', color: '#8b5cf6', fontWeight: 'normal'}}>Hari</span></h3>
              </div>
              <div style={{ backgroundColor: '#f3e8ff', padding: '12px', borderRadius: '12px', color: '#8b5cf6' }}><CalendarCheck size={24} /></div>
            </div>
          </motion.div>
        </motion.div>

        {/* GRAFIK BEBAN KERJA */}
        {dataBebanKerja.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} style={{ backgroundColor: 'white', padding: '24px', borderRadius: '16px', border: '1px solid #e2e8f0', marginBottom: '40px', boxShadow: '0 4px 6px rgba(0,0,0,0.02)' }}>
            <h2 style={{ fontSize: '18px', color: '#1e293b', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <BarChart2 size={22} color="#3b82f6" /> Analitik Distribusi Beban Kerja
            </h2>
            <div style={{ width: '100%', height: '300px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dataBebanKerja} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="nama" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 13, fontWeight: 500 }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} />
                  <RechartsTooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }} />
                  <Bar dataKey="total_shift" name="Total Hari Kerja" radius={[6, 6, 0, 0]} maxBarSize={60}>
                    {dataBebanKerja.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        )}

        {/* TABEL LIVE PRESENSI */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} style={{ marginBottom: '40px' }}>
          <h2 style={{ fontSize: '18px', color: '#1e293b', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Fingerprint size={22} color="#10b981" /> Live Kehadiran Karyawan (Hari Ini)
          </h2>
          <div style={{ backgroundColor: 'white', borderRadius: '16px', overflow: 'hidden', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px rgba(0,0,0,0.02)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                <tr>
                  <th style={{ padding: '16px 24px', color: '#475569', fontWeight: '600', fontSize: '14px' }}>Nama Karyawan</th>
                  <th style={{ padding: '16px 24px', color: '#475569', fontWeight: '600', fontSize: '14px' }}>Jam Masuk</th>
                  <th style={{ padding: '16px 24px', color: '#475569', fontWeight: '600', fontSize: '14px' }}>Jam Keluar</th>
                  <th style={{ padding: '16px 24px', color: '#475569', fontWeight: '600', fontSize: '14px' }}>Status AI</th>
                </tr>
              </thead>
              <motion.tbody variants={{ visible: { transition: { staggerChildren: 0.05 } } }} initial="hidden" animate="visible">
                {dataAbsen.length > 0 ? dataAbsen.map((absen, index) => (
                  <motion.tr variants={{ hidden: { opacity: 0, x: -10 }, visible: { opacity: 1, x: 0 } }} key={index} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '16px 24px', fontWeight: '600', color: '#1e293b', fontSize: '14px' }}>{absen.nama_karyawan}</td>
                    <td style={{ padding: '16px 24px', color: '#64748b', fontSize: '14px' }}><Clock size={14} style={{display: 'inline', marginBottom:'-2px', marginRight:'4px'}}/> {absen.jam_masuk}</td>
                    <td style={{ padding: '16px 24px', color: '#64748b', fontSize: '14px' }}>{absen.jam_keluar !== 'Belum Pulang' ? <><Clock size={14} style={{display: 'inline', marginBottom:'-2px', marginRight:'4px'}}/> {absen.jam_keluar}</> : <span style={{color: '#94a3b8', fontStyle: 'italic'}}>{absen.jam_keluar}</span>}</td>
                    <td style={{ padding: '16px 24px' }}>
                      <span style={{ backgroundColor: absen.status === 'Tepat Waktu' ? '#d1fae5' : absen.status === 'Terlambat' ? '#fee2e2' : '#fef3c7', color: absen.status === 'Tepat Waktu' ? '#059669' : absen.status === 'Terlambat' ? '#dc2626' : '#d97706', padding: '6px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '600' }}>
                        {absen.status}
                      </span>
                    </td>
                  </motion.tr>
                )) : (
                  <tr><td colSpan="4" style={{ padding: '30px', textAlign: 'center', color: '#94a3b8' }}>Belum ada karyawan yang Clock-In hari ini.</td></tr>
                )}
              </motion.tbody>
            </table>
          </div>
        </motion.div>

        {/* FITUR BARU: VIEWER JADWAL AKTIF DI DASHBOARD */}
        {jadwalAktif.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} style={{ marginBottom: '40px' }}>
            <h2 style={{ fontSize: '18px', color: '#1e293b', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Calendar size={22} color="#f59e0b" /> Jadwal Operasional Aktif
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {jadwalAktif.map((harian, idx) => {
                const isLibur = harian.is_libur === true || harian.libur === true || (harian.hari % 7 === 0)
                const tanggalAsli = harian.tanggal || harian.tanggal_asli || `Hari ke-${idx + 1}`
                const hariKe = harian.hari_ke || harian.nama_hari || `Hari ${harian.hari || idx + 1}`
                
                return (
                  <div key={idx} style={{ backgroundColor: 'white', padding: '20px', borderRadius: '14px', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 4px 6px rgba(0,0,0,0.01)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ backgroundColor: isLibur ? '#fee2e2' : '#eff6ff', padding: '10px', borderRadius: '10px', color: isLibur ? '#ef4444' : '#3b82f6' }}><Calendar size={20} /></div>
                      <div>
                        <h4 style={{ margin: 0, fontSize: '15px', color: '#1e293b', fontWeight: '700' }}>{tanggalAsli}</h4>
                        <p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>{hariKe}</p>
                      </div>
                    </div>
                    {isLibur ? (
                      <span style={{ backgroundColor: '#fee2e2', color: '#ef4444', padding: '6px 16px', borderRadius: '20px', fontSize: '12px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px' }}><ShieldAlert size={14}/> OPERASIONAL LIBUR AKHIR PEKAN</span>
                    ) : (
                      <div style={{ display: 'flex', gap: '30px' }}>
                        {['Pagi', 'Siang', 'Malam'].map((shiftName, sIdx) => (
                          <div key={sIdx} style={{ minWidth: '120px' }}>
                            <p style={{ margin: '0 0 4px 0', fontSize: '11px', fontWeight: '700', color: '#94a3b8' }}>SHIFT {shiftName.toUpperCase()}</p>
                            <p style={{ margin: 0, fontSize: '13px', color: '#334155', fontWeight: '600' }}>{getPekerja(harian, shiftName, sIdx)}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </motion.div>
        )}

      </div>
    </div>
  )
}

const cardStyle = { backgroundColor: 'white', padding: '24px', borderRadius: '16px', flex: '1 1 250px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px rgba(0,0,0,0.02)' }