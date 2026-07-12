// VVN Configuration
const CONFIG = {
    // JSONBin.io credentials
    BIN_ID: '6a5222dbda38895dfe4ef18e',
    MASTER_KEY: '$2a$10$xpnzNbyjOgRS6s..YVAMhOqwuj/FOPnU15M2J9uSwHBsRJAygi1Lu',
    
    // Owner/Developer usernames (these users get special tags)
    OWNERS: ['vaultnet', 'vvnters'],
    DEVS: ['vaultnet', 'vvnters'],
    ADMINS: ['vaultnet'],
    MODS: ['vaultnet'],
    STAFF: ['vaultnet', 'vvnters'],
    
    // Developer PIN for viewing passwords (20+ characters)
    DEV_PIN: '2356-23543-13451-78901-23456',
    
    // Sync interval in milliseconds
    SYNC_INTERVAL: 5000,
    
    // Default settings
    DEFAULTS: {
        e2ee: true,
        twofa: false,
        privacy: false,
        devMode: false
    }
};

// Make CONFIG globally available
window.CONFIG = CONFIG;
