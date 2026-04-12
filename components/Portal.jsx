'use client'
/* TSF Board Portal */

import { useState, useMemo, useEffect, useCallback } from 'react'
import {
  Search,
  Users,
  ChevronRight,
  ChevronLeft,
  Building2,
  Mail,
  Phone,
  LayoutDashboard,
  FileText,
  BookOpen,
  ChevronDown,
  ExternalLink,
  Shield,
  Target,
  Loader2,
  MapPin,
  Globe,
  Download,
} from 'lucide-react'

// ─── ERROR BOUNDARY ─────────────────────────────────────────────────────
import React from 'react'

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }
  componentDidCatch(error, info) {
    console.error('Portal error:', error, info)
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '3rem', textAlign: 'center', maxWidth: '500px', margin: '4rem auto' }}>
          <h2 style={{ color: '#6B1D38', marginBottom: '1rem' }}>Something went wrong</h2>
          <p style={{ color: '#6b7280', marginBottom: '1.5rem' }}>
            An unexpected error occurred. Please try refreshing the page.
          </p>
          <button onClick={() => window.location.reload()} style={{
            padding: '0.5rem 1.5rem', backgroundColor: '#6B1D38', color: 'white',
            border: 'none', borderRadius: '0.375rem', cursor: 'pointer', fontSize: '0.9rem',
          }}>
            Refresh Page
          </button>
        </div>
      )
    }
    return this.props.children
  }
}

// ─── CONSTANTS ──────────────────────────────────────────────────────────

const committeeConfig = [
  {
    key: 'board',
    name: 'Board of Directors',
    color: '#6B1D38',
    icon: '📋',
    description: 'Full board meetings held 2nd Tuesday of every other month at 6:30 PM',
    notionUrl: 'https://www.notion.so/32a84a2d469081908551e314d9377091',
  },
  {
    key: 'executive',
    name: 'Executive',
    color: '#2A4D6E',
    icon: '🔵',
    description: 'Executive committee of board leadership',
    notionUrl: 'https://www.notion.so/32a84a2d469081d085aad5c8119e3d16',
  },
  {
    key: 'governance',
    name: 'Governance',
    color: '#B8860B',
    icon: '🟤',
    description: 'Board governance, bylaws, and member development',
    notionUrl: 'https://www.notion.so/32a84a2d469081cb8209fd2f43b8c4d6',
  },
  {
    key: 'finance',
    name: 'Finance & Investment',
    color: '#1A6B4A',
    icon: '🟢',
    description: 'Oversees financial management and investments',
    notionUrl: 'https://www.notion.so/32a84a2d469081da9b84c0493ba83575',
  },
  {
    key: 'fundraising',
    name: 'Fundraising',
    color: '#8B4513',
    icon: '⚪',
    description: 'Fundraising strategy and donor engagement',
    notionUrl: 'https://www.notion.so/32a84a2d469081a5a2b4effe5bf762b4',
  },
  {
    key: 'shcp',
    name: 'Student Home Construction',
    color: '#4A6741',
    icon: '🟡',
    description: 'Student home construction program oversight',
    notionUrl: 'https://www.notion.so/32a84a2d469081089910eeb3329fd212',
  },
]

const BYLAWS_PAGE_ID = '33484a2d-4690-80e3-b5a9-d01377e16519'
const STRATEGIC_PLAN_PAGE_ID = '32a84a2d-4690-81e8-ba32-cea4fc59a5e1'

const FOUNDATIONAL_DOCS_NOTION_URL = 'https://www.notion.so/Foundational-Documents-33b84a2d4690816493d2e0f50f25c440'

// Reference documents are now fetched dynamically from the Foundational Documents
// Notion page via fetchFoundationalDocs() in the API. The data is passed as
// the `foundationalDocs` prop, which is an array of { name, items[] } categories.
// Each item has: { name, type: 'file'|'page', fileUrl?, pageId? }


const quorumTable = [
  { size: '14-15 members', quorum: 8 },
  { size: '16-17 members', quorum: 9 },
  { size: '18-19 members', quorum: 10 },
]

// Committee name mapping: Notion names → portal committeeConfig names
const committeeNameMap = {
  'Board of Directors': 'Board of Directors',
  'Executive Committee': 'Executive',
  'Finance Committee': 'Finance & Investment',
  'Fundraising Committee': 'Fundraising',
  'Governance Committee': 'Governance',
  'Student Home Construction Committee': 'Student Home Construction',
}

// Map portal committee display names → Notion "Committee Roles" property values
const chairRoleMap = {
  Executive: 'Executive Committee Chair',
  Governance: 'Governance Committee Chair',
  'Finance & Investment': 'Finance Committee Chair',
  Fundraising: 'Fundraising Committee Chair',
  'Student Home Construction': 'Home Construction Committee Chair',
}

function getMemberCommittees(member) {
  if (!member.committees) return []
  return member.committees.map(c => committeeNameMap[c] || c)
}

// ─── UTILITY FUNCTIONS ──────────────────────────────────────────────────

function parseLocalDate(dateString) {
  if (!dateString) return null
  // Notion dates like '2026-04-14' are date-only (no time). new Date() parses
  // them as UTC midnight, which shifts back a day in US timezones. Split and
  // construct as local to avoid the off-by-one.
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    const [y, m, d] = dateString.split('-').map(Number)
    return new Date(y, m - 1, d)
  }
  return new Date(dateString)
}

function formatDate(dateString) {
  if (!dateString) return ''
  const date = parseLocalDate(dateString)
  if (!date || isNaN(date.getTime())) return ''
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function getNextMeeting(meetings) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const futureMeetings = meetings.filter(m => m.date && parseLocalDate(m.date) >= today)
  if (futureMeetings.length === 0) return null
  return futureMeetings[futureMeetings.length - 1]
}

function sortBoardMembers(members) {
  const officerOrder = { President: 1, 'Vice President': 2, Secretary: 3, Treasurer: 4 }
  return [...members].sort((a, b) => {
    const aRank = officerOrder[a.officerRole] || 99
    const bRank = officerOrder[b.officerRole] || 99
    if (aRank !== bRank) return aRank - bRank
    return (a.last || a.name || '').localeCompare(b.last || b.name || '')
  })
}

// Sort committee members: chair first, then alpha by last name
function sortCommitteeMembers(members, committeeName) {
  const chairRole = chairRoleMap[committeeName]
  return [...members].sort((a, b) => {
    const aIsChair = chairRole && (a.committeeRoles || []).includes(chairRole)
    const bIsChair = chairRole && (b.committeeRoles || []).includes(chairRole)
    if (aIsChair && !bIsChair) return -1
    if (!aIsChair && bIsChair) return 1
    return (a.last || a.name || '').localeCompare(b.last || b.name || '')
  })
}

function getCommitteeMembers(committeeName, boardMembers) {
  return boardMembers.filter(m => getMemberCommittees(m).includes(committeeName))
}

function daysUntil(dateString) {
  if (!dateString) return Infinity
  const target = parseLocalDate(dateString)
  if (!target || isNaN(target.getTime())) return Infinity
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  target.setHours(0, 0, 0, 0)
  return Math.ceil((target - now) / (1000 * 60 * 60 * 24))
}

// ─── SMALL COMPONENTS ───────────────────────────────────────────────────

function Badge({ text, color }) {
  return (
    <span style={{
      display: 'inline-block', padding: '0.25rem 0.75rem',
      backgroundColor: color + '20', color: color,
      borderRadius: '9999px', fontSize: '0.75rem', fontWeight: '600',
      border: `1px solid ${color}40`,
    }}>
      {text}
    </span>
  )
}

function StatCard({ icon: Icon, title, value, color }) {
  return (
    <div style={{
      backgroundColor: 'white', borderRadius: '0.5rem', padding: '1.5rem',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)', display: 'flex', alignItems: 'center', gap: '1rem',
    }}>
      <div style={{
        width: '3rem', height: '3rem', borderRadius: '0.5rem',
        backgroundColor: color + '20', display: 'flex', alignItems: 'center',
        justifyContent: 'center', color: color,
      }}>
        <Icon size={20} />
      </div>
      <div>
        <p style={{ color: '#6b7280', fontSize: '0.875rem', margin: 0 }}>{title}</p>
        <p style={{ fontSize: '2rem', fontWeight: '700', color: '#1f2937', margin: '0.25rem 0 0 0' }}>{value}</p>
      </div>
    </div>
  )
}

function SectionLabel({ children }) {
  return (
    <div style={{
      padding: '0.5rem 1rem', marginTop: '0.75rem',
      fontSize: '0.65rem', fontWeight: '700', letterSpacing: '0.1em',
      textTransform: 'uppercase', color: 'rgba(255,255,255,0.45)',
    }}>
      {children}
    </div>
  )
}

