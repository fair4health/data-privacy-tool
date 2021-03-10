<template>
	<div>
		<q-item-label class="text-weight-bold q-my-lg">
			<q-banner inline-actions rounded v-show="showBanner" class="bg-primary text-white">
				<q-icon name="fas fa-info" size="xs" class="q-mr-xs" />
				{{ $t('INFO.FHIR_ATTRIBUTE_TABLE') }}
				<template v-slot:action>
					<q-btn flat color="white" :label="$t('BUTTONS.OK')" @click="setShowBanner(false)" />
				</template>
			</q-banner>
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
					<q-select clearable outlined dense options-dense v-model="currentFHIRProf" :options="sortProfiles(resourceProfileMappings[currentFHIRRes])"
										:disable="!this.resourceProfileMappings[this.currentFHIRRes] || !resourceProfileMappings[currentFHIRRes].length"
										:option-label="item => item.split('/').pop()" :label="$t('LABELS.PROFILES')">
						<template v-slot:option="scope">
							<q-item v-bind="scope.itemProps" v-on="scope.itemEvents">
								<q-item-section avatar>
									<q-icon name="fas fa-file-alt" size="xs" />
								</q-item-section>
								<q-item-section>
									<q-item-label v-html="scope.opt.split('/').pop()" />
								</q-item-section>
							</q-item>
						</template>
					</q-select>
				</div>
			</q-card-section>
			<q-card-section>
				<div>
					<q-item class="q-px-xs">
							<q-item-section>
									<q-input borderless dense v-model="filter" :label="$t('LABELS.FILTER')">
											<template v-slot:prepend>
													<q-icon name="sort" />
											</template>
											<template v-slot:append>
													<q-icon v-if="filter" name="clear" class="cursor-pointer" @click="filter=''" />
											</template>
									</q-input>
							</q-item-section>
							<q-item-section side v-if="fhirElementList.length && recommendedAttributesMappings[currentFHIRRes]">
									<q-btn unelevated dense round icon="restore" color="primary" @click="resetRecommendations()" >
											<q-tooltip anchor="center left" self="center right"> {{ $t('TOOLTIPS.RESET_RECOMMENDED_ATTRIBUTES') }} </q-tooltip>
									</q-btn>
							</q-item-section>
					</q-item>
					<q-separator />
					<div class="splitter-div">
						<q-splitter v-model="splitterModel" :limits="[50, 100]">
							<!--Fhir Element Tree Part-->
							<template v-slot:before>
								<div class="row items-center full-width bg-primary q-pa-xs text-white">
									<div class="text-center col">
										{{ $t('TABLE.ATTRIBUTE') }}
										<q-tooltip v-if="splitterModel<100">{{$t('TABLE.ATTRIBUTE')}}</q-tooltip>
									</div>
									<div class="text-center col-4">
										{{ $t('TABLE.TYPE') }}
										<q-tooltip v-if="splitterModel<100">{{$t('TABLE.TYPE')}}</q-tooltip>
									</div>
									<div class="text-right col-1 ellipsis">
										{{attributeTypes.ID}}
										<q-tooltip v-if="splitterModel<100">{{attributeTypes.ID}}</q-tooltip>
									</div>
									<div class="text-center col-2 ellipsis">
										{{attributeTypes.QUASI}}
										<q-tooltip v-if="splitterModel<100">{{attributeTypes.QUASI}}</q-tooltip>
									</div>
									<div class="col-1 ellipsis">
										{{attributeTypes.SENSITIVE}}
										<q-tooltip v-if="splitterModel<100">{{attributeTypes.SENSITIVE}}</q-tooltip>
									</div>
									<div class="col-1 ellipsis">
										{{attributeTypes.INSENSITIVE}}
										<q-tooltip v-if="splitterModel<100">{{attributeTypes.INSENSITIVE}}</q-tooltip>
									</div>
								</div>
								<q-scroll-area class="overflow-hidden">
									<q-tree :nodes="fhirElementList"
									        ref="fhirTree"
									        node-key="value"
									        label-key="label"
									        :filter="filter"
									        :filter-method="filterTree"
									        :no-nodes-label="noNodesLabel"
									        :no-results-label="$t('LABELS.NO_RESULT')"
									        selected-color="primary"
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
													<span class="fhir-element-text" v-bind:class="{'text-primary': selectedStr === prop.node.value}"
																@click="onSelected(prop.node.value)">
														{{ prop.node.label }}
														<span v-if="prop.node.required" class="text-red text-weight-bold text-size-xxxl">
															{{ prop.node.required ? '*' : '' }}
															<q-tooltip v-if="prop.node.children.length" content-class="text-size-md" anchor="top right" self="top left">
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
													         @input="onAttributeTypeSelected(prop, attributeTypes.ID)" :disable="prop.node.required" />
												</div>
												<div class="text-center col-2">
													<q-radio v-if="willBeDeidentified(prop.node)" v-model="tempParameterMappings[prop.key]" :val="attributeTypes.QUASI"
													         @input="onAttributeTypeSelected(prop, attributeTypes.QUASI)" />
												</div>
												<div class="col-1">
													<q-radio v-if="willBeDeidentified(prop.node)" v-model="tempParameterMappings[prop.key]" :val="attributeTypes.SENSITIVE"
													         @input="onAttributeTypeSelected(prop, attributeTypes.SENSITIVE)" />
												</div>
												<div class="col-1">
													<q-radio v-if="willBeDeidentified(prop.node)" v-model="tempParameterMappings[prop.key]" :val="attributeTypes.INSENSITIVE"
													         @input="onAttributeTypeSelected(prop, attributeTypes.INSENSITIVE)" />
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
										<span class="text-red">{{ selectedElem.required ? '*' : '' }}</span>
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
    private splitterModel = 100;
    private loadingFhir: boolean = false;
    private selectedStr: string = '';
    private selectedElem: any = null;
    private filter: string = '';
    private fhirResourceOptions: string[] = [];
    private tempParameterMappings = JSON.parse(JSON.stringify(this.attributeMappings));
    private tempTypeMappings = JSON.parse(JSON.stringify(this.typeMappings));
    private showBanner: boolean = true;

    get fhirResourceList (): string[] { return this.$store.getters[types.Fhir.RESOURCE_LIST] }
    get fhirProfileList (): string[] { return this.$store.getters[types.Fhir.PROFILE_LIST].map(r => r.url) }

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
    set noNodesLabel (value) { this.$store.commit(types.Fhir.SET_NO_NODES_AVAILABLE_LABEL, value) }

    get recommendedAttributesMappings (): any { return this.$store.getters[types.Fhir.RECOMMENDED_ATTRIBUTES_MAPPINGS] }
    set recommendedAttributesMappings (value) { this.$store.commit(types.Fhir.SET_RECOMMENDED_ATTRIBUTES_MAPPINGS, value) }

    created () {
        if (!this.currentFHIRRes && !this.noNodesLabel) {
            this.noNodesLabel = String(this.$t('LABELS.PLEASE_SELECT_A_RESOURCE'));
        }
        this.$store.dispatch(types.Fhir.GET_RESOURCES).then(res => {
            for (const resourceType of this.fhirResourceList) {
                this.$store.dispatch(types.Fhir.GET_PROFILES_BY_RES, resourceType).then(pro => {
                    this.resourceProfileMappings[resourceType] = JSON.parse(JSON.stringify(this.fhirProfileList));
                    this.$forceUpdate();
                }).catch(err => {
                    this.$notify.error(String(this.$t('ERROR.X_RESOURCE_ELEMENTS_COULDNT_BE_LOADED', {resource: resourceType})))
                });
            }
        }).catch(err => {
            this.$notify.error(String(this.$t('ERROR.ST_WRONG_FETCHING_X', {name: 'resources'})))
        });

        // Set showBanner
        if (sessionStorage.getItem('showBannerFhirAttribute')) {
            this.showBanner = sessionStorage.getItem('showBannerFhirAttribute') === 'true';
        } else {
            this.showBanner = true;
        }
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

    setShowBanner (value: boolean) {
            sessionStorage.setItem('showBannerFhirAttribute', String(value))
            this.showBanner = value
    }

    getElements () {
        const params = {parameterName: '', profile: ''};
        if (this.currentFHIRProf) {
            params.parameterName = 'url';
            params.profile = this.currentFHIRProf;
        } else {
            params.parameterName = '_id';
            params.profile = this.currentFHIRRes;
        }
        this.$store.dispatch(types.Fhir.GET_ELEMENTS, params)
            .then(response => {
                this.loadingFhir = false;
                this.tempParameterMappings = JSON.parse(JSON.stringify(this.attributeMappings));
                this.tempTypeMappings = JSON.parse(JSON.stringify(this.typeMappings));
                if (!response) {
                    this.noNodesLabel = String(this.$t('LABELS.NO_STRUCTURE_DEFINITION'))
                }
            })
            .catch(() => {
                this.loadingFhir = false;
                if (!this.currentFHIRProf) {
                    this.$notify.error(String(this.$t('ERROR.X_RESOURCE_ELEMENTS_COULDNT_BE_LOADED', {resource: this.currentFHIRRes})));
                } else {
                    this.$notify.error(String(this.$t('ERROR.X_PROFILE_ELEMENTS_COULDNT_BE_LOADED', {profile: this.currentFHIRProf})));
                }
            })
    }

    resetRecommendations () {
        this.$store.dispatch(types.Fhir.RESET_RECOMMENDATIONS, this.currentFHIRRes).then(() => {
            this.$parent['fhirAttributeTableKey']++; // in order to re-render attribute table
            this.$notify.success(String(this.$t('SUCCESS.RECOMMENDATIONS_RESETTED')))
        }).catch(err => {
            this.$notify.error(String(this.$t('ERROR.RECOMMENDATIONS_NOT_RESETTED')));
        });
    }

    filterFn (val, update) {
        if (val === '') {
            update(_ => this.fhirResourceOptions = this.fhirResourceList);
            return
        }
        update(_ => this.fhirResourceOptions = this.fhirResourceList.filter(v => v.toLowerCase().includes(val.toLowerCase())))
    }

    onAttributeTypeSelected (prop, val: string) {
        const splitted = prop.key.split('.');
        const word = splitted[splitted.length - 1];
        this.attributeMappings[prop.key] = val;
        if (val === this.attributeTypes.SENSITIVE) {
            this.parameterMappings[prop.key] = FHIRUtils.recommendedAlgorithm(word, prop.node.type, prop.node.required, false)
        } else if (val === this.attributeTypes.QUASI) {
            this.parameterMappings[prop.key] = FHIRUtils.recommendedAlgorithm(word, prop.node.type, prop.node.required, true)
        }
    }

    onSelected (target) {
        if (target) this.splitterModel = 50;
        else this.splitterModel = 100;
        this.selectedStr = target;
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

    sortProfiles (profiles: string[]) {
        return FHIRUtils.sortProfiles(profiles)
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

