import $ from "jquery";
import {state} from "../state";

$('#reduceTransitives').on("click", function () {
    state.reduceTransitives = $(this).prop('checked');
    localStorage.setItem("reduceTransitives",String($(this).prop('checked')))
    // handleDependencyUpdate()
    console.info("state:", state)

})

$('#hideNodes').on("click", function () {
    state.hideNodes = $(this).prop('checked');
    localStorage.setItem("hideNodes",String($(this).prop('checked')))

    // handleDependencyUpdate()
    console.info("state:", state)

})

$('#splitAgents').on("click", function () {
    state.splitAgents = $(this).prop('checked');
    localStorage.setItem("splitAgents",String($(this).prop('checked')))

    // handleDependencyUpdate()
    console.info("state:", state)
})

$(document).ready(function (){
    console.info(state)
    $('#splitAgents').prop('checked',localStorage.getItem("splitAgents") == "true")
    $('#hideNodes').prop('checked',localStorage.getItem("hideNodes") == "true")
    $('#reduceTransitives').prop('checked',localStorage.getItem("reduceTransitives") == "true")
})