const CONFIG = window.CONFIG || {
    BIN_ID: '6a5222dbda38895dfe4ef18e',
    MASTER_KEY: '$2a$10$xpnzNbyjOgRS6s..YVAMhOqwuj/FOPnU15M2J9uSwHBsRJAygi1Lu',
    OWNERS: ['vaultnet', 'vvnters'],
    DEVS: ['vaultnet', 'vvnters'],
    ADMINS: ['vaultnet'],
    MODS: ['vaultnet'],
    STAFF: ['vaultnet', 'vvnters'],
    DEV_PIN: '2356-23543-13451-78901-23456',
    SYNC_INTERVAL: 5000
};

let state = {
    currentUser: null,
    currentChatPartner: null,
    localCache: { users: [], chats: {}, messages: {} },
    isMobile: window.innerWidth < 768,
    syncInterval: null,
    settings: {
        e2ee: true,
        twofa: false,
        privacy: false,
        devMode: false,
        autoLock: 'never',
        sessionTimeout: 'never',
        messageHistory: 'forever',
        messageDelivery: 'e2ee',
        theme: 'dark'
    },
    loadingComplete: false,
    deviceType: 'pc',
    typingTimeout: null,
    isTyping: false
};

const DOM = {
    loadingOverlay: document.getElementById('loadingOverlay'),
    loaderFill: document.getElementById('loaderFill'),
    deviceScreen: document.getElementById('deviceScreen'),
    authScreen: document.getElementById('authScreen'),
    messenger: document.getElementById('messenger'),
    authError: document.getElementById('authError'),
    regError: document.getElementById('regError'),
    loginForm: document.getElementById('loginForm'),
    registerForm: document.getElementById('registerForm'),
    loginUsername: document.getElementById('loginUsername'),
    loginPassword: document.getElementById('loginPassword'),
    regUsername: document.getElementById('regUsername'),
    regDisplayName: document.getElementById('regDisplayName'),
    regPassword: document.getElementById('regPassword'),
    sidebarUsername: document.getElementById('sidebarUsername'),
    searchInput: document.getElementById('searchInput'),
    searchResults: document.getElementById('searchResults'),
    chatList: document.getElementById('chatList'),
    chatArea: document.getElementById('chatArea'),
    chatPlaceholder: document.getElementById('chatPlaceholder'),
    chatActive: document.getElementById('chatActive'),
    chatHeader: document.getElementById('chatHeader'),
    chatPartnerName: document.getElementById('chatPartnerName'),
    chatPartnerStatus: document.getElementById('chatPartnerStatus'),
    chatMessages: document.getElementById('chatMessages'),
    chatInputBar: document.getElementById('chatInputBar'),
    messageInput: document.getElementById('messageInput'),
    sendBtn: document.getElementById('sendBtn'),
    backBtn: document.getElementById('backBtn'),
    profileBtn: document.getElementById('profileBtn'),
    settingsBtn: document.getElementById('settingsBtn'),
    syncDot: document.getElementById('syncDot'),
    syncStatus: document.getElementById('syncStatus'),
    manualSyncBtn: document.getElementById('manualSyncBtn'),
    profileModal: document.getElementById('profileModal'),
    profileAvatar: document.getElementById('profileAvatar'),
    profileDisplayName: document.getElementById('profileDisplayName'),
    profileUsername: document.getElementById('profileUsername'),
    profileBio: document.getElementById('profileBio'),
    profileJoined: document.getElementById('profileJoined'),
    profileAge: document.getElementById('profileAge'),
    profileTags: document.getElementById('profileTags'),
    profilePassword: document.getElementById('profilePassword'),
    profileUserID: document.getElementById('profileUserID'),
    modalClose: document.getElementById('modalClose'),
    settingsModal: document.getElementById('settingsModal'),
    settingsClose: document.getElementById('settingsClose'),
    settingsAvatar: document.getElementById('settingsAvatar'),
    settingsDisplayName: document.getElementById('settingsDisplayName'),
    settingsUsername: document.getElementById('settingsUsername'),
    settingsPassword: document.getElementById('settingsPassword'),
    settingsBio: document.getElementById('settingsBio'),
    avatarUpload: document.getElementById('avatarUpload'),
    saveSettings: document.getElementById('saveSettings'),
    e2eeToggle: document.getElementById('e2eeToggle'),
    twofaToggle: document.getElementById('twofaToggle'),
    privacyToggle: document.getElementById('privacyToggle'),
    devToggle: document.getElementById('devToggle'),
    e2eeStatus: document.getElementById('e2eeStatus'),
    twofaStatus: document.getElementById('twofaStatus'),
    privacyStatus: document.getElementById('privacyStatus'),
    devStatus: document.getElementById('devStatus'),
    chatAvatar: document.getElementById('chatAvatar'),
    chatHeaderInfo: document.getElementById('chatHeaderInfo'),
    chatDropdownBtn: document.getElementById('chatDropdownBtn'),
    dropdownMenu: document.getElementById('dropdownMenu'),
    autoDetectBtn: document.getElementById('autoDetectBtn'),
    deviceIndicator: document.getElementById('deviceIndicator'),
    autoLockTimer: document.getElementById('autoLockTimer'),
    sessionTimeout: document.getElementById('sessionTimeout'),
    messageHistory: document.getElementById('messageHistory'),
    messageDelivery: document.getElementById('messageDelivery'),
    primaryColor: document.getElementById('primaryColor'),
    secondaryColor: document.getElementById('secondaryColor'),
    textColor: document.getElementById('textColor'),
    accentColor: document.getElementById('accentColor'),
    applyCustomTheme: document.getElementById('applyCustomTheme'),
    clipBtn: document.getElementById('clipBtn'),
    micBtn: document.getElementById('micBtn'),
    fileModal: document.getElementById('fileModal'),
    fileModalClose: document.getElementById('fileModalClose'),
    fileSelectBtn: document.getElementById('fileSelectBtn'),
    fileInput: document.getElementById('fileInput'),
    filePreviewContainer: document.getElementById('filePreviewContainer'),
    fileClearBtn: document.getElementById('fileClearBtn'),
    fileCaption: document.getElementById('fileCaption'),
    fileSendBtn: document.getElementById('fileSendBtn'),
    selectBtn: document.getElementById('selectBtn'),
    userSettingsBtn: document.getElementById('userSettingsBtn'),
    chatSettingsBtn: document.getElementById('chatSettingsBtn'),
    selectionToolbar: document.getElementById('selectionToolbar'),
    selectedCount: document.getElementById('selectedCount'),
    deleteSelectedBtn: document.getElementById('deleteSelectedBtn'),
    pinSelectedBtn: document.getElementById('pinSelectedBtn'),
    cancelSelectionBtn: document.getElementById('cancelSelectionBtn'),
    pinnedDock: document.getElementById('pinnedDock'),
    pinnedMessagePreview: document.getElementById('pinnedMessagePreview'),
    unpinBtn: document.getElementById('unpinBtn'),
    deleteModal: document.getElementById('deleteModal'),
    deleteModalClose: document.getElementById('deleteModalClose'),
    deleteForMeBtn: document.getElementById('deleteForMeBtn'),
    deleteForEveryoneBtn: document.getElementById('deleteForEveryoneBtn'),
    userSettingsModal: document.getElementById('userSettingsModal'),
    userSettingsClose: document.getElementById('userSettingsClose'),
    renameContactBtn: document.getElementById('renameContactBtn'),
    deleteContactBtn: document.getElementById('deleteContactBtn'),
    blockUserBtn: document.getElementById('blockUserBtn'),
    unblockUserBtn: document.getElementById('unblockUserBtn'),
    pinContactBtn: document.getElementById('pinContactBtn'),
    chatSettingsModal: document.getElementById('chatSettingsModal'),
    chatSettingsClose: document.getElementById('chatSettingsClose'),
    bgDefault: document.getElementById('bgDefault'),
    bgCustom: document.getElementById('bgCustom'),
    bgUpload: document.getElementById('bgUpload'),
    createNoteBtn: document.getElementById('createNoteBtn'),
    generalSettingsBtn: document.getElementById('generalSettingsBtn'),
    generalSettingsClose: document.getElementById('generalSettingsClose'),
    generalSettingsModal: document.getElementById('generalSettingsModal'),
    logoutBtn: document.getElementById('logoutBtn'),
    deviceSwitchBtn: document.getElementById('deviceSwitchBtn')
};

let selectionMode = false;
let selectedMessages = new Set();
let pinnedMessages = {};
let contactCustomNames = {};
let blockedUsers = [];
let chatSettings = {
    bubbleStyle: 'rounded',
    background: 'default',
    bgImage: null,
    chatTheme: '',
    bubbleColor: '#36454F',
    fontSize: 'medium',
    fontFamily: 'Inter',
    chatSpacing: 'comfortable',
    timestampFormat: '12h',
    readReceipts: true,
    messageAnimation: 'slide',
    chatHeaderStyle: 'modern'
};
let pendingFiles = [];
let autoLockTimeout = null;
let lastActivity = Date.now();
let isRecording = false;
let mediaRecorder = null;
let audioChunks = [];
let replyToMessage = null;

function formatTime(ts) {
    const d = new Date(ts);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function formatDate(ts) {
    const d = new Date(ts);
    return d.toLocaleDateString([], { year: 'numeric', month: 'short', day: 'numeric' });
}

function getAge(ts) {
    const days = Math.floor((Date.now() - ts) / (1000 * 60 * 60 * 24));
    if (days < 1) return 'Today';
    if (days === 1) return '1 day';
    return days + ' days';
}

function getUserTags(username) {
    const tags = [];
    if (CONFIG.OWNERS && CONFIG.OWNERS.includes(username.toLowerCase())) tags.push({ label: 'OWNER', class: 'tag-owner' });
    if (CONFIG.DEVS && CONFIG.DEVS.includes(username.toLowerCase())) tags.push({ label: 'DEV', class: 'tag-dev' });
    if (CONFIG.ADMINS && CONFIG.ADMINS.includes(username.toLowerCase())) tags.push({ label: 'ADMIN', class: 'tag-admin' });
    if (CONFIG.MODS && CONFIG.MODS.includes(username.toLowerCase())) tags.push({ label: 'MOD', class: 'tag-mod' });
    if (CONFIG.STAFF && CONFIG.STAFF.includes(username.toLowerCase())) tags.push({ label: 'STAFF', class: 'tag-staff' });
    if (tags.length === 0) {
        const user = getUserByUsername(username);
        if (user && user.created) {
            const age = Date.now() - user.created;
            if (age > 30 * 24 * 60 * 60 * 1000) {
                tags.push({ label: 'MEMBER', class: 'tag-member' });
            } else {
                tags.push({ label: 'GUEST', class: 'tag-guest' });
            }
        } else {
            tags.push({ label: 'MEMBER', class: 'tag-member' });
        }
    }
    return tags;
}

function getUserByUsername(username) {
    return state.localCache.users.find(u => u.username === username);
}

function getChatKey(u1, u2) {
    return [u1, u2].sort().join('_');
}

function getDisplayName(username) {
    if (contactCustomNames[username]) return contactCustomNames[username];
    const user = getUserByUsername(username);
    return user ? user.displayName || username : username;
}

function sendNotification(username, message, time) {
    if (!('Notification' in window)) return;
    if (Notification.permission === 'granted') {
        new Notification('VVN - New Message', {
            body: username + ': ' + message + ' at ' + time,
            icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">💬</text></svg>'
        });
    } else if (Notification.permission !== 'denied') {
        Notification.requestPermission();
    }
}

function updateLoading(progress) {
    const p = Math.min(progress, 100);
    if (DOM.loaderFill) {
        DOM.loaderFill.style.width = p + '%';
    }
    if (p >= 100 && !state.loadingComplete) {
        state.loadingComplete = true;
        setTimeout(() => {
            if (DOM.loadingOverlay) {
                DOM.loadingOverlay.classList.add('hidden');
            }
        }, 300);
    }
}

function setStatus(text, color) {
    if (DOM.syncStatus) {
        DOM.syncStatus.textContent = text;
    }
    if (DOM.syncDot) {
        DOM.syncDot.className = 'status-dot ' + color;
    }
}

async function fetchFromBin() {
    try {
        setStatus('Fetching...', 'yellow');
        const resp = await fetch('https://api.jsonbin.io/v3/b/' + CONFIG.BIN_ID, {
            headers: {
                'X-Master-Key': CONFIG.MASTER_KEY,
                'X-Bin-Meta': 'false'
            }
        });
        if (!resp.ok) {
            console.warn('HTTP Error:', resp.status);
            setStatus('Using cache', 'yellow');
            return null;
        }
        const data = await resp.json();
        setStatus('Connected', 'green');
        return data;
    } catch (e) {
        console.warn('Fetch error, using cache:', e.message);
        setStatus('Offline mode', 'yellow');
        return null;
    }
}

async function updateBin(data) {
    try {
        setStatus('Saving...', 'yellow');
        const resp = await fetch('https://api.jsonbin.io/v3/b/' + CONFIG.BIN_ID, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'X-Master-Key': CONFIG.MASTER_KEY,
                'X-Bin-Meta': 'false'
            },
            body: JSON.stringify(data)
        });
        if (!resp.ok) {
            console.warn('Save error:', resp.status);
            setStatus('Save failed', 'red');
            return false;
        }
        setStatus('Saved', 'green');
        return true;
    } catch (e) {
        console.warn('Save error:', e.message);
        setStatus('Offline', 'yellow');
        return false;
    }
}

