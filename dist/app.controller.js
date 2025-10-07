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
exports.AppController = void 0;
const common_1 = require("@nestjs/common");
const users_service_1 = require("./users/users.service");
const events_service_1 = require("./events/events.service");
let AppController = class AppController {
    constructor(usersService, eventsService) {
        this.usersService = usersService;
        this.eventsService = eventsService;
    }
    getHello() {
        return {
            message: 'AHA - Token System API is running',
            version: '1.0.0',
            endpoints: {
                auth: {
                    register: 'POST /auth/register',
                    login: 'POST /auth/login',
                    verifyEmail: 'GET /auth/verify-email?email=xxx&token=xxx',
                    resendVerification: 'POST /auth/resend-verification',
                    forgotPassword: 'POST /auth/forgot-password',
                    resetPassword: 'POST /auth/reset-password',
                    profile: 'GET /auth/profile (requires JWT token)',
                },
                admin: {
                    resetDatabase: 'POST /reset-database',
                },
            },
        };
    }
    health() {
        return {
            status: 'ok',
            timestamp: new Date().toISOString(),
        };
    }
    async resetDatabase() {
        await this.eventsService.deleteAll();
        await this.usersService.deleteAll();
        return {
            message: 'Database reset successfully',
            details: {
                users: 'deleted',
                events: 'deleted',
                eventMembers: 'deleted',
                buyingStations: 'deleted',
                transactions: 'deleted',
            },
            timestamp: new Date().toISOString(),
        };
    }
};
exports.AppController = AppController;
__decorate([
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], AppController.prototype, "getHello", null);
__decorate([
    (0, common_1.Get)('health'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], AppController.prototype, "health", null);
__decorate([
    (0, common_1.Post)('reset-database'),
    (0, common_1.HttpCode)(200),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AppController.prototype, "resetDatabase", null);
exports.AppController = AppController = __decorate([
    (0, common_1.Controller)(),
    __metadata("design:paramtypes", [users_service_1.UsersService,
        events_service_1.EventsService])
], AppController);
//# sourceMappingURL=app.controller.js.map