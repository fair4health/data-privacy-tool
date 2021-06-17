import log from 'electron-log'
import { VNode, CreateElement } from 'vue'
import {
    BrowserWindow,
    ipcRenderer,
    OpenDialogReturnValue,
    remote,
    SaveDialogReturnValue
} from 'electron'
import { Component, Vue } from 'vue-property-decorator'
import { IpcChannelUtil as ipcChannels } from '@/common/utils/ipc-channel-util'
import * as fs from 'fs';
import {VuexStoreUtil as types} from '@/common/utils/vuex-store-util'
import Status from '@/common/Status'
import { DeidentificationService } from '@/common/services/deidentification.service'
import {Utils} from '@/common/utils/util'
import {EvaluationService} from '@/common/services/evaluation.service'

@Component
export default class BackgroundEngine extends Vue {
    // Chunk size of batch operations to be performed on FHIR repo (Validation and Transform)
    private FHIR_OP_CHUNK_SIZE: number = 1000

    private sourceFhirBaseUrl: fhir.uri
    private targetFhirBaseUrl: fhir.uri

    private deidentificationService: DeidentificationService = new DeidentificationService()
    private evaluationService: EvaluationService = new EvaluationService()

    created () {
        // Logger settings
        log.transports.file.fileName = 'log.txt'
        log.transports.console.level = false

        // Initialize IPC listeners
        this.initListeners()

        // Get ready - available thread window
        this.ready()
    }

    public initListeners () {
        this.setSourceFhirBaseUrl()
        this.setTargetFhirBaseUrl()
        this.setDeidentificationService()
        this.setEvaluationService()

        // File listeners
        this.onBrowseConfiguration()
        this.onExportFile()

        // Deidentification listeners
        this.fetchAllData()
        this.deidentify()
        this.saveToRepo()
    }

    /**
     * Informs main process that this thread is available/ready to perform
     */
    public ready () {
        ipcRenderer.send(ipcChannels.READY)
    }

    public setSourceFhirBaseUrl () {
        ipcRenderer.on(ipcChannels.Fhir.SET_SOURCE_FHIR_BASE, (event, url) => {
            this.sourceFhirBaseUrl = url;
            this.$sourceFhirService.setUrl(this.sourceFhirBaseUrl);
        })
    }

    public setTargetFhirBaseUrl () {
        ipcRenderer.on(ipcChannels.Fhir.SET_TARGET_FHIR_BASE, (event, url) => {
            this.targetFhirBaseUrl = url;
            this.$targetFhirService.setUrl(this.targetFhirBaseUrl);
        })
    }

    public setDeidentificationService () {
        ipcRenderer.on(ipcChannels.Deidentifier.SET_DEIDENTIFICATION_SERVICE,
            (event, content: {typeMappings: any, parameterMappings: any, rareValueMappings: any, requiredElements: string[]}) => {
            this.deidentificationService.init(content);
        })
    }

    public setEvaluationService () {
        ipcRenderer.on(ipcChannels.Deidentifier.SET_EVALUATION_SERVICE, (event) => {
            this.evaluationService.setFhirService(Vue.prototype.$sourceFhirService);
        })
    }

    /**
     * Browses files with .json extension and sends back parsed content
     */
    public onBrowseConfiguration () {
        ipcRenderer.on(ipcChannels.File.BROWSE_CONFIGURATIONS, () => {
            remote.dialog.showOpenDialog(remote.BrowserWindow.getFocusedWindow() as BrowserWindow, {
                properties: ['openFile'], filters: [{ extensions: ['json'], name: 'JSON (.json)' }]
            }).then((response: OpenDialogReturnValue) => {
                if (response && !response.canceled && response.filePaths && response.filePaths.length) {
                    const files = response.filePaths;
                    fs.readFile(files[0], (err, data) => {
                        if (err) {
                            log.error(`Cannot read configuration file ${files[0]}`)
                            ipcRenderer.send(ipcChannels.TO_RENDERER, ipcChannels.File.SELECTED_CONFIGURATION, undefined)
                            this.ready()
                            return
                        }
                        log.info(`Configuration loaded from ${files[0]}`)
                        ipcRenderer.send(ipcChannels.TO_RENDERER, ipcChannels.File.SELECTED_CONFIGURATION, JSON.parse(data.toString()))
                    })
                } else ipcRenderer.send(ipcChannels.TO_RENDERER, ipcChannels.File.SELECTED_CONFIGURATION, undefined)
                this.ready()
            })
            .catch(err => {
                log.error(`Browse file error. ${err}`)
                this.ready()
            })
        })
    }

