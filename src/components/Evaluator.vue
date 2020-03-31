<template>
    <div>
        <q-toolbar class="bg-grey-4">
            <q-toolbar-title class="text-grey-8">
                Evaluator
            </q-toolbar-title>
        </q-toolbar>
        <div class="q-ma-sm">
            <div class="splitter-slot">
                <q-item-label class="text-weight-bold q-mt-lg q-mb-lg">
                    <span class="text-info"><q-icon name="fas fa-info" size="xs" class="q-mr-xs" /> Risk is calculated according to different models. </span>
                </q-item-label>
            </div>
            <div class="row justify-center">
                <div class="col-2" style="align-self: center">
                    <q-item-label class="text-weight-bold text-primary q-mt-xl">
                        Lowest Prosecutor Risk:
                    </q-item-label>
                </div>
                <div class="col-6">
                    <q-linear-progress class="q-mt-xl q-ml-md" rounded size="30px" :value="evaluationService.lowestProsecutor" color="primary">
                        <div class="absolute-full flex flex-center">
                            <q-badge text-color="white">
                                {{progressLabel(evaluationService.lowestProsecutor)}} <q-icon size="10px" class="q-ml-xs" name="fas fa-percent" color="white" />
                            </q-badge>
                        </div>
                    </q-linear-progress>
                </div>
            </div>
            <div class="row justify-center q-mb-xl">
                <div class="col-8 text-caption text-grey-8" style="align-self: center">
                    <div class="row">
                        <div class="col-3">
                            {{getRiskInfo('lowestProsecutor')}}
                        </div>
                    </div>
                </div>
            </div>
            <div class="row justify-center">
                <div class="col-2" style="align-self: center">
                    <q-item-label class="text-weight-bold text-primary q-mt-lg">
                        Records Affected By Lowest Risk:
                    </q-item-label>
                </div>
                <div class="col-6">
                    <q-linear-progress class="q-mt-lg q-ml-md" rounded size="30px" :value="evaluationService.recordsAffectedByLowest" color="primary">
                        <div class="absolute-full flex flex-center">
                            <q-badge text-color="white">
                                {{progressLabel(evaluationService.recordsAffectedByLowest)}} <q-icon size="10px" class="q-ml-xs" name="fas fa-percent" color="white" />
                            </q-badge>
                        </div>
                    </q-linear-progress>
                </div>
            </div>
            <div class="row justify-center q-mb-xl">
                <div class="col-8 text-caption text-grey-8" style="align-self: center">
                    <div class="row">
                        <div class="col-3">
                            {{getRiskInfo('recordsAffectedByLowest')}}
                        </div>
                    </div>
                </div>
            </div>
            <div class="row justify-center">
                <div class="col-2" style="align-self: center">
                    <q-item-label class="text-weight-bold text-primary q-mt-lg">
                        Average Prosecutor Risk:
                    </q-item-label>
                </div>
                <div class="col-6">
                    <q-linear-progress class="q-mt-lg q-ml-md" rounded size="30px" :value="evaluationService.averageProsecutor" color="primary">
                        <div class="absolute-full flex flex-center">
                            <q-badge text-color="white">
                                {{progressLabel(evaluationService.averageProsecutor)}} <q-icon size="10px" class="q-ml-xs" name="fas fa-percent" color="white" />
                            </q-badge>
                        </div>
                    </q-linear-progress>
                </div>
            </div>
            <div class="row justify-center q-mb-xl">
                <div class="col-8 text-caption text-grey-8" style="align-self: center">
                    <div class="row">
                        <div class="col-3">
                            {{getRiskInfo('averageProsecutor')}}
                        </div>
                    </div>
                </div>
            </div>
            <div class="row justify-center">
                <div class="col-2" style="align-self: center">
                    <q-item-label class="text-weight-bold text-primary q-mt-lg">
                        Highest Prosecutor Risk:
                    </q-item-label>
                </div>
                <div class="col-6">
                    <q-linear-progress class="q-mt-lg q-ml-md" rounded size="30px" :value="evaluationService.highestProsecutor" color="primary">
                        <div class="absolute-full flex flex-center">
                            <q-badge text-color="white">
                                {{progressLabel(evaluationService.highestProsecutor)}} <q-icon size="10px" class="q-ml-sm" name="fas fa-percent" color="white" />
                            </q-badge>
                        </div>
                    </q-linear-progress>
                </div>
            </div>
            <div class="row justify-center q-mb-xl">
                <div class="col-8 text-caption text-grey-8" style="align-self: center">
                    <div class="row">
                        <div class="col-3">
                            {{getRiskInfo('highestProsecutor')}}
                        </div>
                    </div>
                </div>
            </div>
            <div class="row justify-center">
                <div class="col-2" style="align-self: center">
                    <q-item-label class="text-weight-bold text-primary q-mt-lg">
                        Records Affected By Highest Risk:
                    </q-item-label>
                </div>
                <div class="col-6">
                    <q-linear-progress class="q-mt-lg q-ml-md" rounded size="30px" :value="evaluationService.recordsAffectedByHighest" color="primary">
                        <div class="absolute-full flex flex-center">
                            <q-badge text-color="white">
                                {{progressLabel(evaluationService.recordsAffectedByHighest)}} <q-icon size="10px" class="q-ml-xs" name="fas fa-percent" color="white" />
                            </q-badge>
                        </div>
                    </q-linear-progress>
                </div>
            </div>
            <div class="row justify-center q-mb-xl">
                <div class="col-8 text-caption text-grey-8" style="align-self: center">
                    <div class="row">
                        <div class="col-3">
                            {{getRiskInfo('recordsAffectedByHighest')}}
                        </div>
                    </div>
                </div>
            </div>
            <div class="q-ma-sm">
                <div class="row q-ma-md">
                    <q-btn unelevated label="Back" color="primary" icon="chevron_left" @click="$store.commit('decrementStep')" no-caps />
                    <q-space />
                    <q-btn unelevated label="Finish" icon-right="check" color="secondary" @click="saveDialog = true" no-caps />
                </div>
            </div>
        </div>

        <q-dialog v-model="saveDialog">
            <q-card>
                <q-card-section class="row items-center q-pb-none text-primary">
                    <div class="text-h5">Save Anonymized Data</div>
                    <q-space />
                    <q-btn icon="close" flat round dense v-close-popup />
                </q-card-section>
                <q-card-section v-if="saving">
                    <div v-if="loading" class="q-mt-xl">
                        <div class="q-mt-xl q-mb-xl row justify-center">
                            <div class="spinner-comp flex flex-center"></div>
                        </div>
                        <div class="row justify-center">
                            <span class="text-grey-8" style="font-size: 14px">Saving resources...</span>
                        </div>
                    </div>
                    <div v-if="!loading" class="q-ma-sm">
                        <div class="q-mb-lg row justify-center">
                            <transition appear enter-active-class="animated heartBeat">
                                <q-icon size="100px" class="mdi mdi-database-check" color="primary"></q-icon>
                            </transition>
                        </div>
                        <div class="row justify-center">
                            <span class="text-grey-8" style="font-size: 14px">
                                {{savedResourceNumber}} resources are saved.
                            </span>
                        </div>
                    </div>
                </q-card-section>
                <q-card-actions v-if="saving && !loading" align="around">
                    <q-space />
                    <q-btn flat label="Return Home" icon-right="home" color="primary" @click="$store.commit('resetStep') + $router.push('/')" no-caps />
                </q-card-actions>
                <q-card-actions v-if="!saving" align="around">
                    <q-btn class="q-ma-md" unelevated label="Overwrite Existing Data" color="primary" icon-right="swap_horiz" @click="saveToRepository('PUT')" no-caps />
                    <q-space />
                    <q-btn class="q-ma-md" unelevated label="Save As New Data" color="primary" icon-right="save" @click="saveToRepository('POST')" no-caps />
                </q-card-actions>
            </q-card>
        </q-dialog>
    </div>
