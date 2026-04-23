import { IsString, IsNotEmpty } from 'class-validator';

export class GoogleAuthDto {
  @IsString()
  @IsNotEmpty()
  idToken: string;
  // idToken là JWT token do Google SDK trả về cho frontend
  // Backend sẽ verify token này với Google servers
}
