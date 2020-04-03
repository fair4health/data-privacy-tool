<template>
    <div>
        <q-toolbar class="bg-grey-4">
            <q-toolbar-title class="text-grey-8">
                Configuration Manager
            </q-toolbar-title>
        </q-toolbar>

        <div class="q-ma-sm">
            <div class="splitter-slot">
                <q-item-label class="text-weight-bold q-mt-lg q-mb-lg">
                    <span class="text-info"><q-icon name="fas fa-info" size="xs" class="q-mr-xs" /> Configure de-identification parameters. </span>
                </q-item-label>
                <q-card flat class="bg-white">
                    <q-card-section class="row q-col-gutter-sm">
                        <div class="col-xs-12 col-sm-12 col-md-6">
                            <q-item-label class="text-weight-bold">
                                <span><q-icon name="fas fa-fire" size="xs" color="primary" class="q-mr-xs" /> FHIR Resource</span>
                            </q-item-label>
                            <q-separator spaced />
                            <q-select outlined dense v-model="currentFHIRRes" :options="fhirResourceOptions" label="FHIR Resource"
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
                                <span><q-icon name="far fa-file-alt" size="xs" color="primary" class="q-mr-xs" /> Profiles</span>
                            </q-item-label>
                            <q-separator spaced />
                            <q-select clearable outlined dense v-model="currentFHIRProf" :options="resourceProfileMappings[currentFHIRRes]" label="Profiles" :disable="!this.resourceProfileMappings[this.currentFHIRRes] || !resourceProfileMappings[currentFHIRRes].length">
                                <template v-slot:option="scope">
                                    <q-item v-bind="scope.itemProps" v-on="scope.itemEvents">
                                        <q-item-section avatar>
                                            <q-icon name="fas fa-file-alt" size="xs" />
                                        </q-item-section>
                                        <q-item-section>
                                            <q-item-label v-html="scope.opt" />
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
                            <q-tab name="quasi" label="Quasi-identifiers" />
                            <q-tab name="sensitive" label="Sensitive Attributes" />
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
            </div>
            <div class="row q-ma-md">
                <q-btn unelevated label="Back" color="primary" icon="chevron_left" @click="$store.commit('decrementStep')" no-caps />
                <q-space />
                <q-btn unelevated label="Anonymize" icon-right="check" color="primary" @click="$store.commit('incrementStep')" no-caps />
            </div>
        </div>
    </div>
</template>

<script lang="ts">
import {Component, Vue, Watch} from 'vue-property-decorator'
import Loading from '@/components/Loading.vue';

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

    get fhirResourceList (): string[] { return this.$store.getters['fhir/resourceList'] }

    get currentFHIRRes (): string { return this.$store.getters['fhir/currentResource'] }
    set currentFHIRRes (value) { this.$store.commit('fhir/setCurrentResource', value) }

    get currentFHIRProf (): string { return this.$store.getters['fhir/currentProfile'] }
    set currentFHIRProf (value) { this.$store.commit('fhir/setCurrentProfile', value) }

    get resourceProfileMappings (): any { return this.$store.getters['fhir/resourceProfileMappings'] }
    set resourceProfileMappings (value) { this.$store.commit('fhir/setResourceProfileMappings', value) }

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
        this.$store.dispatch('fhir/getElements', !this.currentFHIRProf ? this.currentFHIRRes : this.currentFHIRProf)
            .then(() => {
                this.loadingFhir = false;
                this.$forceUpdate();
            })
    }

    filterFn (val, update) {
        if (val === '') {
            update(_ => this.fhirResourceOptions = this.fhirResourceList);
            return
        }
        update(_ => this.fhirResourceOptions = this.fhirResourceList.filter(v => v.toLowerCase().includes(val.toLowerCase())))
    }

}

</script>

<style lang="stylus">
    input[type="number"]::-webkit-outer-spin-button, input[type="number"]::-webkit-inner-spin-button {
        opacity: 0.75
    }
</style>
