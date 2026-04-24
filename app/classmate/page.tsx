import ClassmateApp from "./ClassmateApp";
import { CLASSMATE_AGENTS } from "@/lib/classmate-agents";

export default function ClassmatePage() {
  return <ClassmateApp agents={CLASSMATE_AGENTS} />;
}
