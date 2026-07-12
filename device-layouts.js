// Device Layout Configuration

const DEVICE_LAYOUTS = {
    phone: {
        name: 'Phone',
        icon: 'phone.png',
        breakpoints: {
            maxWidth: 768,
            maxHeight: 1024
        },
        layout: {
            sidebarWidth: '100%',
            chatAreaWidth: '100%',
            sidebarCompact: true,
            chatHeaderCompact: true,
            messageMaxWidth: '90%',
            inputBarHeight: '100px',
            fontSize: '0.85rem',
            avatarSize: '32px',
            spacing: '8px'
        },
        styles: {
            sidebar: 'width:100%; border-right:none;',
            chatArea: 'width:100%;',
            chatHeader: 'padding:6px 12px; min-height:48px;',
            chatInputBar: 'min-height:100px; padding:8px 12px;',
            messages: 'padding:8px 12px;',
            message: 'font-size:0.85rem; padding:6px 10px;',
            avatar: 'width:32px; height:32px;',
            selectionCircle: 'left:-18px; width:16px; height:16px;'
        }
    },
    tablet: {
        name: 'Tablet',
        icon: 'tablet.png',
        breakpoints: {
            minWidth: 769,
            maxWidth: 1200,
            maxHeight: 1600
        },
        layout: {
            sidebarWidth: '35%',
            chatAreaWidth: '65%',
            sidebarCompact: false,
            chatHeaderCompact: false,
            messageMaxWidth: '75%',
            inputBarHeight: '110px',
            fontSize: '0.9rem',
            avatarSize: '40px',
            spacing: '10px'
        },
        styles: {
            sidebar: 'width:35%; border-right:1px solid var(--glass-border);',
            chatArea: 'width:65%;',
            chatHeader: 'padding:8px 16px; min-height:56px;',
            chatInputBar: 'min-height:110px; padding:10px 14px;',
            messages: 'padding:10px 16px;',
            message: 'font-size:0.9rem; padding:8px 12px;',
            avatar: 'width:40px; height:40px;',
            selectionCircle: 'left:-24px; width:18px; height:18px;'
        }
    },
    pc: {
        name: 'PC / Desktop',
        icon: 'pc.png',
        breakpoints: {
            minWidth: 1201,
            minHeight: 900
        },
        layout: {
            sidebarWidth: '30%',
            chatAreaWidth: '70%',
            sidebarCompact: false,
            chatHeaderCompact: false,
            messageMaxWidth: '65%',
            inputBarHeight: '123px',
            fontSize: '1rem',
            avatarSize: '44px',
            spacing: '12px'
        },
        styles: {
            sidebar: 'width:30%; border-right:1px solid var(--glass-border);',
            chatArea: 'width:70%;',
            chatHeader: 'padding:10px 20px; min-height:64px;',
            chatInputBar: 'min-height:123px; padding:12px 20px;',
            messages: 'padding:12px 20px;',
            message: 'font-size:1rem; padding:10px 16px;',
            avatar: 'width:44px; height:44px;',
            selectionCircle: 'left:-28px; width:20px; height:20px;'
        }
    }
};

// Device detection function
function detectDevice() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const ratio = width / height;
    
    // Check if it's a phone (narrow aspect ratio)
    if (width < 768 || ratio < 0.8) {
        return 'phone';
    }
    // Check if it's a tablet (medium aspect ratio)
    else if (width >= 768 && width < 1200 && height < 1600) {
        return 'tablet';
    }
    // Default to PC
    else {
        return 'pc';
    }
}

