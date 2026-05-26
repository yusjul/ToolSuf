# AI Workflow Assistant — Technical & Design Specification

AI Workflow Assistant is a premium, client-side visual automation editor built to design, test, and run intelligent multi-step prompt chains directly in the browser. 

---

## 1. Functional Requirements

### 1.1 Visual Workflow Editor (Node Canvas)
- **Drag-and-Drop Node Canvas**: A lightweight, fluid canvas to place, drag, connect, and configure logic blocks (Nodes).
- **Node Connections**: Inputs and outputs can be visually connected with custom SVG curved cables that adapt to canvas panning and zoom levels.
- **Node Library**:
  - **Trigger Node**: Starts the workflow (e.g., manual trigger button, file drop events, timer, webhook/API call).
  - **Input Parser Node**: Extracts content from uploaded files (`.txt`, `.pdf`, `.docx`, `.csv`, `.json`).
  - **Prompt Node**: Defines a prompt template with dynamic variables injected from connected inputs (e.g., `{{document_text}}`).
  - **AI Model Node**: Configures LLM parameters (model select, system prompt, temperature, max tokens, system instruct).
  - **Output formatter Node**: Formats the final text (Markdown, JSON, raw text) and triggers actions (e.g., Download File, Copy to Clipboard, Send to API).

### 1.2 Local & Remote Model Configurations
- **Local WebLLM Integration**: Direct execution of lightweight models (e.g., Gemma, Llama-3, Qwen) in-browser using WebGPU via WebLLM for 100% offline private processing.
- **Custom API Endpoint Handler**: Configuration fields for connecting securely to external/local inference engines (e.g., Ollama, LM Studio, OpenAI, Claude) via user-provided API keys or localhost endpoints.
- **Parameter Control**: Apple HIG-styled sliders for Temperature, Top-P, Presence Penalty, and Max Output Tokens.

### 1.3 Execution Panel & History
- **Live Run Details**: Visual trace showing which node is currently processing, complete with active loading animations.
- **Output Preview**: Built-in side panel with native Markdown rendering, syntax highlighting for code outputs, and single-click copy buttons.
- **Session Cache**: Automatically preserves the active canvas structure and last execution state inside `localStorage` for seamless resumption.

---

## 2. UI/UX & Design System (Apple HIG)

The user interface strictly adheres to Apple's design principles, prioritizing clean layouts, organic animations, and clear typographic hierarchy.

### 2.1 Color Palette & Tokens
- **Canvas Grid**: Sleek grid patterns utilizing transparency and CSS gradients.
  - *Light Mode*: Dot pattern (`rgba(0, 0, 0, 0.03)`), background `#F4F5F7` (System Gray 6).
  - *Dark Mode*: Dot pattern (`rgba(255, 255, 255, 0.03)`), background `#0F0F12`.
- **Active Accents**: Apple Blue (`#007AFF` / `#0A84FF`), Emerald Green (`#34C759` / `#30D158`), Amber Orange (`#FF9500`).
- **Nodes/Cards**: Glassmorphic panels with background blur, subtle gradients, and sharp thin borders.
  - *Border Width*: `1px` solid `var(--apple-separator)`.

### 2.2 Micro-Animations & Interactivity
- **Active Node Pulse**: Glow outline pulse when a node is actively running.
- **Smooth Connecting Lines**: Dynamic SVG paths redraw dynamically at 60fps on dragging and dropping connectors.
- **Tactile Inputs**: Custom slider components, toggle buttons, and dropdown select fields with macOS-styled transitions.
- **Scrollbars**: Hidden natively via Webkit/Mozilla styles on containers, allowing navigation solely through canvas panning or touch swipes.

---

## 3. Architecture & Dependencies

- **Framework-less Build**: Built entirely using pure HTML5, vanilla CSS, and modern ES6 JavaScript modules.
- **Local Model Processing**: Optional integration with `@mlc-ai/web-llm` for WebGPU-accelerated local intelligence.
- **JSON Serialization**: Full support for importing and exporting entire canvas layouts as compact `.json` workflow files for easy sharing.