</template>

<script lang="ts">
    import {Component, Vue} from 'vue-property-decorator';

    @Component
    export default class Evaluator extends Vue {
        private saveDialog: boolean = false;
        private saving: boolean = false;
        private loading: boolean = false;
        private savedResourceNumber: number = 0;
        get evaluationService (): number { return this.$store.getters['fhir/evaluationService'] }

        progressLabel (progress: number) {
            return (progress * 100).toFixed(2);
        }

        getRiskInfo (risk: string) {
            switch (risk) {
                case 'lowestProsecutor':
                    return '- Lowest risk that a specific person in the dataset can be re-identified when the attacker knows they are in the dataset.';
                case 'highestProsecutor':
                    return '- Highest risk that a specific person in the dataset can be re-identified when the attacker knows they are in the dataset.';
                case 'averageProsecutor':
                    return '- Average risk that a specific person in the dataset can be re-identified when the attacker knows they are in the dataset.';
                case 'recordsAffectedByLowest':
                    return '- Percentage of identities in the dataset that has re-identification risk more than lowest prosecutor risk.';
                case 'recordsAffectedByHighest':
                    return '- Percentage of identities in the dataset that has re-identification risk more than highest prosecutor risk.';
            }
        }

        saveToRepository (request: string) {
            this.saving = true;
            this.loading = true;
            this.$store.dispatch('fhir/saveEntries', request)
                .then(response => {
                    this.savedResourceNumber = response;
                    this.loading = false;
                });
        }

    }
</script>

