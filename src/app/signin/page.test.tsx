/**
 * @jest-environment jsdom
 */
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { ThemeProvider } from 'next-themes';
import SignIn from './page';
import { useSignIn } from '../hooks/useSignIn';
import { useAppleSignIn } from '../hooks/useAppleSignIn';
import { useDebounce } from '../hooks/useDebounce';
import { useCountdown } from '../hooks/useCountdown';

// Mock hooks
jest.mock('../hooks/useSignIn');
jest.mock('../hooks/useAppleSignIn');
jest.mock('../hooks/useDebounce');
jest.mock('../hooks/useCountdown');

// Mock sonner toast
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

// Mock logger
jest.mock('@/lib/utils/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));

// Mock fetch
global.fetch = jest.fn();

// Mock useRouter and useSearchParams
const mockPush = jest.fn();
const mockSearchParams = new URLSearchParams();
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
  useSearchParams: () => mockSearchParams,
}));

expect.extend(toHaveNoViolations);

// Test wrapper with providers
const TestWrapper = ({ children }: { children: React.ReactNode }) => {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
      {children}
    </ThemeProvider>
  );
};

describe('SignIn', () => {
  const mockSetEmail = jest.fn();
  const mockSetOtp = jest.fn();
  const mockHandleSendOtp = jest.fn();
  const mockHandleVerifyOtp = jest.fn();
  const mockHandleResendOtp = jest.fn();
  const mockHandleAppleSignIn = jest.fn();
  const mockResetCountdown = jest.fn();
  const mockOtpInputRef = { current: null };

  beforeEach(() => {
    jest.clearAllMocks();
    mockPush.mockClear();

    // Default mock implementations
    (useSignIn as jest.Mock).mockReturnValue({
      email: '',
      setEmail: mockSetEmail,
      otp: '',
      setOtp: mockSetOtp,
      otpSent: false,
      loading: false,
      otpInputRef: mockOtpInputRef,
      handleSendOtp: mockHandleSendOtp,
      handleVerifyOtp: mockHandleVerifyOtp,
      handleResendOtp: mockHandleResendOtp,
    });

    (useAppleSignIn as jest.Mock).mockReturnValue({
      loading: false,
      handleAppleSignIn: mockHandleAppleSignIn,
    });

    (useDebounce as jest.Mock).mockImplementation((value) => value);

    (useCountdown as jest.Mock).mockReturnValue({
      seconds: 60,
      isActive: false,
      reset: mockResetCountdown,
      start: jest.fn(),
    });
  });

  function agreeToTerms() {
    const checkbox = screen.getByRole('checkbox', { name: /使用即表示同意/ });
    fireEvent.click(checkbox);
  }

  describe('Accessibility', () => {
    it('should have no accessibility violations', async () => {
      const { container } = render(
        <TestWrapper>
          <SignIn />
        </TestWrapper>
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have accessible form controls', () => {
      render(
        <TestWrapper>
          <SignIn />
        </TestWrapper>
      );

      // Check for email input with label
      const emailInput = screen.getByLabelText(/邮箱地址/i);
      expect(emailInput).toBeInTheDocument();
      expect(emailInput).toHaveAttribute('type', 'email');
      expect(emailInput).toHaveAttribute('id', 'email-input');

      // Check for send button
      const sendButton = screen.getByRole('button', { name: /发送验证码/i });
      expect(sendButton).toBeInTheDocument();
    });

    it('should have proper ARIA attributes for email input', () => {
      render(
        <TestWrapper>
          <SignIn />
        </TestWrapper>
      );

      const emailInput = screen.getByLabelText(/邮箱地址/i);
      expect(emailInput).toHaveAttribute('aria-describedby', 'email-description');
      expect(emailInput).toHaveAttribute('aria-invalid', 'false');
    });

    it('should have proper ARIA attributes for OTP input when visible', () => {
      (useSignIn as jest.Mock).mockReturnValue({
        email: 'test@example.com',
        setEmail: mockSetEmail,
        otp: '',
        setOtp: mockSetOtp,
        otpSent: true,
        loading: false,
        otpInputRef: mockOtpInputRef,
        handleSendOtp: mockHandleSendOtp,
        handleVerifyOtp: mockHandleVerifyOtp,
        handleResendOtp: mockHandleResendOtp,
      });

      render(
        <TestWrapper>
          <SignIn />
        </TestWrapper>
      );

      const otpInput = screen.getByPlaceholderText(/请输入验证码/i);
      expect(otpInput).toBeInTheDocument();
      expect(otpInput).toHaveAttribute('aria-label', '请输入6位数字验证码');
      expect(otpInput).toHaveAttribute('aria-describedby', 'otp-description');
      expect(otpInput).toHaveAttribute('autoComplete', 'one-time-code');
      expect(otpInput).toHaveAttribute('inputMode', 'numeric');
      expect(otpInput).toHaveAttribute('maxLength', '6');
    });
  });

  describe('Email Input', () => {
    it('should render email input field', () => {
      render(
        <TestWrapper>
          <SignIn />
        </TestWrapper>
      );

      const emailInput = screen.getByPlaceholderText(/邮箱/i);
      expect(emailInput).toBeInTheDocument();
    });

    it('should call setEmail when email input changes', () => {
      render(
        <TestWrapper>
          <SignIn />
        </TestWrapper>
      );

      const emailInput = screen.getByPlaceholderText(/邮箱/i);
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });

      expect(mockSetEmail).toHaveBeenCalledWith('test@example.com');
    });

    it('should show error message for invalid email', () => {
      (useDebounce as jest.Mock).mockReturnValue('invalid-email');

      render(
        <TestWrapper>
          <SignIn />
        </TestWrapper>
      );

      expect(screen.getByText(/邮箱格式不正确/i)).toBeInTheDocument();
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });

    it('should update aria-invalid when email error exists', () => {
      (useDebounce as jest.Mock).mockReturnValue('invalid-email');

      render(
        <TestWrapper>
          <SignIn />
        </TestWrapper>
      );

      const emailInput = screen.getByLabelText(/邮箱地址/i);
      expect(emailInput).toHaveAttribute('aria-invalid', 'true');
    });

    it('should call handleSendOtp when Enter key is pressed on email input', () => {
      (useSignIn as jest.Mock).mockReturnValue({
        email: 'test@example.com',
        setEmail: mockSetEmail,
        otp: '',
        setOtp: mockSetOtp,
        otpSent: false,
        loading: false,
        otpInputRef: mockOtpInputRef,
        handleSendOtp: mockHandleSendOtp,
        handleVerifyOtp: mockHandleVerifyOtp,
        handleResendOtp: mockHandleResendOtp,
      });

      render(
        <TestWrapper>
          <SignIn />
        </TestWrapper>
      );

      agreeToTerms();
      const emailInput = screen.getByPlaceholderText(/邮箱/i);
      fireEvent.keyDown(emailInput, { key: 'Enter' });

      expect(mockHandleSendOtp).toHaveBeenCalled();
    });

    it('should not call handleSendOtp when Enter key is pressed if email is invalid', () => {
      (useDebounce as jest.Mock).mockReturnValue('invalid-email');
      (useSignIn as jest.Mock).mockReturnValue({
        email: 'invalid-email',
        setEmail: mockSetEmail,
        otp: '',
        setOtp: mockSetOtp,
        otpSent: false,
        loading: false,
        otpInputRef: mockOtpInputRef,
        handleSendOtp: mockHandleSendOtp,
        handleVerifyOtp: mockHandleVerifyOtp,
        handleResendOtp: mockHandleResendOtp,
      });

      render(
        <TestWrapper>
          <SignIn />
        </TestWrapper>
      );

      const emailInput = screen.getByPlaceholderText(/邮箱/i);
      fireEvent.keyDown(emailInput, { key: 'Enter' });

      expect(mockHandleSendOtp).not.toHaveBeenCalled();
    });

    it('should disable email input when OTP is sent', () => {
      (useSignIn as jest.Mock).mockReturnValue({
        email: 'test@example.com',
        setEmail: mockSetEmail,
        otp: '',
        setOtp: mockSetOtp,
        otpSent: true,
        loading: false,
        otpInputRef: mockOtpInputRef,
        handleSendOtp: mockHandleSendOtp,
        handleVerifyOtp: mockHandleVerifyOtp,
        handleResendOtp: mockHandleResendOtp,
      });

      render(
        <TestWrapper>
          <SignIn />
        </TestWrapper>
      );

      const emailInput = screen.getByPlaceholderText(/邮箱/i);
      expect(emailInput).toBeDisabled();
    });
  });

  describe('OTP Input', () => {
    beforeEach(() => {
      (useSignIn as jest.Mock).mockReturnValue({
        email: 'test@example.com',
        setEmail: mockSetEmail,
        otp: '',
        setOtp: mockSetOtp,
        otpSent: true,
        loading: false,
        otpInputRef: mockOtpInputRef,
        handleSendOtp: mockHandleSendOtp,
        handleVerifyOtp: mockHandleVerifyOtp,
        handleResendOtp: mockHandleResendOtp,
      });
    });

    it('should render OTP input when OTP is sent', () => {
      render(
        <TestWrapper>
          <SignIn />
        </TestWrapper>
      );

      const otpInput = screen.getByPlaceholderText(/请输入验证码/i);
      expect(otpInput).toBeInTheDocument();
    });

    it('should sanitize OTP input to only allow digits', () => {
      render(
        <TestWrapper>
          <SignIn />
        </TestWrapper>
      );

      const otpInput = screen.getByPlaceholderText(/请输入验证码/i);
      fireEvent.change(otpInput, { target: { value: 'abc123def456' } });

      // Should only contain digits, max 6 characters
      expect(mockSetOtp).toHaveBeenCalledWith('123456');
    });

    it('should limit OTP input to 6 digits', () => {
      render(
        <TestWrapper>
          <SignIn />
        </TestWrapper>
      );

      const otpInput = screen.getByPlaceholderText(/请输入验证码/i);
      fireEvent.change(otpInput, { target: { value: '1234567890' } });

      expect(mockSetOtp).toHaveBeenCalledWith('123456');
    });

    it('should handle OTP paste and sanitize', () => {
      render(
        <TestWrapper>
          <SignIn />
        </TestWrapper>
      );

      const otpInput = screen.getByPlaceholderText(/请输入验证码/i);
      
      // Mock clipboardData
      const mockClipboardData = {
        getData: jest.fn().mockReturnValue('abc123def'),
      };
      
      const pasteEvent = {
        clipboardData: mockClipboardData,
        preventDefault: jest.fn(),
      } as unknown as React.ClipboardEvent<HTMLInputElement>;

      fireEvent.paste(otpInput, pasteEvent);

      expect(mockSetOtp).toHaveBeenCalledWith('123');
    });

    it('should call handleVerifyOtp when Enter key is pressed on OTP input', () => {
      render(
        <TestWrapper>
          <SignIn />
        </TestWrapper>
      );

      const otpInput = screen.getByPlaceholderText(/请输入验证码/i);
      fireEvent.keyDown(otpInput, { key: 'Enter' });

      expect(mockHandleVerifyOtp).toHaveBeenCalled();
    });

    it('should reset auto-submitted state when OTP length changes away from 6', () => {
      (useSignIn as jest.Mock).mockReturnValue({
        email: 'test@example.com',
        setEmail: mockSetEmail,
        otp: '12345',
        setOtp: mockSetOtp,
        otpSent: true,
        loading: false,
        otpInputRef: mockOtpInputRef,
        handleSendOtp: mockHandleSendOtp,
        handleVerifyOtp: mockHandleVerifyOtp,
        handleResendOtp: mockHandleResendOtp,
      });

      render(
        <TestWrapper>
          <SignIn />
        </TestWrapper>
      );

      const otpInput = screen.getByPlaceholderText(/请输入验证码/i);
      fireEvent.change(otpInput, { target: { value: '123' } });

      // The auto-submitted state should be reset in handleOtpChange
      expect(mockSetOtp).toHaveBeenCalled();
    });
  });

  describe('Buttons', () => {
    it('should render send OTP button when OTP is not sent', () => {
      render(
        <TestWrapper>
          <SignIn />
        </TestWrapper>
      );

      const sendButton = screen.getByRole('button', { name: /发送验证码/i });
      expect(sendButton).toBeInTheDocument();
    });

    it('should disable send button when email is empty', () => {
      render(
        <TestWrapper>
          <SignIn />
        </TestWrapper>
      );

      const sendButton = screen.getByRole('button', { name: /发送验证码/i });
      expect(sendButton).toBeDisabled();
    });

    it('should disable send button when email has error', () => {
      (useDebounce as jest.Mock).mockReturnValue('invalid-email');
      (useSignIn as jest.Mock).mockReturnValue({
        email: 'invalid-email',
        setEmail: mockSetEmail,
        otp: '',
        setOtp: mockSetOtp,
        otpSent: false,
        loading: false,
        otpInputRef: mockOtpInputRef,
        handleSendOtp: mockHandleSendOtp,
        handleVerifyOtp: mockHandleVerifyOtp,
        handleResendOtp: mockHandleResendOtp,
      });

      render(
        <TestWrapper>
          <SignIn />
        </TestWrapper>
      );

      const sendButton = screen.getByRole('button', { name: /发送验证码/i });
      expect(sendButton).toBeDisabled();
    });

    it('should disable send button when terms not agreed', () => {
      (useSignIn as jest.Mock).mockReturnValue({
        email: 'test@example.com',
        setEmail: mockSetEmail,
        otp: '',
        setOtp: mockSetOtp,
        otpSent: false,
        loading: false,
        otpInputRef: mockOtpInputRef,
        handleSendOtp: mockHandleSendOtp,
        handleVerifyOtp: mockHandleVerifyOtp,
        handleResendOtp: mockHandleResendOtp,
      });

      render(
        <TestWrapper>
          <SignIn />
        </TestWrapper>
      );

      const sendButton = screen.getByRole('button', { name: /发送验证码/i });
      expect(sendButton).toBeDisabled();
    });

    it('should call handleSendOtp when send button is clicked', () => {
      (useSignIn as jest.Mock).mockReturnValue({
        email: 'test@example.com',
        setEmail: mockSetEmail,
        otp: '',
        setOtp: mockSetOtp,
        otpSent: false,
        loading: false,
        otpInputRef: mockOtpInputRef,
        handleSendOtp: mockHandleSendOtp,
        handleVerifyOtp: mockHandleVerifyOtp,
        handleResendOtp: mockHandleResendOtp,
      });

      render(
        <TestWrapper>
          <SignIn />
        </TestWrapper>
      );

      agreeToTerms();
      const sendButton = screen.getByRole('button', { name: /发送验证码/i });
      fireEvent.click(sendButton);

      expect(mockHandleSendOtp).toHaveBeenCalled();
    });

    it('should render verify and resend buttons when OTP is sent', () => {
      (useSignIn as jest.Mock).mockReturnValue({
        email: 'test@example.com',
        setEmail: mockSetEmail,
        otp: '',
        setOtp: mockSetOtp,
        otpSent: true,
        loading: false,
        otpInputRef: mockOtpInputRef,
        handleSendOtp: mockHandleSendOtp,
        handleVerifyOtp: mockHandleVerifyOtp,
        handleResendOtp: mockHandleResendOtp,
      });

      render(
        <TestWrapper>
          <SignIn />
        </TestWrapper>
      );

      expect(screen.getByRole('button', { name: /验证并登录/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /重新发送验证码/i })).toBeInTheDocument();
    });

    it('should disable verify button when OTP is not 6 digits', () => {
      (useSignIn as jest.Mock).mockReturnValue({
        email: 'test@example.com',
        setEmail: mockSetEmail,
        otp: '12345',
        setOtp: mockSetOtp,
        otpSent: true,
        loading: false,
        otpInputRef: mockOtpInputRef,
        handleSendOtp: mockHandleSendOtp,
        handleVerifyOtp: mockHandleVerifyOtp,
        handleResendOtp: mockHandleResendOtp,
      });

      render(
        <TestWrapper>
          <SignIn />
        </TestWrapper>
      );

      const verifyButton = screen.getByRole('button', { name: /验证并登录/i });
      expect(verifyButton).toBeDisabled();
    });

    it('should enable verify button when OTP is 6 digits', () => {
      (useSignIn as jest.Mock).mockReturnValue({
        email: 'test@example.com',
        setEmail: mockSetEmail,
        otp: '123456',
        setOtp: mockSetOtp,
        otpSent: true,
        loading: false,
        otpInputRef: mockOtpInputRef,
        handleSendOtp: mockHandleSendOtp,
        handleVerifyOtp: mockHandleVerifyOtp,
        handleResendOtp: mockHandleResendOtp,
      });

      render(
        <TestWrapper>
          <SignIn />
        </TestWrapper>
      );

      const verifyButton = screen.getByRole('button', { name: /验证并登录/i });
      expect(verifyButton).not.toBeDisabled();
    });

    it('should call handleVerifyOtp when verify button is clicked', () => {
      (useSignIn as jest.Mock).mockReturnValue({
        email: 'test@example.com',
        setEmail: mockSetEmail,
        otp: '123456',
        setOtp: mockSetOtp,
        otpSent: true,
        loading: false,
        otpInputRef: mockOtpInputRef,
        handleSendOtp: mockHandleSendOtp,
        handleVerifyOtp: mockHandleVerifyOtp,
        handleResendOtp: mockHandleResendOtp,
      });

      render(
        <TestWrapper>
          <SignIn />
        </TestWrapper>
      );

      const verifyButton = screen.getByRole('button', { name: /验证并登录/i });
      fireEvent.click(verifyButton);

      expect(mockHandleVerifyOtp).toHaveBeenCalled();
    });

    it('should disable resend button during countdown', () => {
      (useCountdown as jest.Mock).mockReturnValue({
        seconds: 30,
        isActive: true,
        reset: mockResetCountdown,
        start: jest.fn(),
      });

      (useSignIn as jest.Mock).mockReturnValue({
        email: 'test@example.com',
        setEmail: mockSetEmail,
        otp: '',
        setOtp: mockSetOtp,
        otpSent: true,
        loading: false,
        otpInputRef: mockOtpInputRef,
        handleSendOtp: mockHandleSendOtp,
        handleVerifyOtp: mockHandleVerifyOtp,
        handleResendOtp: mockHandleResendOtp,
      });

      render(
        <TestWrapper>
          <SignIn />
        </TestWrapper>
      );

      const resendButton = screen.getByRole('button', { name: /请等待30秒后重新发送/i });
      expect(resendButton).toBeDisabled();
      expect(resendButton).toHaveTextContent(/30秒/);
    });

    it('should call handleResendOtp and resetCountdown when resend button is clicked', () => {
      (useSignIn as jest.Mock).mockReturnValue({
        email: 'test@example.com',
        setEmail: mockSetEmail,
        otp: '',
        setOtp: mockSetOtp,
        otpSent: true,
        loading: false,
        otpInputRef: mockOtpInputRef,
        handleSendOtp: mockHandleSendOtp,
        handleVerifyOtp: mockHandleVerifyOtp,
        handleResendOtp: mockHandleResendOtp,
      });

      render(
        <TestWrapper>
          <SignIn />
        </TestWrapper>
      );

      const resendButton = screen.getByRole('button', { name: /重新发送验证码/i });
      fireEvent.click(resendButton);

      expect(mockHandleResendOtp).toHaveBeenCalled();
      expect(mockResetCountdown).toHaveBeenCalled();
    });

    it('should not call handleResendOtp if countdown is active', () => {
      (useCountdown as jest.Mock).mockReturnValue({
        seconds: 30,
        isActive: true,
        reset: mockResetCountdown,
        start: jest.fn(),
      });

      (useSignIn as jest.Mock).mockReturnValue({
        email: 'test@example.com',
        setEmail: mockSetEmail,
        otp: '',
        setOtp: mockSetOtp,
        otpSent: true,
        loading: false,
        otpInputRef: mockOtpInputRef,
        handleSendOtp: mockHandleSendOtp,
        handleVerifyOtp: mockHandleVerifyOtp,
        handleResendOtp: mockHandleResendOtp,
      });

      render(
        <TestWrapper>
          <SignIn />
        </TestWrapper>
      );

      const resendButton = screen.getByRole('button', { name: /请等待30秒后重新发送/i });
      fireEvent.click(resendButton);

      expect(mockHandleResendOtp).not.toHaveBeenCalled();
    });
  });

  describe('Countdown Timer', () => {
    it('should reset countdown when OTP is sent', () => {
      (useSignIn as jest.Mock).mockReturnValue({
        email: 'test@example.com',
        setEmail: mockSetEmail,
        otp: '',
        setOtp: mockSetOtp,
        otpSent: true,
        loading: false,
        otpInputRef: mockOtpInputRef,
        handleSendOtp: mockHandleSendOtp,
        handleVerifyOtp: mockHandleVerifyOtp,
        handleResendOtp: mockHandleResendOtp,
      });

      render(
        <TestWrapper>
          <SignIn />
        </TestWrapper>
      );

      // Countdown should be reset via useEffect when otpSent becomes true
      expect(mockResetCountdown).toHaveBeenCalled();
    });
  });

  describe('Auto-submit', () => {
    it('should auto-submit when OTP reaches 6 digits', async () => {
      (useSignIn as jest.Mock).mockReturnValue({
        email: 'test@example.com',
        setEmail: mockSetEmail,
        otp: '123456',
        setOtp: mockSetOtp,
        otpSent: true,
        loading: false,
        otpInputRef: mockOtpInputRef,
        handleSendOtp: mockHandleSendOtp,
        handleVerifyOtp: mockHandleVerifyOtp,
        handleResendOtp: mockHandleResendOtp,
      });

      render(
        <TestWrapper>
          <SignIn />
        </TestWrapper>
      );

      // Wait for useEffect to trigger auto-submit
      await waitFor(() => {
        expect(mockHandleVerifyOtp).toHaveBeenCalled();
      });
    });

    it('should not auto-submit multiple times for the same OTP', async () => {
      (useSignIn as jest.Mock).mockReturnValue({
        email: 'test@example.com',
        setEmail: mockSetEmail,
        otp: '123456',
        setOtp: mockSetOtp,
        otpSent: true,
        loading: false,
        otpInputRef: mockOtpInputRef,
        handleSendOtp: mockHandleSendOtp,
        handleVerifyOtp: mockHandleVerifyOtp,
        handleResendOtp: mockHandleResendOtp,
      });

      const { rerender } = render(
        <TestWrapper>
          <SignIn />
        </TestWrapper>
      );

      // Wait for first auto-submit
      await waitFor(() => {
        expect(mockHandleVerifyOtp).toHaveBeenCalledTimes(1);
      });

      // Clear the mock to track subsequent calls
      mockHandleVerifyOtp.mockClear();

      // Rerender with same OTP - should not trigger again
      rerender(
        <TestWrapper>
          <SignIn />
        </TestWrapper>
      );

      // Should not call verify again for the same OTP
      await waitFor(() => {
        expect(mockHandleVerifyOtp).not.toHaveBeenCalled();
      }, { timeout: 100 });
    });
  });

  describe('Loading States', () => {
    it('should show loading state on send button', () => {
      (useSignIn as jest.Mock).mockReturnValue({
        email: 'test@example.com',
        setEmail: mockSetEmail,
        otp: '',
        setOtp: mockSetOtp,
        otpSent: false,
        loading: true,
        otpInputRef: mockOtpInputRef,
        handleSendOtp: mockHandleSendOtp,
        handleVerifyOtp: mockHandleVerifyOtp,
        handleResendOtp: mockHandleResendOtp,
      });

      render(
        <TestWrapper>
          <SignIn />
        </TestWrapper>
      );

      const sendButton = screen.getByRole('button', { name: /发送验证码/i });
      expect(sendButton).toBeDisabled();
    });

    it('should show loading state on verify button', () => {
      (useSignIn as jest.Mock).mockReturnValue({
        email: 'test@example.com',
        setEmail: mockSetEmail,
        otp: '123456',
        setOtp: mockSetOtp,
        otpSent: true,
        loading: true,
        otpInputRef: mockOtpInputRef,
        handleSendOtp: mockHandleSendOtp,
        handleVerifyOtp: mockHandleVerifyOtp,
        handleResendOtp: mockHandleResendOtp,
      });

      render(
        <TestWrapper>
          <SignIn />
        </TestWrapper>
      );

      const verifyButton = screen.getByRole('button', { name: /验证并登录/i });
      expect(verifyButton).toBeDisabled();
    });
  });

  describe('Content', () => {
    it('should render page title', () => {
      render(
        <TestWrapper>
          <SignIn />
        </TestWrapper>
      );

      expect(screen.getByText(/聪明的背单词工具/i)).toBeInTheDocument();
      expect(screen.getByText(/登录/i)).toBeInTheDocument();
    });

    it('should render informational note', () => {
      render(
        <TestWrapper>
          <SignIn />
        </TestWrapper>
      );

      const note = screen.getByText(/首次使用/i);
      expect(note).toBeInTheDocument();
      expect(note).toHaveAttribute('role', 'note');
    });
  });

  describe('Apple Sign-In', () => {
    const originalEnv = process.env;

    beforeEach(() => {
      process.env = { ...originalEnv, NEXT_PUBLIC_APPLE_CLIENT_ID: 'com.example.auth' };
    });

    afterEach(() => {
      process.env = originalEnv;
    });

    it('should render Apple login button when NEXT_PUBLIC_APPLE_CLIENT_ID is set', () => {
      render(
        <TestWrapper>
          <SignIn />
        </TestWrapper>
      );

      const appleButton = screen.getByRole('button', { name: /Apple/i });
      expect(appleButton).toBeInTheDocument();
      expect(appleButton).toHaveTextContent('通过 Apple 登录');
    });

    it('should disable Apple button when terms not agreed', () => {
      render(
        <TestWrapper>
          <SignIn />
        </TestWrapper>
      );

      const appleButton = screen.getByRole('button', { name: /Apple/i });
      expect(appleButton).toBeDisabled();
    });

    it('should enable Apple button after agreeing to terms', () => {
      render(
        <TestWrapper>
          <SignIn />
        </TestWrapper>
      );

      agreeToTerms();
      const appleButton = screen.getByRole('button', { name: /Apple 账号登录/i });
      expect(appleButton).not.toBeDisabled();
    });

    it('should call handleAppleSignIn when Apple button is clicked', () => {
      render(
        <TestWrapper>
          <SignIn />
        </TestWrapper>
      );

      agreeToTerms();
      const appleButton = screen.getByRole('button', { name: /Apple 账号登录/i });
      fireEvent.click(appleButton);

      expect(mockHandleAppleSignIn).toHaveBeenCalled();
    });

    it('should show loading text when Apple sign-in is in progress', () => {
      (useAppleSignIn as jest.Mock).mockReturnValue({
        loading: true,
        handleAppleSignIn: mockHandleAppleSignIn,
      });

      render(
        <TestWrapper>
          <SignIn />
        </TestWrapper>
      );

      expect(screen.getByText('登录中…')).toBeInTheDocument();
    });

    it('should not render Apple button when NEXT_PUBLIC_APPLE_CLIENT_ID is not set', () => {
      process.env = { ...originalEnv };
      delete process.env.NEXT_PUBLIC_APPLE_CLIENT_ID;

      render(
        <TestWrapper>
          <SignIn />
        </TestWrapper>
      );

      expect(screen.queryByText('通过 Apple 登录')).not.toBeInTheDocument();
    });
  });

  describe('Mobile/Tablet device detection', () => {
    const originalEnv = process.env;
    const originalNavigator = navigator.userAgent;

    function setUserAgent(ua: string) {
      Object.defineProperty(navigator, 'userAgent', {
        value: ua,
        writable: true,
        configurable: true,
      });
    }

    beforeEach(() => {
      process.env = {
        ...originalEnv,
        NEXT_PUBLIC_WECHAT_OPEN_APP_ID: 'wx_test_id',
        NEXT_PUBLIC_APPLE_CLIENT_ID: 'com.example.auth',
      };
    });

    afterEach(() => {
      process.env = originalEnv;
      Object.defineProperty(navigator, 'userAgent', {
        value: originalNavigator,
        writable: true,
        configurable: true,
      });
    });

    it('should hide WeChat login on iPhone', () => {
      setUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)');

      render(
        <TestWrapper>
          <SignIn />
        </TestWrapper>
      );

      expect(screen.queryByText('微信登录')).not.toBeInTheDocument();
      expect(screen.getByText('通过 Apple 登录')).toBeInTheDocument();
    });

    it('should hide WeChat login on Android', () => {
      setUserAgent('Mozilla/5.0 (Linux; Android 14; Pixel 8)');

      render(
        <TestWrapper>
          <SignIn />
        </TestWrapper>
      );

      expect(screen.queryByText('微信登录')).not.toBeInTheDocument();
      expect(screen.getByText('通过 Apple 登录')).toBeInTheDocument();
    });

    it('should hide WeChat login on iPad', () => {
      setUserAgent('Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X)');

      render(
        <TestWrapper>
          <SignIn />
        </TestWrapper>
      );

      expect(screen.queryByText('微信登录')).not.toBeInTheDocument();
      expect(screen.getByText('通过 Apple 登录')).toBeInTheDocument();
    });

    it('should show WeChat login on desktop', () => {
      setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36');
      Object.defineProperty(navigator, 'maxTouchPoints', {
        value: 0,
        writable: true,
        configurable: true,
      });

      render(
        <TestWrapper>
          <SignIn />
        </TestWrapper>
      );

      expect(screen.getByText('微信登录')).toBeInTheDocument();
      expect(screen.getByText('通过 Apple 登录')).toBeInTheDocument();
    });
  });
});
