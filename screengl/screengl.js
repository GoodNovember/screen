function v3Point(x,y,z){
    return { x, y, z, type:"v3" }
}

function v2Point(x,y){
    return {x, y, type:"v2"}
}

function GL_Helper(gl){

    gl.clearColor(0.0,0.0,0.0,0.0)

    return {
        clear,
        createProgram,
        setCorners,
    }

    function setCorners(cornerA, cornerB, cornerC, cornerD, attribute){
        
        const rawCorners = [cornerA, cornerB, cornerC, cornerD]

        const cornerArray = rawCorners.reduce((acc, corner)=>{
            if(corner.type === "v2"){
                acc.push(corner.x)
                acc.push(corner.y)
            }else if(corner.type === "v3"){
                acc.push(corner.x)
                acc.push(corner.y)
                acc.push(corner.z)
            }
            return acc
        },[])
        
        const pointsOfData = cornerArray.length / rawCorners.length

        const bufferData = new Float32Array(cornerArray)

        const buffer = gl.createBuffer()

        gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
        gl.bufferData(gl.ARRAY_BUFFER, bufferData, gl.STATIC_DRAW)
        gl.vertexAttribPointer(attribute, pointsOfData, gl.FLOAT, false, 0, 0)
        gl.enableVertexAttribArray(attribute)
    }

    function clear(){

    }

    function createProgram(ingredients){
        return new Promise((resolve, reject)=>{
            const {vertex, fragment} = ingredients
            if(vertex && fragment){
                var srcFiles = [loadFile(vertex), loadFile(fragment)]
                Promise.all(srcFiles).then((results)=>{
                    var vertSrc = results[0]
                    var fragSrc = results[1]
                    var createShaderParts = [createFragmentShader(fragSrc, fragment), createVertexShader(vertSrc, vertex)]
                    return Promise.all(createShaderParts)
                }).then((shaders)=>{
                    var fShader = shaders[0]
                    var vShader = shaders[1]
                    const program = gl.createProgram()
                    gl.attachShader(program, vShader)
                    gl.attachShader(program, fShader)
                    gl.linkProgram(program)
                    gl.bindAttribLocation(program, 0, "position")
                    var success = gl.getProgramParameter(program, gl.LINK_STATUS)
                    if(success){
                        return program
                    }else{
                        var error = gl.getProgramInfoLog(program)
                        gl.deleteProgram(program)
                        reject(error)
                    }
                }).then((program)=>{
                    var attrCount = gl.getProgramParameter(program, gl.ACTIVE_ATTRIBUTES)
                    var unifCount = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS)
                    var uniforms = new Map()
                    var attributes = new Map()
                    for(let i = 0; i < attrCount; i++){
                        var meta = gl.getActiveAttrib(program, i)
                        var value = gl.getAttribLocation(program, meta.name)
                        var type = typeCheck(meta.type)
                        var size = meta.size
                        attributes.set(meta.name, {meta, loc:value, type, size})
                    }
                    for(let i = 0; i < unifCount; i++){
                        var meta = gl.getActiveUniform(program, i)
                        var value = gl.getUniformLocation(program, meta.name)
                        var type = typeCheck(meta.type)
                        var size = meta.size
                        uniforms.set(meta.name, {meta, loc:value, type, size})
                    }

                    function typeCheck(input){
                        var output = {}
                        var glTypes = [
                            "BOOL",
                            "BOOL_VEC2",
                            "BOOL_VEC3",
                            "BOOL_VEC4",
                            "FLOAT",
                            "FLOAT_MAT2",
                            "FLOAT_MAT3",
                            "FLOAT_MAT4",
                            "FLOAT_VEC2",
                            "FLOAT_VEC3",
                            "FLOAT_VEC4",
                            "HIGH_FLOAT",
                            "HIGH_INT",
                            "INT",
                            "INT_VEC2",
                            "INT_VEC3",
                            "INT_VEC4",
                            "LOW_FLOAT",
                            "LOW_INT",
                            "MEDIUM_FLOAT",
                            "MEDIUM_INT",
                            "BYTE",
                            "SHORT",
                            "UNSIGNED_BYTE",
                            "UNSIGNED_INT",
                            "UNSIGNED_SHORT",
                            "UNSIGNED_SHORT_4_4_4_4",
                            "UNSIGNED_SHORT_5_5_5_1",
                            "UNSIGNED_SHORT_5_6_5",
                        ]
                        var glBits = {
                            "BOOL":{},
                            "BOOL_VEC2":{},
                            "BOOL_VEC3":{},
                            "BOOL_VEC4":{},
                            "FLOAT":{},
                            "FLOAT_MAT2":{},
                            "FLOAT_MAT3":{},
                            "FLOAT_MAT4":{},
                            "FLOAT_VEC2":{},
                            "FLOAT_VEC3":{},
                            "FLOAT_VEC4":{},
                            "HIGH_FLOAT":{},
                            "HIGH_INT":{},
                            "INT":{},
                            "INT_VEC2":{},
                            "INT_VEC3":{},
                            "INT_VEC4":{},
                            "LOW_FLOAT":{},
                            "LOW_INT":{},
                            "MEDIUM_FLOAT":{},
                            "MEDIUM_INT":{},
                            "BYTE":{},
                            "SHORT":{},
                            "UNSIGNED_BYTE":{},
                            "UNSIGNED_INT":{},
                            "UNSIGNED_SHORT":{},
                            "UNSIGNED_SHORT_4_4_4_4":{},
                            "UNSIGNED_SHORT_5_5_5_1":{},
                            "UNSIGNED_SHORT_5_6_5":{},
                        }
                        const converted = glTypes.map((type)=>{
                            return {
                                key:type,
                                value:gl[type]
                            }
                        })

                        var output = converted.reduce((acc, type)=>{
                            if(!acc){
                                if(input === type.value){
                                    acc = type.key
                                }
                            }
                            return acc
                        }, null)

                        return output
                    }

                    resolve({attributes, uniforms})
                }).catch(reject)
            }else{
                reject({
                    error:"Need both vertex and fragment properties",
                    ingredients,
                })
            }
        })

        function createShader(type,source,filepath){
            return new Promise((resolve, reject)=>{
                const shader = gl.createShader(type)
                var isFragment = type === gl.FRAGMENT_SHADER
                var humanType = isFragment ? "fragment" : "vertex"
                gl.shaderSource(shader, source)
                gl.compileShader(shader)
                var success = gl.getShaderParameter(shader, self.gl.COMPILE_STATUS)
                if(success){
                    resolve(shader)
                }else{
                    let error = gl.getShaderInfoLog(shader)
                    gl.deleteShader(shader)
                    reject({error, humanType, filepath})
                }
            })
        }

        function createFragmentShader(source, filePath){
            return createShader(gl.FRAGMENT_SHADER, source, filePath)
        }

        function createVertexShader(source, filePath){
            return createShader(gl.VERTEX_SHADER, source, filePath)
        }
    }

    function loadFile(path){
        return new Promise((resolve, reject)=>{
            fetch(path).then((response)=>{
                return response.text()
            }).then(resolve)
            .catch(reject)
        })
    }
}

