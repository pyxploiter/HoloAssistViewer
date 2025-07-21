#!/usr/bin/env python3
"""Split HoloAssist annotation objects into one JSON file per video.

Usage (from project root):
    python split_labels.py --input data-annotation-trainval-v1_1.json --outdir labels

A new directory called ``labels`` is created (unless it already exists). For each
unique ``video_name`` field in the annotation objects, a file called
``<video_name>.json`` is written inside ``labels`` containing **all** objects for
that video (pretty-printed, UTF-8).

This is entirely local I/O; no external dependencies beyond the standard
library.
"""

import argparse
import json
from collections import defaultdict
from pathlib import Path
from typing import List, Dict, Any


def load_annotations(path: Path) -> List[Dict[str, Any]]:
    """Load the top-level list of annotation objects from *path*."""
    with path.open("r", encoding="utf-8") as f:
        return json.load(f)


def bucket_by_video(objs: List[Dict[str, Any]]) -> Dict[str, Dict[str, Any]]:
    """Group annotation objects by their ``video_name`` value."""
    buckets = defaultdict()
    for obj in objs:
        vid = obj.get("video_name")
        if not vid:
            # Skip or collect under a special key; here we warn and skip.
            print("[WARN] Object missing 'video_name'; skipping: " + str(obj)[:120])
            continue
        buckets[vid] = obj 
    return buckets


def write_buckets(buckets: Dict[str, List[Dict[str, Any]]], outdir: Path) -> None:
    """Write each bucket to ``<video_name>.json`` inside *outdir*."""
    outdir.mkdir(parents=True, exist_ok=True)
    for vid, objs in buckets.items():
        out_path = outdir / f"{vid}.json"
        with out_path.open("w", encoding="utf-8") as f:
            json.dump(objs, f, ensure_ascii=False, indent=2)
        print(f"[OK] Wrote → {out_path}")


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Split a HoloAssist 'data-annotation-trainval-v1_1.json' file into one file per video."
    )
    parser.add_argument(
        "--input",
        default="data-annotation-trainval-v1_1.json",
        type=Path,
        help="Path to the large annotation JSON file (default: %(default)s)",
    )
    parser.add_argument(
        "--outdir",
        default="labels",
        type=Path,
        help="Directory where per-video JSON files will be written (default: %(default)s)",
    )

    args = parser.parse_args()

    annotations = load_annotations(args.input)
    buckets = bucket_by_video(annotations)
    write_buckets(buckets, args.outdir)

    print("Done!")


if __name__ == "__main__":
    main()
