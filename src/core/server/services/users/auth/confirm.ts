import Joi from "joi";
import { isNull } from "lodash";
import { DateTime } from "luxon";
import { v4 as uuid } from "uuid";

import { constructTenantURL } from "coral-server/app/url";
import { Config } from "coral-server/config";
import { MongoContext } from "coral-server/data/context";
import {
  ConfirmEmailTokenExpired,
  IncorrectVerificationCode,
  TokenInvalidError,
  UserNotFoundError,
} from "coral-server/errors";
import { Tenant } from "coral-server/models/tenant";
import {
  confirmUserEmail,
  confirmUserPhone,
  createOrRetrieveUserEmailVerificationID,
  retrieveUser,
  User,
} from "coral-server/models/user";
import { saveVerificationCode } from "coral-server/models/verifications";
import { MailerQueue } from "coral-server/queue/tasks/mailer";
import { SMSQueue } from "coral-server/queue/tasks/sms";
import {
  JWTSigningConfig,
  signString,
  StandardClaims,
  StandardClaimsSchema,
  verifyJWT,
} from "coral-server/services/jwt";

export interface ConfirmToken extends Required<StandardClaims> {
  // aud specifies `confirm` as the audience to indicate that this is a confirm
  // token.
  aud: "confirm";

  /**
   * email is the email address being confirmed.
   */
  email: string;

  /**
   * evid is the email verification ID token.
   */
  evid: string;
}

const ConfirmTokenSchema = StandardClaimsSchema.keys({
  aud: Joi.string().valid("confirm"),
  email: Joi.string().email(),
  evid: Joi.string(),
});

export function validateConfirmToken(
  token: ConfirmToken | object
): Error | null {
  const { error } = ConfirmTokenSchema.validate(token, {
    presence: "required",
  });
  return error || null;
}

export function isConfirmToken(
  token: ConfirmToken | object
): token is ConfirmToken {
  return isNull(validateConfirmToken(token));
}

export async function generateConfirmURL(
  mongo: MongoContext,
  tenant: Tenant,
  config: Config,
  signingConfig: JWTSigningConfig,
  user: Required<Pick<User, "id" | "email">>,
  now: Date
) {
  // Pull some stuff out of the user.
  const { id, email } = user;

  // Change the JS Date to a DateTime for ease of use.
  const nowDate = DateTime.fromJSDate(now);
  const nowSeconds = Math.round(nowDate.toSeconds());

  // The expiry of this token is linked as 1 week after issuance.
  const expiresAt = Math.round(nowDate.plus({ weeks: 1 }).toSeconds());

  // Create the email verification id.
  const evid = await createOrRetrieveUserEmailVerificationID(
    mongo,
    tenant.id,
    id
  );

  // Generate a token with this new reset ID.
  const confirmToken: ConfirmToken = {
    jti: uuid(),
    iss: tenant.id,
    sub: id,
    exp: expiresAt,
    iat: nowSeconds,
    nbf: nowSeconds,
    aud: "confirm",
    email,
    evid,
  };

  // Sign it with the signing config.
  const token = await signString(signingConfig, confirmToken);

  // Generate the confirmation url.
  return constructTenantURL(
    config,
    tenant,
    `/account/email/confirm#confirmToken=${token}`
  );
}

export async function verifyConfirmTokenString(
  mongo: MongoContext,
  tenant: Tenant,
  signingConfig: JWTSigningConfig,
  tokenString: string,
  now: Date
) {
  const token = verifyJWT(tokenString, signingConfig, now, {
    // Verify that the token is for this Tenant.
    issuer: tenant.id,
    // Verify that this is a confirm token based on the audience.
    audience: "confirm",
  });

  // Validate that this is indeed a reset token.
  if (!isConfirmToken(token)) {
    // TODO: (wyattjoh) look into a way of pulling the error into this one
    throw new TokenInvalidError(
      tokenString,
      "does not conform to the confirm token schema"
    );
  }

  // Unpack some of the token.
  const { sub: userID, email, evid: emailVerificationID, iss } = token;

  // TODO: (wyattjoh) verify that the token has not been revoked.

  // Check to see if this confirm token has already verified this email.
  const user = await retrieveUser(mongo, tenant.id, userID);
  if (!user) {
    throw new UserNotFoundError(userID);
  }

  if (iss !== tenant.id) {
    throw new TokenInvalidError(tokenString, "invalid tenant");
  }

  // Check to see if the email address being verified matches the one that's
  // been provided.
  if (user.email !== email) {
    throw new ConfirmEmailTokenExpired("email mismatch");
  }

  // Check to see that the email verification ID matches.
  if (user.emailVerificationID !== emailVerificationID) {
    throw new ConfirmEmailTokenExpired("email verification id mismatch");
  }

  // Check to see if the user has a verified email address already.
  if (user.emailVerified) {
    throw new ConfirmEmailTokenExpired("email address already verified");
  }
  if (user.phoneVerified) {
    throw new ConfirmEmailTokenExpired("phone number already verified");
  }

  // Now that we've verified that the token is valid, and has been checked to
  // match the current email address, we're good to go!
  return token;
}

