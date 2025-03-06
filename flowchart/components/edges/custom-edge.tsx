import { BaseEdge, EdgeLabelRenderer, type EdgeProps, getBezierPath, getSmoothStepPath, useReactFlow } from "reactflow"

export default function CustomEdge({
  id,
  source,
  target,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  data,
  markerEnd,
  animated,
}: EdgeProps) {
  const { setEdges } = useReactFlow()

  const [edgePath, labelX, labelY] =
    source === target
      ? getBezierPath({
          sourceX,
          sourceY,
          sourcePosition,
          targetX: targetX + 100, // Add offset for loop
          targetY: targetY - 50,
          targetPosition,
        })
      : getSmoothStepPath({
          sourceX,
          sourceY,
          sourcePosition,
          targetX,
          targetY,
          targetPosition,
          borderRadius: 16,
        })

  return (
    <>
      <BaseEdge
        path={edgePath}
        markerEnd={markerEnd}
        style={{
          ...style,
          strokeWidth: 2,
          stroke: "#555",
          strokeDasharray: animated ? "5,5" : undefined,
          animation: animated ? "flow 0.5s linear infinite" : undefined,
        }}
        animated={animated}
      />

      {data?.label && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: "absolute",
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              fontSize: 12,
              pointerEvents: "all",
            }}
            className="nodrag nopan bg-white px-2 py-1 rounded border text-xs"
          >
            {data.label}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  )
}

