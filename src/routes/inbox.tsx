import { createFileRoute, Navigate } from "@tanstack/react-router";

export const Route = createFileRoute("/inbox")({
  component: InboxRedirect,
});

function InboxRedirect() {
  return <Navigate to="/messages" replace />;
}