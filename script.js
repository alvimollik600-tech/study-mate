// ==========================================
// ১. সুপাবেস কানেকশন ইনিশিয়ালিজেশন (ভেরিয়েবল নাম ফিক্সড)
// ==========================================
const SUPABASE_URL = "https://izkkonqhrfujfdxslbbn.supabase.co"; 
const SUPABASE_KEY = "eyJhY2NvdW50X2lkIjoiZzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml6a2tvbnFocmZ1amZkeHNsYmJuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE4NzYxOTgsImV4cCI6MjA5NzQ1MjE5OH0.dZSFbK7BOk7PoUZCe9E4xmT94B_jjG-oS1Bw_mcMiNk";   

// ভেরিয়েবলের নাম পরিবর্তন করা হয়েছে যেন ক্র্যাশ না করে
const supabaseClient = window.supabasejs || window.supabase;
const mySupabase = supabaseClient.createClient(SUPABASE_URL, SUPABASE_KEY);

document.addEventListener('DOMContentLoaded', () => {
    console.log("Study Mate App Loaded successfully!");
});

// ==========================================
// ২. লগইন ফাংশন
// ==========================================
async function login() {
    const usernameInput = document.getElementById('login-username').value.trim();
    const passwordInput = document.getElementById('login-password').value.trim();
    const errorMsg = document.getElementById('login-error');

    if (errorMsg) errorMsg.innerText = "";

    if (!usernameInput || !passwordInput) {
        if (errorMsg) errorMsg.innerText = "দয়া করে ইউজারনেম এবং পাসওয়ার্ড দুটিই লিখুন!";
        return;
    }

    try {
        // নতুন ভেরিয়েবল mySupabase ব্যবহার করে ডাটা চেক
        const { data, error } = await mySupabase
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
            alert(`স্বাগতম, ${user.username}!`);
        } else {
            if (errorMsg) errorMsg.innerText = "ভুল ইউজারনেম বা পাসওয়ার্ড!";
        }

    } catch (err) {
        console.error("Supabase Connection Error:", err);
        if (errorMsg) errorMsg.innerText = "ডাটাবেজ কানেকশনে সমস্যা হচ্ছে!";
    }
}

// ==========================================
// ৩. নেভিগেশন ও অ্যাপের অন্যান্য ফাংশন
// ==========================================
function switchSection(sectionId) {
    document.querySelectorAll('.view-section').forEach(section => {
        section.classList.remove('active-section');
    });
    
    const targetSection = document.getElementById(sectionId);
    if (targetSection) {
        targetSection.classList.add('active-section');
    }
}

function logout() {
    document.querySelectorAll('.view-section').forEach(section => {
        section.classList.remove('active-section');
    });
    document.getElementById('login-section').classList.add('active-section');
    
    document.getElementById('login-username').value = "";
    document.getElementById('login-password').value = "";
}