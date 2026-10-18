# OctoFit Tracker architecture

OctoFit Tracker is a three-tier application for a school fitness program. The starter code includes API contracts and intentionally incomplete implementation points so you can use GitHub Copilot agent mode in a test-driven loop.

![Three-tier OctoFit architecture](../.github/images/octofit-architecture.svg)

## Tier boundaries

- **Presentation tier**: React 19, Vite, React Router, Bootstrap, and a shared API client in `octofit-tracker/frontend/src`.
- **Logic tier**: Express and TypeScript routes/services in `octofit-tracker/backend/src` expose `/api/*` behavior on port `8000`.
- **Data tier**: Mongoose models and seed data in `octofit-tracker/backend/src/models` and `src/scripts/seed.ts` persist to MongoDB on port `27017`.

## Ports and environment rules

- MongoDB: `27017`
- Express API: `8000`
- Vite frontend: `5173`
- The browser calls relative `/api` paths. Vite proxies them to `http://localhost:8000`, so the unauthenticated API port stays private in Codespaces. `VITE_API_BASE_URL` can override the base URL.

## API contract

| Capability | Method and path | Expected behavior |
| --- | --- | --- |
| Activity tracking | `GET /api/activities`, `POST /api/activities` | List and create valid activity records. POST accepts `userId`, `teamId`, `type`, and `minutes`; `userId` and `teamId` must be well-formed IDs for an existing user and team; otherwise respond with a deliberate 4xx (never a 500 from a cast error). A created activity stores the submitted `user`, `team`, `type`, and `minutes` plus computed `points` and `occurredAt`. |
| Teams | `GET /api/teams`, `POST /api/teams` | List and create teams with members. Created and listed teams keep the submitted `name` and `mascot`. Reject a team without a name with `400`. |
| Leaderboard | `GET /api/leaderboard` | Return teams ordered by the sum of their activity points, highest first. Each entry has `teamName`, `totalPoints`, and a 1-based `rank`. |
| Workout suggestions | `GET /api/workouts/suggestions/:userEmail` | Recommend workouts from recent activity patterns for the matching seeded user's email address. The first suggestion's `focus` matches that user's goal or recent activity, with a `reason` explaining why. An email with no matching user returns a deliberate 4xx (for example, `404`). |

## Implementation decisions

- Presentation tier decision:
  - Keep the React app route-oriented and fetch-driven so each capability is rendered from the same `/api` contract the backend exposes.
  - Use one shared loading state, empty state, and accessible error alert per section so the UX is consistent and testable without authentication.
- Logic tier decision:
  - Keep business validation in Express routes/services instead of spreading it across the UI.
  - Validate IDs and missing references before database writes, returning deliberate 4xx responses instead of leaking cast errors or 500s.
- Data tier decision:
  - Define strict Mongoose schemas for users, teams, activities, and workouts with required fields, ObjectId references, and default arrays where the contract requires them.
  - Keep the seed script idempotent so repeated runs preserve sentinel data and only add the intended starter fixtures.
- Activity tracking approach:
  - Accept `userId`, `teamId`, `type`, and `minutes` on `POST /api/activities`.
  - Verify both IDs exist before creating an activity and calculate `points` and `occurredAt` server-side to satisfy the API contract.
- Team management approach:
  - Require team `name` and `mascot`, default `members` to an empty array, and keep member IDs attached to the team document so listing and creation both reflect the same shape.
- Leaderboard approach:
  - Aggregate activity points by team, sort descending by total, and assign a 1-based rank to each row.
  - Keep the payload as `{ teamName, totalPoints, rank }` to match the UI contract.
- Workout suggestions approach:
  - Match suggestions to a user’s recent activity pattern or `fitnessGoal`, then return a ranked list whose first suggestion explains why it fits.
  - Return a deliberate 4xx for unknown emails instead of silently generating a generic fallback.

## Test plan

- Data-tier command: `npm run test:data --prefix octofit-tracker/backend`
  - This verifies the Mongoose schemas and seed idempotence.
  - Current failure: the required field validation is missing; `User`, `Team`, `Activity`, and `Workout` models allow empty objects, which causes the validation assertions to fail with `expected undefined to be defined`.
- API command: `npm run test:api --prefix octofit-tracker/backend`
  - This checks route behavior for create/list, validation, leaderboard ranking, and workout matching.
  - Current failure: the API is still returning `501 Not Implemented` for invalid team/activity requests instead of `400`, the leaderboard is empty instead of ordered totals, and the workout suggestion picks the wrong focus for the user’s recent run/endurance pattern.
- Frontend command: `npm test --prefix octofit-tracker/frontend`
  - This verifies loading, empty, success, and accessible error states across the presentation tier.
  - Current failure: the UI is still showing placeholder text like “Implementation pending”, and the expected `role="status"`/`role="alert"` and data rendering behaviors are not yet implemented.
- Backend build command: `npm run build --prefix octofit-tracker/backend`
  - This ensures the logic/data tiers compile cleanly with TypeScript and no backend type errors remain.
- Frontend build command: `npm run build --prefix octofit-tracker/frontend`
  - This ensures the React/Vite app builds successfully once the fetch and UI states match the API contract.
