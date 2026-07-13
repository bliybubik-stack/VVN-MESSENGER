const Database = {
    getUsers() {
        const data = localStorage.getItem('vvn_users');
        return data ? JSON.parse(data) : [];
    },
    saveUsers(users) {
        localStorage.setItem('vvn_users', JSON.stringify(users));
    },
    getChats() {
        const data = localStorage.getItem('vvn_chats');
        return data ? JSON.parse(data) : {};
    },
    saveChats(chats) {
        localStorage.setItem('vvn_chats', JSON.stringify(chats));
    },
    getMessages() {
        const data = localStorage.getItem('vvn_messages');
        return data ? JSON.parse(data) : {};
    },
    saveMessages(messages) {
        localStorage.setItem('vvn_messages', JSON.stringify(messages));
    },
    getSession() {
        const data = localStorage.getItem('vvn_session');
        return data ? JSON.parse(data) : null;
    },
    saveSession(session) {
        localStorage.setItem('vvn_session', JSON.stringify(session));
    },
    clearSession() {
        localStorage.removeItem('vvn_session');
    },
    getAll() {
        return {
            users: this.getUsers(),
            chats: this.getChats(),
            messages: this.getMessages()
        };
    },
    saveAll(data) {
        if (data.users) this.saveUsers(data.users);
        if (data.chats) this.saveChats(data.chats);
        if (data.messages) this.saveMessages(data.messages);
    },
    clearAll() {
        localStorage.removeItem('vvn_users');
        localStorage.removeItem('vvn_chats');
        localStorage.removeItem('vvn_messages');
        localStorage.removeItem('vvn_session');
        localStorage.removeItem('vvn_cache');
        localStorage.removeItem('vvn_settings');
        localStorage.removeItem('vvn_chat_settings');
        localStorage.removeItem('vvn_pinned');
        localStorage.removeItem('vvn_blocked');
        localStorage.removeItem('vvn_contact_names');
        localStorage.removeItem('vvn_pinned_contacts');
        localStorage.removeItem('vvn_notes');
        localStorage.removeItem('vvn_stickers');
        localStorage.removeItem('vvn_quick_replies');
        localStorage.removeItem('vvn_drafts');
        localStorage.removeItem('vvn_device');
    }
};
window.Database = Database;
