import { __decorate } from "tslib";
import { Component, Vue, Watch } from 'vue-property-decorator';
import Loading from '@/components/Loading.vue';
let MainLayout = class MainLayout extends Vue {
    constructor() {
        super(...arguments);
        this.splitterModel = this.limits[1];
        this.miniState = true;
        this.leftDrawerOpen = false;
        this.searchKey = '';
        this.matchCount = 0;
    }
    get step() { return this.$store.getters.privacyStep; }
    get style() { return { height: this.$q.screen.height - 50 + 'px' }; }
    get limits() { return [20, Math.floor(100 - (50.0 / (this.$q.screen.height - 50) * 100))]; }
    get isCollapsed() { return (this.$q.screen.gt.xs && (this.$q.screen.lt.lg || this.miniState)); }
    get logger() { return this.$store.getters.log; }
    onScreenChange() {
        this.splitterModel = this.limits[1];
    }
    onLoggerChange() {
        const logDiv = document.getElementsByClassName('logger-class')[0];
        if (logDiv) {
            setTimeout(() => {
                logDiv.scrollTo(0, logDiv.scrollHeight);
            }, 0);
        }
    }
};
__decorate([
    Watch('$q.screen.height')
], MainLayout.prototype, "onScreenChange", null);
__decorate([
    Watch('logger'),
    Watch('splitterModel')
], MainLayout.prototype, "onLoggerChange", null);
MainLayout = __decorate([
    Component({
        components: {
            Logger: () => ({
                component: import('@/components/Logger.vue'),
                loading: Loading
            })
        }
    })
], MainLayout);
export default MainLayout;
//# sourceMappingURL=MainLayout.vue.js.map