// DOM Elements
const generatedEmail = document.getElementById('generated-email');
const copyBtn = document.getElementById('copy-btn');
const generateBtn = document.getElementById('generate-btn');
const timerElement = document.getElementById('timer');
const tabs = document.querySelectorAll('.tab');
const emailList = document.getElementById('email-list');
const emailDetail = document.getElementById('email-detail');
const backToInbox = document.getElementById('back-to-inbox');
const refreshBtn = document.getElementById('refresh-btn');
const deleteBtn = document.getElementById('delete-btn');
const searchInput = document.getElementById('search-input');
const unreadCount = document.getElementById('unread-count');
const themeToggle = document.getElementById('theme-toggle');
const notification = document.getElementById('notification');

// Email data
let emails = [];
let unreadEmails = 3;
let selectedEmails = [];

// Timer variables
let timeLeft = 298; // 4 minutes 58 seconds
let timerInterval;

// Theme state
let isDarkMode = true;

// Sample email data
const sampleSenders = ['Twitter', 'GitHub', 'Netflix', 'Spotify', 'Instagram', 'Facebook', 'Amazon', 'Google'];
const sampleSubjects = [
    'Confirm your account', 
    'Verify your email address', 
    'Welcome to our service!', 
    'Password reset request', 
    'Your order confirmation', 
    'Security alert',
    'New login detected',
    'Subscription confirmation'
];
const samplePreviews = [
    'Hello, please confirm your new account...',
    'Welcome! Please verify your email address...',
    'Thank you for signing up! Here are the next steps...',
    'We received a request to reset your password...',
    'Your order #12345 has been confirmed...',
    'We noticed a new sign-in to your account...',
    'A new device has accessed your account...',
    'Your premium subscription has been activated...'
];

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    // Start the timer
    startTimer();
    
    // Load theme preference
    loadThemePreference();
    
    // Initialize inbox
    generateSampleEmails();
    renderEmailList();
    
    // Setup event listeners
    setupEventListeners();
    
    // Start simulating incoming emails
    startEmailSimulation();
});

// Functions
function startTimer() {
    clearInterval(timerInterval);
    
    timerInterval = setInterval(() => {
        const minutes = Math.floor(timeLeft / 60).toString().padStart(2, '0');
        const seconds = (timeLeft % 60).toString().padStart(2, '0');
        timerElement.innerHTML = `<i class="fas fa-hourglass-start"></i> Expires in: ${minutes}:${seconds}`;
        
        timeLeft--;
        
        if (timeLeft < 0) {
            clearInterval(timerInterval);
            timerElement.innerHTML = `<i class="fas fa-clock"></i> This email has expired.`;
        }
    }, 1000);
}

function generateRandomEmail() {
    const prefixes = ['ghost', 'stealth', 'phantom', 'shadow', 'ninja', 'secret', 'private', 'masked'];
    const domains = ['tempmailspro.com', 'issemail.org', 'disposable.me', 'privacybox.io'];
    const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    const randomId = Math.random().toString(36).substring(2, 6);
    const domain = domains[Math.floor(Math.random() * domains.length)];
    return `${prefix}${randomId}@${domain}`;
}

function generateSampleEmails() {
    emails = [];
    for (let i = 0; i < 8; i++) {
        const senderIndex = Math.floor(Math.random() * sampleSenders.length);
        const subjectIndex = Math.floor(Math.random() * sampleSubjects.length);
        const previewIndex = Math.floor(Math.random() * samplePreviews.length);
        
        const isUnread = i < 3;
        
        emails.push({
            id: i,
            sender: sampleSenders[senderIndex],
            subject: sampleSubjects[subjectIndex],
            preview: samplePreviews[previewIndex],
            time: i < 2 ? '10:30 AM' : i < 4 ? '9:15 AM' : i < 6 ? '8:45 AM' : 'Yesterday',
            unread: isUnread,
            content: `Hello there,\n\nThank you for using TempMailsPro! This is a sample email from ${sampleSenders[senderIndex]} about "${sampleSubjects[subjectIndex]}".\n\n${samplePreviews[previewIndex]}\n\nBest regards,\nThe ${sampleSenders[senderIndex]} Team`
        });
    }
}

