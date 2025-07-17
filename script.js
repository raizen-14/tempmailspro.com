// 🌐 State variables
let currentAccount = null;
let currentToken = null;
let expirationTimer = null;

// DOM elements
const generatedEmail = document.getElementById("generated-email");
const generateBtn = document.getElementById("generate-btn");
const refreshBtn = document.getElementById("refresh-btn");
const emailList = document.getElementById("email-list");
const unreadCount = document.getElementById("unread-count");
const emailDetail = document.getElementById("email-detail");
const backToInbox = document.getElementById("back-to-inbox");
const deleteBtn = document.getElementById("delete-btn");
const timerElement = document.getElementById("timer");
const notification = document.getElementById("notification");

let emails = [];
let selectedEmails = [];
let timeLeft = 600; // fallback
const TIMER_KEY = "tempmail_timer";
const EMAIL_KEY = "tempmail_email";
const LIMIT_KEY = "tempmail_limit";
const LIMIT_WINDOW = 30 * 60 * 1000; // 30 minutes
const MAX_EMAILS = 3;

// 📨 Create account + fetch token
async function createTempAccount() {
  const username = Array.from(crypto.getRandomValues(new Uint8Array(6))).map((b) => b.toString(36).padStart(2, "0")).join("");
  const domainRes = await fetch("https://api.mail.tm/domains");
  const domains = await domainRes.json();
  const domain = domains["hydra:member"][0].domain;
  const email = `${username}@${domain}`;
  const password = `${Math.random().toString(36).substring(2, 10)}*Temp`;

  const accountRes = await fetch("https://api.mail.tm/accounts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ address: email, password }),
  });

  if (!accountRes.ok) {
    showNotification("⚠️ Failed to create temp account");
    return;
  }

  const tokenRes = await fetch("https://api.mail.tm/token", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ address: email, password }),
  });
  const tokenData = await tokenRes.json();

  currentAccount = email;
  currentToken = tokenData.token;
  localStorage.setItem(TIMER_KEY, Date.now());
  localStorage.setItem(EMAIL_KEY, email);

  generatedEmail.textContent = email;
  timeLeft = 600;
  startTimer();
  fetchInbox();
}

// ⏱️ Start expiration countdown
function startTimer() {
  clearInterval(expirationTimer);

  const storedTime = localStorage.getItem(TIMER_KEY);
  const startTime = storedTime ? parseInt(storedTime, 10) : Date.now();
  const elapsed = Math.floor((Date.now() - startTime) / 1000); // in seconds
  timeLeft = Math.max(600 - elapsed, 0); // max 10 mins

  expirationTimer = setInterval(() => {
    const min = String(Math.floor(timeLeft / 60)).padStart(2, "0");
    const sec = String(timeLeft % 60).padStart(2, "0");
    timerElement.innerHTML = `<i class="fas fa-hourglass-start"></i> Expires in: ${min}:${sec}`;
    timeLeft--;

    if (timeLeft < 0) {
      clearInterval(expirationTimer);
      emails = [];
      renderEmailList();
      timerElement.innerHTML = `<i class="fas fa-clock"></i> Mailbox expired.`;
      showNotification("⏳ Temporary mailbox expired");

      localStorage.removeItem(TIMER_KEY);
      localStorage.removeItem(EMAIL_KEY);

      generateBtn.disabled = false;
      generateBtn.classList.remove("disabled");
      generateBtn.innerHTML =
        '<i class="fas fa-plus"></i> Generate New Address';
    }
  }, 1000);
}

// 📬 Fetch inbox messages
async function fetchInbox() {
  if (!currentToken) return;
  const res = await fetch("https://api.mail.tm/messages", {
    headers: { Authorization: `Bearer ${currentToken}` },
  });
  const data = await res.json();
  emails = data["hydra:member"].map((msg) => ({
    id: msg.id,
    sender: msg.from?.address || "Unknown",
    subject: msg.subject || "(No Subject)",
    preview: msg.intro,
    time: new Date(msg.createdAt).toLocaleTimeString(),
    unread: !msg.seen,
    content: null,
  }));
  renderEmailList();
}

// 📥 View email detail
async function showEmailDetail(email) {
  if (!email.content) {
    const res = await fetch(`https://api.mail.tm/messages/${email.id}`, {
      headers: { Authorization: `Bearer ${currentToken}` },
    });
    const data = await res.json();
    email.content = data.text || data.html || "(No content)";
  }
  document.querySelector(".inbox-container").style.display = "none";
  emailDetail.style.display = "block";
  document.getElementById("detail-sender").textContent = email.sender;
  document.getElementById("detail-subject").textContent = email.subject;
  document.getElementById("detail-date").textContent =
    new Date().toLocaleString();
  document.getElementById("detail-body").innerHTML = email.content;
}

