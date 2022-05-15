export class UserStream {
    constructor (id, username, stream, self=false) {
        this.id = id;
        this.username = username
        this.stream = stream
        this.self = self
    }
    getStream() {
        return this.stream
    }
    constructLocalVideo(text=this.username) {
        let constructedLocalVideo = constructLocalVideo(this.id, text, this.stream, this.self)
        return constructedLocalVideo;
    }

    constructVideo(video) {
        
    }
}

function constructLocalVideo(id, text, stream, self=false) {
    

        var video = document.createElement('video'); 

        video.setAttribute('autoplay', '');
        video.setAttribute('muted', '');
        video.setAttribute('playsinline', '');

        video.setAttribute('id', id); 
        video.srcObject = stream
        if (self) video.muted = true
            const videoDiv = document.createElement('div')
            videoDiv.classList.add("video-container")
            videoDiv.setAttribute("id", `div-${id}`)
            const userText = document.createElement('h3')
            userText.innerText = text
            const userTextDiv = document.createElement('div')
            userTextDiv.appendChild(userText)
            userTextDiv.classList.add("user-text-div")
            userText.classList.add("user-text")
            videoDiv.append(userTextDiv)
            videoDiv.append(video)
            video.classList.add("video")
            video.addEventListener('loadedmetadata', () => {
                video.play()
            })
            // console.log(videoDiv)
            return videoDiv
        }

