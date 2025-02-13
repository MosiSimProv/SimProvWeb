import cytoscape from 'cytoscape';
import dagre from 'cytoscape-dagre';
import $ from "jquery";
import {layoutOpts, styleOpts} from "./config";
import nodeAttributesContainer from "../nodeattributes/nodeattributes";
import axios from "axios";
import {GraphViewMode, SelectDependencyMode} from "../enums";
import {v4 as uuidv4} from "uuid";
import {socket, state} from "../state";

cytoscape.use(dagre);

var cy;
const cytoscapeContainer = $('#cy');
let currentlyClickedNodeID = null;

function setupCytoscape() {
    console.log(cytoscapeContainer)
    if (cytoscapeContainer.length) {
        cy = cytoscape({
            container: cytoscapeContainer,
            layout: layoutOpts,
            style: styleOpts,
            wheelSensitivity:0.4
        });
        updateStyleOpts()
        updateGraphView()
        cy.on("click", "node", emitNodeClickEvent)
        console.log(cy.style().json)
    }
}

function highlightUserGeneratedEdges(edges) {
    console.log(edges)
    for (let edge of edges) {
        const edgeData = edge["data"]
        if (edgeData["user-generated"]) {
            console.log(edgeData["id"])
            const cyEdge = cy.getElementById(edgeData["id"])
            cyEdge.addClass("user-generated")
        }
    }
}

function highlightCurrentlyClickedNode() {
    if (currentlyClickedNodeID != null) {
        const currentlyClickedNode = cy.getElementById(currentlyClickedNodeID)
        currentlyClickedNode.addClass("is-clicked")
    }
}

function updateStyleOpts() {
    axios.get("/graph-style")
        .then(res => {
            console.log(res.data)
            res.data.forEach(function (entry) {
                cy.style().append(entry).update()
            })
        })
}

function updateGraphView() {
    axios.get("/provenance-data", {
        params: {
            showReducedGraph: state.showReducedGraph,
            reduceTransitives: state.reduceTransitives,
            hideNodes: state.hideNodes,
            splitAgents:state.splitAgents
        }
    })
        .then(res => {
            console.log(res.data)
            cy.add(res.data)
            cy.layout(layoutOpts).run()
            if (state.hideNodes) {
                cy.$('[?hidden]').remove();

            }
            highlightCurrentlyClickedNode()
            // highlightUserGeneratedEdges(res.data["edges"])
        })
}

function emitNodeClickEvent(evt) {
    evt.preventDefault()
    const clickedNode = evt.target
    const clickedNodeId = clickedNode.id()
    const payload = {
        id: clickedNodeId,
        clickedNode: clickedNode
    }
    nodeAttributesContainer.trigger("nodeClicked", payload);
    cytoscapeContainer.trigger("nodeClicked", payload);
}


function handleEntityHoverEnter(evt, payload) {
    const nodeID = payload.id
    const node = cy.getElementById(nodeID)
    console.log("Hover entity", node)

    node.addClass("item-highlight")
}

function handleEntityHoverLeave(evt, payload) {
    const nodeID = payload.id
    const node = cy.getElementById(nodeID)
    node.removeClass("item-highlight")
}

function removeDependencyFromGraph(id) {
    const cyEdge = cy.getElementById(id)
    cy.remove(cyEdge)
}

function recreateEdgeInGraph(edge) {
    const edgeData = {data: edge}
    const cyEdge = cy.add(edgeData)
    cyEdge.addClass("user-generated")
}

function removeNewDependcyEdges() {
    for (let edge of state.depdencyChanges) {
        if (edge["user-generated"] !== undefined) {
            removeDependencyFromGraph(edge.id)
        }
        if (edge["user-removed"] !== undefined) {
            recreateEdgeInGraph(edge)
        }
    }
}

function handleNodeClickedExploring(payload) {
    const newClickedNodeID = payload.id
    const newCLickedNode = cy.getElementById(newClickedNodeID)
    if (currentlyClickedNodeID != null) {
        const currentlyClickedNode = cy.getElementById(currentlyClickedNodeID)
        currentlyClickedNode.removeClass("is-clicked")
    }
    newCLickedNode.addClass("is-clicked")
    currentlyClickedNodeID = newClickedNodeID;
    removeNewDependcyEdges()
    state.depdencyChanges = []
}

function handleNodeClickedSelecting(payload) {
    const clickedNode = payload.clickedNode
    const clickedNodeID = payload.id
    const nPayload = {id: clickedNodeID}
    if (clickedNode.data().type === "Entity") {
        nodeAttributesContainer.trigger("addEntityClicked", nPayload)
        cytoscapeContainer.trigger("addEntityClicked", nPayload)
    }
    state.graphViewMode = GraphViewMode.EXPLORING;
}

