<template>
	<div>
		<q-toolbar class="bg-grey-4">
			<q-toolbar-title class="text-grey-8">
				De-identifier
			</q-toolbar-title>
		</q-toolbar>

		<div class="q-ma-sm">
			<q-item-label class="text-weight-bold q-mt-lg q-mb-lg">
				<span class="text-info"><q-icon name="fas fa-info" size="xs" class="q-mr-xs" /> Risk is calculated according to different models. </span>
			</q-item-label>
			<q-card flat bordered class="q-ma-sm">
				<q-card-section>
					<q-table flat binary-state-sort title="Resources" :data="mappingList" :columns="columns" row-key="resource"
					         :rows-per-page-options="[0]" :pagination.sync="pagination" class="sticky-header-table"
					         table-style="max-height: 60vh" :loading="loading" color="primary"
					>
						<template v-slot:header-cell="props">
							<q-th :props="props" class="bg-primary text-white" style="font-size: 15px">
								<q-icon v-if="props.col.icon" :class="props.col.icon" />
								<span class="vertical-middle q-ml-xs">{{ props.col.label }}</span>
							</q-th>
						</template>
						<template v-slot:body="props">
							<q-tr :props="props">
								<q-td key="status" class="no-padding" :props="props">
									<template v-if="props.row.status === 'in-progress' || props.row.status === 'loading'">
										<span>
											<q-spinner color="grey-9" />
											<q-tooltip v-if="props.row.status === 'in-progress'" content-class="bg-white text-grey-8">De-identifying...</q-tooltip>
											<q-tooltip v-if="props.row.status === 'loading'" content-class="bg-white text-grey-8">Loading...</q-tooltip>
										</span>
									</template>
									<template v-else-if="props.row.status === 'done'">
										<div class="row items-center">
											<div class="col-6">
												<q-icon name="check" color="green">
													<q-tooltip content-class="bg-white text-green">Completed</q-tooltip>
												</q-icon>
											</div>
<!--												<div class="col-6 bg-grey-3">-->
<!--													<q-btn flat dense icon="feedback" color="grey-8" label="Details" size="sm"-->
<!--													       @click="openOutcomeDetailCard(props.row.validation.outcomeDetails)" no-caps />-->
<!--												</div>-->
										</div>
									</template>
									<template v-else-if="props.row.status === 'warning'">
										<div class="row items-center">
											<div class="col-6">
												<q-icon name="warning" color="orange-6">
													<q-tooltip content-class="bg-white text-orange-6">Warning</q-tooltip>
												</q-icon>
											</div>
											<div class="col-6 bg-grey-3">
<!--													<q-btn flat dense icon="feedback" color="grey-8" label="Details" size="sm"-->
<!--													       @click="openOutcomeDetailCard(props.row.validation.outcomeDetails)" no-caps />-->
											</div>
										</div>
									</template>
