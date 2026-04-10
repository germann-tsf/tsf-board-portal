'use client'

import { useState, useMemo } from 'react'
import {
  Search,
  Users,
  Calendar,
  ChevronRight,
  Building2,
  Mail,
  Phone,
  MapPin,
  LayoutDashboard,
  FileText,
  Link2,
  BookOpen,
  ChevronDown,
  ExternalLink,
} from 'lucide-react'

const committeeConfig = [
  {
    key: 'board',
    name: 'Board of Directors',
    color: '#3B82F6',
    icon: '📋',
    description: 'Full board meetings held 2nd Tuesday of every other month at 6:30 PM',
    notionUrl: 'https://www.notion.so/32a84a2d469081908551e314d9377091',
  },
  {
    key: 'executive',
    name: 'Executive',
    color: '#8B5CF6',
    icon: '🔵',
    description: 'Executive committee of board leadership',
    notionUrl: 'https://www.notion.so/32a84a2d469081d085aad5c8119e3d16',
  },
  {
    key: 'governance',
    name: 'Governance',
    color: '#F97316',
    icon: '🟤',
    description: 'Board governance, bylaws, and member development',
    notionUrl: 'https://www.notion.so/32a84a2d469081cb8209fd2f43b8c4d6',
  },
  {
    key: 'finance',
    name: 'Finance & Investment',
    color: '#10B981',
    icon: '🟢',
    description: 'Oversees financial management and investments',
    notionUrl: 'https://www.notion.so/32a84a2d469081da9b84c0493ba83575',
  },
  {
    key: 'fundraising',
    name: 'Fundraising',
    color: '#EF4444',
    icon: '⚪',
    description: 'Fundraising strategy and donor engagement',
    notionUrl: 'https://www.notion.so/32a84a2d469081a5a2b4effe5bf762b4',
  },
  {
    key: 'shcp',
    name: 'Student Home Construction',
    color: '#EC4899',
    icon: '🟡',
    description: 'Student home construction program oversight',
    notionUrl: 'https://www.notion.so/32a84a2d469081089910eeb3329fd212',
  },
]

const referenceDocuments = [
  {
    category: 'Foundational Documents',
    items: [
      {
        name: 'Bylaws',
        status: 'Current',
        lastReviewed: 'Apr 9, 2024',
        notionUrl: 'https://www.notion.so/33484a2d469080e3b5a9d01377e16519',
      },
      {
        name: 'Articles of Incorporation',
        status: 'Current',
        lastReviewed: 'Sep 19, 2014',
        notionUrl: 'https://www.notion.so/33484a2d4690806ebaf3f1b430496b32',
      },
      {
        name: 'IRS Determination Letter (501c3)',
        status: 'Current',
        lastReviewed: '2003',
        notionUrl: 'https://www.notion.so/33484a2d469080659518d3cdb213e2ac',
      },
    ],
  },
  {
    category: 'Policies',
    items: [
      {
        name: 'Conflict of Interest Policy',
        status: 'Current',
        lastReviewed: '',
        notionUrl: '',
      },
      {
        name: 'Whistleblower Policy',
        status: 'Current',
        lastReviewed: '',
        notionUrl: '',
      },
      {
        name: 'Document Retention Policy',
        status: 'Current',
        lastReviewed: '',
        notionUrl: '',
      },
      {
        name: 'Gift Acceptance Policy',
        status: 'Current',
        lastReviewed: '',
        notionUrl: '',
      },
    ],
  },
  {
    category: 'Board Member Resources',
    items: [
      {
        name: 'Board Member Agreement',
        status: '',
        lastReviewed: 'Sign and return to ED',
        notionUrl: '',
      },
      {
        name: 'Board Orientation Packet',
        status: '',
        lastReviewed: 'For new members',
        notionUrl: '',
      },
      {
        name: 'Org Chart',
        status: '',
        lastReviewed: 'Current staff structure',
        notionUrl: '',
      },
    ],
  },
  {
    category: 'Strategic Planning',
    items: [
      {
        name: 'TSF Strategic Plan 2024-2027',
        status: 'Current',
        lastReviewed: '',
        notionUrl: 'https://www.notion.so/32a84a2d469081e8ba32cea4fc59a5e1',
      },
      {
        name: 'TSF Strategic Action Plan',
        status: 'Current',
        lastReviewed: '',
        notionUrl: 'https://www.notion.so/32a84a2d469081e8ba32cea4fc59a5e1',
      },
      {
        name: 'TSCT Strategic Plan Refresh',
        status: 'Current',
        lastReviewed: '',
        notionUrl: '',
      },
    ],
  },
]

