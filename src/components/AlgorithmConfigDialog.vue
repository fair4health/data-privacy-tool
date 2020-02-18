<template>
	<q-card style="width: 700px; max-width: 80vw;">
		<q-card-section class="row items-center q-pb-none">
			<div class="text-h6">Algorithm Configuration</div>
			<q-space />
			<q-btn icon="close" flat round dense v-close-popup />
		</q-card-section>
		<q-card-section class="q-pt-sm q-pb-none">
			<q-breadcrumbs class="text-accent">
				<template v-slot:separator>
					<q-icon size="1.5em" name="chevron_right" color="primary" />
				</template>
				<template v-for="(key, index) in generateBreadcrumb(currentAttribute)">
					<q-breadcrumbs-el v-if="index === 0" :label="key" icon="account_tree" />
					<q-breadcrumbs-el v-else :label="key" />
				</template>
			</q-breadcrumbs>
		</q-card-section>
		<q-card-section>
			<q-select v-if="parameterMappings[currentAttribute]" outlined dense v-model="tempAlgorithmName"
			          :options="algorithms" :option-disable="opt => filterPossibleAlgorithms(opt)" @input="updateParameters()" >
				<template v-slot:option="scope">
					<q-item v-bind="scope.itemProps" v-on="scope.itemEvents">
						<q-item-section avatar>
							<q-icon name="fas fa-code" size="xs" />
						</q-item-section>
						<q-item-section>
							<q-item-label v-html="scope.opt" />
						</q-item-section>
					</q-item>
				</template>
			</q-select>
		</q-card-section>

		<q-card-section v-if="getAlgorithmName(currentAttribute) === envAlgorithms.SUBSTITUTION.name" class="q-pt-none">
			<div class="row">
				<div class="col-4">
					<q-radio v-model="tempLengthPreserved" :val="true" label="Original Length" @input="onLengthPreservedSelected" />
				</div>
				<div class="col-3">
					<q-radio v-model="tempLengthPreserved" :val="false" label="Fixed Length" @input="onLengthPreservedSelected" />
				</div>
				<div class="col-2">
					<q-input v-if="parameterMappings[currentAttribute].name !== envAlgorithms.SENSITIVE.name" v-model="parameterMappings[currentAttribute].fixedLength" type="number" dense outlined />
					<q-input v-else v-model="parameterMappings[currentAttribute].algorithm.fixedLength" type="number" dense outlined />
				</div>
			</div>
		</q-card-section>

		<q-card-section v-if="getAlgorithmName(currentAttribute) === envAlgorithms.SUBSTITUTION.name" class="q-pt-none">
			<div class="row">
				<div class="col-3">
					<q-field borderless label="Substitution Character:" readonly dense label-color="black" />
				</div>
				<div class="col-1">
					<q-input v-model="parameterMappings[currentAttribute].name !== envAlgorithms.SENSITIVE.name ?
					parameterMappings[currentAttribute].substitutionChar : parameterMappings[currentAttribute].algorithm.substitutionChar" type="text" dense outlined maxlength="1" />
				</div>
			</div>
		</q-card-section>

		<q-card-section v-if="getAlgorithmName(currentAttribute) === envAlgorithms.RECOVERABLE_SUBSTITUTION.name">
			TODO
		</q-card-section>

		<q-card-section v-if="getAlgorithmName(currentAttribute) === envAlgorithms.FUZZING.name">
			TODO
		</q-card-section>

		<q-card-section v-if="getAlgorithmName(currentAttribute) === envAlgorithms.GENERALIZATION.name">
			TODO
		</q-card-section>

		<q-card-section v-if="getAlgorithmName(currentAttribute) === envAlgorithms.DATE_SHIFTING.name">
			<div class="row">
				<div class="col-2">
					<q-field borderless label="Shift within:" readonly dense label-color="black" />
				</div>
				<div class="col-2">
					<q-input v-model="parameterMappings[currentAttribute].name !== envAlgorithms.SENSITIVE.name ?
					parameterMappings[currentAttribute].range : parameterMappings[currentAttribute].algorithm.range" type="number" dense outlined />
				</div>
				<div class="col-2">
					<q-select outlined dense v-model="parameterMappings[currentAttribute].name !== envAlgorithms.SENSITIVE.name ?
					parameterMappings[currentAttribute].unit : parameterMappings[currentAttribute].algorithm.unit" :options="dateUnitOptions" @input="$forceUpdate()" />
				</div>
			</div>
		</q-card-section>

		<q-card-actions align="right" class="q-pr-lg q-pb-lg">
			<q-btn unelevated
			       color="primary"
			       text-color="white"
			       icon="fas fa-check"
			       v-close-popup />
		</q-card-actions>
	</q-card>