function ScreenGL(){

    const element = document.createElement("canvas")
    const gl = element.getContext("webgl")

    const helper = GL_Helper(gl)

    helper.createProgram({
        vertex:"./shaders/screen.vert.glsl",
        fragment:"./shaders/screen.frag.glsl"
    }).then((stuff)=>{
        console.log(stuff)
    }).catch((err)=>{
        console.error(err)
    })

    const ca = v2Point(5, 10)
    const cb = v2Point(13, 15)
    const cc = v2Point(17, 32)
    const cd = v2Point(21, 40)

    // helper.setCorners(ca,cb,cc,cd,0)

    let activeMediaElement = null
    let isVisible = false
    let isPlayable = false

    let isMediaLoaded = false

    let isPlaying = false

    const CACHE = new Map()

    function clear(){
        gl.clear(gl.COLOR_BUFFER_BIT)
    }

    function size(){

    }

    function boot(){
        function heartbeat(timestamp){
            size()
            clear()
            requestAnimationFrame(heartbeat)
        }
        requestAnimationFrame(heartbeat)
    }

    return {
        element,
        setActiveMedia,
        play,
        pause,
        stop,
        activeMediaElement,
        loadImage,
        loadVideo,
        loadAudio,
        boot,
    }

    function loadImage(src){
        const img = document.createElement("img")
        img.addEventListener("load", (event)=>{
            setActiveMedia(img)
            CACHE.set(src, img)
        })
        img.src = src
    }

    function loadVideo(src){
        const vid = document.createElement("video")
        vid.addEventListener("load", (event)=>{
            setActiveMedia(vid)
            CACHE.set(src, vid)
        })
        vid.src = src
    }

    function loadAudio(src){
        const aud = document.createElement("audio")
        aud.addEventListener("load", (event)=>{
            setActiveMedia(aud)
            CACHE.set(src, aud)
        })
        aud.src = src
    }

    function setActiveMedia(mediaElement){

        const visibleElements =     [HTMLVideoElement, HTMLImageElement, HTMLCanvasElement]
        const playableElements =    [HTMLVideoElement, HTMLAudioElement]

        function isSupportedReducer(acc, testElement){
            if(!acc){
                if(mediaElement instanceof testElement){
                    acc = true
                }
            }
            return acc
        }

        isVisible =     visibleElements.reduce(isSupportedReducer, false)
        isPlayable =    playableElements.reduce(isSupportedReducer, false)

        if(isVisible || isPlayable){
            activeMediaElement = mediaElement
        }

    }

    function play(){
        if(isPlayable){
            if( ! isPlaying){
                activeMediaElement.play()
                isPlaying = true
            }
        }
    }

    function pause(){
        if(isPlayable){
            if(isPlaying){
                activeMediaElement.pause()
                isPlaying = false
            }else{
                activeMediaElement.play()
                isPlaying = true
            }
        }
    }

    function stop(){
        if(isPlayable){
            if(isPlaying){
                isPlaying = false
                activeMediaElement.pause()
                activeMediaElement.currentTime = 0
            }
        }
    }

}