<template>
	<div>
		<q-toolbar class="bg-grey-4 top-fix-column">
			<q-btn unelevated :label="$t('BUTTONS.BACK')" color="primary" icon="chevron_left" @click="previousStep" no-caps />
			<q-toolbar-title class="text-grey-8" align="center">
				<q-icon name="fas fa-user-secret" color="primary" class="q-px-md" />
				{{ $t('COMMON.DEIDENTIFIER') }}
			</q-toolbar-title>
			<div class="q-gutter-md">
				<q-btn unelevated :label="$t('BUTTONS.SAVE_CONFIGURATION')" color="white" text-color="primary" @click="saveConfigurations" icon="save" no-caps >
					<q-tooltip anchor="bottom middle" self="top middle"> {{ $t('TOOLTIPS.SAVE_CONFIGURATION') }} </q-tooltip>
				</q-btn>
				<q-btn unelevated :label="$t('BUTTONS.EXPORT_CONFIGURATION')" color="white" text-color="primary" @click="exportConfigurations" icon="publish" no-caps >
					<q-tooltip anchor="bottom middle" self="top middle"> {{ $t('TOOLTIPS.EXPORT_CONFIGURATION') }} </q-tooltip>
				</q-btn>
			</div>
		</q-toolbar>

		<div class="q-ma-sm">
			<q-item-label class="text-weight-bold q-my-lg">
				<q-banner inline-actions rounded v-show="showBanner" class="bg-primary text-white">
					<q-icon name="fas fa-info" size="xs" class="q-mr-xs" />
					{{ $t('INFO.DEIDENTIFIER_INFO') }}
					<template v-slot:action>
						<q-btn flat color="white" :label="$t('BUTTONS.OK')" @click="setShowBanner(false)" />
					</template>
				</q-banner>
			</q-item-label>
			<q-card flat class="bg-white">
				<q-card-section class="q-col-gutter-sm">
					<q-table flat binary-state-sort :title="$t('LABELS.RESOURCES')" :data="mappingList" :columns="columns" row-key="resource"
					         :rows-per-page-options="[0]" :pagination.sync="pagination" class="sticky-header-table col-12" selection="multiple"
                             table-class="resources-table" :loading="!mappingList.length && isLoading(deidentificationStatus)"
							 color="primary" :selected.sync="selectedResources"
					>
						<template v-slot:no-data="{ icon, message, filter }">
							<div class="full-width row flex-center text-grey-10 q-gutter-sm">
								<span>
									{{ message }}
								</span>
							</div>
						</template>
						<template v-slot:header-cell="props">
							<q-th :props="props" class="bg-primary text-white text-size-xxl">
								<q-icon v-if="props.col.icon" :class="props.col.icon" />
								<span class="vertical-middle q-ml-xs">{{ $t(props.col.label) }}</span>
							</q-th>
						</template>
						<template v-slot:body="props">
							<q-tr :props="props">
								<q-td align="center">
									<q-checkbox dense v-model="props.selected" />
								</q-td>
								<q-td key="status" class="no-padding" :props="props">
									<template v-if="isInProgress(props.row.status) || isLoading(props.row.status)">
										<span>
											<q-spinner color="grey-9" />
											<q-tooltip v-if="isInProgress(props.row.status)" content-class="bg-white text-grey-8"> {{ $t('TOOLTIPS.DEIDENTIFYING') }} </q-tooltip>
											<q-tooltip v-if="isLoading(props.row.status)" content-class="bg-white text-grey-8"> {{ $t('TOOLTIPS.LOADING') }} </q-tooltip>
										</span>
									</template>
									<template v-else-if="isDone(props.row.status)">
										<div class="row items-center">
											<div class="col-6">
												<q-icon name="check" color="green">
													<q-tooltip content-class="bg-white text-green"> {{ $t('COMMON.COMPLETED') }} </q-tooltip>
												</q-icon>
											</div>
											<div class="col-6 bg-grey-3">
												<q-btn flat dense icon="feedback" color="grey-8" :label="$t('BUTTONS.DETAILS')" size="sm"
												       @click="openOutcomeDetailCard(props.row.outcomeDetails)" no-caps />
											</div>
										</div>
									</template>
									<template v-else-if="isWarning(props.row.status)">
										<div class="row items-center">
											<div class="col-6">
												<q-icon name="warning" color="orange-6">
													<q-tooltip content-class="bg-white text-orange-6"> {{ $t('COMMON.WARNING') }} </q-tooltip>
												</q-icon>
											</div>
											<div class="col-6 bg-grey-3">
												<q-btn flat dense icon="feedback" color="grey-8" :label="$t('BUTTONS.DETAILS')" size="sm"
												       @click="openOutcomeDetailCard(props.row.outcomeDetails)" no-caps />
											</div>
										</div>
									</template>
									<template v-else-if="isError(props.row.status)">
										<q-icon name="error_outline" color="red" class="cursor-pointer" @click="openOutcomeDetailCard(props.row.outcomeDetails)">
											<q-tooltip content-class="bg-white text-red-7"> {{ $t('COMMON.ERROR') }} </q-tooltip>
										</q-icon>
									</template>
									<template v-else>
										<q-icon name="access_time" color="grey-9">
											<q-tooltip content-class="bg-white text-grey-8"> {{ $t('COMMON.PENDING') }} </q-tooltip>
										</q-icon>
									</template>
								</q-td>
								<q-td key="resource" :props="props">
									<q-btn dense round flat size="sm" :icon="props.expand ? 'arrow_drop_up' : 'arrow_drop_down'" @click="props.expand = !props.expand" />
									{{ props.row.resource }}
								</q-td>
								<q-td key="k_anonymity" :props="props">
									<q-chip square class="bg-primary text-white">
										<template>{{kAnonymityValidMappings[props.row.resource] ? kValueMappings[props.row.resource] : '-'}}</template>
									</q-chip>
								</q-td>
								<q-td key="count" :props="props">
									<q-chip square class="bg-orange-6 text-white">
										<q-spinner v-if="isLoading(props.row.status)" color="white" />
										<template v-else>{{ props.row.count }}</template>
									</q-chip>
								</q-td>
								<q-td key="final" :props="props">
									<q-chip v-if="isInProgress(props.row.status)" square class="bg-positive text-white">
										<q-spinner color="white" />
									</q-chip>
									<q-chip v-else-if="(isDone(props.row.status) || isError(props.row.status)
											|| isWarning(props.row.status)) && props.row.entries"
									        square class="bg-positive text-white" clickable @click="showJSONResources(props.row.resource, false)">
										{{ props.row.entries }}
									</q-chip>
									<q-chip v-else square class="bg-positive text-white"> - </q-chip>
								</q-td>
								<q-td key="restricted" :props="props">
									<q-chip v-if="isInProgress(props.row.status)" square class="bg-negative text-white">
										<q-spinner color="white" />
									</q-chip>
									<q-chip v-else-if="(isDone(props.row.status) || isError(props.row.status)
											|| isWarning(props.row.status)) && (props.row.count - props.row.entries)"
									        square class="bg-negative text-white" clickable @click="showJSONResources(props.row.resource, true)">
										{{ props.row.count - props.row.entries }}
									</q-chip>
									<q-chip v-else square class="bg-negative text-white"> - </q-chip>
								</q-td>
							</q-tr>
							<q-tr v-show="props.expand" :props="props">
								<q-td colspan="100%" class="bg-grey-2">
									<template v-if="isDone(props.row.status) || isError(props.row.status) || isWarning(props.row.status)">
										<template v-for="risk of props.row.risks">
											<q-card v-if="risksShowCondition(risk, props.row.risks, props.row.resource)" flat bordered class="q-ml-md q-mr-md q-mt-sm q-mb-sm">
												<q-item>
													<q-item-section avatar>
														<q-avatar>
															<q-icon name="mdi-chart-bar" />
														</q-avatar>
													</q-item-section>
													<q-item-section>
														<q-item-label>{{risk.profile}} {{ $t('LABELS.EVALUATION') }} </q-item-label>
													</q-item-section>
												</q-item>
												<q-separator />
												<q-card-section class="text-subtitle1">
													<q-list>
														<q-item>
															<div class="col-2">
																<q-item-label class="text-weight-bold text-positive q-mt-sm">
																	{{ $t('LABELS.INFORMATION_LOSS') }}
																</q-item-label>
															</div>
															<div class="col-3">
																<q-linear-progress rounded size="30px" :value="props.row.informationLoss" color="positive">
																	<div class="absolute-full flex flex-center">
																		<q-badge text-color="white" color="positive">
																			{{progressLabel(props.row.informationLoss)}} <q-icon size="10px" class="q-ml-xs" name="fas fa-percent" color="white" />
																		</q-badge>
																	</div>
																</q-linear-progress>
															</div>
															<div class="col-6 text-grey-8 q-mt-xs q-ml-xl">
																{{ $t('INFO.INFORMATION_LOSS_INFO') }}
															</div>
														</q-item>
														<template v-for="riskey in Object.keys(risk)">
															<q-item v-if="riskey !== 'profile'">
																<div class="col-2">
																	<q-item-label class="text-weight-bold text-primary q-mt-sm">
																		{{getRiskDetail(riskey, true)}}
																	</q-item-label>
																</div>
																<div class="col-3">
																	<q-linear-progress rounded size="30px" :value="risk[riskey]" color="primary">
																		<div class="absolute-full flex flex-center">
																			<q-badge text-color="white">
																				{{progressLabel(risk[riskey])}} <q-icon size="10px" class="q-ml-xs" name="fas fa-percent" color="white" />
																			</q-badge>
																		</div>
																	</q-linear-progress>
																</div>
																<div class="col-6 text-grey-8 q-mt-xs q-ml-xl">
																	{{getRiskDetail(riskey, false)}}
																</div>
															</q-item>
														</template>
													</q-list>
												</q-card-section>
											</q-card>
										</template>
									</template>
									<template v-else>
										<q-card-section class="text-subtitle1">
											<div class="text-grey-7">
												{{ $t('INFO.EVALUATION_LOSS') }}
											</div>
										</q-card-section>
									</template>
								</q-td>
							</q-tr>
						</template>
					</q-table>
					<div class="row content-end q-gutter-sm">
						<q-space />
						<q-btn v-if="isSuccess(deidentificationStatus) || isError(deidentificationStatus)"
						       :disable="disableSave()" :label="$t('BUTTONS.SAVE_TO_REPOSITORY')" color="positive" icon="save"
						       class="q-mt-lg" @click="saveDialog = true" no-caps>
							<q-tooltip anchor="bottom middle" self="top middle"> {{ $t('TOOLTIPS.SAVE_DEIDENTIFIED_DATA') }} </q-tooltip>
						</q-btn>
						<q-btn outline color="primary" @click="deidentifyAll()" class="q-mt-lg"
						       :disable="!isPending(deidentificationStatus) || !selectedResources.length
						       || !Object.keys(deidentificationResults).length" no-caps>
							<span v-if="!isPending(deidentificationStatus)" class="q-mr-sm">
								<q-spinner size="xs" v-show="isInProgress(deidentificationStatus) || isLoading(deidentificationStatus)" />
								<q-icon name="check" size="xs" color="green" v-show="isSuccess(deidentificationStatus)" />
								<q-icon name="error_outline" size="xs" color="red" v-show="isError(deidentificationStatus)" />
							</span>
							<span> {{ $t('COMMON.DEIDENTIFY') }} </span>
						</q-btn>
					</div>

				</q-card-section>
			</q-card>
		</div>

		<q-dialog v-model="saveDialog">
			<q-card>
				<q-card-section class="row items-center q-pb-none text-primary">
					<div class="text-h5"> {{ $t('TITLES.SAVE_DEIDENTIFIED') }} </div>
					<q-space />
					<q-btn icon="close" flat round dense v-close-popup />
				</q-card-section>
				<q-card-section v-if="saving">
					<div v-if="loading" class="q-mt-xl">
						<div class="q-mt-xl q-mb-xl row justify-center">
							<div class="spinner-comp flex flex-center"></div>
						</div>
						<div class="row justify-center q-pb-md">
							<span class="text-grey-8 text-size-xl"> {{ $t('COMMON.SAVING_RESOURCES') }} </span>
						</div>
						<div class="row justify-center" v-for="transformationResult in transformationResults" :key="transformationResult.resourceType">
							<q-chip square class="q-pl-none">
								<q-chip v-if="transformationResult.transformedCount === -1" square class="q-ml-none" color="grey-5" text-color="white">
									<q-spinner></q-spinner>
								</q-chip>
								<q-chip v-else square class="q-ml-none q-mr-sm" color="positive" text-color="white">{{transformationResult.transformedCount}}</q-chip>
								{{transformationResult.resourceType}}
							</q-chip>
						</div>
					</div>
					<div v-if="!loading" class="q-ma-sm">
						<div class="q-mb-lg row justify-center">
							<transition appear enter-active-class="animated heartBeat">
								<q-icon size="100px" class="mdi mdi-database-check" color="primary"></q-icon>
							</transition>
						</div>
						<div class="row justify-center q-pb-md">
                            <span class="text-grey-8 text-size-xl">
                                {{savedResourceNumber}} {{ $t('INFO.RESOURCES_SAVED') }}
                            </span>
						</div>
						<div class="row justify-center" v-for="transformationResult in transformationResults" :key="transformationResult.resourceType">
							<q-chip square class="q-pl-none">
								<q-chip square class="q-ml-none q-mr-sm" color="positive" text-color="white">{{transformationResult.transformedCount}}</q-chip>
								{{transformationResult.resourceType}}
							</q-chip>
						</div>
					</div>
				</q-card-section>
				<q-card-actions v-if="saving && !loading" align="around">
					<q-space />
					<q-btn flat :label="$t('LABELS.RETURN_HOME')" icon-right="home" color="primary" @click="resetStep() + $router.push('/')" no-caps />
				</q-card-actions>
				<q-card-actions v-if="!saving" align="around">
					<q-btn class="q-ma-md" unelevated :label="$t('LABELS.OVERWRITE_EXISTING_DATA')" color="primary" icon-right="swap_horiz" @click="overwriteExistingData()" no-caps />
					<q-space />
					<q-btn class="q-ma-md" unelevated :label="$t('LABELS.SAVE_AS_NEW_DATA')" color="primary" icon-right="save" @click="targetRepoDialog = true" no-caps />
				</q-card-actions>
			</q-card>
		</q-dialog>

		<q-dialog v-model="targetRepoDialog">
			<q-card class="target-repo-card">
				<q-card-section class="row items-center text-negative">
					<span class="text-h6"><q-icon class="material-icons md-24">save</q-icon> {{ $t('LABELS.SAVE_AS_NEW_DATA') }} </span>
					<q-space />
					<q-btn icon="close" flat round dense v-close-popup />
				</q-card-section>
				<q-separator />
				<q-card-section class="q-pa-none">
					<OnFHIRConfig :saveToRepositoryParentFunction="saveToRepository" />
				</q-card-section>
			</q-card>
		</q-dialog>

		<q-dialog v-model="restrictionWarning" persistent>
			<q-card>
				<q-card-section class="row items-center text-negative">
					<span class="text-h6"><q-icon class="material-icons md-24">notification_important</q-icon> {{ $t('INFO.RESOURCES_RESTRICTED') }} </span>
					<q-space />
					<q-btn icon="close" flat round dense v-close-popup />
				</q-card-section>
				<q-separator />
				<q-card-section class="row items-center">
					<p> {{ $t('INFO.RESTRICTED_RESOURCES_INFO', {restrictedResourceNumber}) }} </p>
				</q-card-section>
				<q-card-actions align="right">
					<q-btn flat :label="$t('BUTTONS.OK')" color="negative" v-close-popup />
				</q-card-actions>
			</q-card>
		</q-dialog>

		<q-dialog v-model="jsonResources">
			<q-card class="json-resources-card">
				<q-card-section class="row items-center text-primary">
					<div v-if="isRestricted" class="text-h5"> {{ $t('TITLES.RESTRICTED_RESOURCES', {selectedResource}) }} </div>
					<div v-else class="text-h5"> {{ $t('TITLES.DEIDENTIFIED_RESOURCES', {selectedResource}) }} </div>
					<q-space />
					<q-btn icon="close" flat round dense v-close-popup />
				</q-card-section>
				<q-separator />
				<q-card-section v-if="selectedResource && selectedResJSONList.length && deidentificationResults[selectedResource]" class="scroll json-resources-card-section">
					<q-item-label class="text-weight-bold q-mb-lg q-mt-sm">
						<span class="text-primary"><q-icon name="fas fa-info" size="xs" class="q-mr-xs" />
							<template v-if="isRestricted"> {{ $t('INFO.RESTRICTED_JSONS') }} </template>
							<template v-else> {{ $t('INFO.DEIDENTIFIED_JSONS') }} </template>
						</span>
					</q-item-label>
					<q-list class="q-mb-md bg-grey-3" bordered v-for="(entry, index) in selectedResJSONList" :key="index">
						<q-item>
							<tree-view class="q-mb-lg q-ml-sm" :data="entry" :options="{maxDepth: 2, link: true, rootObjectKey: getResourceNumber(index)}" />
						</q-item>
					</q-list>
					<div class="q-pa-sm flex flex-center">
						<q-pagination
							v-model="currentPage"
							:max="maxPage"
							:max-pages="6"
							:boundary-numbers="true"
						/>
					</div>
				</q-card-section>
			</q-card>
		</q-dialog>

	</div>
