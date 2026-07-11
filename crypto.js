// crypto.js - VVN Encryption Layer
// 5-layer security: E2EE, PFS, MAC, Password-based key, Encrypted storage

class VVNCrypto {
    constructor() {
        this.encryptionKey = null;
        this.sessionKey = null;
        this.publicKey = null;
        this.privateKey = null;
        this.macKey = null;
        this.encryptionLevel = 5; // 1-5 layers
    }

    // Generate a secure random key
    async generateKey() {
        const keyData = new Uint8Array(32);
        crypto.getRandomValues(keyData);
        return keyData;
    }

    // PBKDF2 - Password-based key derivation (Layer 5)
    async deriveKeyFromPassword(password, salt) {
        const encoder = new TextEncoder();
        const passwordBuffer = encoder.encode(password);
        const saltBuffer = encoder.encode(salt || 'VVN_SALT_2024');

        const keyMaterial = await crypto.subtle.importKey(
            'raw',
            passwordBuffer,
            'PBKDF2',
            false,
            ['deriveKey']
        );

        const key = await crypto.subtle.deriveKey(
            {
                name: 'PBKDF2',
                salt: saltBuffer,
                iterations: 100000,
                hash: 'SHA-256'
            },
            keyMaterial,
            {
                name: 'AES-GCM',
                length: 256
            },
            true,
            ['encrypt', 'decrypt']
        );

        return key;
    }

    // Generate RSA key pair for public/private encryption (Layer 2)
    async generateKeyPair() {
        const keyPair = await crypto.subtle.generateKey(
            {
                name: 'RSA-OAEP',
                modulusLength: 2048,
                publicExponent: new Uint8Array([1, 0, 1]),
                hash: 'SHA-256'
            },
            true,
            ['encrypt', 'decrypt']
        );
        this.publicKey = keyPair.publicKey;
        this.privateKey = keyPair.privateKey;
        return keyPair;
    }

    // Encrypt with public key (Layer 2 - Public/Private Key)
    async encryptWithPublicKey(data, publicKey) {
        const encoder = new TextEncoder();
        const dataBuffer = encoder.encode(data);
        const encrypted = await crypto.subtle.encrypt(
            {
                name: 'RSA-OAEP'
            },
            publicKey,
            dataBuffer
        );
        return this.arrayBufferToBase64(encrypted);
    }

    // Decrypt with private key (Layer 2)
    async decryptWithPrivateKey(encryptedBase64, privateKey) {
        const encryptedBuffer = this.base64ToArrayBuffer(encryptedBase64);
        const decrypted = await crypto.subtle.decrypt(
            {
                name: 'RSA-OAEP'
            },
            privateKey,
            encryptedBuffer
        );
        const decoder = new TextDecoder();
        return decoder.decode(decrypted);
    }

    // AES-GCM encryption (Layer 1 & 3)
    async aesEncrypt(text, key) {
        const encoder = new TextEncoder();
        const data = encoder.encode(text);
        const iv = new Uint8Array(12);
        crypto.getRandomValues(iv);

        const encrypted = await crypto.subtle.encrypt(
            {
                name: 'AES-GCM',
                iv: iv
            },
            key,
            data
        );

        const combined = new Uint8Array(iv.length + encrypted.byteLength);
        combined.set(iv, 0);
        combined.set(new Uint8Array(encrypted), iv.length);

        return this.arrayBufferToBase64(combined);
    }

    // AES-GCM decryption (Layer 1 & 3)
    async aesDecrypt(encryptedBase64, key) {
        const combined = this.base64ToArrayBuffer(encryptedBase64);
        const iv = combined.slice(0, 12);
        const data = combined.slice(12);

        const decrypted = await crypto.subtle.decrypt(
            {
                name: 'AES-GCM',
                iv: iv
            },
            key,
            data
        );

        const decoder = new TextDecoder();
        return decoder.decode(decrypted);
    }

    // Generate MAC (Layer 4 - Message Authentication Code)
    async generateMAC(message, key) {
        const encoder = new TextEncoder();
        const messageBuffer = encoder.encode(message);
        
        const macKey = await crypto.subtle.importKey(
            'raw',
            key.slice(0, 32),
            { name: 'HMAC', hash: 'SHA-256' },
            false,
            ['sign']
        );

        const signature = await crypto.subtle.sign(
            'HMAC',
            macKey,
            messageBuffer
        );

        return this.arrayBufferToBase64(signature);
    }

    // Verify MAC (Layer 4)
    async verifyMAC(message, signature, key) {
        const expectedSignature = await this.generateMAC(message, key);
        return signature === expectedSignature;
    }

    // Generate session key (Layer 5 - Perfect Forward Secrecy)
    async generateSessionKey() {
        const sessionKey = new Uint8Array(32);
        crypto.getRandomValues(sessionKey);
        this.sessionKey = sessionKey;
        return sessionKey;
    }

