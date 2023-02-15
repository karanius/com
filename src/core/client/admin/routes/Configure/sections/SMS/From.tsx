import { FunctionComponent } from "react";
import { graphql } from "react-relay";

// eslint-disable-next-line no-unused-expressions
graphql`
  fragment From_formValues_SMS on SMSConfiguration {
    enabled
  }
`;

interface Props {
  disabled: boolean;
}

const From: FunctionComponent<Props> = ({ disabled }) => <></>;

export default From;
