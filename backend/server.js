const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;

/* -------------------- VALIDATION -------------------- */
function isValidEdge(edge) {
    if (typeof edge !== "string") return false;

    edge = edge.trim();

    if (!/^[A-Z]->[A-Z]$/.test(edge)) {
        return false;
    }

    const [parent, child] = edge.split("->");

    if (parent === child) return false;

    return true;
}

/* -------------------- GRAPH BUILD -------------------- */
function buildGraph(validEdges) {
    const graph = {};
    const parentOf = {};
    const nodes = new Set();

    for (let edge of validEdges) {
        const [parent, child] = edge.split("->");

        nodes.add(parent);
        nodes.add(child);

        if (!graph[parent]) graph[parent] = [];
        if (!graph[child]) graph[child] = [];

        // Multi-parent rule: first parent wins
        if (parentOf[child]) continue;

        parentOf[child] = parent;
        graph[parent].push(child);
    }

    return { graph, parentOf, nodes };
}

/* -------------------- CONNECTED COMPONENTS -------------------- */
function getComponents(graph) {
    const visited = new Set();
    const components = [];

    const undirected = {};

    for (let node in graph) {
        if (!undirected[node]) undirected[node] = [];
        for (let child of graph[node]) {
            undirected[node].push(child);
            if (!undirected[child]) undirected[child] = [];
            undirected[child].push(node);
        }
    }

    for (let node in undirected) {
        if (visited.has(node)) continue;

        const stack = [node];
        const component = [];

        visited.add(node);

        while (stack.length) {
            const curr = stack.pop();
            component.push(curr);

            for (let neighbor of undirected[curr]) {
                if (!visited.has(neighbor)) {
                    visited.add(neighbor);
                    stack.push(neighbor);
                }
            }
        }

        components.push(component);
    }

    return components;
}

/* -------------------- CYCLE DETECTION -------------------- */
function hasCycle(graph, component) {
    const visited = new Set();
    const stack = new Set();

    function dfs(node) {
        if (stack.has(node)) return true;
        if (visited.has(node)) return false;

        visited.add(node);
        stack.add(node);

        for (let child of graph[node]) {
            if (dfs(child)) return true;
        }

        stack.delete(node);
        return false;
    }

    for (let node of component) {
        if (dfs(node)) return true;
    }

    return false;
}

/* -------------------- TREE BUILD -------------------- */
function buildTree(graph, root) {
    function dfs(node) {
        const obj = {};

        for (let child of graph[node]) {
            obj[child] = dfs(child);
        }

        return obj;
    }

    return {
        [root]: dfs(root)
    };
}

/* -------------------- DEPTH -------------------- */
function getDepth(graph, root) {
    if (graph[root].length === 0) return 1;

    let maxDepth = 0;

    for (let child of graph[root]) {
        maxDepth = Math.max(maxDepth, getDepth(graph, child));
    }

    return maxDepth + 1;
}

/* -------------------- API -------------------- */
app.post("/bfhl", (req, res) => {
    const { data } = req.body;

    if (!Array.isArray(data)) {
        return res.status(400).json({
            error: "data must be array"
        });
    }

    const invalidEntries = [];
    const duplicateSet = new Set();
    const seen = new Set();
    const validEdges = [];

    for (let edge of data) {
        edge = edge.trim();

        if (!isValidEdge(edge)) {
            invalidEntries.push(edge);
            continue;
        }

        if (seen.has(edge)) {
            duplicateSet.add(edge);
            continue;
        }

        seen.add(edge);
        validEdges.push(edge);
    }

    const duplicateEdges = [...duplicateSet];

    const { graph, parentOf } = buildGraph(validEdges);

    const components = getComponents(graph);

    const hierarchies = [];

    let totalTrees = 0;
    let totalCycles = 0;
    let largestTreeRoot = "";
    let largestDepth = 0;

    for (let component of components) {
        const cycle = hasCycle(graph, component);

        if (cycle) {
            totalCycles++;

            const root = [...component].sort()[0];

            hierarchies.push({
                root,
                tree: {},
                has_cycle: true
            });
        } else {
            let root = null;

            for (let node of component) {
                if (!parentOf[node]) {
                    root = node;
                    break;
                }
            }

            const tree = buildTree(graph, root);
            const depth = getDepth(graph, root);

            hierarchies.push({
                root,
                tree,
                depth
            });

            totalTrees++;

            if (
                depth > largestDepth ||
                (depth === largestDepth &&
                    (largestTreeRoot === "" || root < largestTreeRoot))
            ) {
                largestDepth = depth;
                largestTreeRoot = root;
            }
        }
    }

    res.json({
        user_id: "saksham kathuria_27032006",
        email_id: "saksham1118.be23@chitkara.edu.in",
        college_roll_number: "2310991118",
        hierarchies,
        invalid_entries: invalidEntries,
        duplicate_edges: duplicateEdges,
        summary: {
            total_trees: totalTrees,
            total_cycles: totalCycles,
            largest_tree_root: largestTreeRoot
        }
    });
});

app.listen(PORT, () => {
    console.log(`Server running on ${PORT}`);
});