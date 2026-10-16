# Registration email verification

The login page keeps email/password and Google sign-in. Password registration calls signUp, then verifyOtp with type email. It must not be published before the following Supabase configuration is ready.

Project: ikriqgjylpbwqihwpsho

1. Authentication > Sign In / Providers > Email: enable Confirm email (mailer_autoconfirm must be false).
2. Authentication > Email Templates > Confirm signup: include the numeric token using {{ .Token }}. Use the adjacent signup-confirmation.html as the template. Do not change the Magic Link or password recovery templates.
3. Verify SMTP delivery with an approved test mailbox. Existing users keep password sign-in; new unconfirmed registrations cannot sign in until verified. Google OAuth is unchanged.
4. Deploy login.html and invalidate /login and /login.html. Existing automatic website deployment publishes on master push.
5. Verify a new account receives a code, wrong/expired codes fail, resend works after cooldown, and successful verification preserves source=extension behavior.

Offline regression tests: node --test .github/signup.test.cjs

The page checks public Auth settings before creating a password account and blocks registration if automatic email confirmation is still enabled. This guard is not a substitute for the server setting. No service-role credentials are used in the website.

Documentation: https://supabase.com/docs/guides/auth/auth-email-templates
