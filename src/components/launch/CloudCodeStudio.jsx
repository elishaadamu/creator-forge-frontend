import React, { useState, useEffect, useRef } from 'react'
import {
  Code, Terminal, FileCode, Folder, FolderOpen, File, Plus, Trash2,
  Copy, Check, Save, Sparkles, RefreshCw, Bot, User, Edit3, Eye,
  Play, Download, ExternalLink, ChevronRight, ChevronDown, CheckCircle2,
  Maximize2, Minimize2, Laptop, Sliders, Layers, Cpu, ShieldCheck,
  Search, X, FileText, CheckCheck, Loader2, ArrowRight, Cloud,
  CloudUpload, Activity, SlidersHorizontal, RotateCcw,
  Monitor, Tablet, Smartphone, Split,
  Image as ImageIcon, ZoomIn, ZoomOut
} from 'lucide-react'
import { executeAICodingTaskAI, generateCompleteMVPCodebaseAI, editOrGenerateCodeFileAI } from '../../services/ai'
import { uploadFormFileToCloudinary, updateCoLaunchProject } from '../../services/opsApi'
import AutomatedQASuite from './AutomatedQASuite'

// Helper function to auto-format and pretty-print HTML, JSON, JS, CSS, Python
function formatCode(rawCode, language = '') {
  if (!rawCode || typeof rawCode !== 'string') return ''
  let code = rawCode.trim()

  // 1. JSON
  if (language === 'json' || (code.startsWith('{') && code.endsWith('}')) || (code.startsWith('[') && code.endsWith(']'))) {
    try {
      return JSON.stringify(JSON.parse(code), null, 2)
    } catch (e) {}
  }

  // 2. HTML
  if (language === 'html' || code.includes('<!DOCTYPE') || code.includes('<html') || code.includes('</div>') || code.includes('</')) {
    try {
      // Insert newlines between tags that are glued together on one line
      let formatted = ''
      let indent = 0
      const tab = '  '
      const tokenized = code
        .replace(/>\s*</g, '>\n<')
        .replace(/;\s*</g, ';\n<')
        .split('\n')

      for (let rawLine of tokenized) {
        let line = rawLine.trim()
        if (!line) continue

        // Closing tag decreases indent
        if (line.match(/^<\/(html|head|body|div|main|section|article|header|footer|nav|ul|ol|table|thead|tbody|tr|form|select|script|style)/i)) {
          indent = Math.max(0, indent - 1)
        }

        formatted += tab.repeat(indent) + line + '\n'

        // Opening non-self-closing container tag increases indent
        if (
          line.match(/^<(html|head|body|div|main|section|article|header|footer|nav|ul|ol|table|thead|tbody|tr|form|select|script|style)[\s>]/i) &&
          !line.match(/<\/(html|head|body|div|main|section|article|header|footer|nav|ul|ol|table|thead|tbody|tr|form|select|script|style)>/i) &&
          !line.endsWith('/>')
        ) {
          indent++
        }
      }
      return formatted.trim()
    } catch (e) {}
  }

  return code
}

