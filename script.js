// --- ১. সুপাবেস কানেকশন ইনিশিয়ালিজেশন ---
const SUPABASE_URL = "https://izkkonqhrfujfdxslbbn.supabase.co"; 
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml6a2tvbnFocmZ1amZkeHNsYmJuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE4NzYxOTgsImV4cCI6MjA5NzQ1MjE5OH0.dZSFbK7BOk7PoUZCe9E4xmT94B_jjG-oS1Bw_mcMiNk";
const supabase = supabasejs.createClient(SUPABASE_URL, SUPABASE_KEY);

let currentUser = null;
let currentActivity = 'Sports';
let isRunning = false;
let timerInterval = null;

let calendarCurrentDate = new Date(); 
let selectedReportDateStr = ''; 

const fixedSubjects = [
    "Bangla 1st", "Bangla 2nd", "English 1st", "English 2nd", "Ict", 
    "physics 1st", "physics 2nd", "Chemistry 1st", "Chemistry 2nd", 
    "Higher math 1st", "Higher math 2nd", "Biology 1st", "Biology 2nd"
];
let currentSelectedSubject = fixedSubjects[0]; 

let globalSyllabusData = {}; 
let userTicksData = {}; 
let userDailyLogs = {}; 

// উইন্ডো লোড হবার সাথে সাথে ডাটাবেজ থেকে গ্লোবাল থিম ও নোটিশ লোড হবে
window.addEventListener('DOMContentLoaded', async () => {
    await fetchThemeAndNoticeFromDB();
});

// --- ২. ডাটাবেজ থেকে থিম ও নোটিশ রিড করা ---
async function fetchThemeAndNoticeFromDB() {
    try {
        const { data, error } = await supabase.from('theme_settings').select('*');
        if (!error && data) {
            const settings = {};
            data.forEach(item => settings[item.key] = item.value);

            const bg = settings['theme_color_bg'] || '#111827';
            const card = settings['theme_color_card'] || '#1e293b';
            const btn = settings['theme_color_btn'] || '#3b82f6';
            const text = settings['theme_color_text'] || '#ffffff';

            document.documentElement.style.setProperty('--theme-bg', bg);
            document.documentElement.style.setProperty('--theme-card-bg', card);
            document.documentElement.style.setProperty('--theme-btn-bg', btn);
            document.documentElement.style.setProperty('--theme-text-color', text);

            if(document.getElementById('color-bg')) {
                document.getElementById('color-bg').value = bg;
                document.getElementById('color-card').value = card;
                document.getElementById('color-btn').value = btn;
                document.getElementById('color-text').value = text;
            }

            const noticeText = settings['notice_text'] || 'Study mate অ্যাপে স্বাগতম!';
            const noticeColor = settings['notice_color'] || '#ffffff';
            const noticeSize = settings['notice_size'] || '16';

            const displayBox = document.getElementById('notice-display-text');
            if (displayBox) {
                displayBox.innerText = noticeText;
                displayBox.style.color = noticeColor;
                displayBox.style.fontSize = noticeSize + 'px';
            }

            if (document.getElementById('notice-input-text')) {
                document.getElementById('notice-input-text').value = noticeText;
                document.getElementById('notice-color-picker').value = noticeColor;
                document.getElementById('notice-size-picker').value = noticeSize;
            }
            
            if (document.getElementById('day-start-time')) {
                document.getElementById('day-start-time').value = settings['globalDayStartBoundary'] || '00:00';
            }
        }
    } catch(e) { console.error(e); }
}

async function saveThemeSettings() {
    if (currentUser.role !== 'admin') return;
    const bg = document.getElementById('color-bg').value;
    const card = document.getElementById('color-card').value;
    const btn = document.getElementById('color-btn').value;
    const text = document.getElementById('color-text').value;

    await supabase.from('theme_settings').upsert([{ key: 'theme_color_bg', value: bg }], { onConflict: 'key' });
    await supabase.from('theme_settings').upsert([{ key: 'theme_color_card', value: card }], { onConflict: 'key' });
    await supabase.from('theme_settings').upsert([{ key: 'theme_color_btn', value: btn }], { onConflict: 'key' });
    await supabase.from('theme_settings').upsert([{ key: 'theme_color_text', value: text }], { onConflict: 'key' });

    await fetchThemeAndNoticeFromDB();
    alert('ওয়েবসাইটের কালার থিম ডাটাবেজে সফলভাবে সেভ হয়েছে!');
}

