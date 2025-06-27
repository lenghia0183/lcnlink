import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

import { UserService } from './user.service';
import { CreateUserRequestDto } from './dto/request/create-user.request.dto';
import { UpdateUserRequestDto } from './dto/request/update-user.request.dto';
import { GetListUserRequestDto } from './dto/request/get-list-user.request.dto';
import { isEmpty } from 'lodash';
import { RoleGuard } from '@core/guards/role.guard';
import { Roles } from '@core/decorators/role.decorator';
import { USER_ROLE_ENUM } from './user.constant';

@ApiTags('Users')
@UseGuards(RoleGuard)
@Roles(USER_ROLE_ENUM.ADMIN)
@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new user' })
  @ApiResponse({ status: 201, description: 'User created successfully' })
  async createUser(@Body() payload: CreateUserRequestDto) {
    const { request, responseError } = payload;
    if (!isEmpty(responseError)) {
      return responseError;
    }

    const userData = request;
    return await this.userService.createUser(userData);
  }

  @Get()
  @ApiOperation({ summary: 'Get all users' })
  @ApiResponse({ status: 200, description: 'Users retrieved successfully' })
  async getAllUsers() {
    return await this.userService.findAll();
  }

  @Get('list')
  @ApiOperation({ summary: 'Get users with pagination and filters' })
  @ApiResponse({ status: 200, description: 'User list retrieved successfully' })
  async getUserList(@Query() query: GetListUserRequestDto) {
    const { request, responseError } = query;

    if (!isEmpty(responseError)) {
      return responseError;
    }

    return await this.userService.list(request);
  }

  @Get('summary')
  @ApiOperation({ summary: 'Get user summary by role' })
  @ApiResponse({
    status: 200,
    description: 'User summary retrieved successfully',
  })
  async getUserSummary() {
    return await this.userService.getSummaryUsers();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get user by ID' })
  @ApiResponse({ status: 200, description: 'User retrieved successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async getUserById(@Param('id') id: string) {
    return await this.userService.getDetail(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update user by ID' })
  @ApiResponse({ status: 200, description: 'User updated successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async updateUser(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserRequestDto,
  ) {
    return await this.userService.updateUser(id, updateUserDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete user by ID' })
  @ApiResponse({ status: 200, description: 'User deleted successfully' })
  async deleteUser(@Param('id') id: string) {
    await this.userService.remove(id);
    return { message: 'User deleted successfully' };
  }
}
