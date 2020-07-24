<template>
	<div>
		<q-item-label class="text-weight-bold q-mt-lg q-mb-lg">
			<span class="text-info"><q-icon name="fas fa-info" size="xs" class="q-mr-xs" /> {{ $t('INFO.FHIR_ATTRIBUTE_TABLE') }} </span>
		</q-item-label>

		<q-card flat class="bg-white">
			<q-card-section class="row q-col-gutter-sm">
				<div class="col-xs-12 col-sm-12 col-md-6">
					<q-item-label class="text-weight-bold">
						<span><q-icon name="fas fa-fire" size="xs" color="primary" class="q-mr-xs" /> {{ $t('LABELS.FHIR_RESOURCE') }} </span>
					</q-item-label>
					<q-separator spaced />
					<q-select outlined dense v-model="currentFHIRRes" :options="fhirResourceOptions" :label="$t('LABELS.FHIR_RESOURCE')"
					          @filter="filterFn" use-input input-debounce="0">
						<template v-slot:option="scope">
							<q-item v-bind="scope.itemProps" v-on="scope.itemEvents">
								<q-item-section avatar>
									<q-icon name="fas fa-fire" size="xs" />
								</q-item-section>
								<q-item-section>
									<q-item-label v-html="scope.opt" />
								</q-item-section>
							</q-item>
						</template>
					</q-select>
				</div>
				<div class="col-xs-12 col-sm-12 col-md-6">
					<q-item-label class="text-weight-bold">
						<span><q-icon name="far fa-file-alt" size="xs" color="primary" class="q-mr-xs" /> {{ $t('LABELS.PROFILES') }} </span>
					</q-item-label>
					<q-separator spaced />
					<q-select clearable outlined dense v-model="currentFHIRProf" :options="resourceProfileMappings[currentFHIRRes]" :label="$t('LABELS.PROFILES')" :disable="!this.resourceProfileMappings[this.currentFHIRRes] || !resourceProfileMappings[currentFHIRRes].length">
						<template v-slot:option="scope">
							<q-item v-bind="scope.itemProps" v-on="scope.itemEvents">
								<q-item-section avatar>
									<q-icon name="fas fa-file-alt" size="xs" />
								</q-item-section>
								<q-item-section>
									<q-item-label v-html="scope.opt" />
								</q-item-section>
							</q-item>
						</template>
					</q-select>
				</div>
			</q-card-section>
			<q-card-section>
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
									<div class="text-right col-1">
										<span class="text-white">{{attributeTypes.ID}}</span>
									</div>
									<div class="text-center col-2">
										<span class="text-white">{{attributeTypes.QUASI}}</span>
									</div>
									<div class="col-1">
										<span class="text-white">{{attributeTypes.SENSITIVE}}</span>
									</div>
									<div class="col-1">
										<span class="text-white">{{attributeTypes.INSENSITIVE}}</span>
									</div>
								</div>
								<q-scroll-area style="height: 50vh">
									<q-tree :nodes="fhirElementList"
									        ref="fhirTree"
									        node-key="value"
									        label-key="label"
									        :selected.sync="selectedStr"
									        :filter="filter"
									        :filter-method="filterTree"
									        :no-nodes-label="noNodesLabel"
									        :no-results-label="$t('LABELS.NO_RESULT')"
									        selected-color="primary"
									        @update:selected="onSelected"
									        default-expand-all
									>
										<template v-slot:default-header="prop">
											<div class="row items-center full-width bg-grey-1 q-pa-xs" >
												<div class="col">
													<q-icon :name="prop.node.children && prop.node.children.length ? 'account_tree' : 'lens'"
													        color="orange-5"
													        :size="prop.node.children && prop.node.children.length ? 'sm' : 'xs'"
													        class="q-mr-sm"
													/>
													<span>{{ prop.node.label }}
														<span v-if="prop.node.required" class="text-red text-weight-bold" style="font-size: 16px">
															{{ prop.node.required ? '*' : '' }}
															<q-tooltip v-if="prop.node.children.length" content-style="font-size: 12px" anchor="top right" self="top left">
																{{ $t('WARNING.MANDATORY_COMPLEX_TYPES') }}
															</q-tooltip>
														</span>
													</span>
												</div>
												<div class="text-center col-5">
													<span class="text-caption text-primary">{{ prop.node.type }}</span>
												</div>
												<div class="text-center col-1">
													<q-radio v-if="willBeDeidentified(prop.node)" v-model="tempParameterMappings[prop.key]" :val="attributeTypes.ID"
													         @input="onAttributeTypeSelected(prop.key, attributeTypes.ID)" :disable="prop.node.required" />
												</div>
												<div class="text-center col-2">
													<q-radio v-if="willBeDeidentified(prop.node)" v-model="tempParameterMappings[prop.key]" :val="attributeTypes.QUASI"
													         @input="onAttributeTypeSelected(prop.key, attributeTypes.QUASI)" />
												</div>
												<div class="col-1">
													<q-radio v-if="willBeDeidentified(prop.node)" v-model="tempParameterMappings[prop.key]" :val="attributeTypes.SENSITIVE"
													         @input="onAttributeTypeSelected(prop.key, attributeTypes.SENSITIVE)" />
												</div>
												<div class="col-1">
													<q-radio v-if="willBeDeidentified(prop.node)" v-model="tempParameterMappings[prop.key]" :val="attributeTypes.INSENSITIVE"
													         @input="onAttributeTypeSelected(prop.key, attributeTypes.INSENSITIVE)" />
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
												<span class="text-red">{{ selectedElem.required ? '*' : '' }}</span>
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
				</div>
			</q-card-section>
		</q-card>
	</div>
