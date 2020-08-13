<template>
	<q-card style="width: 700px; max-width: 80vw;">
		<q-card-section class="row items-center q-pb-none">
			<div class="text-h6"> {{ $t('TITLES.ALGORITHM_CONFIGURATION') }} </div>
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
				:placeholder="$t('INFO.RARE_VALUES_PLACEHOLDER')"
				:label="$t('LABELS.RARE_VALUES')"
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
					<q-input v-model="rareFirstValue" dense outlined :label="$t('LABELS.ENTER_RARE_VALUE')" />
				</div>
				<div class="col-1 text-center">
					<q-icon size="xs" name="fas fa-arrow-right" color="primary" />
				</div>
				<div class="col-4">
					<q-input v-model="rareAfterValue" dense outlined :label="$t('LABELS.ENTER_NEW_VALUE')" />
				</div>
				<div class="col-2 q-ml-md">
					<q-btn unelevated round color="primary" icon="add" size="xs" @click="addRareReplacement()" :disable="!rareFirstValue" >
						<q-tooltip anchor="center right" self="center left" content-class="bg-white text-primary"> {{ $t('BUTTONS.ADD') }} </q-tooltip>
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
					<q-radio v-model="tempParameterMappings.lengthPreserved" :val="true" :label="$t('LABELS.ORIGINAL_LENGTH')" @input="updateParameters" />
				</div>
				<div class="col-3">
					<q-radio v-model="tempParameterMappings.lengthPreserved" :val="false" :label="$t('LABELS.FIXED_LENGTH')" @input="updateParameters" />
				</div>
				<div class="col-2">
					<q-input type="number" dense outlined v-model="tempParameterMappings.fixedLength" :disable="tempParameterMappings.lengthPreserved" @input="updateParameters" />
				</div>
			</div>
		</q-card-section>
		<q-card-section v-if="getAlgorithmName() === envAlgorithms.SUBSTITUTION.name && !hasRegex()" class="q-pt-none">
			<div class="row">
				<div class="col-3">
					<q-field borderless :label="$t('LABELS.SUBSTITUTION_CHARACTER')" readonly dense label-color="black" />
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
					<q-field borderless :label="$t('LABELS.ADD_NOISE')" readonly dense label-color="black" />
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
					<q-radio v-model="tempParameterMappings.roundedToFloor" :val="true" :label="$t('LABELS.ROUND_TO_FLOOR')" @input="updateParameters" />
				</div>
				<div class="col-3">
					<q-radio v-model="tempParameterMappings.roundedToFloor" :val="false" :label="$t('LABELS.ROUND_TO_CEILING')" @input="updateParameters" />
				</div>
			</div>
		</q-card-section>

		<!--  GENERALIZATION FOR NUMBERS  -->
		<q-card-section v-if="getAlgorithmName() === envAlgorithms.GENERALIZATION.name && !isDateType()" class="q-pt-none">
			<div class="row">
				<div class="col-4">
					<q-field borderless :label="isInteger() ? $t('LABELS.LAST_DIGITS_TO_BE_ROUNDED') : $t('LABELS.ROUNDING_PRECISION')" readonly dense label-color="black" />
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
					<q-field borderless :label="$t('LABELS.ONLY_KEEP_INFO_FOR')" readonly dense label-color="black" />
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
					<q-field borderless :label="$t('LABELS.SHIFT_WITHIN')" readonly dense label-color="black" />
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
import { VuexStoreUtil as types } from '@/common/utils/vuex-store-util'
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

    get currentAttribute (): string { return this.$store.getters[types.Fhir.CURRENT_ATTRIBUTE] }
    set currentAttribute (value) { this.$store.commit(types.Fhir.SET_CURRENT_ATTRIBUTE, value) }

    get currentNode (): any { return this.$store.getters[types.Fhir.CURRENT_NODE] }
    set currentNode (value) { this.$store.commit(types.Fhir.SET_CURRENT_NODE, value) }

    get attributeMappings (): any { return this.$store.getters[types.Fhir.ATTRIBUTE_MAPPINGS] }
    set attributeMappings (value) { this.$store.commit(types.Fhir.SET_ATTRIBUTE_MAPPINGS, value) }

    get parameterMappings (): any { return this.$store.getters[types.Fhir.PARAMETER_MAPPINGS] }
    set parameterMappings (value) { this.$store.commit(types.Fhir.SET_PARAMETER_MAPPINGS, value) }

    get typeMappings (): any { return this.$store.getters[types.Fhir.TYPE_MAPPINGS] }
    set typeMappings (value) { this.$store.commit(types.Fhir.SET_TYPE_MAPPINGS, value) }

    get rareValueMappings (): any { return this.$store.getters[types.Fhir.RARE_VALUE_MAPPINGS] }
    set rareValueMappings (value) { this.$store.commit(types.Fhir.SET_RARE_VALUE_MAPPINGS, value) }

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
            info = String(this.$t('ALGORITHM_INFO.PASS_THROUGH'));
        } else if (this.getAlgorithmName() === environment.algorithms.REDACTION.name) {
            info = String(this.$t('ALGORITHM_INFO.REDACTION'));
        } else if (this.getAlgorithmName() === environment.algorithms.RECOVERABLE_SUBSTITUTION.name) {
            info = String(this.$t('ALGORITHM_INFO.RECOVERABLE_SUBSTITUTION'));
        } else if (this.getAlgorithmName() === environment.algorithms.SUBSTITUTION.name && !this.hasRegex()) {
            info = String(this.$t('ALGORITHM_INFO.SUBSTITUTION'));
        } else if (this.getAlgorithmName() === environment.algorithms.SUBSTITUTION.name && this.hasRegex()) {
            info = String(this.$t('ALGORITHM_INFO.SUBSTITUTION_REGEX'));
        } else if (this.getAlgorithmName() === environment.algorithms.FUZZING.name) {
            info = String(this.$t('ALGORITHM_INFO.FUZZING'));
        } else if (this.getAlgorithmName() === environment.algorithms.GENERALIZATION.name && !this.isDateType() && this.isInteger()) {
            info = String(this.$t('ALGORITHM_INFO.GENERALIZATION_INTEGER'));
        } else if (this.getAlgorithmName() === environment.algorithms.GENERALIZATION.name && !this.isDateType() && !this.isInteger()) {
            info = String(this.$t('ALGORITHM_INFO.GENERALIZATION_FLOAT'));
        } else if (this.getAlgorithmName() === environment.algorithms.GENERALIZATION.name && this.isDateType()) {
            info = String(this.$t('ALGORITHM_INFO.GENERALIZATION_DATE'));
        } else if (this.getAlgorithmName() === environment.algorithms.DATE_SHIFTING.name) {
            info = String(this.$t('ALGORITHM_INFO.DATE_SHIFTING'));
        }
        if (this.isSensitive()) {
            if (this.getAlgorithmName() === environment.algorithms.REPLACE.name) {
                return String(this.$t('ALGORITHM_INFO.REPLACE'));
            }
            return String(this.$t('ALGORITHM_INFO.RARE_VALUES')) + info;
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
