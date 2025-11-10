// ╔════════════════════════════════════════════╗
// ║ HABIT TRACKER CLI - CHALLENGE 3            ║
// ╠════════════════════════════════════════════╣
// ║ NAMA: Tri Aji Prabandaru                   ║
// ║ KELAS: BATCH 3 - REP, WPH-REP-109          ║
// ║ TANGGAL: 9 November 2025                   ║
// ╚════════════════════════════════════════════╝

// Import module Node.js yang diperlukan
const readline = require('readline'); // Untuk input/output terminal
const fs = require('fs');             // Untuk operasi file system
const path = require('path');         // Untuk manipulasi path file

// ╔════════════════════════════════════════════╗
// ║           CONSTANTS & CONFIGURATION        ║
// ╚════════════════════════════════════════════╝

// Konfigurasi global aplikasi
const CONFIG = {
    DATA_FILE: path.join(__dirname, 'habits-data.json'), // Path file penyimpanan data
    REMINDER_INTERVAL: 10000,  // Interval reminder: 10 detik 
    DAYS_IN_WEEK: 7,            // Jumlah hari dalam seminggu
    colors: {                 // ANSI color codes untuk styling terminal
        reset: '\x1b[0m',     // Reset warna ke default
        bright: '\x1b[1m',    // Text bold/terang
        green: '\x1b[32m',    // Warna hijau (success)
        yellow: '\x1b[33m',   // Warna kuning (warning)
        red: '\x1b[31m',      // Warna merah (error)
        cyan: '\x1b[36m',     // Warna cyan (header)
        magenta: '\x1b[35m',  // Warna magenta (highlight)
        darkgray: '\x1b[90m'  // Warna abu-abu gelap (info)
    }
};

// Setup readline interface untuk input/output terminal
const rl = readline.createInterface({
    input: process.stdin,   // Input dari keyboard
    output: process.stdout  // Output ke terminal
});

// ╔════════════════════════════════════════════╗
// ║               UTILITY OBJECTS              ║
// ╚════════════════════════════════════════════╝  

// ██ Object untuk fungsi-fungsi tampilan konsol
const UI = {
    header: (title) => {
        console.log('\n' + '═'.repeat(60));
        console.log(CONFIG.colors.cyan + title + CONFIG.colors.reset);
        console.log('═'.repeat(60));
    },
    separator: () => console.log('─'.repeat(60)),
    success: (msg) => console.log(`\n${CONFIG.colors.green}[OK] ${msg}${CONFIG.colors.reset}`),
    error: (msg) => console.log(`\n${CONFIG.colors.red}[X] ${msg}${CONFIG.colors.reset}`),
    info: (msg) => console.log(`\n${CONFIG.colors.red}[!] ${msg}${CONFIG.colors.reset}`)
};

// ██ Object untuk operasi tanggal
const DateUtils = {
    // Mendapatkan tanggal hari ini (jam 00:00:00)
    today: () => {
        const date = new Date();
        date.setHours(0, 0, 0, 0);
        return date;
    },
    // Mendapatkan tanggal awal minggu (Minggu)
    weekStart: () => {
        const today = DateUtils.today();
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - today.getDay());
        return weekStart;
    },
    // Mengecek apakah dua tanggal adalah hari yang sama
    isSameDay: (date1, date2) => {
        const d1 = new Date(date1);
        const d2 = new Date(date2);
        d1.setHours(0, 0, 0, 0);
        d2.setHours(0, 0, 0, 0);
        return d1.getTime() === d2.getTime();
    },
    // Menghitung selisih hari antara dua tanggal
    getDaysDiff: (date1, date2) => {
        const diffTime = Math.abs(new Date(date2) - new Date(date1));
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }
};

// ██ Object untuk operasi file JSON
const FileManager = {
    // Membaca data dari file JSON
    read: () => {
        try {
            if (!fs.existsSync(CONFIG.DATA_FILE)) return null;
            return JSON.parse(fs.readFileSync(CONFIG.DATA_FILE, 'utf8'));
        } catch (error) {
            console.error('[X] Error reading file:', error.message);
            return null;
        }
    },
    // Menulis data ke file JSON
    write: (data) => {
        try {
            fs.writeFileSync(CONFIG.DATA_FILE, JSON.stringify(data, null, 2), 'utf8');
            return true;
        } catch (error) {
            console.error('[X] Error writing file:', error.message);
            return false;
        }
    }
};

// ╔════════════════════════════════════════════╗
// ║              QUESTION FUNCTIONS            ║
// ╚════════════════════════════════════════════╝ 

/**
 * ██ askQuestion - Fungsi untuk mengajukan pertanyaan ke user via terminal
 * @param {string} question - Pertanyaan yang ditampilkan
 * @param {HabitTracker} tracker - Instance tracker untuk pause/resume reminder
 * @param {boolean} skipPause - Jika true, reminder tidak akan di-pause
 * @returns {Promise<string>} - Jawaban user (trimmed)
 */
function askQuestion(question, tracker = null, skipPause = false) {
    return new Promise((resolve) => {
        // Pause reminder saat user sedang input (kecuali skipPause=true untuk menu pilihan)
        if (tracker && !skipPause) tracker.pauseReminder?.();
        
        rl.question(question, (answer) => {
            // Resume reminder setelah user selesai input
            if (tracker && !skipPause) tracker.resumeReminder?.();
            // Reset timer reminder agar countdown ulang dari 10 detik
            tracker?.resetReminder?.();
            resolve(answer.trim());
        });
    });
}

/**
 * ██ askCategory - Fungsi untuk menanyakan kategori kebiasaan dengan pilihan shortcut
 * @param {HabitTracker} tracker - Instance tracker
 * @returns {Promise<string>} - Nama kategori yang dipilih
 */
async function askCategory(tracker) {
    // Mapping huruf ke nama kategori lengkap
    const categoryMap = {
        'K': 'Kesehatan', 'k': 'Kesehatan',
        'P': 'Produktivitas', 'p': 'Produktivitas',
        'H': 'Hobi', 'h': 'Hobi',
        'U': 'Umum', 'u': 'Umum'
    };
    
    console.log('\nKategori: K-Kesehatan | P-Produktivitas | H-Hobi | U-Umum | L-Custom');
    const choice = await askQuestion('Pilihan (K/P/H/U/L): ', tracker);
    
    // Jika pilih L (Custom), tanyakan nama kategori
    if (choice.toUpperCase() === 'L') {
        return (await askQuestion('Nama kategori: ', tracker)) || 'Umum';
    }
    // Return kategori dari mapping atau default 'Umum'
    return categoryMap[choice] || 'Umum';
}

// ╔════════════════════════════════════════════╗
// ║              CLASS : USER PROFILE          ║
// ╚════════════════════════════════════════════╝ 

// Setiap user memiliki profil dengan stats dan riwayat tersendiri
class UserProfile {
    constructor(name, id = null) {
        this.id = id || Date.now() + Math.random();  // ID unik untuk setiap profil
        this.name = name;                             // Nama pengguna
        this.joinDate = new Date();                   // Tanggal bergabung
        this.currentStreak = 0;                       // Streak saat ini (hari berturut-turut)
        this.longestStreak = 0;                       // Streak terpanjang yang pernah dicapai
    }
    
    /**
     * ██ updateStats - Update statistik profil berdasarkan habits yang dimiliki
     * @param {Array<Habit>} habits - Array kebiasaan milik profil ini
     */
    updateStats(habits) {
        // Cari streak terpanjang dari semua habits
        const maxStreak = Math.max(0, ...habits.map(h => h.getCurrentStreak()));
        this.currentStreak = maxStreak;
        // Update longest streak jika current streak lebih tinggi
        if (maxStreak > this.longestStreak) this.longestStreak = maxStreak;
    }
    
