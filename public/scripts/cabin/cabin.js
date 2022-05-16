import Stream from "./Stream.js"
import Video from "./Video.js"
import { UserStream } from "./UserStream.js"

const socket = io('/')
const peer = new Peer(USER_ID, {
    secure: true,
    host: 'firewood-peerjs-server.herokuapp.com',
    port: 443
})

const videoGrid = "video-grid"

var localStream;
var userCount = 1;
var users = {}
var peers = {}

var facing = "user"
var localVideo;
// Checking the SupportedConstraints of the device
const supports = navigator.mediaDevices.getSupportedConstraints();

/* const flipButton = document.getElementById("flip-camera")

if (!supports.facingMode) {
    // flipButton.remove()
}
else {
    flipButton.addEventListener('click', () => {
        flipCamera()
        console.log('flip')
    })
}


*/
console.log(supports)


// creating and getting a new Stream
new Stream().getLocal().then(
    stream => {
        // Turning stream into new UserStream
        const userStream = new UserStream(USER_ID, USERNAME, stream, true)
        console.log(stream)
        localStream = stream
        // Constructing the video element
        const constructedLocalVideo = new Video(userStream.constructLocalVideo(`You (${USERNAME})`))
        constructedLocalVideo.appendGrid(videoGrid)

        // Printing out our media stream resolution (For convenience!)
        console.log(`Width: ${stream.getVideoTracks()[0].getSettings().width} Height: ${stream.getVideoTracks()[0].getSettings().height}`)

        // Whenever we are called - run this code
        peer.on('call', call => {
            // Answer the call
            call.answer(localStream)
            // Whenever we receive a stream from the caller - run this code
            call.on('stream', userVideoStream => {
                // Create a new stream out of the data of the user
                const newUserStream = new UserStream(call.metadata.id, call.metadata.username, userVideoStream)
                //Create a constructed video element out of the data
                const constructedNewVideo = new Video(newUserStream.constructLocalVideo())
        
                //Adding the constructed video to the grid - checking if the user is already added to the grid/alraedy initialized in our 'users' object
                if (!users[call.metadata.id]) {constructedNewVideo.appendGrid(videoGrid); calculateGrid()}
                
                // Add the users video to the list (object, really) of 'users'
                users[call.metadata.id] = constructedNewVideo
                
            })
            
            // Whenever the call from the user closes, delete the data relative to the user
            call.on('close', () => {
                if (users[call.metadata.id]) users[call.metadata.id].getVideo().remove()
                delete users[call.metadata.id]
                peers[call.metadata.id].close()
            })

            // Also add the call to the peers!
            peers[call.metadata.id] = call 
        })



        // Whenever a new user connects, the code inside is run; thus we get the new user's: id and username
        socket.on('user-connected', (userId, username) => {
            console.log(`${username} (${userId}) connected.`)
            // We connect to this new user; by sending him our stream
            
            setTimeout(() => {
                connectToNewUser(USERNAME, USER_ID, userId, username,/* Our stream -> */ stream)
            }, 3000)
            
        })
    }
)

// When a user disconnects - run this code
socket.on('user-disconnected', (id, username) => {
    console.log(peers, users)
    // Logging the disconnection
    console.log(`${username} (${id}) disconnected.`)

        // Remove that users video element
        if(document.getElementById(`div-${id}`)) document.getElementById(`div-${id}`).remove()

        calculateGrid()
        // Remove him from the 'users' and 'peers' objects; and close the peer connection.
        delete users[id]

        if (peers[id]) {
            peers[id].close(); 
            delete peers[id];
        }

        console.log(peers, users)

        
})


// Emitting that we (the current user, which is us on the client side) have joint this specific room; and here are our details (id, username)
socket.emit('join-cabin', CABIN_ADDRESS, USER_ID, USERNAME)



