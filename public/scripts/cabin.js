const socket = io('/')
const videoGrid = document.getElementById('video-grid')
const peer = new Peer(USER_ID, {
    host: '/',
    port: '3001'
})

const myVideo = document.createElement('video')
myVideo.muted = true

const peers = {}
navigator.mediaDevices.getUserMedia({
    video: true,
    audio: true
}).then(stream => {
    addVideoStream(myVideo, stream)

    peer.on('call', call => {
        call.answer(stream)
        const video = document.createElement('video')
        call.on('stream', newVideoStream => {
            addVideoStream(video, newVideoStream)
        })
    })

    socket.on('user-connected', userId => {
        connectNewMember(userId, stream)
    })
})

socket.on('user-disconnected', userId => {
    if (peers[userId]) peers[userId].close()
})

peer.on('open', id => {
    socket.emit('join-cabin', ROOM_ID, id)
})


socket.on('user-connected', userId => {
    console.log(userId, "joined.")
})

function connectNewMember(userId, stream) {
    const call = peer.call(userId, stream)
    const video = document.createElement('video')
    call.on('stream', newVideoStream => {
        addVideoStream(video, newVideoStream)
    })

    call.on('close', () => {
        video.remove()
    })

    peers[userId] = call
}


function addVideoStream(video, stream) {
    video.srcObject = stream
    video.addEventListener('loadedmetadata', () => {
      video.play()
    })
    videoGrid.append(video)
  }