import "./globals.css";

export const metadata = {
  title: "Sistema de Contabilidad",
  description: "Proyecto Desarrollo Web - UMG",
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}