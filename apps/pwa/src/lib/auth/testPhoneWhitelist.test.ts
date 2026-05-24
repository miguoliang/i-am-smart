import { getTestOtpCode, getTestPhoneWhitelist } from "./testPhoneWhitelist";

describe("testPhoneWhitelist", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("disables the whitelist when the test OTP is missing", () => {
    delete process.env.TEST_OTP_CODE;
    process.env.TEST_PHONE_WHITELIST = "13800138000";

    expect(getTestOtpCode()).toBeNull();
    expect(getTestPhoneWhitelist()).toEqual([]);
  });

  it("normalizes whitelisted China phone numbers", () => {
    process.env.TEST_OTP_CODE = "123456";
    process.env.TEST_PHONE_WHITELIST = "+86 138-0013-8000, 8613900139000, invalid";

    expect(getTestPhoneWhitelist()).toEqual(["13800138000", "13900139000"]);
  });
});
