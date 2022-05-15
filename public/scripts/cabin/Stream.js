export default class Stream {
    constructor(stream) {
        this.stream = stream
    }
    async getLocal(ideal={width: 1920, height: 1080}) {
        const stream = navigator.mediaDevices.getUserMedia({
            video: {
                width: {ideal: ideal.width},
                height: {ideal: ideal.height}
            },
            audio: true
        })

        return stream;
    }
}