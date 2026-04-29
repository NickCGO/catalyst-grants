import * as React from 'npm:react@18.3.1'
import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = 'GrantMatch'

interface SupportEscalationProps {
  fromName?: string
  fromEmail?: string
  message?: string
  pageUrl?: string
  conversation?: Array<{ role: string; content: string }>
}

const SupportEscalationEmail = ({
  fromName,
  fromEmail,
  message,
  pageUrl,
  conversation,
}: SupportEscalationProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>New {SITE_NAME} support request from {fromName || fromEmail || 'a visitor'}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>New support request</Heading>
        <Text style={text}>
          <strong>From:</strong> {fromName || 'Anonymous'}
          {fromEmail ? ` <${fromEmail}>` : ''}
        </Text>
        {pageUrl ? (
          <Text style={text}>
            <strong>Page:</strong> {pageUrl}
          </Text>
        ) : null}
        <Section style={messageBox}>
          <Text style={messageLabel}>Message</Text>
          <Text style={messageText}>{message || '(no message)'}</Text>
        </Section>
        {Array.isArray(conversation) && conversation.length > 0 ? (
          <>
            <Hr style={hr} />
            <Heading as="h2" style={h2}>Chat transcript</Heading>
            {conversation.map((m, i) => (
              <Text key={i} style={transcriptLine}>
                <strong style={{ textTransform: 'capitalize' }}>{m.role}:</strong> {m.content}
              </Text>
            ))}
          </>
        ) : null}
        <Hr style={hr} />
        <Text style={footer}>Sent automatically by the {SITE_NAME} support chatbot.</Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: SupportEscalationEmail,
  subject: (data: Record<string, any>) =>
    `Support request from ${data?.fromName || data?.fromEmail || 'GrantMatch visitor'}`,
  displayName: 'Support escalation',
  previewData: {
    fromName: 'Jane Doe',
    fromEmail: 'jane@example.org',
    message: 'I would like to know more about pricing for our NGO.',
    pageUrl: 'https://grant-match.app/',
    conversation: [
      { role: 'user', content: 'Hi, what is the pricing?' },
      { role: 'assistant', content: 'Founding-member tier is $47/month USD.' },
    ],
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Inter, Arial, sans-serif' }
const container = { padding: '24px 28px', maxWidth: '600px' }
const h1 = { fontSize: '22px', fontWeight: 'bold', color: '#0f172a', margin: '0 0 16px' }
const h2 = { fontSize: '16px', fontWeight: 600, color: '#0f172a', margin: '20px 0 8px' }
const text = { fontSize: '14px', color: '#334155', lineHeight: '1.5', margin: '0 0 8px' }
const messageBox = {
  backgroundColor: '#f1f5f9',
  borderLeft: '3px solid #0EA5E9',
  padding: '12px 16px',
  borderRadius: '6px',
  margin: '16px 0',
}
const messageLabel = { fontSize: '12px', color: '#64748b', textTransform: 'uppercase' as const, letterSpacing: '0.05em', margin: '0 0 4px' }
const messageText = { fontSize: '14px', color: '#0f172a', lineHeight: '1.5', margin: 0, whiteSpace: 'pre-wrap' as const }
const transcriptLine = { fontSize: '13px', color: '#475569', lineHeight: '1.5', margin: '0 0 6px' }
const hr = { borderColor: '#e2e8f0', margin: '20px 0' }
const footer = { fontSize: '12px', color: '#94a3b8', margin: '12px 0 0' }
