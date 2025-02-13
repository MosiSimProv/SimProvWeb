import axios from "axios";

const eventDownloadBtn = $("#eventDownloadBtn")
const container = $("#events")

function setupEventView() {
    if (container.length) {
        axios.get("/event-log").then(res => {
            $('#events').jsonViewer(res.data)
        })

    }
}

eventDownloadBtn.on("click", function () {
    const url = axios.defaults.baseURL + "/graph-events"
    window.open(url, '_blank');
})


export {setupEventView}
