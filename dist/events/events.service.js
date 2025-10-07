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
exports.EventsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const event_entity_1 = require("./entities/event.entity");
const event_member_entity_1 = require("./entities/event-member.entity");
const shop_entity_1 = require("./entities/shop.entity");
const transaction_entity_1 = require("./entities/transaction.entity");
let EventsService = class EventsService {
    constructor(eventsRepository, membersRepository, shopRepository, transactionsRepository) {
        this.eventsRepository = eventsRepository;
        this.membersRepository = membersRepository;
        this.shopRepository = shopRepository;
        this.transactionsRepository = transactionsRepository;
    }
    generateSlug(name) {
        return name
            .toLowerCase()
            .trim()
            .replace(/[^\w\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-');
    }
    generateJoinCode() {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
        let code = '';
        for (let i = 0; i < 5; i++) {
            code += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return code;
    }
    generateReceiptCode() {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
        let code = '';
        for (let i = 0; i < 5; i++) {
            code += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return code;
    }
    async createEvent(userId, createEventDto) {
        const slug = this.generateSlug(createEventDto.name);
        const existingByName = await this.eventsRepository.findOne({
            where: { name: createEventDto.name }
        });
        if (existingByName) {
            throw new common_1.ConflictException('An event with this name already exists. Please choose a different name.');
        }
        const existingBySlug = await this.eventsRepository.findOne({
            where: { slug }
        });
        if (existingBySlug) {
            throw new common_1.ConflictException('An event with a similar name already exists. Please choose a different name.');
        }
        let joinCode = this.generateJoinCode();
        let existingByCode = await this.eventsRepository.findOne({
            where: { joinCode }
        });
        while (existingByCode) {
            joinCode = this.generateJoinCode();
            existingByCode = await this.eventsRepository.findOne({
                where: { joinCode }
            });
        }
        const event = this.eventsRepository.create({
            ...createEventDto,
            slug,
            joinCode,
            ownerId: userId,
        });
        const savedEvent = await this.eventsRepository.save(event);
        await this.membersRepository.save({
            eventId: savedEvent.id,
            userId,
            role: event_member_entity_1.EventRole.OWNER,
            tokens: 0,
        });
        return savedEvent;
    }
    async joinEvent(userId, joinEventDto) {
        const event = await this.eventsRepository.findOne({
            where: { joinCode: joinEventDto.slug.toUpperCase() }
        });
        if (!event) {
            throw new common_1.NotFoundException('Event not found with this code');
        }
        const existingMember = await this.membersRepository.findOne({
            where: { eventId: event.id, userId },
        });
        if (existingMember) {
            throw new common_1.BadRequestException('Already a member of this event');
        }
        const member = this.membersRepository.create({
            eventId: event.id,
            userId,
            role: event_member_entity_1.EventRole.MEMBER,
            tokens: 0,
        });
        return this.membersRepository.save(member);
    }
    async getMyEvents(userId) {
        const members = await this.membersRepository.find({
            where: { userId },
            relations: ['event'],
        });
        return members
            .filter(member => !member.event.isArchived)
            .map(member => ({
            ...member.event,
            myRole: member.role,
            myTokens: member.tokens,
            membershipId: member.id,
        }));
    }
    async getMyArchivedEvents(userId) {
        const members = await this.membersRepository.find({
            where: { userId },
            relations: ['event'],
        });
        return members
            .filter(member => member.event.isArchived)
            .map(member => ({
            ...member.event,
            myRole: member.role,
            myTokens: member.tokens,
            membershipId: member.id,
        }));
    }
    async getEventDetails(eventId, userId) {
        const event = await this.eventsRepository.findOne({
            where: { id: eventId },
            relations: ['owner'],
        });
        if (!event) {
            throw new common_1.NotFoundException('Event not found');
        }
        const membership = await this.membersRepository.findOne({
            where: { eventId, userId },
        });
        if (!membership) {
            throw new common_1.ForbiddenException('Not a member of this event');
        }
        const members = await this.membersRepository.find({
            where: { eventId },
            relations: ['user'],
            order: { tokens: 'DESC' },
        });
        const stations = await this.shopRepository.find({
            where: { eventId },
        });
        return {
            event,
            myRole: membership.role,
            myTokens: membership.tokens,
            members: members.map(m => ({
                id: m.id,
                userId: m.userId,
                name: `${m.user.firstName} ${m.user.lastName}`,
                email: m.user.email,
                tokens: m.tokens,
                role: m.role,
                joinedAt: m.joinedAt,
            })),
            stations,
        };
    }
    async updateTokens(eventId, adminId, updateDto) {
        const adminMember = await this.membersRepository.findOne({
            where: { eventId, userId: adminId },
            relations: ['user'],
        });
        if (!adminMember || (adminMember.role !== event_member_entity_1.EventRole.OWNER && adminMember.role !== event_member_entity_1.EventRole.MANAGER)) {
            throw new common_1.ForbiddenException('Only owners and managers can update tokens');
        }
        const targetMember = await this.membersRepository.findOne({
            where: { eventId, userId: updateDto.userId },
            relations: ['user'],
        });
        if (!targetMember) {
            throw new common_1.NotFoundException('Member not found in this event');
        }
        if (targetMember.role === event_member_entity_1.EventRole.OWNER || targetMember.role === event_member_entity_1.EventRole.MANAGER) {
            throw new common_1.BadRequestException('Cannot update tokens for owners or managers');
        }
        targetMember.tokens += updateDto.amount;
        if (targetMember.tokens < 0) {
            targetMember.tokens = 0;
        }
        const adminName = `${adminMember.user.firstName} ${adminMember.user.lastName}`;
        const targetName = `${targetMember.user.firstName} ${targetMember.user.lastName}`;
        await this.transactionsRepository.save({
            eventId,
            userId: updateDto.userId,
            amount: updateDto.amount,
            type: updateDto.amount > 0 ? 'credit' : 'debit',
            description: `${adminName} ${updateDto.amount > 0 ? 'gave' : 'removed'} ${Math.abs(updateDto.amount)} tokens ${updateDto.amount > 0 ? 'to' : 'from'} ${targetName}`,
        });
        return this.membersRepository.save(targetMember);
    }
    async promoteMember(eventId, adminId, promoteDto) {
        const adminMember = await this.membersRepository.findOne({
            where: { eventId, userId: adminId },
        });
        if (!adminMember || adminMember.role !== event_member_entity_1.EventRole.OWNER) {
            throw new common_1.ForbiddenException('Only owners can promote members');
        }
        const targetMember = await this.membersRepository.findOne({
            where: { eventId, userId: promoteDto.userId },
        });
        if (!targetMember) {
            throw new common_1.NotFoundException('Member not found in this event');
        }
        if (!Object.values(event_member_entity_1.EventRole).includes(promoteDto.role)) {
            throw new common_1.BadRequestException('Invalid role');
        }
        const oldRole = targetMember.role;
        const newRole = promoteDto.role;
        if (newRole === event_member_entity_1.EventRole.OWNER) {
            throw new common_1.ForbiddenException('Cannot promote anyone to Owner role');
        }
        if (newRole === event_member_entity_1.EventRole.MANAGER && oldRole !== event_member_entity_1.EventRole.MANAGER) {
            targetMember.tokens = 0;
        }
        targetMember.role = newRole;
        return this.membersRepository.save(targetMember);
    }
    async createStation(eventId, userId, createDto) {
        const member = await this.membersRepository.findOne({
            where: { eventId, userId },
        });
        if (!member || (member.role !== event_member_entity_1.EventRole.OWNER && member.role !== event_member_entity_1.EventRole.MANAGER)) {
            throw new common_1.ForbiddenException('Only owners and managers can create stations');
        }
        const station = this.shopRepository.create({
            ...createDto,
            eventId,
            stock: createDto.stock || 0,
        });
        return this.shopRepository.save(station);
    }
    async updateStation(eventId, stationId, userId, updateDto) {
        const member = await this.membersRepository.findOne({
            where: { eventId, userId },
        });
        if (!member || (member.role !== event_member_entity_1.EventRole.OWNER && member.role !== event_member_entity_1.EventRole.MANAGER)) {
            throw new common_1.ForbiddenException('Only owners and managers can update stations');
        }
        const station = await this.shopRepository.findOne({
            where: { id: stationId, eventId },
        });
        if (!station) {
            throw new common_1.NotFoundException('Station not found');
        }
        Object.assign(station, updateDto);
        return this.shopRepository.save(station);
    }
    async deleteStation(eventId, stationId, userId) {
        const member = await this.membersRepository.findOne({
            where: { eventId, userId },
        });
        if (!member || (member.role !== event_member_entity_1.EventRole.OWNER && member.role !== event_member_entity_1.EventRole.MANAGER)) {
            throw new common_1.ForbiddenException('Only owners and managers can delete stations');
        }
        const station = await this.shopRepository.findOne({
            where: { id: stationId, eventId },
        });
        if (!station) {
            throw new common_1.NotFoundException('Station not found');
        }
        await this.transactionsRepository.update({ stationId }, { stationId: null, station: null });
        await this.shopRepository.delete({ id: stationId });
    }
    async purchase(eventId, userId, purchaseDto) {
        const member = await this.membersRepository.findOne({
            where: { eventId, userId },
        });
        if (!member) {
            throw new common_1.ForbiddenException('Not a member of this event');
        }
        if (member.role === event_member_entity_1.EventRole.OWNER || member.role === event_member_entity_1.EventRole.MANAGER) {
            throw new common_1.BadRequestException('Owners and managers cannot make purchases');
        }
        const station = await this.shopRepository.findOne({
            where: { id: purchaseDto.stationId, eventId },
        });
        if (!station) {
            throw new common_1.NotFoundException('Station not found');
        }
        if (!station.isAvailable) {
            throw new common_1.BadRequestException('Station is not available');
        }
        if (station.stock <= 0) {
            throw new common_1.BadRequestException('Out of stock');
        }
        if (station.purchaseLimit && station.purchaseLimit > 0) {
            const userPurchaseCount = await this.transactionsRepository.count({
                where: {
                    eventId,
                    userId,
                    stationId: station.id,
                    type: 'purchase',
                },
            });
            if (userPurchaseCount >= station.purchaseLimit) {
                throw new common_1.BadRequestException(`You have reached the purchase limit for this item (${station.purchaseLimit} per person)`);
            }
        }
        if (member.tokens < station.price) {
            throw new common_1.BadRequestException('Insufficient tokens');
        }
        member.tokens -= station.price;
        await this.membersRepository.save(member);
        station.stock -= 1;
        await this.shopRepository.save(station);
        const receiptCode = this.generateReceiptCode();
        const transaction = this.transactionsRepository.create({
            eventId,
            userId,
            amount: -station.price,
            type: 'purchase',
            description: `Purchased: ${station.name}`,
            stationId: station.id,
            receiptCode,
            isRedeemed: false,
        });
        return this.transactionsRepository.save(transaction);
    }
    async redeemReceipt(eventId, receiptCode, redeemerUserId) {
        const redeemer = await this.membersRepository.findOne({
            where: { eventId, userId: redeemerUserId },
        });
        if (!redeemer || (redeemer.role !== event_member_entity_1.EventRole.OWNER && redeemer.role !== event_member_entity_1.EventRole.MANAGER)) {
            throw new common_1.ForbiddenException('Only owners and managers can redeem receipts');
        }
        const normalizedReceiptCode = receiptCode.toUpperCase().trim();
        const transaction = await this.transactionsRepository.findOne({
            where: { eventId, receiptCode: normalizedReceiptCode, type: 'purchase' },
            relations: ['user', 'station'],
        });
        if (!transaction) {
            throw new common_1.NotFoundException('Receipt not found');
        }
        if (transaction.isRedeemed) {
            throw new common_1.BadRequestException(`This receipt was already redeemed on ${new Date(transaction.redeemedAt).toLocaleString()}`);
        }
        transaction.isRedeemed = true;
        transaction.redeemedAt = new Date();
        transaction.redeemedBy = redeemerUserId;
        await this.transactionsRepository.save(transaction);
        return {
            success: true,
            transaction: {
                id: transaction.id,
                itemName: transaction.station?.name || 'Unknown Item',
                buyerName: `${transaction.user.firstName} ${transaction.user.lastName}`,
                amount: transaction.amount,
                purchasedAt: transaction.createdAt,
                redeemedAt: transaction.redeemedAt,
            },
        };
    }
    async redeemReceiptBySlug(eventSlug, receiptCode, redeemerUserId) {
        const event = await this.eventsRepository.findOne({
            where: { slug: eventSlug.toLowerCase() },
        });
        if (!event) {
            throw new common_1.NotFoundException('Event not found');
        }
        return this.redeemReceipt(event.id, receiptCode, redeemerUserId);
    }
    async getTransactions(eventId, userId) {
        const member = await this.membersRepository.findOne({
            where: { eventId, userId },
        });
        if (!member) {
            throw new common_1.ForbiddenException('Not a member of this event');
        }
        return this.transactionsRepository.find({
            where: { eventId, userId },
            relations: ['station'],
            order: { createdAt: 'DESC' },
            take: 50,
        });
    }
    async getAllTransactions(eventId, userId) {
        const member = await this.membersRepository.findOne({
            where: { eventId, userId },
        });
        if (!member) {
            throw new common_1.ForbiddenException('Not a member of this event');
        }
        if (member.role !== event_member_entity_1.EventRole.OWNER && member.role !== event_member_entity_1.EventRole.MANAGER) {
            throw new common_1.ForbiddenException('Only owners and managers can view global transaction history');
        }
        const transactions = await this.transactionsRepository.find({
            where: { eventId },
            relations: ['user', 'station'],
            order: { createdAt: 'DESC' },
            take: 100,
        });
        return transactions.map(txn => ({
            id: txn.id,
            userId: txn.userId,
            userName: `${txn.user.firstName} ${txn.user.lastName}`,
            amount: txn.amount,
            type: txn.type,
            description: txn.description,
            stationName: txn.station?.name || null,
            createdAt: txn.createdAt,
        }));
    }
    async getEventDetailsBySlug(eventSlug, userId) {
        const event = await this.eventsRepository.findOne({
            where: { slug: eventSlug.toLowerCase() },
            relations: ['owner'],
        });
        if (!event) {
            throw new common_1.NotFoundException('Event not found');
        }
        return this.getEventDetails(event.id, userId);
    }
    async updateTokensBySlug(eventSlug, adminId, updateDto) {
        const event = await this.eventsRepository.findOne({
            where: { slug: eventSlug.toLowerCase() },
        });
        if (!event) {
            throw new common_1.NotFoundException('Event not found');
        }
        return this.updateTokens(event.id, adminId, updateDto);
    }
    async promoteMemberBySlug(eventSlug, adminId, promoteDto) {
        const event = await this.eventsRepository.findOne({
            where: { slug: eventSlug.toLowerCase() },
        });
        if (!event) {
            throw new common_1.NotFoundException('Event not found');
        }
        return this.promoteMember(event.id, adminId, promoteDto);
    }
    async createStationBySlug(eventSlug, userId, createDto) {
        const event = await this.eventsRepository.findOne({
            where: { slug: eventSlug.toLowerCase() },
        });
        if (!event) {
            throw new common_1.NotFoundException('Event not found');
        }
        return this.createStation(event.id, userId, createDto);
    }
    async updateStationBySlug(eventSlug, stationId, userId, updateDto) {
        const event = await this.eventsRepository.findOne({
            where: { slug: eventSlug.toLowerCase() },
        });
        if (!event) {
            throw new common_1.NotFoundException('Event not found');
        }
        return this.updateStation(event.id, stationId, userId, updateDto);
    }
    async deleteStationBySlug(eventSlug, stationId, userId) {
        const event = await this.eventsRepository.findOne({
            where: { slug: eventSlug.toLowerCase() },
        });
        if (!event) {
            throw new common_1.NotFoundException('Event not found');
        }
        return this.deleteStation(event.id, stationId, userId);
    }
    async purchaseBySlug(eventSlug, userId, purchaseDto) {
        const event = await this.eventsRepository.findOne({
            where: { slug: eventSlug.toLowerCase() },
        });
        if (!event) {
            throw new common_1.NotFoundException('Event not found');
        }
        return this.purchase(event.id, userId, purchaseDto);
    }
    async getTransactionsBySlug(eventSlug, userId) {
        const event = await this.eventsRepository.findOne({
            where: { slug: eventSlug.toLowerCase() },
        });
        if (!event) {
            throw new common_1.NotFoundException('Event not found');
        }
        return this.getTransactions(event.id, userId);
    }
    async getAllTransactionsBySlug(eventSlug, userId) {
        const event = await this.eventsRepository.findOne({
            where: { slug: eventSlug.toLowerCase() },
        });
        if (!event) {
            throw new common_1.NotFoundException('Event not found');
        }
        return this.getAllTransactions(event.id, userId);
    }
    async archiveEvent(eventId, userId) {
        const event = await this.eventsRepository.findOne({
            where: { id: eventId },
        });
        if (!event) {
            throw new common_1.NotFoundException('Event not found');
        }
        const membership = await this.membersRepository.findOne({
            where: { eventId, userId },
        });
        if (!membership || membership.role !== event_member_entity_1.EventRole.OWNER) {
            throw new common_1.ForbiddenException('Only the event owner can archive this event');
        }
        event.isArchived = true;
        return this.eventsRepository.save(event);
    }
    async unarchiveEvent(eventId, userId) {
        const event = await this.eventsRepository.findOne({
            where: { id: eventId },
        });
        if (!event) {
            throw new common_1.NotFoundException('Event not found');
        }
        const membership = await this.membersRepository.findOne({
            where: { eventId, userId },
        });
        if (!membership || membership.role !== event_member_entity_1.EventRole.OWNER) {
            throw new common_1.ForbiddenException('Only the event owner can unarchive this event');
        }
        event.isArchived = false;
        return this.eventsRepository.save(event);
    }
    async archiveEventBySlug(eventSlug, userId) {
        const event = await this.eventsRepository.findOne({
            where: { slug: eventSlug.toLowerCase() },
        });
        if (!event) {
            throw new common_1.NotFoundException('Event not found');
        }
        return this.archiveEvent(event.id, userId);
    }
    async unarchiveEventBySlug(eventSlug, userId) {
        const event = await this.eventsRepository.findOne({
            where: { slug: eventSlug.toLowerCase() },
        });
        if (!event) {
            throw new common_1.NotFoundException('Event not found');
        }
        return this.unarchiveEvent(event.id, userId);
    }
    async deleteEventBySlug(eventSlug, userId) {
        const event = await this.eventsRepository.findOne({
            where: { slug: eventSlug.toLowerCase() },
        });
        if (!event) {
            throw new common_1.NotFoundException('Event not found');
        }
        return this.deleteEvent(event.id, userId);
    }
    async deleteAll() {
        await this.transactionsRepository.clear();
        await this.shopRepository.clear();
        await this.membersRepository.clear();
        await this.eventsRepository.clear();
    }
    async deleteEvent(eventId, userId) {
        const event = await this.eventsRepository.findOne({
            where: { id: eventId },
        });
        if (!event) {
            throw new common_1.NotFoundException('Event not found');
        }
        const membership = await this.membersRepository.findOne({
            where: { eventId, userId },
        });
        if (!membership || membership.role !== event_member_entity_1.EventRole.OWNER) {
            throw new common_1.ForbiddenException('Only the event owner can delete this event');
        }
        await this.transactionsRepository.delete({ eventId });
        await this.shopRepository.delete({ eventId });
        await this.membersRepository.delete({ eventId });
        await this.eventsRepository.delete({ id: eventId });
    }
    async updateEventSettings(eventId, userId, updateDto) {
        const event = await this.eventsRepository.findOne({
            where: { id: eventId },
        });
        if (!event) {
            throw new common_1.NotFoundException('Event not found');
        }
        const membership = await this.membersRepository.findOne({
            where: { eventId, userId },
        });
        if (!membership || membership.role !== event_member_entity_1.EventRole.OWNER) {
            throw new common_1.ForbiddenException('Only the event owner can update event settings');
        }
        if (updateDto.name && updateDto.name !== event.name) {
            const existingByName = await this.eventsRepository.findOne({
                where: { name: updateDto.name },
            });
            if (existingByName && existingByName.id !== eventId) {
                throw new common_1.ConflictException('An event with this name already exists');
            }
            const newSlug = this.generateSlug(updateDto.name);
            const existingBySlug = await this.eventsRepository.findOne({
                where: { slug: newSlug },
            });
            if (existingBySlug && existingBySlug.id !== eventId) {
                throw new common_1.ConflictException('An event with a similar name already exists');
            }
            event.name = updateDto.name;
            event.slug = newSlug;
        }
        if (updateDto.joinCode && updateDto.joinCode !== event.joinCode) {
            const normalizedCode = updateDto.joinCode.toUpperCase();
            const existingByCode = await this.eventsRepository.findOne({
                where: { joinCode: normalizedCode },
            });
            if (existingByCode && existingByCode.id !== eventId) {
                throw new common_1.ConflictException('This join code is already in use by another event');
            }
            event.joinCode = normalizedCode;
        }
        if (updateDto.description !== undefined) {
            event.description = updateDto.description;
        }
        return this.eventsRepository.save(event);
    }
    async updateEventSettingsBySlug(eventSlug, userId, updateDto) {
        const event = await this.eventsRepository.findOne({
            where: { slug: eventSlug.toLowerCase() },
        });
        if (!event) {
            throw new common_1.NotFoundException('Event not found');
        }
        return this.updateEventSettings(event.id, userId, updateDto);
    }
};
exports.EventsService = EventsService;
exports.EventsService = EventsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(event_entity_1.Event)),
    __param(1, (0, typeorm_1.InjectRepository)(event_member_entity_1.EventMember)),
    __param(2, (0, typeorm_1.InjectRepository)(shop_entity_1.Shop)),
    __param(3, (0, typeorm_1.InjectRepository)(transaction_entity_1.Transaction)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], EventsService);
//# sourceMappingURL=events.service.js.map