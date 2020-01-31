import { __decorate } from "tslib";
import { Component, Vue } from 'vue-property-decorator';
let Stepper = class Stepper extends Vue {
    get step() { return this.$store.getters.privacyStep; }
};
Stepper = __decorate([
    Component({
    // components: {
    //     DataSourceAnalyzer: () => ({
    //         component: import('@/components/DataSourceAnalyzer.vue'),
    //         loading: Loading,
    //         delay: 0
    //     }),
    //     MetadataMapper: () => ({
    //         component: import('@/components/MetadataMapper.vue'),
    //         loading: Loading,
    //         delay: 0
    //     }),
    //     Transformer: () => ({
    //         component: import('@/components/Transformer.vue'),
    //         loading: Loading,
    //         delay: 0
    //     })
    // } as any
    })
], Stepper);
export default Stepper;
//# sourceMappingURL=Deidentifier.vue.js.map