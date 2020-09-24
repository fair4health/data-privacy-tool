# FAIR4Health Data Privacy Tool

<p align="center">
  <a href="https://www.fair4health.eu" target="_blank"><img width="400" src="https://www.fair4health.eu/images/logo.png" alt="FAIR4Health logo"></a>
</p>

<p align="center">
  <a href="https://github.com/fair4health/data-privacy-tool"><img src="https://img.shields.io/github/license/fair4health/data-privacy-tool" alt="License"></a>
  <a href="https://github.com/fair4health/data-privacy-tool/releases"><img src="https://img.shields.io/github/v/release/fair4health/data-privacy-tool" alt="Releases"></a>
</p>

## About

This is a standalone, desktop application developed by the FAIR4Health project (https://www.fair4health.eu/).
The tool aims to handle the privacy challenges exposed by the sensitive health data.
It is designed to work on an HL7 FHIR API so that it can be used on top of any standard FHIR Repository
as a data de-identification, anonymization, and related actions toolset.
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

### Log Locations
The tool writes logs to the following locations:

- on **macOS**: `~/Library/Logs/FAIR4Health Privacy Tool/log.txt`
- on **Windows**: `%USERPROFILE%\AppData\Roaming\FAIR4Health Privacy Tool\logs\log.txt`
- on **Linux**: `~/.config/FAIR4Health Privacy Tool/logs/log.txt`

### Acknowledgement

This research has received funding from the European Union’s Horizon 2020 research and innovation programme under grant agreement No 824666,
[FAIR4Health Project](https://www.fair4health.eu/) (Improving Health Research in EU through FAIR Data).
