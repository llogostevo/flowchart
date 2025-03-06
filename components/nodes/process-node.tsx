import { Handle, Position, type NodeProps } from "reactflow"

const ProcessNode = ({ data, isConnectable }: NodeProps) => {
  return (
    <div className="px-4 py-2 shadow-md rounded-md bg-white border-2 border-gray-300 min-w-[100px] text-center">
      <Handle type="target" position={Position.Top} isConnectable={isConnectable} />
      <div contentEditable suppressContentEditableWarning className="font-bold outline-none">
        {data.label}
      </div>
      <Handle type="source" position={Position.Bottom} isConnectable={isConnectable} />
    </div>
  )
}

export default ProcessNode

