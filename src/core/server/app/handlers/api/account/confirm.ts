import Joi from "joi";

import { AppOptions } from "coral-server/app";
import { validate } from "coral-server/app/request/body";
import { RequestLimiter } from "coral-server/app/request/limiter";
import {
  AuthenticationError,
  EmailAlreadyExists,
  PhoneAlreadyExistsError,
  UserForbiddenError,
} from "coral-server/errors";
import { decodeJWT, extractTokenFromRequest } from "coral-server/services/jwt";
import {
  confirmEmail,
  sendSecretCode,
  sendVerificationCode,
  verifyConfirmTokenString,
} from "coral-server/services/users/auth/confirm";
import { RequestHandler, TenantCoralRequest } from "coral-server/types/express";

import { GQLUSER_ROLE } from "coral-server/graph/schema/__generated__/types";
import { Verification, verifyCode } from "coral-server/models/verifications";
import {
  emailAlreadyExists,
  phoneAlreadyExists,
} from "coral-server/services/users";

export type ConfirmRequestOptions = Pick<
  AppOptions,
  "mongo" | "mailerQueue" | "smsQueue" | "signingConfig" | "redis" | "config"
>;

export interface ConfirmRequestBody {
  userID?: string;
}

export const ConfirmRequestBodySchema = Joi.object().keys({
  userID: Joi.string().optional(),
});

export const confirmRequestHandler = ({
  redis,
  config,
  mongo,
  mailerQueue,
  signingConfig,
}: ConfirmRequestOptions): RequestHandler<TenantCoralRequest> => {
  const ipLimiter = new RequestLimiter({
    redis,
    ttl: "10m",
    max: 10,
    prefix: "ip",
    config,
  });
  const userIDLimiter = new RequestLimiter({
    redis,
    ttl: "10m",
    max: 10,
    prefix: "userID",
    config,
  });

  return async (req, res, next) => {
    try {
      // Rate limit based on the IP address and user agent.
      await ipLimiter.test(req, req.ip);

      // const { tenant, logger } = req.coral;

      // Grab the requesting user.
      const requestingUser = req.user;
      if (!requestingUser) {
        throw new AuthenticationError("no user on request");
      }

      // Store the user's ID that should have a email confirmation email sent.
      let targetUserID: string = requestingUser.id;

      // Get the fields from the body. Validate will throw an error if the body
      // does not conform to the specification.
      const body: ConfirmRequestBody = validate(
        ConfirmRequestBodySchema,
        req.body
      );

      // Now check to see if they have specified a userID in the request.
      if (body.userID) {
        // If the user is an admin user, they can request a confirmation email for
        // another user, so check their role.
        if (requestingUser.role === GQLUSER_ROLE.ADMIN) {
          if (body.userID) {
            targetUserID = body.userID;
          }
        } else {
          throw new UserForbiddenError(
            "attempt to send a confirmation email as a non-admin user",
            "/api/account/confirm",
            "POST",
            requestingUser.id
          );
        }
      }

      await userIDLimiter.test(req, targetUserID);

      // const log = logger.child(
      //   {
      //     targetUserID,
      //     requestingUserID: requestingUser.id,
      //     tenantID: tenant.id,
      //   },
      //   true
      // );

      // // Lookup the user.
      // const targetUser = await retrieveUser(mongo, tenant.id, targetUserID);
      // if (!targetUser) {
      //   throw new UserNotFoundError(targetUserID);
      // }

      // await sendConfirmationEmail(
      //   mongo,
      //   mailerQueue,
      //   tenant,
      //   config,
      //   signingConfig,
      //   // TODO: (wyattjoh) evaluate the use of required here.
      //   targetUser as Required<User>,
      //   now
      // );

      // log.trace("sent confirm email with token");

      return res.sendStatus(204);
    } catch (err) {
      return next(err);
    }
  };
};

export type ConfirmCheckOptions = Pick<
  AppOptions,
  "mongo" | "signingConfig" | "redis" | "config"
>;

export const confirmCheckHandler = ({
  redis,
  mongo,
  signingConfig,
  config,
}: ConfirmCheckOptions): RequestHandler<TenantCoralRequest> => {
  const ipLimiter = new RequestLimiter({
    redis,
    ttl: "10m",
    max: 10,
    prefix: "ip",
    config,
  });
  const subLimiter = new RequestLimiter({
    redis,
    ttl: "5m",
    max: 10,
    prefix: "sub",
    config,
  });

  return async (req, res, next) => {
    try {
      // Rate limit based on the IP address and user agent.
      await ipLimiter.test(req, req.ip);

      const { tenant, now } = req.coral;

      // TODO: evaluate verifying if the Tenant allows verifications to short circuit.

      // Grab the token from the request.
      const tokenString = extractTokenFromRequest(req, true);
      if (!tokenString) {
        return res.sendStatus(400);
      }

      // Decode the token so we can rate limit based on the user's ID.
      const { sub } = decodeJWT(tokenString);
      if (sub) {
        await subLimiter.test(req, sub);
      }

      // Verify the token.
      await verifyConfirmTokenString(
        mongo,
        tenant,
        signingConfig,
        tokenString,
        now
      );

      return res.sendStatus(204);
    } catch (err) {
      return next(err);
    }
  };
};

export type ConfirmOptions = Pick<
  AppOptions,
  "mongo" | "signingConfig" | "redis" | "config"