</template>

<script lang="ts">
import {Component, Mixins, Watch} from 'vue-property-decorator';
import {environment} from '@/common/environment';
import {DeidentificationService} from '@/common/services/deidentification.service';
import {Utils} from '@/common/utils/util';
import OutcomeCard from '@/components/OutcomeCard.vue';
import {ipcRenderer} from 'electron';
import Loading from '@/components/Loading.vue';
import Status from '@/common/Status'
import StatusMixin from '@/common/mixins/statusMixin';
import {VuexStoreUtil as types} from '@/common/utils/vuex-store-util';
import { deidentificationStepTable } from '@/common/model/data-table'
import { IpcChannelUtil as ipcChannels } from '@/common/utils/ipc-channel-util'
import { LocalStorageUtil as localStorageKey } from '@/common/utils/local-storage-util'

@Component({
    components: {
        OnFHIRConfig: () => ({
            component: import('@/components/OnFHIRConfig.vue'),
            loading: Loading,
            delay: 0
        })
    } as any
})
export default class Deidentifier extends Mixins(StatusMixin) {
    private saveDialog: boolean = false;
    private targetRepoDialog: boolean = false;
    private restrictionWarning: boolean = false;
    private jsonResources: boolean = false;
    private willBeAnonyed: string[] = [];
    private groupedByProfiles: string[] = [];
    private deidentificationService: DeidentificationService = new DeidentificationService(this.typeMappings,
        this.parameterMappings, this.rareValueMappings, this.requiredElements);

