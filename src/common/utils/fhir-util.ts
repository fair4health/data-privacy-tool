import {environment} from '@/common/environment';

export class FHIRUtils {

    static isPrimitive (tree, typeMappings): boolean {
        return !!(typeMappings[tree.value] && environment.primitiveTypes[typeMappings[tree.value]]);
    }

    static isRequired ($store, key): Promise<boolean> {
        let tree = $store.getters['fhir/elementList'];
        const attributes = key.split('.');
        let i = 0;
        return new Promise((resolve, reject) => {
            if (tree[0].label === attributes[0] && tree[0].children[0].label === attributes[1]) {
                while (i < attributes.length) {
                    tree.map(node => {
                        if (node.label === attributes[i]) {
                            tree = node.children;
                            if (++i === attributes.length) {
                                resolve(node.required);
                            }
                        }
                    });
                }
            } else {
                $store.dispatch('fhir/getElements', attributes[1])
                    .then(() => {
                        while (i < attributes.length) {
                            tree.map(node => {
                                if (node.label === attributes[i]) {
                                    tree = node.children;
                                    if (++i === attributes.length) {
                                        resolve(node.required);
                                    }
                                }
                            });
                        }
                    });
            }
        });
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

    static setRequirements (tree: fhir.ElementTree[], required?: boolean): fhir.ElementTree[] {
        tree.map(node => {
            if (required) {
                node.required = true;
            }
            if (node.children && node.children.length) {
                node.children = this.setRequirements(JSON.parse(JSON.stringify(node.children)), node.required);
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
