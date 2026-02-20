const files = [
    { name: "index.html", type: "file" },
    {
        name: "src", type: "folder", open: true, children: [
            { name: "main.jsx", type: "file" },
            { name: "App.jsx", type: "file" },
            {
                name: "components", type: "folder", open: true, children: [
                    { name: "EditorPane.jsx", type: "file" },
                    { name: "Sidebar.jsx", type: "file" },
                    { name: "TopBar.jsx", type: "file" },
                ],
            },
        ],
    },
    { name: "package.json", type: "file" },
    { name: ".gitignore", type: "file" },
    { name: "README.md", type: "file" },
];

function FileNode({ node, depth = 0 }) {
    const isFolder = node.type === "folder";
    return (
        <div className="text-xs font-mono">
            <div
                className="flex items-center gap-1.5 py-1 pr-2 hover:bg-neutral-800/50 text-neutral-400 hover:text-neutral-200 cursor-pointer rounded-r-md transition-colors"
                style={{ paddingLeft: (depth + 1) * 12 }}
            >
                <span className="opacity-70 w-4 text-center">
                    {isFolder ? (node.open ? "▾" : "▸") : "●"}
                </span>
                <span>{node.name}</span>
            </div>
            {isFolder && node.children && node.children.map((child, i) => (
                <FileNode key={i} node={child} depth={depth + 1} />
            ))}
        </div>
    );
}

export default function FileTree() {
    return (
        <div className="h-full flex flex-col bg-neutral-950 border-r border-neutral-800">
            <div className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-neutral-500 border-b border-neutral-800 flex justify-between items-center bg-neutral-900/30">
                <span>Project Files</span>
                <span className="text-neutral-600">...</span>
            </div>
            <div className="flex-1 overflow-auto py-2">
                {files.map((f, i) => (
                    <FileNode key={i} node={f} />
                ))}
            </div>
        </div>
    );
}
