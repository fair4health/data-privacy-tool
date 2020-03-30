import { FhirService } from '@/common/services/fhir.service'
import { environment } from '@/common/environment'
import StructureDefinition = fhir.StructureDefinition;
import { FHIRUtils } from '@/common/utils/fhir-util'
import {EvaluationService} from '@/common/services/evaluation.service';

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
        fhirBase: environment.server.config.baseUrl,
        fhirService: new FhirService(),
        evaluationService: new EvaluationService(),
        typeMappings: {},
        rareValueMappings: {},
        entries: null
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
        fhirBase: state => state.fhirBase,
        fhirService: state => state.fhirService,
        evaluationService: state => state.evaluationService,
        typeMappings: state => state.typeMappings || {},
        rareValueMappings: state => state.rareValueMappings || {}
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
        updateFhirBase (state, baseUrl: string) {
            state.fhirBase = baseUrl;
            state.fhirService = new FhirService(baseUrl);
            localStorage.setItem('fhirBaseUrl', baseUrl);
        },
        setTypeMappings (state, value) {
            state.typeMappings = value
        },
        setRareValueMappings (state, value) {
            state.rareValueMappings = value
        }
    },
    actions: {
        getResources ({ commit, state }): Promise<boolean> {
            return new Promise((resolve, reject) => {
                state.fhirService.search('CapabilityStatement', null)
                    .then(res => {
                        const bundle = res.data as fhir.Bundle;
                        const resource = bundle.entry?.length ? bundle.entry[0].resource as fhir.CapabilityStatement : null;
                        if (resource && resource.rest?.length && resource.rest[0].resource?.length) {
                            Promise.all(resource.rest[0].resource.map(item => {
                                const resourceType = item.type;
                                return new Promise<any>((resolve1, reject1) => {
                                    state.fhirService.search(resourceType, null)
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
                state.fhirService.search('StructureDefinition',
                    {_summary: 'data', base: `${environment.hl7}/StructureDefinition/${resource}`}, true)
                    .then(res => {
                        const bundle = res.data as fhir.Bundle;

                        // TODO after _profile query is fixed on onFhir, only profiles that has data will be filtered

                        // Promise.all(res.data.entry.map(item => {
                        //   // console.log(item);
                        //   const resourceType = item.resource.type;
                        //   const url = item.resource.url;
                        //   // console.log(resourceType, url);
                        //   return new Promise<any>((resolve1, reject1) => {
                        //     state.fhirService.search(resourceType, {_profile: url})
                        //       .then(response => {
                        //         // console.log(url, response);
                        //         const count: number = response.data.entry.length;
                        //         resolve1({resourceType, count});
                        //       })
                        //       .catch(err => reject(err) );
                        //   })
                        // })).then(counts => {
                        //   // console.log('counts', counts);
                        //   const availableResources: any[] = [];
                        //   for (const counter of counts) {
                        //     // if (counter.count) {
                        //     // availableResources.push(counter.resourceType);
                        //     // }
                        //   }
                        //   // commit('setResourceList', availableResources);
                        //   // resolve(true)
                        // }).catch(err => reject(err));


                        commit('setProfileList', bundle.entry?.map(e => {
                            const structure = e.resource as fhir.StructureDefinition;
                            return {id: structure.id, title: structure.title, description: structure.description}
                        }) || []);
                        resolve(true)
                    })
                    .catch(err => reject(err) )
            })
        },
        getElements ({ commit, state }, profileId: string): Promise<boolean> {
            return new Promise((resolve, reject) => {
                state.fhirService.search('StructureDefinition', {_id: profileId}, true)
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
        searchResource ({ commit, state }, resourceType: string): Promise<any> {
            return new Promise((resolve, reject) => {
                state.fhirService.search(resourceType, {}, true)
                    .then(res => resolve(res))
                    .catch(err => reject(err))
            })
        },
        calculateRisks ({ state }, type) {
            state.entries = JSON.parse(JSON.stringify(type.entries));
            state.evaluationService.generateEquivalenceClasses(type, state.parameterMappings, state.typeMappings);
            const totalNumberOfRecords = state.entries.length;
            const numberOfEqClasses = state.evaluationService.equivalenceClasses.length;
            const maxLengthOfEqClasses = Math.max.apply(Math, state.evaluationService.equivalenceClasses.map(a => a.length));
            const minLengthOfEqClasses = Math.min.apply(Math, state.evaluationService.equivalenceClasses.map(a => a.length));
            state.evaluationService.lowestProsecutor = 1 / maxLengthOfEqClasses;
            state.evaluationService.highestProsecutor = 1 / minLengthOfEqClasses;
            state.evaluationService.averageProsecutor = numberOfEqClasses / totalNumberOfRecords;

            const numberOfRecsAffectedByLowest = state.evaluationService.equivalenceClasses.map(a => a.length).filter(a => a >= maxLengthOfEqClasses).length;
            const numberOfRecsAffectedByHighest = state.evaluationService.equivalenceClasses.map(a => a.length).filter(a => a >= minLengthOfEqClasses).length;
            state.evaluationService.recordsAffectedByLowest = numberOfRecsAffectedByLowest / totalNumberOfRecords;
            state.evaluationService.recordsAffectedByHighest = numberOfRecsAffectedByHighest / totalNumberOfRecords;
        },
        saveEntries ({ state }, request: 'POST' | 'PUT'): Promise<any> {
            return state.evaluationService.saveEntries(state.entries, request);
        }
    }
};

export default fhirStore
