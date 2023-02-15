import React, { FunctionComponent } from "react";
import { graphql } from "react-relay";

import { useLocal } from "coral-framework/lib/relay";

import { AppContainerLocal } from "coral-stream/__generated__/AppContainerLocal.graphql";

import App from "./App";
import {
  OnEmbedLogin,
  OnEmbedLogout,
  OnEmbedSetCommentID,
  OnEventsForRudderStack,
  OnPostMessageSetAccessToken,
} from "./listeners";
import RefreshTokenHandler from "./RefreshTokenHandler";
import StreamQuery from "coral-stream/tabs/Comments/Stream";

const listeners = (
  <>
    <OnEmbedLogin />
    <OnEmbedLogout />
    <OnEmbedSetCommentID />
    <OnPostMessageSetAccessToken />
    <OnEventsForRudderStack />
  </>
);
interface ShowRegisterOnlyObj {
  enabled?: boolean;
  login: true;
}
interface Props {
  disableListeners?: boolean;
  showRegisterOnly: ShowRegisterOnlyObj;
}

const AppContainer: FunctionComponent<Props> = ({
  showRegisterOnly,
  disableListeners,
}) => {
  const [{ activeTab }] = useLocal<AppContainerLocal>(graphql`
    fragment AppContainerLocal on Local {
      activeTab
    }
  `);
  return (
    <>
      {disableListeners ? null : listeners}
      <RefreshTokenHandler />
      {showRegisterOnly.enabled ? (
        <StreamQuery showRegisterOnly={showRegisterOnly} />
      ) : (
        <App activeTab={activeTab} />
      )}
    </>
  );
};

export default AppContainer;
