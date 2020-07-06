<template>
	<div>
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
		<div style="overflow-y: auto">
			<q-splitter v-model="splitterModel">
				<!--Fhir Element Tree Part-->
				<template v-slot:before>
					<div class="row items-center full-width bg-primary q-pa-xs">
						<div class="text-center col">
							<span class="text-white"> {{ $t('TABLE.ATTRIBUTE') }} </span>
						</div>
						<div class="text-center col-4">
							<span class="text-white"> {{ $t('TABLE.TYPE') }} </span>
						</div>
						<div class="text-center col-2">
							<span class="text-white"> {{ $t('TABLE.HAS_RARE_VALUES') }} </span>
						</div>
						<div class="text-center col-2">
							<span class="text-white"> {{ $t('TABLE.L_DIVERSITY') }} (l)</span>
						</div>
					</div>
					<q-scroll-area style="height: 50vh">
						<q-tree :nodes="sensitiveElementList"
						        ref="sensTree"
						        node-key="value"
						        label-key="label"
						        :selected.sync="selectedStr"
						        :filter="filter"
						        :filter-method="filterTree"
						        :no-nodes-label="$t('LABELS.NO_SENSITIVE_ATTRIBUTE')"
						        :no-results-label="$t('LABELS.NO_RESULT')"
						        selected-color="primary"
						        @update:selected="onSelected"
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
										<span>{{ prop.node.label }} <span class="text-red">{{ prop.node.required ? '*' : '' }}</span></span>
									</div>
									<div class="text-center col-5">
										<span class="text-caption text-primary">{{ typeMappings[prop.key] }}</span>
									</div>
									<div class="col-2">
										<q-checkbox v-if="tempParameterMappings[prop.key]" v-model="rareElements"
										            :val="prop.key" @input="setRareness(prop.key)" class="q-ml-md" />
										<q-btn v-if="tempParameterMappings[prop.key]"
										       unelevated
										       color="accent"
										       text-color="white"
										       @click="configureAlgorithm(prop.node)"
										       icon="fas fa-cog"
										       :disable="!tempParameterMappings[prop.key].hasRare || !attributeMappings[prop.key]"
										/>
									</div>
									<div class="row col-2">
										<q-checkbox v-if="tempParameterMappings[prop.key] && kAnonymityValidMappings[currentFHIRRes]" color="primary" class="q-ml-xl"
										            v-model="tempParameterMappings[prop.key].l_diversityValid" @input="updateParameters(prop.key)" />
										<q-checkbox v-if="tempParameterMappings[prop.key] && !kAnonymityValidMappings[currentFHIRRes]"
										            color="primary" class="q-ml-lg" disabled value="false"  >
											<q-tooltip v-if="!kAnonymityValidMappings[currentFHIRRes]" anchor="bottom middle" self="top middle">
												{{ $t('WARNING.L_DIVERSITY_WITHOUT_K_ANONYMITY') }}
											</q-tooltip>
										</q-checkbox>
										<q-select outlined dense v-if="tempParameterMappings[prop.key]" :options="[2,3,4,5]"
										          v-model="tempParameterMappings[prop.key].l_diversity" @input="updateParameters(prop.key)"
										          :disable="!tempParameterMappings[prop.key].l_diversityValid"
										          :option-disable="opt => opt > kValueMappings[currentFHIRRes]" />
									</div>
								</div>
							</template>
						</q-tree>
					</q-scroll-area>
				</template>

				<!--Elements Definition Part-->
				<template v-slot:after>
					<q-scroll-area style="height: 50vh" v-if="selectedElem">
						<div>
							<q-toolbar class="bg-grey-2">
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
							</q-toolbar>
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
export default class SensitiveAttributeTable extends Vue {
    private splitterModel = 70;
    private configDialog: boolean = false;
    private selectedStr: string = '';
    private selectedElem: any = null;
    private filter: string = '';
    private tempParameterMappings = JSON.parse(JSON.stringify(this.parameterMappings));

