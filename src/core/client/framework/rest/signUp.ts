import { RestClient } from "../lib/rest";

export interface SignUpInput {
  username: string;
  password: string;
  email: string;
  phoneNumber: string;
  emailVerificationId: string;
  emailVerificationCode: string;
  phoneVerificationId: string;
  phoneVerificationCode: string;
}

export interface SignUpResponse {
  token: string;
}

export default function signUp(rest: RestClient, input: SignUpInput) {
  return rest.fetch<SignUpResponse>("/auth/local/signup", {
    method: "POST",
    body: input,
  });
}