function handleNodeClicked(evt, payload) {
    console.log("Handle node clicked: Mode", state.graphViewMode)
    if (state.graphViewMode === GraphViewMode.EXPLORING) {
        handleNodeClickedExploring(payload)
    } else if (state.graphViewMode === GraphViewMode.SELECTING) {
        handleNodeClickedSelecting(payload)
    }
}

function handleAddEntityButtonClicked(event, payload) {
    state.graphViewMode = GraphViewMode.SELECTING;
    state.selectDependencyMode = payload
}

function buildNewEdgeData(clickedNodeId) {
    console.log(currentlyClickedNodeID, clickedNodeId)
    if (state.selectDependencyMode === SelectDependencyMode.USAGE) {
        return {
            id: uuidv4(),
            source: currentlyClickedNodeID,
            target: clickedNodeId,
            "user-generated": true
        }
    } else if (state.selectDependencyMode === SelectDependencyMode.GENERATION) {
        return {
            id: uuidv4(),
            source: clickedNodeId,
            target: currentlyClickedNodeID,
            "user-generated": true
        }
    }
}

function showCycleErrorAlert() {
    const alert = $("<div>")
    alert.addClass("alert alert-danger alert-dismissible")
    alert.html("You can't connect these nodes since the resulting graph would have a cycle.\n <button type=\"button\" class=\"btn-close\" data-bs-dismiss=\"alert\" aria-label=\"Close\"></button>")
    alert.attr("role", "alert")
    $("#alertLocation").append(alert);
}

function showInvalidActivityAlert() {
    const alert = $("<div>")
    alert.addClass("alert alert-danger alert-dismissible")
    alert.html("You can't connect these nodes as the resulting activity is not compatible with the specified activities.\n <button type=\"button\" class=\"btn-close\" data-bs-dismiss=\"alert\" aria-label=\"Close\"></button>")
    alert.attr("role", "alert")
    $("#alertLocation").append(alert);
}


async function handleAddEntityClicked(event, payload) {
    const clickedNodeId = payload.id
    const newEdgeData = buildNewEdgeData(clickedNodeId)
    state.depdencyChanges.push(newEdgeData)
    const edge = {data: newEdgeData}
    const cyEdge = cy.add(edge)

    axios.post("/dependency-valid-activity", {
        node: currentlyClickedNodeID, changes: state.depdencyChanges}).then(r => {
        state.graphViewMode = GraphViewMode.EXPLORING;
        if (r.data.result === false) {
            showInvalidActivityAlert()
            state.depdencyChanges.pop()
            cy.remove(cyEdge)
        } else {
            axios.post("/check-dependency-froms-cycle", state.depdencyChanges).then(r => {
                if (r.data.result === false) {
                    cyEdge.addClass("user-generated-candidate")
                } else {
                    showCycleErrorAlert()
                    state.depdencyChanges.pop()
                    cy.remove(cyEdge)
                }

            })
        }
    })
}

function handleDependencyUpdate() {
    cy.elements().remove()
    updateGraphView()
}

function handleDeleteDependency(evt, payload) {
    const node1 = payload.currentlyViewedNodeID
    const node2 = payload.clickedNodeID

    console.log(node1, node2)
    let selector = `edge[source="${node1}"][target="${node2}"]`
    let edge = cy.elements(selector)
    let delete_change = null

    if (edge.length === 0) {
        selector = `edge[source="${node2}"][target="${node1}"]`
        edge = cy.elements(selector)
        delete_change = {
            "id": edge.id(),
            "source": node2,
            "target": node1,
            "user-removed": true
        }
    } else {
        delete_change = {
            "id": edge.id(),
            "source": node1,
            "target": node2,
            "user-removed": true
        }
    }
    cy.remove("#" + edge.id())
    state.depdencyChanges.push(delete_change)
}

$("#layout-graph-btn").on("click", function (event) {
    cy.layout(layoutOpts).run()
})

cytoscapeContainer.on("addEntityClicked", handleAddEntityClicked)
cytoscapeContainer.on("addEntityButtonClicked", handleAddEntityButtonClicked)
cytoscapeContainer.on("entityHoverEnter", handleEntityHoverEnter)
cytoscapeContainer.on("entityHoverLeave", handleEntityHoverLeave)
cytoscapeContainer.on("nodeClicked", handleNodeClicked)
cytoscapeContainer.on("dependenciesUpdated", handleDependencyUpdate)
cytoscapeContainer.on("deleteDependency", handleDeleteDependency)

socket.on("graph-update-event", () => {
    console.log("Handle graph update event")
    handleDependencyUpdate()
})

$('#reduceGraphChecked').on("click", function () {
    state.showReducedGraph = $(this).prop('checked');
    if (state.showReducedGraph) {
        $('#reduceTransitives').prop("disabled", false);
        $('#hideNodes').prop("disabled", false);
    } else {
        $('#reduceTransitives').prop("disabled", true);
        $('#hideNodes').prop("disabled", true);
    }
    handleDependencyUpdate()
})

export {setupCytoscape, cytoscapeContainer}
