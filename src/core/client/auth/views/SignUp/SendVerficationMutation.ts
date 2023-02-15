import { pick } from "lodash";
import { Environment } from "relay-runtime";

import { CoralContext } from "coral-framework/lib/bootstrap";
import { createMutationContainer } from "coral-framework/lib/relay";
import {
  sendVerificationCode,
  SendVerificationCodeInput,
} from "coral-framework/rest";

export type SendVerificationCodeMutation = (
  input: SendVerificationCodeInput
) => Promise<void>;

export async function commit(
  environment: Environment,
  input: SendVerificationCodeInput,
  { rest, clearSession }: CoralContext
) {
  const result: any = await sendVerificationCode(
    rest,
    pick(input, ["receiver", "type", "verificationType"])
  );
  // if (result.token) {
  //   await clearSession(result.token, { ephemeral: true });
  //   return;
  // }
  return result;
}

export const withSendVerificationCodeMutation = createMutationContainer(
  "sendVerificationCode",
  commit
);
