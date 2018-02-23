let W = null

const progressBarElm = document.getElementById("progress")
const fpsElm = document.getElementById("fps")

const IDEAL_FPS = 60

let isAwake = false

document.getElementById("connect-button").addEventListener("click",(event)=>{
    connectToScreen()
})

document.getElementById("play-button").addEventListener("click", (event)=>{
    sendToServer("cue-control", "play")
})

document.getElementById("pause-button").addEventListener("click", (event)=>{
    sendToServer("cue-control", "pause")
})

document.getElementById("stop-button").addEventListener("click", (event)=>{
    sendToServer("cue-control", "stop")
})

function connectToScreen(){
    W = new WebSocket(`ws://${window.location.host}/remote`)
    W.addEventListener("open",()=>{
        console.log("Connected to the Server.")
        setConnectionActive()
    })
    W.addEventListener("close",()=>{
        console.log("Not connected to server.")
        setConnectionInactive()
    })
    W.addEventListener("error", (error)=>{
        console.error("Server Connection Error")
        setConnectionError(error)
    })
    W.addEventListener("message", (message)=>{
        var cleanedObj = JSON.parse(message.data)
        if(cleanedObj.type === "cue-time-updated"){
            updateTime(cleanedObj.data)
        }else if(cleanedObj.type === "new-connection"){
            console.log("Connected to Screen!")
        }else if(cleanedObj.type === "new-fps"){
            updateFPS(cleanedObj.data)
        }else{
            console.log("MSG:",message)
        }
    })
}

function updateFPS(time){
    var frameDuration = time.timeDiff
    fpsElm.innerText = `${Math.round(IDEAL_FPS * (((1/IDEAL_FPS)*1000)/frameDuration))}` 
}

function updateTime(timeData){
    let pos = timeData.position
    let {current, duration} = timeData
    console.log("TIME:", pos, timeData, current, duration)
    progressBarElm.style.transform = `scaleX(${pos})`
}

function sendToServer(type, whatToSend){
    var sendingThing = JSON.stringify({type, data:whatToSend})
    if(W && W.readyState === 1){
        W.send(sendingThing)
    }else{
        console.log("Skipped sending", type, whatToSend)
    }
}

connectToScreen()

function setConnectionActive(){
    isAwake = true
    document.getElementById("connection-status").innerText = "AWAKE"
    document.getElementById("connection").classList.remove("inactive")
    document.getElementById("connection").classList.add("active")
}
function setConnectionInactive(){
    isAwake = false
    document.getElementById("connection-status").innerText = "ASLEEP"
    document.getElementById("connection").classList.add("inactive")
    document.getElementById("connection").classList.remove("active")
}
function setConnectionError(error){
    setConnectionInactive()
    document.getElementById("connection-status").innerText = "ERROR"
    console.error(error)
}

function heartbeat(timestamp){



    requestAnimationFrame(heartbeat)
}
requestAnimationFrame(heartbeat)