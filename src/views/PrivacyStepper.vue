<template>
	<div>

		<!--The first step - Metadata Analyzing-->
		<template v-if="step === 1">
			<MetadataAnalyzer />
		</template>

		<!--The second step - Configuration of Parameters-->
		<template v-if="step === 2">
			<ConfigurationManager />
		</template>

		<!--The third step - Transforming-->
		<template v-if="step === 3">
			<Deidentifier />
		</template>

		<!--The last step - Evaluation of Results-->
		<template v-if="step === 4">
			<Evaluator />
		</template>

	</div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import Loading from '@/components/Loading.vue'

@Component({
    components: {
        MetadataAnalyzer: () => ({
            component: import('@/components/MetadataAnalyzer.vue'),
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
        }),
        Evaluator: () => ({
            component: import('@/components/Evaluator.vue'),
            loading: Loading,
            delay: 0
        })
    } as any
})
export default class Stepper extends Vue {
    get step (): number { return this.$store.getters.privacyStep }
}
</script>
