<template>
    <div>
        <q-toolbar class="bg-grey-4">
            <q-toolbar-title class="text-grey-8">
                Configuration Manager
            </q-toolbar-title>
            <q-space />
            <q-btn flat round
                   icon="fas fa-arrow-alt-circle-left"
                   color="secondary"
                   @click="$store.commit('decrementStep')"
            />
            <q-btn flat round
                   icon="fas fa-arrow-alt-circle-right"
                   color="primary"
                   @click="$store.commit('incrementStep')"
            />
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
                            <q-select outlined dense v-model="currentFHIRProf" :options="resources[currentFHIRRes]" label="Profiles" :disable="!this.resources[this.currentFHIRRes] || !resources[currentFHIRRes].length">
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
                    <q-card-section class="q-pt-none">
                        <div class="row">
                            <div class="col-2">
                                <q-field borderless label="K value for k-anonymity:" readonly dense label-color="black" class="text-weight-bold" />
                            </div>
                            <div class="col-1">
                                <q-input v-model="kValue" type="number" dense outlined />
                            </div>
                        </div>
                    </q-card-section>
                </q-card>
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
    private resources = {};
    private tab: string = 'quasi';

    get fhirResourceList (): string[] { return this.$store.getters['fhir/selectedResources'] }
    get fhirProfileList (): string[] { return this.$store.getters['fhir/selectedProfiles'] }
    get allfhirProfilesList (): string[] { return this.$store.getters['fhir/profileList'].map(r => r.id) }

    get currentFHIRRes (): string { return this.$store.getters['fhir/currentResource'] }
    set currentFHIRRes (value) { this.$store.commit('fhir/setCurrentResource', value) }

    get currentFHIRProf (): string { return this.$store.getters['fhir/currentProfile'] }
    set currentFHIRProf (value) { this.$store.commit('fhir/setCurrentProfile', value) }

    get kValue (): number { return this.$store.getters['fhir/kValue'] }
    set kValue (value) { this.$store.commit('fhir/setKValue', value) }

    created () {
        for (const resource of this.fhirResourceList) {
            this.$store.dispatch('fhir/getProfilesByRes', resource).then(pro => {
                const availableProfiles = this.allfhirProfilesList.filter(profile => this.fhirProfileList.indexOf(profile) !== -1);
                this.resources[JSON.parse(JSON.stringify(resource))] = JSON.parse(JSON.stringify(availableProfiles));
                this.$forceUpdate();
            });
        }
    }

    @Watch('currentFHIRRes')
    onFHIRResourceChanged (): void {
        this.loadingFhir = true;
        this.$store.dispatch('fhir/getProfilesByRes', this.currentFHIRRes)
            .then(result => {
                if (result) {
                    this.loadingFhir = false;
                    this.currentFHIRProf = (this.resources[this.currentFHIRRes] && this.resources[this.currentFHIRRes].length) ? this.resources[this.currentFHIRRes][0] : '';
                    // Fetch elements of base resources
                    if (!this.currentFHIRProf) {
                        this.$store.dispatch('fhir/getElements', this.currentFHIRRes)
                            .then(() => this.loadingFhir = false )
                            .catch(err => {
                                this.loadingFhir = false;
                                throw err
                            })
                    }
                }
            })
            .catch(err => {
                this.loadingFhir = false;
                throw err
            })
    }

    @Watch('currentFHIRProf')
    onFHIRProfileChanged (newVal: any): void {
        if (newVal) {
            this.loadingFhir = true;
            this.$store.dispatch('fhir/getElements', this.currentFHIRProf)
                .then(() => {
                    this.loadingFhir = false
                })
                .catch(err => {
                    this.loadingFhir = false;
                    throw err
                })
        }
    }

    filterFn (val, update) {
        if (val === '') {
            update(_ => this.fhirResourceOptions = this.fhirResourceList);
            return
        }
        update(_ => this.fhirResourceOptions = this.fhirResourceList.filter(v => v.toLowerCase().indexOf(val.toLowerCase()) > -1))
    }

}

</script>

<style lang="stylus">
    input[type="number"]::-webkit-outer-spin-button, input[type="number"]::-webkit-inner-spin-button {
        opacity: 0.75
    }
</style>