    /**
     * ██ getDaysJoined - Menghitung berapa hari user sudah bergabung
     * @returns {number} - Jumlah hari sejak bergabung
     */
    getDaysJoined() {
        return DateUtils.getDaysDiff(this.joinDate, new Date());
    }
    
    /**
     * ██ getCompletedThisWeek - Menghitung jumlah kebiasaan yang selesai minggu ini
     * @param {Array<Habit>} habits - Array kebiasaan
     * @returns {number} - Jumlah kebiasaan selesai
     */
    getCompletedThisWeek(habits) {
        return habits.filter(h => h.isCompletedThisWeek()).length;
    }
}

// ╔════════════════════════════════════════════╗
// ║                CLASS : HABIT               ║
// ╚════════════════════════════════════════════╝ 

// Menyimpan data kebiasaan, completion history, dan progress tracking
class Habit {
    constructor(name, targetFrequency, category = 'Umum') {
        this.id = Date.now() + Math.random();         // ID unik untuk setiap habit
        this.name = name;                              // Nama kebiasaan
        this.targetFrequency = targetFrequency;        // Target per minggu (1-7)
        this.completions = [];                         // Array tanggal penyelesaian (ISO string)
        this.createdAt = new Date();                   // Tanggal habit dibuat
        this.category = category;                      // Kategori habit
    }
    
    /**
     * ██ markComplete - Menandai kebiasaan selesai untuk hari ini
     * @returns {boolean} - true jika berhasil, false jika sudah diselesaikan hari ini
     */
    markComplete() {
        const today = DateUtils.today();
        // Cek apakah sudah diselesaikan hari ini
        const alreadyCompleted = this.completions.some(date => 
            DateUtils.isSameDay(date, today)
        );
        
        if (alreadyCompleted) return false;
        
        // Tambahkan tanggal hari ini ke array completions
        this.completions.push(today.toISOString());
        return true;
    }
    
    /**
     * ██ getThisWeekCompletions - Menghitung berapa kali habit diselesaikan minggu ini
     * @returns {number} - Jumlah penyelesaian minggu ini
     */
    getThisWeekCompletions() {
        const weekStart = DateUtils.weekStart();
        return this.completions.filter(date => new Date(date) >= weekStart).length;
    }
    
    /**
     * ██ isCompletedThisWeek - Mengecek apakah habit sudah mencapai target minggu ini
     * @returns {boolean} - true jika sudah selesai, false jika belum
     */
    isCompletedThisWeek() {
        return this.getThisWeekCompletions() >= this.targetFrequency;
    }
    
    /**
     * ██ isCompletedToday - Mengecek apakah habit sudah diselesaikan hari ini
     * @returns {boolean} - true jika sudah, false jika belum
     */
    isCompletedToday() {
        const today = DateUtils.today();
        return this.completions.some(date => DateUtils.isSameDay(date, today));
    }
    
    /**
     * ██ getProgressPercentage - Menghitung persentase progress minggu ini
     * @returns {number} - Persentase progress (0-100)
     */
    getProgressPercentage() {
        return Math.min((this.getThisWeekCompletions() / this.targetFrequency) * 100, 100);
    }
    
    /**
     * ██ getProgressBar - Membuat progress bar visual dengan karakter █ dan ▒
     * @returns {string} - Progress bar string (30 karakter + persentase)
     */
    getProgressBar() {
        const percentage = this.getProgressPercentage();
        const filled = Math.floor(percentage / 3.33); // 30 chars total (100/30 = 3.33)
        const bar = '█'.repeat(filled) + '▒'.repeat(30 - filled);
        return `${bar} ${percentage.toFixed(0)}%`;
    }
    
    /**
     * ██ getCurrentStreak - Menghitung streak (hari berturut-turut) habit diselesaikan
     * @returns {number} - Jumlah hari berturut-turut
     */
    getCurrentStreak() {
        if (this.completions.length === 0) return 0;
        
        // Sort tanggal dari terbaru ke terlama
        const sorted = this.completions.map(d => new Date(d)).sort((a, b) => b - a);
        const today = DateUtils.today();
        let streak = 0;
        
        // Loop dari hari ini mundur untuk hitung streak
        for (const completion of sorted) {
            const expectedDate = new Date(today);
            expectedDate.setDate(today.getDate() - streak);
            expectedDate.setHours(0, 0, 0, 0);
            
            if (DateUtils.isSameDay(completion, expectedDate)) {
                streak++;
            } else {
                break; // Streak terputus
            }
        }
        
        return streak;
    }
    
    /**
     * ██ getStatusIcon - Mendapatkan icon status kebiasaan
     * @returns {string} - Icon status: [X]=selesai minggu, [~]=selesai hari ini, [ ]=belum
     */
    getStatusIcon() {
        if (this.isCompletedThisWeek()) return '[X]';
        if (this.isCompletedToday()) return '[~]';
        return '[ ]';
    }
}

// ╔════════════════════════════════════════════╗
// ║             CLASS : HABIT TRACKER          ║
// ╚════════════════════════════════════════════╝ 

// Menangani multi-profil, CRUD habits, reminder, dan file persistence

class HabitTracker {
    constructor() {
        this.profiles = [];              // Array semua profil user
        this.currentProfile = null;      // Profil yang sedang aktif
        this.habits = [];                // Array habits dari profil aktif
        this.reminderTimer = null;       // Timer untuk reminder system
        this.reminderEnabled = false;    // Status aktif/nonaktif reminder
        this.loadFromFile();             // Load data dari file saat init
    }
    
    // ╔═════════════════ HABIT MANAGEMENT ═════════════════╗
    // ║   addHabit, editHabit, completeHabit, deleteHabit  ║
    // ╚════════════════════════════════════════════════════╝

    /**
     * ██ addHabit - Menambah kebiasaan baru 
     * @param {string} name - Nama kebiasaan
     * @param {number} frequency - Target per minggu (1-7)
     * @param {string} category - Kategori kebiasaan
     * @returns {Habit} - Habit object yang baru dibuat
     */
    addHabit(name, frequency, category = 'Umum') {
        const habit = new Habit(name, frequency, category);
        this.habits.push(habit);
        this.saveToFile();
        return habit;
    }
    
    /**
     * ██ editHabit - Mengedit kebiasaan yang sudah ada
     * @param {number} index - Nomor urut habit (1-based)
     * @param {string} newName - Nama baru (null jika tidak diubah)
     * @param {number} newFrequency - Target baru (null jika tidak diubah)
     * @param {string} newCategory - Kategori baru (null jika tidak diubah)
     */
    editHabit(index, newName, newFrequency, newCategory) {
        const habit = this.habits[index - 1];
        if (!habit) return UI.error('Kebiasaan tidak ditemukan.');
        
        // Update hanya field yang diisi
        if (newName) habit.name = newName;
        if (newFrequency) habit.targetFrequency = newFrequency;
        if (newCategory) habit.category = newCategory;
        
        this.saveToFile();
        UI.success(`Kebiasaan "${habit.name}" berhasil diperbarui.`);
    }
    
    /**
     * ██ completeHabit - Menandai kebiasaan sebagai selesai hari ini
     * @param {number} index - Nomor urut habit (1-based)
     */
    completeHabit(index) {
        const habit = this.habits[index - 1];
        if (!habit) return UI.error('Kebiasaan tidak ditemukan.');
        
        if (habit.markComplete()) {
            this.saveToFile();
            UI.success(`"${habit.name}" berhasil diselesaikan!`);
        } else {
            UI.info(`"${habit.name}" sudah diselesaikan hari ini.`);
        }
    }
    
