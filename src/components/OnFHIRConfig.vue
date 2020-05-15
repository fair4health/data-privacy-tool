<template>
	<q-card flat class="col-6">
		<q-card-section>
			<q-item-label class="text-weight-bold q-mb-lg q-mt-sm">
				<span class="text-info"><q-icon name="fas fa-info" size="xs" class="q-mr-xs" />
					<template v-if="isSource"> Provide FHIR Repository URL that will be de-identified </template>
					<template v-else> Provide FHIR Repository URL to save de-identified resources </template>
				</span>
			</q-item-label>
			<q-input filled type="url" class="col-10" v-model="onfhirUrl" color="accent"
			         @keydown="changeVerificationStatus('pending')"
			         placeholder="FHIR Repository URL"
			         :disable="(isSource && fhirSourceVerificationStatus === 'in-progress') || (!isSource && fhirTargetVerificationStatus === 'in-progress')"
			         @keypress.enter="verifyFhir">
				<template v-slot:prepend>
					<q-avatar>
						<img src="../assets/fhir-logo.png" />
					</q-avatar>
				</template>
			</q-input>
			<q-item-label class="text-weight-regular bg-red-1 q-mt-md q-pa-md" v-if="statusDetail &&
				((isSource && fhirSourceVerificationStatus === 'error') || (!isSource && fhirTargetVerificationStatus === 'error'))">
				<span class="text-red"><q-icon name="error" size="xs" class="q-mr-xs" /> {{ statusDetail }} </span>
			</q-item-label>
			<q-item-label class="text-weight-regular bg-green-1 q-mt-md q-pa-md" v-if="statusDetail &&
				((isSource && fhirSourceVerificationStatus === 'success') || (!isSource && fhirTargetVerificationStatus === 'success'))">
				<span class="text-green-8"><q-icon name="check" size="xs" class="q-mr-xs" /> {{ statusDetail }} </span>
			</q-item-label>
		</q-card-section>

		<q-card-section v-if="isSource" class="row">
			<q-btn unelevated label="Back" color="primary" icon="chevron_left" @click="$router.push('/')" no-caps />
			<q-space />
			<div class="q-gutter-sm">
				<q-btn unelevated label="Verify" icon="verified_user" color="grey-2" text-color="primary"
				       :disable="!onfhirUrl" @click="verifyFhir" no-caps>
					<span class="q-ml-sm">
						<q-spinner class="q-ml-sm" size="xs" v-show="fhirSourceVerificationStatus==='in-progress'" />
						<q-icon name="check" size="xs" color="green" v-show="fhirSourceVerificationStatus==='success'" />
						<q-icon name="error_outline" size="xs" color="red" v-show="fhirSourceVerificationStatus==='error'" />
					</span>
				</q-btn>
				<q-btn unelevated label="Next" icon-right="chevron_right" color="primary" :disable="fhirSourceVerificationStatus!=='success'"
				       @click="metaStep++" no-caps />
			</div>
		</q-card-section>
		<q-card-section v-else class="row">
			<q-space />
			<div class="q-gutter-sm">
				<q-btn unelevated label="Verify" icon="verified_user" color="grey-2" text-color="primary"
				       :disable="!onfhirUrl" @click="verifyFhir" no-caps>
					<span class="q-ml-sm">
						<q-spinner class="q-ml-sm" size="xs" v-show="fhirTargetVerificationStatus==='in-progress'" />
						<q-icon name="check" size="xs" color="green" v-show="fhirTargetVerificationStatus==='success'" />
						<q-icon name="error_outline" size="xs" color="red" v-show="fhirTargetVerificationStatus==='error'" />
					</span>
				</q-btn>
				<q-btn unelevated label="Save" icon-right="save" color="primary" :disable="fhirTargetVerificationStatus!=='success'"
				       @click="saveToRepositoryParentFunction(false)" no-caps v-close-popup />
			</div>
		</q-card-section>
	</q-card>
</template>

<script lang="ts">
    import {Component, Prop, Vue} from 'vue-property-decorator'

    @Component
    export default class OnFHIRConfig extends Vue {
        @Prop() readonly saveToRepositoryParentFunction;

        private onfhirUrl: string | null = '';
        private statusDetail: string = '';
        private isSource: boolean = true;

        get fhirSourceVerificationStatus (): status { return this.$store.getters['fhir/fhirSourceVerificationStatus'] }
        set fhirSourceVerificationStatus (value) { this.$store.commit('fhir/setFhirSourceVerificationStatus', value) }

        get fhirTargetVerificationStatus (): status { return this.$store.getters['fhir/fhirTargetVerificationStatus'] }
        set fhirTargetVerificationStatus (value) { this.$store.commit('fhir/setFhirTargetVerificationStatus', value) }

        get metaStep (): number { return this.$store.getters.metaStep }
        set metaStep (value) { this.$store.commit('setMetaStep', value) }

        mounted () {
            this.isSource = this.$parent.$options['_componentTag'] === 'MetadataAnalyzer';
			this.onfhirUrl = this.isSource ? localStorage.getItem('fhirSourceUrl') : localStorage.getItem('fhirTargetUrl');
        }

        verifyFhir () {
			if (this.onfhirUrl) {
			    if (this.isSource) {
                    this.$store.commit('fhir/updateFhirSourceBase', this.onfhirUrl);
                } else {
                    this.$store.commit('fhir/updateFhirTargetBase', this.onfhirUrl);
			    }
                this.changeVerificationStatus('in-progress');
                this.$store.dispatch('fhir/verifyFhir', this.isSource)
                    .then(() => {
                        this.statusDetail = 'FHIR Repository URL is verified.';
                        this.changeVerificationStatus('success');
                    })
                    .catch(err => {
                        this.statusDetail = err;
                        this.changeVerificationStatus('error');
                    })
			}
        }

        changeVerificationStatus (status: status) {
            if (this.isSource) {
                this.fhirSourceVerificationStatus = status;
            } else {
                this.fhirTargetVerificationStatus = status;
            }
        }

    }
</script>
