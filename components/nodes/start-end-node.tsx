import { Handle, Position, type NodeProps } from "reactflow"

const StartEndNode = ({ data, isConnectable }: NodeProps) => {
  return (
    <div className="px-4 py-2 shadow-md rounded-full bg-white border-2 border-gray-300 min-w-[100px] text-center">
      <Handle type="target" position={Position.Top} isConnectable={isConnectable} />
      <div className="font-bold">{data.label}</div>
      <Handle type="source" position={Position.Bottom} isConnectable={isConnectable} />
    </div>
  )
}

export default StartEndNode

