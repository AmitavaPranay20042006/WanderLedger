// This layout can be used to wrap all dashboard-related pages.
// AuthProvider in the root layout already handles redirection for protected routes.
// If specific dashboard layout elements (like a sub-navbar or sidebar) are needed, they can be added here.

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
