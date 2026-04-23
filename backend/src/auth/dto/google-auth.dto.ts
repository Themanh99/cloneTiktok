import { IsString, IsNotEmpty } from 'class-validator';

export class GoogleAuthDto {
  @IsString()
  @IsNotEmpty()
  idToken: string;
  // idToken is a JWT token returned by the Google SDK to the frontend.
  // The backend verifies this token with Google servers.
}
