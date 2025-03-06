"use client"

import type React from "react"

import { useCallback, useRef, useState } from "react"
import ReactFlow, {
  Background,
  Controls,
  type Edge,
  type Node,
  type NodeTypes,
  type EdgeTypes,
  type Connection,
  useNodesState,
  useEdgesState,
  addEdge,
  MarkerType,
  useReactFlow,
  ReactFlowProvider,
  Panel,
} from "reactflow"
import "reactflow/dist/style.css"
import { toPng } from "html-to-image"

import StartEndNode from "./nodes/start-end-node"
import ProcessNode from "./nodes/process-node"
import InputOutputNode from "./nodes/input-output-node"
import SelectionNode from "./nodes/selection-node"
import IterationNode from "./nodes/iteration-node"
import CustomEdge from "./edges/custom-edge"
import { Download } from "lucide-react"

// Define node types
const nodeTypes: NodeTypes = {
  startEnd: StartEndNode,
  process: ProcessNode,
  inputOutput: InputOutputNode,
  selection: SelectionNode,
  iteration: IterationNode,
}

// Define edge types
const edgeTypes: EdgeTypes = {
  custom: CustomEdge,
}

// Initial nodes
const initialNodes: Node[] = [
  {
    id: "start",
    type: "startEnd",
    position: { x: 250, y: 50 },
    data: { label: "Start" },
  },
]

