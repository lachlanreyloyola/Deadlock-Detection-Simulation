/**
 * visualization.js
 * * Deadlock & FSA Visualizer for concurrent systems
 * Updated for Modern Dark Mode Palette
 */

class DeadlockVisualizer {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) {
            console.warn(`Canvas with id "${canvasId}" not found`);
            return;
        }
        this.ctx = this.canvas.getContext('2d');
        
        // Match high-DPI screens for sharper rendering
        const dpr = window.devicePixelRatio || 1;
        const rect = this.canvas.getBoundingClientRect();
        this.canvas.width = rect.width * dpr;
        this.canvas.height = rect.height * dpr;
        this.ctx.scale(dpr, dpr);
    }

    /** ---------------- WFG DRAWING ---------------- **/

    drawWaitForGraph(wfgData) {
        if (!this.ctx || !wfgData) return;

        this.clearCanvas();

        const nodes = wfgData.nodes || [];
        const edges = wfgData.edges || [];

        // Logic to center the graph
        const rect = this.canvas.getBoundingClientRect();
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        const radius = Math.min(centerX, centerY) - 60;

        const nodePositions = {};
        nodes.forEach((node, i) => {
            const angle = (2 * Math.PI * i) / nodes.length;
            nodePositions[node] = {
                x: centerX + radius * Math.cos(angle),
                y: centerY + radius * Math.sin(angle)
            };
        });

        // Draw edges (Arrows) - Using Neon Red/Cyan
        this.ctx.strokeStyle = '#94a3b8'; // Muted Slate for lines
        this.ctx.lineWidth = 2;
        edges.forEach(({ from, to }) => {
            const start = nodePositions[from];
            const end = nodePositions[to];
            // If the edge is part of a deadlock, we could color it red here
            if (start && end) this.drawArrow(start.x, start.y, end.x, end.y, '#f87171'); 
        });

        // Draw nodes - Using Neon Cyan
        nodes.forEach(node => {
            const pos = nodePositions[node];
            // Check if node is deadlocked (this depends on how your app logic passes data)
            const isDeadlocked = wfgData.deadlockedNodes && wfgData.deadlockedNodes.includes(node);
            const color = isDeadlocked ? '#ef4444' : '#38bdf8'; 
            this.drawNode(pos.x, pos.y, node, color);
        });
    }

    /** ---------------- FSA DRAWING ---------------- **/

    drawFSADiagram(states, currentState) {
        if (!this.ctx || !states) return;

        this.clearCanvas();

        const stateList = Array.isArray(states) ? states : Object.keys(states);
        const rect = this.canvas.getBoundingClientRect();
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        const radius = Math.min(centerX, centerY) - 60;

        stateList.forEach((state, i) => {
            const angle = (2 * Math.PI * i) / stateList.length;
            const x = centerX + radius * Math.cos(angle);
            const y = centerY + radius * Math.sin(angle);
            
            // Success Green for current, Slate for others
            const color = state === currentState ? '#10b981' : '#475569';
            this.drawNode(x, y, state, color);
        });
    }

    /** ---------------- NODE & ARROW UTILS ---------------- **/

    drawNode(x, y, label, color) {
        const radius = 28;

        // Glow Effect
        this.ctx.shadowBlur = 15;
        this.ctx.shadowColor = color;

        // Outer Circle (Border)
        this.ctx.fillStyle = '#1e293b'; // Slate 800 background
        this.ctx.beginPath();
        this.ctx.arc(x, y, radius, 0, 2 * Math.PI);
        this.ctx.fill();
        
        this.ctx.strokeStyle = color;
        this.ctx.lineWidth = 3;
        this.ctx.stroke();

        // Reset shadow for text
        this.ctx.shadowBlur = 0;

        // Text
        this.ctx.fillStyle = '#f1f5f9';
        this.ctx.font = 'bold 14px "Segoe UI", Arial';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(label, x, y);
    }

    drawArrow(x1, y1, x2, y2, color) {
        const headLength = 12;
        const nodeRadius = 30;
        const angle = Math.atan2(y2 - y1, x2 - x1);

        const startX = x1 + nodeRadius * Math.cos(angle);
        const startY = y1 + nodeRadius * Math.sin(angle);
        const endX = x2 - nodeRadius * Math.cos(angle);
        const endY = y2 - nodeRadius * Math.sin(angle);

        this.ctx.strokeStyle = color || '#94a3b8';
        this.ctx.beginPath();
        this.ctx.moveTo(startX, startY);
        this.ctx.lineTo(endX, endY);
        this.ctx.stroke();

        // Arrowhead
        this.ctx.beginPath();
        this.ctx.moveTo(endX, endY);
        this.ctx.lineTo(
            endX - headLength * Math.cos(angle - Math.PI / 6),
            endY - headLength * Math.sin(angle - Math.PI / 6)
        );
        this.ctx.lineTo(
            endX - headLength * Math.cos(angle + Math.PI / 6),
            endY - headLength * Math.sin(angle + Math.PI / 6)
        );
        this.ctx.closePath();
        this.ctx.fillStyle = color || '#94a3b8';
        this.ctx.fill();
    }

    clearCanvas() {
        if (!this.ctx) return;
        const rect = this.canvas.getBoundingClientRect();
        this.ctx.clearRect(0, 0, rect.width, rect.height);
        
        // Match the panel background from your CSS (Slate 700ish)
        this.ctx.fillStyle = '#0f172a'; 
        this.ctx.fillRect(0, 0, rect.width, rect.height);
    }
}

window.DeadlockVisualizer = DeadlockVisualizer;
