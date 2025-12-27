import './style.css'

const app = document.querySelector('#app')
const navHome = document.querySelector('#nav-home')
const navSettings = document.querySelector('#nav-settings')

let notificationsEnabled = localStorage.getItem('notificationsEnabled') === 'true'
let lastSeenHash = null;
const BACKEND_URL = import.meta.env.PROD
  ? '/backend'
  : (import.meta.env.VITE_BACKEND_URL || 'http://127.0.0.1:8000/api');

// Routing
const routes = {
  '/': renderHome,
  '/settings': renderSettings
}

window.addEventListener('hashchange', router)
window.addEventListener('load', router)

function router() {
  const hash = location.hash.slice(1) || '/'
  const render = routes[hash] || renderHome

  // Update Nav
  if (hash === '/') {
    navHome.classList.add('active')
    navSettings.classList.remove('active')
  } else if (hash === '/settings') {
    navHome.classList.remove('active')
    navSettings.classList.add('active')
  }

  render()
}

// PWA Install Prompt
let deferredPrompt;
let installButton;

window.addEventListener('beforeinstallprompt', (e) => {
  // Prevent the mini-infobar from appearing on mobile
  e.preventDefault();
  // Stash the event so it can be triggered later
  deferredPrompt = e;
  // Show the install button
  if (installButton) {
    installButton.style.display = 'block';
  }
  console.log('beforeinstallprompt event fired');
});

window.addEventListener('appinstalled', () => {
  // Hide the install button after installation
  if (installButton) {
    installButton.style.display = 'none';
  }
  deferredPrompt = null;
  console.log('App installed successfully');
});

function handleInstallClick() {
  if (deferredPrompt) {
    // Show the install prompt
    deferredPrompt.prompt();
    // Wait for the user to respond to the prompt
    deferredPrompt.userChoice.then((choiceResult) => {
      if (choiceResult.outcome === 'accepted') {
        console.log('User accepted the install prompt');
      } else {
        console.log('User dismissed the install prompt');
      }
      deferredPrompt = null;
    });
  } else {
    // Fallback: Show manual install instructions
    const isChrome = /Chrome/.test(navigator.userAgent) && /Google Inc/.test(navigator.vendor);
    const isEdge = /Edg/.test(navigator.userAgent);

    let message = 'To install this app:\n\n';

    if (isChrome || isEdge) {
      message += '1. Click the ⋮ menu (top-right)\n';
      message += '2. Select "Install Arxiv AI Agent"\n';
      message += '3. Click "Install" in the popup';
    } else {
      message += 'Please use Chrome or Edge browser to install this app.';
    }

    alert(message);
  }
}

// Notification History Management
function getHistory() {
  try {
    return JSON.parse(localStorage.getItem('notificationHistory') || '[]');
  } catch (e) { return []; }
}

function saveHistory(history) {
  localStorage.setItem('notificationHistory', JSON.stringify(history));
}

// Polling interval
let pollInterval = null;

function startPolling(updateCallback) {
  if (pollInterval) clearInterval(pollInterval);
  updateCallback(); // Immediate run
  pollInterval = setInterval(updateCallback, 2000);
}

function stopPolling() {
  if (pollInterval) clearInterval(pollInterval);
}

// Shared Header Component
const getHeaderHTML = () => `
<div style="
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    width: 100%;
">

    <!-- Left: Logo -->
    <div style="flex: 1; display: flex; align-items: center;">
        <img src="/vite.webp" alt="Logo" style="
            width: 10vw;
            height: auto;
        ">
    </div>

    <!-- Center: Heading -->
    <div style="flex: 1; display: flex; justify-content: center;">
        <h1 style="
            margin: 0;
            font-size: 3vw;
            background: linear-gradient(to right, #fff, #94a3b8);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            white-space: nowrap;
        ">
            Be the sunflower that rises to seek its radiance
        </h1>
    </div>

    <!-- Right: Install Button -->
    <div style="flex: 1; display: flex; justify-content: flex-end;">
        <button 
            id="install-btn" 
            class="btn" 
            style="
                display: none; 
                padding: 10px 20px; 
                font-size: 0.9rem;
                width: auto;
                margin: 0;
                background: linear-gradient(135deg, var(--primary), #a78bfa);
            "
            onclick="handleInstallClick()"
        >
             Install
        </button>
    </div>

</div>


`;