    get currentFHIRRes (): string { return this.$store.getters[types.Fhir.CURRENT_RESOURCE] }
    set currentFHIRRes (value) { this.$store.commit(types.Fhir.SET_CURRENT_RESOURCE, value) }

    get currentFHIRProf (): string { return this.$store.getters[types.Fhir.CURRENT_PROFILE] }
    set currentFHIRProf (value) { this.$store.commit(types.Fhir.SET_CURRENT_PROFILE, value) }

    get currentAttribute (): string { return this.$store.getters[types.Fhir.CURRENT_ATTRIBUTE] }
    set currentAttribute (value) { this.$store.commit(types.Fhir.SET_CURRENT_ATTRIBUTE, value) }

    get currentNode (): any { return this.$store.getters[types.Fhir.CURRENT_NODE] }
    set currentNode (value) { this.$store.commit(types.Fhir.SET_CURRENT_NODE, value) }

    get fhirElementListFlat (): any { return this.$store.getters[types.Fhir.ELEMENT_LIST_FLAT] }
    get sensitiveElementList (): object[] { return this.$store.getters[types.Fhir.SENSITIVE_ELEMENT_LIST] }

    get attributeMappings (): any { return this.$store.getters[types.Fhir.ATTRIBUTE_MAPPINGS] }
    set attributeMappings (value) { this.$store.commit(types.Fhir.SET_ATTRIBUTE_MAPPINGS, value) }

    get parameterMappings (): any { return this.$store.getters[types.Fhir.PARAMETER_MAPPINGS] }
    set parameterMappings (value) { this.$store.commit(types.Fhir.SET_PARAMETER_MAPPINGS, value) }

    get rareElements (): any { return this.$store.getters[types.Fhir.RARE_ELEMENTS] }
    set rareElements (value) { this.$store.commit(types.Fhir.SET_RARE_ELEMENTS, value) }

    get typeMappings (): any { return this.$store.getters[types.Fhir.TYPE_MAPPINGS] }
    set typeMappings (value) { this.$store.commit(types.Fhir.SET_TYPE_MAPPINGS, value) }

    get kAnonymityValidMappings (): any { return this.$store.getters[types.Fhir.K_ANONYMITY_VALID_MAPPINGS] }
    set kAnonymityValidMappings (value) { this.$store.commit(types.Fhir.SET_K_ANONYMITY_VALID_MAPPINGS, value) }

    get kValueMappings (): any { return this.$store.getters[types.Fhir.K_VALUE_MAPPINGS] }
    set kValueMappings (value) { this.$store.commit(types.Fhir.SET_K_VALUE_MAPPINGS, value) }

    @Watch('currentFHIRRes')
    onFHIRResourceChanged (): void {
        ([this.currentFHIRProf, this.selectedStr] = ['', '']);
    }

    @Watch('currentFHIRProf')
    onFHIRProfileChanged (): void {
        this.selectedElem = null;
    }

    configureAlgorithm (node: fhir.ElementTree) {
        this.currentNode = node;
        this.currentAttribute = node.value ? node.value : '';
        this.configDialog = true;
    }

    onSelected (target) {
        const filtered = this.fhirElementListFlat.filter(item => item.value === target);
        this.selectedElem = filtered.length ? filtered[0] : null
    }

    setRareness (attribute: string) {
        this.tempParameterMappings[attribute].hasRare = this.rareElements.includes(attribute);
        this.parameterMappings[attribute].hasRare = this.tempParameterMappings[attribute].hasRare;
    }

    filterTree (node, filter) {
        const filt = filter.toLowerCase();
        return (node.label && node.label.toLowerCase().includes(filt)) ||
            (this.typeMappings[node.value] && this.typeMappings[node.value].toLowerCase().includes(filt));
    }

    updateParameters (attribute: string) {
        this.parameterMappings[attribute] = this.tempParameterMappings[attribute];
    }

}
</script>
