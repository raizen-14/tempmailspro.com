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
let currentDomain = '';
let emails = [];
let intervalId = null;
let timerInterval = null;
let timeLeft = 3600; // 60 minutes in seconds
let totalEmailsProcessed = 1200000;
let sessionId = '';

// Generate random email
function generateRandomEmail() {
  const prefixes = ['anon', 'temp', 'secret', 'private', 'ghost', 'stealth', 'secure', 'masked'];
  const domains = ['tempmailpro.com', 'disposable.me', 'mailinator.net'];
  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
  const randomId = Math.random().toString(36).substring(2, 8);
  const domain = domains[Math.floor(Math.random() * domains.length)];
  return `${prefix}${randomId}@${domain}`;
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
  // Look for 6-digit codes
  const otpRegex = /(\b\d{6}\b)|(code:?\s*\d{6})|(verification\s*code:?\s*\d{6})/i;
  return otpRegex.test(content);
}

// Extract OTP from email content
function extractOTP(content) {
  const otpRegex = /\b\d{6}\b/;
  const match = content.match(otpRegex);
  return match ? match[0] : null;
}

// Simulate email retrieval from API
function fetchEmails() {
  if (!currentLogin) return;
  
  emailStatus.innerHTML = `<i class="fas fa-circle-notch fa-spin"></i> Checking for new emails...`;
  
  // Simulate API call delay
  setTimeout(() => {
    if (Math.random() > 0.5) {
      const newEmailsCount = Math.floor(Math.random() * 3) + 1;
      const newEmails = [];
      
      for (let i = 0; i < newEmailsCount; i++) {
        const newEmailId = Date.now() + i;
        const senders = ['noreply@google.com', 'security@facebook.com', 'support@amazon.com', 'info@twitter.com'];
        const subjects = ['Verify your email', 'Password reset request', 'Your security code', 'Welcome to our service'];
        const contentOptions = [
          `<p>Hello,</p><p>Your verification code is: <strong>${Math.floor(100000 + Math.random() * 900000)}</strong></p><p>This code will expire in 10 minutes.</p>`,
          `<p>Dear user,</p><p>We received a request to reset your password. Your temporary password is: <strong>${Math.floor(100000 + Math.random() * 900000)}</strong></p>`,
          `<p>Hello,</p><p>Thank you for signing up for our service. To complete your registration, please click the button below:</p><p><a href="#" style="display: inline-block; background-color: #4361ee; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin: 15px 0;">Verify Email Address</a></p>`
        ];
        
        const emailContent = contentOptions[Math.floor(Math.random() * contentOptions.length)];
        const hasOTP = hasOTP(emailContent);
        
        newEmails.push({
          id: newEmailId,
          from: senders[Math.floor(Math.random() * senders.length)],
          subject: subjects[Math.floor(Math.random() * subjects.length)],
          date: new Date(),
          body: `<div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">${emailContent}</div>`,
          read: false,
          hasOTP: hasOTP
        });
      }
      
      emails = [...newEmails, ...emails];
      
      // Update stats
      totalEmailsProcessed += newEmailsCount;
      emailsProcessed.textContent = totalEmailsProcessed > 1000000 
        ? (totalEmailsProcessed / 1000000).toFixed(1) + 'M'
        : totalEmailsProcessed.toLocaleString();
      
      renderInbox();
      
      emailStatus.innerHTML = `<i class="fas fa-check-circle"></i> ${newEmailsCount} new email${newEmailsCount > 1 ? 's' : ''} received!`;
      setTimeout(() => {
        emailStatus.innerHTML = `<i class="fas fa-circle-notch fa-spin"></i> Listening for incoming emails...`;
      }, 3000);
    } else {
      emailStatus.innerHTML = `<i class="fas fa-circle-notch fa-spin"></i> Listening for incoming emails...`;
    }
  }, 1000);
}

// Start polling
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

// Timer functions
function startTimer() {
  clearInterval(timerInterval);
  clearInterval(intervalId);
  
  timeLeft = 3600;
  timerElement.style.display = 'block';
  timerElement.innerHTML = `<i class="fas fa-hourglass-start"></i> Expires in: 60:00`;
  
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
    currentLogin = newEmail.split('@')[0];
    currentDomain = newEmail.split('@')[1];
    
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
