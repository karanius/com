import { Localized } from "@fluent/react/compat";
import React, { useMemo } from "react";
import { useForm } from "react-final-form";
import { graphql } from "react-relay";

import { DeepNullable } from "coral-common/types";
import {
  purgeMetadata,
  withFragmentContainer,
} from "coral-framework/lib/relay";
import { GQLSettings } from "coral-framework/schema";
import { Button, Flex } from "coral-ui/components/v2";

import { SMSConfigContainer_sms } from "coral-admin/__generated__/SMSConfigContainer_sms.graphql";
import { SMSConfigContainer_viewer } from "coral-admin/__generated__/SMSConfigContainer_viewer.graphql";

import Header from "../../Header";
import ConfigBoxWithToggleField from "../Auth/ConfigBoxWithToggleField";
import From from "./From";
import Twilio from "./Twilio";
// import TestSMTPMutation from "./TestTwilioMutation";

interface Props {
  submitting: boolean;
  sms: SMSConfigContainer_sms;
  viewer: SMSConfigContainer_viewer | null;
}

export type FormProps = DeepNullable<Pick<GQLSettings, "sms">>;

const SMSConfigContainer: React.FunctionComponent<Props> = ({
  sms,
  submitting,
  viewer,
}) => {
  const form = useForm();
  // const [loading, setLoading] = useState(false);
  // const [submitError, setSubmitError] = useState<null | string>(null);
  // const { setMessage, clearMessage } = useNotification();
  // const sendTest = useMutation(TestSMTPMutation);
  // const sendTestSMS = useCallback(async () => {
  //   if (!viewer) {
  //     return;
  //   }
  //   setLoading(true);
  //   setSubmitError(null);
  //   try {
  //     // await sendTest();
  //     setLoading(false);
  //     setMessage(
  //       <Localized
  //         id="configure-sms-test-success"
  //         vars={{ sms: viewer.sms }}
  //       >
  //         <AppNotification icon="check_circle_outline" onClose={clearMessage}>
  //           Test sms has been sent to {viewer.sms}
  //         </AppNotification>
  //       </Localized>,
  //       3000
  //     );
  //   } catch (error) {
  //     if (error.code === "RATE_LIMIT_EXCEEDED") {
  //       setLoading(false);
  //     }

  //     setSubmitError(error.message);
  //   }
  // }, []);
  useMemo(() => {
    const values: any = { sms };
    form.initialize(purgeMetadata(values));
  }, []);
  return (
    <ConfigBoxWithToggleField
      disabled={submitting}
      title={
        <Localized id="configure-sms">
          <Header container="h2">SMS settings</Header>
        </Localized>
      }
      name="sms.enabled"
    >
      {(disabledInside) => (
        <>
          <Twilio disabled={disabledInside} />
        </>
      )}
    </ConfigBoxWithToggleField>
  );
};

const enhanced = withFragmentContainer<Props>({
  viewer: graphql`
    fragment SMSConfigContainer_viewer on User {
      phoneNumber
    }
  `,
  sms: graphql`
    fragment SMSConfigContainer_sms on SMSConfiguration {
      enabled
      ...From_formValues_SMS @relay(mask: false)
      ...Twilio_formValues @relay(mask: false)
    }
  `,
})(SMSConfigContainer);

export default enhanced;
