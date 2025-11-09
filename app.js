// ============================================
// HABIT TRACKER CLI - CHALLENGE 3
// ============================================
// NAMA: Tri Aji Prabandaru
// KELAS: BATCH 3 - REP, WPH-REP-109
// TANGGAL: 9 November 2025
// ============================================

// Import module yang diperlukan
const readline = require('readline');
const fs = require('fs');
const path = require('path');
 
// Definisikan konstanta
const DATA_FILE = path.join(__dirname, 'habits-data.json');
const REMINDER_INTERVAL = 10000; // 10 detik
const DAYS_IN_WEEK = 7;

// Setup readline interface
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

// Color codes untuk terminal
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    red: '\x1b[31m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m',
    magenta: '\x1b[35m',
    darkgray: '\x1b[90m'
};

// ============================================
// USER PROFILE CLASS
// ============================================
class UserProfile {
    constructor(name, id = null) {
        this.id = id || Date.now() + Math.random();
        this.name = name;
        this.joinDate = new Date();
        this.totalHabits = 0;
        this.completedThisWeek = 0;
        this.currentStreak = 0;
        this.longestStreak = 0;
    }
    
    updateStats(habits) {
        this.totalHabits = habits.length;
        const completedHabits = habits.filter(h => h.isCompletedThisWeek());
        this.completedThisWeek = completedHabits.length;
        this.updateStreak(habits);
    }
    
    getDaysJoined() {
        const today = new Date();
        const joinDate = new Date(this.joinDate);
        const diffTime = Math.abs(today - joinDate);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays;
    }
    
    updateStreak(habits) {
        if (habits.length === 0) {
            this.currentStreak = 0;
            return;
        }
        
        let maxStreak = 0;
        habits.forEach(habit => {
            const streak = habit.getCurrentStreak();
            if (streak > maxStreak) {
                maxStreak = streak;
            }
        });
        
        this.currentStreak = maxStreak;
        if (this.currentStreak > this.longestStreak) {
            this.longestStreak = this.currentStreak;
        }
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
        this.priority = 'normal';
    }
    
    markComplete() {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const alreadyCompleted = this.completions.find(date => {
            const completionDate = new Date(date);
            completionDate.setHours(0, 0, 0, 0);
            return completionDate.getTime() === today.getTime();
        });
        
        if (alreadyCompleted) {
            return false;
        }
        
        this.completions.push(today.toISOString());
        return true;
    }
    
    getThisWeekCompletions() {
        const today = new Date();
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - today.getDay());
        weekStart.setHours(0, 0, 0, 0);
        
        const thisWeekCompletions = this.completions.filter(dateStr => {
            const completionDate = new Date(dateStr);
            return completionDate >= weekStart;
        });
        
