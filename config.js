const CONFIG = {
    BIN_ID: '6a5222dbda38895dfe4ef18e',
    MASTER_KEY: '$2a$10$xpnzNbyjOgRS6s..YVAMhOqwuj/FOPnU15M2J9uSwHBsRJAygi1Lu',
    OWNERS: ['vaultnet', 'vvnters'],
    DEVS: ['vaultnet', 'vvnters'],
    ADMINS: ['vaultnet'],
    MODS: ['vaultnet'],
    STAFF: ['vaultnet', 'vvnters'],
    DEV_PIN: '2356-23543-13451-78901-23456',
    SYNC_INTERVAL: 5000,
    FEATURES: {
        stickers: true,
        gifs: true,
        polls: true,
        games: true,
        customEmojis: true,
        messageSearch: true,
        messageForwarding: true,
        replyToMessage: true,
        editMessage: true,
        translateMessage: true,
        voiceSpeed: true,
        drafts: true
    },
    DEFAULTS: {
        e2ee: true,
        twofa: false,
        privacy: false,
        devMode: false,
        bubbleColor: '#36454F',
        bubbleShape: 'rounded',
        fontSize: 'medium',
        fontFamily: 'Inter',
        chatSpacing: 'comfortable',
        timestampFormat: '12h',
        readReceipts: true,
        messageAnimations: 'slide',
        chatHeaderStyle: 'modern'
    }
};
window.CONFIG = CONFIG;
