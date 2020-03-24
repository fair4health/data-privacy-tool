<template>
	<div>
		<q-toolbar class="bg-grey-4">
			<q-toolbar-title class="text-grey-8">
				Metadata Analyzer
			</q-toolbar-title>
		</q-toolbar>

		<div v-if="metaStep === 1" class="q-mt-xl">
			<div class="row justify-center">
				<q-card flat class="col-6">
					<q-card-section>
						<q-item-label class="text-weight-bold q-mb-lg">
							<span class="text-info"><q-icon name="fas fa-info" size="xs" class="q-mr-xs" /> Provide FHIR repository URL. </span>
						</q-item-label>
						<q-input filled type="url" v-model="onfhirBaseUrl" color="accent">
							<template v-slot:append>
								<q-avatar square>
									<img src="../assets/fhir-logo.png">
								</q-avatar>
							</template>
						</q-input>
					</q-card-section>

					<q-card-section class="row">
						<q-btn unelevated label="Back" color="primary" icon="chevron_left" @click="$router.push('/')" no-caps />
						<q-space />
						<div class="q-gutter-sm">
							<q-btn unelevated label="Verify" icon="verified_user" color="blue-1" text-color="primary"
							       :disable="!onfhirBaseUrl" @click="validateFhir" no-caps>
					            <span class="q-ml-sm">
					              <q-spinner class="q-ml-sm" size="xs" v-show="verificationStatus==='waiting'" />
					              <q-icon name="check" size="xs" color="green" v-show="verificationStatus==='done'" />
					              <q-icon name="error_outline" size="xs" color="red" v-show="verificationStatus==='error'" />
					            </span>
							</q-btn>
							<q-btn unelevated label="Next" icon-right="chevron_right" color="primary" @click="metaStep++"
							       :disable="verificationStatus!=='done'" no-caps />
						</div>
					</q-card-section>
				</q-card>
			</div>
		</div>

		<div v-if="metaStep === 2" class="q-ma-sm">
			<FhirAttributeTable />
			<div class="row q-ma-md">
				<q-btn unelevated label="Back" color="primary" icon="chevron_left" @click="metaStep--" no-caps />
				<q-space />
				<q-btn unelevated label="Next" icon-right="chevron_right" color="primary" @click="$store.commit('incrementStep')" no-caps />
			</div>
		</div>

	</div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import Loading from '@/components/Loading.vue';

@Component({
    components: {
        FhirAttributeTable: () => ({
            component: import('@/components/tables/FhirAttributeTable.vue'),
            loading: Loading,
            delay: 0
        })
    } as any
})
export default class MetadataAnalyzer extends Vue {
    private onfhirBaseUrl: string = '';
    private metaStep: number = this.$store.getters.previousStep === 0 ? 1 : 2;
    private verificationStatus: string = '';

    mounted () {
        const url = localStorage.getItem('f4h-onfhirBaseUrl');
        if (url) {
            this.onfhirBaseUrl = url
        }
    }

    validateFhir () {
        if (this.onfhirBaseUrl) {
            this.verificationStatus = 'waiting';
            this.$store.commit('fhir/updateFhirBase', this.onfhirBaseUrl);
            localStorage.setItem('f4h-onfhirBaseUrl', this.onfhirBaseUrl);
            this.$store.dispatch('fhir/searchResource', 'Patient')
                .then(_ => this.verificationStatus = 'done')
                .catch(_ => this.verificationStatus = 'error')
        }
    }
}
</script>