        return thisWeekCompletions.length;
    }
    
    isCompletedThisWeek() {
        return this.getThisWeekCompletions() >= this.targetFrequency;
    }
    
    getProgressPercentage() {
        const completed = this.getThisWeekCompletions();
        const percentage = (completed / this.targetFrequency) * 100;
        return Math.min(percentage, 100);
    }
    
    getStatus() {
        return this.isCompletedThisWeek() ? 'SELESAI' : 'AKTIF';
    }
    
    getStatusIcon() {
        if (this.isCompletedThisWeek()) return '[X]';
        if (this.isCompletedToday()) return '[~]';
        return '[ ]';
    }
    
    getProgressBar() {
        const percentage = this.getProgressPercentage();
        const filled = Math.floor(percentage / (100 / 30)); // 30 karakter total (3x lipat dari 10)
        const empty = 30 - filled;
        const bar = '█'.repeat(filled) + '▒'.repeat(empty);
        return `${bar} ${percentage.toFixed(0)}%`;
    }
    
    getCurrentStreak() {
        if (this.completions.length === 0) return 0;
        
        const sortedCompletions = this.completions
            .map(d => new Date(d))
            .sort((a, b) => b - a);
        
        let streak = 0;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        for (let i = 0; i < sortedCompletions.length; i++) {
            const completionDate = new Date(sortedCompletions[i]);
            completionDate.setHours(0, 0, 0, 0);
            
            const expectedDate = new Date(today);
            expectedDate.setDate(today.getDate() - streak);
            expectedDate.setHours(0, 0, 0, 0);
            
            if (completionDate.getTime() === expectedDate.getTime()) {
                streak++;
            } else {
                break;
            }
        }
        
        return streak;
    }
    
    isCompletedToday() {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const completedToday = this.completions.find(dateStr => {
            const completionDate = new Date(dateStr);
            completionDate.setHours(0, 0, 0, 0);
            return completionDate.getTime() === today.getTime();
        });
        
        return !!completedToday;
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
    
    addHabit(name, frequency, category = 'Umum') {
        const habit = new Habit(name, frequency, category);
        this.habits.push(habit);
        this.saveToFile();
        return habit;
    }
    
    editHabit(habitIndex, newName, newFrequency, newCategory) {
        const habit = this.habits[habitIndex - 1] ?? null;
        
        if (!habit) {
            console.log('\n[X] Kebiasaan tidak ditemukan.');
            return false;
        }
        
        if (newName) habit.name = newName;
        if (newFrequency) habit.targetFrequency = newFrequency;
        if (newCategory) habit.category = newCategory;
        
        this.saveToFile();
        console.log(`\n[OK] Kebiasaan "${habit.name}" telah berhasil diperbarui.`);
        return true;
    }
    
    completeHabit(habitIndex) {
        const habit = this.habits[habitIndex - 1] ?? null;
        
        if (!habit) {
            console.log('\n[X] Kebiasaan tidak ditemukan.');
            return false;
        }
        
        const success = habit.markComplete();
        if (success) {
            this.saveToFile();
            console.log(`\n[OK] "${habit.name}" telah berhasil diselesaikan pada hari ini!`);
            return true;
        } else {
            console.log(`\n[!] Anda telah menyelesaikan "${habit.name}" pada hari ini.`);
            return false;
        }
    }
    
    deleteHabit(habitIndex) {
        const habit = this.habits[habitIndex - 1] ?? null;
        
        if (!habit) {
            console.log('\n[X] Kebiasaan tidak ditemukan.');
            return false;
        }
        
        const habitName = habit.name;
        this.habits.splice(habitIndex - 1, 1);
        this.saveToFile();
        console.log(`\n[OK] Kebiasaan "${habitName}" telah berhasil dihapus.`);
        return true;
    }
    
    displayProfile() {
        if (!this.currentProfile) {
            console.log('\n[!] Tidak ada profil yang aktif. Silakan pilih atau buat profil terlebih dahulu.');
            return;
        }
        
        this.currentProfile.updateStats(this.habits);
        
        console.log('\n' + '='.repeat(60));
        console.log(colors.cyan + 'PROFIL PENGGUNA' + colors.reset);
        console.log('='.repeat(60));
        console.log(`Nama             : ${this.currentProfile.name}`);
        console.log(`Bergabung        : ${this.currentProfile.getDaysJoined()} hari yang lalu`);
        console.log(`Total Kebiasaan  : ${this.currentProfile.totalHabits}`);
        console.log(`Selesai Minggu   : ${this.currentProfile.completedThisWeek}`);
        console.log(`Streak Saat Ini  : ${this.currentProfile.currentStreak} hari`);
        console.log(`Streak Terbaik   : ${this.currentProfile.longestStreak} hari`);
        console.log('='.repeat(60) + '\n');
    }
    
    displayProfiles() {
        console.log('\n' + '='.repeat(60));
        console.log(colors.cyan + 'DAFTAR PROFIL' + colors.reset);
        console.log('='.repeat(60));
        
        if (this.profiles.length === 0) {
            console.log('Belum ada profil yang tersimpan.');
        } else {
            this.profiles.forEach((profile, index) => {
                const activeMarker = this.currentProfile && profile.id === this.currentProfile.id ? ` ${colors.yellow}(AKTIF)${colors.reset}` : '';
                const habitsCount = this.getProfileHabitsCount(profile.id);
                console.log(`${index + 1}. ${colors.bright}${profile.name}${colors.reset}${activeMarker} (${habitsCount} kebiasaan)`);
                const joinDate = new Date(profile.joinDate).toLocaleDateString('id-ID');
                console.log(`   Bergabung: ${joinDate}`);
            });
        }
        
        console.log('='.repeat(60) + '\n');
    }
    
    async selectProfile() {
        this.displayProfiles();
        
        if (this.profiles.length === 0) {
            console.log('[!] Tidak ada profil yang tersedia. Silakan buat profil baru terlebih dahulu.');
            return;
        }
        
        const choice = await askQuestion(`Pilih nomor profil (1-${this.profiles.length}) atau 0 untuk batal: `, this);
        
        if (choice === '0') {
            console.log('\n[X] Dibatalkan.');
            return;
        }
        
        const profileIndex = parseInt(choice) - 1;
        
        if (profileIndex >= 0 && profileIndex < this.profiles.length) {
            const selectedProfile = this.profiles[profileIndex];
            this.switchProfile(selectedProfile.id);
            console.log(`\n[OK] Profil "${selectedProfile.name}" telah dipilih.`);
            console.log(`[INFO] ${this.habits.length} kebiasaan dimuat untuk profil ini.`);
        } else {
            console.log('\n[X] Nomor profil tidak valid.');
        }
    }
    
    async deleteProfile() {
        this.displayProfiles();
        
        if (this.profiles.length === 0) {
            console.log('[!] Tidak ada profil yang tersedia.');
            return;
        }
        
        if (this.profiles.length === 1) {
            console.log('[!] Tidak dapat menghapus profil terakhir.');
            return;
        }
        
        const choice = await askQuestion(`Pilih nomor profil yang akan dihapus (1-${this.profiles.length}) atau 0 untuk batal: `, this);
        
        if (choice === '0') {
            console.log('\n[X] Dibatalkan.');
            return;
        }
        
        const profileIndex = parseInt(choice) - 1;
        
        if (profileIndex >= 0 && profileIndex < this.profiles.length) {
            const profileToDelete = this.profiles[profileIndex];
            const confirm = await askQuestion(`[!] Yakin ingin menghapus profil "${profileToDelete.name}"? (y/n): `, this);
            
            if (confirm.toLowerCase() === 'y') {
                const deletedProfileId = profileToDelete.id;
                
                // Hapus profil dari array
                this.profiles.splice(profileIndex, 1);
                
                // Jika profil yang dihapus adalah profil aktif, switch ke profil lain
                if (this.currentProfile && this.currentProfile.id === deletedProfileId) {
                    if (this.profiles.length > 0) {
                        this.currentProfile = this.profiles[0];
                        // Load habits profil baru
                        this.loadHabitsForProfile(this.currentProfile.id);
                    } else {
                        this.currentProfile = null;
                        this.habits = [];
                    }
                }
                
                // Hapus habits profil yang dihapus dari file
                try {
                    if (fs.existsSync(DATA_FILE)) {
                        const jsonData = fs.readFileSync(DATA_FILE, 'utf8');
                        const data = JSON.parse(jsonData);
                        
                        if (data.profileHabits && data.profileHabits[deletedProfileId]) {
                            delete data.profileHabits[deletedProfileId];
                        }
                        
                        data.profiles = this.profiles;
                        data.currentProfileId = this.currentProfile ? this.currentProfile.id : null;
                        
                        const updatedJsonData = JSON.stringify(data, null, 2);
                        fs.writeFileSync(DATA_FILE, updatedJsonData, 'utf8');
                    }
                } catch (error) {
                    console.error('[X] Error saat menghapus data profil:', error.message);
                }
                
                this.saveToFile();
                console.log(`\n[OK] Profil "${profileToDelete.name}" telah dihapus.`);
            }
        } else {
            console.log('\n[X] Nomor profil tidak valid.');
        }
    }
    
    switchProfile(profileId) {
        const profile = this.profiles.find(p => p.id === profileId);
        if (profile) {
            // Simpan habits profil saat ini sebelum switch
            if (this.currentProfile) {
                this.saveCurrentProfileHabits();
            }
            
            // Switch ke profil baru
            this.currentProfile = profile;
            
            // Load habits untuk profil baru
            this.loadHabitsForProfile(profileId);
            
            // Simpan perubahan profile aktif
            this.saveToFile();
        }
    }
    
    loadHabitsForProfile(profileId) {
        // Load habits dari file untuk profile tertentu
        try {
            if (fs.existsSync(DATA_FILE)) {
                const jsonData = fs.readFileSync(DATA_FILE, 'utf8');
                const data = JSON.parse(jsonData);
                
                // Clear habits saat ini
                this.habits = [];
                
                // Load habits untuk profile ini
                if (data.profileHabits && data.profileHabits[profileId]) {
                    const habitsData = data.profileHabits[profileId];
                    habitsData.forEach(habitData => {
                        const habit = new Habit(
                            habitData.name ?? 'Kebiasaan Tanpa Nama',
                            habitData.targetFrequency ?? 7,
                            habitData.category ?? 'Umum'
                        );
                        habit.id = habitData.id;
                        habit.completions = habitData.completions ?? [];
                        habit.createdAt = habitData.createdAt;
                        habit.priority = habitData.priority ?? 'normal';
                        this.habits.push(habit);
                    });
                }
            }
        } catch (error) {
            console.error('[X] Terjadi kesalahan saat memuat habits:', error.message);
            this.habits = [];
        }
    }
    
    getProfileHabitsCount(profileId) {
        // Hitung jumlah kebiasaan untuk profil tertentu
        try {
            if (fs.existsSync(DATA_FILE)) {
                const jsonData = fs.readFileSync(DATA_FILE, 'utf8');
                const data = JSON.parse(jsonData);
                
                if (data.profileHabits && data.profileHabits[profileId]) {
                    return data.profileHabits[profileId].length;
                }
            }
        } catch (error) {
            return 0;
        }
        return 0;
    }
    
    saveCurrentProfileHabits() {
        // Simpan habits profil saat ini ke memori sementara di file
        if (!this.currentProfile) return;
        
        try {
            if (fs.existsSync(DATA_FILE)) {
                const jsonData = fs.readFileSync(DATA_FILE, 'utf8');
                const data = JSON.parse(jsonData);
                
                // Update habits untuk profil saat ini
                if (!data.profileHabits) {
                    data.profileHabits = {};
                }
                data.profileHabits[this.currentProfile.id] = this.habits;
                
                // Simpan kembali ke file
                const updatedJsonData = JSON.stringify(data, null, 2);
                fs.writeFileSync(DATA_FILE, updatedJsonData, 'utf8');
            }
        } catch (error) {
            console.error('[X] Terjadi kesalahan saat menyimpan habits profil:', error.message);
        }
    }
    
    async createNewProfile() {
        console.log('\n' + '='.repeat(60));
        console.log(colors.cyan + 'BUAT PROFIL BARU' + colors.reset);
        console.log('='.repeat(60));
        const newName = await askQuestion('Nama untuk profil baru: ', this);
        
        if (newName && newName.trim() !== '') {
            // Simpan habits profil saat ini sebelum switch
            if (this.currentProfile) {
                this.saveCurrentProfileHabits();
            }
            
            const newProfile = new UserProfile(newName.trim());
            this.profiles.push(newProfile);
            
            // Switch ke profil baru
            this.currentProfile = newProfile;
            
            // Mulai dengan habits kosong untuk profil baru
            this.habits = [];
            
            this.saveToFile();
            console.log(`\n[OK] Profil baru "${newProfile.name}" telah berhasil dibuat dan diaktifkan!`);
        } else {
            console.log('\n[X] Nama tidak boleh kosong.');
        }
    }
    
    displayHabits(filterType = 'all') {
        if (!this.currentProfile) {
            console.log('\n[!] Tidak ada profil yang aktif. Silakan pilih atau buat profil terlebih dahulu.');
            return;
        }
        
        let habitsToShow = this.habits;
        let title = 'SEMUA KEBIASAAN';
        
        if (filterType === 'active') {
            habitsToShow = this.habits.filter(h => !h.isCompletedThisWeek());
            title = 'KEBIASAAN AKTIF';
        } else if (filterType === 'completed') {
            habitsToShow = this.habits.filter(h => h.isCompletedThisWeek());
            title = 'KEBIASAAN SELESAI';
        }
        
        console.log('\n' + '='.repeat(60));
        console.log(colors.cyan + title + colors.reset);
        console.log('='.repeat(60));
        
        if (habitsToShow.length === 0) {
            if (this.habits.length === 0) {
                console.log('Belum ada kebiasaan yang terdaftar.');
                console.log('Silakan tambahkan kebiasaan baru.');
            } else {
                if (filterType === 'active') {
                    console.log(colors.green + 'Selamat! Semua kebiasaan minggu ini sudah selesai! 🎉' + colors.reset);
                    console.log('Anda telah menyelesaikan ' + this.habits.length + ' kebiasaan.');
                } else if (filterType === 'completed') {
                    console.log('Belum ada kebiasaan yang diselesaikan minggu ini.');
                    console.log('Semangat! Mulai tandai kebiasaan yang sudah dilakukan.');
                }
            }
        } else {
            habitsToShow.forEach((habit, index) => {
                const originalIndex = this.habits.indexOf(habit) + 1;
                const completedToday = habit.isCompletedToday() ? ' (Selesai Hari Ini)' : '';
                const streak = habit.getCurrentStreak();
                
                console.log(`\n${originalIndex}. ${habit.getStatusIcon()} ${habit.name}${completedToday}`);
                console.log(`   Kategori: ${habit.category}`);
                console.log(`   Target: ${habit.targetFrequency}x/minggu | Progress: ${habit.getThisWeekCompletions()}/${habit.targetFrequency} (${habit.getProgressPercentage().toFixed(0)}%)`);
                console.log(colors.yellow + `   ${habit.getProgressBar()}` + colors.reset);
                console.log(`   Streak: ${streak} hari berturut-turut`);
            });
        }
        
        console.log('\n' + '='.repeat(60) + '\n');
    }
    
    displayHabitsByCategory() {
        if (!this.currentProfile) {
            console.log('\n[!] Tidak ada profil yang aktif.');
            return;
        }
        
        console.log('\n' + '='.repeat(60));
        console.log(colors.cyan + 'KEBIASAAN PER KATEGORI' + colors.reset);
        console.log('='.repeat(60));
        
        const categories = [...new Set(this.habits.map(h => h.category))];
        
        if (categories.length === 0) {
            console.log('Belum ada kebiasaan yang terdaftar.');
        } else {
            categories.forEach(category => {
                console.log(`\n[${category}]`);
                const categoryHabits = this.habits.filter(h => h.category === category);
                categoryHabits.forEach(habit => {
                    const completed = habit.getThisWeekCompletions();
                    const target = habit.targetFrequency;
                    const status = habit.getStatusIcon();
                    console.log(`   ${status} ${habit.name} (${completed}/${target})`);
                });
            });
        }
        
        console.log('\n' + '='.repeat(60) + '\n');
    }
    
    displayStats() {
        if (!this.currentProfile) {
            console.log('\n[!] Tidak ada profil yang aktif.');
            return;
        }
        
        this.currentProfile.updateStats(this.habits);
        
        console.log('\n' + '='.repeat(60));
        console.log(colors.cyan + 'STATISTIK KEBIASAAN' + colors.reset);
        console.log('='.repeat(60));
        
        const activeHabits = this.habits.filter(h => !h.isCompletedThisWeek());
        const completedHabits = this.habits.filter(h => h.isCompletedThisWeek());
        
        console.log(`Total Kebiasaan         : ${this.habits.length}`);
        console.log(`Aktif                   : ${activeHabits.length}`);
        console.log(`Selesai                 : ${completedHabits.length}`);
        
        if (this.habits.length > 0) {
            const percentages = this.habits.map(h => h.getProgressPercentage());
            const totalPercentage = percentages.reduce((sum, p) => sum + p, 0);
            const avgPercentage = totalPercentage / this.habits.length;
            
            console.log(`Progress Rata-rata      : ${avgPercentage.toFixed(1)}%`);
            
            const totalCompletions = this.habits.reduce((sum, h) => {
                return sum + h.getThisWeekCompletions();
            }, 0);
            
            console.log(`Total Selesai Minggu Ini: ${totalCompletions} kali`);
            
            const habitsWithStreak = this.habits.map(h => ({
                name: h.name,
                streak: h.getCurrentStreak()
            }));
            habitsWithStreak.sort((a, b) => b.streak - a.streak);
            
            if (habitsWithStreak[0].streak > 0) {
                console.log(`\nStreak Terpanjang:`);
                console.log(`   "${habitsWithStreak[0].name}" - ${habitsWithStreak[0].streak} hari`);
            }
        }
        
        console.log('='.repeat(60) + '\n');
    }
    
    displayHistory() {
        if (!this.currentProfile) {
            console.log('\n[!] Tidak ada profil yang aktif.');
            return;
        }
        
        console.log('\n' + '='.repeat(60));
        console.log(colors.cyan + 'RIWAYAT PENYELESAIAN (7 Hari Terakhir)' + colors.reset);
        console.log('='.repeat(60));
        
        if (this.habits.length === 0) {
            console.log('Belum ada kebiasaan yang terdaftar.');
        } else {
            const today = new Date();
            
            for (let i = 6; i >= 0; i--) {
                const date = new Date(today);
                date.setDate(today.getDate() - i);
                date.setHours(0, 0, 0, 0);
                
                const dateStr = date.toLocaleDateString('id-ID', {
                    weekday: 'short',
                    day: '2-digit',
                    month: 'short'
                });
                
                console.log(`\n${dateStr}:`);
                
                let hasCompletion = false;
                this.habits.forEach(habit => {
                    const completed = habit.completions.find(compStr => {
                        const compDate = new Date(compStr);
                        compDate.setHours(0, 0, 0, 0);
                        return compDate.getTime() === date.getTime();
                    });
                    
                    if (completed) {
                        console.log(`   [X] ${habit.name}`);
                        hasCompletion = true;
                    }
                });
                
                if (!hasCompletion) {
                    console.log('   (Tidak ada penyelesaian)');
                }
            }
        }
        
        console.log('\n' + '='.repeat(60) + '\n');
    }
    
    async generateDemoHabits() {
        if (!this.currentProfile) {
            console.log('\n[!] Tidak ada profil yang aktif.');
            return;
        }
        
        console.log('\n' + '='.repeat(60));
        console.log('GENERATE DEMO KEBIASAAN');
        console.log('='.repeat(60));
        
        const confirm = await askQuestion('\nGenerate 5 contoh kebiasaan? (y/n): ', this);
        
        if (confirm.toLowerCase() === 'y') {
            console.log('\n[...] Membuat contoh kebiasaan...');
            this.addHabit('Minum Air 8 Gelas', 7, 'Kesehatan');
            this.addHabit('Olahraga 30 Menit', 5, 'Kesehatan');
            this.addHabit('Membaca Buku 30 Menit', 5, 'Produktivitas');
            this.addHabit('Meditasi 10 Menit', 7, 'Kesehatan');
            this.addHabit('Belajar Coding', 6, 'Produktivitas');
            console.log('\n[OK] Selesai! 5 contoh kebiasaan telah ditambahkan.');
        } else {
            console.log('\n[X] Dibatalkan.');
        }
    }
    
    startReminder() {
        if (this.reminderTimer) {
            clearInterval(this.reminderTimer);
        }
        
        this.reminderTimer = setInterval(() => {
            this.showReminder();
        }, REMINDER_INTERVAL);
        
        this.reminderEnabled = true;
        console.log('\n[OK] Pengingat otomatis telah diaktifkan. (setiap 10 detik)');
    }
    
    // Method untuk pause reminder (saat user sedang input)
    pauseReminder() {
        if (this.reminderEnabled && this.reminderTimer) {
            clearInterval(this.reminderTimer);
            this.reminderTimer = null;
        }
    }
    
    // Method untuk resume reminder (setelah user selesai input)
    resumeReminder() {
        if (this.reminderEnabled && !this.reminderTimer) {
            this.reminderTimer = setInterval(() => {
                this.showReminder();
            }, REMINDER_INTERVAL);
        }
    }
    
    // Method untuk reset timer reminder (dipanggil setiap ada input)
    resetReminder() {
        if (this.reminderEnabled && this.reminderTimer) {
            clearInterval(this.reminderTimer);
            this.reminderTimer = setInterval(() => {
                this.showReminder();
            }, REMINDER_INTERVAL);
        }
    }
    
    showReminder() {
        if (!this.currentProfile) return;
        
        // Jangan tampilkan reminder jika belum ada kebiasaan
        if (this.habits.length === 0) return;
        
        const incompleteToday = this.habits.filter(h => !h.isCompletedToday());
        
        // Jangan tampilkan reminder jika semua kebiasaan hari ini sudah diselesaikan
        if (incompleteToday.length === 0) return;

        console.clear();        
        
        console.log('\n' + colors.yellow +  '-'.repeat(60));
        console.log('PENGINGAT KEBIASAAN HARI INI :');
        
        incompleteToday.forEach((habit, index) => {
            const completed = habit.getThisWeekCompletions();
            const target = habit.targetFrequency;
            console.log(`${index + 1}. ${habit.name} (${completed}/${target})`);
        });
        
        console.log('-'.repeat(60) + colors.reset);
        console.log(colors.darkgray + 'Notifikasi: ' + colors.red + 'AKTIF' + colors.reset);
        console.log(colors.darkgray + 'Pesan ini muncul setiap 10 detik.' + colors.reset);
        console.log(colors.darkgray + 'Matikan notifikasi melalui menu utama.' + colors.reset);
    }
    
    stopReminder() {
        if (this.reminderTimer) {
            clearInterval(this.reminderTimer);
            this.reminderTimer = null;
            this.reminderEnabled = false;
            console.log('\n[OK] Pengingat otomatis telah dinonaktifkan.');
        }
    }
    
    toggleReminder() {
        if (this.reminderEnabled) {
            this.stopReminder();
        } else {
            this.startReminder();
        }
    }
    
    saveToFile() {
        try {
            let existingData = { profileHabits: {} };
            
            // Load existing data untuk mempertahankan habits profil lain
            if (fs.existsSync(DATA_FILE)) {
                const jsonData = fs.readFileSync(DATA_FILE, 'utf8');
                existingData = JSON.parse(jsonData);
            }
            
            // Update data dengan profil dan habits saat ini
            const data = {
                profiles: this.profiles,
                currentProfileId: this.currentProfile ? this.currentProfile.id : null,
                profileHabits: existingData.profileHabits || {}
            };
            
            // Update habits untuk profil saat ini
            if (this.currentProfile) {
                data.profileHabits[this.currentProfile.id] = this.habits;
            }
            
            // Pastikan semua profil punya entry di profileHabits
            this.profiles.forEach(profile => {
                if (!data.profileHabits[profile.id]) {
                    data.profileHabits[profile.id] = [];
                }
            });
            
            const jsonData = JSON.stringify(data, null, 2);
            fs.writeFileSync(DATA_FILE, jsonData, 'utf8');
        } catch (error) {
            console.error('[X] Terjadi kesalahan saat menyimpan data:', error.message);
        }
    }
    
    loadFromFile() {
        try {
            if (fs.existsSync(DATA_FILE)) {
                const jsonData = fs.readFileSync(DATA_FILE, 'utf8');
                const data = JSON.parse(jsonData);
                
                this.profiles = [];
                if (data.profiles && Array.isArray(data.profiles)) {
                    data.profiles.forEach(profileData => {
                        const profile = new UserProfile(
                            profileData.name ?? 'User',
                            profileData.id
                        );
                        profile.joinDate = profileData.joinDate ?? new Date();
                        profile.currentStreak = profileData.currentStreak ?? 0;
                        profile.longestStreak = profileData.longestStreak ?? 0;
                        this.profiles.push(profile);
                    });
                }
                
                if (data.currentProfileId) {
                    const currentProf = this.profiles.find(p => p.id === data.currentProfileId);
                    if (currentProf) {
                        this.currentProfile = currentProf;
                    }
                }
                
                if (this.currentProfile && data.profileHabits && data.profileHabits[this.currentProfile.id]) {
                    this.habits = [];
                    const habitsData = data.profileHabits[this.currentProfile.id];
                    habitsData.forEach(habitData => {
                        const habit = new Habit(
                            habitData.name ?? 'Kebiasaan Tanpa Nama',
                            habitData.targetFrequency ?? 7,
                            habitData.category ?? 'Umum'
                        );
                        habit.id = habitData.id;
                        habit.completions = habitData.completions ?? [];
                        habit.createdAt = habitData.createdAt;
                        habit.priority = habitData.priority ?? 'normal';
                        this.habits.push(habit);
                    });
                }
                
                console.log('[OK] Data berhasil dimuat.');
            }
        } catch (error) {
            console.error('[X] Terjadi kesalahan saat memuat data:', error.message);
        }
    }
    
    exportData() {
        if (!this.currentProfile) {
            console.log('\n[!] Tidak ada profil yang aktif.');
            return;
        }
        
        const exportPath = path.join(__dirname, 'habits-export.txt');
        let exportText = '';
        
        exportText += '='.repeat(60) + '\n';
        exportText += 'EKSPOR DATA HABIT TRACKER\n';
        exportText += '='.repeat(60) + '\n\n';
        
        exportText += `Nama: ${this.currentProfile.name}\n`;
        exportText += `Tanggal Ekspor: ${new Date().toLocaleString('id-ID')}\n`;
        exportText += `Total Kebiasaan: ${this.habits.length}\n\n`;
        
        exportText += '='.repeat(60) + '\n';
        exportText += 'DAFTAR KEBIASAAN\n';
        exportText += '='.repeat(60) + '\n\n';
        
        this.habits.forEach((habit, index) => {
            exportText += `${index + 1}. ${habit.name}\n`;
            exportText += `   Kategori: ${habit.category}\n`;
            exportText += `   Target: ${habit.targetFrequency}x/minggu\n`;
            exportText += `   Status: ${habit.getStatus()}\n`;
            exportText += `   Progress: ${habit.getThisWeekCompletions()}/${habit.targetFrequency} (${habit.getProgressPercentage().toFixed(0)}%)\n`;
            exportText += `   Streak: ${habit.getCurrentStreak()} hari\n`;
            exportText += `   Total Penyelesaian: ${habit.completions.length}x\n\n`;
        });
        
        try {
            fs.writeFileSync(exportPath, exportText, 'utf8');
            console.log(`\n[OK] Data berhasil diekspor ke: ${exportPath}`);
        } catch (error) {
            console.error('[X] Terjadi kesalahan saat mengekspor data:', error.message);
        }
    }
}

