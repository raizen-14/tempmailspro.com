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
const timerElement = document.getElementById('timer');

// Globals
let currentLogin = '';
let emails = [];
let intervalId = null;
let timerInterval = null;
let timeLeft = 600; // 10 minutes in seconds
let totalEmailsProcessed = 1200000;

// Generate random email
function generateRandomEmail() {
  const domains = ['1secmail.com', '1secmail.net', '1secmail.org'];
  const prefix = Math.random().toString(36).substring(2, 10);
  const domain = domains[Math.floor(Math.random() * domains.length)];
  return `${prefix}@${domain}`;
}

// Render inbox UI
function renderInbox() {
  if (emails.length === 0) {
    emailList.innerHTML = `
      <div class="empty-inbox">
        <i class="fas fa-inbox"></i>
        <p>Your inbox is empty</p>
        <p>Emails will appear here when received</p>
      </div>
    `;
    unreadCount.textContent = '0';
    return;
  }
  
  emailList.innerHTML = '';
  emails.forEach(email => {
    const item = document.createElement('div');
    item.className = `email-item ${email.read ? '' : 'unread'}`;
    item.dataset.id = email.id;
    item.innerHTML = `
      <div class="email-info">
        <div class="email-sender">${email.from}</div>
        <div class="email-subject">${email.subject}
          ${email.hasOTP ? '<span class="otp-badge">OTP</span>' : ''}
        </div>
      </div>
      <div class="email-time">${new Date(email.date).toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})}</div>
    `;
    item.addEventListener('click', () => viewEmail(email.id));
    emailList.appendChild(item);
  });
  updateUnreadCount();
}

// Check for OTP in email content
function hasOTP(content) {
  const otpRegex = /(\b\d{4,8}\b)|(code:?\s*\d{4,8})|(verification\s*code:?\s*\d{4,8})|(otp:?\s*\d{4,8})/i;
  return otpRegex.test(content);
}

// Extract OTP from email content
function extractOTP(content) {
  const otpRegex = /\b\d{4,8}\b/;
  const match = content.match(otpRegex);
  return match ? match[0] : null;
}

// Retrieve emails from API
async function fetchEmails() {
  if (!currentLogin) return;
  
  emailStatus.innerHTML = `<i class="fas fa-circle-notch fa-spin"></i> Checking for new emails...`;
  
  try {
    const [login, domain] = currentLogin.split('@');
    const response = await fetch(`https://www.1secmail.com/api/v1/?action=getMessages&login=${login}&domain=${domain}`);
    const messages = await response.json();
    
    if (!messages || messages.length === 0) {
      emailStatus.innerHTML = `<i class="fas fa-circle-notch fa-spin"></i> Listening for incoming emails...`;
      return;
    }

    let newEmailsCount = 0;
    
    for (const message of messages) {
      if (emails.some(e => e.id === message.id)) continue;
      
      const emailRes = await fetch(`https://www.1secmail.com/api/v1/?action=readMessage&login=${login}&domain=${domain}&id=${message.id}`);
      const emailData = await emailRes.json();
      
      const newEmail = {
        id: message.id,
        from: emailData.from,
        subject: emailData.subject || "No Subject",
        date: new Date(emailData.date),
        body: emailData.htmlBody || emailData.textBody || "No content",
        read: false,
        hasOTP: hasOTP(emailData.textBody || "")
      };
      
      emails.unshift(newEmail);
      newEmailsCount++;
      totalEmailsProcessed++;
    }

    if (newEmailsCount > 0) {
      renderInbox();
      emailStatus.innerHTML = `<i class="fas fa-check-circle"></i> ${newEmailsCount} new email${newEmailsCount > 1 ? 's' : ''} received!`;
      setTimeout(() => {
        emailStatus.innerHTML = `<i class="fas fa-circle-notch fa-spin"></i> Listening for incoming emails...`;
      }, 3000);
    } else {
      emailStatus.innerHTML = `<i class="fas fa-circle-notch fa-spin"></i> Listening for incoming emails...`;
    }
  } catch (error) {
    console.error('Error fetching emails:', error);
    emailStatus.innerHTML = `<i class="fas fa-exclamation-triangle"></i> Error fetching emails`;
  }
}

// Start email polling
function startEmailListener() {
  clearInterval(intervalId);
  emailStatus.style.display = 'block';
  intervalId = setInterval(fetchEmails, 5000);
  fetchEmails();
}

