import { FORM_ERROR } from "final-form";
import React, { FunctionComponent, useCallback, useState } from "react";

import { getViewURL } from "coral-auth/helpers";
import { SetViewMutation } from "coral-auth/mutations";
import { useCoralContext } from "coral-framework/lib/bootstrap/CoralContext";
import { useMutation } from "coral-framework/lib/relay";

import SignInMutation from "./SignInMutation";
import SignInWithEmail, { SignInWithEmailForm } from "./SignInWithEmail";
import VerifyContainer from "./VerifyContainer";

const SignInContainer: FunctionComponent = () => {
  const [level, setLevel] = useState<number>(0);
  const { window } = useCoralContext();
  const signIn = useMutation(SignInMutation);
  const setView = useMutation(SetViewMutation);
  const onSubmit: SignInWithEmailForm["onSubmit"] = useCallback(
    async (input, form) => {
      try {
        await signIn({
          email: input.email,
          password: input.password,
        });
        // if (result.verifyPhone) {
        //   await localStorage.setItem("email", input.email);
        //   setLevel(1);
        // }
      } catch (error) {
        return { [FORM_ERROR]: error.message };
      }
    },
    [signIn]
  );
  const goToForgotPassword = useCallback(
    (e: React.MouseEvent) => {
      setView({ view: "FORGOT_PASSWORD", history: "push" });
      if (e.preventDefault) {
        e.preventDefault();
      }
    },
    [setView]
  );

  return level === 0 ? (
    <SignInWithEmail
      onSubmit={onSubmit}
      onGotoForgotPassword={goToForgotPassword}
      forgotPasswordHref={getViewURL("FORGOT_PASSWORD", window)}
    />
  ) : (
    <VerifyContainer />
  );
};

export default SignInContainer;
