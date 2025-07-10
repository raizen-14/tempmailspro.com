// DOM Elements
const generatedEmail = document.getElementById('generated-email');
const copyBtn = document.getElementById('copy-btn');
const generateBtn = document.getElementById('generate-btn');
const timerElement = document.getElementById('timer');

// Timer variables
let timeLeft = 298; // 4 minutes 58 seconds
let timerInterval;

// Start the timer
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

// Generate random email
function generateRandomEmail() {
    const prefixes = ['ghost', 'stealth', 'phantom', 'shadow', 'ninja', 'secret', 'private', 'masked'];
    const domains = ['tempmailspro.com', 'issemail.org', 'disposable.me', 'privacybox.io'];
    const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    const randomId = Math.random().toString(36).substring(2, 6);
    const domain = domains[Math.floor(Math.random() * domains.length)];
    return `${prefix}${randomId}@${domain}`;
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    // Start the timer
    startTimer();
    
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
});

