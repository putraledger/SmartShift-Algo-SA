from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.orm import Session
from fastapi.middleware.cors import CORSMiddleware
import models, schemas

from typing import Optional
from fastapi import FastAPI, Depends, HTTPException

# UBAH BARIS INI: Ganti get_db menjadi SessionLocal
from database import engine, SessionLocal 
from algorithm import SimulatedAnnealingShift
from datetime import datetime, timedelta
from passlib.context import CryptContext

models.Base.metadata.create_all(bind=engine)

app = FastAPI()
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# ==========================================
# SKRIP AUTO-REPAIR (MEMPERBAIKI AKUN ADMIN)
# ==========================================
@app.on_event("startup")
def auto_repair_admin():
    db = SessionLocal()
    try:
        admin_user = db.query(models.Karyawan).filter(models.Karyawan.username == "admin").first()
        if admin_user:
            # Paksa timpa password admin yang rusak dengan hash baru yang sehat
            admin_user.password = pwd_context.hash("123")
            db.commit()
            print("SISTEM: Akun Admin berhasil di-repair!")
    finally:
        db.close()

# ==========================================
# FUNGSI KONEKSI DATABASE (KEMBALIKAN KE SINI)
# ==========================================
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# ==========================================
# AUTH & KARYAWAN (Dan seterusnya ke bawah, biarkan sama)
# ==========================================
@app.post("/login/")
def login(req: schemas.LoginRequest, db: Session = Depends(get_db)):
    user = db.query(models.Karyawan).filter(models.Karyawan.username == req.username).first()
    
    if not user:
        return {"error": "Username atau Password salah!"}

    # Skenario 1: Password di DB masih teks biasa
    if user.password == req.password:
        user.password = pwd_context.hash(req.password)
        db.commit()
        return {"status": "Sukses", "user": {"id": user.id, "username": user.username, "nama": user.nama, "role": user.role}}
    
    # Skenario 2: Verifikasi enkripsi
    try:
        if pwd_context.verify(req.password, user.password):
            return {"status": "Sukses", "user": {"id": user.id, "username": user.username, "nama": user.nama, "role": user.role}}
        else:
            return {"error": "Username atau Password salah!"}
    except Exception:
        # Jika kode hash di database rusak akibat crash sebelumnya
        return {"error": "Sistem mendeteksi password korup. Lapor Admin untuk mereset akun."}

@app.post("/karyawan/")
def tambah_karyawan(req: schemas.KaryawanCreate, db: Session = Depends(get_db)):
    cek_user = db.query(models.Karyawan).filter(models.Karyawan.username == req.username).first()
    if cek_user:
        raise HTTPException(status_code=400, detail="Username sudah dipakai!")
    baru = models.Karyawan(
        username=req.username,
        password=pwd_context.hash(req.password), # Hashing Password Baru
        nama=req.nama,
        role=req.role,
        max_hari_kerja=req.max_hari_kerja
    )
    db.add(baru)
    db.commit()
    return {"status": "Sukses", "pesan": "Karyawan berhasil ditambahkan!"}

@app.get("/karyawan/")
def ambil_semua_karyawan(db: Session = Depends(get_db)):
    return db.query(models.Karyawan).all()

@app.delete("/karyawan/{karyawan_id}")
def hapus_karyawan(karyawan_id: int, db: Session = Depends(get_db)):
    karyawan = db.query(models.Karyawan).filter(models.Karyawan.id == karyawan_id).first()
    if not karyawan: return {"error": "Karyawan tidak ditemukan"}
    if karyawan.username == "admin": return {"error": "Akun Admin Utama tidak boleh dihapus!"}
    db.query(models.JadwalShift).filter(models.JadwalShift.karyawan_id == karyawan_id).delete()
    db.delete(karyawan)
    db.commit()
    return {"status": "Sukses"}

