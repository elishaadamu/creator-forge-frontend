import { useState, useRef, useEffect } from 'react'
import { useForge } from '../../App'
import { Sparkles, Send, X, ChevronDown, Copy, Check, Calendar, FileText, Minus } from 'lucide-react'
import { hasGeminiKey, askForgeChat } from '../../services/ai'

const SUGGESTED_PROMPTS = [
  'What should I post today?',
  'Write my launch posts for this week',
  'Give me 10 promo hooks',
  'Write a welcome post for my community',
  'Turn this into an email',
  'What should I prioritize this week?',
  'Give me a 7-day launch sequence',
  'Rewrite this for TikTok',
  'How should I position this offer?',
  'Create posts for Instagram, X, and LinkedIn',
]

const FORGE_RESPONSES = {
  'What should I post today?': `Here's what I'd do today:

**Priority 1 - Launch teaser (Instagram Reel, 30s)**
Your audience hasn't seen a direct CTA in 6 days. A quick "something big is coming" clip will prime the algorithm and warm your list.

**Priority 2 - Behind-the-scenes (Stories)**
3-5 slides showing what you're building. Low effort, high trust.

**Priority 3 - Twitter thread**
"5 things I wish I knew before building a creator business" - this angle performs well for your niche. Ends with a soft CTA to your product.

Want me to write any of these?`,

  'Give me 10 promo hooks': `Here are 10 hooks for your launch:

1. "I spent 2 years figuring this out so you don't have to."
2. "Most creators are doing this backwards."
3. "What if you could build a business around what you already know?"
4. "I finally built the thing I kept wishing existed."
5. "Your audience is already ready to pay you - here's how to ask."
6. "This took me from 0 to $8K/month in 60 days."
7. "Stop posting more. Start building once."
8. "I'm opening [Product] to 100 people this week only."
9. "The creator math that actually makes sense."
10. "Posting content is the job. This is the business."

Want me to turn any of these into a full post?`,

  'Give me a 7-day launch sequence': `Here's your 7-day launch sequence:

**Day 1 - Tease**
Post a cryptic "something's coming" story/reel. Link drops Friday.

**Day 2 - Problem**
Share the problem your audience faces that your product solves. No CTA yet.

**Day 3 - Behind the scenes**
Show a sneak peek. Behind-the-scenes video works best here.

**Day 4 - Social proof**
Share a testimonial or early result. If you don't have one yet, share your own story.

**Day 5 - Launch day**
Drop the product. 4 posts minimum - Stories, feed, email, community.

**Day 6 - Objection handling**
"FAQ: everything you asked about [Product]."

**Day 7 - Final push**
"Last chance" or "24 hours left for founding member pricing."

Want me to write the copy for each day?`,

  'default': `I'm on it. Give me a moment to craft this for your audience and product...

Here's what I'd suggest based on your niche and platform mix:

Your audience responds best to authentic, behind-the-scenes content paired with clear value propositions. For this prompt, I'd lean into your unique angle as someone who's been through the exact transformation your audience wants.

Would you like me to:
- Write a full draft?
- Give you multiple variations?
- Adapt this for a specific platform?`,
}

