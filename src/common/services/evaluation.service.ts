import {FhirService} from '@/common/services/fhir.service';
import {Utils} from '@/common/utils/util';
import {environment} from '@/common/environment';

export class EvaluationService {
    fhirService: FhirService;
    quasis: string[][];
    riskyQuasis: string[];
    savedResourceNumber = 0;

    constructor () {
        this.fhirService = new FhirService();
        this.quasis = [];
        this.riskyQuasis = [];
    }

    generateEquivalenceClasses (type, parameterMappings, typeMappings) {
        this.quasis = type.quasis;
        this.riskyQuasis = [];
        this.quasis.forEach(paths => {
            let [key, i] = [type.resource + '.' + type.profile, 0];
            while (i < paths.length) {
                key += '.' + paths[i++];
            }
            if (parameterMappings[key].name === 'Pass Through' || parameterMappings[key].name === 'Generalization' ||
                (parameterMappings[key].name === 'Substitution' && !environment.primitiveTypes[typeMappings[key]].regex
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
                promises.push(this.fhirService.validate(bulk.splice(0, 1000)));
            }
            Promise.all(promises).then(res => {
                resolve(res);
            });
        });
    }

    saveEntries (deidentificationResults, request: 'POST' | 'PUT'): Promise<any> {
        const entries: any[] = [];
        Object.keys(deidentificationResults).forEach(resource => {
            entries.push(...deidentificationResults[resource].entries);
        });
        entries.forEach(entry => {
            entry.resource.meta.security = [{
                system : 'http://terminology.hl7.org/CodeSystem/v3-ObservationValue',
                code : 'ANONYED',
                display : 'anonymized'
            }];

            // todo any other security labels can be used? https://www.hl7.org/fhir/valueset-security-labels.html

        });

        this.savedResourceNumber = 0;
        const promises: Array<Promise<any>> = [];
        return new Promise((resolve, reject) => {
            const bulk = JSON.parse(JSON.stringify(entries)).map(element => element.resource);
            this.savedResourceNumber += bulk.length;
            while (bulk.length) {
                promises.push(this.fhirService.postBatch(bulk.splice(0, 1000), request));
            }
            Promise.all(promises).then(res => {
                resolve(this.savedResourceNumber);
            });
        });
    }

}
