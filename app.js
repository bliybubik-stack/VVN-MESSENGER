// app.js - VVN Main Application

class VVNApp {
    constructor() {
        this.db = window.vvnDB;
        this.crypto = window.vvnCrypto;
        this.currentUser = null;
        this.currentChat = null;
        this.currentChatPartner = null;
        this.isMobile = window.innerWidth < 768;
        this.settings = {
            encryption_level: 5,
            last_seen_visibility: 'everyone',
            read_receipts: 'on',
            theme: 'dark',
            message_animation: 'slide'
        };
        this.pendingMessages = [];
        this.replyTo = null;
        this.selectedMessages = [];
        this.isSelectMode = false;
        this.reactionEmojis = ['👍', '❤️', '😂', '😮', '😢', '🙏'];
    }

    // ---------- INITIALIZATION ----------
    async init() {
        // Show loading
        this.showLoading(true);
        this.updateLoadingStatus('Initializing secure connection...');

        // Initialize database
        await this.db.init();
        this.updateLoadingStatus('Loading secure data...');

        // Check for session
        const session = localStorage.getItem('vvn_session');
        if (session) {
            try {
                const userData = JSON.parse(session);
                const user = this.db.getUserById(userData.id);
                if (user) {
                    this.currentUser = user;
                    this.updateLoadingStatus('Welcome back!');
                    this.showAuth(false);
                    this.showMessenger(true);
                    this.loadChats();
                    this.setupAutoRefresh();
                    this.hideLoading();
                    return;
                }
            } catch (e) {
                console.warn('Session invalid');
            }
        }

        // Show auth screen
        this.updateLoadingStatus('Ready');
        this.showAuth(true);
        this.showMessenger(false);
        this.hideLoading();
        this.setupAuthListeners();
    }

    // ---------- LOADING ----------
    showLoading(show) {
        const overlay = document.getElementById('loadingOverlay');
        if (show) {
            overlay.classList.remove('hidden');
        } else {
            setTimeout(() => overlay.classList.add('hidden'), 300);
        }
    }

    updateLoadingStatus(text) {
        document.getElementById('loadingStatus').textContent = text;
        const fill = document.getElementById('loaderFill');
        const progress = Math.min(100, (text.length / 50) * 100 + 20);
        fill.style.width = Math.min(progress, 100) + '%';
    }

    hideLoading() {
        this.showLoading(false);
    }

    // ---------- AUTH ----------
    showAuth(show) {
        document.getElementById('authScreen').style.display = show ? 'flex' : 'none';
    }

    showMessenger(show) {
        document.getElementById('messenger').style.display = show ? 'flex' : 'none';
    }

    setupAuthListeners() {
        // Tab switching
        document.getElementById('signinTab').addEventListener('click', () => {
            document.getElementById('signinTab').classList.add('active');
            document.getElementById('signupTab').classList.remove('active');
            document.getElementById('displayNameGroup').style.display = 'none';
            document.getElementById('authBtn').textContent = 'Enter VNN';
        });

        document.getElementById('signupTab').addEventListener('click', () => {
            document.getElementById('signupTab').classList.add('active');
            document.getElementById('signinTab').classList.remove('active');
            document.getElementById('displayNameGroup').style.display = 'block';
            document.getElementById('authBtn').textContent = 'Create account';
        });

        // Form submit
        document.getElementById('authForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const username = document.getElementById('authUsername').value.trim();
            const password = document.getElementById('authPassword').value;
            const isSignup = document.getElementById('signupTab').classList.contains('active');

            if (!username || !password) {
                this.showAuthError('Please fill in all fields');
                return;
            }

            try {
                document.getElementById('authBtn').disabled = true;
                document.getElementById('authBtn').textContent = 'Please wait...';

                if (isSignup) {
                    const displayName = document.getElementById('authDisplayName').value.trim() || username;
                    await this.db.createUser(username, password, displayName);
                    const user = this.db.getUserByUsername(username);
                    this.currentUser = user;
                    localStorage.setItem('vvn_session', JSON.stringify({ id: user.id }));
                    this.showAuthError('');
                    this.showAuth(false);
                    this.showMessenger(true);
                    this.loadChats();
                    this.setupAutoRefresh();
                } else {
                    const user = await this.db.loginUser(username, password);
                    this.currentUser = user;
                    localStorage.setItem('vvn_session', JSON.stringify({ id: user.id }));
                    this.showAuthError('');
                    this.showAuth(false);
                    this.showMessenger(true);
                    this.loadChats();
                    this.setupAutoRefresh();
                }
            } catch (error) {
                this.showAuthError(error.message);
            } finally {
                document.getElementById('authBtn').disabled = false;
                document.getElementById('authBtn').textContent = isSignup ? 'Create account' : 'Enter VNN';
            }
        });

