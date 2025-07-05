// DOM Elements
const generatedEmail = document.getElementById('generated-email');
const copyBtn = document.getElementById('copy-btn');
const generateBtn = document.getElementById('generate-btn');
const refreshBtn = document.getElementById('refresh-btn');
const deleteBtn = document.getElementById('delete-btn');
const emailList = document.getElementById('email-list');
const emailStatus = document.getElementById('email-status');
const unreadCount = document.getElementById('unread-count');
const emailView = document.getElementById('email-view');
const backToInboxBtn = document.getElementById('back-to-inbox');
const newEmailLink = document.getElementById('new-email-link');
const activeUsers = document.getElementById('active-users');
const emailsProcessed = document.getElementById('emails-processed');

// Globals for real API
let currentLogin = '';
let currentDomain = '';
let emails = [];
let intervalId = null;

// Generate random parts
function generateRandomParts() {
  const prefixes = ['anon', 'temp', 'secret', 'private', 'ghost', 'stealth', 'secure', 'masked'];
  const domains = ['1secmail.com', '1secmail.org', '1secmail.net'];
  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
  const randomId = Math.random().toString(36).substring(2, 8);
  const domain = domains[Math.floor(Math.random() * domains.length)];
  return { login: prefix + randomId, domain };
}
// Render inbox UI
function renderInbox() {
  if (emails.length === 0) {
    emailList.innerHTML = `
      <div class="email-item" style="text-align: center; padding: 30px; color: var(--gray);">
        <i class="fas fa-inbox fa-2x"></i>
        <div style="margin-top: 15px;">Your inbox is empty</div>
        <p style="font-size: 0.9rem; margin-top: 10px;">Emails will appear here when received</p>
      </div>
    `;
    unreadCount.textContent = '0';
    unreadCount.style.display = 'none';
    return;
  }
  emailList.innerHTML = '';
  emails.forEach(email => {
    const item = document.createElement('div');
    item.className = `email-item ${email.read ? '' : 'unread'}`;
    item.dataset.id = email.id;
    item.innerHTML = `
      <div class="email-sender">${email.from}</div>
      <div class="email-subject">${email.subject}</div>
      <div class="email-time">${new Date(email.date).toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})}</div>
    `;
    item.addEventListener('click', () => viewEmail(email.id));
    emailList.appendChild(item);
  });
  updateUnreadCount();
}
// Poll inbox from API
function pollInbox() {
  fetch(`https://www.1secmail.com/api/v1/?action=getMessages&login=${currentLogin}&domain=${currentDomain}`)
    .then(res => res.json())
    .then(list => {
      list.forEach(msg => {
        if (!emails.find(e => e.id === msg.id)) {
          // New message
          fetch(`https://www.1secmail.com/api/v1/?action=readMessage&login=${currentLogin}&domain=${currentDomain}&id=${msg.id}`)
            .then(r => r.json())
            .then(full => {
              emails.unshift({
                id: full.id,
                from: full.from,
                subject: full.subject,
                date: full.date,
                body: full.body,
                read: false
              });
              emailsProcessed.textContent = (parseFloat(emailsProcessed.textContent.replace(/,/g, '')) + 1).toLocaleString();
              renderInbox();
            });
        }
      });
    })
    .catch(console.error);
}

// Start polling
function startEmailListener() {
  clearInterval(intervalId);
  emailStatus.style.display = 'block';
  intervalId = setInterval(pollInbox, 5000);
  pollInbox();
}

// View email details
function viewEmail(id) {
  const email = emails.find(e => e.id === id);
  if (!email) return;
  email.read = true;
  document.getElementById('email-view-subject').textContent = email.subject;
  document.getElementById('email-view-from').textContent = email.from;
  document.getElementById('email-view-time').textContent = new Date(email.date).toLocaleString();
  document.getElementById('email-view-body').innerHTML = email.body;
  document.querySelector('.inbox').style.display = 'none';
  emailView.style.display = 'block';
  updateUnreadCount();
}

// Update unread count badge
function updateUnreadCount() {
  const unread = emails.filter(e => !e.read).length;
  unreadCount.textContent = unread;
  unreadCount.style.display = unread ? 'inline-block' : 'none';
}

// Event listeners
copyBtn.addEventListener('click', () => {
  navigator.clipboard.writeText(generatedEmail.textContent).then(() => {
    copyBtn.innerHTML = '<i class="fas fa-check"></i> Copied!';
    setTimeout(() => { copyBtn.innerHTML = '<i class="fas fa-copy"></i> Copy'; }, 2000);
  });
});

