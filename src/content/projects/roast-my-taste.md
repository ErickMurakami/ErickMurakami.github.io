---
title: "RoastMyTaste"
repo: "RoastMyTaste"
description: "An AI music roaster built with Java, Spring Boot and Spring AI, combining Spotify OAuth2, listening preferences and multilingual comedy."
focus: "OAuth2 integration & structured AI"
stack: ["Java 25", "Spring Boot", "Spring Security", "Spring AI", "Groq", "Spotify API"]
order: 5
---

## Overview

RoastMyTaste connects to a Spotify account, retrieves the listener's top tracks and artists, and turns those preferences into a personalised comedy roast. It was built as a portfolio project to explore OAuth2, external APIs and structured generative AI through a small, locally runnable application.

The current repository includes a Thymeleaf interface served by Spring Boot alongside authenticated REST endpoints. Both entry points reuse the same backend use case; there is no separate frontend service. The stack is Java 25, Spring Boot 4.0.6 and Spring AI 2.0.0-M6.

## Problem

An entertaining response still needs dependable integration boundaries. Spotify access requires an authenticated session and an authorised client; an LLM returns variable content that must fit a predictable response contract. The challenge was to connect those systems without putting token handling, Spotify mapping and prompt composition into one controller.

The source data also sets a limit: Spotify's top-track ranking is not a listening history. It provides neither play counts nor exact listening dates. The application must give the critic enough context for specific jokes without treating invented listening statistics as facts.

## Architecture

The code follows Clean Architecture boundaries through application ports, domain records and infrastructure adapters. `AnalyzeMusicTasteService` implements `AnalyzeMusicTasteUseCase`: it retrieves tracks and artists through `SpotifyProvider`, rejects insufficient data, constructs a `UserProfile` and delegates to `AiAnalyzisProvider`.

```text
Web / REST controllers → AnalyzeMusicTasteUseCase
                              ↓
                     AnalyzeMusicTasteService
                       ├─ SpotifyProvider → Spotify API
                       └─ AiAnalyzisProvider
                            ├─ SpringAiAnalyzerProvider → Groq
                            └─ FakeAiAnalyzerProvider (local)
```

Spring Security handles Spotify's OAuth2 Authorization Code flow with the `user-top-read` scope. Controllers obtain the server-held access token through `OAuth2AuthorizedClient`; the browser uses a session rather than receiving Spotify credentials. The Spotify adapter maps HTTP response DTOs into domain records and requests up to 20 long-term top tracks and artists.

## Key technical decisions

**Keep provider details behind ports.** Spotify HTTP calls and AI prompting belong to separate adapters. The application service depends on their interfaces, making orchestration testable with mocks. Domain records have no dependency on Spring AI; the application service itself uses Spring's `@Service` for wiring.

**Return a record, not an unstructured paragraph.** Spring AI's `ChatClient` maps the model response to `RoastAnalysis`: `title`, `musicalDiagnosis`, `roast`, `recommendation`, `chaosScore` and `personalityTags`. Its constructor checks required text for null, enforces a score between 0 and 100 and copies the tag list. This gives web and REST consumers the same contract.

**Swap AI through profiles.** The `local` profile selects `FakeAiAnalyzerProvider` and disables real AI clients. Its fixed responses cover all four languages without a Groq key. Spotify login and data retrieval still need valid Spotify credentials; only AI inference is replaced.

## Implementation details

### Languages and comedic personalities

`RoastLanguage` supports British English (`en-GB`, the web and REST default), American English (`en-US`), Brazilian Portuguese (`pt-BR`) and Spanish (`es`). Language is selected independently of the model. Regional prompt instructions adjust spelling, phrasing and humour, including Brazilian Portuguese guidance against literal translations and invented slang.

The developer configures `roast.intensity` through `ROAST_INTENSITY`: `soft` gives friendly teasing, `mild` adds light sarcasm, `savage` uses sharper criticism and `unhinged` adds theatrical exaggeration. Application configuration defaults to `unhinged`. Intensity changes the system prompt without changing the domain contract; it is not a public API parameter or user control. The chaos score is a generated result, independent of intensity.

### Model configuration and failures

Spring AI uses Groq's OpenAI-compatible endpoint, configured as `https://api.groq.com/openai/v1`, with `openai/gpt-oss-120b` and temperature `0.7`. The adapter wraps generation and conversion failures in `AiAnalysisException`. REST handlers return structured error codes; web handlers provide retry or reconnect messages for insufficient data, expired authentication and provider failures. Generation and logout forms retain CSRF protection, and generated text is escaped when rendered.

## Trade-offs

Prompts instruct the model to preserve supplied music metadata, avoid invented personal facts and respect the limits of Spotify rankings. These instructions guide generation; they do not deterministically validate factual accuracy or guarantee natural humour. Record validation checks parts of the response structure, not whether every joke is grounded in the input.

External APIs remain failure boundaries. The project handles Spotify authentication, rate-limit and request errors, but does not implement a rate-limit retry policy. Milestone Spring AI dependencies also require attention when upgrading.

## Testing and quality

