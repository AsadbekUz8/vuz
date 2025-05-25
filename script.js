// Telegram WebApp initialization
const tg = window.Telegram.WebApp;
tg.expand();

// Elements
const navBtns = document.querySelectorAll('.nav-btn');
const sections = document.querySelectorAll('.section');

// Navigation
navBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        const targetSection = btn.dataset.section;
        navBtns.forEach(b => b.classList.remove('active'));
        sections.forEach(s => s.classList.remove('active'));
        btn.classList.add('active');
        document.getElementById(targetSection).classList.add('active');
    });
});

// Prayer Times Data
const prayerTimesData = {
    toshkent: {
        name: "Toshkent",
        api_name: "toshkent"
    },
    andijon: {
        name: "Andijon",
        api_name: "andijon"
    },
    buxoro: {
        name: "Buxoro",
        api_name: "buxoro"
    },
    fargona: {
        name: "Farg'ona",
        api_name: "namangan"
    },
    jizzax: {
        name: "Jizzax",
        api_name: "jizzax"
    },
    namangan: {
        name: "Namangan",
        api_name: "namangan"
    },
    navoiy: {
        name: "Navoiy",
        api_name: "navoiy"
    },
    qashqadaryo: {
        name: "Qarshi",
        api_name: "qarshi"
    },
    samarqand: {
        name: "Samarqand",
        api_name: "samarqand"
    },
    sirdaryo: {
        name: "Guliston",
        api_name: "sirdaryo"
    },
    surxondaryo: {
        name: "Termiz",
        api_name: "termiz"
    },
    xorazm: {
        name: "Urganch",
        api_name: "xorazm"
    },
    qoraqalpogiston: {
        name: "Nukus",
        api_name: "nukus"
    }
};

// Elements for Prayer Times
const regionSelect = document.getElementById('regionSelect');
const currentDateElement = document.querySelector('.current-date');
const nextPrayerTimeElement = document.querySelector('.next-prayer-time');
let prayerTimes = null;
let nextPrayerInterval = null;

// Cache for prayer times
const prayerTimesCache = new Map();

// Update current date
function updateCurrentDate() {
    const now = new Date();
    const weekDays = {
        'Monday': 'Dushanba',
        'Tuesday': 'Seshanba',
        'Wednesday': 'Chorshanba',
        'Thursday': 'Payshanba',
        'Friday': 'Juma',
        'Saturday': 'Shanba',
        'Sunday': 'Yakshanba'
    };
    
    const months = {
        'January': 'Yanvar',
        'February': 'Fevral',
        'March': 'Mart',
        'April': 'Aprel',
        'May': 'May',
        'June': 'Iyun',
        'July': 'Iyul',
        'August': 'Avgust',
        'September': 'Sentabr',
        'October': 'Oktabr',
        'November': 'Noyabr',
        'December': 'Dekabr'
    };

    // Get date components
    const year = now.getFullYear();
    const month = now.toLocaleString('en-US', { month: 'long' });
    const day = now.getDate();
    const weekday = now.toLocaleString('en-US', { weekday: 'long' });
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');

    // Convert to Uzbek
    const uzMonth = months[month];
    const uzWeekday = weekDays[weekday];
    
    // Format the date string
    const dateStr = `${year}-yil, ${day}-${uzMonth}, ${uzWeekday}, ${hours}:${minutes}`;
    
    // Update the display with animation
    if (currentDateElement.textContent !== dateStr) {
        currentDateElement.style.opacity = '0';
        currentDateElement.style.transform = 'translateY(-5px)';
        
        setTimeout(() => {
            currentDateElement.textContent = dateStr;
            currentDateElement.style.opacity = '1';
            currentDateElement.style.transform = 'translateY(0)';
        }, 200);
    }
}

