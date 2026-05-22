import { Allow } from 'class-validator';

export class CreateActivityDto {
  @Allow()
  type?: unknown;

  @Allow()
  category?: unknown;

  @Allow()
  categoryName?: unknown;

  @Allow()
  activityType?: unknown;

  @Allow()
  title?: unknown;

  @Allow()
  name?: unknown;

  @Allow()
  activityName?: unknown;

  @Allow()
  location?: unknown;

  @Allow()
  time?: unknown;

  @Allow()
  startTime?: unknown;

  @Allow()
  startAt?: unknown;

  @Allow()
  date?: unknown;

  @Allow()
  activityDate?: unknown;

  @Allow()
  start?: unknown;

  @Allow()
  startHour?: unknown;

  @Allow()
  endTime?: unknown;

  @Allow()
  endAt?: unknown;

  @Allow()
  end?: unknown;

  @Allow()
  endHour?: unknown;

  @Allow()
  maxSlots?: unknown;

  @Allow()
  maxPeople?: unknown;

  @Allow()
  maxParticipants?: unknown;

  @Allow()
  capacity?: unknown;

  @Allow()
  purpose?: unknown;

  @Allow()
  deadline?: unknown;

  @Allow()
  registrationDeadline?: unknown;

  @Allow()
  chatLink?: unknown;

  @Allow()
  contactLink?: unknown;

  @Allow()
  groupChatLink?: unknown;

  @Allow()
  description?: unknown;
}