<!--										<template v-else-if="props.row.validation.status === 'error'">-->
<!--											<q-icon name="error_outline" color="red" class="cursor-pointer"-->
<!--											        @click="openOutcomeDetailCard([{status: 'error', message: props.row.description, resourceType: 'OperationOutcome'}])">-->
<!--&lt;!&ndash;												<q-tooltip content-class="error-tooltip bg-white text-red-7" class="ellipsis-3-lines">{{ props.row.validation.description }}</q-tooltip>&ndash;&gt;-->
<!--											</q-icon>-->
<!--										</template>-->
									<template v-else>
										<q-icon name="access_time" color="grey-9">
											<q-tooltip content-class="bg-white text-grey-8">Pending</q-tooltip>
										</q-icon>
									</template>
								</q-td>
								<q-td key="resource" :props="props">
									<q-btn dense round flat size="sm" :icon="props.expand ? 'arrow_drop_up' : 'arrow_drop_down'" @click="props.expand = !props.expand" />
									{{ props.row.resource }}
								</q-td>
								<q-td key="count" :props="props">
									<q-chip square class="bg-orange-6 text-white">
										<q-spinner v-if="props.row.status === 'loading'" color="white" />
										<template v-else>{{ props.row.count }}</template>
									</q-chip>
								</q-td>
								<q-td key="final" :props="props">
									<q-chip square class="bg-secondary text-white">
										<q-spinner v-if="props.row.status === 'in-progress'" color="white" />
										<template v-else-if="props.row.status === 'done'">{{ props.row.entries.length }}</template>
										<template v-else>-</template>
									</q-chip>
								</q-td>
							</q-tr>
							<q-tr v-show="props.expand" :props="props">
								<q-td colspan="100%" class="bg-grey-2">
									<q-card flat bordered class="q-ml-md q-mr-md q-mt-sm q-mb-sm">
										<q-item>
											<q-item-section avatar>
												<q-avatar>
													<q-icon name="mdi-chart-bar" />
												</q-avatar>
											</q-item-section>
											<q-item-section>
												<q-item-label>Risks</q-item-label>
											</q-item-section>
										</q-item>
										<q-separator />
										<q-card-section class="text-subtitle1">
											<q-list v-if="deidentificationStatus === 'success'">
												<q-item v-for="(riskey, index) in Object.keys(props.row.risks)" :key="index">
													<div class="col-2">
														<q-item-label class="text-weight-bold text-primary q-mt-sm">
															{{riskLabel(riskey)}}
														</q-item-label>
													</div>
													<div class="col-3">
														<q-linear-progress rounded size="30px" :value="props.row.risks[riskey]" color="primary">
															<div class="absolute-full flex flex-center">
																<q-badge text-color="white">
																	{{progressLabel(props.row.risks[riskey])}} <q-icon size="10px" class="q-ml-xs" name="fas fa-percent" color="white" />
																</q-badge>
															</div>
														</q-linear-progress>
													</div>
													<div class="col-6 text-grey-8 q-mt-xs q-ml-xl">
														{{getRiskInfo(riskey)}}
													</div>
												</q-item>
											</q-list>
											<div v-else class="text-grey-7">
												Risks will be calculated after de-identification is completed.
											</div>
										</q-card-section>
									</q-card>
								</q-td>
							</q-tr>
						</template>
					</q-table>
					<div class="row content-end q-gutter-sm">
						<q-space />
						<q-btn v-if="deidentificationStatus==='success'" label="Save" color="secondary" icon="save"
						       class="q-mt-lg" @click="saveDialog = true" no-caps />
						<q-btn outline color="primary" @click="deidentifyAll" class="q-mt-lg"
						       :disable="deidentificationStatus === 'in-progress' || deidentificationStatus === 'loading'
						       || !Object.keys(deidentificationResults).length || deidentificationStatus === 'success'" no-caps>
							<span v-if="deidentificationStatus !== 'pending'" class="q-mr-sm">
								<q-spinner size="xs" v-show="deidentificationStatus === 'in-progress' || deidentificationStatus === 'loading'" />
								<q-icon name="check" size="xs" color="green" v-show="deidentificationStatus === 'success'" />
								<q-icon name="error_outline" size="xs" color="red" v-show="deidentificationStatus === 'error'" />
							</span>
							<span>De-identify</span>
						</q-btn>
					</div>

				</q-card-section>
			</q-card>

			<div class="row q-ma-md">
				<q-btn unelevated label="Back" color="primary" icon="chevron_left" @click="$store.commit('decrementStep')" no-caps />
			</div>
		</div>

		<q-dialog v-model="saveDialog">
			<q-card>
				<q-card-section class="row items-center q-pb-none text-primary">
					<div class="text-h5">Save Anonymized Data</div>
					<q-space />
					<q-btn icon="close" flat round dense v-close-popup />
				</q-card-section>
				<q-card-section v-if="saving">
					<div v-if="loading" class="q-mt-xl">
						<div class="q-mt-xl q-mb-xl row justify-center">
							<div class="spinner-comp flex flex-center"></div>
						</div>
						<div class="row justify-center">
							<span class="text-grey-8" style="font-size: 14px">Saving resources...</span>
						</div>
					</div>
					<div v-if="!loading" class="q-ma-sm">
						<div class="q-mb-lg row justify-center">
							<transition appear enter-active-class="animated heartBeat">
								<q-icon size="100px" class="mdi mdi-database-check" color="primary"></q-icon>
							</transition>
						</div>
						<div class="row justify-center">
                            <span class="text-grey-8" style="font-size: 14px">
                                {{savedResourceNumber}} resources are saved.
                            </span>
						</div>
					</div>
				</q-card-section>
				<q-card-actions v-if="saving && !loading" align="around">
					<q-space />
					<q-btn flat label="Return Home" icon-right="home" color="primary" @click="$store.commit('resetStep') + $router.push('/')" no-caps />
				</q-card-actions>
				<q-card-actions v-if="!saving" align="around">
					<!-- TODO remove POST option -->
					<q-btn class="q-ma-md" unelevated label="Overwrite Existing Data" color="primary" icon-right="swap_horiz" @click="saveToRepository('PUT')" no-caps />
					<q-space />
					<q-btn class="q-ma-md" unelevated label="Save As New Data" color="primary" icon-right="save" @click="saveToRepository('POST')" no-caps />
				</q-card-actions>
			</q-card>
		</q-dialog>
	</div>
