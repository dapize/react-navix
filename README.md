![React Navix](header.png)

# React-navix

[<img src="https://flagcdn.com/es.svg" width="20" alt="Español"/> Español](README_ES.md)

> A lightweight, zero-dependency React router with nested routes, navigation blocking, scroll restoration, route-level error boundaries, and full TypeScript support.

[![npm version](https://img.shields.io/npm/v/react-navix)](https://www.npmjs.com/package/react-navix)
[![license](https://img.shields.io/npm/l/react-navix)](LICENSE)
[![bundle size](https://img.shields.io/bundlephobia/minzip/react-navix)](https://bundlephobia.com/package/react-navix)

---

## Features

- **BrowserRouter** — clean URLs via the History API
- **HashRouter** — hash-based routing for static hosting
- **MemoryRouter** — in-memory history for testing
- **Nested routes** with `<Routes>`, `<Route>`, and `<Outlet>`
- **Declarative navigation** with `<Link>`, `<NavLink>`, and `<Navigate>`
- **Relative navigation** — `..`, `../sibling`, `./child` — with route-aware resolution
- **Programmatic navigation** via `useNavigate`
- **Navigation state** — pass data between routes via `state` (invisible in the URL)
- **URL parameters** via `useParams`
- **Route match chain** via `useMatches` — breadcrumbs, analytics, dynamic page titles
- **Layout-to-child data** via `useOutletContext` + `<Outlet context={...}>` — no prop drilling needed
- **Query strings** via `useSearchParams`
- **Navigation blocking** via `useBlocker` (unsaved changes, dirty forms)
- **Tab-close protection** via `useBeforeUnload` (prevent accidental data loss on close/refresh)
- **Route-level error boundaries** — per-route `errorElement` with `useRouteError()` and `useResetErrorBoundary()`
- **Scroll restoration** with `<ScrollRestoration>`
- **Path utilities** — `matchPath` and `resolvePath` exported for custom use
- **Tiny bundle** — ~9.61 kB gzipped
- **Written in TypeScript** — full type definitions included

---

## Installation

```bash
npm install react-navix
# or
pnpm add react-navix
# or
yarn add react-navix
```

`react-navix` requires **React 18 or 19** as a peer dependency (you must install it yourself).

---

## Quick Start

```tsx
import { BrowserRouter, Routes, Route, Link } from "react-navix";

function App() {
  return (
    <BrowserRouter>
      <nav>
        <Link to="/">Home</Link>
        <Link to="/about">About</Link>
      </nav>
      <Routes>
        <Route path="/" element={<h1>Home</h1>} />
        <Route path="/about" element={<h1>About</h1>} />
      </Routes>
    </BrowserRouter>
  );
}
```

---

## Routers

### `<BrowserRouter>`

Uses the browser's History API for clean URLs (`/dashboard`, `/settings`).

```tsx
import { BrowserRouter, Routes, Route } from "react-navix";

<BrowserRouter>
  <Routes>...</Routes>
</BrowserRouter>
```

**Props**

| Prop | Type | Default | Description |
|---|---|---|---|
| `children` | `ReactNode` | required | Your app's route tree |
| `basename` | `string` | `""` | Base path for all routes (e.g. `"/app"`) |

When a `basename` is provided, all routes and links resolve relative to it:

```tsx
<BrowserRouter basename="/app">
  {/* <Link to="/dashboard"> navigates to /app/dashboard */}
  {/* A route with path="/dashboard" matches /app/dashboard */}
  <Routes>...</Routes>
</BrowserRouter>
```

---

### `<HashRouter>`

Uses the URL hash (`#/dashboard`, `#/settings`). Ideal for static file servers or environments where you cannot configure server-side redirects.

```tsx
import { HashRouter, Routes, Route } from "react-navix";

<HashRouter>
  <Routes>...</Routes>
</HashRouter>
```

**Props**

| Prop | Type | Default | Description |
|---|---|---|---|
| `children` | `ReactNode` | required | Your app's route tree |
| `basename` | `string` | `""` | Base path for all routes (e.g. `"/app"`) |

When a `basename` is provided, all routes and links resolve relative to it:

```tsx
<HashRouter basename="/admin">
  {/* <Link to="/users"> navigates to #/admin/users */}
  {/* A route with path="/users" matches #/admin/users */}
  <Routes>...</Routes>
</HashRouter>
```

---

### `<MemoryRouter>`

Stores the history stack in memory (no `window` interaction). Essential for **unit testing** environments where there is no real browser URL.

```tsx
import { MemoryRouter, Routes, Route } from "react-navix";

<MemoryRouter initialEntries={["/users/42"]}>
  <Routes>...</Routes>
</MemoryRouter>
```

**Props**

| Prop | Type | Default | Description |
|---|---|---|---|
| `children` | `ReactNode` | required | Your app's route tree |
| `initialEntries` | `string[]` | `["/"]` | Initial history entries (e.g. `["/home", "/about"]`) |
| `initialIndex` | `number` | `0` | Index of the active entry within `initialEntries` |
| `basename` | `string` | `""` | Base path, same semantics as `BrowserRouter` |

---

### Scroll anchors in HashRouter

If your app has long pages with navigable sections, you can use internal anchors within the hash:

```
https://myapp.com/#/article/react#comments
```

`react-navix` automatically separates the route from the anchor:
- `useLocation().pathname` → `"/article/react"`
- `useLocation().hash` → `"#comments"`

To implement the scroll, watch `useLocation().hash`:

```tsx
import { useEffect } from "react";
import { useLocation } from "react-navix";

function useScrollToHash() {
  const { hash } = useLocation();

  useEffect(() => {
    if (!hash) return;

    const id = hash.slice(1);
    // Basic example. Replace with your own scroll logic or library
    // (react-scroll, scrollIntoView with custom options, etc.)
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  }, [hash]);
}
```

> **Note**: in `BrowserRouter` the browser handles scroll natively because anchors go in the actual URL fragment (`/article/react#comments`). In `HashRouter` everything lives inside the hash (`#/article/react#comments`), so scroll must be implemented manually.

---

## Route Definition

### `<Routes>`

A container that evaluates its `<Route>` children against the current URL and renders the first match.

```tsx
<Routes>
  <Route path="/" element={<Home />} />
  <Route path="/users" element={<Users />} />
  <Route path="*" element={<NotFound />} />
</Routes>
```

### `<Route>`

Defines a single route. Can contain nested `<Route>` children to build nested layouts.

**Props**

| Prop | Type | Default | Description |
|---|---|---|---|
| `path` | `string` | `undefined` | URL pattern to match. Supports `:param` segments. Omit for layout routes. |
| `index` | `boolean` | `false` | When `true`, acts as an index route — it renders when the parent path is matched exactly, as the default content in the parent's `<Outlet>`. Only `index` and `element` apply. |
| `element` | `ReactNode` | `undefined` | Content to render when the route matches |
| `errorElement` | `ReactNode` | `undefined` | Fallback UI rendered when the route's element (or any descendant without its own `errorElement`) throws an error during rendering |
| `handle` | `unknown` | `undefined` | Arbitrary data attached to the route. Accessible via `useMatches()` for breadcrumbs, analytics, or dynamic page titles. |
| `children` | `ReactNode` | `undefined` | Nested `<Route>` elements for building nested layouts |

```tsx
<Routes>
  <Route path="/dashboard" element={<Dashboard />}>
    <Route index element={<DashboardHome />} />
    <Route path="stats" element={<DashboardStats />} />
    <Route path=":id" element={<DashboardItem />} />
  </Route>
</Routes>
```

### `<Outlet>`

Renders the matched child route inside a parent layout.

```tsx
function Dashboard() {
  return (
    <div>
      <h1>Dashboard</h1>
      <Outlet /> {/* Child routes render here */}
    </div>
  );
}
```

**Props**

| Prop | Type | Default | Description |
|---|---|---|---|
| `context` | `unknown` | `undefined` | Data passed to the child route. Accessible via `useOutletContext()`. |

Pass data from a layout to its immediate child without prop drilling or creating your own React context:

```tsx
function Dashboard() {
  const user = { name: "Alice", role: "admin" };

  return (
    <div>
      <h1>Dashboard</h1>
      <Outlet context={user} /> {/* user is passed down */}
    </div>
  );
}

function SettingsPage() {
  const user = useOutletContext<{ name: string; role: string }>();
  return <p>Hello, {user.name}!</p>;
}
```

The context is scoped to the **immediate** child route. Nested layouts can override it with their own `<Outlet context={...} />`. Layouts that do not provide context break the chain — deeper descendants will not see the grandparent's context.

### Catch-All Routes (404)

Use the `*` wildcard to match any path not handled by previous routes. Always place it last inside `<Routes>`.

```tsx
<Routes>
  <Route path="/" element={<Home />} />
  <Route path="/about" element={<About />} />
  <Route path="*" element={<NotFound />} />
</Routes>
```

The wildcard matches every remaining URL, so it acts as your 404 page. Only one wildcard route is needed per `<Routes>` block.

---

## Navigation

### `<Link>`

Renders an `<a>` element that triggers client-side navigation.

```tsx
<Link to="/profile">Profile</Link>
<Link to="/profile" replace>Profile (replace history)</Link>
```

**Props**

Extends `AnchorHTMLAttributes<HTMLAnchorElement>`. All standard anchor props are forwarded.

| Prop | Type | Default | Description |
|---|---|---|---|
| `to` | `string` | required | Target path. Supports relative paths (`..`, `../sibling`, `child`). |
| `replace` | `boolean` | `false` | Replace current history entry instead of pushing |
| `relative` | `"route" \| "path"` | `"route"` | How to resolve a relative `to`. `"route"` (default) resolves against the current route hierarchy, falling back to the URL pathname outside `<Routes>`. `"path"` resolves against the full URL pathname. |
| `state` | `unknown` | `undefined` | Data to carry to the destination route. Accessible via `useLocation().state`. |

`<Link>` automatically detects the router context and prepends `#` when inside a `<HashRouter>`, so the same `<Link to="/users">` works under both routers without configuration.

`<Link>` detects modified clicks (`Ctrl`, `Meta`, `Alt`, `Shift`), middle mouse button, and any non-`_self` `target`. In those cases it lets the browser handle the navigation natively — for example, opening the link in a new tab.

**Relative paths** work out of the box. By default `<Link>` resolves `to` against the current route hierarchy (falling back to the URL pathname when there is no surrounding `<Routes>`):

```tsx
// URL: /users/42
<Link to="..">Back</Link>           // navigates to /users
<Link to="../settings">Settings</Link> // navigates to /users/settings
<Link to="edit">Edit</Link>         // navigates to /users/42/edit
```

The default `"route"` mode resolves against the route hierarchy; pass `relative="path"` to resolve against the full URL pathname instead. This distinction matters inside splat (`*`) routes:

```tsx
<Routes>
  <Route path="files/*" element={<FileLayout />}>
    <Route path="edit" element={<EditFile />} />
  </Route>
</Routes>

function FileLayout() {
  // URL: /files/images/cat.jpg
  return (
    <div>
      <Link to="edit">Edit file</Link>                         {/* "route" (default): /files/edit */}
      <Link to="..">Up to parent route</Link>                  {/* "route" (default): / */}
      <Link to=".." relative="path">Up one segment</Link>      {/* "path": /files/images */}
    </div>
  );
}
```

---

### `<NavLink>`

Like `<Link>`, but adds styling when the link matches the current URL.

```tsx
<NavLink
  to="/dashboard"
  activeClassName="font-bold"
  activeStyle={{ color: "blue" }}
>
  Dashboard
</NavLink>
```

**Props**

Extends `LinkProps`.

| Prop | Type | Default | Description |
|---|---|---|---|
| `activeClassName` | `string` | `undefined` | CSS class applied when the link is active |
| `activeStyle` | `CSSProperties` | `undefined` | Inline styles applied when the link is active |
| `exact` | `boolean` | `false` | Require exact path match to be considered active |
| `end` | `boolean` | `false` | Alias for `exact` for React Router v6 compatibility. If both are provided, `exact` takes precedence. |
| `relative` | `"route" \| "path"` | `"route"` | Inherited from `LinkProps`. Controls how a relative `to` is resolved for active detection. |

**Active detection**: by default (`exact={false}`, equivalent to `end={false}`), a `<NavLink>` is active when the current path starts with the `to` value and the next character is a `/` segment boundary. The root path `"/"` is never active as a prefix in non-exact mode.

| `to` | Current path | `exact / end = {false}` | `exact / end = {true}` |
|---|---|---|---|
| `/users` | `/users` | ✅ active | ✅ active |
| `/users` | `/users/42` | ✅ active | ❌ |
| `/` | `/` | ✅ active | ✅ active |
| `/` | `/dashboard` | ❌ | ❌ |

---

### `<Navigate>`

Declarative redirect. As soon as it renders, it navigates to the given path.

```tsx
<Navigate to="/login" />
<Navigate to="/login" replace={false} />
```

**Props**

| Prop | Type | Default | Description |
|---|---|---|---|
| `to` | `string` | required | Destination path. Supports relative paths. |
| `replace` | `boolean` | `true` | Replace current history entry |
| `relative` | `"route" \| "path"` | `"route"` | How to resolve a relative `to`. Same behavior as `Link`. |
| `state` | `unknown` | `undefined` | Data to carry to the destination route. Accessible via `useLocation().state`. |

---

## Hooks

### `useLocation()`

Returns the current location object. Accepts an optional generic to type the `state` field.

```tsx
import { useLocation } from "react-navix";

function Page() {
  const { pathname, search, hash, state } = useLocation();
  return <p>Current path: {pathname}</p>;
}
```

Returns `Location<T>` (defaults to `unknown`):

```ts
interface Location<T = unknown> {
  pathname: string;
  search: string;
  hash: string;
  state?: T;
  key?: string;
}
```

> **Encoding:** `pathname` is returned percent-decoded so that route patterns with Unicode characters (`ñ`, emoji, CJK) match correctly; malformed percent sequences (a literal `%` not followed by two hex digits) are left as-is rather than throwing. `search` and `hash` are kept percent-encoded, matching the `window.location` API and ensuring `URLSearchParams` (used internally by `useSearchParams`) can parse them without ambiguity. For example, navigating to `/niño?q=café#sección` produces `{ pathname: "/niño", search: "?q=caf%C3%A9", hash: "#secci%C3%B3n" }`.

The `state` field contains data passed via `navigate("/path", { state: ... })` or the `state` prop on `<Link>` / `<Navigate>`. It is `undefined` when no state was provided. State survives page refreshes and back/forward navigation.

**Typed state access** — pass a generic to avoid manual casts:

```tsx
interface PaymentState {
  paymentId: string;
  amount: number;
}

function ConfirmationPage() {
  const { state } = useLocation<PaymentState>();
  // state is typed as PaymentState | undefined
  if (state) {
    console.log(state.paymentId, state.amount);
  }
}
```

---

### `useNavigate()`

Returns a function for programmatic navigation.

```tsx
import { useNavigate } from "react-navix";

function Form() {
  const navigate = useNavigate();

  const handleSubmit = () => {
    saveData().then(() => navigate("/success"));
  };

  const goBack = () => {
    navigate(-1);                  // go back one step
    navigate(-2);                  // go back two steps
    navigate(1);                   // go forward one step
  };

  const goUp = () => {
    navigate("..");                // up one level
    navigate("../dashboard");      // sibling route
  };

  return <form onSubmit={handleSubmit}>...</form>;
}
```

```ts
// Signature
navigate(to: string | number, options?: { replace?: boolean; relative?: "route" | "path"; state?: unknown }): void
```

`useNavigate` accepts an optional generic to type the `state` in navigation options:

```tsx
const navigate = useNavigate<{ orderId: string }>();
navigate("/confirm", { state: { orderId: "123" } }); // ✅ typed check
```

When `to` is a number, it acts as a delta for the history stack — equivalent to the browser's back and forward buttons. `navigate(-1)` goes back one entry, `navigate(1)` goes forward one entry. Options like `replace` and `state` are ignored for numeric navigation (state from the history entry takes precedence).

When `to` is a string, it resolves against the current route hierarchy by default (falling back to the URL pathname outside `<Routes>`). Pass `relative: "path"` to resolve against the full URL pathname instead:

```tsx
// Inside /files/* route with URL /files/images/cat.jpg
navigate("..");                            // → /           (up one level in the route hierarchy)
navigate("..", { relative: "path" });      // → /files/images  (up one URL segment)
```

Use `"/"` to navigate to the root, `"."` / `""` to stay on the current path, or `-1` / `1` to traverse history:

```tsx
navigate("/");    // navigates to root
navigate(".");    // stays at current path
navigate("");     // stays at current path (same as ".")
navigate(-1);     // back one history entry
navigate(1);      // forward one history entry
```

---

### `useParams()`

Returns an object of route parameters parsed from the current URL.

```tsx
// Route: /users/:userId
import { useParams } from "react-navix";

function UserProfile() {
  const { userId } = useParams<{ userId: string }>();
  return <p>User ID: {userId}</p>;
}
```

```tsx
// Route: /org/:orgId/team/:teamId
interface TeamParams {
  orgId: string;
  teamId: string;
}

function TeamPage() {
  const { orgId, teamId } = useParams<TeamParams>();
  return <p>Org {orgId} — Team {teamId}</p>;
}
```

> **TypeScript note**: `useParams<T>()` accepts an optional generic to type the returned params (defaults to `Record<string, string>`). Use the inline form `useParams<{ userId: string }>()` for quick types, or declare an interface for reusable params: `useParams<MyParams>()`.

---

### `useSearchParams()`

Returns current search params as a `URLSearchParams` object and a setter function. Preserves the URL hash.

```tsx
import { useSearchParams } from "react-navix";

function Filter() {
  const [params, setParams] = useSearchParams();

  const updateFilter = (value: string) => {
    setParams({ filter: value });
  };

  return <p>Current filter: {params.get("filter")}</p>;
}
```

**Return type**

```ts
const [params, setParams]: readonly [
  URLSearchParams,
  (params: Record<string, string> | URLSearchParams, options?: NavigateOptions) => void
] = useSearchParams();
```

`setParams` fully replaces the current search string and navigates immediately. It accepts a plain object, a `URLSearchParams` instance, and an optional `options` argument (`{ replace?: boolean }`). Call `setParams({})` to clear all params, or omit a key to remove it:

```tsx
// URL is /search?q=react&page=2
setParams({ q: "router" });        // → /search?q=router  (page removed)
setParams({});                      // → /search            (all params cleared)
setParams(new URLSearchParams("q=router"), { replace: true }); // replace history
```

---

### `useBlocker()`

Blocks navigation when a condition is met (e.g. unsaved form data). Returns a `Blocker` object.

```tsx
import { useBlocker } from "react-navix";

function Editor() {
  const [dirty, setDirty] = useState(false);

  const blocker = useBlocker(dirty);

  if (blocker.isBlocking) {
    return (
      <dialog open>
        <p>You have unsaved changes.</p>
        <button onClick={blocker.proceed}>Leave</button>
        <button onClick={blocker.reset}>Stay</button>
      </dialog>
    );
  }

  return <textarea onChange={() => setDirty(true)} />;
}
```

**Parameters**

| Param | Type | Description |
|---|---|---|
| `shouldBlock` | `boolean \| (() => boolean) \| ((ctx: BlockerContext) => boolean)` | When truthy, navigation is blocked. The callback receives the target location, navigation options, and action (`"push"`, `"replace"`, or `"delta"`). |

> **Callback arity**: `react-navix` decides whether your callback receives a `BlockerContext` by inspecting how many parameters it declares. A callback with a parameter — `(ctx) => ...` — receives the context object; a callback with no parameters — `() => ...` — is called with no arguments. A rest-only callback (`(...args) => ...`) is treated as context-agnostic. When in doubt, declare the parameter explicitly.

Returns `Blocker`:

```ts
interface Blocker {
  isBlocking: boolean;
  proceed: () => void;
  reset: () => void;
  nextLocation: Location;
}
```

- `proceed()` — confirms navigation and unblocks
- `reset()` — cancels navigation and keeps the user on the current page
- `nextLocation` — where the user attempted to navigate (includes `state` if the blocked navigation carried it)

---

### `useBeforeUnload()`

Prevents accidental data loss when the user closes or refreshes the tab. Complements `useBlocker` (which covers internal SPA navigation).

```tsx
import { useBeforeUnload } from "react-navix";

function Editor() {
  const [dirty, setDirty] = useState(false);

  useBeforeUnload(dirty);

  return <textarea onChange={() => setDirty(true)} />;
}
```

**Parameters**

| Param | Type | Description |
|---|---|---|
| `shouldBlock` | `boolean \| (() => boolean) \| ((ctx: BlockerContext) => boolean)` | When truthy, the browser will show a confirmation dialog on tab close/refresh |

The `shouldBlock` callback uses the same arity-based context detection as [`useBlocker`](#useblocker). When the callback receives a `BlockerContext` here, `nextLocation` is an empty location — there is no real destination when the tab is being closed.

Returns `void`. The hook registers a `beforeunload` event listener on `window` when `shouldBlock` evaluates to `true`, and removes it when it becomes `false` or the component unmounts. The browser shows its own native dialog — custom messages are ignored by all modern browsers (Chrome 51+, Firefox 44+, Safari 9.1+).

Typical usage alongside `useBlocker`:

```tsx
const [dirty, setDirty] = useState(false);
useBlocker(dirty);          // blocks internal SPA navigation
useBeforeUnload(dirty);      // blocks tab close / refresh (F5)
```

---

### `useRouteError()`

Returns the error caught by the nearest route `errorElement`. See [Route Error Boundaries](#route-error-boundaries) for full documentation and examples.

```tsx
import { useRouteError } from "react-navix";

function MyErrorElement() {
  const error = useRouteError();
  return <p>{(error as Error).message}</p>;
}
```

### `useResetErrorBoundary()`

Returns a function that clears the error state and re-renders the original route element. See [Route Error Boundaries](#route-error-boundaries) for full documentation and examples.

```tsx
import { useResetErrorBoundary } from "react-navix";

function MyErrorElement() {
  const reset = useResetErrorBoundary();
  return <button onClick={reset}>Retry</button>;
}
```

---

### `useMatches()`

Returns the full chain of matched routes from the root down to the deepest matching leaf. Each entry includes the accumulated `pathname`, the current route's `params`, the route's original `path` pattern, and any `handle` data.

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

Returns `MatchRecord[]`:

```ts
interface MatchRecord {
  pathname: string;
  params: Record<string, string>;
  path?: string;
  handle?: unknown;
}
```

**Reference stability**: `useMatches()` returns the same array reference when nothing has changed between renders — safe for `useEffect` dependency arrays and memoization.

**Example with `handle` for dynamic page titles**:

```tsx
<Routes>
  <Route element={<AppLayout />}>
    <Route path="blog" element={<BlogLayout />} handle={{ title: "Blog" }}>
      <Route path=":slug" element={<Post />} handle={{ title: "Post" }} />
    </Route>
  </Route>
</Routes>

function PageTitle() {
  const matches = useMatches();
  const title = matches[matches.length - 1]?.handle?.title ?? "Default";
  return <title>{title}</title>;
}
```

---

### `useOutletContext()`

Returns the value passed via `<Outlet context={...} />` from the immediate parent layout. Throws if no context was provided.

```tsx
import { useOutletContext } from "react-navix";

interface UserContext {
  user: { name: string; role: string };
  permissions: string[];
}

function ChildPage() {
  const { user, permissions } = useOutletContext<UserContext>();
  return <p>Welcome, {user.name}</p>;
}
```

Use this instead of creating your own React context for the common pattern of a layout passing data to its matched child route.

---

### `useInRouterContext()`

Returns `true` if the component is inside a `<BrowserRouter>`, `<HashRouter>`, or `<MemoryRouter>`. Useful for components that may render inside or outside a router.

```tsx
import { useInRouterContext } from "react-navix";

function MyComponent() {
  const insideRouter = useInRouterContext();

  if (!insideRouter) {
    return <p>This component needs a router.</p>;
  }

  // ... router-dependent logic
}
```

---

## Scroll Restoration

### `<ScrollRestoration>`

Automatically scrolls to the top on navigation. Place it once, anywhere inside your router.

```tsx
<BrowserRouter>
  <ScrollRestoration />
  <Routes>...</Routes>
</BrowserRouter>
```

No props. No configuration.

---

## Route Guards

You can protect routes by wrapping them in a component that renders `<Navigate>` when access is denied.

### Wrapping individual routes

Use the `children` prop to guard a single route:

```tsx
import { Navigate } from "react-navix";

function RequireAuth({ children }: { children: ReactNode }) {
  const isAuthenticated = /* your auth logic */;

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
```

```tsx
<Routes>
  <Route path="/login" element={<Login />} />
  <Route
    path="/dashboard"
    element={
      <RequireAuth>
        <Dashboard />
      </RequireAuth>
    }
  />
</Routes>
```

### Protecting multiple routes with a layout

Render `<Outlet />` to guard a group of child routes at once:

```tsx
import { Navigate, Outlet } from "react-navix";

function RequireAuth() {
  const isAuthenticated = /* your auth logic */;

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
```

```tsx
<Routes>
  <Route path="/login" element={<Login />} />
  <Route element={<RequireAuth />}>
    <Route path="/dashboard" element={<Dashboard />} />
    <Route path="/settings" element={<Settings />} />
  </Route>
</Routes>
```

---

## Route Error Boundaries

Every `<Route>` can declare an `errorElement` — a fallback UI shown when the route's element (or any child route without its own `errorElement`) throws during rendering. This keeps errors contained to the affected route instead of crashing the entire app.

```tsx
import { useRouteError, useResetErrorBoundary } from "react-navix";

function DashboardError() {
  const error = useRouteError();
  const reset = useResetErrorBoundary();

  return (
    <div className="error-container">
      <h2>Something went wrong</h2>
      <p>{(error as Error).message}</p>
      <button onClick={reset}>Try again</button>
    </div>
  );
}
```

```tsx
<Routes>
  <Route
    path="/dashboard"
    element={<Dashboard />}
    errorElement={<DashboardError />}
  >
    <Route path="settings" element={<Settings />} />
    <Route
      path="analytics"
      element={<Analytics />}
      errorElement={<AnalyticsError />}
    />
  </Route>
</Routes>
```

### How errors propagate

- If a route has no `errorElement`, the error bubbles up to the nearest ancestor route that does.
- If a child route has its own `errorElement`, it catches errors locally — the parent never sees them.
- The `errorElement` has full access to router hooks (`useLocation`, `useNavigate`, `useParams`, etc.).

### `useRouteError()`

Returns the error caught by the nearest `errorElement`. Throws if called outside an `errorElement`.

```tsx
const error = useRouteError(); // unknown — guard or cast as needed
```

### `useResetErrorBoundary()`

Returns a function that clears the error state and re-renders the original route element. Useful for "Retry" buttons. Throws if called outside an `errorElement`.

```tsx
const reset = useResetErrorBoundary();
// <button onClick={reset}>Retry</button>
```

---

## Utilities

### `matchPath(pattern, pathname, options?)`

Matches a pathname against a route pattern. Returns a `MatchResult` or `null` if no match.

```ts
import { matchPath } from "react-navix";

const result = matchPath("/users/:id", "/users/42");
// { params: { id: "42" }, consumed: "/users/42", pathnameBase: "/users/42" }
```

Patterns support dynamic segments (`:param`), wildcards (`*`, valid only as the last segment), and prefix matching — a pattern also matches pathnames that continue past it:

```ts
matchPath("docs/*", "/docs/api/v2");   // { params: { "*": "api/v2" }, consumed: "/docs/api/v2", pathnameBase: "/docs" }
matchPath("users", "users/123");       // { params: {}, consumed: "/users", pathnameBase: "/users" }  (prefix match)
```

`consumed` is the portion of the pathname covered by the pattern; `pathnameBase` is `consumed` with the trailing wildcard capture removed — useful for resolving relative paths inside splat routes.

By default (`exact: false`) the pattern may consume only a prefix of the pathname. Pass `{ exact: true }` to require it to consume the entire pathname:

```ts
matchPath("users/:id", "users/42/settings");                  // { params: { id: "42" }, consumed: "/users/42", pathnameBase: "/users/42" }
matchPath("users/:id", "users/42/settings", { exact: true }); // null
```

`exact` and `end` are aliases (same convention as `<NavLink>`): pass either one, and if both are provided `exact` takes precedence. Both default to `false`.

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

Resolves a relative path (`..`, `../sibling`, `./child`, `child`) against a base pathname. Absolute paths (`/absolute`) are returned unchanged; search-only strings (`?q=1`) and hash-only strings (`#section`) are appended to the base pathname.

```ts
import { resolvePath } from "react-navix";

resolvePath("..", "/users/42");              // "/users"
resolvePath("../settings", "/users/42");      // "/users/settings"
resolvePath("edit", "/users/42");             // "/users/42/edit"
resolvePath("?q=1", "/users");               // "/users?q=1"
resolvePath("/absolute", "/anything");        // "/absolute"
```

---

## TypeScript
`react-navix` is written in TypeScript and includes type definitions out of the box. Every component, hook, and utility is fully typed.

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

## Test

Run the test suite:

```bash
pnpm run test
```

The suite runs on [Vitest](https://vitest.dev/) + jsdom: **35 test files, 635 tests, all passing**. It covers every router, hook, helper, and store.

## Coverage report

Generate the full report with:

```bash
pnpm run test:coverage
```

| Metric | Coverage |
|---|---|
| Statements | 99.26% (809/815) |
| Branches | 94.96% (490/516) |
| Functions | 99.14% (116/117) |
| Lines | 99.86% (746/747) |

A per-file HTML report is written to the `coverage/` directory.

## Contribution

Pull requests are welcome — bug fixes, documentation, better examples, and new tests are all appreciated. Open an issue first to discuss larger changes.

## License

MIT

## Contact

Copyright (C) dapize

- [Issues](https://github.com/dapize/react-navix/issues)
- [Repository](https://github.com/dapize/react-navix)
