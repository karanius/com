import Joi from "joi";
import { isNil } from "lodash";
import timeoutPromiseAfter from "p-timeout";

import { Config } from "coral-server/config";
import { MongoContext } from "coral-server/data/context";
import { WrappedInternalError } from "coral-server/errors";
import { createTimer } from "coral-server/helpers";
import logger from "coral-server/logger";
import { isLastAttempt, JobProcessor } from "coral-server/queue/Task";
import { I18n } from "coral-server/services/i18n";
import {
  TenantCache,
  TenantCacheAdapter,
} from "coral-server/services/tenant/cache";
import twilio from "twilio";

export const JOB_NAME = "sms";

export interface SMSProcessorOptions {
  config: Config;
  mongo: MongoContext;
  tenantCache: TenantCache;
  i18n: I18n;
}

export interface SMSData {
  templateName: string;
  message: {
    to: string;
    msg: string;
  };
  tenantID: string;
}

export interface Message {
  body: string;
  from: string;
  to: string;
}

const SMSDataSchema = Joi.object().keys({
  templateName: Joi.string(),
  message: Joi.object().keys({
    to: Joi.string(),
    msg: Joi.string(),
  }),
  tenantID: Joi.string(),
});

function send(client: any, message: Message): Promise<any> {
  return new Promise((resolve, reject) => {
    client.messages
      .create({
        body: message.body,
        from: message.from,
        to: message.to,
      })
      .then((msg: any) => {
        return resolve(msg);
      })
      .catch((err: any) => reject(err));
  });
}

export const createJobProcessor = (
  options: SMSProcessorOptions
): JobProcessor<SMSData> => {
  const { tenantCache, config } = options;

  // The maximum number of SMSs that can be sent on a given transport.
  const transportTimeout = config.get("smtp_transport_timeout");

  // Store the number of SMSs sent so we can reset the transport if it errors
  // or it exceeds the maximum send amount.
  let sentSMSsCounter = 0;

  // Create the cache adapter that will handle invalidating the SMS transport
  // when the tenant experiences a change.
  const cache = new TenantCacheAdapter<any>(tenantCache, async () => {
    // When the transport is invalidated because of updates to the Tenant, then
    // reset the SMS counter.
    sentSMSsCounter = 0;
  });

  // Create the message translator function.
  return async (job) => {
    console.log("S-s-s>>>>>>>>>>>>job", job);
    const { value: data, error: err } = SMSDataSchema.validate(job.data, {
      stripUnknown: true,
      presence: "required",
      abortEarly: false,
    });
    if (err) {
      logger.error(
        {
          jobID: job.id,
          jobName: JOB_NAME,
          err,
        },
        "job data did not match expected schema"
      );
      return;
    }
    console.log("S-s-s>>>>>>>>>>>>dattaaa", data);

    // Pull the data out of the validated model.
    const {
      tenantID,
      message: { to, msg },
    } = data;

    const log = logger.child(
      {
        jobID: job.id,
        jobName: JOB_NAME,
        tenantID,
        sentSMSs: sentSMSsCounter,
      },
      true
    );

    // Get the referenced tenant so we know who to send it from.
    const tenant = await tenantCache.retrieveByID(tenantID);
    if (!tenant) {
      log.error("referenced tenant was not found");
      return;
    }

    const {
      enabled,
      twilio: { accountSID, authToken, from },
    } = tenant.sms;
    if (!enabled) {
      log.error("not sending SMS, it was disabled");
      return;
    }

    // Check that we have enough to generate the smtp credentials.
    if (isNil(accountSID) || isNil(authToken)) {
      log.error("SMS enabled, but configuration is incomplete");
      return;
    }

    if (!from) {
      log.error(
        "SMS was enabled but the my twilio phone number configuration was missing"
      );
      return;
    }

    log.debug("starting to send the SMS");

    const messageSendTimer = createTimer();

    try {
      // Send the mail message, and time the send out if it takes longer than
      // the transport timeout to finish.
      const client = twilio(accountSID, authToken);

      await timeoutPromiseAfter(
        send(client, {
          from,
          to,
          body: msg,
        }),
        transportTimeout
      );
    } catch (e) {
      // As the SMS has failed to send, there may be an issue with the
      // transport, so clear the stored transport.
      cache.delete(tenantID);

      // Reset the sent SMS counter, we've reset the transport!
      sentSMSsCounter = 0;
      log.warn({ err: e }, "reset smtp transport due to a send error");

      if (isLastAttempt(job)) {
        throw new WrappedInternalError(e, "could not send SMS, not retrying");
      }

      throw new WrappedInternalError(e, "could not send SMS, will retry");
    }

    // Increment the sent SMS counter.
    sentSMSsCounter++;

    log.debug({ responseTime: messageSendTimer() }, "sent the SMS");
  };
};
