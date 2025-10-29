document.addEventListener('DOMContentLoaded', function () {
    const mobileMenu = document.querySelector('.mobile-menu');
    const navMenu = document.querySelector('nav ul');

    if (mobileMenu && navMenu) {
        mobileMenu.addEventListener('click', function() {
            navMenu.style.display = navMenu.style.display === 'flex' ? 'none' : 'flex';
        });

        // Close mobile menu when clicking on a link
        document.querySelectorAll('nav ul li a').forEach(link => {
            link.addEventListener('click', function() {
                if (window.innerWidth <= 768) {
                    navMenu.style.display = 'none';
                }
            });
        });
    }
});
document.getElementById('loginBtn').addEventListener('click', () => {
    window.location.href = 'login.html';
});
document.getElementById('signupBtn').addEventListener('click', () => {
    window.location.href = 'signup.html';
});

// server.js (runs in a protected environment)
const admin = require('firebase-admin');
admin.initializeApp({
  credential: admin.credential.cert(JSON.parse(process.env.SVC_ACCOUNT_JSON)),
  databaseURL: process.env.FIREBASE_DATABASE_URL
});

app.post('/messages', async (req,res) => {
  const idToken = req.headers.authorization?.split('Bearer ')[1];
  const decoded = await admin.auth().verifyIdToken(idToken);
  // validate req.body, then write to DB using admin.database().ref('messages').push(...)
});
