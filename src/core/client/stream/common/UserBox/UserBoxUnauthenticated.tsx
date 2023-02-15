import { Localized } from "@fluent/react/compat";
import cn from "classnames";
import React, { FunctionComponent } from "react";

import CLASSES from "coral-stream/classes";
import { Flex } from "coral-ui/components/v2";
import { Button } from "coral-ui/components/v3";

import styles from "./UserBoxUnauthenticated.css";

interface ShowRegisterOnlyObj {
  enabled?: boolean;
  login: true;
}

export interface UserBoxUnauthenticatedProps {
  onSignIn: () => void;
  onRegister?: () => void;
  showRegisterButton?: boolean;
  showRegisterOnly: ShowRegisterOnlyObj;
}

const UserBoxUnauthenticated: FunctionComponent<UserBoxUnauthenticatedProps> = (
  props
) => {
  console.log("s-s-s>>>>>>>>>>>>>showRegisterOnly>", props.showRegisterOnly);
  return (
    <Localized
      id="general-authenticationSection"
      attrs={{ "aria-label": true }}
    >
      <Flex
        alignItems="center"
        className={CLASSES.viewerBox.$root}
        wrap
        container="section"
        aria-label="Authentication"
      >
        {!props.showRegisterOnly.enabled && (
          <Localized id="general-userBoxUnauthenticated-joinTheConversation">
            <span className={cn(styles.joinText, CLASSES.viewerBox.joinText)}>
              Join the conversation
            </span>
          </Localized>
        )}
        <div className={cn(styles.actions, CLASSES.viewerBox.actionButtons)}>
          {(props.showRegisterButton || props.showRegisterOnly.enabled) && (
            <Localized id="general-userBoxUnauthenticated-register">
              <Button
                color="primary"
                fontSize="extraSmall"
                paddingSize="extraSmall"
                variant="filled"
                onClick={props.onRegister}
                className={cn(
                  styles.register,
                  CLASSES.viewerBox.registerButton
                )}
                upperCase
              >
                Register
              </Button>
            </Localized>
          )}
          {(!props.showRegisterOnly.enabled ||
            props.showRegisterOnly.login) && (
            <Localized id="general-userBoxUnauthenticated-signIn">
              <Button
                color="primary"
                fontSize="extraSmall"
                paddingSize="extraSmall"
                variant="outlined"
                onClick={props.onSignIn}
                className={CLASSES.viewerBox.signInButton}
                upperCase
              >
                Sign in
              </Button>
            </Localized>
          )}
        </div>
      </Flex>
    </Localized>
  );
};

export default UserBoxUnauthenticated;
