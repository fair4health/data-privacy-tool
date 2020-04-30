<template>
	<div>
		<q-toolbar class="bg-grey-4">
			<q-toolbar-title class="text-grey-8">
				Metadata Analyzer
			</q-toolbar-title>
			<q-btn v-if="metaStep === 2" unelevated label="Select" color="primary" @click="selectSavedConfigurations" icon="fas fa-archive" no-caps class="q-mr-sm" >
				<q-tooltip anchor="bottom middle" self="top middle">Select Saved Configuration</q-tooltip>
			</q-btn>
			<q-btn v-if="metaStep === 2" unelevated label="Import" color="primary" @click="importSavedConfigurations" icon="fas fa-file-import" no-caps >
				<q-tooltip anchor="bottom middle" self="top middle">Import Configuration</q-tooltip>
			</q-btn>
		</q-toolbar>

		<div v-if="metaStep === 1" class="q-mt-xl">
			<OnFHIRConfig />
		</div>

		<div v-if="metaStep === 2" class="q-ma-sm">
			<FhirAttributeTable :key="fhirAttributeTableKey" />
			<div class="row q-ma-md">
				<q-btn unelevated label="Back" color="primary" icon="chevron_left" @click="metaStep--" no-caps />
				<q-space />
				<q-btn unelevated label="Next" icon-right="chevron_right" color="primary" @click="$store.commit('incrementStep')" no-caps />
			</div>
		</div>

		<q-dialog v-model="selectDialog">
			<q-card style="width: 500px; max-width: 80vw;">
				<q-card-section class="row items-center q-pb-none text-primary">
					<div class="text-h5">Saved Configurations</div>
					<q-space />
					<q-btn icon="close" flat round dense v-close-popup />
				</q-card-section>
				<q-card-section v-if="savedConfigs && savedConfigs.length">
					<q-list bordered class="rounded-borders">
						<q-item v-for="(saved, index) of savedConfigs" class="q-ma-sm" >
							<q-item-section avatar top>
								<q-icon name="save" color="black" size="26px" class="q-mt-xs" />
							</q-item-section>
							<q-item-section top class="col-2 gt-sm">
								<q-item-label class="q-mt-sm">{{saved.name}}</q-item-label>
							</q-item-section>
							<q-item-section top >
								<q-item-label lines="1" class="text-grey-7 q-mt-sm">
									{{getISODateString(saved.date)}}
								</q-item-label>
							</q-item-section>
							<q-item-section top side>
								<div class="text-grey-8 q-gutter-xs">
									<q-btn class="gt-xs" size="11px" flat dense round icon="fas fa-sync-alt" @click="restoreSaved(index)" />
									<q-btn class="gt-xs" size="12px" color="negative" flat dense round icon="delete" @click="deleteSaved(index)" />
								</div>
							</q-item-section>
						</q-item>
					</q-list>
				</q-card-section>
				<q-card-section v-else class="text-subtitle1">
					<div class="text-grey-7">
						No saved configuration exists right now.
					</div>
				</q-card-section>
			</q-card>
		</q-dialog>

	</div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import Loading from '@/components/Loading.vue';
import {ipcRenderer} from 'electron';

@Component({
    components: {
        OnFHIRConfig: () => ({
            component: import('@/components/OnFHIRConfig.vue'),
            loading: Loading,
            delay: 0
        }),
        FhirAttributeTable: () => ({
            component: import('@/components/tables/FhirAttributeTable.vue'),
            loading: Loading,
            delay: 0
        })
    } as any
})
export default class MetadataAnalyzer extends Vue {
    private fhirAttributeTableKey: number = 0;
    private selectDialog: boolean = false;
    private savedConfigs: any = [];

    get metaStep (): number { return this.$store.getters.metaStep }
    set metaStep (value) { this.$store.commit('setMetaStep', value) }

    importSavedConfigurations (): void {
        this.$q.loading.show({spinner: undefined})
        ipcRenderer.send('browse-configurations')
        ipcRenderer.on('selected-configurations', (event, data) => {
            if (data) {
                this.$store.dispatch('fhir/importState', data).then(() => {
                    this.$notify.success('File is imported successfully')
                    this.fhirAttributeTableKey++; // in order to re-render attribute table
                });
            }
            this.$q.loading.hide()
            ipcRenderer.removeAllListeners('selected-configurations')
        })
    }

    selectSavedConfigurations (): void {
        this.savedConfigs = localStorage.getItem('store-exportableState');
        if (this.savedConfigs) {
            this.savedConfigs = JSON.parse(this.savedConfigs);
        }
        this.selectDialog = true;
    }

    getISODateString (date: string): string {
        return (new Date(date)).toUTCString()
    }

    restoreSaved (index: number) {
        const config = this.savedConfigs[index];
        this.$store.dispatch('fhir/importState', config.data).then(() => {
            this.$notify.success('Configuration is loaded successfully')
            this.fhirAttributeTableKey++; // in order to re-render attribute table
        });
    }

    deleteSaved (index: number) {
        const config = this.savedConfigs[index];
        this.$q.dialog({
            title: '<i class="fas fa-trash text-negative"> Remove Saved Configuration </i>',
            message: `Are you sure to remove ${config.name}?`,
            class: 'text-grey-9',
            cancel: true,
            html: true
        }).onOk(() => {
            this.savedConfigs.splice(index, 1);
            localStorage.setItem('store-exportableState', JSON.stringify(this.savedConfigs))
            this.$notify.info(config.name + ' is deleted')
        })
    }

}
</script>

