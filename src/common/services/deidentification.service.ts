import {FhirService} from '@/common/services/fhir.service';
import {environment} from '@/common/environment';
import RandExp from 'randexp';
import moment from 'moment-timezone';

export class DeidentificationService {
    fhirService: FhirService;
    typeMappings: any;
    parameterMappings: any;
    rareValueMappings: any;
    loading: boolean;
    progressMessage: string;
    identifiers: string[][];
    quasis: string[][];
    sensitives: string[][];
    deidentifiedResourceNumber = 0;

    constructor (typeMappings: any, parameterMappings: any, rareValueMappings: any) {
        this.fhirService = new FhirService();
        this.typeMappings = typeMappings;
        this.parameterMappings = parameterMappings;
        this.rareValueMappings = rareValueMappings;
        this.loading = true;
        this.progressMessage = '';
        this.identifiers = [];
        this.quasis = [];
        this.sensitives = [];
    }

    getEntries (resource: string, profile: string): Promise<any[]> {
        this.progressMessage = 'Getting data from ' + profile + ' profile...';
        return new Promise((resolve, reject) => {
            this.fhirService.search('StructureDefinition',
                {_summary: 'data', base: `${environment.hl7}/StructureDefinition/${resource}`}, true)
                .then(res => {
                    const url = res.data.entry.find(item => item.resource.id === profile).resource.url;
                    this.fhirService.search(resource, {_profile: url}, true)
                        .then(response => {
                            resolve(response.data.entry);
                        })
                        .catch(err => {} );
                }).catch(err => {});
        })
    }

    deidentify (resource: string, profile: string, identifiers: string[][], quasis: string[][], sensitives: string[][]): Promise<any> {
        this.identifiers = identifiers;
        this.quasis = quasis;
        this.sensitives = sensitives;
        return new Promise((resolve, reject) => {
            this.getEntries(resource, profile).then(entries => {
                this.progressMessage = 'De-identifying ' + profile + ' profile...';
                entries.map(entry => this.changeAttributes(resource + '.' + profile, entry.resource));
                this.saveEntriesBack(entries).then(res => resolve());
            });
        })
    }

    saveEntriesBack (entries): Promise<any> {
        const promises: Array<Promise<any>> = [];
        entries.forEach(entry => {
            entry.resource.meta.security = [{
                system : 'http://terminology.hl7.org/CodeSystem/v3-ObservationValue',
                code : 'ANONYED',
                display : 'anonymized'
            }];

            // todo versionId ve lastUpdated guncellenmeli mi? http://hl7.org/fhir/resource.html#Meta

            // todo any other security labels can be used? https://www.hl7.org/fhir/valueset-security-labels.html

            // todo PUT mu POST mu (PUT yapınca version kendi guncelliyor)

        });

        return new Promise((resolve, reject) => {
            const bulk = JSON.parse(JSON.stringify(entries)).map(element => element.resource);
            while (bulk.length) {
                promises.push(this.fhirService.postBatch(bulk.splice(0, 1000), 'PUT'));
                this.deidentifiedResourceNumber += bulk.length;
            }
            Promise.all(promises)
            .then(res => {
                this.loading = false;
                resolve();
            })
        })
    }

    changeAttributes (prefix: string, attributes) {
        this.quasis.forEach(paths => {
            let key = prefix;
            let attribute = attributes;
            let i = 0;
            while (i < paths.length && attribute) {
                key += '.' + paths[i];
                attribute = this.handleQuasis(key, attribute, paths, i++, paths.length - 1);
            }
        });
        this.sensitives.forEach(paths => {
            let key = prefix;
            let attribute = attributes;
            let i = 0;
            while (i < paths.length && attribute) {
                key += '.' + paths[i];
                attribute = this.handleSensitives(key, attribute, paths, i++, paths.length - 1);
            }
        });
        this.identifiers.forEach(paths => {
            let key = prefix;
            let attribute = attributes;
            let i = 0;
            while (i < paths.length && attribute) {
                key += '.' + paths[i];
                attribute = this.removeIdentifiers(key, attribute, paths, i++, paths.length - 1);
            }
        });
        return this.clearResource(attributes);
    }

