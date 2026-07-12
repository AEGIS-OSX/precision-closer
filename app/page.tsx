import type { ReactNode } from "react";

function Section({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <section className={`py-[var(--space-8)] ${className}`}>
      {children}
    </section>
  );
}

function H2({ children }: { children: ReactNode }) {
  return (
    <h2 className="text-[length:var(--font-size-section)] font-[family-name:var(--font-display)] font-semibold text-[var(--color-text-primary)] mt-[var(--space-8)] mb-[var(--space-4)]">
      {children}
    </h2>
  );
}

function H3({ children }: { children: ReactNode }) {
  return (
    <h3 className="text-[length:var(--font-size-ui)] font-[family-name:var(--font-display)] font-medium text-[var(--color-text-primary)] mt-[var(--space-6)] mb-[var(--space-3)]">
      {children}
    </h3>
  );
}

function H4({ children }: { children: ReactNode }) {
  return (
    <h4 className="text-[length:var(--font-size-body)] font-[family-name:var(--font-display)] font-medium text-[var(--color-text-primary)] mt-[var(--space-4)] mb-[var(--space-2)]">
      {children}
    </h4>
  );
}

function P({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <p className={`text-[length:var(--font-size-body)] leading-[var(--line-height-normal)] text-[var(--color-text-primary)] mb-[var(--space-4)] ${className}`}>
      {children}
    </p>
  );
}

function CodeBlock({ children, lang = "json" }: { children: ReactNode; lang?: string }) {
  return (
    <pre className="bg-[var(--color-surface-2)] border border-[var(--color-border)] rounded-[var(--radius-md)] p-[var(--space-4)] overflow-x-auto mb-[var(--space-4)]">
      <code className="text-[length:var(--font-size-data)] font-[family-name:var(--font-mono)] text-[var(--color-text-transcript)]">
        {children}
      </code>
    </pre>
  );
}

function InlineCode({ children }: { children: ReactNode }) {
  return (
    <code className="bg-[var(--color-surface-2)] text-[length:var(--font-size-data)] font-[family-name:var(--font-mono)] text-[var(--color-text-transcript)] px-[var(--space-1)] py-[var(--space-1)] rounded-[var(--radius-sm)]">
      {children}
    </code>
  );
}

function Table({ children }: { children: ReactNode }) {
  return (
    <div className="overflow-x-auto mb-[var(--space-4)]">
      <table className="w-full border-collapse">
        {children}
      </table>
    </div>
  );
}

function THead({ children }: { children: ReactNode }) {
  return (
    <thead>
      <tr className="border-b border-[var(--color-border)]">
        {children}
      </tr>
    </thead>
  );
}

function TBody({ children }: { children: ReactNode }) {
  return <tbody>{children}</tbody>;
}

function Th({ children }: { children: ReactNode }) {
  return (
    <th className="text-left text-[length:var(--font-size-data)] font-[family-name:var(--font-display)] font-medium text-[var(--color-text-secondary)] py-[var(--space-2)] pr-[var(--space-4)]">
      {children}
    </th>
  );
}

function Td({ children }: { children: ReactNode }) {
  return (
    <td className="text-[length:var(--font-size-body)] text-[var(--color-text-primary)] py-[var(--space-2)] pr-[var(--space-4)] border-b border-[var(--color-border)]">
      {children}
    </td>
  );
}

function Badge({ children, color = "neutral" }: { children: ReactNode; color?: "success" | "warning" | "error" | "neutral" }) {
  const colorMap = {
    success: "text-[var(--color-semantic-success)]",
    warning: "text-[var(--color-semantic-warning)]",
    error: "text-[var(--color-semantic-error)]",
    neutral: "text-[var(--color-semantic-neutral)]",
  };
  return (
    <span className={`inline-block text-[length:var(--font-size-data)] font-[family-name:var(--font-mono)] font-medium ${colorMap[color]} bg-[var(--color-surface-2)] px-[var(--space-2)] py-[var(--space-1)] rounded-[var(--radius-sm)]`}>
      {children}
    </span>
  );
}