# ==========================================
# GENERATOR JADWAL (FITUR KALENDER CERDAS)
# ==========================================
@app.get("/generate-jadwal/")
def generate_jadwal_otomatis(hari: int = 30, mulai: Optional[str] = None, db: Session = Depends(get_db)):
    semua_karyawan = db.query(models.Karyawan).filter(models.Karyawan.role == "Karyawan").all()
    semua_shift = db.query(models.TipeShift).all()
    if not semua_karyawan or not semua_shift:
        return {"error": "Data karyawan lapangan atau shift masih kosong."}
        
    hari_indo = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"]
    
    if mulai:
        tanggal_mulai_obj = datetime.strptime(mulai, "%Y-%m-%d").date()
    else:
        tanggal_mulai_obj = datetime.now().date()

    hari_aktif = []
    pekerja_libur_dict = {}
    
    # 1. Tentukan Hari Aktif & Ambil Data Cuti
    for h in range(1, hari + 1):
        tanggal_target = tanggal_mulai_obj + timedelta(days=h - 1)
        nama_hari = hari_indo[tanggal_target.weekday()]
        
        # Jika opsi Libur Minggu aktif dan harinya Minggu, lewati!
        libur_minggu = True
        
        if libur_minggu and nama_hari == "Minggu":
            continue
            
        hari_aktif.append(h)
        cuti_hari_ini = db.query(models.PengajuanLibur).filter(
            models.PengajuanLibur.tanggal_izin == tanggal_target,
            models.PengajuanLibur.status_izin == "Approved"
        ).all()
        pekerja_libur_dict[h] = [c.karyawan_id for c in cuti_hari_ini]
        
    # 2. Eksekusi Algoritma AI (Hanya pada hari aktif)
    mesin_sa = SimulatedAnnealingShift(karyawan_list=semua_karyawan, shift_list=semua_shift, hari_aktif=hari_aktif, pekerja_libur=pekerja_libur_dict)
    jadwal_terbaik, penalti_terakhir, total_iterasi = mesin_sa.run()
    
    # 3. Rakit Hasil Akhir (Termasuk menyisipkan hari libur agar tabel lengkap)
    hasil_rapi = []
    for h in range(1, hari + 1):
        tanggal_target = tanggal_mulai_obj + timedelta(days=h - 1)
        nama_hari = hari_indo[tanggal_target.weekday()]
        
        jadwal_harian = {
            "hari_ke": h,
            "tanggal_asli": f"{nama_hari}, {tanggal_target.strftime('%d %B %Y')}",
            "is_libur": False,
            "shifts": []
        }
        
        if libur_minggu and nama_hari == "Minggu":
            jadwal_harian["is_libur"] = True
        else:
            for shift in semua_shift:
                id_pekerja_terpilih = jadwal_terbaik[h].get(shift.id, [])
                nama_pekerja = [k.nama for k in semua_karyawan if k.id in id_pekerja_terpilih]
                jadwal_harian["shifts"].append({
                    "shift_id": shift.id,
                    "nama_shift": shift.nama_shift,
                    "pekerja_ids": id_pekerja_terpilih,
                    "pekerja": nama_pekerja
                })
        hasil_rapi.append(jadwal_harian)
        
    return {
        "status": "Sukses",
        "statistik_algoritma": {"total_iterasi": total_iterasi, "skor_penalti_akhir": round(penalti_terakhir, 2)},
        "jadwal": hasil_rapi
    }

# ==========================================
# SISA ENDPOINT (Simpan Jadwal, Cuti, dll tetap sama)
# ==========================================
@app.post("/simpan-jadwal/")
def simpan_jadwal_permanen(req: schemas.JadwalBaruRequest, db: Session = Depends(get_db)):
    db.query(models.JadwalShift).delete()
    for harian in req.jadwal:
        if harian.get("is_libur"): continue
        tanggal_obj = datetime.strptime(harian["tanggal_asli"].split(", ")[1], "%d %B %Y").date()
        for s in harian["shifts"]:
            for pk_id in s["pekerja_ids"]:
                jadwal_db = models.JadwalShift(karyawan_id=pk_id, shift_id=s["shift_id"], tanggal=tanggal_obj)
                db.add(jadwal_db)
    db.commit()
    return {"status": "Sukses", "pesan": "Jadwal resmi diterbitkan!"}

