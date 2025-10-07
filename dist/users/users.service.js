"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsersService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const bcrypt = __importStar(require("bcrypt"));
const user_entity_1 = require("./entities/user.entity");
let UsersService = class UsersService {
    constructor(usersRepository) {
        this.usersRepository = usersRepository;
    }
    async create(createUserDto, verificationToken) {
        const existingUser = await this.usersRepository.findOne({
            where: { email: createUserDto.email },
        });
        if (existingUser) {
            throw new common_1.ConflictException('Email already exists');
        }
        const hashedPassword = await bcrypt.hash(createUserDto.password, 10);
        const verificationTokenExpiry = new Date();
        verificationTokenExpiry.setHours(verificationTokenExpiry.getHours() + 24);
        const user = this.usersRepository.create({
            ...createUserDto,
            password: hashedPassword,
            verificationToken,
            verificationTokenExpiry,
            isEmailVerified: false,
        });
        return this.usersRepository.save(user);
    }
    async findByEmail(email) {
        return this.usersRepository.findOne({ where: { email } });
    }
    async findById(id) {
        return this.usersRepository.findOne({ where: { id } });
    }
    async verifyEmail(email, token) {
        const user = await this.usersRepository.findOne({
            where: {
                email,
                verificationToken: token,
                verificationTokenExpiry: (0, typeorm_2.MoreThan)(new Date()),
            },
        });
        if (!user) {
            throw new common_1.BadRequestException('Invalid or expired verification token');
        }
        if (user.isEmailVerified) {
            throw new common_1.BadRequestException('Email already verified');
        }
        user.isEmailVerified = true;
        user.verificationToken = null;
        user.verificationTokenExpiry = null;
        return this.usersRepository.save(user);
    }
    async updateVerificationToken(email, token) {
        const user = await this.findByEmail(email);
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        if (user.isEmailVerified) {
            throw new common_1.BadRequestException('Email already verified');
        }
        const verificationTokenExpiry = new Date();
        verificationTokenExpiry.setHours(verificationTokenExpiry.getHours() + 24);
        user.verificationToken = token;
        user.verificationTokenExpiry = verificationTokenExpiry;
        return this.usersRepository.save(user);
    }
    async setPasswordResetToken(email, token) {
        const user = await this.findByEmail(email);
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        const resetPasswordExpiry = new Date();
        resetPasswordExpiry.setHours(resetPasswordExpiry.getHours() + 1);
        user.resetPasswordToken = token;
        user.resetPasswordExpiry = resetPasswordExpiry;
        return this.usersRepository.save(user);
    }
    async resetPassword(email, token, newPassword) {
        const user = await this.usersRepository.findOne({
            where: {
                email,
                resetPasswordToken: token,
                resetPasswordExpiry: (0, typeorm_2.MoreThan)(new Date()),
            },
        });
        if (!user) {
            throw new common_1.BadRequestException('Invalid or expired reset token');
        }
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        user.password = hashedPassword;
        user.resetPasswordToken = null;
        user.resetPasswordExpiry = null;
        return this.usersRepository.save(user);
    }
    async deleteAll() {
        await this.usersRepository.clear();
    }
    async count() {
        return this.usersRepository.count();
    }
    async findAll() {
        return this.usersRepository.find({
            select: ['id', 'email', 'firstName', 'lastName', 'isEmailVerified', 'createdAt'],
            order: { createdAt: 'DESC' },
        });
    }
    async requestEmailChange(userId, newEmail, token) {
        const user = await this.findById(userId);
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        const emailChangeTokenExpiry = new Date();
        emailChangeTokenExpiry.setHours(emailChangeTokenExpiry.getHours() + 1);
        user.pendingEmail = newEmail;
        user.emailChangeToken = token;
        user.emailChangeTokenExpiry = emailChangeTokenExpiry;
        return this.usersRepository.save(user);
    }
    async verifyEmailChange(userId, token) {
        const user = await this.usersRepository.findOne({
            where: {
                id: userId,
                emailChangeToken: token,
                emailChangeTokenExpiry: (0, typeorm_2.MoreThan)(new Date()),
            },
        });
        if (!user) {
            throw new common_1.BadRequestException('Invalid or expired email change token');
        }
        if (!user.pendingEmail) {
            throw new common_1.BadRequestException('No pending email change');
        }
        user.email = user.pendingEmail;
        user.pendingEmail = null;
        user.emailChangeToken = null;
        user.emailChangeTokenExpiry = null;
        user.isEmailVerified = true;
        return this.usersRepository.save(user);
    }
    async requestPasswordChange(userId, currentPassword, token) {
        const user = await this.findById(userId);
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
        if (!isPasswordValid) {
            throw new common_1.BadRequestException('Current password is incorrect');
        }
        const passwordChangeTokenExpiry = new Date();
        passwordChangeTokenExpiry.setHours(passwordChangeTokenExpiry.getHours() + 1);
        user.passwordChangeToken = token;
        user.passwordChangeTokenExpiry = passwordChangeTokenExpiry;
        return this.usersRepository.save(user);
    }
    async verifyPasswordChange(userId, token, newPassword) {
        const user = await this.usersRepository.findOne({
            where: {
                id: userId,
                passwordChangeToken: token,
                passwordChangeTokenExpiry: (0, typeorm_2.MoreThan)(new Date()),
            },
        });
        if (!user) {
            throw new common_1.BadRequestException('Invalid or expired password change token');
        }
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        user.password = hashedPassword;
        user.passwordChangeToken = null;
        user.passwordChangeTokenExpiry = null;
        return this.usersRepository.save(user);
    }
    async changeEmail(userId, changeEmailDto) {
        const user = await this.usersRepository.findOne({ where: { id: userId } });
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        const existingUser = await this.usersRepository.findOne({
            where: { email: changeEmailDto.newEmail },
        });
        if (existingUser) {
            throw new common_1.ConflictException('Email is already in use');
        }
        user.email = changeEmailDto.newEmail;
        user.isEmailVerified = false;
        await this.usersRepository.save(user);
        return { message: 'Email updated successfully' };
    }
    async changePassword(userId, changePasswordDto) {
        const user = await this.usersRepository.findOne({ where: { id: userId } });
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        const isPasswordValid = await bcrypt.compare(changePasswordDto.currentPassword, user.password);
        if (!isPasswordValid) {
            throw new common_1.BadRequestException('Current password is incorrect');
        }
        const hashedNewPassword = await bcrypt.hash(changePasswordDto.newPassword, 10);
        user.password = hashedNewPassword;
        await this.usersRepository.save(user);
        return { message: 'Password updated successfully' };
    }
};
exports.UsersService = UsersService;
exports.UsersService = UsersService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], UsersService);
//# sourceMappingURL=users.service.js.map