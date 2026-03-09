"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const common_1 = require("@nestjs/common");
const axios_1 = __importDefault(require("axios"));
const auth_service_1 = require("./auth.service");
const create_user_dto_1 = require("../users/dto/create-user.dto");
const login_dto_1 = require("./dto/login.dto");
const resend_verification_dto_1 = require("./dto/resend-verification.dto");
const reset_password_dto_1 = require("./dto/reset-password.dto");
const jwt_auth_guard_1 = require("./guards/jwt-auth.guard");
let AuthController = class AuthController {
    constructor(authService) {
        this.authService = authService;
    }
    buildYouthacksAuthorizationUrl(res) {
        const base = process.env.YOUTHACKS_BASE_URL || 'https://auth.youthacks.org';
        const authUrl = process.env.YOUTHACKS_AUTH_URL || `${base.replace(/\/$/, '')}/oauth/authorize`;
        const clientId = process.env.YOUTHACKS_CLIENT_ID;
        const callback = process.env.YOUTHACKS_CALLBACK_URL ||
            `${(process.env.APP_URL || 'http://localhost:3000').replace(/\/$/, '')}/auth/youthacks/callback`;
        const scope = encodeURIComponent('profile email');
        const crypto = require('crypto');
        const state = crypto.randomBytes(16).toString('hex');
        const cookieOptions = {
            httpOnly: true,
            maxAge: 5 * 60 * 1000,
            sameSite: 'lax',
        };
        if (process.env.NODE_ENV === 'production') {
            cookieOptions.secure = true;
        }
        res.cookie('oauth_state', state, cookieOptions);
        return `${authUrl}?response_type=code&client_id=${encodeURIComponent(clientId)}&redirect_uri=${encodeURIComponent(callback)}&scope=${scope}&state=${encodeURIComponent(state)}`;
    }
    async register(createUserDto) {
        return this.authService.register(createUserDto);
    }
    async login(loginDto) {
        return this.authService.login(loginDto);
    }
    async verifyEmail(email, token) {
        return this.authService.verifyEmail(email, token);
    }
    async resendVerification(resendDto) {
        return this.authService.resendVerification(resendDto.email);
    }
    async forgotPassword(forgotDto) {
        return this.authService.forgotPassword(forgotDto.email);
    }
    async resetPassword(resetDto) {
        return this.authService.resetPassword(resetDto.email, resetDto.token, resetDto.newPassword);
    }
    getProfile(req) {
        return req.user;
    }
    redirectToYouthacks(res) {
        return res.redirect(this.buildYouthacksAuthorizationUrl(res));
    }
    getYouthacksAuthorizationUrl(res) {
        return res.json({ redirectUrl: this.buildYouthacksAuthorizationUrl(res) });
    }
    async YouthacksCallback(req, code, state, res) {
        const base = process.env.YOUTHACKS_BASE_URL || 'https://auth.youthacks.org';
        const tokenUrl = process.env.YOUTHACKS_TOKEN_URL || `${base.replace(/\/$/, '')}/oauth/token`;
        const clientId = process.env.YOUTHACKS_CLIENT_ID;
        const clientSecret = process.env.YOUTHACKS_CLIENT_SECRET;
        const callback = process.env.YOUTHACKS_CALLBACK_URL || `${(process.env.APP_URL || 'http://localhost:3000').replace(/\/$/, '')}/auth/youthacks/callback`;
        const userinfoUrl = process.env.YOUTHACKS_USERINFO_URL || `${base.replace(/\/$/, '')}/oauth/userinfo`;
        const cookieHeader = req.headers && req.headers.cookie;
        const parseCookie = (cookieStr, name) => {
            if (!cookieStr)
                return null;
            const parts = cookieStr.split(';').map((c) => c.trim());
            const found = parts.find((p) => p.startsWith(name + '='));
            if (!found)
                return null;
            return decodeURIComponent(found.split('=').slice(1).join('='));
        };
        const cookieState = parseCookie(cookieHeader, 'oauth_state');
        if (!state || !cookieState || state !== cookieState) {
            return res.status(400).json({ message: 'Invalid or missing OAuth state' });
        }
        res.clearCookie('oauth_state');
        try {
            const tokenResp = await axios_1.default.post(tokenUrl, new URLSearchParams({
                grant_type: 'authorization_code',
                code,
                redirect_uri: callback,
                client_id: clientId,
                client_secret: clientSecret,
            }).toString(), {
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            });
            const accessToken = tokenResp.data.access_token;
            const userResp = await axios_1.default.get(userinfoUrl, {
                headers: { Authorization: `Bearer ${accessToken}` },
            });
            const profile = userResp.data;
            const loginResult = await this.authService.validateOAuthLogin('youthacks', accessToken, profile);
            const frontend = process.env.FRONTEND_URL || process.env.CLIENT_URL || 'http://localhost:3000';
            const fragment = `#access_token=${encodeURIComponent(loginResult.access_token)}&user=${encodeURIComponent(JSON.stringify(loginResult.user))}`;
            return res.redirect(`${frontend.replace(/\/$/, '')}/oauth/callback${fragment}`);
        }
        catch (err) {
            return res.status(500).json({ message: 'OAuth exchange failed', details: err.message });
        }
    }
};
exports.AuthController = AuthController;
__decorate([
    (0, common_1.Post)('register'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_user_dto_1.CreateUserDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "register", null);
__decorate([
    (0, common_1.Post)('login'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [login_dto_1.LoginDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "login", null);
__decorate([
    (0, common_1.Get)('verify-email'),
    __param(0, (0, common_1.Query)('email')),
    __param(1, (0, common_1.Query)('token')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "verifyEmail", null);
__decorate([
    (0, common_1.Post)('resend-verification'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [resend_verification_dto_1.ResendVerificationDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "resendVerification", null);
__decorate([
    (0, common_1.Post)('forgot-password'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [reset_password_dto_1.ForgotPasswordDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "forgotPassword", null);
__decorate([
    (0, common_1.Post)('reset-password'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [reset_password_dto_1.ResetPasswordDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "resetPassword", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Get)('profile'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "getProfile", null);
__decorate([
    (0, common_1.Get)('youthacks'),
    __param(0, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "redirectToYouthacks", null);
__decorate([
    (0, common_1.Get)('youthacks-url'),
    __param(0, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "getYouthacksAuthorizationUrl", null);
__decorate([
    (0, common_1.Get)('youthacks/callback'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)('code')),
    __param(2, (0, common_1.Query)('state')),
    __param(3, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "YouthacksCallback", null);
exports.AuthController = AuthController = __decorate([
    (0, common_1.Controller)('auth'),
    __metadata("design:paramtypes", [auth_service_1.AuthService])
], AuthController);
//# sourceMappingURL=auth.controller.js.map