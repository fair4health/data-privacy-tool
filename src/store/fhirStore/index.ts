import { FhirService } from '@/common/services/fhir.service'
import { environment } from '@/common/environment'
import { FHIRUtils } from '@/common/utils/fhir-util'
import {EvaluationService} from '@/common/services/evaluation.service';
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
    namespaced: true,
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
        sourceFhirService: new FhirService(true),
        fhirTargetBase: environment.server.config.target.baseUrl,
        fhirTargetVerificationStatus: '',
        targetFhirService: new FhirService(false),
        evaluationService: new EvaluationService(),
        typeMappings: {},
        rareValueMappings: {},
        entries: null,
        resourceProfileMappings: {},
        deidentificationResults: {},
        profileUrlMappings: {},
        outcomeDetails: [],
        selectedResources: []
    },
    getters: {
        resourceList: state => state.resourceList || [],
        profileList: state => state.profileList || [],
        elementList: state => state.elementList || [],
        elementListFlat: state => state.elementListFlat || [],
        quasiElementList: state => state.quasiElementList || [],
        sensitiveElementList: state => state.sensitiveElementList || [],
        currentResource: state => state.currentResource || '',
        currentProfile: state => state.currentProfile || '',
        currentAttribute: state => state.currentAttribute || '',
        currentNode: state => state.currentNode || null,
        rareElements: state => state.rareElements || [],
        requiredElements: state => state.requiredElements || [],
        attributeMappings: state => state.attributeMappings || {},
        parameterMappings: state => state.parameterMappings || {},
        kAnonymityValidMappings: state => state.kAnonymityValidMappings || {},
        kValueMappings: state => state.kValueMappings || {},
        fhirSourceBase: state => state.fhirSourceBase,
        fhirSourceVerificationStatus: state => state.fhirSourceVerificationStatus,
        sourceFhirService: state => state.sourceFhirService,
        fhirTargetBase: state => state.fhirTargetBase,
        fhirTargetVerificationStatus: state => state.fhirTargetVerificationStatus,
        targetFhirService: state => state.targetFhirService,
        evaluationService: state => state.evaluationService,
        typeMappings: state => state.typeMappings || {},
        rareValueMappings: state => state.rareValueMappings || {},
        resourceProfileMappings: state => state.resourceProfileMappings || {},
        deidentificationResults: state => state.deidentificationResults || {},
        profileUrlMappings: state => state.profileUrlMappings || {},
        outcomeDetails: state => state.outcomeDetails || [],
        selectedResources: state => state.selectedResources || []
    },
    mutations: {
        setResourceList (state, list) {
            state.resourceList = list
        },
        setProfileList (state, list) {
            state.profileList = list
        },
        setElementList (state, list) {
            state.elementList = list?.length ? FHIRUtils.filterDataTypes(list, state) : [];
            state.elementListFlat = list?.length ? FHIRUtils.flatten(list) : [];
            state.quasiElementList = list?.length ? FHIRUtils.filterByAttributeType(list, state.attributeMappings,
                                                        environment.attributeTypes.QUASI, state.typeMappings) : [];
            state.sensitiveElementList = list?.length ? FHIRUtils.filterByAttributeType(list, state.attributeMappings,
                                                        environment.attributeTypes.SENSITIVE, state.typeMappings) : [];
        },
        setRareElements (state, list) {
            state.rareElements = list;
        },
        setRequiredElements (state, list) {
            state.requiredElements = list;
        },
        setAttributeMappings (state, value) {
            state.attributeMappings = value
        },
        setParameterMappings (state, value) {
            state.parameterMappings = value
        },
        setCurrentResource (state, value) {
            state.currentResource = value
        },
        setCurrentProfile (state, value) {
            state.currentProfile = value
        },
        setCurrentAttribute (state, value) {
            state.currentAttribute = value
        },
        setCurrentNode (state, value) {
            state.currentNode = value
        },
        setKAnonymityValidMappings (state, value) {
            state.kAnonymityValidMappings = value
        },
        setKValueMappings (state, value) {
          state.kValueMappings = value
        },
        updateFhirSourceBase (state, sourceRepoUrl: string) {
            state.fhirSourceBase = sourceRepoUrl;
            state.sourceFhirService = new FhirService(true, sourceRepoUrl);
            localStorage.setItem('fhirSourceUrl', sourceRepoUrl);
        },
        setFhirSourceVerificationStatus (state, status: status) {
            state.fhirSourceVerificationStatus = status
        },
        updateFhirTargetBase (state, targetRepoUrl: string) {
            state.fhirTargetBase = targetRepoUrl;
            state.targetFhirService = new FhirService(false, targetRepoUrl);
            localStorage.setItem('fhirTargetUrl', targetRepoUrl);
        },
        setFhirTargetVerificationStatus (state, status: status) {
            state.fhirTargetVerificationStatus = status
        },
        setTypeMappings (state, value) {
            state.typeMappings = value
        },
        setRareValueMappings (state, value) {
            state.rareValueMappings = value
        },
        setResourceProfileMappings (state, value) {
            state.resourceProfileMappings = value
        },
        setDeidentificationResults (state, value) {
            state.deidentificationResults = value
        },
        setProfileUrlMappings (state, value) {
            state.profileUrlMappings = value
        },
        setOutcomeDetails (state, outcomeDetails: OutcomeDetail[]) {
            state.outcomeDetails = outcomeDetails
        },
        setSelectedResources (state, value) {
            state.selectedResources = value;
        }
    },
    actions: {
        getResources ({ commit, state }): Promise<boolean> {
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
                                            const count: number = response.data.entry.length;
                                            resolve1({resourceType, count});
                                        })
                                        .catch(err => reject(err) );
                                })
                            })).then(counts => {
                                const availableResources: any[] = [];
                                for (const counter of counts) {
                                    if (counter.count && !environment.resourceTypesToBeFiltered.includes(counter.resourceType)) {
                                        availableResources.push(counter.resourceType);
                                    }
                                }
                                commit('setResourceList', availableResources);
                                resolve(true)
                            }).catch(err => reject(err));
                        }
                    })
                    .catch(err => reject(err) )
            })
        },
        getProfilesByRes ({ commit, state }, resource: string): Promise<boolean> {
            return new Promise((resolve, reject) => {
                state.sourceFhirService.search('StructureDefinition',
                    {_summary: 'data', base: `${environment.hl7}/StructureDefinition/${resource}`}, true)
                    .then(res => {
                        Promise.all(res.data.entry.map(item => {
                            const [resourceType, profile, url, title, description] = [item.resource.type,
                                item.resource.id, item.resource.url, item.resource.title, item.resource.description];
                            state.profileUrlMappings[profile] = url;
                            return new Promise<any>((resolve1, reject1) => {
                                state.sourceFhirService.search(resourceType, {_profile: url})
                                    .then(response => {
                                        const count: number = response.data.entry.length;
                                        resolve1({resourceType, profile, count, title, description});
                                    })
                                .catch(err => reject(err) );
                            })
                        })).then((counts: any) => {
                            const availableProfiles: any[] = [];
                            for (const counter of counts) {
                                if (counter.count) { // take only profiles that has data on repository
                                    availableProfiles.push(counter);
                                }
                            }
                            commit('setProfileList', availableProfiles.map(e => {
                                return {id: e.profile, title: e.title, description: e.description}
                            }) || []);
                            resolve(true)
                        }).catch(err => reject(err));
                    })
                    .catch(err => reject(err) )
            })
        },
        getElements ({ commit, state }, profileId: string): Promise<boolean> {
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
                            commit('setElementList', list);
                        }
                        resolve(true)
                    })
                    .catch(err => reject(err) )
            })
        },
        calculateRisks ({ state }, type) {
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
        validateEntries ({ state }, entries): Promise<any> {
            return state.evaluationService.validateEntries(entries);
        },
        saveEntries ({ state }, isSource): Promise<any> {
            return state.evaluationService.saveEntries(state.deidentificationResults, state.selectedResources, isSource);
        },
        verifyFhir ({ state }, isSource): Promise<any> {
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
        currentState ({ state }) {
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
        importState ( { state }, newState ) {
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
