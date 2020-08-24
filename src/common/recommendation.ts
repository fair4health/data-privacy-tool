export const recommendation = {
    attributeMappings: {
        Patient: {
            'gender': 'Quasi-identifier',
            'birthDate': 'Quasi-identifier',
            'deceasedBoolean': 'Quasi-identifier',
            'deceasedDateTime': 'Quasi-identifier',
            'multipleBirthBoolean': 'Quasi-identifier',
            'multipleBirthInteger': 'Quasi-identifier',
            'name.text': 'Identifier',
            'name.family': 'Identifier',
            'name.given': 'Identifier',
            'telecom.value': 'Identifier',
            'address.text': 'Identifier',
            'address.line': 'Quasi-identifier',
            'address.city': 'Quasi-identifier',
            'address.district': 'Quasi-identifier',
            'address.state': 'Quasi-identifier',
            'address.postalCode': 'Quasi-identifier',
            'address.country': 'Quasi-identifier',
            'maritalStatus.text': 'Quasi-identifier',
            'maritalStatus.coding.code': 'Quasi-identifier',
            'maritalStatus.coding.display': 'Quasi-identifier'
        }
    },
    parameterMappings: {
        quasiRules: { // Redaction is always recommended with another algorithm, in case the attribute is required
            specificWords: {
                display: ['Redaction', 'Recoverable Substitution'],
                text: ['Redaction', 'Recoverable Substitution'],
                value: ['Redaction', 'Pass Through']
            },
            primitiveTypes: {
                boolean: ['Redaction', 'Pass Through'],
                integer: ['Fuzzing'],
                string: ['Substitution'],
                decimal: ['Fuzzing'],
                uri: ['Recoverable Substitution'],
                url: ['Recoverable Substitution'],
                canonical: ['Recoverable Substitution'],
                base64Binary: ['Redaction', 'Substitution'],
                instant: ['Generalization'],
                date: ['Generalization'],
                dateTime: ['Generalization'],
                time: ['Generalization'],
                code: ['Redaction', 'Substitution'],
                oid: ['Recoverable Substitution'],
                id: ['Pass Through'],
                markdown: ['Redaction', 'Substitution'],
                unsignedInt: ['Fuzzing'],
                positiveInt: ['Fuzzing'],
                uuid: ['Recoverable Substitution']
            }
        }
    }
};
