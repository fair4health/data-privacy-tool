import {ipcRenderer} from "electron"
<template>
	<q-card flat class="col-xs-12 col-sm-12 col-md-6">
		<q-card-section>
			<q-item-label class="text-weight-bold q-mb-lg">
				<span class="text-primary"><q-icon name="fas fa-info" size="xs" class="q-mr-xs" />
					<template v-if="isSource"> {{ $t('LABELS.PROVIDE_FHIR_URL_TO_DEIDENTIFY') }} </template>
					<template v-else> {{ $t('LABELS.PROVIDE_FHIR_URL_TO_SAVE') }} </template>
				</span>
			</q-item-label>
			<q-input outlined square dense type="url" class="col-10" v-model="onfhirUrl" color="primary"
			         @input="changeVerificationStatus(Status.PENDING)"
			         :placeholder="$t('LABELS.FHIR_REPOSITORY_URL')"
			         :disable="(isSource && isInProgress(fhirSourceVerificationStatus)) || (!isSource && isInProgress(fhirTargetVerificationStatus))"
			         @keypress.enter="verifyFhir">
				<template v-slot:prepend>
					<q-avatar>
						<img src="../assets/fhir-logo.png" />
					</q-avatar>
				</template>
			</q-input>
			<q-item-label class="text-weight-regular bg-red-1 q-mt-md q-pa-md" v-if="isSource && isError(fhirSourceVerificationStatus) && fhirSourceVerificationStatusDetail">
				<span class="text-red"><q-icon name="error" size="xs" class="q-mr-xs" /> {{ fhirSourceVerificationStatusDetail }} </span>
			</q-item-label>
			<q-item-label class="text-weight-regular bg-red-1 q-mt-md q-pa-md" v-if="!isSource && isError(fhirTargetVerificationStatus) && fhirTargetVerificationStatusDetail">
				<span class="text-red"><q-icon name="error" size="xs" class="q-mr-xs" /> {{ fhirTargetVerificationStatusDetail }} </span>
			</q-item-label>
			<q-item-label class="text-weight-regular bg-green-1 q-mt-md q-pa-md" v-if="isSource && isSuccess(fhirSourceVerificationStatus) && fhirSourceVerificationStatusDetail">
				<span class="text-green-8"><q-icon name="check" size="xs" class="q-mr-xs" /> {{ fhirSourceVerificationStatusDetail }} </span>
			</q-item-label>
			<q-item-label class="text-weight-regular bg-green-1 q-mt-md q-pa-md" v-if="!isSource && isSuccess(fhirTargetVerificationStatus) && fhirTargetVerificationStatusDetail">
				<span class="text-green-8"><q-icon name="check" size="xs" class="q-mr-xs" /> {{ fhirTargetVerificationStatusDetail }} </span>
			</q-item-label>
		</q-card-section>

		<q-card-section v-if="isSource" class="row">
			<q-btn unelevated :label="$t('BUTTONS.BACK')" color="primary" icon="chevron_left" @click="$router.push('/')" no-caps />
			<q-space />
			<div class="q-gutter-sm">
				<q-btn unelevated :label="$t('BUTTONS.VERIFY')" icon="verified_user" color="grey-2" text-color="primary"
				       :disable="!onfhirUrl" @click="verifyFhir" no-caps>
					<span class="q-ml-sm">
						<q-spinner class="q-ml-sm" size="xs" v-show="isInProgress(fhirSourceVerificationStatus)" />
						<q-icon name="check" size="xs" color="green" v-show="isSuccess(fhirSourceVerificationStatus)" />
						<q-icon name="error_outline" size="xs" color="red" v-show="isError(fhirSourceVerificationStatus)" />
					</span>
				</q-btn>
				<q-btn unelevated :label="$t('BUTTONS.NEXT')" icon-right="chevron_right" color="primary" :disable="!isSuccess(fhirSourceVerificationStatus)"
				       @click="nextStep" no-caps />
			</div>
		</q-card-section>
		<q-card-section v-else class="row">
			<q-space />
			<div class="q-gutter-sm">
				<q-btn unelevated :label="$t('BUTTONS.VERIFY')" icon="verified_user" color="grey-2" text-color="primary"
				       :disable="!onfhirUrl" @click="verifyFhir" no-caps>
					<span class="q-ml-sm">
						<q-spinner class="q-ml-sm" size="xs" v-show="isInProgress(fhirTargetVerificationStatus)" />
						<q-icon name="check" size="xs" color="green" v-show="isSuccess(fhirTargetVerificationStatus)" />
						<q-icon name="error_outline" size="xs" color="red" v-show="isError(fhirTargetVerificationStatus)" />
					</span>
				</q-btn>
				<q-btn unelevated :label="$t('BUTTONS.SAVE')" icon-right="save" color="primary" :disable="!isSuccess(fhirTargetVerificationStatus)"
				       @click="saveToRepositoryParentFunction(false)" no-caps v-close-popup />
			</div>
		</q-card-section>
	</q-card>
</template>

