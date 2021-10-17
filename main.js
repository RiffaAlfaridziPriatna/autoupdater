const { app, BrowserWindow, autoUpdater, dialog } = require('electron')
const path = require('path')

autoUpdater.updateConfigPath = path.join(__dirname, 'dev-app-update.yml');
console.log(path.join(__dirname, 'dev-app-update.yml'))

let win

const dispatch = (data) => {
  win.webContents.send('message', data)
}

const createDefaultWindow = () => {
  win = new BrowserWindow({
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  })

  // win.webContents.openDevTools()

  win.on('closed', () => {
    win = null
  })

  win.loadFile('index.html')

  return win
}

Object.defineProperty(app, 'isPackaged', {
  get() {
    return true;
  }
});

app.on('ready', () => {
  
  createDefaultWindow()

  setInterval(() => {
    autoUpdater.checkForUpdatesAndNotify()
  }, 60000)

  win.webContents.on('did-finish-load', () => {
    win.webContents.send('version', app.getVersion())
  })

})

app.on('window-all-closed', () => {
  app.quit()
})


autoUpdater.on('checking-for-update', () => {
  console.log('checking-for-update', 'check-update');
  dispatch('Checking for update...')
})

autoUpdater.on('update-available', (info) => {
  console.log('update-available', info);
  dispatch('Update available.')
})

autoUpdater.on('update-not-available', (info) => {
  console.log('update-not-available', info);
  dispatch('Update not available.')
})

autoUpdater.on('error', (err) => {
  console.error('There was a problem updating the application')
  console.error(err)
  dispatch('Error in auto-updater. ' + err)
})

autoUpdater.on('download-progress', (progressObj) => {
  let log_message = "Download speed: " + progressObj.bytesPerSecond
  log_message = log_message + ' - Downloaded ' + progressObj.percent + '%'
  log_message = log_message + ' (' + progressObj.transferred + "/" + progressObj.total + ')'
  dispatch(log_message)

  win.webContents.send('size', log_message)
  win.webContents.send('download-progress', progressObj.percent)

})

autoUpdater.on('update-downloaded', (info) => {
  console.log('update-downloaded', info);
  dispatch('Update downloaded')
  const dialogOpts = {
    type: 'info',
    buttons: ['Restart'],
    title: 'Application Update',
    message: process.platform === 'win32' ? releaseNotes : releaseName,
    detail: 'A new version has been downloaded. Restart the application to apply the updates.'
  }

  dialog.showMessageBox(dialogOpts).then((returnValue) => {
    if (returnValue.response === 0) autoUpdater.quitAndInstall()
  })
})
