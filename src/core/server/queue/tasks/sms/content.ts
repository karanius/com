// import { camelCase } from "lodash";
// import nunjucks, { Environment, ILoader } from "nunjucks";
// import path from "path";

// import { Config } from "coral-server/config";
// import { Tenant } from "coral-server/models/tenant";
// import {
//   TenantCache,
//   TenantCacheAdapter,
// } from "coral-server/services/tenant/cache";

// import { EmailTemplate } from "./templates";

// // templateDirectory is the directory containing the email templates.
// const templateDirectory = path.join(__dirname, "templates");

// export interface SMSContentOptions {
//   config: Config;
//   tenantCache: TenantCache;
// }

// export default class SMSContent {
//   private cache: TenantCacheAdapter<nunjucks.Environment>;
//   private config: Config;
//   private loaders: ILoader[];

//   constructor({ config, tenantCache }: SMSContentOptions) {
//     this.config = config;

//     // Configure the environment cache.
//     this.cache = new TenantCacheAdapter(tenantCache);

//     // Configure the loaders for the templates that apply to all clients.
//     this.loaders = [
//       // Load the templates from the filesystem.
//       new nunjucks.FileSystemLoader(templateDirectory, {
//         // When we aren't in production mode, reload the templates.
//         watch: this.config.get("env") !== "production",
//       }),
//     ];
//   }

//   /**
//    * getEnvironment will get the environment from the cache if it exists, or
//    * create it, and add it to the cache otherwise.
//    *
//    * @param tenant the Tenant to generate the environment for
//    */
//   private getEnvironment(tenant: Pick<Tenant, "id">): nunjucks.Environment {
//     // Get the nunjucks environment to use for generating the email HTML.
//     let env = this.cache.get(tenant.id);
//     if (!env) {
//       // TODO: (wyattjoh) add the custom loader per tenant here to support customizing templates.
//       // Configure the nunjucks environment.
//       env = new nunjucks.Environment(this.loaders);

//       // Set the environment in the cache.
//       this.cache.set(tenant.id, env);
//     }

//     return env;
//   }

//   /**
//    * generateHTML will generate the HTML for a template and optionally cache
//    * the compiled template based on the configured environment.
//    *
//    * @param tenant the tenant
//    * @param template the HTML email template
//    **/

// }
