#!/bin/bash

MONACO_VERSION="0.33.0"
MONACO_DIR="node_modules/monaco-editor/min/vs"

mkdir -p $MONACO_DIR

# Download essential Monaco files
curl -L "https://cdn.jsdelivr.net/npm/monaco-editor@$MONACO_VERSION/min/vs/loader.js" -o "$MONACO_DIR/loader.js"
curl -L "https://cdn.jsdelivr.net/npm/monaco-editor@$MONACO_VERSION/min/vs/editor/editor.main.js" -o "$MONACO_DIR/editor/editor.main.js"
curl -L "https://cdn.jsdelivr.net/npm/monaco-editor@$MONACO_VERSION/min/vs/editor/editor.main.css" -o "$MONACO_DIR/editor/editor.main.css"
curl -L "https://cdn.jsdelivr.net/npm/monaco-editor@$MONACO_VERSION/min/vs/editor/editor.main.nls.js" -o "$MONACO_DIR/editor/editor.main.nls.js"
curl -L "https://cdn.jsdelivr.net/npm/monaco-editor@$MONACO_VERSION/min/vs/basic-languages/markdown/markdown.js" -o "$MONACO_DIR/basic-languages/markdown/markdown.js"

# Create necessary directories
mkdir -p "$MONACO_DIR/basic-languages/markdown"
mkdir -p "$MONACO_DIR/editor"

echo "Monaco editor files downloaded successfully!"
