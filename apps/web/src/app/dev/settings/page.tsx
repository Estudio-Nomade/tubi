import { redirect } from "next/navigation";

/** Slice 10: operator settings live at /operador/settings (FR-16). */
export default function DevSettingsPage() {
  redirect("/operador/settings");
}