    /**
     * ██ deleteHabit - Menghapus kebiasaan
     * @param {number} index - Nomor urut habit (1-based)
     */
    deleteHabit(index) {
        const habit = this.habits[index - 1];
        if (!habit) return UI.error('Kebiasaan tidak ditemukan.');
        
        const name = habit.name;
        this.habits.splice(index - 1, 1);
        this.saveToFile();
        UI.success(`Kebiasaan "${name}" berhasil dihapus.`);
    }
    
    // ╔═════════════════════════════ PROFILE MANAGEMENT ════════════════════════════╗
    // ║  createNewProfile, selectProfile, deleteProfile, switchProfile,             ║
    // ║  loadHabitsForProfile, saveCurrentProfileHabits, getProfileHabitsCount      ║
    // ╚═════════════════════════════════════════════════════════════════════════════╝

    // ██ createNewProfile - Membuat profil baru (async karena ada user input)
    async createNewProfile() {
        UI.header('BUAT PROFIL BARU');
        const name = await askQuestion('Nama profil: ', this);
        
        if (!name) return UI.error('Nama tidak boleh kosong.');
        
        // Simpan habits profil saat ini sebelum switch
        if (this.currentProfile) this.saveCurrentProfileHabits();
        
        // Buat profil baru dan set sebagai aktif
        const newProfile = new UserProfile(name);
        this.profiles.push(newProfile);
        this.currentProfile = newProfile;
        this.habits = [];  // Profil baru mulai dengan habits kosong
        this.saveToFile();
        
        UI.success(`Profil "${name}" berhasil dibuat dan diaktifkan!`);
    }
    
    // ██ selectProfile - Memilih profil dari daftar profil yang ada
    async selectProfile() {
        this.displayProfiles();
        if (this.profiles.length === 0) return UI.info('Tidak ada profil tersedia.');
        
        const choice = await askQuestion(`Pilih nomor (1-${this.profiles.length}, 0=batal): `, this);
        if (choice === '0') return UI.info('Dibatalkan.');
        
        const index = parseInt(choice) - 1;
        if (index >= 0 && index < this.profiles.length) {
            this.switchProfile(this.profiles[index].id);
            UI.success(`Profil "${this.profiles[index].name}" dipilih.`);
            console.log(`[INFO] ${this.habits.length} kebiasaan dimuat.`);
        } else {
            UI.error('Nomor tidak valid.');
        }
    }
    
    // ██ deleteProfile - Menghapus profil yang dipilih
    async deleteProfile() {
        this.displayProfiles();
        if (this.profiles.length === 0) return UI.info('Tidak ada profil.');
        if (this.profiles.length === 1) return UI.info('Tidak dapat menghapus profil terakhir.');
        
        const choice = await askQuestion(`Pilih nomor untuk dihapus (1-${this.profiles.length}, 0=batal): `, this);
        if (choice === '0' || choice === '') return UI.info('Dibatalkan.');
        
        const index = parseInt(choice) - 1;
        if (index < 0 || index >= this.profiles.length) return UI.error('Nomor tidak valid.');
        
        const profile = this.profiles[index];
        const confirm = await askQuestion(`Yakin hapus "${profile.name}"? (y/n): `, this);
        
        if (confirm.toLowerCase() === 'y') {
            const deletedId = profile.id;
            this.profiles.splice(index, 1);
            
            // Jika profil yang dihapus adalah profil aktif, switch ke profil lain
            if (this.currentProfile?.id === deletedId) {
                this.currentProfile = this.profiles[0] || null;
                if (this.currentProfile) this.loadHabitsForProfile(this.currentProfile.id);
                else this.habits = [];
            }
            
            // Hapus data habits profil dari file
            const data = FileManager.read() || {};
            if (data.profileHabits?.[deletedId]) delete data.profileHabits[deletedId];
            data.profiles = this.profiles;
            data.currentProfileId = this.currentProfile?.id || null;
            FileManager.write(data);
            
            UI.success(`Profil "${profile.name}" berhasil dihapus.`);
        }
    }
    
    /**
     * ██ switchProfile - Switch ke profil lain
     * @param {string|number} profileId - ID profil tujuan
     */
    switchProfile(profileId) {
        const profile = this.profiles.find(p => p.id === profileId);
        if (!profile) return;
        
        // Simpan habits profil saat ini
        if (this.currentProfile) this.saveCurrentProfileHabits();
        // Set profil baru sebagai aktif
        this.currentProfile = profile;
        // Load habits profil baru
        this.loadHabitsForProfile(profileId);
        this.saveToFile();
    }
    
    /**
     * ██ loadHabitsForProfile - Load habits dari file untuk profil tertentu
     * @param {string|number} profileId - ID profil
     */
    loadHabitsForProfile(profileId) {
        const data = FileManager.read();
        this.habits = [];
        
        // Load dan reconstruct habits dari data JSON
        if (data?.profileHabits?.[profileId]) {
            data.profileHabits[profileId].forEach(hData => {
                const habit = new Habit(hData.name || 'Kebiasaan', hData.targetFrequency || CONFIG.DAYS_IN_WEEK, hData.category || 'Umum');
                habit.id = hData.id;
                habit.completions = hData.completions || [];
                habit.createdAt = hData.createdAt;
                this.habits.push(habit);
            });
        }
    }
    
    // ██ saveCurrentProfileHabits - Simpan habits profil saat ini ke file, sebelum switch profil
    saveCurrentProfileHabits() {
        if (!this.currentProfile) return;
        
        const data = FileManager.read() || {};
        if (!data.profileHabits) data.profileHabits = {};
        data.profileHabits[this.currentProfile.id] = this.habits;
        FileManager.write(data);
    }
    
    /**
     * ██ getProfileHabitsCount - Menghitung jumlah habits yang dimiliki profil tertentu
     * @param {string|number} profileId - ID profil
     * @returns {number} - Jumlah habits
     */
    getProfileHabitsCount(profileId) {
        const data = FileManager.read();
        return data?.profileHabits?.[profileId]?.length || 0;
    }
    
    // ╔═════════════════════ DISPLAY METHODS ════════════════════╗
    // ║ * displayProfile, displayProfiles, displayHabits         ║
    // ║ * displayHabitsByCategory, displayStats, displayHistory  ║
    // ╚══════════════════════════════════════════════════════════╝

    // ██ displayProfile - Menampilkan info profil aktif
    displayProfile() {
        if (!this.currentProfile) return UI.info('Tidak ada profil aktif.');
        
        this.currentProfile.updateStats(this.habits);
        UI.header('PROFIL PENGGUNA');
        console.log(`Nama             : ${this.currentProfile.name}`);
        console.log(`Bergabung        : ${this.currentProfile.getDaysJoined()} hari lalu`);
        console.log(`Total Kebiasaan  : ${this.habits.length}`);
        console.log(`Selesai Minggu   : ${this.currentProfile.getCompletedThisWeek(this.habits)}`);
        console.log(`Streak Saat Ini  : ${this.currentProfile.currentStreak} hari`);
        console.log(`Streak Terbaik   : ${this.currentProfile.longestStreak} hari`);
        console.log('═'.repeat(60) + '\n');
    }
    
