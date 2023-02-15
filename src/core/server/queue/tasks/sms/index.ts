import Queue from "bull";

import logger from "coral-server/logger";
import Task from "coral-server/queue/Task";
import { TenantCache } from "coral-server/services/tenant/cache";

import {
  createJobProcessor,
  JOB_NAME,
  SMSData,
  SMSProcessorOptions,
} from "./processor";

export interface SMSInput {
  message: {
    to: string;
    msg: string;
  };
  tenantID: string;
}

export class SMSQueue {
  private task: Task<SMSData>;
  private tenantCache: TenantCache;

  constructor(queue: Queue.QueueOptions, options: SMSProcessorOptions) {
    this.task = new Task<SMSData>({
      jobName: JOB_NAME,
      jobProcessor: createJobProcessor(options),
      queue,
      // Time the mailer job out after the specified timeout value has been
      // reached.
      timeout: options.config.get("sms_job_timeout"),
    });
    this.tenantCache = options.tenantCache;
  }

  public async counts() {
    return this.task.counts();
  }

  public async add({ tenantID, message: { to, msg } }: SMSInput) {
    console.log("Ss-ss>>>>to>>>>>>", to);
    const log = logger.child(
      {
        jobName: JOB_NAME,
        tenantID,
        to,
      },
      true
    );

    // This is to handle sbn users that don't have an email.
    // These are users who signed up with a third-party login
    // identity (typically Google, FB, or Twitter) and that provider
    // does not disclose that identity's email address to us for
    // whatever reason. So we put an email similar to:
    //
    // missing-{{userID}}
    //
    // It's easy to check for since it's missing an '@' and
    // has their id embedded into it for easy debugging should
    // an error occur around it.
    if (!to.startsWith("+")) {
      log.error(
        { phone: to },
        "not sending sms, phone format should start with +"
      );
      return;
    }

    // All email templates require the tenant in order to insert the footer, so
    // load it from the tenant cache here.
    const tenant = await this.tenantCache.retrieveByID(tenantID);
    if (!tenant) {
      log.error("referenced tenant was not found");
      // TODO: (wyattjoh) maybe throw an error here?
      return;
    }
    console.log("S-s-s>>>>>>>>>>>>>.hello worlldldd222", tenant);

    if (!tenant.sms.enabled) {
      log.error("not adding sms, it was disabled");
      // TODO: (wyattjoh) maybe throw an error here?
      return;
    }
    // Return the job that'll add the email to the queue to be processed later.
    return this.task.add({
      tenantID,
      templateName: "send-sms",
      message: {
        to,
        msg,
      },
    });
  }

  /**
   * process maps the interface to the task process function.
   */
  public process() {
    return this.task.process();
  }
}

export const createSMSTask = (
  queue: Queue.QueueOptions,
  options: SMSProcessorOptions
) => new SMSQueue(queue, options);
