// database.js - VVN Database Layer with JSONBin + Local Storage

class VVNDatabase {
    constructor() {
        this.BIN_ID = '6a5222dbda38895dfe4ef18e';
        this.MASTER_KEY = '$2a$10$xpnzNbyjOgRS6s..YVAMhOqwuj/FOPnU15M2J9uSwHBsRJAygi1Lu';
        this.BIN_URL = `https://api.jsonbin.io/v3/b/${this.BIN_ID}`;
        this.localCache = { users: [], chats: {}, messages: {} };
        this.currentUser = null;
        this.isSyncing = false;
        this.syncInterval = null;
        this.crypto = window.vvnCrypto;
    }

    // ---------- INITIALIZATION ----------
    async init() {
        // Load from JSONBin or cache
        const remote = await this.fetchFromBin();
        if (remote) {
            this.localCache = {
                users: remote.users || [],
                chats: remote.chats || {},
                messages: remote.messages || {}
            };
            localStorage.setItem('vvn_cache', JSON.stringify(this.localCache));
        } else {
            const cached = localStorage.getItem('vvn_cache');
            if (cached) {
                this.localCache = JSON.parse(cached);
            } else {
                this.localCache = { users: [], chats: {}, messages: {} };
                await this.updateBin(this.localCache);
            }
        }

        // Start auto-sync
        this.startAutoSync();
        return this.localCache;
    }

    // ---------- JSONBin API ----------
    async fetchFromBin() {
        try {
            const resp = await fetch(this.BIN_URL, {
                headers: {
                    'X-Master-Key': this.MASTER_KEY,
                    'X-Bin-Meta': 'false'
                }
            });
            if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
            const data = await resp.json();
            return data;
        } catch (e) {
            console.warn('Fetch from JSONBin failed:', e);
            return null;
        }
    }

