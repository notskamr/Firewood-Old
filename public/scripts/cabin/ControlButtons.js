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
        track = userStream.getStream().getTracks().find(track => track.kind === 'video')
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
        track = userStream.getStream().getTracks().find(track => track.kind === 'audio')
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