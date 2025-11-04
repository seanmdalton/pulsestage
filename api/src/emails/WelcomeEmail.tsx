/**
 * Welcome Email Template
 *
 * Sent to new users on their first login
 */

import { Heading, Text, Button, Section, Hr } from '@react-email/components';
import * as React from 'react';
import Layout from './components/Layout.js';

export interface WelcomeEmailProps {
  userName: string;
  tenantName: string;
  homeTeamName: string;
  dashboardUrl: string;
}

export default function WelcomeEmail({
  userName = 'User',
  tenantName = 'PulseStage',
  homeTeamName = 'General',
  dashboardUrl = 'https://pulsestage.dev/general/dashboard',
}: WelcomeEmailProps) {
  const previewText = `Welcome to ${tenantName}`;

  return (
    <Layout previewText={previewText}>
      <Heading style={h1}>Welcome to {tenantName}!</Heading>

      <Text style={text}>Hi {userName},</Text>

      <Text style={text}>
        Welcome to PulseStage! We're excited to have you here. PulseStage is your platform for
        anonymous Q&A and team pulse surveys.
      </Text>

      <Section style={highlightSection}>
        <Text style={highlightText}>
          <strong>Your Home Team:</strong> {homeTeamName}
        </Text>
        <Text style={highlightSubtext}>
          Your pulse surveys will be sent based on your home team. You can change your home team
          anytime in your profile settings.
        </Text>
      </Section>

      <Heading style={h2}>Getting Started</Heading>

      <Section style={featureSection}>
        <Text style={featureTitle}>Ask Questions Anonymously</Text>
        <Text style={featureText}>
          Submit questions anonymously to your team. Your identity is protected, and questions are
          aggregated to ensure anonymity.
        </Text>
      </Section>

      <Section style={featureSection}>
        <Text style={featureTitle}>Participate in Discussions</Text>
        <Text style={featureText}>
          Upvote questions you find important. Help surface the most relevant topics for your team.
        </Text>
      </Section>

      <Section style={featureSection}>
        <Text style={featureTitle}>Respond to Pulse Surveys</Text>
        <Text style={featureText}>
          Share how you're feeling through regular pulse surveys. Your responses are anonymous and
          help build a better workplace.
        </Text>
      </Section>

      <Hr style={hr} />

      <Section style={buttonSection}>
        <Button href={dashboardUrl} style={button}>
          Go to Dashboard
        </Button>
      </Section>

      <Text style={helpText}>
        <strong>Need help?</strong> Explore the team selector to browse questions from different
        teams, manage your profile settings, or reach out to your team admin.
      </Text>

      <Text style={signatureText}>
        Welcome aboard! We're here to help you make your voice heard.
        <br />
        <br />— The {tenantName} Team
      </Text>
    </Layout>
  );
}

// Styles
const h1 = {
  color: '#1f2937',
  fontSize: '28px',
  fontWeight: 'bold',
  margin: '0 0 24px',
  padding: '0',
} as React.CSSProperties;

const h2 = {
  color: '#1f2937',
  fontSize: '20px',
  fontWeight: '600',
  margin: '32px 0 16px',
  padding: '0',
} as React.CSSProperties;

const text = {
  color: '#374151',
  fontSize: '16px',
  lineHeight: '24px',
  margin: '0 0 16px',
} as React.CSSProperties;

const highlightSection = {
  backgroundColor: '#dbeafe',
  borderLeft: '4px solid #3b82f6',
  padding: '20px',
  margin: '24px 0',
  borderRadius: '8px',
} as React.CSSProperties;

const highlightText = {
  color: '#1e40af',
  fontSize: '16px',
  fontWeight: '600',
  margin: '0 0 8px',
} as React.CSSProperties;

const highlightSubtext = {
  color: '#1e3a8a',
  fontSize: '14px',
  lineHeight: '20px',
  margin: '0',
} as React.CSSProperties;

const featureSection = {
  marginBottom: '24px',
} as React.CSSProperties;

const featureTitle = {
  color: '#1f2937',
  fontSize: '16px',
  fontWeight: '600',
  margin: '0 0 8px',
} as React.CSSProperties;

const featureText = {
  color: '#6b7280',
  fontSize: '14px',
  lineHeight: '20px',
  margin: '0',
} as React.CSSProperties;

const hr = {
  border: 'none',
  borderTop: '1px solid #e5e7eb',
  margin: '32px 0',
} as React.CSSProperties;

const buttonSection = {
  textAlign: 'center' as const,
  margin: '32px 0',
} as React.CSSProperties;

const button = {
  backgroundColor: '#3b82f6',
  borderRadius: '8px',
  color: '#ffffff',
  fontSize: '16px',
  fontWeight: '600',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '14px 32px',
  border: 'none',
  cursor: 'pointer',
} as React.CSSProperties;

const helpText = {
  color: '#6b7280',
  fontSize: '14px',
  lineHeight: '20px',
  margin: '24px 0',
  padding: '16px',
  backgroundColor: '#f9fafb',
  borderRadius: '8px',
} as React.CSSProperties;

const signatureText = {
  color: '#6b7280',
  fontSize: '14px',
  textAlign: 'left' as const,
  margin: '32px 0 0',
  fontStyle: 'italic',
} as React.CSSProperties;
