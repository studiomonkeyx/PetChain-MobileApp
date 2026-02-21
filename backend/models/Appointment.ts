/**
 * Appointment status values.
 */
export type AppointmentStatus = "scheduled" | "completed" | "cancelled" | "no_show";

/**
 * Core appointment model returned by backend APIs.
 */
export interface Appointment {
  id: string;
  petId: string;
  petName?: string;
  vetId?: string;
  vetName?: string;
  clinicName?: string;
  dateTime: string;
  type?: string;
  status: AppointmentStatus;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Payload for creating a new appointment.
 */
export interface CreateAppointmentInput {
  petId: string;
  vetId?: string;
  dateTime: string;
  type?: string;
  notes?: string;
}

/**
 * Payload for updating an existing appointment.
 */
export interface UpdateAppointmentInput {
  dateTime?: string;
  type?: string;
  status?: AppointmentStatus;
  notes?: string;
}

/**
 * API response wrapper for single appointment.
 */
export interface AppointmentResponse {
  data: Appointment;
  message?: string;
}

/**
 * API response wrapper for list of appointments.
 */
export interface AppointmentsListResponse {
  data: Appointment[];
  total?: number;
  message?: string;
}
