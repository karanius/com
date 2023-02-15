import { Localized } from "@fluent/react/compat";
import React, { FunctionComponent, useCallback } from "react";
import { Field } from "react-final-form";

import { streamColorFromMeta } from "coral-framework/lib/form";
import {
  composeValidators,
  required,
  // validatePhoneNumber,
} from "coral-framework/lib/validation";
import { FormField, InputLabel, TextField } from "coral-ui/components/v2";
import { ValidationMessage } from "coral-ui/components/v3";

interface Props {
  disabled: boolean;
  autofocus?: boolean;
}

const CodeField: FunctionComponent<Props> = (props) => {
  const handleRef = useCallback(
    (ref: HTMLInputElement | null) => {
      if (props.autofocus && ref) {
        ref.focus();
      }
    },
    [props.autofocus]
  );

  return (
    <Field name="code" validate={composeValidators(required)}>
      {({ input, meta }) => (
        <FormField>
          <Localized id="general-code">
            <InputLabel htmlFor={input.name}>Code</InputLabel>
          </Localized>
          <Localized id="general-code" attrs={{ placeholder: true }}>
            <TextField
              {...input}
              id={input.name}
              placeholder="Code"
              type="number"
              color={streamColorFromMeta(meta)}
              disabled={props.disabled}
              fullWidth
              ref={handleRef}
            />
          </Localized>
          <ValidationMessage meta={meta} />
        </FormField>
      )}
    </Field>
  );
};

export default CodeField;
