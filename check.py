import json
import os
import subprocess
from pathlib import Path


def git_output(*args: str) -> str:
    result = subprocess.run(
        ["git", *args],
        check=True,
        capture_output=True,
        text=True,
    )
    return result.stdout


def markdown_cell(value: str) -> str:
    return (
        value.replace("\\", "\\\\")
        .replace("|", "\\|")
        .replace("\r", " ")
        .replace("\n", " ")
        .replace("`", "\\`")
    )


def get_event_range() -> tuple[str | None, str]:
    head = os.environ.get("GITHUB_SHA") or git_output("rev-parse", "HEAD").strip()
    event_path = os.environ.get("GITHUB_EVENT_PATH")
    event_name = os.environ.get("GITHUB_EVENT_NAME")

    if not event_path:
        return None, head

    event = json.loads(Path(event_path).read_text(encoding="utf-8"))
    if event_name == "pull_request":
        pull_request = event["pull_request"]
        return pull_request["base"]["sha"], pull_request["head"]["sha"]
    if event_name == "push":
        return event.get("before"), event.get("after", head)
    return None, head


def main() -> None:
    base, head = get_event_range()
    is_initial_push = not base or not base.strip("0")

    if is_initial_push:
        files = git_output("ls-tree", "-r", "--name-only", head).splitlines()
        changes = [("A", path) for path in files]
        commits = git_output("log", "--format=%h%x09%s", head).splitlines()
    else:
        raw_changes = git_output(
            "diff",
            "--name-status",
            "--find-renames",
            "-z",
            base,
            head,
        ).split("\0")
        changes = []
        index = 0
        while index < len(raw_changes) and raw_changes[index]:
            status = raw_changes[index]
            index += 1
            if status.startswith(("R", "C")):
                old_path, new_path = raw_changes[index : index + 2]
                index += 2
                changes.append((status, f"{old_path} -> {new_path}"))
            else:
                changes.append((status, raw_changes[index]))
                index += 1

        commits = git_output(
            "log",
            "--format=%h%x09%s",
            f"{base}..{head}",
        ).splitlines()

    lines = [
        "## Check results",
        "",
        "The Vite production build runs in the **Build app** step. The workflow is successful only if that build passes.",
        "",
        "## Change record",
        "",
        "### Commits",
        "",
    ]
    if commits:
        for commit in commits:
            revision, _, subject = commit.partition("\t")
            lines.append(f"- `{markdown_cell(revision)}` {markdown_cell(subject)}")
    else:
        lines.append("- No commits in this range.")

    lines.extend(["", "### Changed files", ""])
    if changes:
        lines.extend(
            [
                "| Status | File |",
                "| --- | --- |",
                *(
                    f"| {markdown_cell(status)} | `{markdown_cell(path)}` |"
                    for status, path in changes
                ),
            ]
        )
    else:
        lines.append("No files changed.")

    report = "\n".join(lines) + "\n"
    print(report, end="")

    summary_path = os.environ.get("GITHUB_STEP_SUMMARY")
    if summary_path:
        with Path(summary_path).open("a", encoding="utf-8") as summary:
            summary.write(report)


if __name__ == "__main__":
    main()
