const socket = io('/')

var peer = new Peer(USER_ID)


peers = {}

let myVideo;
let myVideoStream;

navigator.mediaDevices.getUserMedia({
    video: true,
    audio: true
}).then(stream => {
    
    myVideoStream = stream
    myVideo = document.createElement('video')

    addVideoStream(`You (${USERNAME})`, USER_ID, myVideo, stream, true)

    peer.on('call', call => {
        call.answer(stream)
        console.log(call)
        conn.on('data', (latestUsername, latestId) => {

            call.on('stream', (userVideoStream) => {
                console.log(userVideoStream)
                const video = document.createElement('video')
                addVideoStream(latestUsername, latestId, video, userVideoStream)
            })
        })
    })

    socket.on('user-connected', (userId, username)  => {
        console.log("User connected")
        connectToNewUser(userId, stream, username)
    })
})

peer.on('open', () => {
    socket.emit("join-cabin", CABIN_ADDRESS, USER_ID, USERNAME);
})




const connectToNewUser = (id, stream, username) => {
    console.log(`New user: ${username} (${id})`)
    const call = peer.call(id, stream)
    latestUsername = username
    console.log(call)
    var conn = peer.connect(id)

    conn.on('open', () => {
        conn.send(USERNAME, id)
    })

    call.on('stream', userVideoStream => {
        console.log(`Called ${username} (${id}) - ${userVideoStream}`)
        const video = document.createElement('video')
        addVideoStream(username, id, video, userVideoStream, false)
        peers[id] = call
    })


}


const addVideoStream = (username, id, video, stream, self=false) => {
    // Creating the video stream, div
    video.srcObject = stream
    console.log(username, id, video, stream, self)
    if (peers[id] != undefined || self ) { 
        const videoDiv = document.createElement('div')
        videoDiv.classList.add("video-container")
        const userText = document.createElement('h3')
        userText.innerText = username
        const userTextDiv = document.createElement('div')
        userTextDiv.appendChild(userText)

        userText.classList.add("user-text")

        if (self) video.muted = true
        
        videoDiv.append(userTextDiv)
        videoDiv.append(video)
        video.addEventListener('loadedmetadata', () => {
            video.play()
        })
        const videoGrid = document.getElementById("video-grid")
        videoGrid.append(videoDiv)
    }
        


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