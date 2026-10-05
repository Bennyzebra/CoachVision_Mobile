type ErrorWithStatus = Error & { status?: unknown };

const getErrorStatus = (error: unknown) =>
  typeof error === "object" && error !== null && "status" in error
    ? (error as ErrorWithStatus).status
    : undefined;

export const isSupabaseConnectivityError = (error: unknown) => {
  if (!(error instanceof Error)) {
    return false;
  }

  const message = error.message.toLowerCase();

  return (
    getErrorStatus(error) === 0 ||
    message === "load failed" ||
    message.includes("failed to fetch") ||
    message.includes("network request failed")
  );
};

export const getAuthErrorMessage = (error: unknown, fallback: string) => {
  if (isSupabaseConnectivityError(error)) {
    return "Couldn't reach Supabase. Check the project URL, internet connection, and any VPN, proxy, or DNS filter.";
  }

  return error instanceof Error ? error.message : fallback;
};
