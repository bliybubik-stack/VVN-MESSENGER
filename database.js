// VVN Database - Local storage management

const Database = {
    // Get all users
    getUsers() {
        const data = localStorage.getItem('vvn_users');
        return data ? JSON.parse(data) : [];
    },
    
    // Save users
    saveUsers(users) {
        localStorage.setItem('vvn_users', JSON.stringify(users));
    },
    
    // Get all chats
    getChats() {
        const data = localStorage.getItem('vvn_chats');
        return data ? JSON.parse(data) : {};
    },
    
    // Save chats
    saveChats(chats) {
        localStorage.setItem('vvn_chats', JSON.stringify(chats));
    },
    
    // Get all messages
    getMessages() {
        const data = localStorage.getItem('vvn_messages');
        return data ? JSON.parse(data) : {};
    },
    
    // Save messages
    saveMessages(messages) {
        localStorage.setItem('vvn_messages', JSON.stringify(messages));
    },
    
    // Get current session
    getSession() {
        const data = localStorage.getItem('vvn_session');
        return data ? JSON.parse(data) : null;
    },
    
    // Save session
    saveSession(session) {
        localStorage.setItem('vvn_session', JSON.stringify(session));
    },
    
    // Clear session
    clearSession() {
        localStorage.removeItem('vvn_session');
    },
    
    // Get all data
    getAll() {
        return {
            users: this.getUsers(),
            chats: this.getChats(),
            messages: this.getMessages()
        };
    },
    
    // Save all data
    saveAll(data) {
        if (data.users) this.saveUsers(data.users);
        if (data.chats) this.saveChats(data.chats);
        if (data.messages) this.saveMessages(data.messages);
    },
    
    // Clear all data
    clearAll() {
        localStorage.removeItem('vvn_users');
        localStorage.removeItem('vvn_chats');
        localStorage.removeItem('vvn_messages');
        localStorage.removeItem('vvn_session');
        localStorage.removeItem('vvn_cache');
    }
};

window.Database = Database;
