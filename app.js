// ============================================
// HABIT TRACKER CLI - CHALLENGE 3
// ============================================
// NAMA: Tri Aji Prabandaru
// KELAS: BATCH 3 - REP, WPH-REP-109
// TANGGAL: 9 November 2025
// ============================================

const readline = require('readline');
const fs = require('fs');
const path = require('path');

// ============================================
// CONSTANTS & CONFIGURATION
// ============================================
const CONFIG = {
    dataFile: path.join(__dirname, 'habits-data.json'),
    reminderInterval: 10000,
    daysInWeek: 7,
    colors: {
        reset: '\x1b[0m',
        bright: '\x1b[1m',
        green: '\x1b[32m',
        yellow: '\x1b[33m',
        red: '\x1b[31m',
        cyan: '\x1b[36m',
        magenta: '\x1b[35m',
        darkgray: '\x1b[90m'
    }
};

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

// ============================================
// UTILITY FUNCTIONS
// ============================================
const UI = {
    header: (title) => {
        console.log('\n' + '='.repeat(60));
        console.log(CONFIG.colors.cyan + title + CONFIG.colors.reset);
        console.log('='.repeat(60));
    },
    separator: () => console.log('-'.repeat(60)),
    success: (msg) => console.log(`\n[OK] ${msg}`),
    error: (msg) => console.log(`\n[X] ${msg}`),
    info: (msg) => console.log(`\n[!] ${msg}`)
};

const DateUtils = {
    today: () => {
        const date = new Date();
        date.setHours(0, 0, 0, 0);
        return date;
    },
    weekStart: () => {
        const today = DateUtils.today();
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - today.getDay());
        return weekStart;
    },
    isSameDay: (date1, date2) => {
        const d1 = new Date(date1);
        const d2 = new Date(date2);
        d1.setHours(0, 0, 0, 0);
        d2.setHours(0, 0, 0, 0);
        return d1.getTime() === d2.getTime();
    },
    getDaysDiff: (date1, date2) => {
        const diffTime = Math.abs(new Date(date2) - new Date(date1));
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }
};

const FileManager = {
    read: () => {
        try {
            if (!fs.existsSync(CONFIG.dataFile)) return null;
            return JSON.parse(fs.readFileSync(CONFIG.dataFile, 'utf8'));
        } catch (error) {
            console.error('[X] Error reading file:', error.message);
            return null;
        }
    },
    write: (data) => {
        try {
            fs.writeFileSync(CONFIG.dataFile, JSON.stringify(data, null, 2), 'utf8');
            return true;
        } catch (error) {
            console.error('[X] Error writing file:', error.message);
            return false;
        }
    }
};

function askQuestion(question, tracker = null, skipPause = false) {
    return new Promise((resolve) => {
        if (tracker && !skipPause) tracker.pauseReminder?.();
        
        rl.question(question, (answer) => {
            if (tracker && !skipPause) tracker.resumeReminder?.();
            tracker?.resetReminder?.();
            resolve(answer.trim());
        });
    });
}

async function askCategory(tracker) {
    const categoryMap = {
        'K': 'Kesehatan', 'k': 'Kesehatan',
        'P': 'Produktivitas', 'p': 'Produktivitas',
        'H': 'Hobi', 'h': 'Hobi',
        'U': 'Umum', 'u': 'Umum'
    };
    
    console.log('\nKategori: K-Kesehatan | P-Produktivitas | H-Hobi | U-Umum | L-Custom');
    const choice = await askQuestion('Pilihan (K/P/H/U/L): ', tracker);
    
    if (choice.toUpperCase() === 'L') {
        return (await askQuestion('Nama kategori: ', tracker)) || 'Umum';
    }
    return categoryMap[choice] || 'Umum';
}

// ============================================
// USER PROFILE CLASS
// ============================================
class UserProfile {
    constructor(name, id = null) {
        this.id = id || Date.now() + Math.random();
        this.name = name;
        this.joinDate = new Date();
        this.currentStreak = 0;
        this.longestStreak = 0;
    }
    
    updateStats(habits) {
        const maxStreak = Math.max(0, ...habits.map(h => h.getCurrentStreak()));
        this.currentStreak = maxStreak;
        if (maxStreak > this.longestStreak) this.longestStreak = maxStreak;
    }
    