</template>

<script lang="ts">
import {Component, Vue, Watch} from 'vue-property-decorator';
import {environment} from '@/common/environment';
import {DeidentificationService} from '@/common/services/deidentification.service';
import {Utils} from '@/common/utils/util';

@Component
export default class Deidentifier extends Vue {
    private saveDialog: boolean = false;
    private willBeAnonyed: string[] = [];
    private groupedByProfiles: string[] = [];
    private deidentificationService: DeidentificationService = new DeidentificationService(this.typeMappings,
        this.parameterMappings, this.rareValueMappings, this.requiredElements);

    private pagination = { page: 1, rowsPerPage: 0 };
    private loading: boolean = false;
    private saving: boolean = false;
    private savedResourceNumber: number = 0;
    private columns = [
        { name: 'status', align: 'center', label: 'Status', field: 'status', icon: 'fas fa-info-circle', classes: 'bg-grey-2' },
        { name: 'resource', align: 'left', label: 'Resource Type', field: 'resource', icon: 'fas fa-fire', sortable: true },
        { name: 'count', align: 'left', label: 'Count', field: 'count', icon: 'fas fa-calculator', sortable: true },
        { name: 'final', align: 'left', label: 'Final Count', field: 'final', icon: 'mdi mdi-shield-check', sortable: true },
    ];
    private deidentificationStatus: status = 'loading';
    private mappingList: any[] = [];

    get attributeMappings (): any { return this.$store.getters['fhir/attributeMappings'] }
    set attributeMappings (value) { this.$store.commit('fhir/setAttributeMappings', value) }

    get parameterMappings (): any { return this.$store.getters['fhir/parameterMappings'] }
    set parameterMappings (value) { this.$store.commit('fhir/setParameterMappings', value) }

    get typeMappings (): any { return this.$store.getters['fhir/typeMappings'] }
    get rareValueMappings (): any { return this.$store.getters['fhir/rareValueMappings'] }
    get requiredElements (): any { return this.$store.getters['fhir/requiredElements'] }

    get kAnonymityValidMappings (): any { return this.$store.getters['fhir/kAnonymityValidMappings'] }
    set kAnonymityValidMappings (value) { this.$store.commit('fhir/setKAnonymityValidMappings', value) }
    get kValueMappings (): any { return this.$store.getters['fhir/kValueMappings'] }
    set kValueMappings (value) { this.$store.commit('fhir/setKValueMappings', value) }

    get deidentificationResults (): any { return this.$store.getters['fhir/deidentificationResults'] }
    set deidentificationResults (value) { this.$store.commit('fhir/setDeidentificationResults', value) }

    get profileUrlMappings (): any { return this.$store.getters['fhir/profileUrlMappings'] }
    set profileUrlMappings (value) { this.$store.commit('fhir/setProfileUrlMappings', value) }

