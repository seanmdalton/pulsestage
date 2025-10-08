/**
 * Question Answered Email Template
 *
 * Sent to users when their question receives an answer
 */

import { Heading, Text, Button, Section } from '@react-email/components';
import * as React from 'react';
import Layout from './components/Layout.js';

export interface QuestionAnsweredEmailProps {
  userName: string;
  questionBody: string;
  answerBody: string;
  responderName: string;
  questionUrl: string;
  unsubscribeUrl: string;
}

export default function QuestionAnsweredEmail({
  userName = 'User',
  questionBody = 'How do I get started with PulseStage?',
  answerBody = 'Welcome! You can get started by...',
  responderName = 'Moderator',
  questionUrl = 'https://pulsestage.dev/questions/123',
  unsubscribeUrl = 'https://pulsestage.dev/unsubscribe',
}: QuestionAnsweredEmailProps) {
  const previewText = `Your question was answered by ${responderName}`;

  return (
    <Layout previewText={previewText}>
      <Heading style={h1}>Your Question Was Answered!</Heading>

      <Text style={text}>Hi {userName},</Text>

      <Text style={text}>Great news! {responderName} has answered your question.</Text>

      <Section style={questionSection}>
        <Text style={sectionLabel}>Your Question:</Text>
        <Text style={questionText}>{questionBody}</Text>
      </Section>

      <Section style={answerSection}>
        <Text style={sectionLabel}>Answer:</Text>
        <Text style={answerText}>{answerBody}</Text>
      </Section>

      <Section style={buttonSection}>
        <Button href={questionUrl} style={button}>
          View Full Answer
        </Button>
      </Section>

      <Text style={footerNote}>
        You received this email because you submitted a question on PulseStage. To manage your
        notification preferences,{' '}
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
  borderLeft: '4px solid #3b82f6',
  padding: '16px',
  margin: '24px 0',
  borderRadius: '4px',
};

const answerSection = {
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

const answerText = {
  color: '#1f2937',
  fontSize: '16px',
  lineHeight: '24px',
  margin: '0',
  whiteSpace: 'pre-wrap' as const,
};

const buttonSection = {
  margin: '32px 0',
  textAlign: 'center' as const,
};

const button = {
  backgroundColor: '#3b82f6',
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
