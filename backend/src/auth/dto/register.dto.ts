import { IsEmail, IsString, MinLength, MaxLength, Matches } from 'class-validator';

export class RegisterDto {
  @IsEmail({}, { message: 'Invalid email format' })
  email: string;

  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters' })
  @MaxLength(32)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
    message: 'Password must contain at least 1 uppercase letter, 1 lowercase letter, and 1 number',
  })
  // Regex explanation:
  // (?=.*[a-z]) → at least 1 lowercase letter
  // (?=.*[A-Z]) → at least 1 uppercase letter
  // (?=.*\d)    → at least 1 digit
  password: string;

  @IsString()
  @MinLength(3)
  @MaxLength(50)
  @Matches(/^[a-zA-Z0-9._]+$/, {
    message: 'Username can only contain letters, numbers, dots, and underscores',
  })
  username: string;

  @IsString()
  @MinLength(1)
  @MaxLength(100)
  displayName: string;
}