async function syncWithRemote() {
    console.log('🔄 Syncing...');
    setStatus('Syncing...', 'yellow');
    const remote = await fetchFromBin();
    if (remote) {
        const remoteUsers = remote.users || [];
        const remoteChats = remote.chats || {};
        const remoteMessages = remote.messages || {};
        const localMessages = state.localCache.messages || {};
        let hasNewMessages = false;
        for (const [key, msgs] of Object.entries(remoteMessages)) {
            if (!localMessages[key]) {
                localMessages[key] = msgs;
                hasNewMessages = true;
            } else if (msgs.length > localMessages[key].length) {
                const newMsgs = msgs.slice(localMessages[key].length);
                for (const msg of newMsgs) {
                    if (msg.sender !== state.currentUser?.username) {
                        hasNewMessages = true;
                        const partner = key.split('_').find(u => u !== state.currentUser?.username);
                        if (partner && state.currentUser) {
                            sendNotification(partner, msg.text || '📎 File', formatTime(msg.timestamp));
                        }
                    }
                }
                localMessages[key] = msgs;
            }
        }
        const localUsers = state.localCache.users || [];
        const mergedUsers = [...localUsers];
        for (const rUser of remoteUsers) {
            if (!mergedUsers.find(u => u.username === rUser.username)) {
                mergedUsers.push(rUser);
            }
        }
        state.localCache.users = mergedUsers;
        state.localCache.chats = { ...remoteChats, ...state.localCache.chats };
        state.localCache.messages = localMessages;
        localStorage.setItem('vvn_cache', JSON.stringify(state.localCache));
        setStatus('Synced: ' + state.localCache.users.length + ' users', 'green');
        if (state.currentUser) {
            renderMessenger();
            if (state.currentChatPartner) {
                openChat(state.currentChatPartner);
            }
        }
        return true;
    } else {
        setStatus('Offline mode', 'yellow');
        return true;
    }
}

async function pushToRemote() {
    setStatus('Pushing...', 'yellow');
    const success = await updateBin(state.localCache);
    if (success) setStatus('Pushed to cloud', 'green');
    return success;
}

function showDeviceSelection() {
    if (DOM.deviceScreen) DOM.deviceScreen.style.display = 'flex';
    if (DOM.authScreen) DOM.authScreen.style.display = 'none';
    if (DOM.messenger) DOM.messenger.style.display = 'none';
}

function selectDevice(deviceType) {
    state.deviceType = deviceType;
    localStorage.setItem('vvn_device', deviceType);
    if (typeof applyDeviceLayout === 'function') {
        applyDeviceLayout(deviceType);
    }
    if (DOM.deviceScreen) DOM.deviceScreen.style.display = 'none';
    if (DOM.authScreen) DOM.authScreen.style.display = 'flex';
}

function toggleDropdown() {
    if (!DOM.dropdownMenu) return;
    if (DOM.dropdownMenu.style.display === 'block') {
        DOM.dropdownMenu.style.display = 'none';
    } else {
        DOM.dropdownMenu.style.display = 'block';
        const btn = DOM.chatDropdownBtn;
        if (btn) {
            const rect = btn.getBoundingClientRect();
            DOM.dropdownMenu.style.top = (rect.bottom + 8) + 'px';
            DOM.dropdownMenu.style.right = '12px';
        }
    }
}

function closeDropdown() {
    if (DOM.dropdownMenu) DOM.dropdownMenu.style.display = 'none';
}

function handleDropdownAction(action) {
    switch(action) {
        case 'select': toggleSelectionMode(); break;
        case 'user-settings': openUserSettings(); break;
        case 'chat-settings': openChatSettings(); break;
        case 'profile': if (state.currentChatPartner) { showProfile(state.currentChatPartner); } break;
        case 'device': logout(); showDeviceSelection(); break;
        case 'logout': logout(); break;
        case 'reaction': break;
        case 'schedule': scheduleMessage(); break;
        case 'quickreply': showQuickReplies(); break;
        case 'quickreply-add': addQuickReply(); break;
        case 'stats': showMessageStats(); break;
        case 'rps': playRPS(); break;
        case 'rainbow': toggleRainbowName(); break;
        case 'chattheme': changeChatTheme(); break;
        case 'wallpaper': setChatWallpaper(); break;
        case 'bubblecolor': setBubbleColor(); break;
        case 'fontsize': showFontSizeOptions(); break;
        case 'fontfamily': showFontFamilyOptions(); break;
        case 'chattimestamp': changeTimestampFormat(); break;
        case 'readreceipts': toggleReadReceipts(); break;
        case 'animation': showAnimationOptions(); break;
        case 'search': searchMessages(); break;
        case 'forward': forwardMessages(); break;
        case 'reply': if (state.currentChatPartner) { DOM.messageInput.focus(); } break;
        case 'edit': break;
        case 'translate': break;
        case 'voicespeed': showVoiceSpeedOptions(); break;
        case 'drafts': loadDraft(); break;
        case 'sticker': openStickerPack(); break;
        case 'gif': openGIFPicker(); break;
        case 'game': showGameOptions(); break;
        case 'poll': createPoll(); break;
        case 'status': setCustomStatus(); break;
        case 'qr': generateQRCode(); break;
        case 'badges': showBadges(); break;
        case 'generalsettings': openGeneralSettings(); break;
    }
}

function addReaction(messageId, reaction) {
    const chatKey = getChatKey(state.currentUser.username, state.currentChatPartner);
    const messages = state.localCache.messages[chatKey] || [];
    const msgIndex = messages.findIndex((m, i) => m.timestamp + '-' + i === messageId);
    if (msgIndex === -1) return;
    if (!messages[msgIndex].reactions) messages[msgIndex].reactions = [];
    const existing = messages[msgIndex].reactions.find(r => r.user === state.currentUser.username);
    if (existing) {
        existing.emoji = reaction;
    } else {
        messages[msgIndex].reactions.push({ user: state.currentUser.username, emoji: reaction });
    }
    state.localCache.messages[chatKey] = messages;
    localStorage.setItem('vvn_cache', JSON.stringify(state.localCache));
    pushToRemote();
    renderMessages(messages);
}

function scheduleMessage() {
    const text = prompt('Enter your message:');
    if (!text) return;
    const time = prompt('Enter time (HH:MM in 24h format):');
    if (!time) return;
    const parts = time.split(':');
    const hours = parseInt(parts[0]);
    const minutes = parseInt(parts[1]);
    if (isNaN(hours) || isNaN(minutes) || hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
        alert('Invalid time format. Use HH:MM');
        return;
    }
    const now = new Date();
    const scheduled = new Date(now);
    scheduled.setHours(hours, minutes, 0, 0);
    if (scheduled <= now) scheduled.setDate(scheduled.getDate() + 1);
    const delay = scheduled - now;
    if (delay > 86400000) {
        alert('Cannot schedule more than 24 hours in advance.');
        return;
    }
    setTimeout(() => {
        const chatKey = getChatKey(state.currentUser.username, state.currentChatPartner);
        const messages = state.localCache.messages;
        if (!messages[chatKey]) messages[chatKey] = [];
        messages[chatKey].push({
            sender: state.currentUser.username,
            timestamp: Date.now(),
            text: '📅 ' + text + ' (Scheduled)',
            reactions: []
        });
        state.localCache.messages = messages;
        localStorage.setItem('vvn_cache', JSON.stringify(state.localCache));
        pushToRemote();
        renderMessages(messages[chatKey]);
        renderChatList();
        scrollToBottom();
    }, delay);
    alert('✅ Message scheduled for ' + time);
    closeDropdown();
}

function addQuickReply() {
    const text = prompt('Enter quick reply text:');
    if (!text) return;
    const replies = JSON.parse(localStorage.getItem('vvn_quick_replies') || '[]');
    replies.push(text);
    localStorage.setItem('vvn_quick_replies', JSON.stringify(replies));
    alert('✅ Quick reply added!');
    closeDropdown();
}

function showQuickReplies() {
    const replies = JSON.parse(localStorage.getItem('vvn_quick_replies') || '[]');
    if (!replies.length) { alert('No quick replies saved.'); return; }
    let msg = '📋 Quick Replies:\n\n';
    replies.forEach((r, i) => {
        msg += (i+1) + '. ' + r + '\n';
    });
    msg += '\nEnter number to use, or cancel:';
    const selection = prompt(msg);
    if (selection === null) return;
    const index = parseInt(selection) - 1;
    if (index >= 0 && index < replies.length) {
        DOM.messageInput.value = replies[index];
        DOM.messageInput.focus();
    }
    closeDropdown();
}

function showMessageStats() {
    const chatKey = getChatKey(state.currentUser.username, state.currentChatPartner);
    const messages = state.localCache.messages[chatKey] || [];
    const sent = messages.filter(m => m.sender === state.currentUser.username).length;
    const received = messages.filter(m => m.sender !== state.currentUser.username).length;
    const total = messages.length;
    const partner = getDisplayName(state.currentChatPartner);
    alert('📊 Message Stats with ' + partner + '\n\n' +
          'Sent: ' + sent + '\n' +
          'Received: ' + received + '\n' +
          'Total: ' + total);
    closeDropdown();
}

function playRPS() {
    const choices = ['🪨 Rock', '📄 Paper', '✂️ Scissors'];
    const playerChoice = prompt('🎮 Rock Paper Scissors\n\n1. 🪨 Rock\n2. 📄 Paper\n3. ✂️ Scissors');
    if (!playerChoice) return;
    const playerIndex = parseInt(playerChoice) - 1;
    if (playerIndex < 0 || playerIndex > 2) { alert('Invalid choice'); return; }
    const botIndex = Math.floor(Math.random() * 3);
    const result = (playerIndex - botIndex + 3) % 3;
    let msg = '🎮 Rock Paper Scissors\n\n';
    msg += 'You: ' + choices[playerIndex] + '\n';
    msg += 'Bot: ' + choices[botIndex] + '\n\n';
    if (result === 0) msg += '🤝 Draw!';
    else if (result === 1) msg += '🎉 You win!';
    else msg += '😔 You lose!';
    const chatKey = getChatKey(state.currentUser.username, state.currentChatPartner);
    const messages = state.localCache.messages;
    if (!messages[chatKey]) messages[chatKey] = [];
    messages[chatKey].push({
        sender: state.currentUser.username,
        timestamp: Date.now(),
        text: msg,
        reactions: []
    });
    state.localCache.messages = messages;
    localStorage.setItem('vvn_cache', JSON.stringify(state.localCache));
    pushToRemote();
    renderMessages(messages[chatKey]);
    renderChatList();
    scrollToBottom();
    closeDropdown();
}

function toggleRainbowName() {
    const user = state.currentUser;
    if (!user) return;
    user.rainbow = !user.rainbow;
    const userIndex = state.localCache.users.findIndex(u => u.username === user.username);
    if (userIndex !== -1) {
        state.localCache.users[userIndex] = user;
        localStorage.setItem('vvn_cache', JSON.stringify(state.localCache));
        pushToRemote();
        renderChatList();
        if (DOM.chatPartnerName) {
            if (user.rainbow) {
                DOM.chatPartnerName.classList.add('rainbow-name');
            } else {
                DOM.chatPartnerName.classList.remove('rainbow-name');
            }
        }
        alert(user.rainbow ? '🌈 Rainbow name enabled!' : 'Rainbow name disabled.');
    }
    closeDropdown();
}

function changeChatTheme() {
    const themes = ['Default', 'Gradient 1', 'Gradient 2', 'Gradient 3', 'Gradient 4', 'Gradient 5', 'Pattern 1', 'Pattern 2'];
    let msg = '🎨 Chat Themes\n\n';
    themes.forEach((t, i) => {
        msg += (i+1) + '. ' + t + '\n';
    });
    const selection = prompt(msg);
    if (!selection) return;
    const index = parseInt(selection) - 1;
    if (index < 0 || index >= themes.length) return;
    const themeClasses = ['', 'chat-theme-gradient-1', 'chat-theme-gradient-2', 'chat-theme-gradient-3', 'chat-theme-gradient-4', 'chat-theme-gradient-5', 'chat-theme-pattern-1', 'chat-theme-pattern-2'];
    chatSettings.chatTheme = themeClasses[index] || '';
    localStorage.setItem('vvn_chat_settings', JSON.stringify(chatSettings));
    if (DOM.chatMessages) {
        DOM.chatMessages.className = 'chat-messages ' + chatSettings.chatTheme;
    }
    alert('✅ Theme changed to: ' + themes[index]);
    closeDropdown();
}

function setChatWallpaper() {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*';
    fileInput.onchange = function(e) {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(ev) {
                chatSettings.wallpaper = ev.target.result;
                chatSettings.wallpaperBlur = true;
                localStorage.setItem('vvn_chat_settings', JSON.stringify(chatSettings));
                applyChatWallpaper();
                alert('✅ Wallpaper set successfully!');
            };
            reader.readAsDataURL(file);
        }
    };
    fileInput.click();
    closeDropdown();
}

function applyChatWallpaper() {
    if (chatSettings.wallpaper && DOM.chatMessages) {
        DOM.chatMessages.style.backgroundImage = 'url(' + chatSettings.wallpaper + ')';
        DOM.chatMessages.style.backgroundSize = 'cover';
        DOM.chatMessages.style.backgroundPosition = 'center';
        if (chatSettings.wallpaperBlur) {
            DOM.chatMessages.style.backdropFilter = 'blur(4px)';
        }
    }
}

function setBubbleColor() {
    const color = prompt('Enter hex color for outgoing bubbles (e.g., #36454F):', chatSettings.bubbleColor || '#36454F');
    if (color && /^#[0-9A-Fa-f]{6}$/.test(color)) {
        chatSettings.bubbleColor = color;
        localStorage.setItem('vvn_chat_settings', JSON.stringify(chatSettings));
        document.documentElement.style.setProperty('--bubble-color', color);
        document.querySelectorAll('.message.outgoing').forEach(el => {
            el.style.background = color;
        });
        alert('✅ Bubble color updated!');
    } else if (color) {
        alert('❌ Invalid color format. Use #RRGGBB');
    }
    closeDropdown();
}

function showFontSizeOptions() {
    const sizes = ['small', 'medium', 'large', 'xl'];
    let msg = '🔤 Font Size\n\n';
    sizes.forEach((s, i) => {
        msg += (i+1) + '. ' + s.charAt(0).toUpperCase() + s.slice(1) + '\n';
    });
    const selection = prompt(msg);
    if (!selection) return;
    const index = parseInt(selection) - 1;
    if (index < 0 || index >= sizes.length) return;
    chatSettings.fontSize = sizes[index];
    localStorage.setItem('vvn_chat_settings', JSON.stringify(chatSettings));
    const sizeClasses = { small: 'font-size-small', medium: 'font-size-medium', large: 'font-size-large', xl: 'font-size-xl' };
    document.querySelectorAll('.message').forEach(el => {
        el.classList.remove('font-size-small', 'font-size-medium', 'font-size-large', 'font-size-xl');
        if (sizeClasses[sizes[index]]) el.classList.add(sizeClasses[sizes[index]]);
    });
    alert('✅ Font size updated to: ' + sizes[index]);
    closeDropdown();
}