// Get prayer times for selected region
async function getPrayerTimes(region) {
    try {
        // Show loading state
        const timeElements = document.querySelectorAll('.prayer-time .time');
        timeElements.forEach(el => el.textContent = '...');
        
        // Get API region name
        const apiRegion = prayerTimesData[region].api_name;
        
        // Check cache first
        const now = new Date();
        const today = now.toDateString();
        const cacheKey = `${region}_${today}`;
        
        if (prayerTimesCache.has(cacheKey)) {
            prayerTimes = prayerTimesCache.get(cacheKey);
            updatePrayerTimesDisplay();
            return;
        }

        const apiUrl = `https://islomapi.uz/api/present/day?region=${apiRegion}`;
        console.log('Fetching prayer times from:', apiUrl);
        
        const response = await fetch(apiUrl);
        console.log('API Response:', response);
        
        if (!response.ok) {
            throw new Error(`HTTP xato: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('API Data:', data);
        
        if (data && data.times) {
            prayerTimes = data.times;
            
            // Cache the result
            prayerTimesCache.set(cacheKey, prayerTimes);
            updatePrayerTimesDisplay();
            savePrayerTimes(region, prayerTimes);
        } else {
            throw new Error('API javobida times maydoni topilmadi');
        }
    } catch (error) {
        console.error('Namoz vaqtlarini olishda xatolik:', error);
        
        // Offline holatda saqlangan ma'lumotlarni ko'rsatish
        const savedTimes = loadSavedPrayerTimes(region);
        if (savedTimes) {
            console.log('Loading saved times:', savedTimes);
            prayerTimes = savedTimes;
            updatePrayerTimesDisplay();
        } else {
            const timeElements = document.querySelectorAll('.prayer-time .time');
            timeElements.forEach(el => el.textContent = '--:--');
        }
    }
}

// Save prayer times locally
function savePrayerTimes(region, times) {
    const date = new Date().toDateString();
    const data = { date, times };
    localStorage.setItem(`prayerTimes_${region}`, JSON.stringify(data));
}

// Load saved prayer times
function loadSavedPrayerTimes(region) {
    const saved = localStorage.getItem(`prayerTimes_${region}`);
    if (saved) {
        const data = JSON.parse(saved);
        if (data.date === new Date().toDateString()) {
            return data.times;
        }
    }
    return null;
}

// Update prayer times display
function updatePrayerTimesDisplay() {
    if (!prayerTimes) {
        console.log('No prayer times available');
        return;
    }
    
    console.log('Updating prayer times display:', prayerTimes);
    
    const prayerMapping = {
        'Bomdod': 'tong_saharlik',
        'Quyosh': 'quyosh',
        'Peshin': 'peshin',
        'Asr': 'asr',
        'Shom': 'shom_iftor',
        'Xufton': 'hufton'
    };
    
    for (const [displayName, apiKey] of Object.entries(prayerMapping)) {
        const element = document.querySelector(`[data-prayer="${displayName}"] .time`);
        const time = prayerTimes[apiKey];
        
        if (element && time) {
            element.textContent = time;
            console.log(`Updated ${displayName} time to ${time}`);
        } else {
            console.log(`Could not update ${displayName} time. Element: ${element}, Time: ${time}`);
        }
    }
    
    startNextPrayerTimer();
    highlightCurrentPrayer();
}

// Highlight current prayer time and calculate next prayer time
function highlightCurrentPrayer() {
    if (!prayerTimes) return;

    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();
    
    const prayerElements = document.querySelectorAll('.prayer-time');
    prayerElements.forEach(el => el.classList.remove('active'));
    
    const prayers = [
        { name: 'Bomdod', time: prayerTimes.tong_saharlik, displayName: 'Bomdod namozigacha' },
        { name: 'Quyosh', time: prayerTimes.quyosh, displayName: 'Quyosh chiqishigacha' },
        { name: 'Peshin', time: prayerTimes.peshin, displayName: 'Peshin namozigacha' },
        { name: 'Asr', time: prayerTimes.asr, displayName: 'Asr namozigacha' },
        { name: 'Shom', time: prayerTimes.shom_iftor, displayName: 'Shom namozigacha' },
        { name: 'Xufton', time: prayerTimes.hufton, displayName: 'Xufton namozigacha' }
    ];
    
    let nextPrayer = null;
    let currentPrayer = null;
    
    // Convert prayer times to minutes and find next prayer
    for (let i = 0; i < prayers.length; i++) {
        const [hours, minutes] = prayers[i].time.split(':').map(Number);
        const prayerTimeInMinutes = hours * 60 + minutes;
        
        if (prayerTimeInMinutes > currentTime) {
            nextPrayer = prayers[i];
            break;
        } else {
            currentPrayer = prayers[i];
        }
    }
    
    // If no next prayer found today, set to first prayer of next day
    if (!nextPrayer && prayers.length > 0) {
        nextPrayer = prayers[0];
    }
    
    // Highlight current prayer
    if (currentPrayer) {
        const currentElement = document.querySelector(`[data-prayer="${currentPrayer.name}"]`);
        if (currentElement) {
            currentElement.classList.add('active');
        }
    }
    
    // Update next prayer time display
    if (nextPrayer) {
        updateNextPrayerTime(nextPrayer.time, nextPrayer.displayName);
    }
}

// Update next prayer time countdown
function updateNextPrayerTime(nextPrayerTime, displayName) {
    if (!nextPrayerTime) return;
    
    const [targetHours, targetMinutes] = nextPrayerTime.split(':').map(Number);
    const now = new Date();
    const target = new Date();
    target.setHours(targetHours, targetMinutes, 0, 0);
    
    if (target < now) {
        target.setDate(target.getDate() + 1);
    }
    
    const updateTimer = () => {
        const current = new Date();
        let diff = target - current;
        
        if (diff < 0) {
            getPrayerTimes(regionSelect.value);
            return;
        }
        
        const hours = Math.floor(diff / (1000 * 60 * 60));
        diff -= hours * (1000 * 60 * 60);
        const minutes = Math.floor(diff / (1000 * 60));
        diff -= minutes * (1000 * 60);
        const seconds = Math.floor(diff / 1000);
        
        const timeStr = `
            <div class="prayer-name">${displayName}</div>
            <div class="time-part">${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}</div>
        `;
        
        if (nextPrayerTimeElement.innerHTML !== timeStr) {
            nextPrayerTimeElement.style.opacity = '0';
            nextPrayerTimeElement.style.transform = 'translateY(-5px)';
            
            setTimeout(() => {
                nextPrayerTimeElement.innerHTML = timeStr;
                nextPrayerTimeElement.style.opacity = '1';
                nextPrayerTimeElement.style.transform = 'translateY(0)';
            }, 200);
        }
    };
    
    updateTimer();
    if (nextPrayerInterval) {
        clearInterval(nextPrayerInterval);
    }
    nextPrayerInterval = setInterval(updateTimer, 1000);
}

// Start next prayer timer
function startNextPrayerTimer() {
    if (nextPrayerInterval) {
        clearInterval(nextPrayerInterval);
    }
    
    nextPrayerInterval = setInterval(() => {
        highlightCurrentPrayer();
        checkPrayerTime();
    }, 1000);
}

// Region selection event
let regionChangeTimeout;
regionSelect.addEventListener('change', (e) => {
    const selectedRegion = e.target.value;
    console.log('Region selected:', selectedRegion);
    
    if (selectedRegion) {
        if (regionChangeTimeout) {
            clearTimeout(regionChangeTimeout);
        }
        
        regionChangeTimeout = setTimeout(async () => {
            try {
                await getPrayerTimes(selectedRegion);
                localStorage.setItem('selectedRegion', selectedRegion);
                console.log('Prayer times updated for region:', selectedRegion);
            } catch (error) {
                console.error('Error updating prayer times:', error);
            }
        }, 100);
    }
});

// Load saved region
const savedRegion = localStorage.getItem('selectedRegion');
if (savedRegion && prayerTimesData[savedRegion]) {
    regionSelect.value = savedRegion;
    getPrayerTimes(savedRegion);
}

// Update date initially and every minute
updateCurrentDate();
setInterval(updateCurrentDate, 60000);

// Prayer notification function
function showPrayerNotification(prayerName) {
    if (!("Notification" in window)) {
        return;
    }

    const notificationOptions = {
        body: `${prayerName} vaqti kirdi! Namozni o'tkazib yubormang`,
        icon: 'https://raw.githubusercontent.com/islamic-network/cdn/master/islamic/images/prayer.png',
        badge: 'https://raw.githubusercontent.com/islamic-network/cdn/master/islamic/images/prayer.png',
        vibrate: [200, 100, 200],
        tag: 'prayer-time',
        requireInteraction: true
    };

    if (Notification.permission === "granted") {
        const notification = new Notification(`🕌 ${prayerName} vaqti`, notificationOptions);
        notification.onclick = function() {
            window.focus();
            this.close();
        };
    } else if (Notification.permission !== "denied") {
        Notification.requestPermission().then(function (permission) {
            if (permission === "granted") {
                const notification = new Notification(`🕌 ${prayerName} vaqti`, notificationOptions);
                notification.onclick = function() {
                    window.focus();
                    this.close();
                };
            }
        });
    }

    if (window.Telegram && window.Telegram.WebApp) {
        window.Telegram.WebApp.showPopup({
            title: `🕌 ${prayerName} vaqti`,
            message: `${prayerName} vaqti kirdi! Namozni o'tkazib yubormang`,
            buttons: [{
                type: "ok",
                text: "OK"
            }]
        });
    }
}

// Check prayer time
function checkPrayerTime() {
    if (!prayerTimes) return;

    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();
    
    const prayers = [
        { name: 'Bomdod', time: prayerTimes.tong_saharlik },
        { name: 'Peshin', time: prayerTimes.peshin },
        { name: 'Asr', time: prayerTimes.asr },
        { name: 'Shom', time: prayerTimes.shom_iftor },
        { name: 'Xufton', time: prayerTimes.hufton }
    ];
    
    prayers.forEach(prayer => {
        const [hours, minutes] = prayer.time.split(':').map(Number);
        const prayerTime = hours * 60 + minutes;
        
        if (currentTime === prayerTime) {
            showPrayerNotification(prayer.name);
        }
    });
}

// Request notification permission
function requestNotificationPermission() {
    if (!("Notification" in window)) {
        return;
    }

    if (Notification.permission !== "denied" && Notification.permission !== "granted") {
        Notification.requestPermission();
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
    console.log('Initializing app...');
    requestNotificationPermission();
    
    const savedRegion = localStorage.getItem('selectedRegion') || 'toshkent';
    console.log('Saved region:', savedRegion);
    
    if (savedRegion && prayerTimesData[savedRegion]) {
        regionSelect.value = savedRegion;
        await getPrayerTimes(savedRegion);
    } else {
        console.log('No saved region found, using default: toshkent');
        regionSelect.value = 'toshkent';
        await getPrayerTimes('toshkent');
    }
    
    updateCurrentDate();
    setInterval(updateCurrentDate, 60000);
    
    initializeDuaSearch();
    initProphetCards();
});

// Duolar qidiruv va filtrlash funksiyalari
function initializeDuaSearch() {
    const searchInput = document.querySelector('#duaSearch');
    const categorySelect = document.querySelector('#duaCategory');
    const duaCards = document.querySelectorAll('.dua-card');
    let searchTimeout;

    // Kategoriya bo'yicha filtrlash
    function filterByCategory(category) {
        duaCards.forEach(card => {
            const cardCategory = card.querySelector('.category-tag').textContent;
            if (category === 'all' || cardCategory === category) {
                card.style.display = 'block';
                card.style.animation = 'fadeIn 0.5s ease forwards';
            } else {
                card.style.display = 'none';
            }
        });
    }

    // Qidiruv funksiyasi
    async function searchDuas(searchTerm) {
        duaCards.forEach(card => {
            const text = card.textContent.toLowerCase();
            const category = categorySelect.value;
            const matchesSearch = text.includes(searchTerm.toLowerCase());
            const matchesCategory = category === 'all' || card.querySelector('.category-tag').textContent === category;
            
            if (matchesSearch && matchesCategory) {
                card.style.display = 'block';
                card.style.animation = 'fadeIn 0.5s ease forwards';
            } else {
                card.style.display = 'none';
            }
        });

        const visibleCards = Array.from(duaCards).filter(card => card.style.display !== 'none');
        if (visibleCards.length === 0 && searchTerm.length >= 3) {
            try {
                const response = await fetch(`https://api.alquran.cloud/v1/search/${searchTerm}/all/uz`);
                const data = await response.json();
                
                if (data.data && data.data.matches && data.data.matches.length > 0) {
                    const duasContainer = document.querySelector('.duas-container');
                    data.data.matches.forEach(match => {
                        const newDuaCard = document.createElement('div');
                        newDuaCard.className = 'dua-card';
                        newDuaCard.innerHTML = `
                            <div class="dua-header">
                                <h3>Qidiruv natijasi</h3>
                                <span class="category-tag">Internet</span>
                            </div>
                            <div class="arabic-text">${match.text}</div>
                            <div class="transliteration">${match.surah.englishName}</div>
                            <div class="meaning">${match.text}</div>
                            <div class="reference">Manba: ${match.surah.name} surasi, ${match.numberInSurah}-oyat</div>
                        `;
                        duasContainer.appendChild(newDuaCard);
                        newDuaCard.style.animation = 'fadeIn 0.5s ease forwards';
                    });
                }
            } catch (error) {
                console.error('Internetdan qidirishda xatolik:', error);
            }
        }
    }

    categorySelect.addEventListener('change', (e) => {
        filterByCategory(e.target.value);
    });

    searchInput.addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            searchDuas(e.target.value);
        }, 500);
    });

    filterByCategory('all');
}