    // ██ displayProfiles - Menampilkan daftar semua profil dengan status aktif
    displayProfiles() {
        UI.header('DAFTAR PROFIL');
        
        if (this.profiles.length === 0) {
            console.log('Belum ada profil.');
        } else {
            this.profiles.forEach((profile, i) => {
                // Tandai profil yang sedang aktif dengan warna kuning
                const active = this.currentProfile?.id === profile.id ? ` ${CONFIG.colors.yellow}(AKTIF)${CONFIG.colors.reset}` : '';
                const count = this.getProfileHabitsCount(profile.id);
                console.log(`${i + 1}. ${CONFIG.colors.bright}${profile.name}${CONFIG.colors.reset}${active} (${count} kebiasaan)`);
                console.log(`   Bergabung: ${new Date(profile.joinDate).toLocaleDateString('id-ID')}`);
            });
        }
        console.log('═'.repeat(60) + '\n');
    }
    
    /**
     * ██ displayHabits - Menampilkan daftar kebiasaan dengan filter
     * @param {string} filter - Filter: 'all', 'active', atau 'completed'
     */
    displayHabits(filter = 'all') {
        if (!this.currentProfile) return UI.info('Tidak ada profil aktif.');
        
        let habits = this.habits;
        let title = 'SEMUA KEBIASAAN';
        
        // Filter habits berdasarkan parameter
        if (filter === 'active') {
            habits = this.habits.filter(h => !h.isCompletedThisWeek());
            title = 'KEBIASAAN AKTIF';
        } else if (filter === 'completed') {
            habits = this.habits.filter(h => h.isCompletedThisWeek());
            title = 'KEBIASAAN SELESAI';
        }
        
        UI.header(title);
        
        // Tampilkan pesan sesuai kondisi
        if (habits.length === 0) {
            if (this.habits.length === 0) {
                console.log('Belum ada kebiasaan.');
            } else {
                // Pesan khusus untuk filter active/completed
                console.log(filter === 'active' ? 
                    CONFIG.colors.green + 'Selamat! Semua kebiasaan selesai! 🎉' + CONFIG.colors.reset :
                    'Belum ada kebiasaan selesai minggu ini.');
            }
        } else {
            // Tampilkan detail setiap habit
            habits.forEach(habit => {
                const index = this.habits.indexOf(habit) + 1;
                const todayMark = habit.isCompletedToday() ? ' (Selesai Hari Ini)' : '';
                
                console.log(`\n${index}. ${habit.getStatusIcon()} ${habit.name}${todayMark}`);
                console.log(`   Kategori: ${habit.category}`);
                console.log(`   Target: ${habit.targetFrequency}x/minggu | Progress: ${habit.getThisWeekCompletions()}/${habit.targetFrequency} (${habit.getProgressPercentage().toFixed(0)}%)`);
                console.log(CONFIG.colors.yellow + `   ${habit.getProgressBar()}` + CONFIG.colors.reset);
                console.log(`   Streak: ${habit.getCurrentStreak()} hari berturut-turut`);
            });
        }
        console.log('\n' + '═'.repeat(60) + '\n');
    }
    
    // ██ displayHabitsByCategory - Menampilkan kebiasaan dikelompokkan per kategori
    displayHabitsByCategory() {
        if (!this.currentProfile) return UI.info('Tidak ada profil aktif.');
        
        UI.header('KEBIASAAN PER KATEGORI');
        // Ambil unique categories menggunakan Set
        const categories = [...new Set(this.habits.map(h => h.category))];
        
        if (categories.length === 0) {
            console.log('Belum ada kebiasaan.');
        } else {
            // Tampilkan habits per kategori
            categories.forEach(cat => {
                console.log(`\n[${cat}]`);
                this.habits.filter(h => h.category === cat).forEach(habit => {
                    console.log(`   ${habit.getStatusIcon()} ${habit.name} (${habit.getThisWeekCompletions()}/${habit.targetFrequency})`);
                });
            });
        }
        console.log('\n' + '═'.repeat(60) + '\n');
    }
    
    // ██ displayStats - Menampilkan statistik lengkap kebiasaan
    displayStats() {
        if (!this.currentProfile) return UI.info('Tidak ada profil aktif.');
        
        this.currentProfile.updateStats(this.habits);
        UI.header('STATISTIK KEBIASAAN');
        
        // Hitung habits aktif dan selesai
        const active = this.habits.filter(h => !h.isCompletedThisWeek()).length;
        const completed = this.habits.filter(h => h.isCompletedThisWeek()).length;
        
        console.log(`Total Kebiasaan         : ${this.habits.length}`);
        console.log(`Aktif                   : ${active}`);
        console.log(`Selesai                 : ${completed}`);
        
        if (this.habits.length > 0) {
            // Hitung progress rata-rata
            const avgProgress = this.habits.reduce((sum, h) => sum + h.getProgressPercentage(), 0) / this.habits.length;
            // Hitung total completions minggu ini
            const totalCompletions = this.habits.reduce((sum, h) => sum + h.getThisWeekCompletions(), 0);
            
            console.log(`Progress Rata-rata      : ${avgProgress.toFixed(1)}%`);
            console.log(`Total Selesai Minggu Ini: ${totalCompletions} kali`);
            
            // Cari habit dengan streak terpanjang
            const streaks = this.habits.map(h => ({ name: h.name, streak: h.getCurrentStreak() }))
                .sort((a, b) => b.streak - a.streak);
            
            if (streaks[0].streak > 0) {
                console.log(`\nStreak Terpanjang:`);
                console.log(`   "${streaks[0].name}" - ${streaks[0].streak} hari`);
            }
        }
        console.log('═'.repeat(60) + '\n');
    }
    
    // ██ displayHistory - Menampilkan riwayat penyelesaian 7 hari terakhir
    displayHistory() {
        if (!this.currentProfile) return UI.info('Tidak ada profil aktif.');
        
        UI.header('RIWAYAT (7 Hari Terakhir)');
        
        if (this.habits.length === 0) {
            console.log('Belum ada kebiasaan.');
        } else {
            const today = DateUtils.today();
            
            // Loop 7 hari terakhir (dari 6 hari lalu sampai hari ini)
            for (let i = CONFIG.DAYS_IN_WEEK - 1; i >= 0; i--) {
                const date = new Date(today);
                date.setDate(today.getDate() - i);
                
                const dateStr = date.toLocaleDateString('id-ID', {
                    weekday: 'short', day: '2-digit', month: 'short'
                });
                
                console.log(`\n${dateStr}:`);
                
                // Cari habits yang diselesaikan di tanggal ini
                const completed = this.habits.filter(h => 
                    h.completions.some(comp => DateUtils.isSameDay(comp, date))
                );
                
                if (completed.length === 0) {
                    console.log('   (Tidak ada penyelesaian)');
                } else {
                    completed.forEach(h => console.log(`   [X] ${h.name}`));
                }
            }
        }
        console.log('\n' + '═'.repeat(60) + '\n');
    }
    
    // ╔══════════════════════════ REMINDER SYSTEM ═════════════════════════╗
    // ║   startReminder, stopReminder, toggleReminder                      ║
    // ║   pauseReminder, resumeReminder, resetReminder, showReminder       ║
    // ╚════════════════════════════════════════════════════════════════════╝

    // ██ startReminder - Mengaktifkan sistem reminder otomatis
    startReminder() {
        if (this.reminderTimer) clearInterval(this.reminderTimer);
        this.reminderTimer = setInterval(() => this.showReminder(), CONFIG.REMINDER_INTERVAL);
        this.reminderEnabled = true;
        UI.success('Pengingat diaktifkan (setiap 10 detik).');
    }
    
    // ██ stopReminder - Menonaktifkan sistem reminder
    stopReminder() {
        if (this.reminderTimer) {
            clearInterval(this.reminderTimer);
            this.reminderTimer = null;
            this.reminderEnabled = false;
            UI.success('Pengingat dinonaktifkan.');
        }
    }
    
