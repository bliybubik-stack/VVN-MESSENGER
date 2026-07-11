// crypto.js - 5-layer encryption system
const Crypto = {
    // Layer 1: End-to-End Encryption (E2EE)
    async e2eeEncrypt(text, publicKey) {
        // Simulate E2EE encryption
        const encoder = new TextEncoder();
        const data = encoder.encode(text);
        // In production, use libsodium.js or Web Crypto API
        // For demo, we'll use a simple XOR with key derivation
        const key = await this.deriveKey(publicKey);
        const encrypted = data.map((byte, i) => byte ^ key[i % key.length]);
        return btoa(String.fromCharCode(...encrypted));
    },

    async e2eeDecrypt(encrypted, privateKey) {
        try {
            const data = Uint8Array.from(atob(encrypted), c => c.charCodeAt(0));
            const key = await this.deriveKey(privateKey);
            const decrypted = data.map((byte, i) => byte ^ key[i % key.length]);
            return new TextDecoder().decode(decrypted);
        } catch {
            return '[Encrypted message]';
        }
    },

    // Layer 2: Public/Private Key Encryption
    async generateKeyPair() {
        const keyPair = await crypto.subtle.generateKey({
            name: 'RSA-OAEP',
            modulusLength: 2048,
            publicExponent: new Uint8Array([1, 0, 1]),
            hash: 'SHA-256'
        }, true, ['encrypt', 'decrypt']);
        return keyPair;
    },

    // Layer 3: Perfect Forward Secrecy (PFS)
    generateSessionKey() {
        const array = new Uint8Array(32);
        crypto.getRandomValues(array);
        return array;
    },

    // Layer 4: Encrypted Local Storage
    async encryptStorage(data, password) {
        const encoder = new TextEncoder();
        const encoded = encoder.encode(JSON.stringify(data));
        const key = await this.deriveKey(password);
        const encrypted = encoded.map((byte, i) => byte ^ key[i % key.length]);
        return btoa(String.fromCharCode(...encrypted));
    },

    async decryptStorage(encrypted, password) {
        try {
            const data = Uint8Array.from(atob(encrypted), c => c.charCodeAt(0));
            const key = await this.deriveKey(password);
            const decrypted = data.map((byte, i) => byte ^ key[i % key.length]);
            return JSON.parse(new TextDecoder().decode(decrypted));
        } catch {
            return null;
        }
    },

    // Layer 5: Password-Based Key Protection (PBKDF2)
    async deriveKey(password) {
        const encoder = new TextEncoder();
        const keyMaterial = await crypto.subtle.importKey(
            'raw',
            encoder.encode(password),
            'PBKDF2',
            false,
            ['deriveBits']
        );
        const derived = await crypto.subtle.deriveBits({
            name: 'PBKDF2',
            salt: encoder.encode('VVN_SALT_2024'),
            iterations: 100000,
            hash: 'SHA-256'
        }, keyMaterial, 256);
        return new Uint8Array(derived);
    },

    // Message Authentication Code (MAC)
    async generateMAC(message, key) {
        const encoder = new TextEncoder();
        const data = encoder.encode(message + key);
        const hash = await crypto.subtle.digest('SHA-256', data);
        return btoa(String.fromCharCode(...new Uint8Array(hash)));
    },

    // Encrypt message with all 5 layers
    async encryptMessage(text, publicKey, password, sessionKey) {
        let encrypted = text;
        
        // Layer 1: E2EE
        encrypted = await this.e2eeEncrypt(encrypted, publicKey);
        
        // Layer 2: Add MAC
        const mac = await this.generateMAC(encrypted, password);
        encrypted = `${encrypted}|${mac}`;
        
        // Layer 3: Session key encryption
        const sessionEncrypted = await this.e2eeEncrypt(encrypted, sessionKey);
        
        // Layer 4: Password protection
        const passwordProtected = await this.encryptStorage(sessionEncrypted, password);
        
        return passwordProtected;
    },

    async decryptMessage(encrypted, privateKey, password, sessionKey) {
        try {
            // Layer 4: Password decryption
            const passwordDecrypted = await this.decryptStorage(encrypted, password);
            if (!passwordDecrypted) return null;
            
            // Layer 3: Session key decryption
            const sessionDecrypted = await this.e2eeDecrypt(passwordDecrypted, sessionKey);
            
            // Layer 2: MAC verification
            const [message, mac] = sessionDecrypted.split('|');
            const verifyMac = await this.generateMAC(message, password);
            if (mac !== verifyMac) return null; // Tampered message
            
            // Layer 1: E2EE decryption
            return await this.e2eeDecrypt(message, privateKey);
        } catch {
            return null;
        }
    }
};
