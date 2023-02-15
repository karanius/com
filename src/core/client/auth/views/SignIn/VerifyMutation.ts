import { pick } from "lodash";
import { Environment } from "relay-runtime";

import { CoralContext } from "coral-framework/lib/bootstrap";
import { createMutationContainer } from "coral-framework/lib/relay";
import { verify, VerifyInput } from "coral-framework/rest";

export type VerifyMutation = (input: VerifyInput) => Promise<void>;

export async function commit(
  environment: Environment,
  input: VerifyInput,
  { rest, clearSession }: CoralContext
) {
  const result: any = await verify(rest, pick(input, ["code", "email"]));
  if (result.token) {
    await clearSession(result.token, { ephemeral: true });
    return;
  }
  return result;
}

export const withVerifyMutation = createMutationContainer("verify", commit);