    removeIdentifiers (key: string, attribute, paths, index: number, end: number) {
        if (attribute[paths[index]] && this.isArray(attribute[paths[index]])) { // array
            const len = attribute[paths[index]].length;
            for (let i = 0; i < len; i++) {
                const elem = attribute[paths[index]][i];
                if (paths[index + 1]) { // objects in array
                    attribute[paths[index]][i] = this.removeIdentifiers(key + '.' + paths[index + 1], elem, paths.slice(1), index, end - 1);
                } else { // primitives in array
                    delete attribute[paths[index]];
                }
            }
        } else if (index === end && attribute[paths[index]]) { // primitives/leaves
            delete attribute[paths[index]];
        }
        return attribute;
    }

    handleQuasis (key: string, attribute, paths, index: number, end: number) {
        if (attribute[paths[index]] && this.isArray(attribute[paths[index]])) { // array
            const len = attribute[paths[index]].length;
            for (let i = 0; i < len; i++) {
                const elem = attribute[paths[index]][i];
                if (paths[index + 1]) { // objects in array
                    attribute[paths[index]][i] = this.handleQuasis(key + '.' + paths[index + 1], elem, paths.slice(1), index, end - 1);
                } else { // primitives in array
                    attribute[paths[index]][i] = this.executeAlgorithm(key, this.parameterMappings[key], elem, this.typeMappings[key]);
                }
            }
        } else if (index === end && attribute[paths[index]]) { // primitives/leaves
            attribute[paths[index]] = this.executeAlgorithm(key, this.parameterMappings[key], attribute[paths[index]], this.typeMappings[key]);
        }
        return attribute;
    }

    handleSensitives (key: string, attribute, paths, index: number, end: number) {
        if (attribute[paths[index]] && this.isArray(attribute[paths[index]])) { // array
            const len = attribute[paths[index]].length;
            for (let i = 0; i < len; i++) {
                const elem = attribute[paths[index]][i];
                if (paths[index + 1]) { // objects in array
                    attribute[paths[index]][i] = this.handleSensitives(key + '.' + paths[index + 1], elem, paths.slice(1), index, end - 1);
                } else { // primitives in array
                    if (this.parameterMappings[key].hasRare && this.rareValueMappings[key] && this.rareValueMappings[key].length
                        && (this.rareValueMappings[key].indexOf(attribute[paths[index]][i]) !== -1)) {
                        attribute[paths[index]][i] = this.executeAlgorithm(key, this.parameterMappings[key].algorithm, elem, this.typeMappings[key]);
                    }
                }
            }
        } else if (index === end && attribute[paths[index]]) { // primitives/leaves
            if (this.parameterMappings[key].hasRare && this.rareValueMappings[key] && this.rareValueMappings[key].length
                && (this.rareValueMappings[key].indexOf(attribute[paths[index]]) !== -1)) {
                attribute[paths[index]] = this.executeAlgorithm(key, this.parameterMappings[key].algorithm, attribute[paths[index]], this.typeMappings[key]);
            }
        }
        return attribute;
    }

