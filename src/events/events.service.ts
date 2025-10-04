import { Injectable, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Event } from './entities/event.entity';
import { EventMember, EventRole } from './entities/event-member.entity';
import { Purchasable } from './entities/purchasable.entity';
import { Transaction } from './entities/transaction.entity';
import { CreateEventDto, JoinEventDto, UpdateTokensDto, PromoteMemberDto } from './dto/event.dto';
import { CreateStationDto, PurchaseDto } from './dto/station.dto';

@Injectable()
export class EventsService {
  constructor(
    @InjectRepository(Event)
    private eventsRepository: Repository<Event>,
    @InjectRepository(EventMember)
    private membersRepository: Repository<EventMember>,
    @InjectRepository(Purchasable)
    private purchasablesRepository: Repository<Purchasable>,
    @InjectRepository(Transaction)
    private transactionsRepository: Repository<Transaction>,
  ) {}

  generateCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 5; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  async createEvent(userId: string, createEventDto: CreateEventDto): Promise<Event> {
    let code = this.generateCode();
    let existing = await this.eventsRepository.findOne({ where: { code } });

    while (existing) {
      code = this.generateCode();
      existing = await this.eventsRepository.findOne({ where: { code } });
    }

    const event = this.eventsRepository.create({
      ...createEventDto,
      code,
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
      where: { code: joinEventDto.code.toUpperCase() }
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

    return members.map(member => ({
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

    const stations = await this.purchasablesRepository.find({
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
    });

    if (!adminMember || (adminMember.role !== EventRole.ADMIN && adminMember.role !== EventRole.MANAGER)) {
      throw new ForbiddenException('Only admins and managers can update tokens');
    }

    const targetMember = await this.membersRepository.findOne({
      where: { eventId, userId: updateDto.userId },
    });

    if (!targetMember) {
      throw new NotFoundException('Member not found in this event');
    }

    targetMember.tokens += updateDto.amount;

    if (targetMember.tokens < 0) {
      targetMember.tokens = 0;
    }

    await this.transactionsRepository.save({
      eventId,
      userId: updateDto.userId,
      amount: updateDto.amount,
      type: updateDto.amount > 0 ? 'credit' : 'debit',
      description: `Token adjustment by ${adminMember.role}`,
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

    targetMember.role = promoteDto.role as EventRole;
    return this.membersRepository.save(targetMember);
  }

  async createStation(eventId: string, userId: string, createDto: CreateStationDto): Promise<Purchasable> {
    const member = await this.membersRepository.findOne({
      where: { eventId, userId },
    });

    if (!member || (member.role !== EventRole.ADMIN && member.role !== EventRole.MANAGER)) {
      throw new ForbiddenException('Only admins and managers can create stations');
    }

    const station = this.purchasablesRepository.create({
      ...createDto,
      eventId,
    });

    return this.purchasablesRepository.save(station);
  }

  async purchase(eventId: string, userId: string, purchaseDto: PurchaseDto): Promise<Transaction> {
    const member = await this.membersRepository.findOne({
      where: { eventId, userId },
    });

    if (!member) {
      throw new ForbiddenException('Not a member of this event');
    }

    const station = await this.purchasablesRepository.findOne({
      where: { id: purchaseDto.stationId, eventId },
    });

    if (!station) {
      throw new NotFoundException('Station not found');
    }

    if (!station.isAvailable) {
      throw new BadRequestException('Station is not available');
    }

    if (member.tokens < station.price) {
      throw new BadRequestException('Insufficient tokens');
    }

    member.tokens -= station.price;
    await this.membersRepository.save(member);

    const transaction = this.transactionsRepository.create({
      eventId,
      userId,
      amount: -station.price,
      type: 'purchase',
      description: `Purchased: ${station.name}`,
      stationId: station.id,
    });

    return this.transactionsRepository.save(transaction);
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
      order: { createdAt: 'DESC' },
      take: 50,
    });
  }

  async deleteAll(): Promise<void> {
    await this.transactionsRepository.clear();
    await this.purchasablesRepository.clear();
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
    await this.purchasablesRepository.delete({ eventId });
    await this.membersRepository.delete({ eventId });
    await this.eventsRepository.delete({ id: eventId });
  }
}
