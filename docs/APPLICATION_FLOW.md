# Application Execution Flow

Complete visual guide to CineHub Pro's application execution flow with detailed Mermaid diagrams.

## Table of Contents

- [Complete Request-Response Flow](#complete-request-response-flow)
- [User Authentication Flow](#user-authentication-flow)
- [Movie Discovery Flow](#movie-discovery-flow)
- [Watchlist Management Flow](#watchlist-management-flow)
- [Review Posting Flow](#review-posting-flow)
- [Caching Strategy Flow](#caching-strategy-flow)
- [Real-time Update Flow](#real-time-update-flow)
- [Image Processing Flow](#image-processing-flow)

---

## Complete Request-Response Flow

### End-to-End Data Flow

```mermaid
sequenceDiagram
    participant User
    participant Browser
    participant React
    participant TanStackQuery
    participant ExpressAPI
    participant Storage
    participant PostgreSQL
    participant TMDB
    participant Cloudinary
    
    User->>Browser: Opens CineHub
    Browser->>React: Load Application
    React->>TanStackQuery: Initialize Queries
    
    User->>React: Browse Movies
    React->>TanStackQuery: useQuery('/api/movies/trending')
    
    alt Cache Hit (Browser)
        TanStackQuery-->>React: Return Cached Data
        React-->>Browser: Render Movies
    else Cache Miss
        TanStackQuery->>ExpressAPI: GET /api/movies/trending
        
        ExpressAPI->>Storage: getTrendingMovies()
        Storage->>PostgreSQL: SELECT FROM tmdbCache
        
        alt Cache Hit (Database)
            PostgreSQL-->>Storage: Return Cached Data
            Storage-->>ExpressAPI: Movie List
        else Cache Miss
            Storage->>TMDB: GET trending/movie/week
            TMDB-->>Storage: TMDB Response
            Storage->>PostgreSQL: INSERT INTO tmdbCache
            Storage-->>ExpressAPI: Movie List
        end
        
        ExpressAPI->>ExpressAPI: Queue Image Caching
        ExpressAPI-->>TanStackQuery: JSON Response
        TanStackQuery->>TanStackQuery: Cache Response
        TanStackQuery-->>React: Movie Data
        React-->>Browser: Render Movies
        
        ExpressAPI->>Cloudinary: Upload Images (Background)
        Cloudinary-->>ExpressAPI: Optimized URLs
        ExpressAPI->>PostgreSQL: UPDATE imageCaches
        ExpressAPI->>Browser: WebSocket Update
        Browser->>React: Update Images
    end
    
    Browser-->>User: Display Movies
```

---

## User Authentication Flow

### Sign Up Process

```mermaid
flowchart TD
    A[User Opens App] --> B{Authenticated?}
    B -->|No| C[Show Auth Modal]
    B -->|Yes| D[Show Home Page]
    
    C --> E[User Clicks Sign Up]
    E --> F[Enter Email, Username, Password]
    F --> G[Submit Form]
    
    G --> H{Validate Input}
    H -->|Invalid| I[Show Validation Errors]
    I --> F
    
    H -->|Valid| J[POST /api/auth/signup]
    J --> K[Backend: Hash Password]
    K --> L[Store in Database]
    
    L --> M{Email Verification Required?}
    M -->|Yes| N[Send OTP via Email]
    M -->|No| O[Auto Sign In]
    
    N --> P[User Enters OTP]
    P --> Q[POST /api/auth/verify-otp]
    Q --> R{OTP Valid?}
    R -->|No| S[Show Error]
    S --> P
    R -->|Yes| O
    
    O --> T[Generate JWT Token]
    T --> U[Create Session]
    U --> V[Return User Data]
    V --> D
    
    style A fill:#e3f2fd
    style D fill:#c8e6c9
    style J fill:#fff3e0
    style T fill:#f3e5f5
```

### Login Process

```mermaid
flowchart TD
    A[User Clicks Login] --> B[Enter Email & Password]
    B --> C[Submit Form]
    
    C --> D{Validate Input}
    D -->|Invalid| E[Show Errors]
    E --> B
    
    D -->|Valid| F[POST /api/auth/signin]
    F --> G[Find User by Email]
    
    G --> H{User Found?}
    H -->|No| I[Return Error: User not found]
    I --> E
    
    H -->|Yes| J[Compare Password Hash]
    J --> K{Password Match?}
    K -->|No| L[Return Error: Invalid password]
    L --> E
    
    K -->|Yes| M{Email Verified?}
    M -->|No| N[Require OTP Verification]
    M -->|Yes| O[Generate JWT Tokens]
    
    N --> P[Send OTP]
    P --> Q[Verify OTP]
    Q --> O
    
    O --> R[Create Session]
    R --> S[Set HTTP-Only Cookies]
    S --> T[Return User Data]
    T --> U[Redirect to Home]
    
    style A fill:#e3f2fd
    style F fill:#fff3e0
    style O fill:#f3e5f5
    style U fill:#c8e6c9
```

### Social Login Flow (OAuth)

```mermaid
sequenceDiagram
    participant User
    participant Frontend
    participant Backend
    participant OAuth as OAuth Provider
    participant Database
    
    User->>Frontend: Click "Login with Google"
    Frontend->>Backend: GET /api/auth/google
    Backend->>OAuth: Redirect to Google Login
    OAuth->>User: Show Google Login Page
    User->>OAuth: Enter Credentials & Approve
    OAuth->>Backend: Callback with Auth Code
    Backend->>OAuth: Exchange Code for Token
    OAuth-->>Backend: Access Token & Profile
    Backend->>Database: Find or Create User
    Database-->>Backend: User Data
    Backend->>Backend: Generate JWT
    Backend->>Backend: Create Session
    Backend->>Frontend: Redirect with Auth Token
    Frontend->>Frontend: Store Token
    Frontend-->>User: Redirect to Home Page
```

---

## Movie Discovery Flow

### Browse and Filter Movies

```mermaid
flowchart TD
    A[User Opens Movies Page] --> B[Load Trending Movies]
    B --> C[GET /api/movies/trending]
    
    C --> D{Check TanStack Query Cache}
    D -->|Hit| E[Return Cached Data]
    D -->|Miss| F[API Request]
    
    F --> G{Check Database Cache}
    G -->|Hit & Not Expired| H[Return from DB]
    G -->|Miss or Expired| I[Fetch from TMDB API]
    
    I --> J[Store in Database]
    J --> K[Queue Image Processing]
    K --> H
    
    H --> L[Return to Frontend]
    E --> L
    L --> M[Render Movie Grid]
    
    M --> N[User Scrolls Down]
    N --> O{More Data?}
    O -->|Yes| P[Load Next Page]
    P --> C
    O -->|No| Q[Show End Message]
    
    M --> R[User Applies Filters]
    R --> S{Filter Type}
    
    S -->|Genre| T[Filter by Genre]
    S -->|Rating| U[Filter by Rating]
    S -->|Year| V[Filter by Year]
    S -->|Cast| W[Filter by Cast]
    
    T --> X[GET /api/movies/discover?genre=...]
    U --> X
    V --> X
    W --> X
    
    X --> Y[Build TMDB Query]
    Y --> Z[Fetch Filtered Results]
    Z --> AA[Return to Frontend]
    AA --> M
    
    style A fill:#e3f2fd
    style M fill:#c8e6c9
    style I fill:#fff3e0
```

### Movie Details Page

```mermaid
sequenceDiagram
    participant User
    participant React
    participant API
    participant TMDB
    participant DB
    participant Background
    
    User->>React: Click Movie Card
    React->>React: Navigate to /movie/:id
    
    par Fetch Movie Details
        React->>API: GET /api/movies/:id
        API->>DB: Check Cache
        alt Cache Hit
            DB-->>API: Cached Details
        else Cache Miss
            API->>TMDB: GET movie/:id
            TMDB-->>API: Movie Details
            API->>DB: Store Cache
        end
        API-->>React: Movie Details
    and Fetch Credits
        React->>API: GET /api/movies/:id/credits
        API->>DB: Check Cache
        alt Cache Hit
            DB-->>API: Cached Credits
        else Cache Miss
            API->>TMDB: GET movie/:id/credits
            TMDB-->>API: Cast & Crew
            API->>DB: Store Cache
        end
        API-->>React: Credits
    and Fetch Reviews
        React->>API: GET /api/reviews/movie/:id
        API->>DB: SELECT reviews WHERE mediaId = :id
        DB-->>API: User Reviews
        API-->>React: Reviews
    and Fetch Similar Movies
        React->>API: GET /api/movies/:id/similar
        API->>TMDB: GET movie/:id/similar
        TMDB-->>API: Similar Movies
        API-->>React: Similar Movies
    end
    
    React->>React: Render Complete Page
    React-->>User: Display Movie Details
    
    Note over API,Background: Queue image optimization
    API->>Background: Add to Cache Queue
    Background->>TMDB: Download Images
    TMDB-->>Background: Original Images
    Background->>Background: Process Images
    Background->>Background: Upload to Cloudinary
    Background->>DB: Update Image Cache
    Background->>React: WebSocket: Images Ready
    React->>React: Update to Optimized Images
```

---

## Watchlist Management Flow

### Add to Watchlist

```mermaid
flowchart TD
    A[User Views Movie] --> B[Click Add to Watchlist]
    B --> C{User Logged In?}
    C -->|No| D[Show Login Modal]
    D --> E[User Logs In]
    E --> F[Return to Movie]
    F --> B
    
    C -->|Yes| G{Has Watchlists?}
    G -->|No| H[Create Default Watchlist]
    H --> I[POST /api/watchlists]
    I --> J[Store in Database]
    J --> K[Show Watchlist Selection]
    
    G -->|Yes| K
    K --> L[User Selects Watchlist]
    L --> M[POST /api/watchlists/:id/items]
    
    M --> N{Check if Already Added}
    N -->|Yes| O[Show Already Added Message]
    N -->|No| P[Insert into watchlistItems]
    
    P --> Q[Create Activity Record]
    Q --> R[Return Success]
    R --> S[Show Success Toast]
    S --> T[Update UI State]
    
    T --> U[Invalidate TanStack Cache]
    U --> V[Refresh Watchlist Count]
    
    style A fill:#e3f2fd
    style S fill:#c8e6c9
    style M fill:#fff3e0
```

### View Watchlist

```mermaid
sequenceDiagram
    participant User
    participant React
    participant API
    participant DB
    participant TMDB
    
    User->>React: Navigate to Watchlists
    React->>API: GET /api/watchlists
    API->>DB: SELECT watchlists WHERE userId = :id
    DB-->>API: User's Watchlists
    API-->>React: Watchlist Data
    React->>React: Render Watchlist Cards
    
    User->>React: Click Watchlist
    React->>API: GET /api/watchlists/:id/items
    API->>DB: SELECT watchlistItems WHERE watchlistId = :id
    DB-->>API: Watchlist Items (mediaType, mediaId)
    
    loop For Each Item
        API->>DB: Check Movie Cache
        alt Cache Hit
            DB-->>API: Movie Details
        else Cache Miss
            API->>TMDB: GET movie/:id
            TMDB-->>API: Movie Details
            API->>DB: Store Cache
        end
    end
    
    API->>API: Enrich Items with Details
    API-->>React: Complete Watchlist
    React-->>User: Display Movies in Watchlist
    
    User->>React: Remove Item
    React->>API: DELETE /api/watchlists/:id/items/:itemId
    API->>DB: DELETE FROM watchlistItems
    DB-->>API: Success
    API-->>React: Item Removed
    React->>React: Update UI
    React->>React: Invalidate Cache
```

---

## Review Posting Flow

### Write and Submit Review

```mermaid
flowchart TD
    A[User Views Movie] --> B[Click Write Review]
    B --> C{User Logged In?}
    C -->|No| D[Show Login Prompt]
    D --> E[User Logs In]
    E --> F[Return to Movie]
    F --> B
    
    C -->|Yes| G[Open Review Modal]
    G --> H[User Enters Rating 1-10]
    H --> I[User Writes Review Text]
    I --> J[Click Submit]
    
    J --> K{Validate Input}
    K -->|Invalid| L[Show Validation Errors]
    L --> I
    
    K -->|Valid| M[POST /api/reviews]
    M --> N{Check Existing Review}
    N -->|Exists| O[Update Existing Review]
    N -->|New| P[Create New Review]
    
    O --> Q[UPDATE reviews SET...]
    P --> R[INSERT INTO reviews]
    
    Q --> S[Create Activity Record]
    R --> S
    
    S --> T[Return Success]
    T --> U[Close Modal]
    U --> V[Show Success Toast]
    V --> W[Update UI with New Review]
    
    W --> X[Invalidate Query Cache]
    X --> Y[Refetch Reviews]
    Y --> Z[Update Review Count]
    
    style A fill:#e3f2fd
    style V fill:#c8e6c9
    style M fill:#fff3e0
```

---

## Caching Strategy Flow

### Three-Layer Caching

```mermaid
flowchart TD
    A[API Request] --> B{Layer 1: Browser Cache TanStack Query}
    
    B -->|Hit & Fresh| C[Return Cached Data]
    C --> D[Render UI]
    
    B -->|Miss or Stale| E{Layer 2: Database Cache PostgreSQL}
    
    E -->|Hit & Not Expired| F[Return from DB]
    F --> G[Update Browser Cache]
    G --> D
    
    E -->|Miss or Expired| H{Layer 3: TMDB API}
    
    H --> I[Fetch from TMDB]
    I --> J[Store in Database]
    J --> K[Queue Image Processing]
    
    K --> L[Background Job]
    L --> M[Download Images]
    M --> N[Upload to Cloudinary]
    N --> O[Update Image Cache]
    
    O --> P[Send WebSocket Update]
    P --> Q[Frontend Receives]
    Q --> R[Update UI with Optimized Images]
    
    J --> F
    
    style B fill:#e3f2fd
    style E fill:#fff3e0
    style H fill:#ffebee
    style N fill:#f3e5f5
    
    subgraph "Cache Expiry Times"
        S[Movie Details: 24 hours]
        T[Trending Lists: 1 hour]
        U[Search Results: 30 minutes]
    end
```

### Cache Invalidation

```mermaid
flowchart LR
    A[User Action] --> B{Action Type}
    
    B -->|Add Favorite| C[Invalidate /api/favorites]
    B -->|Create Review| D[Invalidate /api/reviews/:mediaId]
    B -->|Update Profile| E[Invalidate /api/auth/me]
    B -->|Create Watchlist| F[Invalidate /api/watchlists]
    B -->|Admin Action| G[Invalidate Admin Queries]
    
    C --> H[TanStack Query]
    D --> H
    E --> H
    F --> H
    G --> H
    
    H --> I[Mark Cache as Stale]
    I --> J[Trigger Background Refetch]
    J --> K[Update UI Automatically]
    
    style A fill:#e3f2fd
    style H fill:#fff3e0
    style K fill:#c8e6c9
```

---

## Real-time Update Flow

### WebSocket Communication

```mermaid
sequenceDiagram
    participant Client
    participant React
    participant WebSocket
    participant Server
    participant CacheQueue
    participant Cloudinary
    
    Client->>React: Load Application
    React->>WebSocket: Connect to ws://localhost:5000
    WebSocket->>Server: WebSocket Handshake
    Server-->>WebSocket: Connection Established
    WebSocket-->>React: Connected
    
    Note over React: User browses movies
    
    React->>Server: GET /api/movies/trending
    Server->>CacheQueue: Queue Image Caching Jobs
    CacheQueue-->>Server: Jobs Queued
    Server-->>React: Return Movie Data (TMDB URLs)
    
    Note over CacheQueue: Background processing starts
    
    loop For Each Image
        CacheQueue->>CacheQueue: Dequeue Job
        CacheQueue->>Cloudinary: Download from TMDB
        Cloudinary->>Cloudinary: Optimize Image
        Cloudinary-->>CacheQueue: Return Optimized URL
        CacheQueue->>Server: Update Database
        Server->>WebSocket: Emit 'cache:complete' Event
        WebSocket->>React: Receive Update
        React->>React: Replace TMDB URL with Cloudinary URL
        React-->>Client: Display Optimized Image
    end
    
    Note over Server: Admin triggers cache refresh
    
    Server->>WebSocket: Emit 'cache:refresh' Event
    WebSocket->>React: Receive Refresh Event
    React->>React: Invalidate Queries
    React->>Server: Refetch Data
    Server-->>React: Fresh Data
    React-->>Client: Update UI
```

---

## Image Processing Flow

### Background Image Optimization

```mermaid
flowchart TD
    A[TMDB API Returns Movie] --> B[Extract Image URLs]
    B --> C[Create Cache Jobs]
    C --> D[Priority Queue]
    
    D --> E{Job Priority}
    E -->|High: Poster| F[Process Immediately]
    E -->|Medium: Backdrop| G[Process Next]
    E -->|Low: Other| H[Process Later]
    
    F --> I[Download from TMDB]
    G --> I
    H --> I
    
    I --> J{Image Size}
    J -->|> 500KB| K[Compress & Resize]
    J -->|< 500KB| L[Optimize Only]
    
    K --> M[Upload to Cloudinary]
    L --> M
    
    M --> N[Store Cloudinary URL]
    N --> O[Update imageCaches Table]
    O --> P[Mark Job Complete]
    
    P --> Q[Send WebSocket Event]
    Q --> R[Frontend Receives Update]
    R --> S[Replace Image URL]
    S --> T[Browser Caches Optimized Image]
    
    P --> U{More Jobs?}
    U -->|Yes| D
    U -->|No| V[Queue Empty]
    
    style A fill:#e3f2fd
    style M fill:#f3e5f5
    style Q fill:#fff3e0
    style T fill:#c8e6c9
    
    subgraph "Cloudinary Transformations"
        W[Auto Quality]
        X[Auto Format WebP/AVIF]
        Y[Responsive Breakpoints]
        Z[Lazy Loading]
    end
```

---

## Complete User Journey

### From Landing to Watching

```mermaid
flowchart TD
    Start[User Opens CineHub] --> A{First Visit?}
    
    A -->|Yes| B[Show Landing Page]
    A -->|No| C{Logged In?}
    
    B --> D[Browse Public Content]
    D --> E[Click Sign Up]
    E --> F[Create Account]
    F --> G[Verify Email]
    G --> H[Login Success]
    
    C -->|No| I[Show Login]
    I --> H
    C -->|Yes| J[Load Personalized Home]
    
    H --> J
    
    J --> K[Display Recommendations]
    K --> L[User Browses Movies]
    L --> M[Apply Filters]
    M --> N[View Search Results]
    
    N --> O[Click Movie]
    O --> P[Load Movie Details]
    P --> Q[Read Reviews]
    Q --> R[Watch Trailer]
    
    R --> S{Interested?}
    S -->|Yes| T[Add to Watchlist]
    S -->|No| L
    
    T --> U[Add to Favorites]
    U --> V[Write Review]
    V --> W[Rate Movie]
    
    W --> X[Update Activity Feed]
    X --> Y[Get Personalized Recommendations]
    Y --> Z[Discover Similar Movies]
    
    Z --> AA{Continue Browsing?}
    AA -->|Yes| L
    AA -->|No| AB[View Profile Stats]
    
    AB --> AC[Check Watchlists]
    AC --> AD[Plan Movie Night]
    AD --> End[Exit App]
    
    style Start fill:#e3f2fd
    style H fill:#c8e6c9
    style T fill:#fff3e0
    style End fill:#ffcdd2
```

---

## Error Handling Flow

### Error Recovery Process

```mermaid
flowchart TD
    A[User Action] --> B[API Request]
    B --> C{Request Success?}
    
    C -->|Yes| D[Process Response]
    D --> E[Update UI]
    E --> F[Show Success Feedback]
    
    C -->|No| G{Error Type}
    
    G -->|Network Error| H[Show Offline Message]
    H --> I[Cache Request]
    I --> J[Retry When Online]
    
    G -->|401 Unauthorized| K[Clear Auth Token]
    K --> L[Redirect to Login]
    L --> M[Show Login Modal]
    
    G -->|403 Forbidden| N[Show Permission Error]
    N --> O[Suggest Contact Support]
    
    G -->|404 Not Found| P[Show Not Found Page]
    P --> Q[Suggest Homepage]
    
    G -->|429 Rate Limit| R[Show Rate Limit Message]
    R --> S[Implement Backoff]
    S --> T[Retry After Delay]
    
    G -->|500 Server Error| U[Log Error to Sentry]
    U --> V[Show Generic Error]
    V --> W[Offer Retry Button]
    
    W --> X{User Retries?}
    X -->|Yes| B
    X -->|No| Y[Return to Previous Page]
    
    J --> B
    T --> B
    
    style A fill:#e3f2fd
    style F fill:#c8e6c9
    style G fill:#fff3e0
    style U fill:#ffebee
```

---

## Application Startup Flow

### Initial Load Sequence

```mermaid
sequenceDiagram
    participant Browser
    participant HTML
    participant React
    participant Providers
    participant API
    participant Auth
    
    Browser->>HTML: Request index.html
    HTML-->>Browser: HTML Document
    Browser->>Browser: Parse HTML
    Browser->>Browser: Load JavaScript Bundle
    
    Browser->>React: Initialize React App
    React->>Providers: Setup Context Providers
    
    par Initialize Auth
        Providers->>Auth: Check Local Storage
        Auth->>Auth: Check for Saved Token
        alt Token Exists
            Auth->>API: GET /api/auth/me
            API-->>Auth: User Data
            Auth->>Auth: Set User State
        else No Token
            Auth->>Auth: Set Anonymous State
        end
    and Initialize Theme
        Providers->>Providers: Load Theme Preference
        Providers->>Providers: Apply Dark/Light Mode
    and Initialize TanStack Query
        Providers->>Providers: Setup Query Client
        Providers->>Providers: Configure Cache Settings
    end
    
    Providers->>React: Providers Ready
    React->>React: Render App Router
    React->>React: Determine Initial Route
    
    alt User Authenticated
        React->>API: Prefetch User Data
        API-->>React: Favorites, Watchlists, etc.
        React->>React: Render Home Page
    else User Anonymous
        React->>React: Render Landing Page
        React->>API: Fetch Public Content
        API-->>React: Trending Movies
    end
    
    React-->>Browser: Render Complete UI
    Browser->>Browser: Initialize WebSocket
    Browser-->>Browser: App Ready
```

---

## Summary

These diagrams show:

1. ✅ **Complete Request-Response Flow** - End-to-end data flow
2. ✅ **Authentication Flows** - Sign up, login, and OAuth
3. ✅ **Movie Discovery** - Browse, filter, and details
4. ✅ **Watchlist Management** - Add and view watchlists
5. ✅ **Review System** - Write and submit reviews
6. ✅ **Caching Strategy** - Three-layer caching
7. ✅ **Real-time Updates** - WebSocket communication
8. ✅ **Image Processing** - Background optimization
9. ✅ **User Journey** - Complete user experience
10. ✅ **Error Handling** - Recovery processes
11. ✅ **Application Startup** - Initial load sequence

All flows are designed to be clear, comprehensive, and developer-friendly.

---

**Last Updated:** October 29, 2025