// Animatsiya uchun CSS
const style = document.createElement('style');
style.textContent = `
@keyframes fadeIn {
    from {
        opacity: 0;
        transform: translateY(20px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}
`;
document.head.appendChild(style);

// Add CSS for date animation
const dateStyle = document.createElement('style');
dateStyle.textContent = `
.current-date {
    transition: opacity 0.3s ease, transform 0.3s ease;
    font-weight: 500;
    color: #2e7d32;
    text-align: center;
    padding: 10px;
    border-radius: 8px;
    background: rgba(46, 125, 50, 0.1);
    margin: 10px 0;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}
`;
document.head.appendChild(dateStyle);

// Add CSS for next prayer time animation
const nextPrayerStyle = document.createElement('style');
nextPrayerStyle.textContent = `
.next-prayer-time {
    transition: all 0.8s ease;
    font-weight: 600;
    color: #1a237e;
    text-align: center;
    padding: 20px;
    border-radius: 15px;
    background: linear-gradient(135deg, #ffffff, #f5f5f5);
    margin: 20px 0;
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
    font-size: 1.3em;
    border: 2px solid #e8eaf6;
    position: relative;
    overflow: hidden;
}

.next-prayer-time::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: linear-gradient(to right, #1a237e, #3949ab, #1a237e);
}

.next-prayer-time:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
    transition: all 0.5s ease;
}

@keyframes pulseText {
    0% { opacity: 1; }
    25% { opacity: 0.9; }
    50% { opacity: 0.8; }
    75% { opacity: 0.9; }
    100% { opacity: 1; }
}

.next-prayer-time .time-part {
    color: #304ffe;
    font-weight: 700;
    animation: pulseText 4s infinite;
    padding: 10px 0;
}

.next-prayer-time .prayer-name {
    font-size: 1.1em;
    margin-bottom: 10px;
    color: #1a237e;
    font-weight: 500;
}
`;
document.head.appendChild(nextPrayerStyle);