// ============================================
// HELPER FUNCTIONS
// ============================================

function askQuestion(question, tracker = null, skipPause = false) {
    return new Promise((resolve) => {
        // Pause reminder saat menunggu input user (kecuali untuk pilihan menu utama)
        if (tracker && tracker.pauseReminder && !skipPause) {
            tracker.pauseReminder();
        }
        
        rl.question(question, (answer) => {
            // Resume reminder setelah user input (kecuali untuk pilihan menu utama)
            if (tracker && tracker.resumeReminder && !skipPause) {
                tracker.resumeReminder();
            }
            
            // Reset reminder timer setiap ada input keyboard
            if (tracker && tracker.resetReminder) {
                tracker.resetReminder();
            }
            resolve(answer);
        });
    });
}

async function askCategory(tracker) {
    console.log('\nPilih Kategori:');
    console.log('K - Kesehatan');
    console.log('P - Produktivitas');
    console.log('H - Hobi');
    console.log('U - Umum');
    console.log('L - Lainnya (Custom)');
    
    const choice = await askQuestion('Pilihan (K/P/H/U/L): ', tracker);
    const categoryMap = {
        'K': 'Kesehatan',
        'k': 'Kesehatan',
        'P': 'Produktivitas',
        'p': 'Produktivitas',
        'H': 'Hobi',
        'h': 'Hobi',
        'U': 'Umum',
        'u': 'Umum'
    };
    
    if (choice.toUpperCase() === 'L') {
        const customCategory = await askQuestion('Masukkan nama kategori: ', tracker);
        return customCategory.trim() || 'Umum';
    } else if (categoryMap[choice]) {
        return categoryMap[choice];
    } else {
        console.log('[!] Pilihan tidak valid, menggunakan kategori "Umum"');
        return 'Umum';
    }
}