</template>

<script lang="ts">
import { Component, Vue, Watch } from 'vue-property-decorator'
import {environment} from '@/common/environment'
import {FHIRUtils} from '@/common/utils/fhir-util';
import {VuexStoreUtil as types} from '@/common/utils/vuex-store-util';

@Component
export default class FhirAttributeTable extends Vue {
    private attributeTypes = environment.attributeTypes;
    private splitterModel = 70;
    private loadingFhir: boolean = false;
    private selectedStr: string = '';
    private selectedElem: any = null;
    private filter: string = '';
    private fhirResourceOptions: string[] = [];
    private tempParameterMappings = JSON.parse(JSON.stringify(this.attributeMappings));
    private tempTypeMappings = JSON.parse(JSON.stringify(this.typeMappings));

    get fhirResourceList (): string[] { return this.$store.getters[types.Fhir.RESOURCE_LIST] }
    get fhirProfileList (): string[] { return this.$store.getters[types.Fhir.PROFILE_LIST].map(r => r.id) }

    get currentFHIRRes (): string { return this.$store.getters[types.Fhir.CURRENT_RESOURCE] }
    set currentFHIRRes (value) { this.$store.commit(types.Fhir.SET_CURRENT_RESOURCE, value) }

    get currentFHIRProf (): any { return this.$store.getters[types.Fhir.CURRENT_PROFILE] }
    set currentFHIRProf (value) { this.$store.commit(types.Fhir.SET_CURRENT_PROFILE, value) }

    get fhirElementList (): object[] { return this.$store.getters[types.Fhir.ELEMENT_LIST] }
    set fhirElementList (value) { this.$store.commit(types.Fhir.SET_ELEMENT_LIST, value) }

    get fhirElementListFlat (): any { return this.$store.getters[types.Fhir.ELEMENT_LIST_FLAT] }

    get attributeMappings (): any { return this.$store.getters[types.Fhir.ATTRIBUTE_MAPPINGS] }
    set attributeMappings (value) { this.$store.commit(types.Fhir.SET_ATTRIBUTE_MAPPINGS, value) }

    get parameterMappings (): any { return this.$store.getters[types.Fhir.PARAMETER_MAPPINGS] }
    set parameterMappings (value) { this.$store.commit(types.Fhir.SET_PARAMETER_MAPPINGS, value) }

