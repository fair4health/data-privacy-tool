import fs from 'fs'
import { ipcMain, dialog, BrowserWindow } from 'electron'

/**
 * Browses files with .json extension and return parsed content
 */
ipcMain.on('browse-configurations', (event) => {
    dialog.showOpenDialog(BrowserWindow.getFocusedWindow()!, {
        properties: ['openFile'], filters: [{ extensions: ['json'], name: 'JSON (.json)' }] }).then(response => {
        if (response && !response.canceled && response.filePaths && response.filePaths.length) {
            const files = response.filePaths;
            fs.readFile(files[0], (err, data) => {
                if (err) {
                    event.sender.send('selected-configurations', undefined)
                    return
                }
                event.sender.send('selected-configurations', JSON.parse(data.toString()))
            })
        } else event.sender.send('selected-configurations', undefined)
    });
})

/**
 * File export - opens SAVE dialog and saves file with json extension
 */
ipcMain.on('export-file', (event, content) => {
    dialog.showSaveDialog(BrowserWindow.getFocusedWindow()!, {
        filters: [{ extensions: ['json'], name: 'JSON (.json)' }]}).then(response => {
        const filename = response.filePath;
        if (!response || !filename || response.canceled) {
            event.sender.send('export-done', null)
            return
        }
        fs.writeFile(filename, content, (err) => {
            if (err) {
                event.sender.send('export-done', null)
                return
            }
            event.sender.send('export-done', true)
        })
    })
})
