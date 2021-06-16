import {Utils} from '@/common/utils/util';
import {environment} from '@/common/environment';
import Vue from 'vue'
import {FhirService} from '@/common/services/fhir.service'

export class EvaluationService {
    quasis: string[][];
    riskyQuasis: string[];
    savedResourceNumber = 0;

    constructor () {
        this.quasis = [];
        this.riskyQuasis = [];
    }

    setFhirService (fhirService: FhirService) {
        Vue.prototype.$sourceFhirService = fhirService;
        Vue.prototype.$targetFhirService = fhirService;
    }

    generateEquivalenceClasses (type, parameterMappings, typeMappings) {
        this.quasis = type.quasis;
        this.riskyQuasis = [];
        this.quasis.forEach(paths => {
            let [key, i] = [type.resource + '.' + type.profile, 0];
            while (i < paths.length) {
                key += '.' + paths[i++];
            }
            if (parameterMappings[key].name === environment.algorithms.PASS_THROUGH.name || parameterMappings[key].name === environment.algorithms.GENERALIZATION.name ||
                (parameterMappings[key].name === environment.algorithms.SUBSTITUTION.name && !environment.primitiveTypes[typeMappings[key]].regex
                    && parameterMappings[key].lengthPreserved)) {
                this.riskyQuasis.push(key);
            }
        });
        return Utils.groupBy(type.entries, item => {
            const groups: any[] = [];
            this.riskyQuasis.forEach(attribute => {
                const paths = attribute.split('.').slice(2);
                const result = Utils.returnEqClassElements(paths, item.resource, []);
                groups.push(result);
            });
            return groups; // undefined values are considered as the same
        });
    }

    validateEntries (entries): Promise<any> {
        const promises: Array<Promise<any>> = [];
        return new Promise((resolve, reject) => {
            const bulk = JSON.parse(JSON.stringify(entries)).map(element => element.resource);
            while (bulk.length) {
                promises.push(Vue.prototype.$sourceFhirService.validate(bulk.splice(0, 1000)));
            }
            Promise.all(promises).then(res => {
                resolve(res);
            }).catch(err => reject(err));
        });
    }

    saveEntries (deidentificationResults, selectedResources, isSource: boolean): Promise<any> {
        const entries: any[] = [];
        const selectedResourceNames = selectedResources.map(obj => obj.resource);
        Object.keys(deidentificationResults).forEach(resource => {
            if (selectedResourceNames.includes(resource)) {
                entries.push(...deidentificationResults[resource].entries);
                entries.push(...deidentificationResults[resource].restrictedEntries);
            }
        });

        this.savedResourceNumber = 0;
        const promises: Array<Promise<any>> = [];
        const request = isSource ? 'PUT' : 'POST';
        const service = isSource ? Vue.prototype.$sourceFhirService : Vue.prototype.$targetFhirService;
        return new Promise((resolve, reject) => {
            const bulk = JSON.parse(JSON.stringify(entries)).map(element => element.resource);
            this.savedResourceNumber += bulk.length;
            while (bulk.length) {
                promises.push(service.postBatch(bulk.splice(0, 1000), request));
            }
            Promise.all(promises).then(res => {
                resolve(this.savedResourceNumber);
            }).catch(err => reject(err));
        });
    }

}
