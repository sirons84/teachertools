import agentsData from "@/data/classmate-agents.json";
import type { ClassmateAgent } from "@/types/classmate";

export const CLASSMATE_AGENTS = agentsData as ClassmateAgent[];

export function getAgentById(id: string): ClassmateAgent | undefined {
  return CLASSMATE_AGENTS.find((a) => a.id === id);
}
