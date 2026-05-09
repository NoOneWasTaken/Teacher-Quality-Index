import {Injectable, UnauthorizedException} from '@nestjs/common';
import {ConfigService} from "@nestjs/config";
import { SignJWT } from 'jose';
import axios from "axios";

@Injectable()
export class AuthService {
  constructor(private config: ConfigService){
  }

  async verifyGoogleToken(token: string) {
    const response = await axios.get(`https://oauth2.googleapis.com/tokeninfo?id_token=${token}`);
    if (response.status !== 200) throw new UnauthorizedException('Invalid Google token');

    if (response.data.aud !== this.config.get<string>('GOOGLE_CLIENT_ID')) {
      throw new UnauthorizedException('Invalid Google token audience');
    }

    console.log(response.data)
    // const secret = new TextEncoder().encode(this.config.get<string>('JWT_SECRET'));
    // const jwt = await new SignJWT({ sub: response.data.user.id, email: response.data.email })
  }
}
