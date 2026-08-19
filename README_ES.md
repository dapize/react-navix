![React Navix](header_ES.png)

# React-navix

[<img src="https://flagcdn.com/gb.svg" width="20" alt="English"> English](README.md)

> Un router para React ligero y sin dependencias, con rutas anidadas, bloqueo de navegación, restauración de scroll, error boundaries por ruta y soporte completo de TypeScript.

[![npm version](https://img.shields.io/npm/v/react-navix)](https://www.npmjs.com/package/react-navix)
[![license](https://img.shields.io/npm/l/react-navix)](LICENSE)
[![bundle size](https://img.shields.io/bundlephobia/minzip/react-navix)](https://bundlephobia.com/package/react-navix)

---

## Características

- **BrowserRouter** — URLs limpias mediante la API History
- **HashRouter** — enrutamiento basado en hash para alojamiento estático
- **MemoryRouter** — historial en memoria para testing
- **Rutas anidadas** con `<Routes>`, `<Route>` y `<Outlet>`
- **Navegación declarativa** con `<Link>`, `<NavLink>` y `<Navigate>`
- **Navegación relativa** — `..`, `../hermano`, `./hijo` — con resolución según la jerarquía de rutas
- **Navegación programática** mediante `useNavigate`
- **Estado de navegación** — pasa datos entre rutas mediante `state` (invisible en la URL)
- **Parámetros de URL** mediante `useParams`
- **Cadena de rutas activas** mediante `useMatches` — breadcrumbs, analytics, títulos dinámicos
- **Datos de layout a hijo** mediante `useOutletContext` + `<Outlet context={...}>` — sin prop drilling
- **Cadenas de consulta** mediante `useSearchParams`
- **Bloqueo de navegación** mediante `useBlocker` (cambios sin guardar, formularios modificados)
- **Protección al cerrar pestaña** mediante `useBeforeUnload` (evita pérdida de datos al cerrar/recargar)
- **Error boundaries por ruta** — `errorElement` por ruta con `useRouteError()` y `useResetErrorBoundary()`
- **Restauración de scroll** con `<ScrollRestoration>`
- **Utilidades de ruta** — `matchPath` y `resolvePath` exportadas para uso personalizado
- **Bundle reducido** — ~9.61 kB comprimido
- **Escrito en TypeScript** — definiciones de tipo incluidas

---

## Instalación

```bash
npm install react-navix
# o
pnpm add react-navix
# o
yarn add react-navix
```

`react-navix` requiere **React 18 o 19** instalado en tu proyecto.

---

## Inicio rápido

```tsx
import { BrowserRouter, Routes, Route, Link } from "react-navix";

function App() {
  return (
    <BrowserRouter>
      <nav>
        <Link to="/">Inicio</Link>
        <Link to="/acerca">Acerca</Link>
      </nav>
      <Routes>
        <Route path="/" element={<h1>Inicio</h1>} />
        <Route path="/acerca" element={<h1>Acerca</h1>} />
      </Routes>
    </BrowserRouter>
  );
}
```

---

## Routers

### `<BrowserRouter>`

Utiliza la API History del navegador para URLs limpias (`/panel`, `/configuracion`).

```tsx
import { BrowserRouter, Routes, Route } from "react-navix";

<BrowserRouter>
  <Routes>...</Routes>
</BrowserRouter>
```

**Props**

| Prop | Tipo | Por defecto | Descripción |
|---|---|---|---|
| `children` | `ReactNode` | requerido | Árbol de rutas de la aplicación |
| `basename` | `string` | `""` | Ruta base para todas las rutas (ej. `"/app"`) |

Cuando se proporciona un `basename`, todas las rutas y enlaces se resuelven relativas a él:

```tsx
<BrowserRouter basename="/app">
  {/* <Link to="/panel"> navega a /app/panel */}
  {/* Una ruta con path="/panel" coincide con /app/panel */}
  <Routes>...</Routes>
</BrowserRouter>
```

---

### `<HashRouter>`

Utiliza el hash de la URL (`#/panel`, `#/configuracion`). Ideal para servidores de archivos estáticos o entornos donde no se pueden configurar redirecciones del lado del servidor.

```tsx
import { HashRouter, Routes, Route } from "react-navix";

<HashRouter>
  <Routes>...</Routes>
</HashRouter>
```

**Props**

| Prop | Tipo | Por defecto | Descripción |
|---|---|---|---|
| `children` | `ReactNode` | requerido | Árbol de rutas de la aplicación |
| `basename` | `string` | `""` | Ruta base para todas las rutas (ej. `"/app"`) |

Cuando se proporciona un `basename`, todas las rutas y enlaces se resuelven relativas a él:

```tsx
<HashRouter basename="/admin">
  {/* <Link to="/usuarios"> navega a #/admin/usuarios */}
  {/* Una ruta con path="/usuarios" coincide con #/admin/usuarios */}
  <Routes>...</Routes>
</HashRouter>
```

---

### `<MemoryRouter>`

Almacena el historial en memoria (sin interacción con `window`). Esencial para **tests unitarios** donde no hay una URL real del navegador.

```tsx
import { MemoryRouter, Routes, Route } from "react-navix";

<MemoryRouter initialEntries={["/usuarios/42"]}>
  <Routes>...</Routes>
</MemoryRouter>
```

**Props**

| Prop | Tipo | Por defecto | Descripción |
|---|---|---|---|
| `children` | `ReactNode` | requerido | Árbol de rutas de la aplicación |
| `initialEntries` | `string[]` | `["/"]` | Entradas iniciales del historial (ej. `["/inicio", "/acerca"]`) |
| `initialIndex` | `number` | `0` | Índice de la entrada activa dentro de `initialEntries` |
| `basename` | `string` | `""` | Ruta base, misma semántica que `BrowserRouter` |

---

### Anclas de scroll en HashRouter

Si tu app tiene páginas extensas con secciones navegables, puedes usar anclas internas en el hash:

```
https://miapp.com/#/articulo/react#comentarios
```

`react-navix` separa automáticamente la ruta del ancla:
- `useLocation().pathname` → `"/articulo/react"`
- `useLocation().hash` → `"#comentarios"`

Para implementar el scroll, escucha `useLocation().hash`:

```tsx
import { useEffect } from "react";
import { useLocation } from "react-navix";

function useScrollToHash() {
  const { hash } = useLocation();

  useEffect(() => {
    if (!hash) return;

    const id = hash.slice(1);
    // Ejemplo básico. Reemplazar con tu propia lógica de scroll o librería
    // (react-scroll, scrollIntoView con opciones personalizadas, etc.)
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  }, [hash]);
}
```

> **Nota**: en `BrowserRouter` el navegador maneja el scroll nativamente porque las anclas van en el fragmento real de la URL (`/articulo/react#comentarios`). En `HashRouter` todo reside dentro del hash (`#/articulo/react#comentarios`), por lo que el scroll debe implementarse manualmente.

---

## Definición de rutas

### `<Routes>`

Contenedor que evalúa sus hijos `<Route>` contra la URL actual y renderiza la primera coincidencia.

```tsx
<Routes>
  <Route path="/" element={<Inicio />} />
  <Route path="/usuarios" element={<Usuarios />} />
  <Route path="*" element={<NoEncontrado />} />
</Routes>
```

### `<Route>`

Define una ruta individual. Puede contener hijos `<Route>` anidados para construir layouts anidados.

**Props**

| Prop | Tipo | Por defecto | Descripción |
|---|---|---|---|
| `path` | `string` | `undefined` | Patrón de URL a coincidir. Soporta segmentos `:param`. Omitir para rutas de layout. |
| `index` | `boolean` | `false` | Cuando es `true`, actúa como ruta índice — se renderiza cuando la ruta padre coincide exactamente, como contenido por defecto en el `<Outlet>` del padre. Solo aplican `index` y `element`. |
| `element` | `ReactNode` | `undefined` | Contenido a renderizar cuando la ruta coincide |
| `errorElement` | `ReactNode` | `undefined` | UI de fallback renderizada cuando el element de la ruta (o cualquier descendiente sin su propio `errorElement`) lanza un error durante el renderizado |
| `handle` | `unknown` | `undefined` | Datos arbitrarios asociados a la ruta. Accesible mediante `useMatches()` para breadcrumbs, analytics o títulos dinámicos. |
| `children` | `ReactNode` | `undefined` | Elementos `<Route>` anidados para construir layouts anidados |

```tsx
<Routes>
  <Route path="/panel" element={<Panel />}>
    <Route index element={<PanelInicio />} />
    <Route path="estadisticas" element={<PanelEstadisticas />} />
    <Route path=":id" element={<PanelItem />} />
  </Route>
</Routes>
```

### `<Outlet>`

Renderiza la ruta hija coincidente dentro de un layout padre.

```tsx
function Panel() {
  return (
    <div>
      <h1>Panel</h1>
      <Outlet /> {/* Las rutas hijas se renderizan aquí */}
    </div>
  );
}
```

**Props**

| Prop | Tipo | Por defecto | Descripción |
|---|---|---|---|
| `context` | `unknown` | `undefined` | Datos pasados a la ruta hija. Accesible mediante `useOutletContext()`. |

Pasa datos de un layout a su hijo inmediato sin prop drilling ni crear tu propio contexto de React:

```tsx
function Panel() {
  const usuario = { nombre: "Alicia", rol: "admin" };

  return (
    <div>
      <h1>Panel</h1>
      <Outlet context={usuario} /> {/* usuario se pasa al hijo */}
    </div>
  );
}

function PaginaConfiguracion() {
  const usuario = useOutletContext<{ nombre: string; rol: string }>();
  return <p>¡Hola, {usuario.nombre}!</p>;
}
```

El contexto está limitado a la ruta hija **inmediata**. Los layouts anidados pueden sobrescribirlo con su propio `<Outlet context={...} />`. Los layouts que no proporcionan contexto rompen la cadena — los descendientes más profundos no verán el contexto del ancestro.

### Rutas comodín (404)

Usa el comodín `*` para capturar cualquier ruta no manejada por las rutas anteriores. Colócalo siempre al final dentro de `<Routes>`.

```tsx
<Routes>
  <Route path="/" element={<Inicio />} />
  <Route path="/acerca" element={<Acerca />} />
  <Route path="*" element={<NoEncontrado />} />
</Routes>
```

El comodín captura toda URL restante, por lo que funciona como tu página 404. Solo necesitas una ruta comodín por bloque `<Routes>`.

---

## Navegación

### `<Link>`

Renderiza un elemento `<a>` que activa navegación del lado del cliente.

```tsx
<Link to="/perfil">Perfil</Link>
<Link to="/perfil" replace>Perfil (reemplazar historial)</Link>
```

**Props**

Extiende `AnchorHTMLAttributes<HTMLAnchorElement>`. Todas las props estándar de anchor se reenvían.

| Prop | Tipo | Por defecto | Descripción |
|---|---|---|---|
| `to` | `string` | requerido | Ruta de destino. Soporta rutas relativas (`..`, `../hermano`, `hijo`). |
| `replace` | `boolean` | `false` | Reemplaza la entrada actual del historial en vez de agregar una nueva |
| `relative` | `"route" \| "path"` | `"route"` | Cómo resolver un `to` relativo. `"route"` (por defecto) resuelve contra la jerarquía de rutas actual, recayendo en el pathname de la URL fuera de `<Routes>`. `"path"` resuelve contra el pathname completo de la URL. |
| `state` | `unknown` | `undefined` | Datos a transportar a la ruta destino. Accesible mediante `useLocation().state`. |

`<Link>` detecta automáticamente el contexto del router y antepone `#` cuando está dentro de un `<HashRouter>`, por lo que el mismo `<Link to="/usuarios">` funciona bajo ambos routers sin configuración.

`<Link>` detecta clics modificados (`Ctrl`, `Meta`, `Alt`, `Shift`), botón central del ratón, y cualquier `target` distinto de `_self`. En esos casos deja que el navegador maneje la navegación de forma nativa — por ejemplo, abriendo el enlace en una nueva pestaña.

**Las rutas relativas** funcionan sin configuración. Por defecto `<Link>` resuelve `to` contra la jerarquía de rutas actual (recayendo en el pathname de la URL cuando no hay un `<Routes>` circundante):

```tsx
// URL: /usuarios/42
<Link to="..">Volver</Link>            // navega a /usuarios
<Link to="../configuracion">Conf</Link> // navega a /usuarios/configuracion
<Link to="editar">Editar</Link>         // navega a /usuarios/42/editar
```

El modo `"route"` por defecto resuelve contra la jerarquía de rutas; pasa `relative="path"` para resolver contra el pathname completo de la URL. Esta diferencia importa dentro de rutas comodín (`*`):

```tsx
<Routes>
  <Route path="archivos/*" element={<LayoutArchivos />}>
    <Route path="editar" element={<EditarArchivo />} />
  </Route>
</Routes>

function LayoutArchivos() {
  // URL: /archivos/imagenes/gato.jpg
  return (
    <div>
      <Link to="editar">Editar archivo</Link>                        {/* "route" (por defecto): /archivos/editar */}
      <Link to="..">Subir a la ruta padre</Link>                     {/* "route" (por defecto): / */}
      <Link to=".." relative="path">Subir un segmento</Link>         {/* "path": /archivos/imagenes */}
    </div>
  );
}
```

---

### `<NavLink>`

Similar a `<Link>`, pero agrega estilos cuando el enlace coincide con la URL actual.

```tsx
<NavLink
  to="/panel"
  activeClassName="font-bold"
  activeStyle={{ color: "blue" }}
>
  Panel
</NavLink>
```

**Props**

Extiende `LinkProps`.

| Prop | Tipo | Por defecto | Descripción |
|---|---|---|---|
| `activeClassName` | `string` | `undefined` | Clase CSS aplicada cuando el enlace está activo |
| `activeStyle` | `CSSProperties` | `undefined` | Estilos en línea aplicados cuando el enlace está activo |
| `exact` | `boolean` | `false` | Requiere coincidencia exacta de ruta para considerarse activo |
| `end` | `boolean` | `false` | Alias de `exact` para compatibilidad con React Router v6. Si ambos se proporcionan, `exact` tiene prioridad. |
| `relative` | `"route" \| "path"` | `"route"` | Heredado de `LinkProps`. Controla cómo se resuelve un `to` relativo para la detección de activo. |

**Detección de activo**: por defecto (`exact={false}`, equivalente a `end={false}`), un `<NavLink>` está activo cuando la ruta actual comienza con el valor de `to` y el siguiente carácter es una `/` (límite de segmento). La raíz `"/"` nunca se considera activa como prefijo en modo no exacto.

| `to` | Ruta actual | `exact / end = {false}` | `exact / end = {true}` |
|---|---|---|---|
| `/usuarios` | `/usuarios` | ✅ activo | ✅ activo |
| `/usuarios` | `/usuarios/42` | ✅ activo | ❌ |
| `/` | `/` | ✅ activo | ✅ activo |
| `/` | `/panel` | ❌ | ❌ |

---

### `<Navigate>`

Redirección declarativa. Apenas se renderiza, navega a la ruta indicada.

```tsx
<Navigate to="/iniciar-sesion" />
<Navigate to="/iniciar-sesion" replace={false} />
```

**Props**

| Prop | Tipo | Por defecto | Descripción |
|---|---|---|---|
| `to` | `string` | requerido | Ruta de destino. Soporta rutas relativas. |
| `replace` | `boolean` | `true` | Reemplaza la entrada actual del historial |
| `relative` | `"route" \| "path"` | `"route"` | Cómo resolver un `to` relativo. Mismo comportamiento que `Link`. |
| `state` | `unknown` | `undefined` | Datos a transportar a la ruta destino. Accesible mediante `useLocation().state`. |

---

## Hooks

### `useLocation()`

Devuelve el objeto de ubicación actual. Acepta un genérico opcional para tipar el campo `state`.

```tsx
import { useLocation } from "react-navix";

function Pagina() {
  const { pathname, search, hash, state } = useLocation();
  return <p>Ruta actual: {pathname}</p>;
}
```

Devuelve `Location<T>` (por defecto `unknown`):

```ts
interface Location<T = unknown> {
  pathname: string;
  search: string;
  hash: string;
  state?: T;
  key?: string;
}
```

> **Codificación:** `pathname` se devuelve decodificado para que los patrones de ruta con caracteres Unicode (`ñ`, emoji, CJK) coincidan correctamente; las secuencias percent malformadas (un `%` literal no seguido de dos dígitos hexadecimales) se dejan tal cual en lugar de lanzar un error. `search` y `hash` se mantienen percent-encodeados, igual que la API `window.location` y para garantizar que `URLSearchParams` (usado internamente por `useSearchParams`) pueda parsearlos sin ambigüedad. Por ejemplo, navegar a `/niño?q=café#sección` produce `{ pathname: "/niño", search: "?q=caf%C3%A9", hash: "#secci%C3%B3n" }`.

El campo `state` contiene datos pasados mediante `navigate("/ruta", { state: ... })` o la prop `state` en `<Link>` / `<Navigate>`. Es `undefined` cuando no se pasó state. El state sobrevive refrescos de página y navegación atrás/adelante.

**Acceso tipado al state** — pasa un genérico para evitar casts manuales:

```tsx
interface EstadoPago {
  paymentId: string;
  amount: number;
}

function PaginaConfirmacion() {
  const { state } = useLocation<EstadoPago>();
  // state está tipado como EstadoPago | undefined
  if (state) {
    console.log(state.paymentId, state.amount);
  }
}
```

---

### `useNavigate()`

Devuelve una función para navegación programática.

```tsx
import { useNavigate } from "react-navix";

function Formulario() {
  const navigate = useNavigate();

  const handleSubmit = () => {
    guardarDatos().then(() => navigate("/exito"));
  };

  const volver = () => {
    navigate(-1);                  // retrocede un paso
    navigate(-2);                  // retrocede dos pasos
    navigate(1);                   // avanza un paso
  };

  const subir = () => {
    navigate("..");                // sube un nivel
    navigate("../panel");          // ruta hermana
  };

  return <form onSubmit={handleSubmit}>...</form>;
}
```

```ts
// Firma
navigate(to: string | number, options?: { replace?: boolean; relative?: "route" | "path"; state?: unknown }): void
```

`useNavigate` acepta un genérico opcional para tipar el `state` en las opciones de navegación:

```tsx
const navigate = useNavigate<{ orderId: string }>();
navigate("/confirmar", { state: { orderId: "123" } }); // ✅ chequeo tipado
```

Cuando `to` es un número, actúa como delta de la pila del historial — equivale a los botones atrás/adelante del navegador. `navigate(-1)` retrocede una entrada, `navigate(1)` avanza una entrada. Las opciones como `replace` y `state` se ignoran en navegación numérica (el state de la entrada del historial tiene prioridad).

Cuando `to` es un string, se resuelve contra la jerarquía de rutas actual por defecto (recayendo en el pathname de la URL fuera de `<Routes>`). Pasa `relative: "path"` para resolver contra el pathname completo de la URL:

```tsx
// Dentro de ruta /archivos/* con URL /archivos/imagenes/gato.jpg
navigate("..");                            // → /              (sube un nivel en la jerarquía de rutas)
navigate("..", { relative: "path" });      // → /archivos/imagenes  (sube un segmento de URL)
```

Usa `"/"` para navegar al root, `"."` / `""` para permanecer en la ruta actual, o `-1` / `1` para recorrer el historial:

```tsx
navigate("/");   // navega al root
navigate(".");   // se queda en la ruta actual
navigate("");    // se queda en la ruta actual (igual que ".")
navigate(-1);    // retrocede una entrada del historial
navigate(1);     // avanza una entrada del historial
```

---

### `useParams()`

Devuelve un objeto con los parámetros de ruta analizados desde la URL actual.

```tsx
// Ruta: /usuarios/:userId
import { useParams } from "react-navix";

function PerfilUsuario() {
  const { userId } = useParams<{ userId: string }>();
  return <p>ID de usuario: {userId}</p>;
}
```

```tsx
// Ruta: /org/:orgId/equipo/:teamId
interface TeamParams {
  orgId: string;
  teamId: string;
}

function PaginaEquipo() {
  const { orgId, teamId } = useParams<TeamParams>();
  return <p>Org {orgId} — Equipo {teamId}</p>;
}
```

> **Nota de TypeScript**: `useParams<T>()` acepta un genérico opcional para tipar los parámetros devueltos (por defecto `Record<string, string>`). Usa la forma inline `useParams<{ userId: string }>()` para tipos rápidos, o declara una interfaz para params reutilizables: `useParams<MisParams>()`.

---

### `useSearchParams()`

Devuelve los parámetros de búsqueda actuales como un objeto `URLSearchParams` y una función para actualizarlos. Preserva el hash de la URL.

```tsx
import { useSearchParams } from "react-navix";

function Filtro() {
  const [params, setParams] = useSearchParams();

  const actualizarFiltro = (value: string) => {
    setParams({ filtro: value });
  };

  return <p>Filtro actual: {params.get("filtro")}</p>;
}
```

**Tipo de retorno**

```ts
const [params, setParams]: readonly [
  URLSearchParams,
  (params: Record<string, string> | URLSearchParams, options?: NavigateOptions) => void
] = useSearchParams();
```

`setParams` reemplaza por completo la cadena de búsqueda actual y navega inmediatamente. Acepta un objeto plano, una instancia de `URLSearchParams` y un argumento opcional `options` (`{ replace?: boolean }`). Llama a `setParams({})` para limpiar todos los parámetros, u omite una clave para eliminarla:

```tsx
// URL actual: /buscar?q=react&pagina=2
setParams({ q: "router" });        // → /buscar?q=router  (pagina eliminado)
setParams({});                      // → /buscar            (todos los params limpiados)
setParams(new URLSearchParams("q=router"), { replace: true }); // reemplazar historial
```

---

### `useBlocker()`

Bloquea la navegación cuando se cumple una condición (ej. datos de formulario sin guardar). Devuelve un objeto `Blocker`.

```tsx
import { useBlocker } from "react-navix";

function Editor() {
  const [modificado, setModificado] = useState(false);

  const blocker = useBlocker(modificado);

  if (blocker.isBlocking) {
    return (
      <dialog open>
        <p>Tienes cambios sin guardar.</p>
        <button onClick={blocker.proceed}>Salir</button>
        <button onClick={blocker.reset}>Quedarse</button>
      </dialog>
    );
  }

  return <textarea onChange={() => setModificado(true)} />;
}
```

**Parámetros**

| Parámetro | Tipo | Descripción |
|---|---|---|
| `shouldBlock` | `boolean \| (() => boolean) \| ((ctx: BlockerContext) => boolean)` | Cuando es verdadero, se bloquea la navegación. El callback recibe la ubicación destino, las opciones de navegación y la acción (`"push"`, `"replace"` o `"delta"`). |

> **Aridad del callback**: `react-navix` decide si tu callback recibe un `BlockerContext` inspeccionando cuántos parámetros declara. Un callback con un parámetro — `(ctx) => ...` — recibe el objeto de contexto; un callback sin parámetros — `() => ...` — se invoca sin argumentos. Un callback solo con rest (`(...args) => ...`) se trata como agnóstico al contexto. En caso de duda, declara el parámetro explícitamente.

Devuelve `Blocker`:

```ts
interface Blocker {
  isBlocking: boolean;
  proceed: () => void;
  reset: () => void;
  nextLocation: Location;
}
```

- `proceed()` — confirma la navegación y desbloquea
- `reset()` — cancela la navegación y mantiene al usuario en la página actual
- `nextLocation` — ubicación a la que el usuario intentó navegar (incluye `state` si la navegación bloqueada lo portaba)

---

### `useBeforeUnload()`

Evita la pérdida accidental de datos cuando el usuario cierra o recarga la pestaña. Complementa a `useBlocker` (que cubre la navegación interna del SPA).

```tsx
import { useBeforeUnload } from "react-navix";

function Editor() {
  const [modificado, setModificado] = useState(false);

  useBeforeUnload(modificado);

  return <textarea onChange={() => setModificado(true)} />;
}
```

**Parámetros**

| Parámetro | Tipo | Descripción |
|---|---|---|
| `shouldBlock` | `boolean \| (() => boolean) \| ((ctx: BlockerContext) => boolean)` | Cuando es verdadero, el navegador muestra el diálogo de confirmación al cerrar/recargar |

El callback `shouldBlock` usa la misma detección de contexto por aridad que [`useBlocker`](#useblocker). Cuando el callback recibe un `BlockerContext` aquí, `nextLocation` es una ubicación vacía — no hay un destino real cuando se cierra la pestaña.

No retorna nada. El hook registra un listener `beforeunload` en `window` cuando `shouldBlock` evalúa a `true`, y lo remueve cuando pasa a `false` o el componente se desmonta. El navegador muestra su propio diálogo nativo — los mensajes personalizados son ignorados por todos los navegadores modernos (Chrome 51+, Firefox 44+, Safari 9.1+).

Uso típico junto a `useBlocker`:

```tsx
const [modificado, setModificado] = useState(false);
useBlocker(modificado);          // bloquea navegación interna del SPA
useBeforeUnload(modificado);      // bloquea cierre/recarga de la pestaña (F5)
```

---

### `useRouteError()`

Devuelve el error capturado por el `errorElement` de ruta más cercano. Consulta [Error Boundaries por Ruta](#error-boundaries-por-ruta) para ver la documentación completa y ejemplos.

```tsx
import { useRouteError } from "react-navix";

function MiErrorElement() {
  const error = useRouteError();
  return <p>{(error as Error).message}</p>;
}
```

### `useResetErrorBoundary()`

Devuelve una función que limpia el estado de error y re-renderiza el element original de la ruta. Consulta [Error Boundaries por Ruta](#error-boundaries-por-ruta) para ver la documentación completa y ejemplos.

```tsx
import { useResetErrorBoundary } from "react-navix";

function MiErrorElement() {
  const reset = useResetErrorBoundary();
  return <button onClick={reset}>Reintentar</button>;
}
```

---

### `useMatches()`

Devuelve la cadena completa de rutas coincidentes desde la raíz hasta la hoja más profunda. Cada entrada incluye el `pathname` acumulado, los `params` de la ruta actual, el patrón `path` original y los datos `handle`.

```tsx
import { useMatches } from "react-navix";

function Breadcrumbs() {
  const matches = useMatches();

  return (
    <nav>
      {matches.map((match, i) => (
        <span key={i}>
          {match.handle?.crumb ?? match.pathname} {i < matches.length - 1 && " / "}
        </span>
      ))}
    </nav>
  );
}
```

Retorna `MatchRecord[]`:

```ts
interface MatchRecord {
  pathname: string;
  params: Record<string, string>;
  path?: string;
  handle?: unknown;
}
```

**Estabilidad de referencia**: `useMatches()` retorna la misma referencia de array cuando nada ha cambiado entre renders — seguro para arrays de dependencias de `useEffect` y memoización.

**Ejemplo con `handle` para títulos dinámicos**:

```tsx
<Routes>
  <Route element={<AppLayout />}>
    <Route path="blog" element={<BlogLayout />} handle={{ title: "Blog" }}>
      <Route path=":slug" element={<Post />} handle={{ title: "Post" }} />
    </Route>
  </Route>
</Routes>

function TituloPagina() {
  const matches = useMatches();
  const titulo = matches[matches.length - 1]?.handle?.title ?? "Predeterminado";
  return <title>{titulo}</title>;
}
```

---

### `useOutletContext()`

Retorna el valor pasado mediante `<Outlet context={...} />` desde el layout padre inmediato. Lanza un error si no se proporcionó contexto.

```tsx
import { useOutletContext } from "react-navix";

interface ContextoUsuario {
  usuario: { nombre: string; rol: string };
  permisos: string[];
}

function PaginaHija() {
  const { usuario, permisos } = useOutletContext<ContextoUsuario>();
  return <p>Bienvenido, {usuario.nombre}</p>;
}
```

Usa esto en lugar de crear tu propio contexto de React para el patrón común de un layout pasando datos a su ruta hija coincidente.

---

### `useInRouterContext()`

Devuelve `true` si el componente está dentro de un `<BrowserRouter>`, `<HashRouter>` o `<MemoryRouter>`. Útil para componentes que pueden renderizarse dentro o fuera de un router.

```tsx
import { useInRouterContext } from "react-navix";

function MiComponente() {
  const dentroDeRouter = useInRouterContext();

  if (!dentroDeRouter) {
    return <p>Este componente necesita un router.</p>;
  }

  // ... lógica que depende del router
}
```

---

## Restauración de scroll

### `<ScrollRestoration>`

Desplaza automáticamente al inicio en cada navegación. Colócalo una vez, en cualquier lugar dentro del router.

```tsx
<BrowserRouter>
  <ScrollRestoration />
  <Routes>...</Routes>
</BrowserRouter>
```

Sin props. Sin configuración.

---

## Protección de rutas

Puedes proteger rutas envolviéndolas en un componente que renderice `<Navigate>` cuando el acceso es denegado.

### Proteger rutas individuales

Usa la prop `children` para proteger una ruta individual:

```tsx
import { Navigate } from "react-navix";

function RequireAuth({ children }: { children: ReactNode }) {
  const autenticado = /* tu lógica de autenticación */;

  if (!autenticado) {
    return <Navigate to="/iniciar-sesion" replace />;
  }

  return <>{children}</>;
}
```

```tsx
<Routes>
  <Route path="/iniciar-sesion" element={<Login />} />
  <Route
    path="/panel"
    element={
      <RequireAuth>
        <Panel />
      </RequireAuth>
    }
  />
</Routes>
```

### Proteger varias rutas con un layout

Renderiza `<Outlet />` para proteger un grupo de rutas hijas a la vez:

```tsx
import { Navigate, Outlet } from "react-navix";

function RequireAuth() {
  const autenticado = /* tu lógica de autenticación */;

  if (!autenticado) {
    return <Navigate to="/iniciar-sesion" replace />;
  }

  return <Outlet />;
}
```

```tsx
<Routes>
  <Route path="/iniciar-sesion" element={<Login />} />
  <Route element={<RequireAuth />}>
    <Route path="/panel" element={<Panel />} />
    <Route path="/configuracion" element={<Configuracion />} />
  </Route>
</Routes>
```

---

## Error Boundaries por Ruta

Cada `<Route>` puede declarar un `errorElement` — una UI de fallback que se muestra cuando el element de la ruta (o cualquier ruta hija sin su propio `errorElement`) lanza un error durante el renderizado. Esto mantiene los errores contenidos en la ruta afectada en lugar de crashear toda la aplicación.

```tsx
import { useRouteError, useResetErrorBoundary } from "react-navix";

function PanelError() {
  const error = useRouteError();
  const reset = useResetErrorBoundary();

  return (
    <div className="error-container">
      <h2>Algo salió mal</h2>
      <p>{(error as Error).message}</p>
      <button onClick={reset}>Reintentar</button>
    </div>
  );
}
```

```tsx
<Routes>
  <Route
    path="/panel"
    element={<Panel />}
    errorElement={<PanelError />}
  >
    <Route path="configuracion" element={<Configuracion />} />
    <Route
      path="analiticas"
      element={<Analiticas />}
      errorElement={<AnaliticasError />}
    />
  </Route>
</Routes>
```

### Cómo se propagan los errores

- Si una ruta no tiene `errorElement`, el error sube a la ruta ancestra más cercana que sí lo tenga.
- Si una ruta hija tiene su propio `errorElement`, captura los errores localmente — el padre nunca los ve.
- El `errorElement` tiene acceso completo a los hooks del router (`useLocation`, `useNavigate`, `useParams`, etc.).

### `useRouteError()`

Devuelve el error capturado por el `errorElement` más cercano. Lanza error si se usa fuera de un `errorElement`.

```tsx
const error = useRouteError(); // unknown — usa guard o cast según necesites
```

### `useResetErrorBoundary()`

Devuelve una función que limpia el estado de error y re-renderiza el element original de la ruta. Útil para botones de "Reintentar". Lanza error si se usa fuera de un `errorElement`.

```tsx
const reset = useResetErrorBoundary();
// <button onClick={reset}>Reintentar</button>
```

---

## Utilidades

### `matchPath(pattern, pathname, options?)`

Compara un pathname contra un patrón de ruta. Devuelve un `MatchResult` o `null` si no hay coincidencia.

```ts
import { matchPath } from "react-navix";

const resultado = matchPath("/usuarios/:id", "/usuarios/42");
// { params: { id: "42" }, consumed: "/usuarios/42", pathnameBase: "/usuarios/42" }
```

Los patrones admiten segmentos dinámicos (`:param`), comodines (`*`, válido solo como último segmento) y coincidencia por prefijo — un patrón también coincide con pathnames que continúan más allá de él:

```ts
matchPath("docs/*", "/docs/api/v2");   // { params: { "*": "api/v2" }, consumed: "/docs/api/v2", pathnameBase: "/docs" }
matchPath("usuarios", "usuarios/123"); // { params: {}, consumed: "/usuarios", pathnameBase: "/usuarios" }  (coincidencia por prefijo)
```

`consumed` es la porción del pathname cubierta por el patrón; `pathnameBase` es `consumed` sin la captura del comodín final — útil para resolver rutas relativas dentro de rutas splat.

Por defecto (`exact: false`) el patrón puede consumir solo un prefijo del pathname. Pasa `{ exact: true }` para exigir que consuma el pathname completo:

```ts
matchPath("usuarios/:id", "usuarios/42/configuracion");                  // { params: { id: "42" }, consumed: "/usuarios/42", pathnameBase: "/usuarios/42" }
matchPath("usuarios/:id", "usuarios/42/configuracion", { exact: true }); // null
```

`exact` y `end` son alias (misma convención que `<NavLink>`): pasa cualquiera de los dos, y si se proporcionan ambos, `exact` tiene prioridad. Ambos por defecto son `false`.

```ts
interface MatchResult {
  params: Record<string, string>;
  consumed: string;
  pathnameBase: string;
}

interface MatchPathOptions {
  exact?: boolean;
  end?: boolean;
}
```

### `resolvePath(to, fromPathname)`

Resuelve una ruta relativa (`..`, `../hermano`, `./hijo`, `hijo`) contra un pathname base. Las rutas absolutas (`/absoluta`) se devuelven sin cambios; las cadenas de solo búsqueda (`?q=1`) y solo hash (`#seccion`) se añaden al pathname base.

```ts
import { resolvePath } from "react-navix";

resolvePath("..", "/usuarios/42");              // "/usuarios"
resolvePath("../configuracion", "/usuarios/42"); // "/usuarios/configuracion"
resolvePath("editar", "/usuarios/42");           // "/usuarios/42/editar"
resolvePath("?q=1", "/usuarios");               // "/usuarios?q=1"
resolvePath("/absoluta", "/cualquiera");         // "/absoluta"
```

---

## TypeScript
`react-navix` está escrito en TypeScript e incluye definiciones de tipo listas para usar. Cada componente, hook y utilidad está completamente tipado.

```tsx
import type {
  Location,
  NavigateOptions,
  MatchResult,
  MatchPathOptions,
  MatchRecord,
  Blocker,
  BlockerContext,
  BlockerAction,
  BlockerFunction,
  NavigateFunction,
  BrowserRouterProps,
  HashRouterProps,
  MemoryRouterProps,
  LinkProps,
  NavLinkProps,
  NavigateProps,
  OutletProps,
  RouteProps,
  RoutesProps,
  SearchParamsInput,
  UseSearchParamsReturn,
} from "react-navix";
```

---

## Pruebas

Ejecuta la suite de pruebas:

```bash
pnpm run test
```

La suite corre sobre [Vitest](https://vitest.dev/) + jsdom: **35 archivos de test, 635 pruebas, todas pasando**. Cubre cada router, hook, helper y store.

## Reporte de cobertura

Genera el reporte completo con:

```bash
pnpm run test:coverage
```

| Métrica | Cobertura |
|---|---|
| Statements | 99.26% (809/815) |
| Branches | 94.96% (490/516) |
| Functions | 99.14% (116/117) |
| Lines | 99.86% (746/747) |

Un reporte HTML por archivo se genera en el directorio `coverage/`.

## Contribución

Los pull requests son bienvenidos — correcciones de bugs, documentación, mejores ejemplos y nuevos tests son siempre apreciados. Abre un issue primero para discutir cambios grandes.

## Licencia

MIT

## Contacto

Copyright (C) dapize

- [Issues](https://github.com/dapize/react-navix/issues)
- [Repositorio](https://github.com/dapize/react-navix)
