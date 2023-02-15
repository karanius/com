import Joi from "joi";
import { Strategy as LocalStrategy } from "passport-local";

import { AppOptions } from "coral-server/app";
import { VerifyCallback } from "coral-server/app/middleware/passport";
import { RequestLimiter } from "coral-server/app/request/limiter";
import { MongoContext } from "coral-server/data/context";
import { InvalidCredentialsError } from "coral-server/errors";
import {
  retrieveUserWithProfile,
  // User,
  verifyUserPassword,
} from "coral-server/models/user";
import { SMSQueue } from "coral-server/queue/tasks/sms";
import { Request, TenantCoralRequest } from "coral-server/types/express";

const verifyFactory =
  (
    mongo: MongoContext,
    ipLimiter: RequestLimiter,
    emailLimiter: RequestLimiter,
    smsQueue: SMSQueue
  ) =>
  async (
    req: Request<TenantCoralRequest>,
    emailInput: string,
    passwordInput: string,
    done: VerifyCallback
  ) => {
    try {
      // Validate that the email address and password are reasonable.
      const email = Joi.attempt(
        emailInput,
        Joi.string().trim().lowercase().email()
      );
      const password = Joi.attempt(passwordInput, Joi.string());

      await ipLimiter.test(req, req.ip);
      await emailLimiter.test(req, email);

      const { tenant } = req.coral;

      // Get the user from the database.
      const user = await retrieveUserWithProfile(mongo, tenant.id, {
        id: email,
        type: "local",
      });
      if (!user) {
        // The user didn't exist.
        return done(new InvalidCredentialsError("user not found"));
      }


      // Verify the password.
      const passwordVerified = await verifyUserPassword(user, password);
      if (!passwordVerified) {
        return done(new InvalidCredentialsError("invalid password"));
      }
      // const actualUser: any = await mongo
      //   .users()
      //   .findOne({ tenantID: tenant.id, email });

      // if (!actualUser.emailVerified && actualUser.role !== "ADMIN") {
      //   return done(new NotVerifiedError("Please verify your email to login!"));
      // }

      // if (user.emailVerified) {
      //   // Send otp
      //   await sendOTP(mongo, smsQueue, tenant, actualUser as Required<User>);
      // }

      return done(null, user);
    } catch (err) {
      return done(err);
    }
  };

type Options = Pick<
  AppOptions,
  "mongo" | "redis" | "config" | "tenantCache" | "signingConfig" | "smsQueue"
>;

export function createLocalStrategy({
  mongo,
  redis,
  config,
  smsQueue,
}: Options) {
  const ipLimiter = new RequestLimiter({
    redis,
    ttl: "10m",
    max: 10,
    prefix: "ip",
    config,
  });
  const emailLimiter = new RequestLimiter({
    redis,
    ttl: "10m",
    max: 10,
    prefix: "email",
    config,
  });
  return new LocalStrategy(
    {
      usernameField: "email",
      passwordField: "password",
      session: false,
      passReqToCallback: true,
    },
    verifyFactory(mongo, ipLimiter, emailLimiter, smsQueue)
  );
}
