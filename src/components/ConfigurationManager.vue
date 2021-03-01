<template>
    <div>
        <q-toolbar class="bg-grey-4">
            <q-toolbar-title class="text-grey-8"> {{ $t('COMMON.CONFIGURATION_MANAGER') }} </q-toolbar-title>
        </q-toolbar>

        <div class="q-ma-sm">
            <q-item-label class="text-weight-bold q-mt-lg q-mb-lg">
                <span class="text-info"><q-icon name="fas fa-info" size="xs" class="q-mr-xs" /> {{ $t('INFO.CONFIGURATION_MANAGER_INFO') }} </span>
            </q-item-label>
            <q-card flat class="bg-white">
                <q-card-section class="row q-col-gutter-sm">
                    <div class="col-xs-12 col-sm-12 col-md-6">
                        <q-item-label class="text-weight-bold">
                            <span><q-icon name="fas fa-fire" size="xs" color="primary" class="q-mr-xs" /> {{ $t('LABELS.FHIR_RESOURCE') }} </span>
                        </q-item-label>
                        <q-separator spaced />
                        <q-select outlined dense v-model="currentFHIRRes" :options="fhirResourceOptions" :label="$t('LABELS.FHIR_RESOURCE')"
                                  @filter="filterFn" use-input input-debounce="0">
                            <template v-slot:option="scope">
                                <q-item v-bind="scope.itemProps" v-on="scope.itemEvents">
                                    <q-item-section avatar>
                                        <q-icon name="fas fa-fire" size="xs" />
                                    </q-item-section>
                                    <q-item-section>
                                        <q-item-label v-html="scope.opt" />
                                    </q-item-section>
                                </q-item>
                            </template>
                        </q-select>
                    </div>
                    <div class="col-xs-12 col-sm-12 col-md-6">
                        <q-item-label class="text-weight-bold">
                            <span><q-icon name="far fa-file-alt" size="xs" color="primary" class="q-mr-xs" /> {{ $t('LABELS.PROFILES') }} </span>
                        </q-item-label>
                        <q-separator spaced />
                        <q-select clearable outlined dense options-dense v-model="currentFHIRProf" :options="sortProfiles(resourceProfileMappings[currentFHIRRes])"
                                  :disable="!this.resourceProfileMappings[this.currentFHIRRes] || !resourceProfileMappings[currentFHIRRes].length"
                                  :option-label="item => item.split('/').pop()" :label="$t('LABELS.PROFILES')">
                            <template v-slot:option="scope">
                                <q-item v-bind="scope.itemProps" v-on="scope.itemEvents">
                                    <q-item-section avatar>
                                        <q-icon name="fas fa-file-alt" size="xs" />
                                    </q-item-section>
                                    <q-item-section>
                                        <q-item-label v-html="scope.opt.split('/').pop()" />
                                    </q-item-section>
                                </q-item>
                            </template>
                        </q-select>
                    </div>
                </q-card-section>
                <q-card-section class="q-pb-none">
                    <q-tabs
                        v-model="tab"
                        class="bg-grey-1 text-primary"
                        align="justify"
                        inline-label
                    >
                        <q-tab name="quasi" :label="$t('LABELS.QUASI_IDENTIFIERS')" />
                        <q-tab name="sensitive" :label="$t('LABELS.SENSITIVE_ATTRIBUTES')" />
                    </q-tabs>
                    <q-separator />
                    <q-tab-panels v-model="tab" animated>
                        <q-tab-panel name="quasi">
                            <QuasiIdentifierTable />
                        </q-tab-panel>
                        <q-tab-panel name="sensitive">
                            <SensitiveAttributeTable />
                        </q-tab-panel>
                    </q-tab-panels>
                </q-card-section>
            </q-card>
            <div class="row q-ma-md">
                <q-btn unelevated :label="$t('BUTTONS.BACK')" color="primary" icon="chevron_left" @click="previousStep" no-caps />
                <q-space />
                <q-btn unelevated :label="$t('BUTTONS.NEXT')" icon-right="chevron_right" color="primary" @click="nextStep" no-caps />
            </div>
        </div>
    </div>
