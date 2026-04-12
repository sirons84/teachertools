export type ServiceStatus = "active" | "coming-soon";

export interface ServiceConfig {
  id: string;
  title: string;
  description: string;
  icon: string;
  href: string;
  status: ServiceStatus;
  color: string;
}
