import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { User } from 'src/entities';
import { UserService } from 'src/user/user.service';
import { IJwtPayload } from '../interfaces/jwt-payload.interface';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly userService: UserService,
    private readonly configService: ConfigService
  ) {
    super({
      secretOrKey: configService.get('JWT_SECRET'),
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken()
    });
  }
  async validate(payload: IJwtPayload): Promise<User> {
    const { id, userType } = payload;

    const user = await this.userService.getUser(id);
    if (!user) throw new UnauthorizedException('Token not valid');

    console.log(userType);

    return user;
  }
}
