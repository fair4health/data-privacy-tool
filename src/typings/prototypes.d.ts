import Vue from 'vue'
import { LoDashStatic } from 'lodash'

interface Notifier {
    success (message: string): void
    error (message: string): void
    info (message: string): void
    warning (message: string): void
}

declare module 'vue/types/vue' {
    interface Vue {
        $_: LoDashStatic
        $notify: Notifier
    }
}
