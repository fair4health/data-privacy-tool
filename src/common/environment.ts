const onfhirBase = 'http://f4h.srdc.com.tr/fhir';

export const environment = {
    server: {
        config: {
            baseUrl: onfhirBase,
            credentials: 'same-origin',
            headers: {
                'Accept': 'application/fhir+json;charset=UTF-8',
                'Content-Type': 'application/fhir+json;charset=UTF-8'
            }
        }
    },
    hl7: 'http://hl7.org/fhir',
    profiles: {
        patient_uv_ips: 'http://hl7.org/fhir/uv/ips/StructureDefinition/patient-uv-ips',
        practitioner_uv_ips: 'http://hl7.org/fhir/uv/ips/StructureDefinition/practitioner-uv-ips',
        condition_uv_ips: 'http://hl7.org/fhir/uv/ips/StructureDefinition/condition-uv-ips'
    },
    attributeTypes: {
        ID: 'Identifier',
        QUASI: 'Quasi-identifier',
        SENSITIVE: 'Sensitive',
        INSENSITIVE: 'Insensitive'
    },
    algorithms: {
        PASS_THROUGH: {name: 'Pass Through'},
        SUBSTITUTION: {name: 'Substitution', lengthPreserved: true, fixedLength: 5, substitutionChar: '*'},
        RECOVERABLE_SUBSTITUTION: {name: 'Recoverable Substitution'},
        FUZZING: {name: 'Fuzzing'},
        GENERALIZATION: {name: 'Generalization'},
        DATE_SHIFTING: {name: 'Date Shifting', unit: 'Months', range: 3},
        REDACTION: {name: 'Redaction'},
        SENSITIVE: {name: 'Sensitive', isRare: false, l_diversity: null, t_closeness: null, algorithm: {name: 'Pass Through'}}
    },
    primitiveTypes: {
        boolean: {type: 'boolean'},
        integer: {type: 'integer'},
        string: {type: 'string'},
        decimal: {type: 'double'},
        uri: {type: 'string'},
        url: {type: 'string'},
        canonical: {type: 'string'},
        base64Binary: {type: 'string', regex: '(\\s*([0-9a-zA-Z\\+\\=]){4}\\s*)+'},
        instant: {type: 'string', regex: '([0-9]([0-9]([0-9][1-9]|[1-9]0)|[1-9]00)|[1-9]000)-(0[1-9]|1[0-2])-(0[1-9]|[1-2][0-9]|3[0-1])T([01][0-9]|2[0-3]):[0-5][0-9]:([0-5][0-9]|60)(\\.[0-9]+)?(Z|(\\+|-)((0[0-9]|1[0-3]):[0-5][0-9]|14:00))'},
        date: {type: 'string', regex: '([0-9]([0-9]([0-9][1-9]|[1-9]0)|[1-9]00)|[1-9]000)(-(0[1-9]|1[0-2])(-(0[1-9]|[1-2][0-9]|3[0-1]))?)?'},
        dateTime: {type: 'string', regex: '([0-9]([0-9]([0-9][1-9]|[1-9]0)|[1-9]00)|[1-9]000)(-(0[1-9]|1[0-2])(-(0[1-9]|[1-2][0-9]|3[0-1])(T([01][0-9]|2[0-3]):[0-5][0-9]:([0-5][0-9]|60)(\\.[0-9]+)?(Z|(\\+|-)((0[0-9]|1[0-3]):[0-5][0-9]|14:00)))?)?)?'},
        time: {type: 'string', regex: '([01][0-9]|2[0-3]):[0-5][0-9]:([0-5][0-9]|60)(\\.[0-9]+)?'},
        code: {type: 'string', regex: '[^\\s]+(\\s[^\\s]+)*'},
        oid: {type: 'string', regex: 'urn:oid:[0-2](\\.(0|[1-9][0-9]*))+'},
        id: {type: 'string', regex: '[A-Za-z0-9\\-\\.]{1,64}'},
        markdown: {type: 'string', regex: '\\s*(\\S|\\s)*'},
        unsignedInt: {type: 'integer'},
        positiveInt: {type: 'integer'},
        uuid: {type: 'string'}
    }
};