    // ██ toggleReminder - Toggle reminder on/off
    toggleReminder() {
        this.reminderEnabled ? this.stopReminder() : this.startReminder();
    }
    
    // ██ pauseReminder - Pause reminder (saat user sedang input)
    // Timer di-clear tapi status enabled tetap true
    pauseReminder() {
        if (this.reminderEnabled && this.reminderTimer) {
            clearInterval(this.reminderTimer);
            this.reminderTimer = null;
        }
    }
    
    // ██ resumeReminder - Resume reminder (setelah user selesai input)
    // Restart timer jika reminder masih enabled
    resumeReminder() {
        if (this.reminderEnabled && !this.reminderTimer) {
            this.reminderTimer = setInterval(() => this.showReminder(), CONFIG.REMINDER_INTERVAL);
        }
    }
    
    // ██ resetReminder - Reset timer reminder (restart countdown dari awal)
    resetReminder() {
        if (this.reminderEnabled && this.reminderTimer) {
            clearInterval(this.reminderTimer);
            this.reminderTimer = setInterval(() => this.showReminder(), CONFIG.REMINDER_INTERVAL);
        }
    }
    
    // ██ showReminder - Menampilkan notifikasi reminder
    // Hanya muncul jika ada habits yang belum diselesaikan hari ini
    showReminder() {
        // Jangan tampilkan jika tidak ada profil atau habits
        if (!this.currentProfile || this.habits.length === 0) return;
        
        // Filter habits yang belum diselesaikan hari ini
        const incomplete = this.habits.filter(h => !h.isCompletedToday());
        if (incomplete.length === 0) return; // Jangan tampilkan jika semua sudah selesai
        
        // Tampilkan notifikasi dengan warna kuning
        console.clear();
        console.log('\n' + CONFIG.colors.yellow + '─'.repeat(60));
        console.log('PENGINGAT KEBIASAAN HARI INI :');
        incomplete.forEach((h, i) => {
            console.log(`${i + 1}. ${h.name} (${h.getThisWeekCompletions()}/${h.targetFrequency})`);
        });
        console.log('─'.repeat(60) + CONFIG.colors.reset);
        console.log(CONFIG.colors.darkgray + 'Notifikasi: ' + CONFIG.colors.red + 'AKTIF. ' + CONFIG.colors.darkgray + '- (Matikan melalui menu utama)' + CONFIG.colors.reset);
        console.log(CONFIG.colors.darkgray + 'Tekan Enter untuk melanjutkan...' + CONFIG.colors.reset);
    }
    
    // ╔══════════════════════ FILE OPERATIONS ══════════════════════╗
    // ║  saveToFile, loadFromFile, exportData, generateDemoHabits   ║ 
    // ╚═════════════════════════════════════════════════════════════╝
    
    // ██ saveToFile - Menyimpan semua data ke file JSON
    saveToFile() {
        const data = FileManager.read() || { profileHabits: {} };
        
        // Update data profiles dan currentProfileId
        data.profiles = this.profiles;
        data.currentProfileId = this.currentProfile?.id || null;
        
        // Simpan habits untuk profil saat ini
        if (this.currentProfile) {
            data.profileHabits[this.currentProfile.id] = this.habits;
        }
        
        // Pastikan semua profil punya entry di profileHabits (meski kosong)
        this.profiles.forEach(p => {
            if (!data.profileHabits[p.id]) data.profileHabits[p.id] = [];
        });
        
        FileManager.write(data);
    }
    
    // ██ loadFromFile - Load data dari file JSON saat aplikasi start
    loadFromFile() {
        const data = FileManager.read();
        if (!data) return;
        
        // Reconstruct profiles dari data
        if (data.profiles) {
            this.profiles = data.profiles.map(pData => {
                const profile = new UserProfile(pData.name || 'User', pData.id);
                profile.joinDate = pData.joinDate || new Date();
                profile.currentStreak = pData.currentStreak || 0;
                profile.longestStreak = pData.longestStreak || 0;
                return profile;
            });
        }
        
        // Set currentProfile berdasarkan ID yang tersimpan
        if (data.currentProfileId) {
            this.currentProfile = this.profiles.find(p => p.id === data.currentProfileId);
        }
        
        // Load habits untuk profil yang aktif
        if (this.currentProfile) {
            this.loadHabitsForProfile(this.currentProfile.id);
        }
        
        console.log('[OK] Data berhasil dimuat.');
    }
    
    // ██ exportData - Export data habits ke file teks sebagai "habits-export.txt"
    exportData() {
        if (!this.currentProfile) return UI.info('Tidak ada profil aktif.');
        
        const exportPath = path.join(__dirname, 'habits-export.txt');
        let text = '═'.repeat(60) + '\nEKSPOR DATA HABIT TRACKER\n' + '═'.repeat(60) + '\n\n';
        text += `Nama: ${this.currentProfile.name}\n`;
        text += `Tanggal: ${new Date().toLocaleString('id-ID')}\n`;
        text += `Total Kebiasaan: ${this.habits.length}\n\n`;
        text += '═'.repeat(60) + '\nDAFTAR KEBIASAAN\n' + '═'.repeat(60) + '\n\n';
        
        // Tambahkan detail setiap habit
        this.habits.forEach((h, i) => {
            text += `${i + 1}. ${h.name}\n`;
            text += `   Kategori: ${h.category}\n`;
            text += `   Target: ${h.targetFrequency}x/minggu\n`;
            text += `   Progress: ${h.getThisWeekCompletions()}/${h.targetFrequency} (${h.getProgressPercentage().toFixed(0)}%)\n`;
            text += `   Streak: ${h.getCurrentStreak()} hari\n`;
            text += `   Total Penyelesaian: ${h.completions.length}x\n\n`;
        });
        
        // Tulis ke file
        try {
            fs.writeFileSync(exportPath, text, 'utf8');
            UI.success(`Data diekspor ke: ${exportPath}`);
        } catch (error) {
            UI.error('Gagal mengekspor data.');
        }
    }
    
    // ██ generateDemoHabits - Generate 5 contoh kebiasaan untuk testing/demo
    async generateDemoHabits() {
        if (!this.currentProfile) return UI.info('Tidak ada profil aktif.');
        
        UI.header('GENERATE DEMO');
        const confirm = await askQuestion('Generate 5 contoh kebiasaan? (y/n): ', this);
        
        if (confirm.toLowerCase() === 'y') {
            console.log('\n[...] Membuat contoh kebiasaan...');
            this.addHabit('Minum Air 8 Gelas', 7, 'Kesehatan');
            this.addHabit('Olahraga 30 Menit', 5, 'Kesehatan');
            this.addHabit('Membaca Buku 30 Menit', 5, 'Produktivitas');
            this.addHabit('Meditasi 10 Menit', 7, 'Kesehatan');
            this.addHabit('Belajar Coding', 6, 'Produktivitas');
            UI.success('5 contoh kebiasaan ditambahkan.');
        } else {
            UI.info('Dibatalkan.');
        }
    }
}

// ╔════════════════════════════════════════════╗
// ║                 MENU DISPLAY               ║
// ╚════════════════════════════════════════════╝ 