    executeAlgorithm (key, parameters, data, primitiveType) {
        const regex = environment.primitiveTypes[primitiveType].regex;
        switch (parameters.name) {
            case 'Pass Through':
                break;
            case 'Redaction':
                this.identifiers.push(key.split('.').slice(2));
                break;
            case 'Substitution':
                if (regex) {
                    data = new RandExp(regex).gen();
                } else {
                    data = new Array(Number(parameters.lengthPreserved ? data.length : parameters.fixedLength) + 1)
                        .join( parameters.substitutionChar );
                }
                break;
            case 'Recoverable Substitution':
                data = btoa(data); // recover function is atob(data)
                break;
            case 'Fuzzing':
                data += this.getRandomFloat(-parameters.percentage, parameters.percentage);
                if (primitiveType === 'integer') { // A signed integer in the range −2,147,483,648..2,147,483,647
                    data = Math.round(data);
                } else if (primitiveType === 'unsignedInt') { // Any non-negative integer in the range 0..2,147,483,647
                    data = Math.round(Math.abs(data));
                } else if (primitiveType === 'positiveInt') { // Any positive integer in the range 1..2,147,483,647
                    data = Math.round(Math.abs(data)) ? Math.round(Math.abs(data)) : 1;
                }
                break;
            case 'Generalization':
                if (primitiveType === 'decimal') { // Decimal places of the floating number will be rounded
                    const denary = Math.pow(10, parameters.roundDigits);
                    data = parameters.roundedToFloor ? Math.floor(data * denary) / denary : Math.ceil(data * denary) / denary;
                } else if (primitiveType === 'integer' || primitiveType === 'unsignedInt' || primitiveType === 'positiveInt') { // Last digits of the integer will be rounded
                    const denary = Math.pow(10, parameters.roundDigits);
                    data = parameters.roundedToFloor ? Math.floor(data / denary) * denary : Math.ceil(data / denary) * denary;
                } else if (primitiveType === 'time') { // HH:mm:ss ['Hours', 'Minutes', 'Seconds'] TO BE ROUNDED
                    let tempDate = moment(data, 'HH:mm:ss');
                    tempDate = this.roundTime(new Date(tempDate), parameters.dateUnit);
                    data = moment(tempDate).format('HH:mm:ss');
                } else if (primitiveType === 'instant') { // YYYY-MM-DDThh:mm:ss.sss+zz:zz ['Years', 'Months', 'Days', 'Hours', 'Minutes'] TO BE ROUNDED
                    const [dates, times] = data.split('T');
                    const [year, month, day] = dates.split('-');
                    const [hour, minute, second] = times.split(':');
                    let tempDate = new Date(+year, +month - 1, +day, +hour, +minute, +second.substring(0, 2));
                    tempDate = this.roundTime(tempDate, parameters.dateUnit);
                    data = moment(tempDate).tz(moment.tz.guess()).format('YYYY-MM-DDTHH:mm:ss.000Z');
                } else { // date (YYYY, YYYY-MM, or YYYY-MM-DD) or dateTime (YYYY, YYYY-MM, YYYY-MM-DD or YYYY-MM-DDThh:mm:ss+zz:zz) ['Years', 'Months', 'Days'] TO BE REMOVED
                    const [year, month, day] = data.split('-');
                    if (!month || parameters.dateUnit === 'Years') {
                        data = year;
                    } else if (parameters.dateUnit === 'Months') {
                        data = year + '-' + month;
                    } else { // parameters.dateUnit === 'Days'
                        if (!day) {
                            data = year + '-' + month;
                        } else {
                            data = year + '-' + month + '-' + day.substring(0, 2);
                        }
                    }
                }
                break;
            case 'Date Shifting': // Date will be shifted randomly within a range that you provide
                if (primitiveType === 'time') { // HH:mm:ss ['Hours', 'Minutes', 'Seconds']
                    let tempDate = moment(data, 'HH:mm:ss');
                    tempDate = this.getRandomDate(new Date(tempDate), parameters.dateUnit, parameters.range);
                    data = moment(tempDate).format('HH:mm:ss');
                } else if (primitiveType === 'instant') { // YYYY-MM-DDThh:mm:ss.sss+zz:zz ['Years', 'Months', 'Days', 'Hours', 'Minutes']
                    const [dates, times] = data.split('T');
                    const [year, month, day] = dates.split('-');
                    const [hour, minute, second] = times.split(':');
                    let tempDate = new Date(+year, +month - 1, +day, +hour, +minute, +second.substring(0, 2));
                    tempDate = this.getRandomDate(tempDate, parameters.dateUnit, parameters.range);
                    data = moment(tempDate).tz(moment.tz.guess()).format('YYYY-MM-DDTHH:mm:ss.000Z');
                } else { // date (YYYY, YYYY-MM, or YYYY-MM-DD) or dateTime (YYYY, YYYY-MM, YYYY-MM-DD or YYYY-MM-DDThh:mm:ss+zz:zz) ['Years', 'Months', 'Days']
                    const [year, month, day] = data.split('-');
                    let tempDate = new Date(+year, month ? +month - 1 : 0, day ? +day : 1);
                    tempDate = this.getRandomDate(tempDate, parameters.dateUnit, parameters.range);
                    data = moment(tempDate).tz(moment.tz.guess()).format(day ? 'YYYY-MM-DD' : (month ? 'YYYY-MM' : 'YYYY'));
                }
                break;
        }
        return data;
    }

