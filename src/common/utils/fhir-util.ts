import {environment} from '@/common/environment';
import { recommendation } from '@/common/recommendation'
import {FhirService} from '@/common/services/fhir.service';
import {Utils} from '@/common/utils/util';
import fhirStore from '@/store/fhirStore';
import { LocalStorageUtil as localStorageKey } from '@/common/utils/local-storage-util'

export class FHIRUtils {

    static isPrimitive (tree, typeMappings): boolean {
        return !!(typeMappings[tree.value] && environment.primitiveTypes[typeMappings[tree.value]]);
    }

    static flatten (tree: fhir.ElementTree[]): fhir.ElementTree[] {
        return tree.reduce((acc: any, r: any) => {
            acc.push(r);
            if (r.children && r.children.length) {
                acc = acc.concat(this.flatten(r.children))
            }
            return acc
        }, [])
    }

    static parseElements (elements, node, state) {
        elements.forEach(element => {
            const parts = element.id.split('.').splice(1) || [];
            const newId = node.value + '.' + parts.join('.');
            const part = parts.shift();
            if (part) {
                if (element.type && element.type.length > 1) { // multiple types
                    element.type.forEach(type => {
                        const tmpObj = fhirStore.saveObject(newId, part, state, element, type, true);
                        node.children.push(tmpObj);
                    });
                } else {
                    const tmpObj = fhirStore.saveObject(newId, part, state, element, element.type ? element.type[0] : undefined, false);
                    node.children.push(tmpObj);
                }
            }
        });
    }

    static parseElementDefinitions (fhirService: FhirService, node, state): Promise<any> {
        return new Promise((resolve, reject) => {
            const fhirBase = localStorage.getItem(localStorageKey.FHIR_SOURCE_URL);
            const cached = JSON.parse(localStorage.getItem(fhirBase + localStorageKey.STRUCTURE_DEFINITION + node.type) || '{}');
            if (cached && !Utils.isEmpty(cached)) {
                this.parseElements(cached, node, state);
                resolve(node);
            } else {
                if (node.type === 'Reference') resolve(node);
                if (fhirBase) {
                    fhirService.search('StructureDefinition', {url: environment.extendibleDataTypes[node.type]}, true)
                        .then(res => {
                            if (res.data.total) {
                                const elements = res.data.entry[0].resource.differential.element;
                                localStorage.setItem(fhirBase + localStorageKey.STRUCTURE_DEFINITION + node.type, JSON.stringify(elements));
                                this.parseElements(elements, node, state);
                            }
                            resolve(node);
                        }).catch(err => reject(err));
                } else {
                    resolve(node);
                }
            }
        })
    }

    static filterDataTypes (fhirService: FhirService, tree: fhir.ElementTree[], state): fhir.ElementTree[] {
        tree.map(node => {
            if (!node.type) { // DomainResource
                node.children = node.children?.filter(child => child.label && !environment.attributesToBeFiltered.DomainResource.includes(child.label));
            } else if (environment.attributesToBeFiltered[node.type]) {
                node.children = node.children?.filter(child => node.type && child.label && !environment.attributesToBeFiltered[node.type].includes(child.label));
            } else if (environment.extendibleDataTypes[node.type] && (!node.children || !node.children.length)) {
                this.parseElementDefinitions(fhirService, node, state).then(res => {
                    node = res;
                    if (node.children && node.children.length) {
                        node.children = this.filterDataTypes(fhirService, JSON.parse(JSON.stringify(node.children)), state);
                    }
                }).catch(err => err);
            }
            if (node.children && node.children.length) {
                node.children = this.filterDataTypes(fhirService, JSON.parse(JSON.stringify(node.children)), state);
            }
        });
        return tree;
    }

    static filter (tree: fhir.ElementTree[], elements: any[] ): fhir.ElementTree[] {
        tree = JSON.parse(JSON.stringify(tree)).filter(obj => elements.includes(obj.value));
        tree.map(node => {
            if (node.children && node.children.length) {
                node.children = this.filter(JSON.parse(JSON.stringify(node.children)), elements);
            }
        });
        return tree;
    }

    static includesPrivacyType (tree, attributeMappings, type: string, typeMappings): boolean {
        if (!tree.children || !tree.children.length) {
            return this.isPrimitive(tree, typeMappings) && attributeMappings[tree.value] === type;
        } else {
            let result = false;
            tree.children.map(node => {
                result = result || this.includesPrivacyType(node, attributeMappings, type, typeMappings);
            });
            return result;
        }
    }

    static filterByAttributeType (tree: fhir.ElementTree[], attributeMappings, type: string, typeMappings): fhir.ElementTree[] {
        tree = JSON.parse(JSON.stringify(tree)).filter(obj => this.includesPrivacyType(obj, attributeMappings, type, typeMappings));
        tree.map(node => {
            if (node.children && node.children.length) {
                node.children = this.filterByAttributeType(JSON.parse(JSON.stringify(node.children)), attributeMappings, type, typeMappings);
            }
        });
        return tree;
    }

    static recommendedAlgorithm (word: string, type: string, required: boolean, isQuasi: boolean) {
        if (!isQuasi) {
            // todo handle sensitive attribute algo recommendations
            return environment.algorithms.SENSITIVE;
        } else {
            const algoOptions = recommendation.parameterMappings.quasiRules.specificWords[word] ?
                recommendation.parameterMappings.quasiRules.specificWords[word] : recommendation.parameterMappings.quasiRules.primitiveTypes[type];
            if (!algoOptions) {
                return environment.algorithms.PASS_THROUGH;
            } else if (required && algoOptions.length > 1) {
                const algoKey = Object.keys(environment.algorithms).find(key => environment.algorithms[key].name === algoOptions[1]);
                return environment.algorithms[algoKey ? algoKey : 'PASS_THROUGH'];
            } else {
                const algoKey = Object.keys(environment.algorithms).find(key => environment.algorithms[key].name === algoOptions[0]);
                return environment.algorithms[algoKey ? algoKey : 'PASS_THROUGH'];
            }
        }
    }

    static sortProfiles (profiles: string[]) {
        return profiles?.sort((p1, p2) => {
            const p1Name = p1.split('/').pop()!.toLowerCase()
            const p2Name = p2.split('/').pop()!.toLowerCase()
            return (p1Name > p2Name) ? 1 : ((p2Name > p1Name) ? -1 : 0)
        }) || []
    }

}
