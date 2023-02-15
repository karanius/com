import { v4 as uuid } from "uuid";

import { Sub } from "coral-common/types";
import { MongoContext } from "coral-server/data/context";
import { NotVerifiedError } from "coral-server/errors";
import { TenantResource } from "coral-server/models/tenant";
import { NextFunction } from "express";

export interface Verification extends TenantResource {
  readonly id: string;
  receiver: string;
  code: number;
  type: "phone" | "email";
  createdAt: Date;
  verificationType: "SIGNUP" | "SIGNIN";
}

export type CreateVerificationInput = Omit<
  Verification,
  "id" | "createdAt" | "tenantID"
>;

export async function saveVerificationCode(
  mongo: MongoContext,
  tenantID: string,
  { receiver, verificationType, ...input }: CreateVerificationInput,
  now = new Date()
) {
  // Create an ID for the Invite.
  const id = uuid();

  // defaults are the properties set by the application when a new Invite is
  // created.
  const defaults: Sub<Verification, CreateVerificationInput> = {
    id,
    tenantID,
    createdAt: now,
  };
  const code: number = Math.floor(1000 + Math.random() * 9000);
  // Merge the defaults and the input together.
  const verification: Readonly<Verification> = {
    ...defaults,
    ...input,
    code,
    receiver,
    verificationType,
  };

  await mongo.verifications().updateOne(
    {
      receiver,
      type: input.type,
    },
    {
      $set: {
        ...verification,
      },
    },
    {
      upsert: true,
    }
  );
  return { id, code };
}

export async function verifyCode(
  next: NextFunction,
  mongo: MongoContext,
  tenantID: string,
  id: string,
  code: number,
  type: string,
  verificationType: string
) {
  // var d = new Date();
  // d.setMinutes(d.getMinutes() - 5);
  // Try to snag the invite from the database safely.
  // createdAt: { $gte: d }
  const result = await mongo
    .verifications()
    .findOne({ id, tenantID, code, type, verificationType }, {});

  if (!result?.code) {
    throw new NotVerifiedError(`Incorrect ${type} verification code`);
  }
  return !!result.id;
}

export async function removeCode(
  next: NextFunction,
  mongo: MongoContext,
  tenantID: string,
  id: string
) {
  // var d = new Date();
  // d.setMinutes(d.getMinutes() - 5);
  // Try to snag the invite from the database safely.
  // createdAt: { $gte: d }
  await mongo.verifications().deleteMany({ id, tenantID });

  return true;
}

// export async function redeemInviteFromEmail(
//   mongo: MongoContext,
//   tenantID: string,
//   email: string
// ) {
//   // Try to snag the invite from the database safely.
//   const result = await mongo
//     .invites()
//     .findOneAndDelete({ email, tenantID }, {});

//   return result.value || null;
// }

// export async function retrieveInviteFromEmail(
//   mongo: MongoContext,
//   tenantID: string,
//   email: string
// ) {
//   return mongo.invites().findOne({
//     tenantID,
//     email: email.toLowerCase(),
//   });
// }

// export async function retrieveInvite(
//   mongo: MongoContext,
//   tenantID: string,
//   id: string
// ) {
//   return mongo.invites().findOne({
//     tenantID,
//     id,
//   });
// }
