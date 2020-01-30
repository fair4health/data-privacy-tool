# FAIR4Health Data Privacy Tool

![alt text](https://www.fair4health.eu/images/logo.png)

## About

This is a standalone, desktop application developed by the FAIR4Health project (https://www.fair4health.eu/).
The tool aims to handle the privacy challenges exposed by the sensitive health data.
It is designed to work on an HL7 FHIR API so that it can be used on top of any standard FHIR Repository
as a data de-identification, anonymization and related actions toolset.
The tool accesses FHIR resources, presents metadata to the user, guide the user about the configuration to be
applied and then output the processed FHIR resources.

## Project setup
```
npm install
```

### Compiles and hot-reloads for development
```
npm run electron:serve
```

### Compiles and minifies for production
```
npm run electron:build
```

### Targets

**Windows**: `nsis`

**Linux**: `AppImage`, `deb`

**Mac**: `dmg`

### Run your tests
All:
```
npm run test
```
Unit:
```
npm run test:unit
```
e2e:
```
npm run test:e2e
```

### Lints and fixes files
```
npm run lint
```