    getDaysJoined() {
        return DateUtils.getDaysDiff(this.joinDate, new Date());
    }
    
    getCompletedThisWeek(habits) {
        return habits.filter(h => h.isCompletedThisWeek()).length;
    }
}

// ============================================
// HABIT CLASS
// ============================================
class Habit {
    constructor(name, targetFrequency, category = 'Umum') {
        this.id = Date.now() + Math.random();
        this.name = name;
        this.targetFrequency = targetFrequency;
        this.completions = [];
        this.createdAt = new Date();
        this.category = category;
    }
    
    markComplete() {
        const today = DateUtils.today();
        const alreadyCompleted = this.completions.some(date => 
            DateUtils.isSameDay(date, today)
        );
        
        if (alreadyCompleted) return false;
        
        this.completions.push(today.toISOString());
        return true;
    }
    
    getThisWeekCompletions() {
        const weekStart = DateUtils.weekStart();
        return this.completions.filter(date => new Date(date) >= weekStart).length;
    }
    
    isCompletedThisWeek() {
        return this.getThisWeekCompletions() >= this.targetFrequency;
    }
    
    isCompletedToday() {
        const today = DateUtils.today();
        return this.completions.some(date => DateUtils.isSameDay(date, today));
    }
    
    getProgressPercentage() {
        return Math.min((this.getThisWeekCompletions() / this.targetFrequency) * 100, 100);
    }
    
    getProgressBar() {
        const percentage = this.getProgressPercentage();
        const filled = Math.floor(percentage / 3.33); // 30 chars total
        const bar = '█'.repeat(filled) + '▒'.repeat(30 - filled);
        return `${bar} ${percentage.toFixed(0)}%`;
    }
    
    getCurrentStreak() {
        if (this.completions.length === 0) return 0;
        
        const sorted = this.completions.map(d => new Date(d)).sort((a, b) => b - a);
        const today = DateUtils.today();
        let streak = 0;
        
        for (const completion of sorted) {
            const expectedDate = new Date(today);
            expectedDate.setDate(today.getDate() - streak);
            expectedDate.setHours(0, 0, 0, 0);
            
            if (DateUtils.isSameDay(completion, expectedDate)) {
                streak++;
            } else {
                break;
            }
        }
        
        return streak;
    }
    
    getStatusIcon() {
        if (this.isCompletedThisWeek()) return '[X]';
        if (this.isCompletedToday()) return '[~]';
        return '[ ]';
    }
}

// ============================================
// HABIT TRACKER CLASS
// ============================================
class HabitTracker {
    constructor() {
        this.profiles = [];
        this.currentProfile = null;
        this.habits = [];
        this.reminderTimer = null;
        this.reminderEnabled = false;
        this.loadFromFile();
    }
    
    // ========== HABIT MANAGEMENT ==========
    addHabit(name, frequency, category = 'Umum') {
        const habit = new Habit(name, frequency, category);
        this.habits.push(habit);
        this.saveToFile();
        return habit;
    }
    
    editHabit(index, newName, newFrequency, newCategory) {
        const habit = this.habits[index - 1];
        if (!habit) return UI.error('Kebiasaan tidak ditemukan.');
        
        if (newName) habit.name = newName;
        if (newFrequency) habit.targetFrequency = newFrequency;
        if (newCategory) habit.category = newCategory;
        
        this.saveToFile();
        UI.success(`Kebiasaan "${habit.name}" berhasil diperbarui.`);
    }
    
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
    
    deleteHabit(index) {
        const habit = this.habits[index - 1];
        if (!habit) return UI.error('Kebiasaan tidak ditemukan.');
        
        const name = habit.name;
        this.habits.splice(index - 1, 1);
        this.saveToFile();
        UI.success(`Kebiasaan "${name}" berhasil dihapus.`);
    }
    
    // ========== PROFILE MANAGEMENT ==========
    async createNewProfile() {
        UI.header('BUAT PROFIL BARU');
        const name = await askQuestion('Nama profil: ', this);
        
        if (!name) return UI.error('Nama tidak boleh kosong.');
        
        if (this.currentProfile) this.saveCurrentProfileHabits();
        
        const newProfile = new UserProfile(name);
        this.profiles.push(newProfile);
        this.currentProfile = newProfile;
        this.habits = [];
        this.saveToFile();
        
        UI.success(`Profil "${name}" berhasil dibuat dan diaktifkan!`);
    }
    
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
    
