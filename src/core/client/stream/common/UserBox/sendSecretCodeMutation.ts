import { Environment } from "relay-runtime";

import { CoralContext } from "coral-framework/lib/bootstrap";
import { createMutationContainer } from "coral-framework/lib/relay";
import { sendSecretCode, SecretCodeInput } from "coral-framework/rest";

export type SendSecretCodeMutation = (input: SecretCodeInput) => Promise<void>;

export async function commit(
  environment: Environment,
  input: SecretCodeInput,
  { rest, clearSession }: CoralContext
) {
  const result: any = await sendSecretCode(
    rest
    // pick(input, [
    //   "code",
    //   "receiver",
    //   "type",
    //   "verificationType",
    //   "verificationId",
    // ])
  );
  return result;
}

export const withSendSecretCodeMutation = createMutationContainer(
  "sendSecretCode",
  commit
);
