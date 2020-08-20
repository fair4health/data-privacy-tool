// const onfhirBase = 'http://f4h.srdc.com.tr/fhir';
const onfhirBase = 'http://localhost:8282/fhir';
const hl7Base = 'http://hl7.org/fhir';

export const environment = {
    server: {
        config: {
            source: {
                baseUrl: onfhirBase,
                credentials: 'same-origin',
                headers: {
                    'Accept': 'application/fhir+json;charset=UTF-8',
                    'Content-Type': 'application/fhir+json;charset=UTF-8'
                }
            },
            target: {
                baseUrl: onfhirBase,
                credentials: 'same-origin',
                headers: {
                    'Accept': 'application/fhir+json;charset=UTF-8',
                    'Content-Type': 'application/fhir+json;charset=UTF-8'
                }
            }
        },
        compatibleFhirVersions: ['4.0.0', '4.0.1']
    },
    langs: ['en'],
    hl7: hl7Base,
    resourceTypesToBeFiltered: ['CapabilityStatement', 'CodeSystem', 'ConceptMap', 'NamingSystem', 'OperationDefinition',
        'SearchParameter', 'StructureDefinition', 'ValueSet'],
    attributesToBeFiltered: {
        DomainResource: ['id', 'meta', 'implicitRules', 'language', 'text', 'contained', 'extension', 'modifierExtension'],
        BackboneElement: ['id', 'extension', 'modifierExtension']
    },
    extendibleDataTypes: {
        Address: `${hl7Base}/StructureDefinition/Address`,
        CodeableConcept: `${hl7Base}/StructureDefinition/CodeableConcept`,
        Coding: `${hl7Base}/StructureDefinition/Coding`,
        ContactPoint: `${hl7Base}/StructureDefinition/ContactPoint`,
        HumanName: `${hl7Base}/StructureDefinition/HumanName`
    },
    kAnonymityBlockSize: 100000, // Row Blocking F. Prasser, et al. in https://doi.org/10.1016/j.ijmedinf.2019.03.006
    attributeTypes: {
        ID: 'Identifier',
        QUASI: 'Quasi-identifier',
        SENSITIVE: 'Sensitive',
        INSENSITIVE: 'Insensitive'
    },
    algorithms: {
        PASS_THROUGH: {name: 'Pass Through'},
        SUBSTITUTION: {name: 'Substitution', lengthPreserved: true, fixedLength: 5, substitutionChar: '*'}, // strings
        RECOVERABLE_SUBSTITUTION: {name: 'Recoverable Substitution'}, // strings
        FUZZING: {name: 'Fuzzing', percentage: 3}, // numbers
        GENERALIZATION: {name: 'Generalization', roundedToFloor: true, dateUnit: 'Years', roundDigits: 1}, // dates and numbers
        DATE_SHIFTING: {name: 'Date Shifting', dateUnit: 'Months', range: 3}, // dates
        REDACTION: {name: 'Redaction'},
        SENSITIVE: {name: 'Sensitive', hasRare: false, l_diversityValid: false, l_diversity: 2, algorithm: {name: 'Pass Through'}},
        REPLACE: {name: 'Replace', replaceValues: {}} // only for rare values example values: {'HIV': 'Infection'}
    },
    primitiveTypes: {
        boolean: {type: 'boolean', supports: ['Pass Through', 'Redaction']},
        integer: {type: 'integer', supports: ['Pass Through', 'Redaction', 'Fuzzing', 'Generalization']},
        string: {type: 'string', supports: ['Pass Through', 'Redaction', 'Substitution', 'Recoverable Substitution', 'Replace']},
        decimal: {type: 'double', supports: ['Pass Through', 'Redaction', 'Fuzzing', 'Generalization']},
        uri: {type: 'string', supports: ['Pass Through', 'Redaction', 'Substitution', 'Recoverable Substitution', 'Replace']},
        url: {type: 'string', supports: ['Pass Through', 'Redaction', 'Substitution', 'Recoverable Substitution', 'Replace']},
        canonical: {type: 'string', supports: ['Pass Through', 'Redaction', 'Substitution', 'Recoverable Substitution', 'Replace']},
        base64Binary: {type: 'string', supports: ['Pass Through', 'Redaction', 'Substitution'], regex: '(\\s*([0-9a-zA-Z\\+\\=]){4}\\s*)+'},
        instant: {type: 'string', supports: ['Pass Through', 'Redaction', 'Generalization', 'Date Shifting'], regex: '([0-9]([0-9]([0-9][1-9]|[1-9]0)|[1-9]00)|[1-9]000)-(0[1-9]|1[0-2])-(0[1-9]|[1-2][0-9]|3[0-1])T([01][0-9]|2[0-3]):[0-5][0-9]:([0-5][0-9]|60)(\\.[0-9]+)?(Z|(\\+|-)((0[0-9]|1[0-3]):[0-5][0-9]|14:00))'},
        date: {type: 'string', supports: ['Pass Through', 'Redaction', 'Generalization', 'Date Shifting'], regex: '([0-9]([0-9]([0-9][1-9]|[1-9]0)|[1-9]00)|[1-9]000)(-(0[1-9]|1[0-2])(-(0[1-9]|[1-2][0-9]|3[0-1]))?)?'},
        dateTime: {type: 'string', supports: ['Pass Through', 'Redaction', 'Generalization', 'Date Shifting'], regex: '([0-9]([0-9]([0-9][1-9]|[1-9]0)|[1-9]00)|[1-9]000)(-(0[1-9]|1[0-2])(-(0[1-9]|[1-2][0-9]|3[0-1])(T([01][0-9]|2[0-3]):[0-5][0-9]:([0-5][0-9]|60)(\\.[0-9]+)?(Z|(\\+|-)((0[0-9]|1[0-3]):[0-5][0-9]|14:00)))?)?)?'},
        time: {type: 'string', supports: ['Pass Through', 'Redaction', 'Generalization', 'Date Shifting'], regex: '([01][0-9]|2[0-3]):[0-5][0-9]:([0-5][0-9]|60)(\\.[0-9]+)?'},
        code: {type: 'string', supports: ['Pass Through', 'Redaction', 'Substitution', 'Replace'], regex: '[^\\s]+(\\s[^\\s]+)*'},
        oid: {type: 'string', supports: ['Pass Through', 'Redaction', 'Substitution'], regex: 'urn:oid:[0-2](\\.(0|[1-9][0-9]*))+'},
        id: {type: 'string', supports: ['Pass Through', 'Redaction', 'Substitution'], regex: '[A-Za-z0-9\\-\\.]{1,64}'},
        markdown: {type: 'string', supports: ['Pass Through', 'Redaction', 'Substitution'], regex: '\\s*(\\S|\\s)*'},
        unsignedInt: {type: 'integer', supports: ['Pass Through', 'Redaction', 'Fuzzing', 'Generalization']},
        positiveInt: {type: 'integer', supports: ['Pass Through', 'Redaction', 'Fuzzing', 'Generalization']},
        uuid: {type: 'string', supports: ['Pass Through', 'Redaction', 'Substitution', 'Recoverable Substitution', 'Replace']}
    },
    exportableAttributes: ['attributeMappings', 'kAnonymityValidMappings', 'kValueMappings', 'parameterMappings',
        'rareElements', 'rareValueMappings', 'typeMappings'],
    JSON_NUMBER_IN_A_PAGE: 10
};
