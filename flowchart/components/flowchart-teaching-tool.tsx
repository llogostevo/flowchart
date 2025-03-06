"use client"

import type React from "react"

import { useState, useRef, useCallback, useEffect } from "react"
import ReactFlow, {
  ReactFlowProvider,
  Background,
  Controls,
  type Connection,
  type Edge,
  type Node,
  addEdge,
  useNodesState,
  useEdgesState,
  type NodeTypes,
  Panel,
  useKeyPress,
  type EdgeTypes,
} from "reactflow"
import "reactflow/dist/style.css"
import { toPng } from "html-to-image"

import StartEndNode from "./nodes/start-end-node"
import ProcessNode from "./nodes/process-node"
import InputOutputNode from "./nodes/input-output-node"
import SelectionNode from "./nodes/selection-node"
import IterationNode from "./nodes/iteration-node"
import CustomEdge from "./edges/custom-edge"

const nodeTypes: NodeTypes = {
  startEnd: StartEndNode,
  process: ProcessNode,
  inputOutput: InputOutputNode,
  selection: SelectionNode,
  iteration: IterationNode,
}

const edgeTypes: EdgeTypes = {
  custom: CustomEdge,
}

const initialNodes: Node[] = [
  {
    id: "start",
    type: "startEnd",
    data: { label: "Start" },
    position: { x: 250, y: 50 },
  },
  {
    id: "end-placeholder",
    type: "startEnd",
    data: { label: "End", isPlaceholder: true },
    position: { x: 250, y: 200 },
    style: { opacity: 0.5 },
  },
]

const initialEdges: Edge[] = [
  {
    id: "e-start-end",
    source: "start",
    target: "end-placeholder",
    type: "custom",
    data: { edgeId: "e-start-end" },
  },
]