function SidebarNavItem({ label, icon: Icon, active, onClick, indent }) {
  return (
    <button onClick={onClick} style={{
      width: '100%', padding: indent ? '0.5rem 1rem 0.5rem 2.5rem' : '0.6rem 1rem',
      display: 'flex', alignItems: 'center', gap: '0.6rem',
      backgroundColor: active ? 'rgba(212,168,67,0.15)' : 'transparent',
      border: 'none', borderLeft: active ? '3px solid #D4A843' : '3px solid transparent',
      fontSize: indent ? '0.8rem' : '0.85rem', fontWeight: active ? '600' : '400',
      color: active ? '#D4A843' : 'rgba(255,255,255,0.75)',
      cursor: 'pointer', transition: 'all 0.15s', textAlign: 'left',
    }}
    onMouseEnter={e => { if (!active) e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)' }}
    onMouseLeave={e => { if (!active) e.currentTarget.style.backgroundColor = 'transparent' }}
    >
      {Icon && <Icon size={indent ? 14 : 16} />}
      {label}
    </button>
  )
}

function LoadingSpinner() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '3rem' }}>
      <Loader2 size={32} style={{ animation: 'spin 1s linear infinite', color: '#6B1D38' }} />
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

// ─── NOTION BLOCK RENDERER ──────────────────────────────────────────────

function RichText({ segments }) {
  if (!segments || segments.length === 0) return null
  return (
    <>
      {segments.map((seg, i) => {
        let el = seg.content
        if (seg.bold) el = <strong key={i}>{el}</strong>
        if (seg.italic) el = <em key={`i${i}`}>{el}</em>
        if (seg.underline) el = <u key={`u${i}`}>{el}</u>
        if (seg.code) el = <code key={`c${i}`} style={{ backgroundColor: '#f3f4f6', padding: '0.125rem 0.375rem', borderRadius: '0.25rem', fontSize: '0.85em' }}>{el}</code>
        if (seg.href) el = <a key={`a${i}`} href={seg.href} target="_blank" rel="noopener noreferrer" style={{ color: '#6B1D38', textDecoration: 'underline' }}>{el}</a>
        return <span key={i}>{el}</span>
      })}
    </>
  )
}

