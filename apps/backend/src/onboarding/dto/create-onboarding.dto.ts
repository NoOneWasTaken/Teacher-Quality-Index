import {plainToInstance, Transform} from 'class-transformer';
import {
  IsEnum,
  IsObject,
  IsString,
  Validate,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
  validateSync, IsEmpty,
} from 'class-validator';

export enum Onboarder {
  STUDENT = 'student',
  PROFESSOR = 'professor',
}

export class StudentOnboardingBodyDto {
  @IsString()
  full_name: string;

  @IsString()
  edu_email: string;

  @IsString()
  student_id: string;

  @IsString()
  gender: 'Male' | 'Female' | 'Other';

  @IsEmpty()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return Buffer.from(value, 'base64');
    }
    return value;
  })
  id_card_photo!: Buffer;
}

export class ProfessorOnboardingBodyDto {
  @IsString()
  full_name: string;

  @IsString()
  edu_email: string;

  @IsString()
  department: string;

  @IsString()
  linkedin_profile: string;

  @IsEmpty()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return Buffer.from(value, 'base64');
    }
    return value;
  })
  id_card_photo!: Buffer;
}

@ValidatorConstraint({ name: 'OnboardingBodyByRole', async: false })
class OnboardingBodyByRoleValidator implements ValidatorConstraintInterface {
  validate(value: unknown, args: ValidationArguments): boolean {
    if (typeof value !== 'object' || value === null || Array.isArray(value)) {
      return false;
    }

    const dto = args.object as CreateOnboardingDto;
    const targetClass =
      dto.onboarder === Onboarder.STUDENT
        ? StudentOnboardingBodyDto
        : dto.onboarder === Onboarder.PROFESSOR
          ? ProfessorOnboardingBodyDto
          : null;

    if (!targetClass) {
      return false;
    }

    const errors = validateSync(plainToInstance(targetClass as new () => object, value), {
      whitelist: true,
      forbidNonWhitelisted: true,
    });

    return errors.length === 0;
  }

  defaultMessage(args: ValidationArguments): string {
    const dto = args.object as CreateOnboardingDto;

    if (dto.onboarder === Onboarder.STUDENT) {
      return 'body must match StudentOnboardingBodyDto';
    }

    if (dto.onboarder === Onboarder.PROFESSOR) {
      return 'body must match ProfessorOnboardingBodyDto';
    }

    return 'body must match the selected onboarder';
  }
}

export class CreateOnboardingDto {
  @IsEnum(Onboarder)
  onboarder: Onboarder;

  @IsObject()
  @Validate(OnboardingBodyByRoleValidator)
  body: StudentOnboardingBodyDto | ProfessorOnboardingBodyDto;
}

