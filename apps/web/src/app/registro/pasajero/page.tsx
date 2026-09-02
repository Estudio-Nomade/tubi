import { redirect } from "next/navigation";

/** Alias de /registro — mismo wizard de alta de pasajero. */
export default function RegistroPasajeroAliasPage() {
  redirect("/registro");
}