async function resetThemeSettings() {
    if (currentUser.role !== 'admin') return;
    await supabase.from('theme_settings').delete().in('key', ['theme_color_bg', 'theme_color_card', 'theme_color_btn', 'theme_color_text']);
    await fetchThemeAndNoticeFromDB();
    alert('ডিফল্ট থিম কালার রিসেট করা হয়েছে!');
}

async function saveNoticeSettings() {
    if (currentUser.role !== 'admin') return;
    const text = document.getElementById('notice-input-text').value;
    const color = document.getElementById('notice-color-picker').value;
    const size = document.getElementById('notice-size-picker').value;

    await supabase.from('theme_settings').upsert([{ key: 'notice_text', value: text }], { onConflict: 'key' });
    await supabase.from('theme_settings').upsert([{ key: 'notice_color', value: color }], { onConflict: 'key' });
    await supabase.from('theme_settings').upsert([{ key: 'notice_size', value: size }], { onConflict: 'key' });

    await fetchThemeAndNoticeFromDB();
    alert('হোম পেজের কাস্টম নোটিশ ডাটাবেজে আপডেট করা হয়েছে!');
}

// --- ৩. ডে-স্টার্ট বাউন্ডারি ক্যালকুলেটর ---
async function getLogicalDateString() {
    const { data } = await supabase.from('theme_settings').select('*').eq('key', 'globalDayStartBoundary');
    const boundaryTime = (data && data.length > 0) ? data[0].value : '00:00';
    const [boundaryHour, boundaryMinute] = boundaryTime.split(':').map(Number);
    
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    
    if (currentHour < boundaryHour || (currentHour === boundaryHour && currentMinute < boundaryMinute)) {
        const previousDay = new Date(now);
        previousDay.setDate(now.getDate() - 1);
        return formatDateToKey(previousDay);
    }
    return formatDateToKey(now);
}

function formatDateToKey(dateObj) {
    return `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}-${String(dateObj.getDate()).padStart(2, '0')}`;
}

// --- ৪. লগইন ও সেশন মডিউলিং ---
async function login() {
    const userVal = document.getElementById('login-username').value.trim();
    const passVal = document.getElementById('login-password').value.trim();
    const errorMsg = document.getElementById('login-error');

    errorMsg.innerText = "যাচাই করা হচ্ছে...";

    const { data: users, error } = await supabase.from('users').select('*').eq('username', userVal).eq('password', passVal);

    if (!error && users && users.length > 0) {
        currentUser = users[0];
        
        document.getElementById('login-section').classList.remove('active-section');
        document.getElementById('app-section').classList.add('active-section');
        
        document.getElementById('welcome-username').innerText = currentUser.username;
        document.getElementById('user-display').innerText = `ইউজার: ${currentUser.username}`;

        const adminMenu = document.getElementById('admin-menu-item');
        const adminChapterForm = document.getElementById('admin-chapter-form');
        const syllabusSubtitle = document.getElementById('syllabus-subtitle');

        if (currentUser.role === 'admin') {
            adminMenu.style.setProperty('display', 'flex', 'important');
            adminChapterForm.style.display = 'flex';
            syllabusSubtitle.innerText = "অ্যাডমিন মোড: এখান থেকে অধ্যায় ও সাব-ইউনিট তৈরি বা ডিলিট করুন।";
        } else {
            adminMenu.style.setProperty('display', 'none', 'important');
            adminChapterForm.style.display = 'none';
            syllabusSubtitle.innerText = "ইউজার মোড: বিষয় সিলেক্ট করে আপনার অধ্যায়ের টপিকগুলোতে টিক চিহ্ন দিন।";
        }

        document.getElementById('file-status-box').style.display = "none";
        document.getElementById('hidden-local-file-picker').value = "";

        await loadUserData();
        showPage('home-page', document.querySelector('.sidebar-item')); 
    } else {
        errorMsg.innerText = "ভুল ইউজারনেম বা পাসওয়ার্ড!";
    }
}

