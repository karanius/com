import React from "react";
import { FunctionComponent } from "react";
import { SignUpMutation } from "./SignUpMutation";
import SignUp from "./SignUpWithEmail";
// @ts-nocheck
interface SignUpContainerProps {
  signUp: SignUpMutation;
}

const SignUpContainer: FunctionComponent<SignUpContainerProps> = (props) => {
  return <SignUp  signUp={props.signUp} />
};

export default SignUpContainer;
