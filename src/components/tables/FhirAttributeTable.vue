<template>
	<div class="splitter-slot">
		<q-item-label class="text-weight-bold q-mt-lg q-mb-lg">
      <span class="text-info"><q-icon name="fas fa-info" size="xs" class="q-mr-xs" /> Remove attributes that will be
      excluded from de-identified data. Select types of attributes from privacy point of view. </span>
		</q-item-label>

		<q-card flat class="bg-white">
			<q-card-section class="row q-col-gutter-sm">
				<div class="col-xs-12 col-sm-12 col-md-6">
					<q-item-label class="text-weight-bold">
						<span><q-icon name="fas fa-fire" size="xs" color="primary" class="q-mr-xs" /> FHIR Resource</span>
					</q-item-label>
					<q-separator spaced />
					<q-select outlined dense v-model="currentFHIRRes" :options="fhirResourceOptions" label="FHIR Resource"
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
						<span><q-icon name="far fa-file-alt" size="xs" color="primary" class="q-mr-xs" /> Profiles</span>
					</q-item-label>
					<q-separator spaced />
					<q-select outlined dense v-model="currentFHIRProf" :options="resources[currentFHIRRes]" label="Profiles" :disable="!this.resources[this.currentFHIRRes] || !resources[currentFHIRRes].length">
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
									<div class="text-right col-1">
										<span class="text-white">{{attributeTypes.ID}}</span>
									</div>
									<div class="text-center col-2">
										<span class="text-white">{{attributeTypes.QUASI}}</span>
									</div>
									<div class="col-1">
										<span class="text-white">{{attributeTypes.SENSITIVE}}</span>
									</div>
								</div>
								<q-scroll-area style="height: 50vh">
									<q-tree :nodes="fhirElementList"
									        ref="fhirTree"
									        node-key="value"
									        label-key="label"
									        tick-strategy="strict"
									        :ticked.sync="tickedFHIRAttr"
									        :selected.sync="selectedStr"
									        :expanded.sync="expanded"
									        :filter="filter"
									        no-nodes-label="Please select a resource"
									        no-results-label="No result found"
									        selected-color="primary"
									        @update:selected="onSelected"
									        default-expand-all
									>
										<template v-slot:default-header="prop">
											<div class="row items-center full-width bg-grey-1 q-pa-xs" :disabled="!willBeDeidentified(prop.key)">
												<div class="col">
													<q-icon :name="prop.node.children && prop.node.children.length ? 'account_tree' : 'lens'"
													        color="orange-5"
													        :size="prop.node.children && prop.node.children.length ? 'sm' : 'xs'"
													        class="q-mr-sm"
													/>
													<span>{{ prop.node.label }}</span>
												</div>
												<div class="text-center col-5">
													<span v-if="prop.node.type" class="text-caption text-primary">{{ prop.node.type.join(', ') }}</span>
												</div>
												<div class="text-center col-1">
													<q-radio v-model="attributeMappings[prop.key]" :val="attributeTypes.ID"
													         @input="onAttributeTypeSelected(prop.key, attributeTypes.ID)" :disable="!willBeDeidentified(prop.key)" />
												</div>
												<div class="text-center col-2">
													<q-radio v-model="attributeMappings[prop.key]" :val="attributeTypes.QUASI"
													         @input="onAttributeTypeSelected(prop.key, attributeTypes.QUASI)" :disable="!willBeDeidentified(prop.key)" />
												</div>
												<div class="col-1">
													<q-radio v-model="attributeMappings[prop.key]" :val="attributeTypes.SENSITIVE"
													         @input="onAttributeTypeSelected(prop.key, attributeTypes.SENSITIVE)" :disable="!willBeDeidentified(prop.key)" />
												</div>
											</div>
										</template>
										<template v-slot:default-body="prop">
											<div v-if="prop.node.type && prop.node.type.length>1">
												<q-list dense bordered class="q-ma-sm">
													<q-item v-for="(type, index) in prop.node.type" :key="index">
														<q-radio v-model="prop.node.selectedType" class="text-grey-8" :val="type" :label="type" size="xs" />
													</q-item>
													<q-separator />
													<q-item>
														<q-btn flat label="Save" color="primary" @click="fhirElementList=fhirElementList" :disabled="prop.node.selectedType===''" />
														<q-space />
														<q-btn flat label="Clear" color="red-6" @click="prop.node.selectedType=''" :disabled="prop.node.selectedType===''" />
													</q-item>
												</q-list>
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
				</div>
			</q-card-section>
		</q-card>
	</div>
</template>