function Message({ msg, onActionClick }) {
  const [copied, setCopied] = useState(false)
  const isForge = msg.role === 'forge'

  const handleCopy = () => {
    navigator.clipboard.writeText(msg.content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // Render markdown-ish bold
  const renderContent = (text) => {
    return text.split('\n').map((line, i) => {
      const boldified = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      return (
        <p key={i}
          className="leading-relaxed"
          style={{ marginBottom: line === '' ? '8px' : '2px', fontSize: '13px', color: isForge ? 'rgba(255,255,255,0.72)' : '#0c0c0c' }}
          dangerouslySetInnerHTML={{ __html: boldified }}
        />
      )
    })
  }

  return (
    <div className={`flex gap-3 ${isForge ? '' : 'flex-row-reverse'}`}>
      {isForge && (
        <div className="w-6 h-6 rounded-lg bg-white flex items-center justify-center flex-shrink-0 mt-0.5">
          <Sparkles size={11} className="text-black" />
        </div>
      )}
      <div className={`flex-1 max-w-[85%] ${isForge ? '' : 'flex flex-col items-end'}`}>
        <div
          className="rounded-2xl px-4 py-3 group relative"
          style={{
            background: isForge ? '#1a1a1a' : 'white',
            borderRadius: isForge ? '4px 18px 18px 18px' : '18px 4px 18px 18px',
          }}
        >
          <div>{renderContent(msg.content)}</div>

          {/* Copy button for Forge messages */}
          {isForge && (
            <button
              onClick={handleCopy}
              className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 px-2 py-1 rounded-lg text-[10px]"
              style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.4)' }}
            >
              {copied ? <Check size={10} /> : <Copy size={10} />}
              {copied ? 'Copied' : 'Copy'}
            </button>
          )}
        </div>

        {/* Action buttons for forge messages */}
        {isForge && msg.actions && (
          <div className="flex gap-2 mt-2 flex-wrap">
            {msg.actions.map(action => (
              <button
                key={action}
                onClick={() => onActionClick && onActionClick(action)}
                className="text-[11px] px-2.5 py-1 rounded-full transition-all duration-150"
                style={{ background: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.45)', border: '1px solid rgba(255,255,255,0.07)' }}
                onMouseEnter={e => { e.target.style.background = 'rgba(255,255,255,0.12)'; e.target.style.color = 'rgba(255,255,255,0.8)' }}
                onMouseLeave={e => { e.target.style.background = 'rgba(255,255,255,0.07)'; e.target.style.color = 'rgba(255,255,255,0.45)' }}
              >
                {action}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function TypingIndicator() {
  return (
    <div className="flex gap-3">
      <div className="w-6 h-6 rounded-lg bg-white flex items-center justify-center flex-shrink-0">
        <Sparkles size={11} className="text-black" />
      </div>
      <div className="rounded-2xl px-4 py-3 flex items-center gap-1.5" style={{ background: '#1a1a1a', borderRadius: '4px 18px 18px 18px' }}>
        {[0, 1, 2].map(i => (
          <div
            key={i}
            className="w-1.5 h-1.5 rounded-full animate-pulse"
            style={{ background: 'rgba(255,255,255,0.4)', animationDelay: `${i * 0.15}s` }}
          />
        ))}
      </div>
    </div>
  )
}

export default function ForgeChat({ isOpen, onClose }) {
  const { creatorData, incrementAiActions } = useForge()
  const [messages, setMessages] = useState([
    {
      role: 'forge',
      content: `Hey ${creatorData.handle || '@creator'} - I'm Forge.\n\nI'm here to help you run your creator business. Ask me anything: what to post, how to launch, what to write, what to prioritize.\n\nWhat do you need?`,
      actions: ['Write my launch posts', 'What to post today?', 'Give me hooks'],
    },
  ])
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const endRef = useRef(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isTyping])

  const sendMessage = async (text) => {
    const msg = text || input.trim()
    if (!msg) return
    setInput('')
    if (incrementAiActions) incrementAiActions()
    
    const currentMessages = [...messages, { role: 'user', content: msg }]
    setMessages(currentMessages)
    setIsTyping(true)

    try {
      const response = await askForgeChat(msg, messages, creatorData)
      setIsTyping(false)
      setMessages(prev => [
        ...prev,
        {
          role: 'forge',
          content: response,
          actions: ['Write full draft', 'Save to calendar', 'Adapt for all platforms'],
        },
      ])
    } catch (err) {
      console.error('[Forge] Chat AI error:', err)
      setIsTyping(false)
      const fallback = FORGE_RESPONSES[msg] || FORGE_RESPONSES['default']
      setMessages(prev => [
        ...prev,
        {
          role: 'forge',
          content: `*(Note: Live AI failed, using fallback)*\n\n${fallback}`,
          actions: ['Write full draft', 'Save to calendar', 'Adapt for all platforms'],
        },
      ])
    }
  }

  if (!isOpen) return null

  if (isMinimized) {
    return (
      <div
        className="fixed bottom-6 right-6 flex flex-col border shadow-2xl z-50 overflow-hidden cursor-pointer group hover:-translate-y-1 transition-transform"
        style={{
          width: '240px',
          borderColor: 'rgba(255,255,255,0.1)',
          background: '#0c0c0c',
          borderRadius: '12px',
        }}
        onClick={() => setIsMinimized(false)}
      >
        <div className="flex items-center justify-between px-4 py-3 bg-[rgba(255,255,255,0.02)] group-hover:bg-[rgba(255,255,255,0.04)] transition-colors">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded flex items-center justify-center bg-white">
              <Sparkles size={10} className="text-black" />
            </div>
            <span className="text-[13px] font-semibold text-white">Forge Chat</span>
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); onClose() }}
            className="w-6 h-6 rounded-full flex items-center justify-center transition-all"
            style={{ color: 'rgba(255,255,255,0.3)' }}
            onMouseEnter={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.6)' }}
            onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.3)' }}
          >
            <X size={12} />
          </button>
        </div>
      </div>
    )
  }

  return (
    <div
      className="flex flex-col border-l"
      style={{
        width: '360px',
        borderColor: 'rgba(255,255,255,0.07)',
        background: '#0c0c0c',
        flexShrink: 0,
      }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-5 py-4 border-b flex-shrink-0"
        style={{ borderColor: 'rgba(255,255,255,0.07)' }}
      >
        <div className="flex items-center gap-2.5">
          <div className="w-6 h-6 rounded-lg bg-white flex items-center justify-center">
            <Sparkles size={11} className="text-black" />
          </div>
          <span className="text-[14px] font-semibold text-white">Forge</span>
          <span
            className="text-[10px] px-2 py-0.5 rounded-full font-medium"
            style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.4)' }}
          >
            AI
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setIsMinimized(true)}
            className="w-7 h-7 rounded-full flex items-center justify-center transition-all duration-150"
            style={{ color: 'rgba(255,255,255,0.3)' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; e.currentTarget.style.color = 'rgba(255,255,255,0.6)' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.3)' }}
          >
            <Minus size={14} />
          </button>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full flex items-center justify-center transition-all duration-150"
            style={{ color: 'rgba(255,255,255,0.3)' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; e.currentTarget.style.color = 'rgba(255,255,255,0.6)' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.3)' }}
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.map((msg, i) => (
          <Message key={i} msg={msg} onActionClick={setInput} />
        ))}
        {isTyping && <TypingIndicator />}
        <div ref={endRef} />
      </div>

      {/* Suggested prompts */}
      <div
        className="px-4 py-2 border-t overflow-x-auto no-scrollbar"
        style={{ borderColor: 'rgba(255,255,255,0.06)' }}
      >
        <div className="flex gap-2 pb-1">
          {SUGGESTED_PROMPTS.slice(0, 5).map(p => (
            <button
              key={p}
              onClick={() => sendMessage(p)}
              className="flex-shrink-0 text-[11px] px-3 py-1.5 rounded-full transition-all duration-150 whitespace-nowrap"
              style={{
                background: 'rgba(255,255,255,0.06)',
                color: 'rgba(255,255,255,0.45)',
                border: '1px solid rgba(255,255,255,0.07)',
              }}
              onMouseEnter={e => { e.target.style.background = 'rgba(255,255,255,0.1)'; e.target.style.color = 'rgba(255,255,255,0.8)' }}
              onMouseLeave={e => { e.target.style.background = 'rgba(255,255,255,0.06)'; e.target.style.color = 'rgba(255,255,255,0.45)' }}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Input */}
      <div
        className="px-4 pb-4 flex-shrink-0"
        style={{ paddingTop: '8px' }}
      >
        <div
          className="flex items-end gap-2 rounded-2xl border px-4 py-3 transition-all duration-200 focus-within:border-white/20"
          style={{ background: '#151515', borderColor: 'rgba(255,255,255,0.08)' }}
        >
          <textarea
            className="forge-input flex-1 text-[13px] resize-none"
            style={{ minHeight: '20px', maxHeight: '100px', lineHeight: '1.5', background: 'transparent', color: 'white' }}
            placeholder="Ask Forge anything..."
            value={input}
            onChange={e => {
              setInput(e.target.value)
              e.target.style.height = 'auto'
              e.target.style.height = Math.min(e.target.scrollHeight, 100) + 'px'
            }}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                sendMessage()
              }
            }}
            rows={1}
          />
          <button
            onClick={() => sendMessage()}
            disabled={!input.trim() || isTyping}
            className="w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-150 disabled:opacity-30"
            style={{ background: input.trim() ? 'white' : 'rgba(255,255,255,0.1)' }}
          >
            <Send size={12} className={input.trim() ? 'text-black' : 'text-white/40'} />
          </button>
        </div>
      </div>
    </div>
  )
}