// Whenever a new user joins, we connect to them
async function connectToNewUser(username, userId, newUserId, newUsername, stream) {
    console.log("Called 'connectToNewUser()")
    //Data to send to user with call
    const options = {metadata: {id: userId, username: username }}

    // We call up the new user!
    const call = peer.call(newUserId, stream, options)

    call.on('stream', /* Stream of new user -> */ (newStream) => {
        // Creating a new stream out of it!
        console.log(users, peers)
        const newUserStream = new UserStream(newUserId, newUsername, newStream)
        const constructedNewVideo = new Video(newUserStream.constructLocalVideo())

        //Adding the constructed video to the grid - and checking if he is already added
        if (!users[newUserId]) {constructedNewVideo.appendGrid(videoGrid); calculateGrid()}

        // Add the new user to our 'users' object
        users[newUserId] = constructedNewVideo
    })
    
    // Whenever the call closes, delete the data relative to the user
    call.on('close', () => {
        if (users[newUserId]) users[newUserId].getVideo().remove()
        delete users[newUserId]
        peers[newUserId].close()
    })

    // Add the call to 'peers'
    peers[newUserId] = call
}


/* async function flipCamera() {
    console.log("Flipping camera...")
    const tracks = localStream.getTracks()
    const currFacingMode = localStream.getVideoTracks()[0].getSettings().facingMode
    console.log(facing)
    tracks.forEach(track => { if (track.kind === "video") track.stop;})

    let flippedStream;

    if (facing == "user") {
        await navigator.mediaDevices.getUserMedia({
            video: {
                width: {ideal: 1920},
                height: {ideal: 1080},
                facingMode: 'environment'
            },
        }).then(stream => {flippedStream = stream}).catch(err => console.log(err))

        facing = "environment"
    }
    else {
        await navigator.mediaDevices.getUserMedia({
            video: {
                width: {ideal: 1920},
                height: {ideal: 1080},
                facingMode: 'user'
            },
        }).then(stream => {flippedStream = stream}).catch(err => console.log(err))

        facing = "user"
    }

    for (let [key, value] of Object.entries(peer.connections)) {
        console.log(peer.connections)
        console.log(key)
        console.log(peer.connections[key][0].peerConnection.getSenders()[1])
        peer.connections[key][0].peerConnection.getSenders()[1].replaceTrack(flippedStream.getTracks()[0])
    }

    console.log(localStream.getVideoTracks()[0])
    
} */


function calculateGrid() {
    var userCount = document.querySelectorAll(".video-container").length
    console.log("Calculating...")
    var type = getComputedStyle(document.documentElement).getPropertyValue("--type")
    
    var grid = document.getElementById('video-grid')

    // names of variables for ease
    const gridRows = "--grid-rows"
    const gridColumns = "--grid-columns"

    console.log(userCount, type, gridRows, gridColumns)

    var rows = parseInt(getComputedStyle(grid).getPropertyValue(gridRows))
    var columns = parseInt(getComputedStyle(grid).getPropertyValue(gridColumns))
    
    if (type == " vertical ") {
        console.log("Vertical window.")
        if (userCount == 1) {
            grid.style.setProperty(gridRows, 1)
            grid.style.setProperty(gridColumns, 1)
        }
    
        else if (userCount == 2) {
            grid.style.setProperty(gridRows, 2)
            grid.style.setProperty(gridColumns, 1)
        }
    
        else if (userCount == 3) {
            grid.style.setProperty(gridRows, 3)
            grid.style.setProperty(gridColumns, 1)
        }

        else if (userCount == 4) {
            grid.style.setProperty(gridRows, 2)
            grid.style.setProperty(gridColumns, 2)
        }
    }
    else {
        console.log("Horizontal window.")
        if (userCount == 1) {
            grid.style.setProperty(gridRows, 1)
            grid.style.setProperty(gridColumns, 1)
        }
        else if (userCount == 2) {
            grid.style.setProperty(gridRows, 1)
            grid.style.setProperty(gridColumns, 2)
        }
        else if (userCount == 3) {
            grid.style.setProperty(gridRows, 1)
            grid.style.setProperty(gridColumns, 3)
        }
        else if (userCount == 4) {
            grid.style.setProperty(gridRows, 2)
            grid.style.setProperty(gridColumns, 2)
        }
    }
}
























// Button stuff
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

var leaveSound = new Audio('.././sounds/leave.mp3')
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
        track = localStream.getTracks().find(track => track.kind === 'video')
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
        track = localStream.getTracks().find(track => track.kind === 'audio')
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

const debugButton = document.getElementById("debug")

if (debugButton) {
    debugButton.addEventListener('click', () => {
    console.log(peers, users)
    calculateGrid()
})
}

window.onbeforeunload = () => {
    peer.close()
}

window.onresize = calculateGrid