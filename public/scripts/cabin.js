const socket = io('/')
const videoGrid = document.getElementById('video-grid')
const myPeer = new Peer(USER_ID)

var audioCtx = new AudioContext()

const myVideoDiv = document.createElement('div')
myVideoDiv.classList.add("video-container")
const userText = document.createElement('h3')
userText.innerText = `You (${USERNAME})`
const userTextDiv = document.createElement('div')
userTextDiv.appendChild(userText)

userText.classList.add("user-text")

const myVideo = document.createElement('video')
myVideo.classList.add('video')
myVideoDiv.append(userTextDiv)
myVideo.muted = true
let myVideoStream;
var peers = {}

const myStream = navigator.mediaDevices.getUserMedia({
    video: true,
    audio: true
}).then(stream => {
    addVideoStream(myVideo, myVideoDiv, stream)
    myVideoStream = stream
    myPeer.on('call', call => {

        myPeer.on('connection', function(conn) {
            conn.on('data', async function(username, userId) {
        
                call.answer(stream)
                console.log(stream)
                const videoDiv = document.createElement('div')
                videoDiv.setAttribute('id', userId)
                videoDiv.classList.add("video-container")
                const userText = document.createElement('h3')
                userText.innerText = username
                const userTextDiv = document.createElement('div')
                userTextDiv.appendChild(userText)

                userText.classList.add("user-text")
            
                const video = document.createElement('video')
                video.classList.add('video')
                videoDiv.append(userTextDiv)
                console.log('called.')
                call.on('stream', userVideoStream => {
                    console.log("Stream")
                    addVideoStream(video, videoDiv, userVideoStream)
                })
            });
          });
    })
    socket.on('user-connected', (userId, username) => {
        connectToNewUser(userId, stream, username)
        console.log(userId +  " (", username + ")" + " joined.")
    })
})


socket.on('user-disconnected', (userId, username) => {
    if (peers[userId]) {
        peers[userId].close()
        div = document.getElementById(userId)
        div.remove()
        delete peers[userId]
    }
    console.log(userId +  "(", username + ")" + " left.")
})

myPeer.on('open', () => {
    socket.emit('join-cabin', CABIN_ADDRESS, USER_ID, USERNAME)
})

function connectToNewUser(userId, stream, newUserName) {
    const call = myPeer.call(userId, stream)
    console.log(call)
    console.log(stream)
    var conn = myPeer.connect(userId)
    conn.on('open', () => {
        conn.send(USERNAME, USER_ID)
    })

    const videoDiv = document.createElement('div')
    videoDiv.setAttribute('id', userId)
    videoDiv.classList.add("video-container")
    const userText = document.createElement('h3')
    userText.innerText = newUserName
    const userTextDiv = document.createElement('div')
    userTextDiv.appendChild(userText)

    userText.classList.add("user-text")

    const video = document.createElement('video')
    video.classList.add('video')
    videoDiv.append(userTextDiv)
    call.on('stream', (userVideoStream) => {
        addVideoStream(video, videoDiv, userVideoStream)
    })

    call.on('close', () => {
        videoDiv.remove()
    })

    peers[userId] = call
}


const addVideoStream = (video, container, stream) => {
    video.srcObject = stream
    video.addEventListener('loadedmetadata', () => {
      video.play()
    })
    container.append(video)
    videoGrid.append(container)
}

const toggleCamera = document.getElementById("toggle-camera")
const toggleMic = document.getElementById("toggle-mic")
const leaveBtn = document.getElementById("leave")
let left = false
toggleCamera.addEventListener('click', (e) => {
    e.preventDefault()
    toggle("video")
})

toggleMic.addEventListener('click', (e) => {
    e.preventDefault()
    toggle("audio")
})

var leaveSound = new Audio('.././sounds/leave.ogg')
leaveBtn.addEventListener('click', async (e) => {
    if (!left) {
        e.preventDefault()
        
        leaveSound.play()
        left = true
        setTimeout(()=> {
            window.location.replace("/")
        }, 450)

    }
})

const toggle = (target) => {
    if (target != "video" && target != "audio") return false

    let track;

    if (target == "video") {
        track = myVideoStream.getTracks().find(track => track.kind === 'video')
        if (track.enabled) {
            track.enabled = false
            toggleCamera.children[0].classList.remove("bi-camera-video-fill")
            toggleCamera.children[0].classList.add("bi-camera-video-off-fill", "toggled")
        }
        else {
            track.enabled = true
            toggleCamera.children[0].classList.add("bi-camera-video-fill")
            toggleCamera.children[0].classList.remove("bi-camera-video-off-fill", "toggled")
        }
    }

    else {
        track = myVideoStream.getTracks().find(track => track.kind === 'audio')
        if (track.enabled) {
            track.enabled = false
            toggleMic.children[0].classList.remove("bi-mic-fill")
            toggleMic.children[0].classList.add("bi-mic-mute-fill", "toggled")
        }
        else {
            track.enabled = true
            toggleMic.children[0].classList.add("bi-mic-fill")
            toggleMic.children[0].classList.remove("bi-mic-mute-fill", "toggled")
        }
    }
}

function playAudio(audio){
    return new Promise(res=>{
      audio.play()
      audio.onended = res
    })
  }

/*  
    const videoDiv = document.createElement('div')
    videoDiv.classList.add("video-container")
    const userText = document.createElement('h3')
    userText.innerText = newUserName
    const userTextDiv = document.createElement('div')
    userTextDiv.appendChild(userText)

    userText.classList.add("user-text")

    const video = document.createElement('video')
    videoDiv.append(userTextDiv)
*/
