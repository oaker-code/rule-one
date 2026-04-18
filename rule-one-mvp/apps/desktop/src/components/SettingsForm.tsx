import type { ReactNode } from "react";

interface SettingsFormProps {
  children: ReactNode;
}

function SettingsForm({ children }: SettingsFormProps) {
  return <section className="settings-card">{children}</section>;
}

export default SettingsForm;