function showFontFamilyOptions() {
    const fonts = ['Inter', 'SF Pro', 'Roboto', 'Poppins', 'Helvetica'];
    let msg = '🔤 Font Family\n\n';
    fonts.forEach((f, i) => {
        msg += (i+1) + '. ' + f + '\n';
    });
    const selection = prompt(msg);
    if (!selection) return;
    const index = parseInt(selection) - 1;
    if (index < 0 || index >= fonts.length) return;
    chatSettings.fontFamily = fonts[index];
    localStorage.setItem('vvn_chat_settings', JSON.stringify(chatSettings));
    const familyClasses = { 'Inter': 'font-inter', 'SF Pro': 'font-sf', 'Roboto': 'font-roboto', 'Poppins': 'font-poppins', 'Helvetica': 'font-helvetica' };
    document.querySelectorAll('.message').forEach(el => {
        el.classList.remove('font-inter', 'font-sf', 'font-roboto', 'font-poppins', 'font-helvetica');
        if (familyClasses[fonts[index]]) el.classList.add(familyClasses[fonts[index]]);
    });
    alert('✅ Font family updated to: ' + fonts[index]);
    closeDropdown();
}

function changeTimestampFormat() {
    const formats = ['12h', '24h', 'relative'];
    let msg = '🕐 Timestamp Format\n\n';
    formats.forEach((f, i) => {
        msg += (i+1) + '. ' + f + '\n';
    });
    const selection = prompt(msg);
    if (!selection) return;
    const index = parseInt(selection) - 1;
    if (index < 0 || index >= formats.length) return;
    chatSettings.timestampFormat = formats[index];
    localStorage.setItem('vvn_chat_settings', JSON.stringify(chatSettings));
    alert('✅ Timestamp format updated to: ' + formats[index]);
    closeDropdown();
}

function toggleReadReceipts() {
    chatSettings.readReceipts = !chatSettings.readReceipts;
    localStorage.setItem('vvn_chat_settings', JSON.stringify(chatSettings));
    alert('✅ Read receipts ' + (chatSettings.readReceipts ? 'enabled' : 'disabled'));
    closeDropdown();
}

function showAnimationOptions() {
    const animations = ['slide', 'fade', 'pop', 'bounce'];
    let msg = '🎬 Message Animations\n\n';
    animations.forEach((a, i) => {
        msg += (i+1) + '. ' + a.charAt(0).toUpperCase() + a.slice(1) + '\n';
    });
    const selection = prompt(msg);
    if (!selection) return;
    const index = parseInt(selection) - 1;
    if (index < 0 || index >= animations.length) return;
    chatSettings.messageAnimation = animations[index];
    localStorage.setItem('vvn_chat_settings', JSON.stringify(chatSettings));
    alert('✅ Animation style updated to: ' + animations[index]);
    closeDropdown();
}

function searchMessages() {
    const query = prompt('🔍 Enter keyword to search messages:');
    if (!query) return;
    const chatKey = getChatKey(state.currentUser.username, state.currentChatPartner);
    const messages = state.localCache.messages[chatKey] || [];
    const results = messages.filter(m => m.text && m.text.toLowerCase().includes(query.toLowerCase()));
    if (results.length === 0) {
        alert('No messages found containing: ' + query);
        return;
    }
    let msg = '🔍 Found ' + results.length + ' messages:\n\n';
    results.forEach((m, i) => {
        msg += (i+1) + '. ' + m.text.substring(0, 50) + (m.text.length > 50 ? '...' : '') + '\n';
    });
    alert(msg);
    closeDropdown();
}

function forwardMessages() {
    if (selectedMessages.size === 0) {
        alert('Select messages first.');
        return;
    }
    const contacts = state.localCache.users.filter(u => u.username !== state.currentUser.username);
    if (contacts.length === 0) {
        alert('No contacts to forward to.');
        return;
    }
    let contactList = 'Forward to:\n\n';
    contacts.forEach((c, i) => {
        contactList += (i+1) + '. ' + (c.displayName || c.username) + '\n';
    });
    const choice = prompt(contactList + '\nEnter number:');
    if (!choice) return;
    const index = parseInt(choice) - 1;
    if (index < 0 || index >= contacts.length) {
        alert('Invalid choice.');
        return;
    }
    const target = contacts[index].username;
    const chatKey = getChatKey(state.currentUser.username, target);
    const messages = state.localCache.messages;
    if (!messages[chatKey]) messages[chatKey] = [];
    const sourceKey = getChatKey(state.currentUser.username, state.currentChatPartner);
    const sourceMsgs = state.localCache.messages[sourceKey] || [];
    selectedMessages.forEach(msgId => {
        const parts = msgId.split('-');
        const timestamp = parseInt(parts[0]);
        const idx = parseInt(parts[1]);
        const msg = sourceMsgs.find((m, i) => m.timestamp === timestamp && i === idx);
        if (msg) {
            messages[chatKey].push({
                sender: state.currentUser.username,
                timestamp: Date.now(),
                text: '📨 Forwarded: ' + (msg.text || '📎 File'),
                reactions: []
            });
        }
    });
    state.localCache.messages = messages;
    localStorage.setItem('vvn_cache', JSON.stringify(state.localCache));
    pushToRemote();
    clearSelection();
    alert('✅ Messages forwarded!');
    closeDropdown();
}

function showVoiceSpeedOptions() {
    const speeds = ['0.5', '0.75', '1', '1.25', '1.5', '2'];
    let msg = '🎵 Voice Speed\n\n';
    speeds.forEach((s, i) => {
        msg += (i+1) + '. ' + s + 'x\n';
    });
    const selection = prompt(msg);
    if (!selection) return;
    const index = parseInt(selection) - 1;
    if (index < 0 || index >= speeds.length) return;
    chatSettings.voiceSpeed = parseFloat(speeds[index]);
    localStorage.setItem('vvn_chat_settings', JSON.stringify(chatSettings));
    document.querySelectorAll('audio, video').forEach(el => {
        el.playbackRate = chatSettings.voiceSpeed;
    });
    alert('✅ Voice speed set to: ' + speeds[index] + 'x');
    closeDropdown();
}

function saveDraft() {
    const text = DOM.messageInput.value.trim();
    if (!text) return;
    const drafts = JSON.parse(localStorage.getItem('vvn_drafts') || '{}');
    const chatKey = getChatKey(state.currentUser.username, state.currentChatPartner);
    drafts[chatKey] = text;
    localStorage.setItem('vvn_drafts', JSON.stringify(drafts));
    const indicator = document.getElementById('draftIndicator') || document.createElement('div');
    indicator.id = 'draftIndicator';
    indicator.className = 'draft-indicator';
    indicator.textContent = '💾 Draft saved';
    if (!document.getElementById('draftIndicator')) {
        DOM.chatInputBar.parentElement.insertBefore(indicator, DOM.chatInputBar);
        setTimeout(() => indicator.remove(), 3000);
    }
}

function loadDraft() {
    const drafts = JSON.parse(localStorage.getItem('vvn_drafts') || '{}');
    const chatKey = getChatKey(state.currentUser.username, state.currentChatPartner);
    if (drafts[chatKey]) {
        DOM.messageInput.value = drafts[chatKey];
        DOM.messageInput.focus();
    }
    closeDropdown();
}

function setCustomStatus() {
    const status = prompt('Set your custom status:', state.currentUser?.status || '');
    if (status !== null) {
        const user = state.currentUser;
        if (user) {
            user.status = status.trim() || '';
            const userIndex = state.localCache.users.findIndex(u => u.username === user.username);
            if (userIndex !== -1) {
                state.localCache.users[userIndex] = user;
                localStorage.setItem('vvn_cache', JSON.stringify(state.localCache));
                pushToRemote();
                alert('✅ Status updated!');
            }
        }
    }
    closeDropdown();
}

function generateQRCode() {
    const user = state.currentUser;
    if (!user) return;
    alert('📱 Your VVN ID: ' + user.username + '\nShare this to connect with friends!');
    closeDropdown();
}

function showBadges() {
    const user = state.currentUser;
    if (!user) return;
    const badges = [];
    if (user.created) {
        const age = Date.now() - user.created;
        if (age > 365 * 24 * 60 * 60 * 1000) badges.push('🏅 OG');
        if (age > 180 * 24 * 60 * 60 * 1000) badges.push('⭐ Early Adopter');
    }
    if (CONFIG.OWNERS && CONFIG.OWNERS.includes(user.username)) badges.push('✅ Verified');
    if (badges.length === 0) badges.push('No badges yet');
    alert('🏆 Your Badges:\n\n' + badges.join('\n'));
    closeDropdown();
}

function openStickerPack() {
    const stickers = JSON.parse(localStorage.getItem('vvn_stickers') || '[]');
    if (stickers.length === 0) {
        const add = confirm('No stickers found. Would you like to upload some?');
        if (add) uploadSticker();
        return;
    }
    const modal = document.createElement('div');
    modal.className = 'modal active';
    modal.innerHTML = `
        <div class="modal-overlay" onclick="this.parentElement.remove()"></div>
        <div class="modal-content glass-card" style="max-width:400px;">
            <button class="modal-close" onclick="this.closest('.modal').remove()">✕</button>
            <h3>Stickers</h3>
            <div class="sticker-pack">
                ${stickers.map(s => `<img src="${s}" class="sticker" onclick="sendSticker('${s}')" />`).join('')}
            </div>
            <button class="btn-secondary" onclick="uploadSticker();this.closest('.modal').remove();" style="margin-top:12px;">➕ Add Sticker</button>
        </div>
    `;
    document.body.appendChild(modal);
    closeDropdown();
}

function uploadSticker() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.multiple = true;
    input.onchange = function(e) {
        const files = e.target.files;
        const stickers = JSON.parse(localStorage.getItem('vvn_stickers') || '[]');
        Array.from(files).forEach(file => {
            const reader = new FileReader();
            reader.onload = function(ev) {
                stickers.push(ev.target.result);
                localStorage.setItem('vvn_stickers', JSON.stringify(stickers));
                alert('✅ Sticker added!');
            };
            reader.readAsDataURL(file);
        });
    };
    input.click();
}

function sendSticker(data) {
    const chatKey = getChatKey(state.currentUser.username, state.currentChatPartner);
    const messages = state.localCache.messages;
    if (!messages[chatKey]) messages[chatKey] = [];
    messages[chatKey].push({
        sender: state.currentUser.username,
        timestamp: Date.now(),
        file: {
            type: 'image',
            data: data,
            caption: 'Sticker',
            name: 'sticker.png',
            size: '0 KB'
        },
        reactions: []
    });
    state.localCache.messages = messages;
    localStorage.setItem('vvn_cache', JSON.stringify(state.localCache));
    pushToRemote();
    renderMessages(messages[chatKey]);
    renderChatList();
    scrollToBottom();
    document.querySelector('.modal')?.remove();
}

