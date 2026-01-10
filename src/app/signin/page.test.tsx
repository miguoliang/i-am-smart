/**
 * @jest-environment jsdom
 */
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { ThemeProvider } from 'next-themes';
import SignIn from './page';
import { useSignIn } from '../hooks/useSignIn';
import { useDebounce } from '../hooks/useDebounce';
import { useCountdown } from '../hooks/useCountdown';

// Mock hooks
jest.mock('../hooks/useSignIn');
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

// Mock useRouter
const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
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

    (useDebounce as jest.Mock).mockImplementation((value) => value);

    (useCountdown as jest.Mock).mockReturnValue({
      seconds: 60,
      isActive: false,
      reset: mockResetCountdown,
      start: jest.fn(),
    });
  });

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

      expect(screen.getByText(/背它一辈子/i)).toBeInTheDocument();
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
});