    private pagination = { page: 1, rowsPerPage: 0 };
    private loading: boolean = false;
    private saving: boolean = false;
    private savedResourceNumber: number = 0;
    private restrictedResourceNumber: number = 0;
    private columns = deidentificationStepTable.columns;
    private deidentificationStatus: status = Status.LOADING;
    private mappingList: any[] = [];
    private selectedResource: string = '';
    private currentPage: number = 1;
    private maxPage: number = 1;
    private isRestricted: boolean = true;
    private showBanner: boolean = true;
    private transformationResults: Array<{resourceType: string, transformedCount: number}> = [];
    private selectedResJSONList = [];

    get attributeMappings (): any { return this.$store.getters[types.Fhir.ATTRIBUTE_MAPPINGS] }
    set attributeMappings (value) { this.$store.commit(types.Fhir.SET_ATTRIBUTE_MAPPINGS, value) }

    get parameterMappings (): any { return this.$store.getters[types.Fhir.PARAMETER_MAPPINGS] }
    set parameterMappings (value) { this.$store.commit(types.Fhir.SET_PARAMETER_MAPPINGS, value) }

    get typeMappings (): any { return this.$store.getters[types.Fhir.TYPE_MAPPINGS] }
    get rareValueMappings (): any { return this.$store.getters[types.Fhir.RARE_VALUE_MAPPINGS] }
    get requiredElements (): any { return this.$store.getters[types.Fhir.REQUIRED_ELEMENTS] }

