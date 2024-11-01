import { UserService } from './user.service';
import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Patch,
  Req,
  UseGuards,
} from '@nestjs/common';
import { User } from '@prisma/client';
import { GetUser } from 'src/auth/decorator';
import { JwtGuard } from 'src/auth/guard';
import { EditUserDto } from './dto';

@UseGuards(JwtGuard) // protected by JwtStrategy
@Controller('users')
export class UserController {
  constructor(private userService: UserService) {}
  @Get('me')
  getMe(@GetUser() user: User) {
    console.log({ user });
    return user;
  }

  @Patch()
  editUser(@GetUser('id') userId: number, @Body() dto: EditUserDto) {
    if (Object.keys(dto).length === 0) {
      throw new BadRequestException('No data provided');
    }
    return this.userService.editUser(userId, dto);
  }
}
