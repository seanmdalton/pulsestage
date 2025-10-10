/**
 * Question Rejected Email Template
 *
 * Sent to users when their question is rejected by a moderator
 */

import { Heading, Text, Button, Section } from '@react-email/components';
import * as React from 'react';
import Layout from './components/Layout.js';

export interface QuestionRejectedEmailProps {
  userName: string;
  questionBody: string;
  rejectionReason?: string;
  guidelinesUrl: string;
  unsubscribeUrl: string;
}

export default function QuestionRejectedEmail({
  userName = 'User',
  questionBody = 'Sample question',
  rejectionReason = 'Content did not meet community guidelines',
  guidelinesUrl = 'https://pulsestage.dev/guidelines',
  unsubscribeUrl = 'https://pulsestage.dev/unsubscribe',
}: QuestionRejectedEmailProps) {
  const previewText = `Your question was not approved`;

  return (
    <Layout previewText={previewText}>
      <Heading style={h1}>Your Question Was Not Approved</Heading>

      <Text style={text}>Hi {userName},</Text>

      <Text style={text}>
        Thank you for your submission. After review, we were unable to approve the following
        question:
      </Text>

      <Section style={questionSection}>
        <Text style={sectionLabel}>Your Submission:</Text>
        <Text style={questionText}>{questionBody}</Text>
      </Section>

      {rejectionReason && (
        <Section style={reasonSection}>
          <Text style={sectionLabel}>Reason:</Text>
          <Text style={reasonText}>{rejectionReason}</Text>
        </Section>
      )}

      <Text style={text}>
        We encourage you to review our community guidelines and submit a new question that aligns
        with our standards. Our goal is to maintain a respectful and productive environment for
        everyone.
      </Text>

      <Section style={buttonSection}>
        <Button href={guidelinesUrl} style={button}>
          Review Community Guidelines
        </Button>
      </Section>

      <Text style={footerNote}>
        If you believe this was a mistake or have questions about this decision, please reach out to
        our support team. To manage your notification preferences,{' '}
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
  backgroundColor: '#f9fafb',
  borderLeft: '4px solid #6b7280',
  padding: '16px',
  margin: '24px 0',
  borderRadius: '4px',
};

const reasonSection = {
  backgroundColor: '#fef2f2',
  borderLeft: '4px solid #ef4444',
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

const reasonText = {
  color: '#991b1b',
  fontSize: '16px',
  lineHeight: '24px',
  margin: '0',
};

const buttonSection = {
  margin: '32px 0',
  textAlign: 'center' as const,
};

const button = {
  backgroundColor: '#6b7280',
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