function displayMainMenu(tracker) {
    console.clear();
    const activeHabits = tracker.habits.filter(h => !h.isCompletedThisWeek()).length;
    const completedHabits = tracker.habits.filter(h => h.isCompletedThisWeek()).length;
    const pendingToday = tracker.habits.filter(h => !h.isCompletedToday()).length;
    const profileName = tracker.currentProfile ? tracker.currentProfile.name : 'Tidak ada';
    const streak = tracker.currentProfile ? tracker.currentProfile.currentStreak : 0;
    const reminderStatus = tracker.reminderEnabled ? 'AKTIF' : 'NONAKTIF';

    console.clear();
    console.log('\n' + '='.repeat(60));
    console.log(colors.cyan + 'HABIT TRACKER - MENU UTAMA' + colors.reset);
    console.log('='.repeat(60));
    console.log(colors.yellow + `Profil:` + colors.magenta + ` ${profileName}` + colors.yellow);
    console.log(`Kebiasaan: ${activeHabits} aktif, ${completedHabits} selesai`);
    if (pendingToday > 0) {
      console.log(`Pending hari ini: ${pendingToday} kebiasaan`);
    }
    console.log(`Streak: ${streak} hari` + colors.reset);
    console.log('='.repeat(60));
    console.log(colors.cyan + 'Kelola:' + colors.reset);
    console.log('1. Kelola Profil');
    console.log('2. Kelola Kebiasaan');
    console.log('-'.repeat(60));
    console.log(colors.cyan + 'Shortcut:' + colors.reset);
    console.log('3. Lihat Semua Kebiasaan');
    console.log('4. Tambah Kebiasaan Baru');
    console.log('5. Tandai Kebiasaan Selesai');
    console.log('-'.repeat(60));
    console.log(colors.cyan + 'Utilitas:' + colors.reset);
    console.log('6. Demo Loop');
    console.log('7. Ekspor Data');
    console.log('8. Generate Demo Kebiasaan');
    console.log(`9. Reminder` + colors.magenta + ` (${reminderStatus})` + colors.reset);
    console.log('-'.repeat(60));
    console.log('0. Keluar');
    console.log('-'.repeat(60));
}

