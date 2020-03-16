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
                    <q-item-label class="text-weight-bold q-mt-lg q-mb-lg">
                        <span class="text-grey-8">
                            <q-btn flat round size="sm" icon="fas fa-info-circle">
                                <q-tooltip content-style="font-size: 14px" anchor="bottom middle" self="top middle" :offset="[10, 10]">
                                    {{getRiskInfo('lowestProsecutor')}}
                                </q-tooltip>
                            </q-btn>
                            Lowest Prosecutor Risk: </span>
                    </q-item-label>
                </div>
                <div class="col-6">
                    <q-linear-progress class="q-mt-xl q-mb-xl" rounded size="30px" :value="lowestProsecutor" color="primary">
                        <div class="absolute-full flex flex-center">
                            <q-badge text-color="white">
                                {{progressLabel(lowestProsecutor)}} <q-icon size="10px" class="q-ml-xs" name="fas fa-percent" color="white" />
                            </q-badge>
                        </div>
                    </q-linear-progress>
                </div>
            </div>
            <div class="row justify-center">
                <div class="col-2" style="align-self: center">
                    <q-item-label class="text-weight-bold q-mt-lg q-mb-lg">
                        <span class="text-grey-8">
                            <q-btn flat round size="sm" icon="fas fa-info-circle">
                                <q-tooltip content-style="font-size: 14px" anchor="bottom middle" self="top middle" :offset="[10, 10]">
                                    {{getRiskInfo('recordsAffectedByLowest')}}
                                </q-tooltip>
                            </q-btn>
                            Records Affected By Lowest Risk: </span>
                    </q-item-label>
                </div>
                <div class="col-6">
                    <q-linear-progress class="q-mt-xl q-mb-xl" rounded size="30px" :value="recordsAffectedByLowest" color="primary">
                        <div class="absolute-full flex flex-center">
                            <q-badge text-color="white">
                                {{progressLabel(recordsAffectedByLowest)}} <q-icon size="10px" class="q-ml-xs" name="fas fa-percent" color="white" />
                            </q-badge>
                        </div>
                    </q-linear-progress>
                </div>
            </div>
            <div class="row justify-center">
                <div class="col-2" style="align-self: center">
                    <q-item-label class="text-weight-bold q-mt-lg q-mb-lg">
                        <span class="text-grey-8">
                            <q-btn flat round size="sm" icon="fas fa-info-circle">
                                <q-tooltip content-style="font-size: 14px" anchor="bottom middle" self="top middle" :offset="[10, 10]">
                                    {{getRiskInfo('averageProsecutor')}}
                                </q-tooltip>
                            </q-btn>
                            Average Prosecutor Risk: </span>
                    </q-item-label>
                </div>
                <div class="col-6">
                    <q-linear-progress class="q-mt-xl q-mb-xl" rounded size="30px" :value="averageProsecutor" color="primary">
                        <div class="absolute-full flex flex-center">
                            <q-badge text-color="white">
                                {{progressLabel(averageProsecutor)}} <q-icon size="10px" class="q-ml-xs" name="fas fa-percent" color="white" />
                            </q-badge>
                        </div>
                    </q-linear-progress>
                </div>
            </div>
            <div class="row justify-center">
                <div class="col-2" style="align-self: center">
                    <q-item-label class="text-weight-bold q-mt-lg q-mb-lg">
                        <span class="text-grey-8">
                            <q-btn flat round size="sm" icon="fas fa-info-circle">
                                <q-tooltip content-style="font-size: 14px" anchor="bottom middle" self="top middle" :offset="[10, 10]">
                                    {{getRiskInfo('highestProsecutor')}}
                                </q-tooltip>
                            </q-btn>
                            Highest Prosecutor Risk: </span>
                    </q-item-label>
                </div>
                <div class="col-6">
                    <q-linear-progress class="q-mt-xl q-mb-xl" rounded size="30px" :value="highestProsecutor" color="primary">
                        <div class="absolute-full flex flex-center">
                            <q-badge text-color="white">
                                {{progressLabel(highestProsecutor)}} <q-icon size="10px" class="q-ml-xs" name="fas fa-percent" color="white" />
                            </q-badge>
                        </div>
                    </q-linear-progress>
                </div>
            </div>
            <div class="row justify-center">
                <div class="col-2" style="align-self: center">
                    <q-item-label class="text-weight-bold q-mt-lg q-mb-lg">
                        <span class="text-grey-8">
                            <q-btn flat round size="sm" icon="fas fa-info-circle">
                                <q-tooltip content-style="font-size: 14px" anchor="bottom middle" self="top middle" :offset="[10, 10]">
                                    {{getRiskInfo('recordsAffectedByHighest')}}
                                </q-tooltip>
                            </q-btn>
                            Records Affected By Highest Risk: </span>
                    </q-item-label>
                </div>
                <div class="col-6">
                    <q-linear-progress class="q-mt-xl q-mb-xl" rounded size="30px" :value="recordsAffectedByHighest" color="primary">
                        <div class="absolute-full flex flex-center">
                            <q-badge text-color="white">
                                {{progressLabel(recordsAffectedByHighest)}} <q-icon size="10px" class="q-ml-xs" name="fas fa-percent" color="white" />
                            </q-badge>
                        </div>
                    </q-linear-progress>
                </div>
            </div>
            <div class="q-ma-sm">
                <div class="row q-ma-md">
                    <q-btn unelevated label="Back" color="primary" icon="chevron_left" @click="$store.commit('decrementStep')" no-caps />
                    <q-space />
                    <q-btn unelevated label="Finish" icon-right="check" color="secondary" @click="$store.commit('resetStep') + $router.push('/')" no-caps />
                </div>
            </div>
        </div>
    </div>
</template>

<script lang="ts">
    import {Component, Vue} from 'vue-property-decorator';

    @Component
    export default class Evaluator extends Vue {
        get lowestProsecutor (): number { return this.$store.getters['fhir/lowestProsecutor'] }
        get highestProsecutor (): number { return this.$store.getters['fhir/highestProsecutor'] }
        get averageProsecutor (): number { return this.$store.getters['fhir/averageProsecutor'] }
        get recordsAffectedByLowest (): number { return this.$store.getters['fhir/recordsAffectedByLowest'] }
        get recordsAffectedByHighest (): number { return this.$store.getters['fhir/recordsAffectedByHighest'] }

        progressLabel (progress: number) {
            return (progress * 100).toFixed(2);
        }

        getRiskInfo (risk: string) {
            switch (risk) {
                case 'lowestProsecutor':
                    return 'Lowest risk that a specific person in the dataset can be re-identified when the attacker knows they are in the dataset.';
                case 'highestProsecutor':
                    return 'Highest risk that a specific person in the dataset can be re-identified when the attacker knows they are in the dataset.';
                case 'averageProsecutor':
                    return 'Average risk that a specific person in the dataset can be re-identified when the attacker knows they are in the dataset.';
                case 'recordsAffectedByLowest':
                    return 'Percentage of identities in the dataset that has re-identification risk more than lowest prosecutor risk.';
                case 'recordsAffectedByHighest':
                    return 'Percentage of identities in the dataset that has re-identification risk more than highest prosecutor risk.';
            }
        }

    }
</script>