@app.get("/jadwal-karyawan/{karyawan_id}")
def lihat_jadwal_karyawan(karyawan_id: int, db: Session = Depends(get_db)):
    jadwal_user = db.query(models.JadwalShift).filter(models.JadwalShift.karyawan_id == karyawan_id).order_by(models.JadwalShift.tanggal).all()
    hasil = []
    for j in jadwal_user:
        info_shift = db.query(models.TipeShift).filter(models.TipeShift.id == j.shift_id).first()
        if info_shift:
            hari_indo = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"]
            nama_hari = hari_indo[j.tanggal.weekday()]
            hasil.append({
                "tanggal": f"{nama_hari}, {j.tanggal.strftime('%d %B %Y')}",
                "nama_shift": info_shift.nama_shift,
                "jam": f"{info_shift.waktu_mulai} - {info_shift.waktu_selesai}"
            })
    return {"status": "Sukses", "jadwal": hasil}

@app.get("/jadwal-keseluruhan/")
def lihat_jadwal_keseluruhan(db: Session = Depends(get_db)):
    semua_jadwal = db.query(models.JadwalShift).order_by(models.JadwalShift.tanggal).all()
    if not semua_jadwal: return {"status": "Kosong", "jadwal": []}
    hasil_sementara = {}
    hari_indo = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"]
    for j in semua_jadwal:
        nama_hari = hari_indo[j.tanggal.weekday()]
        tgl_str = f"{nama_hari}, {j.tanggal.strftime('%d %B %Y')}"
        if tgl_str not in hasil_sementara:
            hasil_sementara[tgl_str] = {"tanggal": tgl_str, "Pagi": [], "Siang": [], "Malam": []}
        karyawan = db.query(models.Karyawan).filter(models.Karyawan.id == j.karyawan_id).first()
        shift = db.query(models.TipeShift).filter(models.TipeShift.id == j.shift_id).first()
        if karyawan and shift:
            if shift.nama_shift in hasil_sementara[tgl_str]:
                hasil_sementara[tgl_str][shift.nama_shift].append(karyawan.nama)
    return {"status": "Sukses", "jadwal": list(hasil_sementara.values())}

@app.post("/cuti/")
def ajukan_cuti(req: schemas.PengajuanLiburCreate, db: Session = Depends(get_db)):
    tanggal_obj = datetime.strptime(req.tanggal_izin, "%Y-%m-%d").date()
    cek_dobel = db.query(models.PengajuanLibur).filter(models.PengajuanLibur.karyawan_id == req.karyawan_id, models.PengajuanLibur.tanggal_izin == tanggal_obj).first()
    if cek_dobel: return {"error": "Anda sudah mengajukan libur pada tanggal tersebut!"}
    baru = models.PengajuanLibur(karyawan_id=req.karyawan_id, tanggal_izin=tanggal_obj, alasan=req.alasan, status_izin="Pending")
    db.add(baru)
    db.commit()
    return {"status": "Sukses", "pesan": "Pengajuan libur berhasil dikirim ke HRD."}

@app.get("/cuti/karyawan/{karyawan_id}")
def riwayat_cuti_karyawan(karyawan_id: int, db: Session = Depends(get_db)):
    riwayat = db.query(models.PengajuanLibur).filter(models.PengajuanLibur.karyawan_id == karyawan_id).order_by(models.PengajuanLibur.tanggal_izin.desc()).all()
    return [{"id": r.id, "tanggal_izin": r.tanggal_izin.strftime("%Y-%m-%d"), "alasan": r.alasan, "status_izin": r.status_izin} for r in riwayat]