    async deleteProfile() {
        this.displayProfiles();
        if (this.profiles.length === 0) return UI.info('Tidak ada profil.');
        if (this.profiles.length === 1) return UI.info('Tidak dapat menghapus profil terakhir.');
        
        const choice = await askQuestion(`Pilih nomor untuk dihapus (1-${this.profiles.length}, 0=batal): `, this);
        if (choice === '0') return UI.info('Dibatalkan.');
        
        const index = parseInt(choice) - 1;
        if (index < 0 || index >= this.profiles.length) return UI.error('Nomor tidak valid.');
        
        const profile = this.profiles[index];
        const confirm = await askQuestion(`Yakin hapus "${profile.name}"? (y/n): `, this);
        
        if (confirm.toLowerCase() === 'y') {
            const deletedId = profile.id;
            this.profiles.splice(index, 1);
            
            if (this.currentProfile?.id === deletedId) {
                this.currentProfile = this.profiles[0] || null;
                if (this.currentProfile) this.loadHabitsForProfile(this.currentProfile.id);
                else this.habits = [];
            }
            
            const data = FileManager.read() || {};
            if (data.profileHabits?.[deletedId]) delete data.profileHabits[deletedId];
            data.profiles = this.profiles;
            data.currentProfileId = this.currentProfile?.id || null;
            FileManager.write(data);
            
            UI.success(`Profil "${profile.name}" berhasil dihapus.`);
        }
    }
    
    switchProfile(profileId) {
        const profile = this.profiles.find(p => p.id === profileId);
        if (!profile) return;
        
        if (this.currentProfile) this.saveCurrentProfileHabits();
        this.currentProfile = profile;
        this.loadHabitsForProfile(profileId);
        this.saveToFile();
    }
    
    loadHabitsForProfile(profileId) {
        const data = FileManager.read();
        this.habits = [];
        
        if (data?.profileHabits?.[profileId]) {
            data.profileHabits[profileId].forEach(hData => {
                const habit = new Habit(hData.name || 'Kebiasaan', hData.targetFrequency || 7, hData.category || 'Umum');
                habit.id = hData.id;
                habit.completions = hData.completions || [];
                habit.createdAt = hData.createdAt;
                this.habits.push(habit);
            });
        }
    }
    
    saveCurrentProfileHabits() {
        if (!this.currentProfile) return;
        
        const data = FileManager.read() || {};
        if (!data.profileHabits) data.profileHabits = {};
        data.profileHabits[this.currentProfile.id] = this.habits;
        FileManager.write(data);
    }
    
    getProfileHabitsCount(profileId) {
        const data = FileManager.read();
        return data?.profileHabits?.[profileId]?.length || 0;
    }
    