const quickLinks = [
  {
    section: 'Board Portal (Notion)',
    links: [
      {
        name: 'Board Portal Home',
        url: 'https://www.notion.so/32a84a2d469081fc8ffed4169cfe75ec',
        description: 'Main board portal landing page',
      },
      {
        name: 'Board of Directors',
        url: 'https://www.notion.so/32a84a2d469081908551e314d9377091',
        description: 'Agendas & minutes',
      },
      {
        name: 'Executive Committee',
        url: 'https://www.notion.so/32a84a2d469081d085aad5c8119e3d16',
        description: 'Agendas & minutes',
      },
      {
        name: 'Governance Committee',
        url: 'https://www.notion.so/32a84a2d469081cb8209fd2f43b8c4d6',
        description: 'Agendas & minutes',
      },
      {
        name: 'Finance Committee',
        url: 'https://www.notion.so/32a84a2d469081da9b84c0493ba83575',
        description: 'Agendas & minutes',
      },
      {
        name: 'Fundraising Committee',
        url: 'https://www.notion.so/32a84a2d469081a5a2b4effe5bf762b4',
        description: 'Agendas & minutes',
      },
      {
        name: 'Student Home Construction Committee',
        url: 'https://www.notion.so/32a84a2d469081089910eeb3329fd212',
        description: 'Agendas & minutes',
      },
    ],
  },
  {
    section: 'Governance & Policies',
    links: [
      {
        name: 'Governance & Policies',
        url: 'https://www.notion.so/32a84a2d4690813c8eb7e6084d26a830',
        description: 'Bylaws, COI policy, board agreements',
      },
      {
        name: 'Strategic Plan',
        url: 'https://www.notion.so/32a84a2d469081e8ba32cea4fc59a5e1',
        description: 'TSF Strategic Plan and Action Plan 2024-2027',
      },
      {
        name: 'Reports & Financials',
        url: 'https://www.notion.so/32a84a2d469081c8bd35d4d17a66c291',
        description: 'Audits, 990s, budgets',
      },
    ],
  },
  {
    section: 'Other Resources',
    links: [
      {
        name: 'Committee Documents',
        url: 'https://www.notion.so/32a84a2d4690817bb8d0e0b2e3fceeb2',
        description: 'Committee-specific documents and files',
      },
      {
        name: 'Board Announcements',
        url: 'https://www.notion.so/32a84a2d46908134950deb52d686f986',
        description: 'Board-wide announcements',
      },
      {
        name: 'TSF Reference & Policy Library',
        url: 'https://www.notion.so/22684a2d469080dc8893c8a9c33e5982',
        description: 'Full reference library',
      },
    ],
  },
  {
    section: 'Contact',
    links: [
      {
        name: 'Jenny Germann',
        url: 'mailto:germann@stevenscollege.edu',
        description: 'Executive Director, portal questions',
      },
    ],
  },
]

const quorumTable = [
  { size: '14-15 members', quorum: 8 },
  { size: '16-17 members', quorum: 9 },
  { size: '18-19 members', quorum: 10 },
]

// Utility functions
function formatDate(dateString) {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function getNextMeeting(meetings) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const futureMeetings = meetings.filter(m => m.date && new Date(m.date) >= today)
  if (futureMeetings.length === 0) return null
  return futureMeetings[futureMeetings.length - 1]
}

function sortBoardMembers(members) {
  const priorityMap = {
    'Board President': 1,
    'Board Vice President': 2,
    Secretary: 3,
    Treasurer: 4,
  }

  return [...members].sort((a, b) => {
    const aPriority = a.position?.find(p => priorityMap[p])
    const bPriority = b.position?.find(p => priorityMap[p])

    if (aPriority && bPriority) {
      const aPri = priorityMap[aPriority]
      const bPri = priorityMap[bPriority]
      if (aPri !== bPri) return aPri - bPri
    } else if (aPriority) {
      return -1
    } else if (bPriority) {
      return 1
    }

    const aLast = a.last || a.name || ''
    const bLast = b.last || b.name || ''
    return aLast.localeCompare(bLast)
  })
}

// Component: Badge
function Badge({ text, color }) {
  return (
    <span
      style={{
        display: 'inline-block',
        padding: '0.25rem 0.75rem',
        backgroundColor: color + '20',
        color: color,
        borderRadius: '9999px',
        fontSize: '0.75rem',
        fontWeight: '600',
        border: `1px solid ${color}40`,
      }}
    >
      {text}
    </span>
  )
}

// Component: StatCard
function StatCard({ icon: Icon, title, value, color }) {
  return (
    <div
      style={{
        backgroundColor: 'white',
        borderRadius: '0.5rem',
        padding: '1.5rem',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
        display: 'flex',
        alignItems: 'center',
        gap: '1rem',
      }}
    >
      <div
        style={{
          width: '3rem',
          height: '3rem',
          borderRadius: '0.5rem',
          backgroundColor: color + '20',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: color,
        }}
      >
        <Icon size={20} />
      </div>
      <div>
        <p style={{ color: '#6b7280', fontSize: '0.875rem', margin: 0 }}>
          {title}
        </p>
        <p
          style={{
            fontSize: '2rem',
            fontWeight: '700',
            color: '#1f2937',
            margin: '0.25rem 0 0 0',
          }}
        >
          {value}
        </p>
      </div>
    </div>
  )
}