    /**
     * File export - opens SAVE dialog and saves file with json extension
     */
    public onExportFile () {
        ipcRenderer.on(ipcChannels.File.EXPORT_FILE, (event, content) => {
            remote.dialog.showSaveDialog(remote.BrowserWindow.getFocusedWindow() as BrowserWindow, {
                filters: [{ extensions: ['json'], name: 'JSON (.json)' }]
            })
                .then((response: SaveDialogReturnValue) => {
                    const filename = response.filePath
                    if (!response || !filename || response.canceled) {
                        ipcRenderer.send(ipcChannels.TO_RENDERER, ipcChannels.File.EXPORT_DONE, null)
                        this.ready()
                        return
                    }
                    fs.writeFile(filename, content, (err) => {
                        if (err) {
                            log.error(`Export file: ${err}`)
                            ipcRenderer.send(ipcChannels.TO_RENDERER, ipcChannels.File.EXPORT_DONE, null)
                            this.ready()
                            return
                        }
                        ipcRenderer.send(ipcChannels.TO_RENDERER, ipcChannels.File.EXPORT_DONE, true)
                    })
                    this.ready()
                })
                .catch(err => {
                    log.error(`Save file error. ${err}`)
                    this.ready()
                })
        })
    }

    /**
     * Retrieves all records of a resource type in the repository
     */
    public fetchAllData () {
        ipcRenderer.on(ipcChannels.Deidentifier.FETCH_ALL_DATA,
            (event, content: {resourceType: string, profile?: string, profileURL?: string}) => {
            const resourceType = content.resourceType;
            const profile = content.profile;
            const profileURL = content.profileURL;
            const channelExtension = resourceType + (profile ? '-' + profile : '');
            this.$store.dispatch(types.IDB.GET, resourceType).then(res => {
                let resourceInfo = res;
                if (!res) {
                    resourceInfo = {resource: resourceType, status: Status.LOADING, entries: [], count: 0,
                        outcomeDetails: [], risks: [], restrictedEntries: [], informationLoss: 0};
                }
                this.deidentificationService.getEntries(resourceType, profile, profileURL).then(entries => {
                    for (const entry of entries.entries) {
                        resourceInfo.entries.push(entry);
                    }
                    resourceInfo.count += entries.entries.length;
                    resourceInfo.status = Status.PENDING;
                    this.$store.dispatch(types.IDB.SAVE, {resource: resourceType, ...resourceInfo})
                        .then(() => {
                            log.info(`${channelExtension} entries have been fetched and saved successfully.`);
                            ipcRenderer.send(ipcChannels.TO_RENDERER, ipcChannels.Deidentifier.FETCH_ALL_DATA_RES_X(channelExtension),
                                {count: resourceInfo.count, status: Status.PENDING});
                            this.ready();
                        })
                        .catch(err => {
                            log.error(`Error while saving '${channelExtension}' entries into iDB. ${err}`);
                            ipcRenderer.send(ipcChannels.TO_RENDERER, ipcChannels.Deidentifier.FETCH_ALL_DATA_RES_X(channelExtension),
                                {count: resourceInfo.count, status: Status.PENDING});
                            this.ready();
                        })
                }).catch(err => {
                    log.error(`Error in 'deidentificationService.getEntries' while fetching '${channelExtension}' entries. ${err}`);
                    ipcRenderer.send(ipcChannels.TO_RENDERER, ipcChannels.Deidentifier.FETCH_ALL_DATA_RES_X(channelExtension),
                        {count: 0, status: Status.ERROR});
                    this.ready();
                });
            }).catch(err => {
                log.error(`Error while fetching '${channelExtension}' entries. ${err}`);
                ipcRenderer.send(ipcChannels.TO_RENDERER, ipcChannels.Deidentifier.FETCH_ALL_DATA_RES_X(channelExtension),
                    {count: 0, status: Status.ERROR});
                this.ready();
            })
        })
    }

