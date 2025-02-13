import $ from "jquery";
import {cytoscapeContainer} from "../graphview/graphview";

function buildFormContainer() {
    let formLineContainer = $("<div>")
    formLineContainer.addClass("mb-3")
    return formLineContainer
}

function buildFormLineLabel(label) {
    let formLineLabel = $("<label>")
    formLineLabel.addClass("form-label")
    formLineLabel.text(label)
    formLineLabel.attr("for", label)
    return formLineLabel
}

function buildFormLineInput(id, value, editable) {
    let formLineInput = $("<input>")
    formLineInput.attr("id", id)
    formLineInput.val(value)
    formLineInput.prop("disabled", true)
    formLineInput.prop("type", "text")
    formLineInput.prop("name", id)
    formLineInput.addClass("form-control")
    formLineInput.attr("data-editable", editable)
    return formLineInput
}


function buildFormCheckboxInput(id, checked) {
    let formCheckbox = $("<input>")
    formCheckbox.attr("id", id)
    formCheckbox.attr("role", "switch")
    formCheckbox.attr("type", "checkbox")
    formCheckbox.attr("checked", checked)
    formCheckbox.addClass("form-check-input")
    return formCheckbox
}

function buildFormInputLine(label, value, editable = false) {
    const container = buildFormContainer()
    const formLineLabel = buildFormLineLabel(label)
    const formLineInput = buildFormLineInput(label, value, editable)
    container.append(formLineLabel)
    container.append(formLineInput)
    return container;
}

function buildFormCheckbox(label, checked = false) {
    const container = buildFormContainer()
    const formLineLabel = buildFormLineLabel(label)
    const formLineInput = buildFormCheckboxInput(label, checked)
    container.append(formLineLabel)
    container.append(formLineInput)
    return [container,formLineInput];
}

function buildAddEntityButton(id, target) {
    const button = $("<button>")
    button.addClass("form-control btn btn-primary")
    button.attr("id", id)
    button.attr("data-editable", true)
    button.html("<span class=\"bi bi-plus\"></span>")
    button.prop("disabled", true)
    button.attr("data-target", target)
    return button
}

function buildEntityButton(entityName, entityUUID) {
    const button = $("<button>")
    button.addClass("list-group-item btn ")
    button.attr("data-node_id", entityUUID)
    button.text(entityName)
    button.on("click", function (evt) {
        evt.preventDefault()
    })
    return button
}


function buildEntityListContainer() {
    const entityListContainer = $("<div>")
    entityListContainer.addClass("list-group")
    return entityListContainer
}


function buildEntityList(label, nodeData) {
    const lookupKey = (label === "Generation") ? "generated_entities" : "used_entities";
    const buttonId = `add-${label.toLowerCase()}-btn`
    const formContainer = buildFormContainer();
    const entityListContainer = buildEntityListContainer()
    const formLabel = buildFormLineLabel(label)

    const addButton = buildAddEntityButton(buttonId, lookupKey)
    entityListContainer.append(addButton)
    for (let entity of nodeData[lookupKey]) {
        const entityButton = buildEntityButton(entity["name"], entity["id"])
        if (nodeData["user_generated_edges"].includes(entity["id"])) {
            entityButton.attr("data-deleteable", true)
        }
        entityButton.hover(mouseEnterEntityButton, mouseLeaveEntityButton)
        entityListContainer.append(entityButton)
    }
    formContainer.append(formLabel, entityListContainer)

    return [formContainer, addButton]
}

function mouseEnterEntityButton() {
    const nodeID = $(this).data("node_id")
    const payload = {id: nodeID}
    cytoscapeContainer.trigger("entityHoverEnter", payload);
}

function mouseLeaveEntityButton() {
    const nodeID = $(this).data("node_id")
    const payload = {id: nodeID}
    cytoscapeContainer.trigger("entityHoverLeave", payload);
}

export {buildFormInputLine, buildEntityList,buildFormCheckbox}