function logout() {
    currentUser = null;
    stopTimer();
    document.getElementById('login-section').classList.add('active-section');
    document.getElementById('app-section').classList.remove('active-section');
    document.getElementById('sidebar').classList.add('hide');
    document.body.classList.add('sidebar-hidden');
}

// --- ৫. পেজ রাউটিং ও মেনু অপারেশন ---
async function showPage(pageId, element) {
    document.querySelectorAll('.page-content').forEach(p => p.classList.remove('active-page'));
    const targetPage = document.getElementById(pageId);
    if (targetPage) targetPage.classList.add('active-page');

    document.querySelectorAll('.sidebar-item').forEach(i => i.classList.remove('active-nav'));
    if (element) element.classList.add('active-nav');

    document.getElementById('sidebar').classList.add('hide');
    document.body.classList.add('sidebar-hidden');

    if (pageId === 'self-tracker-page') await updateTrackerCards();
    if (pageId === 'session-report-page') {
        selectedReportDateStr = await getLogicalDateString();
        await buildCalendar();
        await loadReportForDate(selectedReportDateStr);
    }
    if (pageId === 'admin-page' && currentUser.role === 'admin') {
        renderUserTable();
    }
}

document.getElementById('menu-btn').addEventListener('click', () => {
    document.getElementById('sidebar').classList.toggle('hide');
    document.body.classList.toggle('sidebar-hidden');
});

// --- ৬. ডেটা সিঙ্ক্রোনাইজেশন মডিউল ---
async function loadUserData() {
    // ১. ট্র্যাকার লগ লোড
    const { data: logs } = await supabase.from('daily_logs').select('*').eq('username', currentUser.username);
    userDailyLogs = {};
    if (logs) logs.forEach(l => userDailyLogs[l.date] = l.activity_data);

    // ২. সিলেবাস ডেটা লোড
    const { data: syl } = await supabase.from('syllabus_data').select('*');
    globalSyllabusData = {};
    fixedSubjects.forEach(sub => globalSyllabusData[sub] = []);
    if (syl) syl.forEach(s => globalSyllabusData[s.subject] = s.chapters);

    // ৩. ইউজারের সিলেবাস টিক্স লোড
    const { data: settings } = await supabase.from('theme_settings').select('*').eq('key', `ticks_${currentUser.username}`);
    userTicksData = (settings && settings.length > 0) ? JSON.parse(settings[0].value) : {};

    const dropdown = document.getElementById('sub-dropdown');
    dropdown.innerHTML = '';
    fixedSubjects.forEach(sub => dropdown.innerHTML += `<option value="${sub}">${sub}</option>`);

    currentSelectedSubject = fixedSubjects[0];
    renderNestedSyllabus();
}

// --- ७. সেল্ফ ট্র্যাকার টাইমিং ---
async function updateTrackerCards() {
    const todayStr = await getLogicalDateString();
    if (!userDailyLogs[todayStr]) userDailyLogs[todayStr] = {};
    
    const dayData = userDailyLogs[todayStr];
    const currentSeconds = dayData[currentActivity] || 0;

    document.getElementById('main-timer').innerText = formatTime(currentSeconds);
    document.getElementById('current-activity-name').innerText = currentActivity;

    document.querySelectorAll('.card').forEach(card => {
        const name = card.querySelector('h3').innerText.trim();
        if (name === currentActivity) card.classList.add('active'); else card.classList.remove('active');
        card.querySelector('.time').innerText = formatTime(dayData[name] || 0);
    });
}

function startTimer() {
    if (timerInterval) clearInterval(timerInterval);
    timerInterval = setInterval(async () => {
        const todayStr = await getLogicalDateString();
        if (!userDailyLogs[todayStr]) userDailyLogs[todayStr] = {};
        if (!userDailyLogs[todayStr][currentActivity]) userDailyLogs[todayStr][currentActivity] = 0;

        userDailyLogs[todayStr][currentActivity]++;
        await updateTrackerCards();

        // ডাটাবেজে রিয়েল-টাইম সেভ (Upsert)
        await supabase.from('daily_logs').upsert([{ 
            username: currentUser.username, 
            date: todayStr, 
            activity_data: userDailyLogs[todayStr] 
        }], { onConflict: 'username,date' });

    }, 1000);
    isRunning = true;
    const btn = document.querySelector('.stop-btn'); btn.innerText = "শেষ করুন"; btn.style.background = "#ef4444";
}

