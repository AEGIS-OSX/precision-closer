import type { ReactNode } from "react";
import VoiceAgent from '@/components/VoiceAgent';

function Section({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <section className={`mb-[var(--space-10)] ${className}`}>
      {children}
    </section>
  );
}

function H2({ children }: { children: ReactNode }) {
  return (
    <h2 className="text-[var(--color-text-primary)] text-[length:var(--font-size-3)] font-[family-name:var(--font-heading)] font-semibold tracking-tight mb-[var(--space-4)]">
      {children}
    </h2>
  );
}

function H3({ children }: { children: ReactNode }) {
  return (
    <h3 className="text-[var(--color-text-primary)] text-[length:var(--font-size-2)] font-[family-name:var(--font-heading)] font-medium tracking-tight mb-[var(--space-2)]">
      {children}
    </h3>
  );
}

function P({ children }: { children: ReactNode }) {
  return (
    <p className="text-[var(--color-text-secondary)] text-[length:var(--font-size-1)] leading-relaxed mb-[var(--space-3)]">
      {children}
    </p>
  );
}

function UL({ children }: { children: ReactNode }) {
  return (
    <ul className="list-disc list-inside text-[var(--color-text-secondary)] text-[length:var(--font-size-1)] leading-relaxed space-y-[var(--space-1)] mb-[var(--space-3)]">
      {children}
    </ul>
  );
}

function LI({ children }: { children: ReactNode }) {
  return <li>{children}</li>;
}

function Code({ children }: { children: ReactNode }) {
  return (
    <code className="bg-[var(--color-surface)] px-[var(--space-1)] py-0.5 rounded text-[var(--color-text-primary)] text-[length:var(--font-size-0)] font-mono">
      {children}
    </code>
  );
}

function Pre({ children }: { children: ReactNode }) {
  return (
    <pre className="bg-[var(--color-surface)] p-[var(--space-3)] rounded-lg overflow-x-auto text-[var(--color-text-primary)] text-[length:var(--font-size-0)] font-mono mb-[var(--space-3)]">
      {children}
    </pre>
  );
}

