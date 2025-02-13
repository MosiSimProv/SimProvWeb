import axios from "axios";

const container = $("#errors")

function setupErrorView() {
    if (container.length) {
        axios.get("/error-log").then(res => {
            $('#errors').jsonViewer(res.data)
        })

    }
}


export {setupErrorView}
