import { Localized } from "@fluent/react/compat";
import React, { FunctionComponent, useCallback, useState } from "react";
import { Form } from "react-final-form";

import { FormError, OnSubmit } from "coral-framework/lib/form";
import { Flex } from "coral-ui/components/v2";
import { Button, CallOut } from "coral-ui/components/v3";

import CodeField from "coral-auth/components/CodeField";
import PhoneNumberField from "coral-auth/components/PhoneNumberField";
import { SetViewMutation } from "coral-auth/mutations";
import { useMutation } from "coral-framework/lib/relay";
import { PropTypesOf } from "coral-ui/types";
import { FORM_ERROR } from "final-form";
import styles from "./SignUpWithEmail.css";
import { VerifyMutation, withVerifyMutation } from "./VerifyMutation";

interface FormProps {
  code: number;
}

interface FormSubmitProps extends FormProps, FormError {}

interface Props {
  onSubmit: OnSubmit<FormSubmitProps>;
}

const VerifyWithOTP: FunctionComponent<Props> = (props) => {
  return (
    <Form onSubmit={props.onSubmit}>
      {({ handleSubmit, submitting, submitError }) => (
        <form autoComplete="off" onSubmit={handleSubmit}>
          {submitError && <CallOut color="error" title={submitError} />}

          <div className={styles.field}>
            <CodeField disabled={submitting} />
          </div>
          <div className={styles.actions}>
            <Button
              variant="filled"
              color="primary"
              fontSize="small"
              paddingSize="small"
              type="submit"
              disabled={submitting}
              fullWidth
              upperCase
            >
              <Flex alignItems="center" justifyContent="center">
                <Localized id="signUp-verify">
                  <span>Verify</span>
                </Localized>
              </Flex>
            </Button>
          </div>
        </form>
      )}
    </Form>
  );
};

interface VerifyContainerProps {
  verify: VerifyMutation;
}

const VerifyContainer: FunctionComponent<VerifyContainerProps> = (props) => {
  const setView = useMutation(SetViewMutation);

  const onSignIn = useCallback(() => {
    setView({ view: "SIGN_IN", history: "push" });
  }, [setView]);

  const handleVerify: PropTypesOf<typeof VerifyWithOTP>["onSubmit"] = async (
    input,
    form
  ) => {
    try {
      const email = await localStorage.getItem("email");
      if (!email) {
        return {
          [FORM_ERROR]: "something went wrong.",
        };
      }
      const result: any = await props.verify({
        code: input.code,
        email,
      });
      if (result.phoneVerified) {
        await localStorage.removeItem("phone");
        alert("Your mobile number has been verified");
        onSignIn();
      }
      return result;
    } catch (error) {
      return { [FORM_ERROR]: error.message };
    }
  };
  return <VerifyWithOTP onSubmit={handleVerify} />;
};

export default withVerifyMutation(VerifyContainer);