generateBtn.addEventListener('click', () => {
  const parts = generateRandomParts();
  currentLogin = parts.login;
  currentDomain = parts.domain;
  generatedEmail.textContent = `${currentLogin}@${currentDomain}`;
  emails = [];
  renderInbox();
  startEmailListener();
  generateBtn.innerHTML = '<i class="fas fa-check"></i> Generated!';
  setTimeout(() => { generateBtn.innerHTML = '<i class="fas fa-plus"></i> Generate New Address'; }, 1500);
});

refreshBtn.addEventListener('click', () => {
  pollInbox();
});

deleteBtn.addEventListener('click', () => {
  emails = [];
  renderInbox();
  deleteBtn.innerHTML = '<i class="fas fa-check"></i> Cleared!';
  setTimeout(() => { deleteBtn.innerHTML = '<i class="fas fa-trash"></i>'; }, 1500);
});

backToInboxBtn.addEventListener('click', () => {
  emailView.style.display = 'none';
  document.querySelector('.inbox').style.display = 'block';
});

newEmailLink.addEventListener('click', (e) => {
  e.preventDefault();
  generateBtn.click();
});

// Initialize on load
window.addEventListener('DOMContentLoaded', () => {
  generateBtn.click();
  // Simulate active users
  setInterval(() => {
    const users = parseFloat(activeUsers.textContent.replace(/,/g, ''));
    const change = Math.floor(Math.random() * 21) - 10;
    activeUsers.textContent = Math.max(1000, users + change).toLocaleString();
  }, 5000);
});

window.addEventListener('DOMContentLoaded', () => {
  generateBtn.addEventListener('click', () => {
    const customLogin = document.getElementById('custom-login').value.trim();
    const parts = generateRandomParts();
    currentLogin = customLogin || parts.login;
    currentDomain = parts.domain;

    generatedEmail.textContent = `${currentLogin}@${currentDomain}`;
    emails = [];
    renderInbox();
    startEmailListener();
    generateBtn.innerHTML = '<i class="fas fa-check"></i> Generated!';
    setTimeout(() => {
      generateBtn.innerHTML = '<i class="fas fa-plus"></i> Generate New Address';
    }, 1500);
  });

  // Also move all other event listeners here:
  refreshBtn.addEventListener('click', pollInbox);
  deleteBtn.addEventListener('click', () => {
    emails = [];
    renderInbox();
    deleteBtn.innerHTML = '<i class="fas fa-check"></i> Cleared!';
    setTimeout(() => {
      deleteBtn.innerHTML = '<i class="fas fa-trash"></i>';
    }, 1500);
  });
  copyBtn.addEventListener('click', () => {
    navigator.clipboard.writeText(generatedEmail.textContent).then(() => {
      copyBtn.innerHTML = '<i class="fas fa-check"></i> Copied!';
      setTimeout(() => {
        copyBtn.innerHTML = '<i class="fas fa-copy"></i> Copy';
      }, 2000);
    });
  });
  backToInboxBtn.addEventListener('click', () => {
    emailView.style.display = 'none';
    document.querySelector('.inbox').style.display = 'block';
  });
  newEmailLink.addEventListener('click', (e) => {
    e.preventDefault();
    generateBtn.click();
  });

  // Initialize
  generateBtn.click();

  setInterval(() => {
    const users = parseFloat(activeUsers.textContent.replace(/,/g, ''));
    const change = Math.floor(Math.random() * 21) - 10;
    activeUsers.textContent = Math.max(1000, users + change).toLocaleString();
  }, 5000);
});

function pollInbox() {
  emailStatus.innerHTML = `<i class="fas fa-circle-notch fa-spin"></i> Checking for new emails...`;

  fetch(`https://www.1secmail.com/api/v1/?action=getMessages&login=tempxyz&domain=1secmail.com`)
    .then(res => res.json())
    .then(list => {
      list.forEach(msg => {
        if (!emails.find(e => e.id === msg.id)) {
          fetch(`https://www.1secmail.com/api/v1/?action=readMessage&login=${currentLogin}&domain=${currentDomain}&id=${msg.id}`)
            .then(r => r.json())
            .then(full => {
              emails.unshift({
                id: full.id,
                from: full.from,
                subject: full.subject,
                date: full.date,
                body: full.body,
                read: false
              });
              emailsProcessed.textContent = (parseFloat(emailsProcessed.textContent.replace(/,/g, '')) + 1).toLocaleString();
              renderInbox();
            });
        }
      });
      emailStatus.innerHTML = `<i class="fas fa-circle-notch fa-spin"></i> Listening for incoming emails...`;
    })
    .catch(err => {
      console.error(err);
      emailStatus.innerHTML = `<i class="fas fa-exclamation-triangle"></i> Error fetching emails`;
    });
}
generateBtn.click(); // Already there in DOMContentLoaded ✅