        // Enter key submit
        document.getElementById('authPassword').addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                document.getElementById('authForm').dispatchEvent(new Event('submit'));
            }
        });
    }

    showAuthError(msg) {
        const errorEl = document.getElementById('authError');
        if (msg) {
            errorEl.textContent = msg;
            errorEl.style.display = 'block';
        } else {
            errorEl.style.display = 'none';
        }
    }

    // ---------- SYNC STATUS ----------
    setupAutoRefresh() {
        // Update online status
        this.updateOnlineStatus();

        // Sync every 3 seconds
        setInterval(() => {
            this.db.syncWithRemote();
        }, 3000);

        // Refresh UI on sync
        window.refreshUI = () => {
            if (this.currentUser) {
                this.loadChats();
                if (this.currentChat) {
                    this.loadMessages(this.currentChat);
                }
            }
        };

        window.updateSyncStatus = (text, color) => {
            const dot = document.getElementById('syncDot');
            const status = document.getElementById('syncStatus');
            dot.className = 'status-dot ' + color;
            status.textContent = text;
        };
    }

    updateOnlineStatus() {
        // Update user status periodically
        setInterval(() => {
            if (this.currentUser) {
                this.db.updateUser(this.currentUser.id, {
                    last_seen: new Date().toISOString()
                });
            }
        }, 30000);

        // Update online count
        setInterval(() => {
            const users = this.db.localCache.users || [];
            const online = users.filter(u => {
                const lastSeen = new Date(u.last_seen);
                return Date.now() - lastSeen.getTime() < 60000;
            });
            document.getElementById('onlineCount').textContent = online.length;
        }, 15000);
    }

    // ---------- CHATS ----------
    async loadChats() {
        if (!this.currentUser) return;

        const chats = this.db.getChats(this.currentUser.id);
        const chatList = document.getElementById('chatList');

        if (chats.length === 0) {
            chatList.innerHTML = `
                <div class="empty-chats">
                    <div class="empty-icon">🔒</div>
                    <div class="empty-title">Your chats will appear here</div>
                    <div class="empty-desc">Search a user above to start a private chat.</div>
                </div>
            `;
            return;
        }

        let html = '';
        for (const chat of chats) {
            const messages = this.db.getMessages(chat.id);
            const lastMsg = messages.length > 0 ? messages[messages.length - 1] : null;
            const isActive = this.currentChat && this.currentChat.id === chat.id;

            html += `
                <div class="chat-item ${isActive ? 'active' : ''}" data-chat-id="${chat.id}" data-user-id="${chat.otherUser.id}">
                    <div class="avatar">${this.getInitials(chat.otherUser.display_name || chat.otherUser.username)}</div>
                    <div class="info">
                        <div class="name">${chat.otherUser.display_name || chat.otherUser.username}</div>
                        <div class="preview">${lastMsg ? lastMsg.content : 'No messages yet'}</div>
                    </div>
                    <div class="time">${lastMsg ? this.formatTime(lastMsg.created_at) : ''}</div>
                </div>
            `;
        }

        chatList.innerHTML = html;

        // Add click listeners
        chatList.querySelectorAll('.chat-item').forEach(el => {
            el.addEventListener('click', () => {
                const chatId = el.dataset.chatId;
                const userId = el.dataset.userId;
                const chat = this.db.localCache.chats[Object.keys(this.db.localCache.chats).find(
                    key => this.db.localCache.chats[key].id === chatId
                )];
                if (chat) {
                    this.openChat(chat, userId);
                }
            });
        });

        // Update user profile
        this.updateUserProfile();
    }

    async openChat(chat, partnerId) {
        this.currentChat = chat;
        this.currentChatPartner = this.db.getUserById(partnerId);
        
        // Show chat area
        document.getElementById('chatPlaceholder').style.display = 'none';
        document.getElementById('chatActive').style.display = 'flex';
        document.getElementById('chatHeader').style.display = 'flex';
        document.getElementById('chatInputBar')?.classList.remove('hidden');

        // Update header
        const partner = this.currentChatPartner;
        document.getElementById('chatPartnerName').textContent = partner.display_name || partner.username;
        document.getElementById('chatPartnerStatus').textContent = this.isUserOnline(partner) ? 'Online' : 'Offline';
        document.getElementById('chatAvatar').textContent = this.getInitials(partner.display_name || partner.username);

        // Load messages
        this.loadMessages(chat.id);

        // Mark as read
        this.db.markAsRead(chat.id, this.currentUser.id);

        // Mobile view
        if (this.isMobile) {
            document.getElementById('sidebar').classList.add('hide-mobile');
            document.getElementById('chatArea').classList.add('active-mobile');
        }

        // Update chat list
        this.loadChats();
    }

    loadMessages(chatId) {
        const messages = this.db.getMessages(chatId);
        const container = document.getElementById('chatMessages');
        
        if (messages.length === 0) {
            container.innerHTML = `
                <div style="text-align:center;color:var(--text-secondary);padding:40px 20px;font-size:0.85rem;">
                    No messages yet.<br>Say hello!
                </div>
            `;
            return;
        }

        let html = '';
        let lastDate = '';

        for (const msg of messages) {
            const msgDate = new Date(msg.created_at).toDateString();
            if (msgDate !== lastDate) {
                html += `<div class="message-date-divider">${new Date(msg.created_at).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}</div>`;
                lastDate = msgDate;
            }

            const isMine = msg.sender_id === this.currentUser.id;
            const sender = isMine ? this.currentUser : this.currentChatPartner;
            const reactions = msg.reactions || {};
            const reactionList = Object.values(reactions);

            html += `
                <div class="message ${isMine ? 'outgoing' : 'incoming'}" data-msg-id="${msg.id}" data-chat-id="${chatId}">
                    ${msg.reply_to_id ? `<div class="msg-reply">↩️ ${this.getMessageContent(msg.reply_to_id, chatId)}</div>` : ''}
                    ${msg.type === 'poll' ? this.renderPoll(msg) : msg.content}
                    <div class="msg-time">${this.formatTime(msg.created_at)}</div>
                    ${reactionList.length > 0 ? `<div style="display:flex;gap:4px;margin-top:4px;flex-wrap:wrap;">${reactionList.map(r => `<span style="background:var(--bg-input);padding:0 6px;border-radius:12px;font-size:0.8rem;">${r}</span>`).join('')}</div>` : ''}
                </div>
            `;
        }

        container.innerHTML = html;
        this.scrollToBottom();

        // Add message click listeners for selection
        if (this.isSelectMode) {
            container.querySelectorAll('.message').forEach(el => {
                el.addEventListener('click', () => {
                    const msgId = el.dataset.msgId;
                    this.toggleMessageSelection(msgId);
                });
            });
        }

        // Add reaction buttons (hover)
        container.querySelectorAll('.message').forEach(el => {
            el.addEventListener('dblclick', () => {
                const msgId = el.dataset.msgId;
                this.showReactionPicker(msgId);
            });
        });
    }

    getMessageContent(msgId, chatId) {
        const messages = this.db.getMessages(chatId);
        const msg = messages.find(m => m.id === msgId);
        return msg ? msg.content : 'Message not found';
    }

    renderPoll(msg) {
        const poll = this.db.localCache.polls ? this.db.localCache.polls[msg.poll_id] : null;
        if (!poll) return msg.content;

        const votes = this.db.localCache.poll_votes ? this.db.localCache.poll_votes[poll.id] || [] : [];
        const total = votes.length;
        const userVote = votes.find(v => v.voter_id === this.currentUser.id);

        let html = `<div style="background:var(--bg-input);padding:12px;border-radius:12px;margin:4px 0;">`;
        html += `<div style="font-weight:600;margin-bottom:8px;">📊 ${poll.question}</div>`;
        
        for (let i = 0; i < poll.options.length; i++) {
            const count = votes.filter(v => v.option_index === i).length;
            const pct = total > 0 ? Math.round((count / total) * 100) : 0;
            const isVoted = userVote && userVote.option_index === i;
            
            html += `
                <div style="margin-bottom:6px;cursor:pointer;" onclick="vvnApp.voteOnPoll('${poll.id}', ${i})">
                    <div style="display:flex;justify-content:space-between;font-size:0.8rem;margin-bottom:2px;">
                        <span>${poll.options[i]} ${isVoted ? '✓' : ''}</span>
                        <span style="color:var(--text-secondary);">${count} (${pct}%)</span>
                    </div>
                    <div style="background:var(--bg-primary);height:4px;border-radius:4px;overflow:hidden;">
                        <div style="background:${isVoted ? 'var(--online)' : 'var(--text-secondary)'};height:100%;width:${pct}%;transition:width 0.3s;"></div>
                    </div>
                </div>
            `;
        }
        
        html += `<div style="font-size:0.7rem;color:var(--text-secondary);margin-top:8px;">${total} vote${total !== 1 ? 's' : ''}</div>`;
        html += `</div>`;
        
        return html;
    }

    async voteOnPoll(pollId, optionIndex) {
        await this.db.voteOnPoll(pollId, this.currentUser.id, optionIndex);
        if (this.currentChat) {
            this.loadMessages(this.currentChat.id);
        }
    }

    // ---------- MESSAGE ACTIONS ----------
    async sendMessage() {
        const input = document.getElementById('messageInput');
        const text = input.value.trim();
        if (!text || !this.currentChat) return;

        const replyToId = this.replyTo ? this.replyTo.id : null;
        
        // Check for poll command
        if (text.toLowerCase().startsWith('/poll')) {
            const pollData = this.parsePollCommand(text);
            if (pollData) {
                await this.db.createPoll(this.currentChat.id, this.currentUser.id, pollData.question, pollData.options);
                input.value = '';
                this.replyTo = null;
                this.loadMessages(this.currentChat.id);
                return;
            }
        }

        // Send message
        const msg = await this.db.sendMessage(
            this.currentChat.id,
            this.currentUser.id,
            text,
            replyToId
        );

        input.value = '';
        this.replyTo = null;
        this.loadMessages(this.currentChat.id);
        this.loadChats();
        this.scrollToBottom();
    }

    parsePollCommand(text) {
        // Format: /poll / QUE: Question / ANS1: Option 1 / ANS2: Option 2 / ANS3: Option 3
        const parts = text.split('/').map(s => s.trim()).filter(Boolean);
        let question = '';
        const options = [];
        
        for (const part of parts) {
            const match = part.match(/^(QUE|ANS[1-5])\s*:\s*(.+)$/i);
            if (match) {
                const key = match[1].toUpperCase();
                const value = match[2].trim();
                if (key === 'QUE') {
                    question = value;
                } else if (/^ANS[1-5]$/.test(key) && value) {
                    options.push(value);
                }
            }
        }

        if (question && options.length >= 2) {
            return { question, options: options.slice(0, 5) };
        }
        return null;
    }

    async deleteMessage(msgId, chatId, forEveryone = false) {
        await this.db.deleteMessage(msgId, chatId, forEveryone);
        this.loadMessages(chatId);
        this.loadChats();
    }

    async togglePinMessage(msgId, chatId) {
        await this.db.pinMessage(msgId, chatId);
        this.loadMessages(chatId);
    }

    async reactToMessage(msgId, chatId, emoji) {
        await this.db.reactToMessage(msgId, chatId, emoji, this.currentUser.id);
        this.loadMessages(chatId);
    }

    showReactionPicker(msgId) {
        // Simple implementation - show emoji buttons
        const picker = document.createElement('div');
        picker.style.cssText = `
            position: fixed;
            bottom: 80px;
            left: 50%;
            transform: translateX(-50%);
            background: var(--bg-card);
            border: 1px solid var(--border-color);
            border-radius: 12px;
            padding: 8px 12px;
            display: flex;
            gap: 6px;
            z-index: 1000;
            box-shadow: var(--shadow);
        `;

        const chatId = this.currentChat.id;
        for (const emoji of this.reactionEmojis) {
            const btn = document.createElement('button');
            btn.textContent = emoji;
            btn.style.cssText = `
                background: transparent;
                border: none;
                font-size: 1.5rem;
                padding: 4px 8px;
                cursor: pointer;
                border-radius: 8px;
                transition: background 0.2s;
            `;
            btn.onmouseover = () => btn.style.background = 'var(--bg-hover)';
            btn.onmouseout = () => btn.style.background = 'transparent';
            btn.onclick = () => {
                this.reactToMessage(msgId, chatId, emoji);
                picker.remove();
            };
            picker.appendChild(btn);
        }

        document.body.appendChild(picker);
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (picker.parentNode) picker.remove();
        }, 5000);
    }

    toggleMessageSelection(msgId) {
        const index = this.selectedMessages.indexOf(msgId);
        if (index > -1) {
            this.selectedMessages.splice(index, 1);
        } else {
            this.selectedMessages.push(msgId);
        }
        
        // Update UI - highlight selected messages
        document.querySelectorAll('.message').forEach(el => {
            if (el.dataset.msgId === msgId) {
                el.style.border = this.selectedMessages.includes(msgId) ? '2px solid var(--online)' : '';
                el.style.opacity = this.selectedMessages.includes(msgId) ? '0.8' : '1';
            }
        });
    }

    // ---------- SETTINGS ----------
    showSettings() {
        const modal = document.getElementById('settingsModal');
        modal.classList.add('active');
        
        // Load current settings
        if (this.currentUser) {
            document.getElementById('setDisplayName').value = this.currentUser.display_name || '';
            document.getElementById('setBio').value = this.currentUser.bio || '';
            document.getElementById('setAvatar').value = this.currentUser.avatar_url || '';
            document.getElementById('setUsername').value = this.currentUser.username || '';
            document.getElementById('setEmail').value = this.currentUser.email || '';
            
            const settings = this.currentUser.settings || {};
            document.getElementById('setEncryption').value = settings.encryption_level || 5;
            document.getElementById('setLastSeen').value = settings.last_seen_visibility || 'everyone';
            document.getElementById('setReadReceipts').value = settings.read_receipts || 'on';
            document.getElementById('setTheme').value = settings.theme || 'dark';
            document.getElementById('setAnimation').value = settings.message_animation || 'slide';
        }
    }

    async saveSettings() {
        if (!this.currentUser) return;

        const updates = {
            display_name: document.getElementById('setDisplayName').value.trim() || this.currentUser.username,
            bio: document.getElementById('setBio').value.trim(),
            avatar_url: document.getElementById('setAvatar').value.trim(),
            username: document.getElementById('setUsername').value.trim(),
            email: document.getElementById('setEmail').value.trim(),
            settings: {
                encryption_level: parseInt(document.getElementById('setEncryption').value),
                last_seen_visibility: document.getElementById('setLastSeen').value,
                read_receipts: document.getElementById('setReadReceipts').value,
                theme: document.getElementById('setTheme').value,
                message_animation: document.getElementById('setAnimation').value
            }
        };

        try {
            await this.db.updateUser(this.currentUser.id, updates);
            this.currentUser = this.db.getUserById(this.currentUser.id);
            localStorage.setItem('vvn_session', JSON.stringify({ id: this.currentUser.id }));
            this.updateUserProfile();
            this.loadChats();
            document.getElementById('settingsModal').classList.remove('active');
        } catch (e) {
            alert('Failed to save settings: ' + e.message);
        }
    }

    // ---------- USER PROFILE ----------
    updateUserProfile() {
        if (!this.currentUser) return;
        document.getElementById('sidebarUsername').textContent = this.currentUser.display_name || this.currentUser.username;
        document.getElementById('sidebarUserHandle').textContent = this.currentUser.username;
        document.getElementById('userAvatar').textContent = this.getInitials(this.currentUser.display_name || this.currentUser.username);
    }

    showUserProfile(user) {
        const modal = document.getElementById('profileModal');
        modal.classList.add('active');
        
        document.getElementById('profileDisplayName').textContent = user.display_name || user.username;
        document.getElementById('profileUsername').textContent = '@' + user.username;
        document.getElementById('profileStatus').textContent = this.isUserOnline(user) ? 'Online' : 'Offline';
        document.getElementById('profileBio').textContent = user.bio || 'No bio yet.';
        document.getElementById('profileAvatar').textContent = this.getInitials(user.display_name || user.username);
        
        // Message button
        const msgBtn = document.getElementById('profileMessageBtn');
        if (user.id === this.currentUser.id) {
            msgBtn.style.display = 'none';
        } else {
            msgBtn.style.display = 'block';
            msgBtn.onclick = () => {
                modal.classList.remove('active');
                this.findOrCreateChat(user.id);
            };
        }
    }

    async findOrCreateChat(userId) {
        const chat = await this.db.getOrCreateChat(this.currentUser.id, userId);
        this.currentChat = chat;
        this.currentChatPartner = this.db.getUserById(userId);
        this.openChat(chat, userId);
    }

    // ---------- UTILITY ----------
    getInitials(name) {
        return name.split(/\s+/).map(w => w[0]).join('').slice(0, 2).toUpperCase();
    }

    formatTime(iso) {
        const d = new Date(iso);
        const now = new Date();
        if (d.toDateString() === now.toDateString()) {
            return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        }
        return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }

    isUserOnline(user) {
        const lastSeen = new Date(user.last_seen);
        return Date.now() - lastSeen.getTime() < 60000;
    }

    scrollToBottom() {
        const container = document.getElementById('chatMessages');
        setTimeout(() => {
            container.scrollTop = container.scrollHeight;
        }, 50);
    }

    // ---------- EVENT SETUP ----------
    setupEventListeners() {
        // Send message
        document.getElementById('sendBtn').addEventListener('click', () => this.sendMessage());
        document.getElementById('messageInput').addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });

        // Search
        document.getElementById('searchInput').addEventListener('input', (e) => {
            const query = e.target.value.trim();
            if (query.length > 0) {
                this.searchUsers(query);
            } else {
                document.getElementById('searchResults').style.display = 'none';
            }
        });

        // Settings
        document.getElementById('settingsBtn').addEventListener('click', () => this.showSettings());
        document.getElementById('closeSettings').addEventListener('click', () => {
            document.getElementById('settingsModal').classList.remove('active');
        });
        document.getElementById('saveSettings').addEventListener('click', () => this.saveSettings());

        // Profile
        document.getElementById('userProfileMini').addEventListener('click', () => {
            if (this.currentUser) {
                this.showUserProfile(this.currentUser);
            }
        });
        document.getElementById('closeProfile').addEventListener('click', () => {
            document.getElementById('profileModal').classList.remove('active');
        });

        // Back button
        document.getElementById('backBtn').addEventListener('click', () => {
            document.getElementById('sidebar').classList.remove('hide-mobile');
            document.getElementById('chatArea').classList.remove('active-mobile');
        });

        // Sync button
        document.getElementById('syncBtn').addEventListener('click', async () => {
            document.getElementById('syncStatus').textContent = 'Syncing...';
            await this.db.forceSync();
            this.loadChats();
            if (this.currentChat) {
                this.loadMessages(this.currentChat.id);
            }
        });

        // Logout
        document.getElementById('logoutBtn').addEventListener('click', () => {
            if (confirm('Are you sure you want to logout?')) {
                localStorage.removeItem('vvn_session');
                this.currentUser = null;
                this.currentChat = null;
                document.getElementById('settingsModal').classList.remove('active');
                this.showAuth(true);
                this.showMessenger(false);
            }
        });

        // Click outside modals
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.classList.remove('active');
                }
            });
        });

        // Resize handler
        window.addEventListener('resize', () => {
            this.isMobile = window.innerWidth < 768;
            if (!this.isMobile) {
                document.getElementById('sidebar').classList.remove('hide-mobile');
                document.getElementById('chatArea').classList.remove('active-mobile');
            }
        });
    }

    // ---------- SEARCH ----------
    async searchUsers(query) {
        const results = this.db.searchUsers(query, this.currentUser.id);
        const container = document.getElementById('searchResults');
        
        if (results.length === 0) {
            container.innerHTML = `<div style="padding:12px 16px;color:var(--text-secondary);">No users found</div>`;
            container.style.display = 'block';
            return;
        }

        let html = '';
        for (const user of results) {
            html += `
                <div class="search-result-item" data-user-id="${user.id}">
                    <div class="avatar">${this.getInitials(user.display_name || user.username)}</div>
                    <div class="info">
                        <div class="uname">${user.display_name || user.username}</div>
                        <div class="email">@${user.username}</div>
                    </div>
                </div>
            `;
        }

        container.innerHTML = html;
        container.style.display = 'block';

        container.querySelectorAll('.search-result-item').forEach(el => {
            el.addEventListener('click', () => {
                const userId = el.dataset.userId;
                const user = this.db.getUserById(userId);
                if (user) {
                    this.findOrCreateChat(userId);
                    document.getElementById('searchInput').value = '';
                    container.style.display = 'none';
                }
            });
        });
    }
}

// Initialize app
const vvnApp = new VVNApp();
window.vvnApp = vvnApp;

// Start when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    vvnApp.init();
    vvnApp.setupEventListeners();
});
