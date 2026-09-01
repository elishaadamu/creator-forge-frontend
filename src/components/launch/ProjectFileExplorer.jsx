import React, { useState, useEffect } from 'react'
import {
  FileText, Database, Code, Plus, Trash2, Download, Save,
  Upload, Copy, Check, Search, FileCode, CheckCircle2,
  Folder, ChevronRight, ChevronDown, File, Image as ImageIcon,
  Video, Eye, FileCheck, RefreshCw, X, Maximize2, ExternalLink,
  Loader2, Cloud, Sparkles, Link, Layers, ZoomIn
} from 'lucide-react'
import { uploadFormFileToCloudinary, deleteMediaFromCloudinary } from '../../services/opsApi'

export default function ProjectFileExplorer({ project, onUpdateProject }) {
  const productName = project?.productName || 'Software Product'

  // Load and sanitize files from project
  const sanitizeFiles = (fileList) => {
    if (!Array.isArray(fileList)) return []
    const legacyMockIds = ['file-prd', 'file-arch', 'file-schema', 'file-api', 'file-dashboard', 'file-campaign', 'file-telemetry']
    return fileList.filter(f => f && !legacyMockIds.includes(f.id))
  }

  const [files, setFiles] = useState(() => sanitizeFiles(project?.projectFiles))
  const [selectedFileId, setSelectedFileId] = useState(() => files[0]?.id || null)
  const [editingContent, setEditingContent] = useState(() => files[0]?.content || '')
  const [isUploading, setIsUploading] = useState(false)
  const [isSavedToast, setIsSavedToast] = useState(false)
  const [copiedCode, setCopiedCode] = useState(false)
  const [copiedUrl, setCopiedUrl] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [imageZoomModal, setImageZoomModal] = useState(false)

  // Keep internal state in sync with parent project.projectFiles
  useEffect(() => {
    if (Array.isArray(project?.projectFiles)) {
      const sanitized = sanitizeFiles(project.projectFiles)
      setFiles(sanitized)
      if (sanitized.length > 0 && (!selectedFileId || !sanitized.some(f => f.id === selectedFileId))) {
        setSelectedFileId(sanitized[0].id)
      }
    }
  }, [project?.projectFiles])

  const selectedFile = files.find(f => f.id === selectedFileId) || files[0] || null

  useEffect(() => {
    if (selectedFile) {
      setEditingContent(selectedFile.content || '')
    }
  }, [selectedFileId, selectedFile])

  // Helper to cleanly shorten long filenames while preserving extension
  const shortenFileName = (name, maxLen = 20) => {
    if (!name) return 'File'
    if (name.length <= maxLen) return name
    const ext = name.includes('.') ? '.' + name.split('.').pop() : ''
    const base = name.includes('.') ? name.slice(0, name.lastIndexOf('.')) : name
    const availableBase = Math.max(maxLen - ext.length - 3, 5)
    return `${base.slice(0, availableBase)}...${ext}`
  }

  // Sync files to PostgreSQL backend and local storage
  const syncFiles = (newFileList) => {
    setFiles(newFileList)
    const updated = {
      ...(project || {}),
      projectFiles: newFileList
    }
    onUpdateProject?.(prev => ({
      ...(prev || {}),
      projectFiles: newFileList
    }))
    try {
      localStorage.setItem('forge_launch_active_project', JSON.stringify(updated))
      window.dispatchEvent(new CustomEvent('forge_project_updated', { detail: updated }))
    } catch (e) {}

    if (project?.id) {
      import('../../services/opsApi').then(({ updateCoLaunchProject }) => {
        updateCoLaunchProject(project.id, {
          projectFiles: newFileList,
          metadataInfo: {
            ...(project?.metadataInfo || {}),
            project_files: newFileList
          }
        }).catch(() => {})
      })
    }
  }

  // Handle Upload of Images, Videos, PDFs, Code, and Docs
  const handleUploadFiles = async (fileList) => {
    const uploadedFiles = Array.from(fileList || [])
    if (uploadedFiles.length === 0) return

    setIsUploading(true)
    const newItems = []

    for (const file of uploadedFiles) {
      const isText = file.type.startsWith('text/') || /\.(js|jsx|ts|tsx|py|sql|json|md|csv|html|css|txt|env|yaml|yml|dart)$/i.test(file.name)
      const isImage = file.type.startsWith('image/') || /\.(png|jpg|jpeg|gif|svg|webp)$/i.test(file.name)
      const isVideo = file.type.startsWith('video/') || /\.(mp4|webm|mov|avi|mkv)$/i.test(file.name)
      const isPdf = file.type === 'application/pdf' || file.name.endsWith('.pdf')
      const ext = file.name.split('.').pop()?.toUpperCase() || 'TXT'

      // Upload to Cloudinary CDN
      try {
        const res = await uploadFormFileToCloudinary(file, 'creator_forge', project?.id)
        if (res?.secure_url) {
          let textContent = res.secure_url
          if (isText) {
            textContent = await file.text()
          }
          newItems.push({
            id: `cld-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
            name: file.name,
            category: isVideo ? 'video' : isImage ? 'image' : isPdf ? 'pdf' : 'code',
            type: ext,
            mimeType: file.type,
            size: `${(file.size / 1024).toFixed(1)} KB`,
            url: res.secure_url,
            optimizeUrl: res.optimize_url || res.secure_url,
            thumbnailUrl: res.thumbnail_url || res.secure_url,
            content: textContent,
            storageProvider: 'Cloudinary CDN',
            updatedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          })
          continue
        }
      } catch (err) {
        console.warn('[Upload] Cloudinary upload fallback to local storage:', err)
      }

      // Fallback local reader
      await new Promise((resolve) => {
        const reader = new FileReader()
        reader.onload = (event) => {
          const content = event.target.result
          const category = isImage ? 'image' : isVideo ? 'video' : isPdf ? 'pdf' : isText ? 'code' : 'document'

          newItems.push({
            id: `upload-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
            name: file.name,
            category,
            type: ext,
            mimeType: file.type || 'application/octet-stream',
            size: `${(file.size / 1024).toFixed(1)} KB`,
            updatedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            content: content,
            url: isImage || isVideo ? content : null,
            storageProvider: 'PostgreSQL DB'
          })
          resolve()
        }

        if (isText) {
          reader.readAsText(file)
        } else {
          reader.readAsDataURL(file)
        }
      })
    }

    setIsUploading(false)
    if (newItems.length > 0) {
      const merged = [...newItems, ...files]
      syncFiles(merged)
      setSelectedFileId(newItems[0].id)
      setIsSavedToast(`Uploaded ${newItems.length} file(s) to cloud storage`)
      setTimeout(() => setIsSavedToast(false), 2500)
    }
  }

  // Save Code or Text changes
  const handleSaveCode = () => {
    if (!selectedFile) return
    const updatedList = files.map(f => {
      if (f.id === selectedFile.id) {
        return {
          ...f,
          content: editingContent,
          size: `${(new Blob([editingContent]).size / 1024).toFixed(1)} KB`,
          updatedAt: 'Saved just now'
        }
      }
      return f
    })
    syncFiles(updatedList)
    setIsSavedToast(`Saved changes to ${selectedFile.name}`)
    setTimeout(() => setIsSavedToast(false), 2000)
  }

  // Copy Text
  const handleCopyCode = () => {
    if (!editingContent) return
    navigator.clipboard?.writeText(editingContent)
    setCopiedCode(true)
    setTimeout(() => setCopiedCode(false), 2000)
  }

  // Copy Cloud URL
  const handleCopyUrl = (url) => {
    if (!url) return
    navigator.clipboard?.writeText(url)
    setCopiedUrl(true)
    setTimeout(() => setCopiedUrl(false), 2000)
  }

  // Download File
  const handleDownloadFile = (f) => {
    const fileUrl = f.url || f.content
    if (fileUrl && fileUrl.startsWith('http') && !['code', 'document'].includes(f.category)) {
      const a = document.createElement('a')
      a.href = fileUrl
      a.target = '_blank'
      a.download = f.name
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      return
    }

    const blob = new Blob([f.content || ''], { type: f.mimeType || 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = f.name
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  // Delete File (removes locally, from database, and from Cloudinary CDN)
  const handleDeleteFile = (id) => {
    const fileToDelete = files.find(f => f.id === id)
    const remaining = files.filter(f => f.id !== id)
    syncFiles(remaining)
    if (selectedFileId === id) {
      setSelectedFileId(remaining[0]?.id || null)
    }

    // If file was uploaded to Cloudinary, destroy it on Cloudinary CDN
    if (fileToDelete) {
      const isCloudinary = fileToDelete.storageProvider?.includes('Cloudinary') || fileToDelete.url?.includes('cloudinary.com') || fileToDelete.id?.startsWith('cld-')
      if (isCloudinary) {
        deleteMediaFromCloudinary({
          publicId: fileToDelete.public_id || (fileToDelete.id?.startsWith('cld-') ? fileToDelete.id.replace('cld-', '') : null),
          url: fileToDelete.url || fileToDelete.content,
          resourceType: fileToDelete.category === 'video' ? 'video' : fileToDelete.category === 'code' ? 'raw' : 'image',
          projectId: project?.id,
          fileId: id
        }).catch(err => console.warn('[Cloudinary] Delete error:', err))

        setIsSavedToast(`Deleted "${shortenFileName(fileToDelete.name, 16)}" from Cloudinary CDN & storage`)
        setTimeout(() => setIsSavedToast(false), 2500)
      } else {
        setIsSavedToast(`Deleted "${shortenFileName(fileToDelete.name, 16)}"`)
        setTimeout(() => setIsSavedToast(false), 2000)
      }
    }
  }

  // Filtered files
  const filteredFiles = files.filter(f => {
    if (searchQuery.trim() && !f.name.toLowerCase().includes(searchQuery.toLowerCase())) return false
    return true
  })

  // Helper to render icon for non-image files
  const getFileIcon = (file) => {
    const type = (file.type || '').toLowerCase()
    const cat = file.category || ''

    if (cat === 'video' || ['mp4', 'webm', 'mov', 'avi'].includes(type)) {
      return <Video className="w-3.5 h-3.5 text-purple-400" />
    }
    if (cat === 'pdf' || type === 'pdf') {
      return <FileText className="w-3.5 h-3.5 text-red-400" />
    }
    if (['py', 'python', 'sql', 'js', 'jsx', 'ts', 'tsx', 'html', 'css', 'json', 'dart'].includes(type)) {
      return <Code className="w-3.5 h-3.5 text-blue-400" />
    }
    return <FileText className="w-3.5 h-3.5 text-emerald-400" />
  }

  const isVideoFile = selectedFile && (selectedFile.category === 'video' || ['mp4', 'webm', 'mov', 'avi'].includes(selectedFile.type?.toLowerCase()))
  const isImageFile = selectedFile && (selectedFile.category === 'image' || ['png', 'jpg', 'jpeg', 'svg', 'webp', 'gif'].includes(selectedFile.type?.toLowerCase()))
  const isPdfFile = selectedFile && (selectedFile.category === 'pdf' || selectedFile.type?.toLowerCase() === 'pdf')
  const lineCount = (editingContent || '').split('\n').length

  return (
    <div className="rounded-2xl bg-[#090b0e] border border-white/[0.08] shadow-xl p-3.5 sm:p-4 space-y-3 font-sans w-full">
      {/* ── 1. COMPACT TOP BAR ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b border-white/[0.06] pb-2.5">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400 shrink-0">
            <Cloud className="w-3.5 h-3.5" />
          </div>
          <h2 className="text-xs sm:text-sm font-extrabold text-white tracking-tight">
            Venture Cloud Explorer
          </h2>
          <span className="px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-300 text-[9px] font-mono font-bold border border-purple-500/30 whitespace-nowrap">
            Cloudinary CDN Synced
          </span>
        </div>

        {/* Upload Button */}
        <label className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-95 shadow-md shadow-purple-950/40 shrink-0">
          {isUploading ? (
            <>
              <Loader2 className="w-3 h-3 animate-spin text-white" />
              <span>Uploading...</span>
            </>
          ) : (
            <>
              <Upload className="w-3 h-3" />
              <span>Upload Media / Code</span>
            </>
          )}
          <input
            type="file"
            onChange={(e) => {
              handleUploadFiles(e.target.files)
              e.target.value = ''
            }}
            disabled={isUploading}
            className="hidden"
            multiple
          />
        </label>
      </div>

      {/* Toast Alert */}
      {isSavedToast && (
        <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-center gap-1.5 font-medium animate-in fade-in">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <span>{isSavedToast}</span>
        </div>
      )}

      {/* ── 2. MAIN WORKSPACE / EMPTY STATE ── */}
      {files.length === 0 ? (
        /* Empty State & Drop Zone */
        <div
          onDragOver={(e) => {
            e.preventDefault()
            setIsDragging(true)
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(e) => {
            e.preventDefault()
            setIsDragging(false)
            if (e.dataTransfer.files) {
              handleUploadFiles(e.dataTransfer.files)
            }
          }}
          className={`p-8 rounded-xl border-2 border-dashed text-center space-y-2.5 transition-all ${
            isDragging
              ? 'border-purple-500 bg-purple-500/10 scale-[1.01]'
              : 'border-white/[0.08] hover:border-white/20 bg-[#141720]/20'
          }`}
        >
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 mx-auto">
            <Cloud className="w-5 h-5" />
          </div>
          <div className="max-w-md mx-auto space-y-0.5">
            <h3 className="font-extrabold text-white text-xs">No Files Stored Yet</h3>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Drag & drop code (<span className="text-blue-400 font-mono">.py, .js, .md, .sql</span>), images, or video clips here.
            </p>
          </div>
          <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1a1f2c] hover:bg-[#252c3f] text-slate-200 hover:text-white border border-white/[0.1] text-xs font-bold cursor-pointer transition-all">
            <Plus className="w-3 h-3 text-purple-400" />
            <span>Select Files to Upload</span>
            <input
              type="file"
              onChange={(e) => {
                handleUploadFiles(e.target.files)
                e.target.value = ''
              }}
              className="hidden"
              multiple
            />
          </label>
        </div>
      ) : (
        /* ── 2-COLUMN COMPACT LAYOUT ── */
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 min-h-[420px]">
          {/* ── LEFT FILE LIST (COMPACT & SLEEK) ── */}
          <div className="md:col-span-5 lg:col-span-4 rounded-xl bg-[#0e1117] border border-white/[0.06] p-2.5 flex flex-col justify-between overflow-hidden shadow-md">
            <div className="overflow-y-auto space-y-1.5 pr-1 flex-1 max-h-[380px]">
              {/* Compact Search Bar */}
              <div className="relative mb-1.5">
                <Search className="w-3 h-3 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filter files..."
                  className="w-full bg-[#141720] border border-white/[0.08] focus:border-purple-500/50 rounded-lg pl-7 pr-2.5 py-1 text-xs text-white placeholder-slate-500 focus:outline-none transition-colors"
                />
              </div>

              {filteredFiles.map(file => {
                const isSelected = selectedFile?.id === file.id
                const isImage = file.category === 'image' || ['png', 'jpg', 'jpeg', 'svg', 'webp', 'gif'].includes((file.type || '').toLowerCase())

                return (
                  <div
                    key={file.id}
                    onClick={() => setSelectedFileId(file.id)}
                    className={`group px-2.5 py-2 rounded-xl border flex items-center justify-between gap-2 text-xs transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-purple-600/20 border-purple-500/50 text-white shadow-xs'
                        : 'bg-[#141720]/80 border-white/[0.04] text-slate-300 hover:bg-[#1a1f2c] hover:text-white'
                    }`}
                    title={file.name}
                  >
                    {/* Left: Thumbnail or File Icon Badge */}
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      {isImage ? (
                        <div className="w-7 h-7 rounded-lg overflow-hidden border border-white/10 shrink-0 bg-black/40 flex items-center justify-center">
                          <img
                            src={file.thumbnailUrl || file.url || file.content}
                            alt={file.name}
                            className="w-full h-full object-cover"
                            onError={(e) => { e.target.style.display = 'none' }}
                          />
                        </div>
                      ) : (
                        <div className="w-7 h-7 rounded-lg bg-white/[0.04] border border-white/[0.08] flex items-center justify-center shrink-0">
                          {getFileIcon(file)}
                        </div>
                      )}

                      {/* Middle: Filename and Compact Size Inline */}
                      <div className="min-w-0 flex-1">
                        <span className="font-semibold text-xs text-slate-100 group-hover:text-white block truncate">
                          {shortenFileName(file.name, 16)}
                        </span>
                        <div className="flex items-center gap-1 text-[10px] text-slate-400 font-mono">
                          <span>{file.size}</span>
                          <span>•</span>
                          <span className="text-purple-300 font-bold uppercase">{file.type || 'FILE'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Right: Compact Download & Delete Buttons */}
                    <div className="flex items-center gap-1 shrink-0 opacity-80 group-hover:opacity-100 transition-opacity">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDownloadFile(file)
                        }}
                        className="p-1 rounded-md hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                        title={`Download ${file.name}`}
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDeleteFile(file.id)
                        }}
                        className="p-1 rounded-md hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition-colors"
                        title={`Delete ${file.name}`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* List Footer */}
            <div className="pt-2 border-t border-white/[0.06] text-[10px] text-slate-400 flex items-center justify-between font-mono">
              <span>{filteredFiles.length} file{filteredFiles.length !== 1 ? 's' : ''}</span>
              <span className="text-emerald-400 flex items-center gap-1 font-semibold">
                <Check className="w-2.5 h-2.5" />
                <span>Synced</span>
              </span>
            </div>
          </div>

          {/* ── RIGHT VIEWER & EDITOR PANE ── */}
          <div className="md:col-span-7 lg:col-span-8 rounded-xl bg-[#0e1117] border border-white/[0.06] flex flex-col overflow-hidden shadow-md min-w-0">
            {selectedFile ? (
              <>
                {/* Header Bar */}
                <div className="bg-[#141720] px-3.5 py-2 border-b border-white/[0.06] flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <span
                      className="text-white font-bold text-xs truncate max-w-[180px] sm:max-w-xs"
                      title={selectedFile.name}
                    >
                      {selectedFile.name}
                    </span>
                    <span className="px-1.5 py-0.2 rounded bg-white/[0.06] text-purple-300 font-mono text-[9px] font-bold uppercase shrink-0">
                      {selectedFile.type || 'FILE'}
                    </span>
                    {selectedFile.storageProvider && (
                      <span className="px-1.5 py-0.2 rounded bg-purple-500/10 text-purple-400 font-mono text-[9px] font-medium border border-purple-500/20 shrink-0 hidden sm:inline">
                        {selectedFile.storageProvider}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {/* Actions for Code/Text */}
                    {!isImageFile && !isVideoFile && !isPdfFile && (
                      <>
                        <button
                          type="button"
                          onClick={handleCopyCode}
                          className="px-2 py-1 rounded-lg bg-white/[0.06] hover:bg-white/[0.1] text-slate-200 text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer active:scale-95"
                        >
                          {copiedCode ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                          <span>{copiedCode ? 'Copied' : 'Copy'}</span>
                        </button>

                        <button
                          type="button"
                          onClick={handleSaveCode}
                          className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1 shadow-sm transition-all cursor-pointer active:scale-95"
                        >
                          <Save className="w-3 h-3" />
                          <span>Save</span>
                        </button>
                      </>
                    )}

                    {/* Copy Public CDN URL */}
                    {selectedFile.url && selectedFile.url.startsWith('http') && (
                      <button
                        type="button"
                        onClick={() => handleCopyUrl(selectedFile.url)}
                        className="px-2 py-1 rounded-lg bg-white/[0.06] hover:bg-white/[0.1] text-slate-200 text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer active:scale-95"
                        title="Copy CDN Link"
                      >
                        {copiedUrl ? <Check className="w-3 h-3 text-emerald-400" /> : <Link className="w-3 h-3" />}
                        <span>{copiedUrl ? 'Copied!' : 'Copy Link'}</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => handleDownloadFile(selectedFile)}
                      className="px-2 py-1 rounded-lg bg-white/[0.06] hover:bg-white/[0.1] text-slate-200 text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer active:scale-95"
                      title="Download Asset"
                    >
                      <Download className="w-3 h-3" />
                      <span>Download</span>
                    </button>
                  </div>
                </div>

                {/* Content Canvas */}
                <div className="flex-1 flex flex-col justify-center overflow-hidden bg-[#0a0d12]">
                  {/* Image Viewer */}
                  {isImageFile ? (
                    <div className="flex-1 p-3 sm:p-4 flex flex-col items-center justify-center overflow-auto space-y-2 bg-[radial-gradient(#1f2430_1px,transparent_1px)] [background-size:16px_16px]">
                      <div className="relative group max-h-[260px] max-w-full rounded-xl overflow-hidden border border-white/10 shadow-xl bg-[#11141d] p-1.5 flex items-center justify-center">
                        <img
                          src={selectedFile.url || selectedFile.content}
                          alt={selectedFile.name}
                          className="max-h-[230px] max-w-full object-contain rounded-lg shadow-md transition-transform group-hover:scale-[1.01]"
                        />
                        <button
                          type="button"
                          onClick={() => setImageZoomModal(true)}
                          className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/75 hover:bg-black text-white backdrop-blur-md opacity-0 group-hover:opacity-100 transition-opacity"
                          title="Zoom Full Size"
                        >
                          <ZoomIn className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Image Details Bar */}
                      <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono bg-[#141720] px-2.5 py-1 rounded-lg border border-white/[0.06] max-w-full truncate">
                        <span className="text-white font-bold truncate" title={selectedFile.name}>
                          {shortenFileName(selectedFile.name, 26)}
                        </span>
                        <span>•</span>
                        <span>{selectedFile.size}</span>
                        <span>•</span>
                        <span className="text-purple-300 font-bold">{selectedFile.type}</span>
                      </div>
                    </div>
                  ) : isVideoFile ? (
                    /* Video Stream Player */
                    <div className="flex-1 p-3 sm:p-4 flex flex-col items-center justify-center overflow-auto space-y-2">
                      <div className="max-h-[280px] w-full max-w-xl rounded-xl overflow-hidden border border-white/10 shadow-xl bg-black flex items-center justify-center">
                        <video
                          src={selectedFile.url || selectedFile.content}
                          controls
                          className="max-h-[250px] w-full rounded-lg"
                        />
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono bg-[#141720] px-2.5 py-1 rounded-lg border border-white/[0.06]">
                        <span className="text-white font-bold truncate" title={selectedFile.name}>
                          {shortenFileName(selectedFile.name, 26)}
                        </span>
                        <span>•</span>
                        <span>{selectedFile.size}</span>
                      </div>
                    </div>
                  ) : isPdfFile ? (
                    /* PDF Viewer / Preview */
                    <div className="flex-1 p-4 flex flex-col items-center justify-center overflow-auto space-y-2 text-center">
                      <div className="w-12 h-12 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 shadow-lg">
                        <FileText className="w-6 h-6" />
                      </div>
                      <div className="space-y-0.5 max-w-md">
                        <h4 className="text-xs font-bold text-white truncate" title={selectedFile.name}>
                          {selectedFile.name}
                        </h4>
                        <p className="text-[10px] text-slate-400 font-mono">PDF Document • {selectedFile.size}</p>
                      </div>
                      <div className="flex items-center gap-1.5 pt-1">
                        <button
                          type="button"
                          onClick={() => handleDownloadFile(selectedFile)}
                          className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-red-950/40 cursor-pointer"
                        >
                          <Download className="w-3 h-3" />
                          <span>Download PDF</span>
                        </button>
                        {selectedFile.url && selectedFile.url.startsWith('http') && (
                          <a
                            href={selectedFile.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-1.5 rounded-lg bg-white/[0.06] hover:bg-white/[0.1] text-slate-200 font-bold text-xs flex items-center gap-1"
                          >
                            <ExternalLink className="w-3 h-3" />
                            <span>Open</span>
                          </a>
                        )}
                      </div>
                    </div>
                  ) : (
                    /* Code / Markdown / Text Editor */
                    <div className="flex-1 flex overflow-hidden">
                      {/* Gutter */}
                      <div className="w-9 bg-[#0d1017] border-r border-white/[0.04] p-2 text-right text-[10px] font-mono text-slate-600 select-none overflow-hidden leading-relaxed">
                        {Array.from({ length: Math.max(lineCount, 14) }, (_, i) => (
                          <div key={i + 1}>{i + 1}</div>
                        ))}
                      </div>

                      {/* Textarea */}
                      <div className="flex-1 p-2.5 overflow-hidden">
                        <textarea
                          value={editingContent}
                          onChange={(e) => setEditingContent(e.target.value)}
                          className="w-full h-full bg-transparent text-slate-200 font-mono text-xs leading-relaxed border-none focus:outline-none resize-none selection:bg-purple-600/30 overflow-auto"
                          spellCheck={false}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer Bar */}
                <div className="bg-[#141720] px-3.5 py-1 border-t border-white/[0.06] flex items-center justify-between text-[10px] text-slate-400 font-mono">
                  <span>
                    {isImageFile ? 'Preview' : isVideoFile ? 'Video Stream' : isPdfFile ? 'PDF Document' : `${lineCount} lines`} • {selectedFile.size}
                  </span>
                  <span className="text-emerald-400 font-medium flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span>Cloud Ready</span>
                  </span>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-slate-500 text-xs">
                Select a file from the list to preview or edit
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── 3. FULL SIZE IMAGE ZOOM MODAL ── */}
      {imageZoomModal && selectedFile && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-4 animate-in fade-in">
          <div className="absolute top-5 right-5 flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleDownloadFile(selectedFile)}
              className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-bold flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download</span>
            </button>
            <button
              type="button"
              onClick={() => setImageZoomModal(false)}
              className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="max-w-4xl max-h-[85vh] p-2 bg-[#141720] rounded-2xl border border-white/10 shadow-2xl flex items-center justify-center">
            <img
              src={selectedFile.url || selectedFile.content}
              alt={selectedFile.name}
              className="max-h-[80vh] max-w-full object-contain rounded-xl"
            />
          </div>
          <span className="text-xs text-slate-400 font-mono mt-2">
            {selectedFile.name} • {selectedFile.size}
          </span>
        </div>
      )}
    </div>
  )
}