// Zikr section functionality
const zikrCards = document.querySelectorAll('.zikr-card');
zikrCards.forEach(card => {
    let count = parseInt(card.querySelector('.count').textContent);
    let currentCount = 0;
    
    card.addEventListener('click', () => {
        if (currentCount < count) {
            currentCount++;
            updateZikrCount(card, currentCount, count);
            addZikrAnimation(card);
        }
    });
});

function updateZikrCount(card, current, total) {
    const countElement = card.querySelector('.count');
    countElement.textContent = `${current}/${total} marta`;
    
    if (current === total) {
        card.classList.add('completed');
        showZikrCompletionMessage(card.querySelector('h3').textContent);
    }
}

function addZikrAnimation(card) {
    card.classList.add('zikr-animate');
    setTimeout(() => {
        card.classList.remove('zikr-animate');
    }, 500);
}

function showZikrCompletionMessage(zikrName) {
    const message = `${zikrName} zikri tugallandi! MashaAllah!`;
    // Create and show notification
    if (Notification.permission === "granted") {
        new Notification(message);
    }
}

// Add these styles to your CSS
document.head.insertAdjacentHTML('beforeend', `
    <style>
        .zikr-animate {
            animation: zikrPulse 0.5s ease-out;
        }
        
        @keyframes zikrPulse {
            0% { transform: scale(1); }
            50% { transform: scale(1.05); }
            100% { transform: scale(1); }
        }
        
        .completed {
            background: linear-gradient(145deg, #e8f5e9, #c8e6c9);
        }
        
        .completed .count {
            color: #2e7d32;
        }
    </style>
`);

