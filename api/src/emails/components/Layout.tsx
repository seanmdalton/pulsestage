/**
 * Email Layout Component
 *
 * Reusable layout for all PulseStage emails
 */

import { Html, Head, Body, Container, Section, Text, Link, Hr } from '@react-email/components';
import * as React from 'react';

interface LayoutProps {
  previewText?: string;
  children: React.ReactNode;
}

export default function Layout({ previewText, children }: LayoutProps) {
  return (
    <Html>
      <Head />
      {previewText && (
        <div
          style={{
            display: 'none',
            overflow: 'hidden',
            lineHeight: '1px',
            opacity: 0,
            maxHeight: 0,
            maxWidth: 0,
          }}
        >
          {previewText}
        </div>
      )}
      <Body style={main}>
        <Container style={container}>
          {/* Header */}
          <Section style={header}>
            <Text style={logo}>PulseStage</Text>
          </Section>

          {/* Main Content */}
          <Section style={content}>{children}</Section>

          {/* Footer */}
          <Hr style={hr} />
          <Section style={footer}>
            <Text style={footerText}>
              This email was sent by PulseStage. If you no longer wish to receive these
              notifications,{' '}
              <Link href="{{unsubscribeUrl}}" style={link}>
                unsubscribe here
              </Link>
              .
            </Text>
            <Text style={footerText}>
              © {new Date().getFullYear()} PulseStage. All rights reserved.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

// Styles
const main = {
  backgroundColor: '#f6f9fc',
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 48px',
  marginBottom: '64px',
};

const header = {
  padding: '32px 24px',
  borderBottom: '1px solid #e6ebf1',
};

const logo = {
  fontSize: '24px',
  fontWeight: 'bold',
  color: '#3b82f6',
  margin: '0',
};

const content = {
  padding: '24px',
};

const hr = {
  borderColor: '#e6ebf1',
  margin: '20px 0',
};

const footer = {
  padding: '0 24px',
};

const footerText = {
  fontSize: '12px',
  color: '#6b7280',
  lineHeight: '16px',
  margin: '4px 0',
};

const link = {
  color: '#3b82f6',
  textDecoration: 'underline',
};