    /**
     * Deidentifies and validates the resources according to the configuration given in the content
     * Returns validation results
     */
    public deidentify () {
        ipcRenderer.on(ipcChannels.Deidentifier.DEIDENTIFY, (event,
                                                             content: {resourceType: string,
                                                                 profile: string,
                                                                 profileURL: string,
                                                                 identifierRelated: {
                                                                     identifiers,
                                                                     quasis,
                                                                     sensitives,
                                                                     kAnonymityValidMappings,
                                                                     kValueMappings
                                                                 },
                                                                 parameterMappings,
                                                                 typeMappings
                                                             }) => {
            const resourceType = content.resourceType;
            const profile = content.profile;
            const profileURL = content.profileURL;
            const identifiers = content.identifierRelated.identifiers;
            const quasis = content.identifierRelated.quasis;
            const sensitives = content.identifierRelated.sensitives;
            const kAnonymityValidMappings = content.identifierRelated.kAnonymityValidMappings;
            const kValueMappings = content.identifierRelated.kValueMappings;
            const parameterMappings = content.parameterMappings;
            const typeMappings = content.typeMappings;

            let baseResourceEntries = [];
            // Get resources from iDB
            const deidentifyPromise = new Promise((resolve, reject) => {
                this.$store.dispatch(types.IDB.GET, resourceType)
                    .then(res => {
                        log.info(`${resourceType} resources are fetched from iDB`);
                        const resourceEntries = res.entries;
                        let profileEntries = [];
                        if (resourceType !== profile) { // not the base resource, needs to be filtered
                            [profileEntries, baseResourceEntries] = Utils.partition(resourceEntries,
                                entry => entry.resource.meta.profile.includes(profileURL));
                            this.deidentificationService.deidentify(resourceType, profile, identifiers, quasis, sensitives, profileEntries,
                                kAnonymityValidMappings[resourceType], kValueMappings[resourceType])
                                .then(res => resolve(res))
                                .catch(err => reject(err));
                        } else { // base resource
                            baseResourceEntries = resourceEntries;
                            // base resources will be de-identified later in order to contain profiles as well
                            resolve({isBaseResource: true, resource: resourceType, identifiers, quasis, sensitives, entries: resourceEntries});
                        }
                    })
                    .catch(err => {
                        log.error(`Error while deidentifying '${resourceType}' entries. ${err}`);
                        reject(err);
                    });
            });
            deidentifyPromise.then((response: any) => {
                const baseResources = [];
                const totalResults = {
                    entries: [],
                    restrictedEntries: []
                }
                if (!response.isBaseResource) {
                    totalResults.entries = response.entries || [];
                    totalResults.restrictedEntries = response.restrictedEntries || [];

                    // Send information about the restricted entries to UI
                    ipcRenderer.send(ipcChannels.TO_RENDERER, ipcChannels.Deidentifier.DEIDENTIFY_RES_X(`${resourceType}-${profile}`),
                        {entryLength: totalResults.entries.length, restrictedEntries: totalResults.restrictedEntries});

                    // Risk calculation
                    this.$store.dispatch(types.Fhir.CALCULATE_RISKS, {type: response, parameterMappings, typeMappings})
                        .then((res: {risks, informationLoss}) => {
                            ipcRenderer.send(ipcChannels.TO_RENDERER, ipcChannels.Deidentifier.DEIDENTIFY_RISKS_RES_X(`${resourceType}-${profile}`), res);
                        })
                        .catch(err => {
                            log.error(`Risk calculation error ${resourceType}-${profile}. ${err}`);
                        });

                    // Validate resources
                    this.validate(resourceType, profile, totalResults.entries)
                        .then(res => {
                            log.info(`Validation is completed resource: ${resourceType} ${profile}`);
                            this.ready();
                        })
                        .catch(err => {
                            log.error(`Error while validating resource: ${resourceType} ${profile}. ${err}`);
                            this.ready();
                        });
                } else {
                    baseResources.push(response);
                    baseResources?.forEach(baseResource => {
                        const resource = baseResource.resource;
                        const entries = this.$_.cloneDeep(response.entries);
                        this.deidentificationService.deidentify(resource, resource, baseResource.identifiers, baseResource.quasis,
                            baseResource.sensitives, entries, kAnonymityValidMappings[resource], kValueMappings[resource]).then(type => {
                            for (const entry of type.entries) {
                                totalResults.entries.push(entry);
                            }
                            for (const entry of type.restrictedEntries) {
                                totalResults.restrictedEntries.push(entry);
                            }

                            // Send information about the restricted entries to UI
                            ipcRenderer.send(ipcChannels.TO_RENDERER, ipcChannels.Deidentifier.DEIDENTIFY_RES_X(`${resourceType}-${profile}`),
                                {entryLength: totalResults.entries.length, restrictedEntries: totalResults.restrictedEntries});

                            // Risk calculation
                            this.$store.dispatch(types.Fhir.CALCULATE_RISKS, {type, parameterMappings, typeMappings})
                                .then((res: {risks, informationLoss}) => {
                                    ipcRenderer.send(ipcChannels.TO_RENDERER, ipcChannels.Deidentifier.DEIDENTIFY_RISKS_RES_X(`${resourceType}-${profile}`), res);
                                })
                                .catch(err => {
                                    log.error(`Risk calculation error ${resourceType}-${profile}. ${err}`);
                                });

                            // Validate resources
                            this.validate(resourceType, profile, totalResults.entries)
                                .then(res => {
                                    log.info(`Validation is completed resource: ${response.resource}`);
                                    this.ready();
                                })
                                .catch(err => {
                                    log.error(`Error while validating resource: ${response.resource}. ${err}`);
                                    this.ready();
                                });
                        }).catch(err => {
                            log.error(`${err}`);
                            this.ready();
                        });
                    });
                }
            })
                .catch(err => {
                    log.error(`${err}`);
                    this.ready();
                })
        })
    }

