//  checking software updates available 

initialiseAutoUpdateManager(){
        
  autoUpdater.autoDownload = true

  autoUpdater.on('checking-for-update', () => {
    
    recordBreadCrumb('autoupdate checking-for-update')

    this.isUpdating = true
    const message = "Checking for update..."
    this.ipcCentre.sendAutoUpdateMessage(message)
    updateRightClickTray(message)
  })

  autoUpdater.on('update-available', (updateInfo) => {

    recordBreadCrumb('autoupdate update-available')

    this.isUpdating = true
    const message = "Update is available"
    this.ipcCentre.sendAutoUpdateMessage(message)
    updateRightClickTray(message)
  })

  autoUpdater.on('update-not-available', (updateInfo) => {
    recordBreadCrumb('autoupdate update-not-available')

    this.isUpdating = false
    const message = "You are currently up to date"
    this.ipcCentre.sendAutoUpdateMessage(message)
    updateRightClickTray(message)
  })

  autoUpdater.on('error', (error) => {

    if(!preventAutoUpdateErrorReporting){
      recordBreadCrumb('autoupdate error')
      trackAutoUpdate('auto update error')
      this.startAutoUpdateErrorTimer()
    }

    this.isUpdating = false
    const message = "Unable to check for updates at this time."
    this.ipcCentre.sendAutoUpdateMessage(message)
    updateRightClickTray(message)
  })

  autoUpdater.on('download-progress', (progressInfo) => {
    this.isUpdating = true
    const message = "Downloading. Percentage: " + Math.floor(progressInfo.percent) + "%"
    this.ipcCentre.sendAutoUpdateMessage(message)
    updateRightClickTray(message)
  })

  var _this = this

  autoUpdater.on('update-downloaded', (updateInfo) => {

    recordBreadCrumb('autoupdate update-downloaded')
    trackAutoUpdate('auto update downloaded', updateInfo.version)

    this.hasDownloaded = true
    this.isUpdating = true
    let message = 'Tiller ' + updateInfo.version + ' is now available. It will be installed the next time you restart the application.';
    if (updateInfo.releaseNotes) {
      const splitNotes = updateInfo.releaseNotes.split(/[^\r]\n/);
      message += '\n\nRelease notes:\n';
      splitNotes.forEach(notes => {
        message += notes + '\n\n';
      });
    }
    // Ask user to update the app
    dialog.showMessageBox({
      type: 'question',
      buttons: ['Install and Relaunch', 'Later'],
      defaultId: 0,
      message: 'A new version of Tiller has been downloaded',
      detail: message
    }, response => {
      if (response === 0) {
        trackAutoUpdate('auto update installed', updateInfo.version)
        setTimeout(() => {
          _this.isUpdating = false
          _this.hasDownloaded = false
          autoUpdater.quitAndInstall()
        }, 1);
      } else {
        trackAutoUpdate('auto update not installed, but downloaded', updateInfo.version)
        _this.hasDownloaded = true
      }
    });

    const updateMessage = "Update finished downloading."
    this.ipcCentre.sendAutoUpdateMessage(updateMessage)
    updateRightClickTray(updateMessage)
  })

  this.ipcCentre.listenOnMainForCheckForUpdatesRequest(() => {
    autoUpdater.checkForUpdatesAndNotify()
  })

  //start update check
  this.startCheckForUpdatesTimer()
}