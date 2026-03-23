import { initializeApp } from 'https://www.gstatic.com/firebasejs/12.11.0/firebase-app.js';
import { getAnalytics } from 'https://www.gstatic.com/firebasejs/12.11.0/firebase-analytics.js';
import {
  getMessaging,
  getToken,
  onMessage,
} from 'https://www.gstatic.com/firebasejs/12.11.0/firebase-messaging.js';

const firebaseConfig = {
  apiKey: 'AIzaSyCWXFey7Jhkf3LGmdFPQEnRFoV4Oh_vpx0',
  authDomain: 'snapclone-b9f34.firebaseapp.com',
  projectId: 'snapclone-b9f34',
  storageBucket: 'snapclone-b9f34.firebasestorage.app',
  messagingSenderId: '887164526150',
  appId: '1:887164526150:web:6f26f88b9ce67075b4f447',
  measurementId: 'G-XSP458LTQJ',
};

const nexusAiConfig = {
  endpoint: 'https://api.groq.com/openai/v1/chat/completions',
  model: 'llama-3.3-70b-versatile',
  apiKey: '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',
};

const vapidKey = 'REPLACE_WITH_FIREBASE_WEB_PUSH_CERTIFICATE_KEY';

const app = initializeApp(firebaseConfig);
getAnalytics(app);
let messaging;
try {
  messaging = getMessaging(app);
} catch (error) {
  console.warn('Firebase Messaging unavailable in this browser context.', error);
}

const stories = [
  { name: 'Your Story', text: 'Add moments from today', type: 'Private story' },
  { name: 'Alex Morgan', text: 'Sunrise run and coffee drop', type: 'Friends story' },
  { name: 'Campus Buzz', text: 'Open mic clips and weekend plans', type: 'Community story' },
  { name: 'Jamie Chen', text: 'Studio setup before going live', type: 'Friends story' },
];

const discoverCards = [
  { title: 'Style Signals', subtitle: 'Fashion recaps in immersive cards', image: 'linear-gradient(135deg,#ff7b1d,#ffd166)' },
  { title: 'Pulse Daily', subtitle: 'Fast culture updates for your crew', image: 'linear-gradient(135deg,#53c3ff,#4361ee)' },
  { title: 'Game Grid', subtitle: 'Esports clips and patch notes', image: 'linear-gradient(135deg,#8338ec,#3a86ff)' },
  { title: 'Travel Now', subtitle: 'Destination diaries and hotel finds', image: 'linear-gradient(135deg,#06d6a0,#118ab2)' },
];

const chats = [
  {
    id: 1,
    name: 'Alex Morgan',
    meta: '🔥 187 streak • Active now',
    messages: [
      { text: 'Can you send the concert snap?', sender: 'them', time: '09:10' },
      { text: 'On it — adding it to our private story too.', sender: 'self', time: '09:12' },
    ],
  },
  {
    id: 2,
    name: 'Jamie Chen',
    meta: '🔥 94 streak • Typing…',
    messages: [
      { text: 'Voice call after class?', sender: 'them', time: '08:45' },
      { text: 'Yes, and I will bring story ideas.', sender: 'self', time: '08:46' },
    ],
  },
  {
    id: 3,
    name: 'Taylor Brooks',
    meta: 'Best friend • Opened 2m ago',
    messages: [{ text: 'That blue-orange theme looks clean.', sender: 'them', time: '07:58' }],
  },
];

let activeChatId = chats[0].id;
let snapMode = 'photo';
let snapCounter = 0;
let storyCounter = 0;

const navButtons = document.querySelectorAll('.nav-btn');
const panels = document.querySelectorAll('.panel');
const themeButtons = document.querySelectorAll('.theme-btn');
const storiesRail = document.getElementById('storiesRail');
const storyViewer = document.getElementById('storyViewer');
const chatList = document.getElementById('chatList');
const messagesContainer = document.getElementById('messagesContainer');
const discoverGrid = document.getElementById('discoverGrid');
const cameraFeed = document.getElementById('cameraFeed');
const captureModeLabel = document.getElementById('captureMode');
const snapCount = document.getElementById('snapCount');
const storyCount = document.getElementById('storyCount');
const aiMessages = document.getElementById('aiMessages');

