# Metadata Cleaner (Exif Eraser) — Technical & Design Specification

Metadata Cleaner is a premium, 100% offline client-side utility designed to inspect, display, and completely strip privacy-sensitive EXIF/metadata fields from image files before they are shared.

---

## 1. Functional Requirements

### 1.1 Local Drag-and-Drop Parser
- **File Upload Area**: Support uploading JPEG, PNG, and WebP files using a modern, interactive drag-and-drop workspace.
- **EXIF Inspector Panel**: Read and display file metadata fields dynamically:
  - **Camera details**: Device model, aperture, shutter speed, ISO, focal length.
  - **Temporal details**: Date and time of capture, original filename.
  - **Geographic coordinates**: Latitude, longitude, altitude, and direction.
- **Static Map Preview Widget**: If GPS metadata is present, render a static preview pin-mapping indicator showing the exact coordinates on a localized map.

### 1.2 Client-Side Metadata Stripper
- **Metadata Stripping**: Parse and remove headers (EXIF segment `APP1`, JFIF segment `APP0`, IPTC, Photoshop markers) from the image binary stream directly inside the browser using JavaScript typed arrays (`ArrayBuffer`, `DataView`).
- **Lossless Processing**: Ensure the image pixel array is not compressed or modified in any way, preserving 100% of the image's original visual quality.
- **Batch Processing**:
  - Drag-and-drop multiple images.
  - View individual tag details.
  - Click "Clean All" to strip metadata in bulk.
  - Download all clean images packaged together inside a single `.zip` file using `JSZip` client-side.

---

## 2. UI/UX & Design System (Apple HIG)

The tool inherits ToolSuf's signature glassmorphic look, aligned with Apple's Human Interface Guidelines.

### 2.1 File Drop Workspace
- **Tactile Drop Area**: Highlighted by a thin dashed border, soft gradient background, and a responsive scale-up interaction when hovering files.
- **Drop Indicator**: Changes status to a glowing green badge when a valid file format is detected.

### 2.2 "Get Info" Inspector Panel
- **Split Column Design**: Mimics the macOS Finder "Get Info" inspector.
  - *Left Column*: Metadata Category & Key (e.g., `Device`, `Location`, `DateTime`).
  - *Right Column*: Extracted value, or a green checkmark indicating "Clean" or "Not Found".
- **Action Control buttons**:
  - **Clean All Metadata**: Strips the active image and opens a download prompt.
  - **Clean & Download ZIP** (for multiple files).

---

## 3. Libraries & Dependencies

- **Framework-less Build**: Native HTML5, CSS Variables, and modular ES6 JavaScript.
- **EXIF Parser library**: `exif-js` loaded locally for robust tag parsing.
- **ZIP Packaging**: `jszip` loaded locally to support bulk downloads.
