import "server-only";

import { verifyAdminSession } from "./admin-auth";

type ReadOnlyAdminActor = {
  id: string;
  label?: string;
  email?: string;
  username?: string;
};

type ReadOnlyAdminSession = {
  isAdmin: boolean;
  actor: ReadOnlyAdminActor | null;
  errors: string[];
};

export async function getReadOnlyAdminSession(
  request: Request,
): Promise<ReadOnlyAdminSession> {
  const session = verifyAdminSession(request);

  if (!session.isAdmin || !session.actor) {
    return {
      isAdmin: false,
      actor: null,
      errors: session.errors,
    };
  }

  return {
    isAdmin: true,
    actor: {
      id: session.actor.id || session.actor.label,
      label: session.actor.label,
    },
    errors: [],
  };
}
