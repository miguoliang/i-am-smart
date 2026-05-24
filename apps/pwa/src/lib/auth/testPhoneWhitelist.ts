export function getTestOtpCode(): string | null {
  const code = process.env.TEST_OTP_CODE?.trim();
  return code && code.length >= 6 ? code : null;
}

export function getTestPhoneWhitelist(): string[] {
  if (!getTestOtpCode()) return [];

  return (process.env.TEST_PHONE_WHITELIST ?? "")
    .split(",")
    .map((phone) => phone.trim())
    .filter(Boolean);
}
