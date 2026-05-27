import api from "./lib/axios";
import type {
  ActivityCategory,
  ActivityDetail,
  ActivityGenderRequirement,
  ActivityListItem,
} from "./types/activity";

type AuthLoginPayload = {
  email: string;
  password: string;
};

type SendOtpPayload = {
  email: string;
};

type VerifyOtpPayload = {
  email: string;
  otp: string;
};

type RegisterPayload = {
  name: string;
  password: string;
  tempToken: string;
  gender: "male" | "female";
};

export type ProfilePayload = {
  name: string;
  faculty?: string | null;
  schoolYear?: number | null;
  bio?: string | null;
  interests?: string[];
};

type AuthHeaderOptions = {
  token?: string;
};

function withAuthHeader(options?: AuthHeaderOptions) {
  if (options?.token) {
    return { headers: { Authorization: `Bearer ${options.token}` } };
  }

  return undefined;
}

export async function fetchInterests() {
  const response = await api.get("/interests");
  return response.data;
}

export async function fetchCategories() {
  const response = await api.get('/categories')
  return response.data
}

export async function login(payload: AuthLoginPayload) {
  const response = await api.post("/auth/login", payload);
  return response.data;
}

export async function sendOtp(payload: SendOtpPayload) {
  const response = await api.post("/auth/send-otp", payload);
  return response.data;
}

export async function verifyOtp(payload: VerifyOtpPayload) {
  const response = await api.post("/auth/verify-otp", payload);
  return response.data;
}

export async function registerUser(payload: RegisterPayload) {
  const response = await api.post("/auth/register", payload);
  return response.data;
}

export async function getMe(options?: AuthHeaderOptions) {
  const response = await api.get("/users/me", withAuthHeader(options));
  return response.data;
}

export async function updateProfile(
  payload: ProfilePayload,
  options?: AuthHeaderOptions,
) {
  const response = await api.put(
    "/users/me/profile",
    payload,
    withAuthHeader(options),
  );
  return response.data;
}

export async function getDashboard() {
  const response = await api.get("/users/me/dashboard");
  return response.data;
}

export async function getPublicProfile(userId: string) {
  const response = await api.get(`/users/${userId}/profile`);
  return response.data;
}

export type CreateActivityPayload = {
  type: ActivityCategory;
  name: string;
  location: string;
  image?: File;
  date: string;
  start: string;
  end?: string;
  maxPeople: number;
  purpose: string;
  deadline: string;
  groupChatLink: string;
  gender: ActivityGenderRequirement;
  description?: string;
};

export async function createActivity(payload: CreateActivityPayload) {
  const { image, ...fields } = payload;
  if (!image) {
    const response = await api.post("/activities", fields);
    return response.data;
  }

  const formData = new FormData();
  Object.entries(fields).forEach(([key, value]) => {
    if (value !== undefined) {
      formData.append(key, String(value));
    }
  });
  formData.append("image", image);

  const response = await api.post("/activities", formData);
  return response.data;
}

export type FetchActivitiesParams = {
  keyword?: string
  category?: string | string[]
  time?: string
}

export async function fetchActivities(params?: FetchActivitiesParams) {
  const serialized: Record<string, string> = {}

  if (params?.keyword) serialized.keyword = params.keyword
  if (params?.time) serialized.time = params.time
  if (params?.category !== undefined) {
    const value = Array.isArray(params.category)
      ? params.category.join(',')
      : params.category
    if (value) serialized.category = value
  }

  const response = await api.get<ActivityListItem[]>('/activities', { params: serialized })
  return response.data
}

export async function fetchActivity(activityId: string) {
  const response = await api.get<ActivityDetail>(`/activities/${activityId}`);
  return response.data;
}

export async function joinActivity(activityId: string) {
  const response = await api.post<{ message: string; chatLink: string | null }>(
    `/activities/${activityId}/join`,
  )
  return response.data
}