    get typeMappings (): any { return this.$store.getters[types.Fhir.TYPE_MAPPINGS] }
    set typeMappings (value) { this.$store.commit(types.Fhir.SET_TYPE_MAPPINGS, value) }

    get resourceProfileMappings (): any { return this.$store.getters[types.Fhir.RESOURCE_PROFILE_MAPPINGS] }
    set resourceProfileMappings (value) { this.$store.commit(types.Fhir.SET_RESOURCE_PROFILE_MAPPINGS, value) }

    get noNodesLabel (): string { return this.$store.getters[types.Fhir.NO_NODES_AVAILABLE_LABEL] }
    set noNodesLabel (value) { this.$store.commit(types.Fhir.NO_NODES_AVAILABLE_LABEL, value) }

    created () {
        if (!this.currentFHIRRes && !this.noNodesLabel) {
            this.noNodesLabel = String(this.$t('LABELS.PLEASE_SELECT_A_RESOURCE'));
        }
        this.$store.dispatch(types.Fhir.GET_RESOURCES).then(res => {
            for (const resource of this.fhirResourceList) {
                this.$store.dispatch(types.Fhir.GET_PROFILES_BY_RES, resource).then(pro => {
                    this.resourceProfileMappings[JSON.parse(JSON.stringify(resource))] = JSON.parse(JSON.stringify(this.fhirProfileList));
                    this.$forceUpdate();
                });
            }
        });
    }

    @Watch('currentFHIRRes')
    onFHIRResourceChanged (): void {
        ([this.currentFHIRProf, this.selectedStr, this.fhirElementList, this.selectedElem] = ['', '', [], null]);
        this.loadingFhir = true;
        this.getElements();
    }

    @Watch('currentFHIRProf')
    onFHIRProfileChanged (): void {
        this.selectedElem = null;
        this.loadingFhir = true;
        this.getElements();
    }

    getElements () {
        this.$store.dispatch(types.Fhir.GET_ELEMENTS, !this.currentFHIRProf ? this.currentFHIRRes : this.currentFHIRProf)
            .then(response => {
                this.loadingFhir = false;
                this.tempParameterMappings = JSON.parse(JSON.stringify(this.attributeMappings));
                this.tempTypeMappings = JSON.parse(JSON.stringify(this.typeMappings));
                if (!response) {
                    this.noNodesLabel = String(this.$t('LABELS.NO_STRUCTURE_DEFINITION'))
                }
            })
    }

    filterFn (val, update) {
        if (val === '') {
            update(_ => this.fhirResourceOptions = this.fhirResourceList);
            return
        }
        update(_ => this.fhirResourceOptions = this.fhirResourceList.filter(v => v.toLowerCase().includes(val.toLowerCase())))
    }

    onAttributeTypeSelected (prop: string, val: string) {
        this.attributeMappings[prop] = val;
        if (val === this.attributeTypes.SENSITIVE) {
            this.parameterMappings[prop] = JSON.parse(JSON.stringify(environment.algorithms.SENSITIVE));
        } else if (val === this.attributeTypes.QUASI) {
            this.parameterMappings[prop] = JSON.parse(JSON.stringify(environment.algorithms.PASS_THROUGH));
        }
    }

    onSelected (target) {
        const filtered = this.fhirElementListFlat.filter(item => item.value === target);
        this.selectedElem = filtered.length ? filtered[0] : null
    }

    willBeDeidentified (node): boolean {
        return FHIRUtils.isPrimitive(node, this.typeMappings);
    }

    filterTree (node, filter) {
        const filt = filter.toLowerCase();
        return (node.label && node.label.toLowerCase().includes(filt)) ||
            (this.typeMappings[node.value] && this.typeMappings[node.value].toLowerCase().includes(filt));
    }

  }
</script>

<style lang="stylus">
	.customDropdownText {
		.q-field__native {
			color: #10a1df // Cannot import primary color
			font-size: smaller
			align-items: center
			justify-content: center
		}
	}
</style>

