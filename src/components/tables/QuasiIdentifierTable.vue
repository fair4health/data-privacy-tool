<template>
	<div>
		<div class="row q-mb-md">
			<q-toggle label="K-anonymity:" v-model="kAnonymityValid" class="q-mr-md" color="primary"  @input="onKValidChanged()" />
			<q-select outlined dense v-model="kValue" :options="[2,3,4,5]" :disable="!kAnonymityValid" @input="onKValueChanged()" />
		</div>
		<q-separator />
		<q-item-section class="q-px-xs">
			<q-input borderless dense v-model="filter" :label="$t('LABELS.FILTER')">
				<template v-slot:prepend>
					<q-icon name="sort" />
				</template>
				<template v-slot:append>
					<q-icon v-if="filter" name="clear" class="cursor-pointer" @click="filter=''" />
				</template>
			</q-input>
		</q-item-section>
		<q-separator />
		<div class="splitter-div">
			<q-splitter v-model="splitterModel" :limits="[50, 100]">
				<!--Fhir Element Tree Part-->
				<template v-slot:before>
					<div class="row items-center full-width bg-primary q-pa-xs text-white">
						<div class="text-center col ellipsis">
							{{ $t('TABLE.ATTRIBUTE') }}
						</div>
						<div class="text-center col-4 ellipsis">
							{{ $t('TABLE.TYPE') }}
						</div>
						<div class="text-center col-6 ellipsis">
							{{ $t('TABLE.DEIDENTIFICATION_ALGORITHM') }}
						</div>
					</div>
					<q-scroll-area class="overflow-hidden">
						<q-tree :nodes="quasiElementList"
						        ref="quasiTree"
						        node-key="value"
						        label-key="label"
						        :filter="filter"
						        :filter-method="filterTree"
						        :no-nodes-label="$t('LABELS.NO_QUASI_IDENTIFIER')"
						        :no-results-label="$t('LABELS.NO_RESULT')"
						        selected-color="primary"
						        default-expand-all
						>
							<template v-slot:default-header="prop">
								<div class="row items-center full-width bg-grey-1 q-pa-xs">
									<div class="col">
										<q-icon :name="prop.node.children && prop.node.children.length ? 'account_tree' : 'lens'"
										        color="orange-5"
										        :size="prop.node.children && prop.node.children.length ? 'sm' : 'xs'"
										        class="q-mr-sm"
										/>
										<span class="fhir-element-text" v-bind:class="{'text-primary': selectedStr === prop.node.value}"
													@click="onSelected(prop.node.value)">{{ prop.node.label }}
												<span class="text-red">{{ prop.node.required ? '*' : '' }}</span>
										</span>
									</div>
									<div class="text-center col-5">
										<span class="text-caption text-primary">{{ typeMappings[prop.key] }}</span>
									</div>
									<div class="text-center col-5">
										<q-select v-if="tempParameterMappings[prop.key]" outlined dense @input="onAlgorithmSelected(prop.key)"
										          v-model="tempParameterMappings[prop.key].name" :options="algorithms"
										          :option-disable="opt => filterPossibleAlgorithms(opt, prop.node)" >
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
									</div>
									<div class="text-center col-1">
										<q-btn v-if="tempParameterMappings[prop.key] && tempParameterMappings[prop.key].name &&
													(tempParameterMappings[prop.key].name !== envAlgorithms.PASS_THROUGH.name) &&
													(tempParameterMappings[prop.key].name !== envAlgorithms.REDACTION.name) &&
										            (tempParameterMappings[prop.key].name !== envAlgorithms.RECOVERABLE_SUBSTITUTION.name)"
										       unelevated
										       color="accent"
										       text-color="white"
										       @click="configureAlgorithm(prop.node)"
										       icon="fas fa-cog" />
									</div>
								</div>
							</template>
						</q-tree>
					</q-scroll-area>
				</template>

				<!--Elements Definition Part-->
				<template v-slot:after>
					<q-toolbar v-if="selectedElem" class="bg-grey-2">
						<q-item-label class="text-weight-bold text-grey-7">
							<span class="text-weight-regular text-primary">
								[{{ selectedElem.min }}..{{ selectedElem.max }}]
							</span>
							<u>
								{{ selectedElem.value }}
								<q-tooltip>{{ selectedElem.value }}</q-tooltip>
							</u>
							<span class="text-red">{{ selectedElem.min ? '*' : '' }}</span>
						</q-item-label>
						<q-space />
						<q-btn unelevated round dense size="sm" icon="close" color="white" text-color="grey-9"
									 @click="selectedStr=null; selectedElem=null; splitterModel=100" />
					</q-toolbar>
					<q-scroll-area v-if="selectedElem" class="overflow-hidden">
						<div class="q-ma-sm q-gutter-sm">
							<q-card flat bordered v-if="selectedElem.short">
								<q-card-section>
									<div class="text-h6"> {{ $t('LABELS.SHORT') }} </div>
									<q-separator spaced />
									<div class="text-grey-10">{{ selectedElem.short }}</div>
								</q-card-section>
							</q-card>
							<q-card flat bordered v-if="selectedElem.definition">
								<q-card-section>
									<div class="text-h6"> {{ $t('LABELS.DEFINITION') }} </div>
									<q-separator spaced />
									<div class="text-grey-10">{{ selectedElem.definition }}</div>
								</q-card-section>
							</q-card>
							<q-card flat bordered v-if="selectedElem.comment">
								<q-card-section>
									<div class="text-h6"> {{ $t('LABELS.COMMENTS') }} </div>
									<q-separator spaced />
									<div class="text-grey-10">{{ selectedElem.comment }}</div>
								</q-card-section>
							</q-card>
						</div>
					</q-scroll-area>
				</template>
			</q-splitter>
		</div>
		<q-separator />

		<q-dialog v-model="configDialog">
			<AlgorithmConfigDialog />
		</q-dialog>

	</div>
