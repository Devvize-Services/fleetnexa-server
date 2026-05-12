import { Body, Controller, Get, Post, Put } from '@nestjs/common';
import { SubscriptionPlanService } from './subscription-plan.service.js';
import { SubscriptionPlanDto } from './subscription-plan.dto.js';

@Controller('dashboard/subscription-plan')
export class SubscriptionPlanController {
  constructor(private readonly service: SubscriptionPlanService) {}

  @Get()
  async getAllPlans() {
    return this.service.getAllPlans();
  }

  @Post()
  async createPlan(@Body() data: SubscriptionPlanDto) {
    return this.service.createPlan(data);
  }

  @Put()
  async updatePlan(@Body() data: SubscriptionPlanDto) {
    return this.service.updatePlan(data);
  }
}
