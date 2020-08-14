import log from 'electron-log'
import { VNode, CreateElement } from 'vue'
import {
    BrowserWindow,
    ipcRenderer,
    OpenDialogReturnValue,
    remote,
    SaveDialogReturnValue
} from 'electron'
import { Component, Vue } from 'vue-property-decorator'
import { IpcChannelUtil as ipcChannels } from '@/common/utils/ipc-channel-util'
import * as fs from 'fs';

@Component
export default class BackgroundEngine extends Vue {

    created () {
        // Logger settings
        log.transports.file.fileName = 'log.txt'
        log.transports.console.level = false

        // Initialize IPC listeners
        this.initListeners()

        // Get ready - available thread window
        this.ready()
    }

    public initListeners () {
        // File listeners
        this.onBrowseConfiguration()
        this.onExportFile()
    }

    /**
     * Informs main process that this thread is available/ready to perform
     */
    public ready () {
        ipcRenderer.send(ipcChannels.READY)
    }

    /**
     * Browses files with .json extension and sends back parsed content
     */
    public onBrowseConfiguration () {
        ipcRenderer.on(ipcChannels.File.BROWSE_CONFIGURATIONS, () => {
            remote.dialog.showOpenDialog(remote.BrowserWindow.getFocusedWindow() as BrowserWindow, {
                properties: ['openFile'], filters: [{ extensions: ['json'], name: 'JSON (.json)' }]
            }).then((response: OpenDialogReturnValue) => {
                if (response && !response.canceled && response.filePaths && response.filePaths.length) {
                    const files = response.filePaths;
                    fs.readFile(files[0], (err, data) => {
                        if (err) {
                            log.error(`Cannot read configuration file ${files[0]}`)
                            ipcRenderer.send(ipcChannels.TO_RENDERER, ipcChannels.File.SELECTED_CONFIGURATION, undefined)
                            this.ready()
                            return
                        }
                        log.info(`Configuration loaded from ${files[0]}`)
                        ipcRenderer.send(ipcChannels.TO_RENDERER, ipcChannels.File.SELECTED_CONFIGURATION, JSON.parse(data.toString()))
                    })
                } else ipcRenderer.send(ipcChannels.TO_RENDERER, ipcChannels.File.SELECTED_CONFIGURATION, undefined)
                this.ready()
            })
            .catch(err => {
                log.error(`Browse file error. ${err}`)
                this.ready()
            })
        })
    }

    /**
     * File export - opens SAVE dialog and saves file with json extension
     */
    public onExportFile () {
        ipcRenderer.on(ipcChannels.File.EXPORT_FILE, (event, content) => {
            remote.dialog.showSaveDialog(remote.BrowserWindow.getFocusedWindow() as BrowserWindow, {
                filters: [{ extensions: ['json'], name: 'JSON (.json)' }]
            })
                .then((response: SaveDialogReturnValue) => {
                    const filename = response.filePath
                    if (!response || !filename || response.canceled) {
                        ipcRenderer.send(ipcChannels.TO_RENDERER, ipcChannels.File.EXPORT_DONE, null)
                        this.ready()
                        return
                    }
                    fs.writeFile(filename, content, (err) => {
                        if (err) {
                            log.error(`Export file: ${err}`)
                            ipcRenderer.send(ipcChannels.TO_RENDERER, ipcChannels.File.EXPORT_DONE, null)
                            this.ready()
                            return
                        }
                        ipcRenderer.send(ipcChannels.TO_RENDERER, ipcChannels.File.EXPORT_DONE, true)
                    })
                    this.ready()
                })
                .catch(err => {
                    log.error(`Save file error. ${err}`)
                    this.ready()
                })
        })
    }

    render (createElement: CreateElement): VNode {
        return createElement('div', {}, 'This is the background process window.')
    }

}
