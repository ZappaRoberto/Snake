"""Service for managing high scores in the Snake Game."""

from pathlib import Path

from pydantic import BaseModel, ValidationError

# Storage file path (relative to project root)
STORAGE_FILE = Path("data/high_scores.json")


class HighScoreItem(BaseModel):
    """A single high score entry."""

    game_id: str
    best_score: int


class HighScoreService:
    """Service for saving and retrieving high scores."""

    def __init__(self, storage_file: Path | None = None):
        """
        Initialize the high score service.

        Args:
            storage_file: Path to the JSON storage file. Defaults to data/high_scores.json.
        """
        self.storage_file = storage_file or STORAGE_FILE
        self._data: dict[str, int] = {}
        self._ensure_storage_exists()

    def _ensure_storage_exists(self) -> None:
        """Ensure the storage directory and file exist."""
        self.storage_file.parent.mkdir(parents=True, exist_ok=True)

        if self.storage_file.exists():
            try:
                raw_data = self.storage_file.read_text()
                parsed: list[dict] = []
                for line in raw_data.strip().split("\n"):
                    if line.strip():
                        parsed.append(HighScoreItem.model_validate_json(line).model_dump())
                # Convert list of dicts to dict for easier access
                if isinstance(parsed, list):
                    self._data = {item["game_id"]: item["best_score"] for item in parsed}
                elif isinstance(parsed, dict):
                    self._data = parsed
            except ValidationError:
                # Corrupted file - start fresh
                self._data = {}
        else:
            self._data = {}

    def _save_to_file(self) -> None:
        """Save current data to storage file."""
        # Write one item per line for simple append operations
        with open(self.storage_file, "w") as f:
            for game_id, score in self._data.items():
                item = HighScoreItem(game_id=game_id, best_score=score)
                f.write(item.model_dump_json() + "\n")

    def save_score(self, game_id: str, score: int) -> int:
        """
        Save a score and return the best score for this game.

        Args:
            game_id: Unique identifier for the game session.
            score: Score to potentially save as new best.

        Returns:
            The new best score for this game ID.
        """
        current_best = self._data.get(game_id, 0)

        if score > current_best:
            self._data[game_id] = score
            self._save_to_file()

        return self._data[game_id]

    def get_best(self, game_id: str) -> int:
        """
        Get the best score for a given game ID.

        Args:
            game_id: Unique identifier for the game session.

        Returns:
            Best score for this game, or 0 if no score exists.
        """
        return self._data.get(game_id, 0)

    def clear_score(self, game_id: str) -> None:
        """
        Remove the stored best score for a game ID.

        Args:
            game_id: Unique identifier for the game session.
        """
        if game_id in self._data:
            del self._data[game_id]
            self._save_to_file()


# Create a global instance for use throughout the application
high_score_service = HighScoreService()