export async function confirmEmail(
  mongo: MongoContext,
  tenant: Tenant,
  signingConfig: JWTSigningConfig,
  tokenString: string,
  now: Date
) {
  // Verify that the confirm token is valid and unpack it.
  const {
    sub: userID,
    email,
    evid: emailVerificationID,
  } = await verifyConfirmTokenString(
    mongo,
    tenant,
    signingConfig,
    tokenString,
    now
  );

  // Perform the confirm operation.
  const user = await confirmUserEmail(
    mongo,
    tenant.id,
    userID,
    email,
    emailVerificationID
  );

  // TODO: (wyattjoh) revoke the JTI

  return user;
}

export async function confirmPhone(
  mongo: MongoContext,
  tenant: Tenant,
  signingConfig: JWTSigningConfig,
  code: number,
  email: string,
  now: Date
) {
  // Verify that the confirm token is valid and unpack it.
  const user = await mongo.users().findOne({ tenantID: tenant.id, email });
  // const user = await retrieveUser(mongo, tenant.id, phoneNumber);
  let incorrect = false;
  if (user?.smsOTP !== code) {
    incorrect = true;
    throw new IncorrectVerificationCode("incorrect verification code");
  }

  if (!incorrect && user && user.phoneNumber) {
    // Perform the confirm operation.
    await confirmUserPhone(mongo, tenant.id, user?.id);
    return { phoneVerified: true, user, emailVerified: user.emailVerified };
  }

  return { phoneVerified: false, emailVerified: user.emailVerified };
}

const generateCode = async (
  mongo: MongoContext,
  tenant: Tenant,
  message: any
) => {
  return saveVerificationCode(mongo, tenant.id, { ...message });
};

export interface VerificationCodeMessage {
  receiver: string;
  type: string;
  verificationType: string;
}

export interface SecretCodeMessage {
  receiver: string; 
  password: string; 
}

export async function sendVerificationCode(
  mongo: MongoContext,
  tenant: Tenant,
  sms: SMSQueue,
  mailer: MailerQueue,
  message: VerificationCodeMessage
) {
  // Generate the confirmation url.
  const verificationMsg = await generateCode(mongo, tenant, message);
  if (verificationMsg?.code) {
    if (message.type === "email") {
      // Send the email confirmation.
      await mailer.add({
        tenantID: tenant.id,
        message: {
          to: message.receiver,
        },
        template: {
          name: "account-notification/confirm-email",
          context: {
            // TODO: (wyattjoh) possibly reevaluate the use of a required username.
            username: "",
            verificationCode: String(verificationMsg?.code),
            organizationName: tenant.organization.name,
            organizationURL: tenant.organization.url,
            organizationContactEmail: tenant.organization.contactEmail,
          },
        },
      });
    } else {
      await sms.add({
        tenantID: tenant.id,
        message: {
          to: message.receiver,
          msg: "Here is an OTP: " + verificationMsg?.code,
        },
      });
    }
    return {
      id: verificationMsg.id,
    };
  } else {
    return {
      id: null,
    };
  }
}

export async function sendSecretCode(
  mongo: MongoContext,
  tenant: Tenant,
  sms: SMSQueue,
  mailer: MailerQueue,
  message: SecretCodeMessage
) {
  // Generate the confirmation url.
  if (message.password) {
    // if (message.type === "email") {
    // // Send the email confirmation.
    // await mailer.add({
    //   tenantID: tenant.id,
    //   message: {
    //     to: message.receiver,
    //   },
    //   template: {
    //     name: "account-notification/confirm-email",
    //     context: {
    //       // TODO: (wyattjoh) possibly reevaluate the use of a required username.
    //       username: "",
    //       verificationCode: String(verificationMsg?.code),
    //       organizationName: tenant.organization.name,
    //       organizationURL: tenant.organization.url,
    //       organizationContactEmail: tenant.organization.contactEmail,
    //     },
    //   },
    // });
    // } else {
    await sms.add({
      tenantID: tenant.id,
      message: {
        to: message.receiver,
        msg: "Here is your secret password " + message?.password,
      },
    });
  }
  return true;
  // } else {
  //   return false;
  // }
}

// export async function sendOTP(
//   mongo: MongoContext,
//   sms: SMSQueue,
//   tenant: Tenant,
//   user: Required<Pick<User, "id" | "username" | "email" | "phoneNumber">>
// ) {
//   const code: any = generateCode(mongo, sms, tenant, user);
// }
