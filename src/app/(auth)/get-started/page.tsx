// Welcome: where the middleware sends a visitor with no session.
// The auth layout draws this route's screen (AuthScreenTransition in
// src/modules/auth) so the outgoing screen can animate out first; the route
// itself only has to exist.
export default function Page() {
  return null;
}