function openGIFPicker() {
    const mockGifs = [
        'https://media.giphy.com/media/3o7abKhOpu0N9H8hUY/giphy.gif',
        'https://media.giphy.com/media/l0HlNQ9yHn0vV5LVi/giphy.gif',
        'https://media.giphy.com/media/3o6Zt481isNVuQI1l6/giphy.gif',
        'https://media.giphy.com/media/3o7aCTPPm4OHfRLSH6/giphy.gif'
    ];
    const modal = document.createElement('div');
    modal.className = 'modal active';
    modal.innerHTML = `
        <div class="modal-overlay" onclick="this.parentElement.remove()"></div>
        <div class="modal-content glass-card" style="max-width:500px;">
            <button class="modal-close" onclick="this.closest('.modal').remove()">✕</button>
            <h3>GIFs</h3>
            <div class="gif-grid">
                ${mockGifs.map(g => `<img src="${g}" class="gif-item" onclick="sendGIF('${g}')" />`).join('')}
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    closeDropdown();
}

function sendGIF(data) {
    const chatKey = getChatKey(state.currentUser.username, state.currentChatPartner);
    const messages = state.localCache.messages;
    if (!messages[chatKey]) messages[chatKey] = [];
    messages[chatKey].push({
        sender: state.currentUser.username,
        timestamp: Date.now(),
        file: {
            type: 'image',
            data: data,
            caption: 'GIF',
            name: 'gif.gif',
            size: '0 KB'
        },
        reactions: []
    });
    state.localCache.messages = messages;
    localStorage.setItem('vvn_cache', JSON.stringify(state.localCache));
    pushToRemote();
    renderMessages(messages[chatKey]);
    renderChatList();
    scrollToBottom();
    document.querySelector('.modal')?.remove();
}

function showGameOptions() {
    const games = ['Tic Tac Toe', 'Trivia'];
    let msg = '🎮 Mini Games\n\n';
    games.forEach((g, i) => {
        msg += (i+1) + '. ' + g + '\n';
    });
    const selection = prompt(msg);
    if (!selection) return;
    const index = parseInt(selection) - 1;
    if (index === 0) playTicTacToe();
    else if (index === 1) playTrivia();
    closeDropdown();
}

function playTicTacToe() {
    let board = Array(9).fill(null);
    let currentPlayer = 'X';
    let gameOver = false;
    const chatKey = getChatKey(state.currentUser.username, state.currentChatPartner);
    
    function renderBoard() {
        let boardHtml = '<div class="game-container"><h4>🎮 Tic Tac Toe</h4><div class="game-board">';
        for (let i = 0; i < 9; i++) {
            boardHtml += `<div class="game-cell ${board[i] ? board[i].toLowerCase() : ''}" data-index="${i}" onclick="makeMove(${i})">${board[i] || ''}</div>`;
        }
        boardHtml += '</div><div class="game-result" id="gameResult">' + (gameOver ? 'Game Over!' : currentPlayer + '\'s turn') + '</div></div>';
        return boardHtml;
    }
    
    window.makeMove = function(index) {
        if (gameOver || board[index]) return;
        board[index] = currentPlayer;
        const winner = checkWinner();
        if (winner) {
            gameOver = true;
            document.getElementById('gameResult').textContent = winner + ' wins! 🎉';
            sendGameResult(winner + ' wins!');
            return;
        }
        if (board.every(cell => cell !== null)) {
            gameOver = true;
            document.getElementById('gameResult').textContent = 'Draw! 🤝';
            sendGameResult('Draw!');
            return;
        }
        currentPlayer = currentPlayer === 'X' ? 'O' : 'X';
        document.getElementById('gameResult').textContent = currentPlayer + '\'s turn';
    };
    
    function checkWinner() {
        const lines = [
            [0,1,2],[3,4,5],[6,7,8],
            [0,3,6],[1,4,7],[2,5,8],
            [0,4,8],[2,4,6]
        ];
        for (const line of lines) {
            const [a,b,c] = line;
            if (board[a] && board[a] === board[b] && board[a] === board[c]) {
                return board[a];
            }
        }
        return null;
    }
    
    function sendGameResult(result) {
        const messages = state.localCache.messages;
        if (!messages[chatKey]) messages[chatKey] = [];
        messages[chatKey].push({
            sender: state.currentUser.username,
            timestamp: Date.now(),
            text: '🎮 Game Result: ' + result,
            reactions: []
        });
        state.localCache.messages = messages;
        localStorage.setItem('vvn_cache', JSON.stringify(state.localCache));
        pushToRemote();
        renderMessages(messages[chatKey]);
        renderChatList();
        scrollToBottom();
    }
    
    const messages = state.localCache.messages;
    if (!messages[chatKey]) messages[chatKey] = [];
    messages[chatKey].push({
        sender: state.currentUser.username,
        timestamp: Date.now(),
        text: '🎮 Tic Tac Toe started!',
        reactions: []
    });
    state.localCache.messages = messages;
    localStorage.setItem('vvn_cache', JSON.stringify(state.localCache));
    pushToRemote();
    renderMessages(messages[chatKey]);
    renderChatList();
    scrollToBottom();
    
    alert('🎮 Tic Tac Toe started!\nYou are X. Click cells to play.');
}

function playTrivia() {
    const questions = [
        { q: 'What is the capital of France?', a: 'Paris' },
        { q: 'What is 2+2?', a: '4' },
        { q: 'What is the largest planet?', a: 'Jupiter' },
        { q: 'What is the speed of light?', a: '299792458' }
    ];
    const q = questions[Math.floor(Math.random() * questions.length)];
    const answer = prompt('🧠 Trivia Question:\n\n' + q.q);
    if (answer && answer.toLowerCase().trim() === q.a.toLowerCase()) {
        alert('✅ Correct!');
        sendGameResult('Correct answer: ' + q.a);
    } else {
        alert('❌ Incorrect. The answer was: ' + q.a);
        sendGameResult('Incorrect. Answer: ' + q.a);
    }
    closeDropdown();
}

function sendGameResult(result) {
    const chatKey = getChatKey(state.currentUser.username, state.currentChatPartner);
    const messages = state.localCache.messages;
    if (!messages[chatKey]) messages[chatKey] = [];
    messages[chatKey].push({
        sender: state.currentUser.username,
        timestamp: Date.now(),
        text: '🧠 Trivia Result: ' + result,
        reactions: []
    });
    state.localCache.messages = messages;
    localStorage.setItem('vvn_cache', JSON.stringify(state.localCache));
    pushToRemote();
    renderMessages(messages[chatKey]);
    renderChatList();
    scrollToBottom();
}

function createPoll() {
    const question = prompt('📊 Enter poll question:');
    if (!question) return;
    let options = [];
    for (let i = 1; i <= 4; i++) {
        const opt = prompt('Option ' + i + ' (leave empty to stop):');
        if (!opt) break;
        options.push(opt);
    }
    if (options.length < 2) {
        alert('Need at least 2 options.');
        return;
    }
    const pollData = {
        question: question,
        options: options,
        votes: options.map(() => 0),
        voters: []
    };
    const chatKey = getChatKey(state.currentUser.username, state.currentChatPartner);
    const messages = state.localCache.messages;
    if (!messages[chatKey]) messages[chatKey] = [];
    messages[chatKey].push({
        sender: state.currentUser.username,
        timestamp: Date.now(),
        poll: pollData,
        reactions: []
    });
    state.localCache.messages = messages;
    localStorage.setItem('vvn_cache', JSON.stringify(state.localCache));
    pushToRemote();
    renderMessages(messages[chatKey]);
    renderChatList();
    scrollToBottom();
    closeDropdown();
}

function showTypingIndicator() {
    if (state.isTyping) return;
    state.isTyping = true;
    const typingEl = document.createElement('div');
    typingEl.className = 'typing-indicator';
    typingEl.id = 'typingIndicator';
    typingEl.innerHTML = '<span>' + getDisplayName(state.currentChatPartner) + ' is typing</span><div class="dots"><span></span><span></span><span></span></div>';
    DOM.chatMessages.appendChild(typingEl);
    scrollToBottom();
    clearTimeout(state.typingTimeout);
    state.typingTimeout = setTimeout(() => {
        hideTypingIndicator();
    }, 3000);
}

function hideTypingIndicator() {
    const el = document.getElementById('typingIndicator');
    if (el) el.remove();
    state.isTyping = false;
}

async function loginUser(username, password) {
    const users = state.localCache.users;
    const user = users.find(u => u.username === username && u.password === password);
    if (!user) {
        if (DOM.authError) {
            DOM.authError.textContent = 'Incorrect username or password';
            DOM.authError.style.display = 'block';
        }
        return false;
    }
    localStorage.setItem('vvn_session', JSON.stringify({ username: user.username }));
    state.currentUser = user;
    renderMessenger();
    resetAutoLock();
    return true;
}

async function registerUser(username, displayName, password) {
    const users = state.localCache.users;
    if (users.find(u => u.username === username)) {
        if (DOM.regError) {
            DOM.regError.textContent = 'Username already taken';
            DOM.regError.style.display = 'block';
        }
        return false;
    }
    const newUser = {
        username: username,
        displayName: displayName || username,
        password: password,
        bio: '',
        online: true,
        created: Date.now(),
        avatar: '',
        rainbow: false,
        status: ''
    };
    users.push(newUser);
    state.localCache.users = users;
    localStorage.setItem('vvn_cache', JSON.stringify(state.localCache));
    await pushToRemote();
    localStorage.setItem('vvn_session', JSON.stringify({ username: newUser.username }));
    state.currentUser = newUser;
    renderMessenger();
    resetAutoLock();
    return true;
}

function renderMessenger() {
    if (DOM.authScreen) DOM.authScreen.style.display = 'none';
    if (DOM.messenger) DOM.messenger.style.display = 'flex';
    const session = JSON.parse(localStorage.getItem('vvn_session'));
    if (!session) { logout(); return; }
    const user = state.localCache.users.find(u => u.username === session.username);
    if (!user) { logout(); return; }
    state.currentUser = user;
    if (DOM.sidebarUsername) {
        DOM.sidebarUsername.textContent = user.displayName || user.username;
    }
    renderChatList();
    if (state.currentChatPartner) {
        openChat(state.currentChatPartner);
    } else {
        showPlaceholder();
    }
    updateMobileView();
}

function logout() {
    localStorage.removeItem('vvn_session');
    state.currentUser = null;
    state.currentChatPartner = null;
    if (state.syncInterval) clearInterval(state.syncInterval);
    if (autoLockTimeout) clearTimeout(autoLockTimeout);
    if (DOM.authScreen) DOM.authScreen.style.display = 'flex';
    if (DOM.messenger) DOM.messenger.style.display = 'none';
}

function resetAutoLock() {
    if (autoLockTimeout) clearTimeout(autoLockTimeout);
    const lockTime = parseInt(state.settings.autoLock);
    if (lockTime && lockTime !== 'never') {
        autoLockTimeout = setTimeout(function() {
            if (state.currentUser) {
                logout();
                alert('Auto-locked due to inactivity.');
            }
        }, lockTime * 60 * 1000);
    }
}

function updateActivity() {
    lastActivity = Date.now();
    resetAutoLock();
}

function renderChatList() {
    if (!state.currentUser || !DOM.chatList) return;
    const chats = state.localCache.chats;
    const messages = state.localCache.messages;
    let chatKeys = Object.keys(chats).filter(function(k) {
        return k.includes(state.currentUser.username);
    });
    blockedUsers = JSON.parse(localStorage.getItem('vvn_blocked') || '[]');
    chatKeys = chatKeys.filter(function(k) {
        const parts = k.split('_');
        const partner = parts[0] === state.currentUser.username ? parts[1] : parts[0];
        return !blockedUsers.includes(partner);
    });
    const pinnedContacts = JSON.parse(localStorage.getItem('vvn_pinned_contacts') || '[]');
    let html = '';
    if (chatKeys.length === 0) {
        html = '<div class="empty-chats">No chats yet. Search for users above.</div>';
    } else {
        const sorted = chatKeys.sort(function(a, b) {
            const partsA = a.split('_');
            const partsB = b.split('_');
            const partnerA = partsA[0] === state.currentUser.username ? partsA[1] : partsA[0];
            const partnerB = partsB[0] === state.currentUser.username ? partsB[1] : partsB[0];
            const isPinnedA = pinnedContacts.includes(partnerA);
            const isPinnedB = pinnedContacts.includes(partnerB);
            if (isPinnedA && !isPinnedB) return -1;
            if (!isPinnedA && isPinnedB) return 1;
            const ma = messages[a] || [];
            const mb = messages[b] || [];
            return (mb.length ? mb[mb.length-1].timestamp : 0) - (ma.length ? ma[ma.length-1].timestamp : 0);
        });
        for (const key of sorted) {
            const parts = key.split('_');
            const partner = parts[0] === state.currentUser.username ? parts[1] : parts[0];
            const msgs = messages[key] || [];
            const last = msgs.length ? msgs[msgs.length-1] : null;
            const preview = last ? (last.text || '📎 File') : 'Start chatting';
            const time = last ? formatTime(last.timestamp) : '';
            const pUser = getUserByUsername(partner);
            const tags = getUserTags(partner);
            const tagHtml = tags.map(function(t) { return '<span class="tag">' + t.label + '</span>'; }).join('');
            const isPinned = pinnedContacts.includes(partner);
            const displayName = getDisplayName(partner);
            const isRainbow = pUser && pUser.rainbow;
            html += '<div class="chat-item ' + (partner === state.currentChatPartner ? 'active' : '') + '" data-partner="' + partner + '">';
            html += '<div class="avatar">' + partner.charAt(0).toUpperCase() + '</div>';
            html += '<div class="chat-info">';
            html += '<div class="cname"><span' + (isRainbow ? ' class="rainbow-name"' : '') + '>' + displayName + '</span> ' + tagHtml + (isPinned ? ' 📌' : '') + '</div>';
            html += '<div class="preview">' + preview + '</div>';
            html += '</div>';
            html += '<div class="time">' + time + '</div>';
            html += '</div>';
        }
    }
    DOM.chatList.innerHTML = html;
    document.querySelectorAll('.chat-item').forEach(function(el) {
        el.addEventListener('click', function() {
            openChat(this.dataset.partner);
            updateActivity();
        });
    });
}

function openChat(partnerUsername) {
    if (!state.currentUser) return;
    if (blockedUsers.includes(partnerUsername)) {
        alert('This user is blocked. Unblock them to chat.');
        return;
    }
    state.currentChatPartner = partnerUsername;
    const partner = getUserByUsername(partnerUsername);
    if (!partner) return;
    if (DOM.chatActive) DOM.chatActive.style.display = 'flex';
    if (DOM.chatPlaceholder) DOM.chatPlaceholder.style.display = 'none';
    if (DOM.chatHeader) DOM.chatHeader.style.display = 'flex';
    if (DOM.chatInputBar) DOM.chatInputBar.style.display = 'flex';
    const displayName = getDisplayName(partnerUsername);
    if (DOM.chatPartnerName) {
        DOM.chatPartnerName.textContent = displayName;
        if (partner.rainbow) {
            DOM.chatPartnerName.classList.add('rainbow-name');
        } else {
            DOM.chatPartnerName.classList.remove('rainbow-name');
        }
    }
    if (DOM.chatPartnerStatus) DOM.chatPartnerStatus.textContent = partner.online ? 'Online' : 'Offline';
    if (DOM.chatAvatar) DOM.chatAvatar.textContent = partner.username.charAt(0).toUpperCase();
    const chatKey = getChatKey(state.currentUser.username, partnerUsername);
    const msgs = state.localCache.messages[chatKey] || [];
    renderMessages(msgs);
    const chats = state.localCache.chats;
    if (!chats[chatKey]) {
        chats[chatKey] = { participants: [state.currentUser.username, partnerUsername], created: Date.now() };
        state.localCache.chats = chats;
        localStorage.setItem('vvn_cache', JSON.stringify(state.localCache));
        pushToRemote();
    }
    const pinned = pinnedMessages[chatKey] || [];
    if (pinned.length > 0) {
        showPinnedDock(chatKey);
    } else {
        DOM.pinnedDock.style.display = 'none';
    }
    if (DOM.blockUserBtn && DOM.unblockUserBtn) {
        if (blockedUsers.includes(partnerUsername)) {
            DOM.blockUserBtn.style.display = 'none';
            DOM.unblockUserBtn.style.display = 'inline-flex';
        } else {
            DOM.blockUserBtn.style.display = 'inline-flex';
            DOM.unblockUserBtn.style.display = 'none';
        }
    }
    applyChatBackground();
    applyChatTheme();
    applyChatWallpaper();
    renderChatList();
    updateMobileView();
    scrollToBottom();
    clearSelection();
    closeDropdown();
}

function renderMessages(msgs) {
    if (!DOM.chatMessages) return;
    DOM.chatMessages.innerHTML = '';
    if (!msgs.length) {
        DOM.chatMessages.innerHTML = '<div style="color:var(--text-muted);text-align:center;padding:20px;">No messages yet</div>';
        return;
    }
    for (let i = 0; i < msgs.length; i++) {
        const msg = msgs[i];
        const msgId = msg.timestamp + '-' + i;
        const div = document.createElement('div');
        const isOutgoing = msg.sender === state.currentUser.username;
        let bubbleClass = 'bubble-' + chatSettings.bubbleStyle;
        if (chatSettings.bubbleColor && isOutgoing) {
            div.style.background = chatSettings.bubbleColor;
        }
        div.className = 'message ' + (isOutgoing ? 'outgoing' : 'incoming') + ' ' + bubbleClass + ' ' + (chatSettings.messageAnimation ? chatSettings.messageAnimation + '-in' : '');
        div.dataset.msgId = msgId;
        let content = '';
        if (msg.poll) {
            const totalVotes = msg.poll.votes.reduce((a, b) => a + b, 0);
            content += '<div class="poll-container"><div class="poll-question">' + msg.poll.question + '</div>';
            msg.poll.options.forEach((opt, idx) => {
                const percent = totalVotes > 0 ? (msg.poll.votes[idx] / totalVotes * 100) : 0;
                content += '<div class="poll-option" data-poll-idx="' + idx + '" onclick="votePoll(\'' + msgId + '\',' + idx + ')">';
                content += '<span>' + opt + '</span>';
                content += '<div class="poll-bar"><div class="poll-fill" style="width:' + percent + '%"></div></div>';
                content += '<span class="poll-votes">' + msg.poll.votes[idx] + '</span>';
                content += '</div>';
            });
            content += '<div style="font-size:0.7rem;color:var(--text-muted);margin-top:4px;">Total votes: ' + totalVotes + '</div>';
            content += '</div>';
        } else if (msg.file) {
            if (msg.file.type === 'image') {
                content += '<div class="file-content"><img src="' + msg.file.data + '" alt="Image" onclick="window.open(this.src)" /></div>';
            } else if (msg.file.type === 'video') {
                content += '<div class="file-content"><video controls><source src="' + msg.file.data + '" /></video></div>';
            } else if (msg.file.type === 'audio') {
                content += '<div class="file-content"><div class="voice-message">';
                content += '<button class="play-btn" onclick="this.querySelector(\'img\').style.display=this.querySelector(\'img\').style.display===\'none\'?\'block\':\'none\'"><img src="icons/play.png" alt="Play" width="16" height="16" /></button>';
                content += '<div class="waveform">';
                for (let w = 0; w < 20; w++) {
                    content += '<div class="bar"></div>';
                }
                content += '</div>';
                content += '<span class="duration">0:00</span>';
                if (chatSettings.voiceSpeed) {
                    content += '<div class="voice-speed-control">';
                    [0.5, 1, 1.5, 2].forEach(speed => {
                        content += '<button class="' + (chatSettings.voiceSpeed === speed ? 'active' : '') + '" onclick="setVoiceSpeed(' + speed + ')">' + speed + 'x</button>';
                    });
                    content += '</div>';
                }
                content += '</div></div>';
            } else {
                content += '<div class="file-content"><div class="file-info">';
                content += '<div class="file-icon">📄</div>';
                content += '<div class="file-name">' + (msg.file.name || 'File') + '</div>';
                content += '<div class="file-size">' + (msg.file.size || '0 KB') + '</div>';
                content += '</div></div>';
            }
            if (msg.file.caption) {
                content += '<div class="file-caption">' + msg.file.caption + '</div>';
            }
        } else {
            content = msg.text || '';
        }
        if (msg.reactions && msg.reactions.length > 0) {
            content += '<div class="reactions">';
            const reactionCounts = {};
            msg.reactions.forEach(r => {
                reactionCounts[r.emoji] = (reactionCounts[r.emoji] || 0) + 1;
            });
            Object.entries(reactionCounts).forEach(([emoji, count]) => {
                const isUserReacted = msg.reactions.some(r => r.user === state.currentUser.username && r.emoji === emoji);
                content += '<span class="reaction' + (isUserReacted ? ' active' : '') + '" data-msg="' + msgId + '" data-emoji="' + emoji + '">' + emoji + ' ' + count + '</span>';
            });
            content += '</div>';
        }
        let timeDisplay = formatTime(msg.timestamp);
        if (chatSettings.timestampFormat === 'relative') {
            const diff = Math.floor((Date.now() - msg.timestamp) / 60000);
            if (diff < 1) timeDisplay = 'Just now';
            else if (diff < 60) timeDisplay = diff + 'm ago';
            else if (diff < 1440) timeDisplay = Math.floor(diff / 60) + 'h ago';
            else timeDisplay = Math.floor(diff / 1440) + 'd ago';
        } else if (chatSettings.timestampFormat === '24h') {
            const d = new Date(msg.timestamp);
            timeDisplay = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
        }
        div.innerHTML = '<div class="selection-circle"></div>' + content + '<div class="time">' + timeDisplay + (msg.edited ? ' (edited)' : '') + '</div>';
        if (chatSettings.readReceipts && isOutgoing) {
            div.innerHTML += '<span class="read-receipt delivered">✓✓</span>';
        }
        DOM.chatMessages.appendChild(div);
    }
    document.querySelectorAll('.reaction').forEach(function(el) {
        el.addEventListener('click', function() {
            const msgId = this.dataset.msg;
            const emoji = this.dataset.emoji;
            addReaction(msgId, emoji);
        });
    });
    document.querySelectorAll('.message').forEach(function(el) {
        el.addEventListener('contextmenu', function(e) {
            e.preventDefault();
            const msgId = this.dataset.msgId;
            const parts = msgId.split('-');
            const timestamp = parseInt(parts[0]);
            const index = parseInt(parts[1]);
            const chatKey = getChatKey(state.currentUser.username, state.currentChatPartner);
            const messages = state.localCache.messages[chatKey] || [];
            const msg = messages.find((m, i) => m.timestamp === timestamp && i === index);
            if (!msg) return;
            const options = ['Reply', 'Copy', 'Delete'];
            if (msg.sender === state.currentUser.username) options.push('Edit');
            const choice = prompt('Message options:\n' + options.map((o, i) => (i+1) + '. ' + o).join('\n'));
            if (!choice) return;
            const idx = parseInt(choice) - 1;
            if (idx === 0) { replyToMessage = msg; DOM.messageInput.focus(); DOM.messageInput.placeholder = 'Reply to: ' + (msg.text || '📎 File'); }
            else if (idx === 1) { navigator.clipboard.writeText(msg.text || '').then(() => alert('Copied!')); }
            else if (idx === 2) { if (confirm('Delete this message?')) { messages.splice(index, 1); state.localCache.messages[chatKey] = messages; localStorage.setItem('vvn_cache', JSON.stringify(state.localCache)); pushToRemote(); renderMessages(messages); } }
            else if (idx === 3 && msg.sender === state.currentUser.username) { editMessage(msgId); }
        });
    });
    scrollToBottom();
}

function scrollToBottom() {
    setTimeout(function() {
        if (DOM.chatMessages) {
            DOM.chatMessages.scrollTop = DOM.chatMessages.scrollHeight;
        }
    }, 50);
}

function showPlaceholder() {
    if (DOM.chatActive) DOM.chatActive.style.display = 'none';
    if (DOM.chatPlaceholder) DOM.chatPlaceholder.style.display = 'flex';
    if (state.isMobile) {
        const sidebar = document.getElementById('sidebar');
        if (sidebar) sidebar.classList.remove('hide-mobile');
        if (DOM.chatArea) DOM.chatArea.classList.remove('active-mobile');
    }
}

async function sendMessage() {
    if (!state.currentUser || !state.currentChatPartner) return;
    if (!DOM.messageInput) return;
    const text = DOM.messageInput.value.trim();
    if (!text && pendingFiles.length === 0) return;
    const chatKey = getChatKey(state.currentUser.username, state.currentChatPartner);
    const messages = state.localCache.messages;
    if (!messages[chatKey]) messages[chatKey] = [];
    if (pendingFiles.length > 0) {
        const caption = DOM.fileCaption ? DOM.fileCaption.value.trim() : '';
        for (const file of pendingFiles) {
            messages[chatKey].push({
                sender: state.currentUser.username,
                timestamp: Date.now(),
                file: {
                    type: file.type,
                    data: file.data,
                    caption: caption,
                    name: file.name,
                    size: file.size
                },
                reactions: []
            });
        }
        pendingFiles = [];
        if (DOM.filePreviewContainer) DOM.filePreviewContainer.innerHTML = '';
        if (DOM.fileClearBtn) DOM.fileClearBtn.style.display = 'none';
        if (DOM.fileCaption) DOM.fileCaption.value = '';
        if (DOM.fileModal) DOM.fileModal.classList.remove('active');
    } else {
        let finalText = text;
        if (replyToMessage) {
            const replyText = replyToMessage.text || '📎 File';
            const replySender = getDisplayName(replyToMessage.sender);
            finalText = '🗨️ Replying to ' + replySender + ': ' + replyText + '\n\n' + text;
            replyToMessage = null;
            DOM.messageInput.placeholder = 'Type a message...';
            const indicator = document.getElementById('replyIndicator');
            if (indicator) indicator.remove();
        }
        messages[chatKey].push({
            sender: state.currentUser.username,
            timestamp: Date.now(),
            text: finalText,
            reactions: []
        });
    }
    state.localCache.messages = messages;
    localStorage.setItem('vvn_cache', JSON.stringify(state.localCache));
    const chats = state.localCache.chats;
    if (!chats[chatKey]) {
        chats[chatKey] = { participants: [state.currentUser.username, state.currentChatPartner], created: Date.now() };
        state.localCache.chats = chats;
    }
    await pushToRemote();
    renderMessages(messages[chatKey]);
    renderChatList();
    if (DOM.messageInput) DOM.messageInput.value = '';
    scrollToBottom();
    updateActivity();
    hideTypingIndicator();
}

async function startVoiceRecording() {
    if (isRecording) return;
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorder = new MediaRecorder(stream);
        audioChunks = [];
        mediaRecorder.ondataavailable = function(event) {
            audioChunks.push(event.data);
        };
        mediaRecorder.onstop = function() {
            const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
            const reader = new FileReader();
            reader.onload = function() {
                const audioData = reader.result;
                const chatKey = getChatKey(state.currentUser.username, state.currentChatPartner);
                const messages = state.localCache.messages;
                if (!messages[chatKey]) messages[chatKey] = [];
                messages[chatKey].push({
                    sender: state.currentUser.username,
                    timestamp: Date.now(),
                    file: {
                        type: 'audio',
                        data: audioData,
                        caption: 'Voice message'
                    },
                    reactions: []
                });
                state.localCache.messages = messages;
                localStorage.setItem('vvn_cache', JSON.stringify(state.localCache));
                pushToRemote();
                renderMessages(messages[chatKey]);
                renderChatList();
                scrollToBottom();
            };
            reader.readAsDataURL(audioBlob);
        };
        mediaRecorder.start();
        isRecording = true;
        if (DOM.micBtn) DOM.micBtn.style.background = 'rgba(255,0,0,0.2)';
        if (DOM.micBtn) DOM.micBtn.style.borderColor = 'rgba(255,0,0,0.3)';
        setStatus('Recording...', 'red');
    } catch (err) {
        console.error('Error accessing microphone:', err);
        alert('Could not access microphone. Please allow microphone access.');
    }
}

function stopVoiceRecording() {
    if (mediaRecorder && isRecording) {
        mediaRecorder.stop();
        mediaRecorder.stream.getTracks().forEach(track => track.stop());
        isRecording = false;
        if (DOM.micBtn) {
            DOM.micBtn.style.background = '';
            DOM.micBtn.style.borderColor = '';
        }
        setStatus('Connected', 'green');
    }
}

function searchUsers(query) {
    if (!query.trim() || !DOM.searchResults) {
        DOM.searchResults.style.display = 'none';
        return;
    }
    const users = state.localCache.users;
    const q = query.toLowerCase();
    const found = users.filter(function(u) {
        return u.username !== state.currentUser.username &&
            !blockedUsers.includes(u.username) &&
            (u.username.toLowerCase().includes(q) ||
             (u.displayName && u.displayName.toLowerCase().includes(q)));
    });
    if (found.length === 0) {
        DOM.searchResults.innerHTML = '<div style="padding:10px 14px;color:var(--text-muted);font-size:0.85rem;">No users found</div>';
        DOM.searchResults.style.display = 'block';
        return;
    }
    let html = '';
    for (const u of found) {
        const tags = getUserTags(u.username);
        const tagHtml = tags.map(function(t) { return '<span class="tag" style="font-size:0.55rem;padding:0 4px;border-radius:3px;">' + t.label + '</span>'; }).join('');
        html += '<div class="search-result-item" data-username="' + u.username + '">';
        html += '<div class="avatar">' + u.username.charAt(0).toUpperCase() + '</div>';
        html += '<div class="info">';
        html += '<div class="uname">' + (u.displayName || u.username) + ' ' + tagHtml + '</div>';
        html += '<div class="email">@' + u.username + '</div>';
        html += '</div></div>';
    }
    DOM.searchResults.innerHTML = html;
    DOM.searchResults.style.display = 'block';
    document.querySelectorAll('.search-result-item').forEach(function(el) {
        el.addEventListener('click', function() {
            openChat(this.dataset.username);
            DOM.searchResults.style.display = 'none';
            if (DOM.searchInput) DOM.searchInput.value = '';
            updateActivity();
        });
    });
}

function showProfile(username) {
    const user = getUserByUsername(username);
    if (!user) return;
    const tags = getUserTags(username);
    if (DOM.profileTags) {
        DOM.profileTags.innerHTML = tags.map(function(t) {
            return '<span class="tag ' + t.class + '">' + t.label + '</span>';
        }).join('');
    }
    if (DOM.profileDisplayName) DOM.profileDisplayName.textContent = user.displayName || user.username;
    if (DOM.profileUsername) DOM.profileUsername.textContent = '@' + user.username;
    if (DOM.profileBio) DOM.profileBio.textContent = user.bio || 'No bio yet';
    if (DOM.profileJoined) DOM.profileJoined.textContent = 'Joined: ' + formatDate(user.created || Date.now());
    if (DOM.profileAge) DOM.profileAge.textContent = 'Age: ' + getAge(user.created || Date.now());
    if (DOM.profileAvatar) DOM.profileAvatar.src = user.avatar || 'icons/user.png';
    if (DOM.profileUserID) DOM.profileUserID.textContent = 'ID: ' + user.username + '-' + (user.created || '').toString().slice(-6);
    if (state.settings.devMode && CONFIG.DEV_PIN) {
        const pinCheck = prompt('Enter developer PIN to view password:');
        if (pinCheck === CONFIG.DEV_PIN && DOM.profilePassword) {
            DOM.profilePassword.style.display = 'block';
            DOM.profilePassword.textContent = 'Password: ' + user.password;
        }
    } else if (DOM.profilePassword) {
        DOM.profilePassword.style.display = 'none';
    }
    if (DOM.profileModal) DOM.profileModal.classList.add('active');
    closeDropdown();
}

function openSettings() {
    const user = state.currentUser;
    if (!user) return;
    if (DOM.settingsDisplayName) DOM.settingsDisplayName.value = user.displayName || '';
    if (DOM.settingsUsername) DOM.settingsUsername.value = user.username;
    if (DOM.settingsPassword) DOM.settingsPassword.value = '';
    if (DOM.settingsBio) DOM.settingsBio.value = user.bio || '';
    if (DOM.settingsAvatar) DOM.settingsAvatar.src = user.avatar || 'icons/user.png';
    const savedSettings = localStorage.getItem('vvn_settings');
    if (savedSettings) {
        state.settings = JSON.parse(savedSettings);
    }
    if (DOM.e2eeToggle) DOM.e2eeToggle.checked = state.settings.e2ee;
    if (DOM.twofaToggle) DOM.twofaToggle.checked = state.settings.twofa;
    if (DOM.privacyToggle) DOM.privacyToggle.checked = state.settings.privacy;
    if (DOM.devToggle) DOM.devToggle.checked = state.settings.devMode;
    if (DOM.e2eeStatus) DOM.e2eeStatus.textContent = state.settings.e2ee ? 'Enabled' : 'Disabled';
    if (DOM.twofaStatus) DOM.twofaStatus.textContent = state.settings.twofa ? 'Enabled' : 'Disabled';
    if (DOM.privacyStatus) DOM.privacyStatus.textContent = state.settings.privacy ? 'Enabled' : 'Disabled';
    if (DOM.devStatus) DOM.devStatus.textContent = state.settings.devMode ? 'Enabled' : 'Disabled';
    if (DOM.autoLockTimer) DOM.autoLockTimer.value = state.settings.autoLock || 'never';
    if (DOM.sessionTimeout) DOM.sessionTimeout.value = state.settings.sessionTimeout || 'never';
    if (DOM.messageHistory) DOM.messageHistory.value = state.settings.messageHistory || 'forever';
    if (DOM.messageDelivery) DOM.messageDelivery.value = state.settings.messageDelivery || 'e2ee';
    applyTheme(state.settings.theme || 'dark');
    if (DOM.settingsModal) DOM.settingsModal.classList.add('active');
    closeDropdown();
}

async function saveSettings() {
    const user = state.currentUser;
    if (!user) return;
    const displayName = DOM.settingsDisplayName ? DOM.settingsDisplayName.value.trim() || user.username : user.username;
    const username = DOM.settingsUsername ? DOM.settingsUsername.value.trim() : user.username;
    const password = DOM.settingsPassword ? DOM.settingsPassword.value.trim() : '';
    const bio = DOM.settingsBio ? DOM.settingsBio.value.trim() : '';
    if (username !== user.username) {
        const existing = state.localCache.users.find(function(u) {
            return u.username === username && u.username !== user.username;
        });
        if (existing) {
            alert('Username already taken');
            return;
        }
    }
    const userIndex = state.localCache.users.findIndex(function(u) {
        return u.username === user.username;
    });
    if (userIndex !== -1) {
        state.localCache.users[userIndex] = {
            ...state.localCache.users[userIndex],
            displayName: displayName,
            username: username,
            password: password || state.localCache.users[userIndex].password,
            bio: bio
        };
        state.currentUser = state.localCache.users[userIndex];
        if (username !== user.username) {
            const session = JSON.parse(localStorage.getItem('vvn_session'));
            if (session) {
                session.username = username;
                localStorage.setItem('vvn_session', JSON.stringify(session));
            }
        }
        localStorage.setItem('vvn_cache', JSON.stringify(state.localCache));
        await pushToRemote();
        renderMessenger();
        if (DOM.settingsModal) DOM.settingsModal.classList.remove('active');
        alert('Settings saved successfully!');
    }
}

function applyTheme(theme) {
    state.settings.theme = theme;
    localStorage.setItem('vvn_settings', JSON.stringify(state.settings));
    document.querySelectorAll('.theme-card').forEach(function(card) {
        card.classList.remove('active');
        if (card.dataset.theme === theme) {
            card.classList.add('active');
        }
    });
    const root = document.documentElement;
    root.style.setProperty('--bg-primary', '');
    root.style.setProperty('--bg-secondary', '');
    root.style.setProperty('--bg-tertiary', '');
    root.style.setProperty('--bg-card', '');
    root.style.setProperty('--text-primary', '');
    root.style.setProperty('--text-secondary', '');
    root.style.setProperty('--charcoal', '');
    root.style.setProperty('--accent-glow', '');
    if (theme === 'dark') {
        root.style.setProperty('--bg-primary', '#0A0A0A');
        root.style.setProperty('--bg-secondary', '#121212');
        root.style.setProperty('--bg-tertiary', '#1A1A1A');
        root.style.setProperty('--bg-card', 'rgba(20,20,20,0.3)');
        root.style.setProperty('--text-primary', '#FFFFFF');
        root.style.setProperty('--text-secondary', '#B2BEB5');
        root.style.setProperty('--charcoal', '#36454F');
        root.style.setProperty('--accent-glow', 'rgba(54,69,79,0.3)');
        root.style.setProperty('--msg-outgoing', 'rgba(255,255,255,0.06)');
        root.style.setProperty('--msg-incoming', 'rgba(255,255,255,0.03)');
        document.body.classList.remove('light-theme');
    } else if (theme === 'light') {
        root.style.setProperty('--bg-primary', '#FFFFFF');
        root.style.setProperty('--bg-secondary', '#F8F6F0');
        root.style.setProperty('--bg-tertiary', '#E5E4E2');
        root.style.setProperty('--bg-card', 'rgba(255,255,255,0.7)');
        root.style.setProperty('--text-primary', '#121212');
        root.style.setProperty('--text-secondary', '#36454F');
        root.style.setProperty('--charcoal', '#36454F');
        root.style.setProperty('--accent-glow', 'rgba(54,69,79,0.15)');
        root.style.setProperty('--msg-outgoing', 'rgba(255,255,255,0.5)');
        root.style.setProperty('--msg-incoming', 'rgba(200,200,200,0.3)');
        document.body.classList.add('light-theme');
    } else {
        root.style.setProperty('--bg-primary', '#0A0A0A');
        root.style.setProperty('--bg-secondary', '#121212');
        root.style.setProperty('--bg-tertiary', '#1A1A1A');
        root.style.setProperty('--bg-card', 'rgba(20,20,20,0.3)');
        root.style.setProperty('--text-primary', '#FFFFFF');
        root.style.setProperty('--text-secondary', '#B2BEB5');
        root.style.setProperty('--charcoal', '#36454F');
        root.style.setProperty('--accent-glow', 'rgba(54,69,79,0.3)');
        root.style.setProperty('--msg-outgoing', 'rgba(255,255,255,0.06)');
        root.style.setProperty('--msg-incoming', 'rgba(255,255,255,0.03)');
        document.body.classList.remove('light-theme');
    }
    if (document.getElementById('customThemeOptions')) {
        document.getElementById('customThemeOptions').style.display = 'none';
    }
}

function applyCustomTheme() {
    const primary = document.getElementById('primaryColor')?.value || '#36454F';
    const secondary = document.getElementById('secondaryColor')?.value || '#121212';
    const text = document.getElementById('textColor')?.value || '#FFFFFF';
    const accent = document.getElementById('accentColor')?.value || '#36454F';
    const root = document.documentElement;
    root.style.setProperty('--charcoal', primary);
    root.style.setProperty('--bg-secondary', secondary);
    root.style.setProperty('--text-primary', text);
    root.style.setProperty('--accent', accent);
    root.style.setProperty('--accent-glow', 'rgba(54,69,79,0.3)');
    root.style.setProperty('--msg-outgoing', primary);
    localStorage.setItem('vvn_custom_theme', JSON.stringify({ primary, secondary, text, accent }));
    state.settings.theme = 'custom';
    localStorage.setItem('vvn_settings', JSON.stringify(state.settings));
    alert('Custom theme applied!');
}

function applyChatTheme() {
    if (DOM.chatMessages && chatSettings.chatTheme) {
        DOM.chatMessages.className = 'chat-messages ' + chatSettings.chatTheme;
    }
}

function toggleSelectionMode() {
    selectionMode = !selectionMode;
    if (selectionMode) {
        if (DOM.selectBtn) DOM.selectBtn.classList.add('active');
        document.querySelectorAll('.message').forEach(function(msg) {
            msg.classList.add('selectable');
        });
        if (DOM.selectionToolbar) DOM.selectionToolbar.classList.add('active');
    } else {
        clearSelection();
        if (DOM.selectBtn) DOM.selectBtn.classList.remove('active');
        document.querySelectorAll('.message').forEach(function(msg) {
            msg.classList.remove('selectable');
        });
        if (DOM.selectionToolbar) DOM.selectionToolbar.classList.remove('active');
    }
    closeDropdown();
}

function toggleMessageSelection(messageId) {
    if (!selectionMode) return;
    const msgElement = document.querySelector('[data-msg-id="' + messageId + '"]');
    if (!msgElement) return;
    if (selectedMessages.has(messageId)) {
        selectedMessages.delete(messageId);
        msgElement.classList.remove('selected');
    } else {
        selectedMessages.add(messageId);
        msgElement.classList.add('selected');
    }
    updateSelectedCount();
}

function clearSelection() {
    selectedMessages.clear();
    document.querySelectorAll('.message.selected').forEach(function(el) {
        el.classList.remove('selected');
    });
    updateSelectedCount();
    selectionMode = false;
    if (DOM.selectBtn) DOM.selectBtn.classList.remove('active');
    document.querySelectorAll('.message').forEach(function(msg) {
        msg.classList.remove('selectable');
    });
    if (DOM.selectionToolbar) DOM.selectionToolbar.classList.remove('active');
}

function updateSelectedCount() {
    if (DOM.selectedCount) {
        DOM.selectedCount.textContent = selectedMessages.size + ' selected';
    }
}

function showDeleteModal() {
    if (selectedMessages.size === 0) return;
    if (DOM.deleteModal) DOM.deleteModal.classList.add('active');
}

function deleteMessages(forEveryone) {
    if (forEveryone === undefined) forEveryone = false;
    const chatKey = getChatKey(state.currentUser.username, state.currentChatPartner);
    const messages = state.localCache.messages[chatKey] || [];
    const remaining = messages.filter(function(msg, index) {
        const msgId = msg.timestamp + '-' + index;
        return !selectedMessages.has(msgId);
    });
    state.localCache.messages[chatKey] = remaining;
    localStorage.setItem('vvn_cache', JSON.stringify(state.localCache));
    pushToRemote();
    clearSelection();
    if (DOM.deleteModal) DOM.deleteModal.classList.remove('active');
    renderMessages(remaining);
    renderChatList();
}

function pinSelectedMessages() {
    if (selectedMessages.size === 0) return;
    const chatKey = getChatKey(state.currentUser.username, state.currentChatPartner);
    const messages = state.localCache.messages[chatKey] || [];
    const firstSelected = Array.from(selectedMessages)[0];
    const parts = firstSelected.split('-');
    const timestamp = parseInt(parts[0]);
    const index = parseInt(parts[1]);
    const msg = messages.find(function(m, i) {
        return m.timestamp === timestamp && i === index;
    });
    if (msg) {
        if (!pinnedMessages[chatKey]) pinnedMessages[chatKey] = [];
        pinnedMessages[chatKey].push(msg);
        showPinnedDock(chatKey);
        localStorage.setItem('vvn_pinned', JSON.stringify(pinnedMessages));
    }
    clearSelection();
}

function showPinnedDock(chatKey) {
    const pinned = pinnedMessages[chatKey] || [];
    if (pinned.length === 0 || !DOM.pinnedDock) {
        DOM.pinnedDock.style.display = 'none';
        return;
    }
    DOM.pinnedDock.style.display = 'block';
    const lastPinned = pinned[pinned.length - 1];
    if (DOM.pinnedMessagePreview) {
        DOM.pinnedMessagePreview.textContent = getDisplayName(lastPinned.sender) + ': ' + (lastPinned.text || '📎 File');
    }
}

function unpinMessage(chatKey) {
    if (pinnedMessages[chatKey]) {
        pinnedMessages[chatKey].pop();
        if (pinnedMessages[chatKey].length === 0) {
            delete pinnedMessages[chatKey];
            if (DOM.pinnedDock) DOM.pinnedDock.style.display = 'none';
        } else {
            showPinnedDock(chatKey);
        }
        localStorage.setItem('vvn_pinned', JSON.stringify(pinnedMessages));
    }
}

function scrollToPinnedMessage() {
    document.querySelectorAll('.message').forEach(function(el) {
        el.classList.remove('highlight');
    });
    const firstMsg = document.querySelector('.message');
    if (firstMsg) {
        firstMsg.classList.add('highlight');
        firstMsg.scrollIntoView({ behavior: 'smooth', block: 'center' });
        setTimeout(function() {
            firstMsg.classList.remove('highlight');
        }, 2000);
    }
}

function openUserSettings() {
    if (DOM.userSettingsModal) DOM.userSettingsModal.classList.add('active');
    closeDropdown();
}

function renameContact() {
    const newName = prompt('Enter new name for this contact:', 
        contactCustomNames[state.currentChatPartner] || state.currentChatPartner);
    if (newName && newName.trim()) {
        contactCustomNames[state.currentChatPartner] = newName.trim();
        localStorage.setItem('vvn_contact_names', JSON.stringify(contactCustomNames));
        renderChatList();
        if (DOM.chatPartnerName) {
            DOM.chatPartnerName.textContent = newName.trim();
        }
    }
}

function deleteContact() {
    if (confirm('Delete contact ' + state.currentChatPartner + '? This will remove the chat from your list.')) {
        const chatKey = getChatKey(state.currentUser.username, state.currentChatPartner);
        delete state.localCache.chats[chatKey];
        localStorage.setItem('vvn_cache', JSON.stringify(state.localCache));
        pushToRemote();
        state.currentChatPartner = null;
        showPlaceholder();
        renderChatList();
        if (DOM.userSettingsModal) DOM.userSettingsModal.classList.remove('active');
    }
}

function blockUser() {
    if (confirm('Block ' + state.currentChatPartner + '? You won\'t receive messages from them.')) {
        if (!blockedUsers.includes(state.currentChatPartner)) {
            blockedUsers.push(state.currentChatPartner);
            localStorage.setItem('vvn_blocked', JSON.stringify(blockedUsers));
            if (DOM.blockUserBtn) DOM.blockUserBtn.style.display = 'none';
            if (DOM.unblockUserBtn) DOM.unblockUserBtn.style.display = 'inline-flex';
        }
    }
}

function unblockUser() {
    const index = blockedUsers.indexOf(state.currentChatPartner);
    if (index > -1) {
        blockedUsers.splice(index, 1);
        localStorage.setItem('vvn_blocked', JSON.stringify(blockedUsers));
        if (DOM.blockUserBtn) DOM.blockUserBtn.style.display = 'inline-flex';
        if (DOM.unblockUserBtn) DOM.unblockUserBtn.style.display = 'none';
    }
}

function pinContact() {
    const pinnedContacts = JSON.parse(localStorage.getItem('vvn_pinned_contacts') || '[]');
    if (!pinnedContacts.includes(state.currentChatPartner)) {
        pinnedContacts.unshift(state.currentChatPartner);
        localStorage.setItem('vvn_pinned_contacts', JSON.stringify(pinnedContacts));
        renderChatList();
    }
}

function openChatSettings() {
    if (DOM.chatSettingsModal) DOM.chatSettingsModal.classList.add('active');
    closeDropdown();
}

function changeBubbleStyle(style) {
    chatSettings.bubbleStyle = style;
    localStorage.setItem('vvn_chat_settings', JSON.stringify(chatSettings));
    document.querySelectorAll('.message').forEach(function(msg) {
        msg.className = msg.className.replace(/bubble-\w+/g, '');
        msg.classList.add('bubble-' + style);
    });
    document.querySelectorAll('.bubble-style').forEach(function(btn) {
        btn.classList.remove('active');
        if (btn.dataset.style === style) btn.classList.add('active');
    });
}

function changeChatBackground(type) {
    if (type === 'custom') {
        if (DOM.bgUpload) DOM.bgUpload.click();
    } else {
        chatSettings.background = type;
        chatSettings.bgImage = null;
        if (DOM.chatMessages) {
            DOM.chatMessages.style.background = '';
            DOM.chatMessages.style.backgroundImage = '';
        }
        localStorage.setItem('vvn_chat_settings', JSON.stringify(chatSettings));
    }
}

function handleBackgroundUpload(e) {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(ev) {
            chatSettings.background = 'custom';
            chatSettings.bgImage = ev.target.result;
            if (DOM.chatMessages) {
                DOM.chatMessages.style.backgroundImage = 'url(' + ev.target.result + ')';
                DOM.chatMessages.style.backgroundSize = 'cover';
                DOM.chatMessages.style.backgroundPosition = 'center';
            }
            localStorage.setItem('vvn_chat_settings', JSON.stringify(chatSettings));
        };
        reader.readAsDataURL(file);
    }
}

function applyChatBackground() {
    if (chatSettings.background === 'custom' && chatSettings.bgImage && DOM.chatMessages) {
        DOM.chatMessages.style.backgroundImage = 'url(' + chatSettings.bgImage + ')';
        DOM.chatMessages.style.backgroundSize = 'cover';
        DOM.chatMessages.style.backgroundPosition = 'center';
    } else if (DOM.chatMessages) {
        DOM.chatMessages.style.background = '';
        DOM.chatMessages.style.backgroundImage = '';
    }
}

function createNote() {
    const note = prompt('Enter your note:');
    if (note && note.trim()) {
        const notes = JSON.parse(localStorage.getItem('vvn_notes') || '[]');
        notes.push({
            id: Date.now(),
            text: note.trim(),
            created: Date.now()
        });
        localStorage.setItem('vvn_notes', JSON.stringify(notes));
        alert('Note saved!');
    }
}

function openFileModal() {
    if (DOM.fileModal) DOM.fileModal.classList.add('active');
    if (DOM.filePreviewContainer) DOM.filePreviewContainer.innerHTML = '';
    if (DOM.fileCaption) DOM.fileCaption.value = '';
    if (DOM.fileClearBtn) DOM.fileClearBtn.style.display = 'none';
    pendingFiles = [];
}

function handleFileSelect() {
    if (DOM.fileInput) DOM.fileInput.click();
}

function handleFileInput(e) {
    const files = e.target.files;
    if (!files.length) return;
    for (const file of files) {
        const reader = new FileReader();
        reader.onload = function(ev) {
            const data = ev.target.result;
            let fileType = 'file';
            if (file.type.startsWith('image/')) fileType = 'image';
            else if (file.type.startsWith('video/')) fileType = 'video';
            else if (file.type.startsWith('audio/')) fileType = 'audio';
            pendingFiles.push({
                data: data,
                type: fileType,
                name: file.name,
                size: (file.size / 1024).toFixed(1) + ' KB'
            });
            if (DOM.filePreviewContainer) {
                const item = document.createElement('div');
                item.className = 'file-preview-item';
                const index = pendingFiles.length - 1;
                let preview = '';
                if (fileType === 'image') {
                    preview = '<img src="' + data + '" />';
                } else if (fileType === 'video') {
                    preview = '<video controls><source src="' + data + '" /></video>';
                } else if (fileType === 'audio') {
                    preview = '<div style="padding:10px;background:var(--bg-input);border-radius:8px;max-width:120px;">🎵 ' + file.name + '</div>';
                } else {
                    preview = '<div style="padding:10px;background:var(--bg-input);border-radius:8px;max-width:120px;">📄 ' + file.name + '</div>';
                }
                item.innerHTML = preview + '<button class="remove-file" data-index="' + index + '">×</button>';
                DOM.filePreviewContainer.appendChild(item);
                item.querySelector('.remove-file').addEventListener('click', function() {
                    const idx = parseInt(this.dataset.index);
                    pendingFiles.splice(idx, 1);
                    this.parentElement.remove();
                    if (pendingFiles.length === 0 && DOM.fileClearBtn) {
                        DOM.fileClearBtn.style.display = 'none';
                    }
                });
            }
            if (DOM.fileClearBtn) DOM.fileClearBtn.style.display = 'inline-flex';
        };
        reader.readAsDataURL(file);
    }
    e.target.value = '';
}

function clearAllFiles() {
    pendingFiles = [];
    if (DOM.filePreviewContainer) DOM.filePreviewContainer.innerHTML = '';
    if (DOM.fileClearBtn) DOM.fileClearBtn.style.display = 'none';
    if (DOM.fileCaption) DOM.fileCaption.value = '';
}

function loadSavedSettings() {
    const names = localStorage.getItem('vvn_contact_names');
    if (names) contactCustomNames = JSON.parse(names);
    const pinned = localStorage.getItem('vvn_pinned');
    if (pinned) pinnedMessages = JSON.parse(pinned);
    const settings = localStorage.getItem('vvn_chat_settings');
    if (settings) chatSettings = JSON.parse(settings);
    const blocked = localStorage.getItem('vvn_blocked');
    if (blocked) blockedUsers = JSON.parse(blocked);
    const savedSettings = localStorage.getItem('vvn_settings');
    if (savedSettings) {
        state.settings = JSON.parse(savedSettings);
    }
}

function updateMobileView() {
    state.isMobile = window.innerWidth < 768;
    const sidebar = document.getElementById('sidebar');
    if (state.isMobile) {
        if (state.currentChatPartner) {
            if (sidebar) sidebar.classList.add('hide-mobile');
            if (DOM.chatArea) DOM.chatArea.classList.add('active-mobile');
        } else {
            if (sidebar) sidebar.classList.remove('hide-mobile');
            if (DOM.chatArea) DOM.chatArea.classList.remove('active-mobile');
        }
    } else {
        if (sidebar) sidebar.classList.remove('hide-mobile');
        if (DOM.chatArea) DOM.chatArea.classList.remove('active-mobile');
    }
}

function openGeneralSettings() {
    if (DOM.generalSettingsModal) DOM.generalSettingsModal.classList.add('active');
    closeDropdown();
}

function logoutFromGeneral() {
    if (confirm('Are you sure you want to logout?')) {
        if (DOM.generalSettingsModal) DOM.generalSettingsModal.classList.remove('active');
        logout();
    }
}

function switchDevice() {
    if (DOM.generalSettingsModal) DOM.generalSettingsModal.classList.remove('active');
    logout();
    showDeviceSelection();
}

async function init() {
    console.log('🚀 Initializing VVN...');
    if (DOM.loadingOverlay) {
        DOM.loadingOverlay.classList.remove('hidden');
    }
    updateLoading(5);
    loadSavedSettings();
    if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission();
    }
    const savedDevice = localStorage.getItem('vvn_device');
    if (savedDevice && typeof applyDeviceLayout === 'function') {
        state.deviceType = savedDevice;
        applyDeviceLayout(savedDevice);
    } else if (typeof detectDevice === 'function') {
        const detected = detectDevice();
        state.deviceType = detected;
        applyDeviceLayout(detected);
    }
    const cached = localStorage.getItem('vvn_cache');
    if (cached) {
        try {
            state.localCache = JSON.parse(cached);
            console.log('📦 Loaded from cache:', state.localCache.users.length, 'users');
            updateLoading(40);
        } catch (e) {
            console.warn('Cache parse error, using defaults');
            state.localCache = { users: [], chats: {}, messages: {} };
        }
    } else {
        state.localCache = { users: [], chats: {}, messages: {} };
        if (!state.localCache.users.find(function(u) { return u.username === 'vaultnet'; })) {
            state.localCache.users.push({
                username: 'vaultnet',
                displayName: 'VaultNet',
                password: 'admin123',
                bio: 'Creator of VVN',
                online: true,
                created: Date.now(),
                avatar: '',
                rainbow: false,
                status: ''
            });
        }
        localStorage.setItem('vvn_cache', JSON.stringify(state.localCache));
    }
    updateLoading(50);
    try {
        const remote = await fetchFromBin();
        if (remote) {
            state.localCache = {
                users: remote.users || [],
                chats: remote.chats || {},
                messages: remote.messages || {}
            };
            if (!state.localCache.users.find(function(u) { return u.username === 'vaultnet'; })) {
                state.localCache.users.push({
                    username: 'vaultnet',
                    displayName: 'VaultNet',
                    password: 'admin123',
                    bio: 'Creator of VVN',
                    online: true,
                    created: Date.now(),
                    avatar: '',
                    rainbow: false,
                    status: ''
                });
            }
            localStorage.setItem('vvn_cache', JSON.stringify(state.localCache));
            console.log('✅ Loaded from JSONBin:', state.localCache.users.length, 'users');
        }
    } catch (e) {
        console.warn('Background sync failed, using cache');
    }
    updateLoading(80);
    if (state.settings.theme) {
        applyTheme(state.settings.theme);
    }
    updateLoading(90);
    const session = JSON.parse(localStorage.getItem('vvn_session'));
    if (session) {
        const user = state.localCache.users.find(function(u) { return u.username === session.username; });
        if (user) {
            state.currentUser = user;
            renderMessenger();
            if (state.syncInterval) clearInterval(state.syncInterval);
            state.syncInterval = setInterval(syncWithRemote, CONFIG.SYNC_INTERVAL);
            updateLoading(100);
            return;
        } else {
            localStorage.removeItem('vvn_session');
        }
    }
    showDeviceSelection();
    updateLoading(100);
}

document.addEventListener('DOMContentLoaded', function() {
    document.querySelectorAll('.auth-tab').forEach(function(tab) {
        tab.addEventListener('click', function() {
            document.querySelectorAll('.auth-tab').forEach(function(t) { t.classList.remove('active'); });
            this.classList.add('active');
            document.querySelectorAll('.auth-form').forEach(function(f) { f.classList.remove('active'); });
            const form = document.getElementById(this.dataset.tab + 'Form');
            if (form) form.classList.add('active');
        });
    });
    if (DOM.loginForm) {
        DOM.loginForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            const username = DOM.loginUsername ? DOM.loginUsername.value.trim() : '';
            const password = DOM.loginPassword ? DOM.loginPassword.value.trim() : '';
            if (!username || !password) {
                if (DOM.authError) {
                    DOM.authError.textContent = 'Please fill in all fields';
                    DOM.authError.style.display = 'block';
                }
                return;
            }
            await loginUser(username, password);
        });
    }
    if (DOM.registerForm) {
        DOM.registerForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            const username = DOM.regUsername ? DOM.regUsername.value.trim() : '';
            const displayName = DOM.regDisplayName ? DOM.regDisplayName.value.trim() : '';
            const password = DOM.regPassword ? DOM.regPassword.value.trim() : '';
            if (!username || !password) {
                if (DOM.regError) {
                    DOM.regError.textContent = 'Username and password required';
                    DOM.regError.style.display = 'block';
                }
                return;
            }
            if (username.length < 3) {
                if (DOM.regError) {
                    DOM.regError.textContent = 'Username must be at least 3 characters';
                    DOM.regError.style.display = 'block';
                }
                return;
            }
            await registerUser(username, displayName, password);
        });
    }
    if (DOM.sendBtn) {
        DOM.sendBtn.addEventListener('click', sendMessage);
    }
    if (DOM.messageInput) {
        DOM.messageInput.addEventListener('keydown', function(e) {
            if (e.key === 'Enter') sendMessage();
            updateActivity();
            if (state.currentChatPartner) {
                showTypingIndicator();
            }
        });
        DOM.messageInput.addEventListener('blur', function() {
            hideTypingIndicator();
        });
        DOM.messageInput.addEventListener('input', function() {
            saveDraft();
        });
    }
    if (DOM.micBtn) {
        DOM.micBtn.addEventListener('mousedown', startVoiceRecording);
        DOM.micBtn.addEventListener('mouseup', stopVoiceRecording);
        DOM.micBtn.addEventListener('mouseleave', stopVoiceRecording);
        DOM.micBtn.addEventListener('touchstart', function(e) {
            e.preventDefault();
            startVoiceRecording();
        });
        DOM.micBtn.addEventListener('touchend', function(e) {
            e.preventDefault();
            stopVoiceRecording();
        });
    }
    if (DOM.searchInput) {
        DOM.searchInput.addEventListener('input', function() {
            searchUsers(this.value);
        });
    }
    document.addEventListener('click', function(e) {
        if (!e.target.closest('.search-wrap') && DOM.searchResults) {
            DOM.searchResults.style.display = 'none';
        }
    });
    if (DOM.backBtn) {
        DOM.backBtn.addEventListener('click', function() {
            if (state.isMobile) {
                const sidebar = document.getElementById('sidebar');
                if (sidebar) sidebar.classList.remove('hide-mobile');
                if (DOM.chatArea) DOM.chatArea.classList.remove('active-mobile');
                state.currentChatPartner = null;
                showPlaceholder();
                renderChatList();
            }
        });
    }
    if (DOM.profileBtn) {
        DOM.profileBtn.addEventListener('click', function() {
            if (state.currentChatPartner) {
                showProfile(state.currentChatPartner);
            }
        });
    }
    if (DOM.chatHeaderInfo) {
        DOM.chatHeaderInfo.addEventListener('click', function() {
            if (state.currentChatPartner) {
                showProfile(state.currentChatPartner);
            }
        });
    }
    if (DOM.settingsBtn) {
        DOM.settingsBtn.addEventListener('click', openSettings);
    }
    if (DOM.settingsClose) {
        DOM.settingsClose.addEventListener('click', function() {
            if (DOM.settingsModal) DOM.settingsModal.classList.remove('active');
        });
    }
    document.querySelectorAll('.settings-tab').forEach(function(tab) {
        tab.addEventListener('click', function() {
            document.querySelectorAll('.settings-tab').forEach(function(t) { t.classList.remove('active'); });
            this.classList.add('active');
            document.querySelectorAll('.settings-panel').forEach(function(p) { p.classList.remove('active'); });
            const panel = document.getElementById(this.dataset.tab + 'Settings');
            if (panel) panel.classList.add('active');
        });
    });
    if (DOM.saveSettings) {
        DOM.saveSettings.addEventListener('click', saveSettings);
    }
    if (DOM.e2eeToggle) {
        DOM.e2eeToggle.addEventListener('change', function() {
            state.settings.e2ee = this.checked;
            if (DOM.e2eeStatus) DOM.e2eeStatus.textContent = this.checked ? 'Enabled' : 'Disabled';
            localStorage.setItem('vvn_settings', JSON.stringify(state.settings));
        });
    }
    if (DOM.twofaToggle) {
        DOM.twofaToggle.addEventListener('change', function() {
            state.settings.twofa = this.checked;
            if (DOM.twofaStatus) DOM.twofaStatus.textContent = this.checked ? 'Enabled' : 'Disabled';
            localStorage.setItem('vvn_settings', JSON.stringify(state.settings));
        });
    }
    if (DOM.privacyToggle) {
        DOM.privacyToggle.addEventListener('change', function() {
            state.settings.privacy = this.checked;
            if (DOM.privacyStatus) DOM.privacyStatus.textContent = this.checked ? 'Enabled' : 'Disabled';
            localStorage.setItem('vvn_settings', JSON.stringify(state.settings));
        });
    }
    if (DOM.devToggle) {
        DOM.devToggle.addEventListener('change', function() {
            state.settings.devMode = this.checked;
            if (DOM.devStatus) DOM.devStatus.textContent = this.checked ? 'Enabled' : 'Disabled';
            localStorage.setItem('vvn_settings', JSON.stringify(state.settings));
        });
    }
    if (DOM.autoLockTimer) {
        DOM.autoLockTimer.addEventListener('change', function() {
            state.settings.autoLock = this.value;
            localStorage.setItem('vvn_settings', JSON.stringify(state.settings));
            resetAutoLock();
        });
    }
    if (DOM.sessionTimeout) {
        DOM.sessionTimeout.addEventListener('change', function() {
            state.settings.sessionTimeout = this.value;
            localStorage.setItem('vvn_settings', JSON.stringify(state.settings));
        });
    }
    if (DOM.messageHistory) {
        DOM.messageHistory.addEventListener('change', function() {
            state.settings.messageHistory = this.value;
            localStorage.setItem('vvn_settings', JSON.stringify(state.settings));
        });
    }
    if (DOM.messageDelivery) {
        DOM.messageDelivery.addEventListener('change', function() {
            state.settings.messageDelivery = this.value;
            localStorage.setItem('vvn_settings', JSON.stringify(state.settings));
        });
    }
    document.querySelectorAll('.theme-card').forEach(function(card) {
        card.addEventListener('click', function() {
            const theme = this.dataset.theme;
            applyTheme(theme);
            if (theme !== 'custom') {
                document.getElementById('customThemeOptions').style.display = 'none';
            }
        });
    });
    if (DOM.applyCustomTheme) {
        DOM.applyCustomTheme.addEventListener('click', applyCustomTheme);
    }
    if (DOM.avatarUpload) {
        DOM.avatarUpload.addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function(ev) {
                    if (DOM.settingsAvatar) DOM.settingsAvatar.src = ev.target.result;
                    const user = state.currentUser;
                    if (user) {
                        user.avatar = ev.target.result;
                        const userIndex = state.localCache.users.findIndex(function(u) {
                            return u.username === user.username;
                        });
                        if (userIndex !== -1) {
                            state.localCache.users[userIndex] = user;
                            localStorage.setItem('vvn_cache', JSON.stringify(state.localCache));
                            pushToRemote();
                        }
                    }
                };
                reader.readAsDataURL(file);
            }
        });
    }
    if (DOM.modalClose) {
        DOM.modalClose.addEventListener('click', function() {
            if (DOM.profileModal) DOM.profileModal.classList.remove('active');
        });
    }
    if (DOM.profileModal) {
        const overlay = DOM.profileModal.querySelector('.modal-overlay');
        if (overlay) {
            overlay.addEventListener('click', function() {
                DOM.profileModal.classList.remove('active');
            });
        }
    }
    if (DOM.manualSyncBtn) {
        DOM.manualSyncBtn.addEventListener('click', syncWithRemote);
    }
    document.querySelectorAll('.device-option').forEach(function(btn) {
        btn.addEventListener('click', function() {
            const device = this.dataset.device;
            selectDevice(device);
        });
    });
    if (DOM.autoDetectBtn) {
        DOM.autoDetectBtn.addEventListener('click', function() {
            if (typeof detectDevice === 'function') {
                const detected = detectDevice();
                selectDevice(detected);
            }
        });
    }
    if (DOM.chatDropdownBtn) {
        DOM.chatDropdownBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            toggleDropdown();
        });
    }
    document.querySelectorAll('.dropdown-item').forEach(function(item) {
        item.addEventListener('click', function() {
            const action = this.dataset.action;
            if (action === 'reaction') {
                const subItems = this.querySelectorAll('.sub-dropdown .dropdown-item');
                if (subItems.length) {
                    const subDropdown = this.querySelector('.sub-dropdown');
                    if (subDropdown) {
                        subDropdown.style.display = subDropdown.style.display === 'block' ? 'none' : 'block';
                    }
                    return;
                }
            }
            handleDropdownAction(action);
            closeDropdown();
        });
    });
    document.querySelectorAll('.sub-dropdown .dropdown-item').forEach(function(item) {
        item.addEventListener('click', function(e) {
            e.stopPropagation();
            const reaction = this.dataset.reaction;
            if (reaction && state.currentChatPartner) {
                const chatKey = getChatKey(state.currentUser.username, state.currentChatPartner);
                const messages = state.localCache.messages[chatKey] || [];
                if (messages.length > 0) {
                    const lastMsg = messages[messages.length - 1];
                    const msgId = lastMsg.timestamp + '-' + (messages.length - 1);
                    addReaction(msgId, reaction);
                }
            }
            closeDropdown();
        });
    });
    document.addEventListener('click', function(e) {
        if (!e.target.closest('.dropdown-trigger') && !e.target.closest('.dropdown-menu')) {
            closeDropdown();
        }
    });
    if (DOM.selectBtn) {
        DOM.selectBtn.addEventListener('click', toggleSelectionMode);
    }
    document.addEventListener('click', function(e) {
        const msgEl = e.target.closest('.message');
        if (msgEl && selectionMode) {
            const msgId = msgEl.dataset.msgId;
            if (msgId) toggleMessageSelection(msgId);
        }
    });
    if (DOM.deleteSelectedBtn) {
        DOM.deleteSelectedBtn.addEventListener('click', showDeleteModal);
    }
    if (DOM.pinSelectedBtn) {
        DOM.pinSelectedBtn.addEventListener('click', pinSelectedMessages);
    }
    if (DOM.cancelSelectionBtn) {
        DOM.cancelSelectionBtn.addEventListener('click', clearSelection);
    }
    if (DOM.deleteForMeBtn) {
        DOM.deleteForMeBtn.addEventListener('click', function() { deleteMessages(false); });
    }
    if (DOM.deleteForEveryoneBtn) {
        DOM.deleteForEveryoneBtn.addEventListener('click', function() { deleteMessages(true); });
    }
    if (DOM.deleteModalClose) {
        DOM.deleteModalClose.addEventListener('click', function() {
            DOM.deleteModal.classList.remove('active');
        });
    }
    if (DOM.unpinBtn) {
        DOM.unpinBtn.addEventListener('click', function() {
            const chatKey = getChatKey(state.currentUser?.username, state.currentChatPartner);
            if (chatKey) unpinMessage(chatKey);
        });
    }
    if (DOM.pinnedMessagePreview) {
        DOM.pinnedMessagePreview.addEventListener('click', scrollToPinnedMessage);
    }
    if (DOM.userSettingsBtn) {
        DOM.userSettingsBtn.addEventListener('click', openUserSettings);
    }
    if (DOM.userSettingsClose) {
        DOM.userSettingsClose.addEventListener('click', function() {
            DOM.userSettingsModal.classList.remove('active');
        });
    }
    if (DOM.renameContactBtn) {
        DOM.renameContactBtn.addEventListener('click', renameContact);
    }
    if (DOM.deleteContactBtn) {
        DOM.deleteContactBtn.addEventListener('click', deleteContact);
    }
    if (DOM.blockUserBtn) {
        DOM.blockUserBtn.addEventListener('click', blockUser);
    }
    if (DOM.unblockUserBtn) {
        DOM.unblockUserBtn.addEventListener('click', unblockUser);
    }
    if (DOM.pinContactBtn) {
        DOM.pinContactBtn.addEventListener('click', pinContact);
    }
    if (DOM.chatSettingsBtn) {
        DOM.chatSettingsBtn.addEventListener('click', openChatSettings);
    }
    if (DOM.chatSettingsClose) {
        DOM.chatSettingsClose.addEventListener('click', function() {
            DOM.chatSettingsModal.classList.remove('active');
        });
    }
    document.querySelectorAll('.bubble-style').forEach(function(btn) {
        btn.addEventListener('click', function() {
            changeBubbleStyle(this.dataset.style);
        });
    });
    if (DOM.bgDefault) {
        DOM.bgDefault.addEventListener('click', function() { changeChatBackground('default'); });
    }
    if (DOM.bgCustom) {
        DOM.bgCustom.addEventListener('click', function() { changeChatBackground('custom'); });
    }
    if (DOM.bgUpload) {
        DOM.bgUpload.addEventListener('change', handleBackgroundUpload);
    }
    if (DOM.createNoteBtn) {
        DOM.createNoteBtn.addEventListener('click', createNote);
    }
    if (DOM.clipBtn) {
        DOM.clipBtn.addEventListener('click', openFileModal);
    }
    if (DOM.fileModalClose) {
        DOM.fileModalClose.addEventListener('click', function() {
            DOM.fileModal.classList.remove('active');
        });
    }
    if (DOM.fileSelectBtn) {
        DOM.fileSelectBtn.addEventListener('click', handleFileSelect);
    }
    if (DOM.fileInput) {
        DOM.fileInput.addEventListener('change', handleFileInput);
    }
    if (DOM.fileClearBtn) {
        DOM.fileClearBtn.addEventListener('click', clearAllFiles);
    }
    if (DOM.fileSendBtn) {
        DOM.fileSendBtn.addEventListener('click', sendMessage);
    }
    document.querySelectorAll('.modal-overlay').forEach(function(overlay) {
        overlay.addEventListener('click', function() {
            this.parentElement.classList.remove('active');
        });
    });
    document.addEventListener('click', updateActivity);
    document.addEventListener('keydown', updateActivity);
    document.addEventListener('mousemove', updateActivity);
    window.addEventListener('resize', function() {
        updateMobileView();
        if (typeof applyDeviceLayout === 'function') {
            applyDeviceLayout(state.deviceType);
        }
    });
    document.addEventListener('mousemove', function(e) {
        document.querySelectorAll('.shine-effect, .shine-hover').forEach(function(el) {
            const rect = el.getBoundingClientRect();
            const x = ((e.clientX - rect.left) / rect.width) * 100;
            const y = ((e.clientY - rect.top) / rect.height) * 100;
            el.style.setProperty('--mouse-x', x + '%');
            el.style.setProperty('--mouse-y', y + '%');
        });
    });
    if (DOM.generalSettingsBtn) {
        DOM.generalSettingsBtn.addEventListener('click', openGeneralSettings);
    }
    if (DOM.generalSettingsClose) {
        DOM.generalSettingsClose.addEventListener('click', function() {
            if (DOM.generalSettingsModal) DOM.generalSettingsModal.classList.remove('active');
        });
    }
    if (DOM.logoutBtn) {
        DOM.logoutBtn.addEventListener('click', logoutFromGeneral);
    }
    if (DOM.deviceSwitchBtn) {
        DOM.deviceSwitchBtn.addEventListener('click', switchDevice);
    }
    init();
    console.log('🚀 VVN Messenger started!');
    console.log('👤 Default owner: vaultnet');
    console.log('🔐 Password: admin123');
    console.log('🔑 Developer PIN:', CONFIG.DEV_PIN);
    console.log('📱 Messages sync every', CONFIG.SYNC_INTERVAL/1000, 'seconds');
    console.log('🎨 5 Themes available: Dark, Light, Midnight, Forest, Ocean');
    console.log('🔒 Message delivery: End-to-End Encrypted');
    console.log('🎤 Voice messages supported!');
    console.log('📎 File sharing supported!');
    console.log('🎮 Rock Paper Scissors game available!');
    console.log('🌈 Rainbow name feature available!');
    console.log('📅 Scheduled messages available!');
    console.log('💬 Quick replies available!');
    console.log('😊 Message reactions available!');
    console.log('📊 Message stats available!');
    console.log('🎨 Chat themes available!');
    console.log('🖼️ Sticker packs available!');
    console.log('🎬 GIF support available!');
    console.log('📊 Polls available!');
    console.log('🎮 Mini games available!');
    console.log('🔍 Message search available!');
    console.log('📨 Message forwarding available!');
    console.log('🗨️ Reply to messages available!');
    console.log('✏️ Edit messages available!');
    console.log('🌐 Message translation available!');
    console.log('🎵 Voice speed control available!');
    console.log('💾 Message drafts available!');
});
