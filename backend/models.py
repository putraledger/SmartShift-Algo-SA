from sqlalchemy import Column, Integer, String, Date, ForeignKey
from database import Base

class Karyawan(Base):
    __tablename__ = "karyawan"
    
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True) # BARU: Untuk Login
    password = Column(String) # BARU: Untuk keamanan
    nama = Column(String, index=True)
    role = Column(String, default="Karyawan") 
    max_hari_kerja = Column(Integer, default=6) 

class TipeShift(Base):
    __tablename__ = "tipe_shift"
    id = Column(Integer, primary_key=True, index=True)
    nama_shift = Column(String)
    waktu_mulai = Column(String)
    waktu_selesai = Column(String)
    kapasitas_minimal = Column(Integer, default=1)

class JadwalShift(Base):
    __tablename__ = "jadwal_shift"
    id = Column(Integer, primary_key=True, index=True)
    karyawan_id = Column(Integer, ForeignKey("karyawan.id"))
    shift_id = Column(Integer, ForeignKey("tipe_shift.id"))
    tanggal = Column(Date)
    status_jadwal = Column(String, default="Draft")

class PengajuanLibur(Base):
    __tablename__ = "pengajuan_libur"
    id = Column(Integer, primary_key=True, index=True)
    karyawan_id = Column(Integer, ForeignKey("karyawan.id"))
    tanggal_izin = Column(Date)
    alasan = Column(String)
    status_izin = Column(String, default="Pending")

# ==========================================
# TABEL ABSENSI (FITUR ENTERPRISE TAHAP 2)
# ==========================================
class Absensi(Base):
    __tablename__ = "absensi"

    id = Column(Integer, primary_key=True, index=True)
    karyawan_id = Column(Integer, ForeignKey("karyawan.id"))
    tanggal = Column(Date, index=True)
    jam_masuk = Column(String, nullable=True)  # Format: "HH:MM:SS"
    jam_keluar = Column(String, nullable=True) # Format: "HH:MM:SS"
    status = Column(String, default="Tepat Waktu") # Tepat Waktu, Terlambat, Lembur