    /**
     * Validates resources
     *
     * @param resourceType
     * @param profile
     * @param resourceList
     */
    public validate (resourceType: string, profile: string, resourceList: any[]): Promise<any> {
        log.info(`Received validation request for resource: ${resourceType}...`);
        return new Promise((resolve, reject) => {
            // Max capacity FHIR_OP_CHUNK_SIZE resources
            const len = Math.ceil(resourceList.length / this.FHIR_OP_CHUNK_SIZE)

            const batchPromiseList: Array<Promise<any>> = []

            for (let i = 0, p = Promise.resolve(); i < len; i++) {
                batchPromiseList.push(p.then(() => new Promise((resolveBatch, rejectBatch) => {
                    const resourcesToBeValidated = resourceList.slice(i * this.FHIR_OP_CHUNK_SIZE, (i + 1) * this.FHIR_OP_CHUNK_SIZE).map(_ => _.resource);
                    this.$sourceFhirService.validate(resourcesToBeValidated)
                        .then(res => {
                            const bundle: fhir.Bundle = res.data as fhir.Bundle
                            const outcomeDetails: OutcomeDetail[] = []

                            // Check batch bundle response for errors
                            Promise.all(bundle.entry?.map((entry: fhir.BundleEntry) => {
                                    let operationOutcome: fhir.OperationOutcome;
                                    let isValidated: boolean = true;
                                    if (!entry.resource) {
                                        operationOutcome = entry.response.outcome as fhir.OperationOutcome;
                                    } else {
                                        operationOutcome = entry.resource as fhir.OperationOutcome;
                                    }

                                    operationOutcome.issue.map(issue => {
                                        if (issue.severity === 'error' || issue.severity === 'fatal') {
                                            isValidated = false;
                                            outcomeDetails.push({status: Status.ERROR, resourceType, message: `${issue.location} : ${issue.diagnostics}`} as OutcomeDetail);
                                        }
                                    })

                                    if (isValidated) {
                                        outcomeDetails.push({status: Status.SUCCESS, resourceType, message: `Status: ${entry.response?.status}`} as OutcomeDetail);
                                    }

                                }) || [])
                                .then(() => resolveBatch(outcomeDetails))
                                .catch(err => rejectBatch(err));
                        })
                        .catch(err => {
                            log.error(`Batch validation process error. ${err}`);
                            rejectBatch(err);
                            ipcRenderer.send(ipcChannels.TO_RENDERER,
                                ipcChannels.Deidentifier.VALIDATE_ENTRIES_RES_X(`${resourceType}-${profile}`),
                                {status: Status.ERROR, outcomeDetails: [{status: Status.ERROR, resourceType: 'OperationOutcome', message: err.message}]});
                        })
                })))
            }

            Promise.all(batchPromiseList)
                .then(res => {
                    // Save the de-identified resource list into the iDB
                    this.$store.dispatch(types.IDB.GET, `validated-${resourceType}`)
                        .then(resources => {
                            let concatResources: any[];
                            if (resources?.entries?.length) {
                                concatResources = resources.entries;
                                for (const res of resourceList) {
                                    concatResources.push(res);
                                }
                            } else {
                                concatResources = resourceList;
                            }
                            this.$store.dispatch(types.IDB.SAVE, {resource: `validated-${resourceType}`, entries: concatResources, count: concatResources.length})
                                .then(() => {
                                    log.info(`${resourceType}-${profile} deidentified entries have been saved successfully.`);
                                    // Send the validation results to UI
                                    if (res.length) {
                                        log.info(`Batch validation process completed for Resource: ${resourceType}`);
                                        const outcomeDetails: OutcomeDetail[] = [].concat.apply([], res);
                                        const status = !outcomeDetails.length || !!outcomeDetails.find(_ => _.status === Status.ERROR) ? Status.ERROR : Status.SUCCESS;
                                        ipcRenderer.send(ipcChannels.TO_RENDERER, ipcChannels.Deidentifier.VALIDATE_ENTRIES_RES_X(`${resourceType}-${profile}`), {status, outcomeDetails});
                                        log.info(`Validation completed for Resource: ${resourceType} ${profile ? 'Profile: ' + profile : ''}`);
                                        resolve();
                                    } else {
                                        const errorMessage = `There is no ${resourceType} Resource created ${profile ? 'with Profile: ' + profile : ''}. See the logs for detailed error information.`;
                                        ipcRenderer.send(ipcChannels.TO_RENDERER,
                                            ipcChannels.Deidentifier.VALIDATE_ENTRIES_RES_X(`${resourceType}-${profile}`),
                                            {status: Status.ERROR, outcomeDetails: [{
                                                    status: Status.ERROR,
                                                    message: errorMessage,
                                                    resourceType: 'OperationOutcome'
                                                }]});
                                        log.error(`Batch validation process error for Resource: ${resourceType} ${profile ? 'Profile: ' + profile : ''}`);
                                        reject(errorMessage);
                                    }
                                })
                                .catch(err => {
                                    log.error(`Error while saving deidentified resource: '${resourceType}-${profile}' entries into iDB. ${err}`);
                                });
                        })
                })
                .catch(err => {
                    log.error(`Batch validation process error for Resource: ${resourceType} ${profile ? 'Profile: ' + profile : ''}`);
                    reject(err);
                });
        })
    }