function stopTimer() {
    clearInterval(timerInterval);
    isRunning = false;
    const btn = document.querySelector('.stop-btn'); btn.innerText = "শুরু করুন"; btn.style.background = "var(--theme-btn-bg)";
}

async function selectActivity(activityName, element) {
    currentActivity = activityName;
    await updateTrackerCards();
    if (isRunning) startTimer();
}
document.querySelector('.stop-btn').addEventListener('click', () => isRunning ? stopTimer() : startTimer());

function formatTime(totalSeconds) {
    const hrs = String(Math.floor(totalSeconds / 3600)).padStart(2, '0');
    const mins = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, '0');
    const secs = String(totalSeconds % 60).padStart(2, '0');
    return `${hrs}:${mins}:${secs}`;
}

// --- ৮. সেশন রিপোর্ট ও ক্যালেন্ডার ---
async function changeMonth(direction) {
    calendarCurrentDate.setMonth(calendarCurrentDate.getMonth() + direction);
    await buildCalendar();
}

async function buildCalendar() {
    const grid = document.getElementById('calendar-days-grid');
    if(!grid) return;
    grid.innerHTML = '';

    const year = calendarCurrentDate.getFullYear();
    const month = calendarCurrentDate.getMonth();

    const monthNames = ["জানুয়ারি", "ফেব্রুয়ারি", "মার্চ", "এপ্রিল", "মে", "জুন", "জুলাই", "আগস্ট", "সেপ্টেম্বর", "অক্টোবর", "নভেম্বর", "ডিসেম্বর"];
    document.getElementById('calendar-month-year').innerText = `${monthNames[month]} ${year}`;

    const firstDayIndex = new Date(year, month, 1).getDay(); 
    const adjustedFirstDay = firstDayIndex === 0 ? 6 : firstDayIndex - 1; 
    const totalDays = new Date(year, month + 1, 0).getDate();

    for (let i = 0; i < adjustedFirstDay; i++) {
        grid.innerHTML += `<div class="empty-cell"></div>`;
    }

    for (let day = 1; day <= totalDays; day++) {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        let classes = '';

        if (dateStr === selectedReportDateStr) classes += ' active-date';
        if (userDailyLogs[dateStr] && Object.values(userDailyLogs[dateStr]).some(v => v > 0)) {
            classes += ' has-data';
        }

        grid.innerHTML += `<div class="${classes}" onclick="loadReportForDate('${dateStr}')">${day}</div>`;
    }
}

function loadReportForDate(dateStr) {
    selectedReportDateStr = dateStr;
    document.getElementById('selected-date-display').innerText = dateStr;

    const dayData = userDailyLogs[dateStr] || {};
    const activities = ['Self Study', 'Class/Mock Test', 'Mobile scroll', 'Prayer', 'Food', 'Sleep', 'Sports', 'Other'];
    
    let totalSeconds = 0;
    let chartValues = [];
    let chartColors = ['#3b82f6', '#10b981', '#f43f5e', '#eab308', '#a855f7', '#6366f1', '#06b6d4', '#64748b'];

    activities.forEach((act) => {
        const sec = dayData[act] || 0;
        totalSeconds += sec;
        const cleanId = act.replace(/[^a-zA-Z]/g, ""); 
        const targetElement = document.getElementById(`rep-time-${cleanId}`);
        if(targetElement) targetElement.innerText = `${Math.round(sec / 60)}m`;
        chartValues.push(sec);
    });

    const totalHrs = Math.floor(totalSeconds / 3600);
    const totalMins = Math.round((totalSeconds % 3600) / 60);
    document.getElementById('report-total-time').innerText = `${totalHrs}h ${totalMins}m`;

    const chartEl = document.getElementById('report-donut-chart');
    const centerText = document.getElementById('donut-center-text');

    if (totalSeconds === 0) {
        chartEl.style.background = `conic-gradient(#334155 0% 100%)`;
        centerText.innerText = "No Data";
    } else {
        let currentPercent = 0;
        let gradientStops = [];
        chartValues.forEach((val, i) => {
            if (val > 0) {
                const startDeg = (currentPercent / totalSeconds) * 360;
                currentPercent += val;
                const endDeg = (currentPercent / totalSeconds) * 360;
                gradientStops.push(`${chartColors[i]} ${startDeg}deg ${endDeg}deg`);
            }
        });
        chartEl.style.background = `conic-gradient(${gradientStops.join(', ')})`;
        centerText.innerText = "Breakdown";
    }
}