// Component: MeetingRow
function MeetingRow({ meeting }) {
  return (
    <div
      style={{
        padding: '1rem',
        borderBottom: '1px solid #e5e7eb',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}
    >
      <div>
        <h4
          style={{
            fontSize: '0.95rem',
            fontWeight: '600',
            color: '#1f2937',
            margin: '0 0 0.25rem 0',
          }}
        >
          {meeting.title}
        </h4>
        <p style={{ fontSize: '0.85rem', color: '#6b7280', margin: 0 }}>
          {formatDate(meeting.date)} {meeting.committee ? `• ${meeting.committee}` : ''}
        </p>
      </div>
      {meeting.notionUrl && (
        <a
          href={meeting.notionUrl}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            padding: '0.5rem 1rem',
            backgroundColor: '#f3f4f6',
            border: '1px solid #d1d5db',
            borderRadius: '0.375rem',
            fontSize: '0.875rem',
            fontWeight: '500',
            color: '#374151',
            textDecoration: 'none',
            cursor: 'pointer',
          }}
        >
          Documents
        </a>
      )}
    </div>
  )
}

// Component: MemberCard
function MemberCard({ member, onSelect }) {
  return (
    <div
      onClick={onSelect}
      style={{
        backgroundColor: 'white',
        borderRadius: '0.5rem',
        padding: '1.5rem',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
        cursor: 'pointer',
        transition: 'all 0.2s',
        border: '1px solid #e5e7eb',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)'
        e.currentTarget.style.borderColor = '#3b82f6'
      }}
      onMouseLeave={e => {
        e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.1)'
        e.currentTarget.style.borderColor = '#e5e7eb'
      }}
    >
      <div style={{ marginBottom: '1rem' }}>
        <h3
          style={{
            fontSize: '1rem',
            fontWeight: '600',
            color: '#1f2937',
            margin: '0 0 0.5rem 0',
          }}
        >
          {member.name}
        </h3>
        {member.position && member.position.length > 0 && (
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {member.position.map((pos, idx) => (
              <Badge key={idx} text={pos} color="#8B5CF6" />
            ))}
          </div>
        )}
      </div>
      {member.employer && (
        <p
          style={{
            fontSize: '0.875rem',
            color: '#6b7280',
            margin: '0.5rem 0',
          }}
        >
          <strong>Employer:</strong> {member.employer}
        </p>
      )}
      {member.email && (
        <p
          style={{
            fontSize: '0.875rem',
            color: '#6b7280',
            margin: '0.5rem 0',
          }}
        >
          <strong>Email:</strong> {member.email}
        </p>
      )}
    </div>
  )
}

