import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { User, UserDocument } from '../schemas/user.schema';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<User>,
  ) {}

  async findAll() {
    const users = await this.userModel.find().sort({ createdAt: 1 }).exec();
    return users.map((user) => this.toResponse(user));
  }

  async findOne(id: string) {
    const user = await this.findDocument(id);
    return this.toResponse(user);
  }

  async update(id: string, dto: UpdateUserDto) {
    await this.findDocument(id);

    if (dto.email) {
      const taken = await this.userModel
        .exists({ email: dto.email, _id: { $ne: new Types.ObjectId(id) } })
        .exec();
      if (taken) throw new ConflictException('That email is already in use');
    }

    const patch: Record<string, unknown> = {};
    if (dto.name !== undefined) patch.name = dto.name.trim();
    if (dto.email !== undefined) patch.email = dto.email;
    if (dto.title !== undefined) patch.title = dto.title.trim();
    if (dto.username !== undefined) patch.username = dto.username;
    if (dto.avatar !== undefined) patch.avatar = dto.avatar;

    await this.userModel
      .updateOne({ _id: new Types.ObjectId(id) }, { $set: patch })
      .exec();

    return this.findOne(id);
  }

  private async findDocument(id: string): Promise<UserDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException(`User ${id} not found`);
    }
    const user = await this.userModel.findById(id).exec();
    if (!user) throw new NotFoundException(`User ${id} not found`);
    return user;
  }

  private toResponse(user: UserDocument) {
    return {
      id: user._id.toString(),
      name: user.name,
      email: user.email ?? null,
      title: user.title ?? null,
      username: user.username ?? null,
      avatar: user.avatar ?? null,
      isGuest: user.isGuest,
      createdAt: (user as unknown as { createdAt: Date }).createdAt,
    };
  }
}
