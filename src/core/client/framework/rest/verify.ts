import { RestClient } from "../lib/rest";

export interface VerifyInput {
  code: number | string;
  verificationId: string;
  receiver: string;
  type: string;
  verificationType: string;
}

export interface VerifyResponse {
  verified: boolean;
}

export default function verify(rest: RestClient, input: VerifyInput) {
  return rest.fetch<VerifyResponse>("/account/verify-code", {
    method: "PUT",
    body: input,
  });
}