</template>

<script lang="ts">
import {Component, Vue} from 'vue-property-decorator'
import {environment} from '@/common/environment'

@Component
export default class AlgorithmConfigDialog extends Vue {
    private tempLengthPreserved: boolean = true;
    private tempAlgorithmName: string = '';
    private envAlgorithms = environment.algorithms;
    private algorithms = Object.keys(environment.algorithms).filter(key => key !== 'SENSITIVE').map(key => environment.algorithms[key].name);
    private dateUnitOptions: string[] = ['Years', 'Months', 'Days'];

    get currentAttribute (): string { return this.$store.getters['fhir/currentAttribute'] }
    set currentAttribute (value) { this.$store.commit('fhir/setCurrentAttribute', value) }

    get currentNode (): any { return this.$store.getters['fhir/currentNode'] }
    set currentNode (value) { this.$store.commit('fhir/setCurrentNode', value) }

    get attributeMappings (): any { return this.$store.getters['fhir/attributeMappings'] }
    set attributeMappings (value) { this.$store.commit('fhir/setAttributeMappings', value) }

    get parameterMappings (): any { return this.$store.getters['fhir/parameterMappings'] }
    set parameterMappings (value) { this.$store.commit('fhir/setParameterMappings', value) }

    created () {
        if (this.parameterMappings[this.currentAttribute].name === environment.algorithms.SENSITIVE.name) {
            this.tempLengthPreserved = this.parameterMappings[this.currentAttribute].algorithm.lengthPreserved;
            this.tempAlgorithmName = this.parameterMappings[this.currentAttribute].algorithm.name;
        } else {
            this.tempLengthPreserved = this.parameterMappings[this.currentAttribute].lengthPreserved;
            this.tempAlgorithmName = this.parameterMappings[this.currentAttribute].name;
        }
    }

    generateBreadcrumb (attribute: string): string[] {
        return attribute.split('.');
    }

    onLengthPreservedSelected () {
        if (this.parameterMappings[this.currentAttribute].name === environment.algorithms.SENSITIVE.name) {
            this.parameterMappings[this.currentAttribute].algorithm.lengthPreserved = this.tempLengthPreserved;
        } else {
            this.parameterMappings[this.currentAttribute].lengthPreserved = this.tempLengthPreserved;
        }
    }

    updateParameters () {
        const algorithm: any = Object.keys(environment.algorithms).find(key => environment.algorithms[key].name === this.tempAlgorithmName);
        if (this.parameterMappings[this.currentAttribute].name === environment.algorithms.SENSITIVE.name) {
            this.parameterMappings[this.currentAttribute].algorithm = JSON.parse(JSON.stringify(environment.algorithms[algorithm]));
            this.tempLengthPreserved = this.parameterMappings[this.currentAttribute].algorithm.lengthPreserved;
        } else {
            this.parameterMappings[this.currentAttribute] = JSON.parse(JSON.stringify(environment.algorithms[algorithm]));
            this.tempLengthPreserved = this.parameterMappings[this.currentAttribute].lengthPreserved;
        }
    }

    filterPossibleAlgorithms (opt): boolean {
        if (this.currentNode.required && opt === environment.algorithms.REDACTION.name) {
            return true;
        } else if (this.currentNode.selectedType !== 'date' && this.currentNode.selectedType !== 'dateTime' && this.currentNode.selectedType !== 'time' &&
            this.currentNode.selectedType !== 'instant' && opt === environment.algorithms.DATE_SHIFTING.name) {
            return true;
        }
        // if (this.attributeMappings[this.currentAttribute] === environment.attributeTypes.QUASI) { // Quasi-identifiers
        //
        // } else {  // Sensitive Rare attributes
        //
        // }
        return false;
    }

    getAlgorithmName (attribute: string): string {
        if (this.parameterMappings[attribute].name === environment.algorithms.SENSITIVE.name) {
            return this.parameterMappings[attribute].algorithm.name;
        } else {
            return this.parameterMappings[attribute].name;
        }
    }

}
</script>