async function renderHome() {
  app.innerHTML = `
    ${getHeaderHTML()}
    
    <div style="max-width: 900px; margin: 0 auto; width: 100%;">
        <div id="status-card" class="card">
             <div style="display:flex; align-items:center; gap:10px;">
                <div class="spinner" id="status-spinner"></div>
                <div>
                    <div style="font-size:0.8rem; text-transform:uppercase; letter-spacing:1px; color:var(--text-muted);">Current Status</div>
                    <div id="agent-status" style="font-size:1.2rem; font-weight:600; color:var(--primary);">Connecting...</div>
                </div>
             </div>
        </div>
    
        <div id="timeline-list">
            <!-- New notifications appear here -->
        </div>
    </div>
  `

  // Load existing history immediately
  renderTimeline(getHistory());

  // Initialize install button reference
  installButton = document.getElementById('install-btn');
  // Always show install button - it will provide instructions if PWA prompt isn't available
  if (installButton) {
    installButton.style.display = 'block';
  }

  startPolling(async () => {
    // If we left the page, stop polling
    if (!location.hash.includes('/') && location.hash !== '') {
      stopPolling();
      return;
    }

    try {
      const state = await fetchAgentState();
      updateHomeUI(state);
    } catch (e) {
      document.getElementById('agent-status').textContent = "Connecting... ";
      if (document.getElementById('status-spinner'))
        document.getElementById('status-spinner').style.borderTopColor = 'var(--primary)';
    }
  });
}

function renderTimeline(history) {
  const list = document.getElementById('timeline-list');
  if (!list) return;

  list.innerHTML = '';

  // Check if history is empty
  if (history.length === 0) {
    list.innerHTML = '<div style="text-align:center; color:var(--text-muted); padding:20px;">No research found yet. Waiting for Agent...</div>';
    return;
  }

  // Sort newest first
  const sorted = [...history]; // copy
  sorted.reverse();

  sorted.forEach(item => {
    const newCard = document.createElement('div');
    newCard.className = 'timeline-item';

    // Generate time display - use item.time if available, otherwise show a placeholder
    const timeDisplay = item.time || '12:00 PM';

    newCard.innerHTML = `
            <div class="date-header">
                ${item.date || 'Today'} • ${timeDisplay}
            </div>
            
            <div class="card collapsed-card" onclick="this.classList.toggle('expanded')">
                <div class="card-header">
                    <div class="ai-badge">✨ Insight</div>
                    <div style="font-weight:700; font-size:1.1rem; line-height:1.4;">${item.notification}</div>
                    <div class="expand-hint">Tap to expand</div>
                </div>
                
                <div class="card-body">
                    <div class="analogy-section">
                        <h3 style="color:#f59e0b; margin-top:0;">💡 The Simple Explanation</h3>
                        <p>${item.analogy}</p>
                    </div>
                    
                    <div class="source-section" style="margin-top:20px; padding-top:20px; border-top:1px solid var(--glass-border);">
                         <h4 style="color:var(--text-muted); font-size:0.9rem;">ORIGINAL RESEARCH</h4>
                         <div style="font-size:0.85rem; color:var(--text-muted); max-height:100px; overflow:hidden; margin-bottom:15px;">
                             ${item.news ? item.news.substring(0, 300) : ''}...
                         </div>
                         
                         <a href="${item.link}" target="_blank" class="btn full-read-btn" onclick="event.stopPropagation()">
                            📖 Full Read (PDF)
                         </a>
                    </div>
                </div>
            </div>
        `;
    list.appendChild(newCard);
  });
}

function updateHomeUI(state) {
  const statusEl = document.getElementById('agent-status');
  const spinner = document.getElementById('status-spinner');

  if (!statusEl) return;

  // Update Status
  statusEl.textContent = state.status;
  if (state.status === 'Sleeping' || state.status === 'Success' || state.status.includes('Cycle Complete') || state.status.includes('Limited')) {
    spinner.style.borderTopColor = '#10b981'; // Green for sleeping/done
    spinner.style.animation = 'none';

    // CHECK FOR NEW DATA
    if (state.notification && state.notification !== lastSeenHash) {
      // Double check it's not already in history (by simple string match on notification)
      const history = getHistory();
      const exists = history.some(h => h.notification === state.notification);

      if (!exists && state.notification !== "Standby...") {
        lastSeenHash = state.notification;
        // Add to history
        const newItem = {
          date: state.date,
          time: state.time || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), // Fallback if backend doesn't send time yet
          notification: state.notification,
          analogy: state.analogy,
          news: state.news,
          link: state.link
        };
        history.push(newItem);
        saveHistory(history);

        // Re-render
        renderTimeline(history);

        if (notificationsEnabled) {
          sendNotification("New Research!", state.notification);
        }
      }
    }

  } else {
    spinner.style.borderTopColor = 'var(--primary)';
    spinner.style.animation = 'spin 1s ease-in-out infinite';
  }
}

