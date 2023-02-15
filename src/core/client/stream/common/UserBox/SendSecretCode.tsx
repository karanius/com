import { Localized } from "@fluent/react/compat";
import cn from "classnames";
import React, { FunctionComponent, useState } from "react";

import CLASSES from "coral-stream/classes";
import { Flex } from "coral-ui/components/v2";
import { Button } from "coral-ui/components/v3";
import {
  SendSecretCodeMutation,
  withSendSecretCodeMutation,
} from "./sendSecretCodeMutation";
import styles from "./UserBoxAuthenticated.css";

export interface UserBoxAuthenticatedProps {
  sendSecretCode: SendSecretCodeMutation;
}

const SendSecretCode: FunctionComponent<UserBoxAuthenticatedProps> = (
  props
) => {
  const [error, setError] = useState(null);
  const handleSendingSecretCode = async () => {
    try {
      const result: any = await props.sendSecretCode({});
      if (result) {
      }
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <Localized id="general-secretCodeSection" attrs={{ "aria-label": true }}>
      <section
        className={CLASSES.viewerBox.$root}
        aria-label="send-secret-code-title"
      >
        <Localized id="general-send-secret-code-title">
          <div className={cn(styles.text, CLASSES.viewerBox.usernameLabel)}>
            Send your secret code to your email & sms.
          </div>
        </Localized>
        <Flex
          alignItems="flex-end"
          wrap
          className={CLASSES.viewerBox.usernameContainer}
        >
          <Button
            color="primary"
            fontSize="small"
            fontWeight="semiBold"
            paddingSize="none"
            onClick={() => handleSendingSecretCode()}
            variant="flat"
          >
            Send
          </Button>
        </Flex>
      </section>
    </Localized>
  );
};

const enhanced = withSendSecretCodeMutation(SendSecretCode);
export default enhanced;
