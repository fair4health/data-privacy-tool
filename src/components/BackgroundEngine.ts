import log from 'electron-log'
import { VNode, CreateElement } from 'vue'
import { ipcRenderer } from 'electron'
import { Component, Vue } from 'vue-property-decorator'
import { IpcChannelUtil as ipcChannels } from '@/common/utils/ipc-channel-util'

@Component
export default class BackgroundEngine extends Vue {

    created () {
        // Logger settings
        log.transports.file.fileName = 'log.txt'
        log.transports.console.level = false

        // Get ready - available thread window
        this.ready()
    }

    /**
     * Informs main process that this thread is available/ready to perform
     */
    public ready () {
        ipcRenderer.send(ipcChannels.READY)
    }

    render (createElement: CreateElement): VNode {
        return createElement('div', {}, 'This is the background process window.')
    }

}