function escapeRegExp(string) {
  return (string || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

// Helper function to compile and bundle HTML, JSX, React components, CSS, and JS into a runnable sandbox document
function compileSandboxPreviewDocument(file, allFiles = []) {
  if (!file || !file.content) {
    return `<!DOCTYPE html><html><body style="font-family:system-ui,sans-serif;background:#090b0e;color:#64748b;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;"><div style="text-align:center;padding:24px;border:1px dashed rgba(255,255,255,0.1);border-radius:16px;"><h3 style="color:#fff;margin:0 0 8px 0;">No Previewable Content</h3><p style="font-size:12px;margin:0;">Add code or prompt Gemini 3.1 Flash Lite to generate code.</p></div></body></html>`
  }

  const name = (file.name || '').toLowerCase()
  let content = file.content.trim()

  // 1. Resolve & Inline local project files if referenced via <script src="..."> or <link href="...">
  if (Array.isArray(allFiles) && allFiles.length > 0) {
    allFiles.forEach(otherFile => {
      if (otherFile && otherFile.name && otherFile.content) {
        const oName = otherFile.name
        // Inline local CSS
        if (oName.endsWith('.css') || otherFile.language === 'css') {
          const cssRegex = new RegExp(`<link[^>]*href=["'](?:\\.\\/)?(?:[^"']*\\/)?${escapeRegExp(oName)}["'][^>]*>`, 'gi')
          content = content.replace(cssRegex, `<style>\n/* Inlined from ${oName} */\n${otherFile.content}\n</style>`)
        }
        // Inline local JS / JSX
        if (oName.endsWith('.js') || oName.endsWith('.jsx') || otherFile.language === 'javascript') {
          const scriptRegex = new RegExp(`<script[^>]*src=["'](?:\\.\\/)?(?:[^"']*\\/)?${escapeRegExp(oName)}["'][^>]*>\\s*<\\/script>`, 'gi')
          const isBabel = oName.endsWith('.jsx') || otherFile.content.includes('className=') || (otherFile.content.includes('<') && otherFile.content.includes('/>'))
          const scriptType = isBabel ? ' type="text/babel"' : ''
          content = content.replace(scriptRegex, `<script${scriptType}>\n/* Inlined from ${oName} */\n${otherFile.content}\n</script>`)
        }
      }
    })
  }

  // 2. FULL HTML DOCUMENT
  if (content.toLowerCase().includes('<!doctype html') || content.toLowerCase().includes('<html')) {
    let html = content

    const cdnInjections = `
  <script src="https://cdn.tailwindcss.com"></script>
  <script src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
  <script src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
  <script src="https://unpkg.com/lucide@latest"></script>
  <style>
    body { margin: 0; font-family: system-ui, -apple-system, sans-serif; }
  </style>`

    if (html.includes('<head>')) {
      html = html.replace('<head>', `<head>${cdnInjections}`)
    } else if (html.includes('<html>')) {
      html = html.replace('<html>', `<html><head>${cdnInjections}</head>`)
    } else {
      html = `<head>${cdnInjections}</head>${html}`
    }

    // Auto-enable Babel on scripts that contain React/JSX
    html = html.replace(/<script(?![^>]*type=)([^>]*)>([\s\S]*?)<\/script>/gi, (match, attrs, code) => {
      if (code.includes('React') || code.includes('ReactDOM') || code.includes('useState') || code.includes('className=') || (code.includes('<') && code.includes('/>'))) {
        return `<script type="text/babel"${attrs}>\n${code}\n</script>`
      }
      return `<script${attrs}>\n${code}\n</script>`
    })

    const runtimeScript = `
  <script>
    window.addEventListener('DOMContentLoaded', () => {
      if (window.lucide && typeof window.lucide.createIcons === 'function') {
        try { window.lucide.createIcons(); } catch(e) {}
      }
    });
  </script>`

    if (html.includes('</body>')) {
      html = html.replace('</body>', `${runtimeScript}\n</body>`)
    } else {
      html += runtimeScript
    }

    return html
  }

  // 3. JAVASCRIPT / JSX / REACT COMPONENT OR STANDALONE SCRIPT
  let cleanJsx = content
    .replace(/import\s+[\s\S]*?from\s+['"][^'"]+['"];?/g, '')
    .replace(/export\s+default\s+function\s+([a-zA-Z0-9_]+)/g, 'function $1')
    .replace(/export\s+default\s+([a-zA-Z0-9_]+);?/g, 'window.__MainComponent = $1;')
    .replace(/export\s+const\s+/g, 'const ')
    .replace(/export\s+function\s+/g, 'function ')

  // If the snippet starts with an open tag without function App(), wrap it into a component
  if (!cleanJsx.includes('function ') && !cleanJsx.includes('const ') && (cleanJsx.startsWith('<') || cleanJsx.startsWith('{') || cleanJsx.startsWith('('))) {
    cleanJsx = `function DynamicApp() {\n  return (\n    <div className="p-6 max-w-4xl mx-auto space-y-6">\n      ${cleanJsx}\n    </div>\n  );\n}\nwindow.__MainComponent = DynamicApp;`
  }

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${file.name}</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <script src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
  <script src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
  <script src="https://unpkg.com/lucide@latest"></script>
  <style>
    body { margin: 0; background-color: #090b0e; color: #f8fafc; font-family: system-ui, -apple-system, sans-serif; }
  </style>
</head>
<body>
  <div id="root"></div>

  <script type="text/babel">
    const { useState, useEffect, useRef, useMemo, useCallback } = React;

    try {
      ${cleanJsx}

      const TargetComponent = window.__MainComponent || (typeof App !== 'undefined' ? App : (typeof Main !== 'undefined' ? Main : (typeof DynamicApp !== 'undefined' ? DynamicApp : null)));
      if (TargetComponent && typeof TargetComponent === 'function') {
        const root = ReactDOM.createRoot(document.getElementById('root'));
        root.render(<TargetComponent />);
      }
    } catch (err) {
      document.getElementById('root').innerHTML = '<div style="padding:20px;color:#f87171;background:#18181b;border:1px solid #7f1d1d;border-radius:12px;margin:20px;font-family:monospace;"><strong>JavaScript Runtime Error:</strong><pre style="margin-top:8px;font-size:12px;white-space:pre-wrap;">' + err.message + '</pre></div>';
    }
  </script>
  <script>
    window.addEventListener('DOMContentLoaded', () => {
      if (window.lucide && typeof window.lucide.createIcons === 'function') {
        try { window.lucide.createIcons(); } catch(e) {}
      }
    });
  </script>
</body>
</html>`
}

export default function CloudCodeStudio({
  project,
  engineeringTasks = [],
  buildPlan,
  qaResults,
  setQaResults,
  onUpdateTasks,
  onSaveProjectFiles,
  onUpdateProject,
  handleSavePlan,
  handleToggleTaskStatus,
  handleReassignTask,
  handleSwitchAllToAI,
  handleSwitchToAIAndDispatch,
  handleAutoDistributeDivisionOfLabor,
  handleAddDefaultHumanTask,
  executingTaskId,
  showToast
}) {
  const prodName = project?.productName || 'Creator Forge Engine'
  const prodSlug = (project?.slug || project?.productName || 'app').toLowerCase().replace(/[^a-z0-9]/g, '-')

  // 1. Initialize files strictly from DB (project.projectFiles), localStorage, or AI task outputs
  const extractInitialFiles = () => {
    const existing = []

    // From active project prop
    let sourceFiles = Array.isArray(project?.projectFiles) ? project.projectFiles : []

    // Fallback to localStorage if prop is initializing
    if (sourceFiles.length === 0) {
      try {
        const raw = localStorage.getItem('forge_launch_active_project')
        if (raw) {
          const parsed = JSON.parse(raw)
          if (Array.isArray(parsed?.projectFiles) && parsed.projectFiles.length > 0) {
            sourceFiles = parsed.projectFiles
          }
        }
      } catch (e) {
        console.warn('[CloudCodeStudio] localStorage read notice:', e)
      }
    }

    if (sourceFiles.length > 0) {
      sourceFiles.forEach(f => {
        if (f && (f.name || f.path)) {
          const path = f.path || f.name
          const name = f.name || (path ? path.split('/').pop() : 'script.js')
          existing.push({
            id: f.id || `file-${name}`,
            path,
            name,
            folder: f.folder || (path && path.includes('/') ? path.split('/').slice(0, -1).join('/') : 'root'),
            category: f.category || 'Code',
            language: f.language || (name.endsWith('.py') ? 'python' : name.endsWith('.json') ? 'json' : name.endsWith('.md') ? 'markdown' : name.endsWith('.html') ? 'html' : name.endsWith('.css') ? 'css' : 'javascript'),
            author: f.author || (f.assignedTo === 'Human Engineer' ? 'Human Engineer' : 'AI Agent'),
            modified: false,
            content: f.content || '',
            cloudinaryUrl: f.cloudinaryUrl || f.url || null,
            publicId: f.publicId || null,
            updatedAt: f.updatedAt || new Date().toISOString()
          })
        }
      })
    }

    // From AI generated task scaffolded files
    if (Array.isArray(engineeringTasks) && engineeringTasks.length > 0) {
      engineeringTasks.forEach(task => {
        if (task.aiOutput?.filesScaffolded && Array.isArray(task.aiOutput.filesScaffolded)) {
          task.aiOutput.filesScaffolded.forEach((sf, idx) => {
            if (sf.filePath && sf.codeSnippet) {
              const path = sf.filePath
              const name = path.split('/').pop()
              const folder = path.includes('/') ? path.split('/').slice(0, -1).join('/') : 'root'
              const existingIdx = existing.findIndex(ef => ef.path === path)
              const fileObj = {
                id: `task-file-${task.id}-${idx}`,
                path,
                name,
                folder,
                category: task.category || 'Code',
                language: path.endsWith('.py') ? 'python' : path.endsWith('.json') ? 'json' : path.endsWith('.md') ? 'markdown' : path.endsWith('.html') ? 'html' : 'javascript',
                author: task.assignedTo || 'AI Agent',
                modified: false,
                content: sf.codeSnippet,
                cloudinaryUrl: null,
                publicId: null,
                updatedAt: new Date().toISOString()
              }
              if (existingIdx < 0) {
                existing.push(fileObj)
              }
            }
          })
        }
      })
    }

    return existing
  }

  const [files, setFiles] = useState(extractInitialFiles)
  const [activeFileId, setActiveFileId] = useState(() => files[0]?.id || null)
  const [openTabIds, setOpenTabIds] = useState(() => (files[0] ? [files[0].id] : []))
  const [fileSearch, setFileSearch] = useState('')
  const [isAiPrompting, setIsAiPrompting] = useState(false)
  const [aiPromptText, setAiPromptText] = useState('')
  const [isGeneratingAll, setIsGeneratingAll] = useState(false)
  const [isUploadingCloudinary, setIsUploadingCloudinary] = useState(false)
  const [activeView, setActiveView] = useState('editor') // 'editor' | 'qa' | 'tasks'
  const [activeActivityTab, setActiveActivityTab] = useState('explorer') // 'explorer' | 'tasks' | 'testing'
  const [isNewFileModalOpen, setIsNewFileModalOpen] = useState(false)
  const [newFilePath, setNewFilePath] = useState('')
  const [newFileAuthor, setNewFileAuthor] = useState('Human Engineer')
  const [isCopied, setIsCopied] = useState(false)
  const [collapsedFolders, setCollapsedFolders] = useState({})
  const lineNumbersRef = React.useRef(null)
  const textareaRef = React.useRef(null)

  const handleEditorScroll = (e) => {
    if (lineNumbersRef.current) {
      lineNumbersRef.current.scrollTop = e.target.scrollTop
    }
  }

  // Auto-format active file
  const handleFormatActiveFile = () => {
    if (!activeFile || !activeFile.content) return
    const formatted = formatCode(activeFile.content, activeFile.language)
    if (formatted !== activeFile.content) {
      const updatedFile = { ...activeFile, content: formatted, modified: true }
      const updatedList = files.map(f => f.id === activeFile.id ? updatedFile : f)
      setFiles(updatedList)
      showToast?.(`Formatted ${activeFile.name}!`)
    } else {
      showToast?.(`${activeFile.name} is already formatted.`)
    }
  }

  const [htmlViewMode, setHtmlViewMode] = useState('split') // 'code' | 'split' | 'preview'
  const [previewViewport, setPreviewViewport] = useState('desktop') // 'desktop' | 'tablet' | 'mobile'
  const [imageZoom, setImageZoom] = useState(100)
  const [svgViewMode, setSvgViewMode] = useState('preview') // 'preview' | 'code'

  const activeFile = files.find(f => f.id === activeFileId) || files[0] || null
  const isImageFile = Boolean(
    activeFile &&
    (
      activeFile.name?.toLowerCase().endsWith('.png') ||
      activeFile.name?.toLowerCase().endsWith('.jpg') ||
      activeFile.name?.toLowerCase().endsWith('.jpeg') ||
      activeFile.name?.toLowerCase().endsWith('.webp') ||
      activeFile.name?.toLowerCase().endsWith('.svg') ||
      activeFile.name?.toLowerCase().endsWith('.gif') ||
      activeFile.name?.toLowerCase().endsWith('.ico') ||
      activeFile.name?.toLowerCase().endsWith('.avif') ||
      activeFile.name?.toLowerCase().endsWith('.bmp') ||
      activeFile.category === 'Asset' ||
      activeFile.category === 'Image'
    )
  )

  const isWebPreviewable = Boolean(
    activeFile &&
    !isImageFile &&
    (
      activeFile.name?.toLowerCase().endsWith('.html') ||
      activeFile.name?.toLowerCase().endsWith('.htm') ||
      activeFile.name?.toLowerCase().endsWith('.jsx') ||
      activeFile.name?.toLowerCase().endsWith('.js') ||
      activeFile.name?.toLowerCase().endsWith('.tsx') ||
      activeFile.name?.toLowerCase().endsWith('.ts') ||
      activeFile.name?.toLowerCase().endsWith('.css') ||
      activeFile.name?.toLowerCase().endsWith('.json') ||
      activeFile.language === 'html' ||
      activeFile.language === 'javascript'
    )
  )

  const getFileImageSrc = (file) => {
    if (!file) return ''
    if (file.cloudinaryUrl) return file.cloudinaryUrl
    if (file.url) return file.url
    if (file.content) {
      const trimmed = file.content.trim()
      if (trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('data:image/')) {
        return trimmed
      }
      if (file.name?.toLowerCase().endsWith('.svg') || trimmed.startsWith('<svg')) {
        return `data:image/svg+xml;utf8,${encodeURIComponent(trimmed)}`
      }
    }
    return ''
  }

  // Keep internal state in sync with parent project.projectFiles on initial load
  useEffect(() => {
    if (Array.isArray(project?.projectFiles) && project.projectFiles.length > 0) {
      if (files.length === 0) {
        const extracted = extractInitialFiles()
        if (extracted.length > 0) {
          setFiles(extracted)
          setActiveFileId(extracted[0].id)
          setOpenTabIds([extracted[0].id])
        }
      }
    }
  }, [project?.projectFiles])

  // Open file in tabs
  const handleOpenFile = (file) => {
    setActiveFileId(file.id)
    if (!openTabIds.includes(file.id)) {
      setOpenTabIds([...openTabIds, file.id])
    }
  }

  // Close tab
  const handleCloseTab = (e, tabId) => {
    e.stopPropagation()
    const nextTabs = openTabIds.filter(id => id !== tabId)
    setOpenTabIds(nextTabs)
    if (activeFileId === tabId && nextTabs.length > 0) {
      setActiveFileId(nextTabs[nextTabs.length - 1])
    }
  }

  // Edit file content (Human Customization)
  const handleContentChange = (newContent) => {
    setFiles(prev => prev.map(f => {
      if (f.id === activeFile?.id) {
        return { ...f, content: newContent, modified: true, author: 'Human Engineer' }
      }
      return f
    }))
  }

  // Upload file to Cloudinary & Save to Database & LocalStorage
  const uploadAndSyncFileToCloudinary = async (fileToSave, currentList = null) => {
    setIsUploadingCloudinary(true)
    const baseUpdatedFile = {
      ...fileToSave,
      modified: false,
      updatedAt: new Date().toISOString()
    }

    const sourceList = currentList || files
    const updatedFilesList = sourceList.some(f => f.id === baseUpdatedFile.id)
      ? sourceList.map(f => f.id === baseUpdatedFile.id ? baseUpdatedFile : f)
      : [...sourceList, baseUpdatedFile]

    // 1. Immediately update React state
    setFiles(updatedFilesList)

    // 2. Prepare payload for DB and LocalStorage
    const projectFilesPayload = updatedFilesList.map(f => ({
      id: f.id,
      name: f.name,
      path: f.path,
      folder: f.folder,
      category: f.category,
      language: f.language,
      author: f.author,
      content: f.content,
      cloudinaryUrl: f.cloudinaryUrl || null,
      publicId: f.publicId || null,
      updatedAt: f.updatedAt
    }))

    // 3. Immediately persist locally & in parent state
    if (onSaveProjectFiles) {
      onSaveProjectFiles(projectFilesPayload)
    }
    if (onUpdateProject) {
      onUpdateProject(prev => ({ ...(prev || {}), projectFiles: projectFilesPayload }))
    }
    try {
      const activeProjRaw = localStorage.getItem('forge_launch_active_project')
      const activeProj = activeProjRaw ? JSON.parse(activeProjRaw) : (project || {})
      const updatedProj = { ...activeProj, projectFiles: projectFilesPayload }
      localStorage.setItem('forge_launch_active_project', JSON.stringify(updatedProj))
      window.dispatchEvent(new CustomEvent('forge_project_updated', { detail: updatedProj }))
    } catch (e) {
      console.warn('[Storage] Local sync warning:', e)
    }

    // 4. Immediately persist to Backend DB
    if (project?.id) {
      updateCoLaunchProject(project.id, { projectFiles: projectFilesPayload }).catch(e => {
        console.warn('[Backend] ProjectFiles sync notice:', e)
      })
    }

    // 5. Asynchronously upload raw file to Cloudinary CDN
    try {
      const blob = new Blob([fileToSave.content || ''], { type: 'text/plain;charset=utf-8' })
      const fileName = fileToSave.name || 'script.js'
      const fileObj = new File([blob], fileName, { type: 'text/plain' })
      const folderPath = `creator_forge/${project?.id || prodSlug}/codebase/${fileToSave.folder || 'root'}`

      setTerminalLogs(prev => [
        ...prev,
        `[cloudinary] ☁️ Uploading ${fileToSave.path} to Cloudinary...`
      ])

      const cloudRes = await uploadFormFileToCloudinary(fileObj, folderPath, project?.id)
      if (cloudRes?.secure_url || cloudRes?.url) {
        const cldUrl = cloudRes.secure_url || cloudRes.url
        const pubId = cloudRes.public_id || null
        const withCldFile = { ...baseUpdatedFile, cloudinaryUrl: cldUrl, publicId: pubId }
        const withCldList = updatedFilesList.map(f => f.id === withCldFile.id ? withCldFile : f)
        setFiles(withCldList)

        const withCldPayload = withCldList.map(f => ({
          id: f.id,
          name: f.name,
          path: f.path,
          folder: f.folder,
          category: f.category,
          language: f.language,
          author: f.author,
          content: f.content,
          cloudinaryUrl: f.cloudinaryUrl || null,
          publicId: f.publicId || null,
          updatedAt: f.updatedAt
        }))

        if (onSaveProjectFiles) onSaveProjectFiles(withCldPayload)
        if (project?.id) updateCoLaunchProject(project.id, { projectFiles: withCldPayload }).catch(() => {})

        setTerminalLogs(prev => [
          ...prev,
          `[cloudinary] ✓ ${fileToSave.path} saved & CDN synced!`
        ])
      }
    } catch (cloudErr) {
      console.warn('[Cloudinary] Cloud upload notice:', cloudErr)
      setTerminalLogs(prev => [
        ...prev,
        `[storage] ✓ ${fileToSave.name} saved to project files.`
      ])
    } finally {
      setIsUploadingCloudinary(false)
      showToast?.(`Saved "${fileToSave.name}"!`)
    }
  }

  // Save active file handler
  const handleSaveActiveFile = () => {
    if (!activeFile) return
    uploadAndSyncFileToCloudinary(activeFile)
  }

  // Create New File (Human / Custom)
  const handleCreateNewFile = (e) => {
    e?.preventDefault()
    if (!newFilePath.trim()) return
    const path = newFilePath.trim()
    const name = path.split('/').pop()
    const folder = path.includes('/') ? path.split('/').slice(0, -1).join('/') : 'root'
    const ext = name.includes('.') ? name.split('.').pop().toLowerCase() : 'js'
    const language = ext === 'py' ? 'python' : ext === 'json' ? 'json' : ext === 'md' ? 'markdown' : ext === 'html' ? 'html' : ext === 'css' ? 'css' : 'javascript'

    const initialContent = language === 'html'
      ? `<!DOCTYPE html>\n<html lang="en">\n<head>\n  <meta charset="UTF-8">\n  <meta name="viewport" content="width=device-width, initial-scale=1.0">\n  <title>${prodName}</title>\n</head>\n<body>\n  <h1>Welcome to ${prodName}</h1>\n</body>\n</html>\n`
      : language === 'python'
      ? `# ${name}\n# Created for ${prodName}\n\ndef main():\n    print("${name} running...")\n\nif __name__ == "__main__":\n    main()\n`
      : language === 'json'
      ? `{\n  "name": "${name.replace('.json', '')}",\n  "version": "1.0.0"\n}`
      : language === 'css'
      ? `/* Styles for ${prodName} */\nbody {\n  margin: 0;\n  font-family: system-ui, sans-serif;\n}\n`
      : `/**\n * ${name}\n * Author: ${newFileAuthor}\n */\nexport default function ${name.replace(/[^a-zA-Z0-9]/g, '')}() {\n  return <div>${name}</div>\n}\n`

    const newFile = {
      id: `file-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      path,
      name,
      folder,
      category: folder.includes('backend') ? 'Backend' : folder.includes('tests') ? 'Testing' : 'Frontend',
      language,
      author: newFileAuthor,
      modified: false,
      content: initialContent,
      cloudinaryUrl: null,
      publicId: null,
      updatedAt: new Date().toISOString()
    }

    const updated = [...files, newFile]
    setFiles(updated)
    setActiveFileId(newFile.id)
    setOpenTabIds([...openTabIds, newFile.id])
    setIsNewFileModalOpen(false)
    setNewFilePath('')
    uploadAndSyncFileToCloudinary(newFile, updated)
    showToast?.(`Created new file: ${path}`)
  }

  // Delete File
  const handleDeleteFile = (e, fileId) => {
    e.stopPropagation()
    const fileToDelete = files.find(f => f.id === fileId)
    const updated = files.filter(f => f.id !== fileId)
    setFiles(updated)
    setOpenTabIds(openTabIds.filter(id => id !== fileId))
    if (activeFileId === fileId) {
      setActiveFileId(updated[0]?.id || null)
    }
    const projectFilesPayload = updated.map(f => ({
      id: f.id,
      name: f.name,
      path: f.path,
      folder: f.folder,
      category: f.category,
      language: f.language,
      author: f.author,
      content: f.content,
      cloudinaryUrl: f.cloudinaryUrl || null,
      publicId: f.publicId || null,
      updatedAt: f.updatedAt
    }))
    if (onSaveProjectFiles) onSaveProjectFiles(projectFilesPayload)
    if (onUpdateProject) onUpdateProject(prev => ({ ...(prev || {}), projectFiles: projectFilesPayload }))
    if (project?.id) {
      updateCoLaunchProject(project.id, { projectFiles: projectFilesPayload }).catch(() => {})
    }
    showToast?.(`Deleted ${fileToDelete?.name || 'file'}`)
  }

  // Synthesize Full Codebase with AI (Gemini 3.1 Flash Lite)
  const handleGenerateFullCodebaseWithAI = async () => {
    setIsGeneratingAll(true)
    setTerminalLogs(prev => [
      ...prev,
      `[ai-architect] ⚡ Synthesizing complete multi-file MVP codebase with Gemini 3.1 Flash Lite for "${prodName}"...`
    ])

    try {
      const generatedFiles = await generateCompleteMVPCodebaseAI(project)
      if (Array.isArray(generatedFiles) && generatedFiles.length > 0) {
        const formatted = generatedFiles.map((gf, idx) => ({
          id: `ai-gen-file-${Date.now()}-${idx}`,
          path: gf.path || gf.name,
          name: gf.name || (gf.path ? gf.path.split('/').pop() : `file_${idx}.js`),
          folder: gf.folder || (gf.path && gf.path.includes('/') ? gf.path.split('/').slice(0, -1).join('/') : 'root'),
          category: gf.category || 'Code',
          language: gf.language || (gf.name?.endsWith('.py') ? 'python' : 'javascript'),
          author: 'AI Agent (Gemini 3.1 Flash Lite)',
          modified: false,
          content: gf.content || '',
          updatedAt: new Date().toISOString()
        }))

        setFiles(formatted)
        setActiveFileId(formatted[0].id)
        setOpenTabIds([formatted[0].id, formatted[1]?.id].filter(Boolean))

        // Auto-save to Cloudinary & Database in background
        if (project?.id) {
          updateCoLaunchProject(project.id, { projectFiles: formatted }).catch(() => {})
        }

        setTerminalLogs(prev => [
          ...prev,
          `[ai-architect] ✓ Successfully generated ${formatted.length} codebase files for ${prodName}!`,
          `[storage] Codebase synced to Cloudinary & Project Database.`
        ])
        showToast?.(`Generated ${formatted.length} codebase files with Gemini 3.1 Flash Lite!`)
      }
    } catch (err) {
      console.warn('AI Codebase error:', err)
      setTerminalLogs(prev => [
        ...prev,
        `[ai-architect] ⚠️ AI synthesis failed: ${err.message}`
      ])
      showToast?.(`AI generation error: ${err.message}`)
    } finally {
      setIsGeneratingAll(false)
    }
  }

  // AI Copilot Refactor Prompt for Active File (Full-length & rich detail)
  const handleAiRefactorActiveFile = async (e) => {
    e?.preventDefault()
    if (!aiPromptText.trim() || !activeFile) return
    setIsAiPrompting(true)
    const prompt = aiPromptText.trim()
    setAiPromptText('')
    setTerminalLogs(prev => [
      ...prev,
      `[ai-copilot] ⚡ Synthesizing detailed production code for ${activeFile.name}: "${prompt}"...`
    ])

    try {
      const generatedCode = await editOrGenerateCodeFileAI(
        activeFile.name,
        activeFile.language,
        activeFile.content,
        prompt,
        project
      )

      if (generatedCode && typeof generatedCode === 'string' && generatedCode.trim()) {
        const formattedCode = formatCode(generatedCode, activeFile.language)
        const updatedFile = {
          ...activeFile,
          content: formattedCode,
          author: 'AI Agent (Gemini 3.1 Flash Lite)',
          modified: false
        }
        const updatedList = files.map(f => f.id === activeFile.id ? updatedFile : f)
        setFiles(updatedList)

        // Immediately sync to storage and database
        uploadAndSyncFileToCloudinary(updatedFile, updatedList)

        const lineCount = formattedCode.split('\n').length
        setTerminalLogs(prev => [
          ...prev,
          `[ai-copilot] ✓ Gemini 3.1 Flash Lite generated ${lineCount} lines of rich code for ${activeFile.name}!`
        ])
        showToast?.(`AI synthesized ${lineCount} lines for ${activeFile.name}!`)
      }
    } catch (err) {
      setTerminalLogs(prev => [
        ...prev,
        `[ai-copilot] ⚠️ Error during code synthesis: ${err.message}`
      ])
      showToast?.(`AI synthesis error: ${err.message}`)
    } finally {
      setIsAiPrompting(false)
    }
  }

  // Copy code
  const handleCopyCode = () => {
    if (!activeFile) return
    navigator.clipboard?.writeText(activeFile.content)
    setIsCopied(true)
    showToast?.(`Copied ${activeFile.name} to clipboard!`)
    setTimeout(() => setIsCopied(false), 2000)
  }

  // Toggle folder collapse in tree
  const toggleFolder = (folderName) => {
    setCollapsedFolders(prev => ({
      ...prev,
      [folderName]: !prev[folderName]
    }))
  }

  // Group files by folder
  const groupedFiles = files
    .filter(f => f.path.toLowerCase().includes(fileSearch.toLowerCase()))
    .reduce((acc, file) => {
      const folder = file.folder || 'root'
      if (!acc[folder]) acc[folder] = []
      acc[folder].push(file)
      return acc
    }, {})

  return (
    <div className="rounded-3xl bg-[#090b0e] border border-white/[0.08] shadow-2xl overflow-hidden flex flex-col h-[820px] max-h-[calc(100vh-140px)] min-h-[680px]">
      {/* Top Studio Unified Toolbar */}
      <div className="h-12 bg-[#0e1117] border-b border-white/[0.08] px-4 flex items-center justify-between gap-3 overflow-x-auto shrink-0 select-none">
        {/* Left: macOS Traffic Lights & File Count */}
        <div className="flex items-center gap-2.5 shrink-0">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-red-500/80 inline-block"></span>
            <span className="w-3 h-3 rounded-full bg-yellow-500/80 inline-block"></span>
            <span className="w-3 h-3 rounded-full bg-green-500/80 inline-block"></span>
          </div>
          <span className="text-[10px] px-2 py-0.5 rounded-md bg-white/[0.04] text-slate-400 border border-white/[0.06] font-mono whitespace-nowrap">
            {files.length} {files.length === 1 ? 'file' : 'files'}
          </span>
        </div>

        {/* Center: Integrated View Switchers */}
        <div className="flex items-center gap-1 bg-[#090b0e] p-1 rounded-xl border border-white/[0.06] text-xs shrink-0">
          {[
            { id: 'editor', label: 'Code Editor', icon: Code },
            { id: 'qa', label: 'QA Testing', icon: Activity },
            { id: 'tasks', label: 'Sprint Tasks', icon: Layers }
          ].map(view => {
            const Icon = view.icon
            const isActive = activeView === view.id
            return (
              <button
                key={view.id}
                onClick={() => setActiveView(view.id)}
                className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-colors cursor-pointer text-xs whitespace-nowrap shrink-0 ${
                  isActive
                    ? 'bg-blue-600/20 text-blue-300 border border-blue-500/30 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Icon className="w-3.5 h-3.5 shrink-0" />
                <span>{view.label}</span>
              </button>
            )
          })}
        </div>

        {/* Right Actions Toolbar */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setIsNewFileModalOpen(true)}
            className="px-2.5 py-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 hover:text-white border border-white/[0.08] text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer whitespace-nowrap shrink-0"
            title="Create new file manually (Human Engineer)"
          >
            <Plus className="w-3.5 h-3.5 text-blue-400" />
            <span>New File</span>
          </button>

          {activeFile && (
            <button
              onClick={handleSaveActiveFile}
              disabled={isUploadingCloudinary}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                activeFile?.modified
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-950/40'
                  : 'bg-emerald-600/15 hover:bg-emerald-600/25 text-emerald-300 border border-emerald-500/30'
              }`}
              title="Save & Sync file to Cloudinary & Database"
            >
              {isUploadingCloudinary ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <CloudUpload className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{activeFile?.modified ? 'Save *' : 'Saved'}</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* New File Modal */}
      {isNewFileModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-md w-full p-6 rounded-3xl bg-[#0e1117] border border-white/[0.1] shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <FileCode className="w-4 h-4 text-blue-400" />
                <span>Create New Codebase File</span>
              </h3>
              <button
                onClick={() => setIsNewFileModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateNewFile} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  File Path (with extension)
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. backend/script.js or src/components/NewFeature.jsx"
                  value={newFilePath}
                  onChange={e => setNewFilePath(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#090b0e] border border-white/[0.1] text-xs text-white outline-none focus:border-blue-500/50 font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Created By / Mode
                </label>
                <select
                  value={newFileAuthor}
                  onChange={e => setNewFileAuthor(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#090b0e] border border-white/[0.1] text-xs text-slate-200 outline-none"
                >
                  <option value="Human Engineer">👤 Human Engineer (Custom)</option>
                  <option value="AI Agent">🤖 AI Coding Agent</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsNewFileModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-white/[0.04] text-slate-300 hover:text-white text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md shadow-blue-950/40"
                >
                  Create & Sync
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Main Studio Body Layout */}
      <div className="flex-1 flex min-h-0 overflow-hidden">
        {/* Left Activity Bar */}
        <div className="w-12 bg-[#08090d] border-r border-white/[0.06] flex flex-col items-center py-3 gap-3 shrink-0 select-none h-full">
          <button
            onClick={() => setActiveActivityTab('explorer')}
            className={`p-2 rounded-xl transition-colors cursor-pointer ${
              activeActivityTab === 'explorer' ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30' : 'text-slate-500 hover:text-white'
            }`}
            title="File Explorer"
          >
            <Folder className="w-4 h-4" />
          </button>

          <button
            onClick={() => setActiveActivityTab('tasks')}
            className={`p-2 rounded-xl transition-colors cursor-pointer ${
              activeActivityTab === 'tasks' ? 'bg-purple-600/20 text-purple-400 border border-purple-500/30' : 'text-slate-500 hover:text-white'
            }`}
            title="Sprint Tasks & Division of Labor"
          >
            <Layers className="w-4 h-4" />
          </button>

          <button
            onClick={() => setActiveActivityTab('testing')}
            className={`p-2 rounded-xl transition-colors cursor-pointer ${
              activeActivityTab === 'testing' ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/30' : 'text-slate-500 hover:text-white'
            }`}
            title="QA Test Runner"
          >
            <Activity className="w-4 h-4" />
          </button>
        </div>

        {/* Left Explorer / Task Sidebar */}
        <div className="w-64 bg-[#0c0e14] border-r border-white/[0.08] flex flex-col shrink-0 h-full overflow-hidden">
          {activeActivityTab === 'explorer' && (
            <>
              {/* Explorer Header */}
              <div className="p-3 border-b border-white/[0.06] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Folder className="w-3.5 h-3.5 text-blue-400" />
                    <span>EXPLORER</span>
                  </span>
                  <button
                    onClick={() => setIsNewFileModalOpen(true)}
                    className="p-1 rounded hover:bg-white/[0.08] text-slate-400 hover:text-white"
                    title="New File"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="relative">
                  <Search className="w-3 h-3 text-slate-500 absolute left-2.5 top-2.5" />
                  <input
                    type="text"
                    value={fileSearch}
                    onChange={e => setFileSearch(e.target.value)}
                    placeholder="Search files..."
                    className="w-full pl-7 pr-3 py-1.5 rounded-lg bg-[#090b0e] border border-white/[0.06] text-[11px] text-slate-300 outline-none focus:border-blue-500/40 font-mono"
                  />
                </div>
              </div>

              {/* Tree View */}
              <div className="flex-1 overflow-y-auto p-2 space-y-1 font-mono text-xs">
                {files.length === 0 ? (
                  <div className="p-4 text-center space-y-2 text-slate-500">
                    <p className="text-[11px]">No files created yet.</p>
                    <button
                      onClick={handleGenerateFullCodebaseWithAI}
                      disabled={isGeneratingAll}
                      className="w-full py-1.5 rounded-lg bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/30 text-[10px] font-bold flex items-center justify-center gap-1 transition-colors cursor-pointer"
                    >
                      <Sparkles className="w-3 h-3" />
                      <span>Scaffold with AI</span>
                    </button>
                  </div>
                ) : (
                  Object.entries(groupedFiles).map(([folder, folderFiles]) => {
                    const isCollapsed = Boolean(collapsedFolders[folder])
                    return (
                      <div key={folder} className="space-y-0.5">
                        <button
                          onClick={() => toggleFolder(folder)}
                          className="w-full flex items-center gap-1.5 px-2 py-1 rounded text-slate-400 hover:text-white hover:bg-white/[0.03] text-[11px] font-bold text-left transition-colors cursor-pointer"
                        >
                          {isCollapsed ? <ChevronRight className="w-3 h-3 text-slate-500" /> : <ChevronDown className="w-3 h-3 text-slate-500" />}
                          {isCollapsed ? <Folder className="w-3.5 h-3.5 text-blue-400" /> : <FolderOpen className="w-3.5 h-3.5 text-blue-400" />}
                          <span className="truncate">{folder === 'root' ? prodSlug : folder}</span>
                        </button>

                        {!isCollapsed && (
                          <div className="pl-4 space-y-0.5 border-l border-white/[0.04] ml-3">
                            {folderFiles.map(file => {
                              const isActive = file.id === activeFileId
                              return (
                                <div
                                  key={file.id}
                                  onClick={() => handleOpenFile(file)}
                                  className={`w-full flex items-center justify-between px-2 py-1.5 rounded-lg text-[11px] text-left transition-colors cursor-pointer group ${
                                    isActive
                                      ? 'bg-blue-600/20 text-blue-300 font-bold border border-blue-500/30'
                                      : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.03]'
                                  }`}
                                >
                                  <div className="flex items-center gap-1.5 min-w-0">
                                    {file.name.match(/\.(png|jpg|jpeg|webp|svg|gif|ico|avif)$/i) ? (
                                      <ImageIcon className="w-3.5 h-3.5 text-pink-400 shrink-0" />
                                    ) : (
                                      <FileCode className={`w-3.5 h-3.5 shrink-0 ${
                                        file.name.endsWith('.jsx') || file.name.endsWith('.js')
                                          ? 'text-yellow-400'
                                          : file.name.endsWith('.py')
                                          ? 'text-blue-400'
                                          : file.name.endsWith('.json')
                                          ? 'text-emerald-400'
                                          : file.name.endsWith('.html')
                                          ? 'text-orange-400'
                                          : 'text-purple-400'
                                      }`} />
                                    )}
                                    <span className="truncate">{file.name}</span>
                                  </div>

                                  <div className="flex items-center gap-1">
                                    {file.cloudinaryUrl && (
                                      <Cloud className="w-3 h-3 text-emerald-400/80" title="Synced to Cloudinary" />
                                    )}
                                    {file.modified && (
                                      <span className="w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0"></span>
                                    )}
                                    <button
                                      onClick={(e) => handleDeleteFile(e, file.id)}
                                      className="opacity-0 group-hover:opacity-100 p-0.5 hover:text-red-400 text-slate-500 transition-opacity"
                                      title="Delete file"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </button>
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        )}
                      </div>
                    )
                  })
                )}
              </div>
            </>
          )}

          {activeActivityTab === 'tasks' && (
            <div className="flex-1 flex flex-col p-3 space-y-2 overflow-y-auto">
              <div className="flex items-center justify-between border-b border-white/[0.06] pb-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  SPRINT TASKS
                </span>
                <span className="text-[10px] font-mono text-purple-300 font-bold">
                  {engineeringTasks.length} Tasks
                </span>
              </div>

              <div className="space-y-2">
                {engineeringTasks.map(task => (
                  <div key={task.id} className="p-2.5 rounded-xl bg-[#090b0e] border border-white/[0.06] text-[11px] space-y-1.5">
                    <div className="flex items-start justify-between gap-1.5">
                      <span className="font-bold text-white leading-tight">{task.title}</span>
                    </div>
                    <div className="flex items-center justify-between text-[10px]">
                      <select
                        value={task.assignedTo || 'AI Agent'}
                        onChange={e => handleReassignTask(task.id, e.target.value)}
                        className="px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-300 border border-purple-500/20 text-[9px] font-bold outline-none"
                      >
                        <option value="AI Agent">🤖 AI Agent</option>
                        <option value="Human Engineer">👤 Human</option>
                      </select>
                      <span className="text-slate-500">{task.category}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeActivityTab === 'testing' && (
            <div className="flex-1 p-3 space-y-3 font-mono text-xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                TEST SUITE QUICK STATUS
              </span>
              <div className="p-3 rounded-xl bg-[#090b0e] border border-white/[0.06] space-y-1">
                <div className="text-emerald-400 font-bold">{qaResults?.unitTests?.passed || 0} / 34 Unit Tests</div>
                <div className="text-blue-400 font-bold">{qaResults?.integrationTests?.passed || 0} / 18 Integration</div>
                <div className="text-purple-300 font-bold">{qaResults?.e2eWorkflows?.passed || 0} / 8 E2E Journeys</div>
              </div>
              <button
                onClick={() => setActiveView('qa')}
                className="w-full py-2 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Activity className="w-3.5 h-3.5" />
                <span>Open Test Runner</span>
              </button>
            </div>
          )}
        </div>

        {/* Center Main Viewport */}
        <div className="flex-1 flex flex-col min-w-0 bg-[#090b0e] h-full overflow-hidden">
          {/* 1. CODE EDITOR VIEW */}
          {activeView === 'editor' && (
            <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
              {/* Editor Tabs & HTML Mode Switcher */}
              <div className="h-10 bg-[#0c0e14] border-b border-white/[0.06] flex items-center justify-between px-1 shrink-0">
                <div className="flex items-center h-full overflow-x-auto no-scrollbar">
                  {openTabIds.map(tabId => {
                    const file = files.find(f => f.id === tabId)
                    if (!file) return null
                    const isActive = file.id === activeFileId
                    const isImg = file.name?.match(/\.(png|jpg|jpeg|webp|svg|gif|ico|avif)$/i) || file.category === 'Asset' || file.category === 'Image'
                    return (
                      <div
                        key={file.id}
                        onClick={() => setActiveFileId(file.id)}
                        className={`relative h-full px-3.5 flex items-center gap-2 border-r border-white/[0.06] text-xs font-mono cursor-pointer transition-colors shrink-0 max-w-[210px] ${
                          isActive
                            ? 'bg-[#090b0e] text-white font-bold'
                            : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.02]'
                        }`}
                        title={file.name}
                      >
                        {/* Active Accent Top Line with clean offset */}
                        {isActive && (
                          <div className="absolute top-0 left-0 right-0 h-[2.5px] bg-gradient-to-r from-blue-500 to-indigo-500 shadow-sm shadow-blue-500/40"></div>
                        )}

                        {isImg ? (
                          <ImageIcon className="w-3.5 h-3.5 text-pink-400 shrink-0" />
                        ) : (
                          <FileCode className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                        )}
                        <span className="truncate">{file.name}</span>
                        {file.modified && <span className="w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0"></span>}
                        <button
                          onClick={(e) => handleCloseTab(e, file.id)}
                          className="p-1 rounded hover:bg-white/[0.1] text-slate-500 hover:text-white shrink-0 ml-1"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    )
                  })}
                </div>

                {/* Live Web Sandbox Preview Mode Toggle (Visible for HTML, JS, JSX, CSS, JSON files) */}
                {isWebPreviewable && (
                  <div className="flex items-center gap-1 bg-[#090b0e] p-0.5 rounded-lg border border-white/[0.08] shrink-0 mr-1">
                    <button
                      onClick={() => setHtmlViewMode('code')}
                      className={`px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1 transition-colors cursor-pointer ${
                        htmlViewMode === 'code' ? 'bg-blue-600/20 text-blue-300 border border-blue-500/30' : 'text-slate-400 hover:text-white'
                      }`}
                      title="Show Code Only"
                    >
                      <Code className="w-3 h-3" />
                      <span>Code</span>
                    </button>
                    <button
                      onClick={() => setHtmlViewMode('split')}
                      className={`px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1 transition-colors cursor-pointer ${
                        htmlViewMode === 'split' ? 'bg-blue-600/20 text-blue-300 border border-blue-500/30' : 'text-slate-400 hover:text-white'
                      }`}
                      title="Split Code & Live Sandbox Preview"
                    >
                      <Split className="w-3 h-3" />
                      <span>Split</span>
                    </button>
                    <button
                      onClick={() => setHtmlViewMode('preview')}
                      className={`px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1 transition-colors cursor-pointer ${
                        htmlViewMode === 'preview' ? 'bg-emerald-600/20 text-emerald-300 border border-emerald-500/30' : 'text-slate-400 hover:text-white'
                      }`}
                      title="Live Web Sandbox Preview Only"
                    >
                      <Eye className="w-3 h-3 text-emerald-400" />
                      <span>Live Preview</span>
                    </button>
                  </div>
                )}
              </div>

              {/* If no files exist */}
              {files.length === 0 ? (
                <div className="flex-1 flex items-center justify-center p-8">
                  <div className="max-w-md text-center space-y-4">
                    <div className="w-14 h-14 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center mx-auto shadow-lg shadow-purple-950/40">
                      <Sparkles className="w-7 h-7" />
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-base font-bold text-white">No Codebase Files Yet</h3>
                      <p className="text-xs text-slate-400 leading-relaxed">
                        Start your MVP build by synthesizing a production-grade codebase with Gemini 3.1 Flash Lite or create files manually as a human engineer.
                      </p>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-2 pt-2">
                      <button
                        onClick={handleGenerateFullCodebaseWithAI}
                        disabled={isGeneratingAll}
                        className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-purple-950/40 cursor-pointer active:scale-95 transition-all"
                      >
                        {isGeneratingAll ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin text-purple-200" />
                            <span>Synthesizing Codebase...</span>
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-4 h-4 text-purple-200" />
                            <span>Scaffold Codebase with AI</span>
                          </>
                        )}
                      </button>

                      <button
                        onClick={() => setIsNewFileModalOpen(true)}
                        className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] text-slate-200 hover:text-white font-bold text-xs flex items-center justify-center gap-1.5 border border-white/[0.08] cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>+ Create File Manually</span>
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  {/* AI Copilot Bar (Only for Code / Text / Script files) */}
                  {!isImageFile && (
                    <div className="p-2 bg-[#0e1117] border-b border-white/[0.06] shrink-0">
                      <form onSubmit={handleAiRefactorActiveFile} className="flex items-center gap-2">
                        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-300 text-[10px] font-bold shrink-0">
                          <Sparkles className="w-3 h-3 text-purple-400" />
                          <span>AI Copilot</span>
                        </div>

                        <input
                          type="text"
                          value={aiPromptText}
                          onChange={e => setAiPromptText(e.target.value)}
                          placeholder={`Ask Gemini 3.1 Flash Lite to generate rich code for ${activeFile?.name || 'file'}...`}
                          className="flex-1 px-3 py-1 rounded-lg bg-[#090b0e] border border-white/[0.06] text-xs text-white placeholder-slate-500 outline-none focus:border-purple-500/50 font-mono"
                        />

                        <button
                          type="button"
                          onClick={handleFormatActiveFile}
                          className="px-2.5 py-1 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 hover:text-white border border-white/[0.08] text-[10px] font-bold transition-colors cursor-pointer shrink-0"
                          title="Auto-format and pretty-print code"
                        >
                          Format
                        </button>

                        <button
                          type="submit"
                          disabled={isAiPrompting || !aiPromptText.trim()}
                          className="px-3 py-1 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center gap-1 transition-all disabled:opacity-40 cursor-pointer shrink-0"
                        >
                          {isAiPrompting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                          <span>Generate</span>
                        </button>
                      </form>
                    </div>
                  )}

                  {/* Main Editor / Image Preview Surface */}
                  {isImageFile && (svgViewMode === 'preview' || !activeFile?.name?.toLowerCase().endsWith('.svg')) ? (
                    <div className="flex-1 flex flex-col bg-[#06080a] overflow-hidden relative">
                      {/* Image Viewer Toolbar */}
                      <div className="h-10 bg-[#0c0e14] border-b border-white/[0.06] px-3 flex items-center justify-between text-xs shrink-0 select-none gap-2">
                        <div className="flex items-center gap-2 font-mono min-w-0">
                          <ImageIcon className="w-4 h-4 text-pink-400 shrink-0" />
                          <span className="text-white font-bold text-xs truncate max-w-[200px] sm:max-w-xs md:max-w-md" title={activeFile.name}>
                            {activeFile.name}
                          </span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/[0.06] text-slate-400 uppercase font-mono shrink-0">
                            {activeFile.name.split('.').pop()}
                          </span>
                          {activeFile.cloudinaryUrl && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1 shrink-0">
                              <Cloud className="w-3 h-3 text-emerald-400" />
                              <span className="hidden sm:inline">CDN Synced</span>
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {/* SVG toggle */}
                          {activeFile.name?.toLowerCase().endsWith('.svg') && (
                            <div className="flex items-center bg-[#090b0e] p-0.5 rounded-lg border border-white/[0.08]">
                              <button
                                onClick={() => setSvgViewMode('preview')}
                                className={`px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1 ${
                                  svgViewMode === 'preview' ? 'bg-pink-600/20 text-pink-300 border border-pink-500/30' : 'text-slate-400 hover:text-white'
                                }`}
                              >
                                <Eye className="w-3 h-3" />
                                <span>Image</span>
                              </button>
                              <button
                                onClick={() => setSvgViewMode('code')}
                                className={`px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1 ${
                                  svgViewMode === 'code' ? 'bg-blue-600/20 text-blue-300 border border-blue-500/30' : 'text-slate-400 hover:text-white'
                                }`}
                              >
                                <Code className="w-3 h-3" />
                                <span>SVG Source</span>
                              </button>
                            </div>
                          )}

                          {/* Zoom controls */}
                          <div className="flex items-center bg-[#090b0e] p-0.5 rounded-lg border border-white/[0.08] text-[11px] font-mono">
                            <button
                              onClick={() => setImageZoom(prev => Math.max(25, prev - 25))}
                              className="p-1 rounded text-slate-400 hover:text-white hover:bg-white/[0.06]"
                              title="Zoom Out"
                            >
                              <ZoomOut className="w-3.5 h-3.5" />
                            </button>
                            <span className="px-2 text-[10px] text-slate-300 font-bold min-w-[36px] text-center">{imageZoom}%</span>
                            <button
                              onClick={() => setImageZoom(prev => Math.min(400, prev + 25))}
                              className="p-1 rounded text-slate-400 hover:text-white hover:bg-white/[0.06]"
                              title="Zoom In"
                            >
                              <ZoomIn className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setImageZoom(100)}
                              className="px-1.5 py-0.5 text-[10px] text-slate-400 hover:text-white rounded hover:bg-white/[0.06]"
                              title="Reset Zoom"
                            >
                              Reset
                            </button>
                          </div>

                          {getFileImageSrc(activeFile) && (
                            <button
                              onClick={() => window.open(getFileImageSrc(activeFile), '_blank')}
                              className="p-1.5 rounded hover:bg-white/[0.08] text-slate-400 hover:text-white"
                              title="Open image in new tab"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Image Canvas with Transparency Checkerboard */}
                      <div className="flex-1 overflow-auto flex items-center justify-center p-8 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px] bg-[#07090e]">
                        {getFileImageSrc(activeFile) ? (
                          <div className="flex flex-col items-center justify-center gap-4 transition-transform duration-200" style={{ transform: `scale(${imageZoom / 100})` }}>
                            <img
                              src={getFileImageSrc(activeFile)}
                              alt={activeFile.name}
                              className="max-h-[520px] max-w-full rounded-2xl shadow-2xl object-contain border border-white/[0.1] bg-black/40 backdrop-blur-sm p-2"
                            />
                          </div>
                        ) : (
                          <div className="text-center p-8 border border-dashed border-white/[0.1] rounded-2xl max-w-sm space-y-3">
                            <ImageIcon className="w-10 h-10 text-slate-600 mx-auto" />
                            <div className="space-y-1">
                              <p className="text-xs font-bold text-white">No Image Data</p>
                              <p className="text-[11px] text-slate-400">Provide an image URL, Cloudinary asset, or SVG markup to preview.</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    /* Code Editor Surface / Live Web Sandbox Preview Container */
                    <div className="flex-1 flex overflow-hidden relative">
                      {/* Left: Code Editor (Rendered in 'code' or 'split' mode) */}
                      {(!isWebPreviewable || htmlViewMode === 'code' || htmlViewMode === 'split') && (
                        <div className={`flex font-mono text-xs bg-[#06080a] ${isWebPreviewable && htmlViewMode === 'split' ? 'w-1/2 border-r border-white/[0.08]' : 'w-full'}`}>
                          {/* Line Numbers Column */}
                          <div
                            ref={lineNumbersRef}
                            className="w-12 bg-[#090b0e] text-slate-600 select-none py-3 pr-3 text-right font-mono text-xs border-r border-white/[0.04] overflow-hidden shrink-0"
                          >
                            {(activeFile?.content || '').split('\n').map((_, idx) => (
                              <div key={idx} className="h-6 leading-6 text-[11px] text-slate-600 font-mono select-none">
                                {idx + 1}
                              </div>
                            ))}
                          </div>

                          {/* Editable Code Canvas */}
                          <div className="flex-1 overflow-auto">
                            <textarea
                              ref={textareaRef}
                              onScroll={handleEditorScroll}
                              value={activeFile?.content || ''}
                              onChange={(e) => handleContentChange(e.target.value)}
                              spellCheck={false}
                              className="w-full h-full bg-transparent text-slate-100 font-mono text-xs leading-6 outline-none resize-none border-0 p-3 whitespace-pre overflow-auto font-mono focus:ring-0"
                            />
                          </div>
                        </div>
                      )}

                      {/* Right: Live Sandboxed Web Preview (Supports HTML, React JSX, JS, CSS, JSON) */}
                      {isWebPreviewable && (htmlViewMode === 'preview' || htmlViewMode === 'split') && (
                        <div className={`flex flex-col bg-[#080a0e] ${htmlViewMode === 'preview' ? 'w-full' : 'w-1/2'}`}>
                          {/* Preview Mini Toolbar */}
                          <div className="h-8 bg-[#0c0e14] border-b border-white/[0.06] px-3 flex items-center justify-between text-[11px] font-mono shrink-0">
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0"></span>
                              <span className="text-slate-300 font-bold truncate">Live Sandbox: {activeFile.name}</span>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              {/* Viewport switcher */}
                              <div className="flex items-center bg-[#090b0e] p-0.5 rounded border border-white/[0.06] text-[10px]">
                                <button
                                  onClick={() => setPreviewViewport('desktop')}
                                  className={`p-1 rounded ${previewViewport === 'desktop' ? 'bg-blue-600/20 text-blue-300' : 'text-slate-500 hover:text-white'}`}
                                  title="Desktop (100%)"
                                >
                                  <Monitor className="w-3 h-3" />
                                </button>
                                <button
                                  onClick={() => setPreviewViewport('tablet')}
                                  className={`p-1 rounded ${previewViewport === 'tablet' ? 'bg-blue-600/20 text-blue-300' : 'text-slate-500 hover:text-white'}`}
                                  title="Tablet (768px)"
                                >
                                  <Tablet className="w-3 h-3" />
                                </button>
                                <button
                                  onClick={() => setPreviewViewport('mobile')}
                                  className={`p-1 rounded ${previewViewport === 'mobile' ? 'bg-blue-600/20 text-blue-300' : 'text-slate-500 hover:text-white'}`}
                                  title="Mobile (375px)"
                                >
                                  <Smartphone className="w-3 h-3" />
                                </button>
                              </div>

                              <button
                                onClick={() => {
                                  const compiledDoc = compileSandboxPreviewDocument(activeFile, files)
                                  const blob = new Blob([compiledDoc], { type: 'text/html;charset=utf-8' })
                                  const url = URL.createObjectURL(blob)
                                  window.open(url, '_blank')
                                }}
                                className="p-1 rounded hover:bg-white/[0.06] text-slate-400 hover:text-white"
                                title="Open in external browser window"
                              >
                                <ExternalLink className="w-3 h-3" />
                              </button>
                            </div>
                          </div>

                          {/* Iframe Sandbox Canvas */}
                          <div className="flex-1 p-3 flex items-center justify-center overflow-auto bg-[#040608]">
                            <div
                              className="h-full bg-white rounded-xl shadow-2xl overflow-hidden transition-all duration-300 border border-white/[0.1] relative"
                              style={{
                                width: previewViewport === 'mobile' ? '375px' : previewViewport === 'tablet' ? '768px' : '100%',
                                maxWidth: '100%'
                              }}
                            >
                              <iframe
                                key={`${activeFile.id}-${activeFile.content?.length}`}
                                title={`Preview - ${activeFile.name}`}
                                srcDoc={compileSandboxPreviewDocument(activeFile, files)}
                                sandbox="allow-scripts allow-same-origin allow-modals allow-forms allow-popups"
                                className="w-full h-full border-0 bg-white"
                              />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* 2. REAL AI TASK VERIFICATION & QA TESTING VIEW */}
          {activeView === 'qa' && (
            <div className="p-6 flex-1 overflow-y-auto min-h-0">
              <AutomatedQASuite
                project={project}
                files={files}
                engineeringTasks={engineeringTasks}
                onUpdateTasks={onUpdateTasks}
                onSaveProjectFiles={onSaveProjectFiles}
                showToast={showToast}
              />
            </div>
          )}

          {/* 4. SPRINT TASKS (DIVISION OF LABOR) VIEW */}
          {activeView === 'tasks' && (
            <div className="p-5 space-y-4 flex-1 overflow-y-auto min-h-0">
              <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Layers className="w-4 h-4 text-purple-400" />
                    <span>Sprint Engineering Tasks & Division of Labor</span>
                  </h3>
                  <p className="text-xs text-slate-400">Reassign tasks between AI coding agents and human engineers.</p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleSwitchAllToAI}
                    className="px-3 py-1.5 rounded-xl bg-purple-600/20 text-purple-300 border border-purple-500/30 text-xs font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <Bot className="w-3.5 h-3.5" />
                    <span>Switch All to AI</span>
                  </button>
                  <button
                    onClick={handleAutoDistributeDivisionOfLabor}
                    className="px-3 py-1.5 rounded-xl bg-blue-600/20 text-blue-300 border border-blue-500/30 text-xs font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Auto-Balance</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* AI Agents Column */}
                <div className="p-4 rounded-2xl bg-[#0e1117] border border-purple-500/30 space-y-3">
                  <div className="flex items-center justify-between border-b border-white/[0.06] pb-2">
                    <span className="text-xs font-bold text-white flex items-center gap-1.5">
                      <Bot className="w-3.5 h-3.5 text-purple-400" />
                      <span>AI Coding Agents</span>
                    </span>
                    <span className="text-[10px] font-mono text-purple-300 font-bold">
                      {engineeringTasks.filter(t => t.assignedTo === 'AI Agent').length} Tasks
                    </span>
                  </div>

                  <div className="space-y-2">
                    {engineeringTasks.filter(t => t.assignedTo === 'AI Agent').map(task => (
                      <div key={task.id} className="p-3 rounded-xl bg-[#141720] border border-white/[0.06] text-xs space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <span className="font-bold text-white">{task.title}</span>
                          <select
                            value={task.assignedTo || 'AI Agent'}
                            onChange={e => handleReassignTask(task.id, e.target.value)}
                            className="px-2 py-0.5 rounded bg-purple-500/15 text-purple-300 border border-purple-500/30 text-[9px] font-bold"
                          >
                            <option value="AI Agent">🤖 AI Agent</option>
                            <option value="Human Engineer">👤 Human</option>
                          </select>
                        </div>
                        <p className="text-[11px] text-slate-400 font-mono">{task.notes}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Human Engineers Column */}
                <div className="p-4 rounded-2xl bg-[#0e1117] border border-blue-500/30 space-y-3">
                  <div className="flex items-center justify-between border-b border-white/[0.06] pb-2">
                    <span className="text-xs font-bold text-white flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-blue-400" />
                      <span>Human Engineering Tasks</span>
                    </span>
                    <span className="text-[10px] font-mono text-blue-300 font-bold">
                      {engineeringTasks.filter(t => t.assignedTo === 'Human Engineer').length} Tasks
                    </span>
                  </div>

                  <div className="space-y-2">
                    {engineeringTasks.filter(t => t.assignedTo === 'Human Engineer').map(task => (
                      <div key={task.id} className="p-3 rounded-xl bg-[#141720] border border-white/[0.06] text-xs space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <span className="font-bold text-white">{task.title}</span>
                          <select
                            value={task.assignedTo || 'Human Engineer'}
                            onChange={e => handleReassignTask(task.id, e.target.value)}
                            className="px-2 py-0.5 rounded bg-blue-500/15 text-blue-300 border border-blue-500/30 text-[9px] font-bold"
                          >
                            <option value="Human Engineer">👤 Human</option>
                            <option value="AI Agent">🤖 AI Agent</option>
                          </select>
                        </div>
                        <p className="text-[11px] text-slate-400 font-mono">{task.notes}</p>
                        <div className="flex items-center gap-2 pt-1">
                          <button
                            onClick={() => handleSwitchToAIAndDispatch(task)}
                            disabled={executingTaskId === task.id}
                            className="px-2.5 py-1 rounded-lg bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/30 font-bold text-[10px] flex items-center gap-1 transition-colors cursor-pointer"
                          >
                            <Sparkles className="w-3 h-3 text-purple-400" />
                            <span>Switch to AI & Run</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