// Component: MemberDetail Modal
function MemberDetailModal({ member, committees, onClose }) {
  if (!member) return null

  // Match member's committees (from API multi-select) to committeeConfig for colors
  const memberCommitteeList = committees.filter(c =>
    (member.committees || []).includes(c.name)
  )

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 50,
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: 'white',
          borderRadius: '0.5rem',
          padding: '2rem',
          maxWidth: '600px',
          width: '90%',
          maxHeight: '90vh',
          overflowY: 'auto',
          boxShadow: '0 20px 25px rgba(0, 0, 0, 0.15)',
        }}
        onClick={e => e.stopPropagation()}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'start',
            marginBottom: '1.5rem',
          }}
        >
          <div>
            <h2
              style={{
                fontSize: '1.5rem',
                fontWeight: '700',
                color: '#1f2937',
                margin: 0,
              }}
            >
              {member.name}
            </h2>
            {member.position && member.position.length > 0 && (
              <div style={{ marginTop: '0.75rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                {member.position.map((pos, idx) => (
                  <Badge key={idx} text={pos} color="#8B5CF6" />
                ))}
              </div>
            )}
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '1.5rem',
              cursor: 'pointer',
              color: '#6b7280',
            }}
          >
            ×
          </button>
        </div>

        {/* Contact Information */}
        <div style={{ marginBottom: '1.5rem' }}>
          <h3
            style={{
              fontSize: '0.875rem',
              fontWeight: '600',
              color: '#6b7280',
              textTransform: 'uppercase',
              marginBottom: '0.75rem',
            }}
          >
            Contact Information
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            {member.email && (
              <div>
                <p style={{ fontSize: '0.75rem', color: '#9ca3af', margin: '0 0 0.25rem 0' }}>
                  Email
                </p>
                <a
                  href={`mailto:${member.email}`}
                  style={{ fontSize: '0.875rem', color: '#3b82f6', textDecoration: 'none' }}
                >
                  {member.email}
                </a>
              </div>
            )}
            {member.cell && (
              <div>
                <p style={{ fontSize: '0.75rem', color: '#9ca3af', margin: '0 0 0.25rem 0' }}>
                  Cell Phone
                </p>
                <a
                  href={`tel:${member.cell}`}
                  style={{ fontSize: '0.875rem', color: '#3b82f6', textDecoration: 'none' }}
                >
                  {member.cell}
                </a>
              </div>
            )}
          </div>
        </div>

        {/* Professional Information */}
        {(member.employer || member.title || member.city || member.state) && (
          <div style={{ marginBottom: '1.5rem' }}>
            <h3
              style={{
                fontSize: '0.875rem',
                fontWeight: '600',
                color: '#6b7280',
                textTransform: 'uppercase',
                marginBottom: '0.75rem',
              }}
            >
              Professional
            </h3>
            <div style={{ display: 'grid', gap: '0.5rem' }}>
              {member.employer && (
                <p style={{ fontSize: '0.875rem', color: '#374151', margin: 0 }}>
                  <strong>Employer:</strong> {member.employer}
                </p>
              )}
              {member.title && (
                <p style={{ fontSize: '0.875rem', color: '#374151', margin: 0 }}>
                  <strong>Job Title:</strong> {member.title}
                </p>
              )}
              {(member.city || member.state) && (
                <p style={{ fontSize: '0.875rem', color: '#374151', margin: 0 }}>
                  <strong>Location:</strong> {member.city}
                  {member.city && member.state && ', '}
                  {member.state}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Board Service */}
        {(member.termStart || member.termEnd || member.termCount) && (
          <div style={{ marginBottom: '1.5rem' }}>
            <h3
              style={{
                fontSize: '0.875rem',
                fontWeight: '600',
                color: '#6b7280',
                textTransform: 'uppercase',
                marginBottom: '0.75rem',
              }}
            >
              Board Service
            </h3>
            <div style={{ display: 'grid', gap: '0.5rem' }}>
              {member.termStart && (
                <p style={{ fontSize: '0.875rem', color: '#374151', margin: 0 }}>
                  <strong>Term Start:</strong> {formatDate(member.termStart)}
                </p>
              )}
              {member.termEnd && (
                <p style={{ fontSize: '0.875rem', color: '#374151', margin: 0 }}>
                  <strong>Term End:</strong> {formatDate(member.termEnd)}
                </p>
              )}
              {member.termCount && (
                <p style={{ fontSize: '0.875rem', color: '#374151', margin: 0 }}>
                  <strong>Term Count:</strong> {member.termCount}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Committee Memberships */}
        {memberCommitteeList.length > 0 && (
          <div style={{ marginBottom: '1.5rem' }}>
            <h3
              style={{
                fontSize: '0.875rem',
                fontWeight: '600',
                color: '#6b7280',
                textTransform: 'uppercase',
                marginBottom: '0.75rem',
              }}
            >
              Committees
            </h3>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {memberCommitteeList.map(c => (
                <Badge key={c.key} text={c.name} color={c.color} />
              ))}
            </div>
          </div>
        )}

        {/* Additional Information */}
        {(member.pronouns || member.alumni || member.alumniYear) && (
          <div style={{ marginBottom: '1.5rem' }}>
            <h3
              style={{
                fontSize: '0.875rem',
                fontWeight: '600',
                color: '#6b7280',
                textTransform: 'uppercase',
                marginBottom: '0.75rem',
              }}
            >
              Additional Information
            </h3>
            <div style={{ display: 'grid', gap: '0.5rem' }}>
              {member.pronouns && (
                <p style={{ fontSize: '0.875rem', color: '#374151', margin: 0 }}>
                  <strong>Pronouns:</strong> {member.pronouns}
                </p>
              )}
              {member.alumni && (
                <p style={{ fontSize: '0.875rem', color: '#374151', margin: 0 }}>
                  <strong>Status:</strong> Alumni
                  {member.alumniYear && ` (${member.alumniYear})`}
                </p>
              )}
            </div>
          </div>
        )}

        {member.notionUrl && (
          <a
            href={member.notionUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.75rem 1rem',
              backgroundColor: '#f3f4f6',
              border: '1px solid #d1d5db',
              borderRadius: '0.375rem',
              fontSize: '0.875rem',
              fontWeight: '500',
              color: '#374151',
              textDecoration: 'none',
              cursor: 'pointer',
            }}
          >
            <ExternalLink size={16} />
            View in Notion
          </a>
        )}
      </div>
    </div>
  )
}

// Component: SidebarSection
function SidebarSection({ title, items, active, onSelect }) {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <div>
      <button
        onClick={() => setCollapsed(!collapsed)}
        style={{
          width: '100%',
          padding: '0.75rem 1rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: 'transparent',
          border: 'none',
          fontSize: '0.75rem',
          fontWeight: '600',
          color: '#6b7280',
          textTransform: 'uppercase',
          cursor: 'pointer',
          marginBottom: '0.5rem',
        }}
      >
        {title}
        <ChevronDown
          size={16}
          style={{
            transform: collapsed ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s',
          }}
        />
      </button>
      {!collapsed && (
        <div>
          {items.map(item => (
            <NavItem
              key={item.key}
              label={item.label}
              icon={item.icon}
              active={active === item.key}
              onClick={() => onSelect(item.key)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// Component: NavItem
function NavItem({ label, icon: Icon, active, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        width: '100%',
        padding: '0.75rem 1rem',
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        backgroundColor: active ? '#eff6ff' : 'transparent',
        border: 'none',
        borderLeft: active ? '3px solid #3b82f6' : '3px solid transparent',
        fontSize: '0.875rem',
        fontWeight: '500',
        color: active ? '#1f2937' : '#6b7280',
        cursor: 'pointer',
        transition: 'all 0.2s',
      }}
      onMouseEnter={e => {
        if (!active) {
          e.currentTarget.style.backgroundColor = '#f3f4f6'
        }
      }}
      onMouseLeave={e => {
        if (!active) {
          e.currentTarget.style.backgroundColor = 'transparent'
        }
      }}
    >
      <Icon size={18} />
      {label}
    </button>
  )
}

// Page: Dashboard
function DashboardPage({ meetings, boardMembers }) {
  const nextMeeting = getNextMeeting(meetings)

  return (
    <div>
      <h1
        style={{
          fontSize: '2rem',
          fontWeight: '700',
          color: '#1f2937',
          marginBottom: '2rem',
        }}
      >
        Dashboard
      </h1>

      {/* Stats */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '1.5rem',
          marginBottom: '3rem',
        }}
      >
        <StatCard
          icon={Users}
          title="Board Members"
          value={boardMembers.length}
          color="#3B82F6"
        />
        <StatCard
          icon={Calendar}
          title="Total Meetings"
          value={meetings.length}
          color="#8B5CF6"
        />
        <StatCard
          icon={Building2}
          title="Committees"
          value={committeeConfig.length}
          color="#10B981"
        />
      </div>

      {/* Next Meeting */}
      {nextMeeting && (
        <div
          style={{
            backgroundColor: 'white',
            borderRadius: '0.5rem',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
            overflow: 'hidden',
            marginBottom: '2rem',
          }}
        >
          <div
            style={{
              backgroundColor: '#3B82F6',
              color: 'white',
              padding: '1rem',
              fontSize: '0.875rem',
              fontWeight: '600',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}
          >
            Next Meeting
          </div>
          <div style={{ padding: '1.5rem' }}>
            <h3
              style={{
                fontSize: '1.25rem',
                fontWeight: '600',
                color: '#1f2937',
                marginBottom: '0.5rem',
              }}
            >
              {nextMeeting.title}
            </h3>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '1rem',
                marginBottom: '1.5rem',
                marginTop: '1rem',
              }}
            >
              <div>
                <p
                  style={{
                    fontSize: '0.75rem',
                    color: '#9ca3af',
                    textTransform: 'uppercase',
                    marginBottom: '0.25rem',
                  }}
                >
                  Date & Time
                </p>
                <p style={{ fontSize: '0.95rem', color: '#1f2937', margin: 0 }}>
                  {formatDate(nextMeeting.date)}
                </p>
              </div>
              <div>
                <p
                  style={{
                    fontSize: '0.75rem',
                    color: '#9ca3af',
                    textTransform: 'uppercase',
                    marginBottom: '0.25rem',
                  }}
                >
                  Location
                </p>
                <p style={{ fontSize: '0.95rem', color: '#1f2937', margin: 0 }}>
                  {nextMeeting.location || 'TBD'}
                </p>
              </div>
            </div>
            {nextMeeting.notionUrl && (
              <a
                href={nextMeeting.notionUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.75rem 1rem',
                  backgroundColor: '#f0f9ff',
                  color: '#3b82f6',
                  border: '1px solid #bfdbfe',
                  borderRadius: '0.375rem',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  textDecoration: 'none',
                  cursor: 'pointer',
                }}
              >
                View Agenda & Documents
                <ChevronRight size={16} />
              </a>
            )}
          </div>
        </div>
      )}

      {/* Recent Meetings */}
      <div
        style={{
          backgroundColor: 'white',
          borderRadius: '0.5rem',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            backgroundColor: '#0F172A',
            color: 'white',
            padding: '1rem',
            fontSize: '0.875rem',
            fontWeight: '600',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
          }}
        >
          Recent Meetings
        </div>
        <div>
          {meetings.slice(0, 5).map(meeting => (
            <MeetingRow key={meeting.id} meeting={meeting} />
          ))}
        </div>
      </div>
    </div>
  )
}

// Page: Committees
function CommitteesPage({ meetings }) {
  return (
    <div>
      <h1
        style={{
          fontSize: '2rem',
          fontWeight: '700',
          color: '#1f2937',
          marginBottom: '2rem',
        }}
      >
        Committees
      </h1>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: '1.5rem',
        }}
      >
        {committeeConfig.map(committee => {
          const committeeMeetings = meetings.filter(
            m => m.committee === committee.name
          )
          const nextMeeting = getNextMeeting(committeeMeetings)

          return (
            <div
              key={committee.key}
              style={{
                backgroundColor: 'white',
                borderRadius: '0.5rem',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                overflow: 'hidden',
                borderTop: `4px solid ${committee.color}`,
              }}
            >
              <div style={{ padding: '1.5rem' }}>
                <div style={{ marginBottom: '1rem' }}>
                  <span
                    style={{
                      fontSize: '2rem',
                      marginRight: '0.5rem',
                    }}
                  >
                    {committee.icon}
                  </span>
                  <h3
                    style={{
                      fontSize: '1.25rem',
                      fontWeight: '600',
                      color: '#1f2937',
                      margin: '0 0 0.5rem 0',
                      display: 'inline',
                    }}
                  >
                    {committee.name}
                  </h3>
                </div>

                <p
                  style={{
                    fontSize: '0.875rem',
                    color: '#6b7280',
                    marginBottom: '1.5rem',
                  }}
                >
                  {committee.description}
                </p>

                {nextMeeting && (
                  <div
                    style={{
                      backgroundColor: '#f9fafb',
                      padding: '1rem',
                      borderRadius: '0.375rem',
                      marginBottom: '1rem',
                      borderLeft: `3px solid ${committee.color}`,
                    }}
                  >
                    <p
                      style={{
                        fontSize: '0.75rem',
                        color: '#6b7280',
                        textTransform: 'uppercase',
                        marginBottom: '0.25rem',
                      }}
                    >
                      Next Meeting
                    </p>
                    <p
                      style={{
                        fontSize: '0.95rem',
                        fontWeight: '600',
                        color: '#1f2937',
                        margin: '0 0 0.5rem 0',
                      }}
                    >
                      {formatDate(nextMeeting.date)}
                    </p>
                    <a
                      href={committee.notionUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.25rem',
                        fontSize: '0.75rem',
                        color: committee.color,
                        textDecoration: 'none',
                        fontWeight: '600',
                      }}
                    >
                      View Notion
                      <ChevronRight size={14} />
                    </a>
                  </div>
                )}

                <a
                  href={committee.notionUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.75rem 1rem',
                    backgroundColor: committee.color + '10',
                    color: committee.color,
                    border: `1px solid ${committee.color}30`,
                    borderRadius: '0.375rem',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    textDecoration: 'none',
                    cursor: 'pointer',
                  }}
                >
                  View Agenda & Documents
                  <ExternalLink size={16} />
                </a>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// Page: Board Members
function MembersPage({ boardMembers, onSelectMember }) {
  const [searchTerm, setSearchTerm] = useState('')
  const sortedMembers = sortBoardMembers(boardMembers)

  const filteredMembers = sortedMembers.filter(
    member =>
      member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.position?.some(p => p.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  return (
    <div>
      <h1
        style={{
          fontSize: '2rem',
          fontWeight: '700',
          color: '#1f2937',
          marginBottom: '2rem',
        }}
      >
        Board Members
      </h1>

      {/* Search */}
      <div style={{ marginBottom: '2rem' }}>
        <div
          style={{
            position: 'relative',
            maxWidth: '400px',
          }}
        >
          <Search
            size={18}
            style={{
              position: 'absolute',
              left: '0.75rem',
              top: '50%',
              transform: 'translateY(-50%)',
              color: '#9ca3af',
            }}
          />
          <input
            type="text"
            placeholder="Search by name or position..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '0.75rem 0.75rem 0.75rem 2.5rem',
              border: '1px solid #d1d5db',
              borderRadius: '0.375rem',
              fontSize: '0.875rem',
              fontFamily: 'inherit',
              boxSizing: 'border-box',
            }}
          />
        </div>
      </div>

      {/* Members Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: '1.5rem',
        }}
      >
        {filteredMembers.map(member => (
          <MemberCard
            key={member.id}
            member={member}
            onSelect={() => onSelectMember(member)}
          />
        ))}
      </div>

      {filteredMembers.length === 0 && (
        <div
          style={{
            textAlign: 'center',
            padding: '3rem 1rem',
            color: '#6b7280',
          }}
        >
          <Users size={40} style={{ marginBottom: '1rem', opacity: 0.3 }} />
          <p>No board members found matching your search.</p>
        </div>
      )}

      {/* Quorum Information */}
      <div
        style={{
          backgroundColor: 'white',
          borderRadius: '0.5rem',
          padding: '1.5rem',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
          marginTop: '3rem',
        }}
      >
        <h3
          style={{
            fontSize: '1.125rem',
            fontWeight: '600',
            color: '#1f2937',
            marginBottom: '1rem',
          }}
        >
          Meeting Quorum Requirements
        </h3>
        <table
          style={{
            width: '100%',
            borderCollapse: 'collapse',
          }}
        >
          <thead>
            <tr style={{ borderBottom: '2px solid #e5e7eb' }}>
              <th
                style={{
                  textAlign: 'left',
                  padding: '0.75rem',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  color: '#6b7280',
                  textTransform: 'uppercase',
                }}
              >
                Board Size
              </th>
              <th
                style={{
                  textAlign: 'left',
                  padding: '0.75rem',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  color: '#6b7280',
                  textTransform: 'uppercase',
                }}
              >
                Quorum
              </th>
            </tr>
          </thead>
          <tbody>
            {quorumTable.map((row, idx) => (
              <tr
                key={idx}
                style={{
                  borderBottom: '1px solid #e5e7eb',
                }}
              >
                <td
                  style={{
                    padding: '0.75rem',
                    fontSize: '0.875rem',
                    color: '#1f2937',
                  }}
                >
                  {row.size}
                </td>
                <td
                  style={{
                    padding: '0.75rem',
                    fontSize: '0.875rem',
                    color: '#1f2937',
                    fontWeight: '600',
                  }}
                >
                  {row.quorum} members
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// Page: Reference Documents
function ReferencePage() {
  const [expandedCategory, setExpandedCategory] = useState(null)

  return (
    <div>
      <h1
        style={{
          fontSize: '2rem',
          fontWeight: '700',
          color: '#1f2937',
          marginBottom: '2rem',
        }}
      >
        Reference Documents
      </h1>

      {referenceDocuments.map((section, idx) => (
        <div
          key={idx}
          style={{
            backgroundColor: 'white',
            borderRadius: '0.5rem',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
            marginBottom: '1.5rem',
            overflow: 'hidden',
          }}
        >
          <button
            onClick={() =>
              setExpandedCategory(
                expandedCategory === section.category ? null : section.category
              )
            }
            style={{
              width: '100%',
              padding: '1rem',
              backgroundColor: '#f9fafb',
              border: 'none',
              textAlign: 'left',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              cursor: 'pointer',
              fontSize: '1rem',
              fontWeight: '600',
              color: '#1f2937',
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <FileText size={20} />
              {section.category}
            </span>
            <ChevronDown
              size={20}
              style={{
                transform:
                  expandedCategory === section.category
                    ? 'rotate(180deg)'
                    : 'rotate(0deg)',
                transition: 'transform 0.2s',
              }}
            />
          </button>

          {expandedCategory === section.category && (
            <div>
              {section.items.map((item, itemIdx) => (
                <div
                  key={itemIdx}
                  style={{
                    padding: '1rem',
                    borderTop: itemIdx === 0 ? 'none' : '1px solid #e5e7eb',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <h4
                      style={{
                        fontSize: '0.95rem',
                        fontWeight: '600',
                        color: '#1f2937',
                        margin: '0 0 0.25rem 0',
                      }}
                    >
                      {item.name}
                    </h4>
                    <div
                      style={{
                        display: 'flex',
                        gap: '1rem',
                        marginTop: '0.5rem',
                      }}
                    >
                      {item.status && (
                        <Badge text={item.status} color="#10B981" />
                      )}
                      {item.lastReviewed && (
                        <p
                          style={{
                            fontSize: '0.75rem',
                            color: '#9ca3af',
                            margin: 0,
                          }}
                        >
                          Last reviewed: {item.lastReviewed}
                        </p>
                      )}
                    </div>
                  </div>
                  {item.notionUrl && (
                    <a
                      href={item.notionUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        marginLeft: '1rem',
                        padding: '0.5rem 1rem',
                        backgroundColor: '#f3f4f6',
                        border: '1px solid #d1d5db',
                        borderRadius: '0.375rem',
                        fontSize: '0.75rem',
                        fontWeight: '600',
                        color: '#374151',
                        textDecoration: 'none',
                        cursor: 'pointer',
                      }}
                    >
                      Open
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

// Page: Quick Links
function LinksPage() {
  return (
    <div>
      <h1
        style={{
          fontSize: '2rem',
          fontWeight: '700',
          color: '#1f2937',
          marginBottom: '2rem',
        }}
      >
        Quick Links
      </h1>

      {quickLinks.map((section, idx) => (
        <div key={idx} style={{ marginBottom: '2rem' }}>
          <h2
            style={{
              fontSize: '1.25rem',
              fontWeight: '600',
              color: '#1f2937',
              marginBottom: '1rem',
            }}
          >
            {section.section}
          </h2>

          <div
            style={{
              display: 'grid',
              gap: '1rem',
            }}
          >
            {section.links.map((link, linkIdx) => (
              <a
                key={linkIdx}
                href={link.url}
                target={link.url.startsWith('mailto') ? undefined : '_blank'}
                rel={link.url.startsWith('mailto') ? undefined : 'noopener noreferrer'}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'start',
                  padding: '1rem',
                  backgroundColor: 'white',
                  border: '1px solid #e5e7eb',
                  borderRadius: '0.375rem',
                  textDecoration: 'none',
                  transition: 'all 0.2s',
                  cursor: 'pointer',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = '#3b82f6'
                  e.currentTarget.style.backgroundColor = '#f0f9ff'
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = '#e5e7eb'
                  e.currentTarget.style.backgroundColor = 'white'
                }}
              >
                <div>
                  <h3
                    style={{
                      fontSize: '0.95rem',
                      fontWeight: '600',
                      color: '#1f2937',
                      margin: '0 0 0.25rem 0',
                    }}
                  >
                    {link.name}
                  </h3>
                  <p
                    style={{
                      fontSize: '0.85rem',
                      color: '#6b7280',
                      margin: 0,
                    }}
                  >
                    {link.description}
                  </p>
                </div>
                <ExternalLink
                  size={16}
                  style={{ color: '#3b82f6', marginLeft: '1rem', flexShrink: 0 }}
                />
              </a>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

// Main Portal Component
export default function Portal({ meetings, boardMembers }) {
  const [currentPage, setCurrentPage] = useState('dashboard')
  const [selectedMember, setSelectedMember] = useState(null)

  const sidebarItems = [
    { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { key: 'committees', label: 'Committees', icon: Building2 },
    { key: 'members', label: 'Board Members', icon: Users },
    { key: 'reference', label: 'Reference Documents', icon: FileText },
    { key: 'links', label: 'Quick Links', icon: Link2 },
  ]

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <DashboardPage meetings={meetings} boardMembers={boardMembers} />
      case 'committees':
        return <CommitteesPage meetings={meetings} />
      case 'members':
        return (
          <MembersPage
            boardMembers={boardMembers}
            onSelectMember={setSelectedMember}
          />
        )
      case 'reference':
        return <ReferencePage />
      case 'links':
        return <LinksPage />
      default:
        return null
    }
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        backgroundColor: '#f9fafb',
      }}
    >
      {/* Sidebar */}
      <div
        style={{
          width: '250px',
          backgroundColor: 'white',
          borderRight: '1px solid #e5e7eb',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Logo */}
        <div
          style={{
            backgroundColor: '#0F172A',
            color: 'white',
            padding: '1.5rem 1rem',
            borderBottom: '1px solid #1f2937',
          }}
        >
          <h1
            style={{
              fontSize: '1.25rem',
              fontWeight: '700',
              margin: '0 0 0.25rem 0',
            }}
          >
            TSF Board
          </h1>
          <p
            style={{
              fontSize: '0.75rem',
              color: '#cbd5e1',
              margin: 0,
            }}
          >
            Portal
          </p>
        </div>

        {/* Navigation */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '1rem 0',
          }}
        >
          <SidebarSection
            title="Main"
            items={sidebarItems}
            active={currentPage}
            onSelect={setCurrentPage}
          />
        </div>

        {/* Footer */}
        <div
          style={{
            borderTop: '1px solid #e5e7eb',
            padding: '1rem',
            fontSize: '0.75rem',
            color: '#9ca3af',
            textAlign: 'center',
          }}
        >
          <p style={{ margin: '0 0 0.5rem 0' }}>TSF Board Portal</p>
          <a
            href="/login"
            style={{
              color: '#3b82f6',
              textDecoration: 'none',
              fontSize: '0.7rem',
            }}
            onClick={async e => {
              e.preventDefault()
              await fetch('/api/auth', { method: 'DELETE' })
              window.location.href = '/login'
            }}
          >
            Logout
          </a>
        </div>
      </div>

      {/* Main Content */}
      <div
        style={{
          flex: 1,
          padding: '2rem',
          overflowY: 'auto',
        }}
      >
        {renderPage()}
      </div>

      {/* Member Detail Modal */}
      <MemberDetailModal
        member={selectedMember}
        committees={committeeConfig}
        onClose={() => setSelectedMember(null)}
      />
    </div>
  )
}
