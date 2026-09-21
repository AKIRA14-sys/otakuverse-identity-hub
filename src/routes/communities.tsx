import { createFileRoute, Outlet } from "@tanstack/react-router";

/**
 * Layout route for /communities/*
 * Child routes (index, create, $slug) render inside <Outlet />.
 * Without this Outlet, /communities/create would never show the form.
 */
export const Route = createFileRoute("/communities")({
  ssr: false,
  component: CommunitiesLayout,
});

function CommunitiesLayout() {
  return <Outlet />;
}
