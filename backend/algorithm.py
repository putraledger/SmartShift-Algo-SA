import random
import math
import copy

class SimulatedAnnealingShift:
    def __init__(self, karyawan_list, shift_list, hari_aktif, pekerja_libur=None):
        self.karyawan_list = karyawan_list
        self.shift_list = shift_list
        self.hari_aktif = hari_aktif 
        self.pekerja_libur = pekerja_libur if pekerja_libur else {}
        
        self.initial_temp = 1000.0
        self.cooling_rate = 0.98 # Diperlambat sedikit agar pencarian bulanan lebih teliti
        self.min_temp = 0.1

    def generate_initial_solution(self):
        solusi = {}
        for h in self.hari_aktif:
            solusi[h] = {}
            id_yg_cuti = self.pekerja_libur.get(h, [])
            karyawan_tersedia = [k.id for k in self.karyawan_list if k.id not in id_yg_cuti]
            
            for shift in self.shift_list:
                if len(karyawan_tersedia) >= shift.kapasitas_minimal:
                    terpilih = random.sample(karyawan_tersedia, shift.kapasitas_minimal)
                else:
                    terpilih = list(karyawan_tersedia)
                solusi[h][shift.id] = terpilih
        return solusi

    def calculate_penalty(self, solusi):
        penalti = 0
        
        # 1. Batasan Harian (Kapasitas & Tabrakan Shift)
        for h in self.hari_aktif:
            pekerja_hari_ini = []
            for shift_id, pekerja_list in solusi[h].items():
                pekerja_hari_ini.extend(pekerja_list)
                kapasitas_min = next(s.kapasitas_minimal for s in self.shift_list if s.id == shift_id)
                if len(pekerja_list) < kapasitas_min:
                    penalti += 20 # Beban penalti dinaikkan agar AI lebih taat
            
            if len(pekerja_hari_ini) != len(set(pekerja_hari_ini)):
                penalti += 20
                
        # 2. FIX LOGIKA BULANAN: Hitung Max Hari Kerja Per 7 Hari (Per Minggu)
        # Kita bagi hari ke 1-30 menjadi blok mingguan: Minggu 1 (1-7), Minggu 2 (8-14), dst.
        for k in self.karyawan_list:
            for minggu_ke in range(5): # Mengantisipasi hingga 5 minggu dalam sebulan
                hari_mulai_minggu = (minggu_ke * 7) + 1
                hari_selesai_minggu = hari_mulai_minggu + 6
                
                total_kerja_mingguan = 0
                for h in self.hari_aktif:
                    if hari_mulai_minggu <= h <= hari_selesai_minggu:
                        for shift_id, pekerja_list in solusi[h].items():
                            if k.id in pekerja_list:
                                total_kerja_mingguan += 1
                                
                # Jika dalam 1 minggu tertentu si pekerja masuk lebih dari batasnya, beri penalti!
                if total_kerja_mingguan > k.max_hari_kerja:
                    penalti += 15 * (total_kerja_mingguan - k.max_hari_kerja)
                    
        return penalti

    def get_neighbor(self, solusi):
        neighbor = copy.deepcopy(solusi)
        hari_acak = random.choice(self.hari_aktif)
        shift_acak = random.choice(self.shift_list).id
        
        id_yg_cuti = self.pekerja_libur.get(hari_acak, [])
        karyawan_tersedia = [k.id for k in self.karyawan_list if k.id not in id_yg_cuti]
        
        if karyawan_tersedia:
            kapasitas_min = next(s.kapasitas_minimal for s in self.shift_list if s.id == shift_acak)
            # Acak jumlah pekerja antara kapasitas minimal atau maksimal yang rasional
            jml_pekerja = kapasitas_min
            
            if len(karyawan_tersedia) >= jml_pekerja:
                neighbor[hari_acak][shift_acak] = random.sample(karyawan_tersedia, jml_pekerja)
            else:
                neighbor[hari_acak][shift_acak] = list(karyawan_tersedia)
        return neighbor

    def run(self):
        current_solution = self.generate_initial_solution()
        current_penalty = self.calculate_penalty(current_solution)
        best_solution = copy.deepcopy(current_solution)
        best_penalty = current_penalty
        temp = self.initial_temp
        iterasi = 0
        
        while temp > self.min_temp:
            neighbor = self.get_neighbor(current_solution)
            neighbor_penalty = self.calculate_penalty(neighbor)
            delta = neighbor_penalty - current_penalty
            
            if delta < 0 or random.random() < math.exp(-delta / temp):
                current_solution = copy.deepcopy(neighbor)
                current_penalty = neighbor_penalty
                if current_penalty < best_penalty:
                    best_solution = copy.deepcopy(current_solution)
                    best_penalty = current_penalty
            
            temp *= self.cooling_rate
            iterasi += 1
            if best_penalty == 0:
                break
                
        return best_solution, best_penalty, iterasi