@app.get("/cuti/pending/")
def lihat_cuti_pending(db: Session = Depends(get_db)):
    pending = db.query(models.PengajuanLibur, models.Karyawan.nama).join(models.Karyawan, models.PengajuanLibur.karyawan_id == models.Karyawan.id).filter(models.PengajuanLibur.status_izin == "Pending").all()
    return [{"id": cuti.id, "nama_karyawan": nama, "tanggal_izin": cuti.tanggal_izin.strftime("%Y-%m-%d"), "alasan": cuti.alasan, "status_izin": cuti.status_izin} for cuti, nama in pending]

@app.put("/cuti/{cuti_id}")
def proses_cuti_oleh_admin(cuti_id: int, status_baru: str, db: Session = Depends(get_db)):
    cuti = db.query(models.PengajuanLibur).filter(models.PengajuanLibur.id == cuti_id).first()
    if not cuti: return {"error": "Data cuti tidak ditemukan."}
    cuti.status_izin = status_baru
    db.commit()
    return {"status": "Sukses", "pesan": f"Cuti berhasil di-{status_baru}"}


# ==========================================
# ENDPOINT PRESENSI DENGAN VALIDASI SHIFT AI
# ==========================================
@app.get("/absensi/status/{karyawan_id}")
def cek_status_absen_hari_ini(karyawan_id: int, db: Session = Depends(get_db)):
    hari_ini = datetime.now().date()
    absen = db.query(models.Absensi).filter(
        models.Absensi.karyawan_id == karyawan_id,
        models.Absensi.tanggal == hari_ini
    ).first()
    
    if not absen:
        return {"status_absen": "Belum Absen", "data": None}
    
    return {
        "status_absen": "Sudah Clock-Out" if absen.jam_keluar else "Sudah Clock-In",
        "data": {
            "jam_masuk": absen.jam_masuk,
            "jam_keluar": absen.jam_keluar,
            "status_kehadiran": absen.status
        }
    }

@app.post("/absensi/clock-in/")
def executes_clock_in(req: schemas.ClockInRequest, db: Session = Depends(get_db)):
    hari_ini = datetime.now().date()
    waktu_sekarang = datetime.now().strftime("%H:%M:%S")
    
    # 1. Cek apakah hari ini sudah pernah clock-in
    absen_lama = db.query(models.Absensi).filter(models.Absensi.karyawan_id == req.karyawan_id, models.Absensi.tanggal == hari_ini).first()
    if absen_lama:
        return {"error": "Anda sudah melakukan Clock-In hari ini!"}
        
    # 2. LOGIKA VALIDASI AI: Cari tahu hari ini si karyawan harusnya masuk shift apa
    hari_indo = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"]
    nama_hari_ini = hari_indo[hari_ini.weekday()]
    tgl_format_cocok = f"{nama_hari_ini}, {hari_ini.strftime('%d %B %Y')}"
    
    # Ambil jadwal aktif dari database
    jadwal_hari_ini = db.query(models.JadwalShift).filter(models.JadwalShift.karyawan_id == req.karyawan_id, models.JadwalShift.tanggal == hari_ini).first()
    
    status_hadir = "Tepat Waktu"
    if jadwal_hari_ini:
        # Ambil konfigurasi jam mulai dari tipe shift-nya
        info_shift = db.query(models.TipeShift).filter(models.TipeShift.id == jadwal_hari_ini.shift_id).first()
        if info_shift:
            # Bandingkan jam sekarang dengan jam mulai shift (Misal toleransi 15 menit)
            jam_mulai_shift = datetime.strptime(info_shift.waktu_mulai, "%H:%M").time()
            jam_absen_sekarang = datetime.now().time()
            
            # Konversi ke menit agar mudah dibanding
            menit_shift = jam_mulai_shift.hour * 60 + jam_mulai_shift.minute
            menit_absen = jam_absen_sekarang.hour * 60 + jam_absen_sekarang.minute
            
            if menit_absen > (menit_shift + 15): # Terlambat lebih dari 15 menit
                status_hadir = "Terlambat"
    else:
        # Jika tidak ada jadwal tapi nekat absen, anggap lembur / jadwal luar rilis
        status_hadir = "Luar Jadwal"

    # 3. Simpan ke Database
    absen_baru = models.Absensi(
        karyawan_id=req.karyawan_id,
        tanggal=hari_ini,
        jam_masuk=waktu_sekarang,
        status=status_hadir
    )
    db.add(absen_baru)
    db.commit()
    return {"status": "Sukses", "pesan": f"Berhasil Clock-In pukul {waktu_sekarang}.", "status_kehadiran": status_hadir}

