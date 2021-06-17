export class IpcChannelUtil {
  // IPC channel types (events)

  public static TO_ALL_BACKGROUND = 'to-all-background'
  public static TO_BACKGROUND = 'to-background'
  public static TO_RENDERER = 'to-renderer'
  public static READY = 'ready'

  public static File = class {
    public static EXPORT_FILE = 'export-file'
    public static EXPORT_DONE = 'export-done'
    public static BROWSE_CONFIGURATIONS = 'browse-configurations'
    public static SELECTED_CONFIGURATION = 'selected-configuration'
  }

  public static Fhir = class {
    public static SET_SOURCE_FHIR_BASE = 'set-source-fhir-base'
    public static SET_TARGET_FHIR_BASE = 'set-target-fhir-base'
  }

  public static Deidentifier = class {
    public static SET_DEIDENTIFICATION_SERVICE = 'set-deidentification-service'
    public static SET_EVALUATION_SERVICE = 'set-evaluation-service'
    public static FETCH_ALL_DATA = 'fetch-all-data'
    public static DEIDENTIFY = 'de-identify'
    public static VALIDATE_ENTRIES = 'validate-entries'
    public static SAVE_TO_REPO = 'save-to-repo'
    public static FETCH_ALL_DATA_RES_X = (resourceType: string) => `fetch-all-data-res-${resourceType}`
    public static DEIDENTIFY_RES_X = (resourceType: string) => `de-identify-res-${resourceType}`
    public static DEIDENTIFY_RISKS_RES_X = (resourceType: string) => `de-identify-risks-res-${resourceType}`
    public static VALIDATE_ENTRIES_RES_X = (resourceType: string) => `validate-entries-res-${resourceType}`
    public static SAVE_TO_REPO_RES_X = (resourceType: string) => `save-to-repo-res-${resourceType}`

  }

}
