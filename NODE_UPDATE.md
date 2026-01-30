# ✨ NODE VISUALS & CONTEXT MENU UPDATE

## 🛠️ Visual Cleanup
- **Hidden Region Badge:** The "us-east" (Globe Icon) badge is now **hidden** for User/Client nodes (`client`, `mobile_app`, `web_browser`). It remains visible for servers/databases where region matters.

## 🖱️ Context Menu Improvement
- **Renamed:** "Settings" is now **"Configuration"** to clearly indicate it opens the Hardware Config Panel.
- **Linked:** Clicking "Configuration" now correctly forces the logic `setIsConfigPanelOpen(true)`, guaranteeing the panel opens even if it was closed.

## 🚀 Result
- **Cleaner Nodes:** Client nodes look simpler without redundant region info.
- **Clearer Actions:** Right-click menu is more descriptive and reliable.