>;

export const confirmHandler = ({
  redis,
  mongo,
  signingConfig,
  config,
}: ConfirmOptions): RequestHandler<TenantCoralRequest> => {
  const ipLimiter = new RequestLimiter({
    redis,
    ttl: "10m",
    max: 10,
    prefix: "ip",
    config,
  });
  const subLimiter = new RequestLimiter({
    redis,
    ttl: "5m",
    max: 10,
    prefix: "sub",
    config,
  });

  return async (req, res, next) => {
    try {
      // Rate limit based on the IP address and user agent.
      await ipLimiter.test(req, req.ip);

      const { now, tenant } = req.coral;

      // Grab the token from the request.
      const tokenString = extractTokenFromRequest(req, true);
      if (!tokenString) {
        return res.sendStatus(400);
      }

      // Decode the token so we can rate limit based on the user's ID.
      const { sub } = decodeJWT(tokenString);
      if (sub) {
        await subLimiter.test(req, sub);
      }

      // Execute the reset.
      await confirmEmail(mongo, tenant, signingConfig, tokenString, now);

      return res.sendStatus(204);
    } catch (err) {
      return next(err);
    }
  };
};

export const verifyCodeHandler = ({
  redis,
  mongo,
  config,
}: ConfirmOptions): RequestHandler<TenantCoralRequest> => {
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

      const { tenant } = req.coral;
      console.log("s-s-s>>>>>>>>>>>>>>>>>>>>>>>>>>>>", req.body);
      // Grab the token from the request.
      const { code, receiver, type, verificationId, verificationType } =
        req.body;
      if (!code || !receiver || !type || !verificationId || !verificationType) {
        return res.sendStatus(400);
      }
      // Execute the reset.
      const response: any = await verifyCode(
        next,
        mongo,
        tenant.id,
        verificationId,
        Number(code),
        type,
        verificationType
      );
      return res.json({ verified: response });
      // if (response.phoneVerified && response.emailVerified) {
      //   return await handleSuccessfulLogin(
      //     response.user,
      //     signingConfig,
      //     req,
      //     res,
      //     next
      //   );
      // } else {
      //   return res.json(response);
      // }
    } catch (err) {
      return next(err);
    }
  };
};

export const sendVerificationCodeHandler = ({
  redis,
  mongo,
  smsQueue,
  mailerQueue,
  signingConfig,
  config,
}: AppOptions): RequestHandler<TenantCoralRequest> => {
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

      const { tenant } = req.coral;
      console.log("s-s-s>>>>>>>>>>>>>>>>>>>>>>>>>>>>", req.body);
      // Grab the token from the request.
      const { receiver, type, verificationType }: Verification = req.body;
      if (
        !receiver ||
        !type ||
        !["email", "phone"].includes(type) ||
        !verificationType ||
        !["SIGNUP", "SIGNIN"].includes(verificationType)
      ) {
        return res.sendStatus(400);
      }

      if (verificationType === "SIGNUP") {
        const alreadyExists =
          type === "email"
            ? await emailAlreadyExists(mongo, tenant, receiver)
            : await phoneAlreadyExists(mongo, tenant, receiver);
        if (alreadyExists) {
          return next(
            type === "email"
              ? new EmailAlreadyExists()
              : new PhoneAlreadyExistsError(tenant.id, receiver)
          );
        }
      }

      // Execute the reset.
      const response: any = await sendVerificationCode(
        mongo,
        tenant,
        smsQueue,
        mailerQueue,
        { receiver, type, verificationType }
      );
      return res.json(response);
    } catch (err) {
      return next(err);
    }
  };
};

export const sendSecretCodeHandler = ({
  redis,
  mongo,
  smsQueue,
  mailerQueue,
  signingConfig,
  config,
}: AppOptions): RequestHandler<TenantCoralRequest> => {
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

      const { tenant } = req.coral;
      if (req.user?.status.ban.active || !req.user?.phoneNumber || !tenant.auth.secretPasswordText) {
        return res.json({ sent: false });
      }
      console.log("s-s-s>>>>>>>>>>>>>>>>>>>>>>phoneeee>>>>>>", req.user?.phoneNumber);
      // // Grab the token from the request.
      // const { receiver, type, verificationType }: Verification = req.body;
      // if (
      //   !receiver ||
      //   !type ||
      //   !["email", "phone"].includes(type) ||
      //   !verificationType ||
      //   !["SIGNUP", "SIGNIN"].includes(verificationType)
      // ) {
      //   return res.sendStatus(400);
      // }

      // if (verificationType === "SIGNUP") {
      //   const alreadyExists =
      //     type === "email"
      //       ? await emailAlreadyExists(mongo, tenant, receiver)
      //       : await phoneAlreadyExists(mongo, tenant, receiver);
      //   if (alreadyExists) {
      //     return next(
      //       type === "email"
      //         ? new EmailAlreadyExists()
      //         : new PhoneAlreadyExistsError(tenant.id, receiver)
      //     );
      //   }
      // }

      // Execute the reset.
      await sendSecretCode(
        mongo,
        tenant,
        smsQueue,
        mailerQueue,
        {
          receiver: req.user?.phoneNumber,
          password: tenant.auth.secretPasswordText
        }
      );
      return res.json({ sent: true });
    } catch (err) {
      return next(err);
    }
  };
};
