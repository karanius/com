import { Localized } from "@fluent/react/compat";
import React from "react";
import { FunctionComponent } from "react";
import { Field } from "react-final-form";
import { graphql } from "react-relay";

import { colorFromMeta, parseEmptyAsNull } from "coral-framework/lib/form";
import { composeValidators, required } from "coral-framework/lib/validation";
import {
  FieldSet,
  Flex,
  FormField,
  FormFieldDescription,
  Label,
  TextField,
} from "coral-ui/components/v2";

import ConfigBox from "../../ConfigBox";
import Header from "../../Header";
import ValidationMessage from "../../ValidationMessage";

// eslint-disable-next-line no-unused-expressions
graphql`
  fragment SecretPasswordConfig_formValues on Auth {
    secretPasswordText
  }
`;

interface Props {
  disabled?: boolean;
}

const SecretPasswordConfig: FunctionComponent<Props> = ({ disabled }) => (
  <ConfigBox
    title={
      <Localized id="configure-auth-secret-password-settings">
        <Header container="h2">Secret password</Header>
      </Localized>
    }
  >
    <Localized
      id="configure-auth-secret-password-description"
      elems={{ strong: <strong /> }}
    >
      <FormFieldDescription>
        A secret password to manage user access from admin.
      </FormFieldDescription>
    </Localized>
    <Field
      name="auth.secretPasswordText"
      validate={composeValidators(required)}
    >
      {({ input, meta }) => (
        <>
          <Flex direction="row" itemGutter="half" alignItems="center">
            <TextField
              {...input}
              id={input.name}
              disabled={disabled}
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck={false}
              color={colorFromMeta(meta)}
              fullWidth
            />
          </Flex>
          <ValidationMessage meta={meta} fullWidth />
        </>
      )}
    </Field>
  </ConfigBox>
);

export default SecretPasswordConfig;
