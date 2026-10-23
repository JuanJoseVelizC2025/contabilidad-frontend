const API_URL = process.env.NEXT_PUBLIC_API_URL;

export function guardarSesion(datos) {
  localStorage.setItem("token", datos.token);
  localStorage.setItem("usuario", JSON.stringify(datos.usuario));
}

export function obtenerToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("token");
}

export function obtenerUsuario() {
  if (typeof window === "undefined") return null;
  const texto = localStorage.getItem("usuario");
  return texto ? JSON.parse(texto) : null;
}

export function cerrarSesion() {
  localStorage.removeItem("token");
  localStorage.removeItem("usuario");
}

export async function api(ruta, opciones = {}) {
  const token = obtenerToken();

  const respuesta = await fetch(`${API_URL}${ruta}`, {
    ...opciones,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...opciones.headers,
    },
    body: opciones.body ? JSON.stringify(opciones.body) : undefined,
  });

  if (respuesta.status === 401 && ruta !== "/api/auth/login") {
    cerrarSesion();
    window.location.href = "/login";
    throw new Error("Sesión expirada");
  }

  let datos = null;
  try {
    datos = await respuesta.json();
  } catch {
    datos = null;
  }

  if (!respuesta.ok) {
    throw new Error(datos?.mensaje || "Error en la solicitud");
  }
  return datos;
}