(function() {
    'use strict';

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
            theme: 'dark',
            readReceipts: true,
            bubbleColor: '#36454F',
            bubbleShape: 'rounded',
            fontSize: 'medium',
            timestampFormat: '12h'
        },
        loadingComplete: false,
        deviceType: 'pc',
        typingTimeout: null,
        isTyping: false,
        firstSyncDone: false,
        vantaEffect: null,
        loadingTimeout: null
    };

    const CONFIG = window.CONFIG || {
        BIN_ID: '6a5222dbda38895dfe4ef18e',
        MASTER_KEY: '$2a$10$xpnzNbyjOgRS6s..YVAMhOqwuj/FOPnU15M2J9uSwHBsRJAygi1Lu',
        OWNERS: ['VaultNet'],
        CEOS: ['VaultNet'],
        DEVS: ['VaultNet'],
        ADMINS: ['VaultNet'],
        MODS: ['VaultNet'],
        XTRA: ['VaultNet'],
        STAFF: ['VaultNet'],
        DEV_PIN: '2356-23543-13451-78901-23456',
        SYNC_INTERVAL: 5000
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
        messageInput: document.getElementById('messageInput'),
        sendBtn: document.getElementById('sendBtn'),
        backBtn: document.getElementById('backBtn'),
        settingsBtn: document.getElementById('settingsBtn'),
        manualSyncBtn: document.getElementById('manualSyncBtn'),
        profileModal: document.getElementById('profileModal'),
        profileAvatar: document.getElementById('profileAvatar'),
        profileDisplayName: document.getElementById('profileDisplayName'),
        profileUsername: document.getElementById('profileUsername'),
        profileBio: document.getElementById('profileBio'),
        profileJoined: document.getElementById('profileJoined'),
        profileTags: document.getElementById('profileTags'),
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
        readReceiptsToggle: document.getElementById('readReceiptsToggle'),
        autoLockTimer: document.getElementById('autoLockTimer'),
        chatDropdownBtn: document.getElementById('chatDropdownBtn'),
        dropdownMenu: document.getElementById('dropdownMenu'),
        autoDetectBtn: document.getElementById('autoDetectBtn'),
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
        selectionToolbar: document.getElementById('selectionToolbar'),
        selectedCount: document.getElementById('selectedCount'),
        deleteSelectedBtn: document.getElementById('deleteSelectedBtn'),
        pinSelectedBtn: document.getElementById('pinSelectedBtn'),
        forwardSelectedBtn: document.getElementById('forwardSelectedBtn'),
        cancelSelectionBtn: document.getElementById('cancelSelectionBtn'),
        pinnedDock: document.getElementById('pinnedDock'),
        pinnedMessagePreview: document.getElementById('pinnedMessagePreview'),
        unpinBtn: document.getElementById('unpinBtn'),
        deleteModal: document.getElementById('deleteModal'),
        deleteModalClose: document.getElementById('deleteModalClose'),
        deleteForMeBtn: document.getElementById('deleteForMeBtn'),
        deleteForEveryoneBtn: document.getElementById('deleteForEveryoneBtn'),
        bgDefault: document.getElementById('bgDefault'),
        bgCustom: document.getElementById('bgCustom'),
        bgUpload: document.getElementById('bgUpload'),
        bubbleColorPicker: document.getElementById('bubbleColorPicker'),
        applyBubbleColor: document.getElementById('applyBubbleColor'),
        fontSizeSelect: document.getElementById('fontSizeSelect'),
        logoutBtn: document.getElementById('logoutBtn'),
        clearDataBtn: document.getElementById('clearDataBtn'),
        autoDetectLayoutBtn: document.getElementById('autoDetectLayoutBtn'),
        funPanel: document.getElementById('funPanel'),
        stickerGrid: document.getElementById('stickerGrid'),
        gifGrid: document.getElementById('gifGrid'),
        pollBtn: document.getElementById('pollBtn'),
        gameBtn: document.getElementById('gameBtn'),
        smileBtn: document.getElementById('smileBtn'),
        serverList: document.getElementById('serverList')
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
        bubbleColor: '#36454F',
        fontSize: 'medium',
        timestampFormat: '12h'
    };
    let pendingFiles = [];
    let autoLockTimeout = null;
    let lastActivity = Date.now();
    let isRecording = false;
    let mediaRecorder = null;
    let audioChunks = [];
    let recordingSeconds = 0;
    let recordingInterval = null;

    const SAMPLE_GIFS = [
        'https://media.giphy.com/media/3o7abKhOpu0N9H8s9G/giphy.gif',
        'https://media.giphy.com/media/3o7aTskHEUdgCQAXde/giphy.gif',
        'https://media.giphy.com/media/26BRv0ThflsHCqDrG/giphy.gif',
        'https://media.giphy.com/media/3o6ZtqY0XUyP5qXqQo/giphy.gif'
    ];

    function formatTime(ts) {
        const d = new Date(ts);
        if (chatSettings.timestampFormat === 'relative') {
            const diff = Math.floor((Date.now() - ts) / 1000);
            if (diff < 60) return 'Just now';
            if (diff < 3600) return Math.floor(diff / 60) + 'm ago';
            if (diff < 86400) return Math.floor(diff / 3600) + 'h ago';
            if (diff < 604800) return Math.floor(diff / 86400) + 'd ago';
            return formatDate(ts);
        }
        if (chatSettings.timestampFormat === '24h') {
            return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
        }
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
        const u = username;
        if (CONFIG.OWNERS && CONFIG.OWNERS.includes(u)) tags.push({ label: 'OWNER', class: 'tag-owner' });
        if (CONFIG.CEOS && CONFIG.CEOS.includes(u)) tags.push({ label: 'CEO', class: 'tag-ceo' });
        if (CONFIG.DEVS && CONFIG.DEVS.includes(u)) tags.push({ label: 'DEV', class: 'tag-dev' });
        if (CONFIG.ADMINS && CONFIG.ADMINS.includes(u)) tags.push({ label: 'ADMIN', class: 'tag-admin' });
        if (CONFIG.MODS && CONFIG.MODS.includes(u)) tags.push({ label: 'MOD', class: 'tag-mod' });
        if (CONFIG.XTRA && CONFIG.XTRA.includes(u)) tags.push({ label: 'XTRA', class: 'tag-xtra' });
        if (CONFIG.STAFF && CONFIG.STAFF.includes(u)) tags.push({ label: 'STAFF', class: 'tag-staff' });
        if (tags.length === 0) {
            const user = getUserByUsername(username);
            if (user && user.created) {
                const age = Date.now() - user.created;
                if (age > 30 * 24 * 60 * 60 * 1000) tags.push({ label: 'MEMBER', class: 'tag-member' });
                else tags.push({ label: 'GUEST', class: 'tag-guest' });
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
        if (DOM.loaderFill) DOM.loaderFill.style.width = p + '%';
        if (p >= 100 && !state.loadingComplete) {
            state.loadingComplete = true;
            // Use setTimeout to ensure the UI updates
            setTimeout(function() {
                if (DOM.loadingOverlay) {
                    DOM.loadingOverlay.style.opacity = '0';
                    setTimeout(function() {
                        DOM.loadingOverlay.style.display = 'none';
                        // Initialize Lucide icons after loading
                        if (typeof lucide !== 'undefined') {
                            lucide.createIcons();
                        }
                    }, 400);
                }
            }, 300);
        }
    }

    function setStatus(text, color) {
        console.log('Status:', text, color);
    }

    async function fetchFromBin() {
        try {
            const resp = await fetch('https://api.jsonbin.io/v3/b/' + CONFIG.BIN_ID, {
                headers: { 'X-Master-Key': CONFIG.MASTER_KEY, 'X-Bin-Meta': 'false' }
            });
            if (!resp.ok) { return null; }
            const data = await resp.json();
            return data;
        } catch (e) {
            return null;
        }
    }

    async function updateBin(data) {
        try {
            const resp = await fetch('https://api.jsonbin.io/v3/b/' + CONFIG.BIN_ID, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'X-Master-Key': CONFIG.MASTER_KEY, 'X-Bin-Meta': 'false' },
                body: JSON.stringify(data)
            });
            if (!resp.ok) { return false; }
            return true;
        } catch (e) {
            return false;
        }
    }

    async function syncWithRemote() {
        if (state.firstSyncDone) { return true; }
        const remote = await fetchFromBin();
        if (remote) {
            const remoteUsers = remote.users || [];
            const remoteChats = remote.chats || {};
            const remoteMessages = remote.messages || {};
            const localMessages = state.localCache.messages || {};
            for (const [key, msgs] of Object.entries(remoteMessages)) {
                if (!localMessages[key]) { localMessages[key] = msgs; }
                else if (msgs.length > localMessages[key].length) {
                    const newMsgs = msgs.slice(localMessages[key].length);
                    for (const msg of newMsgs) {
                        if (msg.sender !== state.currentUser?.username) {
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
                if (!mergedUsers.find(u => u.username === rUser.username)) mergedUsers.push(rUser);
            }
            state.localCache.users = mergedUsers;
            state.localCache.chats = { ...remoteChats, ...state.localCache.chats };
            state.localCache.messages = localMessages;
            localStorage.setItem('vvn_cache', JSON.stringify(state.localCache));
            state.firstSyncDone = true;
            if (state.currentUser) {
                renderChatList();
                if (state.currentChatPartner) renderMessagesForPartner(state.currentChatPartner);
            }
            return true;
        }
        state.firstSyncDone = true;
        return true;
    }

    async function pushToRemote() {
        const success = await updateBin(state.localCache);
        return success;
    }

    function showDeviceSelection() {
        if (DOM.deviceScreen) DOM.deviceScreen.style.display = 'flex';
        if (DOM.authScreen) DOM.authScreen.style.display = 'none';
        if (DOM.messenger) DOM.messenger.style.display = 'none';
        // Force hide loading overlay if still visible
        if (DOM.loadingOverlay) {
            DOM.loadingOverlay.style.display = 'none';
        }
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    }

    function selectDevice(deviceType) {
        state.deviceType = deviceType;
        localStorage.setItem('vvn_device', deviceType);
        if (typeof applyDeviceLayout === 'function') applyDeviceLayout(deviceType);
        if (DOM.deviceScreen) DOM.deviceScreen.style.display = 'none';
        if (DOM.authScreen) DOM.authScreen.style.display = 'flex';
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
        adjustDiscordLayout(deviceType);
    }

    function adjustDiscordLayout(deviceType) {
        const isMobile = deviceType === 'phone';
        const channelList = document.getElementById('channelList');
        if (isMobile) {
            if (channelList) channelList.classList.remove('active');
            if (state.currentChatPartner) {
                document.querySelector('.discord-chat').style.width = '100%';
            }
        } else {
            if (channelList) {
                channelList.classList.remove('active');
                channelList.style.width = deviceType === 'tablet' ? '200px' : '220px';
            }
            document.querySelector('.discord-chat').style.width = '';
        }
    }

    function toggleDropdown() {
        if (!DOM.dropdownMenu) return;
        if (DOM.dropdownMenu.classList.contains('hidden')) {
            DOM.dropdownMenu.classList.remove('hidden');
            const btn = DOM.chatDropdownBtn;
            if (btn) {
                const rect = btn.getBoundingClientRect();
                DOM.dropdownMenu.style.top = (rect.bottom + 4) + 'px';
                DOM.dropdownMenu.style.right = '8px';
            }
        } else {
            DOM.dropdownMenu.classList.add('hidden');
        }
    }

    function closeDropdown() {
        if (DOM.dropdownMenu) DOM.dropdownMenu.classList.add('hidden');
    }

    function handleDropdownAction(action) {
        switch(action) {
            case 'profile': if (state.currentChatPartner) showProfile(state.currentChatPartner); break;
            case 'logout': logout(); break;
            case 'search': searchMessages(); break;
            case 'wallpaper': setChatWallpaper(); break;
            default: break;
        }
        closeDropdown();
    }

    function toggleFunPanel() {
        if (!DOM.funPanel) return;
        if (DOM.funPanel.classList.contains('active')) {
            DOM.funPanel.classList.remove('active');
            if (DOM.smileBtn) DOM.smileBtn.classList.remove('active');
        } else {
            DOM.funPanel.classList.add('active');
            if (DOM.smileBtn) DOM.smileBtn.classList.add('active');
            switchPanelTab('stickers');
        }
    }

    function switchPanelTab(tab) {
        document.querySelectorAll('.panel-tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.panel-content').forEach(c => c.classList.remove('active'));
        const tabEl = document.querySelector('.panel-tab[data-tab="' + tab + '"]');
        const contentEl = document.getElementById('panel-' + tab);
        if (tabEl) tabEl.classList.add('active');
        if (contentEl) contentEl.classList.add('active');
        if (tab === 'stickers') loadStickers();
        if (tab === 'gifs') loadGIFs();
    }

    function loadStickers() {
        if (!DOM.stickerGrid) return;
        const stickers = JSON.parse(localStorage.getItem('vvn_stickers') || '[]');
        if (stickers.length === 0) {
            DOM.stickerGrid.innerHTML = '<div class="text-[#555] text-center text-xs py-3">No stickers</div>';
            return;
        }
        DOM.stickerGrid.innerHTML = stickers.map(s =>
            '<img src="' + s + '" class="sticker-item" onclick="window.sendSticker(\'' + s + '\')" />'
        ).join('');
    }

    function loadGIFs() {
        if (!DOM.gifGrid) return;
        DOM.gifGrid.innerHTML = SAMPLE_GIFS.map(g =>
            '<img src="' + g + '" class="gif-item" onclick="window.sendGIF(\'' + g + '\')" />'
        ).join('');
    }

    window.uploadSticker = function() {
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
                    if (DOM.stickerGrid) loadStickers();
                };
                reader.readAsDataURL(file);
            });
        };
        input.click();
    };

    window.sendSticker = function(data) {
        const chatKey = getChatKey(state.currentUser.username, state.currentChatPartner);
        const messages = state.localCache.messages;
        if (!messages[chatKey]) messages[chatKey] = [];
        messages[chatKey].push({
            sender: state.currentUser.username,
            timestamp: Date.now(),
            file: { type: 'image', data: data, caption: 'Sticker', name: 'sticker.png', size: '0 KB' },
            reactions: []
        });
        state.localCache.messages = messages;
        localStorage.setItem('vvn_cache', JSON.stringify(state.localCache));
        pushToRemote();
        renderMessagesForPartner(state.currentChatPartner);
        renderChatList();
        DOM.funPanel.classList.remove('active');
        if (DOM.smileBtn) DOM.smileBtn.classList.remove('active');
        if (typeof lucide !== 'undefined') lucide.createIcons();
    };

    window.sendGIF = function(data) {
        const chatKey = getChatKey(state.currentUser.username, state.currentChatPartner);
        const messages = state.localCache.messages;
        if (!messages[chatKey]) messages[chatKey] = [];
        messages[chatKey].push({
            sender: state.currentUser.username,
            timestamp: Date.now(),
            file: { type: 'image', data: data, caption: 'GIF', name: 'gif.gif', size: '0 KB' },
            reactions: []
        });
        state.localCache.messages = messages;
        localStorage.setItem('vvn_cache', JSON.stringify(state.localCache));
        pushToRemote();
        renderMessagesForPartner(state.currentChatPartner);
        renderChatList();
        DOM.funPanel.classList.remove('active');
        if (DOM.smileBtn) DOM.smileBtn.classList.remove('active');
        if (typeof lucide !== 'undefined') lucide.createIcons();
    };

    function createPoll() {
        const question = prompt('Enter poll question:');
        if (!question) return;
        const options = [];
        for (let i = 0; i < 4; i++) {
            const opt = prompt('Option ' + (i+1) + ' (leave empty to stop):');
            if (!opt) break;
            options.push(opt);
        }
        if (options.length < 2) { alert('Need at least 2 options'); return; }
        const pollData = { question, options: options.map(o => ({ text: o, votes: 0 })), totalVotes: 0 };
        const chatKey = getChatKey(state.currentUser.username, state.currentChatPartner);
        const messages = state.localCache.messages;
        if (!messages[chatKey]) messages[chatKey] = [];
        messages[chatKey].push({
            sender: state.currentUser.username,
            timestamp: Date.now(),
            poll: pollData,
            text: '📊 Poll: ' + question,
            reactions: []
        });
        state.localCache.messages = messages;
        localStorage.setItem('vvn_cache', JSON.stringify(state.localCache));
        pushToRemote();
        renderMessagesForPartner(state.currentChatPartner);
        renderChatList();
        DOM.funPanel.classList.remove('active');
        if (DOM.smileBtn) DOM.smileBtn.classList.remove('active');
    }

    function playGame() {
        DOM.funPanel.classList.remove('active');
        if (DOM.smileBtn) DOM.smileBtn.classList.remove('active');
        const games = ['🎮 Tic Tac Toe', '🎯 Rock Paper Scissors', '🧠 Trivia'];
        const choice = prompt('Choose a game:\n1. Tic Tac Toe\n2. Rock Paper Scissors\n3. Trivia');
        if (!choice) return;
        if (choice === '1') playTicTacToe();
        else if (choice === '2') playRPS();
        else if (choice === '3') playTrivia();
        else alert('Invalid choice');
    }

    function playTicTacToe() {
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 z-[400] bg-black/70 backdrop-blur-xl flex items-center justify-center';
        let board = Array(9).fill('');
        let currentPlayer = 'X';
        let gameOver = false;
        const renderBoard = () => {
            const cells = modal.querySelectorAll('.game-cell');
            cells.forEach((cell, i) => {
                cell.textContent = board[i];
                cell.className = 'game-cell w-12 h-12 bg-[rgba(255,255,255,0.04)] rounded-lg text-xl font-medium flex items-center justify-center cursor-pointer transition-all hover:bg-[rgba(255,255,255,0.08)] ' + (board[i] === 'X' ? 'text-white' : board[i] === 'O' ? 'text-[#888]' : '');
            });
            const result = modal.querySelector('.game-result');
            const winner = checkWinner();
            if (winner) {
                result.textContent = winner === 'draw' ? '🤝 Draw!' : '🏆 ' + winner + ' wins!';
                gameOver = true;
            } else {
                result.textContent = currentPlayer + '\'s turn';
            }
        };
        const checkWinner = () => {
            const winPatterns = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
            for (const pattern of winPatterns) {
                const [a,b,c] = pattern;
                if (board[a] && board[a] === board[b] && board[a] === board[c]) return board[a];
            }
            if (board.every(cell => cell)) return 'draw';
            return null;
        };
        modal.innerHTML = `
            <div class="glass-card p-6 max-w-[320px] w-full">
                <div class="flex items-center justify-between mb-3">
                    <h3 class="text-white font-medium">Tic Tac Toe</h3>
                    <button onclick="this.closest('.fixed').remove()" class="text-[#555] hover:text-white"><i data-lucide="x" class="w-5 h-5"></i></button>
                </div>
                <div class="grid grid-cols-3 gap-2 max-w-[180px] mx-auto">
                    ${Array(9).fill(0).map((_, i) => `<div class="game-cell" data-index="${i}"></div>`).join('')}
                </div>
                <div class="game-result text-center text-[#888] text-sm mt-3">X's turn</div>
                <button onclick="this.closest('.fixed').remove()" class="w-full mt-3 py-2 rounded-lg bg-[rgba(255,255,255,0.04)] text-[#888] text-sm hover:bg-[rgba(255,255,255,0.08)] transition-colors">Close</button>
            </div>
        `;
        document.body.appendChild(modal);
        if (typeof lucide !== 'undefined') lucide.createIcons();
        modal.querySelectorAll('.game-cell').forEach(cell => {
            cell.addEventListener('click', function() {
                if (gameOver) return;
                const index = parseInt(this.dataset.index);
                if (board[index]) return;
                board[index] = currentPlayer;
                currentPlayer = currentPlayer === 'X' ? 'O' : 'X';
                renderBoard();
                const winner = checkWinner();
                if (winner && winner !== 'draw') {
                    gameOver = true;
                    const chatKey = getChatKey(state.currentUser.username, state.currentChatPartner);
                    const messages = state.localCache.messages;
                    if (!messages[chatKey]) messages[chatKey] = [];
                    messages[chatKey].push({
                        sender: state.currentUser.username,
                        timestamp: Date.now(),
                        text: '🎮 Tic Tac Toe: ' + winner + ' wins!',
                        reactions: []
                    });
                    state.localCache.messages = messages;
                    localStorage.setItem('vvn_cache', JSON.stringify(state.localCache));
                    pushToRemote();
                    renderMessagesForPartner(state.currentChatPartner);
                    renderChatList();
                }
            });
        });
        renderBoard();
    }

    function playRPS() {
        const choices = ['🪨 Rock', '📄 Paper', '✂️ Scissors'];
        const playerChoice = prompt('🎮 Rock Paper Scissors\n\n1. 🪨 Rock\n2. 📄 Paper\n3. ✂️ Scissors');
        if (!playerChoice) return;
        const playerIndex = parseInt(playerChoice) - 1;
        if (playerIndex < 0 || playerIndex > 2) { alert('Invalid choice'); return; }
        const botIndex = Math.floor(Math.random() * 3);
        const result = (playerIndex - botIndex + 3) % 3;
        let msg = '🎮 Rock Paper Scissors\n\nYou: ' + choices[playerIndex] + '\nBot: ' + choices[botIndex] + '\n\n';
        if (result === 0) msg += '🤝 Draw!';
        else if (result === 1) msg += '🎉 You win!';
        else msg += '😔 You lose!';
        const chatKey = getChatKey(state.currentUser.username, state.currentChatPartner);
        const messages = state.localCache.messages;
        if (!messages[chatKey]) messages[chatKey] = [];
        messages[chatKey].push({ sender: state.currentUser.username, timestamp: Date.now(), text: msg, reactions: [] });
        state.localCache.messages = messages;
        localStorage.setItem('vvn_cache', JSON.stringify(state.localCache));
        pushToRemote();
        renderMessagesForPartner(state.currentChatPartner);
        renderChatList();
    }

    function playTrivia() {
        const questions = [
            { q: 'What is the capital of France?', a: 'Paris' },
            { q: 'What is 2+2?', a: '4' },
            { q: 'What is the largest planet?', a: 'Jupiter' }
        ];
        const q = questions[Math.floor(Math.random() * questions.length)];
        const answer = prompt('🧠 Trivia\n\n' + q.q);
        if (!answer) return;
        const correct = answer.toLowerCase().trim() === q.a.toLowerCase();
        const msg = '🧠 Trivia\n\nQ: ' + q.q + '\nYour answer: ' + answer + '\nCorrect answer: ' + q.a + '\n\n' + (correct ? '✅ Correct!' : '❌ Wrong!');
        const chatKey = getChatKey(state.currentUser.username, state.currentChatPartner);
        const messages = state.localCache.messages;
        if (!messages[chatKey]) messages[chatKey] = [];
        messages[chatKey].push({ sender: state.currentUser.username, timestamp: Date.now(), text: msg, reactions: [] });
        state.localCache.messages = messages;
        localStorage.setItem('vvn_cache', JSON.stringify(state.localCache));
        pushToRemote();
        renderMessagesForPartner(state.currentChatPartner);
        renderChatList();
    }

    function votePoll(messageId, optionIndex) {
        const chatKey = getChatKey(state.currentUser.username, state.currentChatPartner);
        const messages = state.localCache.messages[chatKey] || [];
        const parts = messageId.split('-');
        const timestamp = parseInt(parts[0]);
        const index = parseInt(parts[1]);
        const msg = messages.find((m, i) => m.timestamp === timestamp && i === index);
        if (!msg || !msg.poll) return;
        if (msg.poll.options[optionIndex].votedBy && msg.poll.options[optionIndex].votedBy.includes(state.currentUser.username)) {
            alert('You already voted on this option.');
            return;
        }
        if (!msg.poll.options[optionIndex].votedBy) msg.poll.options[optionIndex].votedBy = [];
        msg.poll.options[optionIndex].votedBy.push(state.currentUser.username);
        msg.poll.options[optionIndex].votes++;
        msg.poll.totalVotes++;
        state.localCache.messages[chatKey] = messages;
        localStorage.setItem('vvn_cache', JSON.stringify(state.localCache));
        pushToRemote();
        renderMessagesForPartner(state.currentChatPartner);
    }

    function setChatWallpaper() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = function(e) {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function(ev) {
                    chatSettings.wallpaper = ev.target.result;
                    chatSettings.wallpaperBlur = true;
                    localStorage.setItem('vvn_chat_settings', JSON.stringify(chatSettings));
                    applyChatWallpaper();
                    alert('Wallpaper set!');
                };
                reader.readAsDataURL(file);
            }
        };
        input.click();
    }

    function applyChatWallpaper() {
        if (chatSettings.wallpaper && DOM.chatMessages) {
            DOM.chatMessages.style.backgroundImage = 'url(' + chatSettings.wallpaper + ')';
            DOM.chatMessages.style.backgroundSize = 'cover';
            DOM.chatMessages.style.backgroundPosition = 'center';
        }
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
        let msg = 'Found ' + results.length + ' messages:\n\n';
        results.forEach((m, i) => {
            msg += (i+1) + '. ' + m.text.substring(0, 50) + (m.text.length > 50 ? '...' : '') + '\n';
        });
        alert(msg);
    }

    function addReaction(msgId, emoji) {
        const chatKey = getChatKey(state.currentUser.username, state.currentChatPartner);
        const messages = state.localCache.messages[chatKey] || [];
        const parts = msgId.split('-');
        const timestamp = parseInt(parts[0]);
        const index = parseInt(parts[1]);
        const msg = messages.find((m, i) => m.timestamp === timestamp && i === index);
        if (!msg) return;
        if (!msg.reactions) msg.reactions = [];
        const existing = msg.reactions.find(r => r.user === state.currentUser.username);
        if (existing) { existing.emoji = emoji; }
        else { msg.reactions.push({ user: state.currentUser.username, emoji: emoji }); }
        state.localCache.messages[chatKey] = messages;
        localStorage.setItem('vvn_cache', JSON.stringify(state.localCache));
        pushToRemote();
        renderMessagesForPartner(state.currentChatPartner);
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
                    file: { type: file.type, data: file.data, caption: caption, name: file.name, size: file.size },
                    reactions: []
                });
            }
            pendingFiles = [];
            if (DOM.filePreviewContainer) DOM.filePreviewContainer.innerHTML = '';
            if (DOM.fileClearBtn) DOM.fileClearBtn.style.display = 'none';
            if (DOM.fileCaption) DOM.fileCaption.value = '';
            if (DOM.fileModal) DOM.fileModal.classList.add('hidden');
        } else {
            messages[chatKey].push({
                sender: state.currentUser.username,
                timestamp: Date.now(),
                text: text,
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
        renderMessagesForPartner(state.currentChatPartner);
        renderChatList();
        if (DOM.messageInput) DOM.messageInput.value = '';
        updateActivity();
        DOM.funPanel.classList.remove('active');
        if (DOM.smileBtn) DOM.smileBtn.classList.remove('active');
        if (typeof lucide !== 'undefined') lucide.createIcons();
    }

    function startVoiceRecording() {
        if (isRecording) return;
        try {
            navigator.mediaDevices.getUserMedia({ audio: true }).then(stream => {
                mediaRecorder = new MediaRecorder(stream);
                audioChunks = [];
                recordingSeconds = 0;
                mediaRecorder.ondataavailable = function(event) { audioChunks.push(event.data); };
                mediaRecorder.onstop = function() {
                    clearInterval(recordingInterval);
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
                            file: { type: 'audio', data: audioData, caption: 'Voice message' },
                            reactions: []
                        });
                        state.localCache.messages = messages;
                        localStorage.setItem('vvn_cache', JSON.stringify(state.localCache));
                        pushToRemote();
                        renderMessagesForPartner(state.currentChatPartner);
                        renderChatList();
                    };
                    reader.readAsDataURL(audioBlob);
                    isRecording = false;
                };
                mediaRecorder.start();
                isRecording = true;
                recordingInterval = setInterval(() => { recordingSeconds++; }, 1000);
            }).catch(err => {
                alert('Could not access microphone.');
            });
        } catch (err) {
            alert('Could not access microphone.');
        }
    }

    function stopVoiceRecording() {
        if (mediaRecorder && isRecording) {
            mediaRecorder.stop();
            mediaRecorder.stream.getTracks().forEach(track => track.stop());
            clearInterval(recordingInterval);
            isRecording = false;
        }
    }

    function searchUsers(query) {
        if (!query.trim() || !DOM.searchResults) {
            DOM.searchResults.style.display = 'none';
            return;
        }
        const users = state.localCache.users;
        const q = query.toLowerCase();
        const found = users.filter(u => u.username !== state.currentUser.username && !blockedUsers.includes(u.username) &&
            (u.username.toLowerCase().includes(q) || (u.displayName && u.displayName.toLowerCase().includes(q))));
        if (found.length === 0) {
            DOM.searchResults.innerHTML = '<div class="text-[#555] text-xs p-2">No users found</div>';
            DOM.searchResults.style.display = 'block';
            return;
        }
        let html = '';
        for (const u of found) {
            html += '<div class="flex items-center gap-2 p-2 cursor-pointer hover:bg-[rgba(255,255,255,0.04)] rounded transition-colors" data-username="' + u.username + '">';
            html += '<div class="w-7 h-7 rounded-full bg-[rgba(255,255,255,0.06)] flex items-center justify-center text-xs text-[#888]">' + u.username.charAt(0).toUpperCase() + '</div>';
            html += '<div><div class="text-white text-xs">' + (u.displayName || u.username) + '</div>';
            html += '<div class="text-[#555] text-[10px]">@' + u.username + '</div></div></div>';
        }
        DOM.searchResults.innerHTML = html;
        DOM.searchResults.style.display = 'block';
        document.querySelectorAll('.search-result-item').forEach(el => {
            el.addEventListener('click', function() { openChat(this.dataset.username); DOM.searchResults.style.display = 'none'; if (DOM.searchInput) DOM.searchInput.value = ''; updateActivity(); });
        });
    }

    function showProfile(username) {
        const user = getUserByUsername(username);
        if (!user) return;
        const tags = getUserTags(username);
        if (DOM.profileTags) {
            DOM.profileTags.innerHTML = tags.map(t => '<span class="text-[8px] px-1 py-0.5 rounded ' + t.class + '">' + t.label + '</span>').join('');
        }
        if (DOM.profileDisplayName) DOM.profileDisplayName.textContent = user.displayName || user.username;
        if (DOM.profileUsername) DOM.profileUsername.textContent = '@' + user.username;
        if (DOM.profileBio) DOM.profileBio.textContent = user.bio || 'No bio yet';
        if (DOM.profileJoined) DOM.profileJoined.textContent = 'Joined: ' + formatDate(user.created || Date.now());
        if (DOM.profileAvatar) DOM.profileAvatar.src = user.avatar || 'icons/user.png';
        if (DOM.profileModal) DOM.profileModal.classList.remove('hidden');
        closeDropdown();
        if (typeof lucide !== 'undefined') lucide.createIcons();
    }

    function openSettings() {
        const user = state.currentUser;
        if (!user) return;
        if (DOM.settingsDisplayName) DOM.settingsDisplayName.value = user.displayName || '';
        if (DOM.settingsUsername) DOM.settingsUsername.value = user.username;
        if (DOM.settingsPassword) DOM.settingsPassword.value = '';
        if (DOM.settingsBio) DOM.settingsBio.value = user.bio || '';
        if (DOM.settingsAvatar) DOM.settingsAvatar.src = user.avatar || 'icons/user.png';
        if (DOM.settingsModal) DOM.settingsModal.classList.remove('hidden');
        if (typeof lucide !== 'undefined') lucide.createIcons();
    }

    async function saveSettings() {
        const user = state.currentUser;
        if (!user) return;
        const displayName = DOM.settingsDisplayName ? DOM.settingsDisplayName.value.trim() || user.username : user.username;
        const username = DOM.settingsUsername ? DOM.settingsUsername.value.trim() : user.username;
        const password = DOM.settingsPassword ? DOM.settingsPassword.value.trim() : '';
        const bio = DOM.settingsBio ? DOM.settingsBio.value.trim() : '';
        if (username !== user.username) {
            const existing = state.localCache.users.find(u => u.username === username && u.username !== user.username);
            if (existing) { alert('Username already taken'); return; }
        }
        const userIndex = state.localCache.users.findIndex(u => u.username === user.username);
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
                if (session) { session.username = username; localStorage.setItem('vvn_session', JSON.stringify(session)); }
            }
            localStorage.setItem('vvn_cache', JSON.stringify(state.localCache));
            await pushToRemote();
            renderChatList();
            if (DOM.settingsModal) DOM.settingsModal.classList.add('hidden');
            alert('Settings saved!');
        }
    }

    function toggleSelectionMode() {
        selectionMode = !selectionMode;
        if (selectionMode) {
            document.querySelectorAll('.discord-message').forEach(msg => msg.classList.add('selectable'));
            if (DOM.selectionToolbar) DOM.selectionToolbar.classList.remove('hidden');
        } else {
            clearSelection();
            document.querySelectorAll('.discord-message').forEach(msg => msg.classList.remove('selectable'));
            if (DOM.selectionToolbar) DOM.selectionToolbar.classList.add('hidden');
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
        document.querySelectorAll('.discord-message.selected').forEach(el => el.classList.remove('selected'));
        updateSelectedCount();
        selectionMode = false;
        document.querySelectorAll('.discord-message').forEach(msg => msg.classList.remove('selectable'));
        if (DOM.selectionToolbar) DOM.selectionToolbar.classList.add('hidden');
    }

    function updateSelectedCount() {
        if (DOM.selectedCount) DOM.selectedCount.textContent = selectedMessages.size + ' selected';
    }

    function showDeleteModal() {
        if (selectedMessages.size === 0) return;
        if (DOM.deleteModal) DOM.deleteModal.classList.remove('hidden');
        if (typeof lucide !== 'undefined') lucide.createIcons();
    }

    function deleteMessages(forEveryone) {
        const chatKey = getChatKey(state.currentUser.username, state.currentChatPartner);
        const messages = state.localCache.messages[chatKey] || [];
        const remaining = messages.filter((msg, index) => {
            const msgId = msg.timestamp + '-' + index;
            return !selectedMessages.has(msgId);
        });
        state.localCache.messages[chatKey] = remaining;
        localStorage.setItem('vvn_cache', JSON.stringify(state.localCache));
        pushToRemote();
        clearSelection();
        if (DOM.deleteModal) DOM.deleteModal.classList.add('hidden');
        renderMessagesForPartner(state.currentChatPartner);
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
        const msg = messages.find((m, i) => m.timestamp === timestamp && i === index);
        if (msg) {
            if (!pinnedMessages[chatKey]) pinnedMessages[chatKey] = [];
            pinnedMessages[chatKey].push(msg);
            localStorage.setItem('vvn_pinned', JSON.stringify(pinnedMessages));
        }
        clearSelection();
    }

    function openFileModal() {
        if (DOM.fileModal) DOM.fileModal.classList.remove('hidden');
        if (DOM.filePreviewContainer) DOM.filePreviewContainer.innerHTML = '';
        if (DOM.fileCaption) DOM.fileCaption.value = '';
        if (DOM.fileClearBtn) DOM.fileClearBtn.style.display = 'none';
        pendingFiles = [];
        if (typeof lucide !== 'undefined') lucide.createIcons();
    }

    function handleFileSelect() { if (DOM.fileInput) DOM.fileInput.click(); }

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
                pendingFiles.push({ data: data, type: fileType, name: file.name, size: (file.size / 1024).toFixed(1) + ' KB' });
                if (DOM.filePreviewContainer) {
                    const item = document.createElement('div');
                    item.className = 'relative inline-block m-0.5 rounded-lg overflow-hidden border border-[rgba(255,255,255,0.04)]';
                    const index = pendingFiles.length - 1;
                    let preview = '';
                    if (fileType === 'image') preview = '<img src="' + data + '" class="w-16 h-16 object-cover" />';
                    else if (fileType === 'video') preview = '<video class="w-16 h-16 object-cover"><source src="' + data + '" /></video>';
                    else preview = '<div class="w-16 h-16 flex items-center justify-center bg-[rgba(40,40,40,0.3)] text-2xl">' + (fileType === 'audio' ? '🎵' : '📄') + '</div>';
                    item.innerHTML = preview + '<button class="remove-file absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-black/70 text-white text-[10px] flex items-center justify-center hover:bg-red-500/80" data-index="' + index + '">×</button>';
                    DOM.filePreviewContainer.appendChild(item);
                    item.querySelector('.remove-file').addEventListener('click', function() {
                        const idx = parseInt(this.dataset.index);
                        pendingFiles.splice(idx, 1);
                        this.parentElement.remove();
                        if (pendingFiles.length === 0 && DOM.fileClearBtn) DOM.fileClearBtn.style.display = 'none';
                    });
                }
                if (DOM.fileClearBtn) DOM.fileClearBtn.style.display = 'inline-block';
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
        if (savedSettings) state.settings = JSON.parse(savedSettings);
        if (chatSettings.bubbleColor) {
            document.documentElement.style.setProperty('--bubble-color', chatSettings.bubbleColor);
        }
    }

    function updateMobileView() {
        state.isMobile = window.innerWidth < 768;
        const channelList = document.getElementById('channelList');
        if (state.isMobile) {
            if (state.currentChatPartner) {
                if (channelList) channelList.classList.remove('active');
                document.querySelector('.discord-chat').style.width = '100%';
            } else {
                if (channelList) channelList.classList.add('active');
            }
        } else {
            if (channelList) {
                channelList.classList.remove('active');
                channelList.style.width = state.deviceType === 'tablet' ? '200px' : '220px';
            }
            document.querySelector('.discord-chat').style.width = '';
        }
    }

    function renderChatList() {
        if (!state.currentUser || !DOM.chatList) return;
        const chats = state.localCache.chats;
        const messages = state.localCache.messages;
        let chatKeys = Object.keys(chats).filter(k => k.includes(state.currentUser.username));
        blockedUsers = JSON.parse(localStorage.getItem('vvn_blocked') || '[]');
        chatKeys = chatKeys.filter(k => {
            const parts = k.split('_');
            const partner = parts[0] === state.currentUser.username ? parts[1] : parts[0];
            return !blockedUsers.includes(partner);
        });
        const pinnedContacts = JSON.parse(localStorage.getItem('vvn_pinned_contacts') || '[]');
        let html = '';
        if (chatKeys.length === 0) {
            html = '<div class="text-[#555] text-xs text-center py-6">No conversations yet</div>';
        } else {
            const sorted = chatKeys.sort((a, b) => {
                const partsA = a.split('_'); const partsB = b.split('_');
                const partnerA = partsA[0] === state.currentUser.username ? partsA[1] : partsA[0];
                const partnerB = partsB[0] === state.currentUser.username ? partsB[1] : partsB[0];
                const isPinnedA = pinnedContacts.includes(partnerA);
                const isPinnedB = pinnedContacts.includes(partnerB);
                if (isPinnedA && !isPinnedB) return -1;
                if (!isPinnedA && isPinnedB) return 1;
                const ma = messages[a] || []; const mb = messages[b] || [];
                return (mb.length ? mb[mb.length-1].timestamp : 0) - (ma.length ? ma[ma.length-1].timestamp : 0);
            });
            for (const key of sorted) {
                const parts = key.split('_');
                const partner = parts[0] === state.currentUser.username ? parts[1] : parts[0];
                const msgs = messages[key] || [];
                const last = msgs.length ? msgs[msgs.length-1] : null;
                const preview = last ? (last.text || '📎 File') : 'Start chatting';
                const pUser = getUserByUsername(partner);
                const displayName = getDisplayName(partner);
                const isActive = partner === state.currentChatPartner;
                html += '<div class="discord-channel-item ' + (isActive ? 'active' : '') + '" data-partner="' + partner + '">';
                html += '<span class="channel-icon">#</span>';
                html += '<span>' + displayName + '</span>';
                if (pUser && pUser.online) {
                    html += '<span class="channel-badge text-green-400 text-[10px]">●</span>';
                }
                html += '</div>';
            }
        }
        DOM.chatList.innerHTML = html;
        document.querySelectorAll('.discord-channel-item').forEach(el => {
            el.addEventListener('click', function() { openChat(this.dataset.partner); updateActivity(); });
        });
    }

    function renderMessagesForPartner(partnerUsername) {
        if (!state.currentUser || !partnerUsername) return;
        const chatKey = getChatKey(state.currentUser.username, partnerUsername);
        const msgs = state.localCache.messages[chatKey] || [];
        if (!DOM.chatMessages) return;
        DOM.chatMessages.innerHTML = '';
        if (!msgs.length) {
            DOM.chatMessages.innerHTML = '<div class="text-[#555] text-sm text-center py-8">No messages yet</div>';
            return;
        }

        for (let i = 0; i < msgs.length; i++) {
            const msg = msgs[i];
            const msgId = msg.timestamp + '-' + i;
            const isOutgoing = msg.sender === state.currentUser.username;
            const senderName = isOutgoing ? state.currentUser.displayName || state.currentUser.username : getDisplayName(partnerUsername);
            const showAvatar = i === 0 || msgs[i-1].sender !== msg.sender;

            const div = document.createElement('div');
            div.className = 'discord-message' + (selectionMode ? ' selectable' : '');
            div.dataset.msgId = msgId;
            if (selectedMessages.has(msgId)) div.classList.add('selected');

            let content = '';
            if (msg.poll) {
                content += '<div class="glass-card p-2 mb-1">';
                content += '<div class="text-white text-sm font-medium mb-1">📊 ' + msg.poll.question + '</div>';
                msg.poll.options.forEach((opt, idx) => {
                    const pct = msg.poll.totalVotes > 0 ? Math.round((opt.votes / msg.poll.totalVotes) * 100) : 0;
                    content += '<div class="flex items-center gap-2 py-0.5 cursor-pointer hover:bg-[rgba(255,255,255,0.04)] rounded px-1" data-msg="' + msgId + '" data-opt="' + idx + '">';
                    content += '<span class="text-[#888] text-sm">' + opt.text + '</span>';
                    content += '<div class="flex-1 h-1 bg-[rgba(40,40,40,0.3)] rounded-full overflow-hidden"><div class="h-full bg-[#36454F] rounded-full" style="width:' + pct + '%"></div></div>';
                    content += '<span class="text-[#555] text-xs">' + opt.votes + '</span>';
                    content += '</div>';
                });
                content += '</div>';
            } else if (msg.file) {
                if (msg.file.type === 'image') {
                    content += '<div class="file-content"><img src="' + msg.file.data + '" class="max-w-[200px] max-h-[200px] rounded-lg cursor-pointer" onclick="window.open(this.src)" /></div>';
                } else if (msg.file.type === 'video') {
                    content += '<div class="file-content"><video controls class="max-w-[200px] max-h-[200px] rounded-lg"><source src="' + msg.file.data + '" /></video></div>';
                } else if (msg.file.type === 'audio') {
                    content += '<div class="file-content flex items-center gap-3 p-2 glass rounded-lg">';
                    content += '<button class="w-8 h-8 rounded-full glass flex items-center justify-center text-[#888] hover:text-white"><i data-lucide="play" class="w-4 h-4"></i></button>';
                    content += '<div class="flex-1 flex items-center gap-0.5 h-6">';
                    for (let w = 0; w < 12; w++) {
                        content += '<div class="w-0.5 h-full bg-[rgba(255,255,255,0.1)] rounded-full" style="height:' + (20 + Math.random() * 80) + '%"></div>';
                    }
                    content += '</div>';
                    content += '<span class="text-[#555] text-xs">0:00</span>';
                    content += '</div>';
                } else {
                    content += '<div class="file-content flex items-center gap-2 p-2 glass rounded-lg">';
                    content += '<div class="w-8 h-8 rounded-lg bg-[rgba(40,40,40,0.3)] flex items-center justify-center text-lg">📄</div>';
                    content += '<div><div class="text-white text-sm">' + (msg.file.name || 'File') + '</div>';
                    content += '<div class="text-[#555] text-xs">' + (msg.file.size || '0 KB') + '</div></div>';
                    content += '</div>';
                }
                if (msg.file.caption) content += '<div class="text-[#888] text-xs mt-1">' + msg.file.caption + '</div>';
            } else {
                content = msg.text || '';
            }
            if (msg.reactions && msg.reactions.length > 0) {
                content += '<div class="reactions flex gap-1 mt-1 flex-wrap">';
                const reactionCounts = {};
                msg.reactions.forEach(r => { reactionCounts[r.emoji] = (reactionCounts[r.emoji] || 0) + 1; });
                Object.entries(reactionCounts).forEach(([emoji, count]) => {
                    const isUserReacted = msg.reactions.some(r => r.user === state.currentUser.username && r.emoji === emoji);
                    content += '<span class="reaction text-xs px-1.5 py-0.5 rounded-full glass cursor-pointer hover:bg-[rgba(255,255,255,0.04)]' + (isUserReacted ? ' bg-[rgba(54,69,79,0.2)]' : '') + '" data-msg="' + msgId + '" data-emoji="' + emoji + '">' + emoji + ' ' + count + '</span>';
                });
                content += '</div>';
            }

            div.innerHTML = `
                ${showAvatar ? `<div class="avatar">${senderName.charAt(0).toUpperCase()}</div>` : `<div class="avatar opacity-0">.</div>`}
                <div class="content">
                    <div class="header">
                        <span class="username">${senderName}</span>
                        <span class="timestamp">${formatTime(msg.timestamp)}</span>
                        ${msg.edited ? '<span class="text-[#555] text-[10px]">(edited)</span>' : ''}
                    </div>
                    <div class="text">${content}</div>
                </div>
            `;
            DOM.chatMessages.appendChild(div);
        }

        document.querySelectorAll('.reaction').forEach(el => {
            el.addEventListener('click', function() {
                const msgId = this.dataset.msg;
                const emoji = this.dataset.emoji;
                addReaction(msgId, emoji);
            });
        });
        document.querySelectorAll('.poll-option').forEach(el => {
            el.addEventListener('click', function() {
                const msgId = this.dataset.msg;
                const opt = parseInt(this.dataset.opt);
                votePoll(msgId, opt);
            });
        });
        if (typeof lucide !== 'undefined') lucide.createIcons();
        setTimeout(() => { DOM.chatMessages.scrollTop = DOM.chatMessages.scrollHeight; }, 50);
    }

    function showPlaceholder() {
        if (DOM.chatActive) DOM.chatActive.classList.add('hidden');
        if (DOM.chatPlaceholder) DOM.chatPlaceholder.classList.remove('hidden');
    }

    function openChat(partnerUsername) {
        if (!state.currentUser) return;
        if (blockedUsers.includes(partnerUsername)) { alert('This user is blocked.'); return; }
        state.currentChatPartner = partnerUsername;
        const partner = getUserByUsername(partnerUsername);
        if (!partner) return;

        if (state.isMobile) {
            document.getElementById('channelList').classList.remove('active');
            document.querySelector('.discord-chat').style.width = '100%';
            document.querySelector('.discord-chat').style.display = 'flex';
        }

        if (DOM.chatActive) DOM.chatActive.classList.remove('hidden');
        if (DOM.chatPlaceholder) DOM.chatPlaceholder.classList.add('hidden');

        const displayName = getDisplayName(partnerUsername);
        if (DOM.chatPartnerName) {
            DOM.chatPartnerName.textContent = displayName;
        }
        if (DOM.chatPartnerStatus) {
            DOM.chatPartnerStatus.textContent = partner.online ? 'Online' : 'Offline';
        }

        renderMessagesForPartner(partnerUsername);
        renderChatList();
        updateMobileView();
        closeDropdown();
        if (DOM.funPanel) DOM.funPanel.classList.remove('active');
        if (DOM.smileBtn) DOM.smileBtn.classList.remove('active');

        if (DOM.messageInput) {
            DOM.messageInput.placeholder = 'Message @' + partnerUsername;
        }
    }

    async function loginUser(username, password) {
        const users = state.localCache.users;
        const user = users.find(u => u.username === username && u.password === password);
        if (!user) {
            if (DOM.authError) { DOM.authError.textContent = 'Incorrect username or password'; DOM.authError.classList.remove('hidden'); }
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
            if (DOM.regError) { DOM.regError.textContent = 'Username already taken'; DOM.regError.classList.remove('hidden'); }
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
            rainbow: false
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
        renderChatList();
        if (state.currentChatPartner) openChat(state.currentChatPartner);
        else showPlaceholder();
        updateMobileView();
        if (typeof lucide !== 'undefined') lucide.createIcons();
    }

    function logout() {
        localStorage.removeItem('vvn_session');
        state.currentUser = null;
        state.currentChatPartner = null;
        if (state.syncInterval) clearInterval(state.syncInterval);
        if (autoLockTimeout) clearTimeout(autoLockTimeout);
        if (DOM.authScreen) DOM.authScreen.style.display = 'flex';
        if (DOM.messenger) DOM.messenger.style.display = 'none';
        showDeviceSelection();
    }

    function resetAutoLock() {
        if (autoLockTimeout) clearTimeout(autoLockTimeout);
        const lockTime = parseInt(state.settings.autoLock);
        if (lockTime && lockTime !== 'never') {
            autoLockTimeout = setTimeout(function() {
                if (state.currentUser) { logout(); alert('Auto-locked due to inactivity.'); }
            }, lockTime * 60 * 1000);
        }
    }

    function updateActivity() { lastActivity = Date.now(); resetAutoLock(); }

    function initVanta() {
        try {
            if (typeof VANTA !== 'undefined' && !state.vantaEffect) {
                state.vantaEffect = VANTA.WAVES({
                    el: '#vanta-bg',
                    mouseControls: true,
                    touchControls: true,
                    gyroControls: false,
                    minHeight: 200.00,
                    minWidth: 200.00,
                    scale: 1.00,
                    scaleMobile: 1.00,
                    color: 0x0A0A0A,
                    waveColor: 0x1A1A1A,
                    waveSpeed: 0.3,
                    zoom: 0.8
                });
            }
        } catch (e) {
            console.warn('Vanta.js not loaded, continuing without background effect');
        }
    }

    async function init() {
        console.log('🚀 Initializing VVN...');

        // Set a timeout to force hide loading even if everything fails
        state.loadingTimeout = setTimeout(function() {
            if (!state.loadingComplete) {
                console.warn('Loading timeout - forcing hide');
                if (DOM.loadingOverlay) {
                    DOM.loadingOverlay.style.display = 'none';
                }
                state.loadingComplete = true;
                // Show device selection as fallback
                showDeviceSelection();
            }
        }, 8000);

        if (DOM.loadingOverlay) DOM.loadingOverlay.style.display = 'flex';
        updateLoading(5);
        loadSavedSettings();

        // Try to init Vanta but don't wait for it
        setTimeout(initVanta, 100);

        if ('Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission();
        }

        const savedDevice = localStorage.getItem('vvn_device');
        if (savedDevice && typeof applyDeviceLayout === 'function') {
            state.deviceType = savedDevice;
            applyDeviceLayout(savedDevice);
            adjustDiscordLayout(savedDevice);
        } else if (typeof detectDevice === 'function') {
            const detected = detectDevice();
            state.deviceType = detected;
            applyDeviceLayout(detected);
            adjustDiscordLayout(detected);
        }

        const cached = localStorage.getItem('vvn_cache');
        if (cached) {
            try {
                state.localCache = JSON.parse(cached);
                console.log('📦 Loaded from cache:', state.localCache.users.length, 'users');
                updateLoading(40);
            } catch (e) {
                state.localCache = { users: [], chats: {}, messages: {} };
            }
        } else {
            state.localCache = { users: [], chats: {}, messages: {} };
            if (!state.localCache.users.find(u => u.username === 'VaultNet')) {
                state.localCache.users.push({
                    username: 'VaultNet',
                    displayName: 'VaultNet',
                    password: 'admin123',
                    bio: 'Creator of VVN',
                    online: true,
                    created: Date.now(),
                    avatar: '',
                    rainbow: false
                });
            }
            localStorage.setItem('vvn_cache', JSON.stringify(state.localCache));
        }
        updateLoading(50);

        try {
            const remote = await fetchFromBin();
            if (remote) {
                state.localCache = { users: remote.users || [], chats: remote.chats || {}, messages: remote.messages || {} };
                if (!state.localCache.users.find(u => u.username === 'VaultNet')) {
                    state.localCache.users.push({
                        username: 'VaultNet',
                        displayName: 'VaultNet',
                        password: 'admin123',
                        bio: 'Creator of VVN',
                        online: true,
                        created: Date.now(),
                        avatar: '',
                        rainbow: false
                    });
                }
                localStorage.setItem('vvn_cache', JSON.stringify(state.localCache));
                console.log('✅ Loaded from JSONBin:', state.localCache.users.length, 'users');
            }
        } catch (e) { console.warn('Background sync failed, using cache'); }

        updateLoading(80);

        updateLoading(90);
        const session = JSON.parse(localStorage.getItem('vvn_session'));
        if (session) {
            const user = state.localCache.users.find(u => u.username === session.username);
            if (user) {
                state.currentUser = user;
                renderMessenger();
                if (state.syncInterval) clearInterval(state.syncInterval);
                state.syncInterval = setInterval(syncWithRemote, CONFIG.SYNC_INTERVAL);
                updateLoading(100);
                // Clear the timeout since loading completed
                if (state.loadingTimeout) {
                    clearTimeout(state.loadingTimeout);
                    state.loadingTimeout = null;
                }
                return;
            } else {
                localStorage.removeItem('vvn_session');
            }
        }
        showDeviceSelection();
        updateLoading(100);
        if (typeof lucide !== 'undefined') lucide.createIcons();

        // Clear the timeout
        if (state.loadingTimeout) {
            clearTimeout(state.loadingTimeout);
            state.loadingTimeout = null;
        }
    }

    // Event Listeners
    document.addEventListener('DOMContentLoaded', function() {
        // Auth tabs
        document.querySelectorAll('.auth-tab').forEach(tab => {
            tab.addEventListener('click', function() {
                document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
                this.classList.add('active');
                document.querySelectorAll('.auth-form').forEach(f => f.classList.add('hidden'));
                const form = document.getElementById(this.dataset.tab + 'Form');
                if (form) form.classList.remove('hidden');
            });
        });

        // Login
        if (DOM.loginForm) {
            DOM.loginForm.addEventListener('submit', async function(e) {
                e.preventDefault();
                const username = DOM.loginUsername ? DOM.loginUsername.value.trim() : '';
                const password = DOM.loginPassword ? DOM.loginPassword.value.trim() : '';
                if (!username || !password) {
                    if (DOM.authError) { DOM.authError.textContent = 'Please fill in all fields'; DOM.authError.classList.remove('hidden'); }
                    return;
                }
                await loginUser(username, password);
            });
        }

        // Register
        if (DOM.registerForm) {
            DOM.registerForm.addEventListener('submit', async function(e) {
                e.preventDefault();
                const username = DOM.regUsername ? DOM.regUsername.value.trim() : '';
                const displayName = DOM.regDisplayName ? DOM.regDisplayName.value.trim() : '';
                const password = DOM.regPassword ? DOM.regPassword.value.trim() : '';
                if (!username || !password) {
                    if (DOM.regError) { DOM.regError.textContent = 'Username and password required'; DOM.regError.classList.remove('hidden'); }
                    return;
                }
                if (username.length < 3) {
                    if (DOM.regError) { DOM.regError.textContent = 'Username must be at least 3 characters'; DOM.regError.classList.remove('hidden'); }
                    return;
                }
                await registerUser(username, displayName, password);
            });
        }

        // Send message
        if (DOM.sendBtn) DOM.sendBtn.addEventListener('click', sendMessage);
        if (DOM.messageInput) {
            DOM.messageInput.addEventListener('keydown', function(e) {
                if (e.key === 'Enter') sendMessage();
                updateActivity();
            });
        }

        // Voice
        if (DOM.micBtn) {
            DOM.micBtn.addEventListener('mousedown', startVoiceRecording);
            DOM.micBtn.addEventListener('mouseup', stopVoiceRecording);
            DOM.micBtn.addEventListener('mouseleave', stopVoiceRecording);
            DOM.micBtn.addEventListener('touchstart', function(e) { e.preventDefault(); startVoiceRecording(); });
            DOM.micBtn.addEventListener('touchend', function(e) { e.preventDefault(); stopVoiceRecording(); });
        }

        // Search
        if (DOM.searchInput) {
            DOM.searchInput.addEventListener('input', function() { searchUsers(this.value); });
        }

        // Back button (mobile)
        if (DOM.backBtn) {
            DOM.backBtn.addEventListener('click', function() {
                if (state.isMobile) {
                    document.getElementById('channelList').classList.add('active');
                    document.querySelector('.discord-chat').style.width = '';
                    state.currentChatPartner = null;
                    showPlaceholder();
                    renderChatList();
                }
            });
        }

        // Settings
        if (DOM.settingsBtn) DOM.settingsBtn.addEventListener('click', openSettings);
        if (DOM.settingsClose) {
            DOM.settingsClose.addEventListener('click', function() { if (DOM.settingsModal) DOM.settingsModal.classList.add('hidden'); });
        }

        // Save settings
        if (DOM.saveSettings) DOM.saveSettings.addEventListener('click', saveSettings);

        // Modal closes
        if (DOM.modalClose) {
            DOM.modalClose.addEventListener('click', function() { if (DOM.profileModal) DOM.profileModal.classList.add('hidden'); });
        }
        if (DOM.profileModal) {
            DOM.profileModal.addEventListener('click', function(e) {
                if (e.target === this) this.classList.add('hidden');
            });
        }

        // Manual sync
        if (DOM.manualSyncBtn) DOM.manualSyncBtn.addEventListener('click', function() {
            state.firstSyncDone = false;
            syncWithRemote();
        });

        // Device selection
        document.querySelectorAll('.device-option').forEach(btn => {
            btn.addEventListener('click', function() { selectDevice(this.dataset.device); });
        });
        if (DOM.autoDetectBtn) {
            DOM.autoDetectBtn.addEventListener('click', function() {
                if (typeof detectDevice === 'function') { const detected = detectDevice(); selectDevice(detected); }
            });
        }
        if (DOM.autoDetectLayoutBtn) {
            DOM.autoDetectLayoutBtn.addEventListener('click', function() {
                if (typeof detectDevice === 'function') { const detected = detectDevice(); selectDevice(detected); }
            });
        }
        document.querySelectorAll('.device-layout-btn').forEach(btn => {
            btn.addEventListener('click', function() { selectDevice(this.dataset.device); });
        });

        // Logout
        if (DOM.logoutBtn) {
            DOM.logoutBtn.addEventListener('click', function() { if (confirm('Are you sure you want to logout?')) { logout(); } });
        }

        // Dropdown
        if (DOM.chatDropdownBtn) {
            DOM.chatDropdownBtn.addEventListener('click', function(e) { e.stopPropagation(); toggleDropdown(); });
        }
        document.querySelectorAll('.dropdown-item').forEach(item => {
            item.addEventListener('click', function() {
                const action = this.dataset.action;
                handleDropdownAction(action);
                closeDropdown();
            });
        });
        document.addEventListener('click', function(e) {
            if (!e.target.closest('.dropdown-trigger') && !e.target.closest('.dropdown-menu')) closeDropdown();
        });

        // Selection
        document.addEventListener('click', function(e) {
            const msgEl = e.target.closest('.discord-message');
            if (msgEl && selectionMode) {
                const msgId = msgEl.dataset.msgId;
                if (msgId) toggleMessageSelection(msgId);
            }
        });
        if (DOM.deleteSelectedBtn) DOM.deleteSelectedBtn.addEventListener('click', showDeleteModal);
        if (DOM.pinSelectedBtn) DOM.pinSelectedBtn.addEventListener('click', pinSelectedMessages);
        if (DOM.cancelSelectionBtn) DOM.cancelSelectionBtn.addEventListener('click', clearSelection);
        if (DOM.deleteForMeBtn) DOM.deleteForMeBtn.addEventListener('click', function() { deleteMessages(false); });
        if (DOM.deleteForEveryoneBtn) DOM.deleteForEveryoneBtn.addEventListener('click', function() { deleteMessages(true); });
        if (DOM.deleteModalClose) DOM.deleteModalClose.addEventListener('click', function() { DOM.deleteModal.classList.add('hidden'); });

        // File
        if (DOM.clipBtn) DOM.clipBtn.addEventListener('click', openFileModal);
        if (DOM.fileModalClose) DOM.fileModalClose.addEventListener('click', function() { DOM.fileModal.classList.add('hidden'); });
        if (DOM.fileSelectBtn) DOM.fileSelectBtn.addEventListener('click', handleFileSelect);
        if (DOM.fileInput) DOM.fileInput.addEventListener('change', handleFileInput);
        if (DOM.fileClearBtn) DOM.fileClearBtn.addEventListener('click', clearAllFiles);
        if (DOM.fileSendBtn) DOM.fileSendBtn.addEventListener('click', sendMessage);

        // Fun panel
        if (DOM.smileBtn) {
            DOM.smileBtn.addEventListener('click', function(e) {
                e.stopPropagation();
                toggleFunPanel();
            });
        }

        // Panel tabs
        document.querySelectorAll('.panel-tab').forEach(tab => {
            tab.addEventListener('click', function() {
                switchPanelTab(this.dataset.tab);
            });
        });

        // Poll & Game buttons
        if (DOM.pollBtn) DOM.pollBtn.addEventListener('click', function() { createPoll(); });
        if (DOM.gameBtn) DOM.gameBtn.addEventListener('click', function() { playGame(); });

        // Close fun panel on outside click
        document.addEventListener('click', function(e) {
            if (DOM.funPanel && DOM.smileBtn && !e.target.closest('.fun-panel') && !e.target.closest('.smile-btn')) {
                DOM.funPanel.classList.remove('active');
                if (DOM.smileBtn) DOM.smileBtn.classList.remove('active');
            }
        });

        // Modal overlays
        document.querySelectorAll('.modal-overlay').forEach(overlay => {
            overlay.addEventListener('click', function(e) {
                if (e.target === this) this.classList.add('hidden');
            });
        });

        // Activity tracking
        document.addEventListener('click', updateActivity);
        document.addEventListener('keydown', updateActivity);

        // Resize
        window.addEventListener('resize', function() {
            updateMobileView();
            if (typeof applyDeviceLayout === 'function') applyDeviceLayout(state.deviceType);
        });

        // Start
        init();

        console.log('🚀 VVN Messenger started!');
        console.log('👤 Owner: VaultNet');
        console.log('🔐 Password: admin123');
        console.log('📱 Discord-style interface');
    });
})();
