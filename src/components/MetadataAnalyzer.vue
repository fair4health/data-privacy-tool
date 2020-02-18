<template>
	<div>
		<q-toolbar class="bg-grey-4">
			<q-toolbar-title class="text-grey-8">
				Metadata Analyzer
			</q-toolbar-title>
			<q-space />
			<q-btn flat round
			       icon="fas fa-arrow-alt-circle-left"
			       color="secondary"
			       @click="handleSteps(false)"
			/>
			<q-btn flat round
			       icon="fas fa-arrow-alt-circle-right"
			       color="primary"
			       @click="handleSteps(true)"
			/>
		</q-toolbar>
		<div v-if="metaStep === 1" class="q-mt-xl row justify-center items-center">
			<q-card flat class="q-mt-xl" style="width: 50%">
				<q-card-section class="items-center">
					<div class="row q-col-gutter-lg">
						<div class="col-xl-12 col-lg-6 col-md-6 col-sm-6 col-12 q-col-gutter-y-md">
							<div class="row justify-start q-col-gutter-md">
								<div class="col-xl-12 col-lg-6 col-md-6 col-12">
									<q-item-label class="text-weight-bold q-mb-lg">
										<span class="text-info"><q-icon name="fas fa-info" size="xs" class="q-mr-xs" /> Provide FHIR repository URL. </span>
									</q-item-label>
									<q-input filled type="url" v-model="fhirURL" color="accent">
										<template v-slot:append>
											<q-avatar square>
												<img src="../assets/fhir-logo.png">
											</q-avatar>
										</template>
									</q-input>
								</div>
							</div>
						</div>
					</div>
				</q-card-section>
			</q-card>
		</div>

		<div v-if="metaStep === 2" class="q-ma-sm">
			<FhirProfileTable />
		</div>

		<div v-if="metaStep === 3" class="q-ma-sm">
			<FhirAttributeTable />
		</div>

	</div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import Loading from '@/components/Loading.vue';

@Component({
    components: {
        FhirProfileTable: () => ({
            component: import('@/components/tables/FhirProfileTable.vue'),
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
    private fhirURL: string = 'http://f4h.srdc.com.tr/fhir/';
    private metaStep: number = this.$store.getters.previousStep === 0 ? 1 : 3;

    handleSteps (isNext: boolean) {
        if (isNext) {
            switch (this.metaStep) {
                case 1:
                case 2:
                    this.metaStep++;
                    break;
                case 3:
                    this.$store.commit('incrementStep');
                    break;
            }
        } else {
            switch (this.metaStep) {
                case 1:
                    this.$router.push('/');
                    break;
                case 2:
                case 3:
                    this.metaStep--;
                    break;
            }
        }
    }
}
</script>