// --- ৯. সিলেবাস ট্র্যাকার ---
function selectSubject(subName) {
    currentSelectedSubject = subName;
    renderNestedSyllabus();
}

function renderNestedSyllabus() {
    const container = document.getElementById('syllabus-nested-container');
    container.innerHTML = '';
    const chapters = globalSyllabusData[currentSelectedSubject] || [];
    const isAdmin = (currentUser && currentUser.role === 'admin');

    if (chapters.length === 0) {
        container.innerHTML = `<p style="color: #94a3b8; text-align: center; padding: 20px;">কোনো সিলেবাস তৈরি করা নেই!</p>`;
        return;
    }

    chapters.forEach((chap, chapIndex) => {
        let subunitHTML = '';
        if (chap.subunits.length === 0) {
            subunitHTML = `<p style="color: #64748b; font-size: 0.8rem; font-style: italic; padding: 5px;">কোনo টপিক নেই।</p>`;
        } else {
            chap.subunits.forEach((unit, unitIndex) => {
                const tickKey = `${currentSelectedSubject}_${chapIndex}_${unitIndex}`;
                const isDone = userTicksData[tickKey] || false;
                subunitHTML += `
                    <div class="subunit-item ${isDone ? 'completed' : ''}">
                        <div class="subunit-left">
                            <input type="checkbox" ${isDone ? 'checked' : ''} onchange="toggleSubunitTick('${tickKey}', this.checked)">
                            <span>${unit}</span>
                        </div>
                        ${isAdmin ? `<button class="delete-btn-icon" onclick="deleteSubunit(${chapIndex}, ${unitIndex})"><i class="fa-solid fa-trash-can"></i></button>` : ''}
                    </div>`;
            });
        }

        container.innerHTML += `
            <div class="chapter-block ${chap.collapsed ? 'collapsed' : ''}" id="chap-block-${chapIndex}">
                <div class="chapter-header">
                    <span class="chapter-title">${chap.title}</span>
                    <div style="display: flex; align-items: center;">
                        ${isAdmin ? `<button class="delete-btn-icon" onclick="deleteMainChapter(${chapIndex})" style="margin-right:8px;"><i class="fa-solid fa-trash-can"></i></button>` : ''}
                        <button class="delete-btn-icon" onclick="toggleChapter(${chapIndex})" style="color:var(--theme-btn-bg);">
                            <i class="fa-solid ${chap.collapsed ? 'fa-chevron-down' : 'fa-chevron-up'}" id="toggle-icon-${chapIndex}"></i>
                        </button>
                    </div>
                </div>
                <div class="subunit-container">${subunitHTML}</div>
                ${isAdmin ? `<div class="add-subunit-form"><input type="text" id="subunit-input-${chapIndex}" placeholder="নতুন টপিক..."><button onclick="addSubunit(${chapIndex})">যোগ</button></div>` : ''}
            </div>`;
    });
}

async function syncSyllabusToDB() {
    await supabase.from('syllabus_data').upsert([{ 
        subject: currentSelectedSubject, 
        chapters: globalSyllabusData[currentSelectedSubject] 
    }], { onConflict: 'subject' });
}

async function addMainChapter() {
    const title = document.getElementById('new-chapter-input').value.trim();
    if (title === '') return alert('অধ্যায়ের নাম লিখুন!');
    globalSyllabusData[currentSelectedSubject].push({ title: title, collapsed: false, subunits: [] });
    document.getElementById('new-chapter-input').value = '';
    renderNestedSyllabus();
    await syncSyllabusToDB();
}

