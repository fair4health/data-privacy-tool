<template>
	<div>
		<q-item-section class="q-px-xs">
		<q-input borderless dense v-model="filter" label="Filter">
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
							<span class="text-white">Attribute</span>
						</div>
						<div class="text-center col-4">
							<span class="text-white">Type</span>
						</div>
						<div class="text-center col-2">
							<span class="text-white">Is Rare?</span>
						</div>
						<div class="text-center col-2">
							<span class="text-white">L-diversity (l)</span>
						</div>
						<div class="text-center col-2">
							<span class="text-white">T-closeness (t)</span>
						</div>
					</div>
					<q-scroll-area style="height: 50vh">
						<q-tree :nodes="sensitiveElementList"
						        ref="sensTree"
						        node-key="value"
						        label-key="label"
						        :selected.sync="selectedStr"
						        :filter="filter"
						        no-nodes-label="Please select a resource"
						        no-results-label="No result found"
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
										<span class="text-caption text-primary">{{ prop.node.selectedType }}</span>
									</div>
									<div class="text-center col-1">
										<q-checkbox v-if="parameterMappings[prop.key]" v-model="rareElements"
										            :val="prop.key" @input="setRareness(prop.key)" />
									</div>
									<div class="col-1">
										<q-btn v-if="parameterMappings[prop.key] && parameterMappings[prop.key].isRare && attributeMappings[prop.key]"
										       unelevated
										       color="accent"
										       text-color="white"
										       @click="configureAlgorithm(prop.node)"
										       icon="fas fa-cog"
										/>
									</div>
									<div class="row justify-center items-center col-2">
										<q-input v-if="parameterMappings[prop.key]"
											v-model.number="parameterMappings[prop.key].l_diversity"
											type="number"
											outlined
											dense
											style="max-width: 60px"
											:disable="parameterMappings[prop.key].isRare"
										/>
									</div>
									<div class="row justify-center items-center col-2">
										<q-input v-if="parameterMappings[prop.key]"
											v-model.number="parameterMappings[prop.key].t_closeness"
											type="number"
											outlined
											dense
									        style="max-width: 100px"
											:disable="parameterMappings[prop.key].isRare"
										/>
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
										<div class="text-h6">Short</div>
										<q-separator spaced />
										<div class="text-grey-10">{{ selectedElem.short }}</div>
									</q-card-section>
								</q-card>
								<q-card flat bordered v-if="selectedElem.definition">
									<q-card-section>
										<div class="text-h6">Definition</div>
										<q-separator spaced />
										<div class="text-grey-10">{{ selectedElem.definition }}</div>
									</q-card-section>
								</q-card>
								<q-card flat bordered v-if="selectedElem.comment">
									<q-card-section>
										<div class="text-h6">Comments</div>
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

    get currentFHIRRes (): string { return this.$store.getters['fhir/currentResource'] }
    set currentFHIRRes (value) { this.$store.commit('fhir/setCurrentResource', value) }

    get currentFHIRProf (): string { return this.$store.getters['fhir/currentProfile'] }
    set currentFHIRProf (value) { this.$store.commit('fhir/setCurrentProfile', value) }

    get currentAttribute (): string { return this.$store.getters['fhir/currentAttribute'] }
    set currentAttribute (value) { this.$store.commit('fhir/setCurrentAttribute', value) }

    get currentNode (): any { return this.$store.getters['fhir/currentNode'] }
    set currentNode (value) { this.$store.commit('fhir/setCurrentNode', value) }

    get fhirElementListFlat (): any { return this.$store.getters['fhir/elementListFlat'] }
    get sensitiveElementList (): object[] { return this.$store.getters['fhir/sensitiveElementList'] }

    get attributeMappings (): any { return this.$store.getters['fhir/attributeMappings'] }
    set attributeMappings (value) { this.$store.commit('fhir/setAttributeMappings', value) }

    get parameterMappings (): any { return this.$store.getters['fhir/parameterMappings'] }
    set parameterMappings (value) { this.$store.commit('fhir/setParameterMappings', value) }

    get rareElements (): any { return this.$store.getters['fhir/rareElements'] }
    set rareElements (value) { this.$store.commit('fhir/setRareElements', value) }

	@Watch('currentFHIRRes')
	onFHIRResourceChanged (): void {
		([this.currentFHIRProf, this.selectedStr] = ['', '']);
	}

	@Watch('currentFHIRProf')
	onFHIRProfileChanged (newVal: any): void {
		if (newVal) {
			this.selectedElem = null;
		}
	}

    configureAlgorithm(node: fhir.ElementTree) {
        this.currentNode = node;
        let attribute = node.value ? node.value : '';
        this.currentAttribute = attribute;
        this.configDialog = true;
    }

    onSelected (target) {
		const filtered = this.fhirElementListFlat.filter(item => item.value === target);
		this.selectedElem = filtered.length ? filtered[0] : null
    }

    setRareness(attribute: string) {
        this.parameterMappings[attribute].isRare = this.rareElements.indexOf(attribute) !== -1;
    }

}
</script>
