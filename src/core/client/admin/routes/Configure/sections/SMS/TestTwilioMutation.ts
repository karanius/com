// import { graphql } from "react-relay";
// import { Environment } from "relay-runtime";

// import {
//   commitMutationPromiseNormalized,
//   createMutation,
//   MutationInput,
// } from "coral-framework/lib/relay";

// import { TestTWILIOMutation as MutationTypes } from "coral-admin/__generated__/TestTWILIOMutation.graphql";

// const clientMutationId = 0;

// const TestTWILIOMutation = createMutation(
//   "testTWILIO",
//   (environment: Environment, input: MutationInput<MutationTypes>) => {
//     return commitMutationPromiseNormalized<MutationTypes>(environment, {
//       mutation: graphql`
//         mutation TestTWILIOMutation($input: TestInput!) {
//           testTWILIO(input: $input) {
//             clientMutationId
//           }
//         }
//       `,
//       variables: {
//         input: {
//           clientMutationId: clientMutationId.toString(),
//         },
//       },
//     });
//   }
// );

// export default TestTWILIOMutation;