// ██ displayMainMenu - Menampilkan menu utama
function displayMainMenu(tracker) {
    console.clear();
    const active = tracker.habits.filter(h => !h.isCompletedThisWeek()).length;
    const completed = tracker.habits.filter(h => h.isCompletedThisWeek()).length;
    const pending = tracker.habits.filter(h => !h.isCompletedToday()).length;
    const profileName = tracker.currentProfile ? tracker.currentProfile.name : 'Tidak ada';
    const streak = tracker.currentProfile ? tracker.currentProfile.currentStreak : 0;
    const reminderStatus = tracker.reminderEnabled ? 'AKTIF' : 'NONAKTIF';
    console.log('\n' + '═'.repeat(60));
    console.log(CONFIG.colors.cyan + 'HABIT TRACKER - MENU UTAMA' + CONFIG.colors.reset);
    console.log('═'.repeat(60));
    console.log(CONFIG.colors.yellow + `Profil: ` + CONFIG.colors.magenta + profileName);
    console.log(CONFIG.colors.yellow + `Kebiasaan: ${active} aktif, ${completed} selesai`);
    if (pending > 0) console.log(`Pending hari ini: ${pending} kebiasaan`);
    console.log(`Streak: ${streak} hari` + CONFIG.colors.reset);
    console.log('═'.repeat(60));
    console.log(CONFIG.colors.cyan + 'Kelola:' + CONFIG.colors.reset);
    console.log('1. Kelola Profil');
    console.log('2. Kelola Kebiasaan');
    UI.separator();
    console.log(CONFIG.colors.cyan + 'Shortcut:' + CONFIG.colors.reset);
    console.log('3. Lihat Semua Kebiasaan');
    console.log('4. Tambah Kebiasaan Baru');
    console.log('5. Tandai Kebiasaan Selesai');
    UI.separator();
    console.log(CONFIG.colors.cyan + 'Utilitas:' + CONFIG.colors.reset);
    console.log('6. Demo Loop');
    console.log('7. Ekspor Data');
    console.log('8. Generate Demo Kebiasaan');
    console.log(`9. Reminder ` + CONFIG.colors.magenta + `(${reminderStatus})` + CONFIG.colors.reset);
    UI.separator();
    console.log('0. Keluar');
    UI.separator();
}

// ██ displayProfileMenu - Menampilkan menu Kelola Profil
function displayProfileMenu(tracker) {
    console.clear();
    UI.header('KELOLA PROFIL');
    console.log('Profil Aktif: ' + CONFIG.colors.magenta + (tracker.currentProfile ? tracker.currentProfile.name : 'Tidak ada') + CONFIG.colors.reset);
    UI.separator();
    console.log('1. Lihat Profil Saya');
    console.log('2. Ganti Profil');
    console.log('3. Buat Profil Baru');
    console.log('4. Hapus Profil');
    UI.separator();
    console.log('0. Kembali ke Menu Utama');
    UI.separator();
}

// ██ displayHabitMenu - Menampilkan menu Kelola Kebiasaan
function displayHabitMenu() {
    console.clear();
    UI.header('KELOLA KEBIASAAN');
    console.log(CONFIG.colors.cyan + 'Tampilan:' + CONFIG.colors.reset);
    console.log('1. Lihat Semua Kebiasaan');
    console.log('2. Lihat per Kategori');
    console.log('3. Kebiasaan Aktif Saja');
    console.log('4. Kebiasaan Selesai Saja');
    UI.separator();
    console.log(CONFIG.colors.cyan + 'Analisis:' + CONFIG.colors.reset);
    console.log('5. Lihat Statistik');
    console.log('6. Lihat Riwayat (7 hari)');
    UI.separator();
    console.log(CONFIG.colors.cyan + 'Aksi:' + CONFIG.colors.reset);
    console.log('7. Tambah Kebiasaan Baru');
    console.log('8. Tandai Kebiasaan Selesai');
    console.log('9. Edit Kebiasaan');
    console.log('10. Hapus Kebiasaan');
    UI.separator();
    console.log('0. Kembali ke Menu Utama');
    UI.separator();
}

// ╔═════════════════════════════════════════════╗
// ║                 MENU HANDLERS               ║
// ╚═════════════════════════════════════════════╝ 

// ██ handleMainMenu - Handler untuk menu utama
async function handleMainMenu(tracker) {
    let running = true;
    
    while (running) {
        displayMainMenu(tracker);
        const choice = await askQuestion('\nPilih menu (0-9): ', tracker, true);
        
        // Clear console untuk pilihan selain yang di-exclude
        const skipClear = ['0', '9'].includes(choice);
        if (!skipClear) console.clear();
        
        // Tentukan apakah prompt akhir perlu ditampilkan
        const isSubMenuOrToggle = ['1', '2', '9'].includes(choice);

        switch (choice) {
            case '1': // Kelola Profil
                await handleProfileMenu(tracker);
                break;
            case '2': // Kelola Kebiasaan
                await handleHabitMenu(tracker);
                break;
            case '3': // Lihat semua kebiasaan
                if (!tracker.currentProfile) {
                    UI.info('Tidak ada profil aktif.');
                } else {
                    tracker.displayHabits('all');
                }
                break;
            case '4': // Tambah kebiasaan baru
                await handleAddHabit(tracker);
                break;
            case '5': // Tandai kebiasaan selesai
                await handleCompleteHabit(tracker);
                break;
            case '6': // Demo loop
                displayLoopDemo(tracker.habits, 'while');
                await askQuestion('[Tekan Enter untuk melanjutkan ke FOR loop...]', tracker);
                displayLoopDemo(tracker.habits, 'for');
                break;
            case '7': // Ekspor data
                tracker.exportData();
                break;
            case '8': // Generate demo kebiasaan
                await tracker.generateDemoHabits();
                break;
            case '9': // Toggle reminder
                tracker.toggleReminder();
                await new Promise(resolve => setTimeout(resolve, 1000)); // Delay 1 detik
                break;
            case '0': // Keluar
                console.clear();
                console.log('\n' + '═'.repeat(60));
                console.log('Terima kasih telah menggunakan HABIT TRACKER');
                console.log('═'.repeat(60) + '\n');
                tracker.stopReminder();
                running = false;
                break;
            default:
                if (choice.trim()) UI.error('Pilihan tidak valid.');
                break;
        }
        
        // Tampilkan prompt "Tekan Enter" kecuali pilihan 0 atau input kosong
        if (running && !isSubMenuOrToggle && choice.trim()) {
            await askQuestion('\nTekan Enter untuk melanjutkan...', tracker);
        }
    }
    
    rl.close();
}

// ██ handleProfileMenu - Handler untuk menu Kelola Profil
async function handleProfileMenu(tracker) {
    let running = true;
    
    while (running) {
        displayProfileMenu(tracker);
        const choice = await askQuestion('\n> Menu Utama > Kelola Profil\nPilih menu (0-4): ', tracker, true);
        
        // Jika pilih 0, langsung keluar tanpa proses apapun
        if (choice === '0') {
            running = false;
            break; // Langsung keluar dari loop
        }
        
        // Clear console untuk pilihan selain 0
        console.clear();
        
        switch (choice) {
            case '1': // Lihat profil
                tracker.displayProfile();
                break;
            case '2': // Ganti profil
                await tracker.selectProfile();
                break;
            case '3': // Buat profil baru
                await tracker.createNewProfile();
                break;
            case '4': // Hapus profil
                await tracker.deleteProfile();
                break;
            default: // Input tidak valid
                if (choice.trim()) UI.error('Pilihan tidak valid.');
                break;
        }
        
        // Prompt hanya untuk input yang valid (bukan kosong)
        if (choice.trim() !== '') {
            await askQuestion('\nTekan Enter untuk melanjutkan...', tracker);
        }
    }
}

