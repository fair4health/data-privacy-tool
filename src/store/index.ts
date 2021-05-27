import Vue from 'vue'
import Vuex from 'vuex'
import fhir from './fhirStore'
import { VuexStoreUtil as types } from '@/common/utils/vuex-store-util'

Vue.use(Vuex);

export default new Vuex.Store({
    state: {
        drawerOpen: true,
        drawerMiniState: false,
        privacyStep: 1
    },
    getters: {
        [types.DRAWER_OPEN]: state => state.drawerOpen,
        [types.DRAWER_MINI_STATE]: state => state.drawerMiniState,
        [types.PRIVACY_STEP]: state => state.privacyStep
    },
    mutations: {
        [types.SET_DRAWER_OPEN] (state, value: boolean) {
            state.drawerOpen = value
        },
        [types.SET_DRAWER_MINI_STATE] (state, value: boolean) {
            state.drawerMiniState = value
        },
        [types.INCREMENT_STEP] (state) {
            state.privacyStep += 1
        },
        [types.DECREMENT_STEP] (state) {
            state.privacyStep -= 1
        },
        [types.RESET_STEP] (state) {
            state.privacyStep = 1
        },
        [types.SET_STEP] (state, value) {
            state.privacyStep = value;
        }
    },
    actions: {},
    modules: {fhir},
})
