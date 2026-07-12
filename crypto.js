// VVN Crypto - Simple encryption for messages
// In production, use a proper encryption library

const Crypto = {
    // Simple XOR encryption (for demo purposes only)
    // In production, use AES-256-GCM or similar
    encrypt(text, key) {
        if (!text) return text;
        let result = '';
        for (let i = 0; i < text.length; i++) {
            const charCode = text.charCodeAt(i) ^ key.charCodeAt(i % key.length);
            result += String.fromCharCode(charCode);
        }
        return btoa(result);
    },
    
    decrypt(encrypted, key) {
        if (!encrypted) return encrypted;
        try {
            const decoded = atob(encrypted);
            let result = '';
            for (let i = 0; i < decoded.length; i++) {
                const charCode = decoded.charCodeAt(i) ^ key.charCodeAt(i % key.length);
                result += String.fromCharCode(charCode);
            }
            return result;
        } catch (e) {
            return encrypted;
        }
    },
    
    // Generate a random key for each message
    generateKey() {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()';
        let key = '';
        for (let i = 0; i < 32; i++) {
            key += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return key;
    },
    
    // Hash a password (simple hash for demo)
    hashPassword(password) {
        let hash = 0;
        for (let i = 0; i < password.length; i++) {
            const char = password.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return 'hashed_' + hash.toString(36);
    },
    
    // Verify password
    verifyPassword(password, hash) {
        return this.hashPassword(password) === hash;
    }
};

window.Crypto = Crypto;
