import { Injectable, BadRequestException, NotFoundException, ForbiddenException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Event } from './entities/event.entity';
import { EventMember, EventRole } from './entities/event-member.entity';
import { Shop } from './entities/shop.entity';
import { Transaction } from './entities/transaction.entity';
import { CreateEventDto, JoinEventDto, UpdateTokensDto, PromoteMemberDto } from './dto/event.dto';
import { CreateStationDto, PurchaseDto, UpdateStationDto } from './dto/station.dto';

@Injectable()
export class EventsService {
  constructor(
    @InjectRepository(Event)
    private eventsRepository: Repository<Event>,
    @InjectRepository(EventMember)
    private membersRepository: Repository<EventMember>,
    @InjectRepository(Shop)
    private shopRepository: Repository<Shop>,
    @InjectRepository(Transaction)
    private transactionsRepository: Repository<Transaction>,
  ) {}

  generateSlug(name: string): string {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
  }

  generateJoinCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Removed confusing chars like 0, O, 1, I
    let code = '';
    for (let i = 0; i < 5; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  generateReceiptCode(): string {
    // Generate a simple 5-character alphanumeric code
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Removed confusing chars like 0, O, 1, I
    let code = '';
    for (let i = 0; i < 5; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  async createEvent(userId: string, createEventDto: CreateEventDto): Promise<Event> {
    const slug = this.generateSlug(createEventDto.name);

    // Check if an event with this name already exists
    const existingByName = await this.eventsRepository.findOne({
      where: { name: createEventDto.name }
    });

    if (existingByName) {
      throw new ConflictException('An event with this name already exists. Please choose a different name.');
    }

    // Check if an event with this slug already exists
    const existingBySlug = await this.eventsRepository.findOne({
      where: { slug }
    });

    if (existingBySlug) {
      throw new ConflictException('An event with a similar name already exists. Please choose a different name.');
    }

    // Generate unique join code
    let joinCode = this.generateJoinCode();
    let existingByCode = await this.eventsRepository.findOne({
      where: { joinCode }
    });

    // Regenerate if code already exists (very rare)
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
      role: EventRole.ADMIN,
      tokens: 0,
    });

    return savedEvent;
  }

  async joinEvent(userId: string, joinEventDto: JoinEventDto): Promise<EventMember> {
    const event = await this.eventsRepository.findOne({
      where: { joinCode: joinEventDto.slug.toUpperCase() }
    });

    if (!event) {
      throw new NotFoundException('Event not found with this code');
    }

    const existingMember = await this.membersRepository.findOne({
      where: { eventId: event.id, userId },
    });

    if (existingMember) {
      throw new BadRequestException('Already a member of this event');
    }

    const member = this.membersRepository.create({
      eventId: event.id,
      userId,
      role: EventRole.MEMBER,
      tokens: 0,
    });

    return this.membersRepository.save(member);
  }

  async getMyEvents(userId: string): Promise<any[]> {
    const members = await this.membersRepository.find({
      where: { userId },
      relations: ['event'],
    });

    return members
      .filter(member => !member.event.isArchived) // Filter out archived events
      .map(member => ({
        ...member.event,
        myRole: member.role,
        myTokens: member.tokens,
        membershipId: member.id,
      }));
  }

  async getMyArchivedEvents(userId: string): Promise<any[]> {
    const members = await this.membersRepository.find({
      where: { userId },
      relations: ['event'],
    });

    return members
      .filter(member => member.event.isArchived) // Only archived events
      .map(member => ({
        ...member.event,
        myRole: member.role,
        myTokens: member.tokens,
        membershipId: member.id,
      }));
  }

  async getEventDetails(eventId: string, userId: string): Promise<any> {
    const event = await this.eventsRepository.findOne({
      where: { id: eventId },
      relations: ['owner'],
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    const membership = await this.membersRepository.findOne({
      where: { eventId, userId },
    });

    if (!membership) {
      throw new ForbiddenException('Not a member of this event');
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

  async updateTokens(eventId: string, adminId: string, updateDto: UpdateTokensDto): Promise<EventMember> {
    const adminMember = await this.membersRepository.findOne({
      where: { eventId, userId: adminId },
      relations: ['user'],
    });

    if (!adminMember || (adminMember.role !== EventRole.ADMIN && adminMember.role !== EventRole.MANAGER)) {
      throw new ForbiddenException('Only admins and managers can update tokens');
    }

    const targetMember = await this.membersRepository.findOne({
      where: { eventId, userId: updateDto.userId },
      relations: ['user'],
    });

    if (!targetMember) {
      throw new NotFoundException('Member not found in this event');
    }

    // Prevent giving tokens to admins and managers
    if (targetMember.role === EventRole.ADMIN || targetMember.role === EventRole.MANAGER) {
      throw new BadRequestException('Cannot update tokens for admins or managers');
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

  async promoteMember(eventId: string, adminId: string, promoteDto: PromoteMemberDto): Promise<EventMember> {
    const adminMember = await this.membersRepository.findOne({
      where: { eventId, userId: adminId },
    });

    if (!adminMember || adminMember.role !== EventRole.ADMIN) {
      throw new ForbiddenException('Only admins can promote members');
    }

    const targetMember = await this.membersRepository.findOne({
      where: { eventId, userId: promoteDto.userId },
    });

    if (!targetMember) {
      throw new NotFoundException('Member not found in this event');
    }

    if (!Object.values(EventRole).includes(promoteDto.role as EventRole)) {
      throw new BadRequestException('Invalid role');
    }

    const oldRole = targetMember.role;
    const newRole = promoteDto.role as EventRole;

    // If promoting to admin or manager, reset tokens to 0
    if ((newRole === EventRole.ADMIN || newRole === EventRole.MANAGER) &&
        (oldRole !== EventRole.ADMIN && oldRole !== EventRole.MANAGER)) {
      targetMember.tokens = 0;
    }

    targetMember.role = newRole;
    return this.membersRepository.save(targetMember);
  }

  async createStation(eventId: string, userId: string, createDto: CreateStationDto): Promise<Shop> {
    const member = await this.membersRepository.findOne({
      where: { eventId, userId },
    });

    if (!member || (member.role !== EventRole.ADMIN && member.role !== EventRole.MANAGER)) {
      throw new ForbiddenException('Only admins and managers can create stations');
    }

    const station = this.shopRepository.create({
      ...createDto,
      eventId,
      stock: createDto.stock || 0,
    });

    return this.shopRepository.save(station);
  }

  async updateStation(eventId: string, stationId: string, userId: string, updateDto: UpdateStationDto): Promise<Shop> {
    const member = await this.membersRepository.findOne({
      where: { eventId, userId },
    });

    if (!member || (member.role !== EventRole.ADMIN && member.role !== EventRole.MANAGER)) {
      throw new ForbiddenException('Only admins and managers can update stations');
    }

    const station = await this.shopRepository.findOne({
      where: { id: stationId, eventId },
    });

    if (!station) {
      throw new NotFoundException('Station not found');
    }

    Object.assign(station, updateDto);
    return this.shopRepository.save(station);
  }

  async deleteStation(eventId: string, stationId: string, userId: string): Promise<void> {
    const member = await this.membersRepository.findOne({
      where: { eventId, userId },
    });

    if (!member || (member.role !== EventRole.ADMIN && member.role !== EventRole.MANAGER)) {
      throw new ForbiddenException('Only admins and managers can delete stations');
    }

    const station = await this.shopRepository.findOne({
      where: { id: stationId, eventId },
    });

    if (!station) {
      throw new NotFoundException('Station not found');
    }

    // Set stationId to null for all transactions that reference this station
    await this.transactionsRepository.update(
      { stationId },
      { stationId: null, station: null }
    );

    // Now delete the station
    await this.shopRepository.delete({ id: stationId });
  }

  async purchase(eventId: string, userId: string, purchaseDto: PurchaseDto): Promise<Transaction> {
    const member = await this.membersRepository.findOne({
      where: { eventId, userId },
    });

    if (!member) {
      throw new ForbiddenException('Not a member of this event');
    }

    // Prevent admins and managers from purchasing
    if (member.role === EventRole.ADMIN || member.role === EventRole.MANAGER) {
      throw new BadRequestException('Admins and managers cannot make purchases');
    }

    const station = await this.shopRepository.findOne({
      where: { id: purchaseDto.stationId, eventId },
    });

    if (!station) {
      throw new NotFoundException('Station not found');
    }

    if (!station.isAvailable) {
      throw new BadRequestException('Station is not available');
    }

    if (station.stock <= 0) {
      throw new BadRequestException('Out of stock');
    }

    // Check purchase limit if set
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
        throw new BadRequestException(`You have reached the purchase limit for this item (${station.purchaseLimit} per person)`);
      }
    }

    if (member.tokens < station.price) {
      throw new BadRequestException('Insufficient tokens');
    }

    member.tokens -= station.price;
    await this.membersRepository.save(member);

    // Decrease stock
    station.stock -= 1;
    await this.shopRepository.save(station);

    // Generate unique receipt code for QR code
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

  async redeemReceipt(eventId: string, receiptCode: string, redeemerUserId: string): Promise<any> {
    // Verify redeemer is admin or manager
    const redeemer = await this.membersRepository.findOne({
      where: { eventId, userId: redeemerUserId },
    });

    if (!redeemer || (redeemer.role !== EventRole.ADMIN && redeemer.role !== EventRole.MANAGER)) {
      throw new ForbiddenException('Only admins and managers can redeem receipts');
    }

    // Normalize receipt code to uppercase since codes are always generated in uppercase
    const normalizedReceiptCode = receiptCode.toUpperCase().trim();

    // Find the transaction by receipt code
    const transaction = await this.transactionsRepository.findOne({
      where: { eventId, receiptCode: normalizedReceiptCode, type: 'purchase' },
      relations: ['user', 'station'],
    });

    if (!transaction) {
      throw new NotFoundException('Receipt not found');
    }

    if (transaction.isRedeemed) {
      throw new BadRequestException(`This receipt was already redeemed on ${new Date(transaction.redeemedAt).toLocaleString()}`);
    }

    // Mark as redeemed
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

  async redeemReceiptBySlug(eventSlug: string, receiptCode: string, redeemerUserId: string): Promise<any> {
    const event = await this.eventsRepository.findOne({
      where: { slug: eventSlug.toLowerCase() },
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    return this.redeemReceipt(event.id, receiptCode, redeemerUserId);
  }

  async getTransactions(eventId: string, userId: string): Promise<Transaction[]> {
    const member = await this.membersRepository.findOne({
      where: { eventId, userId },
    });

    if (!member) {
      throw new ForbiddenException('Not a member of this event');
    }

    return this.transactionsRepository.find({
      where: { eventId, userId },
      relations: ['station'],
      order: { createdAt: 'DESC' },
      take: 50,
    });
  }

  async getAllTransactions(eventId: string, userId: string): Promise<any[]> {
    const member = await this.membersRepository.findOne({
      where: { eventId, userId },
    });

    if (!member) {
      throw new ForbiddenException('Not a member of this event');
    }

    // Only admins and managers can view all transactions
    if (member.role !== EventRole.ADMIN && member.role !== EventRole.MANAGER) {
      throw new ForbiddenException('Only admins and managers can view global transaction history');
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

  async getEventDetailsBySlug(eventSlug: string, userId: string): Promise<any> {
    const event = await this.eventsRepository.findOne({
      where: { slug: eventSlug.toLowerCase() },
      relations: ['owner'],
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    return this.getEventDetails(event.id, userId);
  }

  async updateTokensBySlug(eventSlug: string, adminId: string, updateDto: UpdateTokensDto): Promise<EventMember> {
    const event = await this.eventsRepository.findOne({
      where: { slug: eventSlug.toLowerCase() },
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    return this.updateTokens(event.id, adminId, updateDto);
  }

  async promoteMemberBySlug(eventSlug: string, adminId: string, promoteDto: PromoteMemberDto): Promise<EventMember> {
    const event = await this.eventsRepository.findOne({
      where: { slug: eventSlug.toLowerCase() },
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    return this.promoteMember(event.id, adminId, promoteDto);
  }

  async createStationBySlug(eventSlug: string, userId: string, createDto: CreateStationDto): Promise<Shop> {
    const event = await this.eventsRepository.findOne({
      where: { slug: eventSlug.toLowerCase() },
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    return this.createStation(event.id, userId, createDto);
  }

  async updateStationBySlug(eventSlug: string, stationId: string, userId: string, updateDto: UpdateStationDto): Promise<Shop> {
    const event = await this.eventsRepository.findOne({
      where: { slug: eventSlug.toLowerCase() },
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    return this.updateStation(event.id, stationId, userId, updateDto);
  }

  async deleteStationBySlug(eventSlug: string, stationId: string, userId: string): Promise<void> {
    const event = await this.eventsRepository.findOne({
      where: { slug: eventSlug.toLowerCase() },
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    return this.deleteStation(event.id, stationId, userId);
  }

  async purchaseBySlug(eventSlug: string, userId: string, purchaseDto: PurchaseDto): Promise<Transaction> {
    const event = await this.eventsRepository.findOne({
      where: { slug: eventSlug.toLowerCase() },
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    return this.purchase(event.id, userId, purchaseDto);
  }

  async getTransactionsBySlug(eventSlug: string, userId: string): Promise<Transaction[]> {
    const event = await this.eventsRepository.findOne({
      where: { slug: eventSlug.toLowerCase() },
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    return this.getTransactions(event.id, userId);
  }

  async getAllTransactionsBySlug(eventSlug: string, userId: string): Promise<any[]> {
    const event = await this.eventsRepository.findOne({
      where: { slug: eventSlug.toLowerCase() },
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    return this.getAllTransactions(event.id, userId);
  }

  async archiveEvent(eventId: string, userId: string): Promise<Event> {
    const event = await this.eventsRepository.findOne({
      where: { id: eventId },
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    // Only the owner (admin) can archive the event
    const membership = await this.membersRepository.findOne({
      where: { eventId, userId },
    });

    if (!membership || membership.role !== EventRole.ADMIN) {
      throw new ForbiddenException('Only the event admin can archive this event');
    }

    event.isArchived = true;
    return this.eventsRepository.save(event);
  }

  async unarchiveEvent(eventId: string, userId: string): Promise<Event> {
    const event = await this.eventsRepository.findOne({
      where: { id: eventId },
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    // Only the owner (admin) can unarchive the event
    const membership = await this.membersRepository.findOne({
      where: { eventId, userId },
    });

    if (!membership || membership.role !== EventRole.ADMIN) {
      throw new ForbiddenException('Only the event admin can unarchive this event');
    }

    event.isArchived = false;
    return this.eventsRepository.save(event);
  }

  async archiveEventBySlug(eventSlug: string, userId: string): Promise<Event> {
    const event = await this.eventsRepository.findOne({
      where: { slug: eventSlug.toLowerCase() },
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    return this.archiveEvent(event.id, userId);
  }

  async unarchiveEventBySlug(eventSlug: string, userId: string): Promise<Event> {
    const event = await this.eventsRepository.findOne({
      where: { slug: eventSlug.toLowerCase() },
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    return this.unarchiveEvent(event.id, userId);
  }

  async deleteEventBySlug(eventSlug: string, userId: string): Promise<void> {
    const event = await this.eventsRepository.findOne({
      where: { slug: eventSlug.toLowerCase() },
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    return this.deleteEvent(event.id, userId);
  }

  async deleteAll(): Promise<void> {
    await this.transactionsRepository.clear();
    await this.shopRepository.clear();
    await this.membersRepository.clear();
    await this.eventsRepository.clear();
  }

  async deleteEvent(eventId: string, userId: string): Promise<void> {
    const event = await this.eventsRepository.findOne({
      where: { id: eventId },
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    // Only the owner (admin) can delete the event
    const membership = await this.membersRepository.findOne({
      where: { eventId, userId },
    });

    if (!membership || membership.role !== EventRole.ADMIN) {
      throw new ForbiddenException('Only the event admin can delete this event');
    }

    // Delete all related data in the correct order (due to foreign key constraints)
    await this.transactionsRepository.delete({ eventId });
    await this.shopRepository.delete({ eventId });
    await this.membersRepository.delete({ eventId });
    await this.eventsRepository.delete({ id: eventId });
  }
}
