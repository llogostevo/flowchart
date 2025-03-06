import { Handle, Position, type NodeProps } from "reactflow"

const InputOutputNode = ({ data, isConnectable }: NodeProps) => {
  return (
    <div className="shadow-md bg-white border-2 border-gray-300 min-w-[120px] h-[60px] flex items-center justify-center transform skew-x-12">
      <div className="transform -skew-x-12 px-4 text-center">
        <Handle
          type="target"
          position={Position.Top}
          isConnectable={isConnectable}
          style={{ transform: "translateX(0) skewX(-12deg)" }}
        />
        <div contentEditable suppressContentEditableWarning className="font-bold outline-none">
          {data.label}
        </div>
        <Handle
          type="source"
          position={Position.Bottom}
          isConnectable={isConnectable}
          style={{ transform: "translateX(0) skewX(-12deg)" }}
        />
      </div>
    </div>
  )
}

export default InputOutputNode