// 🧹 Render email list
function renderEmailList() {
  emailList.innerHTML = "";
  let unread = 0;
  emails.forEach((email) => {
    if (email.unread) unread++;
    const item = document.createElement("div");
    item.className = `email-item ${email.unread ? "unread" : ""}`;
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
  document.querySelectorAll(".email-item").forEach((item) => {
    item.addEventListener("click", (e) => {
      if (!e.target.classList.contains("email-checkbox-input")) {
        const id = item.dataset.id;
        const email = emails.find((e) => e.id === id);
        if (email.unread) email.unread = false;
        showEmailDetail(email);
        renderEmailList();
      }
    });
  });
  document.querySelectorAll(".email-checkbox-input").forEach((checkbox) => {
    checkbox.addEventListener("click", (e) => {
      e.stopPropagation();
      const id = checkbox.dataset.id;
      if (checkbox.checked) selectedEmails.push(id);
      else selectedEmails = selectedEmails.filter((i) => i !== id);
    });
  });
}

// ❌ Delete selected messages
async function deleteSelectedEmails() {
  if (!selectedEmails.length || !currentToken) return;
  for (let id of selectedEmails) {
    await fetch(`https://api.mail.tm/messages/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${currentToken}` },
    });
  }
  selectedEmails = [];
  fetchInbox();
  showNotification("🗑️ Selected emails deleted");
}

// 📢 Show message
function showNotification(message) {
  notification.textContent = message;
  notification.classList.add("show");
  setTimeout(() => notification.classList.remove("show"), 3000);
}

generateBtn.addEventListener("click", () => {
  const history = JSON.parse(localStorage.getItem(LIMIT_KEY) || "[]");
  const now = Date.now();

  // Remove entries older than 30 mins
  const recent = history.filter(t => now - t < LIMIT_WINDOW);

  // If limit reached, block generation
  if (recent.length >= MAX_EMAILS) {
    showNotification("🚫 Limit reached: Wait before generating more emails.");
    return;
  }

  // ✅ Allow generation
  recent.push(now);
  localStorage.setItem(LIMIT_KEY, JSON.stringify(recent));

  // 🔒 Lock the button
  generateBtn.disabled = true;
  generateBtn.classList.add("disabled");
  generateBtn.innerHTML = '<i class="fas fa-lock"></i> Locked for 10 min';

  // 👇 Call API
  createTempAccount();

  // Visual update
  setTimeout(() => {
    generateBtn.innerHTML = '<i class="fas fa-lock"></i> Locked';
  }, 1500);

  // Optional: unlock after 10 minutes
  setTimeout(() => {
    generateBtn.disabled = false;
    generateBtn.classList.remove("disabled");
    generateBtn.innerHTML = '<i class="fas fa-plus"></i> Generate New Address';
  }, 600_000); // 10 minutes
});


refreshBtn.addEventListener("click", () => {
  refreshBtn.innerHTML = '<i class="fas fa-sync-alt fa-spin"></i> Refreshing';
  fetchInbox().then(() => {
    refreshBtn.innerHTML = '<i class="fas fa-sync-alt"></i> Refresh';
    showNotification("🔁 Inbox refreshed");
  });
});

deleteBtn.addEventListener("click", deleteSelectedEmails);
backToInbox.addEventListener("click", () => {
  emailDetail.style.display = "none";
  document.querySelector(".inbox-container").style.display = "block";
});
// Copy-to-clipboard
const copyBtn = document.getElementById("copy-btn");
copyBtn.addEventListener("click", async () => {
  const emailText = generatedEmail.textContent.trim();
  try {
    await navigator.clipboard.writeText(emailText);
    showNotification("📋 Copied to clipboard!");
    copyBtn.innerHTML = '<i class="fas fa-check"></i> Copied';
    setTimeout(() => {
      copyBtn.innerHTML = '<i class="fas fa-copy"></i> Copy';
    }, 1500);
  } catch (err) {
    showNotification("⚠️ Failed to copy");
    console.error("Copy failed:", err);
  }
});
// Collapsible FAQ
document.querySelectorAll("#faq .faq-item h4").forEach((question) => {
  question.addEventListener("click", () => {
    question.parentElement.classList.toggle("open");
  });
});
const modal = document.getElementById("termsModal");
const btn = document.getElementById("openTerms");
const span = document.getElementById("closeTerms");

btn.onclick = function () {
  modal.style.display = "block";
};

span.onclick = function () {
  modal.style.display = "none";
};

window.onclick = function (event) {
  if (event.target == modal) {
    modal.style.display = "none";
  }
};

document.addEventListener("DOMContentLoaded", () => {
  // Email generation
  function randomString(len) {
    const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
    return Array.from({ length: len }, () =>
      chars.charAt((Math.random() * chars.length) | 0)
    ).join("");
  }

  // Modal handler factory
  function setupModal(openId, modalId, closeId) {
    const btn = document.getElementById(openId);
    const modal = document.getElementById(modalId);
    const closeBtn = document.getElementById(closeId);
    if (!btn || !modal || !closeBtn) return;
    btn.onclick = (e) => {
      e.preventDefault();
      modal.style.display = "block";
      document.body.style.overflow = "hidden";
    };
    closeBtn.onclick = () => {
      modal.style.display = "none";
      document.body.style.overflow = "";
    };
    window.addEventListener("click", (e) => {
      if (e.target === modal) {
        modal.style.display = "none";
        document.body.style.overflow = "";
      }
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        modal.style.display = "none";
        document.body.style.overflow = "";
      }
    });
  }

  ["Terms", "Privacy", "Api", "Contact"].forEach((name) =>
    setupModal("open" + name, name.toLowerCase() + "Modal", "close" + name)
  );
});
const storedStart = localStorage.getItem(TIMER_KEY);
const storedEmail = localStorage.getItem(EMAIL_KEY);

if (storedStart && storedEmail) {
  generatedEmail.textContent = storedEmail;
  generateBtn.disabled = true;
  generateBtn.classList.add("disabled");
  generateBtn.innerHTML = '<i class="fas fa-lock"></i> Locked';
  startTimer();
}
