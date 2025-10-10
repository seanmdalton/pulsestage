/**
 * Question Approved Email Template
 *
 * Sent to users when their question is approved by a moderator after being flagged
 */

import { Heading, Text, Button, Section } from '@react-email/components';
import * as React from 'react';
import Layout from './components/Layout.js';

export interface QuestionApprovedEmailProps {
  userName: string;
  questionBody: string;
  questionUrl: string;
  unsubscribeUrl: string;
}

export default function QuestionApprovedEmail({
  userName = 'User',
  questionBody = 'What is our remote work policy?',
  questionUrl = 'https://pulsestage.dev/questions/123',
  unsubscribeUrl = 'https://pulsestage.dev/unsubscribe',
}: QuestionApprovedEmailProps) {
  const previewText = `Your question has been approved and published`;

  return (
    <Layout previewText={previewText}>
      <Heading style={h1}>✓ Your Question Has Been Approved!</Heading>

      <Text style={text}>Hi {userName},</Text>

      <Text style={text}>
        Good news! Your question has been reviewed and approved by our moderation team. It's now
        live and visible to everyone on PulseStage.
      </Text>

      <Section style={questionSection}>
        <Text style={sectionLabel}>Your Question:</Text>
        <Text style={questionText}>{questionBody}</Text>
      </Section>

      <Text style={text}>
        Community members can now upvote your question and moderators can provide answers. You'll
        receive an email notification when your question is answered.
      </Text>

      <Section style={buttonSection}>
        <Button href={questionUrl} style={button}>
          View Your Question
        </Button>
      </Section>

      <Text style={footerNote}>
        Thank you for participating in our community! To manage your notification preferences,{' '}
        <a href={unsubscribeUrl} style={link}>
          click here
        </a>
        .
      </Text>
    </Layout>
  );
}

// Styles
const h1 = {
  color: '#1f2937',
  fontSize: '24px',
  fontWeight: 'bold',
  margin: '0 0 24px',
  padding: '0',
};

const text = {
  color: '#374151',
  fontSize: '16px',
  lineHeight: '24px',
  margin: '0 0 16px',
};

const questionSection = {
  backgroundColor: '#f0fdf4',
  borderLeft: '4px solid #10b981',
  padding: '16px',
  margin: '24px 0',
  borderRadius: '4px',
};

const sectionLabel = {
  color: '#6b7280',
  fontSize: '12px',
  fontWeight: 'bold',
  textTransform: 'uppercase' as const,
  margin: '0 0 8px',
  letterSpacing: '0.5px',
};

const questionText = {
  color: '#1f2937',
  fontSize: '16px',
  lineHeight: '24px',
  margin: '0',
};

const buttonSection = {
  margin: '32px 0',
  textAlign: 'center' as const,
};

const button = {
  backgroundColor: '#10b981',
  borderRadius: '6px',
  color: '#ffffff',
  fontSize: '16px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '12px 32px',
};

const footerNote = {
  color: '#6b7280',
  fontSize: '14px',
  lineHeight: '20px',
  margin: '32px 0 0',
};

const link = {
  color: '#3b82f6',
  textDecoration: 'underline',
};
