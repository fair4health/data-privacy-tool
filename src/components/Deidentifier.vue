<template>
	<div>
		<q-toolbar class="bg-grey-4">
			<q-toolbar-title class="text-grey-8">
				De-identifier
			</q-toolbar-title>
		</q-toolbar>
		<div v-if="deidentificationService.loading" class="q-mt-xl">
			<div class="q-mt-xl q-mb-xl row justify-center">
				<div class="spinner-comp flex flex-center"></div>
			</div>
			<div class="row justify-center">
				<span class="text-weight-bold text-grey-8" style="font-size: 20px">{{deidentificationService.progressMessage}}</span>
			</div>
		</div>
		<div v-if="!deidentificationService.loading" class="q-ma-sm">
			<div class="q-mt-xl q-mb-lg row justify-center">
				<transition appear enter-active-class="animated heartBeat">
					<q-icon size="100px" class="mdi mdi-shield-check" color="primary"></q-icon>
				</transition>
			</div>
			<div class="row justify-center">
				<span class="text-weight-bold text-grey-8" style="font-size: 20px">
					{{deidentificationService.deidentifiedResourceNumber}} resources are de-identified.
				</span>
			</div>
			<div class="row q-ma-md">
				<q-btn unelevated label="Back" color="primary" icon="chevron_left" @click="$store.commit('decrementStep')" no-caps />
				<q-space />
				<q-btn unelevated label="See Risks" icon-right="mdi-chart-bar" color="primary" @click="$store.commit('incrementStep')" no-caps />
			</div>
		</div>
	</div>
</template>

<script lang="ts">
import {Component, Vue} from 'vue-property-decorator';
import {environment} from '@/common/environment';
import {DeidentificationService} from '@/common/services/deidentification.service';
import {Utils} from '@/common/utils/util';

@Component
export default class Deidentifier extends Vue {
    private willBeAnonyed: string[] = [];
    private groupedByProfiles: string[] = [];
    private deidentificationService: DeidentificationService = new DeidentificationService(this.typeMappings,
	    this.parameterMappings, this.rareValueMappings, this.kAnonymityValid, this.kValue, this.$store);

    get attributeMappings (): any { return this.$store.getters['fhir/attributeMappings'] }
    set attributeMappings (value) { this.$store.commit('fhir/setAttributeMappings', value) }

    get parameterMappings (): any { return this.$store.getters['fhir/parameterMappings'] }
    set parameterMappings (value) { this.$store.commit('fhir/setParameterMappings', value) }

    get typeMappings (): any { return this.$store.getters['fhir/typeMappings'] }
    get rareValueMappings (): any { return this.$store.getters['fhir/rareValueMappings'] }

    get selectedResources (): string[] { return this.$store.getters['fhir/selectedResources'] }
    get selectedProfiles (): string[] { return this.$store.getters['fhir/selectedProfiles'].map(r => JSON.parse(JSON.stringify(r))) }

    get kAnonymityValid (): boolean { return this.$store.getters['fhir/kAnonymityValid'] }
    set kAnonymityValid (value) { this.$store.commit('fhir/setKAnonymityValid', value) }
    get kValue (): number { return this.$store.getters['fhir/kValue'] }
    set kValue (value) { this.$store.commit('fhir/setKValue', value) }

    created () {
        Object.keys(this.attributeMappings).forEach(key => {
            const [resource, profile] = [key.split('.')[0], key.split('.')[1]];
            const [resourceIndex, profileIndex] = [this.selectedResources.indexOf(resource), this.selectedProfiles.indexOf(profile)];
            if (resourceIndex !== -1 && profileIndex !== -1 && this.attributeMappings[key] !== environment.attributeTypes.INSENSITIVE) {
                this.willBeAnonyed.push(key);
            }
        });
        if (this.willBeAnonyed.length) {
            this.groupedByProfiles = Utils.groupBy(this.willBeAnonyed, item => {
                return [item.split('.')[1]];
            });
            this.deidentifyAll();
        } else {
            this.deidentificationService.loading = false;
        }
    }

    deidentifyAll () {
        this.deidentificationService.deidentifiedResourceNumber = 0;
        const promises: Array<Promise<any>> = this.groupedByProfiles.map(attributes => {
            const resource: string = attributes[0].split('.')[0];
            const profile: string = attributes[0].split('.')[1];
            const identifiers: string[][] = [];
            const quasis: string[][] = [];
            const sensitives: string[][] = [];
            for (const key of attributes) {
                if (this.attributeMappings[key] === environment.attributeTypes.ID) {
                    identifiers.push(key.split('.').slice(2));
                } else if (this.attributeMappings[key] === environment.attributeTypes.QUASI) {
                    quasis.push(key.split('.').slice(2));
                } else if (this.attributeMappings[key] === environment.attributeTypes.SENSITIVE) {
                    sensitives.push(key.split('.').slice(2));
                }
            }
            return this.deidentificationService.deidentify(resource, profile, identifiers, quasis, sensitives);
        });
        Promise.all(promises).then(response => {
            response.forEach(type => {
                this.$store.dispatch('fhir/calculateRisks', type);
            })
        });
    }
}

</script>

<style lang="stylus">
	.spinner-comp
		opacity 1
	.spinner-comp:before
		content ''
		width 75px
		height 75px
		box-sizing border-box
		position absolute
		border-radius 50%
		border-top 5px solid #d8d8d8
		border-right 5px solid transparent
		animation spinner .6s linear infinite
	@keyframes spinner-comp
		to
			transform rotate(360deg)
</style>
