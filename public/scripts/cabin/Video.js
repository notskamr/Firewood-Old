export default class Video {
    constructor (video) {
        this.video = video
    }
    appendGrid(elemid, isId=true) {
        let grid;
        if (isId) grid = document.getElementById(elemid)
        else { grid = elemid}
        grid.appendChild(this.video)
    }

    getVideo() {
        return this.video
    }
}