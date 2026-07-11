// database.js - JSONBin database with encryption

const Database = {
    BIN_ID: '6a5222dbda38895dfe4ef18e',
    MASTER_KEY: '$2a$10$xpnzNbyjOgRS6s..YVAMhOqwuj/FOPnU15M2J9uSwHBsRJAygi1Lu',
    BIN_URL: `https://api.jsonbin.io/v3/b/6a5222dbda38895dfe4ef18e`,

    localCache: { users: [], chats: {}, messages: {} },
    currentUser: null,
    sessionKey: null,
    listeners: [],

    async fetchFromBin() {
        try {
            const resp = await fetch(this.BIN_URL, {
                headers: {
                    'X-Master-Key': this.MASTER_KEY,
                    'X-Bin-Meta': 'false'
                }
            });
            if (!resp.ok) throw new Error('Fetch failed');
            return await resp.json();
        } catch (e) {
            console.error('Fetch error:', e);
            return null;
        }
    },

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
            if (!resp.ok) throw new Error('Update failed');
            return true;
        } catch (e) {
            console.error('Update error:', e);
            return false;
        }
    },

    async load() {
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
        return this.localCache;
    },

    async save() {
        localStorage.setItem('vvn_cache', JSON.stringify(this.localCache));
        const success = await this.updateBin(this.localCache);
        if (success) {
            this.notifyListeners();
        }
        return success;
    },

    addListener(callback) {
        this.listeners.push(callback);
        return () => {
            this.listeners = this.listeners.filter(l => l !== callback);
        };
    },

    notifyListeners() {
        this.listeners.forEach(callback => callback(this.localCache));
    },

    getUsers() { return this.localCache.users || []; },
    setUsers(users) { this.localCache.users = users; this.save(); },
    getChats() { return this.localCache.chats || {}; },
    setChats(chats) { this.localCache.chats = chats; this.save(); },
    getMessages() { return this.localCache.messages || {}; },
    setMessages(messages) { this.localCache.messages = messages; this.save(); },

    getSession() {
        const session = localStorage.getItem('vvn_session');
        return session ? JSON.parse(session) : null;
    },
    setSession(session) {
        localStorage.setItem('vvn_session', JSON.stringify(session));
    },
    clearSession() {
        localStorage.removeItem('vvn_session');
    }
};
