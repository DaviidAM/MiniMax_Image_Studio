# MiniMax Image Studio

Web app that wraps the existing MiniMax image generation script.

## Inputs (left panel)
- Text prompt (textarea)
- Reference images (N file uploads, drag-drop OK)
- Optional: model selector (`image-01` / `image-01-live`), aspect ratio, seed, n

## Process (back)
- Read `MINIMAX_API_KEY` from env var
- Call MiniMax API at `https://api.minimax.io/v1/image_generation`
- Same payload as `/root/.hermes/scripts/minimax_image_gen.py`
- Same error handling: `image_urls` when reference provided, `image_base64` otherwise

## Output (right panel)
- Render generated image(s) inline
- Show prompt + reference images used

## Reference script
- `/root/.hermes/scripts/minimax_image_gen.py` (read-only, replicate logic, do not modify)

## Env
- `MINIMAX_API_KEY` (required)

## Constraints
- Do not modify `/root/.hermes/scripts/minimax_image_gen.py`
- Follow Daviid's Ways of Working: branch from main, conventional commits, PR via `gh`

## Status
- 2026-08-13: repo + SPEC.md created by Alfred. Team (War Room) starts implementation.