import {
  Controller,
  Get,
  Post,
  Put,
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
import { IdParamDto } from '@core/dto/params-id.request.dto';
import { mergePayload } from '@utils/common';

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

    return await this.userService.createUser(request);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get user by ID' })
  @ApiResponse({ status: 200, description: 'User retrieved successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async getUserById(@Param() params: IdParamDto) {
    const { request, responseError } = params;

    if (!isEmpty(responseError)) {
      return responseError;
    }
    return await this.userService.getDetail(request.id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update user by ID' })
  @ApiResponse({ status: 200, description: 'User updated successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async updateUser(
    @Param() params: IdParamDto,
    @Body() updateUserDto: UpdateUserRequestDto,
  ) {
    const mergedData = mergePayload(params, updateUserDto);
    const { request, responseError } = mergedData;

    if (!isEmpty(responseError)) {
      return responseError;
    }
    return await this.userService.updateUser(request.id, request);
  }

  @Get('list')
  @ApiOperation({ summary: 'Get users with pagination and filters' })
  @ApiResponse({ status: 200, description: 'User list retrieved successfully' })
  async getUserList(@Query() query: GetListUserRequestDto) {
    const { request, responseError } = query;
    console.log('request', request);

    if (!isEmpty(responseError)) {
      return responseError;
    }

    return await this.userService.list(request);
  }
}