    get kAnonymityValidMappings (): any { return this.$store.getters[types.Fhir.K_ANONYMITY_VALID_MAPPINGS] }
    set kAnonymityValidMappings (value) { this.$store.commit(types.Fhir.SET_K_ANONYMITY_VALID_MAPPINGS, value) }

    get kValueMappings (): any { return this.$store.getters[types.Fhir.K_VALUE_MAPPINGS] }
    set kValueMappings (value) { this.$store.commit(types.Fhir.SET_K_VALUE_MAPPINGS, value) }

    get deidentificationResults (): any { return this.$store.getters[types.Fhir.DEIDENTIFICATION_RESULTS] }
    set deidentificationResults (value) { this.$store.commit(types.Fhir.SET_DEIDENTIFICATION_RESULTS, value) }

    get profileUrlMappings (): any { return this.$store.getters[types.Fhir.PROFILE_URL_MAPPINGS] }
    set profileUrlMappings (value) { this.$store.commit(types.Fhir.SET_PROFILE_URL_MAPPINGS, value) }

    get selectedResources (): any[] { return this.$store.getters[types.Fhir.SELECTED_RESOURCES] }
    set selectedResources (value) { this.$store.commit(types.Fhir.SET_SELECTED_RESOURCES, value) }

    created () {
        ipcRenderer.send(ipcChannels.TO_ALL_BACKGROUND, ipcChannels.Deidentifier.SET_EVALUATION_SERVICE);
        ipcRenderer.send(ipcChannels.TO_ALL_BACKGROUND, ipcChannels.Deidentifier.SET_DEIDENTIFICATION_SERVICE,
            {
                typeMappings: this.typeMappings,
                parameterMappings: this.parameterMappings,
                rareValueMappings: this.rareValueMappings,
                requiredElements: this.requiredElements
            });
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
            this.$store.dispatch(types.IDB.CLEAR_ALL)
                .then(() => {
                    this.fetchAllData(groupedByResources).then(res => {
                        this.deidentificationStatus = Status.PENDING;
                    }).catch(err => err);
                })
                .catch(err => {
                    console.log('Error while deleting resources in idb.', err);
                })
        } else {
            this.deidentificationStatus = Status.PENDING;
        }

