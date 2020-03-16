import {FhirService} from '@/common/services/fhir.service';
import {Utils} from '@/common/utils/util';

export class EvaluationService {
    fhirService: FhirService;
    quasis: string[][];
    riskyQuasis: string[];
    savedResourceNumber = 0;
    equivalenceClasses: string[] = [];
    lowestProsecutor = 0;
    highestProsecutor = 0;
    averageProsecutor = 0;
    recordsAffectedByLowest = 0;
    recordsAffectedByHighest = 0;

    constructor () {
        this.fhirService = new FhirService();
        this.quasis = [];
        this.riskyQuasis = [];
        this.equivalenceClasses = [];
    }

    generateEquivalenceClasses (type, parameterMappings) {
        this.quasis = type.quasis;
        this.riskyQuasis = [];
        this.quasis.forEach(paths => {
            let [key, i] = [type.resource + '.' + type.profile, 0];
            while (i < paths.length) {
                key += '.' + paths[i++];
            }
            if (parameterMappings[key].name === 'Pass Through' || parameterMappings[key].name === 'Generalization' ||
                (parameterMappings[key].name === 'Substitution' && parameterMappings[key].lengthPreserved)) {
                this.riskyQuasis.push(key);
            }
        });
        this.equivalenceClasses = Utils.groupBy(type.entries, item => {
            const groups: any[] = [];
            this.riskyQuasis.forEach(attribute => {
                const paths = attribute.split('.').slice(2);
                const result = this.returnElements(paths, item.resource, []);
                groups.push(result);
            });
            return groups; // undefined values are considered as the same
        });
    }

    returnElements (paths, item, result) {
        let i = 0;
        while (i < paths.length) {
            const element = item[paths[i]];
            if (Utils.isArray(element)) {
                for (const arrayElement of element) {
                    if (paths.length > i + 1) {
                        return this.returnElements(paths.splice(i + 1), arrayElement, result);
                    } else {
                        return arrayElement;
                    }
                }
            } else {
                return element;
            }
            i++;
        }
        return result;
    }

    saveEntries (entries, request: 'POST' | 'PUT'): Promise<any> {
        const promises: Array<Promise<any>> = [];
        entries.forEach(entry => {
            entry.resource.meta.security = [{
                system : 'http://terminology.hl7.org/CodeSystem/v3-ObservationValue',
                code : 'ANONYED',
                display : 'anonymized'
            }];

            // todo any other security labels can be used? https://www.hl7.org/fhir/valueset-security-labels.html

        });

        this.savedResourceNumber = 0;
        return new Promise((resolve, reject) => {
            const bulk = JSON.parse(JSON.stringify(entries)).map(element => element.resource);
            this.savedResourceNumber += bulk.length;
            while (bulk.length) {
                promises.push(this.fhirService.postBatch(bulk.splice(0, 1000), request));
            }
            Promise.all(promises)
                .then(res => {
                    resolve(this.savedResourceNumber);
                })
        })
    }

}
