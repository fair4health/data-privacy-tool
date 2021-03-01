import Vue from 'vue'
import App from './App.vue'
import router from './router'
import store from './store'
import { QVueGlobals } from 'quasar'
import './quasar'
import {webFrame} from 'electron';
import notifier from './common/notifier'
import TreeView from 'vue-json-tree-view'
import _ from 'lodash'
import i18n from './i18n'

const packageJson = require('./../package.json')
// Include the app version and project homepage in the window.process environment
window.process.env.APP_VERSION = packageJson.version
window.process.env.APP_HOMEPAGE = packageJson.homepage

webFrame.setZoomFactor(0.9);

Vue.config.productionTip = false;
Vue.prototype.$_ = _;

Vue.use(notifier)
Vue.use(TreeView)

new Vue({
    router,
    store,
    i18n,
    render: h => h(App),
}).$mount('#app');