    async updateBin(data) {
        try {
            const resp = await fetch(this.BIN_URL, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Master-Key': this.MASTER_KEY,
                    'X-Bin-Meta': 'false'
                },
                body: JSON.stringify(data)
            });
            if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
            return true;
        } catch (e) {
            console.warn('Update JSONBin failed:', e);
            return false;
        }
    }

    // ---------- AUTO SYNC ----------
    startAutoSync() {
        if (this.syncInterval) clearInterval(this.syncInterval);
        this.syncInterval = setInterval(() => {
            this.syncWithRemote();
        }, 5000);
    }

    async syncWithRemote() {
        if (this.isSyncing) return;
        this.isSyncing = true;

        try {
            const remote = await this.fetchFromBin();
            if (remote) {
                // Merge remote data
                const remoteUsers = remote.users || [];
                const remoteChats = remote.chats || {};
                const remoteMessages = remote.messages || {};

                // Merge users (avoid duplicates)
                const localUsers = this.localCache.users || [];
                const mergedUsers = [...localUsers];
                for (const rUser of remoteUsers) {
                    if (!mergedUsers.find(u => u.username === rUser.username)) {
                        mergedUsers.push(rUser);
                    }
                }

                // Merge chats and messages
                const mergedChats = { ...remoteChats, ...this.localCache.chats };
                const mergedMessages = { ...remoteMessages, ...this.localCache.messages };

                this.localCache.users = mergedUsers;
                this.localCache.chats = mergedChats;
                this.localCache.messages = mergedMessages;

                localStorage.setItem('vvn_cache', JSON.stringify(this.localCache));
                
                // Update status
                if (window.updateSyncStatus) {
                    window.updateSyncStatus('Synced', 'green');
                }

                // Trigger UI refresh if needed
                if (window.refreshUI) {
                    window.refreshUI();
                }
            }
        } catch (e) {
            console.warn('Sync error:', e);
            if (window.updateSyncStatus) {
                window.updateSyncStatus('Sync error', 'red');
            }
        }

        this.isSyncing = false;
    }

    async pushToRemote() {
        if (this.isSyncing) return;
        this.isSyncing = true;

        try {
            const success = await this.updateBin(this.localCache);
            if (success) {
                localStorage.setItem('vvn_cache', JSON.stringify(this.localCache));
                if (window.updateSyncStatus) {
                    window.updateSyncStatus('Saved', 'green');
                }
            }
        } catch (e) {
            console.warn('Push error:', e);
        }

        this.isSyncing = false;
    }

    // ---------- USER OPERATIONS ----------
    async createUser(username, password, displayName = '') {
        const users = this.localCache.users;
        if (users.find(u => u.username === username)) {
            throw new Error('Username already taken');
        }

        const user = {
            id: this.crypto.generateSecureId(),
            username: username,
            display_name: displayName || username,
            password: await this.crypto.hashPassword(password),
            email: '',
            bio: '',
            avatar_url: '',
            last_seen: new Date().toISOString(),
            created_at: new Date().toISOString(),
            settings: {
                encryption_level: 5,
                last_seen_visibility: 'everyone',
                read_receipts: 'on',
                theme: 'dark',
                message_animation: 'slide'
            }
        };

        users.push(user);
        this.localCache.users = users;
        await this.pushToRemote();
        return user;
    }

    async loginUser(username, password) {
        const users = this.localCache.users;
        const hashedPassword = await this.crypto.hashPassword(password);
        const user = users.find(u => u.username === username && u.password === hashedPassword);
        
        if (!user) {
            throw new Error('Invalid username or password');
        }

        // Update last seen
        user.last_seen = new Date().toISOString();
        this.localCache.users = users;
        await this.pushToRemote();

        this.currentUser = user;
        return user;
    }

    async updateUser(userId, updates) {
        const users = this.localCache.users;
        const index = users.findIndex(u => u.id === userId);
        if (index === -1) throw new Error('User not found');

        // If updating password, hash it
        if (updates.password) {
            updates.password = await this.crypto.hashPassword(updates.password);
        }

        users[index] = { ...users[index], ...updates };
        this.localCache.users = users;
        await this.pushToRemote();

        if (this.currentUser && this.currentUser.id === userId) {
            this.currentUser = users[index];
        }

        return users[index];
    }

    async deleteUser(userId) {
        this.localCache.users = this.localCache.users.filter(u => u.id !== userId);
        await this.pushToRemote();
        if (this.currentUser && this.currentUser.id === userId) {
            this.currentUser = null;
        }
    }

    getUserById(userId) {
        return this.localCache.users.find(u => u.id === userId) || null;
    }

    getUserByUsername(username) {
        return this.localCache.users.find(u => u.username === username) || null;
    }

    searchUsers(query, excludeId = null) {
        const q = query.toLowerCase();
        return this.localCache.users.filter(u => {
            if (excludeId && u.id === excludeId) return false;
            return u.username.toLowerCase().includes(q) || 
                   (u.display_name && u.display_name.toLowerCase().includes(q));
        });
    }

    // ---------- CHAT OPERATIONS ----------
    async getOrCreateChat(userId1, userId2) {
        const chatKey = [userId1, userId2].sort().join('_');
        let chat = this.localCache.chats[chatKey];

        if (!chat) {
            chat = {
                id: this.crypto.generateSecureId(),
                participants: [userId1, userId2],
                created_at: new Date().toISOString(),
                last_message_at: new Date().toISOString()
            };
            this.localCache.chats[chatKey] = chat;
            await this.pushToRemote();
        }

        return chat;
    }

    getChats(userId) {
        const chats = [];
        for (const [key, chat] of Object.entries(this.localCache.chats)) {
            if (chat.participants.includes(userId)) {
                const otherId = chat.participants.find(id => id !== userId);
                const otherUser = this.getUserById(otherId);
                if (otherUser) {
                    chats.push({
                        ...chat,
                        key,
                        otherUser,
                        messages: this.getMessages(chat.id)
                    });
                }
            }
        }
        return chats.sort((a, b) => {
            const aTime = a.last_message_at || a.created_at;
            const bTime = b.last_message_at || b.created_at;
            return new Date(bTime) - new Date(aTime);
        });
    }

    // ---------- MESSAGE OPERATIONS ----------
    async sendMessage(chatId, senderId, content, replyToId = null, messageType = 'text') {
        const message = {
            id: this.crypto.generateSecureId(),
            chat_id: chatId,
            sender_id: senderId,
            content: content,
            type: messageType,
            reply_to_id: replyToId,
            created_at: new Date().toISOString(),
            read_at: null,
            pinned: false,
            reactions: {}
        };

        // Find chat key
        let chatKey = null;
        for (const [key, chat] of Object.entries(this.localCache.chats)) {
            if (chat.id === chatId) {
                chatKey = key;
                chat.last_message_at = message.created_at;
                this.localCache.chats[key] = chat;
                break;
            }
        }

        if (!chatKey) {
            throw new Error('Chat not found');
        }

        if (!this.localCache.messages[chatId]) {
            this.localCache.messages[chatId] = [];
        }
        this.localCache.messages[chatId].push(message);

        await this.pushToRemote();
        return message;
    }

    getMessages(chatId) {
        return this.localCache.messages[chatId] || [];
    }

    async deleteMessage(messageId, chatId, deleteForEveryone = false) {
        const messages = this.localCache.messages[chatId] || [];
        const index = messages.findIndex(m => m.id === messageId);
        if (index === -1) return;

        if (deleteForEveryone) {
            messages.splice(index, 1);
        } else {
            messages[index] = {
                ...messages[index],
                content: '🗑️ Message deleted',
                deleted_for_me: true
            };
        }

        this.localCache.messages[chatId] = messages;
        await this.pushToRemote();
    }

    async pinMessage(messageId, chatId) {
        const messages = this.localCache.messages[chatId] || [];
        const index = messages.findIndex(m => m.id === messageId);
        if (index === -1) return;

        messages[index].pinned = !messages[index].pinned;
        this.localCache.messages[chatId] = messages;
        await this.pushToRemote();
    }

    async reactToMessage(messageId, chatId, emoji, userId) {
        const messages = this.localCache.messages[chatId] || [];
        const index = messages.findIndex(m => m.id === messageId);
        if (index === -1) return;

        const message = messages[index];
        if (!message.reactions) message.reactions = {};

        // Toggle reaction
        if (message.reactions[userId] === emoji) {
            delete message.reactions[userId];
        } else {
            message.reactions[userId] = emoji;
        }

        this.localCache.messages[chatId] = messages;
        await this.pushToRemote();
    }

    async markAsRead(chatId, userId) {
        const messages = this.localCache.messages[chatId] || [];
        const now = new Date().toISOString();
        let updated = false;

        for (const msg of messages) {
            if (msg.sender_id !== userId && !msg.read_at) {
                msg.read_at = now;
                updated = true;
            }
        }

        if (updated) {
            this.localCache.messages[chatId] = messages;
            await this.pushToRemote();
        }
    }

    // ---------- POLL OPERATIONS ----------
    async createPoll(chatId, creatorId, question, options) {
        const poll = {
            id: this.crypto.generateSecureId(),
            chat_id: chatId,
            creator_id: creatorId,
            question: question,
            options: options,
            created_at: new Date().toISOString()
        };

        if (!this.localCache.polls) this.localCache.polls = {};
        this.localCache.polls[poll.id] = poll;

        // Send as message
        await this.sendMessage(chatId, creatorId, question, null, 'poll');

        return poll;
    }

    async voteOnPoll(pollId, userId, optionIndex) {
        if (!this.localCache.poll_votes) this.localCache.poll_votes = {};
        if (!this.localCache.poll_votes[pollId]) this.localCache.poll_votes[pollId] = [];

        const votes = this.localCache.poll_votes[pollId];
        const existingIndex = votes.findIndex(v => v.voter_id === userId);

        if (existingIndex !== -1) {
            if (votes[existingIndex].option_index === optionIndex) {
                votes.splice(existingIndex, 1);
            } else {
                votes[existingIndex].option_index = optionIndex;
            }
        } else {
            votes.push({
                id: this.crypto.generateSecureId(),
                poll_id: pollId,
                voter_id: userId,
                option_index: optionIndex,
                voted_at: new Date().toISOString()
            });
        }

        this.localCache.poll_votes[pollId] = votes;
        await this.pushToRemote();
    }

    getPollResults(pollId) {
        const poll = this.localCache.polls ? this.localCache.polls[pollId] : null;
        if (!poll) return null;

        const votes = this.localCache.poll_votes ? this.localCache.poll_votes[pollId] || [] : [];
        const results = poll.options.map((opt, idx) => {
            const count = votes.filter(v => v.option_index === idx).length;
            const total = votes.length;
            return {
                option: opt,
                count: count,
                percentage: total > 0 ? Math.round((count / total) * 100) : 0
            };
        });

        return {
            poll,
            results,
            total_votes: votes.length,
            user_vote: null // Set by caller with userId
        };
    }

    // ---------- UTILITY ----------
    clearCache() {
        localStorage.removeItem('vvn_cache');
        this.localCache = { users: [], chats: {}, messages: {} };
    }

    async forceSync() {
        await this.syncWithRemote();
        await this.pushToRemote();
    }
}

// Export singleton
const vvnDB = new VVNDatabase();
window.vvnDB = vvnDB;