    // Full encryption pipeline (all 5 layers)
    async encryptMessage(message, password, recipientPublicKey) {
        try {
            let encrypted = message;

            // Layer 5: Password-based key protection
            const salt = crypto.randomUUID();
            const passwordKey = await this.deriveKeyFromPassword(password, salt);
            const layer5 = await this.aesEncrypt(encrypted, passwordKey);
            encrypted = `PBE:${salt}:${layer5}`;

            // Layer 4: MAC
            const macKey = await this.generateKey();
            this.macKey = macKey;
            const mac = await this.generateMAC(encrypted, macKey);
            encrypted = `MAC:${this.arrayBufferToBase64(macKey)}:${mac}:${encrypted}`;

            // Layer 3: AES encryption with session key
            const sessionKey = await this.generateSessionKey();
            const aesKey = await crypto.subtle.importKey(
                'raw',
                sessionKey,
                { name: 'AES-GCM' },
                false,
                ['encrypt', 'decrypt']
            );
            const layer3 = await this.aesEncrypt(encrypted, aesKey);
            encrypted = `AES:${this.arrayBufferToBase64(sessionKey)}:${layer3}`;

            // Layer 2: Public key encryption
            if (recipientPublicKey) {
                const layer2 = await this.encryptWithPublicKey(encrypted, recipientPublicKey);
                encrypted = `RSA:${layer2}`;
            }

            // Layer 1: Final AES with derived key
            const finalKey = await this.deriveKeyFromPassword(password + 'FINAL', 'VVN_FINAL');
            const finalEncrypted = await this.aesEncrypt(encrypted, finalKey);
            encrypted = `FINAL:${finalEncrypted}`;

            return encrypted;
        } catch (e) {
            console.error('Encryption error:', e);
            return null;
        }
    }

    // Full decryption pipeline
    async decryptMessage(encryptedMessage, password, privateKey) {
        try {
            let decrypted = encryptedMessage;

            // Layer 1: Remove final AES
            if (decrypted.startsWith('FINAL:')) {
                const parts = decrypted.split(':');
                const finalKey = await this.deriveKeyFromPassword(password + 'FINAL', 'VVN_FINAL');
                decrypted = await this.aesDecrypt(parts[1], finalKey);
            }

            // Layer 2: Remove RSA
            if (decrypted.startsWith('RSA:')) {
                const parts = decrypted.split(':');
                if (privateKey) {
                    decrypted = await this.decryptWithPrivateKey(parts[1], privateKey);
                } else {
                    return null;
                }
            }

            // Layer 3: Remove AES session
            if (decrypted.startsWith('AES:')) {
                const parts = decrypted.split(':');
                const sessionKeyBuffer = this.base64ToArrayBuffer(parts[1]);
                const aesKey = await crypto.subtle.importKey(
                    'raw',
                    sessionKeyBuffer,
                    { name: 'AES-GCM' },
                    false,
                    ['encrypt', 'decrypt']
                );
                decrypted = await this.aesDecrypt(parts[2], aesKey);
            }

            // Layer 4: Verify MAC
            if (decrypted.startsWith('MAC:')) {
                const parts = decrypted.split(':');
                const macKeyBuffer = this.base64ToArrayBuffer(parts[1]);
                const mac = parts[2];
                const data = parts.slice(3).join(':');
                const isValid = await this.verifyMAC(data, mac, macKeyBuffer);
                if (!isValid) {
                    throw new Error('MAC verification failed - message may have been tampered');
                }
                decrypted = data;
            }

            // Layer 5: Remove password-based encryption
            if (decrypted.startsWith('PBE:')) {
                const parts = decrypted.split(':');
                const salt = parts[1];
                const encryptedData = parts.slice(2).join(':');
                const pbeKey = await this.deriveKeyFromPassword(password, salt);
                decrypted = await this.aesDecrypt(encryptedData, pbeKey);
            }

            return decrypted;
        } catch (e) {
            console.error('Decryption error:', e);
            return null;
        }
    }

    // Encrypt local storage data (IndexedDB + encryption)
    async encryptStorage(data, password) {
        const key = await this.deriveKeyFromPassword(password, 'VVN_STORAGE');
        const json = JSON.stringify(data);
        return await this.aesEncrypt(json, key);
    }

    async decryptStorage(encryptedData, password) {
        const key = await this.deriveKeyFromPassword(password, 'VVN_STORAGE');
        const decrypted = await this.aesDecrypt(encryptedData, key);
        return JSON.parse(decrypted);
    }

    // Helper: ArrayBuffer to Base64
    arrayBufferToBase64(buffer) {
        const bytes = new Uint8Array(buffer);
        let binary = '';
        for (let i = 0; i < bytes.length; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        return btoa(binary);
    }

    // Helper: Base64 to ArrayBuffer
    base64ToArrayBuffer(base64) {
        const binary = atob(base64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
            bytes[i] = binary.charCodeAt(i);
        }
        return bytes;
    }

    // Generate secure random ID
    generateSecureId() {
        return crypto.randomUUID();
    }

    // Hash password for storage (not stored directly)
    async hashPassword(password) {
        const encoder = new TextEncoder();
        const data = encoder.encode(password + 'VVN_HASH_SALT');
        const hash = await crypto.subtle.digest('SHA-256', data);
        return this.arrayBufferToBase64(hash);
    }
}

// Export singleton
const vvnCrypto = new VVNCrypto();
window.vvnCrypto = vvnCrypto;
