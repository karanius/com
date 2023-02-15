import Joi from "joi";
import { v4 as uuid } from "uuid";

import { AppOptions } from "coral-server/app";
import { validate } from "coral-server/app/request/body";
import { RequestLimiter } from "coral-server/app/request/limiter";
import {
  IntegrationDisabled,
  PhoneAlreadyExistsError,
  UsernameAlreadyExists,
} from "coral-server/errors";
import { hasEnabledAuthIntegration } from "coral-server/models/tenant";
import { LocalProfile } from "coral-server/models/user";
import {
  create,
  phoneAlreadyExists,
  usernameAlreadyExists,
} from "coral-server/services/users";
import { RequestHandler, TenantCoralRequest } from "coral-server/types/express";

import { GQLUSER_ROLE } from "coral-server/graph/schema/__generated__/types";
import { removeCode, verifyCode } from "coral-server/models/verifications";

export interface SignupBody {
  username: string;
  password: string;
  email: string;
  phoneNumber: string;
  emailVerificationId: string;
  emailVerificationCode: number;
  phoneVerificationId: string;
  phoneVerificationCode: number;
}

export const SignupBodySchema = Joi.object().keys({
  username: Joi.string().trim(),
  password: Joi.string(),
  email: Joi.string().trim().lowercase().email(),
  phoneNumber: Joi.string().required(),
  emailVerificationId: Joi.string().required(),
  emailVerificationCode: Joi.number().required(),
  phoneVerificationId: Joi.string().required(),
  phoneVerificationCode: Joi.number().required(),
});

export type SignupOptions = Pick<
  AppOptions,
  "mongo" | "signingConfig" | "mailerQueue" | "redis" | "config" | "smsQueue"
>;

export const signupHandler = ({
  config,
  redis,
  mongo,
  signingConfig,
  mailerQueue,
  smsQueue,
}: SignupOptions): RequestHandler<TenantCoralRequest> => {
  const ipLimiter = new RequestLimiter({
    redis,
    ttl: "10m",
    max: 10,
    prefix: "ip",
    config,
  });

  return async (req, res, next) => {
    try {
      // Rate limit based on the IP address and user agent.
      await ipLimiter.test(req, req.ip);

      const { tenant, now } = req.coral;

      // Check to ensure that the local integration has been enabled.
      if (!hasEnabledAuthIntegration(config, tenant, "local")) {
        throw new IntegrationDisabled("local");
      }

      if (!tenant.auth.integrations.local.allowRegistration) {
        // TODO: replace with better error.
        return next(new Error("registration is disabled"));
      }

      // Get the fields from the body. Validate will throw an error if the body
      // does not conform to the specification.
      const {
        username,
        password,
        email,
        phoneNumber,
        emailVerificationCode,
        emailVerificationId,
        phoneVerificationCode,
        phoneVerificationId,
      }: SignupBody = validate(SignupBodySchema, req.body);

      const alreadyExists = await usernameAlreadyExists(
        mongo,
        tenant,
        username
      );
      if (alreadyExists) {
        return next(new UsernameAlreadyExists(tenant.id, username));
      }
      const phnAlreadyExists = await phoneAlreadyExists(
        mongo,
        tenant,
        phoneNumber
      );

      if (phnAlreadyExists) {
        return next(new PhoneAlreadyExistsError(tenant.id, phoneNumber));
      }

      await verifyCode(
        next,
        mongo,
        tenant.id,
        emailVerificationId,
        Number(emailVerificationCode),
        "email",
        "SIGNUP"
      );

      await verifyCode(
        next,
        mongo,
        tenant.id,
        phoneVerificationId,
        Number(phoneVerificationCode),
        "phone",
        "SIGNUP"
      );

      // Configure with profile.
      const profile: LocalProfile = {
        id: email,
        type: "local",
        password,
        passwordID: uuid(),
      };

      // Create the new user.
      await create(
        mongo,
        tenant,
        {
          email,
          username,
          profile,
          phoneNumber,
          // New users signing up via local auth will have the commenter role to
          // start with.
          role: GQLUSER_ROLE.COMMENTER,
        },
        {},
        now
      );

      // // Send off the confirm email.
      // await sendConfirmationEmail(
      //   mongo,
      //   mailerQueue,
      //   tenant,
      //   config,
      //   signingConfig,
      //   user as Required<User>,
      //   now
      // );

      //  // Send otp
      //  await sendOTP(
      //   mongo,
      //   smsQueue,
      //   tenant,
      //   user as Required<User>,
      // );
      await removeCode(next, mongo, tenant.id, phoneVerificationId);
      await removeCode(next, mongo, tenant.id, emailVerificationId);
      // Send off to the passport handler.
      return res.json({ success: true });
    } catch (err) {
      return next(err);
    }
  };
};
