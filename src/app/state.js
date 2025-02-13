import {GraphViewMode, NodeAttributesMode} from "./enums";
import {io} from "socket.io-client";

export const state = {
    graphViewMode: GraphViewMode.EXPLORING,
    selectDependencyMode: null,
    nodeAttributesMode: NodeAttributesMode.VIEWING,
    entityTypeMode: null,
    depdencyChanges: [],
    showReducedGraph: true,
    hideNodes: localStorage.getItem("hideNodes") == "true",
    reduceTransitives: localStorage.getItem("reduceTransitives") == "true",
    splitAgents: localStorage.getItem("splitAgents") == "true",
}

export const socket = io("localhost:5000");
