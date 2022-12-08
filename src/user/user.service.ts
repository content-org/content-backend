import { Injectable, Logger } from '@nestjs/common';
import { SignUpRequestDto } from 'src/common/dto';
import { CreatorRepository } from 'src/creator/creator.repository';
import { User } from 'src/entities';
import { DataSource } from 'typeorm';
import { UpdateUserDto } from './dto';
import { IUpdateUserInput } from './interfaces';
import { UserRepository } from './user.repository';
import { ICreateAdvertiserInput } from 'src/common/interfaces/advertiser';
import { ICreateCreatorInput } from 'src/common/interfaces/creator';
import { AdvertiserRepository } from 'src/advertiser/advertiser.repository';
import { UserTypes } from 'src/common/constants';
import { CompleteOnboardingDto } from './onboarding/dto';

@Injectable()
export class UserService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly creatorRepository: CreatorRepository,
    private readonly advertiserRepository: AdvertiserRepository,
    private readonly dataSource: DataSource
  ) {}
  // async getUsers(): Promise<User[]> {
  //   const users = await this.userRepository.find();
  //   return users;
  // }

  async getUserById(id: number): Promise<User> {
    const user = await this.userRepository.findById(id);
    return user;
  }

  async getUserByEmail(email: string): Promise<User> {
    //here is an example of whay error handle should be in service layer
    const user = await this.userRepository.findByEmail(email);
    return user;
  }

  async createUser(signUpRequestDto: SignUpRequestDto): Promise<User> {
    const newUser = this.userRepository.create(signUpRequestDto);
    await this.userRepository.save(newUser);
    delete newUser.password;
    return newUser;
  }

  async updateById(id: number, updateUserDto: UpdateUserDto): Promise<User> {
    const updateUserInput: IUpdateUserInput = {
      id,
      ...updateUserDto
    };
    const updatedUser = await this.userRepository.updateById(updateUserInput);
    return updatedUser;
  }

  async completeOnboarding(
    id: number,
    completeOnboardingDto: CompleteOnboardingDto
  ) {
    const user = await this.userRepository.findById(id);
    if (user.onboardingCompleted)
      throw new Error('User has already completed the onboarding');
    const queryRunner = this.dataSource.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const { description, birthDate, userName, contentType, socialNetworks } =
        completeOnboardingDto;
      const updatedUser = await this.userRepository.updateById(
        {
          id,
          onboardingCompleted: true
        },
        queryRunner
      );

      const isCreator = updatedUser.type === UserTypes.CREATOR;

      Logger.log(
        `User ${updatedUser?.id} updated onboaring completed succesfully.`
      );

      let newCreatorId: number;
      let newAdvertiserId: number;

      if (isCreator) {
        if (!birthDate)
          throw new Error('birthDate is required to create a new creator');
        const createCreatorInput: ICreateCreatorInput = {
          userId: updatedUser.id,
          description,
          userName,
          contentType,
          birthDate,
          youtubeLinked: true
        };
        const creatorCreated = await this.creatorRepository.createAndSave(
          createCreatorInput,
          queryRunner
        );
        newCreatorId = creatorCreated.id;
      } else {
        if (!socialNetworks)
          throw new Error(
            'socialNetworks is required to create a new advertiser'
          );

        const createAdvertiserInput: ICreateAdvertiserInput = {
          userId: updatedUser.id,
          description,
          userName,
          contentType,
          ...socialNetworks
        };

        const advertiserCreated = await this.advertiserRepository.createAndSave(
          createAdvertiserInput,
          queryRunner
        );
        newAdvertiserId = advertiserCreated.id;
      }

      await queryRunner.commitTransaction();
      return {
        ...updatedUser,
        [isCreator ? 'creatorId' : 'advertiserId']:
          newCreatorId || newAdvertiserId
      };
    } catch (err) {
      Logger.error(`Onboarding completion transaction has failed.`);
      await queryRunner.rollbackTransaction();
      throw new Error(err.message);
    } finally {
      await queryRunner.release();
    }
  }

  async deleteUser(id: number): Promise<User> {
    const queryResult = await this.userRepository
      .createQueryBuilder()
      .delete()
      .where({
        id
      })
      .returning('*')
      .execute();

    return queryResult.raw[0];
  }
}
