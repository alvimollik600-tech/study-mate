// ==========================================
// ১. সুপাবেস কানেকশন ইনিশিয়ালিজেশন
// ==========================================
const PROJ_URL = "https://izkkonqhrfujfdxslbbn.supabase.co"; 
const PROJ_KEY = "eyJhY2NvdW50X2lkIjoiZzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml6a2tvbnFocmZ1amZkeHNsYmJuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE4NzYxOTgsImV4cCI6MjA5NzQ1MjE5OH0.dZSFbK7BOk7PoUZCe9E4xmT94B_jjG-oS1Bw_mcMiNk";   

// ভেরিয়েবলের নাম সম্পূর্ণ আলাদা রাখা হলো যেন ব্রাউজারে কোনো সংঘর্ষ না হয়
const mySupabaseInstance = window.supabase.createClient(PROJ_URL, PROJ_KEY);

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
        // সুপাবেস থেকে ডাটা চেক করা
        const { data, error } = await mySupabaseInstance
            .from('users')
            .select('*')
            .eq('username', usernameInput)
            .eq('password', passwordInput);

        if (error) throw error;

        if (data && data.length > 0) {
            const user = data[0];
            
            // লগইন সফল হলে ড্যাশবোর্ড দেখানো
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
        console.error("Connection error details:", err);
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
    if (targetSection) targetSection.classList.add('active-section');
}

function logout() {
    document.querySelectorAll('.view-section').forEach(section => {
        section.classList.remove('active-section');
    });
    document.getElementById('login-section').classList.add('active-section');
    document.getElementById('login-username').value = "";
    document.getElementById('login-password').value = "";
}