// Apply device layout
function applyDeviceLayout(deviceType) {
    const layout = DEVICE_LAYOUTS[deviceType];
    if (!layout) return;
    
    // Store device preference
    localStorage.setItem('vvn_device', deviceType);
    
    // Update device indicator
    const indicator = document.getElementById('deviceIndicator');
    if (indicator) {
        indicator.textContent = deviceType === 'phone' ? '📱 Phone' : 
                               deviceType === 'tablet' ? '📟 Tablet' : '🖥️ PC';
    }
    
    // Apply styles to root
    const root = document.documentElement;
    const styles = layout.styles;
    
    // Apply CSS variables for layout
    root.style.setProperty('--sidebar-width', layout.layout.sidebarWidth);
    root.style.setProperty('--chat-area-width', layout.layout.chatAreaWidth);
    root.style.setProperty('--font-size', layout.layout.fontSize);
    root.style.setProperty('--avatar-size', layout.layout.avatarSize);
    root.style.setProperty('--message-max-width', layout.layout.messageMaxWidth);
    root.style.setProperty('--input-bar-height', layout.layout.inputBarHeight);
    root.style.setProperty('--spacing', layout.layout.spacing);
    
    // Apply dynamic styles
    const styleSheet = document.createElement('style');
    styleSheet.id = 'device-styles';
    styleSheet.textContent = `
        /* Device-specific styles for ${deviceType} */
        .sidebar { ${styles.sidebar} }
        .chat-area { ${styles.chatArea} }
        .chat-header { ${styles.chatHeader} }
        .chat-input-bar { ${styles.chatInputBar} }
        .chat-messages { ${styles.messages} }
        .message { ${styles.message} }
        .chat-item .avatar { ${styles.avatar} }
        .chat-header-info .avatar { ${styles.avatar} }
        .message .selection-circle { ${styles.selectionCircle} }
        
        /* Responsive adjustments */
        @media (max-width: 768px) {
            .sidebar { width:100% !important; border-right:none !important; }
            .chat-area { width:100% !important; }
            .chat-area.active-mobile { display:flex !important; }
            .sidebar.hide-mobile { display:none !important; }
            .back-btn { display:block !important; }
            .chat-input-bar { min-height:100px !important; padding:8px 10px !important; }
            .chat-input-bar input { min-height:38px !important; font-size:0.8rem !important; }
            .chat-input-bar button { width:40px !important; height:40px !important; }
            .chat-input-bar .clip-btn { width:36px !important; height:36px !important; }
            .chat-input-bar .mic-btn { width:36px !important; height:36px !important; }
            .message { font-size:0.8rem !important; padding:6px 10px !important; max-width:90% !important; }
            .message .selection-circle { left:-16px !important; width:14px !important; height:14px !important; }
            .chat-item .avatar { width:28px !important; height:28px !important; }
            .chat-header-info .avatar { width:28px !important; height:28px !important; }
        }
        
        @media (min-width: 769px) and (max-width: 1200px) {
            .sidebar { width:35% !important; }
            .chat-area { width:65% !important; }
            .chat-input-bar { min-height:110px !important; padding:10px 14px !important; }
            .chat-input-bar input { min-height:42px !important; }
            .chat-input-bar button { width:46px !important; height:46px !important; }
            .message { font-size:0.9rem !important; padding:8px 12px !important; }
            .message .selection-circle { left:-20px !important; width:16px !important; height:16px !important; }
        }
        
        @media (min-width: 1201px) {
            .sidebar { width:30% !important; }
            .chat-area { width:70% !important; }
            .chat-input-bar { min-height:123px !important; padding:12px 20px !important; }
            .chat-input-bar input { min-height:48px !important; }
            .chat-input-bar button { width:52px !important; height:52px !important; }
            .message { font-size:1rem !important; padding:10px 16px !important; }
            .message .selection-circle { left:-28px !important; width:20px !important; height:20px !important; }
        }
    `;
    
    // Remove old device styles
    const oldStyle = document.getElementById('device-styles');
    if (oldStyle) oldStyle.remove();
    document.head.appendChild(styleSheet);
    
    // Update UI
    const sidebar = document.getElementById('sidebar');
    const chatArea = document.getElementById('chatArea');
    
    // Apply mobile-specific classes
    if (deviceType === 'phone') {
        if (sidebar) sidebar.classList.add('phone-layout');
        if (chatArea) chatArea.classList.add('phone-layout');
    } else if (deviceType === 'tablet') {
        if (sidebar) sidebar.classList.add('tablet-layout');
        if (chatArea) chatArea.classList.add('tablet-layout');
    } else {
        if (sidebar) sidebar.classList.add('pc-layout');
        if (chatArea) chatArea.classList.add('pc-layout');
    }
    
    // Trigger resize to apply changes
    window.dispatchEvent(new Event('resize'));
}

// Make functions globally available
window.DEVICE_LAYOUTS = DEVICE_LAYOUTS;
window.detectDevice = detectDevice;
window.applyDeviceLayout = applyDeviceLayout;
