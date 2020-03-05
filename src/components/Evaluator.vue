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
            <div class="col-xl-12 col-lg-6 col-md-6 col-sm-6 col-12 q-col-gutter-y-md">
                <div class="q-ml-xl q-mr-xl row" style="justify-content: center">
                    <div class="col-1" style="align-self: center">
                        <q-item-label class="text-weight-bold q-mt-lg q-mb-lg">
                            <span class="text-grey-8">
                                <q-btn flat round size="sm" icon="fas fa-info-circle">
                                    <q-tooltip content-style="font-size: 14px" anchor="bottom middle" self="top middle" :offset="[10, 10]">
                                        {{getRiskInfo('prosecutor')}}
                                    </q-tooltip>
                                </q-btn>
                                Prosecutor Risk: </span>
                        </q-item-label>
                    </div>
                    <div class="col-6">
                        <q-linear-progress class="q-mt-xl q-mb-xl q-ml-lg" rounded size="30px" :value="prosecutor" color="primary">
                            <div class="absolute-full flex flex-center">
                                <q-badge text-color="white">
                                    {{progressLabel(prosecutor)}} <q-icon size="10px" class="q-ml-xs" name="fas fa-percent" color="white" />
                                </q-badge>
                            </div>
                        </q-linear-progress>
                    </div>
                </div>
                <div class="q-ml-xl q-mr-xl row" style="justify-content: center">
                    <div class="col-1" style="align-self: center">
                        <q-item-label class="text-weight-bold q-mt-lg q-mb-lg">
                            <span class="text-grey-8">
                                <q-btn flat round size="sm" icon="fas fa-info-circle">
                                    <q-tooltip content-style="font-size: 14px" anchor="bottom middle" self="top middle" :offset="[10, 10]">
                                        {{getRiskInfo('journalist')}}
                                    </q-tooltip>
                                </q-btn>
                                Journalist Risk: </span>
                        </q-item-label>
                    </div>
                    <div class="col-6">
                        <q-linear-progress class="q-mt-xl q-mb-xl q-ml-lg" rounded size="30px" :value="journalist" color="primary">
                            <div class="absolute-full flex flex-center">
                                <q-badge text-color="white">
                                    {{progressLabel(journalist)}} <q-icon size="10px" class="q-ml-xs" name="fas fa-percent" color="white" />
                                </q-badge>
                            </div>
                        </q-linear-progress>
                    </div>
                </div>
                <div class="q-ml-xl q-mr-xl row" style="justify-content: center">
                    <div class="col-1" style="align-self: center">
                        <q-item-label class="text-weight-bold q-mt-lg q-mb-lg">
                            <span class="text-grey-8">
                                <q-btn flat round size="sm" icon="fas fa-info-circle">
                                    <q-tooltip content-style="font-size: 14px" anchor="bottom middle" self="top middle" :offset="[10, 10]">
                                        {{getRiskInfo('marketer')}}
                                    </q-tooltip>
                                </q-btn>
                                Marketer Risk: </span>
                        </q-item-label>
                    </div>
                    <div class="col-6">
                        <q-linear-progress class="q-mt-xl q-mb-xl q-ml-lg" rounded size="30px" :value="marketer" color="primary">
                            <div class="absolute-full flex flex-center">
                                <q-badge text-color="white">
                                    {{progressLabel(marketer)}} <q-icon size="10px" class="q-ml-xs" name="fas fa-percent" color="white" />
                                </q-badge>
                            </div>
                        </q-linear-progress>
                    </div>
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
        private prosecutor = 0.54;
        private journalist = 0.54;
        private marketer = 0.35;

        progressLabel (progress: number) {
            return (progress * 100).toFixed(2);
        }

        getRiskInfo (risk: string) {
            switch (risk) {
                case 'prosecutor':
                    return 'The risk that a specific person in the dataset can be re-identified when the attacker knows they are in the dataset.';
                case 'journalist':
                    return 'The risk that there exists at least one person in the dataset who can be re-identified. The point is to prove that someone can be re-identified.';
                case 'marketer':
                    return 'The percentage of identities in the dataset that can be correctly re-identified.';
            }
        }

    }
</script>