function NotionBlocks({ blocks }) {
  if (!blocks || blocks.length === 0) return <p style={{ color: '#9ca3af', fontStyle: 'italic' }}>No content available.</p>

  return (
    <div>
      {blocks.map((block, idx) => {
        switch (block.type) {
          case 'paragraph':
            return <p key={idx} style={{ margin: '0.5rem 0', fontSize: '0.9rem', color: '#374151', lineHeight: '1.6' }}><RichText segments={block.text} /></p>
          case 'heading_1':
            return <h1 key={idx} style={{ fontSize: '1.5rem', fontWeight: '700', color: '#1f2937', margin: '1.5rem 0 0.75rem 0', borderBottom: '2px solid #e5e7eb', paddingBottom: '0.5rem' }}><RichText segments={block.text} /></h1>
          case 'heading_2':
            return <h2 key={idx} style={{ fontSize: '1.25rem', fontWeight: '600', color: '#1f2937', margin: '1.25rem 0 0.5rem 0' }}><RichText segments={block.text} /></h2>
          case 'heading_3':
            return <h3 key={idx} style={{ fontSize: '1.1rem', fontWeight: '600', color: '#374151', margin: '1rem 0 0.5rem 0' }}><RichText segments={block.text} /></h3>
          case 'bulleted_list_item':
            return (
              <div key={idx} style={{ display: 'flex', gap: '0.5rem', margin: '0.25rem 0', paddingLeft: '1rem' }}>
                <span style={{ color: '#6B1D38', fontWeight: '700' }}>•</span>
                <div style={{ fontSize: '0.9rem', color: '#374151', lineHeight: '1.6', flex: 1 }}>
                  <RichText segments={block.text} />
                  {block.children && block.children.length > 0 && (
                    <div style={{ paddingLeft: '0.5rem', marginTop: '0.25rem' }}>
                      <NotionBlocks blocks={block.children} />
                    </div>
                  )}
                </div>
              </div>
            )
          case 'numbered_list_item':
            return (
              <div key={idx} style={{ display: 'flex', gap: '0.5rem', margin: '0.25rem 0', paddingLeft: '1rem' }}>
                <span style={{ color: '#6B1D38', fontWeight: '600', minWidth: '1.25rem' }}>{idx + 1}.</span>
                <div style={{ fontSize: '0.9rem', color: '#374151', lineHeight: '1.6', flex: 1 }}>
                  <RichText segments={block.text} />
                  {block.children && block.children.length > 0 && (
                    <div style={{ paddingLeft: '0.5rem', marginTop: '0.25rem' }}>
                      <NotionBlocks blocks={block.children} />
                    </div>
                  )}
                </div>
              </div>
            )
          case 'to_do':
            return (
              <div key={idx} style={{ display: 'flex', gap: '0.5rem', margin: '0.25rem 0', paddingLeft: '1rem', alignItems: 'flex-start' }}>
                <input type="checkbox" checked={block.checked} readOnly style={{ marginTop: '0.25rem' }} />
                <span style={{ fontSize: '0.9rem', color: block.checked ? '#9ca3af' : '#374151', textDecoration: block.checked ? 'line-through' : 'none' }}><RichText segments={block.text} /></span>
              </div>
            )
          case 'toggle':
            return <ToggleBlock key={idx} block={block} />
          case 'callout':
            return (
              <div key={idx} style={{ display: 'flex', gap: '0.75rem', padding: '1rem', backgroundColor: '#fdf2f5', borderRadius: '0.375rem', margin: '0.75rem 0', border: '1px solid #f3d6de' }}>
                <span style={{ fontSize: '1.25rem' }}>{block.icon}</span>
                <div style={{ fontSize: '0.9rem', color: '#374151', lineHeight: '1.6', flex: 1 }}>
                  <RichText segments={block.text} />
                  {block.children && <NotionBlocks blocks={block.children} />}
                </div>
              </div>
            )
          case 'quote':
            return (
              <blockquote key={idx} style={{ borderLeft: '3px solid #6B1D38', paddingLeft: '1rem', margin: '0.75rem 0', color: '#4b5563', fontStyle: 'italic', fontSize: '0.9rem' }}>
                <RichText segments={block.text} />
              </blockquote>
            )
          case 'divider':
            return <hr key={idx} style={{ border: 'none', borderTop: '1px solid #e5e7eb', margin: '1rem 0' }} />
          case 'file':
          case 'pdf':
            return block.fileUrl ? (
              <div key={idx} style={{ margin: '0.5rem 0', padding: '0.75rem 1rem', backgroundColor: '#f9fafb', borderRadius: '0.375rem', border: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <FileText size={18} style={{ color: '#6B1D38', flexShrink: 0 }} />
                <a href={block.fileUrl} target="_blank" rel="noopener noreferrer" style={{ color: '#6B1D38', textDecoration: 'none', fontWeight: '500', fontSize: '0.9rem' }}>
                  {block.fileName || 'Download File'}
                </a>
              </div>
            ) : null
          case 'image':
            return block.imageUrl ? (
              <div key={idx} style={{ margin: '0.75rem 0' }}>
                <img src={block.imageUrl} alt={block.caption || ''} style={{ maxWidth: '100%', borderRadius: '0.375rem', border: '1px solid #e5e7eb' }} />
                {block.caption && <p style={{ fontSize: '0.8rem', color: '#9ca3af', marginTop: '0.25rem', textAlign: 'center' }}>{block.caption}</p>}
              </div>
            ) : null
          case 'bookmark':
          case 'embed':
            return block.url ? (
              <a key={idx} href={block.url} target="_blank" rel="noopener noreferrer" style={{ display: 'block', margin: '0.5rem 0', padding: '0.75rem 1rem', backgroundColor: '#f9fafb', borderRadius: '0.375rem', border: '1px solid #e5e7eb', color: '#6B1D38', textDecoration: 'none', fontSize: '0.9rem' }}>
                {block.caption || block.url}
                <ExternalLink size={14} style={{ marginLeft: '0.5rem', display: 'inline' }} />
              </a>
            ) : null
          case 'table':
            return (
              <div key={idx} style={{ margin: '0.75rem 0', overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                  <tbody>
                    {block.children?.map((row, rIdx) => (
                      <tr key={rIdx} style={{ borderBottom: '1px solid #e5e7eb' }}>
                        {row.cells?.map((cell, cIdx) => {
                          const Tag = (rIdx === 0 && block.hasColumnHeader) || (cIdx === 0 && block.hasRowHeader) ? 'th' : 'td'
                          return <Tag key={cIdx} style={{ padding: '0.5rem 0.75rem', textAlign: 'left', fontWeight: Tag === 'th' ? '600' : '400', backgroundColor: Tag === 'th' ? '#f9fafb' : 'white', color: '#374151' }}>{cell}</Tag>
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          case 'transcription':
            return (
              <div key={idx} style={{ margin: '1.5rem 0', borderTop: '2px solid #6B1D38', paddingTop: '1rem' }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: '700', color: '#6B1D38', margin: '0 0 1rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <FileText size={20} /> Meeting Minutes
                </h2>
                {block.text && block.text.length > 0 && (
                  <p style={{ fontSize: '0.85rem', color: '#6b7280', margin: '0 0 1rem 0', fontStyle: 'italic' }}><RichText segments={block.text} /></p>
                )}
                {block.children && block.children.length > 0 && <NotionBlocks blocks={block.children} />}
                {(!block.children || block.children.length === 0) && (
                  <p style={{ color: '#9ca3af', fontStyle: 'italic', fontSize: '0.9rem' }}>Meeting minutes are being prepared.</p>
                )}
              </div>
            )
          case 'child_page':
            return (
              <div key={idx} style={{ margin: '0.5rem 0', padding: '0.5rem 1rem', backgroundColor: '#f9fafb', borderRadius: '0.375rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', color: '#374151' }}>
                <FileText size={16} /> {block.childTitle || 'Subpage'}
              </div>
            )
          case 'child_database':
            return (
              <div key={idx} style={{ margin: '0.5rem 0', padding: '0.5rem 1rem', backgroundColor: '#f0f7ff', borderRadius: '0.375rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', color: '#374151' }}>
                <Building2 size={16} /> {block.childTitle || 'Database'}
              </div>
            )
          default:
            return null
        }
      })}
    </div>
  )
}

function ToggleBlock({ block }) {
  const [open, setOpen] = useState(false)
  return (
    <div style={{ margin: '0.5rem 0' }}>
      <button onClick={() => setOpen(!open)} style={{
        display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'none',
        border: 'none', cursor: 'pointer', fontSize: '0.9rem', fontWeight: '500',
        color: '#374151', padding: '0.25rem 0',
      }}>
        <ChevronRight size={16} style={{ transform: open ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.15s' }} />
        <RichText segments={block.text} />
      </button>
      {open && block.children && (
        <div style={{ paddingLeft: '1.5rem', marginTop: '0.25rem' }}>
          <NotionBlocks blocks={block.children} />
        </div>
      )}
    </div>
  )
}

// ─── MEMBER COMPONENTS ──────────────────────────────────────────────────

function MemberCard({ member, onSelect }) {
  return (
    <div onClick={onSelect} style={{
      backgroundColor: 'white', borderRadius: '0.5rem', padding: '1.5rem',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)', cursor: 'pointer',
      transition: 'all 0.2s', border: '1px solid #e5e7eb',
    }}
    onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 4px 6px rgba(0,0,0,0.1)'; e.currentTarget.style.borderColor = '#6B1D38' }}
    onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)'; e.currentTarget.style.borderColor = '#e5e7eb' }}
    >
      <div style={{ marginBottom: '1rem' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: '600', color: '#1f2937', margin: '0 0 0.5rem 0' }}>{member.name}</h3>
        {member.position && member.position.length > 0 && (
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {member.position.map((pos, idx) => <Badge key={idx} text={pos} color="#2A4D6E" />)}
          </div>
        )}
      </div>
      {member.employer && <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: '0.5rem 0' }}><strong>Employer:</strong> {member.employer}</p>}
      {member.email && <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: '0.5rem 0', display: 'flex', alignItems: 'center', gap: '0.4rem' }}><Mail size={14} /> <a href={`mailto:${member.email}`} style={{ color: '#6b7280', textDecoration: 'none' }}>{member.email}</a></p>}
      {member.cell && <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: '0.5rem 0', display: 'flex', alignItems: 'center', gap: '0.4rem' }}><Phone size={14} /> <a href={`tel:${member.cell}`} style={{ color: '#6b7280', textDecoration: 'none' }}>{member.cell}</a></p>}
    </div>
  )
}

function MemberDetailModal({ member, committees, onClose }) {
  if (!member) return null
  const memberCommitteeList = committees.filter(c => getMemberCommittees(member).includes(c.name))

  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }} onClick={onClose}>
      <div style={{ backgroundColor: 'white', borderRadius: '0.5rem', padding: '2rem', maxWidth: '600px', width: '90%', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 25px rgba(0,0,0,0.15)' }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1.5rem' }}>
          <div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: '700', color: '#1f2937', margin: 0 }}>{member.name}</h2>
            {member.position?.length > 0 && (
              <div style={{ marginTop: '0.75rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                {member.position.map((pos, idx) => <Badge key={idx} text={pos} color="#2A4D6E" />)}
              </div>
            )}
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#6b7280' }}>×</button>
        </div>

        {/* Contact */}
        <div style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ fontSize: '0.875rem', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase', marginBottom: '0.75rem' }}>Contact Information</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            {member.email && <div><p style={{ fontSize: '0.75rem', color: '#9ca3af', margin: '0 0 0.25rem 0' }}>Email</p><a href={`mailto:${member.email}`} style={{ fontSize: '0.875rem', color: '#6B1D38', textDecoration: 'none' }}>{member.email}</a></div>}
            {member.cell && <div><p style={{ fontSize: '0.75rem', color: '#9ca3af', margin: '0 0 0.25rem 0' }}>Cell Phone</p><a href={`tel:${member.cell}`} style={{ fontSize: '0.875rem', color: '#6B1D38', textDecoration: 'none' }}>{member.cell}</a></div>}
          </div>
        </div>

        {/* Professional */}
        {(member.employer || member.title || member.city || member.state) && (
          <div style={{ marginBottom: '1.5rem' }}>
            <h3 style={{ fontSize: '0.875rem', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase', marginBottom: '0.75rem' }}>Professional</h3>
            <div style={{ display: 'grid', gap: '0.5rem' }}>
              {member.employer && <p style={{ fontSize: '0.875rem', color: '#374151', margin: 0 }}><strong>Employer:</strong> {member.employer}</p>}
              {member.title && <p style={{ fontSize: '0.875rem', color: '#374151', margin: 0 }}><strong>Job Title:</strong> {member.title}</p>}
              {(member.city || member.state) && <p style={{ fontSize: '0.875rem', color: '#374151', margin: 0 }}><strong>Location:</strong> {member.city}{member.city && member.state && ', '}{member.state}</p>}
            </div>
          </div>
        )}

        {/* Board Service */}
        {(member.termStart || member.termEnd || member.termCount) && (
          <div style={{ marginBottom: '1.5rem' }}>
            <h3 style={{ fontSize: '0.875rem', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase', marginBottom: '0.75rem' }}>Board Service</h3>
            <div style={{ display: 'grid', gap: '0.5rem' }}>
              {member.termStart && <p style={{ fontSize: '0.875rem', color: '#374151', margin: 0 }}><strong>Term Start:</strong> {formatDate(member.termStart)}</p>}
              {member.termEnd && <p style={{ fontSize: '0.875rem', color: '#374151', margin: 0 }}><strong>Term End:</strong> {formatDate(member.termEnd)}</p>}
              {member.termCount && <p style={{ fontSize: '0.875rem', color: '#374151', margin: 0 }}><strong>Term Count:</strong> {member.termCount}</p>}
            </div>
          </div>
        )}

        {/* Committees */}
        {memberCommitteeList.length > 0 && (
          <div style={{ marginBottom: '1.5rem' }}>
            <h3 style={{ fontSize: '0.875rem', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase', marginBottom: '0.75rem' }}>Committees</h3>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {memberCommitteeList.map(c => <Badge key={c.key} text={c.name} color={c.color} />)}
            </div>
          </div>
        )}

        {/* Additional Info */}
        {(member.pronouns || member.alumni || member.alumniYear) && (
          <div style={{ marginBottom: '1.5rem' }}>
            <h3 style={{ fontSize: '0.875rem', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase', marginBottom: '0.75rem' }}>Additional Information</h3>
            <div style={{ display: 'grid', gap: '0.5rem' }}>
              {member.pronouns && <p style={{ fontSize: '0.875rem', color: '#374151', margin: 0 }}><strong>Pronouns:</strong> {member.pronouns}</p>}
              {member.alumni && <p style={{ fontSize: '0.875rem', color: '#374151', margin: 0 }}><strong>Status:</strong> Alumni{member.alumniYear && ` (${member.alumniYear})`}</p>}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── HOOK: Fetch Notion Page Content ────────────────────────────────────

function useNotionPage(pageId) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!pageId) return
    let cancelled = false
    setLoading(true)
    setError(null)
    fetch(`/api/notion-page?id=${pageId}`)
      .then(r => {
        if (!r.ok) throw new Error(`Failed to load page (${r.status})`)
        return r.json()
      })
      .then(d => { if (!cancelled) { setData(d); setLoading(false) } })
      .catch(e => { if (!cancelled) { setError(e.message); setLoading(false) } })
    return () => { cancelled = true }
  }, [pageId])

  return { data, loading, error }
}

// Extract Notion page ID from URL (e.g., "https://www.notion.so/33484a2d4690806ebaf3f1b430496b32" -> "33484a2d4690806ebaf3f1b430496b32")
function extractNotionPageId(notionUrl) {
  if (!notionUrl) return null
  const match = notionUrl.match(/notion\.so\/([a-zA-Z0-9]+)/)
  return match ? match[1] : null
}

// ─── PAGE: Dashboard ────────────────────────────────────────────────────

function DashboardPage({ meetings, boardMembers, actionPlan, onNavigate }) {

  return (
    <div>
      <h1 style={{ fontSize: '2rem', fontWeight: '700', color: '#1f2937', marginBottom: '0.5rem' }}>Dashboard</h1>

      {/* Mission Statement */}
      <div style={{ backgroundColor: 'white', borderRadius: '0.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', padding: '1.5rem', marginBottom: '2rem', borderLeft: '4px solid #D4A843' }}>
        <p style={{ fontSize: '1rem', lineHeight: '1.7', color: '#1f2937', fontStyle: 'italic', margin: 0 }}>
          The Thaddeus Stevens Foundation supports the mission of Thaddeus Stevens College of Technology by raising funds and managing resources to provide scholarships, enhance educational programs, and improve campus facilities for students pursuing technical education.
        </p>
      </div>

      {/* Strategic Action Plan — directly below mission */}
      {actionPlan && actionPlan.length > 0 && (() => {
        const goalOrder = ['Goal 1: Raise $5M Annually', 'Goal 2: Board Excellence', 'Goal 3: Three-Board Collaboration', 'Goal 4: SHCP 10-Year Plan']
        const grouped = {}
        actionPlan.forEach(item => {
          const g = item.goal || 'Other'
          if (!grouped[g]) grouped[g] = []
          grouped[g].push(item)
        })
        const sortedGoals = Object.keys(grouped).sort((a, b) => {
          const ai = goalOrder.indexOf(a)
          const bi = goalOrder.indexOf(b)
          return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi)
        })
        const statusBadge = (status) => {
          if (status === 'Done') return { bg: '#dcfce7', color: '#166534', border: '#86efac' }
          if (status === 'In progress') return { bg: '#dbeafe', color: '#1e40af', border: '#93c5fd' }
          return { bg: '#f3f4f6', color: '#6b7280', border: '#d1d5db' }
        }
        const goalColors = ['#6B1D38', '#2A4D6E', '#D4A843', '#4a7c59']
        return (
          <div style={{ backgroundColor: 'white', borderRadius: '0.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', overflow: 'hidden', marginBottom: '2rem' }}>
            <div style={{ backgroundColor: '#2A4D6E', color: 'white', padding: '1rem', fontSize: '0.875rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Target size={16} /> Strategic Action Plan 2024-2027
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem', tableLayout: 'fixed' }}>
                <colgroup>
                  <col style={{ width: '22%' }} />
                  <col style={{ width: '10%' }} />
                  <col style={{ width: '15%' }} />
                  <col style={{ width: '25%' }} />
                  <col style={{ width: '28%' }} />
                </colgroup>
                <thead>
                  <tr style={{ backgroundColor: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                    <th style={{ textAlign: 'left', padding: '0.5rem 1rem', fontWeight: '600', color: '#6b7280', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.03em' }}>Action Item</th>
                    <th style={{ textAlign: 'center', padding: '0.5rem 0.75rem', fontWeight: '600', color: '#6b7280', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.03em' }}>Status</th>
                    <th style={{ textAlign: 'left', padding: '0.5rem 0.75rem', fontWeight: '600', color: '#6b7280', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.03em' }}>Owner</th>
                    <th style={{ textAlign: 'left', padding: '0.5rem 0.75rem', fontWeight: '600', color: '#6b7280', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.03em' }}>Objective</th>
                    <th style={{ textAlign: 'left', padding: '0.5rem 0.75rem', fontWeight: '600', color: '#6b7280', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.03em' }}>Progress Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedGoals.map((goal, gi) => {
                    const items = grouped[goal]
                    const doneCount = items.filter(i => i.status === 'Done').length
                    const inProgressCount = items.filter(i => i.status === 'In progress').length
                    const total = items.length
                    const gColor = goalColors[gi % goalColors.length]
                    return [
                      <tr key={`goal-${gi}`}>
                        <td colSpan={5} style={{ padding: '0.75rem 1rem', backgroundColor: gColor + '0A', borderTop: gi > 0 ? '2px solid #e5e7eb' : 'none' }}>
                          <span style={{ fontSize: '0.9rem', fontWeight: '700', color: gColor }}>{goal}</span>
                        </td>
                      </tr>,
                      ...items.map((item, idx) => {
                        const badge = statusBadge(item.status)
                        return (
                          <tr key={item.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                            <td style={{ padding: '0.6rem 1rem', fontWeight: '500', color: '#1f2937', lineHeight: '1.4', verticalAlign: 'top' }}>
                              {item.actionItem}
                            </td>
                            <td style={{ padding: '0.6rem 0.75rem', textAlign: 'center', verticalAlign: 'top' }}>
                              <span style={{
                                display: 'inline-block', padding: '0.2rem 0.5rem', borderRadius: '999px',
                                fontSize: '0.7rem', fontWeight: '600',
                                backgroundColor: badge.bg, color: badge.color, border: `1px solid ${badge.border}`,
                                whiteSpace: 'nowrap',
                              }}>{item.status || 'Not started'}</span>
                            </td>
                            <td style={{ padding: '0.6rem 0.75rem', color: '#374151', verticalAlign: 'top', fontSize: '0.78rem' }}>
                              {item.owner || '-'}
                            </td>
                            <td style={{ padding: '0.6rem 0.75rem', color: '#6b7280', verticalAlign: 'top', fontSize: '0.78rem', lineHeight: '1.4' }}>
                              {item.objective || '-'}
                            </td>
                            <td style={{ padding: '0.6rem 0.75rem', color: '#9ca3af', verticalAlign: 'top', fontSize: '0.78rem', fontStyle: 'italic', lineHeight: '1.4' }}>
                              {item.progressNotes || '-'}
                            </td>
                          </tr>
                        )
                      })
                    ]
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )
      })()}

      {/* Upcoming & Past Meetings */}
      {(() => {
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        const upcoming = meetings.filter(m => m.date && parseLocalDate(m.date) >= today).reverse()
        const past = meetings.filter(m => m.date && parseLocalDate(m.date) < today).slice(0, 6)

        return (
          <>
            {upcoming.length > 0 && (
              <div style={{ backgroundColor: 'white', borderRadius: '0.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', overflow: 'hidden', marginBottom: '2rem' }}>
                <div style={{ backgroundColor: '#6B1D38', color: 'white', padding: '1rem', fontSize: '0.875rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Upcoming Meetings
                </div>
                <div>
                  {upcoming.map(meeting => (
                    <div key={meeting.id} style={{ padding: '0.75rem 1rem', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <h4 style={{ fontSize: '0.9rem', fontWeight: '600', color: '#1f2937', margin: '0 0 0.15rem 0' }}>{meeting.title}</h4>
                        <p style={{ fontSize: '0.8rem', color: '#6b7280', margin: 0 }}>{formatDate(meeting.date)}</p>
                      </div>
                      <button onClick={() => onNavigate('meeting-detail', { meetingId: meeting.id, meetingTitle: meeting.title, published: meeting.published })} style={{
                        padding: '0.4rem 0.75rem', backgroundColor: '#fdf2f5', border: '1px solid #6B1D3840',
                        borderRadius: '0.375rem', fontSize: '0.8rem', fontWeight: '500', color: '#6B1D38',
                        cursor: 'pointer', whiteSpace: 'nowrap',
                      }}>
                        View Agenda & Minutes
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {past.length > 0 && (
              <div style={{ backgroundColor: 'white', borderRadius: '0.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
                <div style={{ backgroundColor: '#2A4D6E', color: 'white', padding: '1rem', fontSize: '0.875rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Past Meetings
                </div>
                <div>
                  {past.map(meeting => (
                    <div key={meeting.id} style={{ padding: '0.75rem 1rem', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <h4 style={{ fontSize: '0.9rem', fontWeight: '600', color: '#1f2937', margin: '0 0 0.15rem 0' }}>{meeting.title}</h4>
                        <p style={{ fontSize: '0.8rem', color: '#6b7280', margin: 0 }}>{formatDate(meeting.date)}</p>
                      </div>
                      <button onClick={() => onNavigate('meeting-detail', { meetingId: meeting.id, meetingTitle: meeting.title, published: meeting.published })} style={{
                        padding: '0.4rem 0.75rem', backgroundColor: '#f9fafb', border: '1px solid #d1d5db',
                        borderRadius: '0.375rem', fontSize: '0.8rem', fontWeight: '500', color: '#374151',
                        cursor: 'pointer', whiteSpace: 'nowrap',
                      }}>
                        View Agenda & Minutes
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )
      })()}
    </div>
  )
}

// ─── PAGE: Committee Meetings ───────────────────────────────────────────

function CommitteeMeetingsPage({ committee, meetings, boardMembers, onNavigate }) {
  const committeeMeetings = meetings.filter(m => m.committee === committee.name)
  const nextMeeting = getNextMeeting(committeeMeetings)
  const now = new Date(); now.setHours(0, 0, 0, 0)
  const pastMeetings = committeeMeetings.filter(m => !m.date || parseLocalDate(m.date) < now)
  const futureMeetings = committeeMeetings.filter(m => m.date && parseLocalDate(m.date) >= now).reverse()
  const members = getCommitteeMembers(committee.name, boardMembers)

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
        <span style={{ fontSize: '1.75rem' }}>{committee.icon}</span>
        <h1 style={{ fontSize: '2rem', fontWeight: '700', color: '#1f2937', margin: 0 }}>{committee.name}</h1>
      </div>
      <p style={{ color: '#6b7280', marginBottom: '2rem', fontSize: '0.9rem' }}>{committee.description}</p>

      {/* Committee Members */}
      {members.length > 0 && (
        <div style={{ backgroundColor: 'white', borderRadius: '0.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', padding: '1.25rem', marginBottom: '2rem' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: '600', color: '#1f2937', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Users size={18} style={{ color: committee.color }} /> Committee Members ({members.length})
          </h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            {sortCommitteeMembers(members, committee.name).map(m => {
              const isChair = (m.committeeRoles || []).includes(chairRoleMap[committee.name])
              return (
                <span key={m.id} style={{
                  padding: '0.35rem 0.75rem', backgroundColor: isChair ? committee.color + '15' : '#f9fafb',
                  borderRadius: '0.25rem', fontSize: '0.85rem', color: '#374151',
                  border: `1px solid ${isChair ? committee.color + '40' : '#e5e7eb'}`,
                  fontWeight: isChair ? '600' : '400',
                }}>
                  {m.name}{isChair ? ' (Chair)' : ''}
                </span>
              )
            })}
          </div>
        </div>
      )}

      {/* Next Meeting Banner */}
      {nextMeeting && (
        <div style={{ backgroundColor: committee.color + '10', border: `1px solid ${committee.color}30`, borderRadius: '0.5rem', padding: '1.25rem', marginBottom: '2rem', borderLeft: `4px solid ${committee.color}` }}>
          <p style={{ fontSize: '0.7rem', color: committee.color, fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.35rem' }}>Next Meeting</p>
          <h3 style={{ fontSize: '1.1rem', fontWeight: '600', color: '#1f2937', margin: '0 0 0.5rem 0' }}>{nextMeeting.title}</h3>
          <p style={{ fontSize: '0.85rem', color: '#6b7280', margin: '0 0 0.75rem 0' }}>{formatDate(nextMeeting.date)}</p>
          <button onClick={() => onNavigate('meeting-detail', { meetingId: nextMeeting.id, meetingTitle: nextMeeting.title, published: nextMeeting.published })} style={{
            padding: '0.5rem 1rem', backgroundColor: committee.color, color: 'white',
            border: 'none', borderRadius: '0.375rem', fontSize: '0.85rem', fontWeight: '600', cursor: 'pointer',
          }}>
            View Agenda & Documents
          </button>
        </div>
      )}

      {/* Upcoming Meetings */}
      {futureMeetings.length > 0 && (
        <div style={{ backgroundColor: 'white', borderRadius: '0.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', overflow: 'hidden', marginBottom: '2rem' }}>
          <div style={{ backgroundColor: committee.color, color: 'white', padding: '0.75rem 1rem', fontSize: '0.8rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Upcoming Meetings ({futureMeetings.length})
          </div>
          {futureMeetings.map(m => (
            <div key={m.id} style={{ padding: '0.75rem 1rem', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.15rem' }}>
                  <h4 style={{ fontSize: '0.9rem', fontWeight: '600', color: '#1f2937', margin: 0 }}>{m.title}</h4>
                </div>
                <p style={{ fontSize: '0.8rem', color: '#6b7280', margin: 0 }}>{formatDate(m.date)}</p>
              </div>
              <button onClick={() => onNavigate('meeting-detail', { meetingId: m.id, meetingTitle: m.title, published: m.published })} style={{
                padding: '0.4rem 0.75rem', backgroundColor: m.published ? '#f9fafb' : '#f9fafb', border: '1px solid #d1d5db',
                borderRadius: '0.375rem', fontSize: '0.8rem', fontWeight: '500', color: '#374151', cursor: 'pointer',
              }}>
                View Agenda & Minutes
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Past Meetings */}
      <div style={{ backgroundColor: 'white', borderRadius: '0.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
        <div style={{ backgroundColor: '#4b5563', color: 'white', padding: '0.75rem 1rem', fontSize: '0.8rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Past Meetings ({pastMeetings.length})
        </div>
        {pastMeetings.length === 0 ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: '#9ca3af' }}>No past meetings found.</div>
        ) : (
          pastMeetings.slice(0, 20).map(m => (
            <div key={m.id} style={{ padding: '0.75rem 1rem', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.15rem' }}>
                  <h4 style={{ fontSize: '0.9rem', fontWeight: '600', color: '#1f2937', margin: 0 }}>{m.title}</h4>
                </div>
                <p style={{ fontSize: '0.8rem', color: '#6b7280', margin: 0 }}>{formatDate(m.date)}</p>
              </div>
              <button onClick={() => onNavigate('meeting-detail', { meetingId: m.id, meetingTitle: m.title, published: m.published })} style={{
                padding: '0.4rem 0.75rem', backgroundColor: '#f9fafb', border: '1px solid #d1d5db',
                borderRadius: '0.375rem', fontSize: '0.8rem', fontWeight: '500', color: '#374151', cursor: 'pointer',
              }}>
                View Agenda & Minutes
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

// ─── PAGE: Meeting Detail ───────────────────────────────────────────────

function MeetingDetailPage({ meetingId, meetingTitle, published, onBack }) {
  const { data, loading, error } = useNotionPage(published ? meetingId : null)

  return (
    <div>
      <button onClick={onBack} style={{
        display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
        background: 'none', border: 'none', color: '#6B1D38', fontSize: '0.875rem',
        fontWeight: '500', cursor: 'pointer', marginBottom: '1rem', padding: '0.25rem 0',
      }}>
        <ChevronLeft size={16} /> Back to Meetings
      </button>

      <h1 style={{ fontSize: '1.75rem', fontWeight: '700', color: '#1f2937', marginBottom: '1.5rem' }}>{meetingTitle || 'Meeting Details'}</h1>

      {!published ? (
        <div style={{ backgroundColor: 'white', borderRadius: '0.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', padding: '2.5rem', textAlign: 'center' }}>
          <FileText size={40} style={{ color: '#d1d5db', marginBottom: '1rem' }} />
          <h3 style={{ fontSize: '1.1rem', fontWeight: '600', color: '#374151', marginBottom: '0.5rem' }}>Agenda Not Yet Published</h3>
          <p style={{ color: '#9ca3af', fontSize: '0.9rem', maxWidth: '400px', margin: '0 auto' }}>
            The agenda and documents for this meeting are still being prepared. Check back closer to the meeting date.
          </p>
        </div>
      ) : (
        <div style={{ backgroundColor: 'white', borderRadius: '0.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', padding: '2rem' }}>
          {loading && <LoadingSpinner />}
          {error && <p style={{ color: '#DC2626' }}>Error loading content: {error}</p>}
          {data && data.blocks && <NotionBlocks blocks={data.blocks} />}
          {data && (!data.blocks || data.blocks.length === 0) && !loading && (
            <p style={{ color: '#9ca3af', fontStyle: 'italic' }}>No agenda or documents have been added to this meeting yet.</p>
          )}
        </div>
      )}
    </div>
  )
}

// ─── PAGE: Board Members ────────────────────────────────────────────────

function MembersPage({ boardMembers, onSelectMember }) {
  const [searchTerm, setSearchTerm] = useState('')
  const sortedMembers = sortBoardMembers(boardMembers)
  const filteredMembers = sortedMembers.filter(m =>
    m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.position?.some(p => p.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  return (
    <div>
      <h1 style={{ fontSize: '2rem', fontWeight: '700', color: '#1f2937', marginBottom: '2rem' }}>Board Members</h1>

      <div style={{ marginBottom: '2rem' }}>
        <div style={{ position: 'relative', maxWidth: '400px' }}>
          <Search size={18} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
          <input type="text" placeholder="Search by name or position..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} style={{
            width: '100%', padding: '0.75rem 0.75rem 0.75rem 2.5rem',
            border: '1px solid #d1d5db', borderRadius: '0.375rem', fontSize: '0.875rem', fontFamily: 'inherit', boxSizing: 'border-box',
          }} />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
        {filteredMembers.map(member => <MemberCard key={member.id} member={member} onSelect={() => onSelectMember(member)} />)}
      </div>

      {filteredMembers.length === 0 && (
        <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#6b7280' }}>
          <Users size={40} style={{ marginBottom: '1rem', opacity: 0.3 }} />
          <p>No board members found matching your search.</p>
        </div>
      )}

      {/* Quorum */}
      <div style={{ backgroundColor: 'white', borderRadius: '0.5rem', padding: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', marginTop: '3rem' }}>
        <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#1f2937', marginBottom: '1rem' }}>Meeting Quorum Requirements</h3>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #e5e7eb' }}>
              <th style={{ textAlign: 'left', padding: '0.75rem', fontSize: '0.875rem', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>Board Size</th>
              <th style={{ textAlign: 'left', padding: '0.75rem', fontSize: '0.875rem', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>Quorum</th>
            </tr>
          </thead>
          <tbody>
            {quorumTable.map((row, idx) => (
              <tr key={idx} style={{ borderBottom: '1px solid #e5e7eb' }}>
                <td style={{ padding: '0.75rem', fontSize: '0.875rem', color: '#1f2937' }}>{row.size}</td>
                <td style={{ padding: '0.75rem', fontSize: '0.875rem', color: '#1f2937', fontWeight: '600' }}>{row.quorum} members</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ─── PAGE: Board Member Directory ──────────────────────────────────────

function getMemberType(member) {
  const mt = member.membershipType
  if (mt === 'Staff (Non Voting)') return 'Staff'
  if (mt === 'Committee Only (Non Voting)') return 'Community'
  return 'Board Member'
}

function isExOfficio(member) {
  const mt = member.membershipType
  return mt === 'Ex officio (Non Voting)' || mt === 'Emeritus'
}

function getMemberDisplayRole(member) {
  const pos = member.position || []
  const leadership = pos.filter(p =>
    !p.startsWith('Non Board Member') && p !== 'Board Member' && p !== 'Emeritus'
  )
  if (leadership.length > 0) return leadership.join(', ')
  return null
}

function BoardMemberDirectoryPage({ boardMembers }) {
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState('Board Member')
  const [filterCommittee, setFilterCommittee] = useState('all')

  // Collect all unique committee names for filter tabs
  const allCommittees = useMemo(() => {
    const set = new Set()
    boardMembers.forEach(m => {
      (m.committees || []).forEach(c => set.add(c))
    })
    return Array.from(set).sort()
  }, [boardMembers])

  const sorted = sortBoardMembers(boardMembers)
  const filtered = sorted.filter(m => {
    const type = getMemberType(m)
    const exOff = isExOfficio(m)
    // Type filter: Board Member filter includes ex officio
    if (filterType !== 'all') {
      if (filterType === 'Board Member') {
        if (type !== 'Board Member') return false
      } else {
        if (type !== filterType && !exOff) return false
        if (exOff) return false
      }
    }
    // Committee filter
    if (filterCommittee !== 'all') {
      if (!(m.committees || []).includes(filterCommittee)) return false
    }
    // Search filter
    if (searchTerm) {
      const q = searchTerm.toLowerCase()
      return (
        m.name?.toLowerCase().includes(q) ||
        m.employer?.toLowerCase().includes(q) ||
        m.committees?.some(c => c.toLowerCase().includes(q))
      )
    }
    return true
  })

  // Sort: officers first (President, VP, Secretary, Treasurer), then board members alpha,
  // then ex officio, then staff/community
  const officerOrder = { President: 1, 'Vice President': 2, Secretary: 3, Treasurer: 4 }
  const finalList = [...filtered].sort((a, b) => {
    const aExOff = isExOfficio(a)
    const bExOff = isExOfficio(b)
    const aType = getMemberType(a)
    const bType = getMemberType(b)
    // Group: board members (0), ex officio (1), staff/community (2)
    const groupOrder = (m, ex) => {
      if (m === 'Board Member' && !ex) return 0
      if (ex) return 1
      return 2
    }
    const aGroup = groupOrder(aType, aExOff)
    const bGroup = groupOrder(bType, bExOff)
    if (aGroup !== bGroup) return aGroup - bGroup
    // Within board members, officers first then alpha
    if (aGroup === 0) {
      const aRank = officerOrder[a.officerRole] || 99
      const bRank = officerOrder[b.officerRole] || 99
      if (aRank !== bRank) return aRank - bRank
    }
    return (a.last || a.name || '').localeCompare(b.last || b.name || '')
  })

  const typeBadgeColors = {
    'Board Member': '#059669',
    'Staff': '#2563EB',
    'Community': '#D97706',
  }

  const thStyle = { textAlign: 'left', padding: '0.75rem 0.75rem', fontSize: '0.75rem', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase', whiteSpace: 'nowrap' }
  const tdStyle = { padding: '0.6rem 0.75rem', fontSize: '0.85rem', color: '#374151', borderBottom: '1px solid #e5e7eb' }

  const filterBtnStyle = (active) => ({
    padding: '0.4rem 0.75rem', fontSize: '0.8rem', fontWeight: active ? '600' : '400',
    border: active ? '1px solid #6B1D38' : '1px solid #d1d5db', borderRadius: '0.375rem',
    backgroundColor: active ? '#6B1D38' : 'white', color: active ? 'white' : '#374151',
    cursor: 'pointer',
  })

  return (
    <div>
      <h1 style={{ fontSize: '2rem', fontWeight: '700', color: '#1f2937', marginBottom: '0.5rem' }}>Board Member Directory</h1>
      <p style={{ color: '#6b7280', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
        All current board members, ex officio, staff, and community committee members.
      </p>

      {/* Filters — single row */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', minWidth: '200px', maxWidth: '260px', flex: '0 1 260px' }}>
          <Search size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
          <input type="text" placeholder="Search name, employer..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} style={{
            width: '100%', padding: '0.45rem 0.75rem 0.45rem 2.25rem',
            border: '1px solid #d1d5db', borderRadius: '0.375rem', fontSize: '0.8rem', fontFamily: 'inherit', boxSizing: 'border-box',
          }} />
        </div>
        <div style={{ height: '1.2rem', width: '1px', backgroundColor: '#d1d5db' }} />
        <div style={{ display: 'flex', gap: '0.3rem', alignItems: 'center' }}>
          {['Board Member', 'Staff', 'Community', 'all'].map(f => (
            <button key={f} onClick={() => setFilterType(f)} style={filterBtnStyle(filterType === f)}>
              {f === 'all' ? 'All' : f}
            </button>
          ))}
        </div>
        {allCommittees.length > 0 && (<>
          <div style={{ height: '1.2rem', width: '1px', backgroundColor: '#d1d5db' }} />
          <div style={{ display: 'flex', gap: '0.3rem', alignItems: 'center' }}>
            {allCommittees.map(c => {
              const short = c.replace(' Committee', '').replace('Board of Directors', 'Board')
              return (
                <button key={c} onClick={() => setFilterCommittee(c)} style={{
                  padding: '0.35rem 0.55rem', fontSize: '0.7rem', fontWeight: filterCommittee === c ? '600' : '400',
                  border: filterCommittee === c ? '1px solid #2A4D6E' : '1px solid #d1d5db', borderRadius: '0.375rem',
                  backgroundColor: filterCommittee === c ? '#2A4D6E' : 'white', color: filterCommittee === c ? 'white' : '#374151',
                  cursor: 'pointer', whiteSpace: 'nowrap',
                }}>{short}</button>
              )
            })}
            <button onClick={() => setFilterCommittee('all')} style={{
              padding: '0.35rem 0.55rem', fontSize: '0.7rem', fontWeight: filterCommittee === 'all' ? '600' : '400',
              border: filterCommittee === 'all' ? '1px solid #2A4D6E' : '1px solid #d1d5db', borderRadius: '0.375rem',
              backgroundColor: filterCommittee === 'all' ? '#2A4D6E' : 'white', color: filterCommittee === 'all' ? 'white' : '#374151',
              cursor: 'pointer',
            }}>All</button>
          </div>
        </>)}
      </div>

      <div style={{ backgroundColor: 'white', borderRadius: '0.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', overflow: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '1200px' }}>
          <thead>
            <tr style={{ backgroundColor: '#f9fafb', borderBottom: '2px solid #e5e7eb' }}>
              <th style={{ ...thStyle, width: '2rem', textAlign: 'center' }}>#</th>
              <th style={thStyle}>Name</th>
              <th style={thStyle}>Type</th>
              <th style={thStyle}>Role</th>
              <th style={thStyle}>Employer</th>
              <th style={thStyle}>Committee(s)</th>
              <th style={thStyle}>Email</th>
              <th style={thStyle}>Phone</th>
              <th style={thStyle}>Term #</th>
              <th style={thStyle}>Term Start</th>
              <th style={thStyle}>Term End</th>
            </tr>
          </thead>
          <tbody>
            {(() => {
              let boardNum = 0
              return finalList.map(m => {
                const type = getMemberType(m)
                const exOff = isExOfficio(m)
                const role = getMemberDisplayRole(m)
                const isBoardMember = type === 'Board Member' && !exOff
                if (isBoardMember) boardNum++
                const displayType = exOff ? 'Ex Officio' : type
                const badgeColor = exOff ? '#7C3AED' : (typeBadgeColors[type] || '#6b7280')
                const termDays = daysUntil(m.termEnd)
                const termWarning = termDays >= 0 && termDays <= 365
                const isNonBoard = !isBoardMember
                return (
                  <tr key={m.id} style={{ backgroundColor: isNonBoard ? '#f9fafb' : 'white' }}>
                    <td style={{ ...tdStyle, fontSize: '0.8rem', textAlign: 'center', color: '#9ca3af', fontWeight: '500' }}>{isBoardMember ? boardNum : ''}</td>
                    <td style={{ ...tdStyle, fontWeight: '600', color: '#1f2937', whiteSpace: 'nowrap' }}>{m.name}</td>
                    <td style={tdStyle}><Badge text={displayType} color={badgeColor} /></td>
                    <td style={{ ...tdStyle, fontSize: '0.8rem', color: '#6b7280' }}>{role || '-'}</td>
                    <td style={{ ...tdStyle, fontSize: '0.8rem' }}>{m.employer || '-'}</td>
                    <td style={{ ...tdStyle, fontSize: '0.8rem' }}>{m.committees?.join(', ') || '-'}</td>
                    <td style={tdStyle}>
                      {m.email ? <a href={`mailto:${m.email}`} style={{ color: '#6B1D38', textDecoration: 'none', fontSize: '0.8rem' }}>{m.email}</a> : '-'}
                    </td>
                    <td style={tdStyle}>
                      {m.cell ? <a href={`tel:${m.cell}`} style={{ color: '#6B1D38', textDecoration: 'none', fontSize: '0.8rem', whiteSpace: 'nowrap' }}>{m.cell}</a> : '-'}
                    </td>
                    <td style={{ ...tdStyle, fontSize: '0.8rem', textAlign: 'center' }}>{m.termCount || '-'}</td>
                    <td style={{ ...tdStyle, fontSize: '0.8rem', whiteSpace: 'nowrap' }}>{formatDate(m.termStart) || '-'}</td>
                    <td style={{ ...tdStyle, fontSize: '0.8rem', whiteSpace: 'nowrap', color: termWarning ? '#DC2626' : '#374151', fontWeight: termWarning ? '600' : '400' }}>{formatDate(m.termEnd) || '-'}</td>
                  </tr>
                )
              })
            })()}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div style={{ padding: '2rem', textAlign: 'center', color: '#9ca3af' }}>No members found.</div>
        )}
      </div>

      <p style={{ color: '#9ca3af', fontSize: '0.75rem', marginTop: '1rem' }}>
        Showing {finalList.length} of {boardMembers.length} members.
        Board members are numbered. Ex officio, staff, and community rows are shaded.
      </p>
    </div>
  )
}

// ─── PAGE: Notion Document Detail (generic inline rendering) ──────────────

function NotionDocPage({ pageId, title, onBack }) {
  const { data, loading, error } = useNotionPage(pageId)

  return (
    <div>
      <button onClick={onBack} style={{
        display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
        background: 'none', border: 'none', color: '#6B1D38', fontSize: '0.875rem',
        fontWeight: '500', cursor: 'pointer', marginBottom: '1rem', padding: '0.25rem 0',
      }}>
        <ChevronLeft size={16} /> Back
      </button>

      <h1 style={{ fontSize: '1.75rem', fontWeight: '700', color: '#1f2937', marginBottom: '1.5rem' }}>{title}</h1>

      <div style={{ backgroundColor: 'white', borderRadius: '0.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', padding: '2rem' }}>
        {loading && <LoadingSpinner />}
        {error && <p style={{ color: '#DC2626' }}>Error loading content: {error}</p>}
        {data && data.blocks && <NotionBlocks blocks={data.blocks} />}
        {data && (!data.blocks || data.blocks.length === 0) && !loading && (
          <p style={{ color: '#9ca3af', fontStyle: 'italic' }}>No content available.</p>
        )}
      </div>
    </div>
  )
}

// ─── PAGE: Mission ──────────────────────────────────────────────────────────

function MissionPage() {
  return (
    <div>
      <h1 style={{ fontSize: '2rem', fontWeight: '700', color: '#1f2937', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <BookOpen size={28} style={{ color: '#D4A843' }} /> Our Mission
      </h1>
      <div style={{ backgroundColor: 'white', borderRadius: '0.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', padding: '2.5rem' }}>
        <div style={{ borderLeft: '4px solid #D4A843', paddingLeft: '1.5rem', marginBottom: '2rem' }}>
          <p style={{ fontSize: '1.2rem', lineHeight: '1.8', color: '#1f2937', fontStyle: 'italic', margin: 0 }}>
            The Thaddeus Stevens Foundation supports the mission of Thaddeus Stevens College of Technology by raising funds and managing resources to provide scholarships, enhance educational programs, and improve campus facilities for students pursuing technical education.
          </p>
        </div>
        <div style={{ marginTop: '2rem' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: '600', color: '#6B1D38', marginBottom: '1rem' }}>Our Purpose</h3>
          <p style={{ fontSize: '0.95rem', lineHeight: '1.7', color: '#374151', margin: '0 0 1.5rem 0' }}>
            Founded in 1905, the Thaddeus Stevens Foundation serves as the fundraising and asset management arm of Thaddeus Stevens College of Technology. The Foundation is a 501(c)(3) nonprofit organization governed by a volunteer Board of Directors committed to ensuring that students have access to high-quality technical education and the support they need to succeed.
          </p>
          <h3 style={{ fontSize: '1.1rem', fontWeight: '600', color: '#6B1D38', marginBottom: '1rem' }}>What We Do</h3>
          <p style={{ fontSize: '0.95rem', lineHeight: '1.7', color: '#374151', margin: 0 }}>
            The Foundation raises and stewards charitable gifts, manages endowment and investment funds, awards scholarships, funds campus improvement projects, and supports programs that strengthen student outcomes. The Board of Directors provides fiduciary oversight and strategic guidance to advance the Foundation's mission in partnership with the College.
          </p>
        </div>
      </div>
    </div>
  )
}

// ─── PAGE: Notion Content Page (Bylaws / Strategic Plan) ────────────────

function NotionContentPage({ pageId, title, icon }) {
  const { data, loading, error } = useNotionPage(pageId)

  return (
    <div>
      <h1 style={{ fontSize: '2rem', fontWeight: '700', color: '#1f2937', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        {icon} {title}
      </h1>

      <div style={{ backgroundColor: 'white', borderRadius: '0.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', padding: '2rem' }}>
        {loading && <LoadingSpinner />}
        {error && <p style={{ color: '#DC2626' }}>Error loading content: {error}</p>}
        {data && data.blocks && <NotionBlocks blocks={data.blocks} />}
        {data && (!data.blocks || data.blocks.length === 0) && !loading && (
          <p style={{ color: '#9ca3af', fontStyle: 'italic' }}>No content available.</p>
        )}
      </div>
    </div>
  )
}

// ─── MAIN PORTAL COMPONENT ─────────────────────────────────────────────

export default function Portal({ meetings, boardMembers, actionPlan = [], foundationalDocs = [] }) {
  const [currentPage, setCurrentPage] = useState('dashboard')
  const [pageParams, setPageParams] = useState({})
  const [selectedMember, setSelectedMember] = useState(null)
  const [boardOpen, setBoardOpen] = useState(true)
  const [committeesOpen, setCommitteesOpen] = useState(true)

  const navigate = useCallback((page, params = {}) => {
    setCurrentPage(page)
    setPageParams(params)
    window.scrollTo(0, 0)
  }, [])

  const activeCommitteeKey = currentPage.startsWith('committee-') ? currentPage.replace('committee-', '') : null

  const renderPage = () => {
    // Document detail (inline content from Notion)
    if (currentPage === 'doc-detail') {
      return (
        <NotionDocPage
          pageId={pageParams.docId}
          title={pageParams.docTitle}
          onBack={() => navigate(pageParams.backTo || 'dashboard')}
        />
      )
    }

    // Meeting detail (inline content from Notion)
    if (currentPage === 'meeting-detail') {
      return (
        <MeetingDetailPage
          meetingId={pageParams.meetingId}
          meetingTitle={pageParams.meetingTitle}
          published={pageParams.published}
          onBack={() => navigate(pageParams.backTo || 'dashboard')}
        />
      )
    }

    // Reference category pages (e.g., ref-Governance & Legal)
    if (currentPage.startsWith('ref-')) {
      const categoryName = currentPage.replace('ref-', '')
      const section = foundationalDocs.find(s => s.name === categoryName)
      if (section) {
        return (
          <div>
            <h1 style={{ fontSize: '2rem', fontWeight: '700', color: '#1f2937', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <FileText size={28} style={{ color: '#2A4D6E' }} /> {section.name}
            </h1>
            <div style={{ backgroundColor: 'white', borderRadius: '0.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
              {section.items.map((item, i) => (
                <div key={i}>
                  {item.type === 'file' && item.fileUrl ? (
                    <a
                      href={item.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        width: '100%', padding: '1rem 1.25rem',
                        borderBottom: i < section.items.length - 1 ? '1px solid #e5e7eb' : 'none',
                        backgroundColor: 'white', textDecoration: 'none',
                        transition: 'background-color 0.15s',
                      }}
                      onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#f9fafb' }}
                      onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'white' }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <FileText size={18} style={{ color: '#6B1D38', flexShrink: 0 }} />
                        <span style={{ fontSize: '0.95rem', fontWeight: '500', color: '#1f2937' }}>{item.name}</span>
                      </div>
                      <Download size={16} style={{ color: '#9ca3af' }} />
                    </a>
                  ) : item.type === 'page' && item.pageId ? (
                    <button
                      onClick={() => navigate('doc-detail', { docId: item.pageId, docTitle: item.name, backTo: currentPage })}
                      style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        width: '100%', padding: '1rem 1.25rem',
                        borderBottom: i < section.items.length - 1 ? '1px solid #e5e7eb' : 'none',
                        backgroundColor: 'white', border: 'none', cursor: 'pointer', textAlign: 'left',
                        transition: 'background-color 0.15s',
                      }}
                      onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#f9fafb' }}
                      onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'white' }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <FileText size={18} style={{ color: '#2A4D6E', flexShrink: 0 }} />
                        <span style={{ fontSize: '0.95rem', fontWeight: '500', color: '#1f2937' }}>{item.name}</span>
                      </div>
                      <ChevronRight size={16} style={{ color: '#9ca3af' }} />
                    </button>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '1rem 1.25rem', borderBottom: i < section.items.length - 1 ? '1px solid #e5e7eb' : 'none' }}>
                      <FileText size={18} style={{ color: '#9ca3af', flexShrink: 0 }} />
                      <span style={{ fontSize: '0.95rem', fontWeight: '500', color: '#6b7280' }}>{item.name}</span>
                    </div>
                  )}
                </div>
              ))}
              {section.items.length === 0 && (
                <div style={{ padding: '2rem', textAlign: 'center', color: '#9ca3af' }}>No documents found in this category.</div>
              )}
            </div>
          </div>
        )
      }
    }

    // Committee pages
    if (currentPage.startsWith('committee-')) {
      const key = currentPage.replace('committee-', '')
      const committee = committeeConfig.find(c => c.key === key)
      if (committee) {
        return <CommitteeMeetingsPage committee={committee} meetings={meetings} boardMembers={boardMembers} onNavigate={(page, params) => navigate(page, { ...params, backTo: currentPage })} />
      }
    }

    switch (currentPage) {
      case 'dashboard':
        return <DashboardPage meetings={meetings} boardMembers={boardMembers} actionPlan={actionPlan} onNavigate={(page, params) => navigate(page, { ...params, backTo: 'dashboard' })} />
      case 'members':
        return <MembersPage boardMembers={boardMembers} onSelectMember={setSelectedMember} />
      case 'board-directory':
        return <BoardMemberDirectoryPage boardMembers={boardMembers} />
      case 'mission':
        return <MissionPage />
      case 'bylaws':
        return <NotionContentPage pageId={BYLAWS_PAGE_ID} title="Bylaws" icon={<Shield size={28} style={{ color: '#6B1D38' }} />} />
      case 'strategic-plan':
        return <NotionContentPage pageId={STRATEGIC_PLAN_PAGE_ID} title="Strategic Plan" icon={<Target size={28} style={{ color: '#2A4D6E' }} />} />
      default:
        return null
    }
  }

  return (
    <ErrorBoundary>
    <div style={{ minHeight: '100vh', display: 'flex', backgroundColor: '#f3f4f6' }}>
      {/* ═══ SIDEBAR ═══ */}
      <div style={{
        width: '260px', backgroundColor: '#1a1a2e', display: 'flex',
        flexDirection: 'column', minHeight: '100vh', flexShrink: 0,
      }}>
        {/* Logo Header */}
        <div style={{ backgroundColor: '#6B1D38', padding: '1.25rem 1rem', borderBottom: '3px solid #D4A843' }}>
          <div style={{ fontSize: '0.6rem', fontWeight: '600', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#D4A843', marginBottom: '0.25rem' }}>
            Thaddeus Stevens Foundation
          </div>
          <h1 style={{ fontSize: '1.2rem', fontWeight: '700', margin: 0, color: 'white' }}>Board Portal</h1>
        </div>

        {/* Navigation */}
        <div style={{ flex: 1, overflowY: 'auto', paddingTop: '0.5rem' }}>
          {/* Top Level */}
          <SidebarNavItem label="Dashboard" icon={LayoutDashboard} active={currentPage === 'dashboard'} onClick={() => navigate('dashboard')} />

          {/* Collapsible Board of Directors */}
          <button onClick={() => setBoardOpen(!boardOpen)} style={{
            width: '100%', padding: '0.6rem 1rem', display: 'flex', alignItems: 'center',
            justifyContent: 'space-between', backgroundColor: 'transparent', border: 'none',
            fontSize: '0.85rem', fontWeight: '400', color: 'rgba(255,255,255,0.75)',
            cursor: 'pointer',
          }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <Users size={16} /> Board of Directors
            </span>
            <ChevronDown size={14} style={{
              transform: boardOpen ? 'rotate(0deg)' : 'rotate(-90deg)',
              transition: 'transform 0.15s', color: 'rgba(255,255,255,0.45)',
            }} />
          </button>
          {boardOpen && (
            <>
              <SidebarNavItem label="Board Directory" active={currentPage === 'board-directory'} onClick={() => navigate('board-directory')} indent />
              <SidebarNavItem label="Board Meetings" active={currentPage === 'committee-board'} onClick={() => navigate('committee-board')} indent />
            </>
          )}

          {/* Collapsible Committees */}
          <button onClick={() => setCommitteesOpen(!committeesOpen)} style={{
            width: '100%', padding: '0.6rem 1rem', display: 'flex', alignItems: 'center',
            justifyContent: 'space-between', backgroundColor: 'transparent', border: 'none',
            fontSize: '0.85rem', fontWeight: '400', color: 'rgba(255,255,255,0.75)',
            cursor: 'pointer',
          }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <Building2 size={16} /> Committees
            </span>
            <ChevronDown size={14} style={{
              transform: committeesOpen ? 'rotate(0deg)' : 'rotate(-90deg)',
              transition: 'transform 0.15s', color: 'rgba(255,255,255,0.45)',
            }} />
          </button>
          {committeesOpen && committeeConfig.filter(c => c.key !== 'board').map(c => (
            <SidebarNavItem key={c.key} label={c.name} active={currentPage === `committee-${c.key}`} onClick={() => navigate(`committee-${c.key}`)} indent />
          ))}

          {/* Resources Section */}
          <SectionLabel>Resources</SectionLabel>

          {/* Reference Document Categories — pulled from Notion Foundational Docs */}
          {foundationalDocs.map((section) => (
            <SidebarNavItem
              key={section.name}
              label={section.name}
              icon={FileText}
              active={currentPage === `ref-${section.name}`}
              onClick={() => navigate(`ref-${section.name}`)}
            />
          ))}

          <a href="https://drive.google.com/file/d/1uQDW24Ud6Zg26WHpZIX-Le91md4mIuYY/view" target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
            <SidebarNavItem label="Campus Map" icon={MapPin} active={false} onClick={() => {}} />
          </a>
          <a href="https://www.stevenscollege.edu" target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
            <SidebarNavItem label="TSCT Website" icon={Globe} active={false} onClick={() => {}} />
          </a>
        </div>

        {/* Footer */}
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', padding: '1rem', fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', textAlign: 'center' }}>
          <p style={{ margin: '0 0 0.5rem 0' }}>Thaddeus Stevens Foundation</p>
          <a href="mailto:germann@stevenscollege.edu" style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
            padding: '0.5rem 1rem', backgroundColor: '#D4A843', color: '#1a1a2e',
            borderRadius: '0.375rem', fontSize: '0.75rem', fontWeight: '600',
            textDecoration: 'none', marginBottom: '0.5rem',
          }}>
            <Mail size={14} /> Questions? Email Jenny
          </a>
          <br />
          <a href="/login" style={{ color: '#D4A843', textDecoration: 'none', fontSize: '0.7rem' }}
            onClick={async e => { e.preventDefault(); await fetch('/api/auth', { method: 'DELETE' }); window.location.href = '/login' }}
          >
            Logout
          </a>
        </div>
      </div>

      {/* ═══ MAIN CONTENT ═══ */}
      <div style={{ flex: 1, padding: '2rem', overflowY: 'auto' }}>
        {renderPage()}
      </div>

      {/* Member Detail Modal */}
      <MemberDetailModal member={selectedMember} committees={committeeConfig} onClose={() => setSelectedMember(null)} />
    </div>
    </ErrorBoundary>
  )
}