const FlowchartTeachingTool = () => {
  const reactFlowWrapper = useRef<HTMLDivElement>(null)
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState([])
  const [reactFlowInstance, setReactFlowInstance] = useState<any>(null)
  const { project } = useReactFlow()

  // Handle connections between nodes
  const onConnect = useCallback(
    (params: Connection) => {
      // Create a custom edge with the custom type
      const newEdge: Edge = {
        ...params,
        type: "custom",
        markerEnd: {
          type: MarkerType.ArrowClosed,
        },
      }
      setEdges((eds) => addEdge(newEdge, eds))
    },
    [setEdges],
  )

  // Handle drag over event
  const onDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    event.dataTransfer.dropEffect = "move"
  }, [])

  // Generate a unique ID
  const getId = () => `node_${Math.random().toString(36).substr(2, 9)}`

  // Handle drop event
  const onDrop = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault()

      const type = event.dataTransfer.getData("application/reactflow/type")

      if (!type || !reactFlowInstance || !reactFlowWrapper.current) {
        return
      }

      const position = reactFlowInstance.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      })

      // Check if dropped on an edge
      const droppedOnEdge = edges.find((edge) => {
        // This is a simplified check - in a real app, you'd need a more sophisticated algorithm
        // to determine if the drop position is on an edge
        const edgeCenter = reactFlowInstance.getEdgeCenter(edge)
        const dx = position.x - edgeCenter.x
        const dy = position.y - edgeCenter.y
        const distance = Math.sqrt(dx * dx + dy * dy)
        return distance < 50 // Arbitrary threshold
      })

      let newNode: Node
      const nodeId = getId()

      // Create the new node based on type
      switch (type) {
        case "startEnd":
          newNode = {
            id: nodeId,
            type,
            position,
            data: { label: "End" },
          }
          break
        case "process":
          newNode = {
            id: nodeId,
            type,
            position,
            data: { label: "Process" },
          }
          break
        case "inputOutput":
          newNode = {
            id: nodeId,
            type,
            position,
            data: { label: "Input/Output" },
          }
          break
        case "selection":
          newNode = {
            id: nodeId,
            type,
            position,
            data: { label: "Decision" },
          }
          break
        case "iteration":
          newNode = {
            id: nodeId,
            type,
            position,
            data: { label: "Loop" },
          }
          break
        default:
          return
      }

      setNodes((nds) => [...nds, newNode])

      // If dropped on an edge, create new connections
      if (droppedOnEdge) {
        const { source, target, id: edgeId } = droppedOnEdge

        // Remove the original edge
        setEdges((eds) => eds.filter((e) => e.id !== edgeId))

        // Create new edges
        if (type === "selection") {
          // For selection nodes, create true and false branches
          const trueNodeId = getId()
          const falseNodeId = getId()
          const joinNodeId = getId()

          // Create true branch node
          const trueNode: Node = {
            id: trueNodeId,
            type: "process",
            position: { x: position.x - 100, y: position.y + 100 },
            data: { label: "True Branch" },
          }

          // Create false branch node
          const falseNode: Node = {
            id: falseNodeId,
            type: "process",
            position: { x: position.x + 100, y: position.y + 100 },
            data: { label: "False Branch" },
          }

          // Create join node
          const joinNode: Node = {
            id: joinNodeId,
            type: "process",
            position: { x: position.x, y: position.y + 200 },
            data: { label: "Join" },
          }

          // Add the new nodes
          setNodes((nds) => [...nds, newNode, trueNode, falseNode, joinNode])

          // Add the new edges
          const newEdges: Edge[] = [
            {
              id: `${source}-${nodeId}`,
              source,
              target: nodeId,
              type: "custom",
              markerEnd: { type: MarkerType.ArrowClosed },
            },
            {
              id: `${nodeId}-${trueNodeId}`,
              source: nodeId,
              target: trueNodeId,
              type: "custom",
              markerEnd: { type: MarkerType.ArrowClosed },
              label: "True",
            },
            {
              id: `${nodeId}-${falseNodeId}`,
              source: nodeId,
              target: falseNodeId,
              type: "custom",
              markerEnd: { type: MarkerType.ArrowClosed },
              label: "False",
            },
            {
              id: `${trueNodeId}-${joinNodeId}`,
              source: trueNodeId,
              target: joinNodeId,
              type: "custom",
              markerEnd: { type: MarkerType.ArrowClosed },
            },
            {
              id: `${falseNodeId}-${joinNodeId}`,
              source: falseNodeId,
              target: joinNodeId,
              type: "custom",
              markerEnd: { type: MarkerType.ArrowClosed },
            },
            {
              id: `${joinNodeId}-${target}`,
              source: joinNodeId,
              target,
              type: "custom",
              markerEnd: { type: MarkerType.ArrowClosed },
            },
          ]

          setEdges((eds) => [...eds, ...newEdges])
        } else if (type === "iteration") {
          // For iteration nodes, create loop body and exit path
          const loopBodyId = getId()

          // Create loop body node
          const loopBodyNode: Node = {
            id: loopBodyId,
            type: "process",
            position: { x: position.x, y: position.y + 100 },
            data: { label: "Loop Body" },
          }

          // Add the new nodes
          setNodes((nds) => [...nds, newNode, loopBodyNode])

          // Add the new edges
          const newEdges: Edge[] = [
            {
              id: `${source}-${nodeId}`,
              source,
              target: nodeId,
              type: "custom",
              markerEnd: { type: MarkerType.ArrowClosed },
            },
            {
              id: `${nodeId}-${loopBodyId}`,
              source: nodeId,
              target: loopBodyId,
              type: "custom",
              markerEnd: { type: MarkerType.ArrowClosed },
              label: "True",
            },
            {
              id: `${loopBodyId}-${nodeId}`,
              source: loopBodyId,
              target: nodeId,
              type: "custom",
              markerEnd: { type: MarkerType.ArrowClosed },
            },
            {
              id: `${nodeId}-${target}`,
              source: nodeId,
              target,
              type: "custom",
              markerEnd: { type: MarkerType.ArrowClosed },
              label: "False",
            },
          ]

          setEdges((eds) => [...eds, ...newEdges])
        } else {
          // For regular nodes, just insert them in the flow
          const newEdges: Edge[] = [
            {
              id: `${source}-${nodeId}`,
              source,
              target: nodeId,
              type: "custom",
              markerEnd: { type: MarkerType.ArrowClosed },
            },
            {
              id: `${nodeId}-${target}`,
              source: nodeId,
              target,
              type: "custom",
              markerEnd: { type: MarkerType.ArrowClosed },
            },
          ]

          setEdges((eds) => [...eds, ...newEdges])
        }
      }
    },
    [reactFlowInstance, edges, setNodes, setEdges],
  )

  // Handle key down event for deleting nodes
  const onKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (event.key === "Delete" || event.key === "Backspace") {
        const selectedNodes = nodes.filter((node) => node.selected)

        if (selectedNodes.length > 0) {
          // Get the connections for each selected node
          const nodesToDelete = new Set(selectedNodes.map((node) => node.id))

          // Find edges connected to the nodes to delete
          const edgesToDelete = edges.filter((edge) => nodesToDelete.has(edge.source) || nodesToDelete.has(edge.target))

          // Create a map of incoming and outgoing connections
          const incomingConnections = new Map<string, string[]>()
          const outgoingConnections = new Map<string, string[]>()

          edges.forEach((edge) => {
            if (!outgoingConnections.has(edge.source)) {
              outgoingConnections.set(edge.source, [])
            }
            outgoingConnections.get(edge.source)?.push(edge.target)

            if (!incomingConnections.has(edge.target)) {
              incomingConnections.set(edge.target, [])
            }
            incomingConnections.get(edge.target)?.push(edge.source)
          })

          // Remove the selected nodes
          setNodes((nds) => nds.filter((node) => !nodesToDelete.has(node.id)))

          // Remove the edges connected to the deleted nodes
          setEdges((eds) => eds.filter((edge) => !nodesToDelete.has(edge.source) && !nodesToDelete.has(edge.target)))

          // Try to reconnect the flow
          selectedNodes.forEach((node) => {
            const incoming = incomingConnections.get(node.id) || []
            const outgoing = outgoingConnections.get(node.id) || []

            // Connect incoming nodes to outgoing nodes
            incoming.forEach((source) => {
              if (!nodesToDelete.has(source)) {
                outgoing.forEach((target) => {
                  if (!nodesToDelete.has(target)) {
                    const newEdge: Edge = {
                      id: `${source}-${target}`,
                      source,
                      target,
                      type: "custom",
                      markerEnd: { type: MarkerType.ArrowClosed },
                    }
                    setEdges((eds) => [...eds, newEdge])
                  }
                })
              }
            })
          })
        }
      }
    },
    [nodes, edges, setNodes, setEdges],
  )

  // Export flowchart as image
  const exportToImage = () => {
    if (reactFlowWrapper.current) {
      const flowElement = document.querySelector(".react-flow") as HTMLElement

      if (flowElement) {
        toPng(flowElement, {
          backgroundColor: "#fff",
          width: flowElement.offsetWidth,
          height: flowElement.offsetHeight,
        })
          .then((dataUrl) => {
            const link = document.createElement("a")
            link.download = "flowchart.png"
            link.href = dataUrl
            link.click()
          })
          .catch((error) => {
            console.error("Error exporting flowchart:", error)
          })
      }
    }
  }

  return (
    <div className="w-full h-full" ref={reactFlowWrapper} onKeyDown={onKeyDown} tabIndex={0}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onInit={setReactFlowInstance}
        onDrop={onDrop}
        onDragOver={onDragOver}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
      >
        <Background />
        <Controls />
        <Panel position="top-right">
          <div className="flex gap-2">
            <button
              onClick={exportToImage}
              className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-md"
            >
              <Download size={16} />
              Export
            </button>
          </div>
        </Panel>
        <Panel position="top-left">
          <div className="flex flex-col gap-2 bg-white p-4 rounded-md shadow-md">
            <h3 className="font-bold mb-2">Flowchart Shapes</h3>
            <div className="flex flex-col gap-2">
              <div
                className="border border-gray-300 rounded-md p-2 cursor-move bg-white"
                draggable
                onDragStart={(event) => {
                  event.dataTransfer.setData("application/reactflow/type", "startEnd")
                }}
              >
                Start/End
              </div>
              <div
                className="border border-gray-300 rounded-md p-2 cursor-move bg-white"
                draggable
                onDragStart={(event) => {
                  event.dataTransfer.setData("application/reactflow/type", "process")
                }}
              >
                Process
              </div>
              <div
                className="border border-gray-300 rounded-md p-2 cursor-move bg-white"
                draggable
                onDragStart={(event) => {
                  event.dataTransfer.setData("application/reactflow/type", "inputOutput")
                }}
              >
                Input/Output
              </div>
              <div
                className="border border-gray-300 rounded-md p-2 cursor-move bg-white"
                draggable
                onDragStart={(event) => {
                  event.dataTransfer.setData("application/reactflow/type", "selection")
                }}
              >
                Selection (If/Else)
              </div>
              <div
                className="border border-gray-300 rounded-md p-2 cursor-move bg-white"
                draggable
                onDragStart={(event) => {
                  event.dataTransfer.setData("application/reactflow/type", "iteration")
                }}
              >
                Iteration (Loop)
              </div>
            </div>
            <div className="mt-4 text-sm text-gray-600">
              <p>Drag shapes onto the canvas</p>
              <p>Press Delete to remove nodes</p>
              <p>Drop shapes on connections to insert</p>
            </div>
          </div>
        </Panel>
      </ReactFlow>
    </div>
  )
}

// Wrap with ReactFlowProvider
export default function FlowchartTeachingToolWithProvider() {
  return (
    <ReactFlowProvider>
      <FlowchartTeachingTool />
    </ReactFlowProvider>
  )
}