    clearResource (attributes) {
        Object.keys(attributes).forEach(key => {
            if (this.isArray(attributes[key])) { // array
                let index = 0;
                for (const elem of attributes[key]) {
                    if (!Object.keys(elem).length) { // empty object
                        attributes[key].splice(index, 1);
                    } else {
                        index++;
                    }
                }
                if (!attributes[key].length) {
                    delete attributes[key];
                }
            } else if (typeof attributes[key] === 'object') { // not array and not primitive type. it is object
                attributes[key] = this.clearResource(attributes[key]);
            }
        });
        return attributes;
    }

    roundTime (date: Date, unit: string): Date {
        let p = 1;
        switch (unit) {
            case 'Years':
                const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
                const lastDayOfYear = new Date(date.getFullYear(), 11, 31);
                const deltaToFirstDay = Math.abs(date.getTime() - firstDayOfYear.getTime());
                const deltaToLastDay = Math.abs( lastDayOfYear.getTime() - date.getTime());
                if (deltaToFirstDay <= deltaToLastDay) {
                    return firstDayOfYear;
                } else {
                    return new Date(date.getFullYear() + 1, 0, 1);
                }
            case 'Months':
                const firstDayOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
                const lastDayOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0);
                const deltaToFirst = Math.abs(date.getTime() - firstDayOfMonth.getTime());
                const deltaToLast = Math.abs( lastDayOfMonth.getTime() - date.getTime());
                if (deltaToFirst <= deltaToLast) {
                    return firstDayOfMonth;
                } else {
                    return new Date(date.getFullYear(), date.getMonth() + 1, 1);
                }
            case 'Days':
                p = 24 * 60 * 60 * 1000; // milliseconds in a day
                const userOffset = date.getTimezoneOffset() * 60 * 1000; // user's offset time
                return new Date((Math.round(date.getTime() / p ) * p) + userOffset ); // redefine variable
            case 'Hours':
                p = 60 * 60 * 1000; // milliseconds in an hour
                break;
            case 'Minutes':
                p = 60 * 1000; // milliseconds in a minute
                break;
        }
        return new Date(Math.round(date.getTime() / p ) * p);
    }

    getRandomDate (date: Date, unit: string, range: number) {
        range = Number(range);
        let [start, end] = [date, date];
        switch (unit) {
            case 'Years':
                start = new Date(date.getFullYear() - range, date.getMonth(), date.getDate(), date.getHours(), date.getMinutes(), date.getSeconds());
                end = new Date(date.getFullYear() + range, date.getMonth(), date.getDate(), date.getHours(), date.getMinutes(), date.getSeconds());
                break;
            case 'Months':
                start = new Date(date.getFullYear(), date.getMonth() - range, date.getDate(), date.getHours(), date.getMinutes(), date.getSeconds());
                end = new Date(date.getFullYear(), date.getMonth() + range, date.getDate(), date.getHours(), date.getMinutes(), date.getSeconds());
                break;
            case 'Days':
                start = new Date(date.getFullYear(), date.getMonth(), date.getDate() - range, date.getHours(), date.getMinutes(), date.getSeconds());
                end = new Date(date.getFullYear(), date.getMonth(), date.getDate() + range, date.getHours(), date.getMinutes(), date.getSeconds());
                break;
            case 'Hours':
                start = new Date(date.getFullYear(), date.getMonth(), date.getDate(), date.getHours() - range, date.getMinutes(), date.getSeconds());
                end = new Date(date.getFullYear(), date.getMonth(), date.getDate(), date.getHours() + range, date.getMinutes(), date.getSeconds());
                break;
            case 'Minutes':
                start = new Date(date.getFullYear(), date.getMonth(), date.getDate(), date.getHours(), date.getMinutes() - range, date.getSeconds());
                end = new Date(date.getFullYear(), date.getMonth(), date.getDate(), date.getHours(), date.getMinutes() + range, date.getSeconds());
                break;
            case 'Seconds':
                start = new Date(date.getFullYear(), date.getMonth(), date.getDate(), date.getHours(), date.getMinutes(), date.getSeconds() - range);
                end = new Date(date.getFullYear(), date.getMonth(), date.getDate(), date.getHours(), date.getMinutes(), date.getSeconds() + range);
                break;
        }
        return new Date(Math.round(this.getRandomFloat(start.getTime(), end.getTime())));
    }

    getRandomFloat (min, max) {
        return Math.random() * (max - min) + min;
    }

    isArray (what) {
        return Object.prototype.toString.call(what) === '[object Array]';
    }

}
