const MiniSignal = require('mini-signals')

const express = require("express")
const app = express()

const internalIP = require("internal-ip")
const publicIP = require("public-ip")

var expressWs = require('express-ws')(app)
const WebSocket = require("ws")

var allConnections = new Set()

const signals = {
    screenMessaged:new MiniSignal(),
    remoteMessaged:new MiniSignal(),
    cueUpdated:new MiniSignal(),
    timeChanged:new MiniSignal(),
    cueControlSent:new MiniSignal(),
    fpsUpdated:new MiniSignal(),
}

app.use(express.static("remote"))

app.ws('/remote/', (ws, req)=>{
    ws.on('message', (message)=>{
        var cleanedObj = JSON.parse(message)
        if(cleanedObj.type === "echo"){
            ws.send(message)
        }else if(cleanedObj.type === "cue-control"){
            signals.cueControlSent.dispatch(cleanedObj)
        }else{
            console.log(cleanedObj)
        }
    })
    ws.on('close', ()=>{
        allConnections.delete(ws)
    })

    const remoteSender = createRemoteSenderForConnection(ws)

    signals.timeChanged.add((stuff)=>{
        remoteSender("cue-time-updated", stuff)
    })

    signals.fpsUpdated.add((newFPS)=>{
        remoteSender("new-fps", newFPS)
    })

    allConnections.add(ws)
    ws.send(JSON.stringify({type:"new-connection"}))
})

function createRemoteSenderForConnection(ws){
    console.log(ws)
    return (type, data)=>{
        if(ws.readyState === WebSocket.OPEN){
            ws.send(JSON.stringify({type,data}))
        }else{
            console.log("ReadyState:", ws.readyState)
        }
    }
}

function getCueList(callback){

}

function loadShowFile(filePath){

}

function closeServer(){
    console.log("TODO: Implement Closing the Remote Server.")
}

function launchRemoteServer(port){
    return new Promise((resolve,reject)=>{
        app.listen(port, (err)=>{
            if(err){
                reject(err)
            }else{
                var promises = [
                    internalIP.v4().then(ip=>{
                        return ip
                    }),
                    publicIP.v4().then(ip=>{
                        return ip
                    })
                ]

                Promise.all(promises).then((promises)=>{
                    resolve({
                        local:`${promises[0]}:${port}`,
                        public:`${promises[1]}:${port}`,
                    })
                }).catch(reject)

            }
        })
    })
}

function prepareCue(cueData){

}

function stopCue(cueData){

}

function playCue(cueData){

}

function onCueData(callback){

}

module.exports = {
    launchRemoteServer,
    closeServer,
    loadShowFile,
    getCueList,
    signals,
}