import { RestClient } from "../lib/rest";

export interface SendVerificationCodeInput {
  receiver: string;
  type: string;
  verificationType: string;
}

export interface SendVerificationCodeResponse {
  id: string;
}

export default function sendVerification(
  rest: RestClient,
  input: SendVerificationCodeInput
) {
  return rest.fetch<SendVerificationCodeResponse>(
    "/account/send-verification-code",
    {
      method: "POST",
      body: input,
    }
  );
}
