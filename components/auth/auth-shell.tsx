export default function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <div>
        <p>SALES MANAGEMENT SYSTEM</p>
        <h1>Welcome to SIGHT Workspace</h1>
        <p>
          Optimize your business operations with integrated sales reporting, account monitoring, and inventory management in one secure workspace.
        </p>

        <ul>
          <li><strong>Sales Reporting</strong> - Track revenue, transactions, and performance in a centralized dashboard.</li>
          <li><strong>Account Monitoring</strong> - Monitor user activity and manage secure access across the system.</li>
          <li><strong>Stock Management</strong> - Manage inventory, track stock levels, and ensure product availability.</li>
        </ul>
      </div>

      <div>{children}</div>
    </div>
  );
}