export default function Home() {
  return (
    <main className="min-h-screen bg-[var(--color-canvas)]">
      {/* Hero */}
      <header className="border-b border-[var(--color-border)] bg-[var(--color-surface)]">
        <div className="max-w-[960px] mx-auto px-[var(--space-4)] md:px-[var(--space-6)] py-[var(--space-8)]">
          <h1 className="text-[var(--color-text-primary)] text-[length:var(--font-size-5)] font-[family-name:var(--font-heading)] font-bold tracking-tight mb-[var(--space-3)]">
            Precision Closer
          </h1>
          <p className="text-[var(--color-text-secondary)] text-[length:var(--font-size-2)] leading-relaxed max-w-[640px]">
            AI-powered sales coaching and call analysis platform. Built for teams that close.
          </p>
        </div>
      </header>

      <div className="max-w-[960px] mx-auto px-[var(--space-4)] md:px-[var(--space-6)] py-[var(--space-8)]">
        {/* Overview */}
        <Section>
          <H2>Overview</H2>
          <P>
            Precision Closer is a Next.js application that provides AI-driven sales coaching through voice call analysis and real-time feedback. The platform integrates with VAPI AI for voice agent capabilities and uses Upstash Redis for rate limiting and session management.
          </P>
        </Section>

        {/* Architecture */}
        <Section>
          <H2>Architecture</H2>
          <P>The application follows a modular architecture with clear separation of concerns:</P>
          <UL>
            <LI><strong>App Router</strong> — Next.js 14+ app directory structure with route groups</LI>
            <LI><strong>API Layer</strong> — Route handlers for external service integration (VAPI, Upstash)</LI>
            <LI><strong>Components</strong> — Reusable UI components with Tailwind CSS styling</LI>
            <LI><strong>Hooks</strong> — Custom React hooks for state management and side effects</LI>
            <LI><strong>Lib</strong> — Utility functions, types, and service clients</LI>
          </UL>
        </Section>

        {/* Key Features */}
        <Section>
          <H2>Key Features</H2>
          
          <H3>Voice Agent Integration</H3>
          <P>
            Real-time AI voice coaching powered by VAPI. The <Code>VoiceAgent</Code> component handles call state management, audio streaming, and transcript display. See <Code>components/VoiceAgent.tsx</Code> for implementation details.
          </P>

          <H3>Rate Limiting</H3>
          <P>
            Upstash Redis-backed rate limiting protects API endpoints from abuse. Configured via environment variables with sensible defaults for production workloads.
          </P>

          <H3>Session Management</H3>
          <P>
            Secure session handling with middleware-based authentication. Join links with unique session IDs enable team collaboration without complex auth flows.
          </P>
        </Section>

        {/* Environment Setup */}
        <Section>
          <H2>Environment Setup</H2>
          <P>Copy <Code>.env.example</Code> to <Code>.env.local</Code> and configure the following variables:</P>
          <Pre>
{`# Upstash Redis (required for rate limiting)
UPSTASH_REDIS_REST_URL=https://your-instance.upstash.io
UPSTASH_REDIS_REST_TOKEN=your_token_here

# VAPI AI Voice Agent
NEXT_PUBLIC_VAPI_PUBLIC_KEY=your_vapi_public_key_here
NEXT_PUBLIC_VAPI_ASSISTANT_ID=your_vapi_assistant_id_here`}
          </Pre>
          <P>
            Obtain VAPI credentials from <a href="https://dashboard.vapi.ai" className="text-[var(--color-accent)] underline">dashboard.vapi.ai</a>. Upstash credentials are available in your Upstash console.
          </P>
        </Section>

        {/* Development */}
        <Section>
          <H2>Development</H2>
          <Pre>
{`# Install dependencies
npm install

# Run development server
npm run dev

# Type check
npm run typecheck

# Build for production
npm run build`}
          </Pre>
          <P>
            The dev server runs on <Code>http://localhost:3000</Code>. API routes are available at <Code>/api/*</Code>.
          </P>
        </Section>

        {/* Deployment */}
        <Section>
          <H2>Deployment</H2>
          <P>
            Deploy to Vercel with zero configuration. Ensure all environment variables are set in the Vercel dashboard before deploying.
          </P>
          <P>
            Required Vercel environment variables: <Code>UPSTASH_REDIS_REST_URL</Code>, <Code>UPSTASH_REDIS_REST_TOKEN</Code>, <Code>NEXT_PUBLIC_VAPI_PUBLIC_KEY</Code>, <Code>NEXT_PUBLIC_VAPI_ASSISTANT_ID</Code>.
          </P>
        </Section>

        {/* API Routes */}
        <Section>
          <H2>API Routes</H2>
          <UL>
            <LI><Code>POST /api/vapi/start</Code> — Initiates a VAPI voice session</LI>
            <LI><Code>POST /api/vapi/end</Code> — Ends an active VAPI session</LI>
            <LI><Code>GET /api/rate-limit</Code> — Check current rate limit status</LI>
          </UL>
        </Section>

        {/* Track B */}
        <Section>
          <H2>Track B: Voice Agent</H2>
          <P>
            The voice agent surface is the primary interaction point for AI coaching. Users initiate calls, receive real-time feedback, and access transcripts post-call. The component is designed for standalone deployment or embedded use within the dashboard.
          </P>
          <P>
            Access the voice agent at <Code>/join/&#123;sessionId&#125;</Code> or via the dashboard below.
          </P>
        </Section>
      </div>

      <VoiceAgent />

      {/* Footer */}
      <footer className="border-t border-[var(--color-border)] mt-[var(--space-12)]">
        <div className="max-w-[960px] mx-auto px-[var(--space-4)] md:px-[var(--space-6)] py-[var(--space-6)]">
          <p className="text-[var(--color-text-tertiary)] text-[length:var(--font-size-0)]">
            Precision Closer — Built with Next.js, VAPI AI, and Upstash Redis.
          </p>
        </div>
      </footer>
    </main>
  );
}
