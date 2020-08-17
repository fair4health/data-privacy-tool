<template>
	<div>
		<q-toolbar class="bg-grey-4">
			<q-toolbar-title class="text-grey-8"> {{ $t('COMMON.ATTRIBUTE_SELECTOR') }} </q-toolbar-title>
			<q-btn unelevated :label="$t('BUTTONS.SELECT')" color="primary" @click="selectSavedConfigurations" icon="fas fa-archive" no-caps class="q-mr-sm" >
				<q-tooltip anchor="bottom middle" self="top middle"> {{ $t('TOOLTIPS.SELECT_SAVED_CONFIGURATION') }} </q-tooltip>
			</q-btn>
			<q-btn unelevated :label="$t('BUTTONS.IMPORT')" color="primary" @click="importSavedConfigurations" icon="fas fa-file-import" no-caps >
				<q-tooltip anchor="bottom middle" self="top middle"> {{ $t('TOOLTIPS.IMPORT_CONFIGURATION') }} </q-tooltip>
			</q-btn>
		</q-toolbar>

		<div class="q-ma-sm">
			<FhirAttributeTable :key="fhirAttributeTableKey" />
			<div class="row q-ma-md">
				<q-btn unelevated :label="$t('BUTTONS.BACK')" color="primary" icon="chevron_left" @click="previousStep" no-caps />
				<q-space />
				<q-btn unelevated :label="$t('BUTTONS.NEXT')" icon-right="chevron_right" color="primary" @click="nextStep" no-caps />
			</div>
		</div>

		<q-dialog v-model="selectDialog">
			<q-card class="saved-configs-card">
				<q-card-section class="row items-center q-pb-none text-primary">
					<div class="text-h5"> {{ $t('TITLES.SAVED_CONFIGURATIONS') }} </div>
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
						{{ $t('INFO.NO_SAVED_CONFIGURATIONS') }}
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
import {VuexStoreUtil as types} from '@/common/utils/vuex-store-util';
import { IpcChannelUtil as ipcChannels } from '@/common/utils/ipc-channel-util'
import { LocalStorageUtil as localStorageKey } from '@/common/utils/local-storage-util'

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
export default class AttributeSelector extends Vue {
    private fhirAttributeTableKey: number = 0;
    private selectDialog: boolean = false;
    private savedConfigs: any = [];

    importSavedConfigurations (): void {
        this.$q.loading.show({spinner: undefined})
        ipcRenderer.send(ipcChannels.TO_BACKGROUND, ipcChannels.File.BROWSE_CONFIGURATIONS)
        ipcRenderer.on(ipcChannels.File.SELECTED_CONFIGURATION, (event, data) => {
            if (data) {
                this.$store.dispatch(types.Fhir.IMPORT_STATE, data).then(() => {
                    this.$notify.success(String(this.$t('SUCCESS.FILE_IS_IMPORTED')))
                    this.fhirAttributeTableKey++; // in order to re-render attribute table
                }).catch(err => {
                    this.$notify.error(String(this.$t('ERROR.FILE_IS_NOT_IMPORTED')));
                });
            }
            this.$q.loading.hide()
            ipcRenderer.removeAllListeners(ipcChannels.File.SELECTED_CONFIGURATION)
        })
    }

    selectSavedConfigurations (): void {
        this.savedConfigs = localStorage.getItem(localStorageKey.EXPORTABLE_STATE);
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
        this.$store.dispatch(types.Fhir.IMPORT_STATE, config.data).then(() => {
            this.$notify.success(String(this.$t('SUCCESS.CONFIGURATION_IS_LOADED')))
            this.fhirAttributeTableKey++; // in order to re-render attribute table
        }).catch(err => {
            this.$notify.error(String(this.$t('ERROR.CONFIGURATION_NOT_LOADED')));
        });
    }

    deleteSaved (index: number) {
        const config = this.savedConfigs[index];
        const configName = config.name;
        this.$q.dialog({
            title: `<i class="fas fa-trash text-negative"> ${this.$t('TITLES.REMOVE_SAVED_CONFIGURATION')} </i>`,
            message: `${this.$t('WARNING.ARE_YOU_SURE_TO_REMOVE', {configName})}`,
            class: 'text-grey-9',
            cancel: true,
            html: true
        }).onOk(() => {
            this.savedConfigs.splice(index, 1);
            localStorage.setItem(localStorageKey.EXPORTABLE_STATE, JSON.stringify(this.savedConfigs))
            this.$notify.info(String(this.$t('INFO.CONFIG_DELETED', {configName})))
        })
    }

    nextStep () {
        this.$store.commit(types.INCREMENT_STEP)
    }

    previousStep () {
        this.$store.commit(types.DECREMENT_STEP)
    }

}
</script>

<style lang="stylus">
    .saved-configs-card {
        width: 500px
        max-width: 80vw
    }
</style>