</template>

<script lang="ts">
import {Component, Vue, Watch} from 'vue-property-decorator'
import {environment} from '@/common/environment'
import Loading from '@/components/Loading.vue';
import {VuexStoreUtil as types} from '@/common/utils/vuex-store-util';

@Component({
    components: {
        AlgorithmConfigDialog: () => ({
            component: import('@/components/AlgorithmConfigDialog.vue'),
            loading: Loading,
            delay: 0
        })
    } as any
})
export default class QuasiIdentifierTable extends Vue {
    private splitterModel = 100;
    private configDialog: boolean = false;
    private selectedStr: string = '';
    private selectedElem: any = null;
    private filter: string = '';
    private envAlgorithms = environment.algorithms;
    private algorithms = Object.keys(environment.algorithms).filter(key => key !== 'SENSITIVE' && key !== 'REPLACE').map(key => environment.algorithms[key].name);
    private tempParameterMappings = JSON.parse(JSON.stringify(this.parameterMappings));
    private kAnonymityValid: boolean = false;
    private kValue: number = 3;

    get currentFHIRRes (): string { return this.$store.getters[types.Fhir.CURRENT_RESOURCE] }
    set currentFHIRRes (value) { this.$store.commit(types.Fhir.SET_CURRENT_RESOURCE, value) }

    get currentFHIRProf (): string { return this.$store.getters[types.Fhir.CURRENT_PROFILE] }
    set currentFHIRProf (value) { this.$store.commit(types.Fhir.SET_CURRENT_PROFILE, value) }

    get currentAttribute (): string { return this.$store.getters[types.Fhir.CURRENT_ATTRIBUTE] }
    set currentAttribute (value) { this.$store.commit(types.Fhir.SET_CURRENT_ATTRIBUTE, value) }

    get currentNode (): any { return this.$store.getters[types.Fhir.CURRENT_NODE] }
    set currentNode (value) { this.$store.commit(types.Fhir.SET_CURRENT_NODE, value) }

    get fhirElementListFlat (): any { return this.$store.getters[types.Fhir.ELEMENT_LIST_FLAT] }
    get quasiElementList (): object[] { return this.$store.getters[types.Fhir.QUASI_ELEMENT_LIST] }

    get attributeMappings (): any { return this.$store.getters[types.Fhir.ATTRIBUTE_MAPPINGS] }
    set attributeMappings (value) { this.$store.commit(types.Fhir.SET_ATTRIBUTE_MAPPINGS, value) }

