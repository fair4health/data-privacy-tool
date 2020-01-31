import Vue from 'vue'
import Vuex from 'vuex'

Vue.use(Vuex);

export default new Vuex.Store({
  state: {
    privacyStep: 1,
    log: ''
  },
  getters: {
    privacyStep: state => state.privacyStep,
    log: state => state.log
  },
  mutations: {
    incrementStep (state) {
      state.privacyStep += 1
    },
    decrementStep (state) {
      state.privacyStep -= 1
    },
    updateLog (state, message) {
      state.log += message + '<br/>'
    }
  },
  actions: {},
  modules: {},
})
