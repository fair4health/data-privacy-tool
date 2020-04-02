<template>
	<div>
		<q-toolbar class="bg-grey-4">
			<q-toolbar-title class="text-grey-8">
				Metadata Analyzer
			</q-toolbar-title>
		</q-toolbar>

		<div v-if="metaStep === 1" class="q-mt-xl">
			<OnFHIRConfig />
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
    get metaStep (): number { return this.$store.getters.metaStep }
    set metaStep (value) { this.$store.commit('setMetaStep', value) }
}
</script>

