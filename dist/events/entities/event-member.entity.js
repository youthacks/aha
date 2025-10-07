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
exports.EventMember = exports.EventRole = void 0;
const typeorm_1 = require("typeorm");
const event_entity_1 = require("./event.entity");
const user_entity_1 = require("../../users/entities/user.entity");
var EventRole;
(function (EventRole) {
    EventRole["MEMBER"] = "member";
    EventRole["MANAGER"] = "manager";
    EventRole["OWNER"] = "owner";
})(EventRole || (exports.EventRole = EventRole = {}));
let EventMember = class EventMember {
};
exports.EventMember = EventMember;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], EventMember.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => event_entity_1.Event, event => event.members),
    __metadata("design:type", event_entity_1.Event)
], EventMember.prototype, "event", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], EventMember.prototype, "eventId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User),
    __metadata("design:type", user_entity_1.User)
], EventMember.prototype, "user", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], EventMember.prototype, "userId", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 0 }),
    __metadata("design:type", Number)
], EventMember.prototype, "tokens", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: EventRole,
        default: EventRole.MEMBER,
    }),
    __metadata("design:type", String)
], EventMember.prototype, "role", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], EventMember.prototype, "joinedAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], EventMember.prototype, "updatedAt", void 0);
exports.EventMember = EventMember = __decorate([
    (0, typeorm_1.Entity)('event_members'),
    (0, typeorm_1.Unique)(['event', 'user'])
], EventMember);
//# sourceMappingURL=event-member.entity.js.map