<script lang="ts">
import {Component, Prop, Mixins} from 'vue-property-decorator'
import { VuexStoreUtil as types } from '@/common/utils/vuex-store-util'
import Status from '@/common/Status'
import StatusMixin from '@/common/mixins/statusMixin';
import { LocalStorageUtil as localStorageKey } from '@/common/utils/local-storage-util'
import { IpcChannelUtil as ipcChannels } from '@/common/utils/ipc-channel-util'
import {ipcRenderer} from 'electron'

@Component
export default class OnFHIRConfig extends Mixins(StatusMixin) {
    @Prop() readonly saveToRepositoryParentFunction;

    private Status = Status;
    private onfhirUrl: string | null = '';
    private isSource: boolean = true;

    get fhirSourceVerificationStatus (): status { return this.$store.getters[types.Fhir.FHIR_SOURCE_VERIFICATION_STATUS] }
    set fhirSourceVerificationStatus (value) { this.$store.commit(types.Fhir.SET_FHIR_SOURCE_VERIFICATION_STATUS, value) }

    get fhirTargetVerificationStatus (): status { return this.$store.getters[types.Fhir.FHIR_TARGET_VERIFICATION_STATUS] }
    set fhirTargetVerificationStatus (value) { this.$store.commit(types.Fhir.SET_FHIR_TARGET_VERIFICATION_STATUS, value) }

    get fhirSourceVerificationStatusDetail (): string { return this.$store.getters[types.Fhir.FHIR_SOURCE_VERIFICATION_STATUS_DETAIL] }
    set fhirSourceVerificationStatusDetail (value) { this.$store.commit(types.Fhir.SET_FHIR_SOURCE_VERIFICATION_STATUS_DETAIL, value) }

    get fhirTargetVerificationStatusDetail (): string { return this.$store.getters[types.Fhir.FHIR_TARGET_VERIFICATION_STATUS_DETAIL] }
    set fhirTargetVerificationStatusDetail (value) { this.$store.commit(types.Fhir.SET_FHIR_TARGET_VERIFICATION_STATUS_DETAIL, value) }

    mounted () {
        this.isSource = this.$parent.$options['_componentTag'] === 'OnFHIRVerifier';
        this.onfhirUrl = this.isSource ? localStorage.getItem(localStorageKey.FHIR_SOURCE_URL) : localStorage.getItem(localStorageKey.FHIR_TARGET_URL);
    }

    verifyFhir () {
        if (this.onfhirUrl) {
            this.changeVerificationStatus(Status.IN_PROGRESS);
            let cleanedUrl = this.onfhirUrl;
            if (cleanedUrl.slice(-1) === '/') {
                cleanedUrl = cleanedUrl.slice(0, -1)
            }
            let httpPrepended = false;
            if (cleanedUrl.substr(0, 4).toLowerCase() !== 'http') {
                cleanedUrl = 'http://' + cleanedUrl;
                httpPrepended = true;
            }
            this.$store.dispatch(types.Fhir.VERIFY_FHIR, {isSource: this.isSource, url: cleanedUrl})
                .then(() => {
                    this.changeVerificationStatus(Status.SUCCESS);
                    this.updateFhirBaseProfile(cleanedUrl);
                })
                .catch(err => {
                    if (httpPrepended) {
                        // if 'http://' failed, try 'https://'
                        cleanedUrl = 'https://' + cleanedUrl.substr(7);
                        this.$store.dispatch(types.Fhir.VERIFY_FHIR, {isSource: this.isSource, url: cleanedUrl})
                            .then(() => {
                                this.changeVerificationStatus(Status.SUCCESS);
                                this.updateFhirBaseProfile(cleanedUrl);
                            })
                            .catch(err2 => {
                                this.changeVerificationStatus(Status.ERROR, err2);
                            })
                    } else {
                        this.changeVerificationStatus(Status.ERROR, err);
                    }
                })
        }
    }

    updateFhirBaseProfile (url: string) {
        if (this.isSource) {
            ipcRenderer.send(ipcChannels.TO_ALL_BACKGROUND, ipcChannels.Fhir.SET_SOURCE_FHIR_BASE, url);
        } else {
            ipcRenderer.send(ipcChannels.TO_ALL_BACKGROUND, ipcChannels.Fhir.SET_TARGET_FHIR_BASE, url);
        }
    }

    changeVerificationStatus (status: status, error?) {
        if (this.isSource) {
            this.fhirSourceVerificationStatus = status;
            if (status === Status.SUCCESS) {
                this.fhirSourceVerificationStatusDetail = String(this.$t('SUCCESS.FHIR_URL_VERIFIED'));
            } else if (error) {
                this.fhirSourceVerificationStatusDetail = error;
            }
        } else {
            this.fhirTargetVerificationStatus = status;
            if (status === Status.SUCCESS) {
                this.fhirTargetVerificationStatusDetail = String(this.$t('SUCCESS.FHIR_URL_VERIFIED'));
            } else if (error) {
                this.fhirTargetVerificationStatusDetail = error;
            }
        }
    }

    nextStep () {
        this.$store.commit(types.INCREMENT_STEP)
    }

}
</script>