    created () {
        Object.keys(this.attributeMappings).forEach(key => {
            if (this.attributeMappings[key] !== environment.attributeTypes.INSENSITIVE) {
                this.willBeAnonyed.push(key);
            }
        });
        if (this.willBeAnonyed.length) {
            this.groupedByProfiles = Utils.groupBy(this.willBeAnonyed, item => {
                return [item.split('.')[1]];
            });
            const groupedByResources = Utils.groupBy(this.groupedByProfiles, attributes => {
                return [attributes[0].split('.')[0]];
            });
            this.deidentificationResults = {};
            this.fetchAllData(groupedByResources).then(res => {
                this.deidentificationStatus = 'pending';
            });
        }
    }

    fetchAllData (groupedByResources): Promise<any> {
        const dataPromises = groupedByResources.map(profileGroups => {
            return new Promise((resolve, reject) => {
                const baseResource = profileGroups.find(attributes => attributes[0].split('.')[0] === attributes[0].split('.')[1]);
                if (baseResource) { // fetch all data of base resource
                    const resource = baseResource[0].split('.')[0];
                    if (!this.deidentificationResults[resource]) {
                        this.deidentificationResults[resource] = {status: 'loading', entries: [], count: 0,
                            risks: {lowestProsecutor: 0, highestProsecutor: 0, averageProsecutor: 0, recordsAffectedByLowest: 0, recordsAffectedByHighest: 0}};
                    }
                    this.deidentificationService.getEntries(resource, resource).then(entries => {
                        this.deidentificationResults[resource].entries = entries.entries;
                        this.deidentificationResults[resource].count = entries.entries.length;
                        this.deidentificationResults[resource].status = 'pending';
                        this.getResultsAsMapping();
                        resolve();
                    });
                } else { // fetch profiles' data and put them in entries
                    const profilePromises = profileGroups.map(groups => {
                        const resource = groups[0].split('.')[0];
                        const profile = groups[0].split('.')[1];
                        if (!this.deidentificationResults[resource]) {
                            this.deidentificationResults[resource] = {status: 'loading', entries: [], count: 0,
                                risks: {lowestProsecutor: 0, highestProsecutor: 0, averageProsecutor: 0, recordsAffectedByLowest: 0, recordsAffectedByHighest: 0}};
                        }
                        return this.deidentificationService.getEntries(resource, profile)
                    });
                    Promise.all(profilePromises).then(results => {
                        results.forEach((result: any) => {
                            this.deidentificationResults[result.resource].entries.push(...result.entries);
                            this.deidentificationResults[result.resource].count += result.entries.length;
                            this.deidentificationResults[result.resource].status = 'pending';
                            this.getResultsAsMapping();
                        });
                        resolve();
                    });
                }
            });
        });
        return new Promise((resolve, reject) => {
            Promise.all(dataPromises).then(res => resolve());
        });
    }

