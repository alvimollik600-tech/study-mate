// ==========================================
// ১. সুপাবেস কানেকশন ইনিশিয়ালিজেশন
// ==========================================
const SUPABASE_URL = "https://izkkonqhrfujfdxslbbn.supabase.co"; 
const SUPABASE_KEY = "eyJhY2NvdW50X2lkIjoiZzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml6a2tvbnFocmZ1amZkeHNsYmJuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE4NzYxOTgsImV4cCI6MjA5NzQ1MjE5OH0.dZSFbK7BOk7PoUZCe9E4xmT94B_jjG-oS1Bw_mcMiNk";   

// গ্লোবাল অবজেক্ট নিশ্চিত করে ক্লায়েন্ট তৈরি
const supabase = (window.supabasejs || window.supabase).createClient(SUPABASE_URL, SUPABASE_KEY);

// অ্যাপ লোড হওয়ার সময় চেক
document.addEventListener('DOMContentLoaded', () => {
    // যদি আগে থেকে কোনো ডেটা লোকালস্টোরেজে রাখতে চাও, এখানে হ্যান্ডেল করতে পারো
    console.log("Study Mate App Loaded!");
});

// ==========================================
// ২. লগইন ফাংশন (Supabase Auth)
// ==========================================
async function login() {
    const usernameInput = document.getElementById('login-username').value.trim();
    const passwordInput = document.getElementById('login-password').value.trim();
    const errorMsg = document.getElementById('login-error');

    errorMsg.innerText = "";

    if (!usernameInput || !passwordInput) {
        errorMsg.innerText = "দয়া করে ইউজারনেম এবং পাসওয়ার্ড দুটিই লিখুন!";
        return;
    }

    try {
        // সুপাবেস 'users' টেবিল থেকে চেক (কলামের নাম সব ছোট হাতের)
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('username', usernameInput)
            .eq('password', passwordInput);

        if (error) throw error;

        if (data && data.length > 0) {
            const user = data[0];
            
            // লগইন সফল হলে স্ক্রিন পরিবর্তন
            document.getElementById('login-section').classList.remove('active-section');
            const appSection = document.getElementById('app-section');
            if (appSection) {
                appSection.classList.add('active-section');
            }
            
            // যদি তোমার সাইটে কোনো ইউজারনেম দেখানোর জায়গা থাকে
            alert(`স্বাগতম, ${user.username}!`);
        } else {
            errorMsg.innerText = "ভুল ইউজারনেম বা পাসওয়ার্ড!";
        }

    } catch (err) {
        console.error("Error logging in:", err);
        errorMsg.innerText = "ডাটাবেজ কানেকশনে সমস্যা হচ্ছে!";
    }
}

// ==========================================
// ৩. নেভিগেশন ও অ্যাপের অন্যান্য ফাংশন
// ==========================================
function switchSection(sectionId) {
    // সব সেকশন থেকে active-section ক্লাস রিমুভ করা
    document.querySelectorAll('.view-section').forEach(section => {
        section.classList.remove('active-section');
    });
    
    // নির্দিষ্ট সেকশনটি একটিভ করা
    const targetSection = document.getElementById(sectionId);
    if (targetSection) {
        targetSection.classList.add('active-section');
    }
}

// লগআউট ফাংশন
function logout() {
    // আবার লগইন স্ক্রিনে ব্যাক করা
    document.querySelectorAll('.view-section').forEach(section => {
        section.classList.remove('active-section');
    });
    document.getElementById('login-section').classList.add('active-section');
    
    // ইনপুট ফিল্ড খালি করা
    document.getElementById('login-username').value = "";
    document.getElementById('login-password').value = "";
}
