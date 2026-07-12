export default function Home() {
  return (
    <div className="min-h-screen bg-[var(--color-bg)] text-[var(--color-text)] font-[family-name:var(--font-body)]">
      <nav className="border-b border-[var(--color-border)] bg-[var(--color-bg)]">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="font-[family-name:var(--font-display)] text-[16px] font-semibold tracking-tight">
            Precision Closer
          </div>
          <div className="text-[12px] text-[var(--color-muted)]">
            API Documentation
          </div>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-4 py-12 md:py-16">
        <section className="mb-16">
          <h1 className="font-[family-name:var(--font-display)] text-[28px] md:text-[40px] font-semibold leading-tight mb-4">
            Precision Closer API
          </h1>
          <p className="text-[14px] md:text-[16px] leading-normal text-[var(--color-muted)] max-w-2xl">
            Programmatic access to the outbound dialing engine, lead management, and live call monitoring systems. Built for high-performance financial services operations where latency and data integrity are paramount.
          </p>
        </section>

        <section className="mb-12">
          <h2 className="font-[family-name:var(--font-display)] text-[20px] font-semibold mb-4">Overview</h2>
          <p className="text-[14px] leading-normal text-[var(--color-text)] mb-4">
            The Precision Closer API provides programmatic access to the outbound dialing engine, lead management, and live call monitoring systems. It is designed for high-performance financial services operations where latency and data integrity are paramount.
          </p>
        </section>

        <section className="mb-12">
          <h2 className="font-[family-name:var(--font-display)] text-[20px] font-semibold mb-4">Authentication</h2>
          <p className="text-[14px] leading-normal text-[var(--color-text)] mb-4">
            All requests must be authenticated using a Bearer token in the Authorization header.
          </p>
          <pre className="bg-[var(--color-primary)] border border-[var(--color-border)] rounded-md p-4 overflow-x-auto mb-4">
            <code className="font-mono text-[13px] text-[var(--color-text)]">
              Authorization: Bearer &lt;your_api_key&gt;
            </code>
          </pre>
          <p className="text-[14px] leading-normal text-[var(--color-muted)]">
            API keys are managed in the Precision Closer dashboard. Keep your keys secure; they grant full access to your lead data and dialing infrastructure.
          </p>
        </section>

        <section className="mb-12">
          <h2 className="font-[family-name:var(--font-display)] text-[20px] font-semibold mb-4">Rate Limits</h2>
          <p className="text-[14px] leading-normal text-[var(--color-text)]">
            The API enforces a rate limit of 100 requests per minute per organization. Exceeding this limit will return a 429 Too Many Requests response. For high-volume batch operations, use the bulk upload endpoints.
          </p>
        </section>

        <section className="mb-12">
          <h2 className="font-[family-name:var(--font-display)] text-[20px] font-semibold mb-6">Endpoints</h2>

          <div className="mb-10">
            <h3 className="font-[family-name:var(--font-display)] text-[16px] font-semibold mb-4 text-[var(--color-accent)]">Leads</h3>

            <div className="mb-6">
              <h4 className="font-mono text-[14px] font-medium mb-2">POST /v1/leads</h4>
              <p className="text-[14px] leading-normal text-[var(--color-text)] mb-3">Create a new lead record.</p>
              <p className="text-[13px] font-semibold mb-2 text-[var(--color-muted)]">Parameters</p>
              <ul className="list-disc list-inside text-[14px] leading-normal text-[var(--color-text)] mb-4 space-y-1">
                <li>first_name (string, required): Lead&apos;s first name.</li>
                <li>last_name (string, required): Lead&apos;s last name.</li>
                <li>phone_number (string, required): E.164 formatted phone number.</li>
                <li>company_name (string, optional): Legal business name.</li>
                <li>metadata (object, optional): Key-value pairs for custom tracking.</li>
              </ul>
              <p className="text-[13px] font-semibold mb-2 text-[var(--color-muted)]">Example Request</p>
              <pre className="bg-[var(--color-primary)] border border-[var(--color-border)] rounded-md p-4 overflow-x-auto mb-4">
                <code className="font-mono text-[13px] text-[var(--color-text)]">
{`{
  "first_name": "John",
  "last_name": "Doe",
  "phone_number": "+15550109999",
  "company_name": "Doe Logistics LLC"
}`}
                </code>
              </pre>
              <p className="text-[13px] font-semibold mb-2 text-[var(--color-muted)]">Example Response</p>
              <pre className="bg-[var(--color-primary)] border border-[var(--color-border)] rounded-md p-4 overflow-x-auto">
                <code className="font-mono text-[13px] text-[var(--color-text)]">
{`{
  "id": "lead_8f2a1b3c",
  "status": "not_called",
  "created_at": "2026-07-12T21:00:00Z"
}`}
                </code>
              </pre>
            </div>

            <div className="mb-6">
              <h4 className="font-mono text-[14px] font-medium mb-2">GET /v1/leads/&#123;id&#125;</h4>
              <p className="text-[14px] leading-normal text-[var(--color-text)] mb-3">Retrieve the current state and qualification data for a specific lead.</p>
              <p className="text-[13px] font-semibold mb-2 text-[var(--color-muted)]">Example Response</p>
              <pre className="bg-[var(--color-primary)] border border-[var(--color-border)] rounded-md p-4 overflow-x-auto">
                <code className="font-mono text-[13px] text-[var(--color-text)]">
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
                </code>
              </pre>
            </div>
          </div>

          <div className="mb-10">
            <h3 className="font-[family-name:var(--font-display)] text-[16px] font-semibold mb-4 text-[var(--color-accent)]">Calls</h3>

            <div className="mb-6">
              <h4 className="font-mono text-[14px] font-medium mb-2">POST /v1/calls</h4>
              <p className="text-[14px] leading-normal text-[var(--color-text)] mb-3">Initiate an outbound dial for a specific lead.</p>
              <p className="text-[13px] font-semibold mb-2 text-[var(--color-muted)]">Parameters</p>
              <ul className="list-disc list-inside text-[14px] leading-normal text-[var(--color-text)] mb-4 space-y-1">
                <li>lead_id (string, required): The ID of the lead to dial.</li>
                <li>script_id (string, required): The ID of the branching logic script to use.</li>
                <li>voice_id (string, optional): Override the default voice model.</li>
              </ul>
              <p className="text-[13px] font-semibold mb-2 text-[var(--color-muted)]">Example Response</p>
              <pre className="bg-[var(--color-primary)] border border-[var(--color-border)] rounded-md p-4 overflow-x-auto">
                <code className="font-mono text-[13px] text-[var(--color-text)]">
{`{
  "call_id": "call_4d9e2f1a",
  "status": "dialing",
  "uri": "/v1/calls/call_4d9e2f1a"
}`}
                </code>
              </pre>
            </div>

            <div className="mb-6">
              <h4 className="font-mono text-[14px] font-medium mb-2">POST /v1/calls/&#123;id&#125;/takeover</h4>
              <p className="text-[14px] leading-normal text-[var(--color-text)] mb-3">Seamlessly transition the live call from the AI agent to the operator. This endpoint pre-warms the audio bridge to ensure sub-5-second join latency.</p>
              <p className="text-[13px] font-semibold mb-2 text-[var(--color-muted)]">Example Response</p>
              <pre className="bg-[var(--color-primary)] border border-[var(--color-border)] rounded-md p-4 overflow-x-auto">
                <code className="font-mono text-[13px] text-[var(--color-text)]">
{`{
  "status": "bridging",
  "bridge_uri": "wss://api.precisioncloser.cc/v1/bridge/call_4d9e2f1a"
}`}
                </code>
              </pre>
            </div>
          </div>
        </section>

        <section className="mb-12">
          <h2 className="font-[family-name:var(--font-display)] text-[20px] font-semibold mb-4">Error Codes</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-[14px] border-collapse">
              <thead>
                <tr className="border-b border-[var(--color-border)] text-left">
                  <th className="py-2 pr-4 font-semibold text-[var(--color-muted)]">Code</th>
                  <th className="py-2 font-semibold text-[var(--color-muted)]">Description</th>
                </tr>
              </thead>
              <tbody className="text-[var(--color-text)]">
                <tr className="border-b border-[var(--color-border)]">
                  <td className="py-3 pr-4 font-mono">400</td>
                  <td className="py-3">Bad Request. Missing required parameters or malformed JSON.</td>
                </tr>
                <tr className="border-b border-[var(--color-border)]">
                  <td className="py-3 pr-4 font-mono">401</td>
                  <td className="py-3">Unauthorized. Invalid or missing API key.</td>
                </tr>
                <tr className="border-b border-[var(--color-border)]">
                  <td className="py-3 pr-4 font-mono">404</td>
                  <td className="py-3">Not Found. The requested lead or call ID does not exist.</td>
                </tr>
                <tr className="border-b border-[var(--color-border)]">
                  <td className="py-3 pr-4 font-mono">422</td>
                  <td className="py-3">Unprocessable Entity. The lead is on the DNC list or has an invalid phone number.</td>
                </tr>
                <tr className="border-b border-[var(--color-border)]">
                  <td className="py-3 pr-4 font-mono">429</td>
                  <td className="py-3">Too Many Requests. Rate limit exceeded.</td>
                </tr>
                <tr>
                  <td className="py-3 pr-4 font-mono">500</td>
                  <td className="py-3">Internal Server Error. An unexpected error occurred on our end.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section className="mb-12">
          <h2 className="font-[family-name:var(--font-display)] text-[20px] font-semibold mb-4">Webhooks</h2>
          <p className="text-[14px] leading-normal text-[var(--color-text)] mb-4">
            Precision Closer can push real-time updates to your system when call states change. Configure your webhook URL in the dashboard.
          </p>
          <p className="text-[13px] font-semibold mb-2 text-[var(--color-muted)]">Events</p>
          <ul className="list-disc list-inside text-[14px] leading-normal text-[var(--color-text)] space-y-1">
            <li>call.connected: Fired when the lead answers.</li>
            <li>call.qualified: Fired when the agent completes the qualification flow.</li>
            <li>call.failed: Fired on busy, no-answer, or disconnected signals.</li>
          </ul>
        </section>
      </main>

      <footer className="border-t border-[var(--color-border)] bg-[var(--color-bg)]">
        <div className="max-w-5xl mx-auto px-4 py-6 text-[12px] text-[var(--color-muted)]">
          Precision Closer API Documentation
        </div>
      </footer>
    </div>
  );
}
