import { expect } from 'chai'
import { DeidentificationService } from '@/common/services/deidentification.service'
import 'isomorphic-fetch'

describe('Test Evaluation Service', () => {

    const typeMappings = {
        'Patient.Patient-eu-f4h.id': 'http://hl7.org/fhirpath/System.String',
        'Patient.Patient-eu-f4h.meta': 'Meta',
        'Patient.Patient-eu-f4h.identifier': 'Identifier',
        'Patient.Patient-eu-f4h.gender': 'code',
        'Patient.Patient-eu-f4h.birthDate': 'date',
        'Patient.Patient-eu-f4h.address': 'Address',
        'Patient.Patient-eu-f4h.address.country': 'string'
    };
    const parameterMappings = {'Patient.Patient-eu-f4h.birthDate': {name: 'Generalization', roundedToFloor: true, dateUnit: 'Months', roundDigits: 1}};
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
                birthDate: '1995-04-05',
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
                birthDate: '1984-10-08',
                address: [ { country: 'USA' } ]
            },
            search: { mode: 'match' }
        }
    ];

    // Init De-identification Service
    const deidentificationService: DeidentificationService = new DeidentificationService(typeMappings, parameterMappings, {}, []);

    it('Should de-identify entries', (done) => {
        deidentificationService.deidentify('Patient', 'Patient-eu-f4h', [['gender']],
            [['birthDate']], [], entries, false, 3)
            .then(response => {
                expect(response.resource).to.equal('Patient');
                expect(response.profile).to.equal('Patient-eu-f4h');
                expect(response.quasis[0][0]).to.equal('birthDate');
                expect(response.entries.length).to.equal(entries.length);
                expect(response.restrictedEntries.length).to.equal(0);
                expect(response.entries.length).to.equal(entries.length);

                // identifiers should be removed
                expect(response.entries[0].resource.gender).to.be.undefined;
                expect(response.entries[1].resource.gender).to.be.undefined;

                // quasi-identifiers should be changed
                expect(response.entries[0].resource.birthDate).to.equal('1995-04');
                expect(response.entries[1].resource.birthDate).to.equal('1984-10');

            }, () => {
                expect(false).to.be.true
            })
            .then(done, done)
    });


});
