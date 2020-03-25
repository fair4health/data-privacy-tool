import {environment} from '@/common/environment';

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

    static filterDataTypes (tree: fhir.ElementTree[]): fhir.ElementTree[] {
        tree.map(node => {
            if (!node.type) { // DomainResource
                node.children = node.children?.filter(child => child.label && !environment.attributesToBeFiltered.DomainResource.includes(child.label));
            } else if (environment.attributesToBeFiltered[node.type]) {
                node.children = node.children?.filter(child => node.type && child.label && !environment.attributesToBeFiltered[node.type].includes(child.label));
            }
            if (node.children && node.children.length) {
                node.children = this.filterDataTypes(JSON.parse(JSON.stringify(node.children)));
            }
        });
        return tree;
    }

    static filter (tree: fhir.ElementTree[], elements: any[] ): fhir.ElementTree[] {
        tree = JSON.parse(JSON.stringify(tree)).filter(obj => elements.indexOf(obj.value) !== -1);
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

}
