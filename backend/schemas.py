from pydantic import BaseModel
from typing import List, Dict, Any

# ==========================================
# SKEMA KARYAWAN & LOGIN
# ==========================================
class KaryawanCreate(BaseModel):
    username: str
    password: str
    nama: str
    role: str = "Karyawan"
    max_hari_kerja: int = 6

class Karyawan(BaseModel):
    id: int
    username: str
    nama: str
    role: str
    max_hari_kerja: int

    class Config:
        from_attributes = True

class LoginRequest(BaseModel):
    username: str
    password: str

# ==========================================
# SKEMA TIPE SHIFT
# ==========================================
class TipeShiftBase(BaseModel):
    nama_shift: str
    waktu_mulai: str
    waktu_selesai: str
    kapasitas_minimal: int = 1

class TipeShiftCreate(TipeShiftBase):
    pass

class TipeShift(TipeShiftBase):
    id: int

    class Config:
        from_attributes = True


# ==========================================
# SKEMA PENGAJUAN CUTI / LIBUR
# ==========================================
class PengajuanLiburBase(BaseModel):
    tanggal_izin: str  # Format: YYYY-MM-DD
    alasan: str

class PengajuanLiburCreate(PengajuanLiburBase):
    karyawan_id: int

class PengajuanLibur(PengajuanLiburBase):
    id: int
    karyawan_id: int
    status_izin: str

    class Config:
        from_attributes = True

# ==========================================
# SKEMA PENYIMPANAN JADWAL (FITUR BARU)
# ==========================================
class JadwalBaruRequest(BaseModel):
    # Mengizinkan React mengirim array berisi objek jadwal apa saja secara dinamis
    jadwal: List[Dict[str, Any]]

# ==========================================
# SKEMA UNTUK PRESENSI / ABSENSI
# ==========================================
class ClockInRequest(BaseModel):
    karyawan_id: int

class ClockOutRequest(BaseModel):
    karyawan_id: int