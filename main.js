const {app, BrowserWindow, ipcMain} = require('electron')
const path = require('path')
const url = require('url')
const remoteServer = require("./remote-server")

const PORT = 1066

let win

function createWindow () {
	win = new BrowserWindow({width: 800, height: 600})

	win.loadURL(url.format({
		pathname: path.join(__dirname, "screen", 'index.html'),
		protocol: 'file:',
		slashes: true
	}))

	win.webContents.openDevTools()

	remoteServer.launchRemoteServer(PORT).then((msg)=>{
		console.log("Remote Server Ready:", msg)
	}).catch((err)=>{
		console.error(err)
	})

	remoteServer.signals.cueControlSent.add((stuff)=>{
		win.webContents.send("cue-control", stuff)
	})

	win.on('closed', () => {
		remoteServer.closeServer()
		win = null
	})
}

ipcMain.on("cue-time-updated", (event, timePosition)=>{
	remoteServer.signals.timeChanged.dispatch(timePosition)
})

ipcMain.on('new-fps', (event, data)=>{
	remoteServer.signals.fpsUpdated.dispatch(data)
})

app.on('ready', createWindow)

app.on('window-all-closed', () => {
	if (process.platform !== 'darwin') {
		app.quit()
	}
})

app.on('activate', () => {
	if (win === null) {
		createWindow()
	}
})