    /**
     * Saves resources with the given resource type to the repo
     */
    public saveToRepo () {
        ipcRenderer.on(ipcChannels.Deidentifier.SAVE_TO_REPO, (event, resourceType: string) => {
            this.$store.dispatch(types.IDB.GET, `validated-${resourceType}`)
                .then(res => {
                    const resourceList = res.entries;

                    // Max capacity FHIR_OP_CHUNK_SIZE resources
                    const len = Math.ceil(resourceList.length / this.FHIR_OP_CHUNK_SIZE);

                    const batchPromiseList: Array<Promise<any>> = [];

                    for (let i = 0, p = Promise.resolve(); i < len; i++) {
                        batchPromiseList.push(p.then(() => new Promise((resolveBatch, rejectBatch) => {
                            const resourcesToBeSaved = resourceList.slice(i * this.FHIR_OP_CHUNK_SIZE, (i + 1) * this.FHIR_OP_CHUNK_SIZE).map(_ => _.resource);
                            this.$targetFhirService.postBatch(resourcesToBeSaved, 'PUT')
                                .then(res => {
                                    const bundle: fhir.Bundle = res.data as fhir.Bundle
                                    const outcomeDetails: OutcomeDetail[] = []

                                    // Check batch bundle response for errors
                                    Promise.all(bundle.entry?.map((entry: fhir.BundleEntry) => {
                                            if (!entry.resource) {
                                                const operationOutcome: fhir.OperationOutcome = entry.response!.outcome as fhir.OperationOutcome
                                                operationOutcome.issue.map(issue => {
                                                    if (issue.severity === 'error' || issue.severity === 'fatal') {
                                                        outcomeDetails.push({status: Status.ERROR, resourceType, message: `${issue.location} : ${issue.diagnostics}`} as OutcomeDetail)
                                                    } else if (issue.severity === 'information') {
                                                        outcomeDetails.push({status: Status.SUCCESS, resourceType, message: `Status: ${entry.response?.status}`} as OutcomeDetail)
                                                    }
                                                })
                                            } else {
                                                outcomeDetails.push({status: Status.SUCCESS, resourceType, message: `Status: ${entry.response?.status}`} as OutcomeDetail)
                                            }
                                        }) || [])
                                        .then(() => resolveBatch(outcomeDetails))
                                        .catch(err => rejectBatch(err));
                                })
                                .catch(err => {
                                    log.error(`Batch transformation process error. ${err}`);
                                    rejectBatch(err);
                                    ipcRenderer.send(ipcChannels.TO_RENDERER,
                                        ipcChannels.Deidentifier.SAVE_TO_REPO_RES_X(resourceType),
                                        {status: Status.ERROR, outcomeDetails: [{status: Status.ERROR, resourceType: 'OperationOutcome', message: err.message}]});
                                });
                        })))
                    }

                    Promise.all(batchPromiseList)
                        .then(res => {
                            if (res.length) {
                                log.info(`Batch transformation process completed for Resource: ${resourceType}`);
                                const outcomeDetails: OutcomeDetail[] = [].concat.apply([], res);
                                const status = !outcomeDetails.length || !!outcomeDetails.find(_ => _.status === Status.ERROR) ? Status.ERROR : Status.SUCCESS;
                                ipcRenderer.send(ipcChannels.TO_RENDERER, ipcChannels.Deidentifier.SAVE_TO_REPO_RES_X(resourceType), {status, outcomeDetails});
                                log.info(`Transformation completed for Resource: ${resourceType}`);
                                this.ready();
                            } else {
                                const errorMessage = `There is no ${resourceType} Resource created. See the logs for detailed error information.`;
                                ipcRenderer.send(ipcChannels.TO_RENDERER,
                                    ipcChannels.Deidentifier.SAVE_TO_REPO_RES_X(resourceType),
                                    {status: Status.ERROR, outcomeDetails: [{
                                            status: Status.ERROR,
                                            message: errorMessage,
                                            resourceType: 'OperationOutcome'
                                        }]});
                                log.error(`Batch transformation process error for Resource: ${resourceType}`);
                                this.ready();
                            }
                        })
                        .catch(err => {
                            log.error(`Batch transformation process error for Resource: ${resourceType}`);
                            this.ready();
                        })
                })
                .catch(err => {
                    log.error(`Error while saving '${resourceType}' into repo. ${err}`);
                    this.ready();
                });
        })
    }

    render (createElement: CreateElement): VNode {
        return createElement('div', {}, 'This is the background process window.')
    }

}
