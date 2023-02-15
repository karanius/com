import { Localized } from "@fluent/react/compat";
import React, {
  FunctionComponent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { Form } from "react-final-form";

import SetPasswordField from "coral-auth/components/SetPasswordField";
import UsernameField from "coral-auth/components/UsernameField";
import { FormError, OnSubmit } from "coral-framework/lib/form";
import {
  Flex,
  FormField,
  InputLabel,
  Step,
  StepBar,
  TextField,
} from "coral-ui/components/v2";
import { Button, CallOut } from "coral-ui/components/v3";

import { SetViewMutation } from "coral-auth/mutations";
import { useMutation } from "coral-framework/lib/relay";
import { PropTypesOf } from "coral-ui/types";
import { FORM_ERROR } from "final-form";
import {
  SendVerificationCodeMutation,
  withSendVerificationCodeMutation,
} from "./SendVerficationMutation";
import { SignUpMutation, withSignUpMutation } from "./SignUpMutation";
import styles from "./SignUpWithEmail.css";
import { VerifyMutation, withVerifyMutation } from "./VerifyMutation";
// import MuiButton from "@mui/material/Button";

interface verififcationDataProp {
  email: string;
  phoneNumber: string;
  emailVerificationId: string;
  emailVerificationCode: string;
  phoneVerificationId: string;
  phoneVerificationCode: string;
}
interface SendVerificationCodeContainerProps {
  sendVerificationCode: SendVerificationCodeMutation;
  setVerificationData: Function;
  setCurrentLevel: Function;
  currentLevel: number;
  verficationData: verififcationDataProp;
}

interface VerifyButtonContainerProps {
  verify: VerifyMutation;
}

const SendVerificationCode: FunctionComponent<
  SendVerificationCodeContainerProps
> = (props) => {
  const [data, setData] = useState({
    email: "",
    phoneNumber: "",
    emailVerificationId: "",
    emailVerificationCode: "",
    phoneVerificationId: "",
    phoneVerificationCode: "",
  });
  const [error, setError] = useState(null);

  useEffect(() => {
    setData(props.verficationData);
  }, []);

  const sendVerificationCode = async () => {
    try {
      const result: any = await props.sendVerificationCode({
        type: props.currentLevel === 0 ? "email" : "phone",
        receiver: props.currentLevel === 0 ? data.email : data.phoneNumber,
        verificationType: "SIGNUP",
      });
      if (result) {
        setError(null);
        setData({
          ...data,
          [props.currentLevel === 0
            ? "emailVerificationId"
            : "phoneVerificationId"]: result.id,
        });
        // setCurrentVerificationLevel(currentVerificationLevel + 1);
        // if (currentVerificationLevel == 0) {
        // } else {
        //   setCurrentLevel(currentLevel + 1);
        // }
      }
    } catch (err) {
      setError(err.message);
    }
  };

  // useEffect(() => {
  //   if (
  //     currentVerificationLevel === 1 &&
  //     data.emailVerificationCode &&
  //     data.emailVerificationId &&
  //     data.phoneVerificationCode &&
  //     data.phoneVerificationCode
  //   ) {
  //     props.setCurrentLevel(props.currentLevel + 1);
  //   }
  // }, [data, currentVerificationLevel]);

  const VerifyButton: FunctionComponent<VerifyButtonContainerProps> = ({
    verify,
  }) => {
    const verifyCode = async () => {
      try {
        const result: any = await verify({
          type: props.currentLevel === 0 ? "email" : "phone",
          receiver: props.currentLevel === 0 ? data.email : data.phoneNumber,
          verificationId:
            props.currentLevel === 0
              ? data.emailVerificationId
              : data.phoneVerificationId,
          verificationType: "SIGNUP",
          code:
            props.currentLevel === 0
              ? data.emailVerificationCode
              : data.phoneVerificationCode,
        });
        if (result) {
          setError(null);
          props.setCurrentLevel(props.currentLevel + 1);
          // setCurrentVerificationLevel(currentVerificationLevel + 1);
          // if (currentVerificationLevel == 0) {
          // } else {
          //   setCurrentLevel(currentLevel + 1);
          // }
        }
      } catch (err) {
        setError(err.message);
      }
    };
    useEffect(() => {
      props.setVerificationData(data);
    }, [data]);
    return (
      <div className={styles.field}>
        <Flex direction="row" justifyContent="space-around">
          {props.currentLevel !== 0 && (
            <Button
              variant="filled"
              color="primary"
              fontSize="small"
              paddingSize="small"
              upperCase
              onClick={() => {
                props.setCurrentLevel(props.currentLevel - 1);
              }}
            >
              Go back
            </Button>
          )}
          <Button
            variant="filled"
            color="primary"
            fontSize="small"
            paddingSize="small"
            upperCase
            disabled={
              (props.currentLevel === 0 &&
                (!data.emailVerificationCode || !data.emailVerificationId)) ||
              (props.currentLevel === 1 &&
                (!data.phoneVerificationCode || !data.phoneVerificationId))
            }
            onClick={() => {
              verifyCode();
            }}
          >
            Verify {props.currentLevel === 0 ? "email" : "phone"}
          </Button>
        </Flex>
      </div>
    );
  };

  const VerifyButtonEnhanced = withVerifyMutation(VerifyButton);
  return (
    <>
      <div className={styles.field}>
        {error && <div style={{ color: "red", marginBottom: 10 }}>{error}</div>}
        {props.currentLevel === 0 ? (
          <>
            <FormField>
              <Localized id="general-emailAddressLabel">
                <InputLabel htmlFor={"email"}>Email Address</InputLabel>
              </Localized>
              <Localized
                id="general-emailAddressTextField"
                attrs={{ placeholder: true }}
              >
                <TextField
                  id={"email"}
                  placeholder="Email Address"
                  type="email"
                  fullWidth
                  value={data.email}
                  disabled={props.currentLevel != 0}
                  onChange={(e) => {
                    console.log("S-s-s>>>>>>>>>>", e, e.target.value);
                    setData({
                      ...data,
                      email: e.target.value,
                      emailVerificationCode: "",
                      emailVerificationId: "",
                    });
                  }}
                />
              </Localized>
            </FormField>
            <div
              style={{
                marginTop: 1,
                marginBottom: 1,
                textAlign: "right",
                textDecoration: "underline",
                color: "#06069b",
                fontWeight: "bold",
                cursor: "pointer",
              }}
              onClick={sendVerificationCode}
            >
              Send verification code
            </div>
            <FormField>
              <Localized id="general-VerificationcodeLabel">
                <InputLabel htmlFor={"VerificationcodeLabel"}>
                  Verification code
                </InputLabel>
              </Localized>
              <Localized
                id="general-VerificationcodeLabel"
                attrs={{ placeholder: true }}
              >
                <TextField
                  id={"VerificationcodeLabel"}
                  placeholder="Verification code"
                  type="number"
                  disabled={!data.emailVerificationId}
                  value={data.emailVerificationCode}
                  fullWidth
                  onChange={(e) =>
                    setData({
                      ...data,
                      emailVerificationCode: e.target.value,
                    })
                  }
                />
              </Localized>
            </FormField>
          </>
        ) : (
          <>
            <FormField>
              <Localized id="general-phoneNumberLabel">
                <InputLabel htmlFor={"phoneNumber"}>Phone number</InputLabel>
              </Localized>
              <Localized
                id="general-phoneNumberTextField"
                attrs={{ placeholder: true }}
              >
                <TextField
                  id={"phoneNumber"}
                  placeholder="Phone number"
                  type="phoneNumber"
                  fullWidth
                  value={data.phoneNumber}
                  disabled={props.currentLevel > 1}
                  onChange={(e) => {
                    console.log("S-s-s>>>>>>>>>>", e, e.target.value);
                    setData({
                      ...data,
                      phoneNumber: e.target.value,
                      phoneVerificationCode: "",
                      phoneVerificationId: "",
                    });
                  }}
                />
              </Localized>
            </FormField>
            <div
              style={{
                marginTop: 1,
                marginBottom: 1,
                textAlign: "right",
                textDecoration: "underline",
                color: "#06069b",
                fontWeight: "bold",
                cursor: "pointer",
              }}
              onClick={sendVerificationCode}
            >
              Send verification code
            </div>
            <FormField>
              <Localized id="general-VerificationcodePhoneLabel">
                <InputLabel htmlFor={"VerificationcodePhoneLabel"}>
                  Verification code
                </InputLabel>
              </Localized>
              <Localized
                id="general-VerificationcodePhoneLabel"
                attrs={{ placeholder: true }}
              >
                <TextField
                  id={"VerificationcodePhoneLabel"}
                  placeholder="Verification code"
                  type="number"
                  disabled={!data.phoneVerificationId}
                  value={data.phoneVerificationCode}
                  fullWidth
                  onChange={(e) =>
                    setData({
                      ...data,
                      phoneVerificationCode: e.target.value,
                    })
                  }
                />
              </Localized>
            </FormField>
          </>
        )}
      </div>
      <VerifyButtonEnhanced {...props} />
    </>
  );
};
const SendVerificationCodeEnhanced =
  withSendVerificationCodeMutation(SendVerificationCode);

interface FormProps {
  email: string;
  username: string;
  password: string;
  phoneNumber: string;
  confirmPassword: string;
}

interface FormSubmitProps extends FormProps, FormError {}

interface Props {
  onSubmit: OnSubmit<FormSubmitProps>;
  signUp: SignUpMutation;
  setLevel: Function;
}

const SignUp: FunctionComponent<Props> = (props) => {
  const [currentLevel, setCurrentLevel] = useState(0);
  const verficationData = useRef({
    email: "",
    phoneNumber: "",
    emailVerificationId: "",
    emailVerificationCode: "",
    phoneVerificationId: "",
    phoneVerificationCode: "",
  });

  const setView = useMutation(SetViewMutation);

  const onSignIn = useCallback(() => {
    setView({ view: "SIGN_IN", history: "push" });
  }, [setView]);

  const handleSignup: PropTypesOf<typeof SignUp>["onSubmit"] = async (
    input,
    form
  ) => {
    try {
      const result: any = await props.signUp({
        password: input.password,
        username: input.username,
        ...verficationData.current,
      });
      if (result.success) {
        alert("Your account has been created, Please sign in");
        onSignIn();
      }
    } catch (error) {
      return { [FORM_ERROR]: error.message };
    }
  };

  return (
    <>
      <StepBar currentStep={currentLevel} className={styles.stepBar}>
        <Step hidden>Start</Step>
        <Step>
          <Localized id="verifyYourEmail-stepTitleSelect">
            <span>Verify your email</span>
          </Localized>
        </Step>
        <Step>
          <Localized id="verifyYourPhoneNumber-stepTitle">
            <span>Verify your phone number</span>
          </Localized>
        </Step>
        <Step>
          <Localized id="createAnAccount-stepTitle">
            <span>Create an Account</span>
          </Localized>
        </Step>
      </StepBar>

      {currentLevel < 2 ? (
        <SendVerificationCodeEnhanced
          setCurrentLevel={setCurrentLevel}
          currentLevel={currentLevel}
          verficationData={verficationData.current}
          setVerificationData={(data: any) => {
            verficationData.current = data;
          }}
        />
      ) : (
        <Form onSubmit={handleSignup}>
          {({ handleSubmit, submitting, submitError }) => (
            <form autoComplete="off" onSubmit={handleSubmit}>
              {submitError && <CallOut color="error" title={submitError} />}
              <>
                <div className={styles.field}>
                  <UsernameField disabled={submitting} />
                </div>
                <div className={styles.field}>
                  <SetPasswordField disabled={submitting} />
                </div>
                <div className={styles.actions}>
                  <Flex direction="row" justifyContent="space-around">
                    <Button
                      variant="filled"
                      color="primary"
                      fontSize="small"
                      paddingSize="small"
                      upperCase
                      onClick={() => setCurrentLevel(currentLevel - 1)}
                    >
                      <Localized id="signUp-goback">
                        <span>Go back</span>
                      </Localized>
                    </Button>
                    <Button
                      variant="filled"
                      color="primary"
                      fontSize="small"
                      paddingSize="small"
                      type="submit"
                      disabled={submitting}
                      upperCase
                    >
                      <Localized id="signUp-signUpWithEmail">
                        <span>Sign up with Email</span>
                      </Localized>
                    </Button>
                  </Flex>
                </div>
              </>
            </form>
          )}
        </Form>
      )}
    </>
  );
};

const enhanced = withSignUpMutation(SignUp);

export default enhanced;