</template>

<script lang="ts">
import {Component, Vue, Watch} from 'vue-property-decorator'
import Loading from '@/components/Loading.vue';
import {VuexStoreUtil as types} from '@/common/utils/vuex-store-util';
import {FHIRUtils} from '@/common/utils/fhir-util'

@Component({
    components: {
        QuasiIdentifierTable: () => ({
            component: import('@/components/tables/QuasiIdentifierTable.vue'),
            loading: Loading,
            delay: 0
        }),
        SensitiveAttributeTable: () => ({
            component: import('@/components/tables/SensitiveAttributeTable.vue'),
            loading: Loading,
            delay: 0
        })
    } as any
})
export default class ConfigurationManager extends Vue {
    private loadingFhir: boolean = false;
    private fhirResourceOptions: string[] = [];
    private tab: string = 'quasi';

    get fhirResourceList (): string[] { return this.$store.getters[types.Fhir.RESOURCE_LIST] }

    get currentFHIRRes (): string { return this.$store.getters[types.Fhir.CURRENT_RESOURCE] }
    set currentFHIRRes (value) { this.$store.commit(types.Fhir.SET_CURRENT_RESOURCE, value) }

    get currentFHIRProf (): string { return this.$store.getters[types.Fhir.CURRENT_PROFILE] }
    set currentFHIRProf (value) { this.$store.commit(types.Fhir.SET_CURRENT_PROFILE, value) }

    get resourceProfileMappings (): any { return this.$store.getters[types.Fhir.RESOURCE_PROFILE_MAPPINGS] }
    set resourceProfileMappings (value) { this.$store.commit(types.Fhir.SET_RESOURCE_PROFILE_MAPPINGS, value) }

    created () {
        this.getElements();
    }

    @Watch('currentFHIRRes')
    onFHIRResourceChanged (): void {
        this.currentFHIRProf = '';
        this.loadingFhir = true;
        this.getElements();
    }

    @Watch('currentFHIRProf')
    onFHIRProfileChanged (): void {
        this.loadingFhir = true;
        this.getElements();
    }

    getElements () {
        const params = {parameterName: '', profile: ''}
        if (this.currentFHIRProf) {
            params.parameterName = 'url'
            params.profile = this.currentFHIRProf
        } else {
            params.parameterName = '_id'
            params.profile = this.currentFHIRRes
        }
        this.$store.dispatch(types.Fhir.GET_ELEMENTS, params)
            .then(() => {
                this.loadingFhir = false;
                this.$forceUpdate();
            })
            .catch(() => {
                this.loadingFhir = false;
                if (!this.currentFHIRProf) {
                    this.$notify.error(String(this.$t('ERROR.X_RESOURCE_ELEMENTS_COULDNT_BE_LOADED', {resource: this.currentFHIRRes})))
                } else {
                    this.$notify.error(String(this.$t('ERROR.X_PROFILE_ELEMENTS_COULDNT_BE_LOADED', {profile: this.currentFHIRProf})));
                }
            })
    }

    filterFn (val, update) {
        if (val === '') {
            update(_ => this.fhirResourceOptions = this.fhirResourceList);
            return
        }
        update(_ => this.fhirResourceOptions = this.fhirResourceList.filter(v => v.toLowerCase().includes(val.toLowerCase())))
    }

    nextStep () {
        this.$store.commit(types.INCREMENT_STEP)
    }

    previousStep () {
        this.$store.commit(types.DECREMENT_STEP)
    }

    sortProfiles (profiles: string[]) {
        return FHIRUtils.sortProfiles(profiles)
    }

}

</script>

<style lang="stylus">
    input[type="number"]::-webkit-outer-spin-button, input[type="number"]::-webkit-inner-spin-button {
        opacity: 0.75
    }
</style>