export default function FlowchartTeachingTool() {
  const reactFlowWrapper = useRef<HTMLDivElement>(null)
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges)
  const [reactFlowInstance, setReactFlowInstance] = useState<any>(null)
  const [selectedNode, setSelectedNode] = useState<string | null>(null)
  const [selectedEdge, setSelectedEdge] = useState<string | null>(null)

  const deletePressed = useKeyPress("Delete")
  const backspacePressed = useKeyPress("Backspace")

  // Handle node deletion with keyboard
  useEffect(() => {
    if ((deletePressed || backspacePressed) && selectedNode) {
      deleteNode(selectedNode)
    }
  }, [deletePressed, backspacePressed, selectedNode])

  const onConnect = useCallback(
    (params: Connection) => {
      // Create a custom edge with a unique ID
      const newEdge: Edge = {
        ...params,
        id: `e${params.source}-${params.target}-${Date.now()}`,
        type: "custom",
        data: { edgeId: `e${params.source}-${params.target}-${Date.now()}` },
      }
      setEdges((eds) => addEdge(newEdge, eds))
    },
    [setEdges],
  )

  const onDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    event.dataTransfer.dropEffect = "move"
  }, [])

  const onDrop = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault()

      const type = event.dataTransfer.getData("application/reactflow")
      const label = event.dataTransfer.getData("application/reactflow-label")

      if (typeof type === "undefined" || !type) {
        return
      }

      const position = reactFlowInstance.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      })

      // Check if we're dropping on an edge
      const droppedOnEdge = isPointOnEdge(position, edges, nodes, reactFlowInstance)

      const newNodeId = `${type}-${Date.now()}`
      const newNode: Node = {
        id: newNodeId,
        type,
        position,
        data: { label, onDelete: () => deleteNode(newNodeId) },
      }

      if (droppedOnEdge) {
        // Insert node into the edge
        insertNodeIntoEdge(newNode, droppedOnEdge)
      } else {
        // Only if not dropped on an edge, use the last node logic
        const lastNodeId = findLastNodeInFlow(nodes, edges)

        setNodes((nds) => nds.concat(newNode))

        if (lastNodeId) {
          if (type === "selection") {
            // For selection nodes, create a single edge to the top
            const newEdge: Edge = {
              id: `e${lastNodeId}-${newNodeId}-${Date.now()}`,
              source: lastNodeId,
              target: newNodeId,
              sourceHandle: null,
              targetHandle: "top",
              type: "custom",
              data: { edgeId: `e${lastNodeId}-${newNodeId}-${Date.now()}` },
            }

            // Create the two branch edges
            const leftBranchEdge: Edge = {
              id: `e${newNodeId}-left-${Date.now()}`,
              source: newNodeId,
              target: `${newNodeId}-left-placeholder`,
              sourceHandle: "left",
              type: "custom",
              data: {
                edgeId: `e${newNodeId}-left-${Date.now()}`,
                label: "False",
              },
            }

            const rightBranchEdge: Edge = {
              id: `e${newNodeId}-right-${Date.now()}`,
              source: newNodeId,
              target: `${newNodeId}-right-placeholder`,
              sourceHandle: "right",
              type: "custom",
              data: {
                edgeId: `e${newNodeId}-right-${Date.now()}`,
                label: "True",
              },
            }

            // Create a placeholder for what comes after the branches
            const afterBranchPlaceholder: Node = {
              id: `${newNodeId}-next-placeholder`,
              type: "process",
              position: {
                x: position.x,
                y: position.y + 200,
              },
              data: {
                label: "Drag shape here",
                isPlaceholder: true,
                onDelete: () => deleteNode(`${newNodeId}-next-placeholder`),
              },
              style: { opacity: 0.5 },
            }

            // Create edges from placeholders to the next placeholder
            const leftToNextEdge: Edge = {
              id: `e${newNodeId}-left-next-${Date.now()}`,
              source: `${newNodeId}-left-placeholder`,
              target: `${newNodeId}-next-placeholder`,
              type: "custom",
              data: { edgeId: `e${newNodeId}-left-next-${Date.now()}` },
            }

            const rightToNextEdge: Edge = {
              id: `e${newNodeId}-right-next-${Date.now()}`,
              source: `${newNodeId}-right-placeholder`,
              target: `${newNodeId}-next-placeholder`,
              type: "custom",
              data: { edgeId: `e${newNodeId}-right-next-${Date.now()}` },
            }

            setEdges((eds) =>
              eds.concat([newEdge, leftBranchEdge, rightBranchEdge, leftToNextEdge, rightToNextEdge]),
            )

            // Create placeholder nodes for the branches
            const leftPlaceholder: Node = {
              id: `${newNodeId}-left-placeholder`,
              type: "process",
              position: {
                x: position.x - 150,
                y: position.y + 100,
              },
              data: {
                label: "Drag shape here",
                isPlaceholder: true,
                onDelete: () => deleteNode(`${newNodeId}-left-placeholder`),
              },
              style: { opacity: 0.5 },
            }

            const rightPlaceholder: Node = {
              id: `${newNodeId}-right-placeholder`,
              type: "process",
              position: {
                x: position.x + 150,
                y: position.y + 100,
              },
              data: {
                label: "Drag shape here",
                isPlaceholder: true,
                onDelete: () => deleteNode(`${newNodeId}-right-placeholder`),
              },
              style: { opacity: 0.5 },
            }

            setNodes((nds) => nds.concat([leftPlaceholder, rightPlaceholder, afterBranchPlaceholder]))
          } else if (type === "iteration") {
            // For iteration nodes, create a single edge to the top
            const newEdge: Edge = {
              id: `e${lastNodeId}-${newNodeId}-${Date.now()}`,
              source: lastNodeId,
              target: newNodeId,
              sourceHandle: null,
              targetHandle: "top",
              type: "custom",
              data: { edgeId: `e${lastNodeId}-${newNodeId}-${Date.now()}` },
            }

            // Create the loop body placeholder
            const loopBodyPlaceholder: Node = {
              id: `${newNodeId}-loop-body`,
              type: "process",
              position: {
                x: position.x + 150,
                y: position.y + 50,
              },
              data: {
                label: "Loop Body",
                isPlaceholder: true,
                onDelete: () => deleteNode(`${newNodeId}-loop-body`),
              },
              style: { opacity: 0.5 },
            }

            // Create the loop edge from diamond to loop body
            const loopEdge: Edge = {
              id: `e${newNodeId}-loop-${Date.now()}`,
              source: newNodeId,
              target: `${newNodeId}-loop-body`,
              sourceHandle: "right",
              type: "custom",
              animated: true,
              data: {
                edgeId: `e${newNodeId}-loop-${Date.now()}`,
                label: "Loop",
              },
            }

            // Create the loop back edge from loop body to diamond
            const loopBackEdge: Edge = {
              id: `e${newNodeId}-loop-back-${Date.now()}`,
              source: `${newNodeId}-loop-body`,
              target: newNodeId,
              targetHandle: "top",
              type: "custom",
              animated: true,
              data: {
                edgeId: `e${newNodeId}-loop-back-${Date.now()}`,
                label: "Repeat",
              },
            }

            // Create the continue placeholder
            const continuePlaceholder: Node = {
              id: `${newNodeId}-continue-placeholder`,
              type: "process",
              position: {
                x: position.x,
                y: position.y + 150,
              },
              data: {
                label: "Drag shape here",
                isPlaceholder: true,
                onDelete: () => deleteNode(`${newNodeId}-continue-placeholder`),
              },
              style: { opacity: 0.5 },
            }

            // Create the continue edge
            const continueEdge: Edge = {
              id: `e${newNodeId}-continue-${Date.now()}`,
              source: newNodeId,
              target: `${newNodeId}-continue-placeholder`,
              sourceHandle: "bottom",
              type: "custom",
              data: {
                edgeId: `e${newNodeId}-continue-${Date.now()}`,
                label: "Exit",
              },
            }

            setEdges((eds) => eds.concat([newEdge, loopEdge, loopBackEdge, continueEdge]))

            setNodes((nds) => nds.concat([loopBodyPlaceholder, continuePlaceholder]))
          } else {
            // For other nodes, create a single edge
            const newEdge: Edge = {
              id: `e${lastNodeId}-${newNodeId}-${Date.now()}`,
              source: lastNodeId,
              target: newNodeId,
              sourceHandle: null,
              targetHandle: null,
              type: "custom",
              data: { edgeId: `e${lastNodeId}-${newNodeId}-${Date.now()}` },
            }

            // Create a placeholder node for the next shape
            const nextPlaceholder: Node = {
              id: `${newNodeId}-next-placeholder`,
              type: "process",
              position: {
                x: position.x,
                y: position.y + 100,
              },
              data: {
                label: "Drag shape here",
                isPlaceholder: true,
                onDelete: () => deleteNode(`${newNodeId}-next-placeholder`),
              },
              style: { opacity: 0.5 },
            }

            const nextEdge: Edge = {
              id: `e${newNodeId}-next-${Date.now()}`,
              source: newNodeId,
              target: `${newNodeId}-next-placeholder`,
              sourceHandle: null,
              targetHandle: null,
              type: "custom",
              data: { edgeId: `e${newNodeId}-next-${Date.now()}` },
            }

            setEdges((eds) => eds.concat([newEdge, nextEdge]))
            setNodes((nds) => nds.concat([nextPlaceholder]))
          }
        } else {
          // If there's no last node, this is the first node
          // Create an end node placeholder
          const endPlaceholder: Node = {
            id: `end-placeholder`,
            type: "startEnd",
            position: {
              x: position.x,
              y: position.y + 150,
            },
            data: {
              label: "End",
              isPlaceholder: true,
              onDelete: () => deleteNode(`end-placeholder`),
            },
            style: { opacity: 0.5 },
          }

          const endEdge: Edge = {
            id: `e${newNodeId}-end-${Date.now()}`,
            source: newNodeId,
            target: `end-placeholder`,
            sourceHandle: null,
            targetHandle: null,
            type: "custom",
            data: { edgeId: `e${newNodeId}-end-${Date.now()}` },
          }

          setEdges((eds) => eds.concat([endEdge]))
          setNodes((nds) => nds.concat([endPlaceholder]))
        }
      }
    },
    [reactFlowInstance, nodes, edges, setNodes, setEdges],
  )

  // Function to check if a point is on an edge
  const isPointOnEdge = (point: { x: number; y: number }, edges: Edge[], nodes: Node[], instance: any): Edge | null => {
    // Improved edge detection with better tolerance
    for (const edge of edges) {
      const sourceNode = nodes.find((node) => node.id === edge.source)
      const targetNode = nodes.find((node) => node.id === edge.target)

      if (!sourceNode || !targetNode) continue

      // Get source and target positions (center of nodes)
      const sourcePos = {
        x: sourceNode.position.x + (sourceNode.width || 120) / 2,
        y: sourceNode.position.y + (sourceNode.height || 60) / 2,
      }

      const targetPos = {
        x: targetNode.position.x + (targetNode.width || 120) / 2,
        y: targetNode.position.y + (targetNode.height || 60) / 2,
      }

      // Calculate distance from point to line segment
      const distance = distanceToLineSegment(sourcePos.x, sourcePos.y, targetPos.x, targetPos.y, point.x, point.y)

      // If distance is less than threshold, consider it a hit
      if (distance < 30) {
        return edge
      }
    }

    return null
  }

  // Helper function to calculate distance from point to line segment
  const distanceToLineSegment = (
    x1: number,
    y1: number, // Line start
    x2: number,
    y2: number, // Line end
    x0: number,
    y0: number, // Point
  ): number => {
    // Calculate squared length of line segment
    const l2 = (x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1)

    // If line segment is a point, return distance to that point
    if (l2 === 0) return Math.sqrt((x0 - x1) * (x0 - x1) + (y0 - y1) * (y0 - y1))

    // Calculate projection of point onto line segment
    const t = Math.max(0, Math.min(1, ((x0 - x1) * (x2 - x1) + (y0 - y1) * (y2 - y1)) / l2))

    // Calculate closest point on line segment
    const projX = x1 + t * (x2 - x1)
    const projY = y1 + t * (y2 - y1)

    // Return distance to closest point
    return Math.sqrt((x0 - projX) * (x0 - projX) + (y0 - projY) * (y0 - projY))
  }

  // Function to insert a node into an edge
  const insertNodeIntoEdge = (node: Node, edge: Edge) => {
    // Find source and target nodes
    const sourceNode = nodes.find((n) => n.id === edge.source)
    const targetNode = nodes.find((n) => n.id === edge.target)

    if (!sourceNode || !targetNode) return

    // Position the node on the line between source and target
    const updatedNode = {
      ...node,
      position: {
        x: (sourceNode.position.x + targetNode.position.x) / 2 - 60,
        y: (sourceNode.position.y + targetNode.position.y) / 2 - 30,
      },
    }

    // Handle selection nodes specially
    if (node.type === "selection") {
      // Add the selection node
      setNodes((nds) => nds.concat(updatedNode))

      // Create the two branch edges with placeholders
      const leftPlaceholderId = `${node.id}-left-placeholder`
      const rightPlaceholderId = `${node.id}-right-placeholder`

      // Create left branch placeholder
      const leftPlaceholder: Node = {
        id: leftPlaceholderId,
        type: 'process',
        position: {
          x: updatedNode.position.x - 150,
          y: updatedNode.position.y + 100
        },
        data: {
          label: 'Drag shape here',
          isPlaceholder: true,
          onDelete: () => deleteNode(leftPlaceholderId)
        },
        style: { opacity: 0.5 }
      }

      // Create right branch placeholder
      const rightPlaceholder: Node = {
        id: rightPlaceholderId,
        type: 'process',
        position: {
          x: updatedNode.position.x + 150,
          y: updatedNode.position.y + 100
        },
        data: {
          label: 'Drag shape here',
          isPlaceholder: true,
          onDelete: () => deleteNode(rightPlaceholderId)
        },
        style: { opacity: 0.5 }
      }

      // Create edge from source to selection node
      const sourceToSelectionEdge: Edge = {
        id: `e${edge.source}-${node.id}-${Date.now()}`,
        source: edge.source,
        target: node.id,
        sourceHandle: edge.sourceHandle,
        targetHandle: "top",
        type: 'custom',
        data: { edgeId: `e${edge.source}-${node.id}-${Date.now()}` }
      }

      // Create branch edges
      const leftBranchEdge: Edge = {
        id: `e${node.id}-left-${Date.now()}`,
        source: node.id,
        target: leftPlaceholderId,
        sourceHandle: "left",
        type: 'custom',
        data: {
          edgeId: `e${node.id}-left-${Date.now()}`,
          label: "False"
        }
      }

      const rightBranchEdge: Edge = {
        id: `e${node.id}-right-${Date.now()}`,
        source: node.id,
        target: rightPlaceholderId,
        sourceHandle: "right",
        type: 'custom',
        data: {
          edgeId: `e${node.id}-right-${Date.now()}`,
          label: "True"
        }
      }

      // Create edges from placeholders directly to target
      const leftToTargetEdge: Edge = {
        id: `e${leftPlaceholderId}-${edge.target}-${Date.now()}`,
        source: leftPlaceholderId,
        target: edge.target,
        targetHandle: edge.targetHandle,
        type: 'custom',
        data: { edgeId: `e${leftPlaceholderId}-${edge.target}-${Date.now()}` }
      }

      const rightToTargetEdge: Edge = {
        id: `e${rightPlaceholderId}-${edge.target}-${Date.now()}`,
        source: rightPlaceholderId,
        target: edge.target,
        targetHandle: edge.targetHandle,
        type: 'custom',
        data: { edgeId: `e${rightPlaceholderId}-${edge.target}-${Date.now()}` }
      }

      // Remove the old edge and add all new edges and nodes
      setEdges((eds) => eds
        .filter((e) => e.id !== edge.id)
        .concat([
          sourceToSelectionEdge,
          leftBranchEdge,
          rightBranchEdge,
          leftToTargetEdge,
          rightToTargetEdge
        ])
      )

      setNodes((nds) => nds.concat([leftPlaceholder, rightPlaceholder]))
    }
    // Handle iteration nodes specially
    else if (node.type === "iteration") {
      // Add the iteration node
      setNodes((nds) => nds.concat(updatedNode))

      // Create the loop body placeholder
      const loopBodyId = `${node.id}-loop-body`
      const loopBodyPlaceholder: Node = {
        id: loopBodyId,
        type: "process",
        position: {
          x: updatedNode.position.x + 150,
          y: updatedNode.position.y + 50,
        },
        data: {
          label: "Loop Body",
          isPlaceholder: true,
          onDelete: () => deleteNode(loopBodyId),
        },
        style: { opacity: 0.5 },
      }

      // Create edge from source to iteration node
      const sourceToIterationEdge: Edge = {
        id: `e${edge.source}-${node.id}-${Date.now()}`,
        source: edge.source,
        target: node.id,
        sourceHandle: edge.sourceHandle,
        targetHandle: "top",
        type: "custom",
        data: { edgeId: `e${edge.source}-${node.id}-${Date.now()}` },
      }

      // Create the loop edge from diamond to loop body
      const loopEdge: Edge = {
        id: `e${node.id}-loop-${Date.now()}`,
        source: node.id,
        target: loopBodyId,
        sourceHandle: "right",
        type: "custom",
        animated: true,
        data: {
          edgeId: `e${node.id}-loop-${Date.now()}`,
          label: "Loop",
        },
      }

      // Create the loop back edge from loop body to diamond
      const loopBackEdge: Edge = {
        id: `e${node.id}-loop-back-${Date.now()}`,
        source: loopBodyId,
        target: node.id,
        targetHandle: "top",
        type: "custom",
        animated: true,
        data: {
          edgeId: `e${node.id}-loop-back-${Date.now()}`,
          label: "Repeat",
        },
      }

      // Create edge from iteration to target (exit path)
      const iterationToTargetEdge: Edge = {
        id: `e${node.id}-${edge.target}-${Date.now()}`,
        source: node.id,
        target: edge.target,
        sourceHandle: "bottom",
        targetHandle: edge.targetHandle,
        type: "custom",
        data: {
          edgeId: `e${node.id}-${edge.target}-${Date.now()}`,
          label: "Exit",
        },
      }

      // Remove the old edge and add all new edges and nodes
      setEdges((eds) =>
        eds
          .filter((e) => e.id !== edge.id)
          .concat([sourceToIterationEdge, loopEdge, loopBackEdge, iterationToTargetEdge]),
      )

      setNodes((nds) => nds.concat([loopBodyPlaceholder]))
    }
    // For other nodes, handle normally
    else {
      // Add the new node
      setNodes((nds) => nds.concat(updatedNode))

      // Create two new edges
      const sourceToNewEdge: Edge = {
        id: `e${edge.source}-${node.id}-${Date.now()}`,
        source: edge.source,
        target: node.id,
        sourceHandle: edge.sourceHandle,
        targetHandle: "top",
        type: "custom",
        data: { edgeId: `e${edge.source}-${node.id}-${Date.now()}` },
      }

      const newToTargetEdge: Edge = {
        id: `e${node.id}-${edge.target}-${Date.now()}`,
        source: node.id,
        target: edge.target,
        sourceHandle: "bottom",
        targetHandle: edge.targetHandle,
        type: "custom",
        data: { edgeId: `e${node.id}-${edge.target}-${Date.now()}` },
      }

      // Remove the old edge and add the new ones
      setEdges((eds) => eds.filter((e) => e.id !== edge.id).concat([sourceToNewEdge, newToTargetEdge]))
    }
  }

  const findLastNodeInFlow = (nodes: Node[], edges: Edge[]): string | null => {
    if (nodes.length === 0) return null

    // Filter out placeholder nodes
    const realNodes = nodes.filter((node) => !node.data?.isPlaceholder)

    // Find nodes that are not sources of any edge (except loop edges)
    const sourceNodeIds = new Set<string>()
    edges.forEach((edge) => {
      // Don't count edges where source and target are the same (loop edges)
      if (edge.source !== edge.target) {
        sourceNodeIds.add(edge.source)
      }
    })

    // Find nodes that are targets but not sources (end nodes)
    const targetNodeIds = new Set(edges.map((edge) => edge.target))
    const endNodes = realNodes.filter((node) => !sourceNodeIds.has(node.id) && targetNodeIds.has(node.id))

    // If there are end nodes, return the first one
    if (endNodes.length > 0) {
      return endNodes[0].id
    }

    // If no end nodes, find nodes that are not targets of any edge
    const nonTargetNodes = realNodes.filter((node) => !targetNodeIds.has(node.id))

    // If there are non-target nodes, return the first one
    if (nonTargetNodes.length > 0) {
      return nonTargetNodes[0].id
    }

    // If all else fails, return the last node in the array
    return realNodes[realNodes.length - 1].id
  }

  const onDragStart = (event: React.DragEvent<HTMLDivElement>, nodeType: string, label: string) => {
    event.dataTransfer.setData("application/reactflow", nodeType)
    event.dataTransfer.setData("application/reactflow-label", label)
    event.dataTransfer.effectAllowed = "move"
  }

  const exportToImage = () => {
    if (reactFlowWrapper.current === null) return

    // Hide placeholder nodes before export
    setNodes((nds) =>
      nds.map((node) => (node.data?.isPlaceholder ? { ...node, style: { ...node.style, opacity: 0 } } : node)),
    )

    setTimeout(() => {
      toPng(reactFlowWrapper.current!, {
        filter: (node) => {
          // Don't include panel elements or placeholders in the image
          return !node.classList?.contains("react-flow__panel")
        },
        backgroundColor: "#fff",
        quality: 1,
      })
        .then((dataUrl) => {
          const link = document.createElement("a")
          link.download = "flowchart.png"
          link.href = dataUrl
          link.click()

          // Restore placeholder nodes after export
          setNodes((nds) =>
            nds.map((node) => (node.data?.isPlaceholder ? { ...node, style: { ...node.style, opacity: 0.5 } } : node)),
          )
        })
        .catch((error) => {
          console.error("Error exporting flowchart:", error)

          // Restore placeholder nodes if export fails
          setNodes((nds) =>
            nds.map((node) => (node.data?.isPlaceholder ? { ...node, style: { ...node.style, opacity: 0.5 } } : node)),
          )
        })
    }, 100)
  }

  const deleteNode = (nodeId: string) => {
    // Get all edges connected to this node
    const connectedEdges = edges.filter((edge) => edge.source === nodeId || edge.target === nodeId)

    // If this is a placeholder node, just remove it and its edges
    const nodeToDelete = nodes.find((node) => node.id === nodeId)
    if (nodeToDelete?.data?.isPlaceholder) {
      setNodes((nds) => nds.filter((node) => node.id !== nodeId))
      setEdges((eds) => eds.filter((edge) => edge.source !== nodeId && edge.target !== nodeId))
      setSelectedNode(null)
      return
    }

    // For regular nodes, try to reconnect the flow
    if (connectedEdges.length >= 2) {
      const incomingEdges = connectedEdges.filter((edge) => edge.target === nodeId)
      const outgoingEdges = connectedEdges.filter((edge) => edge.source === nodeId)

      // If we have both incoming and outgoing edges, reconnect them
      if (incomingEdges.length > 0 && outgoingEdges.length > 0) {
        // For simplicity, just connect the first incoming to the first outgoing
        const newEdge: Edge = {
          id: `e${incomingEdges[0].source}-${outgoingEdges[0].target}-${Date.now()}`,
          source: incomingEdges[0].source,
          target: outgoingEdges[0].target,
          sourceHandle: incomingEdges[0].sourceHandle,
          targetHandle: outgoingEdges[0].targetHandle,
          type: "custom",
          data: { edgeId: `e${incomingEdges[0].source}-${outgoingEdges[0].target}-${Date.now()}` },
        }

        setEdges((eds) => [...eds.filter((e) => !connectedEdges.includes(e)), newEdge])
      } else {
        // Just remove the connected edges
        setEdges((eds) => eds.filter((edge) => edge.source !== nodeId && edge.target !== nodeId))
      }
    } else {
      // Just remove the connected edges
      setEdges((eds) => eds.filter((edge) => edge.source !== nodeId && edge.target !== nodeId))
    }

    setNodes((nds) => nds.filter((node) => node.id !== nodeId))
    setSelectedNode(null)
  }

  const onNodeClick = (_: React.MouseEvent, node: Node) => {
    setSelectedNode(node.id)
    setSelectedEdge(null)
  }

  const onEdgeClick = (_: React.MouseEvent, edge: Edge) => {
    setSelectedEdge(edge.id)
    setSelectedNode(null)
  }

  const onPaneClick = () => {
    setSelectedNode(null)
    setSelectedEdge(null)
  }

  return (
    <div className="flex h-[80vh] w-full max-w-6xl border rounded-lg overflow-hidden bg-white shadow-md">
      {/* Left panel */}
      <div className="w-1/3 border-r flex flex-col">
        {/* Question area */}
        <div className="p-4 border-b h-1/3 overflow-auto">
          <h2 className="text-lg font-semibold mb-2">Flowchart Basics</h2>
          <p className="text-sm">
            Drag and drop shapes from the palette below to create a flowchart. Each shape represents a different type of
            operation in a program:
          </p>
          <ul className="text-sm list-disc pl-5 mt-2">
            <li>
              <strong>Start/End:</strong> Beginning and end of the program
            </li>
            <li>
              <strong>Process:</strong> Calculations or data manipulations
            </li>
            <li>
              <strong>Input/Output:</strong> Reading or displaying data
            </li>
            <li>
              <strong>Selection:</strong> Conditional branching (if/else)
            </li>
            <li>
              <strong>Iteration:</strong> Loops (while/for)
            </li>
          </ul>
          <p className="text-sm mt-2">
            <strong>Tips:</strong>
          </p>
          <ul className="text-sm list-disc pl-5">
            <li>Drag shapes onto the canvas or onto existing lines</li>
            <li>Select a node and press Delete to remove it</li>
            <li>Placeholder boxes show where you can add shapes</li>
          </ul>
        </div>

        {/* Shape palette */}
        <div className="p-4 flex-1 overflow-auto">\
          <h2        {/* Shape palette */}
        <div className="p-4 flex-1 overflow-auto">
          <h2 className="text-lg font-semibold mb-4">Flowchart Shapes</h2>
          <div className="grid grid-cols-1 gap-4">
            <div
              className="border rounded p-3 flex flex-col items-center cursor-move bg-blue-50 hover:bg-blue-100 transition-colors"
              draggable
              onDragStart={(event) => onDragStart(event, "startEnd", "Start/End")}
            >
              <div className="w-32 h-12 rounded-full border-2 border-blue-500 flex items-center justify-center mb-2">
                Start/End
              </div>
              <span className="text-xs text-gray-600">Terminal (Start/Stop)</span>
            </div>

            <div
              className="border rounded p-3 flex flex-col items-center cursor-move bg-green-50 hover:bg-green-100 transition-colors"
              draggable
              onDragStart={(event) => onDragStart(event, "process", "Process")}
            >
              <div className="w-32 h-12 border-2 border-green-500 flex items-center justify-center mb-2">Process</div>
              <span className="text-xs text-gray-600">Processing Step</span>
            </div>

            <div
              className="border rounded p-3 flex flex-col items-center cursor-move bg-purple-50 hover:bg-purple-100 transition-colors"
              draggable
              onDragStart={(event) => onDragStart(event, "inputOutput", "Input/Output")}
            >
              <div className="w-32 h-12 border-2 border-purple-500 transform skew-x-12 flex items-center justify-center mb-2">
                <span className="transform skew-x-0">Input/Output</span>
              </div>
              <span className="text-xs text-gray-600">Data Input/Output</span>
            </div>

            <div
              className="border rounded p-3 flex flex-col items-center cursor-move bg-amber-50 hover:bg-amber-100 transition-colors"
              draggable
              onDragStart={(event) => onDragStart(event, "selection", "Selection")}
            >
              <div
                className="w-24 h-24 border-2 border-amber-500 flex items-center justify-center mb-2"
                style={{ clipPath: "polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)" }}
              >
                Selection
              </div>
              <span className="text-xs text-gray-600">Conditional (If/Else)</span>
            </div>

            <div
              className="border rounded p-3 flex flex-col items-center cursor-move bg-red-50 hover:bg-red-100 transition-colors"
              draggable
              onDragStart={(event) => onDragStart(event, "iteration", "Iteration")}
            >
              <div
                className="w-24 h-24 border-2 border-red-500 flex items-center justify-center mb-2"
                style={{ clipPath: "polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)" }}
              >
                Iteration
              </div>
              <span className="text-xs text-gray-600">Loop (While/For)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right panel - Flow chart canvas */}
      <div className="w-2/3 h-full" ref={reactFlowWrapper}>
        <ReactFlowProvider>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onInit={setReactFlowInstance}
            onDrop={onDrop}
            onDragOver={onDragOver}
            onNodeClick={onNodeClick}
            onEdgeClick={onEdgeClick}
            onPaneClick={onPaneClick}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            deleteKeyCode={["Delete", "Backspace"]}
            defaultViewport={{ x: 0, y: 0, zoom: 0.7 }}
            minZoom={0.3}
            maxZoom={2}
            fitView
            fitViewOptions={{ padding: 0.5 }}
          >
            <Background />
            <Controls />
            <Panel position="bottom-right">
              <button
                onClick={exportToImage}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
              >
                Export as Image
              </button>
            </Panel>
          </ReactFlow>
        </ReactFlowProvider>
      </div>
    </div>
  )
}