// View email details
function viewEmail(id) {
  const email = emails.find(e => e.id === id);
  if (!email) return;
  
  email.read = true;
  document.getElementById('email-view-subject').textContent = email.subject;
  document.getElementById('email-view-from').textContent = email.from;
  document.getElementById('email-view-time').textContent = new Date(email.date).toLocaleString();
  
  // Display email body
  const emailBody = document.getElementById('email-view-body');
  emailBody.innerHTML = email.body;
  
  // Highlight OTP if present
  if (email.hasOTP) {
    const otp = extractOTP(email.body);
    if (otp) {
      const otpElement = document.createElement('div');
      otpElement.style = "margin-top: 20px; padding: 15px; background: #06d6a020; border-radius: 8px; border-left: 4px solid #06d6a0;";
      otpElement.innerHTML = `
        <h3 style="margin-bottom: 10px; color: #06d6a0;"><i class="fas fa-key"></i> OTP Detected</h3>
        <p style="font-size: 1.5rem; font-weight: bold; letter-spacing: 2px;">${otp}</p>
        <p style="margin-top: 10px; font-size: 0.9rem;">This code was automatically detected in the email</p>
      `;
      emailBody.appendChild(otpElement);
    }
  }
  
  document.querySelector('.inbox').style.display = 'none';
  emailView.style.display = 'block';
  updateUnreadCount();
}

// Update unread count badge
function updateUnreadCount() {
  const unread = emails.filter(e => !e.read).length;
  unreadCount.textContent = unread;
}

// Timer functions (10-minute expiration)
function startTimer() {
  clearInterval(timerInterval);
  clearInterval(intervalId);
  
  timeLeft = 600; // 10 minutes
  timerElement.style.display = 'block';
  timerElement.innerHTML = `<i class="fas fa-hourglass-start"></i> Expires in: 10:00`;
  
  timerInterval = setInterval(() => {
    const minutes = Math.floor(timeLeft / 60).toString().padStart(2, '0');
    const seconds = (timeLeft % 60).toString().padStart(2, '0');
    timerElement.innerHTML = `<i class="fas fa-hourglass-start"></i> Expires in: ${minutes}:${seconds}`;
    
    timeLeft--;
    
    if (timeLeft < 0) {
      clearInterval(timerInterval);
      clearInterval(intervalId);
      emailStatus.innerHTML = `<i class="fas fa-times-circle"></i> Email expired. Generate a new one.`;
      timerElement.innerHTML = `<i class="fas fa-clock"></i> This email has expired.`;
    }
  }, 1000);
}

// Initialize on load
window.addEventListener('DOMContentLoaded', () => {
  // Set initial stats
  activeUsers.textContent = "24.5K";
  emailsProcessed.textContent = "1.2M";
  
  // Event listeners
  copyBtn.addEventListener('click', () => {
    navigator.clipboard.writeText(generatedEmail.textContent).then(() => {
      copyBtn.innerHTML = '<i class="fas fa-check"></i> Copied!';
      setTimeout(() => { copyBtn.innerHTML = '<i class="fas fa-copy"></i> Copy'; }, 2000);
    });
  });
  
  generateBtn.addEventListener('click', () => {
    const newEmail = generateRandomEmail();
    generatedEmail.textContent = newEmail;
    currentLogin = newEmail;
    
    emails = [];
    renderInbox();
    startEmailListener();
    startTimer();
    
    generateBtn.innerHTML = '<i class="fas fa-check"></i> Generated!';
    setTimeout(() => {
      generateBtn.innerHTML = '<i class="fas fa-plus"></i> Generate New Address';
    }, 1500);
  });
  
  refreshBtn.addEventListener('click', () => {
    fetchEmails();
    refreshBtn.innerHTML = '<i class="fas fa-sync fa-spin"></i>';
    setTimeout(() => { refreshBtn.innerHTML = '<i class="fas fa-sync"></i>'; }, 1000);
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
  
  // Simulate active users
  setInterval(() => {
    const usersText = activeUsers.textContent;
    let users = 24500;
    
    if (usersText.includes('K')) {
      users = parseFloat(usersText) * 1000;
    }
    
    const change = Math.floor(Math.random() * 21) - 10;
    const newUsers = Math.max(24000, users + change);
    activeUsers.textContent = newUsers > 10000 
      ? (newUsers / 1000).toFixed(1) + 'K'
      : newUsers.toLocaleString();
  }, 5000);
  
  // Generate initial email
  setTimeout(() => {
    generateBtn.click();
  }, 1000);
});