// Notification functionality
const notificationBtn = document.getElementById('notificationBtn');
const notificationStatus = document.getElementById('notificationStatus');
const btnText = notificationBtn.querySelector('.btn-text');
const statusMessage = notificationStatus.querySelector('.status-message');
let notificationsEnabled = false;

notificationBtn.addEventListener('click', async () => {
    if (!notificationsEnabled) {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
            notificationsEnabled = true;
            notificationBtn.classList.add('enabled');
            btnText.textContent = 'Eslatmalar yoqilgan';
            showNotificationStatus('Namoz vaqtlari uchun eslatmalar yoqildi. Har bir namoz vaqtidan 5 daqiqa oldin eslatma olasiz.');
            setupPrayerNotifications();
        } else {
            showNotificationStatus('Brauzeringiz eslatmalarga ruxsat bermadi. Eslatmalarni olish uchun brauzer sozlamalaridan ruxsat bering.');
        }
    } else {
        notificationsEnabled = false;
        notificationBtn.classList.remove('enabled');
        btnText.textContent = 'Eslatmalarni yoqish';
        showNotificationStatus('Namoz vaqtlari uchun eslatmalar o\'chirildi.');
    }
});

function showNotificationStatus(message) {
    statusMessage.textContent = message;
    notificationStatus.classList.add('show');
    setTimeout(() => {
        notificationStatus.classList.remove('show');
    }, 5000); // 5 soniya ko'rsatiladi
}

