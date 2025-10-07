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
exports.EventsController = void 0;
const common_1 = require("@nestjs/common");
const events_service_1 = require("./events.service");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const event_dto_1 = require("./dto/event.dto");
const station_dto_1 = require("./dto/station.dto");
const update_event_settings_dto_1 = require("./dto/update-event-settings.dto");
let EventsController = class EventsController {
    constructor(eventsService) {
        this.eventsService = eventsService;
    }
    async createEvent(req, createEventDto) {
        return this.eventsService.createEvent(req.user.id, createEventDto);
    }
    async joinEvent(req, joinEventDto) {
        return this.eventsService.joinEvent(req.user.id, joinEventDto);
    }
    async getMyEvents(req) {
        return this.eventsService.getMyEvents(req.user.id);
    }
    async getMyArchivedEvents(req) {
        return this.eventsService.getMyArchivedEvents(req.user.id);
    }
    async getEventDetails(eventSlug, req) {
        return this.eventsService.getEventDetailsBySlug(eventSlug, req.user.id);
    }
    async updateTokens(eventSlug, req, updateDto) {
        return this.eventsService.updateTokensBySlug(eventSlug, req.user.id, updateDto);
    }
    async promoteMember(eventSlug, req, promoteDto) {
        return this.eventsService.promoteMemberBySlug(eventSlug, req.user.id, promoteDto);
    }
    async createStation(eventSlug, req, createDto) {
        return this.eventsService.createStationBySlug(eventSlug, req.user.id, createDto);
    }
    async updateStation(eventSlug, stationId, req, updateDto) {
        return this.eventsService.updateStationBySlug(eventSlug, stationId, req.user.id, updateDto);
    }
    async deleteStation(eventSlug, stationId, req) {
        await this.eventsService.deleteStationBySlug(eventSlug, stationId, req.user.id);
        return { message: 'Station deleted successfully' };
    }
    async purchase(eventSlug, req, purchaseDto) {
        return this.eventsService.purchaseBySlug(eventSlug, req.user.id, purchaseDto);
    }
    async getTransactions(eventSlug, req) {
        return this.eventsService.getTransactionsBySlug(eventSlug, req.user.id);
    }
    async getAllTransactions(eventSlug, req) {
        return this.eventsService.getAllTransactionsBySlug(eventSlug, req.user.id);
    }
    async updateEventSettings(eventSlug, req, updateDto) {
        return this.eventsService.updateEventSettingsBySlug(eventSlug, req.user.id, updateDto);
    }
    async redeemReceipt(eventSlug, req, body) {
        return this.eventsService.redeemReceiptBySlug(eventSlug, body.receiptCode, req.user.id);
    }
    async archiveEvent(eventSlug, req) {
        await this.eventsService.archiveEventBySlug(eventSlug, req.user.id);
        return { message: 'Event archived successfully' };
    }
    async unarchiveEvent(eventSlug, req) {
        await this.eventsService.unarchiveEventBySlug(eventSlug, req.user.id);
        return { message: 'Event unarchived successfully' };
    }
    async deleteEvent(eventSlug, req) {
        await this.eventsService.deleteEventBySlug(eventSlug, req.user.id);
        return { message: 'Event deleted successfully' };
    }
};
exports.EventsController = EventsController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, event_dto_1.CreateEventDto]),
    __metadata("design:returntype", Promise)
], EventsController.prototype, "createEvent", null);
__decorate([
    (0, common_1.Post)('join'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, event_dto_1.JoinEventDto]),
    __metadata("design:returntype", Promise)
], EventsController.prototype, "joinEvent", null);
__decorate([
    (0, common_1.Get)('my-events'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], EventsController.prototype, "getMyEvents", null);
__decorate([
    (0, common_1.Get)('my-events/archived'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], EventsController.prototype, "getMyArchivedEvents", null);
__decorate([
    (0, common_1.Get)(':eventSlug'),
    __param(0, (0, common_1.Param)('eventSlug')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], EventsController.prototype, "getEventDetails", null);
__decorate([
    (0, common_1.Put)(':eventSlug/tokens'),
    __param(0, (0, common_1.Param)('eventSlug')),
    __param(1, (0, common_1.Request)()),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, event_dto_1.UpdateTokensDto]),
    __metadata("design:returntype", Promise)
], EventsController.prototype, "updateTokens", null);
__decorate([
    (0, common_1.Put)(':eventSlug/promote'),
    __param(0, (0, common_1.Param)('eventSlug')),
    __param(1, (0, common_1.Request)()),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, event_dto_1.PromoteMemberDto]),
    __metadata("design:returntype", Promise)
], EventsController.prototype, "promoteMember", null);
__decorate([
    (0, common_1.Post)(':eventSlug/stations'),
    __param(0, (0, common_1.Param)('eventSlug')),
    __param(1, (0, common_1.Request)()),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, station_dto_1.CreateStationDto]),
    __metadata("design:returntype", Promise)
], EventsController.prototype, "createStation", null);
__decorate([
    (0, common_1.Put)(':eventSlug/stations/:stationId'),
    __param(0, (0, common_1.Param)('eventSlug')),
    __param(1, (0, common_1.Param)('stationId')),
    __param(2, (0, common_1.Request)()),
    __param(3, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object, station_dto_1.UpdateStationDto]),
    __metadata("design:returntype", Promise)
], EventsController.prototype, "updateStation", null);
__decorate([
    (0, common_1.Delete)(':eventSlug/stations/:stationId'),
    __param(0, (0, common_1.Param)('eventSlug')),
    __param(1, (0, common_1.Param)('stationId')),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], EventsController.prototype, "deleteStation", null);
__decorate([
    (0, common_1.Post)(':eventSlug/purchase'),
    __param(0, (0, common_1.Param)('eventSlug')),
    __param(1, (0, common_1.Request)()),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, station_dto_1.PurchaseDto]),
    __metadata("design:returntype", Promise)
], EventsController.prototype, "purchase", null);
__decorate([
    (0, common_1.Get)(':eventSlug/transactions'),
    __param(0, (0, common_1.Param)('eventSlug')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], EventsController.prototype, "getTransactions", null);
__decorate([
    (0, common_1.Get)(':eventSlug/transactions/all'),
    __param(0, (0, common_1.Param)('eventSlug')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], EventsController.prototype, "getAllTransactions", null);
__decorate([
    (0, common_1.Patch)(':eventSlug/settings'),
    __param(0, (0, common_1.Param)('eventSlug')),
    __param(1, (0, common_1.Request)()),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, update_event_settings_dto_1.UpdateEventSettingsDto]),
    __metadata("design:returntype", Promise)
], EventsController.prototype, "updateEventSettings", null);
__decorate([
    (0, common_1.Post)(':eventSlug/redeem'),
    __param(0, (0, common_1.Param)('eventSlug')),
    __param(1, (0, common_1.Request)()),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], EventsController.prototype, "redeemReceipt", null);
__decorate([
    (0, common_1.Put)(':eventSlug/archive'),
    __param(0, (0, common_1.Param)('eventSlug')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], EventsController.prototype, "archiveEvent", null);
__decorate([
    (0, common_1.Put)(':eventSlug/unarchive'),
    __param(0, (0, common_1.Param)('eventSlug')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], EventsController.prototype, "unarchiveEvent", null);
__decorate([
    (0, common_1.Delete)(':eventSlug'),
    __param(0, (0, common_1.Param)('eventSlug')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], EventsController.prototype, "deleteEvent", null);
exports.EventsController = EventsController = __decorate([
    (0, common_1.Controller)('events'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [events_service_1.EventsService])
], EventsController);
//# sourceMappingURL=events.controller.js.map