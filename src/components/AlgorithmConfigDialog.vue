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
		<q-card-section v-if="isSensitive() && getAlgorithmName() !== envAlgorithms.REPLACE.name" class="q-pt-none">
			<q-select
				v-model="rareValues"
				multiple
				use-chips
				use-input
				new-value-mode="add"
				stack-label
				hide-dropdown-icon
				placeholder="Enter rare values here..."
				label="Rare Values"
				@input.native="rareInput = $event.target.value"
				@new-value="createValue"
			>
				<template v-slot:selected-item="scope">
					<q-chip
						removable
						dense
						@remove="scope.removeAtIndex(scope.index)"
						:tabindex="scope.tabindex"
						color="white"
						text-color="accent"
						class="q-mb-none"
					>
						{{ scope.opt }}
					</q-chip>
				</template>
			</q-select>
		</q-card-section>
		<q-card-section v-if="isSensitive() && getAlgorithmName() === envAlgorithms.REPLACE.name" class="q-pt-none">
			<div class="row items-center">
				<div class="col-4">
					<q-input v-model="rareFirstValue" dense outlined label="Enter rare value" />
				</div>
				<div class="col-1 text-center">
					<q-icon size="xs" name="fas fa-arrow-right" color="primary" />
				</div>
				<div class="col-4">
					<q-input v-model="rareAfterValue" dense outlined label="Enter the new value" />
				</div>
				<div class="col-2 q-ml-md">
					<q-btn unelevated round color="primary" icon="add" size="xs" @click="addRareReplacement()" :disable="!rareFirstValue" >
						<q-tooltip anchor="center right" self="center left" content-class="bg-white text-primary">Add</q-tooltip>
					</q-btn>
				</div>
			</div>
			<q-chip v-for="key of Object.keys(tempParameterMappings.replaceValues)" @remove="removeRareCouple(key)"
			        removable color="accent" text-color="white" class="q-mt-md">
				<span>
					{{key}} <q-icon size="xs" name="fas fa-long-arrow-alt-right" class="q-ma-xs"/> {{tempParameterMappings.replaceValues[key]}}
				</span>
			</q-chip>
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
import {Component, Vue, Watch} from 'vue-property-decorator'
import {environment} from '@/common/environment'

@Component
export default class AlgorithmConfigDialog extends Vue {
    private envAlgorithms = environment.algorithms;
    private algorithms;
    private tempParameterMappings;
    private dateUnitOptions: string[] = [];
    private rareValues: string[] = this.rareValueMappings[this.currentAttribute] ? JSON.parse(JSON.stringify(this.rareValueMappings[this.currentAttribute])) : [];
    private rareInput: string = '';
    private rareFirstValue: string = '';
    private rareAfterValue: string = '';

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

    get rareValueMappings (): any { return this.$store.getters['fhir/rareValueMappings'] }
    set rareValueMappings (value) { this.$store.commit('fhir/setRareValueMappings', value) }

    created () {
        if (this.isSensitive()) {
            this.tempParameterMappings = this.parameterMappings[this.currentAttribute].algorithm;
            this.algorithms = Object.keys(environment.algorithms).filter(key => key !== 'SENSITIVE').map(key => environment.algorithms[key].name);
        } else {
            this.tempParameterMappings = this.parameterMappings[this.currentAttribute];
            this.algorithms = Object.keys(environment.algorithms).filter(key => key !== 'SENSITIVE' && key !== 'REPLACE').map(key => environment.algorithms[key].name);
        }
        this.getDateUnitOptions();
    }

    generateBreadcrumb (): string[] {
        const tempArray = this.currentAttribute.split('.');
        if (tempArray[0] === tempArray[1]) { // base resource
            tempArray.splice(0, 1);
        }
        return tempArray;
    }

    @Watch('rareValues')
    onRareValuesChanged () {
        this.rareValueMappings[this.currentAttribute] = this.rareValues;
    }

    addRareReplacement () {
        this.tempParameterMappings.replaceValues[this.rareFirstValue] = this.rareAfterValue;
        [this.rareFirstValue, this.rareAfterValue] = ['', ''];
        this.updateParameters();
    }

    removeRareCouple (key: string) {
        delete this.tempParameterMappings.replaceValues[key];
        this.updateParameters();
    }

    onAlgorithmSelected () {
        const algorithm: any = Object.keys(environment.algorithms).find(key => environment.algorithms[key].name === this.tempParameterMappings.name);
        this.tempParameterMappings = JSON.parse(JSON.stringify(environment.algorithms[algorithm]));
        this.updateParameters();
    }

    updateParameters () {
        this.$forceUpdate();
        if (this.isSensitive()) {
            this.parameterMappings[this.currentAttribute].algorithm = JSON.parse(JSON.stringify(this.tempParameterMappings));
        } else {
            this.parameterMappings[this.currentAttribute] = JSON.parse(JSON.stringify(this.tempParameterMappings));
        }
    }

    filterPossibleAlgorithms (opt: string): boolean {
        if (this.currentNode.required && opt === environment.algorithms.REDACTION.name) {
            return true;
        }
        return !environment.primitiveTypes[this.typeMappings[this.currentAttribute]].supports.includes(opt);
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

    isSensitive (): boolean {
        return this.parameterMappings[this.currentAttribute].name === environment.algorithms.SENSITIVE.name;
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

    getInfoText (): string {
        let info: string = '';
        if (this.getAlgorithmName() === environment.algorithms.PASS_THROUGH.name) {
            info = 'The attribute will be saved with no change.';
        } else if (this.getAlgorithmName() === environment.algorithms.REDACTION.name) {
            info = 'The attribute will be completely removed.';
        } else if (this.getAlgorithmName() === environment.algorithms.RECOVERABLE_SUBSTITUTION.name) {
            info = 'New value will be generated automatically.';
        } else if (this.getAlgorithmName() === environment.algorithms.SUBSTITUTION.name && !this.hasRegex()) {
            info = 'Attribute value will be replaced with the substitution character that you provide.';
        } else if (this.getAlgorithmName() === environment.algorithms.SUBSTITUTION.name && this.hasRegex()) {
            info = 'Attribute value will be replaced with a randomly generated value that fits attribute\'s regular expression.';
        } else if (this.getAlgorithmName() === environment.algorithms.FUZZING.name) {
            info = 'A noise will be added to the attribute within the range of the percentage you provide.';
        } else if (this.getAlgorithmName() === environment.algorithms.GENERALIZATION.name && !this.isDateType() && this.isInteger()) {
            info = 'Last digits of the integer will be rounded by your choice.';
        } else if (this.getAlgorithmName() === environment.algorithms.GENERALIZATION.name && !this.isDateType() && !this.isInteger()) {
            info = 'Decimal places of the floating number will be rounded by your choice. \'0\' means rounding to an integer.';
        } else if (this.getAlgorithmName() === environment.algorithms.GENERALIZATION.name && this.isDateType()) {
            info = 'Only the information of the date unit that you provide will be kept.';
        } else if (this.getAlgorithmName() === environment.algorithms.DATE_SHIFTING.name) {
            info = 'Date will be shifted randomly within a range that you provide.';
        }
        if (this.isSensitive()) {
            if (this.getAlgorithmName() === environment.algorithms.REPLACE.name) {
                return 'You should provide the rare values and their new values for this attribute below.';
            }
            return  'You should provide the rare values for this attribute below. ' + info;
        }
        return info;
    }

    createValue (val, done) {
        if (done) {
            done(val)
        }
    }

}
</script>
