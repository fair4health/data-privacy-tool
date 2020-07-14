<template>
	<div>

		<!--The first step - Verification of onFHIR-->
		<template v-if="step === 1">
			<OnFHIRVerifier />
		</template>

		<!--The second step - Selection of Attributes-->
		<template v-if="step === 2">
			<AttributeSelector />
		</template>

		<!--The third step - Configuration of Parameters-->
		<template v-if="step === 3">
			<ConfigurationManager />
		</template>

		<!--The last step - Deidentifying and Evaluation of Results-->
		<template v-if="step === 4">
			<Deidentifier />
		</template>

	</div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import Loading from '@/components/Loading.vue'
import { VuexStoreUtil as types } from '@/common/utils/vuex-store-util'

@Component({
    components: {
        OnFHIRVerifier: () => ({
            component: import('@/components/OnFHIRVerifier.vue'),
            loading: Loading,
            delay: 0
        }),
        AttributeSelector: () => ({
            component: import('@/components/AttributeSelector.vue'),
            loading: Loading,
            delay: 0
        }),
        ConfigurationManager: () => ({
            component: import('@/components/ConfigurationManager.vue'),
            loading: Loading,
            delay: 0
        }),
        Deidentifier: () => ({
            component: import('@/components/Deidentifier.vue'),
            loading: Loading,
            delay: 0
        })
    } as any
})
export default class Stepper extends Vue {
    get step (): number { return this.$store.getters[types.PRIVACY_STEP] }
}
</script>