async function deleteMainChapter(chapIndex) {
    if (confirm(`অধ্যায়টি ডিলিট করতে চান?`)) {
        globalSyllabusData[currentSelectedSubject].splice(chapIndex, 1);
        renderNestedSyllabus();
        await syncSyllabusToDB();
    }
}

async function addSubunit(chapIndex) {
    const unitName = document.getElementById(`subunit-input-${chapIndex}`).value.trim();
    if (unitName === '') return alert('টপিক এর নাম লিখুন!');
    globalSyllabusData[currentSelectedSubject][chapIndex].subunits.push(unitName);
    renderNestedSyllabus();
    await syncSyllabusToDB();
}

async function deleteSubunit(chapIndex, unitIndex) {
    globalSyllabusData[currentSelectedSubject][chapIndex].subunits.splice(unitIndex, 1);
    renderNestedSyllabus();
    await syncSyllabusToDB();
}

async function toggleChapter(chapIndex) {
    const isCollapsed = !globalSyllabusData[currentSelectedSubject][chapIndex].collapsed;
    globalSyllabusData[currentSelectedSubject][chapIndex].collapsed = isCollapsed;
    renderNestedSyllabus();
    await syncSyllabusToDB();
}

async function toggleSubunitTick(tickKey, isChecked) {
    userTicksData[tickKey] = isChecked;
    await supabase.from('theme_settings').upsert([{ key: `ticks_${currentUser.username}`, value: JSON.stringify(userTicksData) }], { onConflict: 'key' });
    renderNestedSyllabus(); 
}

// --- ১০. ড্রাইভ এবং ফাইল ওপেনার ---
function openGoogleDrive() { window.open("https://drive.google.com/", "_blank"); }
function triggerLocalFilePicker() { document.getElementById('hidden-local-file-picker').click(); }
function handleLocalFileSelect(event) {
    const file = event.target.files[0];
    if (!file) return;
    const statusBox = document.getElementById('file-status-box');
    statusBox.innerHTML = `<i class="fa-solid fa-circle-check" style="color:#10b981;"></i> ওপেন করা হয়েছে: <strong>${file.name}</strong>`;
    statusBox.style.display = "block";
}

// --- ১১. অ্যাডমিন সেটিংস ও ইউজার তৈরি ---
async function saveDayStartSetting() {
    const timeVal = document.getElementById('day-start-time').value;
    await supabase.from('theme_settings').upsert([{ key: 'globalDayStartBoundary', value: timeVal }], { onConflict: 'key' });
    alert(`দিন পরিবর্তনের বাউন্ডারি সময় আপডেট করা হয়েছে!`);
}

async function renderUserTable() {
    const { data: users } = await supabase.from('users').select('*');
    const tbody = document.getElementById('user-table-body'); 
    tbody.innerHTML = '';
    if(users) {
        users.forEach((u) => {
            tbody.innerHTML += `<tr><td>${u.username} ${u.role === 'admin' ? '(Admin)' : ''}</td><td>${u.password}</td><td>${u.role !== 'admin' ? `<button class="kick-btn" onclick="deleteUser('${u.username}')">কিক</button>` : '-'}</td></tr>`;
        });
    }
}

async function addUser() {
    const uName = document.getElementById('new-username').value.trim(); 
    const uPass = document.getElementById('new-password').value.trim();
    if (uName === '' || uPass === '') return alert('সব ঘর পূরণ করুন!');
    
    const { error } = await supabase.from('users').insert([{ username: uName, password: uPass, role: 'user' }]);
    if(!error) {
        alert('নতুন ইউজার সরাসরি ডাটাবেজে যুক্ত হয়েছে! যেকোনো ফোন থেকে লগইন সম্ভব।');
        document.getElementById('new-username').value = ''; 
        document.getElementById('new-password').value = '';
        await renderUserTable();
    } else {
        alert('ইউজার তৈরি করা যায়নি (ইউজারনেমটি হয়তো আগেই আছে)।');
    }
}

async function deleteUser(username) {
    if (confirm(`ইউজারকে কিক করতে চান?`)) {
        await supabase.from('users').delete().eq('username', username);
        await supabase.from('daily_logs').delete().eq('username', username);
        await supabase.from('theme_settings').delete().eq('key', `ticks_${username}`);
        await renderUserTable();
    }
}