function displayProfileMenu(tracker) {
    console.clear();
    console.log('\n' + '='.repeat(60));
    console.log(colors.cyan + 'KELOLA PROFIL');
    console.log('Profil Aktif: ' + colors.magenta + (tracker.currentProfile ? tracker.currentProfile.name : 'Tidak ada') + colors.reset);
    console.log('='.repeat(60));
    console.log('1. Lihat Profil Saya');
    console.log('2. Ganti Profil');
    console.log('3. Buat Profil Baru');
    console.log('4. Hapus Profil');
    console.log('-'.repeat(60));
    console.log('0. Kembali ke Menu Utama');
    console.log('-'.repeat(60));
}

function displayHabitMenu() {
    console.clear();
    console.log('\n' + '='.repeat(60));
    console.log(colors.cyan + 'KELOLA KEBIASAAN' + colors.reset);
    console.log('='.repeat(60));
    console.log(colors.cyan + 'Tampilan:' + colors.reset);
    console.log('1. Lihat Semua Kebiasaan');
    console.log('2. Lihat per Kategori');
    console.log('3. Kebiasaan Aktif Saja');
    console.log('4. Kebiasaan Selesai Saja');
    console.log('-'.repeat(60));
    console.log(colors.cyan + 'Analisis:' + colors.reset);
    console.log('5. Lihat Statistik');
    console.log('6. Lihat Riwayat (7 hari)');
    console.log('-'.repeat(60));
    console.log(colors.cyan + 'Aksi:' + colors.reset);
    console.log('7. Tambah Kebiasaan Baru');
    console.log('8. Tandai Kebiasaan Selesai');
    console.log('9. Edit Kebiasaan');
    console.log('10. Hapus Kebiasaan');
    console.log('-'.repeat(60));
    console.log('0. Kembali ke Menu Utama');
    console.log('-'.repeat(60));
}

