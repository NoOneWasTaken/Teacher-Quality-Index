import { Injectable } from '@nestjs/common';
import { CreateOnboardingDto } from './dto/create-onboarding.dto';

@Injectable()
export class OnboardingService {
  onboard(payload: CreateOnboardingDto) {
	return {
	  message: 'Onboarding request accepted',
	  onboarder: payload.onboarder,
	  body: payload.body,
	};
  }
}