function setActivePanel(targetId) {
  navButtons.forEach((button) => button.classList.toggle('active', button.dataset.target === targetId));
  panels.forEach((panel) => panel.classList.toggle('active-panel', panel.id === targetId));
}

navButtons.forEach((button) => button.addEventListener('click', () => setActivePanel(button.dataset.target)));

themeButtons.forEach((button) => {
  button.addEventListener('click', () => {
    document.body.dataset.theme = button.dataset.theme;
    themeButtons.forEach((item) => item.classList.toggle('active', item === button));
  });
});

function renderStories() {
  storiesRail.innerHTML = '';
  stories.forEach((story, index) => {
    const card = document.getElementById('storyCardTemplate').content.firstElementChild.cloneNode(true);
    card.querySelector('h4').textContent = story.name;
    card.querySelector('p').textContent = `${story.type} • ${story.text}`;
    card.addEventListener('click', () => {
      storyViewer.innerHTML = `
        <h4>${story.name}</h4>
        <p style="margin-top:8px; color: var(--muted)">${story.type}</p>
        <p style="margin-top:16px">${story.text}</p>
        <p style="margin-top:16px">Viewer ${(index + 1).toString().padStart(2, '0')} / ${stories.length.toString().padStart(2, '0')}</p>
      `;
    });
    storiesRail.appendChild(card);
  });
  if (stories[0]) {
    storyViewer.innerHTML = `<h4>${stories[0].name}</h4><p style="margin-top:8px; color: var(--muted)">${stories[0].type}</p><p style="margin-top:16px">${stories[0].text}</p>`;
  }
}

function renderDiscover() {
  discoverGrid.innerHTML = discoverCards
    .map(
      (card) => `
      <article class="discover-card" style="background-image:${card.image}">
        <h4>${card.title}</h4>
        <p>${card.subtitle}</p>
      </article>`
    )
    .join('');
}

function renderChatList() {
  chatList.innerHTML = '';
  chats.forEach((chat) => {
    const item = document.createElement('button');
    item.className = `chat-card ${chat.id === activeChatId ? 'active' : ''}`;
    item.innerHTML = `<strong>${chat.name}</strong><p>${chat.meta}</p>`;
    item.addEventListener('click', () => {
      activeChatId = chat.id;
      renderChatList();
      renderMessages();
    });
    chatList.appendChild(item);
  });
}

