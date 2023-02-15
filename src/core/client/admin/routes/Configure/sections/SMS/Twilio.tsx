import { Localized } from "@fluent/react/compat";
import React from "react";
import { FunctionComponent } from "react";
import { Field } from "react-final-form";
import { graphql } from "react-relay";

import {
  composeValidatorsWhen,
  Condition,
  required,
} from "coral-framework/lib/validation";
import { FormField, FormFieldHeader, Label } from "coral-ui/components/v2";

import TextFieldWithValidation from "../../TextFieldWithValidation";
import { FormProps } from "./SMSConfigContainer";

// eslint-disable-next-line no-unused-expressions
graphql`
  fragment Twilio_formValues on SMSConfiguration {
    enabled
    twilio {
      from
      accountSID
      authToken
    }
  }
`;
interface Props {
  disabled: boolean;
}

const isEnabled: Condition<any, FormProps> = (value, values) =>
  Boolean(values.sms && values.sms.enabled);

const SMS: FunctionComponent<Props> = ({ disabled }) => (
  <>
    <FormField>
      <FormFieldHeader>
        <Localized id="configure-sms-smtpHostLabel">
          <Label>Twilio- Account SID</Label>
        </Localized>
      </FormFieldHeader>
      <Field
        name="sms.twilio.accountSID"
        validate={composeValidatorsWhen(isEnabled, required)}
      >
        {({ input, meta }) => (
          <TextFieldWithValidation
            {...input}
            id={input.name}
            fullWidth
            disabled={disabled}
            meta={meta}
          />
        )}
      </Field>
    </FormField>
    <FormField>
      <FormFieldHeader>
        <Localized id="configure-sms-smtpHostLabel">
          <Label>Twilio- Auth Token</Label>
        </Localized>
      </FormFieldHeader>
      <Field
        name="sms.twilio.authToken"
        validate={composeValidatorsWhen(isEnabled, required)}
      >
        {({ input, meta }) => (
          <TextFieldWithValidation
            {...input}
            id={input.name}
            fullWidth
            disabled={disabled}
            meta={meta}
          />
        )}
      </Field>
    </FormField>
    <FormField>
      <FormFieldHeader>
        <Localized id="configure-sms-smtpHostLabel">
          <Label>Twilio- From Phone Number</Label>
        </Localized>
      </FormFieldHeader>
      <Field
        name="sms.twilio.from"
        validate={composeValidatorsWhen(isEnabled, required)}
      >
        {({ input, meta }) => (
          <TextFieldWithValidation
            {...input}
            id={input.name}
            fullWidth
            disabled={disabled}
            meta={meta}
          />
        )}
      </Field>
    </FormField>
  </>
);

export default SMS;
