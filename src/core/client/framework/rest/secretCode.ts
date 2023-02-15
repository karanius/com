import { RestClient } from "../lib/rest";

export interface SecretCodeInput {}

export interface SecretCodeResponse {
  sent: boolean;
}

export default function sendSecretCode(rest: RestClient) {
  return rest.fetch<SecretCodeResponse>("/account/send-secret-code", {
    method: "GET",
  });
}
