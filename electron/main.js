import { app, BrowserWindow, ipcMain } from 'electron';
import * as path from 'path';
var mainWindow = null;
function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        minWidth: 800,
        minHeight: 600,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            nodeIntegration: false,
            sandbox: false
        },
        titleBarStyle: 'default',
        show: false
    });
    // Load the app
    if (process.env.VITE_DEV_SERVER_URL) {
        mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
        mainWindow.webContents.openDevTools();
    }
    else {
        mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
    }
    // Show window when ready to prevent visual flash
    mainWindow.once('ready-to-show', function () {
        mainWindow === null || mainWindow === void 0 ? void 0 : mainWindow.show();
    });
    mainWindow.on('closed', function () {
        mainWindow = null;
    });
}
// App event listeners
app.whenReady().then(function () {
    createWindow();
    app.on('activate', function () {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});
app.on('window-all-closed', function () {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});
// IPC handlers
ipcMain.handle('get-app-version', function () {
    return app.getVersion();
});
ipcMain.handle('get-platform', function () {
    return process.platform;
});
ipcMain.handle('minimize-window', function () {
    mainWindow === null || mainWindow === void 0 ? void 0 : mainWindow.minimize();
});
ipcMain.handle('maximize-window', function () {
    if (mainWindow) {
        if (mainWindow.isMaximized()) {
            mainWindow.unmaximize();
        }
        else {
            mainWindow.maximize();
        }
    }
});
ipcMain.handle('close-window', function () {
    mainWindow === null || mainWindow === void 0 ? void 0 : mainWindow.close();
});
