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

}
