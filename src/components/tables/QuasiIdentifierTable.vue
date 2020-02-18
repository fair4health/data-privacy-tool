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
						<div class="text-center col-6">
							<span class="text-white">De-identification Algorithm</span>
						</div>
					</div>
					<q-scroll-area style="height: 50vh">
						<q-tree :nodes="quasiElementList"
						        ref="quasiTree"
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
									<div class="text-center col-5">
										<q-select v-if="parameterMappings[prop.key]" outlined dense @input="$forceUpdate()"
										          v-model="parameterMappings[prop.key].name" :options="algorithms"
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
										<q-btn v-if="parameterMappings[prop.key] && parameterMappings[prop.key].name &&
													(parameterMappings[prop.key].name !== envAlgorithms.PASS_THROUGH.name) &&
													(parameterMappings[prop.key].name !== envAlgorithms.REDACTION.name)"
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
import {environment} from '@/common/environment'
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
export default class QuasiIdentifierTable extends Vue {
    private splitterModel = 70;
    private configDialog: boolean = false;
    private selectedStr: string = '';
    private selectedElem: any = null;
    private filter: string = '';
    private envAlgorithms = environment.algorithms;
    private algorithms = Object.keys(environment.algorithms).filter(key => key !== 'SENSITIVE').map(key => environment.algorithms[key].name);

    get currentFHIRRes (): string { return this.$store.getters['fhir/currentResource'] }
    set currentFHIRRes (value) { this.$store.commit('fhir/setCurrentResource', value) }

    get currentFHIRProf (): string { return this.$store.getters['fhir/currentProfile'] }
    set currentFHIRProf (value) { this.$store.commit('fhir/setCurrentProfile', value) }

    get currentAttribute (): string { return this.$store.getters['fhir/currentAttribute'] }
    set currentAttribute (value) { this.$store.commit('fhir/setCurrentAttribute', value) }

    get currentNode (): any { return this.$store.getters['fhir/currentNode'] }
    set currentNode (value) { this.$store.commit('fhir/setCurrentNode', value) }

    get fhirElementListFlat (): any { return this.$store.getters['fhir/elementListFlat'] }
    get quasiElementList (): object[] { return this.$store.getters['fhir/quasiElementList'] }

    get attributeMappings (): any { return this.$store.getters['fhir/attributeMappings'] }
    set attributeMappings (value) { this.$store.commit('fhir/setAttributeMappings', value) }

    get parameterMappings (): any { return this.$store.getters['fhir/parameterMappings'] }
    set parameterMappings (value) { this.$store.commit('fhir/setParameterMappings', value) }

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

    configureAlgorithm (node: fhir.ElementTree) {
        this.currentNode = node;
        const attribute = node.value ? node.value : '';
        this.currentAttribute = attribute;
        const algorithm: any = Object.keys(environment.algorithms).find(key => environment.algorithms[key].name === this.parameterMappings[attribute].name);
        Object.keys(environment.algorithms[algorithm]).forEach(key => {
            if (!this.parameterMappings[attribute][key]) {
                this.parameterMappings[attribute][key] = JSON.parse(JSON.stringify(environment.algorithms[algorithm][key]))
            }
        });
        this.configDialog = true;
    }

    onSelected (target) {
        const filtered = this.fhirElementListFlat.filter(item => item.value === target);
        this.selectedElem = filtered.length ? filtered[0] : null
    }

    filterPossibleAlgorithms (opt, node): boolean {
        if (node.required && opt === environment.algorithms.REDACTION.name) {
            return true;
        } else if (node.selectedType !== 'date' && node.selectedType !== 'dateTime' && node.selectedType !== 'time' &&
                    node.selectedType !== 'instant' && opt === environment.algorithms.DATE_SHIFTING.name) {
            return true;
        }
        return false;
    }

}
</script>
