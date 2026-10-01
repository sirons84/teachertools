import type { Metadata } from "next";
import PlayClient from "./PlayClient";

export const metadata: Metadata = {
  title: "문장 호응 체크",
};

export default function HoeungPlayPage() {
  return <PlayClient />;
}
