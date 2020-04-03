import Vue from 'vue'
import Vuex from 'vuex'

import fhir from './fhirStore'

Vue.use(Vuex);

export default new Vuex.Store({
    state: {
        drawerOpen: true,
        drawerMiniState: true,
        privacyStep: 1,
        log: '',
        metaStep: 1
    },
    getters: {
        drawerOpen: state => state.drawerOpen,
        drawerMiniState: state => state.drawerMiniState,
        privacyStep: state => state.privacyStep,
        log: state => state.log,
        metaStep: state => state.metaStep,
    },
    mutations: {
        setDrawerOpen (state, value: boolean) {
            state.drawerOpen = value
        },
        setDrawerMiniState (state, value: boolean) {
            state.drawerMiniState = value
        },
        incrementStep (state) {
            state.privacyStep += 1
        },
        decrementStep (state) {
            state.privacyStep -= 1
        },
        resetStep (state) {
            state.privacyStep = 1
        },
        setStep (state, value) {
            state.privacyStep = value;
        },
        updateLog (state, message) {
            state.log += message + '<br/>'
        },
        setMetaStep (state, value: number) {
            state.metaStep = value;
        }
    },
    actions: {},
    modules: {fhir},
})
