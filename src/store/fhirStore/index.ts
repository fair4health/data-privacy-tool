import { FhirService } from '@/common/services/fhir.service'
import { environment } from '@/common/environment'
import { FHIRUtils } from '@/common/utils/fhir-util'
import {EvaluationService} from '@/common/services/evaluation.service';
import { VuexStoreUtil as types } from '@/common/utils/vuex-store-util'
import { LocalStorageUtil as localStorageKey } from '@/common/utils/local-storage-util'
import i18n from '@/i18n';

const fhirStore = {
    capitalizeFirstLetter (str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    },
    saveObject (newId, part, state, element, type, isMultiple) {
        if (isMultiple) {
            // remove [x] at the end and put Boolean, Integer etc. instead
            newId = newId.substring(0, newId.length - 3) + fhirStore.capitalizeFirstLetter(type.code);
            part = part?.substring(0, part?.length - 3) + fhirStore.capitalizeFirstLetter(type.code);
        }
        const tmpObj = {
            value: newId,
            label: part,
            definition: element?.definition,
            comment: element?.comment,
            short: element?.short,
            min: element?.min,
            max: element?.max,
            type: type ? type.code : undefined,
            children: [],
            required: !!element?.min
        };
        if (tmpObj.value && !state.typeMappings[tmpObj.value]) {
            state.typeMappings[tmpObj.value] = tmpObj.type;
        }
        if (tmpObj.value && FHIRUtils.isPrimitive(tmpObj, state.typeMappings) && !state.attributeMappings[tmpObj.value]) {
            state.attributeMappings[tmpObj.value] = environment.attributeTypes.INSENSITIVE;
        }
        if (tmpObj.value && tmpObj.required && !state.requiredElements.includes(tmpObj.value)) {
            state.requiredElements.push(tmpObj.value);
        }
        return tmpObj;
    },
    state: {
        resourceList: null,
        profileList: null,
        elementList: null,
        elementListFlat: null,
        quasiElementList: null,
        sensitiveElementList: null,
        currentResource: '',
        currentProfile: '',
        currentAttribute: '',
        currentNode: null,
        rareElements: [],
        requiredElements: [],
        attributeMappings: {},
        parameterMappings: {},
        kAnonymityValidMappings: {},
        kValueMappings: {},
        fhirSourceBase: environment.server.config.source.baseUrl,
        fhirSourceVerificationStatus: '',
        fhirSourceVerificationStatusDetail: '',
        sourceFhirService: new FhirService(true),
        fhirTargetBase: environment.server.config.target.baseUrl,
        fhirTargetVerificationStatus: '',
        fhirTargetVerificationStatusDetail: '',
        targetFhirService: new FhirService(false),
        evaluationService: new EvaluationService(),
        typeMappings: {},
        rareValueMappings: {},
        entries: null,
        resourceProfileMappings: {},
        deidentificationResults: {},
        profileUrlMappings: {},
        outcomeDetails: [],
        selectedResources: [],
        noNodesAvailableLabel: ''
    },
    getters: {
        [types.Fhir.RESOURCE_LIST]: state => state.resourceList || [],
        [types.Fhir.PROFILE_LIST]: state => state.profileList || [],
        [types.Fhir.ELEMENT_LIST]: state => state.elementList || [],
        [types.Fhir.ELEMENT_LIST_FLAT]: state => state.elementListFlat || [],
        [types.Fhir.QUASI_ELEMENT_LIST]: state => state.quasiElementList || [],
        [types.Fhir.SENSITIVE_ELEMENT_LIST]: state => state.sensitiveElementList || [],
        [types.Fhir.CURRENT_RESOURCE]: state => state.currentResource || '',
        [types.Fhir.CURRENT_PROFILE]: state => state.currentProfile || '',
        [types.Fhir.CURRENT_ATTRIBUTE]: state => state.currentAttribute || '',
        [types.Fhir.CURRENT_NODE]: state => state.currentNode || null,
        [types.Fhir.RARE_ELEMENTS]: state => state.rareElements || [],
        [types.Fhir.REQUIRED_ELEMENTS]: state => state.requiredElements || [],
        [types.Fhir.ATTRIBUTE_MAPPINGS]: state => state.attributeMappings || {},
        [types.Fhir.PARAMETER_MAPPINGS]: state => state.parameterMappings || {},
        [types.Fhir.K_ANONYMITY_VALID_MAPPINGS]: state => state.kAnonymityValidMappings || {},
        [types.Fhir.K_VALUE_MAPPINGS]: state => state.kValueMappings || {},
        [types.Fhir.FHIR_SOURCE_BASE]: state => state.fhirSourceBase,
        [types.Fhir.FHIR_SOURCE_VERIFICATION_STATUS]: state => state.fhirSourceVerificationStatus,
        [types.Fhir.FHIR_SOURCE_VERIFICATION_STATUS_DETAIL]: state => state.fhirSourceVerificationStatusDetail,
        [types.Fhir.FHIR_TARGET_BASE]: state => state.fhirTargetBase,
        [types.Fhir.FHIR_TARGET_VERIFICATION_STATUS]: state => state.fhirTargetVerificationStatus,
        [types.Fhir.FHIR_TARGET_VERIFICATION_STATUS_DETAIL]: state => state.fhirTargetVerificationStatusDetail,
        [types.Fhir.TYPE_MAPPINGS]: state => state.typeMappings || {},
        [types.Fhir.RARE_VALUE_MAPPINGS]: state => state.rareValueMappings || {},
        [types.Fhir.RESOURCE_PROFILE_MAPPINGS]: state => state.resourceProfileMappings || {},
        [types.Fhir.DEIDENTIFICATION_RESULTS]: state => state.deidentificationResults || {},
        [types.Fhir.PROFILE_URL_MAPPINGS]: state => state.profileUrlMappings || {},
        [types.Fhir.OUTCOME_DETAILS]: state => state.outcomeDetails || [],
        [types.Fhir.SELECTED_RESOURCES]: state => state.selectedResources || [],
        [types.Fhir.NO_NODES_AVAILABLE_LABEL]: state => state.noNodesAvailableLabel || ''
    },
    mutations: {
        [types.Fhir.SET_RESOURCE_LIST] (state, list) {
            state.resourceList = list
        },
        [types.Fhir.SET_PROFILE_LIST] (state, list) {
            state.profileList = list
        },
        [types.Fhir.SET_ELEMENT_LIST] (state, list) {
            state.elementList = list?.length ? FHIRUtils.filterDataTypes(list, state) : [];
            state.elementListFlat = list?.length ? FHIRUtils.flatten(list) : [];
            state.quasiElementList = list?.length ? FHIRUtils.filterByAttributeType(list, state.attributeMappings,
                                                        environment.attributeTypes.QUASI, state.typeMappings) : [];
            state.sensitiveElementList = list?.length ? FHIRUtils.filterByAttributeType(list, state.attributeMappings,
                                                        environment.attributeTypes.SENSITIVE, state.typeMappings) : [];
        },
        [types.Fhir.SET_RARE_ELEMENTS] (state, list) {
            state.rareElements = list;
        },
        [types.Fhir.SET_REQUIRED_ELEMENTS] (state, list) {
            state.requiredElements = list;
        },
        [types.Fhir.SET_ATTRIBUTE_MAPPINGS] (state, value) {
            state.attributeMappings = value
        },
        [types.Fhir.SET_PARAMETER_MAPPINGS] (state, value) {
            state.parameterMappings = value
        },
        [types.Fhir.SET_CURRENT_RESOURCE] (state, value) {
            state.currentResource = value
        },
        [types.Fhir.SET_CURRENT_PROFILE] (state, value) {
            state.currentProfile = value
        },
        [types.Fhir.SET_CURRENT_ATTRIBUTE] (state, value) {
            state.currentAttribute = value
        },
        [types.Fhir.SET_CURRENT_NODE] (state, value) {
            state.currentNode = value
        },
        [types.Fhir.SET_K_ANONYMITY_VALID_MAPPINGS] (state, value) {
            state.kAnonymityValidMappings = value
        },
        [types.Fhir.SET_K_VALUE_MAPPINGS] (state, value) {
          state.kValueMappings = value
        },
        [types.Fhir.UPDATE_FHIR_SOURCE_BASE] (state, sourceRepoUrl: string) {
            state.fhirSourceBase = sourceRepoUrl;
            state.sourceFhirService = new FhirService(true, sourceRepoUrl);
            localStorage.setItem(localStorageKey.FHIR_SOURCE_URL, sourceRepoUrl);
        },
        [types.Fhir.SET_FHIR_SOURCE_VERIFICATION_STATUS] (state, status: status) {
            state.fhirSourceVerificationStatus = status
        },
        [types.Fhir.SET_FHIR_SOURCE_VERIFICATION_STATUS_DETAIL] (state, details: string) {
            state.fhirSourceVerificationStatusDetail = details
        },
        [types.Fhir.UPDATE_FHIR_TARGET_BASE] (state, targetRepoUrl: string) {
            state.fhirTargetBase = targetRepoUrl;
            state.targetFhirService = new FhirService(false, targetRepoUrl);
            localStorage.setItem(localStorageKey.FHIR_TARGET_URL, targetRepoUrl);
        },
        [types.Fhir.SET_FHIR_TARGET_VERIFICATION_STATUS] (state, status: status) {
            state.fhirTargetVerificationStatus = status
        },
        [types.Fhir.SET_FHIR_TARGET_VERIFICATION_STATUS_DETAIL] (state, details: string) {
            state.fhirTargetVerificationStatusDetail = details
        },
        [types.Fhir.SET_TYPE_MAPPINGS] (state, value) {
            state.typeMappings = value
        },
        [types.Fhir.SET_RARE_VALUE_MAPPINGS] (state, value) {
            state.rareValueMappings = value
        },
        [types.Fhir.SET_RESOURCE_PROFILE_MAPPINGS] (state, value) {
            state.resourceProfileMappings = value
        },
        [types.Fhir.SET_DEIDENTIFICATION_RESULTS] (state, value) {
            state.deidentificationResults = value
        },
        [types.Fhir.SET_PROFILE_URL_MAPPINGS] (state, value) {
            state.profileUrlMappings = value
        },
        [types.Fhir.SET_OUTCOME_DETAILS] (state, outcomeDetails: OutcomeDetail[]) {
            state.outcomeDetails = outcomeDetails
        },
        [types.Fhir.SET_SELECTED_RESOURCES] (state, value) {
            state.selectedResources = value;
        },
        [types.Fhir.NO_NODES_AVAILABLE_LABEL] (state, value: string) {
            state.noNodesAvailableLabel = value;
        }
    },
    actions: {
        [types.Fhir.GET_RESOURCES] ({ commit, state }): Promise<boolean> {
            return new Promise((resolve, reject) => {
                state.sourceFhirService.search('CapabilityStatement', null)
                    .then(res => {
                        const bundle = res.data as fhir.Bundle;
                        const resource = bundle.entry?.length ? bundle.entry[0].resource as fhir.CapabilityStatement : null;
                        if (resource && resource.rest?.length && resource.rest[0].resource?.length) {
                            Promise.all(resource.rest[0].resource.map(item => {
                                const resourceType = item.type;
                                return new Promise<any>((resolve1, reject1) => {
                                    state.sourceFhirService.search(resourceType, null)
                                        .then(response => {
                                            const count: number = response.data.total;
                                            resolve1({resourceType, count});
                                        }).catch(err => reject1(err) );
                                })
                            })).then(counts => {
                                const availableResources: any[] = [];
                                for (const counter of counts) {
                                    if (counter.count && !environment.resourceTypesToBeFiltered.includes(counter.resourceType)) {
                                        availableResources.push(counter.resourceType);
                                    }
                                }
                                commit(types.Fhir.SET_RESOURCE_LIST, availableResources);
                                resolve(true)
                            }).catch(err => reject(err));
                        }
                    }).catch(err => reject(err) )
            })
        },
        [types.Fhir.GET_PROFILES_BY_RES] ({ commit, state }, resource: string): Promise<boolean> {
            return new Promise((resolve, reject) => {
                state.sourceFhirService.search('StructureDefinition',
                    {_summary: 'data', base: `${environment.hl7}/StructureDefinition/${resource}`}, true)
                    .then(res => {
                        if (res.data.total > 0) {
                            Promise.all(res.data.entry.map(item => {
                                const [resourceType, profile, url, title, description] = [item.resource.type,
                                    item.resource.id, item.resource.url, item.resource.title, item.resource.description];
                                state.profileUrlMappings[profile] = url;
                                return new Promise<any>((resolve1, reject1) => {
                                    state.sourceFhirService.search(resourceType, {_profile: url})
                                        .then(response => {
                                            const count: number = response.data.total;
                                            resolve1({resourceType, profile, count, title, description});
                                        }).catch(err => reject1(err));
                                })
                            })).then((counts: any) => {
                                const availableProfiles: any[] = [];
                                for (const counter of counts) {
                                    if (counter.count) { // take only profiles that has data on repository
                                        availableProfiles.push(counter);
                                    }
                                }
                                commit(types.Fhir.SET_PROFILE_LIST, availableProfiles.map(e => {
                                    return {id: e.profile, title: e.title, description: e.description}
                                }) || []);
                                resolve(true)
                            }).catch(err => reject(err));
                        } else {
                            commit(types.Fhir.SET_PROFILE_LIST, [])
                            resolve(true);
                        }
                    }).catch(err => reject(err));
            })
        },
        [types.Fhir.GET_ELEMENTS] ({ commit, state }, profileId: string): Promise<boolean> {
            return new Promise((resolve, reject) => {
                state.sourceFhirService.search('StructureDefinition', {_id: profileId}, true)
                    .then(res => {
                        const bundle = res.data as fhir.Bundle;
                        if (bundle.entry?.length) {
                            const resource = bundle.entry[0].resource as fhir.StructureDefinition;
                            const list: fhir.ElementTree[] = [];
                            resource?.snapshot?.element.forEach((element) => {
                                const parts = element?.id?.split('.') || [];
                                parts.splice(1, 0, profileId);
                                const newId = parts.join('.');
                                let tmpList = list;
                                let part = parts.shift();
                                while (part) {
                                    let match = tmpList.findIndex(l => l.label === part);
                                    if (match === -1) {
                                        match = 0;
                                        if (element.type && (element.type.length > 1 || element.id?.slice(-3) === '[x]' )) { // multiple types
                                            element.type.forEach(type => {
                                                const tmpObj = fhirStore.saveObject(newId, part, state, element, type, true);
                                                tmpList.push(tmpObj);
                                            });
                                        } else {
                                            const tmpObj = fhirStore.saveObject(newId, part, state, element, element.type ? element.type[0] : undefined, false);
                                            tmpList.push(tmpObj);
                                        }
                                    }
                                    tmpList = tmpList[match].children as fhir.ElementTree[];
                                    part = parts.shift()
                                }
                            });
                            commit(types.Fhir.SET_ELEMENT_LIST, list);
                            resolve(true)
                        } else {
                            resolve(false)
                        }
                    })
                    .catch(err => reject(err) )
            })
        },
        [types.Fhir.CALCULATE_RISKS] ({ state }, type) {
            const tempRisk = {profile: type.profile, lowestProsecutor: 0, highestProsecutor: 0, averageProsecutor: 0,
                recordsAffectedByLowest: 0, recordsAffectedByHighest: 0};
            const equivalenceClasses = state.evaluationService.generateEquivalenceClasses(type, state.parameterMappings, state.typeMappings);
            const totalNumberOfRecords = type.entries.length;
            const numberOfEqClasses = equivalenceClasses.length;
            const maxLengthOfEqClasses = Math.max.apply(Math, equivalenceClasses.map(a => a.length));
            const minLengthOfEqClasses = Math.min.apply(Math, equivalenceClasses.map(a => a.length));
            tempRisk.lowestProsecutor = 1 / maxLengthOfEqClasses;
            tempRisk.highestProsecutor = 1 / minLengthOfEqClasses;
            tempRisk.averageProsecutor = numberOfEqClasses / totalNumberOfRecords;

            const numberOfRecsAffectedByLowest = equivalenceClasses.map(a => a.length).filter(a => a >= maxLengthOfEqClasses).length;
            const numberOfRecsAffectedByHighest = equivalenceClasses.map(a => a.length).filter(a => a >= minLengthOfEqClasses).length;
            tempRisk.recordsAffectedByLowest = numberOfRecsAffectedByLowest / totalNumberOfRecords;
            tempRisk.recordsAffectedByHighest = numberOfRecsAffectedByHighest / totalNumberOfRecords;

            state.deidentificationResults[type.resource].risks.push(tempRisk);

            // AECS F. Kohlmayer, et al. in https://doi.org/10.1016/j.jbi.2015.09.007
            // https://books.google.com.tr/books?id=2R7XTlebSF8C&pg=PA215&lpg=PA215&dq=Average+Equivalence+Class+Size&source=bl&ots=WAbLwIhZiY&sig=ACfU3U1viElk7WQkkJIN9CxiWVkFHOfb0A&hl=tr&sa=X&ved=2ahUKEwj_wYqbn9npAhXQOcAKHaWeCDoQ6AEwCXoECAgQAg#v=onepage&q=Average%20Equivalence%20Class%20Size&f=false
            let eqClassSizesSum = 0;
            equivalenceClasses.forEach(eqClass => {
                eqClassSizesSum += Math.pow(eqClass.length, 2);
            })
            state.deidentificationResults[type.resource].informationLoss = eqClassSizesSum / Math.pow(totalNumberOfRecords, 2);
        },
        [types.Fhir.VALIDATE_ENTRIES] ({ state }, entries): Promise<any> {
            return state.evaluationService.validateEntries(entries);
        },
        [types.Fhir.SAVE_ENTRIES] ({ state }, isSource): Promise<any> {
            return state.evaluationService.saveEntries(state.deidentificationResults, state.selectedResources, isSource);
        },
        [types.Fhir.VERIFY_FHIR] ({ state }, isSource): Promise<any> {
            return new Promise((resolve, reject) => {
                const service = isSource ? state.sourceFhirService : state.targetFhirService;
                service.search('metadata', {}, true)
                    .then(res => {
                        const metadata: fhir.CapabilityStatement = res.data;
                        if (metadata.fhirVersion) {
                            if (environment.server.compatibleFhirVersions.includes(metadata.fhirVersion)) {
                                resolve(res)
                            } else {
                                reject(i18n.t('ERROR.FHIR_VERSION_NOT_SUPPORTED', {version: metadata.fhirVersion}))
                            }
                        } else {
                            reject(i18n.t('ERROR.FHIR_VERSION_COULDNT_DETECTED'))
                        }
                    })
                    .catch(err => reject(i18n.t('ERROR.FHIR_URL_NOT_VERIFIED')))
            })
        },
        [types.Fhir.CURRENT_STATE] ({ state }) {
            return new Promise((resolve, reject) => {
                const exportableState = {};
                for (const key of Object.keys(state)) {
                    if (environment.exportableAttributes.includes(key)) {
                        exportableState[key] = JSON.parse(JSON.stringify(state[key]));
                    }
                }
                resolve(exportableState);
            })
        },
        [types.Fhir.IMPORT_STATE] ( { state }, newState ) {
            return new Promise((resolve, reject) => {
                for (const key of Object.keys(newState)) {
                    if (environment.exportableAttributes.includes(key)) {
                        state[key] = JSON.parse(JSON.stringify(newState[key]));
                    }
                }
                resolve();
            })
        }
    }
};

export default fhirStore