// ██ handleHabitMenu - Handler untuk menu Kelola Kebiasaan
async function handleHabitMenu(tracker) {
    let running = true;
    
    while (running) {
        displayHabitMenu();
        const choice = await askQuestion('\n> Menu Utama > Kelola Kebiasaan\nPilih menu (0-10): ', tracker, true);
        
        // Jika pilih 0, langsung keluar tanpa proses apapun
        if (choice === '0') {
            running = false;
            break; // Langsung keluar dari loop
        }
        
        // Clear console untuk pilihan selain 0
        console.clear();
        
        switch (choice) {
            case '1': // Lihat semua kebiasaan
                tracker.displayHabits('all');
                break;
            case '2': // Lihat per kategori
                tracker.displayHabitsByCategory();
                break;
            case '3': // Kebiasaan aktif saja
                tracker.displayHabits('active');
                break;
            case '4': // Kebiasaan selesai saja
                tracker.displayHabits('completed');
                break;
            case '5': // Lihat statistik
                tracker.displayStats();
                break;
            case '6': // Lihat riwayat
                tracker.displayHistory();
                break;
            case '7': // Tambah kebiasaan baru
                await handleAddHabit(tracker);
                break;
            case '8': // Tandai kebiasaan selesai
                await handleCompleteHabit(tracker);
                break;
            case '9': // Edit kebiasaan
                await handleEditHabit(tracker);
                break;
            case '10':  // Hapus kebiasaan
                await handleDeleteHabit(tracker);
                break;
            default: // Input tidak valid
                if (choice.trim()) UI.error('Pilihan tidak valid.');
                break;
        }
        
        // Prompt hanya untuk input yang valid (bukan kosong)
        if (choice.trim() !== '') {
            await askQuestion('\nTekan Enter untuk melanjutkan...', tracker);
        }
    }
}

// ██ handleAddHabit - Handler untuk tambah kebiasaan baru
async function handleAddHabit(tracker) {
    if (!tracker.currentProfile) return UI.info('Tidak ada profil aktif.');
    
    // Minta input detail kebiasaan baru
    UI.header('TAMBAH KEBIASAAN BARU');
    const name = await askQuestion('Nama kebiasaan: ', tracker);
    const frequency = await askQuestion('Target per minggu (1-7): ', tracker);
    const category = await askCategory(tracker);
    
    const freq = parseInt(frequency);
    // Validasi input
    if (name && freq >= 1 && freq <= CONFIG.DAYS_IN_WEEK) {
        tracker.addHabit(name, freq, category);
        UI.success(`Kebiasaan "${name}" (${category}) berhasil ditambahkan!`);
    } else {
        UI.error('Input tidak valid.');
    }
}

// ██ handleCompleteHabit - Handler untuk tandai kebiasaan selesai
async function handleCompleteHabit(tracker) {
    if (!tracker.currentProfile) return UI.info('Tidak ada profil aktif.');
    
    // Tampilkan daftar kebiasaan
    tracker.displayHabits('all');
    if (tracker.habits.length === 0) return;

    // Minta input nomor kebiasaan yang selesai
    const choice = await askQuestion('Nomor kebiasaan yang selesai (0=batal): ', tracker);
    if (choice !== '0') {
        const idx = parseInt(choice);
        if (idx >= 1 && idx <= tracker.habits.length) {
            tracker.completeHabit(idx);
        } else {
            UI.error('Nomor tidak valid.');
        }
    }
}

// ██ handleEditHabit - Handler untuk edit kebiasaan
async function handleEditHabit(tracker) {
    if (!tracker.currentProfile) return UI.info('Tidak ada profil aktif.');
    
    // Tampilkan daftar kebiasaan
    tracker.displayHabits('all');
    if (tracker.habits.length === 0) return;
    
    //  Minta input nomor kebiasaan yang akan diedit
    const choice = await askQuestion('Nomor kebiasaan untuk diedit (0=batal): ', tracker);
    if (choice === '0') return;
    
    //  Validasi nomor kebiasaan
    const idx = parseInt(choice);
    if (idx < 1 || idx > tracker.habits.length) return UI.error('Nomor tidak valid.');
    
    //  Tampilkan detail kebiasaan yang akan diedit
    const habit = tracker.habits[idx - 1];
    console.log(`\nEdit "${habit.name}"`);
    console.log('(Kosongkan jika tidak ingin mengubah)\n');
    
    // Input field-field yang bisa diubah
    const newName = await askQuestion(`Nama baru [${habit.name}]: `, tracker);
    const newFreq = await askQuestion(`Target baru [${habit.targetFrequency}]: `, tracker);
    
    // Ubah kategori jika diinginkan
    console.log(`\nKategori saat ini: ${habit.category}`);
    const changeCat = await askQuestion('Ubah kategori? (y/n): ', tracker);
    
    // Jika ya, minta input kategori baru
    let finalCat = null;
    if (changeCat.toLowerCase() === 'y') {
        finalCat = await askCategory(tracker);
    }
    
    // Proses perubahan
    const finalName = newName || null;
    const finalFreq = newFreq ? parseInt(newFreq) : null;
    
    // Validasi target frequency jika diubah
    if (finalName || finalFreq || finalCat) {
        tracker.editHabit(idx, finalName, finalFreq, finalCat);
    } else {
        UI.info('Tidak ada perubahan.');
    }
}

// ██ handleDeleteHabit - Handler untuk hapus kebiasaan
async function handleDeleteHabit(tracker) {
    if (!tracker.currentProfile) return UI.info('Tidak ada profil aktif.');
    if (tracker.habits.length === 0) return UI.info('Belum ada kebiasaan.');
    
    //  Tampilkan daftar kebiasaan
    tracker.displayHabits('all');
    console.log('\nOpsi Hapus:');
    console.log('1. Hapus kebiasaan tertentu');
    console.log('2. Hapus semua kebiasaan');
    console.log('0. Batal');

    // Minta input opsi hapus
    const option = await askQuestion('\nPilih opsi (0-2): ', tracker);
    
    // Hapus kebiasaan tertentu
    if (option === '1') {
        // Hapus kebiasaan tertentu
        const choice = await askQuestion('\nNomor kebiasaan untuk dihapus (0=batal): ', tracker);
        if (choice === '0') return UI.info('Dibatalkan.');
        
        //  Validasi nomor kebiasaan
        const idx = parseInt(choice);
        if (idx >= 1 && idx <= tracker.habits.length) {
            const habit = tracker.habits[idx - 1];
            const confirm = await askQuestion(`Yakin hapus "${habit.name}"? (y/n): `, tracker);
            if (confirm.toLowerCase() === 'y') {
                tracker.deleteHabit(idx);
            } else {
                UI.info('Dibatalkan.');
            }
        } else {
            UI.error('Nomor tidak valid.');
        }
    } else if (option === '2') {
        // Hapus semua kebiasaan dengan konfirmasi ketat
        console.log(`\n[!] PERINGATAN: Anda akan menghapus SEMUA ${tracker.habits.length} kebiasaan!`);
        const confirm = await askQuestion('Ketik "HAPUS SEMUA" untuk konfirmasi: ', tracker);
        
        //  Proses hapus semua jika konfirmasi sesuai
        if (confirm === 'HAPUS SEMUA') {
            const count = tracker.habits.length;
            tracker.habits = [];
            tracker.saveToFile();
            UI.success(`Berhasil menghapus ${count} kebiasaan.`);
        } else {
            UI.info('Dibatalkan. Konfirmasi tidak sesuai.');
        }
    } else if (option === '0') {
        UI.info('Dibatalkan.');
    } else {
        UI.error('Pilihan tidak valid.');
    }
}

