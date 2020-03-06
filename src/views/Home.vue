<template>
	<div>
		<!--HEADER & QUICK START-->
		<div class="top-fix-column">
			<q-toolbar class="bg-grey-4">
				<q-toolbar-title class="text-grey-8">
					Welcome to <span class="text-primary text-weight-bold">FAIR4Health Data Privacy Tool</span>
				</q-toolbar-title>
				<q-space />
				<q-btn unelevated rounded to="/deidentification" @click="$store.commit('resetStep')" color="primary" label="Quick Start" icon-right="fas fa-angle-right" />
			</q-toolbar>
			<q-separator />
		</div>

		<!--OVERALL STEPS-->
		<q-item class="q-pa-lg text-weight-bold text-grey-8">
			<q-item-section>
				<q-item-label class="text-h4 text-weight-bold">Overall Steps</q-item-label>
				<q-stepper flat v-model="step" ref="stepper" alternative-labels color="primary" class="bg-grey-3">
					<q-step :name="1" title="Metadata Analyzer" icon="fas fa-database" color="secondary"></q-step>
					<q-step :name="2" title="Configuration Manager" icon="fas fa-sliders-h" color="secondary"></q-step>
					<q-step :name="3" title="De-identifier" icon="fas fa-user-secret" color="secondary"></q-step>
					<q-step :name="4" title="Evaluator" icon="fas fa-balance-scale" color="secondary"></q-step>
				</q-stepper>
			</q-item-section>
		</q-item>

		<!--Metadata Analyzer-->
		<q-item class="q-pa-lg text-grey-8">
			<q-item-section>
				<q-item-label class="text-h7 text-weight-bold">
					<q-icon class=" q-mr-xs" size="xs" name="fas fa-database" /> Metadata Analyzer
				</q-item-label>
				<q-card flat class="q-ma-md">
					<q-card-section>
						Metadata of FHIR resources coming from Data Curation and Validation step are analyzed.
					</q-card-section>
				</q-card>
			</q-item-section>
		</q-item>

		<!--Configuration Manager-->
		<q-item class="q-pa-lg text-grey-8">
			<q-item-section>
				<q-item-label class="text-h7 text-weight-bold">
					<q-icon class=" q-mr-xs" size="xs" name="fas fa-sliders-h" /> Configuration Manager
				</q-item-label>
				<q-card flat class="q-ma-md">
					<q-card-section>
						Attributes of FHIR resources are categorized in a privacy point of view. Afterwards de-identification
						algorithms and are configured accordingly.
					</q-card-section>
				</q-card>
			</q-item-section>
		</q-item>

		<!--De-identifier-->
		<q-item class="q-pa-lg text-grey-8">
			<q-item-section>
				<q-item-label class="text-h7 text-weight-bold">
					<q-icon class=" q-mr-xs" size="xs" name="fas fa-user-secret" /> De-identifier
				</q-item-label>
				<q-card flat class="q-ma-md">
					<q-card-section>
						Resources are de-identified according to configurations. New de-identified FHIR resources are
						versioned and labeled accordingly and then saved back to the FHIR Repository.
					</q-card-section>
				</q-card>
			</q-item-section>
		</q-item>

		<!--Evaluator-->
		<q-item class="q-pa-lg text-grey-8">
			<q-item-section>
				<q-item-label class="text-h7 text-weight-bold">
					<q-icon class=" q-mr-xs" size="xs" name="fas fa-balance-scale" /> Evaluator
				</q-item-label>
				<q-card flat class="q-ma-md">
					<q-card-section>
						Different types of re-identification risks are calculated.
					</q-card-section>
				</q-card>
			</q-item-section>
		</q-item>

	</div>
</template>

<script lang="ts">
import {Component, Vue} from 'vue-property-decorator'

@Component
export default class Home extends Vue {
    private step: number = 0;
}

</script>

<style lang="stylus">
	.top-fix-column
		position sticky
		top 0
		z-index 1
</style>