    // ========== DISPLAY METHODS ==========
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
        console.log('='.repeat(60) + '\n');
    }
    
    displayProfiles() {
        UI.header('DAFTAR PROFIL');
        
        if (this.profiles.length === 0) {
            console.log('Belum ada profil.');
        } else {
            this.profiles.forEach((profile, i) => {
                const active = this.currentProfile?.id === profile.id ? ` ${CONFIG.colors.yellow}(AKTIF)${CONFIG.colors.reset}` : '';
                const count = this.getProfileHabitsCount(profile.id);
                console.log(`${i + 1}. ${CONFIG.colors.bright}${profile.name}${CONFIG.colors.reset}${active} (${count} kebiasaan)`);
                console.log(`   Bergabung: ${new Date(profile.joinDate).toLocaleDateString('id-ID')}`);
            });
        }
        console.log('='.repeat(60) + '\n');
    }
    
    displayHabits(filter = 'all') {
        if (!this.currentProfile) return UI.info('Tidak ada profil aktif.');
        
        let habits = this.habits;
        let title = 'SEMUA KEBIASAAN';
        
        if (filter === 'active') {
            habits = this.habits.filter(h => !h.isCompletedThisWeek());
            title = 'KEBIASAAN AKTIF';
        } else if (filter === 'completed') {
            habits = this.habits.filter(h => h.isCompletedThisWeek());
            title = 'KEBIASAAN SELESAI';
        }
        
        UI.header(title);
        
        if (habits.length === 0) {
            if (this.habits.length === 0) {
                console.log('Belum ada kebiasaan.');
            } else {
                console.log(filter === 'active' ? 
                    CONFIG.colors.green + 'Selamat! Semua kebiasaan selesai! 🎉' + CONFIG.colors.reset :
                    'Belum ada kebiasaan selesai minggu ini.');
            }
        } else {
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
        console.log('\n' + '='.repeat(60) + '\n');
    }
    
    displayHabitsByCategory() {
        if (!this.currentProfile) return UI.info('Tidak ada profil aktif.');
        
        UI.header('KEBIASAAN PER KATEGORI');
        const categories = [...new Set(this.habits.map(h => h.category))];
        
        if (categories.length === 0) {
            console.log('Belum ada kebiasaan.');
        } else {
            categories.forEach(cat => {
                console.log(`\n[${cat}]`);
                this.habits.filter(h => h.category === cat).forEach(habit => {
                    console.log(`   ${habit.getStatusIcon()} ${habit.name} (${habit.getThisWeekCompletions()}/${habit.targetFrequency})`);
                });
            });
        }
        console.log('\n' + '='.repeat(60) + '\n');
    }
    
    displayStats() {
        if (!this.currentProfile) return UI.info('Tidak ada profil aktif.');
        
        this.currentProfile.updateStats(this.habits);
        UI.header('STATISTIK KEBIASAAN');
        
        const active = this.habits.filter(h => !h.isCompletedThisWeek()).length;
        const completed = this.habits.filter(h => h.isCompletedThisWeek()).length;
        
        console.log(`Total Kebiasaan         : ${this.habits.length}`);
        console.log(`Aktif                   : ${active}`);
        console.log(`Selesai                 : ${completed}`);
        
        if (this.habits.length > 0) {
            const avgProgress = this.habits.reduce((sum, h) => sum + h.getProgressPercentage(), 0) / this.habits.length;
            const totalCompletions = this.habits.reduce((sum, h) => sum + h.getThisWeekCompletions(), 0);
            
            console.log(`Progress Rata-rata      : ${avgProgress.toFixed(1)}%`);
            console.log(`Total Selesai Minggu Ini: ${totalCompletions} kali`);
            
            const streaks = this.habits.map(h => ({ name: h.name, streak: h.getCurrentStreak() }))
                .sort((a, b) => b.streak - a.streak);
            
            if (streaks[0].streak > 0) {
                console.log(`\nStreak Terpanjang:`);
                console.log(`   "${streaks[0].name}" - ${streaks[0].streak} hari`);
            }
        }
        console.log('='.repeat(60) + '\n');
    }
    
    displayHistory() {
        if (!this.currentProfile) return UI.info('Tidak ada profil aktif.');
        
        UI.header('RIWAYAT (7 Hari Terakhir)');
        
        if (this.habits.length === 0) {
            console.log('Belum ada kebiasaan.');
        } else {
            const today = DateUtils.today();
            
            for (let i = 6; i >= 0; i--) {
                const date = new Date(today);
                date.setDate(today.getDate() - i);
                
                const dateStr = date.toLocaleDateString('id-ID', {
                    weekday: 'short', day: '2-digit', month: 'short'
                });
                
                console.log(`\n${dateStr}:`);
                
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
        console.log('\n' + '='.repeat(60) + '\n');
    }
    
    // ========== REMINDER SYSTEM ==========
    startReminder() {
        if (this.reminderTimer) clearInterval(this.reminderTimer);
        this.reminderTimer = setInterval(() => this.showReminder(), CONFIG.reminderInterval);
        this.reminderEnabled = true;
        UI.success('Pengingat diaktifkan (setiap 10 detik).');
    }
    
    stopReminder() {
        if (this.reminderTimer) {
            clearInterval(this.reminderTimer);
            this.reminderTimer = null;
            this.reminderEnabled = false;
            UI.success('Pengingat dinonaktifkan.');
        }
    }
    
    toggleReminder() {
        this.reminderEnabled ? this.stopReminder() : this.startReminder();
    }
    
    pauseReminder() {
        if (this.reminderEnabled && this.reminderTimer) {
            clearInterval(this.reminderTimer);
            this.reminderTimer = null;
        }
    }
    
    resumeReminder() {
        if (this.reminderEnabled && !this.reminderTimer) {
            this.reminderTimer = setInterval(() => this.showReminder(), CONFIG.reminderInterval);
        }
    }
    
    resetReminder() {
        if (this.reminderEnabled && this.reminderTimer) {
            clearInterval(this.reminderTimer);
            this.reminderTimer = setInterval(() => this.showReminder(), CONFIG.reminderInterval);
        }
    }
    
    showReminder() {
        if (!this.currentProfile || this.habits.length === 0) return;
        
        const incomplete = this.habits.filter(h => !h.isCompletedToday());
        if (incomplete.length === 0) return;
        
        console.clear();
        console.log('\n' + CONFIG.colors.yellow + '-'.repeat(60));
        console.log('PENGINGAT KEBIASAAN HARI INI :');
        incomplete.forEach((h, i) => {
            console.log(`${i + 1}. ${h.name} (${h.getThisWeekCompletions()}/${h.targetFrequency})`);
        });
        console.log('-'.repeat(60) + CONFIG.colors.reset);
        console.log(CONFIG.colors.darkgray + 'Notifikasi: ' + CONFIG.colors.red + 'AKTIF' + CONFIG.colors.reset);
        console.log(CONFIG.colors.darkgray + 'Matikan melalui menu utama.' + CONFIG.colors.reset);
    }
    
    // ========== FILE OPERATIONS ==========
    saveToFile() {
        const data = FileManager.read() || { profileHabits: {} };
        
        data.profiles = this.profiles;
        data.currentProfileId = this.currentProfile?.id || null;
        
        if (this.currentProfile) {
            data.profileHabits[this.currentProfile.id] = this.habits;
        }
        
        this.profiles.forEach(p => {
            if (!data.profileHabits[p.id]) data.profileHabits[p.id] = [];
        });
        
        FileManager.write(data);
    }
    
    loadFromFile() {
        const data = FileManager.read();
        if (!data) return;
        
        if (data.profiles) {
            this.profiles = data.profiles.map(pData => {
                const profile = new UserProfile(pData.name || 'User', pData.id);
                profile.joinDate = pData.joinDate || new Date();
                profile.currentStreak = pData.currentStreak || 0;
                profile.longestStreak = pData.longestStreak || 0;
                return profile;
            });
        }
        
        if (data.currentProfileId) {
            this.currentProfile = this.profiles.find(p => p.id === data.currentProfileId);
        }
        
        if (this.currentProfile) {
            this.loadHabitsForProfile(this.currentProfile.id);
        }
        
        console.log('[OK] Data berhasil dimuat.');
    }
    
    exportData() {
        if (!this.currentProfile) return UI.info('Tidak ada profil aktif.');
        
        const exportPath = path.join(__dirname, 'habits-export.txt');
        let text = '='.repeat(60) + '\nEKSPOR DATA HABIT TRACKER\n' + '='.repeat(60) + '\n\n';
        text += `Nama: ${this.currentProfile.name}\n`;
        text += `Tanggal: ${new Date().toLocaleString('id-ID')}\n`;
        text += `Total Kebiasaan: ${this.habits.length}\n\n`;
        text += '='.repeat(60) + '\nDAFTAR KEBIASAAN\n' + '='.repeat(60) + '\n\n';
        
        this.habits.forEach((h, i) => {
            text += `${i + 1}. ${h.name}\n`;
            text += `   Kategori: ${h.category}\n`;
            text += `   Target: ${h.targetFrequency}x/minggu\n`;
            text += `   Progress: ${h.getThisWeekCompletions()}/${h.targetFrequency} (${h.getProgressPercentage().toFixed(0)}%)\n`;
            text += `   Streak: ${h.getCurrentStreak()} hari\n`;
            text += `   Total Penyelesaian: ${h.completions.length}x\n\n`;
        });
        
        try {
            fs.writeFileSync(exportPath, text, 'utf8');
            UI.success(`Data diekspor ke: ${exportPath}`);
        } catch (error) {
            UI.error('Gagal mengekspor data.');
        }
    }
    
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

// ============================================
// MENU DISPLAYS
// ============================================
function displayMainMenu(tracker) {
    console.clear();
    const active = tracker.habits.filter(h => !h.isCompletedThisWeek()).length;
    const completed = tracker.habits.filter(h => h.isCompletedThisWeek()).length;
    const pending = tracker.habits.filter(h => !h.isCompletedToday()).length;
    const profileName = tracker.currentProfile ? tracker.currentProfile.name : 'Tidak ada';
    const streak = tracker.currentProfile ? tracker.currentProfile.currentStreak : 0;
    const reminderStatus = tracker.reminderEnabled ? 'AKTIF' : 'NONAKTIF';

    console.log('\n' + '='.repeat(60));
    console.log(CONFIG.colors.cyan + 'HABIT TRACKER - MENU UTAMA' + CONFIG.colors.reset);
    console.log('='.repeat(60));
    console.log(CONFIG.colors.yellow + `Profil: ` + CONFIG.colors.magenta + profileName);
    console.log(CONFIG.colors.yellow + `Kebiasaan: ${active} aktif, ${completed} selesai`);
    if (pending > 0) console.log(`Pending hari ini: ${pending} kebiasaan`);
    console.log(`Streak: ${streak} hari` + CONFIG.colors.reset);
    console.log('='.repeat(60));
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

function displayProfileMenu(tracker) {
    console.clear();
    UI.header('KELOLA PROFIL');
    console.log('Profil Aktif: ' + CONFIG.colors.magenta + (tracker.currentProfile ? tracker.currentProfile.name : 'Tidak ada') + CONFIG.colors.reset);
    console.log('='.repeat(60));
    console.log('1. Lihat Profil Saya');
    console.log('2. Ganti Profil');
    console.log('3. Buat Profil Baru');
    console.log('4. Hapus Profil');
    UI.separator();
    console.log('0. Kembali ke Menu Utama');
    UI.separator();
}

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

// ============================================
// MENU HANDLERS
// ============================================
async function handleProfileMenu(tracker) {
    let running = true;
    
    while (running) {
        displayProfileMenu(tracker);
        const choice = await askQuestion('\n> Menu Utama > Kelola Profil\nPilih menu (0-4): ', tracker, true);
        
        if (choice !== '0') console.clear();
        
        switch (choice) {
            case '1':
                tracker.displayProfile();
                break;
            case '2':
                await tracker.selectProfile();
                break;
            case '3':
                await tracker.createNewProfile();
                break;
            case '4':
                await tracker.deleteProfile();
                break;
            case '0':
                running = false;
                break;
            default:
                if (choice.trim()) UI.error('Pilihan tidak valid.');
                break;
        }
        
        if (choice !== '0' && choice.trim() && running) {
            await askQuestion('\n[Tekan Enter untuk melanjutkan...]', tracker);
        }
    }
}

async function handleHabitMenu(tracker) {
    let running = true;
    
    while (running) {
        displayHabitMenu();
        const choice = await askQuestion('\n> Menu Utama > Kelola Kebiasaan\nPilih menu (0-10): ', tracker, true);
        
        if (choice !== '0') console.clear();
        
        switch (choice) {
            case '1':
                tracker.displayHabits('all');
                break;
            case '2':
                tracker.displayHabitsByCategory();
                break;
            case '3':
                tracker.displayHabits('active');
                break;
            case '4':
                tracker.displayHabits('completed');
                break;
            case '5':
                tracker.displayStats();
                break;
            case '6':
                tracker.displayHistory();
                break;
            case '7':
                await handleAddHabit(tracker);
                break;
            case '8':
                await handleCompleteHabit(tracker);
                break;
            case '9':
                await handleEditHabit(tracker);
                break;
            case '10':
                await handleDeleteHabit(tracker);
                break;
            case '0':
                running = false;
                break;
            default:
                if (choice.trim()) UI.error('Pilihan tidak valid.');
                break;
        }
        
        if (choice !== '0' && choice.trim() && running) {
            await askQuestion('\n[Tekan Enter untuk melanjutkan...]', tracker);
        }
    }
}

async function handleAddHabit(tracker) {
    if (!tracker.currentProfile) return UI.info('Tidak ada profil aktif.');
    
    UI.header('TAMBAH KEBIASAAN BARU');
    const name = await askQuestion('Nama kebiasaan: ', tracker);
    const frequency = await askQuestion('Target per minggu (1-7): ', tracker);
    const category = await askCategory(tracker);
    
    const freq = parseInt(frequency);
    if (name && freq >= 1 && freq <= 7) {
        tracker.addHabit(name, freq, category);
        UI.success(`Kebiasaan "${name}" (${category}) berhasil ditambahkan!`);
    } else {
        UI.error('Input tidak valid.');
    }
}

async function handleCompleteHabit(tracker) {
    if (!tracker.currentProfile) return UI.info('Tidak ada profil aktif.');
    
    tracker.displayHabits('all');
    if (tracker.habits.length === 0) return;
    
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

async function handleEditHabit(tracker) {
    if (!tracker.currentProfile) return UI.info('Tidak ada profil aktif.');
    
    tracker.displayHabits('all');
    if (tracker.habits.length === 0) return;
    
    const choice = await askQuestion('Nomor kebiasaan untuk diedit (0=batal): ', tracker);
    if (choice === '0') return;
    
    const idx = parseInt(choice);
    if (idx < 1 || idx > tracker.habits.length) return UI.error('Nomor tidak valid.');
    
    const habit = tracker.habits[idx - 1];
    console.log(`\nEdit "${habit.name}"`);
    console.log('(Kosongkan jika tidak ingin mengubah)\n');
    
    const newName = await askQuestion(`Nama baru [${habit.name}]: `, tracker);
    const newFreq = await askQuestion(`Target baru [${habit.targetFrequency}]: `, tracker);
    
    console.log(`\nKategori saat ini: ${habit.category}`);
    const changeCat = await askQuestion('Ubah kategori? (y/n): ', tracker);
    
    let finalCat = null;
    if (changeCat.toLowerCase() === 'y') {
        finalCat = await askCategory(tracker);
    }
    
    const finalName = newName || null;
    const finalFreq = newFreq ? parseInt(newFreq) : null;
    
    if (finalName || finalFreq || finalCat) {
        tracker.editHabit(idx, finalName, finalFreq, finalCat);
    } else {
        UI.info('Tidak ada perubahan.');
    }
}

async function handleDeleteHabit(tracker) {
    if (!tracker.currentProfile) return UI.info('Tidak ada profil aktif.');
    if (tracker.habits.length === 0) return UI.info('Belum ada kebiasaan.');
    
    tracker.displayHabits('all');
    console.log('\nOpsi Hapus:');
    console.log('1. Hapus kebiasaan tertentu');
    console.log('2. Hapus semua kebiasaan');
    console.log('0. Batal');
    
    const option = await askQuestion('\nPilih opsi (0-2): ', tracker);
    
    if (option === '1') {
        const choice = await askQuestion('\nNomor kebiasaan untuk dihapus (0=batal): ', tracker);
        if (choice === '0') return UI.info('Dibatalkan.');
        
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
        console.log(`\n[!] PERINGATAN: Anda akan menghapus SEMUA ${tracker.habits.length} kebiasaan!`);
        const confirm = await askQuestion('Ketik "HAPUS SEMUA" untuk konfirmasi: ', tracker);
        
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
    console.log('='.repeat(60) + '\n');
}

async function handleMainMenu(tracker) {
    let running = true;
    
    while (running) {
        displayMainMenu(tracker);
        const choice = await askQuestion('\nPilih menu (0-9): ', tracker, true);
        
        console.clear();
        
        switch (choice) {
            case '1':
                await handleProfileMenu(tracker);
                break;
            case '2':
                await handleHabitMenu(tracker);
                break;
            case '3':
                if (!tracker.currentProfile) {
                    UI.info('Tidak ada profil aktif.');
                } else {
                    tracker.displayHabits('all');
                }
                break;
            case '4':
                await handleAddHabit(tracker);
                break;
            case '5':
                await handleCompleteHabit(tracker);
                break;
            case '6':
                displayLoopDemo(tracker.habits, 'while');
                await askQuestion('[Tekan Enter untuk melanjutkan ke FOR loop...]', tracker);
                displayLoopDemo(tracker.habits, 'for');
                break;
            case '7':
                tracker.exportData();
                break;
            case '8':
                await tracker.generateDemoHabits();
                break;
            case '9':
                tracker.toggleReminder();
                break;
            case '0':
                console.clear();
                console.log('\n' + '='.repeat(60));
                console.log('Terima kasih telah menggunakan HABIT TRACKER');
                console.log('='.repeat(60) + '\n');
                tracker.stopReminder();
                running = false;
                break;
            default:
                if (choice.trim()) UI.error('Pilihan tidak valid.');
                break;
        }
        
        if (running && choice !== '0' && choice !== '9' && choice.trim()) {
            await askQuestion('\n[Tekan Enter untuk melanjutkan...]', tracker);
        }
    }
    
    rl.close();
}

// ============================================
// MAIN FUNCTION
// ============================================
async function main() {
    console.clear();
    console.log('\n' + CONFIG.colors.cyan + '='.repeat(60));
    console.log('SELAMAT DATANG DI HABIT TRACKER');
    console.log('Bangun kebiasaan baik, capai tujuan Anda!');
    console.log('='.repeat(60) + CONFIG.colors.reset);
    
    const tracker = new HabitTracker();
    
    if (tracker.profiles.length === 0) {
        console.log('\nSepertinya ini adalah kunjungan pertama Anda!');
        const userName = await askQuestion('Bolehkah kami mengetahui nama Anda? ', tracker);
        
        if (userName) {
            const newProfile = new UserProfile(userName);
            tracker.profiles.push(newProfile);
            tracker.currentProfile = newProfile;
            tracker.saveToFile();
            
            UI.success(`Profil "${userName}" telah dibuat!`);
            
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
        }
    } else {
        console.log('\n' + CONFIG.colors.yellow + 'Data profil ditemukan!' + CONFIG.colors.reset);
        UI.header('PILIH PROFIL');
        
        tracker.profiles.forEach((profile, i) => {
            const count = tracker.getProfileHabitsCount(profile.id);
            console.log(`${i + 1}. ${CONFIG.colors.bright}${profile.name}${CONFIG.colors.reset} (${count} kebiasaan)`);
            console.log(`   Bergabung: ${new Date(profile.joinDate).toLocaleDateString('id-ID')}`);
        });
        
        UI.separator();
        console.log(`${tracker.profiles.length + 1}. ${CONFIG.colors.green}Buat Profil Baru${CONFIG.colors.reset}`);
        UI.separator();
        
        let validChoice = false;
        while (!validChoice) {
            const choice = await askQuestion(`\nPilih profil (1-${tracker.profiles.length + 1}): `, tracker);
            const num = parseInt(choice);
            
            if (num >= 1 && num <= tracker.profiles.length) {
                const selected = tracker.profiles[num - 1];
                tracker.currentProfile = selected;
                tracker.loadHabitsForProfile(selected.id);
                
                console.log(`\n${CONFIG.colors.green}[OK] Selamat datang kembali, ${selected.name}!${CONFIG.colors.reset}`);
                console.log(`[INFO] ${tracker.habits.length} kebiasaan dimuat.`);
                
                const pending = tracker.habits.filter(h => !h.isCompletedToday()).length;
                if (pending > 0) {
                    console.log(`Anda memiliki ${CONFIG.colors.yellow}${pending} kebiasaan${CONFIG.colors.reset} yang belum diselesaikan hari ini.`);
                } else if (tracker.habits.length > 0) {
                    console.log(CONFIG.colors.green + 'Luar biasa! Semua kebiasaan hari ini sudah selesai! 🎉' + CONFIG.colors.reset);
                }
                
                validChoice = true;
            } else if (num === tracker.profiles.length + 1) {
                UI.header('BUAT PROFIL BARU');
                const newName = await askQuestion('Nama untuk profil baru: ', tracker);
                
                if (newName) {
                    const newProfile = new UserProfile(newName);
                    tracker.profiles.push(newProfile);
                    tracker.currentProfile = newProfile;
                    tracker.habits = [];
                    tracker.saveToFile();
                    
                    UI.success(`Profil "${newProfile.name}" berhasil dibuat!`);
                    
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
                UI.error(`Pilihan tidak valid. Masukkan angka 1-${tracker.profiles.length + 1}.`);
            }
        }
    }
    
    tracker.startReminder();
    await handleMainMenu(tracker);
}

// ============================================
// RUN APPLICATION
// ============================================
main().catch(error => {
    console.error('\n[X] Terjadi kesalahan:', error.message);
    rl.close();
    process.exit(1);
});