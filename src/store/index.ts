import Vue from 'vue'
import Vuex from 'vuex'

import fhir from './fhirStore'

Vue.use(Vuex);

export default new Vuex.Store({
  state: {
    privacyStep: 1,
    previousStep: 1,
    log: ''
  },
  getters: {
    privacyStep: state => state.privacyStep,
    previousStep: state => state.previousStep,
    log: state => state.log
  },
  mutations: {
    incrementStep (state) {
      state.previousStep = state.privacyStep;
      state.privacyStep += 1
    },
    decrementStep (state) {
      state.previousStep = state.privacyStep;
      state.privacyStep -= 1
    },
    resetStep (state) {
      state.previousStep = 0;
      state.privacyStep = 1
    },
    updateLog (state, message) {
      state.log += message + '<br/>'
    }
  },
  actions: {},
  modules: {fhir},
})