        // Set showBanner
        if (localStorage.getItem(localStorageKey.SHOW_BANNER_DEIDENTIFIER)) {
            this.showBanner = localStorage.getItem(localStorageKey.SHOW_BANNER_DEIDENTIFIER) === 'true';
        } else {
            this.showBanner = true;
        }
    }

    setShowBanner (value: boolean) {
        localStorage.setItem(localStorageKey.SHOW_BANNER_DEIDENTIFIER, String(value));
        this.showBanner = value;
    }

    fetchAllData (groupedByResources): Promise<any> {
        const dataPromises = groupedByResources.map(profileGroups => {
            return new Promise((resolve, reject) => {
                const baseResource = profileGroups.find(attributes => attributes[0].split('.')[0] === attributes[0].split('.')[1]);
                if (baseResource) { // fetch all data of base resource
                    const resource = baseResource[0].split('.')[0];
                    if (!this.deidentificationResults[resource]) {
                        this.deidentificationResults[resource] = {status: Status.LOADING, count: 0, entries: 0,
                            outcomeDetails: [], risks: [], restrictedEntries: [], informationLoss: 0};
                    }
                    this.getResultsAsMapping();
                    ipcRenderer.send(ipcChannels.TO_BACKGROUND, ipcChannels.Deidentifier.FETCH_ALL_DATA,
                        {resourceType: resource});
                    ipcRenderer.on(ipcChannels.Deidentifier.FETCH_ALL_DATA_RES_X(resource), (event, result) => {
                        ipcRenderer.removeAllListeners(ipcChannels.Deidentifier.FETCH_ALL_DATA_RES_X(resource));
                        this.deidentificationResults[resource] = {...this.deidentificationResults[resource], ...result};
                        this.getResultsAsMapping();
                        resolve();
                    });
                } else { // fetch profiles' data and put them in entries
                    const resourceType = profileGroups[0][0].split('.')[0];

                    profileGroups.reduce((promise: Promise<any>, groups) => {
                        return promise.then(() => {
                            return new Promise((resolveProfile, rejectProfile) => {
                                const resource = groups[0].split('.')[0];
                                const profile = groups[0].split('.')[1];
                                if (!this.deidentificationResults[resource]) {
                                    this.deidentificationResults[resource] = {status: Status.LOADING, count: 0, entries: 0,
                                        outcomeDetails: [], risks: [], restrictedEntries: [], informationLoss: 0};
                                }
                                this.getResultsAsMapping();
                                const profileURL = this.profileUrlMappings[profile];
                                ipcRenderer.send(ipcChannels.TO_BACKGROUND, ipcChannels.Deidentifier.FETCH_ALL_DATA,
                                    {resourceType: resource, profile, profileURL});
                                ipcRenderer.on(ipcChannels.Deidentifier.FETCH_ALL_DATA_RES_X(`${resource}-${profile}`), (event, result) => {
                                    ipcRenderer.removeAllListeners(ipcChannels.Deidentifier.FETCH_ALL_DATA_RES_X(`${resource}-${profile}`));
                                    resolveProfile(result);
                                });
                            })
                        })
                    }, Promise.resolve())
                        .then(result => {
                            this.deidentificationResults[resourceType] = {...this.deidentificationResults[resourceType], ...result};
                            this.getResultsAsMapping();
                            resolve();
                        })
                        .catch(err => {
                            reject(err);
                        });
                }
            });
        });
        return new Promise((resolve, reject) => {
            Promise.all(dataPromises).then(res => resolve()).catch(err => reject(err));
        });
    }

    deidentifyAll () {
        const selectedResourceNames = this.selectedResources.map(obj => obj.resource);
        const selectedGroups = this.groupedByProfiles.filter(attributes => {
            const resource: string = attributes[0].split('.')[0];
            return selectedResourceNames.includes(resource);
        })
        this.restrictedResourceNumber = 0;
        this.deidentificationStatus = Status.IN_PROGRESS;

        const promises = selectedGroups.map(attributes => {
            return new Promise((resolve, reject) => {
                const resource: string = attributes[0].split('.')[0];
                this.deidentificationResults[resource].status = Status.IN_PROGRESS;
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
                ipcRenderer.send(ipcChannels.TO_BACKGROUND, ipcChannels.Deidentifier.DEIDENTIFY,
                    {
                        resourceType: resource,
                        profile,
                        profileURL: this.profileUrlMappings[profile],
                        identifierRelated: {
                            identifiers,
                            quasis,
                            sensitives,
                            kAnonymityValidMappings: this.kAnonymityValidMappings,
                            kValueMappings: this.kValueMappings
                        },
                        parameterMappings: this.parameterMappings,
                        typeMappings: this.typeMappings
                    });

                // Listener for the results of the identification process
                ipcRenderer.on(ipcChannels.Deidentifier.DEIDENTIFY_RES_X(`${resource}-${profile}`), (event, result: {entryLength, restrictedEntries}) => {
                    ipcRenderer.removeAllListeners(ipcChannels.Deidentifier.DEIDENTIFY_RES_X(`${resource}-${profile}`));
                    this.deidentificationResults[resource].entries += result.entryLength;
                    for (const entry of result.restrictedEntries) {
                        this.deidentificationResults[resource].restrictedEntries.push(entry);
                    }
                    this.showWarningForRestrictedResources(this.deidentificationResults[resource].restrictedEntries.length);
                    this.getResultsAsMapping();
                });

                // Listener for calculated risks
                ipcRenderer.on(ipcChannels.Deidentifier.DEIDENTIFY_RISKS_RES_X(`${resource}-${profile}`), (event, result: {risks, informationLoss}) => {
                    ipcRenderer.removeAllListeners(ipcChannels.Deidentifier.DEIDENTIFY_RISKS_RES_X(`${resource}-${profile}`));
                    this.deidentificationResults[resource].risks.push(result.risks);
                    this.deidentificationResults[resource].informationLoss = result.informationLoss;
                    this.getResultsAsMapping();
                });

                // Listener for the validation results
                ipcRenderer.on(ipcChannels.Deidentifier.VALIDATE_ENTRIES_RES_X(`${resource}-${profile}`), (event, result: OutcomeDetail) => {
                    ipcRenderer.removeAllListeners(ipcChannels.Deidentifier.VALIDATE_ENTRIES_RES_X(`${resource}-${profile}`));
                    for (const outcomeDetail of result.outcomeDetails) {
                        this.deidentificationResults[resource].outcomeDetails.push(outcomeDetail);
                    }

                    if (!this.isError(result.status)) {
                        this.deidentificationResults[resource].status = Status.DONE;
                    } else {
                        this.deidentificationResults[resource].status = Status.ERROR;
                    }
                    this.getResultsAsMapping();
                    resolve(result.status);
                });
            })
        });

        Promise.all(promises).then(results => {
            results.forEach((resultStatus: Status) => {
                if (this.isError(resultStatus)) {
                    this.deidentificationStatus = Status.ERROR;
                }
            })
            if (!this.isError(this.deidentificationStatus)) {
                this.deidentificationStatus = Status.SUCCESS;
            }
            this.getResultsAsMapping();
        }).catch(err => err);
    }

    openOutcomeDetailCard (outcomeDetails: OutcomeDetail[]) {
        this.$store.commit(types.Fhir.SET_OUTCOME_DETAILS, outcomeDetails)
        this.$q.dialog({
            component: OutcomeCard,
            parent: this
        })
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
        this.selectedResources = this.mappingList.slice();
        this.$forceUpdate();
    }

    saveToRepository (isSource: boolean) {
        this.saving = true;
        this.loading = true;
        const resourceTypes = Object.keys(this.deidentificationResults);
        const transformationPromises = resourceTypes.map(resourceType => {
            this.transformationResults.push({resourceType, transformedCount: -1})
            return new Promise((resolve, reject) => {
                ipcRenderer.send(ipcChannels.TO_BACKGROUND, ipcChannels.Deidentifier.SAVE_TO_REPO, resourceType);
                ipcRenderer.on(ipcChannels.Deidentifier.SAVE_TO_REPO_RES_X(resourceType), (event, result: OutcomeDetail) => {
                    ipcRenderer.removeAllListeners(ipcChannels.Deidentifier.SAVE_TO_REPO_RES_X(resourceType));
                    const count = result.outcomeDetails.filter(_ => this.isSuccess(_.status)).length;
                    // Save transformation results resource by resource
                    this.transformationResults.find(_ => _.resourceType === resourceType).transformedCount = count || 0;
                    this.savedResourceNumber += count;
                    resolve(result.status);
                });
            });
        });

        Promise.all(transformationPromises)
            .then(results => {
                this.loading = false;
                results.forEach((resultStatus: Status) => {
                    if (this.isError(resultStatus)) {
                        this.deidentificationStatus = Status.ERROR;
                    }
                })
                if (!this.isError(this.deidentificationStatus)) {
                    this.$notify.success(String(this.$t('SUCCESS.RESOURCES_ARE_SAVED')));
                } else {
                    this.$notify.error(String(this.$t('ERROR.RESOURCES_NOT_SAVED')));
                }
            })
            .catch(err => {
                this.loading = false;
                console.log(err);
            });
    }

    risksShowCondition (risk, risks, resource) {
        const baseResource = risks.find(obj => obj.profile === resource);
        if (baseResource) {
            return risk === baseResource;
        }
        return true;
    }

    progressLabel (progress: number) {
        return (progress * 100).toFixed(2);
    }

    getRiskDetail (risk: string, isLabel: boolean) {
        let langString = isLabel ? 'LABELS.' : 'RISK_INFO.';
        switch (risk) {
            case 'lowestProsecutor':
                langString += 'LOWEST_PROSECUTOR';
                break;
            case 'highestProsecutor':
                langString += 'HIGHEST_PROSECUTOR';
                break;
            case 'averageProsecutor':
                langString += 'AVERAGE_PROSECUTOR';
                break;
            case 'recordsAffectedByLowest':
                langString += 'RECORDS_AFFECTED_BY_LOWEST';
                break;
            case 'recordsAffectedByHighest':
                langString += 'RECORDS_AFFECTED_BY_HIGHEST';
                break;
        }
        return String(this.$t(langString));
    }

    exportConfigurations () {
        this.$q.loading.show({spinner: undefined})
        this.$store.dispatch(types.Fhir.CURRENT_STATE).then(state => {
            ipcRenderer.send(ipcChannels.TO_BACKGROUND, ipcChannels.File.EXPORT_FILE, JSON.stringify(state))
            ipcRenderer.on(ipcChannels.File.EXPORT_DONE, (event, result) => {
                if (result) {
                    this.$notify.success(String(this.$t('SUCCESS.FILE_IS_EXPORTED')))
                }
                this.$q.loading.hide()
                ipcRenderer.removeAllListeners(ipcChannels.File.EXPORT_DONE)
            })
        })
        .catch(() => {
            this.$q.loading.hide()
            this.$notify.error(String(this.$t('ERROR.CANNOT_EXPORT_CONFIGS')))
        });
    }

    saveConfigurations () {
        this.$q.dialog({
            title: `${this.$t('TOOLTIPS.SAVE_CONFIGURATION')}`,
            prompt: {
                model: '',
                isValid: val => val.length > 0,
                type: 'text'
            },
            cancel: true,
            persistent: true
        }).onOk(configName => {
            this.$store.dispatch(types.Fhir.CURRENT_STATE).then(state => {
                let fileStore: any = localStorage.getItem(localStorageKey.EXPORTABLE_STATE)
                if (fileStore) {
                    fileStore = JSON.parse(fileStore) as any[]
                    fileStore.push({date: new Date(), name: configName, data: state})
                } else {
                    fileStore = [{date: new Date(), name: configName, data: state}]
                }
                localStorage.setItem(localStorageKey.EXPORTABLE_STATE, JSON.stringify(fileStore))
                this.$notify.success(String(this.$t('SUCCESS.SAVED')))
            }).catch(err => err);
        })
    }

    overwriteExistingData () {
        this.$q.dialog({
            title: `<span class="text-negative"><i class="material-icons md-24">swap_horiz</i> ${this.$t('LABELS.OVERWRITE_EXISTING_DATA')} </span>`,
            message: `${this.$t('WARNING.RESOURCES_WILL_BE_REPLACED')}`,
            class: 'text-grey-9',
            cancel: true,
            html: true
        }).onOk(() => {
            this.saveToRepository(true);
        })
    }

    showWarningForRestrictedResources (restricted: number) {
        if (restricted) {
            this.restrictedResourceNumber += restricted;
            this.restrictionWarning = true;
        }
    }

    showJSONResources (resourceType: string, isRestricted: boolean) {
        this.$q.loading.show();
        this.selectedResJSONList = [];
        this.currentPage = 1;
        this.maxPage = Math.ceil(10 / environment.JSON_NUMBER_IN_A_PAGE);
        this.isRestricted = isRestricted;
        this.selectedResource = resourceType;
        this.getJsonsInPage();
    }

    getJsonsInPage () {
        const totalPages = environment.JSON_NUMBER_IN_A_PAGE;
        if (this.isRestricted) {
            this.selectedResJSONList = this.deidentificationResults[this.selectedResource].restrictedEntries.slice( (this.currentPage - 1) *
                totalPages, (this.currentPage - 1) * totalPages + totalPages );
            this.jsonResources = true;
            this.$q.loading.hide();
        } else {
            this.$store.dispatch(types.IDB.GET, `validated-${this.selectedResource}`)
                .then(res => {
                    this.selectedResJSONList = res.entries.slice( (this.currentPage - 1) * totalPages, (this.currentPage - 1) * totalPages + totalPages );
                    this.jsonResources = true;
                    this.$q.loading.hide();
                })
                .catch(err => {
                    this.selectedResJSONList = [];
                    this.$notify.error(`Something went wrong while getting resource entries. ${err}`);
                    this.$q.loading.hide();
                });
        }
    }

    getResourceNumber (index: number) {
        const previosPages = this.currentPage - 1;
        return this.selectedResource + ' ' + Number((previosPages * environment.JSON_NUMBER_IN_A_PAGE) + index + 1);
    }

    @Watch('selectedResources', { immediate: true, deep: true })
    disableSave () {
        if (!this.selectedResources.length) {
            return true;
        }
        for (const resource of this.selectedResources) {
            if (this.isError(resource?.status) || this.isInProgress(resource?.status) ||
                this.isPending(resource?.status) || this.isLoading(resource?.status)) {
                return true;
            }
        }
        return false;
    }

    previousStep () {
        this.deidentificationResults = {};
        this.$store.commit(types.DECREMENT_STEP);
    }

    resetStep () {
        this.$store.commit(types.RESET_STEP);
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
	.material-icons.md-24 { font-size: 24px; }
	.tree-view-item {
		font-size: 15px !important;
	}
	.tree-view-item-key {
		color: #B26F95
	}
	.tree-view-item-value-string {
		color: #00A54F
	}
	.tree-view-item-value-boolean {
		color: #ea6f12
	}
	.tree-view-item-value-number {
		color: #00A7F7
	}
    .target-repo-card {
        width: 700px
        max-width: 80vw !important
    }
    .json-resources-card {
        width: 900px
        max-width: 100vw !important
    }
    .json-resources-card-section {
        max-height: 70vh
    }
    .resources-table {
        max-height: 60vh
    }
</style>