    deidentifyAll () {
        this.deidentificationStatus = 'in-progress';
        const promises = this.groupedByProfiles.map(attributes => {
            const resource: string = attributes[0].split('.')[0];
            this.deidentificationResults[resource].status = 'in-progress';
            this.getResultsAsMapping();

            const profile: string = attributes[0].split('.')[1];
            const identifiers: string[][] = [];
            const quasis: string[][] = [];
            const sensitives: string[][] = [];
            for (const key of attributes) {
                if (this.attributeMappings[key] === environment.attributeTypes.ID) {
                    identifiers.push(key.split('.').slice(2));
                } else if (this.attributeMappings[key] === environment.attributeTypes.QUASI) {
                    quasis.push(key.split('.').slice(2));
                } else if (this.attributeMappings[key] === environment.attributeTypes.SENSITIVE) {
                    sensitives.push(key.split('.').slice(2));
                }
            }
            const resourceEntries = this.deidentificationResults[resource].entries;
            let entries = JSON.parse(JSON.stringify(resourceEntries));
            if (resource !== profile) { // not the base resource, needs to be filtered
                [entries, this.deidentificationResults[resource].entries] = Utils.partition(resourceEntries,
                    entry => entry.resource.meta.profile.includes(this.profileUrlMappings[profile]));
                return this.deidentificationService.deidentify(resource, profile, identifiers, quasis, sensitives, entries,
                    this.kAnonymityValidMappings[resource], this.kValueMappings[resource], this.deidentificationResults[resource]);
            } else { // base resource
                return new Promise((resolve, reject) => {
                    // base resources will be de-identified later in order to contain profiles as well
                    resolve({isBaseResource: true, resource, identifiers, quasis, sensitives});
                });
            }
        });

        Promise.all(promises).then(response => {
            const baseResource = response.find(res => res.isBaseResource);
            response.forEach((type: any) => {
                if (!type.isBaseResource) {
                    this.deidentificationResults[type.resource].entries.push(...type.entries);
                    this.$store.dispatch('fhir/calculateRisks', type);
                }
            });
            if (baseResource) {
                const resource = baseResource.resource;
                const entries = JSON.parse(JSON.stringify(this.deidentificationResults[resource].entries));
                this.deidentificationService.deidentify(resource, resource, baseResource.identifiers, baseResource.quasis,
                    baseResource.sensitives, entries, this.kAnonymityValidMappings[resource], this.kValueMappings[resource],
                    this.deidentificationResults[resource]).then(type => {
                        this.deidentificationResults[type.resource].entries = type.entries;
                        this.$store.dispatch('fhir/calculateRisks', type);
                        this.getResultsAsMapping();
                        this.deidentificationStatus = 'success';
                });
            } else {
                this.getResultsAsMapping();
                this.deidentificationStatus = 'success';
            }
        });
    }

    openOutcomeDetailCard () {
        // todo
    }

    @Watch('deidentificationResults')
    getResultsAsMapping () {
        const mappings: any[] = [];
        for (const resource of Object.keys(this.deidentificationResults)) {
            const tempObj = {resource};
            for (const key of Object.keys(this.deidentificationResults[resource])) {
                tempObj[key] = this.deidentificationResults[resource][key];
            }
            mappings.push(tempObj);
        }
        this.mappingList = mappings;
        this.$forceUpdate();
    }

    saveToRepository (request: string) {
        this.saving = true;
        this.loading = true;
        this.$store.dispatch('fhir/saveEntries', request)
            .then(response => {
                this.savedResourceNumber = response;
                this.loading = false;
            });
    }

    progressLabel (progress: number) {
        return (progress * 100).toFixed(2);
    }

    riskLabel (risk: string) {
        switch (risk) {
            case 'lowestProsecutor':
                return 'Lowest Prosecutor Risk';
            case 'highestProsecutor':
                return 'Highest Prosecutor Risk';
            case 'averageProsecutor':
                return 'Average Prosecutor Risk';
            case 'recordsAffectedByLowest':
                return 'Records Affected By Lowest Risk';
            case 'recordsAffectedByHighest':
                return 'Records Affected By Highest Risk';
        }
    }

    getRiskInfo (risk: string) {
        switch (risk) {
            case 'lowestProsecutor':
                return 'Lowest risk that a specific person in the dataset can be re-identified when the attacker knows they are in the dataset.';
            case 'highestProsecutor':
                return 'Highest risk that a specific person in the dataset can be re-identified when the attacker knows they are in the dataset.';
            case 'averageProsecutor':
                return 'Average risk that a specific person in the dataset can be re-identified when the attacker knows they are in the dataset.';
            case 'recordsAffectedByLowest':
                return 'Percentage of identities in the dataset that has re-identification risk more than lowest prosecutor risk.';
            case 'recordsAffectedByHighest':
                return 'Percentage of identities in the dataset that has re-identification risk more than highest prosecutor risk.';
        }
    }

}
</script>

<style lang="stylus">
	.error-tooltip
		width 250px
	.q-table--horizontal-separator thead th,
	.q-table--cell-separator thead th,
	.q-table--horizontal-separator tbody tr td,
	.q-table--cell-separator tbody tr td
		border-bottom-width 0.75px !important
</style>
