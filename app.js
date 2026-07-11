// app.js - Main application logic

const App = {
    currentUser: null,
    currentChatPartner: null,
    currentChatId: null,
    isMobile: window.innerWidth < 768,
    messages: [],
    polls: {},
    votes: {},
    replyTo: null,
    selectedMessages: new Set(),
    selectMode: false,
    reactingToMessage: null,
    isRecording: false,
    mediaRecorder: null,
    audioChunks: [],
    recordingTimer: null,
    recordingSeconds: 0,
    syncInterval: null,

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
        // Apply theme
        if (this.settings.theme === 'light') {
            document.body.style.background = '#f0f0f0';
            document.querySelector('#app').style.background = '#ffffff';
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
                this.startAutoSync();
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

    startAutoSync() {
        if (this.syncInterval) clearInterval(this.syncInterval);
        this.syncInterval = setInterval(() => {
            this.syncWithRemote();
        }, 5000);
    },

    bindEvents() {
        // Auth
        document.querySelectorAll('.auth-tab').forEach(tab => {
            tab.addEventListener('click', () => this.switchAuthTab(tab));
        });
        document.getElementById('authForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleAuth();
        });

        // Navigation
        document.getElementById('backBtn').addEventListener('click', () => this.goBack());
        document.getElementById('sidebarProfile').addEventListener('click', () => {
            if (this.currentUser) this.showProfile(this.currentUser);
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

        // Chat settings
        document.getElementById('chatSettingsBtn').addEventListener('click', () => this.openChatSettings());

        // Attach
        document.getElementById('attachBtn').addEventListener('click', () => {
            const menu = document.getElementById('attachMenu');
            menu.style.display = menu.style.display === 'none' ? 'block' : 'none';
        });
        document.querySelectorAll('.attach-option').forEach(btn => {
            btn.addEventListener('click', () => {
                document.getElementById('attachMenu').style.display = 'none';
                this.handleAttach(btn.dataset.type);
            });
        });

        // Profile modal
        document.getElementById('closeProfile').addEventListener('click', () => this.closeProfile());
        document.getElementById('profileModalMessage').addEventListener('click', () => {
            const username = document.getElementById('profileModalUsername').textContent.replace('@', '');
            const users = Database.getUsers();
            const user = users.find(u => u.username === username);
            if (user) {
                this.closeProfile();
                this.openChat(user);
            }
        });

        // Reactions
        document.getElementById('reactBtn').addEventListener('click', () => this.openReactionModal());
        document.getElementById('closeReaction').addEventListener('click', () => this.closeReactionModal());
        document.querySelectorAll('.reaction-emoji').forEach(el => {
            el.addEventListener('click', () => {
                this.addReaction(el.dataset.emoji);
            });
        });

        // Delete modal
        document.getElementById('closeDelete').addEventListener('click', () => this.closeDeleteModal());
        document.getElementById('cancelDelete').addEventListener('click', () => this.closeDeleteModal());
        document.getElementById('deleteForMe').addEventListener('click', () => this.deleteSelectedMessages('me'));
        document.getElementById('deleteForEveryone').addEventListener('click', () => this.deleteSelectedMessages('everyone'));

        // Poll
        document.getElementById('closePoll').addEventListener('click', () => this.closePollModal());
        document.getElementById('createPollBtn').addEventListener('click', () => this.createPoll());

        // Voice
        document.getElementById('closeVoice').addEventListener('click', () => this.closeVoiceRecorder());
        document.getElementById('startRecordingBtn').addEventListener('click', () => this.startRecording());
        document.getElementById('stopRecordingBtn').addEventListener('click', () => this.stopRecording());
        document.getElementById('sendVoiceBtn').addEventListener('click', () => this.sendVoiceMessage());

        // Cancel reply
        document.getElementById('cancelReply').addEventListener('click', () => {
            this.replyTo = null;
            document.getElementById('replyBar').style.display = 'none';
        });

        // Window resize
        window.addEventListener('resize', () => this.adjustMobileView());

        // Click outside attach menu
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.attach-btn') && !e.target.closest('#attachMenu')) {
                document.getElementById('attachMenu').style.display = 'none';
            }
        });
    },

    switchAuthTab(tab) {
        document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        const mode = tab.dataset.mode;
        document.getElementById('displayNameField').style.display = mode === 'signup' ? 'block' : 'none';
        document.getElementById('authSubmit').textContent = mode === 'signin' ? 'Enter VVN' : 'Create account';
    },

    async handleAuth() {
        const mode = document.querySelector('.auth-tab.active').dataset.mode;
        const username = document.getElementById('authUsername').value.trim();
        const password = document.getElementById('authPassword').value.trim();
        const displayName = document.getElementById('authDisplayName').value.trim();

        if (!username || !password) {
            this.showAuthError('Please fill in all required fields');
            return;
        }

        if (mode === 'signup' && username.length < 3) {
            this.showAuthError('Username must be at least 3 characters');
            return;
        }

        const submitBtn = document.getElementById('authSubmit');
        submitBtn.disabled = true;
        submitBtn.textContent = 'Please wait…';

        try {
            if (mode === 'signup') {
                await this.signup(username, password, displayName);
            } else {
                await this.login(username, password);
            }
        } catch (error) {
            this.showAuthError(error.message);
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = mode === 'signin' ? 'Enter VVN' : 'Create account';
        }
    },

    showAuthError(msg) {
        const error = document.getElementById('authError');
        error.style.display = 'block';
        error.textContent = msg;
        setTimeout(() => error.style.display = 'none', 5000);
    },

    async login(username, password) {
        const users = Database.getUsers();
        const user = users.find(u => u.username === username && u.password === password);
        if (!user) throw new Error('Invalid username or password');
        
        Database.setSession({ username: user.username });
        this.currentUser = user;
        this.renderMessenger();
        this.startAutoSync();
    },

    async signup(username, password, displayName) {
        const users = Database.getUsers();
        if (users.find(u => u.username === username)) {
            throw new Error('Username already taken');
        }

        const newUser = {
            username,
            password,
            displayName: displayName || username,
            email: '',
            bio: '',
            avatar: '',
            online: true,
            created: Date.now()
        };

        users.push(newUser);
        Database.setUsers(users);
        await Database.save();

        Database.setSession({ username: newUser.username });
        this.currentUser = newUser;
        this.renderMessenger();
        this.startAutoSync();
    },

    renderMessenger() {
        document.getElementById('authScreen').style.display = 'none';
        document.getElementById('messenger').style.display = 'block';
        document.getElementById('profileName').textContent = this.currentUser.displayName || this.currentUser.username;
        document.getElementById('profileUsername').textContent = '@' + this.currentUser.username;
        this.updateOnlineCount();
        this.renderChatList();
        this.adjustMobileView();
    },

    updateOnlineCount() {
        const users = Database.getUsers();
        const online = users.filter(u => u.online !== false).length;
        document.getElementById('onlineCount').textContent = online;
    },

    renderChatList() {
        if (!this.currentUser) return;
        const chats = Database.getChats();
        const messages = Database.getMessages();
        const chatKeys = Object.keys(chats).filter(k => k.includes(this.currentUser.username));

        let html = '';
        if (chatKeys.length === 0) {
            html = `
                <div class="empty-chats">
                    <div class="empty-icon">🔒</div>
                    <div class="empty-title">Your chats will appear here</div>
                    <div class="empty-sub">Search a user above to start a private chat.</div>
                </div>
            `;
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
                const preview = last ? last.text : 'No messages yet';
                const time = last ? this.formatTime(last.timestamp) : '';
                const users = Database.getUsers();
                const pUser = users.find(u => u.username === partner);
                const online = pUser ? pUser.online !== false : false;
                const isActive = this.currentChatId === key;

                html += `
                    <div class="chat-item ${isActive ? 'active' : ''}" data-chatkey="${key}">
                        <div class="avatar">
                            ${pUser?.avatar ? `<img src="${pUser.avatar}" />` : (pUser?.displayName || partner).charAt(0).toUpperCase()}
                            ${online ? '<span class="online-dot"></span>' : ''}
                        </div>
                        <div class="chat-info">
                            <div class="chat-name">
                                <span class="name">${pUser?.displayName || partner}</span>
                                <span class="time">${time}</span>
                            </div>
                            <div class="chat-preview">${preview}</div>
                        </div>
                    </div>
                `;
            }
        }
        document.getElementById('chatList').innerHTML = html;
        document.querySelectorAll('.chat-item').forEach(el => {
            el.addEventListener('click', () => {
                const key = el.dataset.chatkey;
                const parts = key.split('_');
                const partner = parts[0] === this.currentUser.username ? parts[1] : parts[0];
                const users = Database.getUsers();
                const user = users.find(u => u.username === partner);
                if (user) this.openChat(user);
            });
        });
    },

    async openChat(user) {
        if (!this.currentUser) return;
        this.currentChatPartner = user;
        
        // Get or create conversation
        const [a, b] = this.currentUser.username < user.username ? [this.currentUser.username, user.username] : [user.username, this.currentUser.username];
        const chatKey = `${a}_${b}`;
        this.currentChatId = chatKey;

        const chats = Database.getChats();
        if (!chats[chatKey]) {
            chats[chatKey] = { participants: [a, b], created: Date.now() };
            Database.setChats(chats);
            await Database.save();
        }

        // Load messages
        const messages = Database.getMessages();
        this.messages = messages[chatKey] || [];
        this.renderMessages();
        this.renderChatList();

        // Show chat
        document.getElementById('chatWelcome').style.display = 'none';
        document.getElementById('chatActive').style.display = 'flex';
        document.getElementById('chatPartnerName').textContent = user.displayName || user.username;
        document.getElementById('chatPartnerStatus').textContent = user.online !== false ? 'Online' : 'Offline';
        document.getElementById('chatPartnerStatus').className = 'chat-header-status' + (user.online !== false ? ' online' : '');
        document.getElementById('chatAvatar').textContent = (user.displayName || user.username).charAt(0).toUpperCase();
        
        if (this.isMobile) {
            document.getElementById('sidebar').classList.add('hidden');
            document.getElementById('chatArea').classList.add('active');
        }

        this.scrollToBottom();
    },

    renderMessages() {
        const container = document.getElementById('chatMessages');
        container.innerHTML = '';

        if (!this.messages || this.messages.length === 0) {
            container.innerHTML = `
                <div style="margin:20px auto;max-width:400px;border:2px solid var(--foreground);background:var(--card);padding:20px;text-align:center;">
                    <div style="font-size:0.625rem;text-transform:uppercase;letter-spacing:0.2em;color:var(--muted-foreground);">Start messaging</div>
                    <div style="margin-top:4px;font-size:1rem;font-weight:600;">@${this.currentChatPartner?.username}</div>
                    <div style="margin-top:8px;font-size:0.75rem;color:var(--muted-foreground);">Say hello — your first message stays encrypted in transit.</div>
                </div>
            `;
            return;
        }

        // Add date separator for first message
        let lastDate = '';
        this.messages.forEach((msg, index) => {
            const msgDate = new Date(msg.timestamp).toLocaleDateString();
            if (msgDate !== lastDate) {
                lastDate = msgDate;
                const dateDiv = document.createElement('div');
                dateDiv.className = 'msg-date';
                dateDiv.textContent = msgDate;
                container.appendChild(dateDiv);
            }

            const mine = msg.sender === this.currentUser.username;
            const div = document.createElement('div');
            div.className = `message ${mine ? 'outgoing' : 'incoming'}`;
            div.dataset.messageId = msg.id || Date.now() + Math.random().toString(36);

            // Reply indicator
            if (msg.replyTo) {
                const replyDiv = document.createElement('div');
                replyDiv.className = 'msg-reply';
                const users = Database.getUsers();
                const replySender = users.find(u => u.username === msg.replyTo.sender);
                replyDiv.innerHTML = `
                    <span class="reply-sender">${replySender?.displayName || replySender?.username || 'User'}</span>
                    <span>: ${msg.replyTo.text}</span>
                `;
                div.appendChild(replyDiv);
            }

            // Message content
            if (msg.type === 'poll' && msg.pollId) {
                const pollData = this.polls[msg.pollId];
                if (pollData) {
                    const pollDiv = document.createElement('div');
                    pollDiv.className = 'msg-poll';
                    pollDiv.innerHTML = this.renderPoll(pollData);
                    div.appendChild(pollDiv);
                } else {
                    const content = document.createElement('span');
                    content.textContent = msg.text;
                    div.appendChild(content);
                }
            } else if (msg.type === 'image' && msg.imageUrl) {
                const imgDiv = document.createElement('div');
                imgDiv.className = 'msg-image';
                imgDiv.innerHTML = `<img src="${msg.imageUrl}" alt="Image" loading="lazy" />`;
                imgDiv.addEventListener('click', () => this.viewMedia(msg.imageUrl, 'image'));
                div.appendChild(imgDiv);
            } else if (msg.type === 'video' && msg.videoUrl) {
                const videoDiv = document.createElement('div');
                videoDiv.className = 'msg-video';
                videoDiv.innerHTML = `
                    <video src="${msg.videoUrl}" preload="metadata"></video>
                    <div class="video-overlay">▶</div>
                `;
                videoDiv.addEventListener('click', () => {
                    const video = videoDiv.querySelector('video');
                    if (video.paused) {
                        video.play();
                        videoDiv.querySelector('.video-overlay').style.display = 'none';
                    } else {
                        video.pause();
                        videoDiv.querySelector('.video-overlay').style.display = 'block';
                    }
                });
                div.appendChild(videoDiv);
            } else if (msg.type === 'voice' && msg.voiceUrl) {
                const voiceDiv = document.createElement('div');
                voiceDiv.className = 'msg-voice';
                voiceDiv.innerHTML = `
                    <span class="voice-play">▶</span>
                    <div class="voice-progress"><div class="fill"></div></div>
                    <span class="voice-time">${msg.voiceDuration || '0:00'}</span>
                `;
                let audio = null;
                let isPlaying = false;
                voiceDiv.addEventListener('click', () => {
                    if (!audio) {
                        audio = new Audio(msg.voiceUrl);
                        audio.addEventListener('timeupdate', () => {
                            const progress = voiceDiv.querySelector('.voice-progress .fill');
                            if (audio.duration) {
                                progress.style.width = (audio.currentTime / audio.duration * 100) + '%';
                            }
                        });
                        audio.addEventListener('ended', () => {
                            voiceDiv.querySelector('.voice-play').textContent = '▶';
                            voiceDiv.querySelector('.voice-progress .fill').style.width = '0%';
                            isPlaying = false;
                        });
                    }
                    if (isPlaying) {
                        audio.pause();
                        voiceDiv.querySelector('.voice-play').textContent = '▶';
                        isPlaying = false;
                    } else {
                        audio.play();
                        voiceDiv.querySelector('.voice-play').textContent = '⏸';
                        isPlaying = true;
                    }
                });
                div.appendChild(voiceDiv);
            } else if (msg.type === 'file' && msg.fileData) {
                const fileDiv = document.createElement('div');
                fileDiv.className = 'msg-file';
                fileDiv.innerHTML = `
                    <div class="file-name">📄 ${msg.fileData.name}</div>
                    <div class="file-details">${msg.fileData.size} · ${msg.fileData.type}</div>
                    <div class="file-expire">Expires: ${msg.fileData.expires || 'Never'}</div>
                `;
                fileDiv.addEventListener('click', () => {
                    if (msg.fileData.data) {
                        const link = document.createElement('a');
                        link.href = msg.fileData.data;
                        link.download = msg.fileData.name;
                        link.click();
                    }
                });
                div.appendChild(fileDiv);
            } else {
                const content = document.createElement('span');
                content.textContent = msg.text;
                div.appendChild(content);
            }

            // Timestamp and status
            const timeDiv = document.createElement('div');
            timeDiv.className = 'msg-time';
            const timeText = document.createElement('span');
            timeText.textContent = this.formatTime(msg.timestamp);
            timeDiv.appendChild(timeText);

            if (mine) {
                const statusSpan = document.createElement('span');
                statusSpan.className = 'msg-status';
                if (msg.read) {
                    statusSpan.textContent = '✓✓';
                    statusSpan.classList.add('read');
                } else if (msg.sent) {
                    statusSpan.textContent = '✓✓';
                    statusSpan.classList.add('sent');
                } else if (msg.sending) {
                    statusSpan.textContent = '⌛';
                } else {
                    statusSpan.textContent = '✓';
                }
                timeDiv.appendChild(statusSpan);
            }
            div.appendChild(timeDiv);

            // Reactions
            if (msg.reactions && Object.keys(msg.reactions).length > 0) {
                const reactionsDiv = document.createElement('div');
                reactionsDiv.className = 'msg-reactions';
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

            container.appendChild(div);
        });

        this.scrollToBottom();
    },

    renderPoll(poll) {
        const votes = this.votes[poll.id] || [];
        const total = votes.length;
        const myVote = votes.find(v => v.voter === this.currentUser.username);
        let html = `
            <div class="poll-question">${poll.question}</div>
        `;
        poll.options.forEach((opt, i) => {
            const count = votes.filter(v => v.option === i).length;
            const pct = total ? Math.round((count / total) * 100) : 0;
            const chosen = myVote && myVote.option === i;
            html += `
                <div class="poll-option ${chosen ? 'voted' : ''}" data-poll="${poll.id}" data-option="${i}">
                    <div class="poll-bar" style="width:${pct}%;"></div>
                    <span class="poll-text">${opt}</span>
                    <span class="poll-count">${count} · ${pct}%</span>
                </div>
            `;
        });
        html += `<div class="poll-total">${total} vote${total === 1 ? '' : 's'}</div>`;
        return html;
    },

    formatTime(ts) {
        const d = new Date(ts);
        const now = new Date();
        const sameDay = d.toDateString() === now.toDateString();
        return sameDay
            ? d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            : d.toLocaleDateString([], { month: 'short', day: 'numeric' });
    },

    scrollToBottom() {
        setTimeout(() => {
            const container = document.getElementById('chatMessages');
            if (container) container.scrollTop = container.scrollHeight;
        }, 50);
    },

    adjustMobileView() {
        this.isMobile = window.innerWidth < 768;
        if (!this.isMobile) {
            document.getElementById('sidebar').classList.remove('hidden');
            document.getElementById('chatArea').classList.remove('active');
        }
    },

    // Search
    async searchUsers(query) {
        if (!query.trim()) {
            document.getElementById('searchResults').style.display = 'none';
            return;
        }
        const users = Database.getUsers();
        const q = query.toLowerCase();
        const found = users.filter(u =>
            u.username !== this.currentUser.username &&
            (u.username.toLowerCase().includes(q) ||
            (u.displayName && u.displayName.toLowerCase().includes(q)) ||
            (u.email && u.email.toLowerCase().includes(q)))
        );

        // We'll render search results directly in the chat list
        const chatList = document.getElementById('chatList');
        if (found.length === 0) {
            chatList.innerHTML = `
                <div class="empty-chats">
                    <div class="empty-icon">🔍</div>
                    <div class="empty-title">No users found</div>
                    <div class="empty-sub">Try a different search term</div>
                </div>
            `;
            return;
        }

        let html = `<div style="padding:4px 0;"><div style="padding:4px 12px 8px;font-size:0.6875rem;text-transform:uppercase;letter-spacing:0.1em;color:var(--muted-foreground);">Users</div>`;
        for (const u of found) {
            html += `
                <div class="chat-item" data-username="${u.username}">
                    <div class="avatar">${(u.displayName || u.username).charAt(0).toUpperCase()}</div>
                    <div class="chat-info">
                        <div class="chat-name">
                            <span class="name">${u.displayName || u.username}</span>
                        </div>
                        <div class="chat-preview">@${u.username}</div>
                    </div>
                </div>
            `;
        }
        html += '</div>';
        chatList.innerHTML = html;

        document.querySelectorAll('.chat-item[data-username]').forEach(el => {
            el.addEventListener('click', () => {
                const username = el.dataset.username;
                const users = Database.getUsers();
                const user = users.find(u => u.username === username);
                if (user) {
                    document.getElementById('searchInput').value = '';
                    this.openChat(user);
                }
            });
        });
    },

    // Send message
    async sendMessage() {
        if (!this.currentUser || !this.currentChatPartner || !this.currentChatId) return;
        const input = document.getElementById('messageInput');
        const text = input.value.trim();
        if (!text) return;

        input.value = '';
        const replyTo = this.replyTo;
        this.replyTo = null;
        document.getElementById('replyBar').style.display = 'none';

        // Check for poll command
        const poll = this.parsePollCommand(text);
        if (poll) {
            await this.createPollMessage(poll);
            return;
        }

        // Normal message
        const message = {
            id: Date.now() + Math.random().toString(36),
            sender: this.currentUser.username,
            text: text,
            timestamp: Date.now(),
            sending: true,
            sent: false,
            read: false,
            type: 'text',
            replyTo: replyTo ? { sender: replyTo.sender, text: replyTo.text } : null,
            reactions: {}
        };

        this.messages.push(message);
        this.saveMessages();
        this.renderMessages();
        this.renderChatList();

        // Simulate send success
        setTimeout(() => {
            message.sending = false;
            message.sent = true;
            this.saveMessages();
            this.renderMessages();
        }, 500);

        // Simulate read receipt        setTimeout(() => {
            message.read = true;
            this.saveMessages();
            this.renderMessages();
        }, 2000);
    },

    parsePollCommand(text) {
        if (!text.toLowerCase().startsWith('/poll')) return null;
        const body = text.slice(text.toLowerCase().indexOf('/poll') + 5);
        const parts = body.split('/').map(s => s.trim()).filter(Boolean);
        let question = '';
        const options = [];
        for (const p of parts) {
            const m = /^([A-Za-z0-9]+)\s*:\s*(.+)$/.exec(p);
            if (!m) continue;
            const key = m[1].toUpperCase();
            const val = m[2].trim();
            if (key === 'QUE') question = val;
            else if (/^ANS[1-5]$/.test(key)) options.push(val);
        }
        if (!question || options.length < 2) return null;
        return { question, options: options.slice(0, 5) };
    },

    async createPollMessage(poll) {
        const pollId = Date.now() + Math.random().toString(36);
        const message = {
            id: Date.now() + Math.random().toString(36),
            sender: this.currentUser.username,
            text: poll.question,
            timestamp: Date.now(),
            sending: true,
            sent: false,
            read: false,
            type: 'poll',
            pollId: pollId,
            reactions: {}
        };

        this.polls[pollId] = {
            id: pollId,
            question: poll.question,
            options: poll.options,
            creator: this.currentUser.username
        };
        this.votes[pollId] = [];

        this.messages.push(message);
        this.saveMessages();
        this.renderMessages();
        this.renderChatList();

        setTimeout(() => {
            message.sending = false;
            message.sent = true;
            this.saveMessages();
            this.renderMessages();
        }, 500);
    },

    saveMessages() {
        const messages = Database.getMessages();
        messages[this.currentChatId] = this.messages;
        Database.setMessages(messages);
        Database.save();
    },

    // Poll voting
    async votePoll(pollId, optionIndex) {
        const votes = this.votes[pollId] || [];
        const existing = votes.find(v => v.voter === this.currentUser.username);
        if (existing) {
            if (existing.option === optionIndex) {
                // Remove vote
                this.votes[pollId] = votes.filter(v => v.voter !== this.currentUser.username);
            } else {
                // Change vote
                existing.option = optionIndex;
            }
        } else {
            votes.push({ voter: this.currentUser.username, option: optionIndex });
            this.votes[pollId] = votes;
        }
        this.renderMessages();
    },

    // Reactions
    openReactionModal() {
        if (this.messages.length === 0) return;
        const lastMsg = this.messages[this.messages.length - 1];
        this.reactingToMessage = lastMsg.id;
        document.getElementById('reactionModal').classList.add('show');
    },

    closeReactionModal() {
        document.getElementById('reactionModal').classList.remove('show');
        this.reactingToMessage = null;
    },

    async addReaction(emoji) {
        if (!this.reactingToMessage) return;
        const msg = this.messages.find(m => m.id === this.reactingToMessage);
        if (!msg) return;

        if (!msg.reactions) msg.reactions = {};
        if (!msg.reactions[emoji]) msg.reactions[emoji] = [];

        const userIndex = msg.reactions[emoji].indexOf(this.currentUser.username);
        if (userIndex !== -1) {
            msg.reactions[emoji].splice(userIndex, 1);
            if (msg.reactions[emoji].length === 0) {
                delete msg.reactions[emoji];
            }
        } else {
            msg.reactions[emoji].push(this.currentUser.username);
        }

        this.saveMessages();
        this.renderMessages();
        this.closeReactionModal();
    },

    toggleReaction(messageId, emoji) {
        const msg = this.messages.find(m => m.id === messageId);
        if (!msg) return;

        if (!msg.reactions) msg.reactions = {};
        if (!msg.reactions[emoji]) msg.reactions[emoji] = [];

        const userIndex = msg.reactions[emoji].indexOf(this.currentUser.username);
        if (userIndex !== -1) {
            msg.reactions[emoji].splice(userIndex, 1);
            if (msg.reactions[emoji].length === 0) {
                delete msg.reactions[emoji];
            }
        } else {
            msg.reactions[emoji].push(this.currentUser.username);
        }

        this.saveMessages();
        this.renderMessages();
    },

    // Attachments
    handleAttach(type) {
        switch(type) {
            case 'photo':
            case 'video':
                const input = document.createElement('input');
                input.type = 'file';
                input.accept = type === 'photo' ? 'image/*' : 'video/*';
                input.onchange = (e) => {
                    const file = e.target.files[0];
                    if (file) this.sendMedia(file, type);
                };
                input.click();
                break;
            case 'voice':
                this.openVoiceRecorder();
                break;
            case 'file':
                const fileInput = document.createElement('input');
                fileInput.type = 'file';
                fileInput.onchange = (e) => {
                    const file = e.target.files[0];
                    if (file) this.sendFile(file);
                };
                fileInput.click();
                break;
        }
    },

    sendMedia(file, type) {
        const reader = new FileReader();
        reader.onload = (e) => {
            const dataUrl = e.target.result;
            const message = {
                id: Date.now() + Math.random().toString(36),
                sender: this.currentUser.username,
                text: type === 'image' ? '📷 Photo' : '🎬 Video',
                timestamp: Date.now(),
                sending: true,
                sent: false,
                read: false,
                type: type,
                [type === 'image' ? 'imageUrl' : 'videoUrl']: dataUrl,
                reactions: {}
            };
            this.messages.push(message);
            this.saveMessages();
            this.renderMessages();
            this.renderChatList();

            setTimeout(() => {
                message.sending = false;
                message.sent = true;
                this.saveMessages();
                this.renderMessages();
            }, 800);
        };
        reader.readAsDataURL(file);
    },

    sendFile(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            const message = {
                id: Date.now() + Math.random().toString(36),
                sender: this.currentUser.username,
                text: `📄 ${file.name}`,
                timestamp: Date.now(),
                sending: true,
                sent: false,
                read: false,
                type: 'file',
                fileData: {
                    name: file.name,
                    type: file.type || 'Unknown',
                    size: this.formatFileSize(file.size),
                    data: e.target.result,
                    expires: '24 hours'
                },
                reactions: {}
            };
            this.messages.push(message);
            this.saveMessages();
            this.renderMessages();
            this.renderChatList();

            setTimeout(() => {
                message.sending = false;
                message.sent = true;
                this.saveMessages();
                this.renderMessages();
            }, 800);
        };
        reader.readAsDataURL(file);
    },

    formatFileSize(bytes) {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
        if (bytes < 1073741824) return (bytes / 1048576).toFixed(1) + ' MB';
        return (bytes / 1073741824).toFixed(1) + ' GB';
    },

    // Voice recorder
    openVoiceRecorder() {
        document.getElementById('voiceRecorder').classList.add('show');
        document.getElementById('recordingTimer').textContent = '00:00';
        document.getElementById('startRecordingBtn').style.display = 'block';
        document.getElementById('stopRecordingBtn').style.display = 'none';
        document.getElementById('sendVoiceBtn').style.display = 'none';
        this.recordingSeconds = 0;
        this.audioChunks = [];
    },

    closeVoiceRecorder() {
        document.getElementById('voiceRecorder').classList.remove('show');
        if (this.mediaRecorder && this.isRecording) {
            this.mediaRecorder.stop();
            this.isRecording = false;
        }
        if (this.recordingTimer) {
            clearInterval(this.recordingTimer);
            this.recordingTimer = null;
        }
    },

    async startRecording() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            this.mediaRecorder = new MediaRecorder(stream);
            this.audioChunks = [];
            this.isRecording = true;

            this.mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) this.audioChunks.push(e.data);
            };

            this.mediaRecorder.onstop = () => {
                const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
                const reader = new FileReader();
                reader.onload = (e) => {
                    this.voiceData = e.target.result;
                    document.getElementById('sendVoiceBtn').style.display = 'block';
                };
                reader.readAsDataURL(audioBlob);
                this.isRecording = false;
            };

            this.mediaRecorder.start();
            document.getElementById('startRecordingBtn').style.display = 'none';
            document.getElementById('stopRecordingBtn').style.display = 'block';

            this.recordingSeconds = 0;
            this.recordingTimer = setInterval(() => {
                this.recordingSeconds++;
                const mins = String(Math.floor(this.recordingSeconds / 60)).padStart(2, '0');
                const secs = String(this.recordingSeconds % 60).padStart(2, '0');
                document.getElementById('recordingTimer').textContent = `${mins}:${secs}`;
            }, 1000);
        } catch (error) {
            alert('Microphone access denied. Please allow microphone permissions.');
        }
    },

    stopRecording() {
        if (this.mediaRecorder && this.isRecording) {
            this.mediaRecorder.stop();
            document.getElementById('stopRecordingBtn').style.display = 'none';
            if (this.recordingTimer) {
                clearInterval(this.recordingTimer);
                this.recordingTimer = null;
            }
        }
    },

    sendVoiceMessage() {
        if (!this.voiceData) return;
        const duration = this.recordingSeconds;
        const message = {
            id: Date.now() + Math.random().toString(36),
            sender: this.currentUser.username,
            text: '🎤 Voice message',
            timestamp: Date.now(),
            sending: true,
            sent: false,
            read: false,
            type: 'voice',
            voiceUrl: this.voiceData,
            voiceDuration: `${String(Math.floor(duration / 60)).padStart(2, '0')}:${String(duration % 60).padStart(2, '0')}`,
            reactions: {}
        };
        this.messages.push(message);
        this.saveMessages();
        this.renderMessages();
        this.renderChatList();
        this.closeVoiceRecorder();

        setTimeout(() => {
            message.sending = false;
            message.sent = true;
            this.saveMessages();
            this.renderMessages();
        }, 800);
    },

    // Profile
    showProfile(user) {
        const avatar = document.getElementById('profileModalAvatar');
        avatar.textContent = (user.displayName || user.username).charAt(0).toUpperCase();
        if (user.avatar) {
            avatar.innerHTML = `<img src="${user.avatar}" />`;
        }
        document.getElementById('profileModalName').textContent = user.displayName || user.username;
        document.getElementById('profileModalUsername').textContent = '@' + user.username;
        document.getElementById('profileModalStatus').textContent = user.online !== false ? 'Online now' : 'Last seen recently';
        document.getElementById('profileModalBio').textContent = user.bio || 'No bio yet.';
        document.getElementById('profileModalMessage').style.display = user.username === this.currentUser.username ? 'none' : 'block';
        document.getElementById('profileModal').classList.add('show');
    },

    closeProfile() {
        document.getElementById('profileModal').classList.remove('show');
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
        document.getElementById('setTheme').value = this.settings.theme || 'dark';
        document.getElementById('setMsgSize').value = this.settings.msgSize || 'medium';
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
            password: newPassword || users[userIndex].password
        };

        this.settings = {
            ...this.settings,
            lastSeen: document.getElementById('setLastSeen').value,
            readReceipts: document.getElementById('setReadReceipts').value,
            theme: document.getElementById('setTheme').value,
            msgSize: document.getElementById('setMsgSize').value
        };

        Database.setUsers(users);
        this.currentUser = users[userIndex];
        if (username !== this.currentUser.username) {
            Database.setSession({ username });
        }
        this.saveSettings();
        await Database.save();

        // Update UI
        document.getElementById('profileName').textContent = this.currentUser.displayName || this.currentUser.username;
        document.getElementById('profileUsername').textContent = '@' + this.currentUser.username;
        if (this.currentChatPartner) {
            document.getElementById('chatPartnerName').textContent = this.currentChatPartner.displayName || this.currentChatPartner.username;
        }
        this.renderChatList();
        this.closeSettings();
        alert('Settings saved successfully!');
    },

    openChatSettings() {
        // Simple chat settings menu
        const options = ['View Profile', 'Pin Messages', 'Clear Chat'];
        // We'll implement these in a dropdown menu
        const user = this.currentChatPartner;
        if (user) this.showProfile(user);
    },

    async deleteAccount() {
        if (!confirm('Are you sure you want to delete your account? This cannot be undone!')) return;
        if (!confirm('All your messages and data will be permanently deleted. Continue?')) return;

        const users = Database.getUsers();
        const filtered = users.filter(u => u.username !== this.currentUser.username);
        Database.setUsers(filtered);

        // Delete all chats and messages
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
        this.currentChatId = null;
        if (this.syncInterval) clearInterval(this.syncInterval);
        document.getElementById('authScreen').style.display = 'flex';
        document.getElementById('messenger').style.display = 'none';
        document.getElementById('settingsModal').classList.remove('show');
        document.getElementById('profileModal').classList.remove('show');
    },

    // Sync
    async syncWithRemote() {
        await Database.load();
        const session = Database.getSession();
        if (!session || !this.currentUser) return;

        const users = Database.getUsers();
        const user = users.find(u => u.username === this.currentUser.username);
        if (user) {
            this.currentUser = user;
        }

        // Update online count
        this.updateOnlineCount();

        // Refresh chat list
        this.renderChatList();

        // Refresh messages if chat is open
        if (this.currentChatId) {
            const messages = Database.getMessages();
            const newMessages = messages[this.currentChatId] || [];
            if (newMessages.length !== this.messages.length) {
                this.messages = newMessages;
                this.renderMessages();
            }
        }
    },

    goBack() {
        if (this.isMobile) {
            document.getElementById('sidebar').classList.remove('hidden');
            document.getElementById('chatArea').classList.remove('active');
        }
        this.currentChatPartner = null;
        this.currentChatId = null;
        document.getElementById('chatWelcome').style.display = 'flex';
        document.getElementById('chatActive').style.display = 'none';
    },

    viewMedia(url, type) {
        const modal = document.getElementById('mediaViewer');
        const content = document.getElementById('mediaContent');
        if (type === 'image') {
            content.innerHTML = `<img src="${url}" style="max-width:90vw;max-height:80vh;border-radius:12px;" />`;
        } else {
            content.innerHTML = `<video src="${url}" controls style="max-width:90vw;max-height:80vh;border-radius:12px;" autoplay></video>`;
        }
        modal.classList.add('show');
        document.getElementById('closeMedia').onclick = () => {
            modal.classList.remove('show');
            content.innerHTML = '';
        };
        modal.onclick = (e) => {
            if (e.target === modal) {
                modal.classList.remove('show');
                content.innerHTML = '';
            }
        };
    }
};

// Initialize when page loads
document.addEventListener('DOMContentLoaded', () => {
    App.init();
});