function setupPrayerNotifications() {
    const prayerTimes = document.querySelectorAll('.prayer-time');
    prayerTimes.forEach(prayer => {
        const prayerName = prayer.querySelector('.prayer-name').textContent;
        const prayerTime = prayer.querySelector('.time').textContent;
        
        if (prayerTime === '--:--') return;
        
        // Vaqtni soat va daqiqalarga ajratish
        const [hours, minutes] = prayerTime.split(':').map(Number);
        
        // Eslatma vaqtini o'rnatish (5 daqiqa oldin)
        const notificationTime = new Date();
        notificationTime.setHours(hours);
        notificationTime.setMinutes(minutes - 5);
        
        const now = new Date();
        if (notificationTime > now) {
            const delay = notificationTime.getTime() - now.getTime();
            setTimeout(() => {
                if (notificationsEnabled) {
                    new Notification('🕌 Namoz vaqti yaqinlashmoqda', {
                        body: `${prayerName} vaqtiga 5 daqiqa qoldi. Namozni o'z vaqtida ado eting!`,
                        icon: 'https://raw.githubusercontent.com/islamic-network/cdn/master/islamic/images/prayer.png',
                        badge: 'https://raw.githubusercontent.com/islamic-network/cdn/master/islamic/images/prayer.png',
                        vibrate: [200, 100, 200]
                    });
                }
            }, delay);
        }
    });
}

// Check saved notification state
const savedNotificationState = localStorage.getItem('notificationsEnabled');
if (savedNotificationState === 'true' && Notification.permission === 'granted') {
    notificationsEnabled = true;
    notificationBtn.classList.add('enabled');
    btnText.textContent = 'Eslatmalar yoqilgan';
    setupPrayerNotifications();
}

// Save notification state when changed
function updateNotificationState() {
    localStorage.setItem('notificationsEnabled', notificationsEnabled);
}

notificationBtn.addEventListener('click', updateNotificationState);

// Payg'ambarlar tarixi bo'limini ko'rsatish
function showSection(sectionId) {
    const sections = document.querySelectorAll('.section');
    sections.forEach(section => section.classList.remove('active'));
    
    const buttons = document.querySelectorAll('.nav-btn');
    buttons.forEach(button => button.classList.remove('active'));
    
    document.getElementById(sectionId).classList.add('active');
    document.querySelector(`[data-section="${sectionId}"]`).classList.add('active');
}

// Payg'ambarlar kartalarini animatsiya qilish
function initProphetCards() {
    const cards = document.querySelectorAll('.prophet-card');
    cards.forEach(card => {
        card.addEventListener('mouseenter', () => {
            card.style.transform = 'translateY(-5px)';
        });
        
        card.addEventListener('mouseleave', () => {
            card.style.transform = 'translateY(0)';
        });
    });
}