export default function Home() {
  return (
    <main className="min-h-screen bg-[var(--color-canvas)]">
      {/* Hero */}
      <header className="border-b border-[var(--color-border)]">
        <div className="max-w-[960px] mx-auto px-[var(--space-4)] md:px-[var(--space-6)] py-[var(--space-12)]">
          <h1 className="text-[length:var(--font-size-hero)] font-[family-name:var(--font-display)] font-semibold text-[var(--color-text-primary)] leading-[var(--line-height-tight)] mb-[var(--space-4)]">
            Precision Closer API Documentation
          </h1>
          <p className="text-[length:var(--font-size-ui)] text-[var(--color-text-secondary)] leading-[var(--line-height-normal)] max-w-[640px]">
            Programmatic access to the outbound dialing engine, lead management, and live call monitoring systems.
          </p>
        </div>
      </header>

      <div className="max-w-[960px] mx-auto px-[var(--space-4)] md:px-[var(--space-6)]">
        {/* Overview */}
        <Section>
          <H2>Overview</H2>
          <P>
            The Precision Closer API provides programmatic access to the outbound dialing engine, lead management, and live call monitoring systems. It is designed for high-performance financial services operations where latency and data integrity are paramount.
          </P>
        </Section>

        {/* Authentication */}
        <Section>
          <H2>Authentication</H2>
          <P>
            All requests must be authenticated using a Bearer token in the{" "}
            <InlineCode>Authorization</InlineCode>{" "}header.
          </P>
          <CodeBlock lang="http">
            {`Authorization: Bearer <your_api_key>`}
          </CodeBlock>
          <P>
            API keys are managed in the Precision Closer dashboard. Keep your keys secure; they grant full access to your lead data and dialing infrastructure.
          </P>
        </Section>

        {/* Rate Limits */}
        <Section>
          <H2>Rate Limits</H2>
          <P>
            The API enforces a rate limit of 100 requests per minute per organization. Exceeding this limit will return a{" "}
            <InlineCode>429 Too Many Requests</InlineCode>{" "}response. For high-volume batch operations, use the bulk upload endpoints.
          </P>
        </Section>

        {/* Endpoints */}
        <Section>
          <H2>Endpoints</H2>

          {/* Leads */}
          <H3>Leads</H3>

          <H4>POST /v1/leads</H4>
          <P>Create a new lead record.</P>
          <P className="text-[var(--color-text-secondary)] text-[length:var(--font-size-data)] uppercase tracking-wide mb-[var(--space-2)]">
            Parameters
          </P>
          <ul className="list-disc list-inside mb-[var(--space-4)] text-[length:var(--font-size-body)] text-[var(--color-text-primary)] space-y-[var(--space-1)]">
            <li>
              <InlineCode>first_name</InlineCode>{" "}(string, required): Lead&apos;s first name.
            </li>
            <li>
              <InlineCode>last_name</InlineCode>{" "}(string, required): Lead&apos;s last name.
            </li>
            <li>
              <InlineCode>phone_number</InlineCode>{" "}(string, required): E.164 formatted phone number.
            </li>
            <li>
              <InlineCode>company_name</InlineCode>{" "}(string, optional): Legal business name.
            </li>
            <li>
              <InlineCode>metadata</InlineCode>{" "}(object, optional): Key-value pairs for custom tracking.
            </li>
          </ul>
          <P className="text-[var(--color-text-secondary)] text-[length:var(--font-size-data)] uppercase tracking-wide mb-[var(--space-2)]">
            Example Request
          </P>
          <CodeBlock>
            {`{
  "first_name": "John",
  "last_name": "Doe",
  "phone_number": "+15550109999",
  "company_name": "Doe Logistics LLC"
}`}
          </CodeBlock>
          <P className="text-[var(--color-text-secondary)] text-[length:var(--font-size-data)] uppercase tracking-wide mb-[var(--space-2)]">
            Example Response
          </P>
          <CodeBlock>
            {`{
  "id": "lead_8f2a1b3c",
  "status": "not_called",
  "created_at": "2026-07-12T21:00:00Z"
}`}
          </CodeBlock>

          <H4>GET /v1/leads/&#123;id&#125;</H4>
          <P>Retrieve the current state and qualification data for a specific lead.</P>
          <P className="text-[var(--color-text-secondary)] text-[length:var(--font-size-data)] uppercase tracking-wide mb-[var(--space-2)]">
            Example Response
          </P>
          <CodeBlock>
            {`{
  "id": "lead_8f2a1b3c",
  "status": "qualified",
  "qualification_data": {
    "capital_type": "line_of_credit",
    "amount_requested": 150000,
    "use_of_funds": "inventory_expansion",
    "active_debt": true,
    "credit_score_range": "720-750"
  }
}`}
          </CodeBlock>

          {/* Calls */}
          <H3>Calls</H3>

          <H4>POST /v1/calls</H4>
          <P>Initiate an outbound dial for a specific lead.</P>
          <P className="text-[var(--color-text-secondary)] text-[length:var(--font-size-data)] uppercase tracking-wide mb-[var(--space-2)]">
            Parameters
          </P>
          <ul className="list-disc list-inside mb-[var(--space-4)] text-[length:var(--font-size-body)] text-[var(--color-text-primary)] space-y-[var(--space-1)]">
            <li>
              <InlineCode>lead_id</InlineCode>{" "}(string, required): The ID of the lead to dial.
            </li>
            <li>
              <InlineCode>script_id</InlineCode>{" "}(string, required): The ID of the branching logic script to use.
            </li>
            <li>
              <InlineCode>voice_id</InlineCode>{" "}(string, optional): Override the default voice model.
            </li>
          </ul>
          <P className="text-[var(--color-text-secondary)] text-[length:var(--font-size-data)] uppercase tracking-wide mb-[var(--space-2)]">
            Example Response
          </P>
          <CodeBlock>
            {`{
  "call_id": "call_4d9e2f1a",
  "status": "dialing",
  "uri": "/v1/calls/call_4d9e2f1a"
}`}
          </CodeBlock>

          <H4>POST /v1/calls/&#123;id&#125;/takeover</H4>
          <P>
            Seamlessly transition the live call from the AI agent to the operator. This endpoint pre-warms the audio bridge to ensure sub-5-second join latency.
          </P>
          <P className="text-[var(--color-text-secondary)] text-[length:var(--font-size-data)] uppercase tracking-wide mb-[var(--space-2)]">
            Example Response
          </P>
          <CodeBlock>
            {`{
  "status": "bridging",
  "bridge_uri": "wss://api.precisioncloser.cc/v1/bridge/call_4d9e2f1a"
}`}
          </CodeBlock>
        </Section>

        {/* Error Codes */}
        <Section>
          <H2>Error Codes</H2>
          <Table>
            <THead>
              <Th>Code</Th>
              <Th>Description</Th>
            </THead>
            <TBody>
              <tr>
                <Td>
                  <InlineCode>400</InlineCode>
                </Td>
                <Td>Bad Request. Missing required parameters or malformed JSON.</Td>
              </tr>
              <tr>
                <Td>
                  <InlineCode>401</InlineCode>
                </Td>
                <Td>Unauthorized. Invalid or missing API key.</Td>
              </tr>
              <tr>
                <Td>
                  <InlineCode>404</InlineCode>
                </Td>
                <Td>Not Found. The requested lead or call ID does not exist.</Td>
              </tr>
              <tr>
                <Td>
                  <InlineCode>422</InlineCode>
                </Td>
                <Td>Unprocessable Entity. The lead is on the DNC list or has an invalid phone number.</Td>
              </tr>
              <tr>
                <Td>
                  <InlineCode>429</InlineCode>
                </Td>
                <Td>Too Many Requests. Rate limit exceeded.</Td>
              </tr>
              <tr>
                <Td>
                  <InlineCode>500</InlineCode>
                </Td>
                <Td>Internal Server Error. An unexpected error occurred on our end.</Td>
              </tr>
            </TBody>
          </Table>
        </Section>

        {/* Webhooks */}
        <Section>
          <H2>Webhooks</H2>
          <P>
            Precision Closer can push real-time updates to your system when call states change. Configure your webhook URL in the dashboard.
          </P>
          <H3>Events</H3>
          <ul className="list-disc list-inside mb-[var(--space-4)] text-[length:var(--font-size-body)] text-[var(--color-text-primary)] space-y-[var(--space-2)]">
            <li>
              <InlineCode>call.connected</InlineCode>{" "}— Fired when the lead answers.
            </li>
            <li>
              <InlineCode>call.qualified</InlineCode>{" "}— Fired when the agent completes the qualification flow.
            </li>
            <li>
              <InlineCode>call.failed</InlineCode>{" "}— Fired on busy, no-answer, or disconnected signals.
            </li>
          </ul>
        </Section>
      </div>

      {/* Footer */}
      <footer className="border-t border-[var(--color-border)] mt-[var(--space-12)]">
        <div className="max-w-[960px] mx-auto px-[var(--space-4)] md:px-[var(--space-6)] py-[var(--space-6)]">
          <p className="text-[length:var(--font-size-data)] text-[var(--color-text-secondary)]">
            Precision Closer API — Documentation v1.0.0
          </p>
        </div>
      </footer>
    </main>
  );
}
