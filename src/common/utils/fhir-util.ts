import {environment} from '@/common/environment';

export class FHIRUtils {

    static isPrimitive (tree: fhir.ElementTree): boolean {
        return !!(tree.selectedType && environment.primitiveTypes[tree.selectedType]);
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

    static filter (tree: fhir.ElementTree[], elements: any[] ): fhir.ElementTree[] {
        tree = JSON.parse(JSON.stringify(tree)).filter(obj => elements.indexOf(obj.value) !== -1);
        tree.map(node => {
            if (node.children && node.children.length) {
                node.children = this.filter(JSON.parse(JSON.stringify(node.children)), elements);
            }
        });
        return tree;
    }

    static includesPrivacyType (tree, attributeMappings, type: string): boolean {
        if (!tree.children || !tree.children.length) {
            return this.isPrimitive(tree) && attributeMappings[tree.value] === type;
        } else {
            let result = false;
            tree.children.map(node => {
                result = result || this.includesPrivacyType(node, attributeMappings, type);
            });
            return result;
        }
    }

    static filterByAttributeType (tree: fhir.ElementTree[], attributeMappings, type: string): fhir.ElementTree[] {
        tree = JSON.parse(JSON.stringify(tree)).filter(obj => this.includesPrivacyType(obj, attributeMappings, type));
        tree.map(node => {
            if (node.children && node.children.length) {
                node.children = this.filterByAttributeType(JSON.parse(JSON.stringify(node.children)), attributeMappings, type);
            }
        });
        return tree;
    }

}
