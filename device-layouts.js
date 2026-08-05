const DEVICE_LAYOUTS = {
    phone: {
        name: 'Phone',
        icon: 'smartphone',
        breakpoints: { maxWidth: 768, maxHeight: 1024 },
        layout: {
            sidebarWidth: '100%',
            chatAreaWidth: '100%',
            sidebarCompact: true,
            chatHeaderCompact: true,
            messageMaxWidth: '90%',
            inputBarHeight: '110px',
            fontSize: '0.85rem',
            avatarSize: '32px',
            spacing: '8px'
        },
        styles: {
            sidebar: 'width:100%; border-right:none;',
            chatArea: 'width:100%;',
            chatHeader: 'padding:6px 12px; min-height:44px;',
            chatInputBar: 'min-height:110px; padding:8px 12px;',
            messages: 'padding:8px 12px;',
            message: 'font-size:0.85rem; padding:6px 10px;',
            avatar: 'width:32px; height:32px;'
        }
    },
    tablet: {
        name: 'Tablet',
        icon: 'tablet',
        breakpoints: { minWidth: 769, maxWidth: 1200, maxHeight: 1600 },
        layout: {
            sidebarWidth: '35%',
            chatAreaWidth: '65%',
            sidebarCompact: false,
            chatHeaderCompact: false,
            messageMaxWidth: '75%',
            inputBarHeight: '115px',
            fontSize: '0.9rem',
            avatarSize: '40px',
            spacing: '10px'
        },
        styles: {
            sidebar: 'width:35%; border-right:1px solid rgba(255,255,255,0.04);',
            chatArea: 'width:65%;',
            chatHeader: 'padding:8px 16px; min-height:52px;',
            chatInputBar: 'min-height:115px; padding:10px 14px;',
            messages: 'padding:10px 16px;',
            message: 'font-size:0.9rem; padding:8px 12px;',
            avatar: 'width:40px; height:40px;'
        }
    },
    pc: {
        name: 'PC / Desktop',
        icon: 'monitor',
        breakpoints: { minWidth: 1201, minHeight: 900 },
        layout: {
            sidebarWidth: '30%',
            chatAreaWidth: '70%',
            sidebarCompact: false,
            chatHeaderCompact: false,
            messageMaxWidth: '65%',
            inputBarHeight: '125px',
            fontSize: '1rem',
            avatarSize: '44px',
            spacing: '12px'
        },
        styles: {
            sidebar: 'width:30%; border-right:1px solid rgba(255,255,255,0.04);',
            chatArea: 'width:70%;',
            chatHeader: 'padding:10px 20px; min-height:60px;',
            chatInputBar: 'min-height:125px; padding:12px 20px;',
            messages: 'padding:12px 20px;',
            message: 'font-size:1rem; padding:10px 16px;',
            avatar: 'width:44px; height:44px;'
        }
    }
};

function detectDevice() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const ratio = width / height;
    if (width < 768 || ratio < 0.8) return 'phone';
    else if (width >= 768 && width < 1200 && height < 1600) return 'tablet';
    else return 'pc';
}

function applyDeviceLayout(deviceType) {
    const layout = DEVICE_LAYOUTS[deviceType];
    if (!layout) return;
    localStorage.setItem('vvn_device', deviceType);
    const root = document.documentElement;
    const styles = layout.styles;
    const sidebar = document.querySelector('.sidebar');
    const chatArea = document.querySelector('.chat-area');
    const chatHeader = document.querySelector('.chat-header');
    const chatInputBar = document.querySelector('.chat-input-bar');
    const chatMessages = document.querySelector('.chat-messages');

    if (sidebar) {
        sidebar.style.width = layout.layout.sidebarWidth;
        if (deviceType === 'phone') {
            sidebar.style.borderRight = 'none';
        } else {
            sidebar.style.borderRight = '1px solid rgba(255,255,255,0.04)';
        }
    }
    if (chatArea) chatArea.style.width = layout.layout.chatAreaWidth;
    if (chatHeader) {
        chatHeader.style.padding = styles.chatHeader.split(';')[0] || '8px 16px';
        chatHeader.style.minHeight = styles.chatHeader.split(';')[1]?.split(':')[1] || '52px';
    }
    if (chatInputBar) {
        chatInputBar.style.minHeight = layout.layout.inputBarHeight;
        chatInputBar.style.padding = styles.chatInputBar.split(';')[0] || '10px 14px';
    }
    if (chatMessages) {
        chatMessages.style.padding = styles.messages.split(';')[0] || '10px 16px';
    }

    // Update device indicator
    const indicator = document.getElementById('deviceIndicator');
    if (indicator) {
        indicator.textContent = deviceType === 'phone' ? '📱 Phone' : deviceType === 'tablet' ? '📟 Tablet' : '🖥️ PC';
    }

    // Apply responsive classes
    const allChatItems = document.querySelectorAll('.chat-item');
    allChatItems.forEach(item => {
        if (deviceType === 'phone') {
            item.style.padding = '4px 8px';
        } else if (deviceType === 'tablet') {
            item.style.padding = '6px 10px';
        } else {
            item.style.padding = '8px 12px';
        }
    });

    window.dispatchEvent(new Event('resize'));
}

window.DEVICE_LAYOUTS = DEVICE_LAYOUTS;
window.detectDevice = detectDevice;
window.applyDeviceLayout = applyDeviceLayout;