function renderSettings() {
  stopPolling();
  app.innerHTML = `
    ${getHeaderHTML()}
    
    <div style="max-width: 900px; margin: 0 auto; width: 100%;">
        <div class="card">
            <h2>Settings</h2>
          <div class="toggle-wrapper">
            <span>Enable AI Notifications</span>
            <label class="switch">
              <input type="checkbox" id="notif-toggle" ${notificationsEnabled ? 'checked' : ''}>
              <span class="slider"></span>
            </label>
          </div>
          <p style="font-size: 0.9rem; color: var(--text-muted); margin-top: 10px;">
            Get notified when the Agent finishes its research cycle.
          </p>
          
          <button id="req-perm-btn" class="btn" style="display: ${Notification.permission !== 'granted' ? 'block' : 'none'}">
            Request Permission
          </button>
        </div>
    
        <!-- UPDATE INTERVAL SETTING -->
        <div class="card">
            <h2>Research Frequency</h2>
            <p style="color:var(--text-muted); font-size:0.9rem;">How often should the agent look for new papers?</p>
            
            <div style="margin-top:20px;">
                <input type="range" id="interval-slider" min="1" max="60" value="5" style="width:100%;">
                <div style="display:flex; justify-content:space-between; margin-top:10px;">
                    <span style="font-weight:700; color:var(--primary);"><span id="interval-val">5</span> Minutes</span>
                </div>
            </div>
            
            <button id="save-interval-btn" class="btn" style="margin-top:15px;">Update Frequency</button>
        </div>
        
        <div class="card">
            <h2>Backend Status</h2>
            <p>Ensure <code>agent.py</code> is running on localhost:8000</p>
        </div>
        
        <div class="card" style="border-color: #ef4444;">
            <h2 style="color:#ef4444;">Danger Zone</h2>
            <button id="clear-history-btn" class="btn" style="background:#ef4444;">Clear All History</button>
        </div>
    </div>
  `

  // Notification Toggle Logic
  const toggle = document.querySelector('#notif-toggle')
  toggle.addEventListener('change', (e) => {
    notificationsEnabled = e.target.checked
    localStorage.setItem('notificationsEnabled', notificationsEnabled)

    if (notificationsEnabled && Notification.permission !== 'granted') {
      Notification.requestPermission()
    }
  })

  const btn = document.querySelector('#req-perm-btn')
  if (btn) {
    btn.addEventListener('click', () => {
      Notification.requestPermission().then(perm => {
        if (perm === 'granted') {
          btn.style.display = 'none'
          toggle.checked = true
          notificationsEnabled = true
          localStorage.setItem('notificationsEnabled', 'true')
        }
      })
    })
  }

  // Interval Slider Logic
  const slider = document.getElementById('interval-slider');
  const valDisplay = document.getElementById('interval-val');
  const saveBtn = document.getElementById('save-interval-btn');

  slider.addEventListener('input', (e) => {
    valDisplay.textContent = e.target.value;
  });

  saveBtn.addEventListener('click', async () => {
    const minutes = parseInt(slider.value);
    saveBtn.textContent = "Updating...";
    try {
      await fetch(`${BACKEND_URL}/config`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ interval_minutes: minutes })
      });
      saveBtn.textContent = "✅ Updated!";
      setTimeout(() => saveBtn.textContent = "Update Frequency", 2000);
    } catch (e) {
      saveBtn.textContent = "❌ Error";
      console.error(e);
    }
  });

  // Clear History
  document.getElementById('clear-history-btn').addEventListener('click', () => {
    if (confirm('Are you sure you want to delete all saved papers?')) {
      saveHistory([]);
      alert('History Cleared');
    }
  });
}

async function fetchAgentState() {
  try {
    const response = await fetch(`${BACKEND_URL}/latest`)
    if (!response.ok) throw new Error('Backend offline');
    return await response.json();
  } catch (error) {
    throw error;
  }
}

function sendNotification(title, body) {
  if (Notification.permission === 'granted') {
    new Notification(title, { body, icon: '/vite.webp' })
  }
}