/** 
* ██ displayLoopDemo - Demonstrasi penggunaan while dan for loop
* @param {Array} habits - Daftar kebiasaan
* @param {string} type - 'while' atau 'for' 
*/
function displayLoopDemo(habits, type) {
    const title = type === 'while' ? 'WHILE LOOP' : 'FOR LOOP';
    UI.header(`DEMONSTRASI ${title}`);
    
    if (habits.length === 0) {
        console.log('Belum ada kebiasaan.');
    } else if (type === 'while') {
        let i = 0;
        while (i < habits.length) {
            console.log(`${i + 1}. ${habits[i].name} - ${habits[i].isCompletedThisWeek() ? 'SELESAI' : 'AKTIF'}`);
            i++;
        }
    } else {
        for (let i = 0; i < habits.length; i++) {
            console.log(`${i + 1}. ${habits[i].name} - ${habits[i].isCompletedThisWeek() ? 'SELESAI' : 'AKTIF'}`);
        }
    }
    console.log('═'.repeat(60) + '\n');
}

// ╔════════════════════════════════════════════╗
// ║                 MAIN FUNCTION              ║
// ╚════════════════════════════════════════════╝ 

// ██ main - Fungsi utama aplikasi, Menangani first-time setup, login, dan main menu loop
async function main() {
    console.clear();
    console.log('\n' + CONFIG.colors.cyan + '═'.repeat(60));
    console.log('SELAMAT DATANG DI HABIT TRACKER');
    console.log('Bangun kebiasaan baik, capai tujuan Anda!');
    console.log('═'.repeat(60) + CONFIG.colors.reset);
    
    // Inisialisasi tracker (akan load data dari file jika ada)
    const tracker = new HabitTracker();
    
    // FIRST TIME USER - Belum ada profil sama sekali
    if (tracker.profiles.length === 0) {
        console.log('\nSepertinya ini adalah kunjungan pertama Anda!');
        const userName = await askQuestion('Bolehkah kami mengetahui nama Anda? ', tracker);
        
        // Jika user memasukkan nama, buat profil baru
        if (userName) {
            // Buat profil baru untuk first time user
            const newProfile = new UserProfile(userName);
            tracker.profiles.push(newProfile);
            tracker.currentProfile = newProfile;
            tracker.saveToFile();
            
            UI.success(`Profil "${userName}" telah dibuat!`);
            
            // Tawarkan pembuatan contoh kebiasaan
            const wantDemo = await askQuestion('\nIngin kami buatkan contoh kebiasaan? (y/n): ', tracker);
            if (wantDemo.toLowerCase() === 'y') {
                console.log('\n[...] Membuat contoh kebiasaan...');
                // Generate 5 contoh kebiasaan
                tracker.addHabit('Minum Air 8 Gelas', 7, 'Kesehatan');
                tracker.addHabit('Olahraga 30 Menit', 5, 'Kesehatan');
                tracker.addHabit('Membaca Buku 30 Menit', 5, 'Produktivitas');
                tracker.addHabit('Meditasi 10 Menit', 7, 'Kesehatan');
                tracker.addHabit('Belajar Coding', 6, 'Produktivitas');
                console.log('[OK] Selesai! 5 contoh kebiasaan telah ditambahkan.');
            }
        }
    } else {
        // RETURNING USER - Ada profil tersimpan, tampilkan login screen
        console.log('\n' + CONFIG.colors.yellow + 'Data profil ditemukan!' + CONFIG.colors.reset);
        UI.header('PILIH PROFIL');
        
        // Tampilkan daftar profil dengan info kebiasaan
        tracker.profiles.forEach((profile, i) => {
            const count = tracker.getProfileHabitsCount(profile.id);
            console.log(`${i + 1}. ${CONFIG.colors.bright}${profile.name}${CONFIG.colors.reset} (${count} kebiasaan)`);
            console.log(`   Bergabung: ${new Date(profile.joinDate).toLocaleDateString('id-ID')}`);
        });
        
        // Opsi buat profil baru
        UI.separator();
        console.log(`${tracker.profiles.length + 1}. ${CONFIG.colors.green}Buat Profil Baru${CONFIG.colors.reset}`);
        UI.separator();
        
        // Loop sampai user pilih profil yang valid
        let validChoice = false;
        while (!validChoice) {
            const choice = await askQuestion(`\nPilih profil (1-${tracker.profiles.length + 1}): `, tracker);
            const num = parseInt(choice);
            
            if (num >= 1 && num <= tracker.profiles.length) {
                // Login ke profil yang dipilih
                const selected = tracker.profiles[num - 1];
                tracker.currentProfile = selected;
                tracker.loadHabitsForProfile(selected.id);
                
                console.log(`\n${CONFIG.colors.green}[OK] Selamat datang kembali, ${selected.name}!${CONFIG.colors.reset}`);
                console.log(`[INFO] ${tracker.habits.length} kebiasaan dimuat.`);
                
                // Tampilkan notifikasi pending habits hari ini
                const pending = tracker.habits.filter(h => !h.isCompletedToday()).length;
                if (pending > 0) {
                    console.log(`Anda memiliki ${CONFIG.colors.yellow}${pending} kebiasaan${CONFIG.colors.reset} yang belum diselesaikan hari ini.`);
                } else if (tracker.habits.length > 0) {
                    console.log(CONFIG.colors.green + 'Luar biasa! Semua kebiasaan hari ini sudah selesai! 🎉' + CONFIG.colors.reset);
                }
                
                validChoice = true;
            } else if (num === tracker.profiles.length + 1) {
                // Opsi buat profil baru dari login screen
                UI.header('BUAT PROFIL BARU');
                const newName = await askQuestion('Nama untuk profil baru: ', tracker);
                
                if (newName) {
                    const newProfile = new UserProfile(newName);
                    tracker.profiles.push(newProfile);
                    tracker.currentProfile = newProfile;
                    tracker.habits = [];
                    tracker.saveToFile();
                    
                    UI.success(`Profil "${newProfile.name}" berhasil dibuat!`);
                    
                    // Tawarkan contoh kebiasaan untuk profil baru
                    const wantDemo = await askQuestion('\nIngin kami buatkan contoh kebiasaan? (y/n): ', tracker);
                    if (wantDemo.toLowerCase() === 'y') {
                        console.log('\n[...] Membuat contoh kebiasaan...');
                        tracker.addHabit('Minum Air 8 Gelas', 7, 'Kesehatan');
                        tracker.addHabit('Olahraga 30 Menit', 5, 'Kesehatan');
                        tracker.addHabit('Membaca Buku 30 Menit', 5, 'Produktivitas');
                        tracker.addHabit('Meditasi 10 Menit', 7, 'Kesehatan');
                        tracker.addHabit('Belajar Coding', 6, 'Produktivitas');
                        console.log('[OK] Selesai! 5 contoh kebiasaan telah ditambahkan.');
                    }
                    
                    validChoice = true;
                } else {
                    UI.error('Nama tidak boleh kosong.');
                }
            } else {
                // Input tidak valid
                UI.error(`Pilihan tidak valid. Masukkan angka 1-${tracker.profiles.length + 1}.`);
            }
        }
    }
    
    // Mulai reminder system dan jalankan main menu loop
    tracker.startReminder();
    await handleMainMenu(tracker);
}

// ╔════════════════════════════════════════════╗
// ║                RUN APPLICATION             ║
// ╚════════════════════════════════════════════╝ 

// ██ Entry point - Jalankan aplikasi, Catch error global dan cleanup resources jika terjadi error
main().catch(error => {
    console.error('\n[X] Terjadi kesalahan:', error.message);
    rl.close();  // Pastikan readline interface ditutup
    process.exit(1);  // Exit dengan error code
});