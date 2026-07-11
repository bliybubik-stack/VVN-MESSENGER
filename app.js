// app.js - Main application logic
const App = {
    currentUser: null,
    currentChatPartner: null,
    isMobile: window.innerWidth < 768,
    selectMode: false,
    selectedMessages: new Set(),
    reactingToMessage: null,
    recordingTimer: null,
    recordingSeconds: 0,
    audioBlob: null,
    settings: {
        theme: 'dark',
        msgSize: 'medium',
        timestamps: 'on',
        animation: 'slide',
        enterSend: 'on',
        typing: 'on',
        lastSeen: 'everyone',
        readReceipts: 'on',
        encryption: '5'
    },

    init() {
        this.loadSettings();
        this.bindEvents();
        this.loadDatabase();
    },

    loadSettings() {
        const saved = localStorage.getItem('vvn_settings');
        if (saved) {
            try {
                this.settings = JSON.parse(saved);
            } catch {}
        }
        this.applySettings();
    },

    saveSettings() {
        localStorage.setItem('vvn_settings', JSON.stringify(this.settings));
        this.applySettings();
    },

    applySettings() {
        if (this.settings.theme === 'light') {
            document.body.style.background = '#f0f0f0';
            document.querySelector('#app').style.background = '#ffffff';
        } else if (this.settings.theme === 'amoled') {
            document.body.style.background = '#000000';
            document.querySelector('#app').style.background = '#000000';
        } else {
            document.body.style.background = '#0b0b0b';
            document.querySelector('#app').style.background = '#141414';
        }
    },

    async loadDatabase() {
        await Database.load();
        const session = Database.getSession();
        if (session) {
            const users = Database.getUsers();
            const user = users.find(u => u.username === session.username);
            if (user) {
                this.currentUser = user;
                this.renderMessenger();
                setInterval(() => this.syncWithRemote(), 5000);
                this.hideLoading();
                return;
            }
        }
        document.getElementById('authScreen').style.display = 'flex';
        document.getElementById('messenger').style.display = 'none';
        this.hideLoading();
    },

    hideLoading() {
        document.getElementById('loadingOverlay').classList.add('hidden');
    },

    updateLoading(progress, status) {
        const fill = document.getElementById('loaderFill');
        fill.style.width = Math.min(progress, 100) + '%';
        if (status) {
            document.getElementById('loadingStatus').textContent = status;
        }
        if (progress >= 100) {
            setTimeout(() => this.hideLoading(), 300);
        }
    },

    bindEvents() {
        // Auth
        document.getElementById('loginBtn').addEventListener('click', () => this.login());
        document.getElementById('signupBtn').addEventListener('click', () => this.signup());
        document.getElementById('authPassword').addEventListener('keydown', (e) => {
            if (e.key === 'Enter') this.login();
        });

        // Chat
        document.getElementById('sendBtn').addEventListener('click', () => this.sendMessage());
        document.getElementById('messageInput').addEventListener('keydown', (e) => {
            if (this.settings.enterSend === 'on' && e.key === 'Enter') {
                this.sendMessage();
            }
        });

        // Search
        document.getElementById('searchInput').addEventListener('input', (e) => {
            this.searchUsers(e.target.value);
        });

        // Settings
        document.getElementById('settingsBtn').addEventListener('click', () => this.openSettings());
        document.getElementById('closeSettings').addEventListener('click', () => this.closeSettings());
        document.getElementById('saveSettings').addEventListener('click', () => this.saveSettingsData());
        document.getElementById('logoutBtn').addEventListener('click', () => this.logout());
        document.getElementById('deleteAccountBtn').addEventListener('click', () => this.deleteAccount());

        // User badge click
        document.getElementById('userBadge').addEventListener('click', () => this.openSettings());

        // Back button
        document.getElementById('backBtn').addEventListener('click', () => this.goBack());

        // Profile click
        document.getElementById('chatHeaderClick').addEventListener('click', () => {
            if (this.currentChatPartner) {
                this.viewProfile(this.currentChatPartner);
            }
        });
        document.getElementById('chatAvatar').addEventListener('click', () => {
            if (this.currentChatPartner) {
                this.viewProfile(this.currentChatPartner);
            }
        });
        document.getElementById('closeProfile').addEventListener('click', () => this.closeProfile());

        // Chat settings
        document.getElementById('chatSettingsBtn').addEventListener('click', () => this.openChatSettings());

        // Message selection
        document.getElementById('selectMsgBtn').addEventListener('click', () => this.toggleSelectMode());
        document.getElementById('deleteSelectedBtn').addEventListener('click', () => this.showDeleteModal());

        // Reactions
        document.getElementById('reactBtn').addEventListener('click', () => this.openReactionModal());
        document.getElementById('closeReaction').addEventListener('click', () => this.closeReactionModal());

        // Delete modal
        document.getElementById('closeDelete').addEventListener('click', () => this.closeDeleteModal());
        document.getElementById('cancelDelete').addEventListener('click', () => this.closeDeleteModal());
        document.getElementById('deleteForMe').addEventListener('click', () => this.deleteSelectedMessages('me'));
        document.getElementById('deleteForEveryone').addEventListener('click', () => this.deleteSelectedMessages('everyone'));

        // Manual sync
        document.getElementById('manualSyncBtn').addEventListener('click', () => this.syncWithRemote());

        // Window resize
        window.addEventListener('resize', () => this.adjustMobileView());

        // Reaction emojis
        document.querySelectorAll('.reaction-emoji').forEach(el => {
            el.addEventListener('click', () => {
                const emoji = el.dataset.emoji;
                this.addReaction(emoji);
            });
        });

        // Attach menu
        document.getElementById('attachBtn').addEventListener('click', () => {
            const menu = document.getElementById('attachMenu');
            menu.style.display = menu.style.display === 'none' ? 'block' : 'none';
        });
        document.querySelectorAll('.attach-option').forEach(el => {
            el.addEventListener('click', () => {
                document.getElementById('attachMenu').style.display = 'none';
                const type = el.dataset.type;
                this.handleAttach(type);
            });
        });

        // Poll
        document.getElementById('closePoll').addEventListener('click', () => this.closePollModal());
        document.getElementById('createPollBtn').addEventListener('click', () => this.createPoll());

        // Voice recorder
        document.getElementById('closeVoice').addEventListener('click', () => this.closeVoiceRecorder());
        document.getElementById('startRecordingBtn').addEventListener('click', () => this.startRecording());
        document.getElementById('stopRecordingBtn').addEventListener('click', () => this.stopRecording());
        document.getElementById('sendVoiceBtn').addEventListener('click', () => this.sendVoiceMessage());

        // Media viewer
        document.getElementById('closeMedia').addEventListener('click', () => this.closeMediaViewer());

        // Profile pic upload
        document.getElementById('profilePicInput').addEventListener('change', (e) => {
            this.handleProfilePicUpload(e);
        });
        document.getElementById('clearProfilePic').addEventListener('click', () => this.clearProfilePic());

        // Close modals on outside click
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.classList.remove('show');
                }
            });
        });
    },

    // Auth functions
    async login() {
        const username = document.getElementById('authUsername').value.trim();
        const password = document.getElementById('authPassword').value.trim();
        if (!username || !password) {
            this.showAuthError('Please fill in username and password');
            return;
        }
        const users = Database.getUsers();
        const user = users.find(u => u.username === username && u.password === password);
        if (!user) {
            this.showAuthError('Incorrect username or password');
            return;
        }
        Database.setSession({ username: user.username });
        this.currentUser = user;
        this.renderMessenger();
    },

    async signup() {
        const username = document.getElementById('authUsername').value.trim();
        const email = document.getElementById('authEmail').value.trim();
        const password = document.getElementById('authPassword').value.trim();
        if (!username || !password) {
            this.showAuthError('Username and password required');
            return;
        }
        if (username.length < 3) {
            this.showAuthError('Username must be at least 3 characters');
            return;
        }
        const users = Database.getUsers();
        if (users.find(u => u.username === username)) {
            this.showAuthError('Username already taken');
            return;
        }
        const newUser = {
            username,
            email: email || '',
            password,
            online: true,
            created: Date.now(),
            displayName: username,
            bio: '',
            profilePic: '',
            settings: { ...this.settings }
        };
        users.push(newUser);
        Database.setUsers(users);
        await Database.save();
        Database.setSession({ username });
        this.currentUser = newUser;
        this.renderMessenger();
    },

    showAuthError(msg) {
        const error = document.getElementById('authError');
        error.style.display = 'block';
        error.textContent = msg;
        setTimeout(() => error.style.display = 'none', 5000);
    },

    // Render functions
    renderMessenger() {
        document.getElementById('authScreen').style.display = 'none';
        document.getElementById('messenger').style.display = 'flex';
        document.getElementById('sidebarUsername').textContent = this.currentUser.displayName || this.currentUser.username;
        this.renderChatList();
        if (this.currentChatPartner) {
            this.openChat(this.currentChatPartner);
        } else {
            this.showPlaceholder();
        }
        this.adjustMobileView();
        this.setStatus('Connected', 'green');
    },

    renderChatList() {
        if (!this.currentUser) return;
        const chats = Database.getChats();
        const messages = Database.getMessages();
        const chatKeys = Object.keys(chats).filter(k => k.includes(this.currentUser.username));

        let html = '';
        if (chatKeys.length === 0) {
            html = `<div class="empty-chats">No chats here, search users at the top...</div>`;
        } else {
            const sorted = chatKeys.sort((a, b) => {
                const ma = messages[a] || [];
                const mb = messages[b] || [];
                const ta = ma.length ? ma[ma.length - 1].timestamp : 0;
                const tb = mb.length ? mb[mb.length - 1].timestamp : 0;
                return tb - ta;
            });
            for (const key of sorted) {
                const parts = key.split('_');
                const partner = parts[0] === this.currentUser.username ? parts[1] : parts[0];
                const msgs = messages[key] || [];
                const last = msgs.length ? msgs[msgs.length - 1] : null;
                let preview = last ? (last.text || 'Media message') : 'Start chatting';
                const time = last ? this.formatTime(last.timestamp) : '';
                const users = Database.getUsers();
                const pUser = users.find(u => u.username === partner);
                const online = pUser ? pUser.online : false;
                const displayName = pUser ? (pUser.displayName || partner) : partner;
                html += `<div class="chat-item ${partner === this.currentChatPartner ? 'active' : ''}" data-partner="${partner}">
                    <div class="avatar" style="${pUser?.profilePic ? `background-image:url(${pUser.profilePic});background-size:cover;` : ''}">
                        ${pUser?.profilePic ? '' : displayName.charAt(0).toUpperCase()}
                    </div>
                    <div class="chat-info"><div class="cname">${displayName} ${online ? '●' : ''}</div><div class="preview">${preview}</div></div>
                    <div class="time">${time}</div>
                </div>`;
            }
        }
        document.getElementById('chatList').innerHTML = html;
        document.querySelectorAll('.chat-item').forEach(el => {
            el.addEventListener('click', () => {
                this.openChat(el.dataset.partner);
            });
        });
    },

    openChat(partnerUsername) {
        if (!this.currentUser) return;
        this.currentChatPartner = partnerUsername;
        const users = Database.getUsers();
        const partner = users.find(u => u.username === partnerUsername);
        if (!partner) return;

        const header = document.getElementById('chatHeader');
        header.style.display = 'flex';
        const displayName = partner.displayName || partner.username;
        document.getElementById('chatPartnerName').textContent = displayName;
        document.getElementById('chatPartnerStatus').textContent = partner.online ? 'Online' : 'Offline';
        const avatar = document.getElementById('chatAvatar');
        if (partner.profilePic) {
            avatar.style.backgroundImage = `url(${partner.profilePic})`;
            avatar.style.backgroundSize = 'cover';
            avatar.textContent = '';
        } else {
            avatar.style.backgroundImage = '';
            avatar.textContent = displayName.charAt(0).toUpperCase();
        }
        document.getElementById('chatPlaceholder').style.display = 'none';
        document.getElementById('chatInputBar').style.display = 'flex';
        document.getElementById('deleteSelectedBtn').style.display = 'none';

        const chatKey = this.getChatKey(this.currentUser.username, partnerUsername);
        const messages = Database.getMessages();
        const msgs = messages[chatKey] || [];
        this.renderMessages(msgs);

        const chats = Database.getChats();
        if (!chats[chatKey]) {
            chats[chatKey] = { participants: [this.currentUser.username, partnerUsername], created: Date.now() };
            Database.setChats(chats);
            Database.save();
        }
        this.renderChatList();
        if (this.isMobile) {
            document.getElementById('sidebar').classList.add('hide-mobile');
            document.getElementById('chatArea').classList.add('active-mobile');
        }
        this.scrollToBottom();
    },

    renderMessages(msgs) {
        const container = document.getElementById('chatMessages');
        container.innerHTML = '';
        if (!msgs.length) {
            const emptyBox = document.createElement('div');
            emptyBox.className = 'empty-chat-box';
            emptyBox.textContent = `Start messaging ${this.currentChatPartner ? (Database.getUsers().find(u => u.username === this.currentChatPartner)?.displayName || this.currentChatPartner) : ''}`;
            container.appendChild(emptyBox);
            return;
        }

        let currentDate = '';
        let isFirstMessage = true;
        for (const msg of msgs) {
            const msgDate = new Date(msg.timestamp).toLocaleDateString();
            if (msgDate !== currentDate) {
                currentDate = msgDate;
                const dateDiv = document.createElement('div');
                dateDiv.style.cssText = 'text-align:center;color:#555;font-size:0.7rem;padding:8px 0;';
                dateDiv.textContent = currentDate;
                container.appendChild(dateDiv);
            }

            if (isFirstMessage && msgs.length > 0) {
                const startDiv = document.createElement('div');
                startDiv.style.cssText = 'text-align:center;color:#555;font-size:0.7rem;padding:8px 0;font-style:italic;';
                startDiv.textContent = 'This is the start of your legendary conversation.';
                container.appendChild(startDiv);
                isFirstMessage = false;
            }

            const div = document.createElement('div');
            const isOutgoing = msg.sender === this.currentUser.username;
            div.className = `message ${isOutgoing ? 'outgoing' : 'incoming'}`;
            div.dataset.messageId = msg.id || Date.now() + Math.random().toString(36);
            div.dataset.sender = msg.sender;

            const circle = document.createElement('span');
            circle.className = 'select-circle';
            circle.dataset.messageId = div.dataset.messageId;
            div.appendChild(circle);

            const content = document.createElement('span');
            content.className = 'message-content';
            
            if (msg.type === 'poll') {
                content.innerHTML = this.renderPoll(msg);
            } else if (msg.type === 'file') {
                content.innerHTML = this.renderFile(msg);
            } else if (msg.type === 'voice') {
                content.innerHTML = this.renderVoice(msg);
            } else if (msg.type === 'image') {
                content.innerHTML = this.renderImage(msg);
            } else if (msg.type === 'video') {
                content.innerHTML = this.renderVideo(msg);
            } else if (msg.type === 'note') {
                content.innerHTML = `<div style="background:#1a1a1a;border-radius:8px;padding:8px 12px;border-left:3px solid #4a7aff;">📝 ${msg.text}</div>`;
            } else {
                content.textContent = msg.text || 'Media message';
            }
            
            div.appendChild(content);

            if (this.settings.timestamps === 'on') {
                const time = document.createElement('div');
                time.className = 'time';
                const statusIcon = document.createElement('span');
                statusIcon.className = 'status-icon';
                if (isOutgoing) {
                    if (msg.read) {
                        statusIcon.textContent = '✓✓';
                        statusIcon.classList.add('read');
                    } else if (msg.delivered) {
                        statusIcon.textContent = '✓✓';
                        statusIcon.classList.add('sent');
                    } else {
                        statusIcon.textContent = '✓';
                    }
                }
                time.textContent = this.formatTime(msg.timestamp);
                time.prepend(statusIcon);
                div.appendChild(time);
            }

            if (msg.reactions && Object.keys(msg.reactions).length > 0) {
                const reactionsDiv = document.createElement('div');
                reactionsDiv.className = 'reactions';
                for (const [emoji, users] of Object.entries(msg.reactions)) {
                    const badge = document.createElement('span');
                    badge.className = 'reaction-badge';
                    badge.textContent = `${emoji} ${users.length}`;
                    badge.addEventListener('click', (e) => {
                        e.stopPropagation();
                        this.toggleReaction(div.dataset.messageId, emoji);
                    });
                    reactionsDiv.appendChild(badge);
                }
                div.appendChild(reactionsDiv);
            }

            const animClass = this.settings.animation;
            if (animClass !== 'none') {
                div.classList.add('anim-' + animClass);
            }

            if (this.selectMode) {
                div.classList.add('select-mode');
                if (this.selectedMessages.has(div.dataset.messageId)) {
                    circle.classList.add('filled');
                    div.classList.add('selected');
                }
            }

            div.addEventListener('click', () => {
                if (this.selectMode) {
                    this.toggleSelectMessage(div.dataset.messageId);
                }
            });

            container.appendChild(div);
        }

        this.applySettings();
        this.scrollToBottom();
    },

    renderPoll(msg) {
        const totalVotes = Object.values(msg.pollResults || {}).reduce((a, b) => a + b, 0);
        let html = `<div class="poll-container"><div class="poll-question">${msg.pollQuestion || msg.text}</div>`;
        const options = msg.pollOptions || [];
        options.forEach((option, index) => {
            const votes = msg.pollResults?.[index] || 0;
            const percentage = totalVotes > 0 ? Math.round((votes / totalVotes) * 100) : 0;
            const hasVoted = msg.pollVoters?.[this.currentUser?.username] === index;
            html += `<div class="poll-option ${hasVoted ? 'voted' : ''}" data-index="${index}" style="cursor:pointer;">
                <span>${option}</span>
                <span>${votes} votes (${percentage}%)</span>
                <div class="poll-bar" style="width:${percentage}%;"></div>
            </div>`;
        });
        html += `<div style="font-size:0.75rem;color:#666;margin-top:6px;">${totalVotes} total votes</div></div>`;
        return html;
    },

    renderFile(msg) {
        const timeLeft = msg.expireTime ? Math.max(0, Math.floor((msg.expireTime - Date.now()) / 60000)) : 'Never';
        return `<div class="file-container" data-file="${msg.fileData || ''}">
            <div class="file-name">📄 ${msg.fileName || 'File'}</div>
            <div class="file-details">${msg.fileType || 'Unknown'} · ${msg.fileSize || '0 KB'}</div>
            <div class="file-details">${msg.fileDescription || ''}</div>
            <div class="file-expire">⏱ Expires in: ${typeof timeLeft === 'number' ? timeLeft + ' minutes' : timeLeft}</div>
        </div>`;
    },

    renderVoice(msg) {
        return `<div class="voice-container" data-voice="${msg.voiceData || ''}">
            <span class="voice-play">▶</span>
            <div class="voice-progress"><div class="fill"></div></div>
            <span class="voice-time">${msg.voiceDuration || '0:00'}</span>
        </div>`;
    },

    renderImage(msg) {
        return `<div class="image-container" data-image="${msg.imageData || ''}">
            <img src="${msg.imageData || ''}" alt="Image" loading="lazy" />
        </div>`;
    },

    renderVideo(msg) {
        return `<div class="video-container" data-video="${msg.videoData || ''}">
            <video src="${msg.videoData || ''}" preload="metadata"></video>
            <div class="video-play-overlay">▶</div>
        </div>`;
    },

    toggleSelectMessage(messageId) {
        if (this.selectedMessages.has(messageId)) {
            this.selectedMessages.delete(messageId);
        } else {
            this.selectedMessages.add(messageId);
        }
        this.updateSelectUI();
    },

    updateSelectUI() {
        const messages = document.querySelectorAll('.message');
        messages.forEach(msg => {
            const circle = msg.querySelector('.select-circle');
            if (circle) {
                if (this.selectedMessages.has(msg.dataset.messageId)) {
                    circle.classList.add('filled');
                    msg.classList.add('selected');
                } else {
                    circle.classList.remove('filled');
                    msg.classList.remove('selected');
                }
            }
        });
        document.getElementById('deleteSelectedBtn').style.display = this.selectedMessages.size > 0 ? 'flex' : 'none';
    },

    toggleSelectMode() {
        this.selectMode = !this.selectMode;
        if (!this.selectMode) {
            this.selectedMessages.clear();
        }
        const messages = document.querySelectorAll('.message');
        messages.forEach(msg => {
            if (this.selectMode) {
                msg.classList.add('select-mode');
            } else {
                msg.classList.remove('select-mode');
                const circle = msg.querySelector('.select-circle');
                if (circle) circle.classList.remove('filled');
                msg.classList.remove('selected');
            }
        });
        document.getElementById('deleteSelectedBtn').style.display = 'none';
        document.getElementById('selectMsgBtn').textContent = this.selectMode ? '✓' : '☑';
    },

    showDeleteModal() {
        if (this.selectedMessages.size === 0) return;
        document.getElementById('deleteModal').classList.add('show');
    },

    closeDeleteModal() {
        document.getElementById('deleteModal').classList.remove('show');
    },

    async deleteSelectedMessages(type) {
        if (this.selectedMessages.size === 0) return;
        const chatKey = this.getChatKey(this.currentUser.username, this.currentChatPartner);
        const messages = Database.getMessages();
        const msgs = messages[chatKey] || [];

        const filtered = msgs.filter(msg => {
            const msgId = msg.id || Date.now() + Math.random().toString(36);
            if (this.selectedMessages.has(msgId)) {
                if (type === 'everyone') {
                    return false;
                }
                return false; // For 'me', we just remove from display
            }
            return true;
        });
        messages[chatKey] = filtered;

        Database.setMessages(messages);
        await Database.save();
        this.selectedMessages.clear();
        this.selectMode = false;
        document.getElementById('selectMsgBtn').textContent = '☑';
        document.getElementById('deleteSelectedBtn').style.display = 'none';
        this.closeDeleteModal();
        this.renderMessages(messages[chatKey] || []);
        this.renderChatList();
    },

    openReactionModal() {
        const messages = document.querySelectorAll('.message');
        if (messages.length === 0) return;
        const lastMsg = messages[messages.length - 1];
        this.reactingToMessage = lastMsg.dataset.messageId;
        document.getElementById('reactionModal').classList.add('show');
    },

    closeReactionModal() {
        document.getElementById('reactionModal').classList.remove('show');
        this.reactingToMessage = null;
    },

    async addReaction(emoji) {
        if (!this.reactingToMessage) return;
        const chatKey = this.getChatKey(this.currentUser.username, this.currentChatPartner);
        const messages = Database.getMessages();
        const msgs = messages[chatKey] || [];

        const msgIndex = msgs.findIndex(m => {
            const msgId = m.id || Date.now() + Math.random().toString(36);
            return msgId === this.reactingToMessage;
        });

        if (msgIndex !== -1) {
            if (!msgs[msgIndex].reactions) msgs[msgIndex].reactions = {};
            if (!msgs[msgIndex].reactions[emoji]) msgs[msgIndex].reactions[emoji] = [];
            
            const userIndex = msgs[msgIndex].reactions[emoji].indexOf(this.currentUser.username);
            if (userIndex !== -1) {
                msgs[msgIndex].reactions[emoji].splice(userIndex, 1);
                if (msgs[msgIndex].reactions[emoji].length === 0) {
                    delete msgs[msgIndex].reactions[emoji];
                }
            } else {
                msgs[msgIndex].reactions[emoji].push(this.currentUser.username);
            }

            Database.setMessages(messages);
            await Database.save();
            this.renderMessages(msgs);
        }

        this.closeReactionModal();
    },

    toggleReaction(messageId, emoji) {
        const chatKey = this.getChatKey(this.currentUser.username, this.currentChatPartner);
        const messages = Database.getMessages();
        const msgs = messages[chatKey] || [];

        const msgIndex = msgs.findIndex(m => {
            const msgId = m.id || Date.now() + Math.random().toString(36);
            return msgId === messageId;
        });

        if (msgIndex !== -1) {
            if (!msgs[msgIndex].reactions) msgs[msgIndex].reactions = {};
            if (!msgs[msgIndex].reactions[emoji]) msgs[msgIndex].reactions[emoji] = [];
            
            const userIndex = msgs[msgIndex].reactions[emoji].indexOf(this.currentUser.username);
            if (userIndex !== -1) {
                msgs[msgIndex].reactions[emoji].splice(userIndex, 1);
                if (msgs[msgIndex].reactions[emoji].length === 0) {
                    delete msgs[msgIndex].reactions[emoji];
                }
            } else {
                msgs[msgIndex].reactions[emoji].push(this.currentUser.username);
            }

            Database.setMessages(messages);
            Database.save();
            this.renderMessages(msgs);
        }
    },

    async sendMessage() {
        if (!this.currentUser || !this.currentChatPartner) return;
        const input = document.getElementById('messageInput');
        const text = input.value.trim();
        if (!text) return;

        // Check for poll command
        if (text.startsWith('/poll')) {
            this.openPollModal();
            input.value = '';
            return;
        }

        const chatKey = this.getChatKey(this.currentUser.username, this.currentChatPartner);
        const messages = Database.getMessages();
        if (!messages[chatKey]) messages[chatKey] = [];

        const newMsg = {
            id: Date.now() + Math.random().toString(36),
            sender: this.currentUser.username,
            text: text,
            timestamp: Date.now(),
            reactions: {},
            delivered: false,
            read: false,
            type: 'text'
        };

        messages[chatKey].push(newMsg);
        Database.setMessages(messages);
        await Database.save();

        // Mark as delivered after sync
        setTimeout(() => {
            const msgs = Database.getMessages()[chatKey] || [];
            const msg = msgs.find(m => m.id === newMsg.id);
            if (msg) {
                msg.delivered = true;
                Database.setMessages(Database.getMessages());
                Database.save();
                this.renderMessages(msgs);
            }
        }, 1000);

        this.renderMessages(messages[chatKey]);
        this.renderChatList();
        input.value = '';
        this.scrollToBottom();
    },

    async handleAttach(type) {
        if (type === 'poll') {
            this.openPollModal();
            return;
        }

        if (type === 'voice') {
            this.openVoiceRecorder();
            return;
        }

        const input = document.createElement('input');
        input.type = 'file';
        if (type === 'photo') input.accept = 'image/*';
        else if (type === 'video') input.accept = 'video/*';
        else if (type === 'file') input.accept = '*/*';
        else if (type === 'note') {
            const note = prompt('Enter your note:');
            if (note) {
                await this.sendMediaMessage('note', { text: note });
            }
            return;
        }

        input.onchange = async (e) => {
            const file = e.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = async (event) => {
                const data = event.target.result;
                if (type === 'photo') {
                    await this.sendMediaMessage('image', { imageData: data, text: '📷 Photo' });
                } else if (type === 'video') {
                    await this.sendMediaMessage('video', { videoData: data, text: '🎬 Video' });
                } else if (type === 'file') {
                    const fileSize = (file.size / 1024).toFixed(1) + ' KB';
                    await this.sendMediaMessage('file', {
                        fileName: file.name,
                        fileType: file.type || 'Unknown',
                        fileSize: fileSize,
                        fileData: data,
                        fileDescription: prompt('File description:', ''),
                        expireTime: Date.now() + 24 * 60 * 60 * 1000 // 24 hours
                    });
                }
            };
            reader.readAsDataURL(file);
        };
        input.click();
    },

    async sendMediaMessage(type, data) {
        if (!this.currentUser || !this.currentChatPartner) return;
        const chatKey = this.getChatKey(this.currentUser.username, this.currentChatPartner);
        const messages = Database.getMessages();
        if (!messages[chatKey]) messages[chatKey] = [];

        const newMsg = {
            id: Date.now() + Math.random().toString(36),
            sender: this.currentUser.username,
            timestamp: Date.now(),
            reactions: {},
            delivered: false,
            read: false,
            type: type,
            ...data
        };

        messages[chatKey].push(newMsg);
        Database.setMessages(messages);
        await Database.save();
        this.renderMessages(messages[chatKey]);
        this.renderChatList();
        this.scrollToBottom();
    },

    openPollModal() {
        document.getElementById('pollModal').classList.add('show');
        document.getElementById('pollQuestion').value = '';
        document.getElementById('pollOpt1').value = '';
        document.getElementById('pollOpt2').value = '';
        document.getElementById('pollOpt3').value = '';
        document.getElementById('pollOpt4').value = '';
        document.getElementById('pollOpt5').value = '';
    },

    closePollModal() {
        document.getElementById('pollModal').classList.remove('show');
    },

    async createPoll() {
        const question = document.getElementById('pollQuestion').value.trim();
        const options = [];
        for (let i = 1; i <= 5; i++) {
            const opt = document.getElementById(`pollOpt${i}`).value.trim();
            if (opt) options.push(opt);
        }
        if (!question || options.length < 2) {
            alert('Please enter a question and at least 2 options');
            return;
        }

        await this.sendMediaMessage('poll', {
            pollQuestion: question,
            pollOptions: options,
            pollResults: {},
            pollVoters: {},
            text: question
        });
        this.closePollModal();
    },

    openVoiceRecorder() {
        document.getElementById('voiceRecorder').classList.add('show');
        this.recordingSeconds = 0;
        document.getElementById('recordingTimer').textContent = '00:00';
        document.getElementById('startRecordingBtn').style.display = 'inline-block';
        document.getElementById('stopRecordingBtn').style.display = 'none';
        document.getElementById('sendVoiceBtn').style.display = 'none';
    },

    closeVoiceRecorder() {
        document.getElementById('voiceRecorder').classList.remove('show');
        if (this.recordingTimer) {
            clearInterval(this.recordingTimer);
            this.recordingTimer = null;
        }
    },

    startRecording() {
        navigator.mediaDevices.getUserMedia({ audio: true }).then(stream => {
            this.mediaRecorder = new MediaRecorder(stream);
            const chunks = [];
            this.mediaRecorder.ondataavailable = e => chunks.push(e.data);
            this.mediaRecorder.onstop = () => {
                this.audioBlob = new Blob(chunks, { type: 'audio/webm' });
                document.getElementById('sendVoiceBtn').style.display = 'inline-block';
                document.getElementById('stopRecordingBtn').style.display = 'none';
            };
            this.mediaRecorder.start();
            document.getElementById('startRecordingBtn').style.display = 'none';
            document.getElementById('stopRecordingBtn').style.display = 'inline-block';
            
            this.recordingSeconds = 0;
            this.recordingTimer = setInterval(() => {
                this.recordingSeconds++;
                const mins = String(Math.floor(this.recordingSeconds / 60)).padStart(2, '0');
                const secs = String(this.recordingSeconds % 60).padStart(2, '0');
                document.getElementById('recordingTimer').textContent = `${mins}:${secs}`;
            }, 1000);
        }).catch(() => {
            alert('Unable to access microphone. Please allow microphone access.');
        });
    },

    stopRecording() {
        if (this.mediaRecorder) {
            this.mediaRecorder.stop();
            this.mediaRecorder.stream.getTracks().forEach(track => track.stop());
            clearInterval(this.recordingTimer);
            this.recordingTimer = null;
        }
    },

    async sendVoiceMessage() {
        if (!this.audioBlob) return;
        const reader = new FileReader();
        reader.onload = async (e) => {
            const data = e.target.result;
            const duration = this.recordingSeconds;
            const mins = String(Math.floor(duration / 60)).padStart(2, '0');
            const secs = String(duration % 60).padStart(2, '0');
            await this.sendMediaMessage('voice', {
                voiceData: data,
                voiceDuration: `${mins}:${secs}`,
                text: '🎤 Voice message'
            });
            this.closeVoiceRecorder();
        };
        reader.readAsDataURL(this.audioBlob);
    },

    viewProfile(username) {
        const users = Database.getUsers();
        const user = users.find(u => u.username === username);
        if (!user) return;

        const displayName = user.displayName || user.username;
        const avatar = document.getElementById('profileAvatar');
        if (user.profilePic) {
            avatar.innerHTML = `<img src="${user.profilePic}" alt="${displayName}" />`;
        } else {
            avatar.innerHTML = displayName.charAt(0).toUpperCase();
            avatar.style.background = '#2a2a2a';
        }
        document.getElementById('profileDisplayName').textContent = displayName;
        document.getElementById('profileUsername').textContent = '@' + user.username;
        document.getElementById('profileBio').textContent = user.bio || 'No bio yet';
        document.getElementById('profileStatus').textContent = user.online ? '● Online' : '○ Offline';
        document.getElementById('profileJoined').textContent = new Date(user.created || Date.now()).toLocaleDateString();
        document.getElementById('profileModal').classList.add('show');
    },

    closeProfile() {
        document.getElementById('profileModal').classList.remove('show');
    },

    openChatSettings() {
        // Quick chat settings - pin/reply options
        alert('Chat settings:\n- Pin important messages (long press on message)\n- Reply to messages (double click message)\n- Report user\n- Clear chat history');
    },

    // Settings
    openSettings() {
        if (!this.currentUser) return;
        const user = Database.getUsers().find(u => u.username === this.currentUser.username);
        if (!user) return;

        document.getElementById('setDisplayName').value = user.displayName || '';
        document.getElementById('setBio').value = user.bio || '';
        document.getElementById('setUsername').value = user.username;
        document.getElementById('setEmail').value = user.email || '';
        document.getElementById('setLastSeen').value = this.settings.lastSeen || 'everyone';
        document.getElementById('setReadReceipts').value = this.settings.readReceipts || 'on';
        document.getElementById('setEncryption').value = this.settings.encryption || '5';
        document.getElementById('setTheme').value = this.settings.theme || 'dark';
        document.getElementById('setMsgSize').value = this.settings.msgSize || 'medium';
        document.getElementById('setTimestamps').value = this.settings.timestamps || 'on';
        document.getElementById('setAnimation').value = this.settings.animation || 'slide';
        document.getElementById('setEnterSend').value = this.settings.enterSend || 'on';
        document.getElementById('setTyping').value = this.settings.typing || 'on';

        // Profile pic preview
        const preview = document.getElementById('profilePicPreview');
        if (user.profilePic) {
            preview.innerHTML = `<img src="${user.profilePic}" style="width:100%;height:100%;border-radius:50%;object-fit:cover;" />`;
        } else {
            preview.textContent = '👤';
            preview.style.background = '#2a2a2a';
        }

        document.getElementById('settingsModal').classList.add('show');
    },

    closeSettings() {
        document.getElementById('settingsModal').classList.remove('show');
    },

    async saveSettingsData() {
        const users = Database.getUsers();
        const userIndex = users.findIndex(u => u.username === this.currentUser.username);
        if (userIndex === -1) return;

        const username = document.getElementById('setUsername').value.trim();
        const existingUser = users.find(u => u.username === username && u.username !== this.currentUser.username);
        if (existingUser) {
            alert('Username already taken');
            return;
        }

        const newPassword = document.getElementById('setPassword').value.trim();

        users[userIndex] = {
            ...users[userIndex],
            username: username,
            email: document.getElementById('setEmail').value.trim(),
            displayName: document.getElementById('setDisplayName').value.trim() || username,
            bio: document.getElementById('setBio').value.trim(),
            password: newPassword || users[userIndex].password,
            profilePic: users[userIndex].profilePic || ''
        };

        this.settings = {
            ...this.settings,
            lastSeen: document.getElementById('setLastSeen').value,
            readReceipts: document.getElementById('setReadReceipts').value,
            encryption: document.getElementById('setEncryption').value,
            theme: document.getElementById('setTheme').value,
            msgSize: document.getElementById('setMsgSize').value,
            timestamps: document.getElementById('setTimestamps').value,
            animation: document.getElementById('setAnimation').value,
            enterSend: document.getElementById('setEnterSend').value,
            typing: document.getElementById('setTyping').value
        };

        Database.setUsers(users);
        this.currentUser = users[userIndex];
        if (username !== this.currentUser.username) {
            Database.setSession({ username });
        }
        this.saveSettings();
        await Database.save();

        document.getElementById('sidebarUsername').textContent = this.currentUser.displayName || this.currentUser.username;
        if (this.currentChatPartner) {
            const partner = users.find(u => u.username === this.currentChatPartner);
            if (partner) {
                document.getElementById('chatPartnerName').textContent = partner.displayName || partner.username;
            }
        }
        this.renderChatList();
        this.closeSettings();
        alert('Settings saved successfully!');
    },

    handleProfilePicUpload(e) {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const data = event.target.result;
            const preview = document.getElementById('profilePicPreview');
            preview.innerHTML = `<img src="${data}" style="width:100%;height:100%;border-radius:50%;object-fit:cover;" />`;
            
            // Save to user profile
            const users = Database.getUsers();
            const userIndex = users.findIndex(u => u.username === this.currentUser.username);
            if (userIndex !== -1) {
                users[userIndex].profilePic = data;
                Database.setUsers(users);
                Database.save();
                this.currentUser = users[userIndex];
                
                // Update avatar
                const avatar = document.getElementById('chatAvatar');
                if (avatar) {
                    avatar.style.backgroundImage = `url(${data})`;
                    avatar.style.backgroundSize = 'cover';
                    avatar.textContent = '';
                }
            }
        };
        reader.readAsDataURL(file);
    },

    clearProfilePic() {
        const users = Database.getUsers();
        const userIndex = users.findIndex(u => u.username === this.currentUser.username);
        if (userIndex !== -1) {
            users[userIndex].profilePic = '';
            Database.setUsers(users);
            Database.save();
            this.currentUser = users[userIndex];
            
            const preview = document.getElementById('profilePicPreview');
            preview.textContent = '👤';
            preview.style.background = '#2a2a2a';
            
            const avatar = document.getElementById('chatAvatar');
            if (avatar) {
                avatar.style.backgroundImage = '';
                avatar.textContent = (this.currentUser.displayName || this.currentUser.username).charAt(0).toUpperCase();
            }
        }
    },

    async deleteAccount() {
        if (!confirm('Are you sure you want to delete your account? This cannot be undone!')) return;
        if (!confirm('All your messages and data will be permanently deleted. Continue?')) return;

        const users = Database.getUsers();
        const filtered = users.filter(u => u.username !== this.currentUser.username);
        Database.setUsers(filtered);

        const chats = Database.getChats();
        const messages = Database.getMessages();
        const chatKeys = Object.keys(chats).filter(k => k.includes(this.currentUser.username));
        for (const key of chatKeys) {
            delete chats[key];
            delete messages[key];
        }
        Database.setChats(chats);
        Database.setMessages(messages);
        await Database.save();

        this.logout();
    },

    async logout() {
        Database.clearSession();
        this.currentUser = null;
        this.currentChatPartner = null;
        document.getElementById('authScreen').style.display = 'flex';
        document.getElementById('messenger').style.display = 'none';
        document.getElementById('settingsModal').classList.remove('show');
        document.getElementById('profileModal').classList.remove('show');
    },

    // Sync
    async syncWithRemote() {
        const remote = await Database.fetchFromBin();
        if (remote) {
            const localMessages = Database.localCache.messages || {};
            const remoteMessages = remote.messages || {};
            let hasNewMessages = false;

            for (const [key, msgs] of Object.entries(remoteMessages)) {
                if (!localMessages[key] || msgs.length > localMessages[key].length) {
                    const newMsgs = msgs.slice(localMessages[key]?.length || 0);
                    for (const msg of newMsgs) {
                        if (msg.sender !== this.currentUser?.username && this.currentUser) {
                            hasNewMessages = true;
                            const partner = key.split('_').find(u => u !== this.currentUser?.username);
                            if (partner) {
                                this.sendNotification(partner, msg.text || 'Media message');
                            }
                        }
                    }
                    localMessages[key] = msgs;
                }
            }

            Database.localCache = {
                users: remote.users || [],
                chats: remote.chats || {},
                messages: localMessages
            };
            localStorage.setItem('vvn_cache', JSON.stringify(Database.localCache));

            if (hasNewMessages && this.currentUser) {
                this.renderMessages(localMessages[this.getChatKey(this.currentUser.username, this.currentChatPartner)] || []);
                this.renderChatList();
            }
            this.setStatus('Synced', 'green');
        }
    },

    sendNotification(username, message) {
        if (Notification.permission === 'granted') {
            new Notification('VVN - New Message', {
                body: `${username}: ${message}`,
                icon: '📱'
            });
        }
    },

    // Utility functions
    getChatKey(u1, u2) {
        return [u1, u2].sort().join('_');
    },

    formatTime(ts) {
        const d = new Date(ts);
        return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    },

    scrollToBottom() {
        setTimeout(() => {
            const container = document.getElementById('chatMessages');
            container.scrollTop = container.scrollHeight;
        }, 50);
    },

    showPlaceholder() {
        document.getElementById('chatPlaceholder').style.display = 'flex';
        document.getElementById('chatHeader').style.display = 'none';
        document.getElementById('chatInputBar').style.display = 'none';
        document.getElementById('chatMessages').innerHTML = '';
        if (this.isMobile) {
            document.getElementById('sidebar').classList.remove('hide-mobile');
            document.getElementById('chatArea').classList.remove('active-mobile');
        }
    },

    goBack() {
        if (this.isMobile) {
            document.getElementById('sidebar').classList.remove('hide-mobile');
            document.getElementById('chatArea').classList.remove('active-mobile');
            this.currentChatPartner = null;
            this.showPlaceholder();
            this.renderChatList();
        }
    },

    adjustMobileView() {
        this.isMobile = window.innerWidth < 768;
        if (this.isMobile) {
            if (this.currentChatPartner) {
                document.getElementById('sidebar').classList.add('hide-mobile');
                document.getElementById('chatArea').classList.add('active-mobile');
            } else {
                document.getElementById('sidebar').classList.remove('hide-mobile');
                document.getElementById('chatArea').classList.remove('active-mobile');
            }
        } else {
            document.getElementById('sidebar').classList.remove('hide-mobile');
            document.getElementById('chatArea').classList.remove('active-mobile');
        }
    },

    setStatus(text, color) {
        document.getElementById('syncStatus').textContent = text;
        document.getElementById('syncDot').className = 'status-dot ' + color;
    },

    closeMediaViewer() {
        document.getElementById('mediaViewer').classList.remove('show');
        document.getElementById('mediaContent').innerHTML = '';
    }
};

// Initialize when page loads
document.addEventListener('DOMContentLoaded', () => {
    App.init();
});
