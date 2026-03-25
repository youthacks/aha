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
const jwt_1 = require("@nestjs/jwt");
const axios_1 = __importDefault(require("axios"));
const auth_service_1 = require("./auth.service");
const create_user_dto_1 = require("../users/dto/create-user.dto");
const login_dto_1 = require("./dto/login.dto");
const resend_verification_dto_1 = require("./dto/resend-verification.dto");
const reset_password_dto_1 = require("./dto/reset-password.dto");
const jwt_auth_guard_1 = require("./guards/jwt-auth.guard");
let AuthController = class AuthController {
    constructor(authService, jwtService) {
        this.authService = authService;
        this.jwtService = jwtService;
    }
    getOAuthCookieOptions() {
        const cookieOptions = {
            httpOnly: true,
            maxAge: 5 * 60 * 1000,
            sameSite: 'lax',
        };
        if (process.env.NODE_ENV === 'production') {
            cookieOptions.secure = true;
        }
        return cookieOptions;
    }
    resolveAuthenticatedUserId(req) {
        const authHeader = req?.headers?.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return null;
        }
        const token = authHeader.slice('Bearer '.length).trim();
        if (!token) {
            return null;
        }
        try {
            const payload = this.jwtService.verify(token);
            return payload?.sub || null;
        }
        catch {
            return null;
        }
    }
    parseCookie(cookieStr, name) {
        if (!cookieStr)
            return null;
        const parts = cookieStr.split(';').map((c) => c.trim());
        const found = parts.find((p) => p.startsWith(name + '='));
        if (!found)
            return null;
        return decodeURIComponent(found.split('=').slice(1).join('='));
    }
    getBackendBaseUrl() {
        return (process.env.BACKEND_URL ||
            process.env.API_URL ||
            process.env.APP_URL ||
            'http://localhost:3000').replace(/\/$/, '');
    }
    getFrontendBaseUrl() {
        return (process.env.FRONTEND_URL || process.env.CLIENT_URL || 'http://localhost:3000').replace(/\/$/, '');
    }
    isDevOAuthDebugMode() {
        return (process.env.NODE_ENV || 'development').toLowerCase() !== 'production';
    }
    maskValue(value, visibleChars = 4) {
        if (!value)
            return 'missing';
        if (value.length <= visibleChars * 2)
            return '*'.repeat(value.length);
        return `${value.slice(0, visibleChars)}***${value.slice(-visibleChars)}`;
    }
    logOAuthDebug(label, details) {
        if (!this.isDevOAuthDebugMode())
            return;
        console.log(`\\n[OAuth Debug] ${label}`);
        console.log(JSON.stringify(details, null, 2));
    }
    quoteForSingleQuotedShell(value) {
        return value.replace(/'/g, `'"'"'`);
    }
    buildTokenCurlCommand(tokenUrl, grantBase, clientId, clientSecret, mode) {
        const dataParts = [
            `--data-urlencode 'grant_type=${this.quoteForSingleQuotedShell(grantBase.grant_type)}'`,
            `--data-urlencode 'code=${this.quoteForSingleQuotedShell(grantBase.code)}'`,
            `--data-urlencode 'redirect_uri=${this.quoteForSingleQuotedShell(grantBase.redirect_uri)}'`,
            ...(mode === 'body'
                ? [
                    `--data-urlencode 'client_id=${this.quoteForSingleQuotedShell(clientId)}'`,
                    `--data-urlencode 'client_secret=${this.quoteForSingleQuotedShell(clientSecret)}'`,
                ]
                : []),
        ];
        const authPart = mode === 'basic'
            ? `-u '${this.quoteForSingleQuotedShell(clientId)}:${this.quoteForSingleQuotedShell(clientSecret)}'`
            : '';
        return [
            `curl -i -X POST '${this.quoteForSingleQuotedShell(tokenUrl)}'`,
            `  -H 'Content-Type: application/x-www-form-urlencoded'`,
            `  -H 'Accept: application/json'`,
            authPart ? `  ${authPart}` : '',
            ...dataParts.map((part) => `  ${part}`),
        ]
            .filter(Boolean)
            .join(' \\\n');
    }
    getYouthacksCallbackUrl(mode) {
        if (mode === 'link') {
            return (process.env.YOUTHACKS_LINK_CALLBACK_URL ||
                `${this.getFrontendBaseUrl()}/auth/youthacks/integration/callback`);
        }
        return process.env.YOUTHACKS_CALLBACK_URL || `${this.getFrontendBaseUrl()}/auth/youthacks/callback`;
    }
    async resolveOidcConfig() {
        const base = (process.env.YOUTHACKS_BASE_URL || 'https://auth.youthacks.org').replace(/\/$/, '');
        const configuredAuthUrl = process.env.YOUTHACKS_AUTH_URL;
        const configuredTokenUrl = process.env.YOUTHACKS_TOKEN_URL;
        const configuredUserInfoUrl = process.env.YOUTHACKS_USERINFO_URL;
        if (configuredAuthUrl && configuredTokenUrl && configuredUserInfoUrl) {
            return {
                authorizationEndpoint: configuredAuthUrl,
                tokenEndpoint: configuredTokenUrl,
                userinfoEndpoint: configuredUserInfoUrl,
            };
        }
        try {
            const discoveryUrl = `${base}/.well-known/openid-configuration`;
            const discovery = await axios_1.default.get(discoveryUrl, { timeout: 5000 });
            return {
                authorizationEndpoint: configuredAuthUrl || discovery.data.authorization_endpoint || `${base}/oauth/authorize`,
                tokenEndpoint: configuredTokenUrl || discovery.data.token_endpoint || `${base}/oauth/token`,
                userinfoEndpoint: configuredUserInfoUrl || discovery.data.userinfo_endpoint || `${base}/oauth/userinfo`,
            };
        }
        catch {
            return {
                authorizationEndpoint: configuredAuthUrl || `${base}/oauth/authorize`,
                tokenEndpoint: configuredTokenUrl || `${base}/oauth/token`,
                userinfoEndpoint: configuredUserInfoUrl || `${base}/oauth/userinfo`,
            };
        }
    }
    async buildYouthacksAuthorizationUrl(res, mode) {
        const oidc = await this.resolveOidcConfig();
        const authUrl = oidc.authorizationEndpoint;
        const clientId = process.env.YOUTHACKS_CLIENT_ID;
        const callback = this.getYouthacksCallbackUrl(mode);
        const scope = encodeURIComponent('openid profile email');
        const crypto = require('crypto');
        const state = crypto.randomBytes(16).toString('hex');
        const cookieOptions = this.getOAuthCookieOptions();
        res.cookie('oauth_state', state, cookieOptions);
        res.cookie('oauth_mode', mode, cookieOptions);
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
    async redirectToYouthacks(req, res) {
        const loggedInUserId = this.resolveAuthenticatedUserId(req);
        if (loggedInUserId) {
            res.cookie('oauth_link_user_id', loggedInUserId, this.getOAuthCookieOptions());
            return res.redirect(await this.buildYouthacksAuthorizationUrl(res, 'link'));
        }
        return res.redirect(await this.buildYouthacksAuthorizationUrl(res, 'login'));
    }
    async getYouthacksAuthorizationUrl(req, res) {
        const loggedInUserId = this.resolveAuthenticatedUserId(req);
        if (loggedInUserId) {
            res.cookie('oauth_link_user_id', loggedInUserId, this.getOAuthCookieOptions());
            return res.json({ redirectUrl: await this.buildYouthacksAuthorizationUrl(res, 'link') });
        }
        return res.json({ redirectUrl: await this.buildYouthacksAuthorizationUrl(res, 'login') });
    }
    async getYouthacksLinkAuthorizationUrl(req, res) {
        res.cookie('oauth_link_user_id', req.user.id, this.getOAuthCookieOptions());
        return res.json({ redirectUrl: await this.buildYouthacksAuthorizationUrl(res, 'link') });
    }
    async exchangeYouthacksAuthorizationCode(req, res, code, state, expectedMode) {
        const oidc = await this.resolveOidcConfig();
        const tokenUrl = oidc.tokenEndpoint;
        const clientId = process.env.YOUTHACKS_CLIENT_ID;
        const clientSecret = process.env.YOUTHACKS_CLIENT_SECRET;
        const userinfoUrl = oidc.userinfoEndpoint;
        const cookieHeader = req.headers && req.headers.cookie;
        const cookieState = this.parseCookie(cookieHeader, 'oauth_state');
        const oauthMode = this.parseCookie(cookieHeader, 'oauth_mode');
        const linkUserId = this.parseCookie(cookieHeader, 'oauth_link_user_id');
        const activeMode = expectedMode || oauthMode || 'login';
        const callback = this.getYouthacksCallbackUrl(activeMode);
        if (!state || !cookieState || state !== cookieState) {
            throw new common_1.BadRequestException('Invalid or missing OAuth state');
        }
        res.clearCookie('oauth_state');
        res.clearCookie('oauth_mode');
        res.clearCookie('oauth_link_user_id');
        try {
            const grantBase = {
                grant_type: 'authorization_code',
                code,
                redirect_uri: callback,
            };
            let tokenResp;
            try {
                this.logOAuthDebug('Token request (basic client auth)', {
                    mode: activeMode,
                    tokenUrl,
                    callback,
                    clientId: this.maskValue(clientId),
                    grantType: grantBase.grant_type,
                    hasCode: !!grantBase.code,
                    curl: this.buildTokenCurlCommand(tokenUrl, grantBase, clientId, clientSecret, 'basic'),
                });
                tokenResp = await axios_1.default.post(tokenUrl, new URLSearchParams(grantBase).toString(), {
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                        Accept: 'application/json',
                        Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
                    },
                });
                this.logOAuthDebug('Token response (basic client auth)', {
                    status: tokenResp.status,
                    hasAccessToken: !!tokenResp?.data?.access_token,
                    responseKeys: Object.keys(tokenResp?.data || {}),
                    data: tokenResp?.data,
                });
            }
            catch (basicErr) {
                this.logOAuthDebug('Token response error (basic client auth)', {
                    status: basicErr?.response?.status,
                    data: basicErr?.response?.data,
                    message: basicErr?.message,
                });
                const basicStatus = basicErr?.response?.status;
                if (basicStatus !== 401 && basicStatus !== 403) {
                    throw basicErr;
                }
                this.logOAuthDebug('Token request (body client auth fallback)', {
                    mode: activeMode,
                    tokenUrl,
                    callback,
                    clientId: this.maskValue(clientId),
                    clientSecret: this.maskValue(clientSecret),
                    grantType: grantBase.grant_type,
                    hasCode: !!grantBase.code,
                    curl: this.buildTokenCurlCommand(tokenUrl, grantBase, clientId, clientSecret, 'body'),
                });
                tokenResp = await axios_1.default.post(tokenUrl, new URLSearchParams({
                    ...grantBase,
                    client_id: clientId,
                    client_secret: clientSecret,
                }).toString(), {
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                        Accept: 'application/json',
                    },
                });
                this.logOAuthDebug('Token response (body client auth fallback)', {
                    status: tokenResp.status,
                    hasAccessToken: !!tokenResp?.data?.access_token,
                    responseKeys: Object.keys(tokenResp?.data || {}),
                    data: tokenResp?.data,
                });
            }
            const accessToken = tokenResp.data.access_token;
            this.logOAuthDebug('Userinfo request', {
                userinfoUrl,
                accessToken: this.maskValue(accessToken),
            });
            const userResp = await axios_1.default.get(userinfoUrl, {
                headers: { Authorization: `Bearer ${accessToken}` },
            });
            this.logOAuthDebug('Userinfo response', {
                status: userResp.status,
                data: userResp.data,
            });
            const profile = userResp.data;
            if (activeMode === 'link') {
                if (!linkUserId) {
                    throw new common_1.UnauthorizedException('Missing account link context');
                }
                const providerId = profile.sub || profile.id;
                if (!providerId) {
                    throw new common_1.BadRequestException('OAuth profile is missing provider subject');
                }
                await this.authService.linkYouthacksAccount(linkUserId, providerId);
                return {
                    mode: 'link',
                    message: 'Youthacks account linked successfully',
                };
            }
            const loginResult = await this.authService.validateOAuthLogin('youthacks', accessToken, profile);
            return {
                mode: 'login',
                ...loginResult,
            };
        }
        catch (err) {
            if (err?.getStatus && typeof err.getStatus === 'function') {
                throw err;
            }
            const providerStatus = err?.response?.status;
            const providerData = err?.response?.data;
            const providerError = providerData?.error || providerData?.code;
            const providerDesc = providerData?.error_description || providerData?.message || providerData?.detail;
            if (providerStatus === 403) {
                const baseHelp = activeMode === 'link'
                    ? 'Youthacks denied the account-link request. Please reconnect from Settings and try again.'
                    : 'Youthacks denied the login request. If this is your first OAuth login, connect your Youthacks account in Settings first.';
                const redirectHelp = `Confirm this redirect URI is registered in your OAuth provider: ${callback}`;
                const providerHelp = providerDesc ? ` Provider response: ${providerDesc}` : '';
                throw new common_1.ForbiddenException(`${baseHelp} ${redirectHelp}.${providerHelp}`.trim());
            }
            if (providerStatus === 400 && providerError === 'invalid_grant') {
                throw new common_1.BadRequestException('OAuth code is invalid or expired. Please retry login from the beginning and do not reuse old callback URLs.');
            }
            if (err?.response?.data?.error) {
                const detail = providerDesc ? `${providerError}: ${providerDesc}` : providerError;
                throw new common_1.InternalServerErrorException(`OAuth exchange failed: ${detail}`);
            }
            if (err?.response?.data?.error_description) {
                throw new common_1.InternalServerErrorException(`OAuth exchange failed: ${err.response.data.error_description}`);
            }
            if (err?.message) {
                throw new common_1.InternalServerErrorException(`OAuth exchange failed: ${err.message}`);
            }
            throw new common_1.InternalServerErrorException('OAuth exchange failed');
        }
    }
    async exchangeYouthacksCode(req, code, state, res) {
        const cookieMode = this.parseCookie(req?.headers?.cookie, 'oauth_mode') || 'login';
        try {
            const result = await this.exchangeYouthacksAuthorizationCode(req, res, code, state, cookieMode);
            return res.json(result);
        }
        catch (err) {
            const status = err?.getStatus ? err.getStatus() : err?.status || 500;
            const message = err?.response?.message || err?.message || 'OAuth exchange failed';
            return res.status(status).json({
                message,
                statusCode: status,
                oauthMode: cookieMode,
            });
        }
    }
    buildOAuthErrorRedirect(mode, status, message) {
        const frontend = this.getFrontendBaseUrl();
        const target = mode === 'link' ? '/settings' : '/login';
        const query = `oauth=failed&status=${encodeURIComponent(String(status))}&reason=${encodeURIComponent(message)}`;
        return `${frontend}${target}?${query}`;
    }
    async handleYouthacksCallback(req, code, state, res, mode) {
        try {
            const result = await this.exchangeYouthacksAuthorizationCode(req, res, code, state, mode);
            if (result.mode === 'link') {
                return res.redirect(`${this.getFrontendBaseUrl()}/settings?oauth=linked`);
            }
            const fragment = `#access_token=${encodeURIComponent(result.access_token)}&user=${encodeURIComponent(JSON.stringify(result.user))}`;
            return res.redirect(`${this.getFrontendBaseUrl()}/oauth/callback${fragment}`);
        }
        catch (err) {
            const status = err?.getStatus ? err.getStatus() : err?.status || 500;
            const message = err?.response?.message || err?.message || 'OAuth exchange failed';
            return res.redirect(this.buildOAuthErrorRedirect(mode, status, message));
        }
    }
    async YouthacksCallback(req, code, state, res) {
        return this.handleYouthacksCallback(req, code, state, res, 'login');
    }
    async youthacksIntegrationCallback(req, code, state, res) {
        return this.handleYouthacksCallback(req, code, state, res, 'link');
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
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "redirectToYouthacks", null);
__decorate([
    (0, common_1.Get)('youthacks-url'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "getYouthacksAuthorizationUrl", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Get)('youthacks-link-url'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "getYouthacksLinkAuthorizationUrl", null);
__decorate([
    (0, common_1.Get)('youthacks/exchange'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)('code')),
    __param(2, (0, common_1.Query)('state')),
    __param(3, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "exchangeYouthacksCode", null);
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
__decorate([
    (0, common_1.Get)('youthacks/integration/callback'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)('code')),
    __param(2, (0, common_1.Query)('state')),
    __param(3, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "youthacksIntegrationCallback", null);
exports.AuthController = AuthController = __decorate([
    (0, common_1.Controller)('auth'),
    __metadata("design:paramtypes", [auth_service_1.AuthService,
        jwt_1.JwtService])
], AuthController);
//# sourceMappingURL=auth.controller.js.map