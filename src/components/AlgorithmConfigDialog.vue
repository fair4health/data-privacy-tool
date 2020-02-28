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
					<q-breadcrumbs-el v-else-if="index === generateBreadcrumb().length - 1" :label="key + ' (' + typeMappings[currentAttribute] + ')'" icon="account_tree" />
					<q-breadcrumbs-el v-else :label="key" />
				</template>
			</q-breadcrumbs>
		</q-card-section>
		<q-card-section>
			<q-select v-if="tempParameterMappings" outlined dense v-model="tempParameterMappings.name"
			          :options="algorithms" :option-disable="opt => filterPossibleAlgorithms(opt)" @input="onAlgorithmSelected" >
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
		<q-card-section v-if="getAlgorithmName() === envAlgorithms.SUBSTITUTION.name && !hasRegex()" class="q-pt-none">
			<div class="row">
				<div class="col-4">
					<q-radio v-model="tempParameterMappings.lengthPreserved" :val="true" label="Original Length" @input="updateParameters" />
				</div>
				<div class="col-3">
					<q-radio v-model="tempParameterMappings.lengthPreserved" :val="false" label="Fixed Length" @input="updateParameters" />
				</div>
				<div class="col-2">
					<q-input type="number" dense outlined v-model="tempParameterMappings.fixedLength" :disable="tempParameterMappings.lengthPreserved" @input="updateParameters" />
				</div>
			</div>
		</q-card-section>
		<q-card-section v-if="getAlgorithmName() === envAlgorithms.SUBSTITUTION.name && !hasRegex()" class="q-pt-none">
			<div class="row">
				<div class="col-3">
					<q-field borderless label="Substitution Character:" readonly dense label-color="black" />
				</div>
				<div class="col-1">
					<q-input v-model="tempParameterMappings.substitutionChar" type="text" dense outlined maxlength="1" @input="updateParameters" />
				</div>
			</div>
		</q-card-section>

		<!--  FUZZING  -->
		<q-card-section v-if="getAlgorithmName() === envAlgorithms.FUZZING.name" class="q-pt-none">
			<div class="row">
				<div class="col-3">
					<q-field borderless label="Add noise within:" readonly dense label-color="black" />
				</div>
				<div class="col-2">
					<q-input v-model="tempParameterMappings.percentage" type="number" dense outlined @input="updateParameters" >
						<template v-slot:append>
							<q-icon name="fas fa-percent" size="xs" />
						</template>
					</q-input>
				</div>
			</div>
		</q-card-section>

		<!--  GENERALIZATION  -->
		<q-card-section v-if="getAlgorithmName() === envAlgorithms.GENERALIZATION.name && showRoundingBoundaries()" class="q-pt-none">
			<div class="row">
				<div class="col-3">
					<q-radio v-model="tempParameterMappings.roundedToFloor" :val="true" label="Round to Floor" @input="updateParameters" />
				</div>
				<div class="col-3">
					<q-radio v-model="tempParameterMappings.roundedToFloor" :val="false" label="Round to Ceiling" @input="updateParameters" />
				</div>
			</div>
		</q-card-section>

		<!--  GENERALIZATION FOR NUMBERS  -->
		<q-card-section v-if="getAlgorithmName() === envAlgorithms.GENERALIZATION.name && !isDateType() && isInteger()" class="q-pt-none">
			<div class="row">
				<div class="col-4">
					<q-field borderless :label="isInteger() ? 'Last digits to be rounded:' : 'Rounding precision:'" readonly dense label-color="black" />
				</div>
				<div class="col-2">
					<q-input v-model="tempParameterMappings.roundDigits" type="number" dense outlined @input="updateParameters" />
				</div>
			</div>
		</q-card-section>

		<!--  GENERALIZATION FOR DATES  -->
		<q-card-section v-if="getAlgorithmName() === envAlgorithms.GENERALIZATION.name && isDateType()" class="q-pt-none">
			<div class="row">
				<div class="col-4">
					<q-field borderless label="Only keep information for:" readonly dense label-color="black" />
				</div>
				<div class="col-2">
					<q-select outlined dense v-model="tempParameterMappings.dateUnit" :options="dateUnitOptions" @input="updateParameters" />
				</div>
			</div>
		</q-card-section>

		<!--  DATE SHIFTING  -->
		<q-card-section v-if="getAlgorithmName() === envAlgorithms.DATE_SHIFTING.name" class="q-pt-none">
			<div class="row">
				<div class="col-2">
					<q-field borderless label="Shift within:" readonly dense label-color="black" />
				</div>
				<div class="col-2">
					<q-input v-model="tempParameterMappings.range" type="number" dense outlined @input="updateParameters" />
				</div>
				<div class="col-2">
					<q-select outlined dense v-model="tempParameterMappings.dateUnit" :options="dateUnitOptions" @input="updateParameters" />
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
    private envAlgorithms = environment.algorithms;
    private algorithms = Object.keys(environment.algorithms).filter(key => key !== 'SENSITIVE').map(key => environment.algorithms[key].name);
    private tempParameterMappings;
    private dateUnitOptions: string[] = [];

    get currentAttribute (): string { return this.$store.getters['fhir/currentAttribute'] }
    set currentAttribute (value) { this.$store.commit('fhir/setCurrentAttribute', value) }

    get currentNode (): any { return this.$store.getters['fhir/currentNode'] }
    set currentNode (value) { this.$store.commit('fhir/setCurrentNode', value) }

    get attributeMappings (): any { return this.$store.getters['fhir/attributeMappings'] }
    set attributeMappings (value) { this.$store.commit('fhir/setAttributeMappings', value) }

    get parameterMappings (): any { return this.$store.getters['fhir/parameterMappings'] }
    set parameterMappings (value) { this.$store.commit('fhir/setParameterMappings', value) }

    get typeMappings (): any { return this.$store.getters['fhir/typeMappings'] }
    set typeMappings (value) { this.$store.commit('fhir/setTypeMappings', value) }

    created () {
        if (this.parameterMappings[this.currentAttribute].name === environment.algorithms.SENSITIVE.name) {
            this.tempParameterMappings = this.parameterMappings[this.currentAttribute].algorithm;
        } else {
            this.tempParameterMappings = this.parameterMappings[this.currentAttribute];
        }
        this.getDateUnitOptions();
    }

    generateBreadcrumb (): string[] {
        return this.currentAttribute.split('.');
    }

    onAlgorithmSelected () {
        const algorithm: any = Object.keys(environment.algorithms).find(key => environment.algorithms[key].name === this.tempParameterMappings.name);
        this.tempParameterMappings = JSON.parse(JSON.stringify(environment.algorithms[algorithm]));
        this.updateParameters();
    }

    updateParameters () {
        this.$forceUpdate();
        if (this.parameterMappings[this.currentAttribute].name === environment.algorithms.SENSITIVE.name) {
            this.parameterMappings[this.currentAttribute].algorithm = JSON.parse(JSON.stringify(this.tempParameterMappings));
        } else {
            this.parameterMappings[this.currentAttribute] = JSON.parse(JSON.stringify(this.tempParameterMappings));
        }
    }

    filterPossibleAlgorithms (opt: string): boolean {
        if (this.currentNode.required && opt === environment.algorithms.REDACTION.name) {
            return true;
        }
        return environment.primitiveTypes[this.typeMappings[this.currentAttribute]].supports.indexOf(opt) === -1;
    }

    hasRegex (): boolean {
        return !!environment.primitiveTypes[this.typeMappings[this.currentAttribute]].regex;
    }

    isDateType (): boolean {
        return this.typeMappings[this.currentAttribute] === 'instant' || this.typeMappings[this.currentAttribute] === 'date' ||
            this.typeMappings[this.currentAttribute] === 'dateTime' || this.typeMappings[this.currentAttribute] === 'time';
    }

    isInteger (): boolean {
        return this.typeMappings[this.currentAttribute] !== 'decimal';
    }

    getAlgorithmName (): string {
        return this.tempParameterMappings.name;
    }

    showRoundingBoundaries (): boolean {
        return !(this.typeMappings[this.currentAttribute] === 'date' || this.typeMappings[this.currentAttribute] === 'dateTime');
    }

    getDateUnitOptions () {
        if (this.typeMappings[this.currentAttribute] === 'time') { // hh:mm:ss
            if (this.tempParameterMappings.dateUnit === 'Years' ||
                this.tempParameterMappings.dateUnit === 'Months' ||
                this.tempParameterMappings.dateUnit === 'Days') {
                this.tempParameterMappings.dateUnit = 'Hours';
                this.updateParameters();
            }
            this.dateUnitOptions = ['Hours', 'Minutes', 'Seconds'];
        } else if (this.typeMappings[this.currentAttribute] === 'instant') { // YYYY-MM-DDThh:mm:ss.sss+zz:zz
            if (this.tempParameterMappings.dateUnit === 'Seconds') {
                this.tempParameterMappings.dateUnit = 'Years';
                this.updateParameters();
            }
            this.dateUnitOptions = ['Years', 'Months', 'Days', 'Hours', 'Minutes'];
        } else { // date (YYYY, YYYY-MM, or YYYY-MM-DD) or dateTime (YYYY, YYYY-MM, YYYY-MM-DD or YYYY-MM-DDThh:mm:ss+zz:zz)
            if (this.tempParameterMappings.dateUnit === 'Hours' ||
                this.tempParameterMappings.dateUnit === 'Minutes' ||
                this.tempParameterMappings.dateUnit === 'Seconds') {
                this.tempParameterMappings.dateUnit = 'Years';
                this.updateParameters();
            }
            this.dateUnitOptions = ['Years', 'Months', 'Days'];
        }
    }

    getInfoText () {
        if (this.getAlgorithmName() === this.envAlgorithms.PASS_THROUGH.name) {
            return 'The attribute will be saved with no change.';
        } else if (this.getAlgorithmName() === this.envAlgorithms.REDACTION.name) {
            return 'The attribute will be completely removed.';
        } else if (this.getAlgorithmName() === this.envAlgorithms.RECOVERABLE_SUBSTITUTION.name) {
            return 'New value will be generated automatically.';
        } else if (this.getAlgorithmName() === this.envAlgorithms.SUBSTITUTION.name && !this.hasRegex()) {
            return 'Attribute value will be replaced with the substitution character that you provide.';
        } else if (this.getAlgorithmName() === this.envAlgorithms.SUBSTITUTION.name && this.hasRegex()) {
            return 'Attribute value will be replaced with a randomly generated value that fits attribute\'s regular expression.';
        } else if (this.getAlgorithmName() === this.envAlgorithms.FUZZING.name) {
            return 'A noise will be added to the attribute within the range of the percentage you provide.';
        } else if (this.getAlgorithmName() === this.envAlgorithms.GENERALIZATION.name && !this.isDateType() && this.isInteger()) {
            return 'Last digits of the integer will be rounded by your choice.';
        } else if (this.getAlgorithmName() === this.envAlgorithms.GENERALIZATION.name && !this.isDateType() && !this.isInteger()) {
            return 'Decimal places of the floating number will be rounded by your choice. \'0\' means rounding to an integer.';
        } else if (this.getAlgorithmName() === this.envAlgorithms.GENERALIZATION.name && this.isDateType()) {
            return 'Only the information of the date unit that you provide will be kept.';
        } else if (this.getAlgorithmName() === this.envAlgorithms.DATE_SHIFTING.name) {
            return 'Date will be shifted randomly within a range that you provide.';
        }
    }

}
</script>
