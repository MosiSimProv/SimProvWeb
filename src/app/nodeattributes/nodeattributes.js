import $ from 'jquery'
import {buildEntityList, buildFormCheckbox, buildFormInputLine} from "./helpers"
import axios from "axios";
import {cytoscapeContainer} from "../graphview/graphview";
import {EntityTypeMode, NodeAttributesMode, SelectDependencyMode} from "../enums";
import {state} from "../state";
import {layoutOpts} from "../graphview/config";

const nodeAttributesContainer = $("#node-attributes-form")
const editButton = $("#edit-node-attributes-btn")
const saveButton = $("#save-node-attributes-btn")
const downloadJSONBtn = $("#download-json-btn")
const downloadDotBtn = $("#download-dot-btn")

let currentlyViewedNodeID = null;

function clearForm() {
    nodeAttributesContainer.empty()
}

function renderEntityAttributesView(nodeData) {
    state.entityTypeMode = EntityTypeMode.ENTITY
    const typeFormLine = buildFormInputLine("Type", nodeData["type"])
    const nameFormLine = buildFormInputLine("Name", nodeData["name"])
    nodeAttributesContainer.append(typeFormLine)
    nodeAttributesContainer.append(nameFormLine)
    for (let attribute of nodeData["attributes"]) {
        const attributeLine = buildFormInputLine(attribute["name"], attribute["value"], attribute["editable"])
        nodeAttributesContainer.append(attributeLine)
    }
}

function renderActivityAttributesView(nodeData) {
    state.entityTypeMode = EntityTypeMode.ACTIVITY
    const typeFormLine = buildFormInputLine("Type", nodeData["type"])
    const nameFormLine = buildFormInputLine("Name", nodeData["name"])
    nodeAttributesContainer.append(typeFormLine)
    nodeAttributesContainer.append(nameFormLine)

    const [usageList, addUsageButton] = buildEntityList("Usage", nodeData)
    nodeAttributesContainer.append(usageList)
    addUsageButton.on("click", handleAddUsageButtonClick)

    const [generationList, addGenerationButton] = buildEntityList("Generation", nodeData)
    nodeAttributesContainer.append(generationList)
    addGenerationButton.on("click", handleAddGenerationButtonClick)

    const [container, checkbox] = buildFormCheckbox("Hide Node")
    checkbox.prop("checked", nodeData["hidden"])

    checkbox.on("click", hideNode)
    nodeAttributesContainer.append(container)
}


function handleAddGenerationButtonClick(evt) {
    evt.preventDefault()
    cytoscapeContainer.trigger("addEntityButtonClicked", SelectDependencyMode.GENERATION)
    state.nodeAttributesMode = NodeAttributesMode.SELECTING

}

function handleAddUsageButtonClick(evt) {
    evt.preventDefault()
    cytoscapeContainer.trigger("addEntityButtonClicked", SelectDependencyMode.USAGE)
    state.nodeAttributesMode = NodeAttributesMode.SELECTING


}

function renderNodeAttributesView(nodeData) {
    clearForm()
    if (nodeData["type"] === "Entity") {
        renderEntityAttributesView(nodeData)
    } else if (nodeData["type"] === "Activity") {
        renderActivityAttributesView(nodeData)
    }
    else if (nodeData["type"] === "Agent") {
        renderEntityAttributesView(nodeData)
    }
}

function handleNodeClick(evt, payload) {
    if (state.nodeAttributesMode !== NodeAttributesMode.VIEWING) return;
    const nodeID = payload.clickedNode.id()
    const data = {"id": nodeID, "reducedGraph": state.showReducedGraph}
    const axiosConfig = {
        params: data
    }
    axios.get("/node-data", axiosConfig)
        .then(res => {
            renderNodeAttributesView(res.data)
            editButton.attr("disabled", false)
            saveButton.attr("disabled", true)
            currentlyViewedNodeID = nodeID;
        })
}

async function handleSaveButtonClickEntityView() {
    const data = {id: currentlyViewedNodeID, changes: {}}
    nodeAttributesContainer.find('[data-editable="true"]').each(function (i, input_elem) {
        input_elem.disabled = true
        data.changes[input_elem.name] = input_elem.value
    })
    await axios.post("/update-entity", data)
}