async function handleProfileMenu(tracker) {
    let running = true;
    
    while (running) {
        displayProfileMenu(tracker);
        // skipPause = true agar reminder tidak pause saat pilih menu Kelola Profil
        const choice = await askQuestion('\n> Menu Utama > Kelola Profil\nPilih menu (0-4): ', tracker, true);
        
        // Jangan clear console jika pilihan adalah '0' (kembali)
        if (choice !== '0') {
            console.clear();
        }
        
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
                // Langsung kembali tanpa pesan
                running = false;
                break;
                
            default:
                // Jika input kosong (dari reminder), langsung lanjut tanpa pesan error
                if (choice.trim() !== '') {
                    console.log('\n[X] Pilihan tidak valid. Silakan coba lagi.');
                }
                break;
        }
        
        // Hanya tampilkan prompt jika bukan pilihan '0' atau input kosong
        if (choice !== '0' && choice.trim() !== '' && running) {
            await askQuestion('\n[Tekan Enter untuk melanjutkan...]', tracker);
        }
    }
}

async function handleHabitMenu(tracker) {
    let running = true;
    
    while (running) {
        displayHabitMenu();
        // skipPause = true agar reminder tidak pause saat pilih menu Kelola Kebiasaan
        const choice = await askQuestion('\n> Menu Utama > Kelola Kebiasaan\nPilih menu (0-10): ', tracker, true);
        
        // Jangan clear console jika pilihan adalah '0' (kembali)
        if (choice !== '0') {
            console.clear();
        }
        
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
                if (!tracker.currentProfile) {
                    console.log('\n[!] Tidak ada profil yang aktif.');
                    break;
                }
                console.log('\n' + '='.repeat(60));
                console.log(colors.cyan + 'TAMBAH KEBIASAAN BARU' + colors.reset);
                console.log('='.repeat(60));
                const name = await askQuestion('Nama kebiasaan: ', tracker);
                const frequency = await askQuestion('Target per minggu (1-7): ', tracker);
                const category = await askCategory(tracker);
                
                const freq = parseInt(frequency);
                if (name && freq >= 1 && freq <= 7) {
                    tracker.addHabit(name, freq, category);
                    console.log(`\n[OK] Kebiasaan "${name}" (${category}) telah berhasil ditambahkan!`);
                } else {
                    console.log('\n[X] Input tidak valid.');
                }
                break;
                
            case '8':
                if (!tracker.currentProfile) {
                    console.log('\n[!] Tidak ada profil yang aktif.');
                    break;
                }
                tracker.displayHabits('all');
                if (tracker.habits.length > 0) {
                    const completeIndex = await askQuestion('Nomor kebiasaan yang selesai (atau 0 untuk batal): ', tracker);
                    if (completeIndex !== '0') {
                        const idx = parseInt(completeIndex);
                        if (idx >= 1 && idx <= tracker.habits.length) {
                            tracker.completeHabit(idx);
                        } else {
                            console.log('\n[X] Nomor tidak valid.');
                        }
                    }
                }
                break;
                
            case '9':
                if (!tracker.currentProfile) {
                    console.log('\n[!] Tidak ada profil yang aktif.');
                    break;
                }
                tracker.displayHabits('all');
                if (tracker.habits.length > 0) {
                    const editIndex = await askQuestion('Nomor kebiasaan yang akan diedit (atau 0 untuk batal): ', tracker);
                    if (editIndex !== '0') {
                        const idx = parseInt(editIndex);
                        if (idx >= 1 && idx <= tracker.habits.length) {
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
                            
                            const finalName = newName.trim() || null;
                            const finalFreq = newFreq ? parseInt(newFreq) : null;
                            
                            if (finalName || finalFreq || finalCat) {
                                tracker.editHabit(idx, finalName, finalFreq, finalCat);
                            } else {
                                console.log('\n[X] Tidak ada perubahan.');
                            }
                        } else {
                            console.log('\n[X] Nomor tidak valid.');
                        }
                    }
                }
                break;
                
            case '10':
                if (!tracker.currentProfile) {
                    console.log('\n[!] Tidak ada profil yang aktif.');
                    break;
                }
                
                if (tracker.habits.length === 0) {
                    console.log('\n[!] Belum ada kebiasaan yang terdaftar.');
                    break;
                }
                
                tracker.displayHabits('all');
                console.log('\nOpsi Hapus:');
                console.log('1. Hapus kebiasaan tertentu');
                console.log('2. Hapus semua kebiasaan');
                console.log('0. Batal');
                
                const deleteOption = await askQuestion('\nPilih opsi (0-2): ', tracker);
                
                if (deleteOption === '1') {
                    const deleteIndex = await askQuestion('\nNomor kebiasaan yang akan dihapus (atau 0 untuk batal): ', tracker);
                    if (deleteIndex !== '0') {
                        const delIdx = parseInt(deleteIndex);
                        if (delIdx >= 1 && delIdx <= tracker.habits.length) {
                            const habitToDelete = tracker.habits[delIdx - 1];
                            const confirm = await askQuestion(`[!] Yakin ingin menghapus "${habitToDelete.name}"? (y/n): `, tracker);
                            if (confirm.toLowerCase() === 'y') {
                                tracker.deleteHabit(delIdx);
                            } else {
                                console.log('\n[X] Dibatalkan.');
                            }
                        } else {
                            console.log('\n[X] Nomor tidak valid.');
                        }
                    } else {
                        console.log('\n[X] Dibatalkan.');
                    }
                } else if (deleteOption === '2') {
                    console.log(`\n[!] PERINGATAN: Anda akan menghapus SEMUA ${tracker.habits.length} kebiasaan!`);
                    const confirmAll = await askQuestion('Ketik "HAPUS SEMUA" untuk konfirmasi: ', tracker);
                    
                    if (confirmAll === 'HAPUS SEMUA') {
                        const habitCount = tracker.habits.length;
                        tracker.habits = [];
                        tracker.saveToFile();
                        console.log(`\n[OK] Berhasil menghapus ${habitCount} kebiasaan.`);
                    } else {
                        console.log('\n[X] Dibatalkan. Konfirmasi tidak sesuai.');
                    }
                } else if (deleteOption === '0') {
                    console.log('\n[X] Dibatalkan.');
                } else {
                    console.log('\n[X] Pilihan tidak valid.');
                }
                break;
                
            case '0':
                // Langsung kembali tanpa pesan
                running = false;
                break;
                
            default:
                // Jika input kosong (dari reminder), langsung lanjut tanpa pesan error
                if (choice.trim() !== '') {
                    console.log('\n[X] Pilihan tidak valid. Silakan coba lagi.');
                }
                break;
        }
        
        // Hanya tampilkan prompt jika bukan pilihan '0' atau input kosong
        if (choice !== '0' && choice.trim() !== '' && running) {
            await askQuestion('\n[Tekan Enter untuk melanjutkan...]', tracker);
        }
    }
}

