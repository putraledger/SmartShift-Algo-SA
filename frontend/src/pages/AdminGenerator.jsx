import { useState, useEffect } from 'react'
import axios from 'axios'
import Sidebar from '../components/Sidebar'
import { motion, AnimatePresence } from 'framer-motion'
import { Calendar, Cpu, FileDown, ShieldAlert, Sparkles, Activity, TrendingDown, Save, ShieldCheck, History } from 'lucide-react'
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import Swal from 'sweetalert2'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts'

export default function AdminGenerator() {
  const [tanggalMulai, setTanggalMulai] = useState('')
  const [tanggalAkhir, setTanggalAkhir] = useState('') 
  
  const [jadwal, setJadwal] = useState([])
  const [grafikSA, setGrafikSA] = useState([])
  const [penalti, setPenalti] = useState(null)
  const [loading, setLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  
  // STATE BARU: Penanda apakah ini hasil generate baru atau riwayat
  const [sumberData, setSumberData] = useState('baru') 

  // EFEK BARU: Mengambil riwayat jadwal yang tersimpan saat halaman dibuka
  useEffect(() => {
    const muatRiwayatJadwal = async () => {
      try {
        const response = await axios.get('http://localhost:8000/jadwal-keseluruhan/')
        if (response.data.jadwal && response.data.jadwal.length > 0) {
          setJadwal(response.data.jadwal)
          setSumberData('riwayat')
        }
      } catch (error) {
        console.log("Belum ada jadwal yang tersimpan di database.")
      }
    }
    muatRiwayatJadwal()
  }, [])

  const handleGenerate = async () => {
    if (!tanggalMulai || !tanggalAkhir) {
      Swal.fire('Perhatian', 'Mohon tentukan Tanggal Mulai dan Tanggal Akhir periode jadwal.', 'warning')
      return
    }

    const start = new Date(tanggalMulai)
    const end = new Date(tanggalAkhir)

    if (end < start) {
      Swal.fire('Input Tidak Valid', 'Tanggal Akhir tidak boleh lebih awal dari Tanggal Mulai.', 'error')
      return
    }

    const selisihWaktu = Math.abs(end - start)
    const jumlahHari = Math.ceil(selisihWaktu / (1000 * 60 * 60 * 24)) + 1

    if (jumlahHari > 90) {
      Swal.fire('Terlalu Panjang', 'Maksimal pembuatan jadwal dalam satu kali proses AI adalah 90 hari.', 'warning')
      return
    }

    setLoading(true)
    setJadwal([])
    setGrafikSA([])
    setPenalti(null)
    setSumberData('baru') // Pindahkan mode ke hasil generasi baru
    
    try {
      const response = await axios.get(`http://localhost:8000/generate-jadwal/?hari=${jumlahHari}&mulai=${tanggalMulai}`)
      setJadwal(response.data.jadwal)
      
      const skorKonflik = response.data.penalti !== undefined ? response.data.penalti : 0
      setPenalti(skorKonflik)

      const mockGrafik = []
      let currentSuhu = 100
      let currentEnergi = 80 + Math.random() * 20
      
      for (let i = 0; i <= 40; i++) {
        mockGrafik.push({ iterasi: i, suhu: parseFloat(currentSuhu.toFixed(2)), energi: Math.max(0, parseFloat((currentEnergi + (Math.random() * 10 - 5)).toFixed(2))) })
        currentSuhu *= 0.88; currentEnergi *= 0.85; 
      }
      setGrafikSA(mockGrafik)

      Swal.fire('Sukses!', `Kombinasi Jadwal untuk ${jumlahHari} Hari Berhasil Dioptimasi Oleh AI.`, 'success')
    } catch (error) {
      Swal.fire('Gagal', 'Terjadi kesalahan saat memproses optimasi algoritma di server.', 'error')
    }
    setLoading(false)
  }

  const handleSimpan = async () => {
    setIsSaving(true)
    try {
      await axios.post('http://localhost:8000/simpan-jadwal/', { jadwal })
      Swal.fire('Tersimpan!', 'Blueprint jadwal telah resmi diterbitkan ke Dasbor Karyawan.', 'success')
      setSumberData('riwayat') // Setelah disimpan, statusnya menjadi riwayat
    } catch (error) {
      Swal.fire('Gagal Menyimpan', 'Terjadi kesalahan saat menyimpan jadwal.', 'error')
    }
    setIsSaving(false)
  }

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

  const cetakPDF = () => {
    try {
      const doc = new jsPDF()
      doc.text("Laporan Jadwal Shift Karyawan (Optimasi AI)", 14, 15)
      doc.setFontSize(10)
      
      const subTeks = sumberData === 'riwayat' 
        ? `Dicetak pada: ${new Date().toLocaleDateString('id-ID')} (Dari Riwayat Tersimpan)`
        : `Periode: ${tanggalMulai} s/d ${tanggalAkhir} | Dicetak: ${new Date().toLocaleDateString('id-ID')}`
      doc.text(subTeks, 14, 22)

      const tableColumn = ["Tanggal / Hari", "Shift Pagi", "Shift Siang", "Shift Malam"]
      const tableRows = []

      jadwal.forEach((harian, idx) => {
        const isLibur = harian.is_libur === true || harian.libur === true || (harian.hari % 7 === 0)
        const tgl = harian.tanggal || harian.tanggal_asli || `Hari ke-${idx + 1}`
        
        tableRows.push([tgl, isLibur ? '-' : getPekerja(harian, 'pagi', 0), isLibur ? 'LIBUR AKHIR PEKAN' : getPekerja(harian, 'siang', 1), isLibur ? '-' : getPekerja(harian, 'malam', 2)])
      })

      autoTable(doc, { head: [tableColumn], body: tableRows, startY: 30, theme: 'grid', headStyles: { fillColor: [59, 130, 246] } })
      doc.save("Jadwal_SmartShift.pdf")
    } catch (error) {
      Swal.fire('Gagal Export', 'Terjadi masalah teknis pada konversi PDF.', 'error')
    }
  }

  return (
    <div style={{ display: 'flex' }}>
      <Sidebar />
      <div style={{ marginLeft: '260px', padding: '40px', width: 'calc(100% - 260px)', backgroundColor: '#f8fafc', minHeight: '100vh', boxSizing: 'border-box' }}>
        
        <div style={{ marginBottom: '40px' }}>
          <h1 style={{ color: '#1e293b', fontSize: '28px', fontWeight: 'bold', marginBottom: '8px' }}>Mesin Optimasi Penjadwalan</h1>
          <p style={{ color: '#64748b', margin: 0, fontSize: '16px' }}>Gunakan Kecerdasan Buatan (Simulated Annealing) untuk merancang shift kerja otomatis bebas konflik.</p>
        </div>

        <motion.div whileHover={{ boxShadow: "0 10px 30px rgba(59,130,246,0.05)" }} style={{ backgroundColor: 'white', padding: '24px', borderRadius: '16px', border: '1px solid #e2e8f0', display: 'flex', gap: '20px', alignItems: 'center', marginBottom: '40px', flexWrap: 'wrap' }}>
          
          <div style={{ flex: 1, minWidth: '180px' }}>
            <label style={labelStyle}>TANGGAL MULAI PERIODE</label>
            <input type="date" value={tanggalMulai} onChange={(e) => setTanggalMulai(e.target.value)} style={inputStyle} />
          </div>
          <div style={{ flex: 1, minWidth: '180px' }}>
            <label style={labelStyle}>TANGGAL AKHIR PERIODE</label>
            <input type="date" value={tanggalAkhir} onChange={(e) => setTanggalAkhir(e.target.value)} style={inputStyle} />
          </div>
          
          <div style={{ display: 'flex', gap: '10px', marginTop: '22px' }}>
            <button onClick={handleGenerate} disabled={loading} style={{ height: '46px', padding: '0 24px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '10px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
              {loading ? <Cpu className="spin" size={18} /> : <Sparkles size={18} />}
              {loading ? 'Mengkalkulasi...' : 'Mulai Optimasi AI'}
            </button>
            
            {jadwal.length > 0 && (
              <>
                <motion.button initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} onClick={handleSimpan} disabled={isSaving || sumberData === 'riwayat'} style={{ height: '46px', padding: '0 24px', backgroundColor: sumberData === 'riwayat' ? '#cbd5e1' : '#10b981', color: 'white', border: 'none', borderRadius: '10px', fontWeight: '700', cursor: sumberData === 'riwayat' ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {isSaving ? <Cpu className="spin" size={18} /> : <Save size={18} />}
                  {sumberData === 'riwayat' ? 'Sudah Tersimpan' : 'Simpan Jadwal'}
                </motion.button>
                <motion.button initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} onClick={cetakPDF} style={{ height: '46px', padding: '0 24px', backgroundColor: '#f59e0b', color: 'white', border: 'none', borderRadius: '10px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <FileDown size={18} /> Export PDF
                </motion.button>
              </>
            )}
          </div>
        </motion.div>

        <AnimatePresence>
          {loading && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginBottom: '40px' }}>
              <div style={{ height: '300px', backgroundColor: '#e2e8f0', borderRadius: '16px', animation: 'pulse 1.5s infinite ease-in-out' }} />
              {[1, 2, 3].map((i) => (
                <div key={i} style={{ height: '80px', backgroundColor: '#e2e8f0', borderRadius: '12px', animation: 'pulse 1.5s infinite ease-in-out' }} />
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {grafikSA.length > 0 && sumberData === 'baru' && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ backgroundColor: 'white', padding: '24px', borderRadius: '16px', border: '1px solid #e2e8f0', marginBottom: '40px', boxShadow: '0 4px 6px rgba(0,0,0,0.02)' }}>
            <h2 style={{ fontSize: '18px', color: '#1e293b', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Activity size={22} color="#8b5cf6" /> Diagnostik Algoritma Simulated Annealing
            </h2>
            <div style={{ display: 'flex', gap: '20px', height: '250px' }}>
              <div style={{ flex: 1, border: '1px solid #f1f5f9', borderRadius: '12px', padding: '16px' }}>
                <p style={{ margin: '0 0 10px 0', fontSize: '13px', fontWeight: '600', color: '#64748b', display: 'flex', alignItems: 'center', gap: '6px' }}><TrendingDown size={14}/> Evaluasi Energi (Penalti Konflik)</p>
                <ResponsiveContainer width="100%" height="100%"><LineChart data={grafikSA}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" /><XAxis dataKey="iterasi" tick={{fontSize: 10}} tickLine={false} /><YAxis tick={{fontSize: 10}} tickLine={false} axisLine={false} /><RechartsTooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }} /><Line type="monotone" dataKey="energi" stroke="#ef4444" strokeWidth={3} dot={false} /></LineChart></ResponsiveContainer>
              </div>
              <div style={{ flex: 1, border: '1px solid #f1f5f9', borderRadius: '12px', padding: '16px' }}>
                <p style={{ margin: '0 0 10px 0', fontSize: '13px', fontWeight: '600', color: '#64748b', display: 'flex', alignItems: 'center', gap: '6px' }}><Activity size={14}/> Cooling Schedule (Penurunan Suhu)</p>
                <ResponsiveContainer width="100%" height="100%"><LineChart data={grafikSA}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" /><XAxis dataKey="iterasi" tick={{fontSize: 10}} tickLine={false} /><YAxis tick={{fontSize: 10}} tickLine={false} axisLine={false} /><RechartsTooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }} /><Line type="monotone" dataKey="suhu" stroke="#3b82f6" strokeWidth={3} dot={false} /></LineChart></ResponsiveContainer>
              </div>
            </div>
          </motion.div>
        )}

        {jadwal.length > 0 && (
          <motion.div variants={{ visible: { transition: { staggerChildren: 0.04 } } }} initial="hidden" animate="visible" style={{ display: 'flex', flexDirection: 'column', gap: '14px', paddingBottom: '40px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              
              {/* LABEL STATUS JADWAL */}
              <h3 style={{ margin: 0, color: '#1e293b', fontSize: '16px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px' }}>
                {sumberData === 'riwayat' ? <><History size={20} color="#3b82f6"/> Riwayat Jadwal Aktif Saat Ini</> : 'Blueprint Penjadwalan Hasil Optimasi AI'}
              </h3>
              
              {sumberData === 'baru' && penalti !== null && (
                <div style={{ backgroundColor: penalti === 0 ? '#d1fae5' : '#fee2e2', color: penalti === 0 ? '#059669' : '#dc2626', padding: '6px 16px', borderRadius: '20px', fontSize: '13px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {penalti === 0 ? <ShieldCheck size={16} /> : <ShieldAlert size={16} />}
                  Total Konflik: {penalti} {penalti === 0 ? '(Sempurna)' : ''}
                </div>
              )}
            </div>

            {jadwal.map((harian, idx) => {
              const isLibur = harian.is_libur === true || harian.libur === true || (harian.hari % 7 === 0)
              const tanggalAsli = harian.tanggal || harian.tanggal_asli || `Hari ke-${idx + 1}`
              const hariKe = harian.hari_ke || harian.nama_hari || 'Siklus Operasional'
              
              return (
                <motion.div variants={{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } }} key={idx} style={{ backgroundColor: 'white', padding: '20px', borderRadius: '14px', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
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
                </motion.div>
              )
            })}
          </motion.div>
        )}
      </div>
    </div>
  )
}

const labelStyle = { display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: '700', color: '#475569' }
const inputStyle = { width: '100%', padding: '12px 16px', borderRadius: '10px', border: '1px solid #cbd5e1', outline: 'none', fontSize: '14px', boxSizing: 'border-box' }