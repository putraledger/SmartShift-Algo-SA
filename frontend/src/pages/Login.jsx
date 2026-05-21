import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { motion } from 'framer-motion'

export default function Login() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleLogin = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      // 1. Tembak API ke Backend
      const response = await axios.post('http://localhost:8000/login/', {
        username: username,
        password: password
      })
      
      console.log("JAWABAN SERVER:", response.data) // Pelacak untuk F12

      // 2. Jika Backend merespons dengan Error (termasuk password korup)
      if (response.data && response.data.error) {
        setError(response.data.error)
        setLoading(false)
        return // Hentikan proses agar tidak crash!
      } 
      
      // 3. Jika login Sukses
      if (response.data && response.data.status === "Sukses") {
        const userData = response.data.user
        localStorage.setItem('user', JSON.stringify(userData))
        
        if (userData.role === 'Admin') {
          navigate('/admin')
        } else {
          navigate('/karyawan')
        }
      }
    } catch (err) {
      console.error("CRASH JARINGAN:", err)
      // Jika muncul kalimat ini, berarti ini error dari jaringan, bukan dari kode.
      setError('Koneksi terputus. Pastikan terminal Python Uvicorn menyala.')
    }
    
    setLoading(false)
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f1f5f9' }}>
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} style={{ backgroundColor: 'white', padding: '40px', borderRadius: '12px', boxShadow: '0 10px 25px rgba(0,0,0,0.05)', width: '100%', maxWidth: '350px' }}>
        
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <h1 style={{ margin: '0 0 8px 0', fontSize: '24px', color: '#1e293b' }}>Masuk ke Sistem</h1>
          <p style={{ margin: 0, color: '#64748b', fontSize: '14px' }}>VERSI BARU</p>
        </div>

        {error && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ backgroundColor: '#fee2e2', color: '#b91c1c', padding: '12px', borderRadius: '8px', marginBottom: '20px', fontSize: '14px', textAlign: 'center', border: '1px solid #fca5a5' }}>
            {error}
          </motion.div>
        )}

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <input type="text" placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} required style={{ padding: '12px 16px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', outline: 'none' }} />
          <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required style={{ padding: '12px 16px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', outline: 'none' }} />
          <button type="submit" disabled={loading} style={{ padding: '12px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer', marginTop: '10px' }}>
            {loading ? 'Memproses...' : 'Masuk'}
          </button>
        </form>
      </motion.div>
    </div>
  )
}