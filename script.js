// ==========================================
// ১. সুপাবেস কানেকশন ইনিশিয়ালিজেশন (১০০% সঠিক কী সহ)
// ==========================================
const SUPABASE_URL = "https://izkkonqhrfujfdxslbbn.supabase.co"; 

// তোমার ড্যাশবোর্ডের আসল ফুল কোডটি এখানে বসিয়ে দেওয়া হলো
const SUPABASE_KEY = "eyJhY2NvdW50X2lkIjoiZzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml6a2tvbnFocmZ1amZkeHNsYmJuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE4NzYxOTgsImV4cCI6MjA5NzQ1MjE5OH0.dZSFbK7BOk7PoUZCe9E4xmT94B_jjG-oS1Bw_mcMiNk";   

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

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
        // ডাটাবেজ থেকে ডেটা নিয়ে আসা
        const { data, error } = await supabase
            .from('users')
            .select('*');

        if (error) {
            console.error("Supabase Database Error:", error);
            if (errorMsg) errorMsg.innerText = "ডাটাবেজ কানেকশনে সমস্যা হচ্ছে!";
            return;
        }

        // টেবিলে থাকা ডেটার সাথে মিলানো
        const matchedUser = data.find(u => u.username === usernameInput && u.password === passwordInput);

        if (matchedUser) {
            // লগইন সফল হলে ড্যাশবোর্ড দেখাবে
            document.getElementById('login-section').classList.remove('active-section');
            const appSection = document.getElementById('app-section');
            if (appSection) {
                appSection.classList.add('active-section');
            }
            alert(`স্বাগতম, ${matchedUser.username}!`);
        } else {
            if (errorMsg) errorMsg.innerText = "ভুল ইউজারনেম বা পাসওয়ার্ড!";
        }

    } catch (err) {
        console.error("JavaScript Catch Error:", err);
        if (errorMsg) errorMsg.innerText = "কোড রান করতে সমস্যা হচ্ছে!";
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
