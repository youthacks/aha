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
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsersController = void 0;
const common_1 = require("@nestjs/common");
const users_service_1 = require("./users.service");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const email_service_1 = require("../email/email.service");
const change_email_dto_1 = require("./dto/change-email.dto");
const change_password_dto_1 = require("./dto/change-password.dto");
let UsersController = class UsersController {
    constructor(usersService, emailService) {
        this.usersService = usersService;
        this.emailService = emailService;
    }
    async debug(email) {
        const user = await this.usersService.findByEmail(email);
        if (!user) {
            return { error: 'User not found' };
        }
        return {
            email: user.email,
            isEmailVerified: user.isEmailVerified,
            verificationToken: user.verificationToken,
            verificationTokenExpiry: user.verificationTokenExpiry,
            hasToken: !!user.verificationToken,
            tokenExpired: user.verificationTokenExpiry ? new Date() > user.verificationTokenExpiry : null,
        };
    }
    async listAll() {
        const users = await this.usersService.findAll();
        const count = await this.usersService.count();
        return {
            count,
            users: users.map(user => ({
                id: user.id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                isEmailVerified: user.isEmailVerified,
                createdAt: user.createdAt,
            })),
        };
    }
    async clearAll() {
        if (process.env.NODE_ENV !== 'development') {
            return { error: 'This endpoint is only available in development mode' };
        }
        const count = await this.usersService.count();
        await this.usersService.deleteAll();
        return {
            message: `Successfully deleted ${count} user(s)`,
            success: true,
        };
    }
    async requestEmailChange(req, changeEmailDto) {
        const token = this.emailService.generateVerificationToken();
        const user = await this.usersService.requestEmailChange(req.user.userId, changeEmailDto.newEmail, token);
        await this.emailService.sendEmailChangeVerification(changeEmailDto.newEmail, token, user.firstName);
        return {
            message: 'Verification email sent to your new email address. Please check your inbox.',
        };
    }
    async verifyEmailChange(req, verifyDto) {
        const user = await this.usersService.verifyEmailChange(req.user.userId, verifyDto.token);
        return {
            message: 'Email address changed successfully',
            user: {
                id: user.id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
            },
        };
    }
    async requestPasswordChange(req, requestDto) {
        const token = this.emailService.generateVerificationToken();
        const user = await this.usersService.requestPasswordChange(req.user.userId, requestDto.currentPassword, token);
        await this.emailService.sendPasswordChangeConfirmation(user.email, token, user.firstName);
        return {
            message: 'Confirmation email sent. Please check your inbox to complete the password change.',
        };
    }
    async verifyPasswordChange(req, changeDto) {
        await this.usersService.verifyPasswordChange(req.user.userId, changeDto.token, changeDto.newPassword);
        return {
            message: 'Password changed successfully',
        };
    }
};
exports.UsersController = UsersController;
__decorate([
    (0, common_1.Get)('debug'),
    __param(0, (0, common_1.Query)('email')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "debug", null);
__decorate([
    (0, common_1.Get)('list'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "listAll", null);
__decorate([
    (0, common_1.Delete)('clear-all'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "clearAll", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Post)('request-email-change'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, change_email_dto_1.ChangeEmailDto]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "requestEmailChange", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Post)('verify-email-change'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, change_email_dto_1.VerifyEmailChangeDto]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "verifyEmailChange", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Post)('request-password-change'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, change_password_dto_1.RequestPasswordChangeDto]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "requestPasswordChange", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Post)('verify-password-change'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, change_password_dto_1.ChangePasswordDto]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "verifyPasswordChange", null);
exports.UsersController = UsersController = __decorate([
    (0, common_1.Controller)('users'),
    __metadata("design:paramtypes", [users_service_1.UsersService,
        email_service_1.EmailService])
], UsersController);
//# sourceMappingURL=users.controller.js.map