// 🌐 State variables
let currentAccount = null;
let currentToken = null;
let expirationTimer = null;

// DOM elements
const generatedEmail = document.getElementById('generated-email');
const generateBtn = document.getElementById('generate-btn');
const refreshBtn = document.getElementById('refresh-btn');
const emailList = document.getElementById('email-list');
const unreadCount = document.getElementById('unread-count');
const emailDetail = document.getElementById('email-detail');
const backToInbox = document.getElementById('back-to-inbox');
const deleteBtn = document.getElementById('delete-btn');
const timerElement = document.getElementById('timer');
const notification = document.getElementById('notification');

let emails = [];
let selectedEmails = [];
let timeLeft = 600; // 10 minutes

// 📨 Create account + fetch token
async function createTempAccount() {
  const username = `user${Math.random().toString(36).substring(2, 10)}`;
  const domainRes = await fetch('https://api.mail.tm/domains');
  const domains = await domainRes.json();
  const domain = domains['hydra:member'][0].domain;
  const email = `${username}@${domain}`;
  const password = `${Math.random().toString(36).substring(2, 10)}*Temp`;

  const accountRes = await fetch('https://api.mail.tm/accounts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ address: email, password })
  });

  if (!accountRes.ok) {
    showNotification('⚠️ Failed to create temp account');
    return;
  }

  const tokenRes = await fetch('https://api.mail.tm/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ address: email, password })
  });
  const tokenData = await tokenRes.json();

  currentAccount = email;
  currentToken = tokenData.token;

  generatedEmail.textContent = email;
  timeLeft = 600;
  startTimer();
  fetchInbox();
}

// ⏱️ Start expiration countdown
function startTimer() {
  clearInterval(expirationTimer);
  expirationTimer = setInterval(() => {
    const min = String(Math.floor(timeLeft / 60)).padStart(2, '0');
    const sec = String(timeLeft % 60).padStart(2, '0');
    timerElement.innerHTML = `<i class="fas fa-hourglass-start"></i> Expires in: ${min}:${sec}`;
    timeLeft--;
    if (timeLeft < 0) {
      clearInterval(expirationTimer);
      emails = [];
      renderEmailList();
      timerElement.innerHTML = `<i class="fas fa-clock"></i> Mailbox expired.`;
      showNotification('⏳ Temporary mailbox expired');
    }
  }, 1000);
}

// 📬 Fetch inbox messages
async function fetchInbox() {
  if (!currentToken) return;
  const res = await fetch('https://api.mail.tm/messages', {
    headers: { Authorization: `Bearer ${currentToken}` }
  });
  const data = await res.json();
  emails = data['hydra:member'].map(msg => ({
    id: msg.id,
    sender: msg.from?.address || 'Unknown',
    subject: msg.subject || '(No Subject)',
    preview: msg.intro,
    time: new Date(msg.createdAt).toLocaleTimeString(),
    unread: !msg.seen,
    content: null
  }));
  renderEmailList();
}

// 📥 View email detail
async function showEmailDetail(email) {
  if (!email.content) {
    const res = await fetch(`https://api.mail.tm/messages/${email.id}`, {
      headers: { Authorization: `Bearer ${currentToken}` }
    });
    const data = await res.json();
    email.content = data.text || data.html || '(No content)';
  }
  document.querySelector('.inbox-container').style.display = 'none';
  emailDetail.style.display = 'block';
  document.getElementById('detail-sender').textContent = email.sender;
  document.getElementById('detail-subject').textContent = email.subject;
  document.getElementById('detail-date').textContent = new Date().toLocaleString();
  document.getElementById('detail-body').textContent = email.content;
}

// 🧹 Render email list
function renderEmailList() {
  emailList.innerHTML = '';
  let unread = 0;
  emails.forEach(email => {
    if (email.unread) unread++;
    const item = document.createElement('div');
    item.className = `email-item ${email.unread ? 'unread' : ''}`;
    item.dataset.id = email.id;
    item.innerHTML = `
      <div class="email-checkbox">
        <input type="checkbox" class="email-checkbox-input" data-id="${email.id}">
      </div>
      <div class="email-sender">${email.sender}</div>
      <div class="email-content">
        <div class="email-subject">${email.subject}</div>
        <div class="email-preview">${email.preview}</div>
      </div>
      <div class="email-time">${email.time}</div>
    `;
    emailList.appendChild(item);
  });
  unreadCount.textContent = unread;

  // Click listeners
  document.querySelectorAll('.email-item').forEach(item => {
    item.addEventListener('click', e => {
      if (!e.target.classList.contains('email-checkbox-input')) {
        const id = item.dataset.id;
        const email = emails.find(e => e.id === id);
        if (email.unread) email.unread = false;
        showEmailDetail(email);
        renderEmailList();
      }
    });
  });
  document.querySelectorAll('.email-checkbox-input').forEach(checkbox => {
    checkbox.addEventListener('click', e => {
      e.stopPropagation();
      const id = checkbox.dataset.id;
      if (checkbox.checked) selectedEmails.push(id);
      else selectedEmails = selectedEmails.filter(i => i !== id);
    });
  });
}

// ❌ Delete selected messages
async function deleteSelectedEmails() {
  if (!selectedEmails.length || !currentToken) return;
  for (let id of selectedEmails) {
    await fetch(`https://api.mail.tm/messages/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${currentToken}` }
    });
  }
  selectedEmails = [];
  fetchInbox();
  showNotification('🗑️ Selected emails deleted');
}

// 📢 Show message
function showNotification(message) {
  notification.textContent = message;
  notification.classList.add('show');
  setTimeout(() => notification.classList.remove('show'), 3000);
}

// 🧠 Events
generateBtn.addEventListener('click', () => {
  createTempAccount();
  generateBtn.innerHTML = '<i class="fas fa-check"></i> Generated!';
  setTimeout(() => {
    generateBtn.innerHTML = '<i class="fas fa-plus"></i> Generate New Address';
  }, 1500);
});

refreshBtn.addEventListener('click', () => {
  refreshBtn.innerHTML = '<i class="fas fa-sync-alt fa-spin"></i> Refreshing';
  fetchInbox().then(() => {
    refreshBtn.innerHTML = '<i class="fas fa-sync-alt"></i> Refresh';
    showNotification('🔁 Inbox refreshed');
  });
});

deleteBtn.addEventListener('click', deleteSelectedEmails);
backToInbox.addEventListener('click', () => {
  emailDetail.style.display = 'none';
  document.querySelector('.inbox-container').style.display = 'block';
});