The repository contains tests for application orchestration, rejection of insufficient data, deterministic fake responses in every language, structured AI conversion failures and provider timeouts. Web tests cover OAuth2 access, CSRF, escaped output, language selection, error handling and REST compatibility.

GitHub Actions configures Temurin 25 and runs `./gradlew clean build --no-daemon --console=plain` with tests enabled and without production credentials. These backend tests were inspected, not executed for this portfolio update; their presence is not a test-coverage measurement or evidence of deployment.

## Results and lessons learned

The result is a locally runnable Spring Boot application with shared web/REST orchestration, server-side Spotify authentication and interchangeable AI adapters. It demonstrates backend integration design, maintainable boundaries and control over the shape and tone of AI output. The main lesson is that response structure, factual grounding and language quality are separate concerns: a valid Java record alone cannot establish all three.

## Improvements

Add deterministic checks that generated music references match the supplied data, and evaluate humour and natural phrasing across languages and intensity levels. Extend Spotify adapter failure tests and define rate-limit recovery before adding retries. Keep those improvements distinct from the functionality already implemented.

## Application screenshots

Original captures from the inspected repository show the public landing page, authenticated roast room and generated result. Select an image to view it at full size.

<figure class="project-screenshot">
  <a href="/projects/roast-my-taste/landing.png">
    <img src="/projects/roast-my-taste/landing.png" alt="RoastMyTaste landing page with Spotify sign-in and an explanation of the three-step roast flow" width="1428" height="1770" loading="lazy" decoding="async" />
  </a>
  <figcaption>Public landing page: Spotify sign-in starts the server-managed OAuth2 flow.</figcaption>
</figure>

<figure class="project-screenshot">
  <a href="/projects/roast-my-taste/roast-room.png">
    <img src="/projects/roast-my-taste/roast-room.png" alt="Authenticated roast room with British English selected, a generation button and Spotify top-track and artist cards" width="1920" height="888" loading="lazy" decoding="async" />
  </a>
  <figcaption>Authenticated roast room: choose a language and inspect Spotify's top tracks and artists before generation.</figcaption>
</figure>

<figure class="project-screenshot">
  <a href="/projects/roast-my-taste/roast.png">
    <img src="/projects/roast-my-taste/roast.png" alt="Generated roast showing a musical diagnosis, comedy text, chaos score, personality tags and musical advice alongside Spotify artwork" width="1920" height="936" loading="lazy" decoding="async" />
  </a>
  <figcaption>Generated result: the structured response is rendered as a diagnosis, roast, score, personality tags and unsolicited advice.</figcaption>
</figure>

## Source evidence

Source and screenshots were inspected at revision `917bcfc`. The application can be run locally using the README; no hosted demo is asserted.

- [Project README](https://github.com/ErickMurakami/RoastMyTaste/blob/917bcfc/README.md)
- [Build and dependency versions](https://github.com/ErickMurakami/RoastMyTaste/blob/917bcfc/build.gradle)
- [Application configuration](https://github.com/ErickMurakami/RoastMyTaste/blob/917bcfc/src/main/resources/application.yml)
- [Application use case and orchestration](https://github.com/ErickMurakami/RoastMyTaste/blob/917bcfc/src/main/java/dev/erick/roastmytaste/application/service/AnalyzeMusicTasteService.java)
- [Spotify adapter](https://github.com/ErickMurakami/RoastMyTaste/blob/917bcfc/src/main/java/dev/erick/roastmytaste/infrastructure/spotify/SpotifyProviderAdapter.java)
- [Security configuration](https://github.com/ErickMurakami/RoastMyTaste/blob/917bcfc/src/main/java/dev/erick/roastmytaste/infrastructure/config/SecurityConfig.java)
- [AI adapter, prompts and personalities](https://github.com/ErickMurakami/RoastMyTaste/blob/917bcfc/src/main/java/dev/erick/roastmytaste/infrastructure/ai/SpringAiAnalyzerProvider.java)
- [Local fake AI provider](https://github.com/ErickMurakami/RoastMyTaste/blob/917bcfc/src/main/java/dev/erick/roastmytaste/infrastructure/ai/FakeAiAnalyzerProvider.java)
- [Supported languages](https://github.com/ErickMurakami/RoastMyTaste/blob/917bcfc/src/main/java/dev/erick/roastmytaste/domain/enums/RoastLanguage.java)
- [Structured response record](https://github.com/ErickMurakami/RoastMyTaste/blob/917bcfc/src/main/java/dev/erick/roastmytaste/domain/model/RoastAnalysis.java)
- [Web controller and failure handling](https://github.com/ErickMurakami/RoastMyTaste/blob/917bcfc/src/main/java/dev/erick/roastmytaste/interfaces/web/RoastController.java)
- [Backend tests](https://github.com/ErickMurakami/RoastMyTaste/tree/917bcfc/src/test/java/dev/erick/roastmytaste)
- [Build/test CI](https://github.com/ErickMurakami/RoastMyTaste/blob/917bcfc/.github/workflows/ci.yml)
- [Original screenshots](https://github.com/ErickMurakami/RoastMyTaste/tree/917bcfc/docs/screenshots)