@app.post("/absensi/clock-out/")
def executes_clock_out(req: schemas.ClockOutRequest, db: Session = Depends(get_db)):
    hari_ini = datetime.now().date()
    waktu_sekarang = datetime.now().strftime("%H:%M:%S")
    
    absen = db.query(models.Absensi).filter(models.Absensi.karyawan_id == req.karyawan_id, models.Absensi.tanggal == hari_ini).first()
    if not absen:
        return {"error": "Anda belum melakukan Clock-In hari ini!"}
    if absen.jam_keluar:
        return {"error": "Anda sudah melakukan Clock-Out hari ini!"}
        
    absen.jam_keluar = waktu_sekarang
    db.commit()
    return {"status": "Sukses", "pesan": f"Berhasil Clock-Out pukul {waktu_sekarang}. Selamat beristirahat!"}

@app.get("/absensi/hari-ini/")
def lihat_absen_hari_ini(db: Session = Depends(get_db)):
    hari_ini = datetime.now().date()
    absen_hari_ini = db.query(models.Absensi).filter(models.Absensi.tanggal == hari_ini).all()
    
    hasil = []
    for absen in absen_hari_ini:
        karyawan = db.query(models.Karyawan).filter(models.Karyawan.id == absen.karyawan_id).first()
        if karyawan:
            hasil.append({
                "id": absen.id,
                "nama_karyawan": karyawan.nama,
                "jam_masuk": absen.jam_masuk,
                "jam_keluar": absen.jam_keluar or "Belum Pulang",
                "status": absen.status
            })
    return hasil

# ==========================================
# API MANAJEMEN DATA SHIFT (CRUD)
# ==========================================
from pydantic import BaseModel

class ShiftSchema(BaseModel):
    nama_shift: str  # Disesuaikan dengan nama kolom database
    jam: str

@app.get("/shift/")
def ambil_semua_shift(db: Session = Depends(get_db)):
    return db.query(models.TipeShift).all()

@app.post("/shift/")
def tambah_shift(req: ShiftSchema, db: Session = Depends(get_db)):
    # Pastikan memasukkan data ke kolom nama_shift
    shift_baru = models.TipeShift(nama_shift=req.nama_shift, jam=req.jam)
    db.add(shift_baru)
    db.commit()
    return {"status": "Sukses", "pesan": "Shift berhasil ditambahkan"}

@app.put("/shift/{shift_id}")
def ubah_shift(shift_id: int, req: ShiftSchema, db: Session = Depends(get_db)):
    shift = db.query(models.TipeShift).filter(models.TipeShift.id == shift_id).first()
    if not shift:
        return {"error": "Shift tidak ditemukan"}
    
    # Update data ke kolom yang tepat
    shift.nama_shift = req.nama_shift
    shift.jam = req.jam
    db.commit()
    return {"status": "Sukses", "pesan": "Data shift diperbarui"}

@app.delete("/shift/{shift_id}")
def hapus_shift(shift_id: int, db: Session = Depends(get_db)):
    shift = db.query(models.TipeShift).filter(models.TipeShift.id == shift_id).first()
    if not shift:
        return {"error": "Shift tidak ditemukan"}
    db.delete(shift)
    db.commit()
    return {"status": "Sukses", "pesan": "Shift berhasil dihapus"}