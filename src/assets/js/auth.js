// auth.js
const registerForm = document.getElementById('registerForm');
const loginForm = document.getElementById('loginForm');

async function showStatus(msg, err=false) {
  const el = document.getElementById('status');
  if (!el) return;
  el.innerText = msg;
  el.className = err ? 'status error' : 'status ok';
}

// Register
if (registerForm) {
  registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const displayName = document.getElementById('displayName').value.trim();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;

    try {
      const userCred = await firebase.auth().createUserWithEmailAndPassword(email, password);
      await userCred.user.updateProfile({ displayName });
      // Optionally store extra profile data in Firestore
      await firebase.firestore().collection('users').doc(userCred.user.uid).set({
        displayName,
        email,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      });
      showStatus('Account created. Redirecting...');
      setTimeout(() => location.href = 'chat.html', 1000);
    } catch (err) {
      showStatus(err.message, true);
    }
  });
}

// Login
if (loginForm) {
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    try {
      const userCred = await firebase.auth().signInWithEmailAndPassword(email, password);
      showStatus('Logged in — redirecting...');
      // Example: If you have an external Python JWT server to mint session tokens,
      // you could POST here: optional
      if (ENV.OPTIONAL_PY_JWT_URL) {
        try {
          const idToken = await userCred.user.getIdToken();
          // Send idToken to your Python server; it can verify and issue its own JWT if desired
          const resp = await fetch(`${ENV.OPTIONAL_PY_JWT_URL}/exchange-token`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ idToken })
          });
          // server should return e.g. { token: "...jwt..." }
          const data = await resp.json();
          // store token to localStorage for later use if server requires it
          if (data.token) localStorage.setItem('PY_JWT', data.token);
        } catch (err) {
          console.warn('Optional server token exchange failed', err);
        }
      }

      setTimeout(() => location.href = 'chat.html', 400);
    } catch (err) {
      showStatus(err.message, true);
    }
  });
}
