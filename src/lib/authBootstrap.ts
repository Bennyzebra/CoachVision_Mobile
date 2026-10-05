export interface AuthBootstrapUser {
  id: string;
  email?: string;
}

export interface AuthBootstrapSession {
  user: AuthBootstrapUser;
}

interface AuthBootstrapControllerOptions<TSession extends AuthBootstrapSession> {
  onSessionResolved: (session: TSession | null) => void;
  onProfileCleared: () => void;
  hydrateProfile: (user: AuthBootstrapUser) => Promise<void>;
  onPasswordRecovery: () => void;
  onProfileHydrationError: (error: unknown) => void;
}

/**
 * Separates session readiness from optional profile hydration. A route only
 * needs a valid session; profile reads and repairs must never hold it behind
 * a startup spinner.
 */
export const createAuthBootstrapController = <TSession extends AuthBootstrapSession>(
  options: AuthBootstrapControllerOptions<TSession>
) => {
  let activeUserId: string | null = null;
  let hydratedUserId: string | null = null;
  let disposed = false;

  const handleSession = (event: string, session: TSession | null) => {
    const user = session?.user ?? null;
    activeUserId = user?.id ?? null;
    options.onSessionResolved(session);

    if (event === "PASSWORD_RECOVERY") {
      options.onPasswordRecovery();
    }

    if (!user) {
      hydratedUserId = null;
      options.onProfileCleared();
      return;
    }

    if (hydratedUserId === user.id) {
      return;
    }

    hydratedUserId = user.id;
    void Promise.resolve()
      .then(() => options.hydrateProfile(user))
      .catch((error) => {
        if (!disposed && activeUserId === user.id) {
          options.onProfileHydrationError(error);
        }
      });
  };

  return {
    handleSession,
    isUserCurrent: (userId: string) => !disposed && activeUserId === userId,
    dispose: () => {
      disposed = true;
    },
  };
};
