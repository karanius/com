import React from "react";
import { graphql } from "react-relay";

import { withRouteConfig } from "coral-framework/lib/router";
import { Delay, Spinner } from "coral-ui/components/v2";

import { SMSConfigRouteQueryResponse } from "coral-admin/__generated__/SMSConfigRouteQuery.graphql";

import SMSConfigContainer from "./SMSConfigContainer";

interface Props {
  data: SMSConfigRouteQueryResponse | null;
  submitting: boolean;
}

class SMSConfigRoute extends React.Component<Props> {
  public render() {
    if (!this.props.data) {
      return (
        <Delay>
          <Spinner />
        </Delay>
      );
    }
    return (
      <SMSConfigContainer
        sms={this.props.data.settings.sms}
        submitting={this.props.submitting}
        viewer={this.props.data.viewer}
      />
    );
  }
}

const enhanced = withRouteConfig<Props>({
  query: graphql`
    query SMSConfigRouteQuery {
      viewer {
        ...SMSConfigContainer_viewer
      }
      settings {
        sms {
          ...SMSConfigContainer_sms
        }
      }
    }
  `,
  cacheConfig: { force: true },
})(SMSConfigRoute);

export default enhanced;
