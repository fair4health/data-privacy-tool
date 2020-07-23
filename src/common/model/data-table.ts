/**
 * Data Table column contents
 */

import { QTable } from 'quasar'


export const deidentificationStepTable: QTable = {
    columns: [
        { name: 'status', align: 'center', label: 'TABLE.STATUS', field: 'status', icon: 'fas fa-info-circle', classes: 'bg-grey-2' },
        { name: 'resource', align: 'left', label: 'TABLE.RESOURCE_TYPE', field: 'resource', icon: 'fas fa-fire', sortable: true },
        { name: 'k_anonymity', align: 'center', label: 'TABLE.K_ANONYMITY', field: 'k_anonymity', icon: 'mdi mdi-shield-check' },
        { name: 'count', align: 'center', label: 'TABLE.INITIAL_RESOURCE_COUNT', field: 'count' },
        { name: 'final', align: 'center', label: 'TABLE.FINAL_RESOURCE_COUNT', field: 'final' },
        { name: 'restricted', align: 'center', label: 'TABLE.RESTRICTED_RESOURCE_COUNT', field: 'restricted' }
    ]
} as QTable


export const outcomeDetailTable: QTable = {
    columns: [
        { name: 'status', label: 'TABLE.STATUS', field: 'status', align: 'center', icon: 'fas fa-info-circle',
            classes: 'bg-grey-2', headerClasses: 'bg-primary text-white col-1 outcome-table-column' },
        { name: 'resourceType', label: 'TABLE.RESOURCE_TYPE', field: 'resourceType', align: 'center', sortable: true,
            classes: 'bg-grey-1', headerClasses: 'bg-grey-4 text-grey-10 col-1 outcome-table-column' },
        { name: 'message', label: 'TABLE.DETAILS', field: 'message', align: 'left', sortable: true }
    ],
    pagination: { page: 1, rowsPerPage: 10 }
} as QTable
