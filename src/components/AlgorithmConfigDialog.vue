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
				<template v-for="(key, index) in generateBreadcrumb()">
					<q-breadcrumbs-el v-if="index === 0" :label="key" icon="account_tree" />
					<q-breadcrumbs-el v-else-if="index === generateBreadcrumb().length - 1" :label="key + ' (' + currentNode.selectedType + ')'" icon="account_tree" />
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
			<q-item-label class="text-weight-bold q-mt-lg q-mb-xs">
				<span class="text-info"><q-icon name="fas fa-info" size="xs" class="q-mr-xs q-mb-sm" /> {{getInfoText()}} </span>
			</q-item-label>
		</q-card-section>

		<!--  SUBSTITUTION  -->
		<q-card-section v-if="getAlgorithmName(currentAttribute) === envAlgorithms.SUBSTITUTION.name && !hasRegex()" class="q-pt-none">
			<div class="row">
				<div class="col-4">
					<q-radio v-model="tempLengthPreserved" :val="true" label="Original Length" @input="onLengthPreservedSelected" />
				</div>
				<div class="col-3">
					<q-radio v-model="tempLengthPreserved" :val="false" label="Fixed Length" @input="onLengthPreservedSelected" />
				</div>
				<div class="col-2">
					<q-input v-if="parameterMappings[currentAttribute].name !== envAlgorithms.SENSITIVE.name" type="number" dense outlined
					         v-model="parameterMappings[currentAttribute].fixedLength" :disable="tempLengthPreserved" />
					<q-input v-else v-model="parameterMappings[currentAttribute].algorithm.fixedLength" type="number" dense outlined :disable="tempLengthPreserved" />
				</div>
			</div>
		</q-card-section>
		<q-card-section v-if="getAlgorithmName(currentAttribute) === envAlgorithms.SUBSTITUTION.name && !hasRegex()" class="q-pt-none">
			<div class="row">
				<div class="col-3">
					<q-field borderless label="Substitution Character:" readonly dense label-color="black" />
				</div>
				<div class="col-1">
					<q-input v-if="parameterMappings[currentAttribute].name !== envAlgorithms.SENSITIVE.name" v-model="parameterMappings[currentAttribute].substitutionChar" type="text" dense outlined maxlength="1" />
					<q-input v-else v-model="parameterMappings[currentAttribute].algorithm.substitutionChar" type="text" dense outlined maxlength="1" />
				</div>
			</div>
		</q-card-section>

		<!--  FUZZING  -->
		<q-card-section v-if="getAlgorithmName(currentAttribute) === envAlgorithms.FUZZING.name" class="q-pt-none">
			<div class="row">
				<div class="col-3">
					<q-field borderless label="Add noise within:" readonly dense label-color="black" />
				</div>
				<div class="col-2">
					<q-input v-if="parameterMappings[currentAttribute].name !== envAlgorithms.SENSITIVE.name"
					         v-model="parameterMappings[currentAttribute].percentage" type="number" dense outlined >
						<template v-slot:append>
							<q-icon name="fas fa-percent" size="xs" />
						</template>
					</q-input>
					<q-input v-else v-model="parameterMappings[currentAttribute].algorithm.percentage" type="number" dense outlined suffix="%" />
				</div>
			</div>
		</q-card-section>

		<!--  GENERALIZATION  -->
		<q-card-section v-if="getAlgorithmName(currentAttribute) === envAlgorithms.GENERALIZATION.name" class="q-pt-none">
			<div class="row">
				<div class="col-3">
					<q-radio v-model="tempRoundedToFloor" :val="true" label="Round to Floor" @input="onRoundedToFloorSelected" />
				</div>
				<div class="col-3">
					<q-radio v-model="tempRoundedToFloor" :val="false" label="Round to Ceiling" @input="onRoundedToFloorSelected" />
				</div>
			</div>
		</q-card-section>

		<!--  GENERALIZATION FOR NUMBERS  -->
		<q-card-section v-if="getAlgorithmName(currentAttribute) === envAlgorithms.GENERALIZATION.name && !isDateType() && isInteger()" class="q-pt-none">
			<div class="row">
				<div class="col-4">
					<q-field borderless :label="isInteger() ? 'Last digits to be rounded:' : 'Rounding precision:'" readonly dense label-color="black" />
				</div>
				<div class="col-2">
					<q-input v-if="parameterMappings[currentAttribute].name !== envAlgorithms.SENSITIVE.name" v-model="parameterMappings[currentAttribute].roundDigits" type="number" dense outlined />
					<q-input v-else v-model="parameterMappings[currentAttribute].algorithm.roundDigits" type="number" dense outlined />
				</div>
			</div>
		</q-card-section>

		<!--  GENERALIZATION FOR DATES  -->
		<q-card-section v-if="getAlgorithmName(currentAttribute) === envAlgorithms.GENERALIZATION.name && isDateType()" class="q-pt-none">
			<div class="row">
				<div class="col-4">
					<q-field borderless label="Only keep information for:" readonly dense label-color="black" />
				</div>
				<div class="col-2">
					<q-select v-if="parameterMappings[currentAttribute].name !== envAlgorithms.SENSITIVE.name" outlined dense v-model="parameterMappings[currentAttribute].dateUnit" :options="getDateUnitOptions()" @input="$forceUpdate()" />
					<q-select v-else outlined dense v-model="parameterMappings[currentAttribute].algorithm.dateUnit" :options="getDateUnitOptions()" @input="$forceUpdate()" />
				</div>
			</div>
		</q-card-section>

		<!--  DATE SHIFTING  -->
		<q-card-section v-if="getAlgorithmName(currentAttribute) === envAlgorithms.DATE_SHIFTING.name" class="q-pt-none">
			<div class="row">
				<div class="col-2">
					<q-field borderless label="Shift within:" readonly dense label-color="black" />
				</div>
				<div class="col-2">
					<q-input v-if="parameterMappings[currentAttribute].name !== envAlgorithms.SENSITIVE.name" v-model="parameterMappings[currentAttribute].range" type="number" dense outlined />
					<q-input v-else v-model="parameterMappings[currentAttribute].algorithm.range" type="number" dense outlined />
				</div>
				<div class="col-2">
					<q-select v-if="parameterMappings[currentAttribute].name !== envAlgorithms.SENSITIVE.name" outlined dense v-model="parameterMappings[currentAttribute].dateUnit" :options="getDateUnitOptions()" @input="$forceUpdate()" />
					<q-select v-else outlined dense v-model="parameterMappings[currentAttribute].algorithm.dateUnit" :options="getDateUnitOptions()" @input="$forceUpdate()" />
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
    private tempRoundedToFloor: boolean = true;
    private tempAlgorithmName: string = '';
    private envAlgorithms = environment.algorithms;
    private algorithms = Object.keys(environment.algorithms).filter(key => key !== 'SENSITIVE').map(key => environment.algorithms[key].name);

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

    generateBreadcrumb (): string[] {
        return this.currentAttribute.split('.');
    }

    onLengthPreservedSelected () {
        if (this.parameterMappings[this.currentAttribute].name === environment.algorithms.SENSITIVE.name) {
            this.parameterMappings[this.currentAttribute].algorithm.lengthPreserved = this.tempLengthPreserved;
        } else {
            this.parameterMappings[this.currentAttribute].lengthPreserved = this.tempLengthPreserved;
        }
    }

    onRoundedToFloorSelected () {
        if (this.parameterMappings[this.currentAttribute].name === environment.algorithms.SENSITIVE.name) {
            this.parameterMappings[this.currentAttribute].algorithm.roundedToFloor = this.tempRoundedToFloor;
        } else {
            this.parameterMappings[this.currentAttribute].roundedToFloor = this.tempRoundedToFloor;
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

    filterPossibleAlgorithms (opt: string): boolean {
        if (this.currentNode.required && opt === environment.algorithms.REDACTION.name) {
            return true;
        }
	    return environment.primitiveTypes[this.currentNode.selectedType].supports.indexOf(opt) === -1;
    }

    hasRegex (): boolean {
        return !!environment.primitiveTypes[this.currentNode.selectedType].regex;
    }

    isDateType (): boolean {
        return this.currentNode.selectedType === 'instant' || this.currentNode.selectedType === 'date' ||
            this.currentNode.selectedType === 'dateTime' || this.currentNode.selectedType === 'time';
    }

    isInteger (): boolean {
        return this.currentNode.selectedType !== 'decimal';
    }

    getAlgorithmName (attribute: string): string {
        if (this.parameterMappings[attribute].name === environment.algorithms.SENSITIVE.name) {
            return this.parameterMappings[attribute].algorithm.name;
        } else {
            return this.parameterMappings[attribute].name;
        }
    }

    getDateUnitOptions (): string[] {
        if (this.currentNode.selectedType === 'time') {
            if (this.parameterMappings[this.currentAttribute].dateUnit !== 'Hours' ||
                this.parameterMappings[this.currentAttribute].dateUnit !== 'Minutes' ||
                this.parameterMappings[this.currentAttribute].dateUnit !== 'Seconds') {
                this.parameterMappings[this.currentAttribute].dateUnit = 'Hours';
            }
            return ['Hours', 'Minutes', 'Seconds'];
        }
        return ['Years', 'Months', 'Days'];
    }

    getInfoText() {
        if (this.getAlgorithmName(this.currentAttribute) === this.envAlgorithms.PASS_THROUGH.name) {
            return 'The attribute will be saved with no change.';
        } else if (this.getAlgorithmName(this.currentAttribute) === this.envAlgorithms.REDACTION.name) {
            return 'The attribute will be completely removed.';
        } else if (this.getAlgorithmName(this.currentAttribute) === this.envAlgorithms.RECOVERABLE_SUBSTITUTION.name) {
            return 'New value will be generated automatically.';
        } else if (this.getAlgorithmName(this.currentAttribute) === this.envAlgorithms.SUBSTITUTION.name && !this.hasRegex()) {
            return 'Attribute value will be replaced with the substitution character that you provide.';
        } else if (this.getAlgorithmName(this.currentAttribute) === this.envAlgorithms.SUBSTITUTION.name && this.hasRegex()) {
            return 'Attribute value will be replaced with a randomly generated value that fits attribute\'s regular expression.';
        } else if (this.getAlgorithmName(this.currentAttribute) === this.envAlgorithms.FUZZING.name) {
            return 'A noise will be added to the attribute within the range of the percentage you provide.';
        } else if (this.getAlgorithmName(this.currentAttribute) === this.envAlgorithms.GENERALIZATION.name && !this.isDateType() && this.isInteger()) {
            return 'Last digits of the integer will be rounded by your choice.';
        } else if (this.getAlgorithmName(this.currentAttribute) === this.envAlgorithms.GENERALIZATION.name && !this.isDateType() && !this.isInteger()) {
            return 'Decimal places of the floating number will be rounded by your choice. \'0\' means rounding to an integer.';
        } else if (this.getAlgorithmName(this.currentAttribute) === this.envAlgorithms.GENERALIZATION.name && this.isDateType()) {
            return 'Only the information of the date unit that you provide will be kept.';
        } else if (this.getAlgorithmName(this.currentAttribute) === this.envAlgorithms.DATE_SHIFTING.name) {
            return 'Date will be shifted randomly within a range that you provide.';
        }
    }

}
</script>
