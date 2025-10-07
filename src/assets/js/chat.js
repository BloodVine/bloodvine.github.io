// chat.js
const messagesEl = document.getElementById('messages');
const messageForm = document.getElementById('messageForm');
const messageInput = document.getElementById('messageInput');
const btnSignOut = document.getElementById('btnSignOut');

const messagesRef = firebase.firestore().collection('messages');

function renderMessage(doc) {
  const d = doc.data();
  const div = document.createElement('div');
  div.className = 'message';
  div.innerHTML = `
    <div class="meta">
      <span class="name">${escapeHtml(d.displayName || 'Anon')}</span>
      <span class="time">${new Date(d.createdAt?.toDate ? d.createdAt.toDate() : Date.now()).toLocaleTimeString()}</span>
    </div>
    <div class="body">${escapeHtml(d.text)}</div>
  `;
  messagesEl.appendChild(div);
  messagesEl.scrollTop = messagesEl.scrollHeight;
}

function escapeHtml(s='') {
  return s.replace(/[&<>"']/g, (m) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
}

firebase.auth().onAuthStateChanged(user => {
  if (user) {
    document.getElementById('displayName').innerText = user.displayName || 'Gamer';
    document.getElementById('emailSmall').innerText = user.email || '';
    // live listen messages (limited)
    messagesRef.orderBy('createdAt', 'asc').limitToLast(200).onSnapshot(snapshot => {
      messagesEl.innerHTML = '';
      snapshot.forEach(renderMessage);
    });
  } else {
    // allow anonymous read; but require sign-in for posting
    messagesRef.orderBy('createdAt', 'asc').limitToLast(200).get().then(snapshot => {
      messagesEl.innerHTML = '';
      snapshot.forEach(renderMessage);
    });
  }
});

if (messageForm) {
  messageForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const text = messageInput.value.trim();
    if (!text) return;
    const user = firebase.auth().currentUser;
    const data = {
      text,
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      displayName: user?.displayName || 'Guest',
      uid: user?.uid || null
    };
    try {
      await messagesRef.add(data);
      messageInput.value = '';
    } catch (err) {
      alert('Failed to send message: ' + err.message);
    }
  });
}

if (btnSignOut) {
  btnSignOut.addEventListener('click', () => firebase.auth().signOut().then(() => location.reload()));
}
