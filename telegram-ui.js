// Telegram-style UI Components for VVN

const TelegramUI = {
    // State
    currentTab: 'chats',
    currentChat: null,
    selectedMessages: new Set(),
    selectionMode: false,

    // Initialize UI
    init() {
        this.setupNavigation();
        this.setupChatView();
        this.setupInputHandlers();
        this.renderChatList();
        this.renderContacts();
        this.renderSettings();
        this.renderProfile();
    },

    // Setup bottom navigation
    setupNavigation() {
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                const tab = item.dataset.tab;
                this.switchTab(tab);
            });
        });

        // Tab switching from header buttons
        document.querySelectorAll('[data-tab]').forEach(el => {
            if (el.classList.contains('nav-item')) return;
            el.addEventListener('click', () => {
                this.switchTab(el.dataset.tab);
            });
        });

        // New chat button
        const newChatBtn = document.getElementById('newChatBtn');
        if (newChatBtn) {
            newChatBtn.addEventListener('click', () => {
                this.showNewChatDialog();
            });
        }

        // Search chat button
        const searchBtn = document.getElementById('searchChatBtn');
        if (searchBtn) {
            searchBtn.addEventListener('click', () => {
                this.showSearchDialog();
            });
        }

        // Add contact button
        const addContactBtn = document.getElementById('addContactBtn');
        if (addContactBtn) {
            addContactBtn.addEventListener('click', () => {
                this.showAddContactDialog();
            });
        }
    },

    // Switch tabs
    switchTab(tab) {
        this.currentTab = tab;

        // Update nav items
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.toggle('active', item.dataset.tab === tab);
        });

        // Update tab content
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });

        const target = document.getElementById('tab-' + tab);
        if (target) target.classList.add('active');

        // Refresh content
        if (tab === 'chats') this.renderChatList();
        if (tab === 'contacts') this.renderContacts();
        if (tab === 'settings') this.renderSettings();
        if (tab === 'profile') this.renderProfile();

        lucide.createIcons();
    },

    // Setup chat view
    setupChatView() {
        const backBtn = document.getElementById('chatBackBtn');
        if (backBtn) {
            backBtn.addEventListener('click', () => {
                this.closeChat();
            });
        }

        // Close chat on swipe right (mobile)
        let touchStartX = 0;
        const chatView = document.getElementById('chatView');
        if (chatView) {
            chatView.addEventListener('touchstart', (e) => {
                touchStartX = e.touches[0].clientX;
            });

            chatView.addEventListener('touchend', (e) => {
                const diff = touchStartX - e.changedTouches[0].clientX;
                if (diff > 80) {
                    this.closeChat();
                }
            });
        }

        // Chat view menu button
        const menuBtn = document.getElementById('chatViewMenu');
        if (menuBtn) {
            menuBtn.addEventListener('click', () => {
                this.showChatMenu();
            });
        }
    },

    // Setup input handlers
    setupInputHandlers() {
        const sendBtn = document.getElementById('chatSendBtn');
        const input = document.getElementById('chatMessageInput');

        if (sendBtn) {
            sendBtn.addEventListener('click', () => {
                this.sendMessage();
            });
        }

        if (input) {
            input.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    this.sendMessage();
                }
            });

            // Auto-resize input
            input.addEventListener('input', () => {
                input.style.height = 'auto';
                input.style.height = Math.min(input.scrollHeight, 100) + 'px';
            });
        }

        // Attach button
        const attachBtn = document.getElementById('chatAttachBtn');
        if (attachBtn) {
            attachBtn.addEventListener('click', () => {
                this.openFilePicker();
            });
        }

        // Smile button
        const smileBtn = document.getElementById('chatSmileBtn');
        if (smileBtn) {
            smileBtn.addEventListener('click', () => {
                this.toggleEmojiPanel();
            });
        }

        // Mic button
        const micBtn = document.getElementById('chatMicBtn');
        if (micBtn) {
            micBtn.addEventListener('mousedown', () => {
                this.startVoiceRecording();
            });
            micBtn.addEventListener('mouseup', () => {
                this.stopVoiceRecording();
            });
            micBtn.addEventListener('touchstart', (e) => {
                e.preventDefault();
                this.startVoiceRecording();
            });
            micBtn.addEventListener('touchend', (e) => {
                e.preventDefault();
                this.stopVoiceRecording();
            });
        }
    },

    // Render chat list (Telegram style)
    renderChatList() {
        const container = document.getElementById('chatListContainer');
        if (!container) return;

        const chats = state.localCache.chats || {};
        const messages = state.localCache.messages || {};
        const currentUser = state.currentUser;

        if (!currentUser) {
            container.innerHTML = '<div class="text-[#555] text-center py-12">Please login to see chats</div>';
            return;
        }

        let chatKeys = Object.keys(chats).filter(k => k.includes(currentUser.username));
        if (chatKeys.length === 0) {
            container.innerHTML = `
                <div class="text-center py-16">
                    <div class="text-[#555] text-sm">No chats yet</div>
                    <div class="text-[#555] text-xs mt-1">Search for users to start a chat</div>
                </div>
            `;
            return;
        }

        // Sort by latest message
        chatKeys.sort((a, b) => {
            const ma = messages[a] || [];
            const mb = messages[b] || [];
            const ta = ma.length ? ma[ma.length-1].timestamp : 0;
            const tb = mb.length ? mb[mb.length-1].timestamp : 0;
            return tb - ta;
        });

        let html = '';
        for (const key of chatKeys) {
            const parts = key.split('_');
            const partner = parts[0] === currentUser.username ? parts[1] : parts[0];
            const pUser = getUserByUsername(partner);
            const msgs = messages[key] || [];
            const last = msgs.length ? msgs[msgs.length-1] : null;
            const preview = last ? (last.text || '📎 File') : 'Start chatting';
            const time = last ? formatTime(last.timestamp) : '';
            const displayName = getDisplayName(partner);
            const tags = getUserTags(partner);
            const tagHtml = tags.map(t => `<span class="tag ${t.class}">${t.label}</span>`).join('');
            const isOnline = pUser ? pUser.online : false;
            const unread = msgs.filter(m => m.sender !== currentUser.username && !m.read).length;

            html += `
                <div class="chat-list-item" data-chat="${partner}" onclick="TelegramUI.openChat('${partner}')">
                    <div class="avatar">
                        ${partner.charAt(0).toUpperCase()}
                        ${isOnline ? '<span class="online-dot online"></span>' : ''}
                    </div>
                    <div class="chat-info">
                        <div class="name">
                            ${displayName}
                            ${tagHtml}
                        </div>
                        <div class="last-msg">
                            ${last && last.sender !== currentUser.username ? `<span class="sender">${getDisplayName(last.sender)}:</span>` : ''}
                            ${preview}
                        </div>
                    </div>
                    <div class="chat-meta">
                        <div class="time">${time}</div>
                        ${unread > 0 ? `<div class="unread">${unread}</div>` : ''}
                    </div>
                </div>
            `;
        }

        container.innerHTML = html;
        lucide.createIcons();
    },

    // Render contacts
    renderContacts() {
        const container = document.getElementById('contactsContainer');
        if (!container) return;

        const users = state.localCache.users || [];
        const currentUser = state.currentUser;

        if (!currentUser) {
            container.innerHTML = '<div class="text-[#555] text-center py-12">Please login to see contacts</div>';
            return;
        }

        const contacts = users.filter(u => u.username !== currentUser.username);

        if (contacts.length === 0) {
            container.innerHTML = `
                <div class="text-center py-16">
                    <div class="text-[#555] text-sm">No contacts yet</div>
                    <div class="text-[#555] text-xs mt-1">Search for users to add</div>
                </div>
            `;
            return;
        }

        let html = '';
        for (const user of contacts) {
            const tags = getUserTags(user.username);
            const tagHtml = tags.map(t => `<span class="tag ${t.class}">${t.label}</span>`).join('');
            html += `
                <div class="contact-item" onclick="TelegramUI.openChat('${user.username}')">
                    <div class="avatar">${user.username.charAt(0).toUpperCase()}</div>
                    <div class="info">
                        <div class="name">${user.displayName || user.username} ${tagHtml}</div>
                        <div class="status">${user.online ? 'Online' : 'Offline'}</div>
                    </div>
                </div>
            `;
        }

        container.innerHTML = html;
    },

    // Render settings
    renderSettings() {
        const container = document.querySelector('#tab-settings .p-2');
        if (!container) return;

        const settings = state.settings || {};

        container.innerHTML = `
            <div class="settings-section">
                <div class="section-title">General</div>
                <div class="settings-item" onclick="TelegramUI.openSettingsModal()">
                    <div class="icon"><i data-lucide="settings"></i></div>
                    <div class="info">
                        <div class="title">App Settings</div>
                        <div class="desc">Theme, notifications, and more</div>
                    </div>
                    <div class="arrow"><i data-lucide="chevron-right"></i></div>
                </div>
                <div class="settings-item" onclick="TelegramUI.openProfileModal()">
                    <div class="icon"><i data-lucide="user"></i></div>
                    <div class="info">
                        <div class="title">Profile</div>
                        <div class="desc">Edit your profile info</div>
                    </div>
                    <div class="arrow"><i data-lucide="chevron-right"></i></div>
                </div>
            </div>

            <div class="settings-section">
                <div class="section-title">Security</div>
                <div class="settings-item">
                    <div class="icon"><i data-lucide="shield"></i></div>
                    <div class="info">
                        <div class="title">End-to-End Encryption</div>
                        <div class="desc">Messages are encrypted</div>
                    </div>
                    <div class="toggle">
                        <div class="switch ${settings.e2ee ? 'active' : ''}" onclick="TelegramUI.toggleSetting('e2ee')">
                            <div class="thumb"></div>
                        </div>
                    </div>
                </div>
                <div class="settings-item">
                    <div class="icon"><i data-lucide="eye"></i></div>
                    <div class="info">
                        <div class="title">Read Receipts</div>
                        <div class="desc">Show when messages are read</div>
                    </div>
                    <div class="toggle">
                        <div class="switch ${settings.readReceipts !== false ? 'active' : ''}" onclick="TelegramUI.toggleSetting('readReceipts')">
                            <div class="thumb"></div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="settings-section">
                <div class="section-title">Account</div>
                <div class="settings-item" onclick="TelegramUI.logout()">
                    <div class="icon" style="color:#ff6b6b;"><i data-lucide="log-out"></i></div>
                    <div class="info">
                        <div class="title" style="color:#ff6b6b;">Logout</div>
                        <div class="desc">Sign out of your account</div>
                    </div>
                </div>
            </div>
        `;

        lucide.createIcons();
    },

    // Render profile
    renderProfile() {
        const container = document.querySelector('#tab-profile .p-2');
        if (!container) return;

        const user = state.currentUser;
        if (!user) {
            container.innerHTML = '<div class="text-[#555] text-center py-12">Please login</div>';
            return;
        }

        const tags = getUserTags(user.username);
        const tagHtml = tags.map(t => `<span class="tag ${t.class}">${t.label}</span>`).join('');
        const badges = getBadges(user);
        const badgeHtml = badges.map(b => `<span class="text-[8px] px-1.5 py-0.5 rounded ${b.class}">${b.label}</span>`).join('');

        container.innerHTML = `
            <div class="profile-header-card">
                <div class="avatar-large">
                    <img src="${user.avatar || 'icons/user.png'}" class="w-full h-full rounded-full object-cover" />
                </div>
                <div class="name">${user.displayName || user.username}</div>
                <div class="username">@${user.username}</div>
                <div class="flex flex-wrap gap-1 mt-1 justify-center">${tagHtml}</div>
                <div class="flex flex-wrap gap-1 mt-1 justify-center">${badgeHtml}</div>
                <div class="bio">${user.bio || 'No bio yet'}</div>
                <div class="status">${user.status || 'Available'}</div>
            </div>

            <div class="profile-menu-item" onclick="TelegramUI.openProfileModal()">
                <div class="icon"><i data-lucide="edit"></i></div>
                <div class="info">
                    <div class="title">Edit Profile</div>
                    <div class="desc">Change your display name, bio, and more</div>
                </div>
                <div class="arrow"><i data-lucide="chevron-right"></i></div>
            </div>

            <div class="profile-menu-item" onclick="TelegramUI.openSettingsModal()">
                <div class="icon"><i data-lucide="settings"></i></div>
                <div class="info">
                    <div class="title">Settings</div>
                    <div class="desc">App preferences and security</div>
                </div>
                <div class="arrow"><i data-lucide="chevron-right"></i></div>
            </div>

            <div class="profile-menu-item" onclick="TelegramUI.showQRCode()">
                <div class="icon"><i data-lucide="qr-code"></i></div>
                <div class="info">
                    <div class="title">My QR Code</div>
                    <div class="desc">Share your profile link</div>
                </div>
                <div class="arrow"><i data-lucide="chevron-right"></i></div>
            </div>

            <div class="profile-menu-item" onclick="TelegramUI.showStats()">
                <div class="icon"><i data-lucide="bar-chart-2"></i></div>
                <div class="info">
                    <div class="title">Statistics</div>
                    <div class="desc">Your messaging activity</div>
                </div>
                <div class="arrow"><i data-lucide="chevron-right"></i></div>
            </div>

            <div class="profile-menu-item" onclick="TelegramUI.logout()" style="color:#ff6b6b;">
                <div class="icon" style="color:#ff6b6b;"><i data-lucide="log-out"></i></div>
                <div class="info">
                    <div class="title" style="color:#ff6b6b;">Logout</div>
                    <div class="desc" style="color:#ff6b6b;">Sign out of your account</div>
                </div>
            </div>
        `;

        lucide.createIcons();
    },

    // Open chat
    openChat(username) {
        this.currentChat = username;
        const chatView = document.getElementById('chatView');
        const partner = getUserByUsername(username);

        if (!partner) return;

        // Update header
        document.getElementById('chatViewName').textContent = partner.displayName || partner.username;
        document.getElementById('chatViewStatus').textContent = partner.online ? 'Online' : 'Offline';
        document.getElementById('chatViewAvatar').textContent = username.charAt(0).toUpperCase();

        // Load messages
        this.loadMessages(username);

        // Show chat view
        chatView.classList.add('active');

        // Hide messenger behind
        document.getElementById('messenger').style.opacity = '0.3';

        // Mark messages as read
        this.markAsRead(username);

        lucide.createIcons();
    },

    // Close chat
    closeChat() {
        const chatView = document.getElementById('chatView');
        chatView.classList.remove('active');
        document.getElementById('messenger').style.opacity = '1';
        this.currentChat = null;

        // Refresh chat list
        this.renderChatList();
    },

    // Load messages
    loadMessages(username) {
        const container = document.getElementById('chatMessagesContainer');
        if (!container) return;

        const chatKey = getChatKey(state.currentUser.username, username);
        const messages = state.localCache.messages[chatKey] || [];

        if (messages.length === 0) {
            container.innerHTML = `
                <div class="text-center text-[#555] text-sm py-8">
                    No messages yet
                    <div class="text-xs mt-1">Send a message to start the conversation</div>
                </div>
            `;
            return;
        }

        let html = '';
        let lastDate = '';

        for (let i = 0; i < messages.length; i++) {
            const msg = messages[i];
            const isOutgoing = msg.sender === state.currentUser.username;
            const msgDate = new Date(msg.timestamp).toLocaleDateString();

            // Date divider
            if (msgDate !== lastDate) {
                html += `
                    <div class="text-center text-[#555] text-xs py-2">
                        ${msgDate === new Date().toLocaleDateString() ? 'Today' : msgDate}
                    </div>
                `;
                lastDate = msgDate;
            }

            const bubbleClass = isOutgoing ? 'outgoing' : 'incoming';
            const senderName = isOutgoing ? 'You' : getDisplayName(msg.sender);

            // Check if message has file
            let content = msg.text || '';
            if (msg.file) {
                if (msg.file.type === 'image') {
                    content = `<img src="${msg.file.data}" class="max-w-[200px] max-h-[200px] rounded-lg" onclick="window.open(this.src)" />`;
                    if (msg.file.caption) content += `<div class="text-[#888] text-xs mt-1">${msg.file.caption}</div>`;
                } else if (msg.file.type === 'video') {
                    content = `<video controls class="max-w-[200px] max-h-[200px] rounded-lg"><source src="${msg.file.data}" /></video>`;
                    if (msg.file.caption) content += `<div class="text-[#888] text-xs mt-1">${msg.file.caption}</div>`;
                } else if (msg.file.type === 'audio') {
                    content = `
                        <div class="flex items-center gap-3">
                            <button class="w-8 h-8 rounded-full glass flex items-center justify-center text-[#888]">
                                <i data-lucide="play" class="w-4 h-4"></i>
                            </button>
                            <div class="flex-1 flex items-center gap-0.5 h-6">
                                ${Array.from({length: 16}, () => `<div class="w-0.5 bg-[rgba(255,255,255,0.15)] rounded-full" style="height:${20 + Math.random() * 80}%"></div>`).join('')}
                            </div>
                            <span class="text-[#555] text-xs">0:00</span>
                        </div>
                    `;
                    if (msg.file.caption) content += `<div class="text-[#888] text-xs mt-1">${msg.file.caption}</div>`;
                } else {
                    content = `
                        <div class="flex items-center gap-3 p-2 glass rounded-lg">
                            <div class="w-8 h-8 rounded-lg bg-[rgba(40,40,40,0.3)] flex items-center justify-center text-lg">📄</div>
                            <div>
                                <div class="text-white text-sm">${msg.file.name || 'File'}</div>
                                <div class="text-[#555] text-xs">${msg.file.size || '0 KB'}</div>
                            </div>
                        </div>
                    `;
                    if (msg.file.caption) content += `<div class="text-[#888] text-xs mt-1">${msg.file.caption}</div>`;
                }
            }

            // Reactions
            let reactionsHtml = '';
            if (msg.reactions && msg.reactions.length > 0) {
                const reactionCounts = {};
                msg.reactions.forEach(r => { reactionCounts[r.emoji] = (reactionCounts[r.emoji] || 0) + 1; });
                reactionsHtml = '<div class="flex gap-1 mt-1 flex-wrap">';
                Object.entries(reactionCounts).forEach(([emoji, count]) => {
                    reactionsHtml += `<span class="text-xs px-1.5 py-0.5 rounded-full glass cursor-pointer">${emoji} ${count}</span>`;
                });
                reactionsHtml += '</div>';
            }

            html += `
                <div class="message-bubble ${bubbleClass}">
                    ${content}
                    ${reactionsHtml}
                    <div class="time">${formatTime(msg.timestamp)}</div>
                </div>
            `;
        }

        container.innerHTML = html;

        // Scroll to bottom
        setTimeout(() => {
            container.scrollTop = container.scrollHeight;
        }, 50);

        lucide.createIcons();
    },

    // Send message
    sendMessage() {
        const input = document.getElementById('chatMessageInput');
        if (!input || !this.currentChat) return;

        const text = input.value.trim();
        if (!text) return;

        const chatKey = getChatKey(state.currentUser.username, this.currentChat);
        const messages = state.localCache.messages;
        if (!messages[chatKey]) messages[chatKey] = [];

        messages[chatKey].push({
            sender: state.currentUser.username,
            timestamp: Date.now(),
            text: text,
            read: false,
            reactions: []
        });

        state.localCache.messages = messages;
        localStorage.setItem('vvn_cache', JSON.stringify(state.localCache));
        pushToRemote();

        // Update UI
        this.loadMessages(this.currentChat);
        this.renderChatList();
        input.value = '';
        input.style.height = 'auto';

        // Update badge
        this.updateBadge();
    },

    // Mark messages as read
    markAsRead(username) {
        const chatKey = getChatKey(state.currentUser.username, username);
        const messages = state.localCache.messages[chatKey] || [];
        let updated = false;

        for (const msg of messages) {
            if (msg.sender !== state.currentUser.username && !msg.read) {
                msg.read = true;
                updated = true;
            }
        }

        if (updated) {
            state.localCache.messages[chatKey] = messages;
            localStorage.setItem('vvn_cache', JSON.stringify(state.localCache));
            this.updateBadge();
        }
    },

    // Update unread badge
    updateBadge() {
        const messages = state.localCache.messages || {};
        let unread = 0;

        for (const [key, msgs] of Object.entries(messages)) {
            if (key.includes(state.currentUser.username)) {
                unread += msgs.filter(m => m.sender !== state.currentUser.username && !m.read).length;
            }
        }

        const badge = document.getElementById('chatBadge');
        if (badge) {
            badge.textContent = unread;
            badge.style.display = unread > 0 ? 'flex' : 'none';
        }
    },

    // Toggle setting
    toggleSetting(key) {
        state.settings[key] = !state.settings[key];
        localStorage.setItem('vvn_settings', JSON.stringify(state.settings));
        this.renderSettings();
        lucide.createIcons();
    },

    // Open settings modal
    openSettingsModal() {
        const modal = document.getElementById('settingsModal');
        const content = document.getElementById('settingsModalContent');

        const settings = state.settings || {};
        const user = state.currentUser;

        content.innerHTML = `
            <div class="flex flex-col gap-3">
                <div>
                    <label class="text-[#888] text-xs font-medium block mb-1">Display Name</label>
                    <input type="text" id="modalDisplayName" value="${user?.displayName || ''}" placeholder="Your display name" class="w-full px-3 py-2 rounded-xl bg-[rgba(40,40,40,0.3)] border border-[rgba(255,255,255,0.04)] text-white text-sm outline-none" />
                </div>
                <div>
                    <label class="text-[#888] text-xs font-medium block mb-1">Username</label>
                    <input type="text" id="modalUsername" value="${user?.username || ''}" placeholder="Username" class="w-full px-3 py-2 rounded-xl bg-[rgba(40,40,40,0.3)] border border-[rgba(255,255,255,0.04)] text-white text-sm outline-none" />
                </div>
                <div>
                    <label class="text-[#888] text-xs font-medium block mb-1">Bio</label>
                    <textarea id="modalBio" rows="2" placeholder="Tell us about yourself" class="w-full px-3 py-2 rounded-xl bg-[rgba(40,40,40,0.3)] border border-[rgba(255,255,255,0.04)] text-white text-sm outline-none resize-none">${user?.bio || ''}</textarea>
                </div>
                <div class="flex items-center justify-between">
                    <div>
                        <label class="text-[#888] text-xs font-medium block">E2E Encryption</label>
                        <p class="text-[#555] text-xs">Messages are encrypted</p>
                    </div>
                    <label class="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" ${settings.e2ee ? 'checked' : ''} class="sr-only peer" onchange="TelegramUI.toggleSetting('e2ee')" />
                        <div class="w-10 h-5 bg-[rgba(40,40,40,0.3)] rounded-full peer peer-checked:bg-[#36454F] transition-all border border-[rgba(255,255,255,0.04)]">
                            <div class="absolute left-0.5 top-0.5 w-4 h-4 bg-[#666] rounded-full transition-all peer-checked:translate-x-5 peer-checked:bg-white"></div>
                        </div>
                    </label>
                </div>
                <button class="w-full py-2 rounded-xl bg-[#36454F] text-white text-sm transition-all hover:bg-[#41424C]" onclick="TelegramUI.saveSettings()">Save Settings</button>
            </div>
        `;

        modal.classList.remove('hidden');
        modal.style.display = 'flex';
        lucide.createIcons();
    },

    // Save settings from modal
    saveSettings() {
        const displayName = document.getElementById('modalDisplayName')?.value;
        const username = document.getElementById('modalUsername')?.value;
        const bio = document.getElementById('modalBio')?.value;

        const user = state.currentUser;
        if (!user) return;

        if (username && username !== user.username) {
            const existing = state.localCache.users.find(u => u.username === username && u.username !== user.username);
            if (existing) {
                alert('Username already taken');
                return;
            }
        }

        user.displayName = displayName || user.username;
        user.username = username || user.username;
        user.bio = bio || '';

        const userIndex = state.localCache.users.findIndex(u => u.username === user.username);
        if (userIndex !== -1) {
            state.localCache.users[userIndex] = user;
            localStorage.setItem('vvn_cache', JSON.stringify(state.localCache));
            pushToRemote();
        }

        this.closeModal('settingsModal');
        this.renderProfile();
        this.renderChatList();
        alert('Settings saved!');
    },

    // Open profile modal
    openProfileModal() {
        const modal = document.getElementById('profileModal');
        const content = document.getElementById('profileModalContent');

        const user = state.currentUser;
        if (!user) return;

        const tags = getUserTags(user.username);
        const tagHtml = tags.map(t => `<span class="tag ${t.class}">${t.label}</span>`).join('');
        const badges = getBadges(user);
        const badgeHtml = badges.map(b => `<span class="text-[8px] px-1.5 py-0.5 rounded ${b.class}">${b.label}</span>`).join('');

        content.innerHTML = `
            <div class="text-center">
                <div class="w-20 h-20 rounded-full mx-auto mb-3 bg-[rgba(40,40,40,0.3)] border-2 border-[#36454F] overflow-hidden">
                    <img src="${user.avatar || 'icons/user.png'}" class="w-full h-full object-cover" />
                </div>
                <div class="text-white font-medium text-lg">${user.displayName || user.username}</div>
                <div class="text-[#666] text-sm">@${user.username}</div>
                <div class="flex flex-wrap gap-1 mt-1 justify-center">${tagHtml}</div>
                <div class="flex flex-wrap gap-1 mt-1 justify-center">${badgeHtml}</div>
                <div class="text-[#888] text-sm mt-2">${user.bio || 'No bio yet'}</div>
                <div class="text-[#555] text-xs mt-1">${user.status || 'Available'}</div>
                <div class="text-[#555] text-xs mt-2">Joined: ${formatDate(user.created || Date.now())}</div>
                <div class="text-[#555] text-xs">Age: ${getAge(user.created || Date.now())}</div>
                <button class="mt-4 px-6 py-2 rounded-xl bg-[#36454F] text-white text-sm transition-all hover:bg-[#41424C]" onclick="TelegramUI.closeModal('profileModal')">Close</button>
            </div>
        `;

        modal.classList.remove('hidden');
        modal.style.display = 'flex';
        lucide.createIcons();
    },

    // Close modal
    closeModal(id) {
        const modal = document.getElementById(id);
        if (modal) {
            modal.classList.add('hidden');
            modal.style.display = 'none';
        }
    },

    // Show new chat dialog
    showNewChatDialog() {
        const users = state.localCache.users || [];
        const currentUser = state.currentUser;
        const contacts = users.filter(u => u.username !== currentUser?.username);

        if (contacts.length === 0) {
            alert('No users available. Create an account on another device first.');
            return;
        }

        let list = 'Select a user to chat with:\n\n';
        contacts.forEach((u, i) => {
            list += `${i+1}. ${u.displayName || u.username} (@${u.username})\n`;
        });

        const choice = prompt(list + '\nEnter number:');
        if (!choice) return;

        const index = parseInt(choice) - 1;
        if (index < 0 || index >= contacts.length) {
            alert('Invalid choice');
            return;
        }

        const target = contacts[index].username;
        this.openChat(target);
    },

    // Show search dialog
    showSearchDialog() {
        const query = prompt('🔍 Search users by username or display name:');
        if (!query) return;

        const users = state.localCache.users || [];
        const currentUser = state.currentUser;
        const found = users.filter(u =>
            u.username !== currentUser?.username &&
            (u.username.toLowerCase().includes(query.toLowerCase()) ||
             (u.displayName && u.displayName.toLowerCase().includes(query.toLowerCase())))
        );

        if (found.length === 0) {
            alert('No users found');
            return;
        }

        let list = 'Search results:\n\n';
        found.forEach((u, i) => {
            list += `${i+1}. ${u.displayName || u.username} (@${u.username})\n`;
        });

        const choice = prompt(list + '\nEnter number to chat:');
        if (!choice) return;

        const index = parseInt(choice) - 1;
        if (index < 0 || index >= found.length) {
            alert('Invalid choice');
            return;
        }

        const target = found[index].username;
        this.openChat(target);
    },

    // Show add contact dialog
    showAddContactDialog() {
        const username = prompt('Enter username to add:');
        if (!username) return;

        const user = getUserByUsername(username);
        if (!user) {
            alert('User not found');
            return;
        }

        if (user.username === state.currentUser?.username) {
            alert("You can't add yourself");
            return;
        }

        this.openChat(user.username);
    },

    // Show chat menu
    showChatMenu() {
        const options = ['View Profile', 'Block User', 'Clear Chat', 'Cancel'];
        const choice = prompt('Chat Options:\n\n1. View Profile\n2. Block User\n3. Clear Chat\n4. Cancel');

        if (!choice) return;

        switch(choice) {
            case '1':
                this.showProfile(this.currentChat);
                break;
            case '2':
                if (confirm(`Block ${this.currentChat}?`)) {
                    const blocked = JSON.parse(localStorage.getItem('vvn_blocked') || '[]');
                    if (!blocked.includes(this.currentChat)) {
                        blocked.push(this.currentChat);
                        localStorage.setItem('vvn_blocked', JSON.stringify(blocked));
                        alert('User blocked');
                        this.closeChat();
                    }
                }
                break;
            case '3':
                if (confirm('Clear all messages?')) {
                    const chatKey = getChatKey(state.currentUser.username, this.currentChat);
                    state.localCache.messages[chatKey] = [];
                    localStorage.setItem('vvn_cache', JSON.stringify(state.localCache));
                    this.loadMessages(this.currentChat);
                    this.renderChatList();
                }
                break;
        }
    },

    // Show profile
    showProfile(username) {
        const user = getUserByUsername(username);
        if (!user) return;

        const tags = getUserTags(username);
        const tagHtml = tags.map(t => `<span class="tag ${t.class}">${t.label}</span>`).join('');

        alert(`Profile\n\nName: ${user.displayName || user.username}\nUsername: @${user.username}\nBio: ${user.bio || 'No bio'}\nStatus: ${user.online ? 'Online' : 'Offline'}\nTags: ${tagHtml || 'Member'}`);
    },

    // Show QR code
    showQRCode() {
        const user = state.currentUser;
        if (!user) return;
        alert(`🔲 Your VVN ID: ${user.username}\n\nShare this to connect with friends!`);
    },

    // Show stats
    showStats() {
        const user = state.currentUser;
        if (!user) return;

        const messages = state.localCache.messages || {};
        let total = 0;
        let sent = 0;
        let received = 0;

        for (const [key, msgs] of Object.entries(messages)) {
            if (key.includes(user.username)) {
                total += msgs.length;
                sent += msgs.filter(m => m.sender === user.username).length;
                received += msgs.filter(m => m.sender !== user.username).length;
            }
        }

        alert(`📊 Your Stats\n\nTotal Messages: ${total}\nSent: ${sent}\nReceived: ${received}\nChats: ${Object.keys(messages).filter(k => k.includes(user.username)).length}`);
    },

    // Logout
    logout() {
        if (confirm('Are you sure you want to logout?')) {
            logout();
        }
    },

    // Open file picker
    openFilePicker() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*,video/*,audio/*,application/*';
        input.multiple = true;

        input.onchange = (e) => {
            const files = e.target.files;
            if (!files.length) return;

            for (const file of files) {
                const reader = new FileReader();
                reader.onload = (ev) => {
                    const data = ev.target.result;
                    let fileType = 'file';
                    if (file.type.startsWith('image/')) fileType = 'image';
                    else if (file.type.startsWith('video/')) fileType = 'video';
                    else if (file.type.startsWith('audio/')) fileType = 'audio';

                    const chatKey = getChatKey(state.currentUser.username, this.currentChat);
                    const messages = state.localCache.messages;
                    if (!messages[chatKey]) messages[chatKey] = [];

                    messages[chatKey].push({
                        sender: state.currentUser.username,
                        timestamp: Date.now(),
                        file: {
                            type: fileType,
                            data: data,
                            name: file.name,
                            size: (file.size / 1024).toFixed(1) + ' KB',
                            caption: ''
                        },
                        read: false,
                        reactions: []
                    });

                    state.localCache.messages = messages;
                    localStorage.setItem('vvn_cache', JSON.stringify(state.localCache));
                    pushToRemote();

                    this.loadMessages(this.currentChat);
                    this.renderChatList();
                    this.updateBadge();
                };
                reader.readAsDataURL(file);
            }
        };

        input.click();
    },

    // Toggle emoji panel
    toggleEmojiPanel() {
        const emojis = ['😀', '😂', '😍', '🥰', '😘', '😊', '🤣', '😭', '😤', '🤯', '🥳', '😎', '🤩', '🥺', '😱', '🤔', '😇', '🤗', '🤭', '😬', '😴', '🤤', '😋', '🤪', '😜', '🤫', '🤭', '🧐', '🤓', '🥸'];

        const input = document.getElementById('chatMessageInput');
        if (!input) return;

        // Simple emoji picker: show quick selection
        let emojiList = emojis.join(' ');
        const selected = prompt(`Select an emoji:\n\n${emojiList}\n\nEnter the emoji or number:`);

        if (selected && emojis.includes(selected)) {
            input.value += selected;
            input.focus();
        } else if (selected && !isNaN(selected)) {
            const idx = parseInt(selected) - 1;
            if (idx >= 0 && idx < emojis.length) {
                input.value += emojis[idx];
                input.focus();
            }
        }
    },

    // Voice recording
    startVoiceRecording() {
        if (isRecording) return;
        startVoiceRecording();
    },

    stopVoiceRecording() {
        if (isRecording) {
            stopVoiceRecording();
        }
    }
};

// Make TelegramUI globally available
window.TelegramUI = TelegramUI;

// Override renderMessenger to use Telegram UI
const originalRenderMessenger = renderMessenger;
renderMessenger = function() {
    originalRenderMessenger();
    // Initialize Telegram UI after messenger is rendered
    setTimeout(() => {
        TelegramUI.init();
        TelegramUI.updateBadge();
    }, 100);
};
