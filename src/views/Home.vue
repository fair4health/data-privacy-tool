<template>
	<div>
		<!--HEADER & QUICK START-->
		<div class="top-fix-column">
			<q-toolbar class="bg-grey-4">
				<q-toolbar-title class="text-grey-8">
					{{ $t('LABELS.WELCOME_TO') }} <span class="text-primary text-weight-bold">{{ $t('COMMON.APP_NAME') }}</span>
				</q-toolbar-title>
				<q-space />
				<q-btn unelevated rounded to="/deidentification" @click="resetStep" color="primary" :label="$t('BUTTONS.QUICK_START')" icon-right="fas fa-angle-right" />
			</q-toolbar>
			<q-separator />
		</div>

		<!--OVERALL STEPS-->
		<q-item class="q-pa-lg text-weight-bold text-grey-8">
			<q-item-section>
				<q-item-label class="text-h4 text-weight-bold">{{ $t('LABELS.OVERALL_STEPS') }}</q-item-label>
				<q-stepper flat v-model="step" ref="stepper" alternative-labels color="primary" class="bg-grey-3">
					<q-step :name="1" :title="$t('COMMON.ONFHIR_VERIFIER')" icon="fas fa-fire" color="primary"></q-step>
					<q-step :name="2" :title="$t('COMMON.ATTRIBUTE_SELECTOR')" icon="fas fa-database" color="primary"></q-step>
					<q-step :name="3" :title="$t('COMMON.CONFIGURATION_MANAGER')" icon="fas fa-sliders-h" color="primary"></q-step>
					<q-step :name="4" :title="$t('COMMON.DEIDENTIFIER')" icon="fas fa-user-secret" color="primary"></q-step>
				</q-stepper>
			</q-item-section>
		</q-item>

		<!--OnFHIR Verifier-->
		<q-item class="q-pa-lg text-grey-8">
			<q-item-section>
				<q-item-label class="text-h7 text-weight-bold">
					<q-icon class=" q-mr-xs" size="xs" name="fas fa-fire" /> {{ $t('COMMON.ONFHIR_VERIFIER') }}
				</q-item-label>
				<q-card flat class="q-ma-md">
					<q-card-section>
						{{ $t('INFO.ONFHIR_VERIFIER_HOME_INFO') }}
					</q-card-section>
				</q-card>
			</q-item-section>
		</q-item>

		<!--Attribute Selector-->
		<q-item class="q-pa-lg text-grey-8">
			<q-item-section>
				<q-item-label class="text-h7 text-weight-bold">
					<q-icon class=" q-mr-xs" size="xs" name="fas fa-database" /> {{ $t('COMMON.ATTRIBUTE_SELECTOR') }}
				</q-item-label>
				<q-card flat class="q-ma-md">
					<q-card-section>
						{{ $t('INFO.ATTRIBUTE_SELECTOR_HOME_INFO') }}
					</q-card-section>
				</q-card>
			</q-item-section>
		</q-item>

		<!--Configuration Manager-->
		<q-item class="q-pa-lg text-grey-8">
			<q-item-section>
				<q-item-label class="text-h7 text-weight-bold">
					<q-icon class=" q-mr-xs" size="xs" name="fas fa-sliders-h" /> {{ $t('COMMON.CONFIGURATION_MANAGER') }}
				</q-item-label>
				<q-card flat class="q-ma-md">
					<q-card-section>
						{{ $t('INFO.CONFIGURATION_MANAGER_HOME_INFO') }}
					</q-card-section>
				</q-card>
			</q-item-section>
		</q-item>

		<!--De-identifier-->
		<q-item class="q-pa-lg text-grey-8">
			<q-item-section>
				<q-item-label class="text-h7 text-weight-bold">
					<q-icon class=" q-mr-xs" size="xs" name="fas fa-user-secret" /> {{ $t('COMMON.DEIDENTIFIER') }}
				</q-item-label>
				<q-card flat class="q-ma-md">
					<q-card-section>
						<q-item-label class="q-mb-md">
							{{ $t('INFO.DEIDENTIFIER_HOME_INFO_1') }}
						</q-item-label>
						<q-item-label class="q-mb-md">
							{{ $t('INFO.DEIDENTIFIER_HOME_INFO_2') }}
						</q-item-label>
						<q-item-label>
							{{ $t('INFO.DEIDENTIFIER_HOME_INFO_3') }}
						</q-item-label>
					</q-card-section>
				</q-card>
			</q-item-section>
		</q-item>

	</div>
</template>

<script lang="ts">
import {Component, Vue} from 'vue-property-decorator'
import {VuexStoreUtil as types} from '@/common/utils/vuex-store-util';

@Component
export default class Home extends Vue {
    private step: number = 0;

    resetStep () {
        this.$store.commit(types.RESET_STEP)
    }

}

</script>

<style lang="stylus">
	.top-fix-column
		position sticky
		top 0
		z-index 1
</style>