function renderEmailList() {
    emailList.innerHTML = '';
    unreadEmails = 0;
    
    emails.forEach(email => {
        if (email.unread) unreadEmails++;
        
        const emailItem = document.createElement('div');
        emailItem.className = `email-item ${email.unread ? 'unread' : ''}`;
        emailItem.dataset.id = email.id;
        
        emailItem.innerHTML = `
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
        
        emailList.appendChild(emailItem);
    });
    
    unreadCount.textContent = unreadEmails;
    
    // Add event listeners to email items
    document.querySelectorAll('.email-item').forEach(item => {
        item.addEventListener('click', function(e) {
            if (!e.target.classList.contains('email-checkbox-input')) {
                const emailId = this.dataset.id;
                const email = emails.find(e => e.id == emailId);
                
                if (email.unread) {
                    email.unread = false;
                    unreadEmails--;
                    unreadCount.textContent = unreadEmails;
                    this.classList.remove('unread');
                }
                
                showEmailDetail(email);
            }
        });
    });
    
    // Add event listeners to checkboxes
    document.querySelectorAll('.email-checkbox-input').forEach(checkbox => {
        checkbox.addEventListener('click', function(e) {
            e.stopPropagation();
            const emailId = this.dataset.id;
            
            if (this.checked) {
                selectedEmails.push(parseInt(emailId));
            } else {
                selectedEmails = selectedEmails.filter(id => id != emailId);
            }
        });
    });
}

function showEmailDetail(email) {
    document.querySelector('.inbox-container').style.display = 'none';
    emailDetail.style.display = 'block';
    
    document.getElementById('detail-sender').textContent = email.sender;
    document.getElementById('detail-subject').textContent = email.subject;
    document.getElementById('detail-date').textContent = new Date().toLocaleString();
    document.getElementById('detail-body').textContent = email.content;
}

function showNotification(message) {
    notification.textContent = message;
    notification.classList.add('show');
    
    setTimeout(() => {
        notification.classList.remove('show');
    }, 3000);
}

function toggleTheme() {
    isDarkMode = !isDarkMode;
    
    if (isDarkMode) {
        document.body.classList.remove('light-theme');
        themeToggle.innerHTML = '<i class="fas fa-moon"></i>';
    } else {
        document.body.classList.add('light-theme');
        themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
    }
    
    // Save to localStorage
    localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
}

function loadThemePreference() {
    const savedTheme = localStorage.getItem('theme');
    
    if (savedTheme === 'light') {
        isDarkMode = false;
        document.body.classList.add('light-theme');
        themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
    } else {
        themeToggle.innerHTML = '<i class="fas fa-moon"></i>';
    }
}

function simulateIncomingEmail() {
    const senderIndex = Math.floor(Math.random() * sampleSenders.length);
    const subjectIndex = Math.floor(Math.random() * sampleSubjects.length);
    const previewIndex = Math.floor(Math.random() * samplePreviews.length);
    
    const newEmail = {
        id: emails.length,
        sender: sampleSenders[senderIndex],
        subject: sampleSubjects[subjectIndex],
        preview: samplePreviews[previewIndex],
        time: 'Just now',
        unread: true,
        content: `Hello there,\n\nThis is a new email you've received at your temporary address. The subject is: "${sampleSubjects[subjectIndex]}".\n\n${samplePreviews[previewIndex]}\n\nBest regards,\nThe ${sampleSenders[senderIndex]} Team`
    };
    
    emails.unshift(newEmail);
    unreadEmails++;
    unreadCount.textContent = unreadEmails;
    renderEmailList();
    
    showNotification(`New email from ${newEmail.sender}`);
}

function startEmailSimulation() {
    // Initial simulation
    setTimeout(simulateIncomingEmail, 5000);
    
    // Periodic simulation
    setInterval(() => {
        if (Math.random() > 0.3) {
            simulateIncomingEmail();
        }
    }, 20000);
}

function setupEventListeners() {
    // Copy button functionality
    copyBtn.addEventListener('click', () => {
        navigator.clipboard.writeText(generatedEmail.textContent).then(() => {
            copyBtn.innerHTML = '<i class="fas fa-check"></i> Copied!';
            setTimeout(() => { copyBtn.innerHTML = '<i class="fas fa-copy"></i> Copy'; }, 2000);
        });
    });
    
    // Generate button functionality
    generateBtn.addEventListener('click', () => {
        const newEmail = generateRandomEmail();
        generatedEmail.textContent = newEmail;
        timeLeft = 600; // Reset to 10 minutes
        startTimer();
        
        generateBtn.innerHTML = '<i class="fas fa-check"></i> Generated!';
        setTimeout(() => {
            generateBtn.innerHTML = '<i class="fas fa-plus"></i> Generate New Address';
        }, 1500);
    });
    
    // Smooth scrolling
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            document.querySelector(this.getAttribute('href')).scrollIntoView({
                behavior: 'smooth'
            });
        });
    });
    
    // Tab switching
    tabs.forEach(tab => {
        tab.addEventListener('click', function() {
            tabs.forEach(t => t.classList.remove('active'));
            this.classList.add('active');
            
            const tabId = this.getAttribute('data-tab');
            document.querySelectorAll('.tab-content').forEach(content => {
                content.classList.remove('active');
            });
            document.getElementById(`${tabId}-content`).classList.add('active');
        });
    });
    
    // Back to inbox button
    backToInbox.addEventListener('click', () => {
        emailDetail.style.display = 'none';
        document.querySelector('.inbox-container').style.display = 'block';
    });
    
    // Refresh button
    refreshBtn.addEventListener('click', () => {
        refreshBtn.innerHTML = '<i class="fas fa-sync-alt fa-spin"></i> Refreshing';
        setTimeout(() => {
            refreshBtn.innerHTML = '<i class="fas fa-sync-alt"></i> Refresh';
            showNotification('Inbox refreshed');
        }, 1000);
    });
    
    // Delete button
    deleteBtn.addEventListener('click', () => {
        if (selectedEmails.length === 0) {
            showNotification('Select emails to delete');
            return;
        }
        
        emails = emails.filter(email => !selectedEmails.includes(email.id));
        selectedEmails = [];
        renderEmailList();
        showNotification(`${selectedEmails.length} emails deleted`);
    });
    
    // Search functionality
    searchInput.addEventListener('input', () => {
        const searchTerm = searchInput.value.toLowerCase();
        
        document.querySelectorAll('.email-item').forEach(item => {
            const sender = item.querySelector('.email-sender').textContent.toLowerCase();
            const subject = item.querySelector('.email-subject').textContent.toLowerCase();
            const preview = item.querySelector('.email-preview').textContent.toLowerCase();
            
            if (sender.includes(searchTerm) || subject.includes(searchTerm) || preview.includes(searchTerm)) {
                item.style.display = 'flex';
            } else {
                item.style.display = 'none';
            }
        });
    });
    
    // Theme toggle
    themeToggle.addEventListener('click', toggleTheme);
}