async function hideNode() {
    const data = {id: currentlyViewedNodeID, changes: $(this).prop("checked")}
    await axios.post("/hide-node", data)
    cytoscapeContainer.trigger("dependenciesUpdated", {})


}

async function handleSaveButtonClickActivityView() {
    const data = {id: currentlyViewedNodeID, changes: state.depdencyChanges}
    await axios.post("/update-activity", data)
    state.depdencyChanges = []

}

async function handleSaveButtonClick() {
    editButton.attr("disabled", false)
    saveButton.attr("disabled", true)
    if (state.entityTypeMode === EntityTypeMode.ENTITY) {
        await handleSaveButtonClickEntityView()
    } else if (state.entityTypeMode === EntityTypeMode.ACTIVITY) {
        await handleSaveButtonClickActivityView().then(r => console.log("Saved"))
        cytoscapeContainer.trigger("dependenciesUpdated")
    }
    const data = {"id": currentlyViewedNodeID}
    const axiosConfig = {
        params: data
    }
    axios.get("/node-data", axiosConfig)
        .then(res => {
            renderNodeAttributesView(res.data)
            editButton.attr("disabled", false)
            saveButton.attr("disabled", true)
        })
}

function handleEditButtonClickEntityView() {
    nodeAttributesContainer.find('[data-editable="true"]').each(function (i, input_elem) {
        input_elem.disabled = false
    })
}

function emitDeleteDependency(evt) {
    evt.preventDefault()
    const payload = {
        currentlyViewedNodeID: currentlyViewedNodeID,
        clickedNodeID: evt.target.dataset.node_id,
        target: evt.target
    }
    cytoscapeContainer.trigger("deleteDependency", payload)
    nodeAttributesContainer.trigger("deleteDependency", payload)
}

function handleEditButtonClickActivityView() {
    nodeAttributesContainer.find('[data-deleteable="true"]').each(function (i, input_elem) {
        $(input_elem).addClass("list-group-item-danger")
        $(input_elem).on("click", emitDeleteDependency)
    })

    nodeAttributesContainer.find('[data-editable="true"]').each(function (i, input_elem) {
        input_elem.disabled = false
    })
}

function handleEditButtonClicked() {
    console.log("edit button clicked")
    editButton.attr("disabled", true)
    saveButton.attr("disabled", false)
    if (state.entityTypeMode === EntityTypeMode.ENTITY) {
        handleEditButtonClickEntityView()
    } else if (state.entityTypeMode === EntityTypeMode.ACTIVITY) {
        handleEditButtonClickActivityView()
    }
}

function handleAddEntityClicked(payload) {
    console.log("Add node clicked attributes", payload)
    state.nodeAttributesMode = NodeAttributesMode.VIEWING
}


function handleDeleteDependency(evt, payload) {
    const button = payload.target
    $(button).remove()
}

nodeAttributesContainer.on("addEntityClicked", handleAddEntityClicked)
nodeAttributesContainer.on("nodeClicked", handleNodeClick)
nodeAttributesContainer.on("saveButtonClicked", handleSaveButtonClick)
nodeAttributesContainer.on("editButtonClicked", handleEditButtonClicked)
nodeAttributesContainer.on("deleteDependency", handleDeleteDependency)

editButton.on("click", function () {
    nodeAttributesContainer.trigger("editButtonClicked");
    cytoscapeContainer.trigger("editButtonClicked")
})

saveButton.on("click", function () {
    nodeAttributesContainer.trigger("saveButtonClicked");
    cytoscapeContainer.trigger("saveButtonClicked")
})

downloadJSONBtn.on("click", function () {
    var url = axios.defaults.baseURL + "/graph-json?showReducedGraph=" + state.showReducedGraph + "&reduceTransitives=" + state.reduceTransitives + "&hideNodes=" + state.hideNodes
    window.open(url, '_blank');
})

downloadDotBtn.on("click", function () {
    var url = axios.defaults.baseURL + "/graph-dot?showReducedGraph=" + state.showReducedGraph + "&reduceTransitives=" + state.reduceTransitives + "&hideNodes=" + state.hideNodes
    window.open(url, '_blank');
})

$(document).ready(function () {
        editButton.attr("disabled", true)
        saveButton.attr("disabled", true)
    }
)

export default nodeAttributesContainer
