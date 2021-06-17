export class VuexStoreUtil {
  // Names of Getters, Mutations and Actions in Vuex Store, divided into modules

  // Getters
  public static DRAWER_OPEN = 'drawerOpen'
  public static DRAWER_MINI_STATE = 'drawerMiniState'
  public static PRIVACY_STEP = 'privacyStep'

  // Mutations
  public static SET_DRAWER_OPEN = 'setDrawerOpen'
  public static SET_DRAWER_MINI_STATE = 'setDrawerMiniState'
  public static INCREMENT_STEP = 'incrementStep'
  public static DECREMENT_STEP = 'decrementStep'
  public static RESET_STEP = 'resetStep'
  public static SET_STEP = 'setStep'

  // Actions
  // ...

  public static Fhir = class {

    // Getters
    public static ATTRIBUTE_MAPPINGS = 'attributeMappings'
    public static PARAMETER_MAPPINGS = 'parameterMappings'
    public static TYPE_MAPPINGS = 'typeMappings'
    public static RARE_VALUE_MAPPINGS = 'rareValueMappings'
    public static RESOURCE_PROFILE_MAPPINGS = 'resourceProfileMappings'
    public static PROFILE_URL_MAPPINGS = 'profileUrlMappings'
    public static K_ANONYMITY_VALID_MAPPINGS = 'kAnonymityValidMappings'
    public static K_VALUE_MAPPINGS = 'kValueMappings'
    public static RESOURCE_LIST = 'resourceList'
    public static PROFILE_LIST = 'profileList'
    public static ELEMENT_LIST = 'elementList'
    public static ELEMENT_LIST_FLAT = 'elementListFlat'
    public static QUASI_ELEMENT_LIST = 'quasiElementList'
    public static SENSITIVE_ELEMENT_LIST = 'sensitiveElementList'
    public static RARE_ELEMENTS = 'rareElements'
    public static REQUIRED_ELEMENTS = 'requiredElements'
    public static CURRENT_RESOURCE = 'currentResource'
    public static CURRENT_PROFILE = 'currentProfile'
    public static CURRENT_ATTRIBUTE = 'currentAttribute'
    public static CURRENT_NODE = 'currentNode'
    public static SELECTED_RESOURCES = 'selectedResources'
    public static OUTCOME_DETAILS = 'outcomeDetails'
    public static DEIDENTIFICATION_RESULTS = 'deidentificationResults'
    public static FHIR_SOURCE_BASE = 'fhirSourceBase'
    public static FHIR_TARGET_BASE = 'fhirTargetBase'
    public static FHIR_SOURCE_VERIFICATION_STATUS = 'fhirSourceVerificationStatus'
    public static FHIR_TARGET_VERIFICATION_STATUS = 'fhirTargetVerificationStatus'
    public static FHIR_SOURCE_VERIFICATION_STATUS_DETAIL = 'fhirSourceVerificationStatusDetail'
    public static FHIR_TARGET_VERIFICATION_STATUS_DETAIL = 'fhirTargetVerificationStatusDetail'
    public static NO_NODES_AVAILABLE_LABEL = 'noNodesAvailableLabel'
    public static RECOMMENDED_ATTRIBUTES_MAPPINGS = 'recommendedAttributesMappings'

    // Mutations
    public static SET_ATTRIBUTE_MAPPINGS = 'setAttributeMappings'
    public static SET_PARAMETER_MAPPINGS = 'setParameterMappings'
    public static SET_TYPE_MAPPINGS = 'setTypeMappings'
    public static SET_RARE_VALUE_MAPPINGS = 'setRareValueMappings'
    public static SET_RESOURCE_PROFILE_MAPPINGS = 'setResourceProfileMappings'
    public static SET_PROFILE_URL_MAPPINGS = 'setProfileUrlMappings'
    public static SET_K_ANONYMITY_VALID_MAPPINGS = 'setKAnonymityValidMappings'
    public static SET_K_VALUE_MAPPINGS = 'setKValueMappings'
    public static SET_RESOURCE_LIST = 'setResourceList'
    public static SET_PROFILE_LIST = 'setProfileList'
    public static SET_ELEMENT_LIST = 'setElementList'
    public static SET_SELECTED_RESOURCES = 'setSelectedResources'
    public static SET_RARE_ELEMENTS = 'setRareElements'
    public static SET_REQUIRED_ELEMENTS = 'setRequiredElements'
    public static SET_CURRENT_RESOURCE = 'setCurrentResource'
    public static SET_CURRENT_PROFILE = 'setCurrentProfile'
    public static SET_CURRENT_ATTRIBUTE = 'setCurrentAttribute'
    public static SET_CURRENT_NODE = 'setCurrentNode'
    public static SET_OUTCOME_DETAILS = 'setOutcomeDetails'
    public static SET_DEIDENTIFICATION_RESULTS = 'setDeidentificationResults'
    public static UPDATE_FHIR_SOURCE_BASE = 'updateFhirSourceBase'
    public static UPDATE_FHIR_TARGET_BASE = 'updateFhirTargetBase'
    public static SET_FHIR_SOURCE_VERIFICATION_STATUS = 'setFhirSourceVerificationStatus'
    public static SET_FHIR_TARGET_VERIFICATION_STATUS = 'setFhirTargetVerificationStatus'
    public static SET_FHIR_SOURCE_VERIFICATION_STATUS_DETAIL = 'setFhirSourceVerificationStatusDetail'
    public static SET_FHIR_TARGET_VERIFICATION_STATUS_DETAIL = 'setFhirTargetVerificationStatusDetail'
    public static SET_NO_NODES_AVAILABLE_LABEL = 'setNoNodesAvailableLabel'
    public static SET_RECOMMENDED_ATTRIBUTES_MAPPINGS = 'setRecommendedAttributesMappings'

    // Actions
    public static GET_RESOURCES = 'getResources'
    public static GET_PROFILES_BY_RES = 'getProfilesByRes'
    public static GET_ELEMENTS = 'getElements'
    public static VERIFY_FHIR = 'verifyFhir'
    public static CALCULATE_RISKS = 'calculateRisks'
    public static VALIDATE_ENTRIES = 'validateEntries'
    public static SAVE_ENTRIES = 'saveEntries'
    public static CURRENT_STATE = 'currentState'
    public static IMPORT_STATE = 'importState'
    public static RESET_RECOMMENDATIONS = 'resetRecommendations'

  }

  public static IDB = class {

    // Getters
    // ..

    // Mutations
    // ..

    // Actions
    public static DELETE = 'idbDelete'
    public static CLEAR_ALL = 'idbClearAll'
    public static GET = 'idbGet'
    public static GET_ALL = 'idbGetAll'
    public static SAVE = 'idbSave'

  }

}
