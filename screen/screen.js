const { ipcRenderer } = require("electron")
const display = document.createElement("canvas")
const ctx = display.getContext('2d')

let activeElement = null
let isPlaying = false
let lastTS = 0

const mediaSource = {
    type:"video",
    path:"../shows/demo/media/vid/jelly.m4v"
}

loadMedia(mediaSource)

ipcRenderer.on("cue-control",(event, content)=>{
    if(content.data === "play"){
        playActiveElement()
    }
    if(content.data === "pause"){
        pauseActiveElement()
    }
    if(content.data === "stop"){
        stopActiveElement()
    }
})

ipcRenderer.on("new-cue-data",(event, content)=>{
    loadMedia(content.data)
})

document.body.appendChild(display)

function loadMedia(mediaObj){
    let promise = null
    if(mediaObj.type === "video"){
        promise = loadVideo(mediaObj.path)
    }else if(mediaObj.type === "image"){
        promise = loadVideo(mediaObj.path)
    }else if (mediaObj.type === "audio"){
        promise = loadVideo(mediaObj.path)
    }
    if(promise){
        promise.then(()=>{
            console.log("Media Loaded.")
        }).catch(error=>console.error(error))
    }
}

function loadVideo(mediaPath){
    return new Promise((resolve, reject)=>{
        activeElement = null
        var elm = document.createElement("video")
        elm.controls = true
        elm.addEventListener("canplaythrough", (event)=>{
            activeElement = elm
            resolve()
        })
        elm.addEventListener("error", (event)=>{
            reject(event)
        })
        elm.addEventListener("timeupdate", (event)=>{
            console.log("TIME:", (event))
            var videoEventElement = event.path[0]
            updateTime(videoEventElement.currentTime, videoEventElement.duration)
        })
        elm.src = mediaPath
    })
}

function loadImage(mediaPath){
    return new Promise((resolve, reject)=>{
        activeElement = null
        var elm = document.createElement("image")
        elm.addEventListener("load", (event)=>{
            activeElement = elm
            resolve()
        })
        elm.addEventListener("error", (event)=>{
            reject(event)
        })
        elm.src = mediaPath
    })
}

function loadAudio(mediaPath){
    return new Promise((resolve, reject)=>{
        activeElement = null
        var elm = document.createElement("audio")
        elm.addEventListener("load", (event)=>{
            activeElement = elm
            resolve()
        })
        elm.addEventListener("error", (event)=>{
            reject(event)
        })
        elm.addEventListener("timeupdate", (event)=>{
            updateTime(elm.currentTime, elm.duration)
        })
        elm.src = mediaPath
    })
}

function sizeCanvas(context){
    const dpr = window.devicePixelRatio || 1
    const targetWidth = context.canvas.clientWidth * dpr
    const targetHeight = context.canvas.clientHeight * dpr
    if(context.canvas.width !== targetWidth || context.canvas.height !== targetHeight){
        context.canvas.width = targetWidth
        context.canvas.height = targetHeight
    }
}

function playActiveElement(){
    if(
        ( isMediaElement(activeElement) ) && ( isPlaying === false )
    ){
        isPlaying = true
        activeElement.play()
    }
}

function stopActiveElement(){
    if(
        (isMediaElement(activeElement)) && ( isPlaying === true )
    ){
        pauseActiveElement()
        activeElement.currentTime = 0
    }
}

function pauseActiveElement(){
    if(
        (isMediaElement(activeElement)) && (isPlaying = true)
    ){
        isPlaying = false
        activeElement.pause()
    }
}

function isMediaElement(elm){
    return ( elm instanceof HTMLAudioElement || elm instanceof HTMLVideoElement )
}

function updateTime(newTime, duration){
    // console.log("TIME:", newTime)
    ipcRenderer.send("cue-time-updated", {
        position:newTime / duration,
        current:newTime,
        duration:duration
    })
}

function clearCanvas(context){
    context.clearRect(0,0,context.canvas.width, context.canvas.height)
}

function draw(context){

    const dpr = window.devicePixelRatio || 1.0

    let cvsW = context.canvas.width * dpr
    let cvsH = context.canvas.height * dpr

    let contentW = 0
    let contentH = 0

    let w = 0
    let h = 0
    let x = 0
    let y = 0

    let contentRatio = 1.0
    let canvasRatio = cvsW / cvsH

    let isCanvasSquare = cvsW === cvsH
    let isCanvasPortrait = (cvsW < cvsH)
    let isCanvasLandscape = (cvsW > cvsH)
    
    let isContentSquare = false
    let isContentPortrait = false
    let isContentLandscape = false
    
    let isSupportedElement = false

    if(activeElement){
        if(activeElement instanceof HTMLVideoElement){
            isSupportedElement = true
            contentW = activeElement.videoWidth
            contentH = activeElement.videoHeight
        }else if (activeElement instanceof HTMLImageElement){
            isSupportedElement = true
            contentW = activeElement.naturalWidth
            contentH = activeElement.naturalHeight
        }else if (activeElement instanceof HTMLCanvasElement){
            isSupportedElement = true
            contentW = activeElement.width
            contentH = activeElement.height
        }else{
            isSupportedElement = false
            console.log("Unhandled Element Type.", activeElement)
        }
        if(isSupportedElement){
            contentRatio = contentW / contentH
            if(contentRatio >= canvasRatio){
                w = cvsW
                h = w / contentRatio
                y = (cvsH - h) / 2
            }else{
                h = cvsH
                w = h * contentRatio
                x = (cvsW - w) / 2
            }
            context.drawImage(activeElement, x, y, w, h)
        }
    }
}

function sendFPS(currentTS){
    var timeDiff = currentTS - lastTS
    ipcRenderer.send("new-fps", {timeDiff})
    lastTS = currentTS
}

function heartbeat(timestamp){
    sendFPS(timestamp)
    if(!activeElement){
        if(isPlaying){
            isPlaying = false
            updateTime(0)
        }
        isPlaying = false
    }
    sizeCanvas(ctx)
    clearCanvas(ctx)
    draw(ctx)
    requestAnimationFrame(heartbeat)
}
requestAnimationFrame(heartbeat)

console.log("Screen Ready.")