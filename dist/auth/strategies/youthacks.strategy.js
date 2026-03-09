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
Object.defineProperty(exports, "__esModule", { value: true });
exports.YouthacksStrategy = void 0;
const passport_1 = require("@nestjs/passport");
const common_1 = require("@nestjs/common");
const passport_oauth2_1 = require("passport-oauth2");
const config_1 = require("@nestjs/config");
const auth_service_1 = require("../auth.service");
let YouthacksStrategy = class YouthacksStrategy extends (0, passport_1.PassportStrategy)(passport_oauth2_1.Strategy, 'youthacks') {
    constructor(configService, authService) {
        const base = configService.get('YOUTHACKS_BASE_URL') || 'https://auth.youthacks.org';
        const authorizationURL = `${base.replace(/\/$/, '')}/oauth/authorize`;
        const tokenURL = `${base.replace(/\/$/, '')}/oauth/token`;
        const userinfoURL = `${base.replace(/\/$/, '')}/oauth/userinfo`;
        super({
            authorizationURL,
            tokenURL,
            clientID: configService.get('YOUTHACKS_CLIENT_ID'),
            clientSecret: configService.get('YOUTHACKS_CLIENT_SECRET'),
            callbackURL: configService.get('YOUTHACKS_CALLBACK_URL') ||
                `${(configService.get('APP_URL') || 'http://localhost:3000').replace(/\/$/, '')}/auth/youthacks/callback`,
            scope: ['profile', 'email'],
        });
        this.configService = configService;
        this.authService = authService;
        this.userinfoURL = userinfoURL;
    }
    async validate(accessToken, refreshToken, profile, done) {
        try {
            const user = await this.authService.validateOAuthLogin('youthacks', accessToken, profile);
            done(null, user);
        }
        catch (err) {
            done(err, false);
        }
    }
};
exports.YouthacksStrategy = YouthacksStrategy;
exports.YouthacksStrategy = YouthacksStrategy = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService, auth_service_1.AuthService])
], YouthacksStrategy);
//# sourceMappingURL=youthacks.strategy.js.map