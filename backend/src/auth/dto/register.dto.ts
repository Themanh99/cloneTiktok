import { IsEmail, IsString, MinLength, MaxLength, Matches } from 'class-validator';

export class RegisterDto {
  @IsEmail({}, { message: 'Email không hợp lệ' })
  email: string;

  @IsString()
  @MinLength(8, { message: 'Password phải có ít nhất 8 ký tự' })
  @MaxLength(32)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
    message: 'Password phải chứa ít nhất 1 chữ hoa, 1 chữ thường, 1 số',
  })
  // Regex giải thích:
  // (?=.*[a-z]) → có ít nhất 1 chữ thường
  // (?=.*[A-Z]) → có ít nhất 1 chữ hoa
  // (?=.*\d)    → có ít nhất 1 chữ số
  password: string;

  @IsString()
  @MinLength(3)
  @MaxLength(50)
  @Matches(/^[a-zA-Z0-9._]+$/, {
    message: 'Username chỉ chứa chữ cái, số, dấu chấm và gạch dưới',
  })
  username: string;

  @IsString()
  @MinLength(1)
  @MaxLength(100)
  displayName: string;
}
