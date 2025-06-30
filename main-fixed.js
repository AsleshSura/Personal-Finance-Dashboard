const { app, BrowserWindow, Menu, shell } = require('electron');
const path = require('path');
const { spawn } = require('child_process');

// Keep a global reference of the window object
let mainWindow;
let backendProcess;

// Start the backend server
function startBackend() {
    console.log('Starting desktop backend server...');
    backendProcess = spawn('node', ['backend/simple-server.js'], {
        cwd: __dirname,
        stdio: 'inherit'
    });
    
    backendProcess.on('error', (err) => {
        console.error('Failed to start backend:', err);
    });
}

// Create the main application window
function createWindow() {
    // Create the browser window
    mainWindow = new BrowserWindow({
        width: 1400,
        height: 900,
        minWidth: 1000,
        minHeight: 700,
        icon: path.join(__dirname, 'assets/icon.png'), // Add your icon here
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            enableRemoteModule: false,
            webSecurity: true
        },
        titleBarStyle: 'default',
        show: false // Don't show until ready
    });

    // Wait for backend to start, then load the app
    setTimeout(() => {
        mainWindow.loadURL('http://localhost:5001');
        
        // Show window when ready to prevent visual flash
        mainWindow.once('ready-to-show', () => {
            mainWindow.show();
        });
    }, 3000); // Wait 3 seconds for backend to start

    // Handle window closed
    mainWindow.on('closed', () => {
        mainWindow = null;
    });

    // Handle external links
    mainWindow.webContents.setWindowOpenHandler(({ url }) => {
        shell.openExternal(url);
        return { action: 'deny' };
    });

    // Set up the menu
    createMenu();
}

// Create application menu
function createMenu() {
    const template = [
        {
            label: 'Finance Dashboard',
            submenu: [
                {
                    label: 'About Personal Finance Dashboard',
                    click: () => {
                        // Show about dialog
                        const { dialog } = require('electron');
                        dialog.showMessageBox(mainWindow, {
                            type: 'info',
                            title: 'About',
                            message: 'Personal Finance Dashboard',
                            detail: 'A simple desktop finance tracking application.\nVersion 1.0.0'
                        });
                    }
                },
                { type: 'separator' },
                {
                    label: 'Quit',
                    accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
                    click: () => {
                        app.quit();
                    }
                }
            ]
        },
        {
            label: 'Edit',
            submenu: [
                { role: 'undo' },
                { role: 'redo' },
                { type: 'separator' },
                { role: 'cut' },
                { role: 'copy' },
                { role: 'paste' },
                { role: 'selectall' }
            ]
        },
        {
            label: 'View',
            submenu: [
                { role: 'reload' },
                { role: 'forceReload' },
                { role: 'toggleDevTools' },
                { type: 'separator' },
                { role: 'resetZoom' },
                { role: 'zoomIn' },
                { role: 'zoomOut' },
                { type: 'separator' },
                { role: 'togglefullscreen' }
            ]
        },
        {
            label: 'Window',
            submenu: [
                { role: 'minimize' },
                { role: 'close' }
            ]
        }
    ];

    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);
}

// App event handlers
app.whenReady().then(() => {
    // Start backend server
    startBackend();
    
    // Create main window
    createWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

// Quit when all windows are closed
app.on('window-all-closed', () => {
    // Kill backend process
    if (backendProcess) {
        backendProcess.kill();
    }
    
    // On macOS, keep app running even when all windows are closed
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

// Kill backend when app is quitting
app.on('before-quit', () => {
    if (backendProcess) {
        backendProcess.kill();
    }
});

// Security: Prevent new window creation
app.on('web-contents-created', (event, contents) => {
    contents.on('new-window', (event, navigationUrl) => {
        event.preventDefault();
        shell.openExternal(navigationUrl);
    });
});

console.log('🖥️  Personal Finance Dashboard - Desktop App Starting...');
