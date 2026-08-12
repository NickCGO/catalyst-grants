import * as React from 'npm:react@18.3.1'
import {
  Body,
  Button,
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

interface Props {
  name?: string
  organisation?: string
  appUrl?: string
}

const Email = ({ name, organisation, appUrl }: Props) => {
  const base = appUrl || 'https://www.findthegrant.com'
  return (
    <Html lang="en" dir="ltr">
      <Head />
      <Preview>Welcome to Find The Grant — your Charter Member account is ready</Preview>
      <Body style={main}>
        <Container style={container}>
          <Text style={brand}>FIND THE GRANT</Text>
          <Heading style={heading}>Welcome{name ? `, ${name}` : ''} 👋</Heading>
          <Text style={text}>
            Your account is live{organisation ? ` for ${organisation}` : ''}. You are one of the first 50
            Charter Members, which locks your rate at $47/month for life.
          </Text>
          <Text style={text}>
            The fastest way to get value: complete your organisation profile. That profile powers your funder
            match scores and every proposal the AI writer drafts for you.
          </Text>
          <Section style={{ margin: '28px 0' }}>
            <Button href={`${base}/onboarding`} style={button}>
              Complete my profile
            </Button>
          </Section>
          <Text style={listItem}>• Match scores against thousands of Africa-active funders</Text>
          <Text style={listItem}>• AI-written proposals, concept notes and letters of enquiry</Text>
          <Text style={listItem}>• Deadline tracking and an application pipeline</Text>
          <Hr style={hr} />
          <Text style={muted}>
            Questions? Just reply to this email or use the in-app support chat — we read every message.
          </Text>
        </Container>
      </Body>
    </Html>
  )
}

export const template = {
  component: Email,
  subject: 'Welcome to Find The Grant',
  displayName: 'Welcome email',
  previewData: { name: 'Thandiwe', organisation: 'Ubuntu Youth Trust' },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Inter, Arial, sans-serif' }
const container = { padding: '32px 28px', maxWidth: '560px' }
const brand = { fontSize: '11px', letterSpacing: '0.18em', color: '#0EA5E9', fontWeight: 700, margin: '0 0 12px' }
const heading = { fontSize: '26px', lineHeight: '1.25', color: '#0F172A', margin: '0 0 16px', fontWeight: 700 }
const text = { fontSize: '15px', lineHeight: '1.6', color: '#334155', margin: '0 0 14px' }
const listItem = { fontSize: '14px', lineHeight: '1.6', color: '#475569', margin: '0 0 6px' }
const button = {
  backgroundColor: '#0EA5E9',
  color: '#ffffff',
  fontSize: '15px',
  fontWeight: 600,
  padding: '13px 22px',
  borderRadius: '12px',
  textDecoration: 'none',
}
const hr = { borderColor: '#E2E8F0', margin: '28px 0 16px' }
const muted = { fontSize: '12px', lineHeight: '1.6', color: '#64748B', margin: 0 }