function renderMessages() {
  const activeChat = chats.find((chat) => chat.id === activeChatId);
  document.getElementById('threadName').textContent = activeChat.name;
  document.getElementById('threadMeta').textContent = activeChat.meta;
  messagesContainer.innerHTML = activeChat.messages
    .map(
      (message) => `
        <div class="message ${message.sender === 'self' ? 'self' : ''}">
          ${message.text}
          <span class="meta">${message.time}</span>
        </div>`
    )
    .join('');
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

function addMessage(container, text, sender = 'self') {
  const node = document.createElement('div');
  node.className = `message ${sender === 'self' ? 'self' : ''}`;
  node.innerHTML = `${text}<span class="meta">${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>`;
  container.appendChild(node);
  container.scrollTop = container.scrollHeight;
}

document.getElementById('sendMessageBtn').addEventListener('click', () => {
  const input = document.getElementById('chatInput');
  if (!input.value.trim()) return;
  const activeChat = chats.find((chat) => chat.id === activeChatId);
  activeChat.messages.push({ text: input.value.trim(), sender: 'self', time: 'Now' });
  renderMessages();
  input.value = '';
});

document.getElementById('toggleModeBtn').addEventListener('click', () => {
  snapMode = snapMode === 'photo' ? 'video' : 'photo';
  captureModeLabel.textContent = snapMode === 'photo' ? 'Photo mode' : 'Video mode';
  document.getElementById('toggleModeBtn').textContent = snapMode === 'photo' ? 'Switch to Video' : 'Switch to Photo';
});

document.getElementById('captureBtn').addEventListener('click', () => {
  snapCounter += 1;
  snapCount.textContent = String(snapCounter);
  const caption = document.getElementById('snapCaption').value.trim() || 'Fresh snap captured.';
  storyViewer.innerHTML = `<h4>Preview ready</h4><p style="margin-top:10px">${snapMode.toUpperCase()} snap captured.</p><p style="margin-top:10px">Caption: ${caption}</p>`;
});

document.getElementById('sendSnapBtn').addEventListener('click', () => {
  const recipient = document.getElementById('recipientSelect').value;
  const caption = document.getElementById('snapCaption').value.trim() || 'No caption';
  snapCounter += 1;
  snapCount.textContent = String(snapCounter);
  const activeChat = chats[0];
  activeChat.messages.push({ text: `📸 Snap sent to ${recipient}: ${caption}`, sender: 'self', time: 'Now' });
  renderMessages();
  triggerLocalNotification('Snap sent', `Your ${snapMode} snap was delivered to ${recipient}.`);
});

document.getElementById('addStoryBtn').addEventListener('click', () => {
  const caption = document.getElementById('snapCaption').value.trim() || 'New story update from Nexus User';
  stories.unshift({ name: 'Your Story', text: caption, type: 'My story' });
  storyCounter += 1;
  storyCount.textContent = String(storyCounter);
  renderStories();
});

async function startCamera() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
    cameraFeed.srcObject = stream;
  } catch (error) {
    console.warn('Camera access was denied or unavailable.', error);
    cameraFeed.poster = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" width="800" height="600">
        <rect width="100%" height="100%" fill="#081226"/>
        <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#ffffff" font-size="36" font-family="Arial">Camera preview unavailable</text>
      </svg>`);
  }
}

function triggerLocalNotification(title, body) {
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification(title, { body, icon: 'https://cdn-icons-png.flaticon.com/512/2111/2111432.png' });
  }
}

async function setupNotifications() {
  if (!('Notification' in window)) {
    alert('This browser does not support notifications.');
    return;
  }

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') {
    alert('Notification permission was not granted.');
    return;
  }

  triggerLocalNotification('Notifications enabled', 'SnapClone Nexus can now send alerts.');

  if (messaging && vapidKey !== 'REPLACE_WITH_FIREBASE_WEB_PUSH_CERTIFICATE_KEY') {
    try {
      const token = await getToken(messaging, { vapidKey });
      console.log('Firebase messaging token:', token);
    } catch (error) {
      console.warn('Could not fetch Firebase Cloud Messaging token.', error);
    }
  } else {
    console.info('Add your Firebase Web Push certificate key in app.js to receive FCM tokens.');
  }
}

document.getElementById('notifyBtn').addEventListener('click', setupNotifications);
document.getElementById('demoPushBtn').addEventListener('click', () =>
  triggerLocalNotification('Story reply', 'Alex reacted ❤️ to your latest story.')
);

if (messaging) {
  onMessage(messaging, (payload) => {
    const title = payload.notification?.title || 'SnapClone Nexus';
    const body = payload.notification?.body || 'You received a new update.';
    triggerLocalNotification(title, body);
  });
}

function seedAiMessages() {
  addMessage(aiMessages, 'Hey, I am Nexus AI. I can help with replies, captions, and planning your next snap.', 'them');
}

async function askNexus(prompt) {
  const response = await fetch(nexusAiConfig.endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${nexusAiConfig.apiKey}`,
    },
    body: JSON.stringify({
      model: nexusAiConfig.model,
      temperature: 0.8,
      messages: [
        {
          role: 'system',
          content:
            'You are Nexus AI, a stylish and helpful in-app assistant for a snap-based social app. Never mention backend vendors or model providers. Keep replies concise, social, and upbeat.',
        },
        { role: 'user', content: prompt },
      ],
    }),
  });

  if (!response.ok) {
    throw new Error(`Nexus AI request failed with status ${response.status}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content?.trim() || 'Nexus AI could not generate a response just now.';
}

document.getElementById('sendAiBtn').addEventListener('click', async () => {
  const input = document.getElementById('aiInput');
  const prompt = input.value.trim();
  if (!prompt) return;

  addMessage(aiMessages, prompt, 'self');
  input.value = '';
  addMessage(aiMessages, 'Thinking through your vibe...', 'them');

  try {
    const reply = await askNexus(prompt);
    aiMessages.lastElementChild.remove();
    addMessage(aiMessages, reply, 'them');
  } catch (error) {
    aiMessages.lastElementChild.remove();
    addMessage(
      aiMessages,
      'Nexus AI is temporarily unavailable. Double-check the API key, browser CORS policy, or provider quota before retrying.',
      'them'
    );
    console.error(error);
  }
});

renderStories();
renderDiscover();
renderChatList();
renderMessages();
seedAiMessages();
startCamera();
