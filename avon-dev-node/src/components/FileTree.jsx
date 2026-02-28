import { ChevronRight, ChevronDown, Folder, FolderOpen, FileJson, FileCode2, FileText, Settings, File } from "lucide-react";

const files = [
    { name: "index.html", type: "file", icon: FileCode2, color: "text-orange-400" },
    {
        name: "src", type: "folder", open: true, children: [
            { name: "main.jsx", type: "file", icon: FileCode2, color: "text-blue-400" },
            { name: "App.jsx", type: "file", icon: FileCode2, color: "text-blue-400" },
            {
                name: "components", type: "folder", open: true, children: [
                    { name: "EditorPane.jsx", type: "file", icon: FileCode2, color: "text-blue-400" },
                    { name: "Sidebar.jsx", type: "file", icon: FileCode2, color: "text-blue-400" },
                    { name: "TopBar.jsx", type: "file", icon: FileCode2, color: "text-blue-400" },
                ],
            },
        ],
    },
    { name: "package.json", type: "file", icon: FileJson, color: "text-yellow-400" },
    { name: ".gitignore", type: "file", icon: Settings, color: "text-neutral-500" },
    { name: "README.md", type: "file", icon: FileText, color: "text-indigo-400" },
];

function FileNode({ node, depth = 0 }) {
    const isFolder = node.type === "folder";
    const Icon = node.icon || File;
    return (
        <div className="text-[13px] font-medium tracking-wide">
            <div
                className="flex items-center gap-2 py-1.5 pr-2 hover:bg-neutral-800/80 text-neutral-400 hover:text-neutral-200 cursor-pointer rounded-r-lg transition-colors group"
                style={{ paddingLeft: (depth + 1) * 12 + (isFolder ? 0 : 20) }}
            >
                {isFolder && (
                    <span className="opacity-70 group-hover:opacity-100 transition-opacity">
                        {node.open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                    </span>
                )}
                <span className="opacity-80 group-hover:opacity-100 transition-opacity flex items-center gap-2">
                    {isFolder
                        ? (node.open ? <FolderOpen size={15} className="text-blue-400" /> : <Folder size={15} className="text-blue-400" />)
                        : <Icon size={14} className={node.color || 'text-neutral-500'} />
                    }
                </span>
                <span className="truncate">{node.name}</span>
            </div>
            {isFolder && node.children && node.children.map((child, i) => (
                <FileNode key={i} node={child} depth={depth + 1} />
            ))}
        </div>
    );
}

export default function FileTree() {
    return (
        <div className="h-full w-72 flex flex-col bg-[#010409] border-r border-neutral-800/80 shrink-0">
            <div className="px-4 py-3 text-xs font-bold uppercase tracking-widest text-neutral-500 border-b border-neutral-800/80 flex justify-between items-center bg-[#0d1117] shadow-sm">
                <span>Explorer</span>
                <span className="text-neutral-600 hover:text-white cursor-pointer hover:bg-neutral-800 p-1 rounded transition-colors">+</span>
            </div>
            <div className="flex-1 overflow-y-auto py-3 custom-scrollbar">
                {files.map((f, i) => (
                    <FileNode key={i} node={f} />
                ))}
            </div>
        </div>
    );
}
