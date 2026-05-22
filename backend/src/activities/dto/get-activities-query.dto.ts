import { Allow } from 'class-validator';

export class GetActivitiesQueryDto {
  @Allow()
  keyword?: unknown;

  @Allow()
  category?: unknown;

  @Allow()
  type?: unknown;

  @Allow()
  activityType?: unknown;

  @Allow()
  time?: unknown;

  @Allow()
  activityTime?: unknown;

  @Allow()
  latitude?: unknown;

  @Allow()
  longitude?: unknown;

  @Allow()
  lat?: unknown;

  @Allow()
  lng?: unknown;

  @Allow()
  currentLatitude?: unknown;

  @Allow()
  currentLongitude?: unknown;

  @Allow()
  currentLat?: unknown;

  @Allow()
  currentLng?: unknown;
}
