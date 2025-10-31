/**
 * Weekly Pulse Invitation Email Template
 *
 * Sent to users for their weekly pulse question with one-tap response buttons
 */

import { Heading, Text, Button, Section, Row, Column } from '@react-email/components';
import * as React from 'react';
import Layout from './components/Layout.js';

export interface PulseInvitationEmailProps {
  userName: string;
  questionText: string;
  scale: 'LIKERT_1_5' | 'NPS_0_10';
  token: string;
  baseUrl: string;
  tenantName: string;
}

export default function PulseInvitationEmail({
  userName = 'User',
  questionText = 'How recognized do you feel for your contributions this week?',
  scale = 'LIKERT_1_5',
  token = 'sample-token-123',
  baseUrl = 'https://pulsestage.dev',
  tenantName = 'PulseStage',
}: PulseInvitationEmailProps) {
  const previewText = 'Your weekly pulse check - takes 5 seconds';

  // Generate response URLs based on scale
  const getResponseUrl = (score: number) =>
    `${baseUrl}/pulse/respond?token=${token}&score=${score}`;

  // Determine scale options
  const isLikert = scale === 'LIKERT_1_5';
  const options = isLikert
    ? [
        { score: 1, label: '1', emoji: '😞', color: '#ef4444' },
        { score: 2, label: '2', emoji: '😕', color: '#f97316' },
        { score: 3, label: '3', emoji: '😐', color: '#eab308' },
        { score: 4, label: '4', emoji: '🙂', color: '#84cc16' },
        { score: 5, label: '5', emoji: '😄', color: '#22c55e' },
      ]
    : [
        { score: 0, label: '0', emoji: '😞', color: '#ef4444' },
        { score: 1, label: '1', emoji: '😞', color: '#ef4444' },
        { score: 2, label: '2', emoji: '😕', color: '#f97316' },
        { score: 3, label: '3', emoji: '😕', color: '#f97316' },
        { score: 4, label: '4', emoji: '😐', color: '#f59e0b' },
        { score: 5, label: '5', emoji: '😐', color: '#eab308' },
        { score: 6, label: '6', emoji: '🙂', color: '#a3e635' },
        { score: 7, label: '7', emoji: '🙂', color: '#84cc16' },
        { score: 8, label: '8', emoji: '😊', color: '#4ade80' },
        { score: 9, label: '9', emoji: '😄', color: '#22c55e' },
        { score: 10, label: '10', emoji: '🤩', color: '#10b981' },
      ];

  return (
    <Layout previewText={previewText}>
      <Heading style={h1}>Your Weekly Pulse 💙</Heading>

      <Text style={text}>Hi {userName},</Text>

      <Text style={text}>
        Take 5 seconds to share how you're feeling this week. Your response is completely anonymous
        and helps us build a better workplace.
      </Text>

      <Section style={questionSection}>
        <Text style={questionTextStyle}>{questionText}</Text>
      </Section>

      <Text style={instructionText}>Click the number that best represents your answer:</Text>

      {/* Response buttons */}
      {isLikert ? (
        // Likert 1-5: Single row of buttons
        <Section>
          <Row>
            {options.map(option => (
              <Column key={option.score}>
                <Button href={getResponseUrl(option.score)} style={getButtonStyle(option.color)}>
                  <span style={emojiStyle}>{option.emoji}</span>
                  <br />
                  <span style={scoreStyle}>{option.label}</span>
                </Button>
              </Column>
            ))}
          </Row>
        </Section>
      ) : (
        // NPS 0-10: Two rows of buttons
        <>
          <Section>
            <Row>
              {options.slice(0, 6).map(option => (
                <Column key={option.score}>
                  <Button
                    href={getResponseUrl(option.score)}
                    style={getButtonStyleSmall(option.color)}
                  >
                    <span style={scoreStyleSmall}>{option.label}</span>
                  </Button>
                </Column>
              ))}
            </Row>
            <Row>
              {options.slice(6).map(option => (
                <Column key={option.score}>
                  <Button
                    href={getResponseUrl(option.score)}
                    style={getButtonStyleSmall(option.color)}
                  >
                    <span style={scoreStyleSmall}>{option.label}</span>
                  </Button>
                </Column>
              ))}
            </Row>
          </Section>
        </>
      )}

      <Text style={privacyNote}>
        🔒 <strong>Your response is anonymous.</strong> Individual responses are never shared. We
        only show aggregates when there are at least 5 responses.
      </Text>

      <Text style={footerNote}>
        This link expires in 7 days. You can respond only once per question. If you'd like to adjust
        when you receive these pulses, contact your administrator.
      </Text>

      <Text style={signatureText}>
        Thank you for helping make {tenantName} a better place to work! 🙏
      </Text>
    </Layout>
  );
}

// Dynamic button style generator
const getButtonStyle = (color: string) => ({
  backgroundColor: color,
  borderRadius: '8px',
  color: '#ffffff',
  fontSize: '16px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '12px 16px',
  minWidth: '60px',
  margin: '4px',
  border: 'none',
  cursor: 'pointer',
});

const getButtonStyleSmall = (color: string) => ({
  backgroundColor: color,
  borderRadius: '6px',
  color: '#ffffff',
  fontSize: '14px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '8px 12px',
  minWidth: '45px',
  margin: '2px',
  border: 'none',
  cursor: 'pointer',
});

// Styles
const h1 = {
  color: '#1f2937',
  fontSize: '24px',
  fontWeight: 'bold',
  margin: '0 0 24px',
  padding: '0',
} as React.CSSProperties;

const text = {
  color: '#374151',
  fontSize: '16px',
  lineHeight: '24px',
  margin: '0 0 16px',
} as React.CSSProperties;

const questionSection = {
  backgroundColor: '#eff6ff',
  borderLeft: '4px solid #3b82f6',
  padding: '20px',
  margin: '24px 0',
  borderRadius: '8px',
} as React.CSSProperties;

const questionTextStyle = {
  color: '#1e40af',
  fontSize: '18px',
  fontWeight: '600',
  lineHeight: '28px',
  margin: '0',
} as React.CSSProperties;

const instructionText = {
  color: '#6b7280',
  fontSize: '14px',
  margin: '24px 0 16px',
  textAlign: 'center' as const,
} as React.CSSProperties;

const emojiStyle = {
  fontSize: '24px',
  display: 'block',
  marginBottom: '4px',
} as React.CSSProperties;

const scoreStyle = {
  fontSize: '16px',
  fontWeight: 'bold',
} as React.CSSProperties;

const scoreStyleSmall = {
  fontSize: '14px',
  fontWeight: 'bold',
} as React.CSSProperties;

const privacyNote = {
  backgroundColor: '#f0fdf4',
  border: '1px solid #bbf7d0',
  borderRadius: '8px',
  padding: '16px',
  margin: '24px 0',
  fontSize: '14px',
  color: '#15803d',
  lineHeight: '20px',
} as React.CSSProperties;

const footerNote = {
  color: '#9ca3af',
  fontSize: '12px',
  lineHeight: '18px',
  margin: '24px 0 8px',
  textAlign: 'center' as const,
} as React.CSSProperties;

const signatureText = {
  color: '#6b7280',
  fontSize: '14px',
  textAlign: 'center' as const,
  margin: '24px 0 0',
  fontStyle: 'italic',
} as React.CSSProperties;
