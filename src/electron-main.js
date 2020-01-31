'use strict';
import { app, protocol, BrowserWindow, dialog } from 'electron';
import log from 'electron-log';
import { createProtocol, installVueDevtools } from 'vue-cli-plugin-electron-builder/lib';
import devtools from '@vue/devtools';
const isDevelopment = process.env.NODE_ENV !== 'production';
// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let win;
// Scheme must be registered before the app is ready
protocol.registerSchemesAsPrivileged([{ scheme: 'fair4health', privileges: { secure: true, standard: true } }]);
function createWindow() {
    // Create the browser window.
    win = new BrowserWindow({ width: 800, height: 600, webPreferences: { nodeIntegration: true } });
    // Make window fullscreen
    win.maximize();
    win.show();
    log.info('Electron - Initializing Window...');
    if (process.env.WEBPACK_DEV_SERVER_URL) {
        // Load the url of the dev server if in development mode
        win.loadURL(process.env.WEBPACK_DEV_SERVER_URL);
        if (!process.env.IS_TEST)
            win.webContents.openDevTools();
    }
    else {
        createProtocol('fair4health');
        // Load the index.html when not in development
        win.loadURL('fair4health://./index.html');
    }
    win.webContents.on('crashed', () => {
        const options = {
            type: 'info',
            title: 'Renderer Process Crashed',
            message: 'This process has crashed.',
            buttons: ['Reload', 'Close']
        };
        log.error('Renderer Process Crashed');
        dialog.showMessageBox(options).then((response) => {
            var _a, _b;
            if (response.response === 0)
                (_a = win) === null || _a === void 0 ? void 0 : _a.reload();
            else
                (_b = win) === null || _b === void 0 ? void 0 : _b.close();
        });
    });
    win.on('closed', () => {
        win = null;
    });
}
// Quit when all windows are closed.
app.on('window-all-closed', () => {
    // On macOS it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    if (process.platform !== 'darwin') {
        app.quit();
    }
});
app.on('activate', () => {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (win === null) {
        createWindow();
    }
});
// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', () => {
    if (isDevelopment && !process.env.IS_TEST) {
        // Install Vue Devtools
        // Devtools extensions are broken in Electron 6.0.0 and greater
        // See https://github.com/nklayman/vue-cli-plugin-electron-builder/issues/378 for more info
        // Electron will not launch with Devtools extensions installed on Windows 10 with dark mode
        // If you are not using Windows 10 dark mode, you may uncomment these lines
        // In addition, if the linked issue is closed, you can upgrade electron and uncomment these lines
        try {
            installVueDevtools().catch(r => devtools.connect());
        }
        catch (e) {
            console.error('Vue Devtools failed to install:', e.toString());
        }
    }
    createWindow();
});
// Exit cleanly on request from parent process in development mode.
if (isDevelopment) {
    if (process.platform === 'win32') {
        process.on('message', data => {
            if (data === 'graceful-exit') {
                app.quit();
            }
        });
    }
    else {
        process.on('SIGTERM', () => {
            app.quit();
        });
    }
}
//# sourceMappingURL=electron-main.js.map