<script lang="ts">
  import { Component, Vue, Watch } from 'vue-property-decorator'

  @Component
  export default class FhirAttributeTable extends Vue {
    private attributeTypes = {
      ID: 'Identifier',
      QUASI: 'Quasi-identifier',
      SENSITIVE: 'Sensitive',
    };
    private splitterModel = 70;
    private loadingFhir: boolean = false;
    private selectedStr: string = '';
    private selectedElem: any = null;
    private expanded: string[] = [];
    private filter: string = '';
    private fhirResourceOptions: string[] = [];
    private resources = {};

    get fhirResourceList (): string[] { return this.$store.getters['fhir/selectedResources'] }
    get fhirProfileList (): string[] { return this.$store.getters['fhir/selectedProfiles'] }
    set fhirProfileList (value) { this.$store.commit('fhir/setSelectedProfiles', value) }
    get allfhirProfilesList (): string[] { return this.$store.getters['fhir/profileList'].map(r => r.id) }

    get currentFHIRRes (): string { return this.$store.getters['fhir/currentResource'] }
    set currentFHIRRes (value) { this.$store.commit('fhir/setCurrentResource', value) }

    get currentFHIRProf (): string { return this.$store.getters['fhir/currentProfile'] }
    set currentFHIRProf (value) { this.$store.commit('fhir/setCurrentProfile', value) }

    get fhirElementList (): object[] { return this.$store.getters['fhir/elementList'] }
    set fhirElementList (value) { this.$store.commit('fhir/setElementList', value) }

    get fhirElementListFlat (): any { return this.$store.getters['fhir/elementListFlat'] }

    get tickedFHIRAttr (): any { return this.$store.getters['fhir/selectedElements'] }
    set tickedFHIRAttr (value) { this.$store.commit('fhir/setSelectedElements', value) }

    get attributeMappings (): any { return this.$store.getters['fhir/attributeMappings'] }
    set attributeMappings (value) { this.$store.commit('fhir/setAttributeMappings', value) }

    created () {
      for (const resource of this.fhirResourceList) {
        this.$store.dispatch('fhir/getProfilesByRes', resource).then(pro => {
          const availableProfiles = this.allfhirProfilesList.filter(profile => this.fhirProfileList.indexOf(profile) !== -1);
          this.resources[JSON.parse(JSON.stringify(resource))] = JSON.parse(JSON.stringify(availableProfiles));
          this.$forceUpdate();
        });
      }
    }

    @Watch('currentFHIRRes')
    onFHIRResourceChanged (): void {
      ([this.currentFHIRProf, this.selectedStr, this.fhirElementList] = ['', '', []]);
      this.loadingFhir = true;
      this.$store.dispatch('fhir/getProfilesByRes', this.currentFHIRRes)
        .then(result => {
          if (result) {
            this.loadingFhir = false;
            this.currentFHIRProf = (this.resources[this.currentFHIRRes] && this.resources[this.currentFHIRRes].length) ? this.resources[this.currentFHIRRes][0] : '';
            // Fetch elements of base resources
            if (!this.currentFHIRProf) {
              this.$store.dispatch('fhir/getElements', this.currentFHIRRes)
                .then(() => this.loadingFhir = false )
                .catch(err => {
                  this.loadingFhir = false;
                  throw err
                })
            }
          }
        })
        .catch(err => {
          this.loadingFhir = false;
          throw err
        })
    }

    @Watch('currentFHIRProf')
    onFHIRProfileChanged (newVal: any): void {
      if (newVal) {
        ([this.selectedElem, this.expanded] = [null, [this.currentFHIRRes]]);
        this.loadingFhir = true;
        this.$store.dispatch('fhir/getElements', this.currentFHIRProf)
          .then(() => {
            this.loadingFhir = false
          })
          .catch(err => {
            this.loadingFhir = false;
            throw err
          })
      }
    }

    filterFn (val, update) {
      if (val === '') {
        update(_ => this.fhirResourceOptions = this.fhirResourceList);
        return
      }
      update(_ => this.fhirResourceOptions = this.fhirResourceList.filter(v => v.toLowerCase().indexOf(val.toLowerCase()) > -1))
    }

    onAttributeTypeSelected (prop: string, val: string) {
      this.attributeMappings[prop] = val;
    }

    onSelected (target) {
      const filtered = this.fhirElementListFlat.filter(item => item.value === target);
      this.selectedElem = filtered.length ? filtered[0] : null
    }

    willBeDeidentified(attribute: string): boolean {
      return this.tickedFHIRAttr.indexOf(attribute) !== -1;
    }

  }
</script>

