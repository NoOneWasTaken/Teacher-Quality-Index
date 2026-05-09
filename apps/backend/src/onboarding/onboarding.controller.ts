import { Body, Controller, Post, ValidationPipe } from '@nestjs/common';
import { CreateOnboardingDto } from './dto/create-onboarding.dto';
import { OnboardingService } from './onboarding.service';

@Controller('onboarding')
export class OnboardingController {
  constructor(private readonly onboardingService: OnboardingService) {}

  @Post()
  onboard(
    @Body(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    )
    payload: CreateOnboardingDto,
  ) {
    return this.onboardingService.onboard(payload);
  }
}
