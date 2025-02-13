var layoutOpts = {name: 'dagre', rankDir: "RL"}
var styleOpts = [
    {
        selector: 'node',
        style: {
            'font-size': 14,
            'text-halign': 'center',
            'text-valign': 'center',
            'text-wrap': 'wrap',
            "background-color": "lightgray",
            'label': 'data(name)',
            'width': function (ele) {
                return ele.data().name.length * 8
            }
        }
    },
    {
        selector: "node.is-clicked",
        style: {
            'border-width': 4,
            'border-color': "Navy"
        }
    },
    {
        selector: 'node:selected',
        style: {
            'background-color': "AliceBlue",
        }
    },
    {
        selector: 'node.item-highlight',
        style: {
            'border-width': 4,
            'border-color': "green"

        }
    },
    {
        selector: 'node[type="Entity"]',
        style: {
            'shape': 'round-rectangle',
        }
    },
    {
        selector: 'node[type="Activity"]',
        style: {
            'shape': 'rectangle',
        }
    },
    {
        selector: 'node[type="Agent"]',
        style: {
            "shape" :"diamond",
            'background-color': "pink",
            'height':14*4,
            'width': function (ele) {
                return ele.data().name.length * 10
            }
        }
    },
    {
        selector: 'node[?hidden]',
        style: {
            'opacity': 0.4,
            'background-fill':'linear-gradient',
            'background-gradient-stop-colors':'green grey'
        }
    },
    {
        selector: 'edge',
        style: {
            'curve-style': 'bezier',
            'target-arrow-shape': 'triangle',
            'target-arrow-color': 'black',
            'line-color': 'black',
            'width': 3
        }
    },
    {
        selector: 'edge[?user-generated]',
        style: {
            'line-color': "green",
            'target-arrow-color': 'green',
            'width':6

        }
    },
    {
        selector: "edge.user-generated-candidate",
        style: {
            'line-color': "green",
            'target-arrow-color': 'green',
            "line-style": "dashed"

        }
    },
    {
        selector: "edge.user-removed-candidate",
        style: {
            'line-color': "red",
            'target-arrow-color': 'red',
            "line-style": "dashed"

        }
    },
]

export {layoutOpts, styleOpts};
