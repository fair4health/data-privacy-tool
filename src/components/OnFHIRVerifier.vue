<template>
	<div class="q-py-xl">
		<div class="row justify-center q-mx-lg">
			<OnFHIRConfig />
		</div>
	</div>
</template>

<script lang="ts">
import {Component, Vue} from 'vue-property-decorator';
import Loading from '@/components/Loading.vue';

@Component({
    components: {
        OnFHIRConfig: () => ({
            component: import('@/components/OnFHIRConfig.vue'),
            loading: Loading,
            delay: 0
        })
    } as any
})
export default class OnFHIRVerifier extends Vue {

}
</script>

