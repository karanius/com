import { Localized } from "@fluent/react/compat";
import React, { FunctionComponent } from "react";
import { Field } from "react-final-form";

import {
  CheckBox,
  FormField,
  FormFieldHeader,
  Label,
} from "coral-ui/components/v2";

import HelperText from "../../HelperText";

interface Props {
  name: string;
  disabled: boolean;
}

const ShowRegistrationField: FunctionComponent<Props> = ({
  name,
  disabled,
}) => (
  <FormField>
    <FormField>
      <Field name={name} type="checkbox">
        {({ input }) => (
          <Localized id="configure-auth-showCommentStreamRegistration">
            <CheckBox {...input} id={input.name} disabled={disabled}>
              Show comment stream Registration
            </CheckBox>
          </Localized>
        )}
      </Field>
    </FormField>
  </FormField>
);

export default ShowRegistrationField;
