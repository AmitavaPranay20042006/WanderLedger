// This layout can be used to wrap the trip detail page.
// AuthProvider in the root layout already handles redirection for protected routes.
// If specific trip-level layout elements (e.g., trip-specific sidebar or persistent header elements) are needed, they can be added here.

export default function TripDetailLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