function displayHabitsWithWhile(habits) {
    console.log('\n' + '='.repeat(60));
    console.log('DEMONSTRASI WHILE LOOP');
    console.log('='.repeat(60));
    
    if (habits.length === 0) {
        console.log('Belum ada kebiasaan yang terdaftar.');
    } else {
        let i = 0;
        while (i < habits.length) {
            const habit = habits[i];
            console.log(`${i + 1}. ${habit.name} - ${habit.getStatus()}`);
            i++;
        }
    }
    
    console.log('='.repeat(60) + '\n');
}

function displayHabitsWithFor(habits) {
    console.log('\n' + '='.repeat(60));
    console.log('DEMONSTRASI FOR LOOP');
    console.log('='.repeat(60));
    
    if (habits.length === 0) {
        console.log('Belum ada kebiasaan yang terdaftar.');
    } else {
        for (let i = 0; i < habits.length; i++) {
            const habit = habits[i];
            console.log(`${i + 1}. ${habit.name} - ${habit.getStatus()}`);
        }
    }
    
    console.log('='.repeat(60) + '\n');
}

async function handleMainMenu(tracker) {
    let running = true;
    
    while (running) {
        displayMainMenu(tracker);
        // skipPause = true agar reminder tidak pause saat pilih menu utama
        const choice = await askQuestion('\nPilih menu (0-9): ', tracker, true);
        
        console.clear();
        
        switch (choice) {
            case '1':
                // Menu dengan sub-menu - reminder akan pause di dalamnya
                await handleProfileMenu(tracker);
                break;
                
            case '2':
                // Menu dengan sub-menu - reminder akan pause di dalamnya
                await handleHabitMenu(tracker);
                break;
                
            case '3':
                // Menu display - tidak perlu pause, langsung selesai
                if (!tracker.currentProfile) {
                    console.log('\n[!] Tidak ada profil yang aktif. Silakan pilih atau buat profil terlebih dahulu.');
                    break;
                }
                tracker.displayHabits('all');
                break;
                
            case '4':
                // Menu dengan multiple input - reminder akan pause otomatis
                if (!tracker.currentProfile) {
                    console.log('\n[!] Tidak ada profil yang aktif. Silakan pilih atau buat profil terlebih dahulu.');
                    break;
                }
                console.log('\n' + '='.repeat(60));
                console.log(colors.cyan + 'TAMBAH KEBIASAAN BARU' + colors.reset);
                console.log('='.repeat(60));
                const name = await askQuestion('Nama kebiasaan: ', tracker);
                const frequency = await askQuestion('Target per minggu (1-7): ', tracker);
                const category = await askCategory(tracker);
                
                const freq = parseInt(frequency);
                if (name && freq >= 1 && freq <= 7) {
                    tracker.addHabit(name, freq, category);
                    console.log(`\n[OK] Kebiasaan "${name}" (${category}) telah berhasil ditambahkan!`);
                } else {
                    console.log('\n[X] Input tidak valid.');
                }
                break;
                
            case '5':
                // Menu dengan input - reminder akan pause otomatis
                if (!tracker.currentProfile) {
                    console.log('\n[!] Tidak ada profil yang aktif.');
                    break;
                }
                tracker.displayHabits('all');
                if (tracker.habits.length > 0) {
                    const completeIndex = await askQuestion('Nomor kebiasaan yang selesai (atau 0 untuk batal): ', tracker);
                    if (completeIndex !== '0') {
                        const idx = parseInt(completeIndex);
                        if (idx >= 1 && idx <= tracker.habits.length) {
                            tracker.completeHabit(idx);
                        } else {
                            console.log('\n[X] Nomor tidak valid.');
                        }
                    }
                }
                break;
                
            case '6':
                // Menu demo loop - tidak perlu pause, langsung selesai
                console.log('\n' + '='.repeat(60));
                console.log('DEMONSTRASI LOOP');
                console.log('='.repeat(60));
                displayHabitsWithWhile(tracker.habits);
                await askQuestion('[Tekan Enter untuk melanjutkan ke FOR loop...]', tracker);
                displayHabitsWithFor(tracker.habits);
                break;
                
            case '7':
                // Menu export - tidak perlu pause, langsung selesai
                tracker.exportData();
                break;
                
            case '8':
                // Menu generate demo - ada input confirmation
                await tracker.generateDemoHabits();
                break;
                    
            case '9':
                // Menu toggle reminder - langsung selesai
                tracker.toggleReminder();
                break;
                
            case '0':
                // Menu exit - langsung selesai
                console.clear();
                console.log('\n' + '='.repeat(60));
                console.log('Terima kasih telah menggunakan HABIT TRACKER');
                console.log('='.repeat(60) + '\n');
                tracker.stopReminder();
                running = false;
                break;
                
            default:
                // Jika input kosong (dari reminder), langsung lanjut tanpa pesan error
                if (choice.trim() !== '') {
                    console.log('\n[X] Pilihan tidak valid. Silakan coba lagi.');
                }
                break;
        }
        
        // Hanya tampilkan prompt jika masih running, bukan pilihan '0', '9' (toggle reminder), atau input kosong
        if (running && choice !== '0' && choice !== '9' && choice.trim() !== '') {
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
    console.log('\n' + colors.cyan + '='.repeat(60) + colors.reset);
    console.log(colors.cyan + 'SELAMAT DATANG DI HABIT TRACKER' + colors.reset);
    console.log(colors.cyan + 'Bangun kebiasaan baik, capai tujuan Anda!' + colors.reset);
    console.log(colors.cyan + '='.repeat(60) + colors.reset);
    
    const tracker = new HabitTracker();
    
    if (tracker.profiles.length === 0) {
        // Tidak ada profil sama sekali - First time user
        console.log('\nSepertinya ini adalah kunjungan pertama Anda!');
        const userName = await askQuestion('Bolehkah kami mengetahui nama Anda? ', tracker);
        
        if (userName && userName.trim() !== '') {
            const newProfile = new UserProfile(userName.trim());
            tracker.profiles.push(newProfile);
            tracker.currentProfile = newProfile;
            tracker.saveToFile();
            
            console.log(`\n[OK] Profil "${userName.trim()}" telah dibuat!`);
            
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
        } else {
            console.log('\n[!] Anda dapat membuat profil nanti melalui menu.');
        }
    } else {
        // Ada profil yang tersimpan - Tampilkan menu login
        console.log('\n' + colors.yellow + 'Data profil ditemukan!' + colors.reset);
        console.log('\n' + '='.repeat(60));
        console.log(colors.cyan + 'PILIH PROFIL' + colors.reset);
        console.log('='.repeat(60));
        
        // Tampilkan daftar profil
        tracker.profiles.forEach((profile, index) => {
            const habitsCount = tracker.getProfileHabitsCount(profile.id);
            console.log(`${index + 1}. ${colors.bright}${profile.name}${colors.reset} (${habitsCount} kebiasaan)`);
            const joinDate = new Date(profile.joinDate).toLocaleDateString('id-ID');
            console.log(`   Bergabung: ${joinDate}`);
        });
        
        console.log('-'.repeat(60));
        console.log(`${tracker.profiles.length + 1}. ${colors.green}Buat Profil Baru${colors.reset}`);
        console.log('-'.repeat(60));
        
        let validChoice = false;
        while (!validChoice) {
            const choice = await askQuestion(`\nPilih profil (1-${tracker.profiles.length + 1}): `, tracker);
            const choiceNum = parseInt(choice);
            
            if (choiceNum >= 1 && choiceNum <= tracker.profiles.length) {
                // Login ke profil yang dipilih
                const selectedProfile = tracker.profiles[choiceNum - 1];
                tracker.currentProfile = selectedProfile;
                tracker.loadHabitsForProfile(selectedProfile.id);
                
                console.log(`\n${colors.green}[OK] Selamat datang kembali, ${selectedProfile.name}!${colors.reset}`);
                console.log(`[INFO] ${tracker.habits.length} kebiasaan dimuat untuk profil ini.`);
                
                const pendingToday = tracker.habits.filter(h => !h.isCompletedToday()).length;
                if (pendingToday > 0) {
                    console.log(`Anda memiliki ${colors.yellow}${pendingToday} kebiasaan${colors.reset} yang belum diselesaikan hari ini.`);
                } else if (tracker.habits.length > 0) {
                    console.log(colors.green + 'Luar biasa! Semua kebiasaan hari ini sudah selesai! 🎉' + colors.reset);
                }
                
                validChoice = true;
            } else if (choiceNum === tracker.profiles.length + 1) {
                // Buat profil baru
                console.log('\n' + '='.repeat(60));
                console.log(colors.cyan + 'BUAT PROFIL BARU' + colors.reset);
                console.log('='.repeat(60));
                const newName = await askQuestion('Nama untuk profil baru: ', tracker);
                
                if (newName && newName.trim() !== '') {
                    const newProfile = new UserProfile(newName.trim());
                    tracker.profiles.push(newProfile);
                    tracker.currentProfile = newProfile;
                    tracker.habits = [];
                    tracker.saveToFile();
                    
                    console.log(`\n[OK] Profil "${newProfile.name}" telah berhasil dibuat!`);
                    
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
                    console.log('\n[X] Nama tidak boleh kosong. Silakan coba lagi.');
                }
            } else {
                console.log(`\n[X] Pilihan tidak valid. Masukkan angka 1-${tracker.profiles.length + 1}.`);
            }
        }
    }
    
    tracker.startReminder();
    await handleMainMenu(tracker);
}

// ============================================
// JALANKAN APLIKASI
// ============================================

main().catch(error => {
    console.error('\n[X] Terjadi kesalahan:', error.message);
    rl.close();
    process.exit(1);
});