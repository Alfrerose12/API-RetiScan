const otpService = require('../services/otpService');

const twoFactorController = {
    /**
     * POST /api/auth/2fa/send
     *
     * Generates a 6-digit OTP for the authenticated user and returns it.
     * The client (PWA) displays it in the verification banner.
     *
     * ⚠️  In production: send via email/SMS and omit `code` from the response.
     */
    async sendOtp(req, res, next) {
        try {
            const { code, expiresIn } = otpService.generate(req.user.id);

            return res.status(200).json({
                message: '2FA code generated successfully',
                code,        // ← Remove in production (send via email/SMS instead)
                expiresIn,   // seconds
            });
        } catch (err) {
            next(err);
        }
    },

    /**
     * POST /api/auth/2fa/verify
     * Body: { code: "123456" }
     *
     * Verifies the OTP entered by the user. Returns 200 if valid, 400 if not.
     */
    async verifyOtp(req, res, next) {
        try {
            const { code } = req.body;

            if (!code) {
                return res.status(400).json({ error: 'code is required' });
            }

            const result = otpService.verify(req.user.id, code);

            if (!result.valid) {
                return res.status(400).json({ error: result.reason });
            }

            return res.status(200).json({ verified: true });
        } catch (err) {
            next(err);
        }
    },
};

module.exports = twoFactorController;
