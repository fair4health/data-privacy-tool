import { expect } from 'chai'
import { EvaluationService } from '@/common/services/evaluation.service'
import 'isomorphic-fetch'
import readlineSync from 'readline-sync'

const onfhirURL = require('./../../package.json').onfhirTestURL || readlineSync.question('Enter the FHIR Repository URL for Evaluation Service: ')

describe('Test Evaluation Service', () => {

    // Init Evaluation Service
    const evaluationService: EvaluationService = new EvaluationService();
    evaluationService.setFhirURL(onfhirURL, true);

    it('Should generate equivalence classes', (done) => {
        const type = {
            resource: 'Patient',
            profile: 'Patient-eu-f4h',
            entries: [
                {
                    fullUrl: 'http://127.0.0.1:8282/fhir/Patient/a02dc400421bbb5a151bd2ffa1c23df0',
                    resource: {
                        resourceType: 'Patient',
                        id: 'a02dc400421bbb5a151bd2ffa1c23df0',
                        meta: {
                            profile: [ 'http://hl7.eu/fhir/f4h/StructureDefinition/Patient-eu-f4h' ],
                            versionId: '3',
                            lastUpdated: '2020-07-23T14:31:48.182Z'
                        },
                        identifier: [
                            {
                                system: 'http://f4h.srdc.com.tr/fhir/demos/patient_id',
                                value: '010201'
                            }
                        ],
                        gender: 'male',
                        birthDate: '1995-04',
                        address: [ { country: 'NL' } ]
                    },
                    search: { mode: 'match' }
                },
                {
                    fullUrl: 'http://127.0.0.1:8282/fhir/Patient/16ed073856be0118031ac67309198420',
                    resource: {
                        resourceType: 'Patient',
                        id: '16ed073856be0118031ac67309198420',
                        meta: {
                            profile: [ 'http://hl7.eu/fhir/f4h/StructureDefinition/Patient-eu-f4h' ],
                            versionId: '3',
                            lastUpdated: '2020-07-23T14:31:48.519Z'
                        },
                        identifier: [
                            {
                                system: 'http://f4h.srdc.com.tr/fhir/demos/patient_id',
                                value: '121258623'
                            }
                        ],
                        gender: 'male',
                        birthDate: '1984-10',
                        address: [ { country: 'USA' } ]
                    },
                    search: { mode: 'match' }
                }
            ],
            quasis: [ [ 'birthDate' ] ],
            restrictedEntries: []
        };
        const parameterMappings = {'Patient.Patient-eu-f4h.birthDate': {name: 'Generalization', roundedToFloor: true, dateUnit: 'Months', roundDigits: 1}};
        const typeMappings = {
            'Patient.Patient-eu-f4h.id': 'http://hl7.org/fhirpath/System.String',
            'Patient.Patient-eu-f4h.meta': 'Meta',
            'Patient.Patient-eu-f4h.identifier': 'Identifier',
            'Patient.Patient-eu-f4h.gender': 'code',
            'Patient.Patient-eu-f4h.birthDate': 'date',
            'Patient.Patient-eu-f4h.address': 'Address',
            'Patient.Patient-eu-f4h.address.country': 'string'
        };
        const equivalenceClasses = evaluationService.generateEquivalenceClasses(type, parameterMappings, typeMappings);
        expect(equivalenceClasses.length).to.equal(2)
        expect(equivalenceClasses[0].length).to.equal(1)
        expect(equivalenceClasses[1].length).to.equal(1)
        done();
    });

    it('Should validate resources', (done) => {
        const entries = [
            {
                fullUrl: 'http://127.0.0.1:8282/fhir/Patient/a02dc400421bbb5a151bd2ffa1c23df0',
                resource: {
                    resourceType: 'Patient',
                    id: 'a02dc400421bbb5a151bd2ffa1c23df0',
                    meta: {
                        profile: [ 'http://hl7.eu/fhir/f4h/StructureDefinition/Patient-eu-f4h' ],
                        versionId: '3',
                        lastUpdated: '2020-07-23T14:31:48.182Z'
                    },
                    identifier: [
                        {
                            system: 'http://f4h.srdc.com.tr/fhir/demos/patient_id',
                            value: '010201'
                        }
                    ],
                    gender: 'male',
                    birthDate: '1995-04',
                    address: [ { country: 'NL' } ]
                },
                search: { mode: 'match' }
            },
            {
                fullUrl: 'http://127.0.0.1:8282/fhir/Patient/16ed073856be0118031ac67309198420',
                resource: {
                    resourceType: 'Patient',
                    id: '16ed073856be0118031ac67309198420',
                    meta: {
                        profile: [ 'http://hl7.eu/fhir/f4h/StructureDefinition/Patient-eu-f4h' ],
                        versionId: '3',
                        lastUpdated: '2020-07-23T14:31:48.519Z'
                    },
                    identifier: [
                        {
                            system: 'http://f4h.srdc.com.tr/fhir/demos/patient_id',
                            value: '121258623'
                        }
                    ],
                    gender: 'male',
                    birthDate: '1984-10',
                    address: [ { country: 'USA' } ]
                },
                search: { mode: 'match' }
            }
        ];
        evaluationService.validateEntries(entries)
            .then(response => {
                expect(response[0].status).to.equal(200 || 201);
                expect(response[0].data.entry.length).to.equal(entries.length);
            }, () => {
                expect(false).to.be.true
            })
            .then(done, done)
    });

});
