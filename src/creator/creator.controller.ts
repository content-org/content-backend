import {
  Body,
  Controller,
  Delete,
  Get,
  HttpException,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UsePipes,
  ValidationPipe
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CreatorService } from './creator.service';
import { CreateCreatorDto, UpdateCreatorDto } from './dto';

@ApiTags('creator')
@Controller('creator')
export class CreatorController {
  constructor(private readonly creatorService: CreatorService) {}

  @Get()
  async getCreators() {
    try {
      const creators = await this.creatorService.getCreators();
      return creators;
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  @Get(':id')
  async getCreator(@Param('id', ParseIntPipe) creatorId: number) {
    try {
      const creator = await this.creatorService.getCreator(creatorId);
      if (!creator) {
        throw new Error(`Creator with id ${creatorId} not found`);
      }
      return creator;
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  @Post()
  @UsePipes(ValidationPipe)
  async createCreator(@Body() createCreatorDto: CreateCreatorDto) {
    try {
      const creator = await this.creatorService.createCreator(createCreatorDto);
      return creator;
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  @Patch()
  @UsePipes(ValidationPipe)
  async updateCreator(@Body() updateCreatorDto: UpdateCreatorDto) {
    try {
      const updatedCreator = await this.creatorService.updateCreator(
        updateCreatorDto
      );
      if (!updatedCreator) {
        throw new Error('Problem at updating');
      }
      return updatedCreator;
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  @Delete(':id')
  async deleteCreator(@Param('id', ParseIntPipe) creatorId: number) {
    try {
      const deletedCreator = await this.creatorService.deleteCreator(creatorId);
      if (!deletedCreator) {
        throw new Error('Problem at deleting');
      }
      return deletedCreator;
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }
}