    get parameterMappings (): any { return this.$store.getters[types.Fhir.PARAMETER_MAPPINGS] }
    set parameterMappings (value) { this.$store.commit(types.Fhir.SET_PARAMETER_MAPPINGS, value) }

    get typeMappings (): any { return this.$store.getters[types.Fhir.TYPE_MAPPINGS] }
    set typeMappings (value) { this.$store.commit(types.Fhir.SET_TYPE_MAPPINGS, value) }

    get kAnonymityValidMappings (): any { return this.$store.getters[types.Fhir.K_ANONYMITY_VALID_MAPPINGS] }
    set kAnonymityValidMappings (value) { this.$store.commit(types.Fhir.SET_K_ANONYMITY_VALID_MAPPINGS, value) }

    get kValueMappings (): any { return this.$store.getters[types.Fhir.K_VALUE_MAPPINGS] }
    set kValueMappings (value) { this.$store.commit(types.Fhir.SET_K_VALUE_MAPPINGS, value) }

    created () {
        if (this.currentFHIRRes) {
            this.setKAnonymityParameters();
        }
    }

    @Watch('currentFHIRRes')
    onFHIRResourceChanged (): void {
        ([this.currentFHIRProf, this.selectedStr] = ['', '']);
        this.setKAnonymityParameters();
    }

    @Watch('currentFHIRProf')
    onFHIRProfileChanged (): void {
        this.selectedElem = null;
    }

    setKAnonymityParameters () {
        if (this.kAnonymityValidMappings[this.currentFHIRRes]) {
            this.kAnonymityValid = this.kAnonymityValidMappings[this.currentFHIRRes];
            this.kValue = this.kValueMappings[this.currentFHIRRes];
        } else {
            this.kAnonymityValid = false;
            this.kValue = 3;
            this.kAnonymityValidMappings[this.currentFHIRRes] = this.kAnonymityValid;
            this.kValueMappings[this.currentFHIRRes] = this.kValue;
        }
    }

    onKValidChanged () {
        this.kAnonymityValidMappings[this.currentFHIRRes] = this.kAnonymityValid;
    }

    onKValueChanged () {
        this.kValueMappings[this.currentFHIRRes] = this.kValue;
    }

    copyEmptyParameters (attribute: string) {
        const algorithm: any = Object.keys(environment.algorithms).find(key => environment.algorithms[key].name === this.tempParameterMappings[attribute].name);
        Object.keys(environment.algorithms[algorithm]).forEach(key => {
            if (this.tempParameterMappings[attribute][key] === undefined) {
                this.tempParameterMappings[attribute][key] = JSON.parse(JSON.stringify(environment.algorithms[algorithm][key]));
                this.parameterMappings[attribute][key] = this.tempParameterMappings[attribute][key];
            }
        });
    }

    configureAlgorithm (node: fhir.ElementTree) {
        this.currentNode = node;
        const attribute = node.value ? node.value : '';
        this.currentAttribute = attribute;
        this.copyEmptyParameters(attribute);
        this.configDialog = true;
    }

    onSelected (target) {
        if (target) this.splitterModel = 50;
        else this.splitterModel = 100;
        this.selectedStr = target;
        const filtered = this.fhirElementListFlat.filter(item => item.value === target);
        this.selectedElem = filtered.length ? filtered[0] : null
    }

    onAlgorithmSelected (attribute: string) {
        this.copyEmptyParameters(attribute);
        this.parameterMappings[attribute] = this.tempParameterMappings[attribute];
    }

    filterPossibleAlgorithms (opt, node): boolean {
        if (node.required && opt === environment.algorithms.REDACTION.name) {
            return true;
        }
        return !environment.primitiveTypes[this.typeMappings[node.value]].supports.includes(opt);
    }

    filterTree (node, filter) {
        const filt = filter.toLowerCase();
        return (node.label && node.label.toLowerCase().includes(filt)) ||
            (this.typeMappings[node.value] && this.typeMappings[node.value].toLowerCase().includes(filt));
    }

}
</script>

<style lang="stylus">
    .splitter-div {
        overflow-y: auto
				overflow-x: hidden
    }
    .q-scrollarea {
        height: 50vh
    }
</style>
