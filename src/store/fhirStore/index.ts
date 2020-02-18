import { FhirService } from '@/common/services/fhir.service'
import { environment } from '@/common/environment'
import StructureDefinition = fhir.StructureDefinition;
import { FHIRUtils } from '@/common/utils/fhir-util'

const fhirService = new FhirService();

const fhirStore = {
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
    selectedResources: [],
    selectedProfiles: [],
    rareElements: [],
    attributeMappings: {},
    parameterMappings: {},
    kValue: 5
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
    selectedResources: state => state.selectedResources || [],
    selectedProfiles: state => state.selectedProfiles || [],
    rareElements: state => state.rareElements || [],
    attributeMappings: state => state.attributeMappings || {},
    parameterMappings: state => state.parameterMappings || {},
    kValue: state => state.kValue || 5
  },
  mutations: {
    setResourceList (state, list) {
      state.resourceList = list
    },
    setProfileList (state, list) {
      state.profileList = list
    },
    setElementList (state, list) {
      state.elementList = list;
      state.elementListFlat = list?.length ? FHIRUtils.flatten(list) : [];
      state.quasiElementList = list?.length ? FHIRUtils.filterByAttributeType(list, state.attributeMappings, environment.attributeTypes.QUASI) : [];
      state.sensitiveElementList = list?.length ? FHIRUtils.filterByAttributeType(list, state.attributeMappings, environment.attributeTypes.SENSITIVE) : [];
    },
    setRareElements (state, list) {
      state.rareElements = list;
    },
    setAttributeMappings (state, value) {
      state.attributeMappings = value
    },
    setParameterMappings (state, value) {
      state.parameterMappings = value
    },
    setSelectedResources (state, list) {
      state.selectedResources = list
    },
    setSelectedProfiles (state, list) {
      state.selectedProfiles = list
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
    setKValue (state, value) {
      state.kValue = value;
    }
  },
  actions: {
    getResources ({ commit }): Promise<boolean> {
      return new Promise((resolve, reject) => {
        fhirService.search('CapabilityStatement', null)
          .then(res => {
            const bundle = res.data as fhir.Bundle;
            const resource = bundle.entry?.length ? bundle.entry[0].resource as fhir.CapabilityStatement : null;
            if (resource && resource.rest?.length && resource.rest[0].resource?.length) {
              Promise.all(resource.rest[0].resource.map(item => {
                const resourceType = item.type;
                return new Promise<any>((resolve1, reject1) => {
                  fhirService.search(resourceType, null)
                    .then(response => {
                      const count: number = response.data.entry.length;
                      resolve1({resourceType, count});
                    })
                    .catch(err => reject(err) );
                })
              })).then(counts => {
                const availableResources: any[] = [];
                for (const counter of counts) {
                  if (counter.count) {
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
    getProfilesByRes ({ commit }, resource: string): Promise<boolean> {
      return new Promise((resolve, reject) => {
        fhirService.search('StructureDefinition',
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
            //     fhirService.search(resourceType, {_profile: url})
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
              return {id: structure.id, title: structure.title}
            }) || []);
            resolve(true)
          })
          .catch(err => reject(err) )
      })
    },
    getElements ({ commit }, profileId: string): Promise<boolean> {
      return new Promise((resolve, reject) => {
        fhirService.search('StructureDefinition', {_id: profileId}, true)
          .then(res => {
            const bundle = res.data as fhir.Bundle;
            if (bundle.entry?.length) {
              const resource = bundle.entry[0].resource as fhir.StructureDefinition;
              const list: fhir.ElementTree[] = [];
              const attributes: {} = {};
              let attributeChanged = false;
              resource?.snapshot?.element.forEach((element) => {
                const parts = element?.id?.split('.') || [];
                let part: any;
                let tmpList = list;
                part = parts.shift();
                while (part) {
                  let match = tmpList.findIndex(l => l.label === part);
                  if (match === -1) {
                    match = 0;
                    const tmpObj = {
                      value: element?.id,
                      label: part,
                      definition: element?.definition,
                      comment: element?.comment,
                      short: element?.short,
                      min: element?.min,
                      max: element?.max,
                      type: element.type?.map(_ => _.code) || [],
                      selectedType: (element.type && element.type[0]) ? element.type[0].code : undefined,
                      children: [],
                      required: !!element?.min
                    };
                    tmpList.push(tmpObj);
                    if (tmpObj.value && FHIRUtils.isPrimitive(tmpObj) && !attributes[tmpObj.value]) {
                      attributes[tmpObj.value] = environment.attributeTypes.INSENSITIVE;
                      attributeChanged = true;
                    }
                  }
                  tmpList = tmpList[match].children as fhir.ElementTree[];
                  part = parts.shift()
                }
              });
              commit('setElementList', list);
              if (attributeChanged) {
                commit('setAttributeMappings', attributes);
              }
            }
            resolve(true)
          })
          .catch(err => reject(err) )
      })
    }
  }
};

export default fhirStore
