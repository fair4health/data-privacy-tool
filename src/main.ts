import Vue from 'vue'
import App from './App.vue'
import router from './router'
import store from './store'
import { QVueGlobals } from 'quasar'
import './quasar'
import {webFrame} from 'electron';
import notifier from './common/notifier'
import TreeView from 'vue-json-tree-view'

window.process.env.ELECTRON_WEBPACK_APP_F4H_HOMEPAGE = require('./../package.json').homepage

webFrame.setZoomFactor(0.9);

Vue.config.productionTip = false;

Vue.use(notifier)
Vue.use(TreeView)

new Vue({
    router,
    store,
    render: h => h(App),
}).$mount('#app');
